"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bookmark } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { PostCard } from "@/components/PostCard";
import { EmojiInline } from "@/components/EmojiInline";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { BookmarkListRowMenu } from "@/components/bookmarks/BookmarkListRowMenu";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { useBookmarkLists, useBookmarkListPosts } from "@/lib/hooks/use-bookmarks";

export function BookmarkListContent({ listId }: { listId: string }) {
  const t = useTranslations("bookmarks");
  const tCommon = useTranslations();
  const router = useRouter();

  // The list metadata rides along on the lists query the nav already warms, so
  // the header costs no extra request.
  const { data: lists } = useBookmarkLists();
  const list = lists?.find((candidate) => candidate.id === listId);

  const query = useBookmarkListPosts(listId);
  const posts = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  const sentinelRef = useInfiniteScroll({
    enabled: posts.length > 0,
    hasNextPage: Boolean(query.hasNextPage),
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  });

  return (
    <PageContainer
      maxWidth="2xl"
      header={
        <PageHeader
          action={
            list && (
              <BookmarkListRowMenu
                list={list}
                onDeleted={() => router.replace("/bookmarks")}
              />
            )
          }
        >
          <span className="flex items-center gap-2">
            {list && <EmojiInline emoji={list.icon} />}
            {list ? (list.name ?? t("defaultListName")) : t("title")}
          </span>
        </PageHeader>
      }
    >
      <div className="space-y-3">
        <div className="overflow-hidden rounded-xl bg-card sm:rounded-2xl">
          {query.isPending && posts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Spinner variant="theme" label={tCommon("loading")} />
            </div>
          ) : query.error ? (
            <div className="p-6 text-center">
              <p className="text-destructive">
                {tCommon("error.title")}: {query.error.message}
              </p>
            </div>
          ) : posts.length === 0 ? (
            <EmptyState icon={Bookmark} title={t("emptyList")} />
          ) : (
            posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                variant="timeline"
                isLast={index === posts.length - 1}
                onUserClick={(username) =>
                  router.push(`/users/${encodeURIComponent(username)}`)
                }
              />
            ))
          )}
        </div>

        <InfiniteScrollTrigger
          sentinelRef={sentinelRef}
          hasNextPage={Boolean(query.hasNextPage)}
          isFetchingNextPage={query.isFetchingNextPage}
        />
      </div>
    </PageContainer>
  );
}
