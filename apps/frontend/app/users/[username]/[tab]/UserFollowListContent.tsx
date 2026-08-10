"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atoms/auth";
import { useFollowList } from "@/lib/hooks/use-queries";
import type { FollowTab } from "@/lib/follow-tabs";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";
import { UserListRow } from "@/components/users/UserListRow";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";

type UserFollowListContentProps = {
  username: string;
  tab: FollowTab;
};

const EMPTY_KEYS: Record<FollowTab, string> = {
  following: "user.noFollowing",
  followers: "user.noFollowers",
  followers_you_follow: "user.noFollowersYouFollow",
};

export function UserFollowListContent({
  username,
  tab,
}: UserFollowListContentProps) {
  const t = useTranslations();
  const router = useRouter();
  const authUser = useAtomValue(userAtom);
  const isOwnProfile = authUser?.username === username;

  // "Followers you know" says nothing about your own profile, and needs a
  // viewer at all, so the tab is hidden in both cases.
  const showsKnownTab = !!authUser && !isOwnProfile;

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFollowList(username, tab);

  useEffect(() => {
    if (tab === "followers_you_follow" && !showsKnownTab) {
      router.replace(`/users/${encodeURIComponent(username)}/followers`);
    }
  }, [tab, showsKnownTab, router, username]);

  const sentinelRef = useInfiniteScroll({
    enabled: true,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const users = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <PageContainer
      maxWidth="2xl"
      header={<PageHeader>@{username}</PageHeader>}
    >
      <Tabs
        value={tab}
        onValueChange={(next) =>
          router.replace(`/users/${encodeURIComponent(username)}/${next}`)
        }
      >
        <TabsList className="mb-3 w-full">
          <TabsTrigger value="following">{t("user.followingCount")}</TabsTrigger>
          <TabsTrigger value="followers">{t("user.followersCount")}</TabsTrigger>
          {showsKnownTab && (
            <TabsTrigger value="followers_you_follow">
              {t("user.followersYouFollow")}
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      {isLoading && users.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Spinner variant="theme" label={t("loading")} />
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-12">
          <p className="text-destructive">
            {t("error.title")}: {error.message}
          </p>
        </div>
      )}

      {!isLoading && !error && users.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">{t(EMPTY_KEYS[tab])}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {users.map((user) => (
          <UserListRow key={user.id} user={user} />
        ))}
      </div>

      <InfiniteScrollTrigger
        sentinelRef={sentinelRef}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </PageContainer>
  );
}
