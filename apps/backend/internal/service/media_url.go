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

func mediaVideoURL(id uuid.UUID, ext string) string {
	ext = strings.TrimPrefix(strings.ToLower(strings.TrimSpace(ext)), ".")
	if ext == "" {
		ext = "mp4"
	}
	return publicBaseURL() + "/media/" + id.String() + "/video." + ext
}

// MediaVideoURL builds the public URL for serving a media video.
//
// This is primarily used by tests living outside this package.
func MediaVideoURL(id uuid.UUID, ext string) string { return mediaVideoURL(id, ext) }

func mediaThumbnailURL(id uuid.UUID) string {
	return publicBaseURL() + "/media/" + id.String() + "/thumbnail.webp"
}

// MediaThumbnailURL builds the public URL for serving a video thumbnail.
//
// This is primarily used by tests living outside this package.
func MediaThumbnailURL(id uuid.UUID) string { return mediaThumbnailURL(id) }

func emojiImageURL(id uuid.UUID) string {
	return publicBaseURL() + "/media/" + id.String() + "/image.webp"
}

// EmojiImageURL builds the public URL for serving a custom emoji image.
//
// This is primarily used by tests living outside this package.
func EmojiImageURL(id uuid.UUID) string { return emojiImageURL(id) }
