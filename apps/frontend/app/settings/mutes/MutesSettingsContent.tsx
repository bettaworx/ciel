"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserListRow } from "@/components/users/UserListRow";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import {
  useHiddenList,
  useUnblockUser,
  useUnmuteUser,
} from "@/lib/hooks/use-queries";

/**
 * The muted and blocked account lists.
 *
 * Blocking is the reason this page has to exist: a blocked account is gone from
 * search, from every follow list and from both timelines, so without a list of
 * them there would be no way to find one again and undo it.
 */
export function MutesSettingsContent() {
  const t = useTranslations();

  return (
    <>
      <PageHeader>{t("settings.mutes.title")}</PageHeader>
      <div className="space-y-3">
        <Tabs defaultValue="mutes">
          <TabsList className="mb-3 w-full">
            <TabsTrigger value="mutes">{t("settings.mutes.muted")}</TabsTrigger>
            <TabsTrigger value="blocks">{t("settings.mutes.blocked")}</TabsTrigger>
          </TabsList>

          <TabsContent value="mutes">
            <HiddenUserList kind="mutes" />
          </TabsContent>
          <TabsContent value="blocks">
            <HiddenUserList kind="blocks" />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function HiddenUserList({ kind }: { kind: "mutes" | "blocks" }) {
  const t = useTranslations();
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHiddenList(kind);

  const unmute = useUnmuteUser();
  const unblock = useUnblockUser();
  const undo = kind === "mutes" ? unmute : unblock;

  const scrollRef = useInfiniteScroll({
    enabled: Boolean(hasNextPage),
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
  });

  const users = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner variant="theme" label={t("loading")} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">
          {t("error.title")}: {error.message}
        </p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">
          {kind === "mutes"
            ? t("settings.mutes.noMuted")
            : t("settings.mutes.noBlocked")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {users.map((user) => (
          <UserListRow
            key={user.id}
            user={user}
            hideMenu
            action={
              <Button
                variant="default"
                size="sm"
                className="shrink-0"
                disabled={undo.isPending}
                onClick={(e) => {
                  // The row is a link to the profile.
                  e.preventDefault();
                  e.stopPropagation();
                  undo.mutate(user.username, {
                    onError: () =>
                      toast.error(
                        kind === "mutes"
                          ? t("user.muteError")
                          : t("user.blockError"),
                      ),
                  });
                }}
              >
                {kind === "mutes"
                  ? t("user.unmuteUser")
                  : t("user.unblockUser")}
              </Button>
            }
          />
        ))}
      </div>

      <InfiniteScrollTrigger
        sentinelRef={scrollRef}
        hasNextPage={Boolean(hasNextPage)}
        isFetchingNextPage={isFetchingNextPage}
      />
    </>
  );
}
