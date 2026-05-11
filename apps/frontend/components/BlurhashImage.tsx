"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { getBlurhashDataUrl } from "@/lib/blurhash";
import { cn } from "@/lib/utils";

type BlurhashImageProps = Omit<ImageProps, "placeholder" | "blurDataURL"> & {
  blurhash?: string | null;
};

const CROSSFADE_MS = 240;

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
  const [imageReady, setImageReady] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const imageReadyRef = useRef(false);
  const placeholderRef = useRef<string | null>(null);
  const revealIdRef = useRef(0);

  useEffect(() => {
    if (!blurhash) {
      placeholderRef.current = null;
      setPlaceholder(null);
      setShowPlaceholder(false);
      return;
    }

    const nextPlaceholder = getBlurhashDataUrl(blurhash);
    placeholderRef.current = nextPlaceholder;
    setPlaceholder(nextPlaceholder);
    setShowPlaceholder(Boolean(nextPlaceholder) && !imageReadyRef.current);
  }, [blurhash]);

  useEffect(() => {
    revealIdRef.current += 1;
    imageReadyRef.current = false;
    setImageReady(false);
    setShowPlaceholder(Boolean(placeholderRef.current));
  }, [src]);

  useEffect(() => {
    if (!imageReady || !placeholder) return;

    const timeout = window.setTimeout(() => {
      setShowPlaceholder(false);
    }, CROSSFADE_MS);

    return () => window.clearTimeout(timeout);
  }, [imageReady, placeholder]);

  const imageStyle = placeholder
    ? {
        ...rest.style,
        transitionDuration: `${CROSSFADE_MS}ms`,
      }
    : rest.style;

  return (
    <>
      {placeholder && showPlaceholder && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          className={cn(
            "absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity ease-out will-change-opacity",
            imageReady ? "opacity-0" : "opacity-100",
            className,
          )}
          style={{ transitionDuration: `${CROSSFADE_MS}ms` }}
        />
      )}
      <Image
        {...rest}
        src={src}
        alt={alt}
        className={cn(
          className,
          placeholder &&
            "transition-opacity ease-out will-change-opacity motion-reduce:transition-none",
          placeholder && !imageReady && "opacity-0",
        )}
        style={imageStyle}
        onLoad={(event) => {
          onLoad?.(event);

          const revealId = revealIdRef.current;
          const image = event.currentTarget;
          const reveal = () => {
            if (revealId !== revealIdRef.current) return;

            requestAnimationFrame(() => {
              if (revealId === revealIdRef.current) {
                imageReadyRef.current = true;
                setImageReady(true);
              }
            });
          };

          void image.decode().catch(() => undefined).then(reveal);
        }}
      />
    </>
  );
}
