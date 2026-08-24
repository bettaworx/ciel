"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { toast } from "sonner";
import { userAtom } from "@/atoms/auth";
import type { useStepup } from "@/lib/hooks/use-stepup";
import { useMfaChallenge } from "@/lib/hooks/use-mfa-challenge";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerFooter, DrawerTitle } from "@/components/ui/drawer";
import { PasswordStep } from "@/components/auth/login/PasswordStep";
import { MfaChallengeStep } from "@/components/auth/MfaChallengeStep";

type FormFactor = "dialog" | "sheet";

/**
 * Dialog on a wide window, bottom sheet on a narrow one — decided once, when
 * the prompt opens.
 *
 * Swapping mid-flow tears one modal down and builds another: focus is lost,
 * the close animation never runs, and the body styles the outgoing one
 * installed can outlive it, leaving the page stuck behind a dead overlay. So
 * the choice is held for as long as the prompt is up, and resizing across the
 * breakpoint waits until it closes.
 *
 * Returning null covers the first client render, where useMediaQuery has not
 * measured yet and still reports false — without it a desktop would flash a
 * sheet and tear it straight down, which is the same swap by another name.
 */
function useModalFormFactor(open: boolean): FormFactor | null {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [measured, setMeasured] = useState(false);
  useEffect(() => setMeasured(true), []);

  const held = useRef<FormFactor | null>(null);
  if (!measured) return null;

  const current: FormFactor = isDesktop ? "dialog" : "sheet";
  // Closed, so there is nothing to disturb: follow the breakpoint freely.
  if (!open || !held.current) held.current = current;
  return held.current;
}

interface StepupPromptProps {
  open: boolean;
  /** Heading shown above the password field. */
  heading: string;
  /** The exchange this prompt drives, from useStepup. */
  stepup: ReturnType<typeof useStepup>;
  /** Backing out of the first step. */
  onDismiss: () => void;
}

/**
 * Asks for the password, then a second factor when the account has one.
 *
 * Desktop gets a dialog, mobile a bottom sheet — the same split
 * BookmarkListFormDialog uses. Neither offers a corner X or a drag handle: the
 * footer owns the way out, so there is exactly one.
 *
 * The steps are the login screen's own, so password managers, the sr-only
 * username field and the profile display all behave identically here.
 */
export function StepupPrompt({ open, heading, stepup, onDismiss }: StepupPromptProps) {
  const t = useTranslations();
  const user = useAtomValue(userAtom);
  const formFactor = useModalFormFactor(open);
  const isDesktop = formFactor === "dialog";

  const isMfa = stepup.phase === "mfa";
  const challenge = useMfaChallenge(stepup.methods, {
    verifyWithSecurityKey: stepup.submitMfaWebAuthn,
  });
  // Both footer slots follow the stage: the primary becomes the backup-code
  // fallback or a retry, and back walks to the factor chooser before it leaves.
  const primaryLabel = isMfa ? challenge.primaryOverride : "setup.next";
  const primaryIsFallback = typeof primaryLabel === "string" && primaryLabel !== "setup.next";
  const secondaryLabel = (isMfa && challenge.secondaryOverride) || "setup.back";
  const formId = isMfa ? "stepup-prompt-mfa-form" : "login-password-form";

  const body = isMfa ? (
    <MfaChallengeStep
      challenge={challenge}
      formId={formId}
      loading={stepup.loading}
      presentation={isDesktop ? "wizard" : "sheet"}
      onSubmitCode={async (code, method) => {
        const failure = await stepup.submitMfaCode(code, method);
        if (failure) challenge.fail(failure);
      }}
    />
  ) : (
    <PasswordStep
      username={user?.username ?? ""}
      heading={heading}
      loading={stepup.loading}
      presentation={isDesktop ? "wizard" : "sheet"}
      onSubmit={async (password) => {
        const failure = await stepup.submitPassword(password);
        if (failure) toast.error(t(failure));
      }}
    />
  );

  const actions = (
    <>
      <Button
        type="button"
        variant="secondary"
        // From the second factor, back means the password again; from the
        // password there is nothing above but whatever raised this prompt.
        // Inside the challenge, back walks to the factor chooser first; only
        // once there is nothing above it does it leave for the password.
        onClick={() => {
          if (!isMfa) return onDismiss();
          if (!challenge.goBack()) stepup.invalidate();
        }}
        disabled={stepup.loading}
      >
        {t(secondaryLabel)}
      </Button>
      {primaryLabel !== null && (
        <Button
          type="submit"
          form={formId}
          variant={primaryIsFallback ? "secondary" : "primary"}
          disabled={stepup.loading || (isMfa && challenge.primaryDisabled)}
        >
          {stepup.loading ? t("loading") : t(primaryLabel ?? "setup.next")}
        </Button>
      )}
    </>
  );

  // Nothing to show until the viewport has been measured.
  if (!formFactor) return null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(next) => !next && onDismiss()}>
        <DialogContent hideClose className="gap-6">
          {/* The steps carry their own visible heading; Radix still needs a
              title for the accessible name. */}
          <DialogTitle className="sr-only">{heading}</DialogTitle>
          {body}
          <DialogFooter>{actions}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    // dismissible={false}: the sheet cannot be dragged or swiped away, so a
    // half-finished re-auth never disappears under a stray scroll.
    <Drawer open={open} dismissible={false} onOpenChange={(next) => !next && onDismiss()}>
      <DrawerContent hideHandle>
        <div className="px-4 pb-4 pt-6">
          <DrawerTitle className="sr-only">{heading}</DrawerTitle>
          {body}
          <DrawerFooter className="mt-6 flex-row justify-between p-0">
            {actions}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
