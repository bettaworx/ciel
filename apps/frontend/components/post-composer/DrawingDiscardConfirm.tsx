"use client";

import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useTranslations } from "@/lib/i18n";

interface DrawingDiscardConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  reason?: "mode" | "close";
}

export function DrawingDiscardConfirm({
  open,
  onOpenChange,
  onConfirm,
  reason = "mode",
}: DrawingDiscardConfirmProps) {
  const t = useTranslations("createPost.drawing.discard");
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      description={t(reason === "close" ? "closeDescription" : "description")}
      className="z-[80]"
      overlayClassName="z-[79]"
      footer={
        <>
          <Button variant="default" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {t("confirm")}
          </Button>
        </>
      }
    />
  );
}
