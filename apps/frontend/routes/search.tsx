import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DynamicTitle } from "@/components/DynamicTitle";
import { resolveSearchTab } from "@/lib/search-tabs";
import { SearchContent } from "@/components/search/SearchContent";
import { asText, textSearchParam } from "@/lib/search-params";

const searchSchema = z.object({
  q: textSearchParam,
  type: textSearchParam,
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  component: SearchPage,
});

function SearchPage() {
  const { q, type } = Route.useSearch();

  return (
    <>
      <DynamicTitle titleKey="meta.pages.search" />
      <SearchContent query={asText(q) ?? ""} tab={resolveSearchTab(asText(type))} />
    </>
  );
}
