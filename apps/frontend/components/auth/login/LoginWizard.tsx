"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AuthLayoutShell } from "@/components/auth/AuthLayoutShell";
import { SetupTransition } from "@/components/setup/SetupTransition";
import { UsernameStep } from "@/components/auth/login/UsernameStep";
import { PasswordStep } from "@/components/auth/login/PasswordStep";
import { MfaChallengeStep } from "@/components/auth/MfaChallengeStep";
import { useMfaChallenge } from "@/lib/hooks/use-mfa-challenge";
import { ChevronLeft } from "lucide-react";
import {
  type LoginStep,
  getLoginStepIndex,
  getLoginStepByIndex,
} from "@/lib/config/auth-steps";
import type { AnimationDirection } from "@/lib/config/setup-animation";
import type { components } from "@/lib/api/api";

type MfaMethod = components["schemas"]["MfaMethod"];

/**
 * LoginWizard is the main component for the login flow.
 * It manages step navigation, animations, and API calls.
 */
export function LoginWizard() {
  const router = useRouter();
  const t = useTranslations();
  const { login, completeLoginMfa, completeLoginMfaWebAuthn } = useAuth();

  // State
  const [currentStep, setCurrentStep] = useState<LoginStep>("username");
  const [direction, setDirection] = useState<AnimationDirection>("forward");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  // Set only when /auth/login/finish answers mfa_required. The token binds the
  // password-verified session to the pending second factor and lives here for
  // the few seconds the challenge is on screen.
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaMethods, setMfaMethods] = useState<MfaMethod[]>([]);
  const challenge = useMfaChallenge(mfaMethods, {
    // Declared below; only called once the ceremony starts, never during render.
    verifyWithSecurityKey: () => handleMfaSecurityKey(),
  });

  // Navigation functions
  const goToStep = (targetStep: LoginStep, dir: AnimationDirection) => {
    if (isTransitioning || loading) {
      return;
    }

    setDirection(dir);
    setIsTransitioning(true);
    setCurrentStep(targetStep);
  };

  const goNext = () => {
    const currentIndex = getLoginStepIndex(currentStep);
    const nextStep = getLoginStepByIndex(currentIndex + 1);
    if (nextStep) goToStep(nextStep, "forward");
  };

  const goBack = () => {
    const currentIndex = getLoginStepIndex(currentStep);
    const prevStep = getLoginStepByIndex(currentIndex - 1);
    if (prevStep) goToStep(prevStep, "backward");
  };

  const handleAnimationComplete = () => {
    setIsTransitioning(false);
  };

  // Step handlers
  const handleUsernameNext = (newUsername: string) => {
    setUsername(newUsername);
    goNext();
  };

  const handlePasswordSubmit = async (password: string) => {
    setLoading(true);

    try {
      const result = await login(username, password);
      if (result.ok === "mfa") {
        setMfaToken(result.mfaToken);
        setMfaMethods(result.methods);
        goNext();
        return;
      }
      if (result.ok) {
        toast.success(t("login.success"));
        // Page will be reloaded by login function
      } else {
        toast.error(t("login.failed"));
      }
    } catch (error) {
      toast.error(t("error.generic"));
    } finally {
      setLoading(false);
    }
  };

  // Both MFA paths end the same way: success reloads the page from useAuth, so
  // there is nothing to do here but report a failure into the challenge card.
  // `failureKey` is omitted when the caller reports for itself — the security
  // key path is driven by useMfaChallenge, which already knows how it went.
  const runMfa = async (
    attempt: () => Promise<{ ok: boolean | "mfa" }>,
    failureKey: string,
  ): Promise<string | null> => {
    setLoading(true);
    try {
      const result = await attempt();
      if (result.ok === true) {
        toast.success(t("login.success"));
        return null;
      }
      return failureKey;
    } catch {
      return "error.generic";
    } finally {
      setLoading(false);
    }
  };

  const handleMfaCode = async (code: string, method: MfaMethod) => {
    const failure = await runMfa(
      () => completeLoginMfa(mfaToken ?? "", code, method),
      "login.wizard.mfa.failed",
    );
    if (failure) challenge.fail(failure);
  };

  // useMfaChallenge reports this one itself, so it only hands back the key.
  const handleMfaSecurityKey = () =>
    runMfa(
      () => completeLoginMfaWebAuthn(mfaToken ?? ""),
      "login.wizard.mfa.webauthnFailed",
    );

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case "username":
        return <UsernameStep onNext={handleUsernameNext} initialValue={username} />;

      case "password":
        return (
          <PasswordStep
            username={username}
            onSubmit={handlePasswordSubmit}
            loading={loading}
          />
        );

      case "mfa":
        return (
          <MfaChallengeStep
            challenge={challenge}
            formId="login-mfa-form"
            onSubmitCode={handleMfaCode}
            loading={loading}
          />
        );

      default:
        return null;
    }
  };

  // Render footer
  const renderFooter = () => {
    if (currentStep === "username") {
      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/signup")}
            disabled={loading}
            className="transition-colors duration-160 ease w-full sm:w-auto"
          >
            {t("signup.createAccount")}
          </Button>

          <Button
            type="submit"
            form="login-username-form"
            disabled={loading}
            className="bg-c-1 text-c-foreground hover:bg-c-2 transition-colors duration-160 ease w-full sm:w-auto"
          >
            {t("setup.next")}
          </Button>
        </div>
      );
    }

    if (currentStep === "password" || currentStep === "mfa") {
      const isMfa = currentStep === "mfa";
      const primaryLabel = isMfa ? challenge.primaryOverride : "login.title";
      const primaryIsFallback = isMfa && challenge.primaryIsFallback;
      const secondaryLabel = (isMfa && challenge.secondaryOverride) || "setup.back";
      return (
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            // Inside the challenge, back walks to the factor chooser first;
            // only once there is nothing above it does it step to the password.
            onClick={() => {
              if (isMfa && challenge.goBack()) return;
              goBack();
            }}
            disabled={loading}
            className="transition-colors duration-160 ease"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t(secondaryLabel)}
          </Button>

          {primaryLabel !== null && (
            <Button
              type="submit"
              form={isMfa ? "login-mfa-form" : "login-password-form"}
              variant={primaryIsFallback ? "secondary" : undefined}
              disabled={loading || (isMfa && challenge.primaryDisabled)}
              className={
                primaryIsFallback
                  ? "transition-colors duration-160 ease"
                  : "bg-c-1 text-c-foreground hover:bg-c-2 transition-colors duration-160 ease"
              }
            >
              {loading ? t("loading") : t(primaryLabel ?? "login.title")}
            </Button>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <AuthLayoutShell fixedAspectRatio={true} footer={renderFooter()}>
      <div className="flex-1 min-h-0 h-full flex flex-col">
        <SetupTransition
          currentStep={getLoginStepIndex(currentStep)}
          direction={direction}
          onAnimationComplete={handleAnimationComplete}
        >
          {renderCurrentStep()}
        </SetupTransition>
      </div>
    </AuthLayoutShell>
  );
}
