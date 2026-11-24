"use client";

import { useEffect, useRef, useState } from "react";
import type { components } from "@/lib/api/api";
import { cn } from "@/lib/utils";
import {
  buildDrawingReplay,
  createDrawingReplayPainter,
  DRAWING_HEIGHT,
  DRAWING_REPLAY_DURATION_MS,
  DRAWING_WIDTH,
  parseDrawingDocument,
  type DrawingDocument,
} from "@/components/post-composer/drawing";

// Roughly what MAX_REPLAY_BYTES holds; about 280 short segments per frame over the 3s replay.
const MAX_REPLAY_STEPS = 50_000;
// ponytail: skip replay (static preview only) for big documents; avoids downloading/parsing MBs per feed item
const MAX_REPLAY_BYTES = 512 << 10;

type Drawing = components["schemas"]["Drawing"];

interface DrawingReplayProps {
  drawing: Drawing;
  label: string;
  className?: string;
}

export function DrawingReplay({ drawing, label, className }: DrawingReplayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [document, setDocument] = useState<DrawingDocument | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const controller = new AbortController();
    let started = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (started || !entries.some((entry) => entry.isIntersecting)) return;
        started = true;
        observer.disconnect();
        void fetch(drawing.replayUrl, { credentials: "include", signal: controller.signal })
          .then((response) => {
            if (!response.ok) throw new Error(`Drawing replay request failed: ${response.status}`);
            if (Number(response.headers.get("content-length")) > MAX_REPLAY_BYTES) {
              controller.abort();
              return null;
            }
            return response.json() as Promise<unknown>;
          })
          .then((value) => {
            if (value === null) return;
            const parsed = parseDrawingDocument(value);
            if (!parsed) throw new Error("Invalid drawing replay document");
            setDocument(parsed);
          })
          .catch((error) => {
            if (!(error instanceof DOMException && error.name === "AbortError")) {
              console.error("Drawing replay failed:", error);
            }
          });
      },
      { threshold: 0.5 },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      controller.abort();
    };
  }, [drawing.replayUrl]);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!document || !context) return;

    // Incremental: each step is drawn once onto the canvas, and the server preview image replaces
    // the canvas when the replay ends. Thinning the steps would change the picture and make that
    // swap visible, so documents too big to replay show the preview only.
    const steps = buildDrawingReplay(document.strokes, DRAWING_REPLAY_DURATION_MS);
    if (steps.length > MAX_REPLAY_STEPS) {
      setDone(true);
      return;
    }
    const paint = createDrawingReplayPainter(context, document.color);
    let index = 0;
    let frame = 0;
    let startedAt: number | null = null;
    const play = (now: number) => {
      startedAt ??= now;
      const elapsed = now - startedAt;
      let end = index;
      while (end < steps.length && steps[end].at <= elapsed) end++;
      paint(steps.slice(index, end));
      index = end;
      if (index < steps.length) frame = window.requestAnimationFrame(play);
      else setDone(true);
    };
    frame = window.requestAnimationFrame(play);
    return () => window.cancelAnimationFrame(frame);
  }, [document]);

  return (
    <div
      ref={rootRef}
      className={cn("relative aspect-3/2 w-full overflow-hidden rounded-xl", className)}
      style={{ backgroundColor: drawing.backgroundColor }}
    >
      <img
        src={drawing.previewUrl}
        alt={label}
        width={drawing.width}
        height={drawing.height}
        loading="lazy"
        className={cn("h-full w-full object-contain", document && !done && "invisible")}
      />
      {document && !done && (
        <canvas
          ref={canvasRef}
          width={DRAWING_WIDTH}
          height={DRAWING_HEIGHT}
          role="img"
          aria-label={label}
          className="absolute inset-0 h-full w-full"
        />
      )}
    </div>
  );
}
