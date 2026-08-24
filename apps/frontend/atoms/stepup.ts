import { atom } from "jotai";

export type SharedStepupToken = {
	token: string;
	/** Epoch ms. The server rejects the token past this, so stop offering it. */
	expiresAt: number;
};

/**
 * A step-up token handed from a settings row to the screen it unlocks, across
 * one client-side navigation: the prompt is answered on /settings/security or
 * /settings/account, and the operation lives a route deeper.
 *
 * Deliberately a plain atom and never atomWithStorage — this token authorises
 * account changes for five minutes, so it must not outlive the tab, let alone
 * reach localStorage.
 *
 * Only the MFA management endpoints accept the same token more than once
 * (stepupMfaMaxUses on the backend). Password change, username change and
 * account deletion spend it on their first call, so those screens clear this
 * atom once they succeed rather than leaving a dead token to be picked up.
 */
export const stepupTokenAtom = atom<SharedStepupToken | null>(null);

/** The held token if it is still worth sending, otherwise null. */
export function usableStepupToken(held: SharedStepupToken | null): string | null {
	if (!held) return null;
	return held.expiresAt > Date.now() ? held.token : null;
}
