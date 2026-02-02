"use client";

import { useTranslations } from "next-intl";
import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { Progress } from "@/components/ui/progress";

interface SetupProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function SetupProgress({ currentStep, totalSteps }: SetupProgressProps) {
  const t = useTranslations();
  const [animatedProgress, setAnimatedProgress] = useState((currentStep / totalSteps) * 100);
  const [isDesktop, setIsDesktop] = useState(false);
  const progressRef = useRef({ value: (currentStep / totalSteps) * 100 });

  // Detect desktop viewport
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 640px)");

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop(e.matches);
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // Animate progress bar on desktop, instant update on mobile
  useEffect(() => {
    const targetProgress = (currentStep / totalSteps) * 100;

    if (isDesktop) {
      // Desktop: Animate with GSAP (0.4s)
      gsap.to(progressRef.current, {
        value: targetProgress,
        duration: 0.4,
        ease: "power2.inOut",
        onUpdate: () => {
          setAnimatedProgress(progressRef.current.value);
        },
      });
    } else {
      // Mobile: Instant update
      progressRef.current.value = targetProgress;
      setAnimatedProgress(targetProgress);
    }
  }, [currentStep, totalSteps, isDesktop]);

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {t("setup.step")} {currentStep} {t("setup.of")} {totalSteps}
      </span>
      <Progress value={animatedProgress} className="flex-1 h-2" />
    </div>
  );
}
