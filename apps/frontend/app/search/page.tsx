import React from "react";
import { DynamicTitle } from "@/components/DynamicTitle";
import { resolveSearchTab } from "@/lib/search-tabs";
import { SearchContent } from "./SearchContent";

type PageProps = {
  searchParams: Promise<{ q?: string; type?: string }>;
};

export default function SearchPage({ searchParams }: PageProps) {
  const resolvedSearch = React.use(searchParams);

  return (
    <>
      <DynamicTitle titleKey="meta.pages.search" />
      <SearchContent
        query={resolvedSearch.q ?? ""}
        tab={resolveSearchTab(resolvedSearch.type)}
      />
    </>
  );
}
