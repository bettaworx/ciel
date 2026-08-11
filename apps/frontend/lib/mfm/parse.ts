import * as mfm from "mfm-js";
import type { MfmNode } from "mfm-js";
import type { MfmSettings } from "@/atoms/mfm-settings";

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
 * Preset allow-list for the post excerpt on a notification row.
 *
 * The excerpt is a clamped, small strip of text, so anything that claims its own
 * line or changes the box size is excluded: block elements (center, quote, code
 * blocks, block math, search) and the fn decorations that scale, move, rotate or
 * animate. `blur` stays so spoilered text is not revealed in a notification.
 */
export const NOTIFICATION_EXCERPT_ALLOW_LIST: MfmAllowList = {
  nodeTypes: new Set([
    "text", "plain", "bold", "italic", "strike", "small",
    "inlineCode", "mathInline",
    "url", "link", "fn",
    "unicodeEmoji", "emojiCode",
    "mention", "hashtag",
  ]),
  fnNames: new Set(["flip", "font", "fg", "bg", "blur"]),
};

/**
 * Builds an MfmAllowList from user MFM settings.
 * Each setting key maps to one or more node types / fn names.
 */
export function buildAllowListFromSettings(s: MfmSettings): MfmAllowList {
  // text, plain, unicodeEmoji are always allowed (intentionally unconditional)
  const nodeTypes = new Set<string>(["text", "plain", "unicodeEmoji"]);
  const fnNames = new Set<string>();

  if (s.mention) nodeTypes.add("mention");
  if (s.hashtag) nodeTypes.add("hashtag");
  if (s.url) nodeTypes.add("url");
  if (s.link) nodeTypes.add("link");
  if (s.emojiCode) nodeTypes.add("emojiCode");
  if (s.bold) nodeTypes.add("bold");
  if (s.italic) nodeTypes.add("italic");
  if (s.strike) nodeTypes.add("strike");
  if (s.small) nodeTypes.add("small");
  if (s.quote) nodeTypes.add("quote");
  if (s.center) nodeTypes.add("center");
  if (s.search) nodeTypes.add("search");
  if (s.code.enabled && s.code.inline) nodeTypes.add("inlineCode");
  if (s.code.enabled && s.code.block) nodeTypes.add("blockCode");

  // fn node is needed if any fn-based feature is enabled
  const hasFn =
    s.ruby || s.flip || s.blur || s.bg || s.fg || s.border ||
    s.rotate || s.position || s.scale ||
    (s.font.enabled && (s.font.serif || s.font.monospace || s.font.cursive || s.font.fantasy)) ||
    (s.animation.enabled && (s.animation.jelly || s.animation.tada || s.animation.jump ||
    s.animation.bounce || s.animation.spin || s.animation.shake ||
    s.animation.twitch)) || s.rainbow || s.sparkle ||
    true; // x2 is always allowed

  if (hasFn) nodeTypes.add("fn");

  // fn names for animations
  if (s.animation.enabled) {
    if (s.animation.jelly) fnNames.add("jelly");
    if (s.animation.tada) fnNames.add("tada");
    if (s.animation.jump) fnNames.add("jump");
    if (s.animation.bounce) fnNames.add("bounce");
    if (s.animation.spin) fnNames.add("spin");
    if (s.animation.shake) fnNames.add("shake");
    if (s.animation.twitch) fnNames.add("twitch");
  }
  if (s.rainbow) fnNames.add("rainbow");
  if (s.sparkle) fnNames.add("sparkle");

  // fn names for decorations / transforms
  if (s.flip) fnNames.add("flip");
  if (s.blur) fnNames.add("blur");
  if (s.fg) fnNames.add("fg");
  if (s.bg) fnNames.add("bg");
  if (s.border) fnNames.add("border");
  if (s.rotate) fnNames.add("rotate");
  if (s.position) fnNames.add("position");
  if (s.scale) fnNames.add("scale");
  if (s.ruby) fnNames.add("ruby");

  // font sub-settings
  if (s.font.enabled && (s.font.serif || s.font.monospace || s.font.cursive || s.font.fantasy)) {
    fnNames.add("font");
  }

  // x2 is always allowed; x3/x4 depend on expand.allowLargerThanX2
  fnNames.add("x2");
  if (s.expand.allowLargerThanX2) {
    fnNames.add("x3");
    fnNames.add("x4");
  }

  return { nodeTypes, fnNames };
}

/**
 * Intersects two allow-lists: only items allowed by BOTH pass through.
 * This is used to combine context-level restrictions (e.g. display name whitelist)
 * with user-level MFM settings.
 */
export function intersectAllowLists(
  a: MfmAllowList,
  b: MfmAllowList,
): MfmAllowList {
  const nodeTypes = new Set<string>();
  for (const t of a.nodeTypes) {
    if (b.nodeTypes.has(t)) nodeTypes.add(t);
  }
  const fnNames = new Set<string>();
  for (const n of a.fnNames) {
    if (b.fnNames.has(n)) fnNames.add(n);
  }
  return { nodeTypes, fnNames };
}

/**
 * Recursively extracts plain text and emoji nodes from MFM AST.
 * Used when MFM is globally disabled — parses the MFM syntax to strip
 * all decoration markup, but preserves the visible text content and emoji.
 */
function extractPlainAndEmoji(nodes: MfmNode[]): MfmNode[] {
  const result: MfmNode[] = [];

  for (const node of nodes) {
    if (node.type === "text") {
      result.push(node);
    } else if (node.type === "unicodeEmoji" || node.type === "emojiCode") {
      result.push(node);
    } else if (node.type === "fn") {
      // Ruby: only keep base text (before last space), strip reading
      const fnNode = node as { type: "fn"; props: { name: string }; children: MfmNode[] };
      if (fnNode.props.name === "ruby") {
        const raw = extractPlainText(fnNode.children);
        const lastSpace = raw.lastIndexOf(" ");
        const baseText = lastSpace >= 0 ? raw.slice(0, lastSpace) : raw;
        if (baseText) {
          result.push({ type: "text", props: { text: baseText }, children: [] } as unknown as MfmNode);
        }
      } else if ("children" in node && node.children && (node.children as MfmNode[]).length > 0) {
        result.push(...extractPlainAndEmoji(node.children as MfmNode[]));
      }
    } else if ("children" in node && node.children && (node.children as MfmNode[]).length > 0) {
      result.push(...extractPlainAndEmoji(node.children as MfmNode[]));
    }
    // Other leaf nodes without children (e.g. blockCode, inlineCode, search)
    // are converted to text so their visible content is preserved.
    else {
      const text = extractPlainText([node]);
      if (text) {
        result.push({
          type: "text",
          props: { text },
          children: [],
        } as unknown as MfmNode);
      }
    }
  }

  return result;
}

/**
 * Parse MFM text and strip all decorations, returning only plain text and
 * emoji nodes. This is used when MFM is globally disabled — the MFM syntax
 * markers (**, $[...], etc.) are removed and only readable text remains.
 */
export function parseMfmToPlaintext(text: string): MfmNode[] {
  const parsed = mfm.parse(text);
  return extractPlainAndEmoji(parsed);
}

/**
 * Parse MFM text and return just its visible characters, with all syntax
 * markers removed. For places that need a bare string rather than nodes —
 * `alt`, `aria-label`, avatar initials.
 */
export function mfmToPlainText(text: string): string {
  return extractPlainText(mfm.parse(text));
}

function extractVisibleContent(nodes: MfmNode[]): MfmNode[] {
  const result: MfmNode[] = [];

  for (const node of nodes) {
    if (node.type === "text" || node.type === "unicodeEmoji" || node.type === "emojiCode") {
      result.push(node);
      continue;
    }

    if (node.type === "fn") {
      const fnNode = node as { type: "fn"; props: { name: string }; children: MfmNode[] };
      if (fnNode.props.name === "ruby") {
        const raw = extractPlainText(fnNode.children);
        const lastSpace = raw.lastIndexOf(" ");
        const baseText = lastSpace >= 0 ? raw.slice(0, lastSpace) : raw;
        if (baseText) {
          result.push({ type: "text", props: { text: baseText }, children: [] } as unknown as MfmNode);
        }
        continue;
      }
    }

    if ("children" in node && node.children && node.children.length > 0) {
      result.push(...extractVisibleContent(node.children as MfmNode[]));
      continue;
    }

    const text = extractPlainText([node]);
    if (text) {
      result.push({ type: "text", props: { text }, children: [] } as unknown as MfmNode);
    }
  }

  return result;
}

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
      if (node.type === "blockCode" || node.type === "inlineCode")
        return (node.props as { code: string }).code;
      if (node.type === "search")
        return (node.props as { query: string }).query;
      if (node.type === "mention")
        return (node.props as { acct: string }).acct;
      if (node.type === "url")
        return (node.props as { url: string }).url;
      if (node.type === "hashtag")
        return `#${(node.props as { hashtag: string }).hashtag}`;
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
        result.push(...extractVisibleContent([node]));
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
