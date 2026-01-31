"use client";

import { cn } from "@/lib/utils";

interface AuthLayoutShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  fixedAspectRatio?: boolean;
  className?: string;
}

/**
 * AuthLayoutShell is a reusable layout component for authentication and setup pages.
 * It provides a centered card with responsive styling and optional header/footer.
 */
export function AuthLayoutShell({
  children,
  header,
  footer,
  fixedAspectRatio = false,
  className,
}: AuthLayoutShellProps) {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-0 sm:p-6">
      <div
        className={cn(
          "w-full h-screen sm:h-auto sm:rounded-2xl bg-card p-6 sm:p-8 flex flex-col",
          fixedAspectRatio
            ? "lg:h-auto lg:aspect-square lg:max-w-3xl"
            : "sm:max-w-md",
          className,
        )}
      >
        <div className="flex-1 flex flex-col w-full h-full min-h-0">
          {header ? <div className="flex-none">{header}</div> : null}

          <div className="flex-1 min-h-0 flex flex-col">{children}</div>

          {footer ? <div className="flex-none mt-6">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
