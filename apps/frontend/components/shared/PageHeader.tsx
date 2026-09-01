"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  children: React.ReactNode;
  /**
   * Path of the parent page. The arrow means "up one level", not "undo the last
   * navigation" — without this it falls back to history, which strands anyone
   * who arrived by deep link and ping-pongs against screens that pushed here.
   */
  backHref?: string;
  /**
   * `false` hides the back arrow on pages reached from the nav rather than
   * drilled into, where there is nothing meaningful to go back to.
   */
  showBackButton?: boolean;
  /** Right-aligned slot for a page-level action, e.g. "create". */
  action?: React.ReactNode;
};

export function PageHeader({
  children,
  backHref,
  showBackButton = true,
  action,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div
      className="sticky top-0 z-20 pointer-events-none h-16"
      style={{
        background:
          "linear-gradient(to bottom, var(--background) 0%, var(--background) 80%, transparent 100%)",
      }}
    >
      <div
        className={cn(
          "pointer-events-auto flex items-center h-full gap-2",
          // Left only: the right edge belongs to the action and must not move
          // with the back button. An icon button carries ~8px around its glyph,
          // so pr-2 lands that glyph on the same 16px inset as the title.
          "pr-2",
          // Without the button, the title needs the inset it used to provide.
          showBackButton ? "pl-1" : "pl-4",
        )}
      >
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (backHref ? router.push(backHref) : router.back())}
            aria-label="Go back"
            className="shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <span className="text-base font-semibold text-foreground truncate">
          {children}
        </span>
        {action && <div className="ml-auto shrink-0">{action}</div>}
      </div>
    </div>
  );
}
