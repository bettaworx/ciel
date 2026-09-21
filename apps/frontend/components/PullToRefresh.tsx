"use client";

import { usePullToRefresh } from "@/lib/hooks/use-pull-to-refresh";
import { Spinner } from "@/components/ui/spinner";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ArrowDown } from "lucide-react";

type PullToRefreshProps = {
  onRefresh: () => Promise<unknown>;
  children: React.ReactNode;
  className?: string;
};

const INDICATOR_HEIGHT = 64;

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const t = useTranslations();
  const { containerRef, dragDistance, isPulling, isRefreshing, threshold } = usePullToRefresh({
    onRefresh,
  });

  const shouldRelease = dragDistance >= threshold;
  const showIndicator = isPulling || isRefreshing;
  const rotation = Math.min((dragDistance / (threshold * 1.5)) * 180, 180);
  const translateY = isRefreshing ? INDICATOR_HEIGHT : dragDistance;

  return (
    // Clip the indicator without creating a scroll container that traps wheel/trackpad scrolling.
    <div ref={containerRef} className={cn("relative overflow-clip", className)}>
      <div
        className="will-change-transform"
        style={{
          transform: `translateY(${translateY}px)`,
          transition: isPulling ? "none" : "transform 0.2s ease-out",
        }}
      >
        <div
          className={cn(
            "absolute left-0 right-0 z-10 flex items-center justify-center transition-opacity duration-200 pointer-events-none",
            showIndicator ? "opacity-100" : "opacity-0",
          )}
          style={{
            top: `${-INDICATOR_HEIGHT}px`,
            height: `${INDICATOR_HEIGHT}px`,
          }}
        >
          {isRefreshing ? (
            <div className="flex w-full items-center justify-between px-3 text-muted-foreground">
              <span className="text-sm font-medium">{t("pullToRefresh.refreshing")}</span>
              <Spinner variant="theme" size="sm" className="h-5 w-5" />
            </div>
          ) : (
            <div className="flex w-full items-center justify-between px-3 text-muted-foreground">
              <span className="text-sm font-medium">
                {shouldRelease ? t("pullToRefresh.release") : t("pullToRefresh.pull")}
              </span>
              <ArrowDown
                className="h-5 w-5 transition-transform duration-200"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
            </div>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
