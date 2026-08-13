"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { userAtom } from "@/atoms/auth";
import { useApi } from "@/lib/api/use-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  StepupWizard,
  type StepupSubmitResult,
} from "@/components/settings/StepupWizard";

export function DeleteAccountWizard() {
  const t = useTranslations();
  const api = useApi();
  const queryClient = useQueryClient();
  const user = useAtomValue(userAtom);

  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);

  const username = user?.username ?? "";
  const confirmed = typed === username && username.length > 0;

  const goHome = () => {
    // Full reload rather than a router push: the session is gone, and this is
    // the same way logout tears down client state.
    window.location.href = "/";
  };

  const handleSubmit = async (stepupToken: string): Promise<StepupSubmitResult> => {
    setError(null);
    const result = await api.deleteMe(stepupToken);

    if (!result.ok) {
      if (result.status === 401) return "reauth";
      setError(t("settings.account.delete.error"));
      return "retry";
    }

    // The account is gone, so every in-flight query is about to 401 and would
    // bounce us to /login before the goodbye is ever read. Stop them, and leave
    // authAtom alone — RequireAuth wraps this page and watches it.
    queryClient.cancelQueries();
    return "done";
  };

  return (
    <StepupWizard
      reauthHeading={t("settings.reauth.heading")}
      submitLabel={t("settings.account.delete.submit")}
      cancelHref="/settings/account"
      destructive
      canSubmit={confirmed}
      onSubmit={handleSubmit}
      completion={
        <div className="flex flex-1 flex-col justify-center gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold">
              {t("settings.account.delete.goodbyeTitle")}
            </h2>
            <p className="text-muted-foreground">
              {t("settings.account.delete.goodbyeDescription")}
            </p>
          </div>
          <Button variant="primary" onClick={goHome} className="self-start">
            {t("settings.account.delete.goHome")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-1 flex-col justify-center gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">
            {t("settings.account.delete.confirmTitle")}
          </h2>
          <p className="text-muted-foreground">
            {t("settings.account.delete.confirmDescription")}
          </p>
        </div>

        <Alert variant="destructive">
          <AlertDescription>{t("settings.account.delete.warning")}</AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="confirm-username">
            {t("settings.account.delete.typeUsernamePrompt", { username })}
          </Label>
          <Input
            id="confirm-username"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoFocus
          />
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
