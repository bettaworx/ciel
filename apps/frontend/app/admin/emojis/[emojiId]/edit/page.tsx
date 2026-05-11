"use client";

import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { EmojiForm } from "@/components/admin/emojis/EmojiForm";
import { Spinner } from "@/components/ui/spinner";
import { buildAdminEmojiUpdateFormData } from "@/lib/admin-emojis";
import { useAdminEmojis, useAdminUpdateEmoji } from "@/lib/hooks/use-queries";

export default function EditEmojiPage() {
  const t = useTranslations("admin.emojis");
  const tCommon = useTranslations("admin.common");
  const params = useParams<{ emojiId: string }>();
  const router = useRouter();
  const emojiId = params.emojiId;

  const { data, isLoading, error } = useAdminEmojis({ limit: 1000, offset: 0 });
  const emoji = data?.emojis.find((item) => item.id === emojiId) ?? null;
  const updateMutation = useAdminUpdateEmoji(emojiId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="sm" className="text-muted-foreground" />
      </div>
    );
  }

  if (error || !emoji) {
    return (
      <div className="py-12 text-center text-sm text-destructive">
        {tCommon("error")}
      </div>
    );
  }

  return (
    <EmojiForm
      mode="edit"
      emoji={emoji}
      isPending={updateMutation.isPending}
      onSubmit={async (values) => {
        try {
          await updateMutation.mutateAsync(buildAdminEmojiUpdateFormData(values));
          toast.success(t("messages.updateSuccess"));
          router.push("/admin/emojis");
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : t("messages.updateError"),
          );
        }
      }}
    />
  );
}
