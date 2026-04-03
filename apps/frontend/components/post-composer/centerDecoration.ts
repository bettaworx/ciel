import { findSizeDecoration } from "./SizeFormatButton";
import { findFontDecoration } from "./FontFormatButton";

const OPEN = "<center>";
const CLOSE = "</center>";

/**
 * Compute the result of inserting a `<center>` decoration.
 *
 * Rules:
 * - `<center>` is always the outermost HTML wrapper.
 * - If the cursor / selection is inside a `$[...]` MFM block, the entire
 *   block is wrapped: `<center>$[x4 テスト]</center>`.
 * - Otherwise, the selected text (or empty placeholder) is wrapped normally.
 */
export function insertCenterDecoration(
  value: string,
  selectionStart: number,
  selectionEnd: number,
): { newValue: string; newStart: number; newEnd: number } {
  // If cursor/selection is inside an MFM $[...] block, wrap the whole block
  // so that <center> ends up outside $[...].
  const mfmMatch =
    findSizeDecoration(value, selectionStart, selectionEnd) ??
    findFontDecoration(value, selectionStart, selectionEnd);

  if (mfmMatch) {
    const block = value.slice(mfmMatch.prefixStart, mfmMatch.suffixEnd);
    const newValue =
      value.slice(0, mfmMatch.prefixStart) +
      OPEN + block + CLOSE +
      value.slice(mfmMatch.suffixEnd);
    return {
      newValue,
      newStart: mfmMatch.prefixStart + OPEN.length,
      newEnd: mfmMatch.suffixEnd + OPEN.length,
    };
  }

  const hasSelection = selectionStart !== selectionEnd;
  if (hasSelection) {
    const selected = value.slice(selectionStart, selectionEnd);
    return {
      newValue:
        value.slice(0, selectionStart) + OPEN + selected + CLOSE + value.slice(selectionEnd),
      newStart: selectionStart + OPEN.length,
      newEnd: selectionEnd + OPEN.length,
    };
  }

  return {
    newValue:
      value.slice(0, selectionStart) + OPEN + CLOSE + value.slice(selectionStart),
    newStart: selectionStart + OPEN.length,
    newEnd: selectionStart + OPEN.length,
  };
}
