"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/use-auth";
import { useAgreementVersions } from "@/lib/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { AuthLayoutShell } from "@/components/auth/AuthLayoutShell";
import { SetupTransition } from "@/components/setup/SetupTransition";
import { AgreementStep } from "@/components/shared/AgreementStep";
import { UsernameStep } from "@/components/auth/signup/UsernameStep";
import { PasswordStep } from "@/components/auth/signup/PasswordStep";
import { InviteCodeStep } from "@/components/auth/signup/InviteCodeStep";
import { ChevronLeft } from "lucide-react";
import {
  type SignupStep,
  getSignupStepIndex,
  getSignupStepByIndex,
} from "@/lib/config/auth-steps";
import type { AnimationDirection } from "@/lib/config/setup-animation";
import { createApiClient } from "@/lib/api/client";
import type { components } from "@/lib/api/api";

type ServerInfo = components["schemas"]["ServerInfo"];

const apiClient = createApiClient();

/**
 * SignupWizard is the main component for the signup flow.
 * It manages step navigation, animations, and API calls.
 * Dynamically adds invite-code step if server is in invite-only mode.
 */
export function SignupWizard() {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const { register } = useAuth();
  const { data: agreementVersions } = useAgreementVersions();

  // Server info state
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [loadingServerInfo, setLoadingServerInfo] = useState(true);

  // Agreement content state
  const [termsContent, setTermsContent] = useState<string>("");
  const [privacyContent, setPrivacyContent] = useState<string>("");
  const [loadingAgreements, setLoadingAgreements] = useState(true);

  // State
  const [currentStep, setCurrentStep] = useState<SignupStep>("terms");
  const [direction, setDirection] = useState<AnimationDirection>("forward");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Agreement acceptance state
  const [agreedVersions, setAgreedVersions] = useState({
    terms: 0,
    privacy: 0,
  });

  // Agreement checkbox state for agreement steps
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  // Fetch server info on mount
  useEffect(() => {
    const fetchServerInfo = async () => {
      try {
        const result = await apiClient.serverInfo();
        if (result.ok) {
          setServerInfo(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch server info:", error);
      } finally {
        setLoadingServerInfo(false);
      }
    };

    fetchServerInfo();
  }, []);

  // Load agreement content from API
  useEffect(() => {
    const loadAgreementContent = async () => {
      try {
        const [termsRes, privacyRes] = await Promise.all([
          apiClient.getLatestAgreement('terms', locale),
          apiClient.getLatestAgreement('privacy', locale),
        ]);

        if (termsRes.ok) {
          setTermsContent(termsRes.data.content);
        }
        if (privacyRes.ok) {
          setPrivacyContent(privacyRes.data.content);
        }
      } catch (error) {
        console.error("Failed to load agreement content:", error);
      } finally {
        setLoadingAgreements(false);
      }
    };

    loadAgreementContent();
  }, [locale]);

  // Reset checkbox state when returning to agreement steps
  useEffect(() => {
    if (currentStep === "terms") {
      setTermsChecked(false);
    } else if (currentStep === "privacy") {
      setPrivacyChecked(false);
    }
  }, [currentStep]);

  // Determine available steps based on server config
  const getAvailableSteps = (): SignupStep[] => {
    // signupEnabled === false means invite-only mode is enabled
    if (serverInfo && !serverInfo.signupEnabled) {
      return ["terms", "privacy", "username", "password", "invite-code"];
    }
    return ["terms", "privacy", "username", "password"];
  };

  // Navigation functions
  const goToStep = (targetStep: SignupStep, dir: AnimationDirection) => {
    if (isTransitioning || loading) {
      return;
    }

    setDirection(dir);
    setIsTransitioning(true);
    setCurrentStep(targetStep);
  };

  const goNext = () => {
    const availableSteps = getAvailableSteps();
    const currentIndex = availableSteps.indexOf(currentStep);
    const nextStep = availableSteps[currentIndex + 1];
    if (nextStep) goToStep(nextStep, "forward");
  };

  const goBack = () => {
    const availableSteps = getAvailableSteps();
    const currentIndex = availableSteps.indexOf(currentStep);
    const prevStep = availableSteps[currentIndex - 1];
    if (prevStep) goToStep(prevStep, "backward");
  };

  const handleAnimationComplete = () => {
    setIsTransitioning(false);
  };

  // Agreement handlers
  const handleTermsAgree = () => {
    // Use version from API if available, otherwise default to 1
    const termsVersion = agreementVersions?.termsVersion || 1;
    setAgreedVersions((prev) => ({
      ...prev,
      terms: termsVersion,
    }));
    goNext();
  };

  const handleTermsDecline = () => {
    router.push("/");
  };

  const handlePrivacyAgree = () => {
    // Use version from API if available, otherwise default to 1
    const privacyVersion = agreementVersions?.privacyVersion || 1;
    setAgreedVersions((prev) => ({
      ...prev,
      privacy: privacyVersion,
    }));
    goNext();
  };

  const handlePrivacyDecline = () => {
    router.push("/");
  };

  // Step handlers
  const handleUsernameNext = (newUsername: string) => {
    setUsername(newUsername);
    goNext();
  };

  const handlePasswordNext = (newPassword: string) => {
    setPassword(newPassword);
    goNext();
  };

  const handlePasswordSubmit = async (newPassword: string) => {
    setPassword(newPassword);
    setLoading(true);

    try {
      const result = await register(
        username,
        newPassword,
        agreedVersions.terms,
        agreedVersions.privacy,
      );
      if (result.ok) {
        toast.success(t("signup.success"));
        // Redirect to setup wizard welcome page
        router.push("/setup");
      } else {
        toast.error(t("signup.failed"));
      }
    } catch (error) {
      toast.error(t("error.generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleInviteCodeSubmit = async (code: string) => {
    setInviteCode(code);
    setLoading(true);

    try {
      const result = await register(
        username,
        password,
        agreedVersions.terms,
        agreedVersions.privacy,
        code,
      );
      if (result.ok) {
        toast.success(t("signup.success"));
        router.push("/setup");
      } else {
        // Show invite-specific error message
        toast.error(t("signup.wizard.inviteCode.invalid"));
      }
    } catch (error) {
      toast.error(t("error.generic"));
    } finally {
      setLoading(false);
    }
  };

  // Render current step
  const renderCurrentStep = () => {
    // Show loading state only if server info or agreements haven't loaded yet
    // and we're still on the first step
    if ((loadingServerInfo || loadingAgreements) && currentStep === "terms") {
      return (
        <div className="flex flex-col h-full min-h-0 justify-center items-center">
          <div className="animate-pulse space-y-4 w-full max-w-md">
            <div className="h-8 w-64 bg-muted rounded mx-auto"></div>
            <div className="h-4 w-96 bg-muted rounded mx-auto"></div>
            <div className="h-10 w-full bg-muted rounded"></div>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case "terms":
        return (
          <AgreementStep
            type="terms"
            content={termsContent}
            checked={termsChecked}
            onCheckedChange={setTermsChecked}
          />
        );

      case "privacy":
        return (
          <AgreementStep
            type="privacy"
            content={privacyContent}
            checked={privacyChecked}
            onCheckedChange={setPrivacyChecked}
          />
        );

      case "username":
        return (
          <UsernameStep onNext={handleUsernameNext} initialValue={username} />
        );

      case "password":
        return (
          <PasswordStep
            username={username}
            onSubmit={
              serverInfo && !serverInfo.signupEnabled
                ? handlePasswordNext
                : handlePasswordSubmit
            }
            loading={loading}
          />
        );

      case "invite-code":
        return (
          <InviteCodeStep onSubmit={handleInviteCodeSubmit} loading={loading} />
        );

      default:
        return null;
    }
  };

  // Render footer
  const renderFooter = () => {
    // Agreement steps have custom footer with Agree/Decline buttons
    if (currentStep === "terms") {
      const isAgreeDisabled = !termsChecked || loading || !agreementVersions;

      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="default"
            onClick={handleTermsDecline}
            disabled={loading}
            className="transition-colors duration-160 ease"
          >
            {t("signup.wizard.terms.decline")}
          </Button>

          <Button
            type="button"
            onClick={handleTermsAgree}
            disabled={isAgreeDisabled}
            className="bg-c-1 text-c-foreground hover:bg-c-2 transition-colors duration-160 ease"
          >
            {t("signup.wizard.terms.agree")}
          </Button>
        </div>
      );
    }

    if (currentStep === "privacy") {
      const isAgreeDisabled = !privacyChecked || loading || !agreementVersions;

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

          <div className="flex gap-2">
            <Button
              type="button"
              variant="default"
              onClick={handlePrivacyDecline}
              disabled={loading}
              className="transition-colors duration-160 ease"
            >
              {t("signup.wizard.privacy.decline")}
            </Button>

            <Button
              type="button"
              onClick={handlePrivacyAgree}
              disabled={isAgreeDisabled}
              className="bg-c-1 text-c-foreground hover:bg-c-2 transition-colors duration-160 ease"
            >
              {t("signup.wizard.privacy.agree")}
            </Button>
          </div>
        </div>
      );
    }

    if (currentStep === "username") {
      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={goBack}
            disabled={loading || loadingServerInfo}
            className="transition-colors duration-160 ease w-full sm:w-auto"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t("setup.back")}
          </Button>

          <Button
            type="submit"
            form="signup-username-form"
            disabled={loading || loadingServerInfo}
            className="bg-c-1 text-c-foreground hover:bg-c-2 transition-colors duration-160 ease w-full sm:w-auto"
          >
            {t("setup.next")}
          </Button>
        </div>
      );
    }

    if (currentStep === "password") {
      const isInviteOnly = serverInfo && !serverInfo.signupEnabled;
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
            form="signup-password-form"
            disabled={loading}
            className="bg-c-1 text-c-foreground hover:bg-c-2 transition-colors duration-160 ease"
          >
            {loading
              ? t("loading")
              : isInviteOnly
                ? t("setup.next")
                : t("signup.createAccount")}
          </Button>
        </div>
      );
    }

    if (currentStep === "invite-code") {
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
            form="signup-invite-code-form"
            disabled={loading}
            className="bg-c-1 text-c-foreground hover:bg-c-2 transition-colors duration-160 ease"
          >
            {loading ? t("loading") : t("signup.createAccount")}
          </Button>
        </div>
      );
    }

    return null;
  };

  const availableSteps = getAvailableSteps();
  const currentStepIndex = availableSteps.indexOf(currentStep);

  return (
    <AuthLayoutShell fixedAspectRatio={true} footer={renderFooter()}>
      <div className="flex-1 min-h-0 h-full flex flex-col">
        <SetupTransition
          currentStep={currentStepIndex}
          direction={direction}
          onAnimationComplete={handleAnimationComplete}
        >
          {renderCurrentStep()}
        </SetupTransition>
      </div>
    </AuthLayoutShell>
  );
}
