"use client";

import { cn } from "@/lib/utils";
import { useUser } from "@/lib/hooks/use-queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DisplayName } from "@/components/users/DisplayName";

interface UserProfileDisplayProps {
  username: string;
  /**
   * `"inline"` sits the avatar beside the name, for the full-screen wizards.
   * `"stacked"` centres avatar over display name over username, which reads as
   * a card header inside a bottom sheet.
   */
  layout?: "inline" | "stacked";
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
export function UserProfileDisplay({
  username,
  layout = "inline",
}: UserProfileDisplayProps) {
  const { data: user, isLoading, isError } = useUser(username);
  const stacked = layout === "stacked";

  // Loading state: Show skeleton
  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-muted rounded-lg p-4 flex gap-3",
          stacked ? "flex-col items-center" : "items-center",
        )}
      >
        <div
          className={cn(
            "bg-muted-foreground/20 shrink-0 animate-pulse",
            stacked ? "h-16 w-16 rounded-full" : "h-12 w-12 rounded-lg",
          )}
        />
        <div
          className={cn(
            "flex flex-col gap-2",
            stacked ? "items-center" : "flex-1",
          )}
        >
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
    <div
      className={cn(
        "rounded-lg flex gap-3",
        stacked ? "flex-col items-center" : "items-center",
      )}
    >
      {/* Avatar */}
      <Avatar className={cn("shrink-0", stacked ? "h-16 w-16" : "h-12 w-12")}>
        <AvatarImage src={user.avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* User info */}
      <div
        className={cn(
          "flex flex-col min-w-0",
          stacked && "items-center text-center",
        )}
      >
        {user.displayName ? (
          <>
            <span className="font-semibold text-foreground truncate">
              <DisplayName name={user.displayName} isPrivate={user.isPrivate} />
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
