package middleware_test

import (
	"testing"

	"backend/internal/middleware"
	"backend/internal/service"
)

// The access token prefix is written down twice: the middleware uses it to
// decide whether to validate a bearer token as a JWT or as an opaque OAuth
// token, and the service uses it when minting one. It is duplicated rather than
// shared because service must not import middleware.
//
// If the two ever drift, every OAuth token issued goes to the JWT parser,
// fails, and every API call 401s — so pin them together here, which is the
// cheapest place that can see both packages.
func TestOAuthAccessTokenPrefixesAgree(t *testing.T) {
	if middleware.OAuthAccessTokenPrefix != service.AccessTokenPrefix {
		t.Fatalf("prefix drift: middleware has %q, service issues %q",
			middleware.OAuthAccessTokenPrefix, service.AccessTokenPrefix)
	}
}
