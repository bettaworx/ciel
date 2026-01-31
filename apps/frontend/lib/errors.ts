// Error code constants
export const ERROR_CODES = {
	// Auth-related
	AUTH_SESSION_INVALID: 'AUTH_SESSION_INVALID',
	AUTH_LOGIN_START_FAILED: 'AUTH_LOGIN_START_FAILED',
	AUTH_LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
	AUTH_REGISTRATION_FAILED: 'AUTH_REGISTRATION_FAILED',
	AUTH_REQUIRED: 'AUTH_REQUIRED',

	// Validation-related
	POST_ID_REQUIRED: 'POST_ID_REQUIRED',
	USERNAME_REQUIRED: 'USERNAME_REQUIRED',

	// Generic errors
	GENERIC_ERROR: 'GENERIC_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// Mapping from error codes to i18n keys
export const ERROR_CODE_TO_I18N_KEY: Record<ErrorCode, string> = {
	[ERROR_CODES.AUTH_SESSION_INVALID]: 'error.auth.sessionInvalid',
	[ERROR_CODES.AUTH_LOGIN_START_FAILED]: 'error.auth.loginStartFailed',
	[ERROR_CODES.AUTH_LOGIN_FAILED]: 'error.auth.loginFailed',
	[ERROR_CODES.AUTH_REGISTRATION_FAILED]: 'error.auth.registrationFailed',
	[ERROR_CODES.AUTH_REQUIRED]: 'error.authRequired',
	[ERROR_CODES.POST_ID_REQUIRED]: 'error.postIdRequired',
	[ERROR_CODES.USERNAME_REQUIRED]: 'error.usernameRequired',
	[ERROR_CODES.GENERIC_ERROR]: 'error.generic',
};

// Helper to convert error code to translation key
export function getErrorMessageKey(errorCode: ErrorCode | string): string {
	return (
		ERROR_CODE_TO_I18N_KEY[errorCode as ErrorCode] ||
		ERROR_CODE_TO_I18N_KEY[ERROR_CODES.GENERIC_ERROR]
	);
}
