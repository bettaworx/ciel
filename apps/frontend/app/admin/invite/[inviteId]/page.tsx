"use client";

import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  useAdminInviteCode,
  useAdminInviteUsageHistory,
  useAdminDisableInviteCode,
  useAdminDeleteInviteCode,
} from "@/lib/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import { Copy, Check, ArrowLeft, Edit, Ban, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ja, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { Progress } from "@/components/ui/progress";

type InviteStatus = "active" | "disabled" | "expired" | "exhausted";

interface InviteCode {
  id: string;
  code: string;
  createdBy: string;
  createdAt: string;
  lastUsedAt?: string | null;
  useCount: number;
  maxUses?: number | null;
  expiresAt?: string | null;
  disabled: boolean;
  note?: string | null;
}

function getInviteStatus(invite: InviteCode): InviteStatus {
  if (invite.disabled) return "disabled";
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date())
    return "expired";
  if (invite.maxUses != null && invite.useCount >= invite.maxUses)
    return "exhausted";
  return "active";
}

function getStatusVariant(
  status: InviteStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "disabled":
      return "secondary";
    case "expired":
      return "destructive";
    case "exhausted":
      return "outline";
  }
}

export default function InviteDetailPage({
  params,
}: {
  params: Promise<{ inviteId: string }>;
}) {
  const t = useTranslations("admin.invites");
  const router = useRouter();
  const locale = useLocale();
  const dateLocale = locale === "ja" ? ja : enUS;
  
  // Unwrap params promise
  const { inviteId } = use(params);

  const { data: invite, isLoading: inviteLoading } = useAdminInviteCode(
    inviteId,
  );
  const { data: usageHistory, isLoading: historyLoading } =
    useAdminInviteUsageHistory(inviteId);

  const disableMutation = useAdminDisableInviteCode();
  const deleteMutation = useAdminDeleteInviteCode();

  const [copied, setCopied] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleCopyCode = async () => {
    if (!invite) return;

    try {
      await navigator.clipboard.writeText(invite.code);
      setCopied(true);
      toast.success(t("messages.copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error(t("messages.copyFailed"));
    }
  };

  const handleDisable = async () => {
    try {
      await disableMutation.mutateAsync(inviteId);
      toast.success(t("messages.disableSuccess"));
      setDisableDialogOpen(false);
    } catch (error) {
      console.error("Failed to disable:", error);
      toast.error(t("messages.disableError"));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(inviteId);
      toast.success(t("messages.deleteSuccess"));
      router.push("/admin/invite");
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error(t("messages.deleteError"));
    }
  };

  if (inviteLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Invite code not found</p>
      </div>
    );
  }

  const status = getInviteStatus(invite);
  const usagePercentage =
    invite.maxUses != null
      ? Math.min((invite.useCount / invite.maxUses) * 100, 100)
      : 0;

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 overflow-y-auto px-4">
          <div className="w-full max-w-5xl mx-auto space-y-6 py-8">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/admin/invite")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold">{t("detail")}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Basic Info */}
              <div className="border rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">Basic Information</h2>

                {/* Code Display */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t("fields.code")}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-3 bg-muted rounded-lg font-mono text-xl font-bold tracking-wider">
                      {invite.code}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyCode}
                      title={t("actions.copy")}
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t("fields.status")}
                  </p>
                  <Badge variant={getStatusVariant(status)}>
                    {t(`status.${status}`)}
                  </Badge>
                </div>

                {/* Created At */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t("fields.createdAt")}
                  </p>
                  <p className="text-sm">
                    {new Date(invite.createdAt).toLocaleString(locale)}
                  </p>
                </div>

                {/* Last Used At */}
                {invite.lastUsedAt && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {t("fields.lastUsedAt")}
                    </p>
                    <p className="text-sm">
                      {formatDistanceToNow(new Date(invite.lastUsedAt), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    </p>
                  </div>
                )}

                {/* Note */}
                {invite.note && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {t("fields.note")}
                    </p>
                    <p className="text-sm">{invite.note}</p>
                  </div>
                )}
              </div>

              {/* Card 2: Usage Stats */}
              <div className="border rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">Usage Statistics</h2>

                {/* Usage Count */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {t("fields.useCount")}
                    </p>
                    <p className="text-sm font-medium">
                      {invite.useCount}
                      {invite.maxUses != null && ` / ${invite.maxUses}`}
                    </p>
                  </div>
                  {invite.maxUses != null && (
                    <Progress value={usagePercentage} className="h-2" />
                  )}
                </div>

                {/* Expiration */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t("fields.expiresAt")}
                  </p>
                  <p className="text-sm">
                    {invite.expiresAt
                      ? new Date(invite.expiresAt).toLocaleString(locale)
                      : t("form.never")}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      router.push(`/admin/invite/${inviteId}/edit`)
                    }
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {t("actions.edit")}
                  </Button>

                  {!invite.disabled && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setDisableDialogOpen(true)}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      {t("actions.disable")}
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t("actions.delete")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Card 3: Usage History (Full Width) */}
            <div className="border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">
                {t("usageHistory.title")}
              </h2>

              {historyLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : !usageHistory || usageHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("usageHistory.noUsage")}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          {t("usageHistory.user")}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          {t("usageHistory.usedAt")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageHistory.map((usage) => (
                        <tr key={usage.id} className="border-b">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage
                                  src={usage.avatarMediaId ? `/api/media/${usage.avatarMediaId}` : undefined}
                                />
                                <AvatarFallback>
                                  {usage.displayName?.[0] ||
                                    usage.username[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {usage.displayName ||
                                    usage.username}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  @{usage.username}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {new Date(usage.usedAt).toLocaleString(locale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Disable Confirmation Dialog */}
      <AlertDialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm.disableTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm.disableDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              disabled={disableMutation.isPending}
            >
              {t("actions.disable")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
