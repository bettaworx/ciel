"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAtom } from "jotai";
import type { LucideIcon } from "lucide-react";
import { stepupTokenAtom, usableStepupToken } from "@/atoms/stepup";
import { useStepup } from "@/lib/hooks/use-stepup";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { StepupPrompt } from "@/components/settings/StepupPrompt";

interface StepupRowProps {
  icon?: LucideIcon;
  label: string;
  /** Where to go once identity is proven. */
  href: string;
  className?: string;
}

/**
 * A settings row for an operation that cannot begin without re-authenticating.
 *
 * The prompt goes up over the list rather than on the destination, so the URL
 * only moves once identity is proven — nothing behind these rows can render
 * anything useful without a token anyway. The screen it lands on wraps itself
 * in StepupGate, which covers arriving by deep link or reload with no token to
 * pick up.
 */
export function StepupRow({ icon, label, href, className }: StepupRowProps) {
  const t = useTranslations();
  const router = useRouter();
  const [shared, setShared] = useAtom(stepupTokenAtom);
  const [promptOpen, setPromptOpen] = useState(false);

  const handleToken = useCallback(
    (token: string, expiresInSeconds: number) => {
      setShared({ token, expiresAt: Date.now() + expiresInSeconds * 1000 });
      setPromptOpen(false);
      router.push(href);
    },
    [setShared, router, href],
  );

  const stepup = useStepup({ onToken: handleToken });

  const open = () => {
    // Coming straight back inside the five-minute window should not ask again —
    // that window is the whole point of sudo mode. Screens that spend the token
    // clear the atom on success, so this only skips the prompt when it is still
    // worth something.
    if (usableStepupToken(shared)) {
      router.push(href);
      return;
    }
    stepup.invalidate();
    setPromptOpen(true);
  };

  return (
    <>
      <SettingsRow icon={icon} label={label} className={className} onClick={open} />
      <StepupPrompt
        open={promptOpen}
        heading={t("settings.reauth.heading")}
        stepup={stepup}
        onDismiss={() => setPromptOpen(false)}
      />
    </>
  );
}
