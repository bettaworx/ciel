"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";

interface BioStepProps {
  onComplete: (bio: string | null) => void;
  onSkip?: () => void;
  loading?: boolean;
}

export function BioStep({
  onComplete,
  onSkip,
  loading = false,
}: BioStepProps) {
  const t = useTranslations();
  const [bio, setBio] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(bio.trim() || null);
  };

  // Check if input is valid (not empty after trim)
  const isInputValid = bio.trim().length > 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Form content */}
      <form
        id="setup-bio-form"
        onSubmit={handleSubmit}
        className="flex flex-col h-full min-h-0"
      >
        <div className="flex-1 flex flex-col justify-center">
          {/* Title and subtitle - left aligned */}
          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-bold">{t("setup.bio.title")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("setup.bio.description")}
            </p>
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("setup.bio.placeholder")}
              maxLength={200}
              rows={4}
              required
              className="transition-colors duration-160 ease resize-none"
            />
          <p className="text-xs text-muted-foreground text-right">
            {bio.length} / 200
          </p>
        </div>
      </div>
    </form>
  </div>
  );
}
