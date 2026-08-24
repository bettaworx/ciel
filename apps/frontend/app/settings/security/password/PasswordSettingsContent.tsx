"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useApi } from "@/lib/api/use-api";
import { validatePassword } from "@/lib/validation";
import { PageHeader } from "@/components/shared/PageHeader";
import { StepupGate } from "@/components/settings/StepupGate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PARENT = "/settings/security";

export function PasswordSettingsContent() {
  const t = useTranslations();

  return (
    <>
      <PageHeader backHref={PARENT}>
        {t("settings.security.password.title")}
      </PageHeader>
      <StepupGate heading={t("settings.reauth.heading")} cancelHref={PARENT}>
        {(stepupToken, invalidate) => (
          <PasswordForm stepupToken={stepupToken} onStepupExpired={invalidate} />
        )}
      </StepupGate>
    </>
  );
}

function PasswordForm({
  stepupToken,
  onStepupExpired,
}: {
  stepupToken: string;
  onStepupExpired: () => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const api = useApi();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const validationKey = validatePassword(password);
  const mismatch = confirmation.length > 0 && confirmation !== password;
  const canSubmit = validationKey === null && confirmation === password && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError(null);
    try {
      const result = await api.passwordChange({ newPassword: password }, stepupToken);
      if (!result.ok) {
        // The step-up window closed; the gate asks again rather than losing the
        // form to a generic error.
        if (result.status === 401) return onStepupExpired();
        setError(t("settings.security.password.updateError"));
        return;
      }

      // The token is spent — one use is all password change gets — so clear it
      // before leaving, or the row would wave the next visit straight through
      // on a dead token.
      onStepupExpired();
      toast.success(t("settings.security.password.doneTitle"), {
        description: t("settings.security.password.doneDescription"),
      });
      router.replace(PARENT);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="space-y-3">
        <Label className="text-muted-foreground" htmlFor="new-password">
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
        <p className="text-sm text-muted-foreground">{t("passwordRequirements")}</p>
        {/* Only nag once something has been typed — an empty field on arrival
            is not a mistake yet. */}
        {password.length > 0 && validationKey && (
          <p className="text-sm text-destructive">{t(validationKey)}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-muted-foreground" htmlFor="confirm-password">
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
      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={!canSubmit}>
          {busy ? t("loading") : t("settings.security.password.submit")}
        </Button>
      </div>
    </form>
  );
}
