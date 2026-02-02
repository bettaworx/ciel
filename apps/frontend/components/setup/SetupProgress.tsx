"use client";

import { useTranslations } from "next-intl";
import { useRef, useEffect, useState } from "react";
import { animate } from "framer-motion";
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
      // Desktop: Animate progress (0.4s)
      const animation = animate(progressRef.current.value, targetProgress, {
        duration: 0.4,
        ease: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
        onUpdate: (value) => {
          progressRef.current.value = value;
          setAnimatedProgress(value);
        },
      });

      return () => {
        animation.stop();
      };
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
