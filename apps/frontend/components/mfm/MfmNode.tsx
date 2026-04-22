import type { MfmNode as MfmNodeType } from "mfm-js";
import type { ReactNode } from "react";
import { useState } from "react";
import { Copy, Check, ExternalLink, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MfmFn } from "@/components/mfm/MfmFn";
import { Twemoji } from "@/components/Twemoji";
import { CustomEmoji } from "@/components/CustomEmoji";

interface MfmNodeProps {
  node: MfmNodeType;
  key?: string | number;
}

/**
 * Renders a single MFM AST node into React elements.
 * Recursively processes children for nodes that contain nested content.
 */
export function MfmNode({ node }: MfmNodeProps) {
  switch (node.type) {
    // --- Plain text ---
    case "text": {
      const parts = node.props.text.split("\n");
      if (parts.length === 1) return <>{node.props.text}</>;
      return (
        <>
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < parts.length - 1 && <br />}
            </span>
          ))}
        </>
      );
    }

    // --- Plain (escape formatting) ---
    case "plain": {
      return (
        <>
          {node.children?.map((child, i) => (
            <MfmNode key={i} node={child} />
          ))}
        </>
      );
    }

    // --- Bold ---
    case "bold": {
      return <strong>{renderChildren(node.children)}</strong>;
    }

    // --- Italic ---
    case "italic": {
      return <em>{renderChildren(node.children)}</em>;
    }

    // --- Strikethrough ---
    case "strike": {
      return <del>{renderChildren(node.children)}</del>;
    }

    // --- Small text ---
    case "small": {
      return (
        <small className="mfm-small">{renderChildren(node.children)}</small>
      );
    }

    // --- Center align (block) ---
    case "center": {
      return <div className="mfm-center">{renderChildren(node.children)}</div>;
    }

    // --- Quote (block) ---
    case "quote": {
      return (
        <blockquote className="mfm-quote">
          {renderChildren(node.children)}
        </blockquote>
      );
    }

    // --- Code block ---
    case "blockCode": {
      return <CodeBlock code={node.props.code} />;
    }

    // --- Inline code ---
    case "inlineCode": {
      return <code className="mfm-inline-code">{node.props.code}</code>;
    }

    // --- Math block (stub: rendered as code) ---
    case "mathBlock": {
      return <div className="mfm-math-block">{node.props.formula}</div>;
    }

    // --- Math inline (stub: rendered as inline code) ---
    case "mathInline": {
      return <code className="mfm-math-inline">{node.props.formula}</code>;
    }

    // --- URL ---
    case "url": {
      const url = sanitizeUrl(node.props.url);
      if (!url) {
        return <span>{node.props.url}</span>;
      }
      const segments = formatDisplayUrl(node.props.url);
      return (
        <a
          href={url}
          className="mfm-url font-bold"
          target="_blank"
          rel="noopener noreferrer"
        >
          {segments.map((seg, i) =>
            seg.dim ? (
              <span key={i} className="opacity-85 font-normal">
                {seg.text}
              </span>
            ) : (
              seg.text
            ),
          )}
          <ExternalLink size={12} className="mfm-external-link-icon" />
        </a>
      );
    }

    // --- Link ---
    case "link": {
      const url = sanitizeUrl(node.props.url);
      if (!url) {
        return <span>{renderChildren(node.children)}</span>;
      }
      return (
        <a
          href={url}
          className="mfm-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {renderChildren(node.children)}
          <ExternalLink size={12} className="mfm-external-link-icon" />
        </a>
      );
    }

    // --- Function (decorations & animations) ---
    case "fn": {
      return <MfmFn node={node}>{renderChildren(node.children)}</MfmFn>;
    }

    // --- Unicode emoji ---
    case "unicodeEmoji": {
      return <Twemoji emoji={node.props.emoji} />;
    }

    // --- Custom emoji code (stub) ---
    case "emojiCode": {
      return <CustomEmoji shortcode={node.props.name} />;
    }

    // --- Mention (stub) ---
    case "mention": {
      return <span className="mfm-mention">{node.props.acct}</span>;
    }

    // --- Hashtag (stub) ---
    case "hashtag": {
      return <span className="mfm-hashtag">#{node.props.hashtag}</span>;
    }

    // --- Search (with Google search link) ---
    case "search": {
      const query = node.props.query;
      return (
        <div className="mfm-search">
          <span className="mfm-search-query">{query}</span>
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mfm-search-button"
          >
            <Search size={16} />
          </a>
        </div>
      );
    }

    // --- Fallback for unknown node types ---
    default: {
      return null;
    }
  }
}

/**
 * Renders an array of MFM child nodes.
 */
function renderChildren(children?: MfmNodeType[]): ReactNode {
  if (!children || children.length === 0) return null;
  return children.map((child, i) => <MfmNode key={i} node={child} />);
}

type UrlSegment = { text: string; dim: boolean };

/**
 * Splits a URL into display segments for styled rendering.
 * - scheme ("https://") and path/query/hash suffix are dimmed (50% opacity)
 * - domain including subdomains is fully opaque (100%)
 * - Total displayed text is capped at 64 characters (truncated with "…")
 */
function formatDisplayUrl(rawUrl: string): UrlSegment[] {
  const MAX_LEN = 64;
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    const text =
      rawUrl.length > MAX_LEN ? rawUrl.slice(0, MAX_LEN - 1) + "…" : rawUrl;
    return [{ text, dim: false }];
  }

  const dimPrefix = `${parsed.protocol}//`;

  const mainPart = parsed.hostname;

  const dimSuffix =
    (parsed.pathname === "/" ? "" : parsed.pathname) +
    parsed.search +
    parsed.hash;

  const fullLen = dimPrefix.length + mainPart.length + dimSuffix.length;
  if (fullLen <= MAX_LEN) {
    const segs: UrlSegment[] = [];
    if (dimPrefix) segs.push({ text: dimPrefix, dim: true });
    if (mainPart) segs.push({ text: mainPart, dim: false });
    if (dimSuffix) segs.push({ text: dimSuffix, dim: true });
    return segs;
  }

  // Truncate: fill up to MAX_LEN - 1 chars then append "…"
  const keepLen = MAX_LEN - 1;
  let remaining = keepLen;
  const segs: UrlSegment[] = [];
  for (const seg of [
    { text: dimPrefix, dim: true },
    { text: mainPart, dim: false },
    { text: dimSuffix, dim: true },
  ]) {
    if (remaining <= 0) break;
    if (seg.text.length <= remaining) {
      if (seg.text) segs.push({ text: seg.text, dim: seg.dim });
      remaining -= seg.text.length;
    } else {
      segs.push({ text: seg.text.slice(0, remaining), dim: seg.dim });
      remaining = 0;
    }
  }
  segs.push({ text: "…", dim: false });
  return segs;
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="mfm-code-block-wrapper">
      <pre className="mfm-code-block">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        rounded="md"
        className="mfm-code-copy-button m-[.35em] h-8 w-8 text-muted-foreground!"
        onClick={handleCopy}
        aria-label="Copy code"
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "backOut" }}
              className="flex"
            >
              <Check size={14} />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "backOut" }}
              className="flex"
            >
              <Copy size={14} />
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </div>
  );
}

/**
 * Validates and sanitizes a URL to prevent XSS via javascript: protocol etc.
 * Only allows http:// and https:// URLs.
 */
function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}
