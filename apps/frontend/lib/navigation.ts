"use client";

/**
 * Navigation compatibility layer over TanStack Router.
 *
 * The app had ~50 files importing `next/navigation` and ~95 `router.push`
 * call sites. Rather than rewrite every one, this module keeps that surface and
 * implements it on TanStack Router, so the migration only changed import paths.
 *
 * Trade-off: hrefs are plain strings here, so TanStack's typed-route checking
 * does not apply to navigation. New code that navigates to a fixed route is
 * better off using `<Link to="/...">` from @tanstack/react-router directly.
 */

import {
  notFound as tanstackNotFound,
  useLocation,
  useNavigate,
  useParams as useTanstackParams,
  useRouter as useTanstackRouter,
} from "@tanstack/react-router";
import { useMemo } from "react";

type NavigateTarget = {
  to: string;
  search?: Record<string, string>;
  hash?: string;
};

/**
 * Split an href into the parts TanStack Router navigates with.
 *
 * `to` on its own does not carry a query string, and plenty of call sites pass
 * one (`/login?redirect=/admin`, search URLs, saved redirect targets), so the
 * href is parsed rather than handed over whole.
 */
function parseHref(href: string): NavigateTarget {
  // A relative href needs some origin to parse against; it is discarded.
  const base = typeof window === "undefined" ? "http://localhost" : window.location.origin;

  try {
    const url = new URL(href, base);
    const target: NavigateTarget = { to: url.pathname };

    if (url.searchParams.size > 0) {
      target.search = Object.fromEntries(url.searchParams);
    }
    if (url.hash) {
      target.hash = url.hash.slice(1);
    }

    return target;
  } catch {
    return { to: href };
  }
}

export interface CompatRouter {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
  forward: () => void;
  /** No-op: TanStack Router preloads on link intent instead. */
  prefetch: (href: string) => void;
  refresh: () => void;
}

/** Drop-in replacement for `useRouter` from next/navigation. */
export function useRouter(): CompatRouter {
  const navigate = useNavigate();
  const router = useTanstackRouter();

  return useMemo(
    () => ({
      push: (href: string) => {
        void navigate(parseHref(href) as never);
      },
      replace: (href: string) => {
        void navigate({ ...parseHref(href), replace: true } as never);
      },
      back: () => router.history.back(),
      forward: () => router.history.forward(),
      prefetch: () => {},
      refresh: () => {
        void router.invalidate();
      },
    }),
    [navigate, router],
  );
}

/** Drop-in replacement for `usePathname` from next/navigation. */
export function usePathname(): string {
  return useLocation({ select: (location) => location.pathname });
}

/**
 * Drop-in replacement for `useSearchParams` from next/navigation.
 *
 * Returns a real URLSearchParams so `.get()` and friends work unchanged.
 */
export function useSearchParams(): URLSearchParams {
  const searchStr = useLocation({ select: (location) => location.searchStr });

  return useMemo(() => new URLSearchParams(searchStr), [searchStr]);
}

/** Drop-in replacement for `useParams` from next/navigation. */
export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  // strict: false because the shim is route-agnostic; callers know their own
  // params, which is what the type parameter is for.
  return useTanstackParams({ strict: false } as never) as T;
}

/**
 * Drop-in replacement for `notFound` from next/navigation.
 *
 * Like Next's, this throws; it never returns.
 */
export function notFound(): never {
  throw tanstackNotFound();
}
