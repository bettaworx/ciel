"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SearchTab } from "@/lib/search-tabs";

type SearchTabsProps = {
  value: SearchTab;
  onChange: (tab: SearchTab) => void;
};

/** Switches the search results between matching posts and matching users. */
export function SearchTabs({ value, onChange }: SearchTabsProps) {
  const t = useTranslations("search");

  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as SearchTab)}>
      <TabsList className="w-full rounded-xl sm:rounded-2xl">
        <TabsTrigger value="posts">{t("tabs.posts")}</TabsTrigger>
        <TabsTrigger value="users">{t("tabs.users")}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
