"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Image,
  Filter,
  FileCheck,
  Ban,
  FileWarning,
  Ticket,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/config", label: "config", icon: Settings },
  { href: "/admin/users", label: "users", icon: Users },
  { href: "/admin/posts", label: "posts", icon: FileText },
  { href: "/admin/media", label: "media", icon: Image },
  { href: "/admin/content-filters", label: "contentFilters", icon: Filter },
  { href: "/admin/invite", label: "invites", icon: Ticket },
  { href: "/admin/agreements", label: "agreements", icon: FileCheck },
  { href: "/admin/ip-bans", label: "ipBans", icon: Ban },
  { href: "/admin/logs", label: "logs", icon: FileWarning },
];

export function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");

  return (
    <nav className="mb-8 border-b">
      <div className="flex items-center justify-center space-x-6 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center border-b-2 px-1 py-4 text-sm font-medium transition-colors",
                isActive
                  ? "space-x-2 border-c-1 text-c-1"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
              title={t(item.label)}
            >
              <Icon className="h-4 w-4" />
              {isActive && (
                <span className="whitespace-nowrap">{t(item.label)}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
