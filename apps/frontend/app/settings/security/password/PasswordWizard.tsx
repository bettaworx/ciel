"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { useApi } from "@/lib/api/use-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  StepupWizard,
  type StepupSubmitResult,
} from "@/components/settings/StepupWizard";
import { validatePassword } from "@/lib/validation";

export function PasswordWizard() {
  const t = useTranslations();
  const api = useApi();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validationKey = validatePassword(password);
  const mismatch = confirmation.length > 0 && confirmation !== password;
  const canSubmit = validationKey === null && confirmation === password;

  const handleSubmit = async (stepupToken: string): Promise<StepupSubmitResult> => {
    setError(null);
    const result = await api.passwordChange({ newPassword: password }, stepupToken);

    if (!result.ok) {
      if (result.status === 401) return "reauth";
      setError(t("settings.security.password.updateError"));
      return "retry";
    }

    toast.success(t("settings.security.password.doneTitle"));
    return "done";
  };

  return (
    <StepupWizard
      reauthHeading={t("settings.reauth.heading")}
      submitLabel={t("settings.security.password.submit")}
      cancelHref="/settings/security"
      canSubmit={canSubmit}
      onSubmit={handleSubmit}
      completion={
        <div className="flex flex-1 flex-col justify-center gap-6">
          <div className="flex flex-col gap-2">
            <Check className="size-8" />
            <h2 className="text-2xl font-bold">
              {t("settings.security.password.doneTitle")}
            </h2>
            <p className="text-muted-foreground">
              {t("settings.security.password.doneDescription")}
            </p>
          </div>
          <Button variant="primary" asChild className="self-start">
            <Link href="/settings/security">{t("settings.backToSettings")}</Link>
          </Button>
        </div>
      }
    >
      <div className="flex flex-1 flex-col justify-center gap-6">
        <h2 className="text-2xl font-bold">
          {t("settings.security.password.wizardTitle")}
        </h2>

        <div className="space-y-2">
          <Label htmlFor="new-password">
            {t("settings.security.password.newPassword")}
          </Label>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            autoComplete="new-password"
            autoFocus
          />
          <p className="text-sm text-muted-foreground">
            {t("passwordRequirements")}
          </p>
          {password.length > 0 && validationKey && (
            <p className="text-sm text-destructive">{t(validationKey)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">
            {t("settings.security.password.confirmPassword")}
          </Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="new-password"
          />
          {mismatch && (
            <p className="text-sm text-destructive">
              {t("settings.security.password.mismatch")}
            </p>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </StepupWizard>
  );
}
