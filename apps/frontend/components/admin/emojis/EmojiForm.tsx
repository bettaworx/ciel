"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageCropDialog } from "@/components/shared/ImageCropDialog";
import {
  getAdminEmojiFormDefaults,
  isValidEmojiShortcode,
  type AdminEmojiFormValues,
} from "@/lib/admin-emojis";
import type { components } from "@/lib/api/api";

type AdminEmoji = components["schemas"]["AdminEmoji"];

interface EmojiFormProps {
  mode: "create" | "edit";
  emoji?: AdminEmoji | null;
  isPending: boolean;
  backHref?: string;
  onSubmit: (values: AdminEmojiFormValues) => Promise<void> | void;
}

export function EmojiForm({
  mode,
  emoji,
  isPending,
  backHref = "/admin/emojis",
  onSubmit,
}: EmojiFormProps) {
  const t = useTranslations("admin.emojis");
  const tCommon = useTranslations("admin.common");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [values, setValues] = useState<AdminEmojiFormValues>(
    getAdminEmojiFormDefaults(),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);

  useEffect(() => {
    const defaults = getAdminEmojiFormDefaults(emoji ?? undefined);
    setValues(defaults);
    setFormError(null);
    setImagePreviewUrl(emoji?.imageUrl ?? null);
    setCropDialogOpen(false);
    setCropImageSrc(null);
    setPendingCropFile(null);
  }, [emoji]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const setCroppedPreview = (file: File) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const nextUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextUrl;
    setImagePreviewUrl(nextUrl);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError(t("validation.imageType"));
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImageSrc(reader.result as string);
      setPendingCropFile(file);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleCropComplete = (croppedFile: File) => {
    setValues((current) => ({ ...current, imageFile: croppedFile }));
    setCroppedPreview(croppedFile);
    setCropDialogOpen(false);
    setCropImageSrc(null);
    setPendingCropFile(null);
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const shortcode = values.shortcode.trim();
    if (!shortcode) {
      setFormError(t("validation.shortcodeRequired"));
      return;
    }
    if (!isValidEmojiShortcode(shortcode)) {
      setFormError(t("validation.shortcodeInvalid"));
      return;
    }
    if (mode === "create" && !values.imageFile) {
      setFormError(t("validation.imageRequired"));
      return;
    }

    await onSubmit({
      ...values,
      shortcode,
    });
  };

  const title =
    mode === "create" ? t("createTitle") : t("editTitle");
  const description =
    mode === "create" ? t("createDescription") : t("editDescription");

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 overflow-y-auto px-4">
          <div className="mx-auto w-full max-w-4xl space-y-6 py-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(backHref)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">{title}</h1>
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border p-6">
              <div className="grid gap-6 md:grid-cols-[200px_minmax(0,1fr)]">
                <div className="space-y-3">
                  <Label>{t("form.image")}</Label>
                  <div className="flex h-48 w-48 items-center justify-center overflow-hidden rounded-2xl border bg-muted">
                    {imagePreviewUrl ? (
                      <Image
                        src={imagePreviewUrl}
                        alt={values.shortcode || "emoji preview"}
                        width={192}
                        height={192}
                        unoptimized
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImagePlus className="h-8 w-8" />
                        <span className="text-xs">{t("form.noImage")}</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPending}
                  >
                    {mode === "create"
                      ? t("actions.selectImage")
                      : t("actions.replaceImage")}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {t("form.imageHint")}
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="shortcode">{t("form.shortcode")}</Label>
                    <Input
                      id="shortcode"
                      value={values.shortcode}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          shortcode: event.target.value,
                        }))
                      }
                      placeholder={t("form.shortcodePlaceholder")}
                      disabled={isPending}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("form.shortcodeHint")}
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="name">{t("form.name")}</Label>
                    <Input
                      id="name"
                      value={values.name}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder={t("form.namePlaceholder")}
                      disabled={isPending}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="category">{t("form.category")}</Label>
                    <Input
                      id="category"
                      value={values.category}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
                      }
                      placeholder={t("form.categoryPlaceholder")}
                      disabled={isPending}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="license">{t("form.license")}</Label>
                    <Input
                      id="license"
                      value={values.license}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          license: event.target.value,
                        }))
                      }
                      placeholder={t("form.licensePlaceholder")}
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>

              {formError ? (
                <p className="text-sm text-destructive">{formError}</p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(backHref)}
                  disabled={isPending}
                >
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? tCommon("loading")
                    : mode === "create"
                      ? t("actions.create")
                      : t("actions.save")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {cropDialogOpen && cropImageSrc && pendingCropFile ? (
        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={setCropDialogOpen}
          imageSrc={cropImageSrc}
          originalFile={pendingCropFile}
          aspect={1}
          title={t("cropTitle")}
          onCropComplete={handleCropComplete}
        />
      ) : null}
    </>
  );
}
