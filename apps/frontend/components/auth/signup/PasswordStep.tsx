"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validatePassword } from "@/lib/validation";

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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    const errorKey = validatePassword(password);
    if (errorKey) {
      setError(t(errorKey));
      return;
    }
    
    // Clear error and proceed
    setError(null);
    onSubmit(password);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <form
        id="signup-password-form"
        onSubmit={handleSubmit}
        className="flex flex-col h-full min-h-0"
      >
        <div className="flex-1 flex flex-col justify-center">
          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-bold">
              {t("signup.wizard.password.title")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("signup.wizard.password.description")}
            </p>
          </div>

          <div className="space-y-2">
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
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <p className="text-muted-foreground text-sm">
              {t("passwordRequirements")}
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
