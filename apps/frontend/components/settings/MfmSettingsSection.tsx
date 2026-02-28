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
import { Card, CardContent } from "@/components/ui/card";
import { ToggleRow, NestedToggle } from "@/components/settings/NestedToggle";

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
      setSettings((prev) => ({
        ...prev,
        code: { ...prev.code, [key]: value },
      }));
    },
    [setSettings],
  );

  const toggleFont = useCallback(
    (key: keyof MfmSettings["font"], value: boolean) => {
      setSettings((prev) => ({
        ...prev,
        font: { ...prev.font, [key]: value },
      }));
    },
    [setSettings],
  );

  const toggleAnimation = useCallback(
    (key: keyof MfmSettings["animation"], value: boolean) => {
      setSettings((prev) => ({
        ...prev,
        animation: { ...prev.animation, [key]: value },
      }));
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
  const codeAllOn = settings.code.inline && settings.code.block;
  const fontAllOn =
    settings.font.serif &&
    settings.font.monospace &&
    settings.font.cursive &&
    settings.font.fantasy;
  const animAllOn =
    settings.animation.jelly &&
    settings.animation.tada &&
    settings.animation.jump &&
    settings.animation.bounce &&
    settings.animation.spin &&
    settings.animation.shake &&
    settings.animation.twitch;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-2">
          <h3 className="text-base font-semibold">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>

        {/* ---- Global enable (parent of everything) ---- */}
        <NestedToggle
          title={t("enabled.title")}
          description={t("enabled.description")}
          checked={settings.enabled}
          onCheckedChange={(v) => toggle("enabled", v)}
        >
          <div className="divide-y divide-border">
            <ToggleRow
              title={t("mention.title")}
              description={t("mention.description")}
              checked={settings.mention}
              onCheckedChange={(v) => toggle("mention", v)}
              icon={AtSign}
            />
            <ToggleRow
              title={t("hashtag.title")}
              description={t("hashtag.description")}
              checked={settings.hashtag}
              onCheckedChange={(v) => toggle("hashtag", v)}
              icon={Hash}
            />
            <ToggleRow
              title={t("url.title")}
              description={t("url.description")}
              checked={settings.url}
              onCheckedChange={(v) => toggle("url", v)}
              icon={Link2}
            />
            <ToggleRow
              title={t("link.title")}
              description={t("link.description")}
              checked={settings.link}
              onCheckedChange={(v) => toggle("link", v)}
              icon={ExternalLink}
            />
            <ToggleRow
              title={t("emojiCode.title")}
              description={t("emojiCode.description")}
              checked={settings.emojiCode}
              onCheckedChange={(v) => toggle("emojiCode", v)}
              icon={Smile}
            />
            <ToggleRow
              title={t("bold.title")}
              description={t("bold.description")}
              checked={settings.bold}
              onCheckedChange={(v) => toggle("bold", v)}
              icon={Bold}
            />
            <ToggleRow
              title={t("italic.title")}
              description={t("italic.description")}
              checked={settings.italic}
              onCheckedChange={(v) => toggle("italic", v)}
              icon={Italic}
            />
            <ToggleRow
              title={t("strike.title")}
              description={t("strike.description")}
              checked={settings.strike}
              onCheckedChange={(v) => toggle("strike", v)}
              icon={Strikethrough}
            />
            <ToggleRow
              title={t("small.title")}
              description={t("small.description")}
              checked={settings.small}
              onCheckedChange={(v) => toggle("small", v)}
              icon={MinusSquare}
            />
            <ToggleRow
              title={t("quote.title")}
              description={t("quote.description")}
              checked={settings.quote}
              onCheckedChange={(v) => toggle("quote", v)}
              icon={Quote}
            />
            <ToggleRow
              title={t("center.title")}
              description={t("center.description")}
              checked={settings.center}
              onCheckedChange={(v) => toggle("center", v)}
              icon={AlignCenter}
            />
            <ToggleRow
              title={t("ruby.title")}
              description={t("ruby.description")}
              checked={settings.ruby}
              onCheckedChange={(v) => toggle("ruby", v)}
              icon={Languages}
            />

            {/* ---- Code (nested) ---- */}
            <NestedToggle
              title={t("code.title")}
              description={t("code.description")}
              checked={codeAllOn}
              onCheckedChange={(v) => {
                toggleCode("inline", v);
                toggleCode("block", v);
              }}
              icon={Code}
            >
              <ToggleRow
                title={t("code.inline.title")}
                description={t("code.inline.description")}
                checked={settings.code.inline}
                onCheckedChange={(v) => toggleCode("inline", v)}
                icon={TerminalSquare}
              />
              <ToggleRow
                title={t("code.block.title")}
                description={t("code.block.description")}
                checked={settings.code.block}
                onCheckedChange={(v) => toggleCode("block", v)}
                icon={SquareCode}
              />
            </NestedToggle>

            <ToggleRow
              title={t("flip.title")}
              description={t("flip.description")}
              checked={settings.flip}
              onCheckedChange={(v) => toggle("flip", v)}
              icon={FlipHorizontal}
            />

            {/* ---- Font (nested) ---- */}
            <NestedToggle
              title={t("font.title")}
              description={t("font.description")}
              checked={fontAllOn}
              onCheckedChange={(v) => {
                toggleFont("serif", v);
                toggleFont("monospace", v);
                toggleFont("cursive", v);
                toggleFont("fantasy", v);
              }}
              icon={Type}
            >
              <ToggleRow
                title={t("font.serif.title")}
                description={t("font.serif.description")}
                checked={settings.font.serif}
                onCheckedChange={(v) => toggleFont("serif", v)}
              />
              <ToggleRow
                title={t("font.monospace.title")}
                description={t("font.monospace.description")}
                checked={settings.font.monospace}
                onCheckedChange={(v) => toggleFont("monospace", v)}
              />
              <ToggleRow
                title={t("font.cursive.title")}
                description={t("font.cursive.description")}
                checked={settings.font.cursive}
                onCheckedChange={(v) => toggleFont("cursive", v)}
              />
              <ToggleRow
                title={t("font.fantasy.title")}
                description={t("font.fantasy.description")}
                checked={settings.font.fantasy}
                onCheckedChange={(v) => toggleFont("fantasy", v)}
              />
            </NestedToggle>

            <ToggleRow
              title={t("blur.title")}
              description={t("blur.description")}
              checked={settings.blur}
              onCheckedChange={(v) => toggle("blur", v)}
              icon={EyeOff}
            />
            <ToggleRow
              title={t("search.title")}
              description={t("search.description")}
              checked={settings.search}
              onCheckedChange={(v) => toggle("search", v)}
              icon={Search}
            />
            <ToggleRow
              title={t("bg.title")}
              description={t("bg.description")}
              checked={settings.bg}
              onCheckedChange={(v) => toggle("bg", v)}
              icon={PaintBucket}
            />
            <ToggleRow
              title={t("fg.title")}
              description={t("fg.description")}
              checked={settings.fg}
              onCheckedChange={(v) => toggle("fg", v)}
              icon={Palette}
            />
            <ToggleRow
              title={t("border.title")}
              description={t("border.description")}
              checked={settings.border}
              onCheckedChange={(v) => toggle("border", v)}
              icon={Square}
            />
            <ToggleRow
              title={t("rotate.title")}
              description={t("rotate.description")}
              checked={settings.rotate}
              onCheckedChange={(v) => toggle("rotate", v)}
              icon={RotateCw}
            />
            <ToggleRow
              title={t("position.title")}
              description={t("position.description")}
              checked={settings.position}
              onCheckedChange={(v) => toggle("position", v)}
              icon={Move}
            />
            <ToggleRow
              title={t("scale.title")}
              description={t("scale.description")}
              checked={settings.scale}
              onCheckedChange={(v) => toggle("scale", v)}
              icon={Maximize}
            />

            {/* ---- Expand (nested) ---- */}
            <NestedToggle
              title={t("expand.title")}
              description={t("expand.description")}
              checked={settings.expand.allowLargerThanX2}
              onCheckedChange={(v) => toggleExpand("allowLargerThanX2", v)}
              icon={Expand}
            >
              <ToggleRow
                title={t("expand.allowLargerThanX2.title")}
                description={t("expand.allowLargerThanX2.description")}
                checked={settings.expand.allowLargerThanX2}
                onCheckedChange={(v) => toggleExpand("allowLargerThanX2", v)}
                icon={ChevronsUp}
              />
            </NestedToggle>

            {/* ---- Animation (nested) ---- */}
            <NestedToggle
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
              icon={Sparkles}
            >
              <ToggleRow
                title={t("animation.jelly.title")}
                description={t("animation.jelly.description")}
                checked={settings.animation.jelly}
                onCheckedChange={(v) => toggleAnimation("jelly", v)}
                icon={Zap}
              />
              <ToggleRow
                title={t("animation.tada.title")}
                description={t("animation.tada.description")}
                checked={settings.animation.tada}
                onCheckedChange={(v) => toggleAnimation("tada", v)}
                icon={PartyPopper}
              />
              <ToggleRow
                title={t("animation.jump.title")}
                description={t("animation.jump.description")}
                checked={settings.animation.jump}
                onCheckedChange={(v) => toggleAnimation("jump", v)}
                icon={ArrowUp}
              />
              <ToggleRow
                title={t("animation.bounce.title")}
                description={t("animation.bounce.description")}
                checked={settings.animation.bounce}
                onCheckedChange={(v) => toggleAnimation("bounce", v)}
                icon={CircleDot}
              />
              <ToggleRow
                title={t("animation.spin.title")}
                description={t("animation.spin.description")}
                checked={settings.animation.spin}
                onCheckedChange={(v) => toggleAnimation("spin", v)}
                icon={Loader}
              />
              <ToggleRow
                title={t("animation.shake.title")}
                description={t("animation.shake.description")}
                checked={settings.animation.shake}
                onCheckedChange={(v) => toggleAnimation("shake", v)}
                icon={ShieldAlert}
              />
              <ToggleRow
                title={t("animation.twitch.title")}
                description={t("animation.twitch.description")}
                checked={settings.animation.twitch}
                onCheckedChange={(v) => toggleAnimation("twitch", v)}
                icon={Activity}
              />
            </NestedToggle>

            <ToggleRow
              title={t("rainbow.title")}
              description={t("rainbow.description")}
              checked={settings.rainbow}
              onCheckedChange={(v) => toggle("rainbow", v)}
              icon={Rainbow}
            />
            <ToggleRow
              title={t("sparkle.title")}
              description={t("sparkle.description")}
              checked={settings.sparkle}
              onCheckedChange={(v) => toggle("sparkle", v)}
              icon={Sparkles}
            />
          </div>
        </NestedToggle>
      </CardContent>
    </Card>
  );
}
