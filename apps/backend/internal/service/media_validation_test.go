package service

import (
	"errors"
	"net/http"
	"testing"

	"backend/internal/config"
)

func strictMediaConfig() config.MediaConfig {
	return config.MediaConfig{
		AllowedExtensions: []string{"webp", "gif", "webm", "mp4", "png", "mov"},
	}
}

func TestIsExtensionAllowed(t *testing.T) {
	cfg := strictMediaConfig()

	allowed := []string{".webp", ".gif", ".webm", ".mp4", "WEBP", "gif"}
	for _, ext := range allowed {
		if !cfg.IsExtensionAllowed(ext) {
			t.Errorf("IsExtensionAllowed(%q) = false, want true", ext)
		}
	}

	// png and mov are in allowed_extensions but not in the hardcoded floor, so
	// config must not be able to widen the set back out.
	denied := []string{".png", ".jpg", ".jpeg", ".mov", ".avi", ".mkv", ".m4v", ".3gp", ".ogv", ".svg", ""}
	for _, ext := range denied {
		if cfg.IsExtensionAllowed(ext) {
			t.Errorf("IsExtensionAllowed(%q) = true, want false", ext)
		}
	}
}

func TestIsVideoExtension(t *testing.T) {
	cfg := strictMediaConfig()

	for _, ext := range []string{".webm", ".mp4", "webm"} {
		if !cfg.IsVideoExtension(ext) {
			t.Errorf("IsVideoExtension(%q) = false, want true", ext)
		}
	}
	for _, ext := range []string{".webp", ".gif", ".mov", ".mkv"} {
		if cfg.IsVideoExtension(ext) {
			t.Errorf("IsVideoExtension(%q) = true, want false", ext)
		}
	}
}

func TestValidateMIMEType(t *testing.T) {
	// Minimal headers that http.DetectContentType recognizes.
	webp := append([]byte("RIFF\x00\x00\x00\x00WEBPVP8 "), make([]byte, 32)...)
	gif := append([]byte("GIF89a"), make([]byte, 32)...)
	webm := append([]byte("\x1A\x45\xDF\xA3"), make([]byte, 32)...)
	png := append([]byte("\x89PNG\r\n\x1a\n"), make([]byte, 32)...)

	tests := []struct {
		name       string
		buf        []byte
		ext        string
		declaredCT string
		wantErr    bool
	}{
		{"webp matches", webp, ".webp", "image/webp", false},
		{"gif matches", gif, ".gif", "image/gif", false},
		{"webm matches", webm, ".webm", "video/webm", false},
		{"octet-stream declared is ignored", webp, ".webp", "application/octet-stream", false},
		{"empty declared is ignored", gif, ".gif", "", false},

		{"png content is rejected outright", png, ".png", "image/png", true},
		{"png renamed to webp", png, ".webp", "image/webp", true},
		{"gif content in a webp name", gif, ".webp", "image/webp", true},
		{"webm content in an mp4 name", webm, ".mp4", "video/mp4", true},
		{"declared type contradicts content", webp, ".webp", "image/gif", true},
		{"declared type not allowed", webp, ".webp", "text/html", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateMIMEType(tt.buf, tt.ext, tt.declaredCT)
			if tt.wantErr && err == nil {
				t.Fatal("expected an error, got nil")
			}
			if !tt.wantErr && err != nil {
				t.Fatalf("expected no error, got %v", err)
			}
			if tt.wantErr {
				var se *Error
				if !errors.As(err, &se) || se.Status != http.StatusUnsupportedMediaType {
					t.Fatalf("expected 415 service error, got %v", err)
				}
			}
		})
	}
}

func TestCodecAllowlists(t *testing.T) {
	// The normalizer only ever emits these; anything else must not be muxable in.
	for ext, want := range map[string][]string{".webm": {"vp8", "vp9", "av1"}, ".mp4": {"h264", "hevc", "av1"}} {
		for _, codec := range want {
			if _, ok := allowedVideoCodecs[ext][codec]; !ok {
				t.Errorf("allowedVideoCodecs[%q] missing %q", ext, codec)
			}
		}
	}
	for _, codec := range []string{"h264", "hevc", "theora", "mpeg4", "wmv3"} {
		if _, ok := allowedVideoCodecs[".webm"][codec]; ok {
			t.Errorf("allowedVideoCodecs[.webm] must not contain %q", codec)
		}
	}
	for _, codec := range []string{"vp8", "vp9", "mp3", "ac3", "flac"} {
		if _, ok := allowedAudioCodecs[".mp4"][codec]; ok {
			t.Errorf("allowedAudioCodecs[.mp4] must not contain %q", codec)
		}
	}
}
