"use client";

import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { toast } from "sonner";
import { Check, HeartHandshake, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { userAtom } from "@/atoms/auth";
import { useFollowUser, useUnfollowUser } from "@/lib/hooks/use-queries";
import { cn } from "@/lib/utils";

type FollowButtonProps = {
  username: string;
  isFollowing: boolean;
  isFollowedBy: boolean;
  className?: string;
};

/**
 * Follow / following / follow-back button. Renders nothing when logged out or
 * pointed at yourself, so callers do not have to guard it.
 */
export function FollowButton({
  username,
  isFollowing,
  isFollowedBy,
  className,
}: FollowButtonProps) {
  const t = useTranslations();
  const authUser = useAtomValue(userAtom);
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  if (!authUser || authUser.username === username) return null;

  const isPending = followUser.isPending || unfollowUser.isPending;
  const isMutualFollow = isFollowing && isFollowedBy;

  const handleToggle = (e: React.MouseEvent) => {
    // The button often sits inside a link to the profile.
    e.preventDefault();
    e.stopPropagation();
    const mutation = isFollowing ? unfollowUser : followUser;
    mutation.mutate(username, {
      onError: () => toast.error(t("user.followError")),
    });
  };

  return (
    <Button
      // Following reads as the neutral "done" state, so it wears the same
      // colour as the edit button; hovering it reveals the destructive action
      // it actually performs.
      variant={isFollowing ? "default" : "primary"}
      size="sm"
      className={cn(
        isFollowing &&
          "group hover:bg-destructive hover:text-destructive-foreground",
        className,
      )}
      onClick={handleToggle}
      disabled={isPending}
    >
      {isFollowing ? (
        <>
          <span className="inline-flex items-center gap-1 group-hover:hidden">
            {isMutualFollow ? (
              <HeartHandshake className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {isMutualFollow ? t("user.mutualFollow") : t("user.following")}
          </span>
          <span className="hidden items-center gap-1 group-hover:inline-flex">
            <Minus className="w-4 h-4" />
            {t("user.unfollow")}
          </span>
        </>
      ) : (
        <span className="inline-flex items-center gap-1">
          <Plus className="w-4 h-4" />
          {isFollowedBy ? t("user.followBack") : t("user.follow")}
        </span>
      )}
    </Button>
  );
}
