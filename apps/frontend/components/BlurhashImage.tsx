"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { getBlurhashDataUrl } from "@/lib/blurhash";
import { cn } from "@/lib/utils";

type BlurhashImageProps = Omit<ImageProps, "placeholder" | "blurDataURL"> & {
  blurhash?: string | null;
};

/**
 * next/image wrapper that overlays a BlurHash-decoded preview while the real
 * image is loading. Falls back to the bare image when no hash is provided or
 * decoding fails. Decoding happens client-side in an effect so SSR output
 * matches the no-hash variant.
 */
export function BlurhashImage({
  blurhash,
  onLoad,
  className,
  alt,
  src,
  ...rest
}: BlurhashImageProps) {
  const [placeholder, setPlaceholder] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!blurhash) {
      setPlaceholder(null);
      return;
    }
    setPlaceholder(getBlurhashDataUrl(blurhash));
  }, [blurhash]);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <>
      {placeholder && !loaded && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          className={cn(
            "absolute inset-0 w-full h-full object-cover pointer-events-none",
            className,
          )}
        />
      )}
      <Image
        {...rest}
        src={src}
        alt={alt}
        className={cn(
          className,
          placeholder && "transition-opacity duration-300",
          placeholder && !loaded && "opacity-0",
        )}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
      />
    </>
  );
}
