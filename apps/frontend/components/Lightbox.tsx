"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { useTranslations } from "next-intl";
import Hammer from "@egjs/hammerjs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getBlurhashDataUrl } from "@/lib/blurhash";
import { pixelArtRendering } from "@/lib/media/display";
import {
  dismissProgress,
  resolveSwipe,
  rubberBand,
  swipeAxis,
  type SwipeIntent,
} from "@/lib/lightbox-swipe";
import {
  boxGeometry,
  containRect,
  containsPoint,
  type Rect,
} from "@/lib/lightbox-morph";
import {
  anchorPan,
  clampPan,
  clampScale,
  panLimit,
} from "@/lib/lightbox-zoom";
import { cn } from "@/lib/utils";

export interface LightboxItem {
  /** `video` is accepted by the type but not rendered yet — see the render switch. */
  type: "image" | "video";
  url: string;
  width?: number;
  height?: number;
  blurhash?: string | null;
  alt?: string;
}

interface LightboxProps {
  items: LightboxItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
  /**
   * Resolves the on-screen thumbnail for an item index. The lightbox grows out
   * of it on open and shrinks back into it on close. Returning null (scrolled
   * away, unmounted) simply skips the morph.
   */
  getSource?: (index: number) => HTMLElement | null;
  /**
   * The index the lightbox is currently showing, or null once it has let go.
   * The card hides that thumbnail so the same image is never painted twice.
   */
  onShownIndexChange?: (index: number | null) => void;
}

const clampIndex = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Floor for max zoom; raised per image so 1:1 pixels are always reachable. */
const MIN_MAX_SCALE = 4;
/** Travel before a drag counts as a swipe rather than a click. */
const MOVE_THRESHOLD = 8;
/** Window in which a second click counts as a double-click instead of a close. */
const DOUBLE_TAP_MS = 250;
/** Multiplier applied per wheel notch. */
const WHEEL_STEP = 1.25;
/** Shared easing: expo-out. Fast start, soft landing, no overshoot. */
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const SETTLE = { duration: 0.18, ease: EASE_OUT } as const;
const ZOOM_TWEEN = { duration: 0.16, ease: EASE_OUT } as const;
/** Above this, the image counts as zoomed and dragging pans instead of swipes. */
const ZOOM_EPSILON = 1.01;
/** Idle time before the control overlay fades out. */
const CONTROLS_HIDE_MS = 2500;
/** Open/close morph. Long enough to read as one continuous move. */
const MORPH = { duration: 0.28, ease: EASE_OUT } as const;
/** Breathing room between the fitted image and the viewport edge. */
const STAGE_PADDING = 8;
const NO_RADIUS = "0px 0px 0px 0px";

type Phase = "opening" | "open" | "closing";

/** The four corner radii of `el`, in the order framer-motion interpolates. */
function readRadius(el: Element): string {
  const s = getComputedStyle(el);
  return [
    s.borderTopLeftRadius,
    s.borderTopRightRadius,
    s.borderBottomRightRadius,
    s.borderBottomLeftRadius,
  ].join(" ");
}

/** The whole area an image may occupy. */
function stageBox(): Rect {
  return {
    x: STAGE_PADDING,
    y: STAGE_PADDING,
    width: window.innerWidth - STAGE_PADDING * 2,
    height: window.innerHeight - STAGE_PADDING * 2,
  };
}

/** Where the fitted image sits in the viewport, at rest. */
function fittedRect(natW: number, natH: number): Rect {
  return containRect(natW, natH, stageBox());
}

/** Centre of the stage, which is also the image box's transform origin. */
function stageCentre() {
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

/**
 * Natural pixel size, from the API metadata when we have it and the decoded
 * image otherwise. Without it there is no aspect ratio to morph towards.
 */
function naturalSize(
  item: LightboxItem | undefined,
  img: HTMLImageElement | null,
): { w: number; h: number } | null {
  if (item?.width && item.height) return { w: item.width, h: item.height };
  if (img?.naturalWidth && img.naturalHeight) {
    return { w: img.naturalWidth, h: img.naturalHeight };
  }
  return null;
}

/**
 * Controls sit over arbitrary imagery, so they keep one dark surface in every
 * theme rather than following `--background`.
 */
const CONTROL_SURFACE = "bg-black/60 text-white";
/**
 * Buttons sit on {@link CONTROL_SURFACE}, so hover has to *lighten* — darkening
 * black on black reads as no feedback at all.
 */
const CONTROL_HOVER =
  "text-white hover:bg-white/25 hover:text-white active:bg-white/35 focus-visible:ring-2 focus-visible:ring-white/70";
const ARROW_POSITION =
  "absolute top-1/2 hidden -translate-y-1/2 rounded-full p-1 sm:block";

export function Lightbox({
  items,
  open,
  onOpenChange,
  initialIndex = 0,
  getSource,
  onShownIndexChange,
}: LightboxProps) {
  const t = useTranslations("lightbox");
  const reduceMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const zoomedRef = useRef(false);
  /**
   * `opening` and `closing` hand the screen over to the morph layer: the stage
   * and the controls sit hidden behind it until the image has landed.
   */
  const [phase, setPhase] = useState<Phase>("opening");
  const phaseRef = useRef<Phase>("opening");
  const enterPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);
  const [loaded, setLoaded] = useState(false);
  const [maxScale, setMaxScale] = useState(MIN_MAX_SCALE);
  /** Scale at which the image renders at its natural pixel size (等倍). */
  const [naturalScale, setNaturalScale] = useState(1);

  const dotsRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  /**
   * The imperative listeners below attach to DOM nodes that live inside the
   * Radix portal, which mounts on a *later* commit than the `open` flip. An
   * effect keyed on `open` therefore runs while these are still null and never
   * runs again, so the node itself has to be the dependency.
   */
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const [dots, setDots] = useState<HTMLDivElement | null>(null);
  const attachStage = useCallback((node: HTMLDivElement | null) => {
    stageRef.current = node;
    setStage(node);
  }, []);
  const attachDots = useCallback((node: HTMLDivElement | null) => {
    dotsRef.current = node;
    setDots(node);
  }, []);

  const [showControls, setShowControls] = useState(true);
  const hideControlsRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Mirrors `showControls`. This runs on every pointermove, so it must not
   * call setState unless the value actually flips — re-rendering the tree at
   * pointer rate is what makes the overlay animation stutter.
   */
  const showControlsRef = useRef(true);

  /** Show the controls and restart the idle countdown. */
  const revealControls = useCallback(() => {
    if (!showControlsRef.current) {
      showControlsRef.current = true;
      setShowControls(true);
    }
    if (hideControlsRef.current) clearTimeout(hideControlsRef.current);
    hideControlsRef.current = setTimeout(() => {
      showControlsRef.current = false;
      setShowControls(false);
    }, CONTROLS_HIDE_MS);
  }, []);

  useEffect(() => {
    if (!open) return;
    revealControls();
    return () => {
      if (hideControlsRef.current) clearTimeout(hideControlsRef.current);
    };
  }, [open, revealControls]);

  const imgRef = useRef<HTMLImageElement | null>(null);

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const dismiss = useMotionValue(0);
  // Zoom layer, nested inside the swipe layer so a dismiss shrinks both.
  const panX = useMotionValue(0);
  const panY = useMotionValue(0);
  const zoom = useMotionValue(1);
  /**
   * The image box's geometry. Not a separate morph layer any more: this *is*
   * where the one <img> lives, so opening and closing move the real image
   * rather than handing off between two copies of it. Driven imperatively so
   * the animation never re-renders React.
   */
  const boxX = useMotionValue(0);
  const boxY = useMotionValue(0);
  const boxW = useMotionValue(0);
  const boxH = useMotionValue(0);
  const boxRadius = useMotionValue(NO_RADIUS);
  const boxRef = useRef<HTMLDivElement | null>(null);
  /**
   * True once the natural size is known and the box is sized to the fitted
   * rect, where `object-cover` and `object-contain` paint identically. Until
   * then the box spans the whole stage and the image is letterboxed inside it.
   */
  const [fitted, setFitted] = useState(false);
  const fittedRef = useRef(false);
  const markFitted = useCallback((next: boolean) => {
    fittedRef.current = next;
    setFitted(next);
  }, []);
  /** 0 while the morph is still travelling, 1 once the lightbox owns the screen. */
  const appear = useMotionValue(0);
  const backdropOpacity = useTransform(
    [dismiss, appear],
    ([d, a]: number[]) => (1 - d) * a,
  );
  const stageScale = useTransform(dismiss, [0, 1], [1, 0.6]);

  const maxIndex = Math.max(0, items.length - 1);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < maxIndex;
  const currentItem = items[currentIndex];
  /**
   * `currentIndex` is only synced to `initialIndex` by a passive effect, so on
   * the commit the portal mounts it can still hold the previous open's index.
   * The opening morph reads the clamped prop directly instead.
   */
  const openIndex = clampIndex(initialIndex, 0, maxIndex);

  /**
   * Latest render's volatile values, for the Hammer handlers. Reading these
   * through a ref keeps the callbacks stable, so the Manager is created once
   * per open rather than being destroyed and rebuilt mid-gesture whenever the
   * index or the measured scale changes.
   */
  const latest = useRef({
    hasPrev,
    hasNext,
    maxIndex,
    maxScale,
    naturalScale,
    index: currentIndex,
    item: currentItem,
    getSource,
    reduce: !!reduceMotion,
  });
  latest.current = {
    hasPrev,
    hasNext,
    maxIndex,
    maxScale,
    naturalScale,
    index: currentIndex,
    item: currentItem,
    getSource,
    reduce: !!reduceMotion,
  };

  /** Put the box exactly on a viewport rect, without animating. */
  const parkBox = useCallback(
    (rect: Rect, radius: string) => {
      const geometry = boxGeometry(rect, stageCentre());
      boxX.set(geometry.x);
      boxY.set(geometry.y);
      boxW.set(geometry.width);
      boxH.set(geometry.height);
      boxRadius.set(radius);
    },
    [boxX, boxY, boxW, boxH, boxRadius],
  );

  /**
   * Park the box at its resting geometry for the current image.
   *
   * With a known natural size that is the fitted rect, where the box aspect
   * equals the image aspect and `object-cover` paints exactly what
   * `object-contain` would. Without one there is nothing to fit to, so the box
   * spans the stage and the image letterboxes inside it instead — the painted
   * pixels land in the same place either way, so the switch is invisible.
   */
  const restBox = useCallback(() => {
    const size = naturalSize(latest.current.item, imgRef.current);
    parkBox(size ? fittedRect(size.w, size.h) : stageBox(), NO_RADIUS);
    markFitted(!!size);
  }, [parkBox, markFitted]);

  /** Fly the box to a viewport rect, fading the backdrop to `dim` alongside. */
  const flyBox = useCallback(
    (rect: Rect, radius: string, dim: 0 | 1, onComplete: () => void) => {
      const geometry = boxGeometry(rect, stageCentre());
      animate(boxX, geometry.x, MORPH);
      animate(boxY, geometry.y, MORPH);
      animate(boxW, geometry.width, MORPH);
      animate(boxH, geometry.height, MORPH);
      animate(boxRadius, radius, MORPH);
      animate(appear, dim, { ...MORPH, onComplete });
    },
    [boxX, boxY, boxW, boxH, boxRadius, appear],
  );

  const resetDrag = useCallback(() => {
    dragX.set(0);
    dragY.set(0);
    dismiss.set(0);
  }, [dragX, dragY, dismiss]);

  const resetZoom = useCallback(
    (animated = true) => {
      if (!animated) {
        zoom.set(1);
        panX.set(0);
        panY.set(0);
        return;
      }
      animate(zoom, 1, ZOOM_TWEEN);
      animate(panX, 0, ZOOM_TWEEN);
      animate(panY, 0, ZOOM_TWEEN);
    },
    [zoom, panX, panY],
  );

  /** Mirror the zoom motion value into React state, only on threshold flips. */
  useEffect(
    () =>
      zoom.on("change", (value) => {
        const next = value > ZOOM_EPSILON;
        if (zoomedRef.current === next) return;
        zoomedRef.current = next;
        setZoomed(next);
      }),
    [zoom],
  );

  /**
   * Once per open, latched rather than keyed on the dependency list: this
   * rewinds the whole session, so a parent handing over a fresh callback
   * identity mid-flight must not be able to run it again and drag the lightbox
   * back to its opening state.
   */
  const openedRef = useRef(false);
  useEffect(() => {
    if (!open) {
      openedRef.current = false;
      return;
    }
    if (items.length === 0) {
      onOpenChange(false);
      return;
    }
    if (openedRef.current) return;
    openedRef.current = true;
    setCurrentIndex(clampIndex(initialIndex, 0, maxIndex));
    enterPhase("opening");
    markFitted(false);
    appear.set(0);
    resetDrag();
    // Reopening on the same index does not re-run the per-index effect, so the
    // zoom has to be dropped here too or it carries over from last time.
    resetZoom(false);
  }, [
    open,
    items.length,
    initialIndex,
    maxIndex,
    onOpenChange,
    resetDrag,
    resetZoom,
    enterPhase,
    markFitted,
    appear,
  ]);

  // Each image starts fresh, with no carried-over zoom or pan. The measured
  // scale and load state belong to the <img> element and are reset by its ref
  // callback, which runs before this effect.
  useEffect(() => {
    resetZoom(false);
    // Skipped while opening: the morph owns the box until it lands, and it has
    // already told the card which thumbnail to hide.
    if (phaseRef.current !== "open") return;
    restBox();
    onShownIndexChange?.(currentIndex);
  }, [currentIndex, resetZoom, restBox, onShownIndexChange]);

  /**
   * The resting size is measured from the viewport, so it has to be remeasured
   * when the viewport changes. `object-contain` used to do this for free.
   */
  useEffect(() => {
    if (phase !== "open") return;
    const onResize = () => restBox();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [phase, restBox]);

  const goTo = useCallback(
    (delta: number) => {
      setCurrentIndex((prev) =>
        clampIndex(prev + delta, 0, latest.current.maxIndex),
      );
      resetDrag();
      revealControls();
    },
    [resetDrag, revealControls],
  );

  // Warm the neighbours so swiping does not land on a blank frame.
  useEffect(() => {
    if (!open) return;
    for (const index of [currentIndex - 1, currentIndex + 1]) {
      const neighbour = items[index];
      if (neighbour?.type !== "image") continue;
      const img = new window.Image();
      img.src = neighbour.url;
    }
  }, [open, currentIndex, items]);

  /**
   * Jump to any index and slide the new image in from the side it came from.
   * Unlike the swipe commit this sets the index synchronously, so repeated
   * calls while scrubbing the dot strip can never desync from the animation.
   */
  const slideInFrom = useCallback(
    (index: number) => {
      revealControls();
      const target = clampIndex(index, 0, latest.current.maxIndex);
      if (target === latest.current.index) return;

      const direction = target > latest.current.index ? 1 : -1;
      setCurrentIndex(target);
      resetZoom(false);
      dragY.set(0);
      dismiss.set(0);

      const width = stageRef.current?.getBoundingClientRect().width ?? 0;
      dragX.set(direction * width);
      if (width) animate(dragX, 0, SETTLE);
    },
    [dragX, dragY, dismiss, resetZoom, revealControls],
  );

  /** Map a viewport x within the dot strip to an index, and go there. */
  const scrubDots = useCallback(
    (clientX: number) => {
      const rect = dotsRef.current?.getBoundingClientRect();
      if (!rect?.width) return;
      const ratio = (clientX - rect.left) / rect.width;
      slideInFrom(Math.floor(ratio * (latest.current.maxIndex + 1)));
    },
    [slideInFrom],
  );

  const settle = useCallback(() => {
    animate(dragX, 0, SETTLE);
    animate(dragY, 0, SETTLE);
    animate(dismiss, 0, SETTLE);
  }, [dragX, dragY, dismiss]);


  /**
   * Close by flying the image back into its thumbnail.
   *
   * Radix drops the content the instant `open` goes false — there is no exit
   * animation to wait on, since `tailwindcss-animate` is not installed — so the
   * parent is only told once the morph has landed.
   */
  const requestClose = useCallback(() => {
    if (phaseRef.current === "closing") return;
    const close = () => onOpenChange(false);

    const { index, item, getSource: resolve, reduce } = latest.current;
    const source = resolve?.(index) ?? null;
    // Unfitted, the box still spans the stage with the image letterboxed inside
    // it, so shrinking it would drag that empty margin along. Just close.
    if (reduce || !source || !fittedRef.current || item?.type === "video") {
      close();
      return;
    }

    const to = source.getBoundingClientRect();
    if (!to.width || !to.height) {
      close();
      return;
    }

    // The box's target is a viewport rect, but the box lives inside the swipe
    // and zoom layers. Rather than snapping those to identity first — which
    // would keep the box's size but hand `object-cover` a different slice of a
    // zoomed image, so the crop would jump — run them down to identity on the
    // same curve. Nothing moves discontinuously: the first frame is exactly
    // what was on screen, and by the last one every ancestor is neutral, so the
    // box has landed on the thumbnail rect for real.
    animate(dragX, 0, MORPH);
    animate(dragY, 0, MORPH);
    animate(dismiss, 0, MORPH);
    animate(panX, 0, MORPH);
    animate(panY, 0, MORPH);
    animate(zoom, 1, MORPH);
    enterPhase("closing");

    flyBox(to, readRadius(source), 0, close);
  }, [
    onOpenChange,
    enterPhase,
    flyBox,
    dragX,
    dragY,
    dismiss,
    panX,
    panY,
    zoom,
  ]);

  /**
   * Grow out of the thumbnail on open.
   *
   * Keyed on the `stage` node, not on `open`: the Radix portal mounts a commit
   * later than the flip, and the fitted rect can only be measured once the
   * viewport-sized stage exists.
   */
  useEffect(() => {
    if (!stage || phaseRef.current !== "opening") return;

    const reveal = () => {
      restBox();
      appear.set(1);
      enterPhase("open");
      onShownIndexChange?.(openIndex);
    };

    const item = items[openIndex];
    const size = naturalSize(item, imgRef.current);
    const source = getSource?.(openIndex) ?? null;
    const from = source?.getBoundingClientRect();
    if (reduceMotion || !source || !from?.width || !size || item?.type === "video") {
      reveal();
      return;
    }

    parkBox(from, readRadius(source));
    markFitted(true);
    // Only now is the image sitting on the thumbnail, so this is the moment the
    // card can hide its copy without a hole showing.
    onShownIndexChange?.(openIndex);
    flyBox(fittedRect(size.w, size.h), NO_RADIUS, 1, () => enterPhase("open"));
  }, [
    stage,
    items,
    openIndex,
    getSource,
    onShownIndexChange,
    reduceMotion,
    enterPhase,
    parkBox,
    flyBox,
    restBox,
    markFitted,
    appear,
  ]);

  /**
   * Zoom to `target`, keeping the point under the cursor fixed. Offsets are
   * measured from the stage centre because that is where framer-motion applies
   * `scale` from.
   */
  const zoomAt = useCallback(
    (clientX: number, clientY: number, target: number) => {
      const stage = stageRef.current;
      if (!stage) return;

      const next = clampScale(target, latest.current.maxScale);
      const base = zoom.get();
      if (Math.abs(next - base) < 0.001) return;

      const rect = stage.getBoundingClientRect();
      const cx = clientX - (rect.left + rect.width / 2);
      const cy = clientY - (rect.top + rect.height / 2);

      animate(zoom, next, ZOOM_TWEEN);
      animate(
        panX,
        clampPan(anchorPan(cx, panX.get(), base, next), rect.width, next),
        ZOOM_TWEEN,
      );
      animate(
        panY,
        clampPan(anchorPan(cy, panY.get(), base, next), rect.height, next),
        ZOOM_TWEEN,
      );
    },
    [zoom, panX, panY],
  );

  /** Toggle between fit and natural pixel size. */
  const toggleZoom = useCallback(
    (clientX: number, clientY: number) => {
      if (zoom.get() > ZOOM_EPSILON) {
        resetZoom();
        return;
      }
      // A small image is already at natural size once fitted, so fall back to a
      // plain 2x magnify to keep the gesture meaningful.
      zoomAt(clientX, clientY, Math.max(latest.current.naturalScale, 2));
    },
    [zoom, zoomAt, resetZoom],
  );

  /** Step the zoom about the middle of the stage, for buttons and keys. */
  const zoomFromCentre = useCallback(
    (factor: number) => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;
      zoomAt(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        zoom.get() * factor,
      );
    },
    [zoom, zoomAt],
  );

  const commitSwipe = useCallback(
    (intent: SwipeIntent, width: number) => {
      if (intent === "dismiss") {
        requestClose();
        return;
      }
      if (intent === "prev" || intent === "next") {
        // Slide the current image out, swap while both positions are
        // off-screen, then slide the new one in from the opposite edge, so the
        // old image never flashes back at centre.
        const direction = intent === "prev" ? 1 : -1;
        animate(dragX, direction * width, {
          ...SETTLE,
          onComplete: () => {
            setCurrentIndex((prev) =>
              clampIndex(prev - direction, 0, latest.current.maxIndex),
            );
            dragX.set(-direction * width);
            animate(dragX, 0, SETTLE);
          },
        });
        return;
      }
      settle();
    },
    [dragX, requestClose, settle],
  );

  /** Page by one, with the same slide a swipe produces. */
  const slideTo = useCallback(
    (delta: number) => {
      revealControls();
      const width = stageRef.current?.getBoundingClientRect().width ?? 0;
      const blocked =
        delta < 0 ? !latest.current.hasPrev : !latest.current.hasNext;
      if (blocked) return;
      if (!width) {
        goTo(delta);
        return;
      }
      commitSwipe(delta < 0 ? "prev" : "next", width);
    },
    [commitSwipe, goTo, revealControls],
  );

  /**
   * All touch and mouse gesture detection. One Hammer manager owns pan, pinch,
   * tap and double-tap, so a single place decides what a gesture means. The
   * previous split between hand-rolled pointer handlers and a zoom library is
   * what produced the pointer-capture and z-order bugs this replaces.
   */
  useEffect(() => {
    if (!stage) return;

    const mc = new Hammer.Manager(stage, { touchAction: "none" });
    mc.add(
      new Hammer.Pan({
        direction: Hammer.DIRECTION_ALL,
        threshold: MOVE_THRESHOLD,
      }),
    );
    mc.add(new Hammer.Pinch());
    // One Tap recognizer, dispatching on `tapCount`. Two recognizers linked by
    // `requireFailure` would make *every* tap wait out the double-tap window
    // before emitting, which is felt as lag when tapping to unzoom.
    mc.add(new Hammer.Tap({ interval: DOUBLE_TAP_MS }));
    mc.get("pinch").recognizeWith("pan");

    // Per-gesture state, scoped to this manager.
    let axis: "x" | "y" | null = null;
    let panningZoomed = false;
    let pinching = false;
    let startPanX = 0;
    let startPanY = 0;
    let startZoom = 1;
    let stageW = 0;
    let stageH = 0;
    let closeTimer: ReturnType<typeof setTimeout> | null = null;

    const measure = () => {
      const rect = stage.getBoundingClientRect();
      stageW = rect.width;
      stageH = rect.height;
      return rect;
    };

    mc.on("panstart", (event) => {
      revealControls();
      if (pinching) return;
      measure();
      panningZoomed = zoom.get() > ZOOM_EPSILON;
      startPanX = panX.get();
      startPanY = panY.get();
      axis = panningZoomed ? null : swipeAxis(event.deltaX, event.deltaY);
    });

    mc.on("panmove", (event) => {
      revealControls();
      if (pinching) return;

      if (panningZoomed) {
        const scale = zoom.get();
        panX.set(clampPan(startPanX + event.deltaX, stageW, scale));
        panY.set(clampPan(startPanY + event.deltaY, stageH, scale));
        return;
      }

      if (!axis) axis = swipeAxis(event.deltaX, event.deltaY);
      if (axis === "x") {
        const blocked =
          (event.deltaX > 0 && !latest.current.hasPrev) ||
          (event.deltaX < 0 && !latest.current.hasNext);
        dragX.set(blocked ? rubberBand(event.deltaX) : event.deltaX);
      } else {
        // Free in both directions: up dismisses just like down.
        dragY.set(event.deltaY);
        dismiss.set(dismissProgress(event.deltaY, stageH));
      }
    });

    mc.on("panend", (event) => {
      if (pinching || panningZoomed) {
        panningZoomed = false;
        return;
      }
      if (!axis) return;
      axis = null;

      commitSwipe(
        resolveSwipe({
          dx: event.deltaX,
          dy: event.deltaY,
          // Hammer reports px/ms with the same sign as the travel, which is
          // what the direction-agreement check in resolveSwipe expects.
          vx: event.velocityX,
          vy: event.velocityY,
          width: stageW,
          height: stageH,
          hasPrev: latest.current.hasPrev,
          hasNext: latest.current.hasNext,
        }),
        stageW,
      );
    });

    mc.on("pancancel", () => {
      axis = null;
      panningZoomed = false;
      settle();
    });

    mc.on("pinchstart", () => {
      revealControls();
      measure();
      // A pinch supersedes whatever swipe the first finger had started.
      pinching = true;
      axis = null;
      panningZoomed = false;
      settle();
      startZoom = zoom.get();
      startPanX = panX.get();
      startPanY = panY.get();
    });

    mc.on("pinchmove", (event) => {
      const rect = measure();
      const next = clampScale(startZoom * event.scale, latest.current.maxScale);
      const cx = event.center.x - (rect.left + rect.width / 2);
      const cy = event.center.y - (rect.top + rect.height / 2);
      zoom.set(next);
      panX.set(
        clampPan(anchorPan(cx, startPanX, startZoom, next), stageW, next),
      );
      panY.set(
        clampPan(anchorPan(cy, startPanY, startZoom, next), stageH, next),
      );
    });

    mc.on("pinchend pinchcancel", () => {
      pinching = false;
      const scale = zoom.get();
      // Shrinking can leave the pan outside the now-smaller bounds.
      if (panLimit(stageW, scale) < Math.abs(panX.get())) {
        animate(panX, clampPan(panX.get(), stageW, scale), ZOOM_TWEEN);
      }
      if (panLimit(stageH, scale) < Math.abs(panY.get())) {
        animate(panY, clampPan(panY.get(), stageH, scale), ZOOM_TWEEN);
      }
    });

    mc.on("tap", (event) => {
      revealControls();
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }

      if ((event.tapCount ?? 1) >= 2) {
        toggleZoom(event.center.x, event.center.y);
        return;
      }
      // Zoomed, a tap and a double-tap both mean "back to fit", so there is
      // nothing to disambiguate and no reason to wait.
      if (zoom.get() > ZOOM_EPSILON) {
        resetZoom();
        return;
      }
      // Off the image there is nothing a second tap could zoom, so close at
      // once — waiting out the double-tap window there just reads as lag.
      //
      // `event.target` cannot answer this: the <img> fills its box, and while
      // the natural size is unknown that box spans the whole stage with the
      // image letterboxed inside it. Hit test the box's own rect, which is the
      // painted rect once fitted and is measured live, so it stays correct
      // mid-zoom and mid-swipe too.
      const painted = fittedRef.current
        ? boxRef.current?.getBoundingClientRect()
        : null;
      if (painted && !containsPoint(painted, event.center.x, event.center.y)) {
        requestClose();
        return;
      }
      // On the image, hold the close just long enough for a second tap to
      // arrive and mean "zoom in" instead.
      closeTimer = setTimeout(requestClose, DOUBLE_TAP_MS);
    });

    return () => {
      if (closeTimer) clearTimeout(closeTimer);
      mc.destroy();
    };
  }, [
    stage,
    zoom,
    resetZoom,
    panX,
    panY,
    dragX,
    dragY,
    dismiss,
    settle,
    commitSwipe,
    toggleZoom,
    revealControls,
    requestClose,
  ]);

  /**
   * Hammer only binds `pointerdown` on the element, so it reports nothing for a
   * bare mouse move. The controls need their own listener or, once faded out,
   * they could only ever come back by pressing a button.
   */
  useEffect(() => {
    if (!stage) return;

    const wake = () => revealControls();
    stage.addEventListener("pointermove", wake);
    stage.addEventListener("pointerdown", wake);
    return () => {
      stage.removeEventListener("pointermove", wake);
      stage.removeEventListener("pointerdown", wake);
    };
  }, [stage, revealControls]);

  /** The dot strip doubles as a scrubber. */
  useEffect(() => {
    if (!dots) return;

    const mc = new Hammer.Manager(dots, { touchAction: "none" });
    mc.add(
      new Hammer.Pan({ direction: Hammer.DIRECTION_HORIZONTAL, threshold: 0 }),
    );
    mc.add(new Hammer.Tap());
    mc.on("panstart panmove tap", (event) => scrubDots(event.center.x));

    return () => mc.destroy();
  }, [dots, scrubDots]);

  const measureImage = useCallback(
    (img: HTMLImageElement) => {
      setLoaded(true);
      if (!img.naturalWidth || !img.naturalHeight) return;
      // Straight from the fitted rect rather than the element's client size:
      // `load` can beat layout, and a 0-wide element used to abandon the
      // measurement and leave the zoom capped at the default.
      //
      // natural < 1 means the image was scaled *up* to fill the stage, so 1:1
      // sits below the fitted size and toggleZoom falls back to a magnify.
      const natural =
        img.naturalWidth / fittedRect(img.naturalWidth, img.naturalHeight).width;
      setNaturalScale(natural);
      setMaxScale(Math.max(MIN_MAX_SCALE, natural));
      // A late `load` on an item whose size the API did not carry: the box is
      // still spanning the stage, so settle it onto the real fitted rect. Only
      // while at rest — the morph and any live gesture own the box otherwise.
      if (!fittedRef.current && phaseRef.current === "open") restBox();
    },
    [restBox],
  );

  /**
   * The <img> is keyed per item, so this runs for every image. It deliberately
   * leaves `fitted` alone: that describes the box's geometry, which `restBox`
   * owns, and clearing it here would race the opening morph.
   *
   * Measuring here
   * rather than waiting for `load` is what stops the blurhash from flashing:
   * a cached or preloaded image is already complete when it mounts, and this
   * callback runs in the commit phase, so the state lands before paint.
   */
  const attachImage = useCallback(
    (node: HTMLImageElement | null) => {
      imgRef.current = node;
      if (!node) return;
      if (node.complete && node.naturalWidth) {
        measureImage(node);
        return;
      }
      setLoaded(false);
      setMaxScale(MIN_MAX_SCALE);
      setNaturalScale(1);
    },
    [measureImage],
  );

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      revealControls();
      switch (event.key) {
        case "ArrowLeft":
          slideTo(-1);
          break;
        case "ArrowRight":
          slideTo(1);
          break;
        case "+":
        case "=":
          zoomFromCentre(WHEEL_STEP);
          break;
        case "-":
          zoomFromCentre(1 / WHEEL_STEP);
          break;
        case "0":
          resetZoom();
          break;
        default:
          return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, slideTo, revealControls, zoomFromCentre, resetZoom]);

  useEffect(() => {
    if (!stage) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      revealControls();
      const current = zoom.get();
      zoomAt(
        event.clientX,
        event.clientY,
        event.deltaY < 0 ? current * WHEEL_STEP : current / WHEEL_STEP,
      );
    };

    // Must be non-passive to preventDefault, which React's onWheel cannot
    // guarantee — and the browser would otherwise scroll the page behind.
    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => stage.removeEventListener("wheel", handleWheel);
  }, [stage, zoom, zoomAt, revealControls]);

  /** Chrome stays out of the way until the morph has landed. */
  const controlsVisible = showControls && phase === "open";
  /** Controls only take clicks while they are actually visible. */
  const interactive = controlsVisible ? "pointer-events-auto" : "";
  /**
   * Paging chrome is meaningless while zoomed — arrows and dots move between
   * images, which is not what a zoomed-in user is doing — so it fades out and
   * leaves only the top-right controls, which are how you zoom back out.
   */
  const navigable = controlsVisible && !zoomed;
  const navigableInteractive = navigable ? "pointer-events-auto" : "";

  const blurhashUrl = useMemo(
    () => (loaded ? null : getBlurhashDataUrl(currentItem?.blurhash)),
    [loaded, currentItem?.blurhash],
  );

  if (items.length === 0 || !currentItem) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}
    >
      <DialogContent
        // Radix's own overlay dims too, but nothing drives its opacity, so it
        // would snap in and out around the morph. One dim layer only: the
        // backdrop below carries the whole /85 and fades with the image.
        overlayClassName="bg-transparent"
        className="!fixed !inset-0 !h-screen !w-screen !max-w-none !translate-x-0 !translate-y-0 !rounded-none !border-0 !bg-transparent !p-0 [&>button]:hidden"
      >
        <DialogTitle className="sr-only">{t("title")}</DialogTitle>
        {/* Dim only, and a sibling rather than the parent of everything: the
            image has to stay opaque while this fades out from under it. */}
        <motion.div
          className="absolute inset-0 bg-black/85"
          style={{ opacity: backdropOpacity }}
        />
        {/* Whole control overlay fades out while idle. `pointer-events-none`
            follows the fade so invisible controls cannot swallow a click. */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 ease-out",
            controlsVisible ? "opacity-100" : "opacity-0",
          )}
        >
          {/* Two pills, not one: zooming and closing are unrelated actions, and
              sharing a surface made the × read as part of the zoom group. */}
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-0.5 rounded-full p-1",
                CONTROL_SURFACE,
                interactive,
              )}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => zoomFromCentre(1 / WHEEL_STEP)}
                className={cn("h-8 w-8 rounded-full", CONTROL_HOVER)}
                aria-label={t("zoomOut")}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => zoomFromCentre(WHEEL_STEP)}
                className={cn("h-8 w-8 rounded-full", CONTROL_HOVER)}
                aria-label={t("zoomIn")}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
            </div>
            <div className={cn("rounded-full p-1", CONTROL_SURFACE, interactive)}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={requestClose}
                className={cn("h-8 w-8 rounded-full", CONTROL_HOVER)}
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-300 ease-out",
              navigable ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            {/* Always rendered, even at the ends. Using the `disabled` attribute
                would pull in `disabled:pointer-events-none` from the button
                style, and the click would fall through to the stage below and
                close the lightbox — easy to hit when clicking through fast. */}
            {items.length > 1 &&
              (
                [
                  { side: "left-3", active: hasPrev, delta: -1, label: t("previous"), Icon: ChevronLeft },
                  { side: "right-3", active: hasNext, delta: 1, label: t("next"), Icon: ChevronRight },
                ] as const
              ).map(({ side, active, delta, label, Icon }) => (
                <div
                  key={side}
                  className={cn(ARROW_POSITION, CONTROL_SURFACE, side, navigableInteractive)}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => (active ? slideTo(delta) : revealControls())}
                    aria-disabled={!active}
                    aria-label={label}
                    className={cn(
                      "h-9 w-9 rounded-full",
                      active
                        ? CONTROL_HOVER
                        : "cursor-default text-white/35 hover:bg-transparent hover:text-white/35",
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </Button>
                </div>
              ))}

            {items.length > 1 && (
              <div
                ref={attachDots}
                className={cn(
                  "absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center rounded-full px-2 py-1",
                  "cursor-ew-resize",
                  navigableInteractive,
                  // Slides up from below the viewport edge in step with the fade.
                  "transition-transform duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] [will-change:transform]",
                  navigable ? "translate-y-0" : "translate-y-[calc(100%+1rem)]",
                  CONTROL_SURFACE,
                )}
                style={{ touchAction: "none" }}
                aria-label={t("title")}
              >
                {/* The dot is a small visual inside a generous hit box; gaps and
                    padding between them are covered by the strip's own scrub
                    handlers, so the whole pill is draggable. */}
                {items.map((item, index) => (
                  <button
                    key={`${item.url}-${index}`}
                    type="button"
                    onClick={() => slideInFrom(index)}
                    aria-label={String(index + 1)}
                    aria-current={index === currentIndex}
                    className="group flex h-7 cursor-ew-resize items-center justify-center rounded-full px-1 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
                  >
                    <span
                      className={cn(
                        // Width, not scale, so the active dot reads as a pill. Hover
                        // only changes opacity: resizing on hover would compete
                        // with the active indicator.
                        "h-2 rounded-full bg-white transition-[width,opacity] duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
                        index === currentIndex
                          ? "w-5 opacity-100"
                          : "w-2 opacity-40 group-hover:opacity-80",
                      )}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          </div>

          <div
            ref={attachStage}
            className={cn(
              "absolute inset-0 overscroll-contain",
              // The morph is the image moving, not an overlay, so the stage
              // stays visible throughout — it just does not take gestures.
              phase !== "open" && "pointer-events-none",
            )}
            style={{ touchAction: "none" }}
          >
            {/* Swipe layer: horizontal paging and swipe-to-dismiss. */}
            <motion.div
              className="h-full w-full"
              style={{ x: dragX, y: dragY, scale: stageScale }}
            >
              {/* Zoom layer, nested so a dismiss shrinks the zoomed image too. */}
              <motion.div
                className="flex h-full w-full items-center justify-center"
                style={{ x: panX, y: panY, scale: zoom }}
              >
                  {/* ponytail: images only for now. Video preview is typed but not
                      implemented — add a <VideoPlayer> branch here, and drop the
                      `type !== "video"` filter in PostCard, when it lands. */}
                  {currentItem.type === "video" ? null : (
                    // The image box. Its geometry *is* the morph: it starts on
                    // the card thumbnail and grows to the fitted rect, so the
                    // one <img> below travels rather than handing off to a copy.
                    <motion.div
                      ref={boxRef}
                      className="overflow-hidden"
                      style={{
                        x: boxX,
                        y: boxY,
                        width: boxW,
                        height: boxH,
                        borderRadius: boxRadius,
                      }}
                    >
                      <img
                        key={currentItem.url}
                        ref={attachImage}
                        src={currentItem.url}
                        alt={currentItem.alt || t("imageAlt")}
                        draggable={false}
                        onLoad={(event) => measureImage(event.currentTarget)}
                        className={cn(
                          "h-full w-full select-none",
                          // Cover once the box carries the image's own aspect,
                          // which is what unwinds the card's crop on the way
                          // out; contain only while the box still spans the
                          // stage because the natural size is unknown.
                          fitted ? "object-cover" : "object-contain",
                          // Fitted, a click closes rather than zooms — only the
                          // zoomed state earns a magnifier.
                          zoomed
                            ? "cursor-zoom-out active:cursor-grabbing"
                            : "cursor-default",
                        )}
                        style={{
                          // Zooming is exactly where interpolation ruins pixel art.
                          imageRendering: pixelArtRendering(currentItem.width),
                          backgroundImage: blurhashUrl
                            ? `url(${blurhashUrl})`
                            : undefined,
                          backgroundSize: fitted ? "cover" : "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center",
                        }}
                      />
                    </motion.div>
                  )}
              </motion.div>
            </motion.div>
          </div>
      </DialogContent>
    </Dialog>
  );
}
