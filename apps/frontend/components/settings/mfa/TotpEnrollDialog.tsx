"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MfaError } from "@/lib/hooks/use-mfa";
import type { components } from "@/lib/api/api";

type TotpSetup = components["schemas"]["TotpSetupResponse"];

const TOTP_CODE_LENGTH = 6;

interface TotpEnrollDialogProps {
  open: boolean;
  /** Issues the pending secret. Called once when the dialog opens. */
  onSetup: () => Promise<TotpSetup>;
  /** Confirms the code. Resolves with the backup codes, if any were minted. */
  onConfirm: (code: string) => Promise<string[]>;
  onDone: (backupCodes: string[]) => void;
  onCancel: () => void;
}

/**
 * TOTP enrollment: show the pending secret as a QR, then prove the app is
 * synced by entering a code. The secret is only stored server-side once the
 * code checks out, so cancelling here leaves nothing enabled.
 */
export function TotpEnrollDialog({
  open,
  onSetup,
  onConfirm,
  onDone,
  onCancel,
}: TotpEnrollDialogProps) {
  const t = useTranslations();
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSetup(null);
      setQr(null);
      setCode("");
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await onSetup();
        if (cancelled) return;
        setSetup(data);
        // Imported lazily so the QR encoder stays out of the settings bundle
        // for everyone who never enrolls.
        const { toString: toQrString } = await import("qrcode");
        const svg = await toQrString(data.otpauthUrl, { type: "svg", margin: 1 });
        if (!cancelled) setQr(svg);
      } catch (err) {
        if (cancelled) return;
        const status = err instanceof MfaError ? err.status : 0;
        toast.error(
          t(
            status === 503
              ? "settings.security.mfa.totp.unavailable"
              : status === 409
                ? "settings.security.mfa.totp.alreadyEnabled"
                : "error.generic",
          ),
        );
        onCancel();
      }
    })();

    return () => {
      cancelled = true;
    };
    // onSetup/onCancel are recreated on every parent render; re-running on
    // `open` alone is what we want — one setup call per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const copySecret = async () => {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.secret);
      toast.success(t("settings.security.mfa.totp.secretCopied"));
    } catch {
      toast.error(t("error.generic"));
    }
  };

  const confirm = async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length !== TOTP_CODE_LENGTH || busy) return;

    setBusy(true);
    setError(null);
    try {
      onDone(await onConfirm(trimmed));
    } catch (err) {
      const status = err instanceof MfaError ? err.status : 0;
      // 401 is handled by the gate (expired step-up); anything else is a bad code.
      if (status !== 401) setError(t("settings.security.mfa.totp.invalidCode"));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    confirm(code);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("settings.security.mfa.totp.enrollTitle")}</DialogTitle>
          <DialogDescription>
            {t("settings.security.mfa.totp.enrollDescription")}
          </DialogDescription>
        </DialogHeader>

        {!setup ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {qr && (
              <div
                className="mx-auto w-48 rounded-xl bg-white p-3 [&_svg]:h-full [&_svg]:w-full"
                // The SVG is produced locally by the qrcode encoder from a URL the
                // server generated; no user input reaches this markup.
                dangerouslySetInnerHTML={{ __html: qr }}
              />
            )}

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {t("settings.security.mfa.totp.manualEntry")}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 select-all break-all rounded-lg bg-muted px-3 py-2 font-mono text-sm">
                  {setup.secret}
                </code>
                <Button type="button" variant="secondary" size="icon" onClick={copySecret}>
                  <Copy />
                  <span className="sr-only">
                    {t("settings.security.mfa.totp.copySecret")}
                  </span>
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Label htmlFor="totp-confirm-code">
                {t("settings.security.mfa.totp.codeLabel")}
              </Label>
              <InputOTP
                id="totp-confirm-code"
                value={code}
                onChange={setCode}
                // A filled code has nothing left to confirm, so it goes.
                onComplete={confirm}
                maxLength={TOTP_CODE_LENGTH}
                pattern="^[0-9]*$"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                disabled={busy}
              >
                <InputOTPGroup>
                  {Array.from({ length: TOTP_CODE_LENGTH }, (_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
                {t("settings.security.mfa.cancel")}
              </Button>
              <Button type="submit" variant="primary" disabled={busy}>
                {busy ? t("loading") : t("settings.security.mfa.totp.confirm")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
