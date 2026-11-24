import { createFileRoute } from "@tanstack/react-router";
import { DynamicTitle } from "@/components/DynamicTitle";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { BookmarksContent } from "@/components/bookmarks/BookmarksContent";

export const Route = createFileRoute("/bookmarks/")({
  component: BookmarksPage,
});

function BookmarksPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.bookmarks" />
      <RequireAuth>
        <BookmarksContent />
      </RequireAuth>
    </>
  );
}
