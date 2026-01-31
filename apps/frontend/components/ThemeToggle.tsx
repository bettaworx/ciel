"use client";

import { Moon, Sun } from "lucide-react";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { themeAtom, type Theme } from "@/atoms/theme";

export function ThemeToggle() {
  const t = useTranslations();
  const [theme, setTheme] = useAtom(themeAtom);
  const [mounted, setMounted] = useState(false);

  // SSR対応: クライアントサイドでマウント後のみ表示
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, mounted]);

  if (!mounted) {
    // SSR中はプレースホルダーを返す（レイアウトシフト防止）
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="default"
      size="icon"
      onClick={toggleTheme}
      aria-label={t("theme.toggle")}
      title={theme === "dark" ? t("theme.light") : t("theme.dark")}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
