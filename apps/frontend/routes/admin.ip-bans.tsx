import { createFileRoute } from "@tanstack/react-router";
import { useTranslations } from "@/lib/i18n";
import { Ban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const Route = createFileRoute("/admin/ip-bans")({
  component: IPBansPage,
});

function IPBansPage() {
  const t = useTranslations("admin.ipBans");
  const tEmpty = useTranslations("admin.empty.ipBans");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
      </div>

      <Card className="p-6">
        <EmptyState icon={Ban} title={tEmpty("title")} description={tEmpty("description")} />
      </Card>
    </div>
  );
}
