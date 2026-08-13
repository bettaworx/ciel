"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useAtomValue } from "jotai";
import { toast } from "sonner";
import { Ban, Volume2, VolumeX } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { userAtom } from "@/atoms/auth";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import {
  useBlockUser,
  useMuteUser,
  useUnblockUser,
  useUnmuteUser,
} from "@/lib/hooks/use-queries";

type ConfirmKind = "mute" | "unmute" | "block" | "unblock";

export type HideUserAction = {
  key: "mute" | "block";
  icon: ReactNode;
  label: string;
  /** Only blocking is styled destructively; muting is a quiet, private change. */
  destructive: boolean;
  run: () => void;
};

/**
 * The mute and block menu entries, shared by the post card and the profile.
 *
 * Returns descriptors rather than markup because the two menus render the same
 * actions in different shapes — DropdownMenuItem on desktop, a Button row in a
 * Drawer on mobile — and this house style writes both out by hand. `dialog` is
 * the shared confirmation and has to be rendered somewhere in the tree; it is
 * inert until muting or blocking is chosen.
 *
 * `actions` is empty when logged out or pointed at yourself, so callers can
 * spread it without guarding.
 */
export function useHideUserActions(
  username: string | undefined,
  state: { isMuted?: boolean | null; isBlocking?: boolean | null },
): { actions: HideUserAction[]; dialog: ReactNode } {
  const t = useTranslations();
  const authUser = useAtomValue(userAtom);
  const isDesktop = useMediaQuery("(min-width: 640px)");
  // Which confirmation is open, if any. All four actions ask: each one silently
  // changes what a whole timeline shows, and none of them is obvious from the
  // menu row alone.
  const [confirming, setConfirming] = useState<ConfirmKind | null>(null);

  const muteUser = useMuteUser();
  const unmuteUser = useUnmuteUser();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();

  const available = Boolean(
    username && authUser && authUser.username !== username,
  );

  const isMuted = Boolean(state.isMuted);
  const isBlocking = Boolean(state.isBlocking);

  const actions: HideUserAction[] = available
    ? [
        {
          key: "mute",
          icon: isMuted ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          ),
          label: isMuted ? t("user.unmuteUser") : t("user.muteUser"),
          // Muting is silent, reversible and invisible to the other account, so
          // it is offered plainly rather than in destructive red.
          destructive: false,
          run: () => setConfirming(isMuted ? "unmute" : "mute"),
        },
        {
          key: "block",
          icon: <Ban className="h-4 w-4" />,
          label: isBlocking ? t("user.unblockUser") : t("user.blockUser"),
          destructive: !isBlocking,
          run: () => setConfirming(isBlocking ? "unblock" : "block"),
        },
      ]
    : [];

  const mutations = {
    mute: muteUser,
    unmute: unmuteUser,
    block: blockUser,
    unblock: unblockUser,
  } as const;

  const confirmPending = () => {
    if (!username || !confirming) return;
    const isMuteSide = confirming === "mute" || confirming === "unmute";
    mutations[confirming].mutate(username, {
      onError: () =>
        toast.error(t(isMuteSide ? "user.muteError" : "user.blockError")),
      onSettled: () => setConfirming(null),
    });
  };

  const isConfirmPending =
    muteUser.isPending ||
    unmuteUser.isPending ||
    blockUser.isPending ||
    unblockUser.isPending;

  // These menus often sit inside a link to the profile, and the dialog portals
  // to the body while React events still bubble up the component tree.
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  // One dialog, four sets of copy. "mute" -> user.muteConfirmTitle, and so on.
  const kind = confirming ?? "mute";
  const title = t(`user.${kind}ConfirmTitle`);
  const description = t(`user.${kind}ConfirmDescription`, {
    username: username ?? "",
  });
  const confirmLabel = t(`user.${kind}User`);

  const setOpen = (open: boolean) => {
    if (!open) setConfirming(null);
  };

  const dialog = isDesktop ? (
    <AlertDialog open={confirming !== null} onOpenChange={setOpen}>
      <AlertDialogContent onClick={stopPropagation}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirmPending}>
            {t("user.hideConfirmCancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmPending}
            disabled={isConfirmPending}
            variant={confirming === "block" ? "destructive" : "default"}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : (
    <Drawer open={confirming !== null} onOpenChange={setOpen}>
      <DrawerContent onClick={stopPropagation}>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button
            variant={confirming === "block" ? "destructive" : "default"}
            onClick={confirmPending}
            disabled={isConfirmPending}
          >
            {confirmLabel}
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirming(null)}
            disabled={isConfirmPending}
          >
            {t("user.hideConfirmCancel")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );

  return { actions, dialog };
}
