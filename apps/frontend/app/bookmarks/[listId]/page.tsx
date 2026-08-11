import React from "react";
import { DynamicTitle } from "@/components/DynamicTitle";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { BookmarkListContent } from "./BookmarkListContent";

type PageProps = {
  params: Promise<{ listId: string }>;
};

export default function BookmarkListPage({ params }: PageProps) {
  const { listId } = React.use(params);

  return (
    <>
      <DynamicTitle titleKey="meta.pages.bookmarks" />
      <RequireAuth>
        <BookmarkListContent listId={listId} />
      </RequireAuth>
    </>
  );
}
