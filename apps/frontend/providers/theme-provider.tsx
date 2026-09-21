"use client";

import { useAtomValue } from "jotai";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { themeAtom, type Theme } from "@/atoms/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

// Get system theme preference
const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
};

function subscribeToSystemTheme(onChange: () => void) {
  const mediaQuery = window.matchMedia(DARK_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

/**
 * The theme actually in effect, with "system" resolved against the OS setting
 * and kept in sync when that changes.
 *
 * This is the single place that knows how to resolve a preference, so anything
 * that needs to render differently per theme reads it from here.
 */
export function useResolvedTheme(): "light" | "dark" {
  const theme = useAtomValue(themeAtom);
  const systemTheme = useSyncExternalStore<"light" | "dark">(
    subscribeToSystemTheme,
    getSystemTheme,
    () => "dark",
  );

  return theme === "system" ? systemTheme : theme;
}

/** The stored preference, including "system". */
export function useThemePreference(): Theme {
  return useAtomValue(themeAtom);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const resolvedTheme = useResolvedTheme();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  return <>{children}</>;
}
