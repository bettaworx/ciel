import { memo, useState } from "react";
import { parse as parseTwemoji } from "@twemoji/parser";

// Pin to the 16.x series to match @twemoji/parser@16.0.0.
// jsDelivr serves tagged URLs with Cache-Control: immutable.
const TWEMOJI_VERSION = "16.0.1";
const TWEMOJI_CDN_BASE = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@${TWEMOJI_VERSION}/assets/svg/`;

function buildUrl(codepoints: string): string {
  return `${TWEMOJI_CDN_BASE}${codepoints}.svg`;
}

interface TwemojiProps {
  emoji: string;
}

// Renders a single twemoji SVG image, falling back to native emoji on load error.
function TwemojiImg({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{alt}</>;
  return (
    <img
      src={src}
      alt={alt}
      className="twemoji"
      draggable={false}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function TwemojiInner({ emoji }: TwemojiProps) {
  const entries = parseTwemoji(emoji, { buildUrl, assetType: "svg" });

  // 0 entries: not recognized by parser (e.g. bare © without VS16,
  //            environment-dependent characters)
  // >1 entries: ZWJ sequence decomposed — twemoji has no combined asset,
  //             parser split into components. Show native emoji in both cases.
  if (entries.length !== 1) return <>{emoji}</>;

  const entry = entries[0];
  return <TwemojiImg src={entry.url} alt={entry.text} />;
}

export const Twemoji = memo(TwemojiInner, (a, b) => a.emoji === b.emoji);
