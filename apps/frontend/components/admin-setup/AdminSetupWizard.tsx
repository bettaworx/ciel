"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useSetupLayout } from "@/components/setup/SetupLayoutContext";
import { AdminSetupFooter } from "./AdminSetupFooter";
import { createApiClient } from "@/lib/api/client";
import {
  type AdminSetupStep,
  ADMIN_SETUP_STEPS,
} from "@/lib/config/admin-setup-steps";
import { WelcomeStep } from "./WelcomeStep";
import { VerifyPasswordStep } from "./VerifyPasswordStep";
import { CreateAdminStep } from "./CreateAdminStep";
import { AdminProfileStep } from "./AdminProfileStep";
import { ServerInfoStep } from "./ServerInfoStep";
import { InviteSettingsStep } from "./InviteSettingsStep";
import { CompleteStep } from "./CompleteStep";
import { DisplayNameStep } from "@/components/setup/DisplayNameStep";
import { AvatarStep } from "@/components/setup/AvatarStep";
import { BioStep } from "@/components/setup/BioStep";
import { useUpdateProfile, useUpdateAvatar } from "@/lib/hooks/use-queries";

const STORAGE_KEY = "ciel_admin_setup_current_step";

const apiClient = createApiClient();

/**
 * AdminSetupWizard is the main component for the server setup flow.
 * It manages step navigation, animations, and API calls for initial server setup.
 */
export function AdminSetupWizard() {
  const router = useRouter();
  const t = useTranslations("adminSetup");
  const { setProgress, setFooter } = useSetupLayout();

  // State
  const [currentStep, setCurrentStep] = useState<AdminSetupStep>("welcome");
  const [isLoading, setIsLoading] = useState(false);
  const [profileSubStep, setProfileSubStep] = useState<'display-name' | 'avatar' | 'bio'>('display-name');

  // Profile update hooks
  const updateProfile = useUpdateProfile();
  const updateAvatar = useUpdateAvatar();

  // Setup data
  const [setupToken, setSetupToken] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState("");
  const [serverName, setServerName] = useState("Ciel");
  const [serverDescription, setServerDescription] = useState("");
  const [serverIconMediaId, setServerIconMediaId] = useState<string | null>(null);
  const [inviteOnly, setInviteOnly] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  // Initialize: check setup status and determine starting point
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await apiClient.setupStatus();
        
        if (!response.ok) {
          console.error("Failed to check setup status:", response.errorText);
          toast.error(t("error.setupFailed"));
          return;
        }

        const status = response.data;

        if (status.setupCompleted) {
          // Setup already completed - redirect to home
          router.push("/");
          return;
        }

        if (status.adminExists) {
          // Admin account created - check if logged in by calling /api/v1/me
          const meResult = await apiClient.me();
          if (!meResult.ok) {
            // Not logged in or token invalid - redirect to login with return URL
            router.push("/login?redirect=/server-setup");
            return;
          }

          // Logged in - continue setup from profile step
          setProfileSubStep('display-name'); // Reset sub-step
          const savedStep = localStorage.getItem(STORAGE_KEY);
          if (savedStep && ADMIN_SETUP_STEPS.includes(savedStep as AdminSetupStep)) {
            const stepIndex = ADMIN_SETUP_STEPS.indexOf(savedStep as AdminSetupStep);
            if (stepIndex >= ADMIN_SETUP_STEPS.indexOf("admin-profile")) {
              setCurrentStep(savedStep as AdminSetupStep);
              window.history.replaceState({ step: savedStep }, "", "/server-setup");
              return;
            }
          }
          setCurrentStep("admin-profile");
          window.history.replaceState({ step: "admin-profile" }, "", "/server-setup");
        } else {
          // Admin account not created yet - start from beginning
          const savedStep = localStorage.getItem(STORAGE_KEY);
          if (savedStep && ADMIN_SETUP_STEPS.includes(savedStep as AdminSetupStep)) {
            const stepIndex = ADMIN_SETUP_STEPS.indexOf(savedStep as AdminSetupStep);
            // Only restore if before admin-profile step
            if (stepIndex < ADMIN_SETUP_STEPS.indexOf("admin-profile")) {
              setCurrentStep(savedStep as AdminSetupStep);
              window.history.replaceState({ step: savedStep }, "", "/server-setup");
              return;
            }
          }
          setCurrentStep("welcome");
          window.history.replaceState({ step: "welcome" }, "", "/server-setup");
        }
      } catch (error) {
        console.error("Failed to check setup status:", error);
        toast.error(t("error.setupFailed"));
      }
    };

    checkStatus();
  }, [router, t]);

  // Save current step to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentStep);
  }, [currentStep]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const targetStep = event.state?.step as AdminSetupStep | undefined;

      if (!targetStep || !ADMIN_SETUP_STEPS.includes(targetStep)) {
        return;
      }

      setCurrentStep(targetStep);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentStep]);

  // Navigation functions
  const goToStep = useCallback((targetStep: AdminSetupStep) => {
    window.history.pushState({ step: targetStep }, "", "/server-setup");
    setCurrentStep(targetStep);
  }, []);

  const goNext = useCallback(() => {
    const currentIndex = ADMIN_SETUP_STEPS.indexOf(currentStep);
    const nextStep = ADMIN_SETUP_STEPS[currentIndex + 1];
    if (nextStep) goToStep(nextStep);
  }, [currentStep, goToStep]);

  const goBack = useCallback(() => {
    const currentIndex = ADMIN_SETUP_STEPS.indexOf(currentStep);
    const prevStep = ADMIN_SETUP_STEPS[currentIndex - 1];
    if (prevStep) goToStep(prevStep);
  }, [currentStep, goToStep]);

  // Profile sub-step navigation
  const goNextProfileSubStep = useCallback(() => {
    if (profileSubStep === 'display-name') {
      setProfileSubStep('avatar');
    } else if (profileSubStep === 'avatar') {
      setProfileSubStep('bio');
    } else if (profileSubStep === 'bio') {
      // Bio完了後は次のメインステップへ
      goNext();
    }
  }, [profileSubStep, goNext]);

  const goBackProfileSubStep = useCallback(() => {
    if (profileSubStep === 'bio') {
      setProfileSubStep('avatar');
    } else if (profileSubStep === 'avatar') {
      setProfileSubStep('display-name');
    } else if (profileSubStep === 'display-name') {
      // Display name から戻る = 前のメインステップへ
      goBack();
    }
  }, [profileSubStep, goBack]);

  // API handlers
  const handleVerifyPassword = async (password: string) => {
    setIsLoading(true);
    try {
      const result = await apiClient.setupVerifyPassword({ password });
      if (!result.ok || !result.data.valid || !result.data.setupToken) {
        toast.error(t("verifyPassword.error"));
        return false;
      }
      setSetupToken(result.data.setupToken);
      goNext();
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async (username: string, password: string) => {
    if (!setupToken) {
      toast.error(t("error.setupFailed"));
      return false;
    }

    setIsLoading(true);
    try {
      const result = await apiClient.setupCreateAdmin({
        setupToken,
        username,
        password,
      });

      if (!result.ok) {
        toast.error(t("createAdmin.error"));
        return false;
      }

      setAdminUsername(username);
      
      // Auto-login: The server sets an httpOnly cookie with the token
      // Save user info to localStorage for UI purposes
      const authState = {
        status: 'ready' as const,
        user: result.data.user,
        error: null,
      };
      localStorage.setItem("ciel-auth", JSON.stringify(authState));
      
      // Reload page - initialization logic will detect admin exists and continue from admin-profile
      window.location.reload();
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminProfileComplete = () => {
    // Profile setup is optional, just move to next step
    goNext();
  };

  // Profile update handlers
  const handleProfileDisplayName = async (displayName: string | null) => {
    if (displayName) {
      try {
        await updateProfile.mutateAsync({ displayName });
        toast.success(t("setup.success"));
      } catch {
        toast.error(t("setup.error"));
        return;
      }
    }
    goNextProfileSubStep();
  };

  const handleProfileAvatar = async (file: File | null) => {
    if (file) {
      try {
        await updateAvatar.mutateAsync(file);
        toast.success(t("setup.success"));
      } catch {
        toast.error(t("setup.error"));
        return;
      }
    }
    goNextProfileSubStep();
  };

  const handleProfileBio = async (bio: string | null) => {
    if (bio) {
      try {
        await updateProfile.mutateAsync({ bio });
        toast.success(t("setup.success"));
      } catch {
        toast.error(t("setup.error"));
        // Continue even on error
      }
    }
    goNextProfileSubStep();
  };

  const handleServerInfoNext = (
    name: string,
    description: string,
    iconMediaId: string | null
  ) => {
    setServerName(name);
    setServerDescription(description);
    setServerIconMediaId(iconMediaId);
    goNext();
  };

  const handleInviteSettingsComplete = async (
    inviteOnlyEnabled: boolean,
    code: string
  ) => {
    setInviteOnly(inviteOnlyEnabled);
    setInviteCode(code);

    // Complete the setup (using cookie-based auth)
    const result = await apiClient.setupComplete({
      serverName,
      serverDescription: serverDescription || undefined,
      serverIconMediaId: serverIconMediaId || undefined,
      inviteOnly: inviteOnlyEnabled,
      inviteCode: inviteOnlyEnabled ? code : undefined,
    });

    if (!result.ok) {
      toast.error(t("error.completeFailed"));
      return false;
    }

    goNext();
    return true;
  };

  const handleGoToHome = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    router.push("/");
  }, [router]);

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case "welcome":
        return <WelcomeStep />;

      case "verify-password":
        return <VerifyPasswordStep onVerify={handleVerifyPassword} loading={isLoading} />;

      case "create-admin":
        return <CreateAdminStep onCreate={handleCreateAdmin} loading={isLoading} />;

      case "admin-profile":
        if (profileSubStep === 'display-name') {
          return (
            <DisplayNameStep
              onNext={handleProfileDisplayName}
              loading={updateProfile.isPending}
            />
          );
        } else if (profileSubStep === 'avatar') {
          return (
            <AvatarStep
              onNext={handleProfileAvatar}
              loading={updateAvatar.isPending}
            />
          );
        } else if (profileSubStep === 'bio') {
          return (
            <BioStep
              onComplete={handleProfileBio}
              loading={updateProfile.isPending}
            />
          );
        }
        return null;

      case "server-info":
        return (
          <ServerInfoStep
            onNext={handleServerInfoNext}
            initialName={serverName}
            initialDescription={serverDescription}
            initialIconMediaId={serverIconMediaId}
          />
        );

      case "invite-settings":
        return (
          <InviteSettingsStep
            onComplete={handleInviteSettingsComplete}
            initialInviteOnly={inviteOnly}
            initialInviteCode={inviteCode}
          />
        );

      case "complete":
        return (
          <CompleteStep
            adminUsername={adminUsername}
            serverName={serverName}
            inviteOnly={inviteOnly}
          />
        );

      default:
        return null;
    }
  };

  // Update progress and footer
  useEffect(() => {
    const currentIndex = ADMIN_SETUP_STEPS.indexOf(currentStep);
    const totalSteps = ADMIN_SETUP_STEPS.length;

    // Show progress for all steps except welcome and complete
    const showProgress = currentStep !== "welcome" && currentStep !== "complete";

    setProgress({
      visible: showProgress,
      currentStep: currentIndex + 1,
      totalSteps,
    });

    // Setup footer for current step
    setFooter(
      <AdminSetupFooter
        currentStep={currentStep}
        profileSubStep={currentStep === 'admin-profile' ? profileSubStep : undefined}
        isLoading={isLoading}
        loadingProfile={updateProfile.isPending}
        loadingAvatar={updateAvatar.isPending}
        onBack={currentStep === 'admin-profile' ? goBackProfileSubStep : goBack}
        onNext={currentStep === 'admin-profile' ? goNextProfileSubStep : goNext}
        onSkip={currentStep === 'admin-profile' ? goNextProfileSubStep : undefined}
        onStart={goNext}
        onGoToTimeline={handleGoToHome}
      />
    );

    return () => {
      setFooter(null);
    };
  }, [currentStep, profileSubStep, isLoading, updateProfile.isPending, updateAvatar.isPending, setFooter, setProgress, goBack, goNext, goBackProfileSubStep, goNextProfileSubStep, handleGoToHome]);

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col">
      {renderCurrentStep()}
    </div>
  );
}
