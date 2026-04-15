"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  children: React.ReactNode;
};

export function PageHeader({ children }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div
      className="sticky top-0 z-20 pointer-events-none h-16"
      style={{
        background:
          "linear-gradient(to bottom, var(--background) 0%, var(--background) 80%, transparent 100%)",
      }}
    >
      <div className="pointer-events-auto flex items-center h-full px-1 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Go back"
          className="shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-base font-semibold text-foreground truncate">
          {children}
        </span>
      </div>
    </div>
  );
}
