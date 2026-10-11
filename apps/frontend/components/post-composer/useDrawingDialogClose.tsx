"use client";

import { useState } from "react";
import type { UseComposePostReturn } from "@/components/post-composer/useComposePost";
import { DrawingDiscardConfirm } from "@/components/post-composer/DrawingDiscardConfirm";

export function useDrawingDialogClose(compose: UseComposePostReturn, onClose: () => void) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const requestClose = () => {
    if (compose.createPostMutation.isPending || compose.isUploading) return;
    if (compose.composerMode === "drawing") {
      setConfirmOpen(true);
      return;
    }
    onClose();
  };

  const confirmation = (
    <DrawingDiscardConfirm
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      reason="close"
      onConfirm={() => {
        compose.setDrawingStrokes([]);
        compose.setRedoStrokes([]);
        compose.setComposerMode("text");
        onClose();
      }}
    />
  );

  return { requestClose, confirmation };
}
