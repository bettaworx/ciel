"use client";

import { useEffect, useRef, useState } from "react";
import type { components } from "@/lib/api/api";
import { cn } from "@/lib/utils";
import {
  buildDrawingReplay,
  DRAWING_HEIGHT,
  DRAWING_REPLAY_DURATION_MS,
  DRAWING_WIDTH,
  drawStrokePoint,
  drawStrokeSegment,
  parseDrawingDocument,
  renderDrawing,
  type DrawingDocument,
} from "@/components/post-composer/drawing";

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
            return response.json() as Promise<unknown>;
          })
          .then((value) => {
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
      { rootMargin: "100px" },
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

    context.clearRect(0, 0, DRAWING_WIDTH, DRAWING_HEIGHT);
    const steps = buildDrawingReplay(document.strokes, DRAWING_REPLAY_DURATION_MS);
    let index = 0;
    let frame = 0;
    let startedAt: number | null = null;
    const play = (now: number) => {
      startedAt ??= now;
      const elapsed = now - startedAt;
      if (elapsed >= DRAWING_REPLAY_DURATION_MS) {
        renderDrawing(context, document.strokes, document.color);
        return;
      }
      let drawn = 0;
      while (index < steps.length && steps[index].at <= elapsed && drawn < 5000) {
        const step = steps[index];
        if (step.from) drawStrokeSegment(context, step.stroke, step.from, step.to, document.color);
        else drawStrokePoint(context, step.stroke, step.to, document.color);
        index += 1;
        drawn += 1;
      }
      if (index < steps.length) frame = window.requestAnimationFrame(play);
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
        className={cn("h-full w-full object-contain", document && "invisible")}
      />
      {document && (
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
