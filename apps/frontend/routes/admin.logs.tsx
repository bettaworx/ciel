import { createFileRoute } from "@tanstack/react-router";
import { useTranslations } from "@/lib/i18n";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/admin/logs")({
  component: LogsPage,
});

function LogsPage() {
  const t = useTranslations("admin.nav");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("logs")}</h1>
      </div>

      <Card className="p-6">
        <div className="text-center py-12 text-muted-foreground">Coming soon...</div>
      </Card>
    </div>
  );
}
