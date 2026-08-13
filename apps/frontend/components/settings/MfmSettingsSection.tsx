"use client";

import { useCallback } from "react";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import {
  AtSign,
  Hash,
  Link2,
  ExternalLink,
  Smile,
  Bold,
  Italic,
  Strikethrough,
  MinusSquare,
  Quote,
  AlignCenter,
  Languages,
  Code,
  TerminalSquare,
  SquareCode,
  FlipHorizontal,
  Type,
  EyeOff,
  Search,
  PaintBucket,
  Palette,
  Square,
  RotateCw,
  Move,
  Maximize,
  Expand,
  ChevronsUp,
  Sparkles,
  Rainbow,
  Zap,
  PartyPopper,
  ArrowUp,
  CircleDot,
  Loader,
  ShieldAlert,
  Activity,
} from "lucide-react";
import { mfmSettingsAtom, type MfmSettings } from "@/atoms/mfm-settings";
import { NestedToggle } from "@/components/settings/NestedToggle";
import {
  SettingsRowGroup,
  SettingsSwitchRow,
} from "@/components/settings/SettingsRow";

// ---------------------------------------------------------------------------
// Helper: update a top-level boolean key
// ---------------------------------------------------------------------------

type BooleanKeys<T> = {
  [K in keyof T]: T[K] extends boolean ? K : never;
}[keyof T];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MfmSettingsSection() {
  const t = useTranslations("settings.appearance.mfm");
  const [settings, setSettings] = useAtom(mfmSettingsAtom);

  // ---- Updaters ----

  const toggle = useCallback(
    (key: BooleanKeys<MfmSettings>, value: boolean) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [setSettings],
  );

  const toggleCode = useCallback(
    (key: keyof MfmSettings["code"], value: boolean) => {
      setSettings((prev) => {
        const next = { ...prev.code, [key]: value };
        // Auto-enable parent when a child is turned ON
        if (value) next.enabled = true;
        // Auto-disable parent when ALL children are OFF
        if (!next.inline && !next.block) next.enabled = false;
        return { ...prev, code: next };
      });
    },
    [setSettings],
  );

  const toggleFont = useCallback(
    (key: keyof MfmSettings["font"], value: boolean) => {
      setSettings((prev) => {
        const next = { ...prev.font, [key]: value };
        // Auto-enable parent when a child is turned ON
        if (value) next.enabled = true;
        // Auto-disable parent when ALL children are OFF
        if (!next.serif && !next.monospace && !next.cursive && !next.fantasy)
          next.enabled = false;
        return { ...prev, font: next };
      });
    },
    [setSettings],
  );

  const toggleAnimation = useCallback(
    (key: keyof MfmSettings["animation"], value: boolean) => {
      setSettings((prev) => {
        const next = { ...prev.animation, [key]: value };
        // Auto-enable parent when a child is turned ON
        if (value) next.enabled = true;
        // Auto-disable parent when ALL children are OFF
        if (
          !next.jelly && !next.tada && !next.jump && !next.bounce &&
          !next.spin && !next.shake && !next.twitch
        )
          next.enabled = false;
        return { ...prev, animation: next };
      });
    },
    [setSettings],
  );

  const toggleExpand = useCallback(
    (key: keyof MfmSettings["expand"], value: boolean) => {
      setSettings((prev) => ({
        ...prev,
        expand: { ...prev.expand, [key]: value },
      }));
    },
    [setSettings],
  );

  // Computed: are all sub-settings on?
  // (Not used for parent checked anymore — kept for potential UI hints)

  return (
    <SettingsRowGroup title={t("title")}>
      {/* ---- Global enable (parent of everything) ---- */}
      <NestedToggle
        title={t("enabled.title")}
        checked={settings.enabled}
        onCheckedChange={(v) => toggle("enabled", v)}
      >
        <div className="divide-y divide-border">
          <SettingsSwitchRow
            label={t("mention.title")}
            checked={settings.mention}
            onCheckedChange={(v) => toggle("mention", v)}
            icon={AtSign}
          />
          <SettingsSwitchRow
            label={t("hashtag.title")}
            checked={settings.hashtag}
            onCheckedChange={(v) => toggle("hashtag", v)}
            icon={Hash}
          />
          <SettingsSwitchRow
            label={t("url.title")}
            checked={settings.url}
            onCheckedChange={(v) => toggle("url", v)}
            icon={Link2}
          />
          <SettingsSwitchRow
            label={t("link.title")}
            checked={settings.link}
            onCheckedChange={(v) => toggle("link", v)}
            icon={ExternalLink}
          />
          <SettingsSwitchRow
            label={t("emojiCode.title")}
            checked={settings.emojiCode}
            onCheckedChange={(v) => toggle("emojiCode", v)}
            icon={Smile}
          />
          <SettingsSwitchRow
            label={t("bold.title")}
            checked={settings.bold}
            onCheckedChange={(v) => toggle("bold", v)}
            icon={Bold}
          />
          <SettingsSwitchRow
            label={t("italic.title")}
            checked={settings.italic}
            onCheckedChange={(v) => toggle("italic", v)}
            icon={Italic}
          />
          <SettingsSwitchRow
            label={t("strike.title")}
            checked={settings.strike}
            onCheckedChange={(v) => toggle("strike", v)}
            icon={Strikethrough}
          />
          <SettingsSwitchRow
            label={t("small.title")}
            checked={settings.small}
            onCheckedChange={(v) => toggle("small", v)}
            icon={MinusSquare}
          />
          <SettingsSwitchRow
            label={t("quote.title")}
            checked={settings.quote}
            onCheckedChange={(v) => toggle("quote", v)}
            icon={Quote}
          />
          <SettingsSwitchRow
            label={t("center.title")}
            checked={settings.center}
            onCheckedChange={(v) => toggle("center", v)}
            icon={AlignCenter}
          />
          <SettingsSwitchRow
            label={t("ruby.title")}
            checked={settings.ruby}
            onCheckedChange={(v) => toggle("ruby", v)}
            icon={Languages}
          />

          {/* ---- Code (nested) ---- */}
          <NestedToggle
            title={t("code.title")}
            checked={settings.code.enabled}
            onCheckedChange={(v) => {
              setSettings((prev) => ({
                ...prev,
                code: { ...prev.code, enabled: v },
              }));
            }}
            icon={Code}
            indent
          >
            <SettingsSwitchRow
              label={t("code.inline.title")}
              checked={settings.code.inline}
              onCheckedChange={(v) => toggleCode("inline", v)}
              icon={TerminalSquare}
            />
            <SettingsSwitchRow
              label={t("code.block.title")}
              checked={settings.code.block}
              onCheckedChange={(v) => toggleCode("block", v)}
              icon={SquareCode}
            />
          </NestedToggle>

          <SettingsSwitchRow
            label={t("flip.title")}
            checked={settings.flip}
            onCheckedChange={(v) => toggle("flip", v)}
            icon={FlipHorizontal}
          />

          {/* ---- Font (nested) ---- */}
          <NestedToggle
            title={t("font.title")}
            checked={settings.font.enabled}
            onCheckedChange={(v) => {
              setSettings((prev) => ({
                ...prev,
                font: { ...prev.font, enabled: v },
              }));
            }}
            icon={Type}
            indent
          >
            <SettingsSwitchRow
              label={t("font.serif.title")}
              checked={settings.font.serif}
              onCheckedChange={(v) => toggleFont("serif", v)}
            />
            <SettingsSwitchRow
              label={t("font.monospace.title")}
              checked={settings.font.monospace}
              onCheckedChange={(v) => toggleFont("monospace", v)}
            />
            <SettingsSwitchRow
              label={t("font.cursive.title")}
              checked={settings.font.cursive}
              onCheckedChange={(v) => toggleFont("cursive", v)}
            />
            <SettingsSwitchRow
              label={t("font.fantasy.title")}
              checked={settings.font.fantasy}
              onCheckedChange={(v) => toggleFont("fantasy", v)}
            />
          </NestedToggle>

          <SettingsSwitchRow
            label={t("blur.title")}
            checked={settings.blur}
            onCheckedChange={(v) => toggle("blur", v)}
            icon={EyeOff}
          />
          <SettingsSwitchRow
            label={t("search.title")}
            checked={settings.search}
            onCheckedChange={(v) => toggle("search", v)}
            icon={Search}
          />
          <SettingsSwitchRow
            label={t("bg.title")}
            checked={settings.bg}
            onCheckedChange={(v) => toggle("bg", v)}
            icon={PaintBucket}
          />
          <SettingsSwitchRow
            label={t("fg.title")}
            checked={settings.fg}
            onCheckedChange={(v) => toggle("fg", v)}
            icon={Palette}
          />
          <SettingsSwitchRow
            label={t("border.title")}
            checked={settings.border}
            onCheckedChange={(v) => toggle("border", v)}
            icon={Square}
          />
          <SettingsSwitchRow
            label={t("rotate.title")}
            checked={settings.rotate}
            onCheckedChange={(v) => toggle("rotate", v)}
            icon={RotateCw}
          />
          <SettingsSwitchRow
            label={t("position.title")}
            checked={settings.position}
            onCheckedChange={(v) => toggle("position", v)}
            icon={Move}
          />
          <SettingsSwitchRow
            label={t("scale.title")}
            checked={settings.scale}
            onCheckedChange={(v) => toggle("scale", v)}
            icon={Maximize}
          />

          {/* ---- Expand (nested) ---- */}
          <NestedToggle
            title={t("expand.title")}
            checked={settings.expand.allowLargerThanX2}
            onCheckedChange={(v) => toggleExpand("allowLargerThanX2", v)}
            icon={Expand}
            indent
          >
            <SettingsSwitchRow
              label={t("expand.allowLargerThanX2.title")}
              checked={settings.expand.allowLargerThanX2}
              onCheckedChange={(v) => toggleExpand("allowLargerThanX2", v)}
              icon={ChevronsUp}
            />
          </NestedToggle>

          {/* ---- Animation (nested) ---- */}
          <NestedToggle
            title={t("animation.title")}
            checked={settings.animation.enabled}
            onCheckedChange={(v) => {
              setSettings((prev) => ({
                ...prev,
                animation: { ...prev.animation, enabled: v },
              }));
            }}
            icon={Sparkles}
            indent
          >
            <SettingsSwitchRow
              label={t("animation.jelly.title")}
              checked={settings.animation.jelly}
              onCheckedChange={(v) => toggleAnimation("jelly", v)}
              icon={Zap}
            />
            <SettingsSwitchRow
              label={t("animation.tada.title")}
              checked={settings.animation.tada}
              onCheckedChange={(v) => toggleAnimation("tada", v)}
              icon={PartyPopper}
            />
            <SettingsSwitchRow
              label={t("animation.jump.title")}
              checked={settings.animation.jump}
              onCheckedChange={(v) => toggleAnimation("jump", v)}
              icon={ArrowUp}
            />
            <SettingsSwitchRow
              label={t("animation.bounce.title")}
              checked={settings.animation.bounce}
              onCheckedChange={(v) => toggleAnimation("bounce", v)}
              icon={CircleDot}
            />
            <SettingsSwitchRow
              label={t("animation.spin.title")}
              checked={settings.animation.spin}
              onCheckedChange={(v) => toggleAnimation("spin", v)}
              icon={Loader}
            />
            <SettingsSwitchRow
              label={t("animation.shake.title")}
              checked={settings.animation.shake}
              onCheckedChange={(v) => toggleAnimation("shake", v)}
              icon={ShieldAlert}
            />
            <SettingsSwitchRow
              label={t("animation.twitch.title")}
              checked={settings.animation.twitch}
              onCheckedChange={(v) => toggleAnimation("twitch", v)}
              icon={Activity}
            />
          </NestedToggle>

          <SettingsSwitchRow
            label={t("rainbow.title")}
            checked={settings.rainbow}
            onCheckedChange={(v) => toggle("rainbow", v)}
            icon={Rainbow}
          />
          <SettingsSwitchRow
            label={t("sparkle.title")}
            checked={settings.sparkle}
            onCheckedChange={(v) => toggle("sparkle", v)}
            icon={Sparkles}
          />
        </div>
      </NestedToggle>
    </SettingsRowGroup>
  );
}
