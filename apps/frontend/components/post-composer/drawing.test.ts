import { describe, expect, it } from "vitest";
import {
  buildDrawingReplay,
  createDrawingDocument,
  decodeDrawingStroke,
  drawingPostPalette,
  drawingLineWidth,
  encodeDrawingPoint,
  parseDrawingDocument,
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

  it("serializes pencil colors and colorless erasers in the v1 document", () => {
    const pencil = stroke(1);
    const eraser: DrawingStroke = {
      tool: "eraser",
      size: 128,
      points: [[0, 8, 8, 1024]],
    };
    expect(createDrawingDocument([pencil, eraser])).toEqual({
      version: 1,
      background: "#FFFFFF",
      strokes: [pencil, eraser],
    });
    expect(eraser).not.toHaveProperty("color");
    expect(createDrawingDocument([pencil], "#abcdef").background).toBe("#ABCDEF");
  });

  it("builds one replay timeline across strokes", () => {
    const first = stroke(4);
    first.points.push([10, 4, 0, 1024]);
    const second = stroke(8);
    second.points[0][0] = 25;
    expect(buildDrawingReplay([first, second]).map((step) => step.at)).toEqual([0, 10, 10]);
  });

  it("skips idle time and compresses long replays to the requested duration", () => {
    const long = stroke(4);
    long.points.push([6000, 4, 0, 1024]);
    expect(buildDrawingReplay([long]).at(-1)?.at).toBe(32);
    expect(buildDrawingReplay([long], 10).at(-1)?.at).toBe(10);
  });

  it("selects the readable post-card theme for the drawing background", () => {
    expect(drawingPostPalette("#000000").theme).toBe("dark");
    expect(drawingPostPalette("#FFFFFF").theme).toBe("light");
    expect(drawingPostPalette("#777777").theme).toBe("dark");
    expect(drawingPostPalette("#808080").theme).toBe("light");
    expect(drawingPostPalette("#CC3333")).toMatchObject({
      foreground: expect.stringMatching(/^hsl\(0 /),
      hover: expect.stringMatching(/^hsl\(0 /),
    });
  });

  it("rejects malformed replay documents", () => {
    expect(parseDrawingDocument(createDrawingDocument([stroke(1)]))).not.toBeNull();
    expect(
      parseDrawingDocument({
        version: 1,
        background: "#FFFFFF",
        strokes: [{ tool: "eraser", color: "#FFFFFF", size: 10, points: [[0, 0, 0, 1]] }],
      }),
    ).toBeNull();
  });
});
