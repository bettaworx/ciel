"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

interface DisplayNameStepProps {
  onNext: (displayName: string | null) => void;
  onSkip?: () => void;
  loading?: boolean;
}

export function DisplayNameStep({
  onNext,
  onSkip,
  loading = false,
}: DisplayNameStepProps) {
  const t = useTranslations();
  const [displayName, setDisplayName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(displayName.trim() || null);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Form content */}
      <form
        id="setup-display-name-form"
        onSubmit={handleSubmit}
        className="flex flex-col h-full min-h-0"
      >
        <div className="flex-1 flex flex-col justify-center">
          {/* Title and subtitle - left aligned */}
          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-bold">{t("setup.displayName.title")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("setup.displayName.description")}
            </p>
          </div>

          {/* Input field */}
          <div className="space-y-2">
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("setup.displayName.placeholder")}
              maxLength={50}
              required
              className="transition-colors duration-160 ease"
            />
          <p className="text-xs text-muted-foreground text-right">
            {displayName.length} / 50
          </p>
        </div>
      </div>
    </form>
  </div>
  );
}
