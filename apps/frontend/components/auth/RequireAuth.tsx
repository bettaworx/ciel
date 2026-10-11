"use client";

import { useAtomValue } from "jotai";
import { authStatusAtom, isAuthenticatedAtom } from "@/atoms/auth";
import { usePathname, useRouter } from "@/lib/navigation";
import { useState, useEffect, useRef } from "react";

interface RequireAuthProps {
  children: React.ReactNode;
  redirectOnClose?: string; // デフォルト: '/'
  fallback?: React.ReactNode; // ローディング中の表示
}

export function RequireAuth({
  children,
  redirectOnClose = "/",
  fallback = null,
}: RequireAuthProps) {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const authStatus = useAtomValue(authStatusAtom);
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Where to send the visitor back to after signing in: the page they asked
  // for, captured on the first render. Reading it live instead would overwrite
  // itself — this component stays subscribed to the location, so the replace
  // below changes `pathname` to "/login" and the effect would run again with
  // that as the target.
  const requestedPathRef = useRef(pathname);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (!isMounted || authStatus !== "ready" || isAuthenticated) return;
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;

    const redirectUrl = new URL("/login", window.location.origin);
    redirectUrl.searchParams.set("redirect", requestedPathRef.current || redirectOnClose);
    router.replace(redirectUrl.pathname + redirectUrl.search);
  }, [authStatus, isAuthenticated, isMounted, redirectOnClose, router]);

  // SSR対応: マウント前 or 認証状態判定中はfallbackを表示
  if (!isMounted || authStatus !== "ready") {
    return <>{fallback}</>;
  }

  // 認証済み: 子コンポーネントを表示
  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
