package auth

import (
	"testing"
)

func TestValidateUsername(t *testing.T) {
	tests := []struct {
		name      string
		username  string
		wantError bool
	}{
		// Valid usernames
		{"valid lowercase", "testuser", false},
		{"valid uppercase", "TestUser", false},
		{"valid mixed case", "Test_User_123", false},
		{"valid underscore", "user_name", false},
		{"valid numbers", "user123", false},
		{"valid min length", "abc", false},
		{"valid max length", "a234567890123456789012345678901", false},  // 31 chars
		{"valid exactly 32", "a2345678901234567890123456789012", false}, // 32 chars

		// Invalid usernames
		{"empty string", "", true},
		{"too short", "ab", true},
		{"too long", "a23456789012345678901234567890123", true}, // 33 chars
		{"with space", "user name", true},
		{"with hyphen", "user-name", true},
		{"with at sign", "user@email", true},
		{"with dot", "user.name", true},
		{"with slash", "user/name", true},
		{"with backslash", "user\\name", true},
		{"path traversal", "../../admin", true},
		{"null byte", "user\x00admin", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateUsername(tt.username)
			if (err != nil) != tt.wantError {
				t.Errorf("ValidateUsername(%q) error = %v, wantError %v", tt.username, err, tt.wantError)
			}
		})
	}
}

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		name      string
		password  string
		wantError bool
	}{
		// Valid passwords
		{"valid 9 chars", "Password1", false},
		{"valid 10 chars", "Password12", false},
		{"valid with special", "P@ssw0rd!", false},
		{"valid long", "MySecurePassword123", false},
		{"valid mixed", "Abc123def", false},

		// Invalid passwords
		{"empty string", "", true},
		{"too short", "Pass123", true},           // 7 chars
		{"8 chars", "Pass1234", true},            // 8 chars (need 9)
		{"no uppercase", "password123", true},    // no uppercase
		{"no lowercase", "PASSWORD123", true},    // no lowercase
		{"no number", "PasswordABC", true},       // no number
		{"only letters", "PasswordOnly", true},   // no number
		{"only numbers", "123456789", true},      // no letters
		{"9 chars no upper", "password1", true},  // no uppercase
		{"9 chars no lower", "PASSWORD1", true},  // no lowercase
		{"9 chars no number", "Passwordd", true}, // no number
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePassword(tt.password)
			if (err != nil) != tt.wantError {
				t.Errorf("ValidatePassword(%q) error = %v, wantError %v", tt.password, err, tt.wantError)
			}
		})
	}
}
