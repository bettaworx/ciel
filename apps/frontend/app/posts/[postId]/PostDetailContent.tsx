"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { authAtom } from "@/atoms/auth";
import { usePost, useReplies } from "@/lib/hooks/use-queries";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { PostCard } from "@/components/PostCard";
import { ComposeCard } from "@/components/ComposeCard";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";
import { Spinner } from "@/components/ui/spinner";

type PostDetailContentProps = {
  postId: string;
};

export function PostDetailContent({ postId }: PostDetailContentProps) {
  const t = useTranslations();
  const router = useRouter();
  const auth = useAtomValue(authAtom);
  const { data: post, isLoading, error } = usePost(postId);
  const {
    data: repliesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReplies(post ? postId : undefined);

  const replies = repliesData?.pages.flatMap((page) => page.items ?? []) ?? [];
  const infiniteScrollRef = useInfiniteScroll({
    enabled: replies.length > 0,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
  });

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
            <PostCard
              post={post}
              isLast
              variant="detail"
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

          {replies.length > 0 && (
            <div className="bg-card rounded-xl sm:rounded-2xl overflow-hidden">
              {replies.map((reply, index) => (
                <PostCard
                  key={reply.id}
                  post={reply}
                  onUserClick={(username) => router.push(`/users/${username}`)}
                  isLast={index === replies.length - 1}
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
