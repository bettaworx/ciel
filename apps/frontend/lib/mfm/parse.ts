import * as mfm from "mfm-js";
import type { MfmNode } from "mfm-js";

export type { MfmNode } from "mfm-js";

/**
 * Parse full MFM text into an AST node tree.
 * Supports all MFM syntax including block elements, decorations, and animations.
 * Use this for post content.
 */
export function parseMfm(text: string): MfmNode[] {
  return mfm.parse(text);
}

/**
 * Parse simple MFM text into an AST node tree.
 * Only supports emoji codes and unicode emoji.
 * Use this for contexts where full MFM is not appropriate (e.g. display names).
 */
export function parseMfmSimple(text: string): MfmNode[] {
  return mfm.parseSimple(text);
}
