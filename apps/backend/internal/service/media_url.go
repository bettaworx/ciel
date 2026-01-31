package service

import (
	"os"
	"strings"

	"github.com/google/uuid"
)

func publicBaseURL() string {
	v := strings.TrimSpace(os.Getenv("PUBLIC_BASE_URL"))
	if v == "" {
		return "http://localhost:6137"
	}
	return strings.TrimRight(v, "/")
}

// PublicBaseURL exposes the computed public base URL.
//
// This is primarily used by tests living outside this package.
func PublicBaseURL() string { return publicBaseURL() }

func mediaImageURL(id uuid.UUID, ext string) string {
	ext = strings.TrimPrefix(strings.ToLower(strings.TrimSpace(ext)), ".")
	if ext == "" {
		ext = "webp"
	}
	return publicBaseURL() + "/media/" + id.String() + "/image." + ext
}

// MediaImageURL builds the public URL for serving a media image.
//
// This is primarily used by tests living outside this package.
func MediaImageURL(id uuid.UUID, ext string) string { return mediaImageURL(id, ext) }
