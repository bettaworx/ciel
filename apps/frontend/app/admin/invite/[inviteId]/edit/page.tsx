"use client";

import { use, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminInviteCode,
  useAdminUpdateInviteCode,
} from "@/lib/hooks/use-queries";

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

/**
 * Determine expiration type from expiresAt value
 */
function getExpirationType(expiresAt: string | null | undefined): Expiration {
  if (!expiresAt) return "never";

  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const diffDays = Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Check if it's approximately 7 or 30 days from now
  if (Math.abs(diffDays - 7) <= 1) return "7d";
  if (Math.abs(diffDays - 30) <= 1) return "30d";

  return "custom";
}

export default function EditInvitePage({
  params,
}: {
  params: Promise<{ inviteId: string }>;
}) {
  const t = useTranslations("admin.invites");
  const router = useRouter();
  
  // Unwrap params promise
  const { inviteId } = use(params);

  const { data: invite, isLoading } = useAdminInviteCode(inviteId);
  const updateInviteMutation = useAdminUpdateInviteCode(inviteId);

  // Form state
  const [customCode, setCustomCode] = useState<string>("");
  const [usageLimit, setUsageLimit] = useState<UsageLimit>("unlimited");
  const [maxUses, setMaxUses] = useState<string>("10");
  const [expiration, setExpiration] = useState<Expiration>("never");
  const [customDate, setCustomDate] = useState<string>("");
  const [note, setNote] = useState<string>("");

  // Initialize form with loaded data
  useEffect(() => {
    if (invite) {
      setCustomCode(invite.code);
      setUsageLimit(invite.maxUses !== null ? "limited" : "unlimited");
      setMaxUses(invite.maxUses?.toString() || "10");
      setExpiration(getExpirationType(invite.expiresAt));
      if (invite.expiresAt) {
        // Convert ISO string to datetime-local format
        const date = new Date(invite.expiresAt);
        const localDatetime = new Date(
          date.getTime() - date.getTimezoneOffset() * 60000,
        )
          .toISOString()
          .slice(0, 16);
        setCustomDate(localDatetime);
      }
      setNote(invite.note || "");
    }
  }, [invite]);

  const handleSave = async () => {
    if (!invite) return;

    try {
      const requestBody = {
        code: customCode.trim() !== invite.code ? customCode.trim() : null,
        maxUses:
          usageLimit === "limited" ? parseInt(maxUses, 10) : (null as any),
        expiresAt: calculateExpiresAt(expiration, customDate) as any,
        note: note.trim() || (null as any),
      };

      await updateInviteMutation.mutateAsync(requestBody);
      toast.success(t("messages.updateSuccess"));
      router.push(`/admin/invite/${inviteId}`);
    } catch (error) {
      console.error("Failed to update invite:", error);
      toast.error(t("messages.updateError"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Invite code not found</p>
      </div>
    );
  }

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
                onClick={() => router.push(`/admin/invite/${inviteId}`)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold">{t("edit")}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Update the invite code settings
            </p>
          </div>

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

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/invite/${inviteId}`)}
                className="flex-1"
              >
                {t("actions.cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={updateInviteMutation.isPending}
                className="flex-1"
              >
                {updateInviteMutation.isPending
                  ? "Saving..."
                  : t("actions.save")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
