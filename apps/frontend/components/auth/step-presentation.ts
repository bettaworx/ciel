/**
 * How an auth step is being presented, and the type scale that goes with it.
 *
 * `"wizard"` is the full-screen login/setup shell, where the heading is the
 * only thing on the page and carries it. `"dialog"` and `"sheet"` are the
 * step-up prompt: both borrow DialogTitle's scale so the prompt reads like
 * every other dialog in the app, and differ only in alignment — a sheet
 * centres its heading and stacks the profile above it.
 */
export type StepPresentation = "wizard" | "dialog" | "sheet";

// Kept in step with DialogTitle / DialogDescription in components/ui/dialog.tsx
// (DrawerTitle and DrawerDescription use the same two). The steps render inside
// both a Dialog and a Drawer, so they cannot use those components directly —
// each needs its own Radix context — which is why the classes live here rather
// than being imported.
const PROMPT_HEADING = "text-lg font-semibold leading-none tracking-tight";
const PROMPT_DESCRIPTION = "text-sm text-muted-foreground";

export function stepHeadingClass(presentation: StepPresentation): string {
	return presentation === "wizard" ? "text-2xl font-bold" : PROMPT_HEADING;
}

export function stepDescriptionClass(presentation: StepPresentation): string {
	return presentation === "wizard" ? "text-muted-foreground" : PROMPT_DESCRIPTION;
}
