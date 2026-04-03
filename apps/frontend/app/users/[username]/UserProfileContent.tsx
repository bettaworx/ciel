"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useUser, useUserPosts } from "@/lib/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { MfmRenderer } from "@/components/mfm/MfmRenderer";
import { DISPLAY_NAME_ALLOW_LIST, BIO_ALLOW_LIST } from "@/lib/mfm/parse";
import { PostCard } from "@/components/PostCard";
import { Spinner } from "@/components/Spinner";

type UserProfileContentProps = {
  username: string;
};

export function UserProfileContent({ username }: UserProfileContentProps) {
  const t = useTranslations();
  const router = useRouter();

  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useUser(username);
  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
    fetchNextPage,
    hasNextPage,
  } = useUserPosts(username);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner variant="theme" label={t("loading")} />
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive text-lg font-semibold mb-2">
            {t("user.notFound")}
          </p>
          <p className="text-muted-foreground">{userError?.message}</p>
        </div>
      </div>
    );
  }

  const posts = postsData?.pages.flatMap((page) => page.items ?? []) ?? [];

  return (
    <PageContainer maxWidth="2xl">
      <div>
        {/* User Profile Header */}
        <div className="bg-card rounded-2xl overflow-hidden mb-8">
          {/* Banner */}
          <div className="w-full aspect-[3/1] bg-muted">
            {user.bannerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.bannerUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="px-4 pb-8">
            {/* Avatar overlapping banner via negative top margin */}
            <div className="-mt-12 sm:-mt-16 mb-4">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 rounded-[24px] sm:rounded-[32px] ring-4 ring-card shrink-0">
                <AvatarImage
                  src={user.avatarUrl ?? undefined}
                  alt={user.username}
                />
                <AvatarFallback className="rounded-[24px] sm:rounded-[32px]">
                  <User className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            </div>

            {/* User Info */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-foreground">
                  <MfmRenderer
                    text={user.displayName || user.username}
                    allowList={DISPLAY_NAME_ALLOW_LIST}
                  />
                </h1>
                <p className="text-sm text-muted-foreground">
                  @{user.username}
                </p>
              </div>

              <div>
                {user.bio && (
                  <div className="text-sm text-foreground leading-relaxed">
                    <MfmRenderer text={user.bio} allowList={BIO_ALLOW_LIST} />
                  </div>
                )}
                {!user.bio && (
                  <p className="text-muted-foreground italic">
                    {t("user.noBio")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {t("user.posts")}
          </h2>
        </div>

        {postsLoading && posts.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Spinner variant="theme" label={t("loading")} />
          </div>
        )}

        {postsError && (
          <div className="flex items-center justify-center py-12">
            <p className="text-destructive">
              {t("error.title")}: {postsError.message}
            </p>
          </div>
        )}

        {!postsLoading && !postsError && posts.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">{t("user.noPosts")}</p>
          </div>
        )}

        {posts.length > 0 && (
          <div className="bg-card rounded-xl sm:rounded-2xl overflow-hidden">
            {posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                onUserClick={(username) => router.push(`/users/${username}`)}
                isLast={index === posts.length - 1}
              />
            ))}
          </div>
        )}

        {hasNextPage && (
          <div className="mt-8 text-center">
            <Button
              onClick={() => fetchNextPage()}
              className="transition-colors duration-160 ease"
            >
              {t("timeline.loadMore")}
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
