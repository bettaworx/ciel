import { createFileRoute } from "@tanstack/react-router";
import { DynamicTitle } from "@/components/DynamicTitle";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { BookmarkListContent } from "@/components/bookmarks/BookmarkListContent";

export const Route = createFileRoute("/bookmarks/$listId")({
  component: BookmarkListPage,
});

function BookmarkListPage() {
  const { listId } = Route.useParams();

  return (
    <>
      <DynamicTitle titleKey="meta.pages.bookmarks" />
      <RequireAuth>
        <BookmarkListContent listId={listId} />
      </RequireAuth>
    </>
  );
}
