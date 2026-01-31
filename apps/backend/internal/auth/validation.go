package auth

import (
	"errors"
	"regexp"
	"unicode"
)

// Username validation pattern: alphanumeric and underscore only
var usernamePattern = regexp.MustCompile(`^[a-zA-Z0-9_]+$`)

const (
	MinUsernameLen = 3
	MaxUsernameLen = 32
	MinPasswordLen = 9
)

// ValidateUsername checks if username meets requirements:
// - 3-32 characters
// - Only letters (a-z, A-Z), numbers (0-9), and underscores (_)
func ValidateUsername(username string) error {
	if username == "" {
		return errors.New("username required")
	}
	if len(username) < MinUsernameLen || len(username) > MaxUsernameLen {
		return errors.New("username must be 3-32 characters")
	}
	if !usernamePattern.MatchString(username) {
		return errors.New("username must contain only letters, numbers, and underscores")
	}
	return nil
}

// ValidatePassword checks if password meets requirements:
// - At least 9 characters
// - Contains at least one uppercase letter
// - Contains at least one lowercase letter
// - Contains at least one number
func ValidatePassword(password string) error {
	if len(password) < MinPasswordLen {
		return errors.New("password must be at least 9 characters")
	}

	var hasUpper, hasLower, hasNumber bool
	for _, c := range password {
		switch {
		case unicode.IsUpper(c):
			hasUpper = true
		case unicode.IsLower(c):
			hasLower = true
		case unicode.IsNumber(c):
			hasNumber = true
		}
	}

	if !hasUpper || !hasLower || !hasNumber {
		return errors.New("password must contain uppercase, lowercase, and numbers")
	}

	return nil
}
