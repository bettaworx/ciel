"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmojiInline } from "@/components/EmojiInline";
import { ReactionUserButton } from "@/components/ReactionUserButton";
import type { components } from "@/lib/api/api";
import { useReactionUsers } from "@/lib/hooks/use-reaction-users";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type PostId = components["schemas"]["PostId"];

export interface ReactionUsersDialogReaction {
  emoji: string;
  count: number;
}

interface ReactionUsersDialogProps {
  postId: PostId;
  reactions: ReactionUsersDialogReaction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmoji?: string | null;
}

export function ReactionUsersDialog({
  postId,
  reactions,
  open,
  onOpenChange,
  initialEmoji,
}: ReactionUsersDialogProps) {
  const t = useTranslations("reactions");
  const sortedReactions = React.useMemo(
    () => [...reactions].sort((a, b) => b.count - a.count),
    [reactions],
  );
  const firstEmoji = sortedReactions[0]?.emoji ?? null;
  const [selectedEmoji, setSelectedEmoji] = React.useState<string | null>(
    initialEmoji ?? firstEmoji,
  );

  React.useEffect(() => {
    if (open && initialEmoji) {
      setSelectedEmoji(initialEmoji);
    }
  }, [open, initialEmoji]);

  React.useEffect(() => {
    if (!selectedEmoji && firstEmoji) {
      setSelectedEmoji(firstEmoji);
    }
  }, [firstEmoji, selectedEmoji]);

  const activeEmoji = selectedEmoji ?? firstEmoji ?? "";
  const list = useReactionUsers({
    postId,
    emoji: activeEmoji,
    enabled: open && Boolean(activeEmoji),
  });

  const isDesktop = useMediaQuery("(min-width: 640px)");
  const users = list.data?.pages.flatMap((page) => page.users) ?? [];
  const hasMore = Boolean(list.data?.pages.at(-1)?.nextCursor);

  const content = (
    <div className="flex flex-col gap-3">
      <Tabs
        value={activeEmoji}
        onValueChange={(value) => setSelectedEmoji(value)}
      >
        <TabsList className="w-full justify-start gap-1 overflow-x-auto">
          {sortedReactions.map((reaction) => (
            <TabsTrigger
              key={reaction.emoji}
              value={reaction.emoji}
              className={cn("px-3", "whitespace-nowrap")}
            >
              <span className="text-sm">
                <EmojiInline emoji={reaction.emoji} />
              </span>
              <span className="ml-1 text-xs tabular-nums text-muted-foreground">
                {reaction.count}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-2">
        {list.isLoading && (
          <span className="px-2 py-1 text-sm text-muted-foreground">
            {t("loadingUsers")}
          </span>
        )}
        {!list.isLoading && users.length === 0 && (
          <span className="px-2 py-1 text-sm text-muted-foreground">
            {t("noUsers")}
          </span>
        )}
        {users.map((user) => (
          <ReactionUserButton key={user.id} user={user} />
        ))}
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => list.fetchNextPage()}
            disabled={list.isFetchingNextPage}
          >
            {list.isFetchingNextPage ? t("loadingMore") : t("loadMore")}
          </Button>
        )}
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-4">
          <div className="pr-10">{content}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="p-4 pb-4 min-h-64">{content}</div>
      </DrawerContent>
    </Drawer>
  );
}
