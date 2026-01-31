"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload } from "lucide-react";
import { createApiClient } from "@/lib/api/client";
import { SettingItem } from "@/components/settings/SettingItem";
import { toast } from "sonner";

interface ServerInfoStepProps {
  onNext: (name: string, description: string, iconMediaId: string | null) => void;
  initialName: string;
  initialDescription: string;
  initialIconMediaId: string | null;
  loading?: boolean;
}

const apiClient = createApiClient();

export function ServerInfoStep({
  onNext,
  initialName,
  initialDescription,
  initialIconMediaId,
  loading = false,
}: ServerInfoStepProps) {
  const t = useTranslations("adminSetup");
  const [serverName, setServerName] = useState(initialName);
  const [serverDescription, setServerDescription] = useState(initialDescription);
  const [iconMediaId, setIconMediaId] = useState<string | null>(initialIconMediaId);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Cookie-based auth - no need to pass token
      const result = await apiClient.uploadMedia(file);
      if (result.ok) {
        setIconMediaId(result.data.id);
        setIconUrl(result.data.url);
        toast.success(t("serverInfo.uploadSuccess"));
      } else {
        toast.error(t("serverInfo.uploadError"));
      }
    } catch (error) {
      console.error("Failed to upload icon:", error);
      toast.error(t("serverInfo.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim()) {
      toast.error(t("serverInfo.nameRequired"));
      return;
    }
    onNext(serverName, serverDescription, iconMediaId);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <form 
        id="admin-setup-server-info-form" 
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto px-4"
      >
        <div className="w-full max-w-2xl mx-auto space-y-6 py-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{t("serverInfo.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("serverInfo.description")}
            </p>
          </div>

          <div className="space-y-4">
            {/* Server Icon */}
            <SettingItem
              title={t("serverInfo.serverIconLabel")}
              description={t("serverInfo.serverIconDescription")}
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
                    disabled={uploading}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading
                      ? t("serverInfo.uploading")
                      : iconUrl
                        ? t("serverInfo.changeIcon")
                        : t("serverInfo.uploadIcon")}
                  </Button>
                </div>
              </div>
            </SettingItem>

            {/* Server Name */}
            <SettingItem
              title={t("serverInfo.serverNameLabel")}
              description={t("serverInfo.serverNameDescription")}
              align="center"
            >
              <Input
                id="server-name"
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder={t("serverInfo.serverNamePlaceholder")}
              />
            </SettingItem>

            {/* Server Description */}
            <SettingItem
              title={t("serverInfo.serverDescriptionLabel")}
              description={t("serverInfo.serverDescriptionDescription")}
              align="start"
            >
              <Textarea
                id="server-description"
                value={serverDescription}
                onChange={(e) => setServerDescription(e.target.value)}
                placeholder={t("serverInfo.serverDescriptionPlaceholder")}
                rows={4}
              />
            </SettingItem>
          </div>
        </div>
      </form>
    </div>
  );
}
