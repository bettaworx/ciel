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

/**
 * Whitelist filter configuration.
 * - `nodeTypes`: allowed top-level node types (e.g. "text", "bold", "emojiCode")
 * - `fnNames`: allowed function names for `fn` nodes (e.g. "flip", "font")
 */
export interface MfmAllowList {
  nodeTypes: ReadonlySet<string>;
  fnNames: ReadonlySet<string>;
}

/**
 * Preset allow-list for user display names.
 * Permits: plain text, unicode emoji, custom emoji codes (stub),
 * bold, flip, and font function decorations.
 */
export const DISPLAY_NAME_ALLOW_LIST: MfmAllowList = {
  nodeTypes: new Set(["text", "plain", "unicodeEmoji", "emojiCode", "bold", "fn"]),
  fnNames: new Set(["flip", "font"]),
};

/**
 * Preset allow-list for user bio.
 * Permits all MFM features EXCEPT: search blocks, fn:border.
 */
export const BIO_ALLOW_LIST: MfmAllowList = {
  nodeTypes: new Set([
    "text", "plain", "bold", "italic", "strike", "small",
    "center", "quote", "blockCode", "inlineCode",
    "mathBlock", "mathInline",
    "url", "link", "fn",
    "unicodeEmoji", "emojiCode",
    "mention", "hashtag",
    // "search" is intentionally excluded
  ]),
  fnNames: new Set([
    "jelly", "tada", "jump", "bounce", "spin",
    "shake", "twitch", "rainbow", "sparkle",
    "flip", "font", "blur",
    "fg", "bg", "rotate", "position", "scale",
    "x2", "x3", "x4", "ruby",
    // "border" is intentionally excluded
  ]),
};

/**
 * Recursively extracts plain text from MFM AST nodes.
 * Used as fallback content when filtering disallowed nodes.
 */
function extractPlainText(nodes: MfmNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return node.props.text;
      if (node.type === "unicodeEmoji") return node.props.emoji;
      if (node.type === "emojiCode") return `:${node.props.name}:`;
      if ("children" in node && node.children) {
        return extractPlainText(node.children as MfmNode[]);
      }
      return "";
    })
    .join("");
}

/**
 * Filters an MFM AST to only include allowed node types and fn names.
 * Disallowed nodes are replaced with plain text nodes preserving their text content.
 * Children of allowed nodes are recursively filtered as well.
 */
export function filterMfmNodes(
  nodes: MfmNode[],
  allowList: MfmAllowList,
): MfmNode[] {
  const result: MfmNode[] = [];

  for (const node of nodes) {
    // Check if this node type is allowed
    if (!allowList.nodeTypes.has(node.type)) {
      // Not allowed — convert to plain text
      const text = extractPlainText([node]);
      if (text) {
        result.push({ type: "text", props: { text }, children: [] } as unknown as MfmNode);
      }
      continue;
    }

    // For fn nodes, additionally check if the function name is allowed
    if (node.type === "fn") {
      const fnNode = node as { type: "fn"; props: { name: string; args: Record<string, string | true> }; children: MfmNode[] };
      if (!allowList.fnNames.has(fnNode.props.name)) {
        const text = extractPlainText([node]);
        if (text) {
          result.push({ type: "text", props: { text }, children: [] } as unknown as MfmNode);
        }
        continue;
      }
    }

    // Node is allowed — recursively filter children if present
    if ("children" in node && node.children && node.children.length > 0) {
      const filtered = {
        ...node,
        children: filterMfmNodes(node.children as MfmNode[], allowList),
      };
      result.push(filtered as MfmNode);
    } else {
      result.push(node);
    }
  }

  return result;
}
