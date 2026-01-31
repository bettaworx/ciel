"use client";

import { useTranslations } from "next-intl";
import { useAtom } from "jotai";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SettingItem } from "@/components/settings/SettingItem";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { themeAtom, type Theme } from "@/atoms/theme";

export function AppearanceSettingsContent() {
  const t = useTranslations();
  const [theme, setTheme] = useAtom(themeAtom);

  const handleThemeChange = (value: Theme) => {
    setTheme(value);
  };

  return (
    <div className="space-y-3">
      <SettingsPageHeader currentPageKey="settings.appearance.title" />

      <SettingItem
        title={t("settings.appearance.theme.title")}
        description={t("settings.appearance.theme.description")}
        align="start"
        helperText={
          theme === "system"
            ? t("settings.appearance.theme.systemDescription")
            : undefined
        }
      >
        <RadioGroup
          value={theme}
          onValueChange={handleThemeChange}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="light" id="light" />
            <Label htmlFor="light" className="cursor-pointer">
              {t("settings.appearance.theme.light")}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="dark" id="dark" />
            <Label htmlFor="dark" className="cursor-pointer">
              {t("settings.appearance.theme.dark")}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="system" id="system" />
            <Label htmlFor="system" className="cursor-pointer">
              {t("settings.appearance.theme.system")}
            </Label>
          </div>
        </RadioGroup>
      </SettingItem>
    </div>
  );
}
