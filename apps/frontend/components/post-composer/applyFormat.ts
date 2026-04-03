/**
 * Apply a text format change to a textarea while preserving the browser's
 * native undo/redo stack (Ctrl+Z / Cmd+Z).
 *
 * `document.execCommand('insertText')` is the only cross-browser mechanism
 * that both modifies textarea content *and* pushes an entry onto the
 * browser's undo stack. It fires a native `input` event, which React's
 * synthetic `onChange` will pick up automatically.
 *
 * Falls back to direct state update (losing undo support) in environments
 * where execCommand is unavailable or blocked.
 */
export function applyFormatToTextarea(
  textarea: HTMLTextAreaElement,
  newValue: string,
  newStart: number,
  newEnd: number,
  setContent: (v: string) => void,
  setSelectionRange: (r: { start: number; end: number }) => void,
): void {
  textarea.focus();

  // Select entire current content so we can replace it in one undoable step.
  textarea.setSelectionRange(0, textarea.value.length);

  // execCommand is deprecated but remains the only reliable way to integrate
  // with the browser undo stack inside a <textarea>.
  const success = document.execCommand("insertText", false, newValue);

  if (!success || textarea.value !== newValue) {
    // Fallback: no undo support, but at least the content stays correct.
    setContent(newValue);
  }

  requestAnimationFrame(() => {
    textarea.setSelectionRange(newStart, newEnd);
    setSelectionRange({ start: newStart, end: newEnd });
  });
}
