"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { toast } from "sonner";
import { authAtom } from "@/atoms/auth";
import {
  useOwnerReplyThread,
  usePost,
  useReplies,
} from "@/lib/hooks/use-queries";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  PostCard,
  PostTreeActionButton,
  type PostCardThreadLine,
} from "@/components/PostCard";
import { ComposeCard } from "@/components/ComposeCard";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { groupOwnerReplyThreads } from "@/lib/post-thread";
import type { components } from "@/lib/api/api";

type Post = components["schemas"]["Post"];

type PostDetailContentProps = {
  postId: string;
};

function ParentPostSkeleton() {
  return (
    <article aria-hidden className="relative p-3 text-card-foreground">
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

export function PostDetailContent({ postId }: PostDetailContentProps) {
  const t = useTranslations();
  const router = useRouter();
  const auth = useAtomValue(authAtom);
  const { data: post, isLoading, error } = usePost(postId);
  const parentId = post?.parentId ?? undefined;
  const {
    data: parentPost,
    isLoading: isParentLoading,
    isFetching: isParentFetching,
  } = usePost(parentId);
  const {
    data: repliesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReplies(post ? postId : undefined);
  const {
    data: ownerThreadResult,
    fetchOwnerReplyThreadChunk,
  } = useOwnerReplyThread(post);
  const [ownerThreadReplies, setOwnerThreadReplies] = useState<Post[]>([]);
  const [
    ownerThreadContinuationParentIds,
    setOwnerThreadContinuationParentIds,
  ] = useState<Set<string>>(() => new Set());
  const [loadingOwnerThreadParentId, setLoadingOwnerThreadParentId] =
    useState<string | null>(null);

  useEffect(() => {
    setOwnerThreadReplies(ownerThreadResult?.replies ?? []);
    setOwnerThreadContinuationParentIds(
      new Set(ownerThreadResult?.continuationParentIds ?? []),
    );
    setLoadingOwnerThreadParentId(null);
  }, [ownerThreadResult, post?.id]);

  const replies = repliesData?.pages.flatMap((page) => page.items ?? []) ?? [];
  const ownerThreadReplyIds = useMemo(
    () => new Set(ownerThreadReplies.map((reply) => reply.id)),
    [ownerThreadReplies],
  );
  const ownerThreadGroups = useMemo(
    () => (post ? groupOwnerReplyThreads(post.id, ownerThreadReplies) : []),
    [ownerThreadReplies, post],
  );
  const visibleReplies = replies.filter(
    (reply) => !ownerThreadReplyIds.has(reply.id),
  );
  const hasReplyList = ownerThreadGroups.length > 0 || visibleReplies.length > 0;
  const showParentSkeleton =
    Boolean(parentId) && !parentPost && (isParentLoading || isParentFetching);
  const hasVisibleParent = Boolean(parentPost || showParentSkeleton);
  const infiniteScrollRef = useInfiniteScroll({
    enabled: replies.length > 0,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
  });
  const getOwnerThreadLine = (
    hasPrevious: boolean,
    hasNext: boolean,
  ): PostCardThreadLine => {
    if (hasPrevious && hasNext) return "both";
    if (hasPrevious) return "above";
    if (hasNext) return "below";
    return "none";
  };
  const handleLoadMoreOwnerThread = useCallback(
    async (parentReply: Post) => {
      if (!post || loadingOwnerThreadParentId) return;

      setLoadingOwnerThreadParentId(parentReply.id);
      try {
        const visitedPostIds = [
          post.id,
          ...ownerThreadReplies.map((reply) => reply.id),
        ];
        const chunk = await fetchOwnerReplyThreadChunk(
          parentReply,
          visitedPostIds,
        );

        setOwnerThreadReplies((currentReplies) => {
          const seenPostIds = new Set(
            currentReplies.map((reply) => reply.id),
          );
          const newReplies = chunk.replies.filter(
            (reply) => !seenPostIds.has(reply.id),
          );
          return [...currentReplies, ...newReplies];
        });
        setOwnerThreadContinuationParentIds((currentParentIds) => {
          const nextParentIds = new Set(currentParentIds);
          nextParentIds.delete(parentReply.id);
          for (const parentId of chunk.continuationParentIds) {
            nextParentIds.add(parentId);
          }
          return nextParentIds;
        });
      } catch {
        toast.error(t("error.generic"));
      } finally {
        setLoadingOwnerThreadParentId(null);
      }
    },
    [
      fetchOwnerReplyThreadChunk,
      loadingOwnerThreadParentId,
      ownerThreadReplies,
      post,
      t,
    ],
  );

  return (
    <PageContainer
      maxWidth="2xl"
      header={<PageHeader>{t("meta.pages.postDetail")}</PageHeader>}
    >
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner variant="theme" label={t("loading")} />
        </div>
      )}

      {!isLoading && error && (
        <div className="flex items-center justify-center py-12">
          <p className="text-destructive">
            {t("error.title")}: {error.message}
          </p>
        </div>
      )}

      {!isLoading && !error && !post && (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">{t("postDetail.notFound")}</p>
        </div>
      )}

      {post && (
        <div className="space-y-3">
          <div className="bg-card rounded-xl sm:rounded-2xl overflow-hidden">
            {parentPost ? (
              <PostCard
                post={parentPost}
                isLast={false}
                variant="timeline"
                threadLine="below"
                onUserClick={(username) => router.push(`/users/${username}`)}
              />
            ) : (
              showParentSkeleton && <ParentPostSkeleton />
            )}
            <PostCard
              post={post}
              isLast
              variant="detail"
              threadLine={hasVisibleParent ? "above" : "none"}
              onUserClick={(username) => router.push(`/users/${username}`)}
              onDeleteSuccess={() => router.back()}
            />
          </div>

          {auth.user && (
            <ComposeCard
              parentId={post.id}
              contentPrefix={`@${post.author.username} `}
              placeholderOverride={t("createPost.replyPlaceholder")}
            />
          )}

          {hasReplyList && (
            <div className="bg-card rounded-xl sm:rounded-2xl overflow-hidden">
              {ownerThreadGroups.map((thread, threadIndex) => (
                <Fragment key={thread[0]?.id ?? `thread-${threadIndex}`}>
                  {thread.map((reply, replyIndex) => {
                    const isLastThread =
                      threadIndex === ownerThreadGroups.length - 1;
                    const hasContinuation =
                      ownerThreadContinuationParentIds.has(reply.id);
                    const hasPreviousReplyInThread = replyIndex > 0;
                    const hasNextReplyInThread =
                      replyIndex < thread.length - 1;
                    const hasRowsAfterReply =
                      hasContinuation ||
                      hasNextReplyInThread ||
                      !isLastThread ||
                      visibleReplies.length > 0;
                    const isLoadingContinuation =
                      loadingOwnerThreadParentId === reply.id;

                    return (
                      <Fragment key={reply.id}>
                        <PostCard
                          post={reply}
                          onUserClick={(username) =>
                            router.push(`/users/${username}`)
                          }
                          isLast={!hasRowsAfterReply}
                          threadLine={getOwnerThreadLine(
                            hasPreviousReplyInThread,
                            hasContinuation || hasNextReplyInThread,
                          )}
                        />
                        {hasContinuation && (
                          <PostTreeActionButton
                            onClick={() => handleLoadMoreOwnerThread(reply)}
                            isLast={
                              !hasNextReplyInThread &&
                              isLastThread &&
                              visibleReplies.length === 0
                            }
                            threadLine={getOwnerThreadLine(
                              true,
                              hasNextReplyInThread,
                            )}
                            buttonProps={{
                              disabled: loadingOwnerThreadParentId !== null,
                              "aria-busy": isLoadingContinuation,
                            }}
                          >
                            {t("postDetail.loadMoreOwnerThread")}
                          </PostTreeActionButton>
                        )}
                      </Fragment>
                    );
                  })}
                </Fragment>
              ))}
              {visibleReplies.map((reply, index) => (
                <PostCard
                  key={reply.id}
                  post={reply}
                  onUserClick={(username) => router.push(`/users/${username}`)}
                  isLast={index === visibleReplies.length - 1}
                />
              ))}
            </div>
          )}

          <InfiniteScrollTrigger
            sentinelRef={infiniteScrollRef}
            hasNextPage={Boolean(hasNextPage)}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      )}
    </PageContainer>
  );
}
