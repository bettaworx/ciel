"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { authAtom } from "@/atoms/auth";
import { useTimeline } from "@/lib/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/PageContainer";
import { PostCard } from "@/components/PostCard";
import { WelcomeCard } from "@/components/WelcomeCard";
import { ComposeCard } from "@/components/ComposeCard";

export function HomePage() {
  const t = useTranslations();
  const router = useRouter();
  const auth = useAtomValue(authAtom);
  const { data, isLoading, error, fetchNextPage, hasNextPage } = useTimeline();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{t("loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">
          {t("error.title")}: {error.message}
        </p>
      </div>
    );
  }

  const posts = data?.pages.flatMap((page) => page.items ?? []) ?? [];

  return (
    <PageContainer maxWidth="3xl">
      <div className="space-y-3">
        {auth.user ? <ComposeCard /> : <WelcomeCard />}
        <div className="bg-card rounded-xl sm:rounded-2xl overflow-hidden">
          {posts.length === 0 ? (
            <p className="text-muted-foreground p-3">{t("timeline.noPosts")}</p>
          ) : (
            posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                onUserClick={(username) => router.push(`/users/${username}`)}
                isLast={index === posts.length - 1}
              />
            ))
          )}
        </div>

        {hasNextPage && (
          <div className="mt-8 text-center">
            <Button onClick={() => fetchNextPage()}>
              {t("timeline.loadMore")}
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
