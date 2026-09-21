"use client";

import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { userAtom } from "@/atoms/auth";
import { useApi } from "@/lib/api/use-api";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { DisplayName } from "@/components/users/DisplayName";
import { isWriteScope, scopeLabelKey, sortScopes } from "@/lib/oauth/scopes";
import type { components } from "@/lib/api/api";

export interface ConsentParams {
  client_id: string;
  redirect_uri: string;
  scope: string;
  response_type: string;
  code_challenge: string;
  code_challenge_method: string;
  state?: string;
}

type Info = components["schemas"]["OAuthAuthorizationInfo"];

/**
 * The OAuth2 consent screen.
 *
 * This has to stay a client-rendered route, and it is worth knowing why before
 * anyone "optimises" it into a server-rendered page or a redirect. The session
 * cookie is SameSite=Strict, so it is NOT sent on the third-party app's
 * top-level navigation to this URL. A server-rendered page would therefore see
 * an anonymous visitor and bounce a perfectly signed-in user to the login
 * screen on every single authorization. What makes it work is that the shell
 * loads first and the calls below are same-site fetches, which do carry the
 * cookie.
 */
export function ConsentScreen({ params }: { params: ConsentParams }) {
  const t = useTranslations();
  const api = useApi();
  const router = useRouter();
  const user = useAtomValue(userAtom);

  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await api.oauthAuthorizeInfo({
        client_id: params.client_id,
        redirect_uri: params.redirect_uri,
        scope: params.scope,
        response_type: params.response_type,
        code_challenge: params.code_challenge,
        code_challenge_method: params.code_challenge_method,
        ...(params.state ? { state: params.state } : {}),
      });
      if (cancelled) return;
      if (!result.ok) {
        setError(result.errorText);
        return;
      }
      setInfo(result.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [api, params]);

  const decide = async (approve: boolean) => {
    setSubmitting(true);
    const result = await api.oauthAuthorize({
      clientId: params.client_id,
      redirectUri: params.redirect_uri,
      scope: params.scope,
      responseType: "code",
      codeChallenge: params.code_challenge,
      codeChallengeMethod: "S256",
      ...(params.state ? { state: params.state } : {}),
      approve,
    });
    if (!result.ok) {
      setSubmitting(false);
      setError(result.errorText);
      return;
    }
    // Leaving Ciel entirely, so a full navigation rather than a router push.
    // replace(), not assign(): the consent URL carries a code request and must
    // not come back on the Back button.
    window.location.replace(result.data.redirectUri);
  };

  if (!user) {
    return (
      <Centered>
        <p className="text-sm text-muted-foreground">{t("oauth.authorize.loginRequired")}</p>
        <Button onClick={() => router.push("/login")}>{t("oauth.authorize.loginRequired")}</Button>
      </Centered>
    );
  }

  if (error) {
    return (
      <Centered>
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <h1 className="text-lg font-semibold">{t("oauth.authorize.invalid")}</h1>
        <p className="text-sm text-muted-foreground">{t("oauth.authorize.invalidHelp")}</p>
      </Centered>
    );
  }

  if (!info) {
    return <Centered>{null}</Centered>;
  }

  const scopes = sortScopes(info.scopes);

  return (
    <Centered>
      <div className="w-full space-y-6 rounded-2xl bg-card p-6">
        <header className="space-y-1">
          <h1 className="text-lg font-semibold">{t("oauth.authorize.title")}</h1>
          <p className="text-sm">{t("oauth.authorize.intro", { app: info.clientName })}</p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>{t("oauth.authorize.by", { owner: info.ownerUsername })}</span>
            {/* The owner's bot badge belongs here for the same reason it does
                anywhere else: it is a property of the account being named. */}
            <DisplayName name={`@${info.ownerUsername}`} isBot={info.ownerIsBot} />
          </p>
          {/* Where the app claims to live. Shown because a lookalike app is the
              main thing a consent screen has to help a reader notice. */}
          {info.website && <p className="truncate text-sm text-muted-foreground">{info.website}</p>}
        </header>

        <section className="space-y-2">
          <h2 className="text-sm font-medium">{t("oauth.authorize.permissions")}</h2>
          <ul className="space-y-1.5">
            {scopes.map((scope) => (
              <li key={scope} className="flex items-start gap-2 text-sm">
                {/* Writes are marked rather than merely listed: "reads your
                    posts" and "posts as you" are not the same decision, and the
                    scope strings do not make that obvious at a glance. */}
                {isWriteScope(scope) ? (
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                    aria-label={t("oauth.authorize.writeWarning")}
                  />
                ) : (
                  <span className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                )}
                <span className={isWriteScope(scope) ? "font-medium" : undefined}>
                  {t(scopeLabelKey(scope))}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex gap-2">
          {/* Deny is not a dead end: the app is told, or it waits for a
              callback that never arrives. */}
          <Button
            variant="outline"
            className="flex-1"
            disabled={submitting}
            onClick={() => decide(false)}
          >
            {t("oauth.authorize.deny")}
          </Button>
          <Button className="flex-1" disabled={submitting} onClick={() => decide(true)}>
            {t("oauth.authorize.approve")}
          </Button>
        </div>
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 p-4">
      {children}
    </main>
  );
}
