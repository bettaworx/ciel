"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  StepupWizard,
  type StepupSubmitResult,
} from "@/components/settings/StepupWizard";
import { ApiHttpError } from "@/lib/api/client";
import { useUpdateUsername } from "@/lib/hooks/use-queries";
import { validateUsername } from "@/lib/validation";

export function UsernameWizard() {
  const t = useTranslations();
  const updateUsername = useUpdateUsername();

  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [changedTo, setChangedTo] = useState("");

  const validationKey = validateUsername(username);

  const handleSubmit = async (stepupToken: string): Promise<StepupSubmitResult> => {
    setError(null);
    try {
      const session = await updateUsername.mutateAsync({
        username: username.trim(),
        stepupToken,
      });
      setChangedTo(session.user.username);
      toast.success(t("settings.account.username.doneTitle"));
      return "done";
    } catch (e) {
      if (e instanceof ApiHttpError && e.status === 401) {
        return "reauth";
      }
      setError(
        e instanceof ApiHttpError && e.status === 409
          ? t("settings.account.username.taken")
          : t("settings.account.username.updateError"),
      );
      return "retry";
    }
  };

  return (
    <StepupWizard
      reauthHeading={t("settings.reauth.heading")}
      submitLabel={t("settings.account.username.submit")}
      cancelHref="/settings/account"
      canSubmit={validationKey === null}
      onSubmit={handleSubmit}
      completion={
        <div className="flex flex-1 flex-col justify-center gap-6">
          <div className="flex flex-col gap-2">
            <Check className="size-8" />
            <h2 className="text-2xl font-bold">
              {t("settings.account.username.doneTitle")}
            </h2>
            <p className="text-muted-foreground">
              {t("settings.account.username.doneDescription", {
                username: changedTo,
              })}
            </p>
          </div>
          <Button variant="primary" asChild className="self-start">
            <Link href="/settings/account">{t("settings.backToSettings")}</Link>
          </Button>
        </div>
      }
    >
      <div className="flex flex-1 flex-col justify-center gap-6">
        <h2 className="text-2xl font-bold">
          {t("settings.account.username.wizardTitle")}
        </h2>

        <div className="space-y-2">
          <Label htmlFor="new-username">
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
      </div>
    </StepupWizard>
  );
}
