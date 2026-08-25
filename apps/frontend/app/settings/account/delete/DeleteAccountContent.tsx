"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { userAtom } from "@/atoms/auth";
import { useApi } from "@/lib/api/use-api";
import { useAccountSwitch } from "@/lib/hooks/use-account-switch";
import { PageHeader } from "@/components/shared/PageHeader";
import { StepupGate } from "@/components/settings/StepupGate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PARENT = "/settings/account";

export function DeleteAccountContent() {
  const t = useTranslations();

  return (
    <>
      <PageHeader backHref={PARENT}>
        {t("settings.account.delete.title")}
      </PageHeader>
      <StepupGate heading={t("settings.reauth.heading")} cancelHref={PARENT}>
        {(stepupToken, invalidate) => (
          <DeleteForm stepupToken={stepupToken} onStepupExpired={invalidate} />
        )}
      </StepupGate>
    </>
  );
}

function DeleteForm({
  stepupToken,
  onStepupExpired,
}: {
  stepupToken: string;
  onStepupExpired: () => void;
}) {
  const t = useTranslations();
  const api = useApi();
  const queryClient = useQueryClient();
  const user = useAtomValue(userAtom);
  const { forgetAccount, switchToNext } = useAccountSwitch();

  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const username = user?.username ?? "";
  const canSubmit = typed === username && username.length > 0 && !busy;

  const goHome = async () => {
    // Deleting one account is not signing out of the browser: if another one is
    // signed in here, land there rather than in a signed-out shell.
    if (await switchToNext(user?.id ? [user.id] : [])) return;

    // Full reload rather than a router push: the session is gone, and this is
    // the same way logout tears down client state.
    window.location.href = "/";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError(null);
    try {
      const result = await api.deleteMe(stepupToken);
      if (!result.ok) {
        // The step-up window closed; the gate asks again rather than losing the
        // confirmation to a generic error.
        if (result.status === 401) return onStepupExpired();
        setError(t("settings.account.delete.error"));
        return;
      }

      // The account is gone, so every in-flight query is about to 401 and would
      // bounce us to /login before the goodbye is ever read. Stop them, and
      // leave authAtom alone — RequireAuth wraps this page and watches it.
      queryClient.cancelQueries();

      // Drop it from the switcher here rather than in goHome: the list has to be
      // right even if the user closes the tab on the goodbye screen.
      if (user?.id) await forgetAccount(user.id);
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  // Unlike the other step-up screens this one cannot navigate away on success:
  // there is no session left to render the settings page with.
  if (done) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">
            {t("settings.account.delete.goodbyeTitle")}
          </h2>
          <p className="text-muted-foreground">
            {t("settings.account.delete.goodbyeDescription")}
          </p>
        </div>
        <Button variant="primary" onClick={() => void goHome()}>
          {t("settings.account.delete.goHome")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">
          {t("settings.account.delete.confirmTitle")}
        </h2>
        <p className="text-muted-foreground">
          {t("settings.account.delete.confirmDescription")}
        </p>
      </div>

      <Alert variant="destructive">
        <AlertDescription>{t("settings.account.delete.warning")}</AlertDescription>
      </Alert>

      <div className="space-y-3">
        <Label className="text-muted-foreground" htmlFor="confirm-username">
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
      <div className="flex justify-end">
        <Button type="submit" variant="destructive" disabled={!canSubmit}>
          {busy ? t("loading") : t("settings.account.delete.submit")}
        </Button>
      </div>
    </form>
  );
}
