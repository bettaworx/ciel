"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { User, Upload } from "lucide-react";
import Image from "next/image";

interface AvatarStepProps {
  onNext: (file: File | null) => void;
  onSkip?: () => void;
  loading?: boolean;
}

export function AvatarStep({
  onNext,
  onSkip,
  loading = false,
}: AvatarStepProps) {
  const t = useTranslations();
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(selectedFile);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Form content */}
      <form
        id="setup-avatar-form"
        onSubmit={handleSubmit}
        className="flex flex-col h-full min-h-0"
      >
        <div className="flex-1 flex flex-col justify-center">
          {/* Title and subtitle - left aligned */}
          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-bold">{t("setup.avatar.title")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("setup.avatar.description")}
            </p>
          </div>

          {/* Avatar upload - larger size */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-48 h-48 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {preview ? (
                <Image
                  src={preview}
                  alt="Avatar preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="w-24 h-24 text-muted-foreground" strokeWidth={1.5} />
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button
              type="button"
              variant="secondary"
              onClick={handleUploadClick}
              disabled={loading}
              className="transition-colors duration-160 ease"
            >
              <Upload className="w-4 h-4 mr-2" strokeWidth={1.5} />
              {preview ? t("setup.avatar.change") : t("setup.avatar.upload")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
