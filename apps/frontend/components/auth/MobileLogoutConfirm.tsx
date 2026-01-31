"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface MobileLogoutConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function MobileLogoutConfirm({
  open,
  onOpenChange,
  onConfirm,
}: MobileLogoutConfirmProps) {
  const t = useTranslations();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <DrawerTitle>{t("logoutConfirm.title")}</DrawerTitle>
          <DrawerDescription>
            {t("logoutConfirm.description")}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerFooter className="pt-2">
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="w-full"
          >
            {t("logoutConfirm.confirm")}
          </Button>

          <DrawerClose asChild>
            <Button variant="default" className="w-full">
              {t("logoutConfirm.cancel")}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
