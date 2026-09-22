export const DRAWING_WIDTH = 1200;
export const DRAWING_HEIGHT = 800;
export const DRAWING_SCALE = 4;
export const DRAWING_BACKGROUND = "#FFFFFF";
export const DRAWING_REPLAY_DURATION_MS = 3000;
export const DRAWING_REPLAY_MAX_DELAY_MS = 32;

export type DrawingTool = "pencil" | "eraser";
export type DrawingPoint = [delayMs: number, xOrDxQ4: number, yOrDyQ4: number, pressure: number];

export interface DrawingStroke {
  tool: DrawingTool;
  color?: string;
  size: number;
  points: DrawingPoint[];
}

export interface DrawingDocument {
  version: 1;
  background: string;
  strokes: DrawingStroke[];
}

export function createDrawingDocument(
  strokes: DrawingStroke[],
  background = DRAWING_BACKGROUND,
): DrawingDocument {
  return {
    version: 1,
    background: background.toUpperCase(),
    strokes,
  };
}

export interface DecodedDrawingPoint {
  delayMs: number;
  x: number;
  y: number;
  pressure: number;
}

export interface DrawingReplayStep {
  at: number;
  stroke: DrawingStroke;
  from: DecodedDrawingPoint | null;
  to: DecodedDrawingPoint;
}

export type DrawingPostTheme = "light" | "dark";

interface HslColor {
  hue: number;
  saturation: number;
  lightness: number;
}

function hexToHsl(hex: string): HslColor {
  const [red, green, blue] = [1, 3, 5].map(
    (offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  if (delta > 0) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return { hue, saturation: saturation * 100, lightness: lightness * 100 };
}

function hslLuminance({ hue, saturation, lightness }: HslColor) {
  const saturationFraction = saturation / 100;
  const lightnessFraction = lightness / 100;
  const chroma = (1 - Math.abs(2 * lightnessFraction - 1)) * saturationFraction;
  const part = (((hue / 60) % 2) + 2) % 2;
  const x = chroma * (1 - Math.abs(part - 1));
  const match = lightnessFraction - chroma / 2;
  const [red, green, blue] =
    hue < 60
      ? [chroma, x, 0]
      : hue < 120
        ? [x, chroma, 0]
        : hue < 180
          ? [0, chroma, x]
          : hue < 240
            ? [0, x, chroma]
            : hue < 300
              ? [x, 0, chroma]
              : [chroma, 0, x];
  const linear = [red + match, green + match, blue + match].map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrastRatio(first: HslColor, second: HslColor) {
  const firstLuminance = hslLuminance(first);
  const secondLuminance = hslLuminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

function hslValue(color: HslColor) {
  return `hsl(${Math.round(color.hue)} ${Math.round(color.saturation)}% ${Math.round(color.lightness)}%)`;
}

export function drawingPostPalette(background: string) {
  const base = hexToHsl(background);
  const lightText = { ...base, lightness: 96 };
  const darkText = { ...base, lightness: 8 };
  const useDarkTheme = contrastRatio(base, lightText) >= contrastRatio(base, darkText);
  const foreground = useDarkTheme ? lightText : darkText;
  const surface = (step: number) => {
    const towardText = {
      ...base,
      lightness: Math.max(0, Math.min(100, base.lightness + (useDarkTheme ? step : -step))),
    };
    const awayFromText = {
      ...base,
      lightness: Math.max(0, Math.min(100, base.lightness + (useDarkTheme ? -step : step))),
    };
    return contrastRatio(towardText, foreground) >= 4.5 ? towardText : awayFromText;
  };
  return {
    theme: (useDarkTheme ? "dark" : "light") as DrawingPostTheme,
    foreground: hslValue(foreground),
    surface: hslValue(surface(4)),
    hover: hslValue(surface(8)),
  };
}

export function parseDrawingDocument(value: unknown): DrawingDocument | null {
  if (!value || typeof value !== "object") return null;
  const document = value as Partial<DrawingDocument>;
  if (
    document.version !== 1 ||
    typeof document.background !== "string" ||
    !/^#[0-9A-Fa-f]{6}$/.test(document.background) ||
    !Array.isArray(document.strokes)
  ) {
    return null;
  }

  if (document.strokes.length > 10_000) return null;
  let totalPoints = 0;
  for (const stroke of document.strokes) {
    if (
      !stroke ||
      (stroke.tool !== "pencil" && stroke.tool !== "eraser") ||
      !Number.isInteger(stroke.size) ||
      stroke.size < 1 ||
      stroke.size > 1200 ||
      !Array.isArray(stroke.points) ||
      stroke.points.length === 0 ||
      (stroke.tool === "pencil" && !/^#[0-9A-Fa-f]{6}$/.test(stroke.color ?? "")) ||
      (stroke.tool === "eraser" && stroke.color !== undefined)
    ) {
      return null;
    }
    totalPoints += stroke.points.length;
    if (totalPoints > 250_000) return null;
    let x = 0;
    let y = 0;
    for (let index = 0; index < stroke.points.length; index++) {
      const point = stroke.points[index];
      if (
        !Array.isArray(point) ||
        point.length !== 4 ||
        point.some((part) => !Number.isInteger(part)) ||
        point[0] < 0 ||
        point[0] > 60_000 ||
        point[3] < 0 ||
        point[3] > 1024
      ) {
        return null;
      }
      if (index === 0) {
        x = point[1];
        y = point[2];
      } else {
        x += point[1];
        y += point[2];
      }
      if (
        x < 0 ||
        x > DRAWING_WIDTH * DRAWING_SCALE ||
        y < 0 ||
        y > DRAWING_HEIGHT * DRAWING_SCALE
      ) {
        return null;
      }
    }
  }
  return document as DrawingDocument;
}

export function encodeDrawingPoint(
  previous: { x: number; y: number } | null,
  point: DecodedDrawingPoint,
): DrawingPoint {
  const x = Math.round(point.x * DRAWING_SCALE);
  const y = Math.round(point.y * DRAWING_SCALE);
  return [
    Math.max(0, Math.min(60_000, Math.round(point.delayMs))),
    previous ? x - Math.round(previous.x * DRAWING_SCALE) : x,
    previous ? y - Math.round(previous.y * DRAWING_SCALE) : y,
    Math.max(0, Math.min(1024, Math.round(point.pressure))),
  ];
}

export function decodeDrawingStroke(stroke: DrawingStroke): DecodedDrawingPoint[] {
  let x = 0;
  let y = 0;
  return stroke.points.map(([delayMs, xOrDx, yOrDy, pressure], index) => {
    if (index === 0) {
      x = xOrDx;
      y = yOrDy;
    } else {
      x += xOrDx;
      y += yOrDy;
    }
    return { delayMs, x: x / DRAWING_SCALE, y: y / DRAWING_SCALE, pressure };
  });
}

export function buildDrawingReplay(
  strokes: DrawingStroke[],
  maxDurationMs = Number.POSITIVE_INFINITY,
): DrawingReplayStep[] {
  let at = 0;
  const steps: DrawingReplayStep[] = [];
  for (const stroke of strokes) {
    const points = decodeDrawingStroke(stroke);
    for (let index = 0; index < points.length; index++) {
      const point = points[index];
      at += index === 0 ? 0 : Math.min(point.delayMs, DRAWING_REPLAY_MAX_DELAY_MS);
      steps.push({ at, stroke, from: index === 0 ? null : points[index - 1], to: point });
    }
  }
  if (at <= maxDurationMs) return steps;
  const scale = maxDurationMs / at;
  return steps.map((step) => ({ ...step, at: step.at * scale }));
}

export function drawingLineWidth(sizeQ4: number, pressure: number) {
  return (sizeQ4 / DRAWING_SCALE) * (0.2 + 0.8 * (pressure / 1024));
}

export function drawStrokePoint(
  context: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  point: DecodedDrawingPoint,
) {
  context.save();
  context.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
  context.fillStyle = stroke.color ?? "#000000";
  context.beginPath();
  context.arc(point.x, point.y, drawingLineWidth(stroke.size, point.pressure) / 2, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

export function drawStrokeSegment(
  context: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  from: DecodedDrawingPoint,
  to: DecodedDrawingPoint,
) {
  context.save();
  context.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
  context.strokeStyle = stroke.color ?? "#000000";
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth =
    (drawingLineWidth(stroke.size, from.pressure) + drawingLineWidth(stroke.size, to.pressure)) / 2;
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
  context.restore();
}

export function renderDrawing(context: CanvasRenderingContext2D, strokes: DrawingStroke[]) {
  context.clearRect(0, 0, DRAWING_WIDTH, DRAWING_HEIGHT);
  for (const stroke of strokes) {
    const points = decodeDrawingStroke(stroke);
    if (points.length === 1) drawStrokePoint(context, stroke, points[0]);
    for (let index = 1; index < points.length; index++) {
      drawStrokeSegment(context, stroke, points[index - 1], points[index]);
    }
  }
}

export async function createDrawingUpload(
  strokes: DrawingStroke[],
  background = DRAWING_BACKGROUND,
) {
  const ink = document.createElement("canvas");
  ink.width = DRAWING_WIDTH;
  ink.height = DRAWING_HEIGHT;
  const inkContext = ink.getContext("2d");
  if (!inkContext) throw new Error("Canvas is unavailable");
  renderDrawing(inkContext, strokes);

  const preview = document.createElement("canvas");
  preview.width = DRAWING_WIDTH;
  preview.height = DRAWING_HEIGHT;
  const previewContext = preview.getContext("2d");
  if (!previewContext) throw new Error("Canvas is unavailable");
  previewContext.fillStyle = background;
  previewContext.fillRect(0, 0, DRAWING_WIDTH, DRAWING_HEIGHT);
  previewContext.drawImage(ink, 0, 0);

  const { default: encodeWebp } = await import("@jsquash/webp/encode");
  const encoded = await encodeWebp(
    previewContext.getImageData(0, 0, DRAWING_WIDTH, DRAWING_HEIGHT),
    { quality: 90 },
  );
  return {
    data: new Blob([JSON.stringify(createDrawingDocument(strokes, background))], {
      type: "application/json",
    }),
    preview: new Blob([encoded], { type: "image/webp" }),
  };
}

export function undoDrawing(strokes: DrawingStroke[], redo: DrawingStroke[]) {
  if (strokes.length === 0) return { strokes, redo };
  return { strokes: strokes.slice(0, -1), redo: [...redo, strokes[strokes.length - 1]] };
}

export function redoDrawing(strokes: DrawingStroke[], redo: DrawingStroke[]) {
  const stroke = redo.at(-1);
  if (!stroke) return { strokes, redo };
  return { strokes: [...strokes, stroke], redo: redo.slice(0, -1) };
}
