package service

import (
	"database/sql"
	"net/http"
	"regexp"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"backend/internal/api"

	"github.com/google/uuid"
)

const (
	maxDisplayNameLen = 50
	maxBioLen         = 200
)

var profileTagPattern = regexp.MustCompile(`<[^>]*>`)
var profileURLPattern = regexp.MustCompile(`(?i)\b(?:https?://|www\.)\S+`)

func mapUserWithProfile(id uuid.UUID, username string, createdAt time.Time, displayName sql.NullString, bio sql.NullString, avatarMediaID uuid.NullUUID, avatarExt sql.NullString, termsVersion int32, privacyVersion int32, termsAcceptedAt sql.NullTime, privacyAcceptedAt sql.NullTime) api.User {
	user := api.User{Id: id, Username: username, CreatedAt: createdAt}
	if displayName.Valid {
		if v := strings.TrimSpace(displayName.String); v != "" {
			user.DisplayName = &v
		}
	}
	if bio.Valid {
		if v := strings.TrimSpace(bio.String); v != "" {
			user.Bio = &v
		}
	}
	if avatarMediaID.Valid {
		ext := ""
		if avatarExt.Valid {
			ext = avatarExt.String
		}
		url := mediaImageURL(avatarMediaID.UUID, ext)
		user.AvatarUrl = &url
	}
	// Map agreement versions and acceptance timestamps
	if termsVersion > 0 {
		tv := int(termsVersion)
		user.TermsVersion = &tv
	}
	if privacyVersion > 0 {
		pv := int(privacyVersion)
		user.PrivacyVersion = &pv
	}
	if termsAcceptedAt.Valid {
		user.TermsAcceptedAt = &termsAcceptedAt.Time
	}
	if privacyAcceptedAt.Valid {
		user.PrivacyAcceptedAt = &privacyAcceptedAt.Time
	}
	return user
}

func sanitizeDisplayName(input string) string {
	cleaned := sanitizeProfileText(input, false)
	fields := strings.Fields(cleaned)
	if len(fields) == 0 {
		return ""
	}
	return strings.Join(fields, " ")
}

func sanitizeBio(input string) string {
	cleaned := sanitizeProfileText(input, true)
	return strings.TrimSpace(cleaned)
}

func sanitizeProfileText(input string, allowNewlines bool) string {
	out := strings.TrimSpace(input)
	out = profileTagPattern.ReplaceAllString(out, "")
	out = profileURLPattern.ReplaceAllString(out, "")
	out = stripProfileControl(out, allowNewlines)
	if !allowNewlines {
		out = strings.ReplaceAll(out, "\n", " ")
	}
	return strings.TrimSpace(out)
}

func stripProfileControl(input string, allowNewlines bool) string {
	return strings.Map(func(r rune) rune {
		if r == '\t' {
			return ' '
		}
		if r == '\n' || r == '\r' {
			if allowNewlines {
				return '\n'
			}
			return ' '
		}
		if unicode.IsControl(r) {
			return -1
		}
		return r
	}, input)
}

func validateProfileLength(value string, max int, field string) error {
	if value == "" {
		return nil
	}
	if utf8.RuneCountInString(value) > max {
		return NewError(http.StatusBadRequest, "invalid_request", field+" too long")
	}
	return nil
}
