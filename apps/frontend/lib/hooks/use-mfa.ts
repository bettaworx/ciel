"use client";

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api/use-api";
import { queryKeys } from "@/lib/hooks/use-queries";
import type { ApiResult } from "@/lib/api/client";
import type { components } from "@/lib/api/api";

export type MfaStatus = components["schemas"]["MfaStatus"];

/** A failed MFA management call, carrying enough to pick an error message. */
export class MfaError extends Error {
	readonly status: number;
	readonly code?: string;

	constructor(status: number, code?: string) {
		super(`MFA request failed with ${status}`);
		this.name = "MfaError";
		this.status = status;
		this.code = code;
	}
}

function errorCode(errorJson: unknown): string | undefined {
	if (errorJson && typeof errorJson === "object" && "code" in errorJson) {
		const code = (errorJson as { code?: unknown }).code;
		if (typeof code === "string") return code;
	}
	return undefined;
}

/**
 * State and actions for the MFA settings screen.
 *
 * Every mutating endpoint needs the step-up token, and the settings screen only
 * ever runs one action at a time, so a single `pending` flag replaces a mutation
 * hook per endpoint. `run` unwraps the ApiResult, refreshes the status and hands
 * an expired token back to the gate.
 */
export function useMfa(stepupToken: string | null, onStepupExpired: () => void) {
	const api = useApi();
	const queryClient = useQueryClient();
	const [pending, setPending] = useState(false);

	const query = useQuery({
		queryKey: queryKeys.mfa,
		queryFn: async (): Promise<MfaStatus> => {
			const res = await api.mfaStatus();
			if (!res.ok) throw new MfaError(res.status, errorCode(res.errorJson));
			return res.data;
		},
	});

	const run = useCallback(
		async <T,>(call: (token: string) => Promise<ApiResult<T>>): Promise<T> => {
			if (!stepupToken) {
				onStepupExpired();
				throw new MfaError(401);
			}

			setPending(true);
			try {
				const res = await call(stepupToken);
				if (!res.ok) {
					// 401 here means the step-up window closed, not that the session
					// died — send the user back to the password field, not to /login.
					if (res.status === 401) onStepupExpired();
					throw new MfaError(res.status, errorCode(res.errorJson));
				}
				await queryClient.invalidateQueries({ queryKey: queryKeys.mfa });
				return res.data;
			} finally {
				setPending(false);
			}
		},
		[stepupToken, onStepupExpired, queryClient],
	);

	/** Re-reads the MFA status; for calls that need no step-up token. */
	const refresh = useCallback(
		() => queryClient.invalidateQueries({ queryKey: queryKeys.mfa }),
		[queryClient],
	);

	return {
		api,
		refresh,
		status: query.data,
		isLoading: query.isLoading,
		pending,
		run,
	};
}
