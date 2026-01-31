"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

interface CompleteStepProps {
  adminUsername: string;
  serverName: string;
  inviteOnly: boolean;
}

export function CompleteStep({
  adminUsername,
  serverName,
  inviteOnly,
}: CompleteStepProps) {
  const t = useTranslations("adminSetup");
  const router = useRouter();

  const handleGoToHome = () => {
    localStorage.removeItem("ciel_admin_setup_current_step");
    router.push("/");
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-c-1" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{t("complete.title")}</h2>
            <p className="text-muted-foreground">{t("complete.description")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
