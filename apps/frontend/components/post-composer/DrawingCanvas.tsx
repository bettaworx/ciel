"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEventHandler,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/utils";
import {
  DRAWING_HEIGHT,
  DRAWING_SCALE,
  DRAWING_WIDTH,
  drawingLineWidth,
  drawStrokePoint,
  drawStrokeSegment,
  encodeDrawingPoint,
  renderDrawing,
  stabilizeDrawingPoint,
  type DecodedDrawingPoint,
  type DrawingBrush,
  type DrawingStroke,
  type DrawingTool,
} from "./drawing";

interface DrawingCanvasProps {
  strokes: DrawingStroke[];
  onChange: (strokes: DrawingStroke[]) => void;
  tool: DrawingTool;
  color: string;
  brush: DrawingBrush;
  background: string;
  pencilSize: number;
  eraserSize: number;
  pencilStabilization: number;
  eraserStabilization: number;
  onDrawingStateChange?: (isDrawing: boolean) => void;
  onKeyDown?: KeyboardEventHandler<HTMLCanvasElement>;
  disabled?: boolean;
  className?: string;
  ariaLabel: string;
}

export function DrawingCanvas({
  strokes,
  onChange,
  tool,
  color,
  brush,
  background,
  pencilSize,
  eraserSize,
  pencilStabilization,
  eraserStabilization,
  onDrawingStateChange,
  onKeyDown,
  disabled = false,
  className,
  ariaLabel,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePointerRef = useRef<number | null>(null);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);
  const currentPointRef = useRef<DecodedDrawingPoint | null>(null);
  const lastEventTimeRef = useRef<number | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number; size: number } | null>(null);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (context) renderDrawing(context, strokes, color);
  }, [strokes, color]);

  const updateCursor = (event: ReactPointerEvent<HTMLCanvasElement>, usePressure: boolean) => {
    if (event.pointerType === "touch") {
      setCursor(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const baseSize = tool === "pencil" ? pencilSize : eraserSize;
    const activeBrush = tool === "pencil" ? brush : "gpen";
    const pressure =
      usePressure && event.pointerType === "pen"
        ? Math.round(Math.max(0, Math.min(1, event.pressure)) * 1024)
        : 1024;
    setCursor({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      size:
        drawingLineWidth(baseSize * DRAWING_SCALE, pressure, activeBrush) *
        (rect.width / DRAWING_WIDTH),
    });
  };

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

  const appendEvent = (event: PointerEvent, finish = false) => {
    const stroke = currentStrokeRef.current;
    const previous = currentPointRef.current;
    const context = canvasRef.current?.getContext("2d");
    const inputPoint = pointFromEvent(event);
    if (!stroke || !context || !inputPoint) return false;
    const stabilization = stroke.tool === "pencil" ? pencilStabilization : eraserStabilization;
    const point = stabilizeDrawingPoint(previous, inputPoint, stabilization, finish);

    stroke.points.push(encodeDrawingPoint(previous, point));
    if (stroke.brush !== "pencil") {
      if (previous) drawStrokeSegment(context, stroke, previous, point, color);
      else drawStrokePoint(context, stroke, point, color);
    }
    currentPointRef.current = point;
    return true;
  };

  const renderActivePencil = () => {
    const stroke = currentStrokeRef.current;
    const context = canvasRef.current?.getContext("2d");
    if (stroke?.brush === "pencil" && context) renderDrawing(context, [...strokes, stroke], color);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled || activePointerRef.current !== null) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerRef.current = event.pointerId;
    onDrawingStateChange?.(true);
    currentStrokeRef.current = {
      tool,
      ...(tool === "pencil" ? { brush } : {}),
      size: Math.round((tool === "pencil" ? pencilSize : eraserSize) * DRAWING_SCALE),
      points: [],
    };
    currentPointRef.current = null;
    lastEventTimeRef.current = null;
    updateCursor(event, true);
    appendEvent(event.nativeEvent);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    updateCursor(event, activePointerRef.current === event.pointerId);
    if (activePointerRef.current !== event.pointerId) return;
    event.preventDefault();
    const native = event.nativeEvent;
    const samples = native.getCoalescedEvents?.() ?? [native];
    let appended = false;
    for (const sample of samples) appended = appendEvent(sample) || appended;
    if (appended) renderActivePencil();
  };

  const finishStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePointerRef.current !== event.pointerId) return;
    const stabilization =
      currentStrokeRef.current?.tool === "pencil" ? pencilStabilization : eraserStabilization;
    const appended = stabilization > 0 && appendEvent(event.nativeEvent, true);
    if (appended) renderActivePencil();
    const stroke = currentStrokeRef.current;
    activePointerRef.current = null;
    onDrawingStateChange?.(false);
    currentStrokeRef.current = null;
    currentPointRef.current = null;
    lastEventTimeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    updateCursor(event, false);
    if (stroke?.points.length) onChange([...strokes, stroke]);
  };

  const cancelStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePointerRef.current !== event.pointerId) return;
    activePointerRef.current = null;
    onDrawingStateChange?.(false);
    currentStrokeRef.current = null;
    currentPointRef.current = null;
    lastEventTimeRef.current = null;
    updateCursor(event, false);
    const context = canvasRef.current?.getContext("2d");
    if (context) renderDrawing(context, strokes, color);
  };

  return (
    <div
      className={cn(
        "relative aspect-3/2 w-full overflow-hidden rounded-xl",
        disabled && "opacity-60",
        className,
      )}
      style={{ backgroundColor: background }}
    >
      <canvas
        ref={canvasRef}
        width={DRAWING_WIDTH}
        height={DRAWING_HEIGHT}
        tabIndex={-1}
        aria-label={ariaLabel}
        className={cn(
          "block h-full w-full cursor-none touch-none rounded-xl border border-border",
          disabled && "pointer-events-none",
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setCursor(null)}
        onPointerUp={finishStroke}
        onPointerCancel={cancelStroke}
        onKeyDown={onKeyDown}
        onContextMenu={(event) => event.preventDefault()}
      />
      {cursor && (
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-full border border-foreground shadow-[0_0_0_1px_var(--background)]"
          style={{
            left: cursor.x,
            top: cursor.y,
            width: cursor.size,
            height: cursor.size,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </div>
  );
}
