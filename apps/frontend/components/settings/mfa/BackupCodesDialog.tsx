"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BackupCodesDialogProps {
  /** The plaintext codes. The server never shows them again. */
  codes: string[] | null;
  onClose: () => void;
}

/**
 * Shows freshly generated backup codes exactly once.
 *
 * Dismissal is gated behind an explicit acknowledgement — including Escape and
 * the overlay — because losing these while 2FA is on means losing the account.
 */
export function BackupCodesDialog({ codes, onClose }: BackupCodesDialogProps) {
  const t = useTranslations();
  const [acknowledged, setAcknowledged] = useState(false);

  const open = codes !== null && codes.length > 0;
  const text = (codes ?? []).join("\n");

  const close = () => {
    setAcknowledged(false);
    onClose();
  };

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
    link.download = "ciel-backup-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && acknowledged) close();
      }}
    >
      <DialogContent
        onEscapeKeyDown={(e) => !acknowledged && e.preventDefault()}
        onInteractOutside={(e) => !acknowledged && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("settings.security.mfa.backupCodes.dialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("settings.security.mfa.backupCodes.dialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <ul className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-4 font-mono text-sm">
          {(codes ?? []).map((code) => (
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

        <DialogFooter>
          <Button
            type="button"
            variant="primary"
            disabled={!acknowledged}
            onClick={close}
          >
            {t("settings.security.mfa.backupCodes.done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
