"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { KeyRound, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StepupGate } from "@/components/settings/StepupGate";
import { SettingsRow, SettingsRowGroup } from "@/components/settings/SettingsRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TotpEnrollDialog } from "@/components/settings/mfa/TotpEnrollDialog";
import { BackupCodesDialog } from "@/components/settings/mfa/BackupCodesDialog";
import { MfaError, useMfa, type MfaStatus } from "@/lib/hooks/use-mfa";
import { createCredential, isWebAuthnAvailable } from "@/lib/api/webauthn";
import { formatFullTimestamp } from "@/lib/utils/format-time";
import type { components } from "@/lib/api/api";

type WebAuthnCredential = components["schemas"]["WebAuthnCredential"];

/** What the confirmation dialog is about to do. Every one of these destroys a
 *  factor, so none of them happen without an explicit yes. */
type PendingConfirm =
  | { kind: "totp-remove" }
  | { kind: "totp-reset" }
  | { kind: "credential"; credential: WebAuthnCredential };

export function MfaSettingsContent() {
  const t = useTranslations();

  return (
    <>
      <PageHeader backHref="/settings/security">
        {t("settings.security.mfa.title")}
      </PageHeader>
      <StepupGate
        heading={t("settings.reauth.heading")}
        cancelHref="/settings/security"
      >
        {(stepupToken, invalidate) => (
          <MfaManager stepupToken={stepupToken} onStepupExpired={invalidate} />
        )}
      </StepupGate>
    </>
  );
}

/**
 * The management screen itself. It only ever renders behind StepupGate, so
 * `stepupToken` is a live token — until the server says otherwise, at which
 * point useMfa calls `onStepupExpired` and the gate takes the screen back.
 */
function MfaManager({
  stepupToken,
  onStepupExpired,
}: {
  stepupToken: string;
  onStepupExpired: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { api, refresh, status, isLoading, pending, run } = useMfa(
    stepupToken,
    onStepupExpired,
  );

  const [enrolling, setEnrolling] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [confirming, setConfirming] = useState<PendingConfirm | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);

  const credentials = status?.webauthnCredentials ?? [];
  const hasAnyFactor = Boolean(status?.totpEnabled) || credentials.length > 0;
  const webAuthnUsable = isWebAuthnAvailable();

  // Every action funnels through here so one place maps failures to messages.
  const guard = async (action: () => Promise<void>, fallbackKey = "error.generic") => {
    try {
      await action();
    } catch (err) {
      const httpStatus = err instanceof MfaError ? err.status : 0;
      // 401 already sent the user back to the password step; do not double-report.
      if (httpStatus === 401) return;
      if (httpStatus === 409) {
        toast.error(t("settings.security.mfa.securityKeys.alreadyRegistered"));
        return;
      }
      toast.error(t(fallbackKey));
    }
  };

  const addSecurityKey = () =>
    guard(async () => {
      const options = await run((token) => api.webauthnRegisterOptions(token));
      const credential = await createCredential(options.options);
      const result = await run((token) =>
        api.webauthnRegisterVerify(
          {
            sessionId: options.sessionId,
            credential,
            name: t("settings.security.mfa.securityKeys.defaultName"),
          },
          token,
        ),
      );
      // Backup codes come back only when this key is the account's first factor.
      if (result.backupCodes.length > 0) setBackupCodes(result.backupCodes);
      // Open the rename field straight away so the placeholder name is a
      // starting point rather than something to go hunting for later.
      setRenaming({ id: result.credential.id, name: result.credential.name });
      toast.success(t("settings.security.mfa.securityKeys.added"));
    }, "settings.security.mfa.securityKeys.addFailed");

  const regenerateBackupCodes = () =>
    guard(async () => {
      const res = await run((token) => api.backupCodesRegenerate(token));
      setBackupCodes(res.backupCodes);
    });

  const confirmDestructive = () =>
    guard(async () => {
      if (!confirming) return;

      if (confirming.kind === "credential") {
        await run((token) =>
          api.webauthnCredentialDelete(confirming.credential.id, token),
        );
      } else {
        // Both remove and reset start by clearing the current secret; /totp/setup
        // answers 409 while one is still active.
        await run((token) => api.totpDisable(token));
      }

      setConfirming(null);
      if (confirming.kind === "totp-reset") {
        setEnrolling(true);
        return;
      }
      toast.success(t("settings.security.mfa.removed"));
    });

  // Renaming needs no step-up, so it goes straight at the API and refreshes the
  // status by hand rather than through `run`.
  const submitRename = () =>
    guard(async () => {
      if (!renaming) return;
      const name = renaming.name.trim();
      if (!name) return;
      const res = await api.webauthnCredentialRename(renaming.id, { name });
      if (!res.ok) throw new MfaError(res.status);
      setRenaming(null);
      await refresh();
    });

  if (isLoading || !status) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          {t("settings.security.mfa.description")}
        </p>

        {/* ---- One-time password ---- */}
        <div className="space-y-1.5">
          <SettingsRowGroup title={t("settings.security.mfa.totp.title")}>
            {status.totpEnabled ? (
              <>
                <SettingsRow
                  label={t("settings.security.mfa.totp.reconfigure")}
                  onClick={() => setConfirming({ kind: "totp-reset" })}
                  disabled={pending}
                />
                <SettingsRow
                  label={t("settings.security.mfa.totp.remove")}
                  className="text-destructive"
                  onClick={() => setConfirming({ kind: "totp-remove" })}
                  disabled={pending}
                />
              </>
            ) : (
              <SettingsRow
                icon={ShieldCheck}
                label={t("settings.security.mfa.totp.configure")}
                onClick={() => setEnrolling(true)}
                disabled={pending}
              />
            )}
          </SettingsRowGroup>

          {status.totpEnabled && (
            <p className="text-sm text-muted-foreground">
              {status.totpEnabledAt
                ? t("settings.security.mfa.totp.enabledAt", {
                    date: formatFullTimestamp(status.totpEnabledAt, locale),
                  })
                : t("settings.security.mfa.totp.enabled")}
            </p>
          )}
        </div>

        {/* ---- Security keys ---- */}
        <section className="space-y-1.5">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t("settings.security.mfa.securityKeys.title")}
          </h2>

          <div className="flex flex-col overflow-hidden rounded-2xl bg-card [&>*+*]:border-t [&>*+*]:border-border">
            {credentials.map((credential) => (
              <div key={credential.id} className="p-4">
                {renaming?.id === credential.id ? (
                  <form
                    className="flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitRename();
                    }}
                  >
                    <Input
                      value={renaming.name}
                      onChange={(e) =>
                        setRenaming({ id: credential.id, name: e.target.value })
                      }
                      maxLength={64}
                      autoFocus
                    />
                    <Button type="submit" variant="primary" disabled={pending}>
                      {t("settings.security.mfa.securityKeys.saveName")}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setRenaming(null)}
                    >
                      {t("settings.security.mfa.cancel")}
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center gap-3">
                    <KeyRound className="size-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{credential.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("settings.security.mfa.securityKeys.addedAt", {
                          date: formatFullTimestamp(credential.createdAt, locale),
                        })}
                        {credential.lastUsedAt
                          ? " · " +
                            t("settings.security.mfa.securityKeys.lastUsedAt", {
                              date: formatFullTimestamp(credential.lastUsedAt, locale),
                            })
                          : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setRenaming({ id: credential.id, name: credential.name })
                      }
                      aria-label={t("settings.security.mfa.securityKeys.rename")}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setConfirming({ kind: "credential", credential })}
                      disabled={pending}
                      aria-label={t("settings.security.mfa.securityKeys.remove")}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            <SettingsRow
              icon={Plus}
              label={t("settings.security.mfa.securityKeys.add")}
              onClick={addSecurityKey}
              disabled={pending || !webAuthnUsable}
            />
          </div>

          {!webAuthnUsable && (
            <p className="text-sm text-muted-foreground">
              {t("settings.security.mfa.securityKeys.unsupported")}
            </p>
          )}
        </section>

        {/* ---- Backup codes: only meaningful once a factor exists ---- */}
        {hasAnyFactor && (
          <SettingsRowGroup title={t("settings.security.mfa.backupCodes.title")}>
            <SettingsRow
              label={t("settings.security.mfa.backupCodes.remaining", {
                count: status.backupCodesRemaining,
              })}
              disabled
            />
            <SettingsRow
              label={t("settings.security.mfa.backupCodes.regenerate")}
              onClick={regenerateBackupCodes}
              disabled={pending}
            />
          </SettingsRowGroup>
        )}
      </div>

      <TotpEnrollDialog
        open={enrolling}
        onSetup={() => run((token) => api.totpSetup(token))}
        onConfirm={async (code) => {
          const res = await run((token) => api.totpConfirm({ code }, token));
          return res.backupCodes;
        }}
        onDone={(codes) => {
          setEnrolling(false);
          if (codes.length > 0) setBackupCodes(codes);
          toast.success(t("settings.security.mfa.totp.enabledToast"));
        }}
        onCancel={() => setEnrolling(false)}
      />

      <BackupCodesDialog codes={backupCodes} onClose={() => setBackupCodes(null)} />

      <AlertDialog
        open={confirming !== null}
        onOpenChange={(next) => !next && setConfirming(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                confirming?.kind === "totp-reset"
                  ? "settings.security.mfa.totp.resetTitle"
                  : "settings.security.mfa.removeTitle",
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                confirming?.kind === "totp-reset"
                  ? "settings.security.mfa.totp.resetDescription"
                  : factorsAfterRemoval(status, confirming) === 0
                    ? "settings.security.mfa.removeLastDescription"
                    : "settings.security.mfa.removeDescription",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("settings.security.mfa.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDestructive();
              }}
              disabled={pending}
            >
              {t(
                confirming?.kind === "totp-reset"
                  ? "settings.security.mfa.totp.confirmReset"
                  : "settings.security.mfa.confirmRemove",
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** How many second factors would be left if `confirming` went through. */
function factorsAfterRemoval(
  status: MfaStatus,
  confirming: PendingConfirm | null,
): number {
  const total = (status.totpEnabled ? 1 : 0) + status.webauthnCredentials.length;
  return confirming ? total - 1 : total;
}
