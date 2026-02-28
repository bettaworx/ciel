"use client";

import { useMemo } from "react";
import { parseMfm, parseMfmSimple } from "@/lib/mfm/parse";
import { MfmNode } from "@/components/mfm/MfmNode";

interface MfmRendererProps {
  /** The MFM text to parse and render. */
  text: string;
  /**
   * When true, uses parseSimple which only handles emoji codes
   * and unicode emoji. Suitable for display names and other
   * contexts where full MFM is not appropriate.
   */
  simple?: boolean;
  /** Additional CSS class names for the root wrapper element. */
  className?: string;
}

/**
 * Parses MFM text and renders it as React components.
 *
 * Usage:
 * ```tsx
 * // Full MFM (for post content, bio)
 * <MfmRenderer text={post.content} />
 *
 * // Simple MFM (for display names - emoji only)
 * <MfmRenderer text={user.displayName} simple />
 * ```
 */
export function MfmRenderer({ text, simple = false, className }: MfmRendererProps) {
  const nodes = useMemo(() => {
    if (!text) return [];
    return simple ? parseMfmSimple(text) : parseMfm(text);
  }, [text, simple]);

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
