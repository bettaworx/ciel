"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAdminCreateInviteCode } from "@/lib/hooks/use-queries";
import { generateInviteCode } from "@/lib/utils/invite-code";

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

export default function NewInvitePage() {
  const t = useTranslations("admin.invites");
  const router = useRouter();
  const createInviteMutation = useAdminCreateInviteCode();

  // Created code state
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [customCode, setCustomCode] = useState<string>("");
  const [usageLimit, setUsageLimit] = useState<UsageLimit>("unlimited");
  const [maxUses, setMaxUses] = useState<string>("10");
  const [expiration, setExpiration] = useState<Expiration>("never");
  const [customDate, setCustomDate] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const handleCreateInvite = async () => {
    try {
      // Generate code if custom code is empty
      const code = customCode.trim() || generateInviteCode();

      const requestBody = {
        code,
        maxUses: usageLimit === "limited" ? parseInt(maxUses, 10) : null,
        expiresAt: calculateExpiresAt(expiration, customDate),
        note: note.trim() || null,
      };

      const result = await createInviteMutation.mutateAsync(requestBody);
      setCreatedCode(result.code);
      toast.success(t("messages.created"));
    } catch (error) {
      console.error("Failed to create invite:", error);
      toast.error(t("messages.createFailed"));
    }
  };

  const handleCopyCode = async () => {
    if (!createdCode) return;

    try {
      await navigator.clipboard.writeText(createdCode);
      setCopied(true);
      toast.success(t("messages.copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error(t("messages.copyFailed"));
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto px-4">
        <div className="w-full max-w-2xl mx-auto space-y-6 py-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/admin/invite")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold">{t("createTitle")}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("createDescription")}
            </p>
          </div>

          {!createdCode ? (
            <div className="space-y-6 border rounded-lg p-6">
              {/* Custom Code */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="custom-code" className="text-base font-medium">
                  {t("form.customCode")}
                </Label>
                <Input
                  id="custom-code"
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder={t("form.customCodePlaceholder")}
                  maxLength={32}
                />
                <p className="text-sm text-muted-foreground">
                  {t("form.customCodeHint")}
                </p>
              </div>

              {/* Usage Limit */}
              <div className="flex flex-col gap-4">
                <Label className="text-base font-medium">
                  {t("form.usageLimit")}
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
                      {t("form.unlimited")}
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
                        {t("form.limited")}
                      </Label>
                      {usageLimit === "limited" && (
                        <div className="space-y-1">
                          <Label
                            htmlFor="max-uses"
                            className="text-sm text-muted-foreground"
                          >
                            {t("form.maxUses")}
                          </Label>
                          <Input
                            id="max-uses"
                            type="number"
                            min="1"
                            value={maxUses}
                            onChange={(e) => setMaxUses(e.target.value)}
                            placeholder="10"
                            className="w-32"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Expiration */}
              <div className="flex flex-col gap-4">
                <Label className="text-base font-medium">
                  {t("form.expiration")}
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
                      {t("form.never")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="7d" id="7d" />
                    <Label htmlFor="7d" className="font-normal cursor-pointer">
                      {t("form.7days")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="30d" id="30d" />
                    <Label htmlFor="30d" className="font-normal cursor-pointer">
                      {t("form.30days")}
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
                        {t("form.customDate")}
                      </Label>
                      {expiration === "custom" && (
                        <div className="space-y-1">
                          <Label
                            htmlFor="custom-date"
                            className="text-sm text-muted-foreground"
                          >
                            {t("form.selectDate")}
                          </Label>
                          <Input
                            id="custom-date"
                            type="datetime-local"
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="note" className="text-base font-medium">
                  {t("form.note")}
                </Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("form.notePlaceholder")}
                  rows={3}
                />
              </div>

              {/* Create Button */}
              <Button
                type="button"
                onClick={handleCreateInvite}
                disabled={createInviteMutation.isPending}
                className="w-full"
              >
                {createInviteMutation.isPending
                  ? t("actions.creating")
                  : t("actions.create")}
              </Button>
            </div>
          ) : (
            <div className="space-y-6 border rounded-lg p-6">
              {/* Display created code */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">
                    {t("fields.code")}
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
                      title={t("actions.copy")}
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
                  {t("messages.createdSuccess")}
                </p>
              </div>

              {/* Back to List Button */}
              <Button
                type="button"
                onClick={() => router.push("/admin/invite")}
                className="w-full"
              >
                {t("actions.backToList")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
