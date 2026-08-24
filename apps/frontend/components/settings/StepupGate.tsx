"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { stepupTokenAtom, usableStepupToken } from "@/atoms/stepup";
import { useStepup } from "@/lib/hooks/use-stepup";
import { StepupPrompt } from "@/components/settings/StepupPrompt";

interface StepupGateProps {
  /** Heading shown above the password field. */
  heading: string;
  /** Where backing out of the prompt returns to. */
  cancelHref: string;
  /**
   * Rendered once identity is proven. `invalidate` drops the token and raises
   * the prompt again — call it when the server answers 401.
   */
  children: (stepupToken: string, invalidate: () => void) => React.ReactNode;
}

/**
 * Guards a whole screen with one step-up token, rather than a single operation
 * (that is StepupWizard's job).
 *
 * This is sudo mode: the MFA management endpoints accept the same token for the
 * five minutes it is valid (stepupMfaMaxUses on the backend), so enrolling TOTP,
 * adding a key and regenerating backup codes all happen after one password
 * prompt. The token stays in memory and never reaches storage.
 *
 * Normally the prompt is answered before arriving — StepupRow does that, so the
 * URL only changes once identity is proven — and the token is picked up from
 * stepupTokenAtom. Landing here directly, by deep link or reload, finds that
 * atom empty and asks in place instead.
 */
export function StepupGate({ heading, cancelHref, children }: StepupGateProps) {
  const router = useRouter();
  const [shared, setShared] = useAtom(stepupTokenAtom);

  const publish = useCallback(
    (token: string, expiresInSeconds: number) =>
      setShared({ token, expiresAt: Date.now() + expiresInSeconds * 1000 }),
    [setShared],
  );

  const stepup = useStepup({ onToken: publish });
  const token = stepup.token ?? usableStepupToken(shared);

  const invalidate = useCallback(() => {
    // Clear both, or the next render seeds straight back off the stale atom.
    setShared(null);
    stepup.invalidate();
  }, [setShared, stepup]);

  if (token) return <>{children(token, invalidate)}</>;

  return (
    <StepupPrompt
      open
      heading={heading}
      stepup={stepup}
      // replace, not push: backing out is a step up, so it must not sit in the
      // history for the parent's own back arrow.
      onDismiss={() => router.replace(cancelHref)}
    />
  );
}
