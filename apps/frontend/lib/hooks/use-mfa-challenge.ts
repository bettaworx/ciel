"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isWebAuthnAvailable } from "@/lib/api/webauthn";
import type { components } from "@/lib/api/api";

type MfaMethod = components["schemas"]["MfaMethod"];

const TOTP_CODE_LENGTH = 6;
/** Eight hex characters. The hyphen the codes are printed with is cosmetic —
 *  the server normalises it away — so the field never holds it. */
const BACKUP_CODE_LENGTH = 8;

/** Order factors are offered in: the everyday one first. */
const METHOD_ORDER: MfaMethod[] = ["totp", "webauthn", "backup_code"];

/**
 * "choose" lists the account's factors as buttons; it is skipped when there is
 * only one to pick. "passkey" is the screen the OS prompt opens over.
 */
export type MfaStage = "choose" | "totp" | "passkey" | "backup";

function initialStage(factors: ("totp" | "webauthn")[]): MfaStage {
	// A chooser holding one factor is a screen that asks nothing.
	if (factors.length === 1) return factors[0] === "totp" ? "totp" : "passkey";
	if (factors.length === 0) return "backup";
	return "choose";
}

type UseMfaChallengeOptions = {
	/**
	 * Runs the WebAuthn ceremony. Resolves null when it verified, otherwise the
	 * translation key of the failure.
	 */
	verifyWithSecurityKey: () => Promise<string | null>;
};

/**
 * Which second factor the user is presenting, and where they are within it.
 *
 * This lives with the surrounding shell rather than inside MfaChallengeStep
 * because the shell owns the footer, and the footer changes on every stage:
 * the chooser offers backup codes, the code field offers nothing (it submits
 * itself), the passkey screen offers a retry. "Back" likewise has to walk to
 * the chooser before it leaves for the password.
 */
export function useMfaChallenge(
	methods: MfaMethod[],
	{ verifyWithSecurityKey }: UseMfaChallengeOptions,
) {
	// A key the browser cannot drive is not an option, however the server feels.
	const available = METHOD_ORDER.filter(
		(m) => methods.includes(m) && (m !== "webauthn" || isWebAuthnAvailable()),
	);
	const factors = available.filter((m): m is "totp" | "webauthn" => m !== "backup_code");
	const hasBackup = available.includes("backup_code");
	const startStage = initialStage(factors);

	const [stage, setStage] = useState<MfaStage>(startStage);
	const [code, setCodeState] = useState("");
	/** Translation key of the last failure, shown under the field it came from. */
	const [error, setError] = useState<string | null>(null);
	const [passkeyPending, setPasskeyPending] = useState(false);

	// Held in a ref because the shells pass a fresh closure every render; without
	// this the auto-start effect below would re-fire the ceremony on each one.
	const verifyRef = useRef(verifyWithSecurityKey);
	verifyRef.current = verifyWithSecurityKey;
	const started = useRef(false);

	// The shell mounts this before the server has said what the account can do,
	// so re-derive when the answer lands. Assigning during render rather than in
	// an effect keeps the first paint from showing the wrong stage.
	const methodsKey = available.join(",");
	const lastKey = useRef(methodsKey);
	if (lastKey.current !== methodsKey) {
		lastKey.current = methodsKey;
		started.current = false;
		setStage(startStage);
		setCodeState("");
		setError(null);
	}

	const setCode = (next: string) => {
		setCodeState(next);
		setError(null);
	};

	/** Reports a failed verification into the card the user is looking at. */
	const fail = (key: string) => setError(key);

	const runPasskey = useCallback(async () => {
		setError(null);
		setPasskeyPending(true);
		try {
			setError(await verifyRef.current());
		} catch {
			setError("login.wizard.mfa.webauthnFailed");
		} finally {
			setPasskeyPending(false);
		}
	}, []);

	// Only for an account whose single factor is a passkey: there is no click to
	// ride in on, so the ceremony starts as the screen appears.
	//
	// ponytail: Safari may refuse a get() without transient user activation. That
	// lands in the error state, and "retry" — a real click — recovers. Not worth
	// pre-empting with a machinery that guesses at activation.
	useEffect(() => {
		if (stage !== "passkey" || started.current) return;
		started.current = true;
		void runPasskey();
	}, [stage, runPasskey]);

	/**
	 * Label key for the shell's primary button. `undefined` keeps the shell's own
	 * wording, a key overrides it, and `null` means the button has nothing to do.
	 */
	const primaryOverride =
		stage === "choose"
			? // Picking a factor is what moves the chooser along, so the slot becomes
				// the backup-code fallback — or nothing when no codes remain.
				hasBackup
				? "login.wizard.mfa.useBackup"
				: null
			: stage === "totp"
				? // A filled code submits itself.
					null
				: stage === "passkey"
					? "login.wizard.mfa.retry"
					: undefined;

	/**
	 * Same three-valued contract for the shell's back button. Only overridden
	 * when there is a chooser above to return to; a one-factor account backs out
	 * to the password, which is the shell's own wording.
	 */
	const codeLength = stage === "backup" ? BACKUP_CODE_LENGTH : TOTP_CODE_LENGTH;

	/**
	 * Whether the shell's primary button has anything to act on yet. Only the
	 * backup-code field gates it: a TOTP code submits itself on completion, and
	 * the chooser and retry are always available.
	 */
	const primaryDisabled = stage === "backup" && code.length < codeLength;

	const canChooseAnother = stage !== "choose" && startStage === "choose";
	const secondaryOverride = canChooseAnother
		? "login.wizard.mfa.useAnotherWay"
		: undefined;

	const showTotp = () => {
		setCodeState("");
		setError(null);
		setStage("totp");
	};

	const choosePasskey = () => {
		// Started here rather than from the effect: navigator.credentials.get()
		// has to run inside the click that asked for it, and a passive effect is
		// already a task too late.
		started.current = true;
		setError(null);
		setStage("passkey");
		void runPasskey();
	};

	/** The backup-code fallback the chooser's primary button reaches. */
	const useBackupCodes = () => {
		setCodeState("");
		setError(null);
		setStage("backup");
	};

	/**
	 * Steps back inside the challenge. Returns false when there is nowhere left
	 * to go, so the shell can fall through to its own back behaviour.
	 */
	const goBack = () => {
		if (!canChooseAnother) return false;
		setCodeState("");
		setError(null);
		setStage("choose");
		return true;
	};

	return {
		stage,
		factors,
		hasBackup,
		code,
		setCode,
		codeLength,
		error,
		fail,
		passkeyPending,
		primaryOverride,
		primaryDisabled,
		secondaryOverride,
		showTotp,
		choosePasskey,
		useBackupCodes,
		retryPasskey: runPasskey,
		goBack,
	};
}

export type MfaChallengeState = ReturnType<typeof useMfaChallenge>;
