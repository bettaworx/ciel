"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { authAtom } from "@/atoms/auth";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { useTimeline } from "@/lib/hooks/use-queries";
import { PageContainer } from "@/components/PageContainer";
import { PostCard } from "@/components/PostCard";
import { WelcomeCard } from "@/components/WelcomeCard";
import { ComposeCard } from "@/components/ComposeCard";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";
import { Spinner } from "@/components/ui/spinner";

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

  const posts = data?.pages.flatMap((page) => page.items ?? []) ?? [];
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

        <InfiniteScrollTrigger
          sentinelRef={infiniteScrollRef}
          hasNextPage={Boolean(hasNextPage)}
          isFetchingNextPage={isFetchingNextPage}
        />
      </div>
    </PageContainer>
  );
}
