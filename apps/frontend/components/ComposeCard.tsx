"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { User as UserIcon } from "lucide-react";
import { useAtomValue } from "jotai";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { userAtom } from "@/atoms/auth";
import { useComposePost } from "./post-composer/useComposePost";
import { PostComposerContent } from "./post-composer/PostComposerContent";
import { useComposerPlaceholder } from "./post-composer/useComposerPlaceholder";

interface ComposeCardProps {
  /**
   * When set, the composer creates a reply to this parent post instead of a
   * root post. Keeps cache invalidation and submission semantics correct for
   * threaded composition.
   */
  parentId?: string;
  /**
   * Override the rotating greeting placeholder. Useful in contexts like reply
   * composition where a fixed prompt (e.g. "Write a reply") is preferable.
   */
  placeholderOverride?: string;
  /**
   * String invisibly prepended to the submitted content (e.g. `@author ` for
   * replies). Not rendered in the textarea — the user composes as if writing
   * a normal post.
   */
  contentPrefix?: string;
}

/**
 * Inline compose card for creating posts (root posts or replies).
 * Shows compact input when collapsed, full composer when expanded.
 */
export function ComposeCard({
  parentId,
  placeholderOverride,
  contentPrefix,
}: ComposeCardProps = {}) {
  const t = useTranslations();
  const user = useAtomValue(userAtom);
  const [isExpanded, setIsExpanded] = useState(false);
  const [placeholderRefreshKey, setPlaceholderRefreshKey] = useState(0);
  const composeCardRef = useRef<HTMLDivElement>(null);
  const hadTypedContentRef = useRef(false);
  const generatedPlaceholder = useComposerPlaceholder(placeholderRefreshKey);
  const placeholder = placeholderOverride ?? generatedPlaceholder;

  // Use shared composition logic
  const compose = useComposePost({
    parentId,
    contentPrefix,
    onSuccess: () => {
      setIsExpanded(false); // Collapse after successful post
    },
  });

  // Destructure textareaRef so the linter recognises it as a stable ref identity
  // (accessing compose.textareaRef triggers react-hooks/exhaustive-deps)
  const { textareaRef } = compose;

  useEffect(() => {
    // Skip rotating the random greeting when caller supplied a fixed placeholder.
    if (placeholderOverride !== undefined) return;

    if (compose.content.length === 0) {
      if (hadTypedContentRef.current) {
        hadTypedContentRef.current = false;
        setPlaceholderRefreshKey((key) => key + 1);
      }
      return;
    }

    hadTypedContentRef.current = true;
  }, [compose.content, placeholderOverride]);

  // Focus textarea when expanded
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
    // textareaRef is a stable React ref — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  // Collapse on interaction outside the card rather than on textarea blur:
  // iOS Safari does not move focus when a button is tapped, so blur collapsed
  // the card — and unmounted the file inputs — the moment the upload sheet or
  // the native picker opened, making media impossible to attach.
  useEffect(() => {
    if (!isExpanded) return;

    const handlePointerUp = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || composeCardRef.current?.contains(target)) return;

      // Our own UI that portals to the body (format menus, upload sheet, crop
      // dialog) still counts as part of the card.
      if (
        target.closest(
          "[data-radix-popper-content-wrapper],[data-vaul-drawer],[data-vaul-overlay],[role='dialog']",
        )
      ) {
        return;
      }

      if (
        compose.content.length === 0 &&
        compose.images.length === 0 &&
        !compose.video
      ) {
        setIsExpanded(false);
      }
    };

    // pointerup, not pointerdown: collapsing shrinks the card and shifts the
    // timeline, so it has to happen after the tap's target is settled. And not
    // click: iOS does not always bubble it up from non-interactive elements.
    document.addEventListener("pointerup", handlePointerUp, true);
    return () => document.removeEventListener("pointerup", handlePointerUp, true);
  }, [isExpanded, compose.content, compose.images, compose.video]);

  if (!user) return null;

  const avatarElement = (
    <Link
      href={`/users/${user.username}`}
      onMouseDown={(e) => {
        // Prevent focus change when clicking avatar
        e.preventDefault();
      }}
      className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-full hover:opacity-80 transition-opacity"
      aria-label={t("profile")}
    >
      <Avatar className="h-11 w-11 sm:h-12 sm:w-12">
        <AvatarImage src={user?.avatarUrl ?? undefined} alt={user.username} />
        <AvatarFallback>
          <UserIcon className="h-6 w-6" />
        </AvatarFallback>
      </Avatar>
    </Link>
  );

  return (
    <div
      ref={composeCardRef}
      className="bg-card rounded-xl sm:rounded-2xl p-3 relative"
      onDragOver={compose.handleDragOver}
      onDragEnter={compose.handleDragEnter}
      onDragLeave={compose.handleDragLeave}
      onDrop={compose.handleDrop}
    >
      {/* Collapsed State */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-start gap-3 text-left group"
          aria-label={t("createPost.title")}
        >
          <Avatar className="h-11 w-11 sm:h-12 sm:w-12 shrink-0">
            <AvatarImage src={user?.avatarUrl ?? undefined} alt={user.username} />
            <AvatarFallback>
              <UserIcon className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 h-11 sm:h-12 rounded-lg bg-transparent transition-colors flex items-start">
            <span className="mt-2.25 md:mt-2 text-base md:text-lg text-muted-foreground">
              {placeholder}
            </span>
          </div>
        </button>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <PostComposerContent
          layout="card"
          compose={compose}
          avatar={avatarElement}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
