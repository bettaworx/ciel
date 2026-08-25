"use client";

import { useCallback, useState } from "react";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atoms/auth";
import { useAuth, type MfaChallenge } from "@/lib/hooks/use-auth";
import type { components } from "@/lib/api/api";

type MfaMethod = components["schemas"]["MfaMethod"];

export type StepupPhase = "password" | "mfa" | "ready";

/**
 * Drives one step-up (re-authentication) exchange: password, then a second
 * factor when the account has one, ending in a step-up token.
 *
 * The token lives in component state only — never localStorage — and is good
 * for a 5-minute window on the server. MFA management reuses it across the
 * whole settings session (see stepupMfaMaxUses in the backend); every other
 * sensitive operation spends it once, so `invalidate()` on a 401 sends the user
 * back to the password field.
 *
 * Shared by StepupWizard (single operation) and StepupGate (a whole screen).
 */
type UseStepupOptions = {
	/**
	 * Fired the moment a token is issued, before anything renders with it.
	 * Callers that need the token to outlive this component — a prompt that
	 * navigates to the screen it unlocks — publish it from here.
	 */
	onToken?: (token: string, expiresInSeconds: number) => void;
};

export function useStepup({ onToken }: UseStepupOptions = {}) {
	const user = useAtomValue(userAtom);
	const { stepup, completeStepupMfa, completeStepupMfaWebAuthn } = useAuth();

	const [token, setToken] = useState<string | null>(null);
	const [challenge, setChallenge] = useState<MfaChallenge | null>(null);
	const [loading, setLoading] = useState(false);

	const username = user?.username ?? "";
	const phase: StepupPhase = token ? "ready" : challenge ? "mfa" : "password";

	// `stepup` and `completeStepupMfa*` all resolve to the same three shapes.
	// Failures come back as a translation key rather than being stashed in state:
	// a caller reading state right after `await` would see the previous render.
	const apply = useCallback(
		(
			result: Awaited<ReturnType<typeof stepup>>,
			failureKey: string,
		): string | null => {
			if (result.ok === "mfa") {
				setChallenge(result);
				return null;
			}
			if (!result.ok) return failureKey;
			setToken(result.stepupToken);
			setChallenge(null);
			onToken?.(result.stepupToken, result.expiresInSeconds);
			return null;
		},
		[onToken],
	);

	const run = useCallback(
		async (action: () => Promise<string | null>): Promise<string | null> => {
			setLoading(true);
			try {
				return await action();
			} catch {
				return "error.generic";
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	const submitPassword = useCallback(
		(password: string) =>
			run(async () =>
				apply(await stepup(username, password), "settings.reauth.failed"),
			),
		[run, apply, stepup, username],
	);

	const submitMfaCode = useCallback(
		(code: string, method?: MfaMethod) =>
			run(async () => {
				if (!challenge) return "login.wizard.mfa.failed";
				return apply(
					await completeStepupMfa(challenge.mfaToken, code, method),
					"login.wizard.mfa.failed",
				);
			}),
		[run, apply, challenge, completeStepupMfa],
	);

	const submitMfaWebAuthn = useCallback(
		() =>
			run(async () => {
				if (!challenge) return "login.wizard.mfa.webauthnFailed";
				return apply(
					await completeStepupMfaWebAuthn(challenge.mfaToken),
					"login.wizard.mfa.webauthnFailed",
				);
			}),
		[run, apply, challenge, completeStepupMfaWebAuthn],
	);

	/** The token is spent or expired: start over from the password. */
	const invalidate = useCallback(() => {
		setToken(null);
		setChallenge(null);
	}, []);

	return {
		phase,
		token,
		methods: challenge?.methods ?? [],
		loading,
		submitPassword,
		submitMfaCode,
		submitMfaWebAuthn,
		invalidate,
	};
}
