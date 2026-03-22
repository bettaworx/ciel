import type { MfmNode as MfmNodeType } from "mfm-js";
import type { ReactNode } from "react";
import { ExternalLink, Search } from "lucide-react";
import { MfmFn } from "@/components/mfm/MfmFn";

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
      return <>{node.props.text}</>;
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
      return <small className="mfm-small">{renderChildren(node.children)}</small>;
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
      return (
        <pre className="mfm-code-block">
          <code>{node.props.code}</code>
        </pre>
      );
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
          className="mfm-url"
          target="_blank"
          rel="noopener noreferrer"
        >
          {segments.map((seg, i) =>
            seg.dim ? (
              <span key={i} className="opacity-50">
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
      return <span>{node.props.emoji}</span>;
    }

    // --- Custom emoji code (stub) ---
    case "emojiCode": {
      return <span className="mfm-emoji-code">:{node.props.name}:</span>;
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
