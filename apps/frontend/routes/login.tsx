import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { LoginWizard } from "@/components/auth/login/LoginWizard";
import { DynamicTitle } from "@/components/DynamicTitle";

const searchSchema = z.object({
  username: z.string().optional(),
  /** Where to return to after a successful login. */
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  component: LoginPage,
});

function LoginPage() {
  const { username } = Route.useSearch();

  return (
    <>
      <DynamicTitle titleKey="meta.pages.login" />
      <LoginWizard initialUsername={username ?? ""} />
    </>
  );
}
