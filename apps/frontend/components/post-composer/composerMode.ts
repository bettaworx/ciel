export type ComposerMode = "text" | "drawing";

export function shouldShowComposerModeSwitch(
  mode: ComposerMode,
  content: string,
  hasMedia: boolean,
) {
  return mode === "drawing" || (content.length === 0 && !hasMedia);
}
