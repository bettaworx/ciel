"use client";

/**
 * Link compatibility layer over TanStack Router.
 *
 * Keeps the `href` prop the app already uses everywhere, so the migration off
 * next/link only changed import paths. Client-side navigation and hover
 * preloading come from TanStack's Link underneath.
 *
 * New code pointing at a fixed route is better off importing Link from
 * @tanstack/react-router directly, which type-checks the path.
 */

import { Link as RouterLink } from "@tanstack/react-router";
import type { ComponentPropsWithoutRef, Ref } from "react";

type AnchorProps = Omit<ComponentPropsWithoutRef<"a">, "href">;

export type LinkProps = AnchorProps & {
  href: string;
  /** Accepted and ignored: TanStack preloads on intent by default. */
  prefetch?: boolean;
  replace?: boolean;
  ref?: Ref<HTMLAnchorElement>;
};

export function Link({ href, prefetch: _prefetch, replace, ...props }: LinkProps) {
  // An external or protocol-relative href is not a route; render a plain
  // anchor so the browser handles it.
  if (isExternal(href)) {
    return <a href={href} {...props} />;
  }

  return <RouterLink to={href} replace={replace} {...(props as object)} />;
}

function isExternal(href: string): boolean {
  return /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href);
}

export default Link;
