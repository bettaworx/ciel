"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAgreementVersions, useLatestAgreement, useMe, queryKeys } from "@/lib/hooks/use-queries";
import { useAuth } from "@/lib/hooks/use-auth";
import { useApi } from "@/lib/api/use-api";
import type { components } from "@/lib/api/api";
import { Button } from "@/components/ui/button";
import { AuthLayoutShell } from "@/components/auth/AuthLayoutShell";
import { SetupTransition } from "@/components/setup/SetupTransition";
import { AgreementStep } from "@/components/shared/AgreementStep";
import { ChevronLeft } from "lucide-react";
import type { AnimationDirection } from "@/lib/config/setup-animation";

type AgreementWizardStep = "terms" | "privacy";

/**
 * AgreementWizard - Shown to logged-in users who need to accept updated agreements
 * If user declines, they are logged out and redirected to login page
 */
export function AgreementWizard() {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const { logout } = useAuth();
  const api = useApi();
  const queryClient = useQueryClient();
  
  // Directly check versions here without using useAgreementCheck to avoid circular dependencies
  const { data: me } = useMe();
  const { data: versions } = useAgreementVersions();
  
  // Custom mutation that doesn't refetch immediately during multi-step flow
  const acceptMutation = useMutation({
    mutationFn: async (body: components['schemas']['AcceptAgreementsRequest']) => {
      const result = await api.acceptAgreements(body);
      if (!result.ok) throw new Error(result.errorText);
    },
    // Don't refetch on success - we'll do it manually after all steps complete
    onSuccess: undefined,
  });
  
  // Calculate what needs updating directly
  const needsTerms = (me?.termsVersion ?? 0) < (versions?.termsVersion ?? 0);
  const needsPrivacy = (me?.privacyVersion ?? 0) < (versions?.privacyVersion ?? 0);

  // Fetch latest agreement documents from API - only fetch what's needed
  const { data: termsDoc, isLoading: termsLoading } = useLatestAgreement('terms', locale, needsTerms);
  const { data: privacyDoc, isLoading: privacyLoading } = useLatestAgreement('privacy', locale, needsPrivacy);

  // State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] = useState<AnimationDirection>("forward");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(false);

  // Agreement checkbox state
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);

  // Loading state - wait for agreements that need to be shown
  const loadingAgreements = (needsTerms && termsLoading) || (needsPrivacy && privacyLoading);
  
  // Determine which steps to show based on what needs updating
  const steps = useMemo((): AgreementWizardStep[] => {
    const s: AgreementWizardStep[] = [];
    if (needsTerms) s.push("terms");
    if (needsPrivacy) s.push("privacy");
    return s;
  }, [needsTerms, needsPrivacy]);

  const currentStep = steps[currentStepIndex];

  // Reset checkbox state when step changes
  useEffect(() => {
    if (currentStep === "terms") {
      setTermsChecked(false);
    } else if (currentStep === "privacy") {
      setPrivacyChecked(false);
    }
  }, [currentStep]);

  // Show message if no agreements need updating instead of auto-redirecting
  // Auto-redirect causes confusion and cache issues
  const showAlreadyAcceptedMessage = me && versions && !needsTerms && !needsPrivacy && !loadingAgreements;

  // Navigation functions
  const goNext = () => {
    if (isTransitioning || loading) return;
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setDirection("forward");
      setIsTransitioning(true);
      setCurrentStepIndex(nextIndex);
    }
  };

  const goBack = () => {
    if (isTransitioning || loading) return;
    
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setDirection("backward");
      setIsTransitioning(true);
      setCurrentStepIndex(prevIndex);
    }
  };

  const handleAnimationComplete = () => {
    setIsTransitioning(false);
  };

  // Accept handler - submits acceptance for current or remaining agreements
  const handleAgree = async () => {
    if (!versions) {
      toast.error(t("error.generic"));
      return;
    }

    setLoading(true);
    try {
      // Determine what to accept based on current step and remaining steps
      const body: {
        termsVersion?: number;
        privacyVersion?: number;
      } = {};

      if (currentStep === "terms") {
        body.termsVersion = versions.termsVersion;
        
        console.log('[AgreementWizard] Accepting terms, needsPrivacy:', needsPrivacy);
        
        // If privacy also needs updating and is next, we'll handle it on the next step
        // Otherwise, if privacy doesn't need updating, we're done
        if (!needsPrivacy) {
          // Only terms needed, submit and redirect
          console.log('[AgreementWizard] Only terms needed, redirecting to home');
          await acceptMutation.mutateAsync(body);
          // Refetch user data before redirecting
          await queryClient.refetchQueries({ queryKey: queryKeys.me });
          toast.success(t("agreements.accepted"));
          router.push("/");
          return;
        } else {
          // Privacy step comes next, just accept terms and move forward
          console.log('[AgreementWizard] Terms accepted, moving to privacy step');
          await acceptMutation.mutateAsync(body);
          console.log('[AgreementWizard] About to call goNext()');
          goNext();
          return;
        }
      } else if (currentStep === "privacy") {
        body.privacyVersion = versions.privacyVersion;
        
        // Privacy is the last step (or only step), submit and redirect
        await acceptMutation.mutateAsync(body);
        // Refetch user data before redirecting
        await queryClient.refetchQueries({ queryKey: queryKeys.me });
        toast.success(t("agreements.accepted"));
        router.push("/");
        return;
      }
    } catch (error) {
      console.error("[AgreementWizard] Failed to accept agreements:", error);
      toast.error(t("error.generic"));
    } finally {
      setLoading(false);
    }
  };

  // Decline handler - logs out user
  const handleDecline = async () => {
    setLoading(true);
    try {
      await logout();
      toast.info(t("agreements.declined"));
      router.push("/login");
    } catch (error) {
      console.error("Failed to logout:", error);
      toast.error(t("error.generic"));
    } finally {
      setLoading(false);
    }
  };

  // Render current step
  const renderCurrentStep = () => {
    // Show "already accepted" message if no agreements need updating
    if (showAlreadyAcceptedMessage) {
      return (
        <div className="flex flex-col h-full min-h-0 justify-center items-center p-8 text-center">
          <div className="space-y-4 max-w-md">
            <h2 className="text-2xl font-semibold">Already Up to Date</h2>
            <p className="text-muted-foreground">
              You have already accepted the latest terms and privacy policy. No action is needed.
            </p>
            <Button onClick={() => router.push("/")} className="mt-6">
              Go to Home
            </Button>
          </div>
        </div>
      );
    }

    if (loadingAgreements) {
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
            content={termsDoc?.content || ""}
            checked={termsChecked}
            onCheckedChange={setTermsChecked}
          />
        );

      case "privacy":
        return (
          <AgreementStep
            type="privacy"
            content={privacyDoc?.content || ""}
            checked={privacyChecked}
            onCheckedChange={setPrivacyChecked}
          />
        );

      default:
        return null;
    }
  };

  // Render footer
  const renderFooter = () => {
    // Don't show footer if already accepted
    if (showAlreadyAcceptedMessage) {
      return null;
    }

    const showBackButton = currentStepIndex > 0;

    if (currentStep === "terms") {
      const isAgreeDisabled = !termsChecked || loading || !versions;

      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="default"
            onClick={handleDecline}
            disabled={loading}
            className="transition-colors duration-160 ease"
          >
            {t("signup.wizard.terms.decline")} ({t("auth.logout")})
          </Button>

          <Button
            type="button"
            onClick={handleAgree}
            disabled={isAgreeDisabled}
            className="bg-c-1 text-c-foreground hover:bg-c-2 transition-colors duration-160 ease"
          >
            {loading ? t("loading") : t("signup.wizard.terms.agree")}
          </Button>
        </div>
      );
    }

    if (currentStep === "privacy") {
      const isAgreeDisabled = !privacyChecked || loading || !versions;

      return (
        <div className="flex items-center justify-between gap-2">
          {showBackButton && (
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
          )}

          <div className="flex gap-2 ml-auto">
            <Button
              type="button"
              variant="default"
              onClick={handleDecline}
              disabled={loading}
              className="transition-colors duration-160 ease"
            >
              {t("signup.wizard.privacy.decline")} ({t("auth.logout")})
            </Button>

            <Button
              type="button"
              onClick={handleAgree}
              disabled={isAgreeDisabled}
              className="bg-c-1 text-c-foreground hover:bg-c-2 transition-colors duration-160 ease"
            >
              {loading ? t("loading") : t("signup.wizard.privacy.agree")}
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

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
