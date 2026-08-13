"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bookmark, Plus } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmojiInline } from "@/components/EmojiInline";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { BookmarkListFormDialog } from "@/components/bookmarks/BookmarkListFormDialog";
import { BookmarkListRowMenu } from "@/components/bookmarks/BookmarkListRowMenu";
import { useBookmarkLists } from "@/lib/hooks/use-bookmarks";

export function BookmarksContent() {
  const t = useTranslations("bookmarks");
  const tCommon = useTranslations();
  const [createOpen, setCreateOpen] = useState(false);
  const { data: lists, isPending, error } = useBookmarkLists();

  return (
    <PageContainer
      maxWidth="2xl"
      // Reached from the nav, so there is nothing to go back to.
      header={
        <PageHeader
          showBackButton={false}
          action={
            <Button
              variant="ghost"
              size="icon"
              // Same muted-until-hover treatment as the list menu's trigger, so
              // the two pages' header actions read as the same control.
              className="text-muted-foreground hover:text-foreground"
              aria-label={t("createList")}
              title={t("createList")}
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-5 w-5" />
            </Button>
          }
        >
          {t("title")}
        </PageHeader>
      }
    >
      <div className="space-y-3">
        <div className="overflow-hidden rounded-xl bg-card sm:rounded-2xl">
          {isPending ? (
            <div className="flex items-center justify-center py-12">
              <Spinner variant="theme" label={tCommon("loading")} />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-destructive">
                {tCommon("error.title")}: {error.message}
              </p>
            </div>
          ) : lists?.length ? (
            <ul>
              {lists.map((list) => (
                <li
                  key={list.id}
                  className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <Link
                    href={`/bookmarks/${list.id}`}
                    className="flex min-w-0 grow items-center gap-3"
                  >
                    <EmojiInline emoji={list.icon} className="h-5 w-5 shrink-0" />
                    <span className="truncate font-medium">
                      {list.name ?? t("defaultListName")}
                    </span>
                    <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                      {t("postCount", { count: list.postCount })}
                    </span>
                  </Link>
                  <BookmarkListRowMenu list={list} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Bookmark}
              title={t("empty")}
              description={t("emptyDescription")}
            />
          )}
        </div>
      </div>

      <BookmarkListFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </PageContainer>
  );
}
