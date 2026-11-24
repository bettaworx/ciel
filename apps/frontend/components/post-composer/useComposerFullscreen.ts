import { useState } from "react";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

/** Mobile L: the composer dialog is always fullscreen at or below this width. */
const FORCED_FULLSCREEN_QUERY = "(max-width: 425px)";

export function useComposerFullscreen() {
  const [enabled, setEnabled] = useState(false);
  const forced = useMediaQuery(FORCED_FULLSCREEN_QUERY);

  return {
    fullscreen: forced || enabled,
    /** Undefined when forced, so the toggle is not rendered. */
    onFullscreenToggle: forced ? undefined : () => setEnabled((v) => !v),
  };
}
