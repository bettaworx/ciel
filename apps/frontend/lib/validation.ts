/**
 * Client-side validation utilities
 * 
 * These validation rules must match the backend validation in:
 * - apps/backend/internal/auth/validation.go
 * - packages/api/openapi.yml
 * 
 * IMPORTANT: Client-side validation is for UX only.
 * Always rely on server-side validation for security.
 */

// Username validation constants (from backend: apps/backend/internal/auth/validation.go:12-14)
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 32;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

// Password validation constants (from backend: apps/backend/internal/auth/validation.go:15)
const PASSWORD_MIN_LENGTH = 9;
const PASSWORD_MAX_LENGTH = 256; // From OpenAPI spec (not enforced in backend validation.go)

/**
 * Validates username according to backend rules:
 * - 3-32 characters
 * - Only letters (a-z, A-Z), numbers (0-9), and underscores (_)
 * 
 * @param username - The username to validate
 * @returns Translation key for error message, or null if valid
 */
export function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  
  if (trimmed.length === 0) {
    return 'validation.username.required';
  }
  
  if (trimmed.length < USERNAME_MIN_LENGTH) {
    return 'validation.username.tooShort';
  }
  
  if (trimmed.length > USERNAME_MAX_LENGTH) {
    return 'validation.username.tooLong';
  }
  
  if (!USERNAME_PATTERN.test(trimmed)) {
    return 'validation.username.invalidCharacters';
  }
  
  return null;
}

/**
 * Validates password according to backend rules:
 * - At least 9 characters
 * - Maximum 256 characters (OpenAPI limit, added for safety)
 * - Contains uppercase, lowercase, and numbers
 * 
 * @param password - The password to validate
 * @returns Translation key for error message, or null if valid
 */
export function validatePassword(password: string): string | null {
  if (password.length === 0) {
    return 'validation.password.required';
  }
  
  if (password.length < PASSWORD_MIN_LENGTH) {
    return 'validation.password.tooShort';
  }
  
  if (password.length > PASSWORD_MAX_LENGTH) {
    return 'validation.password.tooLong';
  }

  const hasUpper = /\p{Lu}/u.test(password);
  const hasLower = /\p{Ll}/u.test(password);
  const hasNumber = /\p{N}/u.test(password);
  if (!hasUpper || !hasLower || !hasNumber) {
    return 'validation.password.missingRequirements';
  }
  
  return null;
}
