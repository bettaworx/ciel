import { memo, useState } from "react";
import { parse as parseTwemoji } from "@twemoji/parser";
import { cn } from "@/lib/utils";
import {
  buildTwemojiUrl,
  type TwemojiAssetType,
} from "@/lib/emoji-picker/constants";

// Pin to the 16.x series to match @twemoji/parser@16.0.0.
// jsDelivr serves tagged URLs with Cache-Control: immutable.
interface TwemojiProps {
  emoji: string;
  className?: string;
  assetType?: TwemojiAssetType;
}

// Renders a single twemoji SVG image, falling back to native emoji on load error.
function TwemojiImg({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span className={cn("mfm-inline-emoji", className)}>{alt}</span>;
  }
  return (
    <span className={cn("mfm-inline-emoji", className)}>
      <img
        src={src}
        alt={alt}
        className="twemoji"
        draggable={false}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

function TwemojiInner({
  emoji,
  className,
  assetType = "svg",
}: TwemojiProps) {
  const entries = parseTwemoji(emoji, {
    buildUrl: (codepoints) => buildTwemojiUrl(codepoints, assetType),
    assetType,
  });

  // 0 entries: not recognized by parser (e.g. bare © without VS16,
  //            environment-dependent characters)
  // >1 entries: ZWJ sequence decomposed — twemoji has no combined asset,
  //             parser split into components. Show native emoji in both cases.
  if (entries.length !== 1) {
    return <span className={cn("mfm-inline-emoji", className)}>{emoji}</span>;
  }

  const entry = entries[0];
  return <TwemojiImg src={entry.url} alt={entry.text} className={className} />;
}

export const Twemoji = memo(
  TwemojiInner,
  (a, b) =>
    a.emoji === b.emoji &&
    a.className === b.className &&
    (a.assetType ?? "svg") === (b.assetType ?? "svg"),
);
