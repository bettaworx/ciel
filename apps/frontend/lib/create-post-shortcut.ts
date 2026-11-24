export function isCreatePostShortcut(
  event: Pick<
    KeyboardEvent,
    "key" | "ctrlKey" | "metaKey" | "altKey" | "isComposing" | "repeat" | "defaultPrevented"
  >,
  target: Pick<HTMLElement, "tagName" | "isContentEditable"> | null,
): boolean {
  return (
    event.key.toLowerCase() === "n" &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !event.isComposing &&
    !event.repeat &&
    !event.defaultPrevented &&
    !target?.isContentEditable &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")
  );
}
