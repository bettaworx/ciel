"use client";

/**
 * Image compatibility layer.
 *
 * Every call site already passed `unoptimized`, so nothing depended on the
 * Next.js image optimizer and this is a plain `<img>` with the same props.
 * `fill` is the only prop that carried layout meaning, and it is translated to
 * the classes it used to generate.
 *
 * BlurHash placeholders are handled by components/BlurhashImage.tsx, which
 * never used the framework's `placeholder` prop either.
 */

import type { CSSProperties, ComponentPropsWithoutRef, Ref } from "react";
import { cn } from "@/lib/utils";

type BaseImgProps = Omit<ComponentPropsWithoutRef<"img">, "src" | "width" | "height">;

export type ImageProps = BaseImgProps & {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  /** Stretch to fill the nearest positioned ancestor. */
  fill?: boolean;
  /** Accepted and ignored: there is no optimizer to opt out of. */
  unoptimized?: boolean;
  /** Accepted and ignored: use `loading="eager"` / `fetchPriority` instead. */
  priority?: boolean;
  /** Accepted and ignored: only meaningful with a generated srcset. */
  sizes?: string;
  ref?: Ref<HTMLImageElement>;
};

export function Image({
  alt,
  fill,
  unoptimized: _unoptimized,
  priority: _priority,
  sizes: _sizes,
  className,
  style,
  width,
  height,
  ...props
}: ImageProps) {
  const fillStyle: CSSProperties | undefined = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style }
    : style;

  return (
    <img
      {...props}
      // Explicit rather than spread so the required alt text stays visible to
      // linters and reviewers.
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={cn(className)}
      style={fillStyle}
    />
  );
}

export default Image;
