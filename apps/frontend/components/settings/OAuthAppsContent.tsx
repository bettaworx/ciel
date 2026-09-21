"use client";

import { useCallback, useState } from "react";
import { useAtom } from "jotai";
import { toast } from "sonner";
import { Copy, KeyRound, Plus, Trash2, Unplug } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { stepupTokenAtom, usableStepupToken } from "@/atoms/stepup";
import { useStepup } from "@/lib/hooks/use-stepup";
import { StepupPrompt } from "@/components/settings/StepupPrompt";
import { PageHeader } from "@/components/shared/PageHeader";
import { SettingsRowGroup } from "@/components/settings/SettingsRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SCOPE_ORDER, isWriteScope, scopeLabelKey, sortScopes } from "@/lib/oauth/scopes";
import type { OAuthScope } from "@/lib/oauth/scopes";
import {
  useCreateOAuthClient,
  useDeleteOAuthClient,
  useOAuthAuthorizations,
  useOAuthClients,
  useRevokeOAuthAuthorization,
  useRotateOAuthClientSecret,
} from "@/lib/hooks/use-queries";

/**
 * Settings → Account → OAuth2 apps.
 *
 * Two lists that look similar and mean opposite things, so they are kept
 * visually apart: the apps this account has *registered* (a developer action),
 * and the apps this account has *connected to* (something the user did to
 * somebody else's app). Revoking in the second list does not delete anything in
 * the first.
 */
export function OAuthAppsContent() {
  const t = useTranslations();

  return (
    <>
      <PageHeader backHref="/settings/account">{t("settings.account.apps.title")}</PageHeader>
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">{t("settings.account.apps.description")}</p>
        <RegisteredApps />
        <ConnectedApps />
      </div>
    </>
  );
}

function RegisteredApps() {
  const t = useTranslations();
  const { data: clients, isLoading } = useOAuthClients();
  const [creating, setCreating] = useState(false);
  // Held outside the list so it survives the refetch that follows creation.
  const [freshSecret, setFreshSecret] = useState<{ clientId: string; secret: string } | null>(null);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("settings.account.apps.yourApps")}
        </h2>
        <Button size="sm" variant="outline" onClick={() => setCreating((v) => !v)}>
          <Plus className="h-4 w-4" />
          {t("settings.account.apps.create")}
        </Button>
      </div>

      {creating && (
        <CreateAppForm
          onCreated={(clientId, secret) => {
            setCreating(false);
            if (secret) setFreshSecret({ clientId, secret });
          }}
        />
      )}

      {!isLoading && clients?.length === 0 && (
        <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">
          {t("settings.account.apps.noApps")}
        </p>
      )}

      <div className="space-y-2">
        {clients?.map((client) => (
          <AppCard
            key={client.id}
            client={client}
            freshSecret={freshSecret?.clientId === client.clientId ? freshSecret.secret : null}
            onSecret={(secret) => setFreshSecret({ clientId: client.clientId, secret })}
          />
        ))}
      </div>
    </section>
  );
}

type ClientSummary = NonNullable<ReturnType<typeof useOAuthClients>["data"]>[number];

function AppCard({
  client,
  freshSecret,
  onSecret,
}: {
  client: ClientSummary;
  freshSecret: string | null;
  onSecret: (secret: string) => void;
}) {
  const t = useTranslations();
  const deleteClient = useDeleteOAuthClient();
  const rotate = useRotateOAuthClientSecret();
  const [shared, setShared] = useAtom(stepupTokenAtom);
  const [promptOpen, setPromptOpen] = useState(false);

  const runRotate = useCallback(
    (token: string) => {
      rotate.mutate(
        { clientUuid: client.id, stepupToken: token },
        {
          onSuccess: (data) => {
            // Single-use on the server, so drop it rather than leave a dead
            // token for the next screen to pick up.
            setShared(null);
            if (data.clientSecret) onSecret(data.clientSecret);
            toast.success(t("settings.account.apps.rotated"));
          },
          onError: () => toast.error(t("settings.account.apps.error")),
        },
      );
    },
    [rotate, client.id, setShared, onSecret, t],
  );

  const stepup = useStepup({
    onToken: (token) => {
      setPromptOpen(false);
      runRotate(token);
    },
  });

  const handleRotate = () => {
    const held = usableStepupToken(shared);
    if (held) {
      runRotate(held);
      return;
    }
    stepup.invalidate();
    setPromptOpen(true);
  };

  const handleDelete = () => {
    if (!window.confirm(t("settings.account.apps.deleteConfirm"))) return;
    deleteClient.mutate(client.id, {
      onSuccess: () => toast.success(t("settings.account.apps.deleted")),
      onError: () => toast.error(t("settings.account.apps.error")),
    });
  };

  return (
    <div className="space-y-3 rounded-2xl bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{client.name}</p>
          {client.website && (
            <p className="truncate text-sm text-muted-foreground">{client.website}</p>
          )}
        </div>
        {!client.isConfidential && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {t("settings.account.apps.public")}
          </span>
        )}
      </div>

      <CopyField label={t("settings.account.apps.clientId")} value={client.clientId} />

      {freshSecret && (
        <div className="space-y-1">
          <CopyField label={t("settings.account.apps.clientSecret")} value={freshSecret} />
          <p className="text-xs text-destructive">{t("settings.account.apps.secretOnce")}</p>
        </div>
      )}

      <ScopeList scopes={client.scopes} />

      <div>
        <p className="text-xs text-muted-foreground">{t("settings.account.apps.redirectUris")}</p>
        <ul className="mt-1 space-y-0.5">
          {client.redirectUris.map((uri) => (
            <li key={uri} className="truncate font-mono text-xs">
              {uri}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        {client.isConfidential && (
          <Button size="sm" variant="outline" onClick={handleRotate} disabled={rotate.isPending}>
            <KeyRound className="h-4 w-4" />
            {t("settings.account.apps.rotateSecret")}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="text-destructive"
          onClick={handleDelete}
          disabled={deleteClient.isPending}
        >
          <Trash2 className="h-4 w-4" />
          {t("settings.account.apps.delete")}
        </Button>
      </div>

      <StepupPrompt
        open={promptOpen}
        heading={t("settings.account.apps.rotateSecret")}
        stepup={stepup}
        onDismiss={() => setPromptOpen(false)}
      />
    </div>
  );
}

function CreateAppForm({
  onCreated,
}: {
  onCreated: (clientId: string, secret: string | undefined) => void;
}) {
  const t = useTranslations();
  const create = useCreateOAuthClient();

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [redirectUris, setRedirectUris] = useState("");
  const [confidential, setConfidential] = useState(true);
  const [scopes, setScopes] = useState<OAuthScope[]>(["read:posts"]);

  const toggleScope = (scope: OAuthScope) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  const submit = () => {
    const uris = redirectUris
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    create.mutate(
      {
        name: name.trim(),
        website: website.trim() || undefined,
        redirectUris: uris,
        scopes,
        confidential,
      },
      {
        onSuccess: (data) => {
          setName("");
          setWebsite("");
          setRedirectUris("");
          onCreated(data.client.clientId, data.clientSecret);
        },
        // The server is the authority on what is a valid redirect URI, so its
        // rejection is surfaced rather than re-implemented here.
        onError: () => toast.error(t("settings.account.apps.createError")),
      },
    );
  };

  const canSubmit = name.trim() !== "" && redirectUris.trim() !== "" && scopes.length > 0;

  return (
    <div className="space-y-4 rounded-2xl bg-card p-4">
      <div className="space-y-1.5">
        <Label htmlFor="oauth-name">{t("settings.account.apps.name")}</Label>
        <Input
          id="oauth-name"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="oauth-website">{t("settings.account.apps.website")}</Label>
        <Input
          id="oauth-website"
          value={website}
          maxLength={300}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="oauth-redirects">{t("settings.account.apps.redirectUris")}</Label>
        <Textarea
          id="oauth-redirects"
          value={redirectUris}
          rows={3}
          className="font-mono text-xs"
          onChange={(e) => setRedirectUris(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {t("settings.account.apps.redirectUrisHelp")}
        </p>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">{t("settings.account.apps.scopes")}</legend>
        {SCOPE_ORDER.map((scope) => (
          <label key={scope} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={scopes.includes(scope)}
              onChange={() => toggleScope(scope)}
            />
            <span className={isWriteScope(scope) ? "font-medium" : undefined}>
              {t(scopeLabelKey(scope))}
            </span>
          </label>
        ))}
      </fieldset>

      <label
        htmlFor="oauth-confidential"
        className="flex cursor-pointer items-start justify-between gap-3"
      >
        <span>
          <span className="text-sm font-medium">{t("settings.account.apps.confidential")}</span>
          <span className="block text-xs text-muted-foreground">
            {t("settings.account.apps.confidentialHelp")}
          </span>
        </span>
        <Switch id="oauth-confidential" checked={confidential} onCheckedChange={setConfidential} />
      </label>

      <Button onClick={submit} disabled={!canSubmit || create.isPending} className="w-full">
        {create.isPending ? t("settings.account.apps.creating") : t("settings.account.apps.create")}
      </Button>
    </div>
  );
}

function ConnectedApps() {
  const t = useTranslations();
  const { data: authorizations, isLoading } = useOAuthAuthorizations();
  const revoke = useRevokeOAuthAuthorization();

  if (!isLoading && authorizations?.length === 0) {
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("settings.account.apps.connected")}
        </h2>
        <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">
          {t("settings.account.apps.noConnected")}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">
        {t("settings.account.apps.connected")}
      </h2>
      <SettingsRowGroup>
        {authorizations?.map((auth) => (
          <div key={auth.clientId} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{auth.clientName}</p>
                <p className="text-xs text-muted-foreground">
                  {t("settings.account.apps.authorizedAt")}:{" "}
                  {new Date(auth.authorizedAt).toLocaleString()}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 text-destructive"
                disabled={revoke.isPending}
                onClick={() =>
                  revoke.mutate(auth.clientId, {
                    onSuccess: () => toast.success(t("settings.account.apps.disconnected")),
                    onError: () => toast.error(t("settings.account.apps.error")),
                  })
                }
              >
                <Unplug className="h-4 w-4" />
                {t("settings.account.apps.disconnect")}
              </Button>
            </div>
            <ScopeList scopes={auth.scopes} />
          </div>
        ))}
      </SettingsRowGroup>
    </section>
  );
}

function ScopeList({ scopes }: { scopes: readonly string[] }) {
  const t = useTranslations();
  return (
    <ul className="space-y-0.5">
      {sortScopes(scopes).map((scope) => (
        <li key={scope} className="text-sm">
          <span className={isWriteScope(scope) ? "font-medium" : "text-muted-foreground"}>
            {t(scopeLabelKey(scope))}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * A read-only value with a copy button. Client IDs and secrets are long random
 * strings that nobody should be retyping.
 */
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be refused; the value is on screen and selectable
      // either way, so there is nothing to recover from.
    }
  };

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-muted px-2 py-1 font-mono text-xs">
          {value}
        </code>
        <Button size="icon" variant="ghost" onClick={copy} aria-label={label}>
          <Copy className={copied ? "h-4 w-4 text-primary" : "h-4 w-4"} />
        </Button>
      </div>
    </div>
  );
}
