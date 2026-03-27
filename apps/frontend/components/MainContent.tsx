"use client";

import { usePathname } from "next/navigation";
import { useAtomValue } from "jotai";
import { isAuthenticatedAtom } from "@/atoms/auth";
import { sidebarExpandedAtom } from "@/atoms/sidebar";
import { isConcentratedMode } from "@/lib/utils/concentrated-mode";
import { cn } from "@/lib/utils";

interface MainContentProps {
  children: React.ReactNode;
}

/**
 * メインコンテンツエリアのラッパーコンポーネント
 * サイドバー表示時に適切なマージンを適用する
 *
 * Main content area wrapper component
 * Applies appropriate margins when sidebar is visible
 */
export function MainContent({ children }: MainContentProps) {
  const pathname = usePathname();
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const isSidebarExpanded = useAtomValue(sidebarExpandedAtom);
  const isConcentrated = isConcentratedMode(pathname);
  const shouldApplySidebarOffset = isAuthenticated && !isConcentrated;

  return (
    <div
      className={cn(
        "pb-20 sm:pb-0",
        shouldApplySidebarOffset &&
          (isSidebarExpanded
            ? "sm:pl-14 sm:pr-0 xl:pl-[232px] xl:pr-[232px]"
            : "sm:pl-14 sm:pr-0 xl:pr-14"),
      )}
    >
      {children}
    </div>
  );
}
