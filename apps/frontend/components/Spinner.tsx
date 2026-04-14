interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label: string;
  variant?: "default" | "theme";
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

/**
 * Spinner component with rounded line caps
 * Used for loading states across the application
 * 
 * @param label - Accessible label for screen readers (required)
 */
export function Spinner({ size = "md", className = "", label, variant = "default" }: SpinnerProps) {

  const bgStroke = variant === "theme" ? "var(--c-ring)" : "var(--muted)";
  const fgStroke = variant === "theme" ? "var(--c-1)" : "var(--ring)";

  return (
    <div className={`relative ${sizeMap[size]} ${className}`} role="status" aria-label={label}>
      <svg
        className="animate-spin-fast"
        viewBox="0 0 50 50"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={bgStroke}
          strokeWidth="6"
        />
        {/* Rotating arc with rounded caps */}
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
