import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DynamicTitle } from "@/components/DynamicTitle";
import { resolveSearchTab } from "@/lib/search-tabs";
import { SearchContent } from "@/components/search/SearchContent";

const searchSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
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
      <SearchContent query={q ?? ""} tab={resolveSearchTab(type)} />
    </>
  );
}
