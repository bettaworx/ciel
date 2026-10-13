import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { LoginWizard } from "@/components/auth/login/LoginWizard";
import { DynamicTitle } from "@/components/DynamicTitle";
import { asText, textSearchParam } from "@/lib/search-params";

const searchSchema = z.object({
  username: textSearchParam,
  /** Where to return to after a successful login. */
  redirect: textSearchParam,
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
      <LoginWizard initialUsername={asText(username) ?? ""} />
    </>
  );
}
