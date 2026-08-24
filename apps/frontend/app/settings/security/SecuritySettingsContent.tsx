"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAtom } from "jotai";
import { KeyRound, ShieldCheck } from "lucide-react";
import { mfaStepupTokenAtom, usableStepupToken } from "@/atoms/stepup";
import { useStepup } from "@/lib/hooks/use-stepup";
import { PageHeader } from "@/components/shared/PageHeader";
import { SettingsRow, SettingsRowGroup } from "@/components/settings/SettingsRow";
import { StepupPrompt } from "@/components/settings/StepupPrompt";

const MFA_HREF = "/settings/security/mfa";

export function SecuritySettingsContent() {
  const t = useTranslations();
  const router = useRouter();
  const [shared, setShared] = useAtom(mfaStepupTokenAtom);
  const [promptOpen, setPromptOpen] = useState(false);

  // The MFA screen can show nothing without a step-up token, so the token is
  // earned here: the prompt goes up over this page and the URL only moves once
  // identity is proven.
  const handleToken = useCallback(
    (token: string, expiresInSeconds: number) => {
      setShared({ token, expiresAt: Date.now() + expiresInSeconds * 1000 });
      setPromptOpen(false);
      router.push(MFA_HREF);
    },
    [setShared, router],
  );

  const stepup = useStepup({ onToken: handleToken });

  const openMfa = () => {
    // Coming straight back from the MFA screen inside the five-minute window
    // should not ask again — that window is the whole point of sudo mode.
    if (usableStepupToken(shared)) {
      router.push(MFA_HREF);
      return;
    }
    stepup.invalidate();
    setPromptOpen(true);
  };

  return (
    <>
      <PageHeader backHref="/settings">
        {t("settings.security.title")}
      </PageHeader>
      <div className="space-y-3">
        <SettingsRowGroup>
          <SettingsRow
            icon={KeyRound}
            label={t("settings.security.password.title")}
            href="/settings/security/password"
          />
          <SettingsRow
            icon={ShieldCheck}
            label={t("settings.security.mfa.title")}
            onClick={openMfa}
          />
        </SettingsRowGroup>
      </div>

      <StepupPrompt
        open={promptOpen}
        heading={t("settings.reauth.heading")}
        stepup={stepup}
        onDismiss={() => setPromptOpen(false)}
      />
    </>
  );
}
