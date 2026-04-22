package service

import (
	"context"
	"image"
	"image/color/palette"
	"image/gif"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"os"
	"path/filepath"
	"testing"

	"backend/internal/service"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func writeAnimatedGIF(t *testing.T, path string) {
	t.Helper()

	f, err := os.Create(path)
	if err != nil {
		t.Fatalf("os.Create: %v", err)
	}
	defer f.Close()

	frameA := image.NewPaletted(image.Rect(0, 0, 2, 2), palette.Plan9)
	frameB := image.NewPaletted(image.Rect(0, 0, 2, 2), palette.Plan9)
	for i := range frameA.Pix {
		frameA.Pix[i] = uint8(i % len(palette.Plan9))
		frameB.Pix[i] = uint8((i + 1) % len(palette.Plan9))
	}

	if err := gif.EncodeAll(f, &gif.GIF{
		Image: []*image.Paletted{frameA, frameB},
		Delay: []int{5, 5},
	}); err != nil {
		t.Fatalf("gif.EncodeAll: %v", err)
	}
}

func openGIFUpload(t *testing.T, dir string) (*os.File, *multipart.FileHeader) {
	t.Helper()

	path := filepath.Join(dir, "emoji.gif")
	writeAnimatedGIF(t, path)

	f, err := os.Open(path)
	if err != nil {
		t.Fatalf("os.Open: %v", err)
	}

	header := &multipart.FileHeader{
		Filename: "emoji.gif",
		Header: textproto.MIMEHeader{
			"Content-Type": []string{"image/gif"},
		},
	}
	return f, header
}

func TestUploadEmojiImage_PreservesGIFAndClearsStaleFiles(t *testing.T) {
	mediaDir := t.TempDir()
	svc := service.NewMediaService(nil, mediaDir, getDefaultMediaConfig(), nil)
	emojiID := uuid.New()

	staleDir := filepath.Join(mediaDir, "emoji", emojiID.String())
	if err := os.MkdirAll(staleDir, 0o755); err != nil {
		t.Fatalf("os.MkdirAll: %v", err)
	}
	if err := os.WriteFile(filepath.Join(staleDir, "image.webp"), []byte("stale"), 0o644); err != nil {
		t.Fatalf("os.WriteFile: %v", err)
	}

	src, header := openGIFUpload(t, t.TempDir())
	defer src.Close()

	width, height, err := svc.UploadEmojiImage(context.Background(), src, header, emojiID)
	if err != nil {
		t.Fatalf("UploadEmojiImage: %v", err)
	}
	if width != 2 || height != 2 {
		t.Fatalf("expected dimensions 2x2, got %dx%d", width, height)
	}

	if _, err := os.Stat(filepath.Join(staleDir, "image.gif")); err != nil {
		t.Fatalf("expected stored gif: %v", err)
	}
	if _, err := os.Stat(filepath.Join(staleDir, "image.webp")); !os.IsNotExist(err) {
		t.Fatalf("expected stale webp to be removed, got err=%v", err)
	}
}

func TestServeEmojiImage_ServesStoredGIFOnLegacyRoute(t *testing.T) {
	mediaDir := t.TempDir()
	svc := service.NewMediaService(nil, mediaDir, getDefaultMediaConfig(), nil)
	emojiID := uuid.New()

	emojiDir := filepath.Join(mediaDir, "emoji", emojiID.String())
	if err := os.MkdirAll(emojiDir, 0o755); err != nil {
		t.Fatalf("os.MkdirAll: %v", err)
	}
	gifPath := filepath.Join(emojiDir, "image.gif")
	writeAnimatedGIF(t, gifPath)

	req := httptest.NewRequest(http.MethodGet, "/emoji/"+emojiID.String()+"/image.webp", nil)
	routeCtx := chi.NewRouteContext()
	routeCtx.URLParams.Add("emojiId", emojiID.String())
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, routeCtx))

	rec := httptest.NewRecorder()
	svc.ServeEmojiImage(rec, req)

	resp := rec.Result()
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
	if got := resp.Header.Get("Content-Type"); got != "image/gif" {
		t.Fatalf("expected image/gif, got %q", got)
	}
	if rec.Body.Len() == 0 {
		t.Fatal("expected non-empty response body")
	}
}
