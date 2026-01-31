"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";
import { SettingItem } from "@/components/settings/SettingItem";
import { createApiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface InviteSettingsStepProps {
  onComplete: (inviteOnly: boolean, inviteCode: string) => Promise<boolean>;
  initialInviteOnly: boolean;
  initialInviteCode: string;
}

type UsageLimit = "unlimited" | "limited";
type Expiration = "never" | "7d" | "30d" | "custom";

/**
 * Helper function to calculate expiration date based on option
 */
function calculateExpiresAt(
  expiration: Expiration,
  customDate?: string,
): string | null {
  if (expiration === "never") return null;

  if (expiration === "custom" && customDate) {
    return new Date(customDate).toISOString();
  }

  const now = new Date();
  if (expiration === "7d") {
    now.setDate(now.getDate() + 7);
  } else if (expiration === "30d") {
    now.setDate(now.getDate() + 30);
  }
  return now.toISOString();
}

export function InviteSettingsStep({
  onComplete,
  initialInviteOnly,
  initialInviteCode,
}: InviteSettingsStepProps) {
  const t = useTranslations("adminSetup");
  const [inviteOnly, setInviteOnly] = useState(initialInviteOnly);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Invite code creation state
  const [createdCode, setCreatedCode] = useState<string | null>(
    initialInviteCode || null,
  );
  const [copied, setCopied] = useState(false);

  // Form state
  const [usageLimit, setUsageLimit] = useState<UsageLimit>("unlimited");
  const [maxUses, setMaxUses] = useState<string>("10");
  const [expiration, setExpiration] = useState<Expiration>("never");
  const [customDate, setCustomDate] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const handleCreateInvite = async () => {
    setCreating(true);
    try {
      const apiClient = createApiClient();

      const requestBody = {
        maxUses: usageLimit === "limited" ? parseInt(maxUses, 10) : null,
        expiresAt: calculateExpiresAt(expiration, customDate),
        note: note.trim() || null,
      };

      // Cookie-based auth - no need to pass token
      const response = await apiClient.setupCreateInvite(requestBody);

      if (!response.ok) {
        toast.error(t("inviteSettings.createError"));
        return;
      }

      setCreatedCode(response.data.code);
      toast.success(t("inviteSettings.codeCreated"));
    } catch (error) {
      console.error("Failed to create invite:", error);
      toast.error(t("inviteSettings.createError"));
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!createdCode) return;

    try {
      await navigator.clipboard.writeText(createdCode);
      setCopied(true);
      toast.success(t("inviteSettings.codeCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error(t("inviteSettings.copyError"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If invite-only is enabled, require a created invite code
    if (inviteOnly && !createdCode) {
      toast.error(t("inviteSettings.inviteOnlyNote"));
      return;
    }

    setLoading(true);
    try {
      await onComplete(inviteOnly, createdCode || "");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <form
        id="admin-setup-invite-settings-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto px-4"
      >
        <div className="w-full max-w-2xl mx-auto space-y-6 py-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{t("inviteSettings.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("inviteSettings.description")}
            </p>
          </div>

          <div className="space-y-6">
            {/* Invite Only Toggle */}
            <SettingItem
              title={t("inviteSettings.inviteOnlyLabel")}
              description={t("inviteSettings.inviteOnlyDescription")}
              align="center"
            >
              <Switch
                id="invite-only"
                checked={inviteOnly}
                onCheckedChange={setInviteOnly}
              />
            </SettingItem>

            {/* Invite Code Creation (shown when invite-only is enabled) */}
            {inviteOnly && (
              <div className="space-y-6 border rounded-lg p-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {t("inviteSettings.createInviteTitle")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("inviteSettings.createInviteDescription")}
                  </p>
                </div>

                {!createdCode ? (
                  <div className="space-y-6">
                    {/* Usage Limit */}
                    <div className="flex flex-col gap-6">
                      <Label className="text-base font-medium">
                        {t("inviteSettings.usageLimitLabel")}
                      </Label>
                      <RadioGroup
                        value={usageLimit}
                        onValueChange={(v) => setUsageLimit(v as UsageLimit)}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="unlimited" id="unlimited" />
                          <Label
                            htmlFor="unlimited"
                            className="font-normal cursor-pointer"
                          >
                            {t("inviteSettings.usageLimitUnlimited")}
                          </Label>
                        </div>
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem
                            value="limited"
                            id="limited"
                            className="mt-2"
                          />
                          <div className="flex-1 space-y-2">
                            <Label
                              htmlFor="limited"
                              className="font-normal cursor-pointer"
                            >
                              {t("inviteSettings.usageLimitLimited")}
                            </Label>
                            {usageLimit === "limited" && (
                              <div className="space-y-1">
                                <Label
                                  htmlFor="max-uses"
                                  className="text-sm text-muted-foreground"
                                >
                                  {t("inviteSettings.maxUsesLabel")}
                                </Label>
                                <Input
                                  id="max-uses"
                                  type="number"
                                  min="1"
                                  value={maxUses}
                                  onChange={(e) => setMaxUses(e.target.value)}
                                  placeholder={t(
                                    "inviteSettings.maxUsesPlaceholder",
                                  )}
                                  className="w-32"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Expiration */}
                    <div className="flex flex-col gap-6">
                      <Label className="text-base font-medium">
                        {t("inviteSettings.expirationLabel")}
                      </Label>
                      <RadioGroup
                        value={expiration}
                        onValueChange={(v) => setExpiration(v as Expiration)}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="never" id="never" />
                          <Label
                            htmlFor="never"
                            className="font-normal cursor-pointer"
                          >
                            {t("inviteSettings.expirationNever")}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="7d" id="7d" />
                          <Label
                            htmlFor="7d"
                            className="font-normal cursor-pointer"
                          >
                            {t("inviteSettings.expiration7Days")}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="30d" id="30d" />
                          <Label
                            htmlFor="30d"
                            className="font-normal cursor-pointer"
                          >
                            {t("inviteSettings.expiration30Days")}
                          </Label>
                        </div>
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem
                            value="custom"
                            id="custom"
                            className="mt-2"
                          />
                          <div className="flex-1 space-y-2">
                            <Label
                              htmlFor="custom"
                              className="font-normal cursor-pointer"
                            >
                              {t("inviteSettings.expirationCustom")}
                            </Label>
                            {expiration === "custom" && (
                              <div className="space-y-1">
                                <Label
                                  htmlFor="custom-date"
                                  className="text-sm text-muted-foreground"
                                >
                                  {t("inviteSettings.customDateLabel")}
                                </Label>
                                <Input
                                  id="custom-date"
                                  type="datetime-local"
                                  value={customDate}
                                  onChange={(e) =>
                                    setCustomDate(e.target.value)
                                  }
                                  min={new Date().toISOString().slice(0, 16)}
                                  className="w-full"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Note */}
                    <div className="flex flex-col gap-6">
                      <Label htmlFor="note" className="text-base font-medium">
                        {t("inviteSettings.noteLabel")}
                      </Label>
                      <Textarea
                        id="note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t("inviteSettings.notePlaceholder")}
                        rows={3}
                      />
                    </div>

                    {/* Create Button */}
                    <Button
                      type="button"
                      onClick={handleCreateInvite}
                      disabled={creating}
                      className="w-full"
                    >
                      {creating
                        ? t("inviteSettings.creating")
                        : t("inviteSettings.createButton")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Display created code */}
                    <div className="space-y-2">
                      <Label className="text-base font-medium">
                        {t("inviteSettings.inviteCodeLabel")}
                      </Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-4 py-3 bg-muted rounded-lg font-mono text-lg font-bold tracking-wider">
                          {createdCode}
                        </code>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleCopyCode}
                          title={t("inviteSettings.copyCode")}
                        >
                          {copied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {t("inviteSettings.inviteCodeDescription")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
