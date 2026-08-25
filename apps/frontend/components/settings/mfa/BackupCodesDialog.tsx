"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atoms/auth";
import { toast } from "sonner";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

interface BackupCodesDialogProps {
  /** The plaintext codes. The server never shows them again. */
  codes: string[] | null;
  onClose: () => void;
}

/**
 * Shows freshly generated backup codes exactly once.
 *
 * Nothing dismisses it except the footer, and the footer waits on an explicit
 * acknowledgement — no close button, no Escape, no swipe. Losing these while
 * 2FA is on means losing the account, and there is no second showing.
 */
export function BackupCodesDialog({ codes, onClose }: BackupCodesDialogProps) {
  const t = useTranslations();
  const user = useAtomValue(userAtom);
  const host = typeof window === "undefined" ? "" : window.location.hostname;
  const [acknowledged, setAcknowledged] = useState(false);

  const open = codes !== null && codes.length > 0;

  // Held past the close: the parent drops the codes to shut this, and
  // rendering the empty list straight away would collapse the sheet while it
  // is still animating down.
  const shown = useRef<string[]>([]);
  if (open) shown.current = codes;
  // Same reason the acknowledgement resets on the way in, not on the way out.
  const wasOpen = useRef(false);
  if (open !== wasOpen.current) {
    wasOpen.current = open;
    if (open) setAcknowledged(false);
  }

  const text = shown.current.join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("settings.security.mfa.backupCodes.copied"));
    } catch {
      toast.error(t("error.generic"));
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([`${text}\n`], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    // Which instance and which account, so a file sitting in Downloads still
    // says what it unlocks. Usernames and hostnames are already limited to
    // characters that are safe here, but the filter keeps a future rule change
    // from putting a path separator in a filename.
    const safe = (value: string) => value.replace(/[^A-Za-z0-9_.-]/g, "");
    const parts = [safe(host), safe(user?.username ?? "")].filter(Boolean);
    link.download = ["ciel-backup-codes", ...parts].join("-") + ".txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      dismissible={false}
      title={t("settings.security.mfa.backupCodes.dialogTitle")}
      description={t("settings.security.mfa.backupCodes.dialogDescription")}
      footer={
        <Button type="button" variant="primary" disabled={!acknowledged} onClick={onClose}>
          {t("settings.security.mfa.backupCodes.done")}
        </Button>
      }
    >
      <div className="space-y-4">
        <ul className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-4 font-mono text-sm">
          {shown.current.map((code) => (
            <li key={code} className="select-all text-center">
              {code}
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={copy}>
            <Copy />
            {t("settings.security.mfa.backupCodes.copy")}
          </Button>
          <Button type="button" variant="secondary" onClick={download}>
            <Download />
            {t("settings.security.mfa.backupCodes.download")}
          </Button>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <Checkbox
            checked={acknowledged}
            onCheckedChange={(checked) => setAcknowledged(checked === true)}
          />
          {t("settings.security.mfa.backupCodes.acknowledge")}
        </label>
      </div>
    </ResponsiveDialog>
  );
}
