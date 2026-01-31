"use client";

import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { WARNING_THRESHOLD } from "./constants";

interface CharacterCounterProps {
  current: number;
  max: number;
  percentage: number;
  showCount: boolean;
}

/**
 * Character counter component with circular progress ring
 */
export function CharacterCounter({
  current,
  max,
  percentage,
  showCount,
}: CharacterCounterProps) {
  const t = useTranslations();
  const radius = 13;
  const circumference = 2 * Math.PI * radius;

  const getColorClass = () => {
    if (percentage > 100) return "stroke-destructive";
    if (percentage >= WARNING_THRESHOLD) return "stroke-yellow-500";
    return "stroke-c-1";
  };

  const getTextColorClass = () => {
    if (percentage > 100) return "text-destructive";
    if (percentage >= WARNING_THRESHOLD) return "text-yellow-600";
    return "text-foreground";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
              {/* Background circle */}
              <circle
                cx="16"
                cy="16"
                r={radius}
                className="stroke-primary fill-none"
                strokeWidth="2.5"
              />
              {/* Progress circle */}
              <circle
                cx="16"
                cy="16"
                r={radius}
                className={`fill-none transition-all duration-300 ${getColorClass()}`}
                strokeWidth="2.5"
                strokeDasharray={circumference}
                strokeDashoffset={
                  circumference * (1 - Math.min(percentage, 100) / 100)
                }
                strokeLinecap="round"
              />
            </svg>
            {/* Character count text (shown when >= 75%) */}
            {showCount && (
              <span
                className={`absolute inset-0 flex items-center justify-center text-[10px] font-medium ${getTextColorClass()}`}
              >
                {current}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {current}/{max}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
