"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Pencil, Plus, SmilePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminDeleteEmoji,
  useAdminEmojis,
} from "@/lib/hooks/use-queries";
import type { components } from "@/lib/api/api";

type AdminEmoji = components["schemas"]["AdminEmoji"];

export default function AdminEmojisPage() {
  const t = useTranslations("admin.emojis");
  const tEmpty = useTranslations("admin.empty.emojis");
  const tCommon = useTranslations("admin.common");
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data, isLoading, error } = useAdminEmojis({ limit, offset });
  const deleteMutation = useAdminDeleteEmoji();
  const [deletingEmoji, setDeletingEmoji] = useState<AdminEmoji | null>(null);

  const emojis = data?.emojis ?? [];
  const total = data?.total ?? 0;

  const handleDelete = async () => {
    if (!deletingEmoji) return;

    const shouldGoBack = emojis.length === 1 && offset > 0;

    try {
      await deleteMutation.mutateAsync(deletingEmoji.id);
      if (shouldGoBack) {
        setOffset((current) => Math.max(0, current - limit));
      }
      toast.success(t("messages.deleteSuccess"));
      setDeletingEmoji(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("messages.deleteError"),
      );
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Button onClick={() => router.push("/admin/emojis/new")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("actions.add")}
        </Button>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-destructive">
            {tCommon("error")}
          </div>
        ) : emojis.length === 0 ? (
          <EmptyState
            icon={SmilePlus}
            title={tEmpty("title")}
            description={tEmpty("description")}
            action={{
              label: t("actions.add"),
              onClick: () => router.push("/admin/emojis/new"),
            }}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.preview")}</TableHead>
                  <TableHead>{t("table.shortcode")}</TableHead>
                  <TableHead>{t("table.name")}</TableHead>
                  <TableHead>{t("table.category")}</TableHead>
                  <TableHead>{t("table.dimensions")}</TableHead>
                  <TableHead>{t("table.updatedAt")}</TableHead>
                  <TableHead className="text-right">
                    {t("table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emojis.map((emoji) => (
                  <TableRow key={emoji.id}>
                    <TableCell>
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                        <Image
                          src={emoji.imageUrl}
                          alt={emoji.name || emoji.shortcode}
                          width={48}
                          height={48}
                          unoptimized
                          className="h-10 w-10 object-contain"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      :{emoji.shortcode}:
                    </TableCell>
                    <TableCell>{emoji.name || "-"}</TableCell>
                    <TableCell>{emoji.category || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {emoji.width} × {emoji.height}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(emoji.updatedAt), "yyyy-MM-dd HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/emojis/${emoji.id}/edit`)
                          }
                        >
                          <Pencil className="mr-1 h-3 w-3" />
                          {t("actions.edit")}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingEmoji(emoji)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          {t("actions.delete")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {total > limit ? (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {offset + 1} - {Math.min(offset + limit, total)} / {total}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={offset === 0}
                    onClick={() => setOffset((current) => Math.max(0, current - limit))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={offset + limit >= total}
                    onClick={() => setOffset((current) => current + limit)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </Card>

      <Dialog
        open={deletingEmoji !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingEmoji(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirm.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("confirm.deleteDescription", {
                shortcode: deletingEmoji?.shortcode ?? "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingEmoji(null)}
              disabled={deleteMutation.isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? tCommon("loading") : t("actions.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
