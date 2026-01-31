"use client";

import { useUser } from "@/lib/hooks/use-queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProfileDisplayProps {
  username: string;
}

/**
 * Generate initials from a display name for avatar fallback
 */
function generateInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

/**
 * UserProfileDisplay shows user avatar, display name, and username
 * Used in the login password step to confirm the account being logged into
 */
export function UserProfileDisplay({ username }: UserProfileDisplayProps) {
  const { data: user, isLoading, isError } = useUser(username);

  // Loading state: Show skeleton
  if (isLoading) {
    return (
      <div className="bg-muted rounded-lg p-4 flex items-center gap-3">
        <div className="h-12 w-12 bg-muted-foreground/20 rounded-lg shrink-0 animate-pulse" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-5 bg-muted-foreground/20 rounded w-32 animate-pulse" />
          <div className="h-4 bg-muted-foreground/20 rounded w-24 animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state or user not found: Don't show anything
  // The login will fail on the server side with appropriate error message
  if (isError || !user) {
    return null;
  }

  // Generate display name and initials
  const displayName = user.displayName || user.username;
  const initials = generateInitials(displayName);

  return (
    <div className="rounded-lg flex items-center gap-3">
      {/* Avatar */}
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarImage src={user.avatarUrl || undefined} alt={displayName} />
        <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* User info */}
      <div className="flex flex-col min-w-0">
        {user.displayName ? (
          <>
            <span className="font-semibold text-foreground truncate">
              {user.displayName}
            </span>
            <span className="text-sm text-muted-foreground truncate">
              @{user.username}
            </span>
          </>
        ) : (
          <span className="font-semibold text-foreground truncate">
            @{user.username}
          </span>
        )}
      </div>
    </div>
  );
}
