import type { MfmFn as MfmFnType, MfmNode as MfmNodeType } from "mfm-js";
import type { ReactNode } from "react";
import { useMfmSettings } from "@/atoms/mfm-settings";

/** Style type that supports both CSS properties and custom properties (--*). */
type MfmStyle = Record<string, string | number | undefined>;

/**
 * Validates a CSS hex color code (3, 4, or 6 hex digits).
 * Returns the sanitized color string with # prefix, or null if invalid.
 */
function validateColor(color: string): string | null {
  if (/^[0-9a-fA-F]{3,4}$|^[0-9a-fA-F]{6}$/.test(color)) {
    return `#${color}`;
  }
  return null;
}

/**
 * Parses a numeric argument value, clamping it within the given range.
 */
function parseNumArg(
  value: string | true | undefined,
  defaultVal: number,
  min: number,
  max: number,
): number {
  if (value === undefined || value === true) return defaultVal;
  const num = Number.parseFloat(value);
  if (Number.isNaN(num)) return defaultVal;
  return Math.min(max, Math.max(min, num));
}

/**
 * Parses a CSS time value from an argument (e.g., "5s", "500ms").
 * Returns the raw string if valid, or the default value.
 */
function parseSpeedArg(
  value: string | true | undefined,
  defaultVal: string,
): string {
  if (value === undefined || value === true) return defaultVal;
  if (/^[0-9.]+m?s$/.test(value)) return value;
  return defaultVal;
}

interface MfmFnProps {
  node: MfmFnType;
  children: ReactNode;
}

/**
 * Renders an MFM function node ($[fn.args content]).
 * Handles animations, text decorations, layout transforms, and styling.
 * Respects user MFM sub-settings for font families and expand sizes.
 */
export function MfmFn({ node, children }: MfmFnProps) {
  const settings = useMfmSettings();
  const { name, args } = node.props;
  const style: MfmStyle = {};
  let className = "";

  switch (name) {
    // --- Animations ---
    case "jelly": {
      className = "mfm-jelly";
      style["--mfm-speed"] = parseSpeedArg(args.speed, "1s");
      break;
    }
    case "tada": {
      className = "mfm-tada";
      style["--mfm-speed"] = parseSpeedArg(args.speed, "1s");
      break;
    }
    case "jump": {
      className = "mfm-jump";
      style["--mfm-speed"] = parseSpeedArg(args.speed, "0.75s");
      break;
    }
    case "bounce": {
      className = "mfm-bounce";
      style["--mfm-speed"] = parseSpeedArg(args.speed, "0.75s");
      break;
    }
    case "spin": {
      const speed = parseSpeedArg(args.speed, "1.5s");
      style["--mfm-speed"] = speed;

      // Determine axis and direction
      const isX = args.x === true;
      const isY = args.y === true;
      const isLeft = args.left === true;
      const isAlternate = args.alternate === true;

      if (isX) {
        className = isLeft
          ? "mfm-spin-x-left"
          : isAlternate
            ? "mfm-spin-x-alternate"
            : "mfm-spin-x";
      } else if (isY) {
        className = isLeft
          ? "mfm-spin-y-left"
          : isAlternate
            ? "mfm-spin-y-alternate"
            : "mfm-spin-y";
      } else {
        className = isLeft
          ? "mfm-spin-left"
          : isAlternate
            ? "mfm-spin-alternate"
            : "mfm-spin";
      }
      break;
    }
    case "shake": {
      className = "mfm-shake";
      style["--mfm-speed"] = parseSpeedArg(args.speed, "0.5s");
      break;
    }
    case "twitch": {
      className = "mfm-twitch";
      style["--mfm-speed"] = parseSpeedArg(args.speed, "0.5s");
      break;
    }
    case "rainbow": {
      className = "mfm-rainbow";
      style["--mfm-speed"] = parseSpeedArg(args.speed, "1s");
      break;
    }
    case "sparkle": {
      className = "mfm-sparkle";
      style["--mfm-speed"] = parseSpeedArg(args.speed, "1s");
      break;
    }

    // --- Flip ---
    case "flip": {
      const h = args.h === true;
      const v = args.v === true;
      style.display = "inline-block";
      if (h && v) {
        style.transform = "scale(-1, -1)";
      } else if (v) {
        style.transform = "scaleY(-1)";
      } else {
        // default: horizontal flip
        style.transform = "scaleX(-1)";
      }
      break;
    }

    // --- Font ---
    case "font": {
      style.display = "inline-block";
      // Respect per-font sub-settings
      if (args.serif === true && settings.font.serif) style.fontFamily = "serif";
      else if (args.monospace === true && settings.font.monospace)
        style.fontFamily =
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      else if (args.cursive === true && settings.font.cursive) style.fontFamily = "cursive";
      else if (args.fantasy === true && settings.font.fantasy) style.fontFamily = "fantasy";
      // If the specific sub-font is disabled, renders in default font (no fontFamily set)
      break;
    }

    // --- Blur ---
    case "blur": {
      className = "mfm-blur";
      break;
    }

    // --- Foreground color ---
    case "fg": {
      const color = validateColor(args.color as string);
      if (color) {
        style.color = color;
        style.display = "inline-block";
      }
      break;
    }

    // --- Background color ---
    case "bg": {
      const color = validateColor(args.color as string);
      if (color) {
        style.backgroundColor = color;
        style.display = "inline-block";
      }
      break;
    }

    // --- Border ---
    case "border": {
      const borderStyle = (args.style as string) || "solid";
      const allowedStyles = [
        "solid",
        "hidden",
        "dotted",
        "dashed",
        "double",
        "groove",
        "ridge",
        "inset",
        "outset",
      ];
      if (allowedStyles.includes(borderStyle)) {
        style.borderStyle = borderStyle;
      } else {
        style.borderStyle = "solid";
      }

      const width = parseNumArg(args.width as string, 1, 0, 20);
      style.borderWidth = `${width}px`;

      const color = args.color
        ? validateColor(args.color as string)
        : "var(--border)";
      style.borderColor = color || "var(--border)";

      const radius = parseNumArg(args.radius as string, 0, 0, 50);
      if (radius > 0) {
        style.borderRadius = `${radius}px`;
      }

      style.display = "inline-block";
      style.padding = "0.25em 0.5em";

      if (args.noclip !== true) {
        style.overflow = "hidden";
      }
      break;
    }

    // --- Rotate ---
    case "rotate": {
      const deg = parseNumArg(args.deg as string, 0, -360, 360);
      style.display = "inline-block";
      style.transform = `rotate(${deg}deg)`;
      style.transformOrigin = "center center";
      break;
    }

    // --- Position shift ---
    case "position": {
      const x = parseNumArg(args.x as string, 0, -10, 10);
      const y = parseNumArg(args.y as string, 0, -10, 10);
      style.display = "inline-block";
      style.transform = `translate(${x}em, ${y}em)`;
      break;
    }

    // --- Scale ---
    case "scale": {
      const sx = parseNumArg(args.x as string, 1, 0.1, 5);
      const sy = parseNumArg(args.y as string, 1, 0.1, 5);
      style.display = "inline-block";
      style.transform = `scale(${sx}, ${sy})`;
      style.transformOrigin = "center center";
      break;
    }

    // --- Size shortcuts ---
    case "x2": {
      style.display = "inline-block";
      style.fontSize = "200%";
      break;
    }
    case "x3": {
      style.display = "inline-block";
      // Cap to x2 when allowLargerThanX2 is disabled
      style.fontSize = settings.expand.allowLargerThanX2 ? "300%" : "200%";
      break;
    }
    case "x4": {
      style.display = "inline-block";
      // Cap to x2 when allowLargerThanX2 is disabled
      style.fontSize = settings.expand.allowLargerThanX2 ? "400%" : "200%";
      break;
    }

    // --- Ruby (yomigana) ---
    case "ruby": {
      // Ruby expects the AST children to contain "base reading" text.
      // We extract text directly from the MFM AST (not React children)
      // to reliably split into base and reading parts.
      return <MfmRuby node={node} />;
    }

    // --- Unrecognized function: render children as-is ---
    default: {
      return <span>{children}</span>;
    }
  }

  return (
    <span className={className || undefined} style={style}>
      {children}
    </span>
  );
}

/**
 * Ruby (yomigana) rendering helper.
 * MFM ruby syntax: $[ruby base reading]
 * The parser gives us fn children where the text content is "base reading".
 * We need to split on the last space to get [base, reading].
 */
function MfmRuby({ node }: { node: MfmFnType }) {
  const text = extractTextFromAst(node.children);
  const lastSpaceIndex = text.lastIndexOf(" ");

  if (lastSpaceIndex === -1) {
    // No space found, just render as-is
    return <span>{text}</span>;
  }

  const base = text.substring(0, lastSpaceIndex);
  const reading = text.substring(lastSpaceIndex + 1);

  return (
    <ruby>
      {base}
      <rp>(</rp>
      <rt>{reading}</rt>
      <rp>)</rp>
    </ruby>
  );
}

/**
 * Recursively extracts plain text from MFM AST nodes.
 */
function extractTextFromAst(nodes: MfmNodeType[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return node.props.text;
      if ("children" in node && node.children) {
        return extractTextFromAst(node.children as MfmNodeType[]);
      }
      return "";
    })
    .join("");
}
