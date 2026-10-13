package service

import (
	"bytes"
	"context"
	"fmt"
	"log/slog"
	"os/exec"
	"strings"
	"time"
)

// Bounds on every ffmpeg and ffprobe invocation.
//
// SECURITY: uploads reach these tools after validation, but validation itself
// runs ffprobe, and a malformed or adversarial file is exactly what a decoder is
// worst at. Without these, one upload could hold a worker for as long as the
// server's WriteTimeout while allocating whatever it liked.
const (
	// maxDecoderAlloc caps a single allocation inside the tool. An 8K YUV420
	// frame is about 50 MB and a 16384x16384 one about 400 MB, so real work fits
	// and a decompression bomb fails to allocate.
	maxDecoderAlloc = 256 << 20

	// ffprobeTimeout covers metadata reads and the keyframe scan.
	ffprobeTimeout = 30 * time.Second

	// ffmpegTimeout must stay inside the server's WriteTimeout (10 minutes) so a
	// stuck encode surfaces as an error rather than a dropped connection.
	ffmpegTimeout = 8 * time.Minute

	// maxConcurrentMedia bounds how many of these run at once. Rate limiting is
	// per user, so without this the process count grows with the user count.
	//
	// ponytail: fixed; make it configurable if a deployment needs to tune it to
	// its core count.
	maxConcurrentMedia = 4
)

// mediaSlots hands out permission to run a media tool. Package scope rather than
// per-service: the limit is the machine's, and there is one MediaService anyway.
var mediaSlots = make(chan struct{}, maxConcurrentMedia)

// runFFmpeg runs ffmpeg with the shared bounds applied, returning stderr's tail
// on failure so callers can log something useful.
func (s *MediaService) runFFmpeg(ctx context.Context, args ...string) error {
	_, err := runMediaTool(ctx, s.ffmpegPath, ffmpegTimeout, args)
	return err
}

// runFFprobe runs ffprobe with the shared bounds applied and returns stdout.
func (s *MediaService) runFFprobe(ctx context.Context, args ...string) ([]byte, error) {
	return runMediaTool(ctx, s.ffprobePath, ffprobeTimeout, args)
}

func runMediaTool(ctx context.Context, bin string, timeout time.Duration, args []string) ([]byte, error) {
	if strings.TrimSpace(bin) == "" {
		return nil, fmt.Errorf("media encoding tools are not available")
	}

	select {
	case mediaSlots <- struct{}{}:
		defer func() { <-mediaSlots }()
	case <-ctx.Done():
		return nil, ctx.Err()
	}

	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	// -max_alloc is a global option, so it has to precede everything else.
	full := append([]string{"-max_alloc", fmt.Sprint(maxDecoderAlloc)}, args...)

	cmd := exec.CommandContext(ctx, bin, full...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		msg := strings.TrimSpace(stderr.String())
		if ctx.Err() != nil {
			slog.Warn("media tool timed out", "bin", bin, "timeout", timeout)
			return nil, fmt.Errorf("media processing timed out")
		}
		slog.Error("media tool failed", "bin", bin, "error", err, "stderr", msg)
		return nil, fmt.Errorf("%s failed: %s", strings.TrimSuffix(bin, ".exe"), msg)
	}

	return stdout.Bytes(), nil
}
