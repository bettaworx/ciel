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
import type { SetupStep } from "@/lib/config/setup-steps";
import { setClientLocale } from "@/i18n/client-locale";

interface SetupFooterProps {
  currentStep: SetupStep;
  loadingProfile: boolean;
  loadingAvatar: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onStart: () => void;
  onGoToTimeline: () => void;
  onChangeLocale?: (locale: Locale) => void;
}

export function SetupFooter({
  currentStep,
  loadingProfile,
  loadingAvatar,
  onBack,
  onNext,
  onSkip,
  onStart,
  onGoToTimeline,
  onChangeLocale,
}: SetupFooterProps) {
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

  if (currentStep === "welcome") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" disabled={isPending} className="w-full sm:w-auto">
              <Globe className="w-4 h-4 mr-2" />
              {t("setup.welcome.changeLanguage")}
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
          {t("setup.welcome.start")}
        </Button>
      </div>
    );
  }

  if (currentStep === "complete") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="secondary"
          onClick={onBack}
          className="transition-colors duration-160 ease w-full sm:w-auto"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t("setup.back")}
        </Button>

        <Button
          onClick={onGoToTimeline}
          className="bg-c-1 text-c-foreground hover:bg-c-2 transition-colors duration-160 ease w-full sm:w-auto"
        >
          {t("setup.completed.goToTimeline")}
        </Button>
      </div>
    );
  }

  const isLoading = currentStep === "avatar" ? loadingAvatar : loadingProfile;
  const formId =
    currentStep === "display-name"
      ? "setup-display-name-form"
      : currentStep === "avatar"
        ? "setup-avatar-form"
        : currentStep === "bio"
          ? "setup-bio-form"
          : undefined;
  const nextLabel =
    currentStep === "bio" ? t("setup.complete") : t("setup.next");
  const nextLoadingLabel =
    currentStep === "avatar" ? t("setup.avatar.uploading") : t("setup.saving");

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
        {t("setup.back")}
      </Button>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onSkip}
          disabled={isLoading}
          className="transition-colors duration-160 ease"
        >
          {t("setup.skip")}
        </Button>

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
