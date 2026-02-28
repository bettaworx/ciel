"use client";

import { useMemo } from "react";
import {
  parseMfm,
  parseMfmSimple,
  filterMfmNodes,
  type MfmAllowList,
} from "@/lib/mfm/parse";
import { MfmNode } from "@/components/mfm/MfmNode";

interface MfmRendererProps {
  /** The MFM text to parse and render. */
  text: string;
  /**
   * When true, uses parseSimple which only handles emoji codes
   * and unicode emoji. Suitable for contexts where no MFM is needed.
   *
   * Cannot be combined with `allowList` (allowList takes precedence).
   */
  simple?: boolean;
  /**
   * When provided, uses the full MFM parser but filters the resulting
   * AST to only include allowed node types and fn names.
   * Use this for contexts where only specific MFM features are permitted
   * (e.g. display names: bold, emoji, flip, font).
   */
  allowList?: MfmAllowList;
  /** Additional CSS class names for the root wrapper element. */
  className?: string;
}

/**
 * Parses MFM text and renders it as React components.
 *
 * Usage:
 * ```tsx
 * // Full MFM (for post content, bio, server description)
 * <MfmRenderer text={post.content} />
 *
 * // Simple MFM (emoji only)
 * <MfmRenderer text={someText} simple />
 *
 * // Whitelisted MFM (for display names)
 * import { DISPLAY_NAME_ALLOW_LIST } from "@/lib/mfm/parse";
 * <MfmRenderer text={user.displayName} allowList={DISPLAY_NAME_ALLOW_LIST} />
 * ```
 */
export function MfmRenderer({
  text,
  simple = false,
  allowList,
  className,
}: MfmRendererProps) {
  const nodes = useMemo(() => {
    if (!text) return [];

    // allowList mode: full parse then filter
    if (allowList) {
      const parsed = parseMfm(text);
      return filterMfmNodes(parsed, allowList);
    }

    return simple ? parseMfmSimple(text) : parseMfm(text);
  }, [text, simple, allowList]);

  if (nodes.length === 0) {
    return null;
  }

  return (
    <span className={className}>
      {nodes.map((node, i) => (
        <MfmNode key={i} node={node} />
      ))}
    </span>
  );
}
