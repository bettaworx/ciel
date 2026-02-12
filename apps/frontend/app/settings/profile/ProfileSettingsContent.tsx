"use client";

import { useState, useRef, useEffect } from "react";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { Upload, X, AlertCircle } from "lucide-react";
import { userAtom } from "@/atoms/auth";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { SettingItem } from "@/components/settings/SettingItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUpdateProfile, useUpdateAvatar } from "@/lib/hooks/use-queries";
import { toast } from "sonner";

export function ProfileSettingsContent() {
  const t = useTranslations();
  const user = useAtomValue(userAtom);

  // Local form state
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Mutations
  const updateProfile = useUpdateProfile();
  const updateAvatar = useUpdateAvatar();

  // Generate initials for avatar fallback
  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.username?.[0]?.toUpperCase() || "?";

  // Check if any field has changed
  useEffect(() => {
    const displayNameChanged = displayName !== (user?.displayName || "");
    const bioChanged = bio !== (user?.bio || "");
    const avatarChanged = selectedFile !== null;

    setHasUnsavedChanges(displayNameChanged || bioChanged || avatarChanged);
  }, [displayName, bio, selectedFile, user]);

  // Browser navigation warning for unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers require returnValue to be set
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Handle file selection (preview only, not upload yet)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(t("settings.profile.avatar.invalidFileType"));
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  // Cancel avatar preview
  const handleAvatarCancel = () => {
    setSelectedFile(null);
    setAvatarPreview(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Save all changes (displayName, bio, and avatar)
  const handleSaveChanges = async () => {
    try {
      // Upload avatar first if changed
      if (selectedFile) {
        await updateAvatar.mutateAsync(selectedFile);
      }

      // Update profile fields
      await updateProfile.mutateAsync({
        displayName: displayName.trim() || null,
        bio: bio.trim() || null,
      });

      // Clear avatar preview state after successful save
      if (selectedFile) {
        setSelectedFile(null);
        setAvatarPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }

      toast.success(t("settings.profile.updateSuccess"));
    } catch {
      toast.error(t("settings.profile.updateError"));
    }
  };

  // Sync local state when user data changes from API (after save)
  useEffect(() => {
    if (user && !updateProfile.isPending && !hasUnsavedChanges) {
      setDisplayName(user.displayName || "");
      setBio(user.bio || "");
    }
  }, [user, updateProfile.isPending, hasUnsavedChanges]);

  // Check if save is in progress
  const isSaving = updateProfile.isPending || updateAvatar.isPending;

  return (
    <div className="space-y-3">
      <SettingsPageHeader currentPageKey="settings.profile.title" />

      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card p-3 rounded-xl">
          <AlertCircle className="w-4 h-4" />
          <span>{t("settings.profile.unsavedChanges")}</span>
        </div>
      )}

      {/* Avatar Upload Section */}
      <SettingItem
        title={t("settings.profile.avatar.title")}
        description={t("settings.profile.avatar.description")}
        align="start"
      >
        <div className="flex flex-col items-center gap-4">
          {/* Avatar Preview */}
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarPreview || user?.avatarUrl || undefined} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="file"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Buttons */}
          <div className="flex flex-col gap-2 w-full">
            {!selectedFile ? (
              // No preview: Show "Change Avatar" button
              <Button
                type="button"
                variant="default"
                onClick={() => fileInputRef.current?.click()}
                className="w-full transition-colors duration-160 ease"
              >
                <Upload className="w-4 h-4 mr-2" />
                {user?.avatarUrl
                  ? t("settings.profile.avatar.change")
                  : t("settings.profile.avatar.upload")}
              </Button>
            ) : (
              // Preview shown: Show Cancel button only
              <Button
                type="button"
                variant="secondary"
                onClick={handleAvatarCancel}
                className="w-full transition-colors duration-160 ease"
              >
                <X className="w-4 h-4 mr-2" />
                {t("settings.profile.avatar.cancel")}
              </Button>
            )}
          </div>
        </div>
      </SettingItem>

      {/* Display Name Section */}
      <SettingItem
        title={t("settings.profile.displayName.title")}
        description={t("settings.profile.displayName.description")}
        align="start"
      >
        <div className="space-y-2">
          <Input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("settings.profile.displayName.placeholder")}
            maxLength={50}
            className="transition-colors duration-160 ease"
          />
          <p className="text-xs text-muted-foreground text-right">
            {displayName.length} / 50
          </p>
        </div>
      </SettingItem>

      {/* Bio Section */}
      <SettingItem
        title={t("settings.profile.bio.title")}
        description={t("settings.profile.bio.description")}
        align="start"
      >
        <div className="space-y-2">
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t("settings.profile.bio.placeholder")}
            maxLength={200}
            rows={4}
            className="resize-none transition-colors duration-160 ease"
          />
          <p className="text-xs text-muted-foreground text-right">
            {bio.length} / 200
          </p>
        </div>
      </SettingItem>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveChanges}
          disabled={isSaving || !hasUnsavedChanges}
          variant="default"
          className="transition-colors duration-160 ease"
        >
          {isSaving ? (
            <>{t("settings.profile.saving")}</>
          ) : (
            <>{t("settings.profile.saveChanges")}</>
          )}
        </Button>
      </div>
    </div>
  );
}
