"use client";

import { useRef, useEffect, useState, useCallback, useId } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from "lucide-react";
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

  // Stable identity for the playback manager
  const playerId = useId();

  const isTouchDevice = useIsTouchDevice();

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
  const [isHovering, setIsHovering] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);

  // Mobile: whether the volume slider is explicitly shown (toggled by tap)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

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

  // -----------------------------------------------------------------------
  // Play / Pause
  // -----------------------------------------------------------------------
  const togglePlay = () => {
    if (!videoRef.current) return;

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
      videoRef.current.play();
    }
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
  // -----------------------------------------------------------------------
  const handleProgressBarSeek = (
    e:
      | MouseEvent
      | TouchEvent
      | React.MouseEvent<HTMLDivElement>
      | React.TouchEvent<HTMLDivElement>,
  ) => {
    if (!progressBarRef.current || !videoRef.current) return;

    const clientX =
      "touches" in e
        ? ((e.touches[0] ?? e.changedTouches[0])?.clientX ?? 0)
        : e.clientX;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = (clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(duration, pos * duration));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingProgress(true);
    handleProgressBarSeek(e);
  };

  const handleProgressBarMouseMove = (e: MouseEvent) => {
    if (isDraggingProgress) {
      handleProgressBarSeek(e);
    }
  };

  const handleProgressBarMouseUp = () => {
    setIsDraggingProgress(false);
  };

  const handleProgressBarTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingProgress(true);
    handleProgressBarSeek(e);
  };

  const handleProgressBarTouchMove = (e: TouchEvent) => {
    if (isDraggingProgress) {
      e.preventDefault();
      handleProgressBarSeek(e);
    }
  };

  const handleProgressBarTouchEnd = () => {
    setIsDraggingProgress(false);
  };

  // -----------------------------------------------------------------------
  // Volume bar
  // -----------------------------------------------------------------------
  const handleVolumeBarChange = (
    e:
      | MouseEvent
      | TouchEvent
      | React.MouseEvent<HTMLDivElement>
      | React.TouchEvent<HTMLDivElement>,
  ) => {
    if (!volumeBarRef.current || !videoRef.current) return;

    hasUserInteracted.current = true;

    const clientX =
      "touches" in e
        ? ((e.touches[0] ?? e.changedTouches[0])?.clientX ?? 0)
        : e.clientX;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    videoRef.current.volume = pos;
    setVolume(pos);
    setSavedVolume(pos);

    if (pos > 0 && isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  };

  const handleVolumeBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingVolume(true);
    handleVolumeBarChange(e);
  };

  const handleVolumeBarMouseMove = (e: MouseEvent) => {
    if (isDraggingVolume) {
      handleVolumeBarChange(e);
    }
  };

  const handleVolumeBarMouseUp = () => {
    setIsDraggingVolume(false);
  };

  const handleVolumeBarTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingVolume(true);
    handleVolumeBarChange(e);
  };

  const handleVolumeBarTouchMove = (e: TouchEvent) => {
    if (isDraggingVolume) {
      e.preventDefault();
      handleVolumeBarChange(e);
    }
  };

  const handleVolumeBarTouchEnd = () => {
    setIsDraggingVolume(false);
  };

  // -----------------------------------------------------------------------
  // Auto-hide controls
  // -----------------------------------------------------------------------
  const scheduleHideControls = () => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }

    if (isPlaying && !isHovering) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 0);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    scheduleHideControls();
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    scheduleHideControls();
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

    // rootMargin shrinks the effective viewport to roughly the middle 40%.
    // A video must overlap this central band to be considered "in view".
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Don't auto-play if the user explicitly paused this video.
          if (userPaused.current) return;

          claimPlayback(playerId, () => video.pause());
          video.play().catch(() => {
            // Autoplay blocked by browser — ignore silently
          });
        } else {
          // In fullscreen the element technically leaves the normal viewport
          // intersection rect — do NOT pause when that happens.
          if (isFullscreenRef.current) return;

          // Scrolled out of center band — pause & release
          video.pause();
          releasePlayback(playerId);
        }
      },
      { threshold: 0.5, rootMargin: "-30% 0px -30% 0px" },
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      releasePlayback(playerId);
    };
  }, [playerId]);

  useEffect(() => {
    scheduleHideControls();
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isPlaying, isHovering]);

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
        src={src}
        poster={poster || undefined}
        playsInline
        preload="metadata"
        muted
        loop
        draggable={false}
        onClick={togglePlay}
      >
        <source src={src} type={getMimeType(src)} />
      </video>

      {/* Big play button (center) — shown only when paused.
          z-20 ensures it sits above the control bar gradient (z-10). */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-12 h-12 z-20 flex items-center justify-center bg-black/55 backdrop-blur-sm rounded-full hover:bg-black/70 hover:scale-110 transition-all duration-150"
          style={{ textShadow: "none" }}
          aria-label="Play"
        >
          <Play
            className="w-5 h-5 text-white ml-0.5"
            fill="white"
            style={{ filter: "none" }}
          />
        </button>
      )}

      {/* Control bar */}
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
            className="py-0 sm:py-1 cursor-pointer group/progress"
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
          className="relative flex items-center gap-0 p-1 sm:px-2 pb-1 sm:pb-2"
          style={{ textShadow: "none" }}
        >
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="p-2 flex items-center justify-center text-white rounded-lg hover:bg-white/15 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
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
              aria-label={isMuted ? "Unmute" : "Mute"}
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
                volumeSliderVisible ? "w-[88px] opacity-100" : "w-0 opacity-0",
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
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" style={{ filter: "none" }} />
            ) : (
              <Maximize className="w-4 h-4" style={{ filter: "none" }} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
