import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DynamicTitle } from "@/components/DynamicTitle";
import { ConsentScreen } from "@/components/oauth/ConsentScreen";

/**
 * The parameters an OAuth2 client puts in the authorization URL (RFC 6749
 * §4.1.1, RFC 7636 §4.3).
 *
 * Validated here only enough to hand a well-shaped object to the screen. The
 * server re-validates every one of them and is the authority on whether the
 * client, the redirect URI and the scopes are acceptable — this schema exists
 * so a missing parameter fails as a readable error rather than as an undefined
 * in a fetch.
 */
const searchSchema = z.object({
  client_id: z.string(),
  redirect_uri: z.string(),
  scope: z.string(),
  response_type: z.string(),
  code_challenge: z.string(),
  code_challenge_method: z.string(),
  state: z.string().optional(),
});

export const Route = createFileRoute("/oauth/authorize")({
  validateSearch: searchSchema,
  component: OAuthAuthorizePage,
});

function OAuthAuthorizePage() {
  const params = Route.useSearch();

  return (
    <>
      <DynamicTitle titleKey="meta.pages.oauthAuthorize" />
      <ConsentScreen params={params} />
    </>
  );
}
