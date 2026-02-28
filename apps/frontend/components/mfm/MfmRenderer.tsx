"use client";

import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { mfmSettingsAtom } from "@/atoms/mfm-settings";
import {
  parseMfm,
  parseMfmSimple,
  filterMfmNodes,
  buildAllowListFromSettings,
  intersectAllowLists,
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
 * Respects user MFM settings — when MFM is globally disabled,
 * falls back to parseSimple (emoji only).
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
  const settings = useAtomValue(mfmSettingsAtom);

  const nodes = useMemo(() => {
    if (!text) return [];

    // Global MFM disabled → emoji only (parseSimple)
    if (!settings.enabled) {
      return parseMfmSimple(text);
    }

    // Build an allow-list from user settings
    const settingsAllowList = buildAllowListFromSettings(settings);

    if (allowList) {
      // Context-level + user-level: intersect both
      const merged = intersectAllowLists(allowList, settingsAllowList);
      const parsed = parseMfm(text);
      return filterMfmNodes(parsed, merged);
    }

    if (simple) {
      return parseMfmSimple(text);
    }

    // Full parse, filtered by user settings
    const parsed = parseMfm(text);
    return filterMfmNodes(parsed, settingsAllowList);
  }, [text, simple, allowList, settings]);

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
