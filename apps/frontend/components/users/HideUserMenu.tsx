"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useHideUserActions } from "@/lib/hooks/use-hide-user-actions";
import { cn } from "@/lib/utils";
import type { components } from "@/lib/api/api";

type User = components["schemas"]["User"];

/**
 * A "…" menu holding just the mute and block actions, for rows that have no
 * other menu of their own.
 *
 * The post card and the profile keep their own menus instead: those already
 * carry copy and share entries, and merging them here would mean passing the
 * rest of their items through this component.
 *
 * Renders nothing when logged out or pointed at yourself — useHideUserActions
 * returns no actions in either case.
 */
export function HideUserMenu({
  user,
  className,
}: {
  user: User;
  className?: string;
}) {
  const t = useTranslations();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [open, setOpen] = useState(false);
  const { actions, dialog } = useHideUserActions(user.username, {
    isMuted: user.isMuted,
    isBlocking: user.isBlocking,
  });

  if (actions.length === 0) return null;

  // The row is usually a link to the profile, and the menu portals to the body
  // while React events still bubble up the component tree.
  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8 shrink-0 text-muted-foreground", className)}
      aria-label={t("user.moreActions")}
      // Only the navigation is cancelled, not the event: preventDefault alone
      // stops the surrounding <Link>, while calling stopPropagation here would
      // also keep the click from reaching the trigger that opens the menu.
      onClick={(e) => e.preventDefault()}
    >
      <MoreHorizontal className="h-5 w-5" />
    </Button>
  );

  return (
    <>
      {isDesktop ? (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={stop}>
            {actions.map((action) => (
              <DropdownMenuItem
                key={action.key}
                onSelect={action.run}
                className={
                  action.destructive
                    ? "text-destructive focus:text-destructive"
                    : undefined
                }
              >
                {action.icon}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent onClick={stop}>
            <div className="flex flex-col gap-2 p-2 pb-4">
              {actions.map((action) => (
                <Button
                  key={action.key}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2",
                    action.destructive && "text-destructive",
                  )}
                  onClick={(e) => {
                    stop(e);
                    // Both actions open a confirmation of their own, and two
                    // stacked drawers trap the dismiss.
                    setOpen(false);
                    action.run();
                  }}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      )}
      {dialog}
    </>
  );
}
