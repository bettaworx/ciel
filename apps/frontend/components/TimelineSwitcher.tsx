"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TimelineScope } from "@/atoms/timeline";

type TimelineSwitcherProps = {
  value: TimelineScope;
  onChange: (scope: TimelineScope) => void;
};

/**
 * Switches the home page between the following-only and global timelines.
 *
 * Only rendered for signed-in users: the home timeline needs a viewer, so there
 * is nothing to switch to when signed out.
 */
export function TimelineSwitcher({ value, onChange }: TimelineSwitcherProps) {
  const t = useTranslations();

  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as TimelineScope)}>
      <TabsList className="w-full rounded-xl sm:rounded-2xl">
        <TabsTrigger value="home">{t("timeline.scope.home")}</TabsTrigger>
        <TabsTrigger value="global">{t("timeline.scope.global")}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
