"use client";

import { useTranslations } from "next-intl";
import {
  PostCard,
  PostTreeActionButton,
  type PostCardThreadLine,
} from "@/components/PostCard";
import type { components } from "@/lib/api/api";

type Post = components["schemas"]["Post"];

type OwnerThreadTimelineItemProps = {
  rootPost: Post;
  replies: Post[];
  isMerged: boolean;
  isLast: boolean;
  onUserClick: (username: string) => void;
  onShowThread: () => void;
  /** Passed through to every card: this whole thread is by one author. */
  skipHiddenCushion?: boolean;
};

function getReplyThreadLine(
  hasPrevious: boolean,
  hasNext: boolean,
): PostCardThreadLine {
  if (hasPrevious && hasNext) return "both";
  if (hasPrevious) return "above";
  if (hasNext) return "below";
  return "none";
}

export function OwnerThreadTimelineItem({
  rootPost,
  replies,
  isMerged,
  isLast,
  onUserClick,
  onShowThread,
  skipHiddenCushion,
}: OwnerThreadTimelineItemProps) {
  const t = useTranslations();
  const hasRowsAfterRoot = isMerged || replies.length > 0;

  return (
    <>
      <PostCard
        post={rootPost}
        onUserClick={onUserClick}
        isLast={!hasRowsAfterRoot && isLast}
        threadLine={hasRowsAfterRoot ? "below" : "none"}
        skipHiddenCushion={skipHiddenCushion}
      />
      {isMerged && (
        <PostTreeActionButton
          onClick={onShowThread}
          isLast={replies.length === 0 && isLast}
          threadLine={replies.length > 0 ? "both" : "above"}
        >
          {t("timeline.showThread")}
        </PostTreeActionButton>
      )}
      {replies.map((reply, index) => {
        const hasPrevious = true;
        const hasNext = index < replies.length - 1;
        return (
          <PostCard
            key={reply.id}
            post={reply}
            onUserClick={onUserClick}
            isLast={!hasNext && isLast}
            threadLine={getReplyThreadLine(hasPrevious, hasNext)}
            skipHiddenCushion={skipHiddenCushion}
          />
        );
      })}
    </>
  );
}
