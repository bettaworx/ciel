"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { components } from "@/lib/api/api";

type User = components["schemas"]["User"];

interface ReactionUserButtonProps {
  user: User;
  className?: string;
}

export function ReactionUserButton({
  user,
  className,
}: ReactionUserButtonProps) {
  const displayName = user.displayName || user.username;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className={cn(
        "w-full justify-start gap-2 rounded-lg px-0 py-1.5 hover:bg-transparent",
        "text-foreground",
        className,
      )}
    >
      <Link href={`/users/${encodeURIComponent(user.username)}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatarUrl || undefined} alt={displayName} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium truncate">{displayName}</span>
      </Link>
    </Button>
  );
}
