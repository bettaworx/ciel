import { createFileRoute } from "@tanstack/react-router";
import { SignupWizard } from "@/components/auth/signup/SignupWizard";
import { DynamicTitle } from "@/components/DynamicTitle";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.signup" />
      <SignupWizard />
    </>
  );
}
