"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { userAtom } from "@/atoms/auth";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AuthLayoutShell } from "@/components/auth/AuthLayoutShell";
import { SetupTransition } from "@/components/setup/SetupTransition";
import { PasswordStep } from "@/components/auth/login/PasswordStep";

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

/**
 * Full-screen three-step flow shared by every sensitive account operation:
 *
 *   0. re-authenticate with the current password (step-up)
 *   1. enter / confirm what is about to happen
 *   2. done
 *
 * Step 0 comes first so nothing is typed before the identity is proven. The
 * step-up token lives in component state only — never localStorage — and is
 * handed to `onSubmit` for its single use.
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
  const { stepup } = useAuth();

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [stepupToken, setStepupToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const username = user?.username ?? "";

  const handleReauth = async (password: string) => {
    setLoading(true);
    try {
      const result = await stepup(username, password);
      if (!result.ok) {
        toast.error(t("settings.reauth.failed"));
        return;
      }
      setStepupToken(result.stepupToken);
      setStep(1);
    } catch {
      toast.error(t("error.generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!stepupToken) {
      setStep(0);
      return;
    }

    setLoading(true);
    try {
      const outcome = await onSubmit(stepupToken);
      if (outcome === "done") {
        setStep(2);
        return;
      }
      if (outcome === "reauth") {
        // The token is spent or expired either way; force a fresh one.
        setStepupToken(null);
        setStep(0);
        toast.error(t("settings.reauth.expired"));
      }
    } catch {
      toast.error(t("error.generic"));
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <PasswordStep
            username={username}
            heading={reauthHeading}
            onSubmit={handleReauth}
            loading={loading}
          />
        );
      case 1:
        return children;
      case 2:
        return completion;
    }
  };

  const renderFooter = () => {
    if (step === 0) {
      return (
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(cancelHref)}
            disabled={loading}
          >
            <ChevronLeft />
            {t("setup.back")}
          </Button>

          <Button
            type="submit"
            form="login-password-form"
            variant="primary"
            disabled={loading}
          >
            {loading ? t("loading") : t("setup.next")}
          </Button>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStep(0)}
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
