"use client";

import { useEffect } from "react";
import { useServerInfo } from "@/lib/hooks/use-queries";

/** Shipped fallbacks, used until server info arrives and when no icon is set. */
const DEFAULT_ICON = "/icon-default.svg";
const DEFAULT_APPLE_ICON = "/icon-192.png";

/**
 * Dynamic Favicon Component
 *
 * Points <link rel="icon"> and <link rel="apple-touch-icon"> at the instance's
 * configured server icon.
 *
 * This runs on the client rather than being rendered by a server, because the
 * icon URL is already part of the server info the app fetches anyway. The
 * WebSocket `server_info_updated` event patches that cache directly, so
 * changing the icon in the admin screens updates the tab immediately.
 */
export function FaviconLink() {
  const { data: serverInfo } = useServerInfo();
  const iconUrl = serverInfo?.serverIconUrl;

  useEffect(() => {
    const resolved = iconUrl ? preferStaticVariant(iconUrl) : DEFAULT_ICON;

    setIconLink("icon", resolved, iconUrl ? undefined : "image/svg+xml");
    // iOS ignores SVG icons for the home screen, so the raster fallback stays
    // in place until a real server icon exists.
    setIconLink("apple-touch-icon", iconUrl ? resolved : DEFAULT_APPLE_ICON);
  }, [iconUrl]);

  return null; // This component doesn't render anything
}

/**
 * Prefer the static (first frame) variant of an animated icon. A spinning
 * favicon is distracting, and Safari refuses animated WebP outright.
 */
function preferStaticVariant(url: string): string {
  return url
    .replace("/image.webp", "/image_static.webp")
    .replace("/image.png", "/image_static.png");
}

function setIconLink(rel: string, href: string, type?: string) {
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }

  link.setAttribute("href", href);
  if (type) {
    link.setAttribute("type", type);
  } else {
    link.removeAttribute("type");
  }
}
