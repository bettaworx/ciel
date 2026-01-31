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
import { ChevronLeft } from "lucide-react";
import {
  type LoginStep,
  getLoginStepIndex,
  getLoginStepByIndex,
} from "@/lib/config/auth-steps";
import type { AnimationDirection } from "@/lib/config/setup-animation";

/**
 * LoginWizard is the main component for the login flow.
 * It manages step navigation, animations, and API calls.
 */
export function LoginWizard() {
  const router = useRouter();
  const t = useTranslations();
  const { login } = useAuth();

  // State
  const [currentStep, setCurrentStep] = useState<LoginStep>("username");
  const [direction, setDirection] = useState<AnimationDirection>("forward");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

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

    if (currentStep === "password") {
      return (
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={goBack}
            disabled={loading}
            className="transition-colors duration-160 ease"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t("setup.back")}
          </Button>

          <Button
            type="submit"
            form="login-password-form"
            disabled={loading}
            className="bg-c-1 text-c-foreground hover:bg-c-2 transition-colors duration-160 ease"
          >
            {loading ? t("loading") : t("login.title")}
          </Button>
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
