"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { toast } from "sonner";
import { Check, HeartHandshake, Minus, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { userAtom } from "@/atoms/auth";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 640px)");

  if (!authUser || authUser.username === username) return null;

  const isPending = followUser.isPending || unfollowUser.isPending;
  const isMutualFollow = isFollowing && isFollowedBy;

  const handleToggle = (e: React.MouseEvent) => {
    // The button often sits inside a link to the profile.
    e.preventDefault();
    e.stopPropagation();
    // Unfollowing is not undoable in one tap, so it asks first.
    if (isFollowing) {
      setConfirmOpen(true);
      return;
    }
    followUser.mutate(username, {
      onError: () => toast.error(t("user.followError")),
    });
  };

  const handleConfirmUnfollow = () => {
    unfollowUser.mutate(username, {
      onError: () => toast.error(t("user.followError")),
      onSettled: () => setConfirmOpen(false),
    });
  };

  // The dialog portals to the body, but React events still bubble up the tree
  // into the profile link wrapping this button, so clicks are stopped here.
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  const title = t("user.unfollowConfirmTitle");
  const description = t("user.unfollowConfirmDescription", { username });

  return (
    <>
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

      {isDesktop ? (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent onClick={stopPropagation}>
            <AlertDialogHeader>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={unfollowUser.isPending}>
                {t("user.unfollowConfirmCancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmUnfollow}
                disabled={unfollowUser.isPending}
                variant="destructive"
              >
                {t("user.unfollow")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Drawer open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DrawerContent onClick={stopPropagation}>
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
              <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button
                variant="destructive"
                onClick={handleConfirmUnfollow}
                disabled={unfollowUser.isPending}
              >
                {t("user.unfollow")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={unfollowUser.isPending}
              >
                {t("user.unfollowConfirmCancel")}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
