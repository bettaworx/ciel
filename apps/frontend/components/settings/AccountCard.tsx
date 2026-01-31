"use client";

import { useAtomValue } from "jotai";
import { userAtom } from "@/atoms/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

export function AccountCard() {
  const user = useAtomValue(userAtom);
  const router = useRouter();

  if (!user) return null;

  // displayNameの最初の文字、なければusernameの最初の文字を大文字にしてイニシャルとする
  const initials = (user.displayName?.[0] || user.username[0]).toUpperCase();

  const handleClick = () => {
    router.push(`/users/${user.username}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full p-3 rounded-lg bg-card hover:bg-accent transition-colors text-left mb-4"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName || user.username} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">
            {user.displayName || user.username}
          </div>
          <div className="text-sm text-muted-foreground truncate">
            @{user.username}
          </div>
        </div>
      </div>
    </button>
  );
}
