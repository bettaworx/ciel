import { describe, expect, it } from "vitest";
import {
  decodeDrawingStroke,
  drawingLineWidth,
  encodeDrawingPoint,
  redoDrawing,
  type DrawingStroke,
  undoDrawing,
} from "./drawing";

const stroke = (x: number): DrawingStroke => ({
  tool: "pencil",
  color: "#000000",
  size: 24,
  points: [[0, x, 0, 1024]],
});

describe("drawing format", () => {
  it("encodes the first point absolutely and later points as Q4 deltas", () => {
    const first = encodeDrawingPoint(null, { delayMs: 0, x: 10.25, y: 20.5, pressure: 512 });
    const second = encodeDrawingPoint(
      { x: 10.25, y: 20.5 },
      { delayMs: 8, x: 11, y: 20, pressure: 1024 },
    );
    const decoded = decodeDrawingStroke({
      tool: "pencil",
      color: "#000000",
      size: 24,
      points: [first, second],
    });

    expect(first).toEqual([0, 41, 82, 512]);
    expect(second).toEqual([8, 3, -2, 1024]);
    expect(decoded.at(-1)).toMatchObject({ x: 11, y: 20, pressure: 1024 });
  });

  it("applies pressure without reducing a stroke to zero width", () => {
    expect(drawingLineWidth(40, 0)).toBe(2);
    expect(drawingLineWidth(40, 1024)).toBe(10);
  });

  it("undoes and redoes whole strokes", () => {
    const a = stroke(1);
    const b = stroke(2);
    const undone = undoDrawing([a, b], []);
    expect(undone).toEqual({ strokes: [a], redo: [b] });
    expect(redoDrawing(undone.strokes, undone.redo)).toEqual({ strokes: [a, b], redo: [] });
  });
});
