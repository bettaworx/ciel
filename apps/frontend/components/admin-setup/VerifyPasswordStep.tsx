"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

interface VerifyPasswordStepProps {
  onVerify: (password: string) => Promise<boolean>;
  loading?: boolean;
}

export function VerifyPasswordStep({
  onVerify,
  loading = false,
}: VerifyPasswordStepProps) {
  const t = useTranslations("adminSetup");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;
    await onVerify(password);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <form
        id="verify-password-form"
        onSubmit={handleSubmit}
        className="flex flex-col h-full min-h-0"
      >
        <div className="flex-1 flex flex-col justify-center">
          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-bold">{t("verifyPassword.title")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("verifyPassword.description")}
            </p>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Input
                id="setup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("verifyPassword.placeholder")}
                disabled={loading}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={loading}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
