"use client";

import { useCallback } from "react";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { mfmSettingsAtom, type MfmSettings } from "@/atoms/mfm-settings";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helper: update a top-level boolean key
// ---------------------------------------------------------------------------

type BooleanKeys<T> = {
  [K in keyof T]: T[K] extends boolean ? K : never;
}[keyof T];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * A single toggle row: title + description on the left, Switch on the right.
 * Matches the SettingItem layout proportions but without the Card wrapper.
 */
function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-3",
        disabled && "opacity-50",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

/**
 * A collapsible parent: toggle + chevron header that expands/collapses children.
 * When the parent switch is OFF, children are collapsed and disabled.
 */
function CollapsibleGroup({
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  children,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Collapsible open={checked && !disabled}>
      <div
        className={cn(
          "flex items-center justify-between gap-4 py-3",
          disabled && "opacity-50",
        )}
      >
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <CollapsibleTrigger asChild disabled={disabled || !checked}>
            <button
              type="button"
              className="shrink-0"
              disabled={disabled}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  (!checked || disabled) && "-rotate-90",
                )}
              />
            </button>
          </CollapsibleTrigger>
          <div className="min-w-0">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
          />
        </div>
      </div>
      <CollapsibleContent>
        <div className="ml-6 pl-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MfmSettingsSection() {
  const t = useTranslations("settings.appearance.mfm");
  const [settings, setSettings] = useAtom(mfmSettingsAtom);

  // ---- Updaters ----

  /** Update a top-level boolean setting. */
  const toggle = useCallback(
    (key: BooleanKeys<MfmSettings>, value: boolean) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [setSettings],
  );

  /** Update a code sub-setting. */
  const toggleCode = useCallback(
    (key: keyof MfmSettings["code"], value: boolean) => {
      setSettings((prev) => ({
        ...prev,
        code: { ...prev.code, [key]: value },
      }));
    },
    [setSettings],
  );

  /** Update a font sub-setting. */
  const toggleFont = useCallback(
    (key: keyof MfmSettings["font"], value: boolean) => {
      setSettings((prev) => ({
        ...prev,
        font: { ...prev.font, [key]: value },
      }));
    },
    [setSettings],
  );

  /** Update an animation sub-setting. */
  const toggleAnimation = useCallback(
    (key: keyof MfmSettings["animation"], value: boolean) => {
      setSettings((prev) => ({
        ...prev,
        animation: { ...prev.animation, [key]: value },
      }));
    },
    [setSettings],
  );

  /** Update expand sub-setting. */
  const toggleExpand = useCallback(
    (key: keyof MfmSettings["expand"], value: boolean) => {
      setSettings((prev) => ({
        ...prev,
        expand: { ...prev.expand, [key]: value },
      }));
    },
    [setSettings],
  );

  // Computed: are all code sub-settings on?
  const codeAllOn = settings.code.inline && settings.code.block;
  // Computed: are all font sub-settings on?
  const fontAllOn =
    settings.font.serif &&
    settings.font.monospace &&
    settings.font.cursive &&
    settings.font.fantasy;
  // Computed: are all animation sub-settings on?
  const animAllOn =
    settings.animation.jelly &&
    settings.animation.tada &&
    settings.animation.jump &&
    settings.animation.bounce &&
    settings.animation.spin &&
    settings.animation.shake &&
    settings.animation.twitch;

  const globalDisabled = !settings.enabled;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-2">
          <h3 className="text-base font-semibold">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>

        <div className="divide-y divide-border">
          {/* ---- Global enable ---- */}
          <ToggleRow
            title={t("enabled.title")}
            description={t("enabled.description")}
            checked={settings.enabled}
            onCheckedChange={(v) => toggle("enabled", v)}
          />

          {/* ---- Simple toggles ---- */}
          <ToggleRow
            title={t("mention.title")}
            description={t("mention.description")}
            checked={settings.mention}
            onCheckedChange={(v) => toggle("mention", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("hashtag.title")}
            description={t("hashtag.description")}
            checked={settings.hashtag}
            onCheckedChange={(v) => toggle("hashtag", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("url.title")}
            description={t("url.description")}
            checked={settings.url}
            onCheckedChange={(v) => toggle("url", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("link.title")}
            description={t("link.description")}
            checked={settings.link}
            onCheckedChange={(v) => toggle("link", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("emojiCode.title")}
            description={t("emojiCode.description")}
            checked={settings.emojiCode}
            onCheckedChange={(v) => toggle("emojiCode", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("bold.title")}
            description={t("bold.description")}
            checked={settings.bold}
            onCheckedChange={(v) => toggle("bold", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("italic.title")}
            description={t("italic.description")}
            checked={settings.italic}
            onCheckedChange={(v) => toggle("italic", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("strike.title")}
            description={t("strike.description")}
            checked={settings.strike}
            onCheckedChange={(v) => toggle("strike", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("small.title")}
            description={t("small.description")}
            checked={settings.small}
            onCheckedChange={(v) => toggle("small", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("quote.title")}
            description={t("quote.description")}
            checked={settings.quote}
            onCheckedChange={(v) => toggle("quote", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("center.title")}
            description={t("center.description")}
            checked={settings.center}
            onCheckedChange={(v) => toggle("center", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("ruby.title")}
            description={t("ruby.description")}
            checked={settings.ruby}
            onCheckedChange={(v) => toggle("ruby", v)}
            disabled={globalDisabled}
          />

          {/* ---- Code (collapsible) ---- */}
          <CollapsibleGroup
            title={t("code.title")}
            description={t("code.description")}
            checked={codeAllOn}
            onCheckedChange={(v) => {
              toggleCode("inline", v);
              toggleCode("block", v);
            }}
            disabled={globalDisabled}
          >
            <ToggleRow
              title={t("code.inline.title")}
              description={t("code.inline.description")}
              checked={settings.code.inline}
              onCheckedChange={(v) => toggleCode("inline", v)}
              disabled={globalDisabled}
            />
            <ToggleRow
              title={t("code.block.title")}
              description={t("code.block.description")}
              checked={settings.code.block}
              onCheckedChange={(v) => toggleCode("block", v)}
              disabled={globalDisabled}
            />
          </CollapsibleGroup>

          {/* ---- Simple toggles continued ---- */}
          <ToggleRow
            title={t("flip.title")}
            description={t("flip.description")}
            checked={settings.flip}
            onCheckedChange={(v) => toggle("flip", v)}
            disabled={globalDisabled}
          />

          {/* ---- Font (collapsible) ---- */}
          <CollapsibleGroup
            title={t("font.title")}
            description={t("font.description")}
            checked={fontAllOn}
            onCheckedChange={(v) => {
              toggleFont("serif", v);
              toggleFont("monospace", v);
              toggleFont("cursive", v);
              toggleFont("fantasy", v);
            }}
            disabled={globalDisabled}
          >
            <ToggleRow
              title={t("font.serif.title")}
              description={t("font.serif.description")}
              checked={settings.font.serif}
              onCheckedChange={(v) => toggleFont("serif", v)}
              disabled={globalDisabled}
            />
            <ToggleRow
              title={t("font.monospace.title")}
              description={t("font.monospace.description")}
              checked={settings.font.monospace}
              onCheckedChange={(v) => toggleFont("monospace", v)}
              disabled={globalDisabled}
            />
            <ToggleRow
              title={t("font.cursive.title")}
              description={t("font.cursive.description")}
              checked={settings.font.cursive}
              onCheckedChange={(v) => toggleFont("cursive", v)}
              disabled={globalDisabled}
            />
            <ToggleRow
              title={t("font.fantasy.title")}
              description={t("font.fantasy.description")}
              checked={settings.font.fantasy}
              onCheckedChange={(v) => toggleFont("fantasy", v)}
              disabled={globalDisabled}
            />
          </CollapsibleGroup>

          <ToggleRow
            title={t("blur.title")}
            description={t("blur.description")}
            checked={settings.blur}
            onCheckedChange={(v) => toggle("blur", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("search.title")}
            description={t("search.description")}
            checked={settings.search}
            onCheckedChange={(v) => toggle("search", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("bg.title")}
            description={t("bg.description")}
            checked={settings.bg}
            onCheckedChange={(v) => toggle("bg", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("fg.title")}
            description={t("fg.description")}
            checked={settings.fg}
            onCheckedChange={(v) => toggle("fg", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("border.title")}
            description={t("border.description")}
            checked={settings.border}
            onCheckedChange={(v) => toggle("border", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("rotate.title")}
            description={t("rotate.description")}
            checked={settings.rotate}
            onCheckedChange={(v) => toggle("rotate", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("position.title")}
            description={t("position.description")}
            checked={settings.position}
            onCheckedChange={(v) => toggle("position", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("scale.title")}
            description={t("scale.description")}
            checked={settings.scale}
            onCheckedChange={(v) => toggle("scale", v)}
            disabled={globalDisabled}
          />

          {/* ---- Expand (collapsible) ---- */}
          <CollapsibleGroup
            title={t("expand.title")}
            description={t("expand.description")}
            checked={settings.expand.allowLargerThanX2}
            onCheckedChange={(v) => toggleExpand("allowLargerThanX2", v)}
            disabled={globalDisabled}
          >
            <ToggleRow
              title={t("expand.allowLargerThanX2.title")}
              description={t("expand.allowLargerThanX2.description")}
              checked={settings.expand.allowLargerThanX2}
              onCheckedChange={(v) => toggleExpand("allowLargerThanX2", v)}
              disabled={globalDisabled}
            />
          </CollapsibleGroup>

          {/* ---- Animation (collapsible) ---- */}
          <CollapsibleGroup
            title={t("animation.title")}
            description={t("animation.description")}
            checked={animAllOn}
            onCheckedChange={(v) => {
              toggleAnimation("jelly", v);
              toggleAnimation("tada", v);
              toggleAnimation("jump", v);
              toggleAnimation("bounce", v);
              toggleAnimation("spin", v);
              toggleAnimation("shake", v);
              toggleAnimation("twitch", v);
            }}
            disabled={globalDisabled}
          >
            <ToggleRow
              title={t("animation.jelly.title")}
              description={t("animation.jelly.description")}
              checked={settings.animation.jelly}
              onCheckedChange={(v) => toggleAnimation("jelly", v)}
              disabled={globalDisabled}
            />
            <ToggleRow
              title={t("animation.tada.title")}
              description={t("animation.tada.description")}
              checked={settings.animation.tada}
              onCheckedChange={(v) => toggleAnimation("tada", v)}
              disabled={globalDisabled}
            />
            <ToggleRow
              title={t("animation.jump.title")}
              description={t("animation.jump.description")}
              checked={settings.animation.jump}
              onCheckedChange={(v) => toggleAnimation("jump", v)}
              disabled={globalDisabled}
            />
            <ToggleRow
              title={t("animation.bounce.title")}
              description={t("animation.bounce.description")}
              checked={settings.animation.bounce}
              onCheckedChange={(v) => toggleAnimation("bounce", v)}
              disabled={globalDisabled}
            />
            <ToggleRow
              title={t("animation.spin.title")}
              description={t("animation.spin.description")}
              checked={settings.animation.spin}
              onCheckedChange={(v) => toggleAnimation("spin", v)}
              disabled={globalDisabled}
            />
            <ToggleRow
              title={t("animation.shake.title")}
              description={t("animation.shake.description")}
              checked={settings.animation.shake}
              onCheckedChange={(v) => toggleAnimation("shake", v)}
              disabled={globalDisabled}
            />
            <ToggleRow
              title={t("animation.twitch.title")}
              description={t("animation.twitch.description")}
              checked={settings.animation.twitch}
              onCheckedChange={(v) => toggleAnimation("twitch", v)}
              disabled={globalDisabled}
            />
          </CollapsibleGroup>

          <ToggleRow
            title={t("rainbow.title")}
            description={t("rainbow.description")}
            checked={settings.rainbow}
            onCheckedChange={(v) => toggle("rainbow", v)}
            disabled={globalDisabled}
          />
          <ToggleRow
            title={t("sparkle.title")}
            description={t("sparkle.description")}
            checked={settings.sparkle}
            onCheckedChange={(v) => toggle("sparkle", v)}
            disabled={globalDisabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
