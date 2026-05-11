import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "default" | "theme";
  label?: string;
  className?: string;
}

const sizeMap = {
  xs: "h-4 w-4",
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

export function Spinner({
  size = "md",
  variant = "default",
  label,
  className,
}: SpinnerProps) {
  const bgStroke = variant === "theme" ? "var(--c-ring)" : "var(--muted)";
  const fgStroke = variant === "theme" ? "var(--c-1)" : "var(--ring)";

  return (
    <div
      className={cn("relative", sizeMap[size], className)}
      {...(label
        ? { role: "status", "aria-label": label }
        : { "aria-hidden": true })}
    >
      <svg
        className="animate-spin-fast"
        viewBox="0 0 50 50"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={bgStroke}
          strokeWidth="6"
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={fgStroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="31.4 94.2"
          transform="rotate(-90 25 25)"
        />
      </svg>
    </div>
  );
}
