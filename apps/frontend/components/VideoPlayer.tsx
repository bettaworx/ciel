"use client";

import { useRef, useEffect } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
import "@/components/video-player.css";

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

export function VideoPlayer({
  src,
  width,
  height,
  poster,
  className,
  style,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (playerRef.current) return;

    const videoElement = document.createElement("video-js");
    videoElement.classList.add("vjs-big-play-centered");
    containerRef.current.appendChild(videoElement);

    const player = videojs(videoElement, {
      controls: true,
      responsive: true,
      fluid: false,
      fill: true,
      preload: "metadata",
      playsinline: true,
      poster: poster || undefined,
      inactivityTimeout: 3000,
      controlBar: {
        children: [
          "playToggle",
          "currentTimeDisplay",
          "timeDivider",
          "durationDisplay",
          "progressControl",
          "volumePanel",
          "fullscreenToggle",
        ],
        volumePanel: {
          inline: true,
        },
      },
      sources: [
        {
          src,
          type: getMimeType(src),
        },
      ],
      userActions: {
        hotkeys: true,
      },
    });

    // Keep controls visible while paused
    player.on("pause", () => {
      player.userActive(true);
    });

    // Click on video area toggles play/pause
    player.on("click", (e: Event) => {
      const target = e.target as HTMLElement;
      // Only toggle if clicking the video itself, not controls
      if (
        target.classList.contains("vjs-tech") ||
        target.classList.contains("vjs-poster")
      ) {
        if (player.paused()) {
          player.play();
        } else {
          player.pause();
        }
      }
    });

    playerRef.current = player;

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, width, height, poster]);

  return (
    <div
      ref={containerRef}
      data-vjs-player
      className={className}
      style={style}
    />
  );
}
