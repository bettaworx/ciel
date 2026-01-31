"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload } from "lucide-react";
import { SettingItem } from "@/components/settings/SettingItem";
import { useUpdateServerProfile, useUploadMedia } from "@/lib/hooks/use-queries";
import { toast } from "sonner";
import type { components } from "@/lib/api/api";

interface ServerProfileSectionProps {
  serverInfo: components["schemas"]["ServerInfo"];
}

export function ServerProfileSection({ serverInfo }: ServerProfileSectionProps) {
  const t = useTranslations("admin.config.profile");
  const [serverName, setServerName] = useState(serverInfo.serverName || "");
  const [serverDescription, setServerDescription] = useState(serverInfo.serverDescription || "");
  const [iconMediaId, setIconMediaId] = useState<string | null>(null);
  const [iconUrl, setIconUrl] = useState<string | null>(serverInfo.serverIconUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMediaMutation = useUploadMedia();
  const updateProfileMutation = useUpdateServerProfile();

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadMediaMutation.mutateAsync(file);
      setIconMediaId(result.id);
      setIconUrl(result.url);
      toast.success(t("uploadSuccess"));
    } catch (error) {
      console.error("Failed to upload icon:", error);
      toast.error(t("uploadError"));
    }
  };

  const handleSave = async () => {
    if (!serverName.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        serverName,
        serverDescription: serverDescription || undefined,
        serverIconMediaId: iconMediaId || undefined,
      });
      toast.success(t("saveSuccess"));
      // Reset icon media ID after successful save
      setIconMediaId(null);
    } catch (error) {
      console.error("Failed to update server profile:", error);
      toast.error(t("saveError"));
    }
  };

  const hasChanges =
    serverName !== (serverInfo.serverName || "") ||
    serverDescription !== (serverInfo.serverDescription || "") ||
    iconMediaId !== null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t("title")}</h2>
      </div>

      <div className="space-y-4">
        {/* Server Icon */}
        <SettingItem
          title={t("serverIconLabel")}
          description={t("serverIconDescription")}
          align="center"
        >
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              {iconUrl ? (
                <AvatarImage src={iconUrl} alt="Server icon" />
              ) : (
                <AvatarFallback>{serverName[0]?.toUpperCase() || "C"}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleIconUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMediaMutation.isPending}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadMediaMutation.isPending
                  ? t("uploading")
                  : iconUrl
                    ? t("changeIcon")
                    : t("uploadIcon")}
              </Button>
            </div>
          </div>
        </SettingItem>

        {/* Server Name */}
        <SettingItem
          title={t("serverNameLabel")}
          description={t("serverNameDescription")}
          align="center"
        >
          <Input
            type="text"
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            placeholder={t("serverNamePlaceholder")}
          />
        </SettingItem>

        {/* Server Description */}
        <SettingItem
          title={t("serverDescriptionLabel")}
          description={t("serverDescriptionDescription")}
          align="start"
        >
          <Textarea
            value={serverDescription}
            onChange={(e) => setServerDescription(e.target.value)}
            placeholder={t("serverDescriptionPlaceholder")}
            rows={4}
          />
        </SettingItem>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
