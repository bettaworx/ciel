/**
 * Generate a cryptographically secure random invite code
 * Character set: a-z, A-Z, 0-9 (62 possible characters)
 * @param length Length of the code (default: 8)
 * @returns Generated invite code
 */
export function generateInviteCode(length: number = 8): string {
	const chars =
		'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let code = '';
	const array = new Uint8Array(length);
	crypto.getRandomValues(array);
	for (let i = 0; i < length; i++) {
		code += chars[array[i] % chars.length];
	}
	return code;
}
