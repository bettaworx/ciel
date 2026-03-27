"use client";

import {
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useId,
} from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Gauge,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAtom } from "jotai";
import { cn } from "@/lib/utils";
import {
  videoVolumeAtom,
  claimPlayback,
  releasePlayback,
} from "@/atoms/video-player";

interface VideoPlayerProps {
  src: string;
  width: number;
  height: number;
  poster?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

function getMimeType(url: string): string {
  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase();
  switch (ext) {
    case "webm":
      return "video/webm";
    case "ogg":
    case "ogv":
      return "video/ogg";
    case "m3u8":
      return "application/x-mpegURL";
    case "mp4":
    default:
      return "video/mp4";
  }
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/** Detect touch-primary device (mobile/tablet) */
function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(
      typeof window !== "undefined" &&
        window.matchMedia("(pointer: coarse)").matches,
    );
  }, []);
  return isTouch;
}

export function VideoPlayer({
  src,
  width,
  height,
  poster,
  className,
  style,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const volumeAreaRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);

  // Ref copy of showControls so click/touch handlers always see the latest
  // value without needing to be recreated on every render.
  const showControlsRef = useRef(true);

  // Stable identity for the playback manager
  const playerId = useId();

  const isTouchDevice = useIsTouchDevice();
  const t = useTranslations("videoPlayer");

  // Whether the user has explicitly interacted with audio controls.
  // Once true, auto-unmute on pause→play is skipped because the user
  // has already expressed their intent regarding audio.
  const hasUserInteracted = useRef(false);

  // Whether the user has manually paused this video. When true the
  // IntersectionObserver will NOT auto-resume playback.
  const userPaused = useRef(false);

  // Track fullscreen state in a ref so the IntersectionObserver callback
  // (which captures the ref) always sees the latest value without needing
  // to re-create the observer on every fullscreen toggle.
  const isFullscreenRef = useRef(false);

  // Long press (2x speed) refs
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressingRef = useRef(false);
  const touchStartPosRef = useRef({ x: 0, y: 0 });

  // Suppress onClick after touch-handled events (long press, double tap)
  const touchHandledRef = useRef(false);

  // Double-tap seek state
  const tapStateRef = useRef<{
    lastTime: number;
    lastSide: "left" | "right" | null;
    totalSeeked: number;
    displayTimer: ReturnType<typeof setTimeout> | null;
    singleTapTimer: ReturnType<typeof setTimeout> | null;
    animKey: number;
  }>({
    lastTime: 0,
    lastSide: null,
    totalSeeked: 0,
    displayTimer: null,
    singleTapTimer: null,
    animKey: 0,
  });

  // Persisted volume (shared across all VideoPlayer instances)
  const [savedVolume, setSavedVolume] = useAtom(videoVolumeAtom);

  // Start paused — the IntersectionObserver will auto-play when
  // the video scrolls into the center of the viewport.
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  showControlsRef.current = showControls;
  const [isHovering, setIsHovering] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  // Relative drag: start position and value recorded on pointer-down (touch only)
  const progressDragStartRef = useRef({ x: 0, value: 0 });
  const volumeDragStartRef = useRef({ x: 0, value: 0 });
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);

  // Mobile: whether the volume slider is explicitly shown (toggled by tap)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Long press 2x speed overlay
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Seek indicator overlay (double tap)
  const [seekOverlay, setSeekOverlay] = useState<{
    side: "left" | "right";
    seconds: number;
    key: number;
  } | null>(null);

  // Controls whether the video src is loaded. Cleared when far off-screen to
  // release the video buffer; restored when re-entering the load zone.
  const [activeSrc, setActiveSrc] = useState(src);
  // Ref copy so effect callbacks always see the latest value without needing
  // to re-create the observer on every activeSrc change.
  const activeSrcRef = useRef(activeSrc);
  activeSrcRef.current = activeSrc;

  // -----------------------------------------------------------------------
  // Helpers: restore saved volume onto the <video> element
  // -----------------------------------------------------------------------
  const restoreSavedVolume = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = savedVolume;
    videoRef.current.muted = false;
    setVolume(savedVolume);
    setIsMuted(false);
  }, [savedVolume]);

  // Stable ref so setTimeout callbacks always call the latest version
  const restoreSavedVolumeRef = useRef(restoreSavedVolume);
  restoreSavedVolumeRef.current = restoreSavedVolume;

  // -----------------------------------------------------------------------
  // Play / Pause
  // -----------------------------------------------------------------------
  const togglePlay = () => {
    if (!videoRef.current || !activeSrc) return;

    if (isPlaying) {
      userPaused.current = true;
      videoRef.current.pause();
    } else {
      userPaused.current = false;
      // First manual resume while still in the autoplay-muted state:
      // interpret this as "user wants to watch this video" → unmute and
      // restore the saved volume.
      if (!hasUserInteracted.current) {
        hasUserInteracted.current = true;
        restoreSavedVolume();
      }
      claimPlayback(playerId, () => videoRef.current?.pause());
      videoRef.current.play().catch(() => {});
    }
  };

  // Stable ref for use in setTimeout callbacks
  const togglePlayRef = useRef(togglePlay);
  togglePlayRef.current = togglePlay;

  // -----------------------------------------------------------------------
  // Single tap handler — called after double-tap window expires
  // -----------------------------------------------------------------------
  const handleSingleTapRef = useRef<() => void>(() => {});
  handleSingleTapRef.current = () => {
    if (!videoRef.current || !activeSrcRef.current) return;
    if (!hasUserInteracted.current) {
      hasUserInteracted.current = true;
      restoreSavedVolumeRef.current();
      return;
    }
    togglePlayRef.current();
  };

  // -----------------------------------------------------------------------
  // Video area click — first click unmutes only; subsequent clicks toggle play
  // -----------------------------------------------------------------------
  const handleVideoClick = () => {
    if (!videoRef.current || !activeSrc) return;

    // Suppress click when touch handlers already processed this gesture
    if (touchHandledRef.current) {
      touchHandledRef.current = false;
      return;
    }

    // On touch devices: if controls are currently hidden, first tap only shows
    // controls without any play/pause action. The hide timer is already
    // scheduled by the isPlaying effect so no extra call is needed.
    if (isTouchDevice && !showControlsRef.current) {
      setShowControls(true);
      return;
    }

    // First interaction while auto-playing muted → unmute only, keep playing
    if (!hasUserInteracted.current) {
      hasUserInteracted.current = true;
      restoreSavedVolume();
      return;
    }

    // Subsequent clicks → normal play/pause toggle
    togglePlay();
  };

  // -----------------------------------------------------------------------
  // Mute toggle
  // -----------------------------------------------------------------------
  const toggleMute = () => {
    if (!videoRef.current) return;

    // Mark as user-interacted so pause→play won't auto-unmute again.
    hasUserInteracted.current = true;

    if (isMuted) {
      // Unmute → restore saved volume
      restoreSavedVolume();
    } else {
      // Mute
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  // -----------------------------------------------------------------------
  // Volume button handler (different behaviour on mobile vs desktop)
  // -----------------------------------------------------------------------
  const handleVolumeButtonClick = () => {
    if (isTouchDevice) {
      if (showVolumeSlider) {
        // Slider already visible → toggle mute
        toggleMute();
      } else {
        // Show slider on first tap
        setShowVolumeSlider(true);
      }
    } else {
      // Desktop: always toggle mute
      toggleMute();
    }
  };

  // -----------------------------------------------------------------------
  // Fullscreen
  // -----------------------------------------------------------------------
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // -----------------------------------------------------------------------
  // Progress bar seek
  // Mouse: absolute position. Touch: relative drag.
  // -----------------------------------------------------------------------
  const handleProgressBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressBarRef.current) return;
    if (!hasUserInteracted.current) {
      hasUserInteracted.current = true;
      restoreSavedVolume();
    }
    // Absolute position seek on mouse down
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    const newTime = ratio * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setIsDraggingProgress(true);
  };

  const handleProgressBarMouseMove = (e: MouseEvent) => {
    if (!isDraggingProgress || !progressBarRef.current || !videoRef.current)
      return;
    // Absolute position for mouse drag
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    const newTime = ratio * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressBarMouseUp = () => {
    setIsDraggingProgress(false);
  };

  const handleProgressBarTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!videoRef.current) return;
    const touch = e.touches[0] ?? e.changedTouches[0];
    if (!touch) return;
    if (!hasUserInteracted.current) {
      hasUserInteracted.current = true;
      restoreSavedVolume();
    }
    // Record current position as drag origin — relative drag for touch
    progressDragStartRef.current = {
      x: touch.clientX,
      value: videoRef.current.currentTime,
    };
    setIsDraggingProgress(true);
  };

  const handleProgressBarTouchMove = (e: TouchEvent) => {
    if (!isDraggingProgress || !progressBarRef.current || !videoRef.current)
      return;
    e.preventDefault();
    const touch = e.touches[0] ?? e.changedTouches[0];
    if (!touch) return;
    // Relative drag for touch
    const rect = progressBarRef.current.getBoundingClientRect();
    const delta =
      ((touch.clientX - progressDragStartRef.current.x) / rect.width) *
      duration;
    const newTime = Math.max(
      0,
      Math.min(duration, progressDragStartRef.current.value + delta),
    );
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressBarTouchEnd = () => {
    setIsDraggingProgress(false);
  };

  // -----------------------------------------------------------------------
  // Volume bar
  // Mouse: absolute position. Touch: relative drag.
  // -----------------------------------------------------------------------
  const handleVolumeBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !volumeBarRef.current) return;
    hasUserInteracted.current = true;
    // Absolute position on mouse down
    const rect = volumeBarRef.current.getBoundingClientRect();
    const newVol = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    videoRef.current.volume = newVol;
    setVolume(newVol);
    setSavedVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
    setIsDraggingVolume(true);
  };

  const handleVolumeBarMouseMove = (e: MouseEvent) => {
    if (!isDraggingVolume || !volumeBarRef.current || !videoRef.current) return;
    // Absolute position for mouse drag
    const rect = volumeBarRef.current.getBoundingClientRect();
    const newVol = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    videoRef.current.volume = newVol;
    setVolume(newVol);
    setSavedVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  };

  const handleVolumeBarMouseUp = () => {
    setIsDraggingVolume(false);
  };

  const handleVolumeBarTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!videoRef.current) return;
    hasUserInteracted.current = true;
    const touch = e.touches[0] ?? e.changedTouches[0];
    if (!touch) return;
    // Record current volume as drag origin — relative drag for touch
    const currentVol = isMuted ? 0 : videoRef.current.volume;
    volumeDragStartRef.current = { x: touch.clientX, value: currentVol };
    setIsDraggingVolume(true);
    scheduleHideControls();
  };

  const handleVolumeBarTouchMove = (e: TouchEvent) => {
    if (!isDraggingVolume || !volumeBarRef.current || !videoRef.current) return;
    e.preventDefault();
    const touch = e.touches[0] ?? e.changedTouches[0];
    if (!touch) return;
    // Relative drag for touch
    const rect = volumeBarRef.current.getBoundingClientRect();
    const delta = (touch.clientX - volumeDragStartRef.current.x) / rect.width;
    const newVol = Math.max(
      0,
      Math.min(1, volumeDragStartRef.current.value + delta),
    );
    videoRef.current.volume = newVol;
    setVolume(newVol);
    setSavedVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
    scheduleHideControls();
  };

  const handleVolumeBarTouchEnd = () => {
    setIsDraggingVolume(false);
    scheduleHideControls();
  };

  // -----------------------------------------------------------------------
  // Auto-hide controls
  // -----------------------------------------------------------------------
  const scheduleHideControls = () => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }

    if (isPlaying && !isHovering && !isDraggingProgress && !isDraggingVolume) {
      hideControlsTimeoutRef.current = setTimeout(
        () => {
          setShowControls(false);
        },
        isTouchDevice ? 3000 : 1000,
      );
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    scheduleHideControls();
  };

  const handleMouseEnter = () => {
    // Touch devices fire synthetic mouseenter on tap — ignore to prevent
    // isHovering from getting stuck at true and blocking the hide timer.
    if (isTouchDevice) return;
    setIsHovering(true);
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (isTouchDevice) return;
    setIsHovering(false);
    scheduleHideControls();
  };

  // -----------------------------------------------------------------------
  // Long press (2x speed) + double tap seek — touch handlers on video element
  // -----------------------------------------------------------------------
  const endLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isLongPressingRef.current && videoRef.current) {
      videoRef.current.playbackRate = 1;
      isLongPressingRef.current = false;
      setIsLongPressing(false);
    }
  };

  const handleVideoTouchStart = (e: React.TouchEvent<HTMLVideoElement>) => {
    if (!activeSrc) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;

    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

    // Cancel any pending single-tap timer
    const tapState = tapStateRef.current;
    if (tapState.singleTapTimer) {
      clearTimeout(tapState.singleTapTimer);
      tapState.singleTapTimer = null;
    }

    // Start long press timer
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (!videoRef.current) return;
      videoRef.current.playbackRate = 2;
      isLongPressingRef.current = true;
      setIsLongPressing(true);
      touchHandledRef.current = true;
      // Unmute on long press (2x speed gesture)
      hasUserInteracted.current = true;
      restoreSavedVolumeRef.current();
    }, 500);
  };

  const handleVideoTouchMove = (e: React.TouchEvent<HTMLVideoElement>) => {
    // Cancel long press if finger moved significantly (likely scrolling)
    if (!isLongPressingRef.current && longPressTimerRef.current) {
      const touch = e.touches[0];
      if (touch) {
        const dx = touch.clientX - touchStartPosRef.current.x;
        const dy = touch.clientY - touchStartPosRef.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    }
  };

  const handleVideoTouchEnd = (e: React.TouchEvent<HTMLVideoElement>) => {
    if (!activeSrc) return;

    const wasLongPressing = isLongPressingRef.current;
    endLongPress();

    if (wasLongPressing) {
      touchHandledRef.current = true;
      return;
    }

    if (!containerRef.current || !videoRef.current) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const rect = containerRef.current.getBoundingClientRect();
    const relX = touch.clientX - rect.left;
    const side: "left" | "right" = relX < rect.width / 2 ? "left" : "right";
    const now = Date.now();
    const tapState = tapStateRef.current;

    const isSequential =
      now - tapState.lastTime < 400 && tapState.lastSide === side;
    tapState.lastTime = now;
    tapState.lastSide = side;

    if (isSequential) {
      // Double tap or additional tap → seek
      touchHandledRef.current = true;

      if (tapState.displayTimer) {
        clearTimeout(tapState.displayTimer);
        tapState.displayTimer = null;
      }
      if (tapState.singleTapTimer) {
        clearTimeout(tapState.singleTapTimer);
        tapState.singleTapTimer = null;
      }

      const delta = side === "left" ? -10 : 10;
      tapState.totalSeeked += delta;
      tapState.animKey++;

      const video = videoRef.current;
      const newTime = Math.max(
        0,
        Math.min(video.duration || 0, video.currentTime + delta),
      );
      video.currentTime = newTime;
      setCurrentTime(newTime);

      // Unmute on double-tap seek gesture
      hasUserInteracted.current = true;
      restoreSavedVolumeRef.current();

      const { animKey, totalSeeked } = tapState;
      setSeekOverlay({
        side,
        seconds: Math.abs(totalSeeked),
        key: animKey,
      });

      tapState.displayTimer = setTimeout(() => {
        setSeekOverlay(null);
        tapState.totalSeeked = 0;
        tapState.lastSide = null;
      }, 800);
    } else {
      // First tap in potential sequence
      if (tapState.displayTimer) {
        clearTimeout(tapState.displayTimer);
        tapState.displayTimer = null;
        setSeekOverlay(null);
        tapState.totalSeeked = 0;
      }

      // Always suppress onClick — we handle the action ourselves
      touchHandledRef.current = true;

      // Controls hidden → show controls immediately, no play/pause action
      if (!showControlsRef.current) {
        setShowControls(true);
        return;
      }

      // Schedule single-tap action to allow double-tap detection
      tapState.singleTapTimer = setTimeout(() => {
        tapState.singleTapTimer = null;
        handleSingleTapRef.current();
      }, 200);
    }
  };

  const handleVideoTouchCancel = () => {
    endLongPress();
    const tapState = tapStateRef.current;
    if (tapState.singleTapTimer) {
      clearTimeout(tapState.singleTapTimer);
      tapState.singleTapTimer = null;
    }
  };

  // -----------------------------------------------------------------------
  // Video event listeners
  // -----------------------------------------------------------------------
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => {
      setIsPlaying(false);
      setShowControls(true);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
    const handleDurationChange = () => setDuration(video.duration);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("volumechange", handleVolumeChange);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, []);

  // Smooth progress updates via requestAnimationFrame
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tick = () => {
      setCurrentTime(video.currentTime);
      rafRef.current = requestAnimationFrame(tick);
    };

    if (isPlaying) {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying]);

  // Keep isFullscreenRef in sync and update React state
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fs = !!document.fullscreenElement;
      isFullscreenRef.current = fs;
      setIsFullscreen(fs);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Cleanup long press and tap timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      const tapState = tapStateRef.current;
      if (tapState.displayTimer) clearTimeout(tapState.displayTimer);
      if (tapState.singleTapTimer) clearTimeout(tapState.singleTapTimer);
    };
  }, []);

  // Imperatively manage the video src attribute so that React 19's internal
  // reconciler cannot incorrectly set src="" (which resolves to the page URL
  // and causes NotSupportedError when play() is called). useLayoutEffect runs
  // synchronously after the DOM mutation, ensuring the attribute is correct
  // before the browser paints or the user can interact.
  useLayoutEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (activeSrc) {
      video.setAttribute("src", activeSrc);
    } else {
      video.removeAttribute("src");
      try {
        video.load();
      } catch {
        /* expected: resets buffered state */
      }
    }
  }, [activeSrc]);

  // -----------------------------------------------------------------------
  // IntersectionObserver — auto-play when near viewport center, pause when
  // scrolled away. Only one video plays at a time (via claimPlayback).
  // Skips pause when in fullscreen mode to prevent the observer from
  // interfering with fullscreen playback.
  // -----------------------------------------------------------------------
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    // Same Strict Mode guard as the load-zone observer: ignore any initial
    // false callback that fires before the first true. Set only by the
    // observer's true callback so that a false after a true (genuine scroll-
    // out) is still processed correctly.
    let settled = false;

    // rootMargin shrinks the effective viewport to roughly the middle 40%.
    // A video must overlap this central band to be considered "in view".
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          settled = true;
          // Don't auto-play if the user explicitly paused this video.
          if (userPaused.current) return;
          // Don't play if src is unloaded by the load-zone observer.
          if (!activeSrcRef.current) return;

          claimPlayback(playerId, () => video.pause());
          video.play().catch(() => {
            // Autoplay blocked by browser — ignore silently
          });
        } else {
          // In fullscreen the element technically leaves the normal viewport
          // intersection rect — do NOT pause when that happens.
          if (isFullscreenRef.current) return;
          // Ignore initial false that arrives before any true (Strict Mode).
          if (!settled) return;

          // Scrolled out of center band — pause & release
          video.pause();
          releasePlayback(playerId);
        }
      },
      { threshold: 0.5, rootMargin: "-30% 0px -30% 0px" },
    );

    observer.observe(container);

    // Synchronous initial position check: if the video is already in the
    // center band, start playing immediately. This handles React 19 Strict
    // Mode's double-invocation where the cleanup → re-setup cycle leaves the
    // video paused even though it is genuinely in the auto-play zone.
    // Note: settled remains false here so that a subsequent observer false
    // (Strict Mode false-positive) is still ignored.
    const rect = container.getBoundingClientRect();
    const vh = window.innerHeight;
    const midY = (rect.top + rect.bottom) / 2;
    if (
      midY > vh * 0.3 &&
      midY < vh * 0.7 &&
      !userPaused.current &&
      activeSrcRef.current
    ) {
      claimPlayback(playerId, () => video.pause());
      video.play().catch(() => {});
    }

    return () => {
      observer.disconnect();
      releasePlayback(playerId);
      video.pause();
    };
  }, [playerId]);

  // -----------------------------------------------------------------------
  // Load-zone observer — keeps src loaded within ~3 viewport heights.
  // When scrolled far away, clears activeSrc to release the video buffer.
  // -----------------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // React 19 Strict Mode double-invokes effects (cleanup → setup). The new
    // observer's initial callback can fire isIntersecting:false for elements
    // that are genuinely within the load zone, because the browser has not yet
    // re-run the intersection check against the updated layout. Guard against
    // this by ignoring any false firing that arrives before the first true —
    // the element's activeSrc is already correct from the previous invocation.
    let settled = false;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          settled = true;
          setActiveSrc(src);
        } else {
          // Do not release while in fullscreen — the element technically
          // leaves the normal viewport intersection rect in that state.
          if (isFullscreenRef.current) return;
          // Ignore a false callback that arrives before we have ever seen a
          // true for this observer instance (Strict Mode false-positive).
          if (!settled) return;
          setActiveSrc("");
        }
      },
      { rootMargin: "300% 0px 300% 0px", threshold: 0 },
    );

    obs.observe(container);
    return () => obs.disconnect();
  }, [src]);

  // When activeSrc is cleared, release playback and pause.
  useEffect(() => {
    if (!activeSrc) {
      const video = videoRef.current;
      if (video) {
        video.pause();
      }
      releasePlayback(playerId);
    }
  }, [activeSrc, playerId]);

  useEffect(() => {
    scheduleHideControls();
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isPlaying, isHovering, isDraggingProgress, isDraggingVolume]);

  // Handle drag events (progress bar)
  useEffect(() => {
    if (isDraggingProgress) {
      document.addEventListener("mousemove", handleProgressBarMouseMove);
      document.addEventListener("mouseup", handleProgressBarMouseUp);
      document.addEventListener("touchmove", handleProgressBarTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleProgressBarTouchEnd);
      document.addEventListener("touchcancel", handleProgressBarTouchEnd);
      return () => {
        document.removeEventListener("mousemove", handleProgressBarMouseMove);
        document.removeEventListener("mouseup", handleProgressBarMouseUp);
        document.removeEventListener("touchmove", handleProgressBarTouchMove);
        document.removeEventListener("touchend", handleProgressBarTouchEnd);
        document.removeEventListener("touchcancel", handleProgressBarTouchEnd);
      };
    }
  }, [isDraggingProgress]);

  // Handle drag events (volume bar)
  useEffect(() => {
    if (isDraggingVolume) {
      document.addEventListener("mousemove", handleVolumeBarMouseMove);
      document.addEventListener("mouseup", handleVolumeBarMouseUp);
      document.addEventListener("touchmove", handleVolumeBarTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleVolumeBarTouchEnd);
      document.addEventListener("touchcancel", handleVolumeBarTouchEnd);
      return () => {
        document.removeEventListener("mousemove", handleVolumeBarMouseMove);
        document.removeEventListener("mouseup", handleVolumeBarMouseUp);
        document.removeEventListener("touchmove", handleVolumeBarTouchMove);
        document.removeEventListener("touchend", handleVolumeBarTouchEnd);
        document.removeEventListener("touchcancel", handleVolumeBarTouchEnd);
      };
    }
  }, [isDraggingVolume]);

  // Mobile: dismiss volume slider when tapping outside the volume area
  useEffect(() => {
    if (!isTouchDevice || !showVolumeSlider) return;

    const handleTouchOutside = (e: TouchEvent) => {
      if (
        volumeAreaRef.current &&
        !volumeAreaRef.current.contains(e.target as Node)
      ) {
        setShowVolumeSlider(false);
      }
    };

    // Use capture phase so we catch the event before it's consumed
    document.addEventListener("touchstart", handleTouchOutside, true);
    return () => {
      document.removeEventListener("touchstart", handleTouchOutside, true);
    };
  }, [isTouchDevice, showVolumeSlider]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Whether to show the volume slider
  const volumeSliderVisible = isTouchDevice
    ? showVolumeSlider
    : isVolumeHovered || isDraggingVolume;

  return (
    <div
      ref={containerRef}
      className={cn("relative bg-black group select-none", className)}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        className="w-full h-full cursor-pointer select-none"
        poster={poster || undefined}
        playsInline
        preload="metadata"
        muted
        loop
        draggable={false}
        onClick={activeSrc ? handleVideoClick : undefined}
        onTouchStart={activeSrc ? handleVideoTouchStart : undefined}
        onTouchMove={activeSrc ? handleVideoTouchMove : undefined}
        onTouchEnd={activeSrc ? handleVideoTouchEnd : undefined}
        onTouchCancel={activeSrc ? handleVideoTouchCancel : undefined}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Long press 2× speed indicator — top center */}
      {isLongPressing && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-30">
          <div className="flex items-center gap-1.5 bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
            <Gauge className="w-3.5 h-3.5" style={{ filter: "none" }} />
            <span>{t("doubleSpeed")}</span>
          </div>
        </div>
      )}

      {/* Double-tap seek indicator — left/right edges */}
      {seekOverlay && (
        <div
          key={seekOverlay.key}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 pointer-events-none z-30",
            seekOverlay.side === "left" ? "left-3" : "right-3",
          )}
        >
          <div className="flex items-center gap-1 bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
            {seekOverlay.side === "left" ? (
              <>
                <ChevronsLeft
                  className="w-3.5 h-3.5"
                  style={{ filter: "none" }}
                />
                <span>{t("seekSeconds", { seconds: seekOverlay.seconds })}</span>
              </>
            ) : (
              <>
                <span>{t("seekSeconds", { seconds: seekOverlay.seconds })}</span>
                <ChevronsRight
                  className="w-3.5 h-3.5"
                  style={{ filter: "none" }}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Big play button (center) — shown only when src loaded and paused.
          z-20 ensures it sits above the control bar gradient (z-10). */}
      {activeSrc && !isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-12 h-12 z-20 flex items-center justify-center bg-black/55 backdrop-blur-sm rounded-full hover:bg-black/70 hover:scale-110 transition-all duration-150"
          style={{ textShadow: "none" }}
          aria-label={t("play")}
        >
          <Play
            className="w-5 h-5 text-white ml-0.5"
            fill="white"
            style={{ filter: "none" }}
          />
        </button>
      )}

      {/* Control bar — hidden when src is unloaded */}
      {activeSrc && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 z-10 transition-opacity duration-300 select-none",
            showControls || !isPlaying ? "opacity-100" : "opacity-0",
          )}
        >
          {/* Background gradient */}
          <div
            className="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none"
            style={{ height: "80px" }}
          />

          {/* Progress bar — transparent padding expands touch target while
            the visible track stays thin (h-1, expanding to h-1.5 on hover). */}
          <div className="px-2">
            <div
              className="pt-3 pb-2 cursor-pointer group/progress"
              style={{ touchAction: "none" }}
              onMouseDown={handleProgressBarMouseDown}
              onTouchStart={handleProgressBarTouchStart}
            >
              <div
                ref={progressBarRef}
                className="relative h-1 bg-white/25 rounded-full group-hover/progress:h-1.5 transition-all"
              >
                <div
                  className="h-full bg-white rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full scale-0 group-hover/progress:scale-100 transition-transform shadow-md" />
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div
            className="relative flex items-center gap-0 pt-0 p-1 sm:px-2 pb-1 sm:pb-2"
            style={{ textShadow: "none" }}
          >
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 flex items-center justify-center text-white rounded-lg hover:bg-white/15 transition-colors"
              aria-label={isPlaying ? t("pause") : t("play")}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" style={{ filter: "none" }} />
              ) : (
                <Play className="w-4 h-4" style={{ filter: "none" }} />
              )}
            </button>

            {/* Time */}
            <div className="text-white text-xs tabular-nums px-2 select-none">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <div className="flex-1" />

            {/* Volume */}
            <div
              ref={volumeAreaRef}
              className="flex items-center group/volume"
              onMouseEnter={() => {
                if (!isTouchDevice) setIsVolumeHovered(true);
              }}
              onMouseLeave={() => {
                if (!isTouchDevice) setIsVolumeHovered(false);
              }}
            >
              <button
                onClick={handleVolumeButtonClick}
                className="p-2 flex items-center justify-center text-white rounded-lg hover:bg-white/15 transition-colors"
                aria-label={isMuted ? t("unmute") : t("mute")}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" style={{ filter: "none" }} />
                ) : (
                  <Volume2 className="w-4 h-4" style={{ filter: "none" }} />
                )}
              </button>
              <div
                className={cn(
                  "relative transition-all overflow-hidden",
                  volumeSliderVisible
                    ? "w-[88px] opacity-100"
                    : "w-0 opacity-0",
                )}
              >
                {/* py-3 creates a tall transparent hit area; the visible
                  track is only h-1 (thin). */}
                <div
                  className="py-3 px-2 cursor-pointer"
                  style={{ touchAction: "none" }}
                  onMouseDown={handleVolumeBarMouseDown}
                  onTouchStart={handleVolumeBarTouchStart}
                >
                  <div
                    ref={volumeBarRef}
                    className="h-1 bg-white/25 rounded-full w-full"
                  >
                    <div
                      className="h-full bg-white rounded-full relative"
                      style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 flex items-center justify-center text-white rounded-lg hover:bg-white/15 transition-colors"
              aria-label={isFullscreen ? t("exitFullscreen") : t("fullscreen")}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" style={{ filter: "none" }} />
              ) : (
                <Maximize className="w-4 h-4" style={{ filter: "none" }} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
