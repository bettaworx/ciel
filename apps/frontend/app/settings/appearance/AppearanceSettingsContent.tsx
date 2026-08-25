"use client";

import { useTranslations } from "next-intl";
import { useAtom } from "jotai";
import { Palette } from "lucide-react";
import {
  SettingsRowGroup,
  SettingsSelectRow,
} from "@/components/settings/SettingsRow";
import { PageHeader } from "@/components/shared/PageHeader";
import { MfmSettingsSection } from "@/components/settings/MfmSettingsSection";
import { themeAtom } from "@/atoms/theme";

export function AppearanceSettingsContent() {
  const t = useTranslations();
  const [theme, setTheme] = useAtom(themeAtom);

  return (
    <>
      <PageHeader backHref="/settings">
        {t("settings.appearance.title")}
      </PageHeader>
      <div className="space-y-3">
        <SettingsRowGroup>
          <SettingsSelectRow
            icon={Palette}
            label={t("settings.appearance.theme.title")}
            value={theme}
            options={[
              { value: "light", label: t("settings.appearance.theme.light") },
              { value: "dark", label: t("settings.appearance.theme.dark") },
              { value: "system", label: t("settings.appearance.theme.system") },
            ]}
            onValueChange={setTheme}
          />
        </SettingsRowGroup>

        <MfmSettingsSection />
      </div>
    </>
  );
}
