"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DisplayNameStep } from "@/components/setup/DisplayNameStep";
import { AvatarStep } from "@/components/setup/AvatarStep";
import { BioStep } from "@/components/setup/BioStep";
import { useUpdateProfile, useUpdateAvatar } from "@/lib/hooks/use-queries";
import { toast } from "sonner";

interface AdminProfileStepProps {
  onComplete: () => void;
  adminToken: string | null;
}

type ProfileSubStep = "display-name" | "avatar" | "bio";

/**
 * AdminProfileStep reuses existing profile setup components
 * This step is skippable
 */
export function AdminProfileStep({ onComplete, adminToken }: AdminProfileStepProps) {
  const t = useTranslations("setup");
  const updateProfile = useUpdateProfile();
  const updateAvatar = useUpdateAvatar();
  const [currentSubStep, setCurrentSubStep] = useState<ProfileSubStep>("display-name");

  const handleDisplayNameNext = async (displayName: string | null) => {
    if (displayName) {
      try {
        await updateProfile.mutateAsync({ displayName });
        toast.success(t("success"));
      } catch {
        toast.error(t("error"));
        return;
      }
    }
    setCurrentSubStep("avatar");
  };

  const handleDisplayNameSkip = () => {
    setCurrentSubStep("avatar");
  };

  const handleAvatarNext = async (file: File | null) => {
    if (file) {
      try {
        await updateAvatar.mutateAsync(file);
        toast.success(t("success"));
      } catch {
        toast.error(t("error"));
        return;
      }
    }
    setCurrentSubStep("bio");
  };

  const handleAvatarSkip = () => {
    setCurrentSubStep("bio");
  };

  const handleBioComplete = async (bio: string | null) => {
    if (bio) {
      try {
        await updateProfile.mutateAsync({ bio });
        toast.success(t("success"));
      } catch {
        toast.error(t("error"));
        // Continue even on error
      }
    }
    onComplete();
  };

  const handleBioSkip = () => {
    onComplete();
  };

  switch (currentSubStep) {
    case "display-name":
      return (
        <DisplayNameStep
          onNext={handleDisplayNameNext}
          onSkip={handleDisplayNameSkip}
          loading={updateProfile.isPending}
        />
      );

    case "avatar":
      return (
        <AvatarStep
          onNext={handleAvatarNext}
          onSkip={handleAvatarSkip}
          loading={updateAvatar.isPending}
        />
      );

    case "bio":
      return (
        <BioStep
          onComplete={handleBioComplete}
          onSkip={handleBioSkip}
          loading={updateProfile.isPending}
        />
      );

    default:
      return null;
  }
}
