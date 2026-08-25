import { LoginWizard } from "@/components/auth/login/LoginWizard";
import { DynamicTitle } from "@/components/DynamicTitle";

interface LoginPageProps {
  searchParams: Promise<{ username?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const initialUsername = params.username ?? "";

  return (
    <>
      <DynamicTitle titleKey="meta.pages.login" />
      <LoginWizard initialUsername={initialUsername} />
    </>
  );
}
