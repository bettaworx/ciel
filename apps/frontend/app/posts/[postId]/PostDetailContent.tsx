"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { toast } from "sonner";
import { authAtom } from "@/atoms/auth";
import { useApi } from "@/lib/api/use-api";
import { usePostContext, usePostThread } from "@/lib/hooks/use-queries";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  PostCard,
  PostTreeActionButton,
  type PostCardThreadLine,
} from "@/components/PostCard";
import { ComposeCard } from "@/components/ComposeCard";
import { Spinner } from "@/components/ui/spinner";
import {
  buildThreadRows,
  mergeThreadPages,
  removePostFromThreadPage,
} from "@/lib/post-thread-page";
import type { components } from "@/lib/api/api";

type Post = components["schemas"]["Post"];
type ThreadPage = components["schemas"]["ThreadPage"];

type PostDetailContentProps = {
  postId: string;
  expandAncestors?: boolean;
};

const ROOT_THREAD_DEPTH = 1;
const NESTED_THREAD_DEPTH = 5;
const THREAD_CHILD_LIMIT = 5;

function getThreadLine(
  hasPrevious: boolean,
  hasNext: boolean,
): PostCardThreadLine {
  if (hasPrevious && hasNext) return "both";
  if (hasPrevious) return "above";
  if (hasNext) return "below";
  return "none";
}

export function PostDetailContent({ postId, expandAncestors }: PostDetailContentProps) {
  const t = useTranslations();
  const router = useRouter();
  const auth = useAtomValue(authAtom);
  const api = useApi();
  const { data: context, isLoading, error } = usePostContext(postId);
  const post = context?.post;
  const parentPost = context?.parent ?? null;
  const threadDepth = post?.parentId ? NESTED_THREAD_DEPTH : ROOT_THREAD_DEPTH;
  const threadQueryParams = useMemo(
    () => ({ depth: threadDepth, childLimit: THREAD_CHILD_LIMIT }),
    [threadDepth],
  );
  const {
    data: initialThreadPage,
    isLoading: isThreadLoading,
    fetchPostThreadSlice,
  } = usePostThread(post ? postId : undefined, threadQueryParams);
  const [threadPage, setThreadPage] = useState<ThreadPage | null>(null);
  const [loadingThreadParentId, setLoadingThreadParentId] = useState<
    string | null
  >(null);
  const [ancestors, setAncestors] = useState<Post[]>([]);
  const [isLoadingAncestors, setIsLoadingAncestors] = useState(false);
  const detailPostRef = useRef<HTMLDivElement>(null);
  const hasAutoExpandedRef = useRef(false);
  const loadAncestorsEpochRef = useRef(0);

  useEffect(() => {
    setThreadPage(initialThreadPage ?? null);
    setLoadingThreadParentId(null);
    setAncestors([]);
    setIsLoadingAncestors(false);
    hasAutoExpandedRef.current = false;
    loadAncestorsEpochRef.current++;
  }, [initialThreadPage, postId]);

  const topAncestor = ancestors.length > 0 ? ancestors[0] : parentPost;
  const hasMoreAncestors = !!topAncestor?.parentId;

  const handleLoadMoreAncestors = useCallback(async () => {
    const startParentId = ancestors.length > 0
      ? ancestors[0].parentId
      : parentPost?.parentId;
    if (!startParentId || isLoadingAncestors) return;

    const epoch = ++loadAncestorsEpochRef.current;
    setIsLoadingAncestors(true);
    try {
      const collected: Post[] = [];
      let currentId: string = startParentId;

      while (true) {
        const result = await api.getPost(currentId);
        if (loadAncestorsEpochRef.current !== epoch) return;
        if (!result.ok) throw new Error(result.errorText);
        const post = result.data;
        collected.push(post);
        if (!post.parentId) break;
        currentId = post.parentId;
      }

      if (collected.length === 0) return;

      // collected は新しい順なので反転して古い順にする
      collected.reverse();

      if (loadAncestorsEpochRef.current !== epoch) return;
      const prevTop = detailPostRef.current?.getBoundingClientRect().top ?? 0;
      flushSync(() => {
        setAncestors((prev) => [...collected, ...prev]);
      });
      const newTop = detailPostRef.current?.getBoundingClientRect().top ?? 0;
      window.scrollBy({ top: newTop - prevTop, behavior: "instant" });
    } catch {
      toast.error(t("error.generic"));
    } finally {
      if (loadAncestorsEpochRef.current === epoch) {
        setIsLoadingAncestors(false);
      }
    }
  }, [ancestors, parentPost, isLoadingAncestors, api, t]);

  const threadRows = useMemo(
    () => (post && threadPage ? buildThreadRows(threadPage, post.id, post.author.id) : []),
    [post, threadPage],
  );
  const rootChildren = useMemo(
    () =>
      post
        ? threadPage?.children.find((children) => children.parentId === post.id)
        : undefined,
    [post, threadPage],
  );
  const hasMoreRootChildren = Boolean(
    rootChildren?.hasMore && rootChildren.nextCursor,
  );

  const handleLoadMoreThread = useCallback(
    async (parentPost: Post) => {
      if (loadingThreadParentId || !threadPage) return;

      const currentChildren = threadPage.children.find(
        (children) => children.parentId === parentPost.id,
      );
      const isDirectChildContinuation = Boolean(
        currentChildren?.hasMore && currentChildren.nextCursor,
      );

      setLoadingThreadParentId(parentPost.id);
      try {
        const chunk = await fetchPostThreadSlice(postId, {
          anchorNodeId: parentPost.id,
          cursor: isDirectChildContinuation
            ? currentChildren?.nextCursor
            : undefined,
          depth: isDirectChildContinuation ? 1 : NESTED_THREAD_DEPTH,
          childLimit: THREAD_CHILD_LIMIT,
        });

        setThreadPage((currentPage) => mergeThreadPages(currentPage, chunk));
      } catch {
        toast.error(t("error.generic"));
      } finally {
        setLoadingThreadParentId(null);
      }
    },
    [
      fetchPostThreadSlice,
      loadingThreadParentId,
      postId,
      t,
      threadPage,
    ],
  );
  useEffect(() => {
    if (!expandAncestors || !hasMoreAncestors || hasAutoExpandedRef.current) return;
    hasAutoExpandedRef.current = true;
    handleLoadMoreAncestors();
  }, [expandAncestors, hasMoreAncestors, handleLoadMoreAncestors]);

  const handleThreadPostDeleted = useCallback((deletedPostId: string) => {
    setThreadPage((currentPage) =>
      currentPage
        ? removePostFromThreadPage(currentPage, deletedPostId)
        : currentPage,
    );
  }, []);

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
            {hasMoreAncestors && (
              <PostTreeActionButton
                onClick={handleLoadMoreAncestors}
                isLast={false}
                threadLine="below"
                buttonProps={{
                  disabled: isLoadingAncestors,
                  "aria-busy": isLoadingAncestors,
                }}
              >
                {t("postDetail.loadMoreParents")}
              </PostTreeActionButton>
            )}
            {ancestors.map((ancestor, index) => (
              <PostCard
                key={ancestor.id}
                post={ancestor}
                isLast={false}
                variant="timeline"
                threadLine={index === 0 && !hasMoreAncestors ? "below" : "both"}
                onUserClick={(username) => router.push(`/users/${username}`)}
              />
            ))}
            {parentPost && (
              <PostCard
                post={parentPost}
                isLast={false}
                variant="timeline"
                threadLine={ancestors.length > 0 || hasMoreAncestors ? "both" : "below"}
                onUserClick={(username) => router.push(`/users/${username}`)}
              />
            )}
            <div ref={detailPostRef}>
              <PostCard
                post={post}
                isLast
                variant="detail"
                threadLine={parentPost || ancestors.length > 0 || hasMoreAncestors ? "above" : "none"}
                onUserClick={(username) => router.push(`/users/${username}`)}
                onDeleteSuccess={() => router.back()}
              />
            </div>
          </div>

          {auth.user && (
            <ComposeCard
              parentId={post.id}
              contentPrefix={`@${post.author.username} `}
              placeholderOverride={t("createPost.replyPlaceholder")}
            />
          )}

          {threadRows.length === 0 &&
            isThreadLoading &&
            post.replyCount > 0 && (
              <div className="bg-card rounded-xl sm:rounded-2xl overflow-hidden">
                <div className="flex items-center justify-center py-6">
                  <Spinner variant="theme" label={t("loading")} />
                </div>
              </div>
            )}

          {(threadRows.length > 0 || hasMoreRootChildren) && (
            <div className="bg-card rounded-xl sm:rounded-2xl overflow-hidden">
              {threadRows.map((row, index) => {
                const hasLoadButton = row.canLoadChildren;
                const nextRow = threadRows[index + 1];
                const hasRowsAfter =
                  Boolean(nextRow) || hasMoreRootChildren;
                const isDirectReplyToCurrentPost = row.parentId === post.id;
                const nextRowIsChild = nextRow?.parentId === row.post.id;
                const isLoadingContinuation =
                  loadingThreadParentId === row.post.id;

                return (
                  <Fragment key={row.post.id}>
                    <PostCard
                      post={row.post}
                      onUserClick={(username) =>
                        router.push(`/users/${username}`)
                      }
                      onDeleteSuccess={() => handleThreadPostDeleted(row.post.id)}
                      isLast={!hasRowsAfter && !hasLoadButton}
                      threadLine={getThreadLine(
                        !isDirectReplyToCurrentPost,
                        nextRowIsChild || hasLoadButton,
                      )}
                    />
                    {hasLoadButton && (
                      <PostTreeActionButton
                        onClick={() => handleLoadMoreThread(row.post)}
                        isLast={!hasRowsAfter}
                        threadLine={getThreadLine(true, nextRowIsChild)}
                        buttonProps={{
                          disabled: loadingThreadParentId !== null,
                          "aria-busy": isLoadingContinuation,
                        }}
                      >
                        {t("postDetail.loadMoreReplies")}
                      </PostTreeActionButton>
                    )}
                  </Fragment>
                );
              })}
              {hasMoreRootChildren && (
                <PostTreeActionButton
                  onClick={() => handleLoadMoreThread(post)}
                  isLast
                  threadLine="none"
                  buttonProps={{
                    disabled: loadingThreadParentId !== null,
                    "aria-busy": loadingThreadParentId === post.id,
                  }}
                >
                  {t("postDetail.loadMoreReplies")}
                </PostTreeActionButton>
              )}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
