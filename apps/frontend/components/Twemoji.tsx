import { memo } from "react";
import { parse as parseTwemoji } from "@twemoji/parser";

// Pin to a specific release so jsDelivr serves immutable cached responses.
// Update this when intentionally upgrading twemoji assets.
const TWEMOJI_VERSION = "15.1.0";
const TWEMOJI_CDN_BASE = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@${TWEMOJI_VERSION}/assets/svg/`;

function buildUrl(codepoints: string): string {
  return `${TWEMOJI_CDN_BASE}${codepoints}.svg`;
}

interface TwemojiProps {
  emoji: string;
}

function TwemojiInner({ emoji }: TwemojiProps) {
  const entries = parseTwemoji(emoji, { buildUrl, assetType: "svg" });

  if (entries.length === 0) {
    // Not recognized as emoji (e.g. bare © without VS16, or environment-
    // dependent characters) — render as plain text.
    return <>{emoji}</>;
  }

  return (
    <>
      {entries.map((entry, i) => (
        <img
          key={i}
          src={entry.url}
          alt={entry.text}
          className="twemoji"
          draggable={false}
          loading="lazy"
        />
      ))}
    </>
  );
}

export const Twemoji = memo(TwemojiInner, (a, b) => a.emoji === b.emoji);
