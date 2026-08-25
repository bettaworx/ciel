"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

const MAX_NAME_LENGTH = 64;
const FORM_ID = "security-key-name-form";

interface SecurityKeyNameDialogProps {
  open: boolean;
  /** The name to start from: the placeholder for a new key, the current one otherwise. */
  initialName: string;
  /** A key that was just registered is being named for the first time. */
  isNew: boolean;
  busy?: boolean;
  onSubmit: (name: string) => void;
  onDismiss: () => void;
}

/**
 * Names a security key, whether it was just registered or is being renamed.
 *
 * Registration used to drop the new key's row into an inline edit, which put a
 * text field and two buttons inside a list row and left the user hunting for
 * what had changed. Asking here keeps the naming where the flow already is.
 */
export function SecurityKeyNameDialog({
  open,
  initialName,
  isNew,
  busy = false,
  onSubmit,
  onDismiss,
}: SecurityKeyNameDialogProps) {
  const t = useTranslations();
  const [name, setName] = useState(initialName);

  // Seeded when it opens rather than from an effect, so the previous key's name
  // never reaches the screen — and not on close, which would blank the field
  // while the sheet is still animating down.
  const wasOpen = useRef(false);
  if (open !== wasOpen.current) {
    wasOpen.current = open;
    if (open) setName(initialName);
  }

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && !busy;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => !next && onDismiss()}
      // A key that has just been registered is trapped here until the footer
      // answers: swiping the sheet away would leave it sitting in the list
      // under a placeholder name with nothing having asked. A later rename is
      // an ordinary edit and closes like one.
      dismissible={!isNew}
      title={t(
        isNew
          ? "settings.security.mfa.securityKeys.nameTitle"
          : "settings.security.mfa.securityKeys.rename",
      )}
      description={t("settings.security.mfa.securityKeys.nameDescription")}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onDismiss} disabled={busy}>
            {t(
              isNew
                ? "settings.security.mfa.securityKeys.nameLater"
                : "settings.security.mfa.cancel",
            )}
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" disabled={!canSubmit}>
            {busy ? t("loading") : t("settings.security.mfa.securityKeys.saveName")}
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onSubmit(trimmed);
        }}
        className="space-y-3"
      >
        <Label className="text-muted-foreground" htmlFor="security-key-name">
          {t("settings.security.mfa.securityKeys.nameLabel")}
        </Label>
        <Input
          id="security-key-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_NAME_LENGTH}
          autoComplete="off"
          autoFocus
          disabled={busy}
        />
      </form>
    </ResponsiveDialog>
  );
}
