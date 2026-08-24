"use client";

import { useTranslations } from "next-intl";
import { ChevronRight, CircleX, KeyRound, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import type { MfaChallengeState } from "@/lib/hooks/use-mfa-challenge";
import type { components } from "@/lib/api/api";

type MfaMethod = components["schemas"]["MfaMethod"];

const METHOD_ICON = { totp: Smartphone, webauthn: KeyRound } as const;

interface MfaChallengeStepProps {
  /** Stage and selection, from useMfaChallenge in the surrounding shell. */
  challenge: MfaChallengeState;
  /** Id the surrounding shell's footer button submits via `form=`. */
  formId: string;
  onSubmitCode: (code: string, method: MfaMethod) => void;
  loading?: boolean;
  /** Matches PasswordStep: the bottom sheet wants a smaller, centred heading. */
  presentation?: "wizard" | "sheet";
}

/**
 * The second-factor step, shared by login and step-up.
 *
 * One screen per factor, because they ask for different things: a code field, or
 * an OS prompt with nothing to type. Which one comes first is decided by the
 * account — two factors get a chooser, one goes straight in. Backup codes are
 * never among the choices; they are the fallback for when neither factor is at
 * hand, so they live in the footer.
 *
 * Failures are shown in the card, under whatever produced them, rather than as
 * a toast that would sit over the sheet.
 */
export function MfaChallengeStep({
  challenge,
  formId,
  onSubmitCode,
  loading = false,
  presentation = "wizard",
}: MfaChallengeStepProps) {
  const t = useTranslations();
  const isSheet = presentation === "sheet";
  const { stage, factors, code, setCode, codeLength, error, passkeyPending } = challenge;

  const isBackup = stage === "backup";

  const submitCode = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length === codeLength) {
      onSubmitCode(trimmed, isBackup ? "backup_code" : "totp");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stage === "choose") {
      // On the chooser the primary button is the backup-code fallback; the
      // factors themselves live in the body.
      challenge.useBackupCodes();
      return;
    }
    if (stage === "passkey") {
      void challenge.retryPasskey();
      return;
    }
    submitCode(code);
  };

  const description =
    stage === "choose"
      ? t("login.wizard.mfa.chooseDescription")
      : stage === "totp"
        ? t("login.wizard.mfa.totpDescription")
        : null;

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col justify-center gap-6"
    >
      <div className={cn("flex flex-col gap-2", isSheet && "text-center")}>
        <h2 className={isSheet ? "text-lg font-semibold" : "text-2xl font-bold"}>
          {t(isBackup ? "login.wizard.mfa.backupHeading" : "login.wizard.mfa.heading")}
        </h2>
        {description && (
          <p className={cn("text-muted-foreground", isSheet && "text-sm")}>
            {description}
          </p>
        )}
      </div>

      {stage === "choose" && (
        <div className="flex flex-col gap-2">
          {factors.map((factor) => {
            const Icon = METHOD_ICON[factor];
            return (
              <Button
                key={factor}
                type="button"
                variant="secondary"
                rounded="lg"
                className="h-auto w-full justify-between px-4 py-3"
                onClick={() =>
                  factor === "webauthn" ? challenge.choosePasskey() : challenge.showTotp()
                }
                disabled={loading}
              >
                <span className="flex items-center gap-3">
                  <Icon />
                  {t(`login.wizard.mfa.method.${factor}`)}
                </span>
                <ChevronRight />
              </Button>
            );
          })}
        </div>
      )}

      {stage === "passkey" && (
        // The OS prompt is already up over this; the card only has to say that
        // something is happening, or that it did not work.
        <div className="flex min-h-32 flex-col items-center justify-center gap-3 text-center">
          {passkeyPending || !error ? (
            <>
              <Spinner variant="theme" label={t("login.wizard.mfa.passkeyPending")} />
              <p className="text-sm text-muted-foreground">
                {t("login.wizard.mfa.passkeyPending")}
              </p>
            </>
          ) : (
            <>
              <CircleX className="size-8 text-destructive" />
              <p className="text-sm text-destructive">{t(error)}</p>
            </>
          )}
        </div>
      )}

      {(stage === "totp" || isBackup) && (
        <div className={cn("space-y-2", isSheet && "flex flex-col items-center")}>
          {/* The heading and its description already say what this is; the label
              is here so the input has an accessible name. */}
          <Label htmlFor="mfa-code" className="sr-only">
            {isBackup
              ? t("login.wizard.mfa.backupLabel")
              : t("login.wizard.mfa.codeLabel")}
          </Label>
          <InputOTP
            id="mfa-code"
            key={stage}
            value={code}
            onChange={(value) => setCode(isBackup ? value.toUpperCase() : value)}
            // A filled authenticator code has nothing left to confirm, so it
            // goes. Backup codes do not: burning one by mistyping is expensive.
            onComplete={isBackup ? undefined : submitCode}
            maxLength={codeLength}
            pattern={isBackup ? "^[0-9a-fA-F]*$" : "^[0-9]*$"}
            inputMode={isBackup ? "text" : "numeric"}
            autoComplete="one-time-code"
            autoFocus
            disabled={loading}
          >
            {isBackup ? (
              <>
                <InputOTPGroup>
                  {[0, 1, 2, 3].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  {[4, 5, 6, 7].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </>
            ) : (
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            )}
          </InputOTP>
          {error && <p className="text-sm text-destructive">{t(error)}</p>}
        </div>
      )}
    </form>
  );
}
