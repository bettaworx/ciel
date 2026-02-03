"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Globe, ChevronLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Locale } from "@/i18n/constants";
import { setClientLocale } from "@/i18n/client-locale";
import type { AdminSetupStep } from "@/lib/config/admin-setup-steps";

interface AdminSetupFooterProps {
  currentStep: AdminSetupStep;
  profileSubStep?: 'display-name' | 'avatar' | 'bio';
  isLoading: boolean;
  loadingProfile?: boolean;
  loadingAvatar?: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip?: () => void;
  onStart: () => void;
  onGoToTimeline: () => void;
  onChangeLocale?: (locale: Locale) => void;
}

export function AdminSetupFooter({
  currentStep,
  profileSubStep,
  isLoading,
  loadingProfile = false,
  loadingAvatar = false,
  onBack,
  onNext,
  onSkip,
  onStart,
  onGoToTimeline,
  onChangeLocale,
}: AdminSetupFooterProps) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

	const handleLocaleChange = (locale: Locale) => {
		if (onChangeLocale) {
			onChangeLocale(locale);
			return;
		}

		startTransition(() => {
			setClientLocale(locale);
			window.dispatchEvent(new Event('ciel:locale-change'));
		});
	};

  // Welcome step - show language selector and start button
  if (currentStep === "welcome") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" disabled={isPending} className="w-full sm:w-auto">
              <Globe className="w-4 h-4 mr-2" />
              {t("adminSetup.welcome.changeLanguage")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleLocaleChange("ja")}>
              {t("language.japanese")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLocaleChange("en")}>
              {t("language.english")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          onClick={onStart}
          className="bg-c-1 text-c-foreground hover:bg-c-2 transition-colors duration-160 ease w-full sm:w-auto"
        >
          {t("adminSetup.welcome.start")}
        </Button>
      </div>
    );
  }

  // Complete step - show back button and go to home button
  if (currentStep === "complete") {
    return (
      <div className="flex items-center justify-end">
        <Button
          onClick={onGoToTimeline}
          className="bg-c-1 text-c-foreground hover:bg-c-2 transition-colors duration-160 ease w-full sm:w-auto"
        >
          {t("adminSetup.complete.goToHome")}
        </Button>
      </div>
    );
  }

  // Special handling for admin-profile step with sub-steps
  if (currentStep === "admin-profile" && profileSubStep) {
    const loading = profileSubStep === 'avatar' ? loadingAvatar : loadingProfile;
    const formId = 
      profileSubStep === 'display-name' 
        ? 'setup-display-name-form'
        : profileSubStep === 'avatar'
          ? 'setup-avatar-form'
          : 'setup-bio-form';
    
    const nextLabel = profileSubStep === 'bio' ? t("setup.complete") : t("setup.next");
    const nextLoadingLabel = profileSubStep === 'avatar' 
      ? t("setup.avatar.uploading") 
      : t("setup.saving");

    return (
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={loading}
          className="transition-colors duration-160 ease"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t("adminSetup.back")}
        </Button>

        <div className="flex gap-2">
          {onSkip && (
            <Button
              type="button"
              variant="secondary"
              onClick={onSkip}
              disabled={loading}
              className="transition-colors duration-160 ease"
            >
              {t("setup.skip")}
            </Button>
          )}

          <Button
            type="submit"
            form={formId}
            disabled={loading}
            className="bg-c-1 text-c-foreground hover:bg-c-2 transition-colors duration-160 ease"
          >
            {loading ? nextLoadingLabel : nextLabel}
          </Button>
        </div>
      </div>
    );
  }

  // server-info step
  if (currentStep === "server-info") {
    return (
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={isLoading}
          className="transition-colors duration-160 ease"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t("adminSetup.back")}
        </Button>

        <Button
          type="submit"
          form="admin-setup-server-info-form"
          disabled={isLoading}
          className="bg-c-1 text-c-foreground hover:bg-c-2 transition-colors duration-160 ease"
        >
          {isLoading ? t("adminSetup.saving") : t("adminSetup.next")}
        </Button>
      </div>
    );
  }

  // invite-settings step
  if (currentStep === "invite-settings") {
    return (
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={isLoading}
          className="transition-colors duration-160 ease"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t("adminSetup.back")}
        </Button>

        <Button
          type="submit"
          form="admin-setup-invite-settings-form"
          disabled={isLoading}
          className="bg-c-1 text-c-foreground hover:bg-c-2 transition-colors duration-160 ease"
        >
          {isLoading ? t("adminSetup.saving") : t("adminSetup.complete")}
        </Button>
      </div>
    );
  }

  // Determine if this step has a form that needs to be submitted
  const formId =
    currentStep === "verify-password"
      ? "verify-password-form"
      : currentStep === "create-admin"
        ? "create-admin-form"
        : undefined;

  // Determine which steps show the back button
  const showBackButton = currentStep === "verify-password" || currentStep === "create-admin";

  // Get appropriate button labels
  const nextLabel = t("adminSetup.next");
  const nextLoadingLabel = t("adminSetup.saving");

  return (
    <div className="flex items-center justify-between gap-2">
      {showBackButton && (
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={isLoading}
          className="transition-colors duration-160 ease"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t("adminSetup.back")}
        </Button>
      )}

      <div className={`flex gap-2 ${!showBackButton ? "ml-auto" : ""}`}>
        <Button
          type={formId ? "submit" : "button"}
          form={formId}
          onClick={formId ? undefined : onNext}
          disabled={isLoading}
          className="bg-c-1 text-c-foreground hover:bg-c-2 transition-colors duration-160 ease"
        >
          {isLoading ? nextLoadingLabel : nextLabel}
        </Button>
      </div>
    </div>
  );
}
