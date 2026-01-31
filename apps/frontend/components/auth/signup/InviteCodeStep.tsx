"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

interface InviteCodeStepProps {
  onSubmit: (inviteCode: string) => void;
  loading?: boolean;
}

export function InviteCodeStep({
  onSubmit,
  loading = false,
}: InviteCodeStepProps) {
  const t = useTranslations();
  const [inviteCode, setInviteCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = inviteCode.trim();
    if (trimmedCode) {
      onSubmit(trimmedCode);
    }
  };

  // Validate input: only allow alphanumeric characters (a-z, A-Z, 0-9)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only alphanumeric characters and limit to 8 characters
    const filtered = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
    setInviteCode(filtered);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <form
        id="signup-invite-code-form"
        onSubmit={handleSubmit}
        className="flex flex-col h-full min-h-0"
      >
        <div className="flex-1 flex flex-col justify-center">
          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-bold">
              {t("signup.wizard.inviteCode.title")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("signup.wizard.inviteCode.description")}
            </p>
          </div>

          <div className="space-y-2">
            <Input
              id="invite-code"
              type="text"
              value={inviteCode}
              onChange={handleChange}
              placeholder={t("signup.wizard.inviteCode.placeholder")}
              required
              autoFocus
              disabled={loading}
              maxLength={32}
              className="transition-colors duration-160 ease font-mono tracking-wider"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
