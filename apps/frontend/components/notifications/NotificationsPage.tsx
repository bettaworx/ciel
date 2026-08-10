"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, CheckCheck } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { DynamicTitle } from "@/components/DynamicTitle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { useMarkNotificationsSeen } from "@/lib/hooks/use-mark-notifications-seen";
import {
  useMarkNotificationsRead,
  useNotifications,
  useUnreadNotificationCount,
  type NotificationTab,
} from "@/lib/hooks/use-queries";

function NotificationList({ tab }: { tab: NotificationTab }) {
  const t = useTranslations("notifications");
  const tCommon = useTranslations();
  const markSeen = useMarkNotificationsSeen();
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications(tab);

  const notifications = useMemo(
    () => data?.pages.flatMap((page) => page.items ?? []) ?? [],
    [data],
  );
  const infiniteScrollRef = useInfiniteScroll({
    enabled: notifications.length > 0,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
  });

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl bg-card sm:rounded-2xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner variant="theme" label={tCommon("loading")} />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-destructive">
              {tCommon("error.title")}: {error.message}
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title={t("empty")} />
        ) : (
          notifications.map((notification, index) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              isLast={index === notifications.length - 1}
              onSeen={markSeen}
            />
          ))
        )}
      </div>

      <InfiniteScrollTrigger
        sentinelRef={infiniteScrollRef}
        hasNextPage={Boolean(hasNextPage)}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
}

export function NotificationsPage() {
  const t = useTranslations("notifications");
  const [tab, setTab] = useState<NotificationTab>("all");
  const { data: unread } = useUnreadNotificationCount();
  const markAllRead = useMarkNotificationsRead();
  const unreadCount = unread?.count ?? 0;

  return (
    <PageContainer maxWidth="2xl" header={<PageHeader>{t("title")}</PageHeader>}>
      <DynamicTitle title={t("title")} />
      <Tabs value={tab} onValueChange={(value) => setTab(value as NotificationTab)}>
        <div className="flex items-center gap-2">
          <TabsList className="flex-1">
            <TabsTrigger value="all">{t("tabs.all")}</TabsTrigger>
            <TabsTrigger value="mentions">{t("tabs.mentions")}</TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            // Match TabsList's surface and shape so the row reads as one control.
            className="h-12 w-12 shrink-0 rounded-2xl bg-card hover:bg-muted"
            aria-label={t("markAllRead")}
            title={t("markAllRead")}
            disabled={unreadCount === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate(undefined)}
          >
            <CheckCheck className="h-5 w-5" />
          </Button>
        </div>

        <TabsContent value="all" className="mt-3">
          <NotificationList tab="all" />
        </TabsContent>
        <TabsContent value="mentions" className="mt-3">
          <NotificationList tab="mentions" />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
