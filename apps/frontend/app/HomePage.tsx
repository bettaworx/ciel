"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { authAtom } from "@/atoms/auth";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { usePost, useTimeline } from "@/lib/hooks/use-queries";
import { useOwnerThreadTimelineItems } from "@/lib/hooks/use-owner-thread-timeline-items";
import { PageContainer } from "@/components/PageContainer";
import { PostCard } from "@/components/PostCard";
import { DeletedPostCard } from "@/components/DeletedPostCard";
import { OwnerThreadTimelineItem } from "@/components/OwnerThreadTimelineItem";
import { WelcomeCard } from "@/components/WelcomeCard";
import { ComposeCard } from "@/components/ComposeCard";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Rocket } from "lucide-react";
import type { components } from "@/lib/api/api";

type Post = components["schemas"]["Post"];

function isPureBoost(post: Post): boolean {
  return post.content === "" && !!post.referenceId;
}

type TimelinePostItemProps = {
  post: Post;
  isLast: boolean;
  onUserClick: (username: string) => void;
};

function TimelineParentPostSkeleton() {
  return (
    <article
      aria-hidden
      className="relative p-3 text-card-foreground"
    >
      <span className="absolute left-8 sm:left-9 top-14 sm:top-16 bottom-0 w-0.5 -translate-x-1/2 bg-border" />
      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 sm:h-12 sm:w-12 rounded-full shrink-0" />
        <div className="min-w-0 flex-1 space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-14" />
          </div>
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-4 w-2/3 max-w-xs" />
        </div>
      </div>
    </article>
  );
}

function TimelinePostItem({ post, isLast, onUserClick }: TimelinePostItemProps) {
  const t = useTranslations();
  const pureBoost = isPureBoost(post);
  const boostReferenceId = pureBoost ? post.referenceId! : undefined;
  const parentId = pureBoost ? undefined : (post.parentId ?? undefined);
  const { data: boostedPost } = usePost(boostReferenceId);
  const {
    data: parentPost,
    isLoading: isParentLoading,
    isFetching: isParentFetching,
  } = usePost(parentId);
  const showParentSkeleton =
    Boolean(parentId) && !parentPost && (isParentLoading || isParentFetching);
  const hasVisibleParent = Boolean(parentPost || showParentSkeleton);

  if (pureBoost) {
    const displayPost = boostedPost ?? post.reference;
    const boostIndicator = {
      icon: <Rocket className="h-3.5 w-3.5" />,
      label: t("postCard.actions.boostedBy", {
        name: post.author.displayName || post.author.username,
      }),
      createdAt: post.createdAt,
      sourcePostId: post.id,
      actorUserId: post.author.id,
    };
    if (!displayPost) {
      return (
        <DeletedPostCard
          referenceId={post.referenceId!}
          variant="timeline"
          isLast={isLast}
          indicator={boostIndicator}
        />
      );
    }
    return (
      <PostCard
        post={displayPost}
        onUserClick={onUserClick}
        isLast={isLast}
        indicator={boostIndicator}
      />
    );
  }

  if (!parentId || !hasVisibleParent) {
    return (
      <PostCard
        post={post}
        onUserClick={onUserClick}
        isLast={isLast}
      />
    );
  }

  return (
    <>
      {parentPost ? (
        <PostCard
          post={parentPost}
          onUserClick={onUserClick}
          isLast={false}
          threadLine="below"
        />
      ) : (
        <TimelineParentPostSkeleton />
      )}
      <PostCard
        post={post}
        onUserClick={onUserClick}
        isLast={isLast}
        threadLine="above"
      />
    </>
  );
}

export function HomePage() {
  const t = useTranslations();
  const router = useRouter();
  const auth = useAtomValue(authAtom);
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTimeline();

  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.items ?? []) ?? [],
    [data],
  );
  const timelineItems = useOwnerThreadTimelineItems(posts);
  const infiniteScrollRef = useInfiniteScroll({
    enabled: posts.length > 0,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
  });

  return (
    <PageContainer maxWidth="2xl">
      <div className="space-y-3">
        {auth.user ? <ComposeCard /> : <WelcomeCard />}
        <div className="bg-card rounded-xl sm:rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner variant="theme" label={t("loading")} />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-destructive">
                {t("error.title")}: {error.message}
              </p>
            </div>
          ) : posts.length === 0 ? (
            <p className="text-muted-foreground p-3">{t("timeline.noPosts")}</p>
          ) : (
            timelineItems.map((item, index) =>
              item.type === "post" ? (
                <TimelinePostItem
                  key={item.post.id}
                  post={item.post}
                  onUserClick={(username) => router.push(`/users/${username}`)}
                  isLast={index === timelineItems.length - 1}
                />
              ) : (
                <OwnerThreadTimelineItem
                  key={`${item.rootPost.id}:${item.replies.map((reply) => reply.id).join(":")}`}
                  rootPost={item.rootPost}
                  replies={item.replies}
                  isMerged={item.isMerged}
                  onUserClick={(username) => router.push(`/users/${username}`)}
                  onShowThread={() => router.push(`/posts/${item.replies[0]?.id ?? item.rootPost.id}?expandAncestors=1`)}
                  isLast={index === timelineItems.length - 1}
                />
              ),
            )
          )}
        </div>

        <InfiniteScrollTrigger
          sentinelRef={infiniteScrollRef}
          hasNextPage={Boolean(hasNextPage)}
          isFetchingNextPage={isFetchingNextPage}
        />
      </div>
    </PageContainer>
  );
}
