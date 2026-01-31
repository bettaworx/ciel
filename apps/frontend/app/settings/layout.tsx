"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { settingsCategories } from "@/lib/settings-categories";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AccountCard } from "@/components/settings/AccountCard";
import { PageContainer } from "@/components/PageContainer";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const pathname = usePathname();

  // 翻訳を適用
  const categories = settingsCategories.map((cat) => ({
    ...cat,
    label: t(cat.labelKey),
  }));

  return (
    <RequireAuth redirectOnClose="/">
      <PageContainer padding="compact" as="div">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <AccountCard />
            <nav className="space-y-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = pathname === category.href;

                return (
                  <Link key={category.id} href={category.href}>
                    <Button
                      variant={isActive ? "primary" : "ghost"}
                      className="w-full justify-start gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{category.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Content Area */}
          <main className="flex-1 max-w-2xl">{children}</main>
        </div>
      </PageContainer>
    </RequireAuth>
  );
}
