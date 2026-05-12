"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePost } from "@/lib/hooks/use-queries";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { PostCard } from "@/components/PostCard";
import { Spinner } from "@/components/ui/spinner";

type PostDetailContentProps = {
  postId: string;
};

export function PostDetailContent({ postId }: PostDetailContentProps) {
  const t = useTranslations();
  const router = useRouter();
  const { data: post, isLoading, error } = usePost(postId);

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
        <div className="bg-card rounded-xl sm:rounded-2xl overflow-hidden">
          <PostCard
            post={post}
            isLast
            linkToDetail={false}
            verticalIdentity
            collapseContent={false}
            onUserClick={(username) => router.push(`/users/${username}`)}
          />
        </div>
      )}
    </PageContainer>
  );
}
