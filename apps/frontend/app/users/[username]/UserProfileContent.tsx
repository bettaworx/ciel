"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useUser, useUserPosts } from "@/lib/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { PostCard } from "@/components/PostCard";

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
        <p className="text-muted-foreground">{t("loading")}</p>
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
    <PageContainer maxWidth="3xl">
      <div>
        {/* User Profile Header */}
        <div className="bg-card rounded-lg p-6 mb-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={user.avatarUrl ?? undefined}
                alt={user.username}
              />
              <AvatarFallback>
                <User className="h-12 w-12 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {user.displayName || user.username}
              </h1>
              <p className="text-muted-foreground mb-3">@{user.username}</p>
              {user.bio && (
                <p className="text-foreground leading-relaxed">{user.bio}</p>
              )}
              {!user.bio && (
                <p className="text-muted-foreground italic">
                  {t("user.noBio")}
                </p>
              )}
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
            <p className="text-muted-foreground">{t("loading")}</p>
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
