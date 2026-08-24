"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { useStepup } from "@/lib/hooks/use-stepup";
import { useMfaChallenge } from "@/lib/hooks/use-mfa-challenge";
import { Button } from "@/components/ui/button";
import { AuthLayoutShell } from "@/components/auth/AuthLayoutShell";
import { SetupTransition } from "@/components/setup/SetupTransition";
import { PasswordStep } from "@/components/auth/login/PasswordStep";
import { MfaChallengeStep } from "@/components/auth/MfaChallengeStep";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atoms/auth";

/**
 * What `onSubmit` tells the wizard to do next.
 *
 * - "done"   → show the completion step
 * - "retry"  → stay on the input step (bad input, e.g. username already taken)
 * - "reauth" → drop back to the password step; the step-up token is single-use
 *              and expires after 5 minutes, so a slow input step gets a 401
 */
export type StepupSubmitResult = "done" | "retry" | "reauth";

interface StepupWizardProps {
  /** Heading shown above the password field on the re-auth step. */
  reauthHeading: string;
  /** Label of the button that performs the operation. */
  submitLabel: string;
  /** Where cancelling out of the first step returns to. */
  cancelHref: string;
  /** Render the submit button as destructive (account deletion). */
  destructive?: boolean;
  /** Whether the input step holds a valid value. */
  canSubmit: boolean;
  onSubmit: (stepupToken: string) => Promise<StepupSubmitResult>;
  /** Contents of the final step. Rendered without any navigation buttons. */
  completion: React.ReactNode;
  /** Contents of the input/confirmation step. */
  children: React.ReactNode;
}

/** Step indices, kept in one place because SetupTransition animates on them. */
const STEP = { password: 0, mfa: 1, action: 2, done: 3 } as const;

/**
 * Full-screen flow shared by every sensitive account operation:
 *
 *   0. re-authenticate with the current password (step-up)
 *   1. present a second factor, when the account has 2FA enabled
 *   2. enter / confirm what is about to happen
 *   3. done
 *
 * Step 0 comes first so nothing is typed before the identity is proven. The
 * step-up exchange itself lives in useStepup; the token stays in state only —
 * never localStorage — and is handed to `onSubmit` for its single use.
 *
 * It takes over the whole screen rather than sitting inside the settings
 * sidebar: this is the same AuthLayoutShell as /login, and the re-auth step
 * reuses the login screen's PasswordStep verbatim, so password managers, the
 * sr-only username field and the profile display all behave identically.
 * These routes are listed in CONCENTRATED_MODE_PATHS, which drops both the app
 * sidebar and the settings chrome — see lib/utils/concentrated-mode.ts.
 */
export function StepupWizard({
  reauthHeading,
  submitLabel,
  cancelHref,
  destructive = false,
  canSubmit,
  onSubmit,
  completion,
  children,
}: StepupWizardProps) {
  const t = useTranslations();
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const stepup = useStepup();

  const challenge = useMfaChallenge(stepup.methods, {
    verifyWithSecurityKey: stepup.submitMfaWebAuthn,
  });
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const username = user?.username ?? "";
  const loading = stepup.loading || submitting;

  const step = done
    ? STEP.done
    : stepup.phase === "password"
      ? STEP.password
      : stepup.phase === "mfa"
        ? STEP.mfa
        : STEP.action;

  const handleSubmit = async () => {
    if (!stepup.token) return;

    setSubmitting(true);
    try {
      const outcome = await onSubmit(stepup.token);
      if (outcome === "done") {
        setDone(true);
        return;
      }
      if (outcome === "reauth") {
        // The token is spent or expired either way; force a fresh one.
        stepup.invalidate();
        toast.error(t("settings.reauth.expired"));
      }
    } catch {
      toast.error(t("error.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case STEP.password:
        return (
          <PasswordStep
            username={username}
            heading={reauthHeading}
            onSubmit={async (password) => {
              const failure = await stepup.submitPassword(password);
              if (failure) toast.error(t(failure));
            }}
            loading={loading}
          />
        );
      case STEP.mfa:
        return (
          <MfaChallengeStep
            challenge={challenge}
            formId="stepup-mfa-form"
            loading={loading}
            onSubmitCode={async (code, method) => {
              const failure = await stepup.submitMfaCode(code, method);
              if (failure) challenge.fail(failure);
            }}
          />
        );
      case STEP.action:
        return children;
      default:
        return completion;
    }
  };

  const renderFooter = () => {
    if (step === STEP.password || step === STEP.mfa) {
      const primaryLabel = step === STEP.mfa ? challenge.primaryOverride : "setup.next";
      const primaryIsFallback =
        typeof primaryLabel === "string" && primaryLabel !== "setup.next";
      const secondaryLabel =
        (step === STEP.mfa && challenge.secondaryOverride) || "setup.back";
      return (
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            // replace, not push: leaving the wizard is a step back up, so it
            // must not stay in the history for the parent's own back arrow.
            // Inside the challenge, back walks to the factor chooser first;
            // only once there is nothing above it does it leave for the password.
            onClick={() => {
              if (step !== STEP.mfa) return router.replace(cancelHref);
              if (!challenge.goBack()) stepup.invalidate();
            }}
            disabled={loading}
          >
            <ChevronLeft />
            {t(secondaryLabel)}
          </Button>

          {primaryLabel !== null && (
            <Button
              type="submit"
              form={step === STEP.mfa ? "stepup-mfa-form" : "login-password-form"}
              variant={primaryIsFallback ? "secondary" : "primary"}
              disabled={loading || (step === STEP.mfa && challenge.primaryDisabled)}
            >
              {loading ? t("loading") : t(primaryLabel ?? "setup.next")}
            </Button>
          )}
        </div>
      );
    }

    if (step === STEP.action) {
      return (
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => stepup.invalidate()}
            disabled={loading}
          >
            <ChevronLeft />
            {t("setup.back")}
          </Button>

          <Button
            type="button"
            variant={destructive ? "destructive" : "primary"}
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
          >
            {loading ? t("loading") : submitLabel}
          </Button>
        </div>
      );
    }

    // The completion step carries its own single call to action.
    return null;
  };

  return (
    <AuthLayoutShell fixedAspectRatio footer={renderFooter()}>
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <SetupTransition currentStep={step} direction="forward">
          {renderStep()}
        </SetupTransition>
      </div>
    </AuthLayoutShell>
  );
}
