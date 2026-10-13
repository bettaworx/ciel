"use client";

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { WARNING_THRESHOLD } from "./constants";

interface CharacterCounterProps {
  current: number;
  max: number;
  percentage: number;
  showCount: boolean;
  formatValue?: (value: number) => string;
  label?: string;
}

/**
 * Character counter component with circular progress ring
 */
export function CharacterCounter({
  current,
  max,
  percentage,
  showCount,
  formatValue = String,
  label,
}: CharacterCounterProps) {
  const radius = 13;
  const circumference = 2 * Math.PI * radius;
  const valueText = `${formatValue(current)}/${formatValue(max)}`;

  const getColorClass = () => {
    if (percentage >= 100) return "stroke-destructive";
    if (percentage >= WARNING_THRESHOLD) return "stroke-yellow-500";
    return "stroke-c-1";
  };

  const getTextColorClass = () => {
    if (percentage >= 100) return "text-destructive";
    if (percentage >= WARNING_THRESHOLD) return "text-yellow-600";
    return "text-foreground";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex cursor-default items-center gap-1.5"
            aria-label={label ? `${label}: ${valueText}` : valueText}
          >
            <meter className="sr-only" min={0} max={max} value={Math.min(current, max)}>
              {valueText}
            </meter>
            <div className="relative flex h-8 w-8 items-center justify-center">
              <svg aria-hidden="true" className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
                <circle
                  cx="16"
                  cy="16"
                  r={radius}
                  className="stroke-primary fill-none"
                  strokeWidth="2.5"
                />
                <circle
                  cx="16"
                  cy="16"
                  r={radius}
                  className={`fill-none transition-all duration-300 ${getColorClass()}`}
                  strokeWidth="2.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - Math.min(percentage, 100) / 100)}
                  strokeLinecap="round"
                />
              </svg>
              {showCount && (
                <span
                  className={`absolute inset-0 flex items-center justify-center text-[10px] font-medium ${getTextColorClass()}`}
                >
                  {formatValue(max - current)}
                </span>
              )}
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label ? `${label}: ${valueText}` : valueText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
