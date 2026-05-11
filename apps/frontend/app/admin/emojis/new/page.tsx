"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EmojiForm } from "@/components/admin/emojis/EmojiForm";
import { buildAdminEmojiCreateFormData } from "@/lib/admin-emojis";
import { useAdminCreateEmoji } from "@/lib/hooks/use-queries";

export default function NewEmojiPage() {
  const t = useTranslations("admin.emojis");
  const router = useRouter();
  const createMutation = useAdminCreateEmoji();

  return (
    <EmojiForm
      mode="create"
      isPending={createMutation.isPending}
      onSubmit={async (values) => {
        try {
          await createMutation.mutateAsync(buildAdminEmojiCreateFormData(values));
          toast.success(t("messages.createSuccess"));
          router.push("/admin/emojis");
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : t("messages.createError"),
          );
        }
      }}
    />
  );
}
