package middleware

import (
	"io"
	"net/http"
)

// maxDrainBytes bounds how much of an abandoned request body is read and
// discarded. It matches the largest upload the server would have accepted, so a
// legitimate rejected upload is drained in full while a malicious sender cannot
// hold a connection open indefinitely.
const maxDrainBytes = 128 << 20 // 128 MiB

// DrainRequestBody consumes whatever the handler left unread.
//
// net/http marks a connection for closing when a handler responds without
// having read the request body. For a request that is still uploading — an
// early 429 from the rate limiter, a 413, a 415, a 401 — the browser sees that
// close as a connection reset and reports `TypeError: Failed to fetch` instead
// of the status we actually wrote. Draining here lets the upload finish and the
// real response through, which is what the client's error handling expects.
//
// It is registered as the outermost middleware, so this runs after every inner
// middleware and handler but before the response reaches the wire. When the
// body was already consumed the copy returns immediately, so the normal path
// costs nothing.
func DrainRequestBody(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)

		if r.Body != nil {
			_, _ = io.Copy(io.Discard, io.LimitReader(r.Body, maxDrainBytes))
		}
	})
}
