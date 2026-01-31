import { SignupWizard } from "@/components/auth/signup/SignupWizard";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function SignupPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.signup" />
      <SignupWizard />
    </>
  );
}
