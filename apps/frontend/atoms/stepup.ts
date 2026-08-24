import { atom } from "jotai";

export type SharedStepupToken = {
	token: string;
	/** Epoch ms. The server rejects the token past this, so stop offering it. */
	expiresAt: number;
};

/**
 * A step-up token handed from the security page to the MFA page across one
 * client-side navigation: the prompt is answered on /settings/security, and the
 * screen it unlocks lives at /settings/security/mfa.
 *
 * Deliberately a plain atom and never atomWithStorage — this token authorises
 * account changes for five minutes, so it must not outlive the tab, let alone
 * reach localStorage.
 */
export const mfaStepupTokenAtom = atom<SharedStepupToken | null>(null);

/** The held token if it is still worth sending, otherwise null. */
export function usableStepupToken(held: SharedStepupToken | null): string | null {
	if (!held) return null;
	return held.expiresAt > Date.now() ? held.token : null;
}
