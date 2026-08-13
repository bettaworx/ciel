"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useAcceptFollowRequest,
  useRejectFollowRequest,
} from "@/lib/hooks/use-queries";

/**
 * Approve / decline buttons for a follow request.
 *
 * These live on the notification row rather than on a page of their own: the
 * request already arrives as a notification, and a second place to find them
 * would only be somewhere else to forget to look.
 */
export function FollowRequestActions({ username }: { username: string }) {
  const t = useTranslations("followRequests");
  const accept = useAcceptFollowRequest();
  const reject = useRejectFollowRequest();

  const isPending = accept.isPending || reject.isPending;

  const run = (
    mutation: typeof accept,
    successMessage: string,
  ) => (e: React.MouseEvent) => {
    // The row itself is clickable, so keep the decision from also navigating.
    e.preventDefault();
    e.stopPropagation();
    mutation.mutate(username, {
      onSuccess: () => toast.success(successMessage),
      onError: () => toast.error(t("error")),
    });
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      <Button
        variant="primary"
        size="sm"
        disabled={isPending}
        onClick={run(accept, t("accepted"))}
      >
        {t("accept")}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={run(reject, t("rejected"))}
      >
        {t("reject")}
      </Button>
    </div>
  );
}
