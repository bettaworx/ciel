import { createFileRoute } from "@tanstack/react-router";
import { AgreementWizard } from "@/components/auth/agreement/AgreementWizard";

export const Route = createFileRoute("/agreements")({
  component: AgreementsPage,
});

/**
 * Agreements page - Shown to users who need to accept updated agreements
 */
function AgreementsPage() {
  return <AgreementWizard />;
}
