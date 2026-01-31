"use client";

import { useTranslations } from "next-intl";
import { AgreementDocument } from "./AgreementDocument";
import { Checkbox } from "@/components/ui/checkbox";

interface AgreementStepProps {
  type: "terms" | "privacy";
  content: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function AgreementStep({
  type,
  content,
  checked,
  onCheckedChange,
}: AgreementStepProps) {
  const t = useTranslations(`signup.wizard.${type}`);

  return (
    <div className="flex flex-col h-full min-h-0 space-y-6">
      <div className="flex-none space-y-0">
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <div className="flex-1 min-h-0">
        <AgreementDocument content={content} title={t("title")} />
      </div>

      <div className="flex-none flex items-center space-x-3">
        <Checkbox
          id={`${type}-checkbox`}
          checked={checked}
          onCheckedChange={onCheckedChange}
        />
        <label
          htmlFor={`${type}-checkbox`}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          {t("checkbox")}
        </label>
      </div>
    </div>
  );
}
