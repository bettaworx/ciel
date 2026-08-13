import { DynamicTitle } from "@/components/DynamicTitle";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { BookmarksContent } from "./BookmarksContent";

export default function BookmarksPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.bookmarks" />
      <RequireAuth>
        <BookmarksContent />
      </RequireAuth>
    </>
  );
}
