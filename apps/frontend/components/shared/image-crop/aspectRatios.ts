export type AspectRatioId =
  | "free"
  | "original"
  | "1:1"
  | "5:4"
  | "4:3"
  | "3:2"
  | "16:9"
  | "4:5"
  | "3:4"
  | "2:3"
  | "9:16";

export interface AspectRatioOption {
  id: AspectRatioId;
  labelKey: string;
  ratio: number | "free" | "original";
}

export const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { id: "free", labelKey: "ratioFree", ratio: "free" },
  { id: "original", labelKey: "ratioOriginal", ratio: "original" },
  { id: "1:1", labelKey: "ratio11", ratio: 1 },
  { id: "5:4", labelKey: "ratio54", ratio: 5 / 4 },
  { id: "4:3", labelKey: "ratio43", ratio: 4 / 3 },
  { id: "3:2", labelKey: "ratio32", ratio: 3 / 2 },
  { id: "16:9", labelKey: "ratio169", ratio: 16 / 9 },
  { id: "4:5", labelKey: "ratio45", ratio: 4 / 5 },
  { id: "3:4", labelKey: "ratio34", ratio: 3 / 4 },
  { id: "2:3", labelKey: "ratio23", ratio: 2 / 3 },
  { id: "9:16", labelKey: "ratio916", ratio: 9 / 16 },
];

export function resolveAspect(
  id: AspectRatioId,
  imageW: number,
  imageH: number,
): number | undefined {
  const opt = ASPECT_RATIO_OPTIONS.find((o) => o.id === id);
  if (!opt) return undefined;
  if (opt.ratio === "free") return undefined;
  if (opt.ratio === "original") {
    if (imageW <= 0 || imageH <= 0) return undefined;
    return imageW / imageH;
  }
  return opt.ratio;
}
