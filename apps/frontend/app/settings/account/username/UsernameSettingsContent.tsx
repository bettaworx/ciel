"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ApiHttpError } from "@/lib/api/client";
import { useUpdateUsername } from "@/lib/hooks/use-queries";
import { validateUsername } from "@/lib/validation";
import { PageHeader } from "@/components/shared/PageHeader";
import { StepupGate } from "@/components/settings/StepupGate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PARENT = "/settings/account";

export function UsernameSettingsContent() {
  const t = useTranslations();

  return (
    <>
      <PageHeader backHref={PARENT}>
        {t("settings.account.username.title")}
      </PageHeader>
      <StepupGate heading={t("settings.reauth.heading")} cancelHref={PARENT}>
        {(stepupToken, invalidate) => (
          <UsernameForm stepupToken={stepupToken} onStepupExpired={invalidate} />
        )}
      </StepupGate>
    </>
  );
}

function UsernameForm({
  stepupToken,
  onStepupExpired,
}: {
  stepupToken: string;
  onStepupExpired: () => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const updateUsername = useUpdateUsername();

  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validationKey = validateUsername(username);
  const busy = updateUsername.isPending;
  const canSubmit = validationKey === null && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    try {
      const session = await updateUsername.mutateAsync({
        username: username.trim(),
        stepupToken,
      });

      // The token is spent — one use is all a rename gets — so clear it before
      // leaving, or the row would wave the next visit straight through on a
      // dead token.
      onStepupExpired();
      toast.success(t("settings.account.username.doneTitle"), {
        description: t("settings.account.username.doneDescription", {
          username: session.user.username,
        }),
      });
      router.replace(PARENT);
    } catch (e) {
      // The step-up window closed; the gate asks again rather than losing the
      // form to a generic error.
      if (e instanceof ApiHttpError && e.status === 401) return onStepupExpired();
      setError(
        e instanceof ApiHttpError && e.status === 409
          ? t("settings.account.username.taken")
          : t("settings.account.username.updateError"),
      );
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="space-y-3">
        <Label className="text-muted-foreground" htmlFor="new-username">
          {t("settings.account.username.newLabel")}
        </Label>
        <Input
          id="new-username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError(null);
          }}
          placeholder={t("settings.account.username.placeholder")}
          autoFocus
          autoComplete="off"
        />
        {/* Only nag once something has been typed — an empty field on arrival
            is not a mistake yet. */}
        {username.length > 0 && validationKey && (
          <p className="text-sm text-destructive">{t(validationKey)}</p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={!canSubmit}>
          {busy ? t("loading") : t("settings.account.username.submit")}
        </Button>
      </div>
    </form>
  );
}
