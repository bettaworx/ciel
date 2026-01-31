"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { UserProfileDisplay } from "./UserProfileDisplay";

interface PasswordStepProps {
  username: string;
  onSubmit: (password: string) => void;
  loading?: boolean;
}

export function PasswordStep({
  username,
  onSubmit,
  loading = false,
}: PasswordStepProps) {
  const t = useTranslations();
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      onSubmit(password);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <form
        id="login-password-form"
        onSubmit={handleSubmit}
        className="flex flex-col h-full min-h-0"
      >
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {t("login.wizard.password.welcomeBack")}
            </h2>
          </div>

          <div className="space-y-6">
            {/* User profile display */}
            <UserProfileDisplay username={username} />

            {/* Password input */}
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("password")}
              required
              autoFocus
              disabled={loading}
              className="transition-colors duration-160 ease"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
