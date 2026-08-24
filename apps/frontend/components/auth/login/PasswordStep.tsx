"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { UserProfileDisplay } from "./UserProfileDisplay";

interface PasswordStepProps {
  username: string;
  onSubmit: (password: string) => void;
  loading?: boolean;
  /**
   * 見出し。未指定ならログイン時の「おかえりなさい」。
   * 再認証（step-up）ではここを操作名に差し替える。
   */
  heading?: string;
  /**
   * "wizard" is the full-screen step: a large left-aligned heading with the
   * profile beside it. "sheet" is the bottom-sheet card: a dialog-sized heading
   * centred over a stacked profile.
   */
  presentation?: "wizard" | "sheet";
}

export function PasswordStep({
  username,
  onSubmit,
  loading = false,
  heading,
  presentation = "wizard",
}: PasswordStepProps) {
  const isSheet = presentation === "sheet";
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
        {/* Password-manager hint only — never seen. A plain input rather than
            <Input>, whose w-full survives tailwind-merge alongside sr-only and
            stretches this to the full page width, forcing a horizontal
            scrollbar. */}
        <input
          type="text"
          value={username}
          readOnly
          autoComplete="username"
          tabIndex={-1}
          className="sr-only"
          aria-hidden="true"
        />

        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-6">
            <h2
              className={cn(
                isSheet ? "text-lg font-semibold" : "text-2xl font-bold",
                isSheet && "text-center",
              )}
            >
              {heading ?? t("login.wizard.password.welcomeBack")}
            </h2>
          </div>

          <div className="space-y-6">
            {/* User profile display */}
            <UserProfileDisplay
              username={username}
              layout={isSheet ? "stacked" : "inline"}
            />

            {/* Password input */}
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("password")}
              required
              autoFocus
              autoComplete="current-password"
              disabled={loading}
              className="transition-colors duration-160 ease"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
