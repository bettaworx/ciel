import { LoginWizard } from "@/components/auth/login/LoginWizard";
import { DynamicTitle } from "@/components/DynamicTitle";

export default function LoginPage() {
  return (
    <>
      <DynamicTitle titleKey="meta.pages.login" />
      <LoginWizard />
    </>
  );
}
