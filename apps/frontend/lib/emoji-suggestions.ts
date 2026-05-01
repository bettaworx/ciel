import type { PublicEmoji } from "@/lib/custom-emojis";

const EMOJI_QUERY_CHAR = /^[A-Za-z0-9_+-]$/;

export interface EmojiSuggestionMatch {
  query: string;
  start: number;
  end: number;
}

export function getEmojiSuggestionMatch(
  text: string,
  caret: number,
): EmojiSuggestionMatch | null {
  if (caret < 3 || caret > text.length) {
    return null;
  }

  let bodyStart = caret;
  while (bodyStart > 0 && isEmojiQueryChar(text[bodyStart - 1])) {
    bodyStart -= 1;
  }

  const query = text.slice(bodyStart, caret);
  if (query.length < 2) {
    return null;
  }

  const colonIndex = bodyStart - 1;
  if (colonIndex < 0 || text[colonIndex] !== ":") {
    return null;
  }

  const beforeColon = colonIndex > 0 ? text[colonIndex - 1] : "";
  if (beforeColon && (isEmojiQueryChar(beforeColon) || beforeColon === ":")) {
    return null;
  }

  let end = caret;
  while (end < text.length && isEmojiQueryChar(text[end])) {
    end += 1;
  }

  if (text[end] === ":") {
    return null;
  }

  return {
    query: query.toLowerCase(),
    start: colonIndex,
    end,
  };
}

export function getCustomEmojiSuggestions(
  emojis: PublicEmoji[] | undefined,
  query: string,
  limit = 8,
): PublicEmoji[] {
  if (!query) {
    return [];
  }

  const normalizedQuery = query.toLowerCase();
  return (emojis ?? [])
    .filter((emoji) => emoji.shortcode.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => {
      const aStartsWith = a.shortcode.toLowerCase().startsWith(normalizedQuery);
      const bStartsWith = b.shortcode.toLowerCase().startsWith(normalizedQuery);
      if (aStartsWith !== bStartsWith) {
        return aStartsWith ? -1 : 1;
      }
      return a.shortcode.localeCompare(b.shortcode);
    })
    .slice(0, limit);
}

export function applyEmojiSuggestion(
  text: string,
  match: EmojiSuggestionMatch,
  shortcode: string,
): { nextValue: string; caret: number } {
  const replacement = `:${shortcode}:`;
  const nextValue =
    text.slice(0, match.start) +
    replacement +
    text.slice(match.end);

  return {
    nextValue,
    caret: match.start + replacement.length,
  };
}

function isEmojiQueryChar(value: string): boolean {
  return EMOJI_QUERY_CHAR.test(value);
}
