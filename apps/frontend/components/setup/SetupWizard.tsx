"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { SetupTransition } from "@/components/setup/SetupTransition";
import { WelcomeStep } from "@/components/setup/WelcomeStep";
import { DisplayNameStep } from "@/components/setup/DisplayNameStep";
import { AvatarStep } from "@/components/setup/AvatarStep";
import { BioStep } from "@/components/setup/BioStep";
import { CompleteStep } from "@/components/setup/CompleteStep";
import { SetupFooter } from "@/components/setup/SetupFooter";
import { useSetupLayout } from "@/components/setup/SetupLayoutContext";
import { useUpdateProfile, useUpdateAvatar } from "@/lib/hooks/use-queries";
import {
  type SetupStep,
  getStepIndex,
  getStepByIndex,
  getTotalSteps,
  getCurrentStepNumber,
  isValidStep,
} from "@/lib/config/setup-steps";
import type { AnimationDirection } from "@/lib/config/setup-animation";

const STORAGE_KEY = "ciel_setup_current_step";

/**
 * SetupWizard is the main component for the setup flow.
 * It manages step navigation, animations, and API calls.
 */
export function SetupWizard() {
  const router = useRouter();
  const t = useTranslations();
  const updateProfile = useUpdateProfile();
  const updateAvatar = useUpdateAvatar();
  const { setProgress, setFooter } = useSetupLayout();

  // State
  const [currentStep, setCurrentStep] = useState<SetupStep>("welcome");
  const [direction, setDirection] = useState<AnimationDirection>("forward");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Load saved step on mount
  useEffect(() => {
    const savedStep = localStorage.getItem(STORAGE_KEY);
    if (savedStep && isValidStep(savedStep)) {
      setCurrentStep(savedStep);
      // Initialize history state with saved step
      window.history.replaceState({ step: savedStep }, "", "/setup");
    } else {
      // Initialize history state with welcome step
      window.history.replaceState({ step: "welcome" }, "", "/setup");
    }
  }, []); // Only run on mount

  // Save current step to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentStep);
  }, [currentStep]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const targetStep = event.state?.step as SetupStep | undefined;

      if (!targetStep || !isValidStep(targetStep)) {
        return;
      }

      // Determine direction based on step indices
      const currentIndex = getStepIndex(currentStep);
      const targetIndex = getStepIndex(targetStep);
      const dir: AnimationDirection =
        targetIndex > currentIndex ? "forward" : "backward";

      setDirection(dir);
      setCurrentStep(targetStep);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentStep]);

  // Navigation functions
  const goToStep = (targetStep: SetupStep, dir: AnimationDirection) => {
    if (isTransitioning) {
      return;
    }

    setDirection(dir);
    setIsTransitioning(true);

    // Update browser history
    window.history.pushState({ step: targetStep }, "", "/setup");

    setCurrentStep(targetStep);
  };

  const goNext = () => {
    const currentIndex = getStepIndex(currentStep);
    const nextStep = getStepByIndex(currentIndex + 1);
    if (nextStep) goToStep(nextStep, "forward");
  };

  const goBack = () => {
    const currentIndex = getStepIndex(currentStep);
    const prevStep = getStepByIndex(currentIndex - 1);
    if (prevStep) goToStep(prevStep, "backward");
  };

  const goSkip = () => {
    // Skip is treated as forward
    goNext();
  };

  const handleAnimationComplete = () => {
    setIsTransitioning(false);
  };

  // API handlers
  const handleDisplayNameNext = async (displayName: string | null) => {
    if (displayName) {
      try {
        await updateProfile.mutateAsync({ displayName });
        toast.success(t("setup.success"));
      } catch {
        toast.error(t("setup.error"));
        return; // Don't navigate on error
      }
    }
    goNext();
  };

  const handleAvatarNext = async (file: File | null) => {
    if (file) {
      try {
        await updateAvatar.mutateAsync(file);
        toast.success(t("setup.success"));
      } catch {
        toast.error(t("setup.error"));
        return; // Don't navigate on error
      }
    }
    goNext();
  };

  const handleBioComplete = async (bio: string | null) => {
    if (bio) {
      try {
        await updateProfile.mutateAsync({ bio });
        toast.success(t("setup.success"));
      } catch {
        toast.error(t("setup.error"));
        // Continue to complete screen even on error
      }
    }
    goNext();
  };

  const handleGoToTimeline = () => {
    // Clear saved step
    localStorage.removeItem(STORAGE_KEY);
    router.push("/");
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case "welcome":
        return <WelcomeStep />;

      case "display-name":
        return (
          <DisplayNameStep
            onNext={handleDisplayNameNext}
            loading={updateProfile.isPending}
          />
        );

      case "avatar":
        return (
          <AvatarStep
            onNext={handleAvatarNext}
            loading={updateAvatar.isPending}
          />
        );

      case "bio":
        return (
          <BioStep
            onComplete={handleBioComplete}
            loading={updateProfile.isPending}
          />
        );

      case "complete":
        return <CompleteStep />;

      default:
        return null;
    }
  };

  useEffect(() => {
    const currentStepNumber = getCurrentStepNumber(currentStep);
    setProgress({
      visible: currentStepNumber !== null,
      currentStep: currentStepNumber ?? 0,
      totalSteps: getTotalSteps(),
    });

    setFooter(
      <SetupFooter
        currentStep={currentStep}
        loadingProfile={updateProfile.isPending}
        loadingAvatar={updateAvatar.isPending}
        onBack={goBack}
        onNext={goNext}
        onSkip={goSkip}
        onStart={goNext}
        onGoToTimeline={handleGoToTimeline}
      />
    );

    return () => {
      setFooter(null);
    };
  }, [
    currentStep,
    updateProfile.isPending,
    updateAvatar.isPending,
    goBack,
    goNext,
    goSkip,
    handleGoToTimeline,
    setFooter,
    setProgress,
  ]);

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col">
      <SetupTransition
        currentStep={getStepIndex(currentStep)}
        direction={direction}
        onAnimationComplete={handleAnimationComplete}
      >
        {renderCurrentStep()}
      </SetupTransition>
    </div>
  );
}
