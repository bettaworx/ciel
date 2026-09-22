"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/utils";
import {
  DRAWING_BACKGROUND,
  DRAWING_HEIGHT,
  DRAWING_SCALE,
  DRAWING_WIDTH,
  drawStrokePoint,
  drawStrokeSegment,
  encodeDrawingPoint,
  renderDrawing,
  type DecodedDrawingPoint,
  type DrawingStroke,
  type DrawingTool,
} from "./drawing";

interface DrawingCanvasProps {
  strokes: DrawingStroke[];
  onChange: (strokes: DrawingStroke[]) => void;
  tool: DrawingTool;
  color: string;
  pencilSize: number;
  eraserSize: number;
  disabled?: boolean;
  className?: string;
  ariaLabel: string;
}

export function DrawingCanvas({
  strokes,
  onChange,
  tool,
  color,
  pencilSize,
  eraserSize,
  disabled = false,
  className,
  ariaLabel,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePointerRef = useRef<number | null>(null);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);
  const currentPointRef = useRef<DecodedDrawingPoint | null>(null);
  const lastEventTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (context) renderDrawing(context, strokes);
  }, [strokes]);

  const pointFromEvent = (event: PointerEvent): DecodedDrawingPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const eventTime = event.timeStamp;
    const previousTime = lastEventTimeRef.current;
    lastEventTimeRef.current = eventTime;
    return {
      delayMs: previousTime === null ? 0 : Math.max(0, eventTime - previousTime),
      x: Math.max(
        0,
        Math.min(DRAWING_WIDTH, ((event.clientX - rect.left) / rect.width) * DRAWING_WIDTH),
      ),
      y: Math.max(
        0,
        Math.min(DRAWING_HEIGHT, ((event.clientY - rect.top) / rect.height) * DRAWING_HEIGHT),
      ),
      pressure:
        event.pointerType === "pen"
          ? Math.round(Math.max(0, Math.min(1, event.pressure)) * 1024)
          : 1024,
    };
  };

  const appendEvent = (event: PointerEvent) => {
    const stroke = currentStrokeRef.current;
    const previous = currentPointRef.current;
    const context = canvasRef.current?.getContext("2d");
    const point = pointFromEvent(event);
    if (!stroke || !context || !point) return;

    stroke.points.push(encodeDrawingPoint(previous, point));
    if (previous) drawStrokeSegment(context, stroke, previous, point);
    else drawStrokePoint(context, stroke, point);
    currentPointRef.current = point;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled || activePointerRef.current !== null) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerRef.current = event.pointerId;
    currentStrokeRef.current = {
      tool,
      ...(tool === "pencil" ? { color: color.toUpperCase() } : {}),
      size: Math.round((tool === "pencil" ? pencilSize : eraserSize) * DRAWING_SCALE),
      points: [],
    };
    currentPointRef.current = null;
    appendEvent(event.nativeEvent);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePointerRef.current !== event.pointerId) return;
    event.preventDefault();
    const native = event.nativeEvent;
    const samples = native.getCoalescedEvents?.() ?? [native];
    for (const sample of samples) appendEvent(sample);
  };

  const finishStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePointerRef.current !== event.pointerId) return;
    const stroke = currentStrokeRef.current;
    activePointerRef.current = null;
    currentStrokeRef.current = null;
    currentPointRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (stroke?.points.length) onChange([...strokes, stroke]);
  };

  const cancelStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePointerRef.current !== event.pointerId) return;
    activePointerRef.current = null;
    currentStrokeRef.current = null;
    currentPointRef.current = null;
    const context = canvasRef.current?.getContext("2d");
    if (context) renderDrawing(context, strokes);
  };

  return (
    <canvas
      ref={canvasRef}
      width={DRAWING_WIDTH}
      height={DRAWING_HEIGHT}
      aria-label={ariaLabel}
      className={cn(
        "block aspect-3/2 w-full touch-none rounded-xl border border-border",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
      style={{ backgroundColor: DRAWING_BACKGROUND }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishStroke}
      onPointerCancel={cancelStroke}
    />
  );
}
