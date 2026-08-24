"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

export type ModalFormFactor = "dialog" | "sheet";

/**
 * Dialog on a wide window, bottom sheet on a narrow one — decided once, when
 * the modal opens.
 *
 * Swapping mid-flow tears one modal down and builds another: focus is lost, the
 * close animation never runs, and the body styles the outgoing one installed can
 * outlive it, leaving the page stuck behind a dead overlay. So the choice is
 * held for as long as the modal is up, and resizing across the breakpoint waits
 * until it closes.
 *
 * Returning null covers the first client render, where useMediaQuery has not
 * measured yet and still reports false — without it a desktop would flash a
 * sheet and tear it straight down, which is the same swap by another name.
 */
export function useModalFormFactor(open: boolean): ModalFormFactor | null {
	const isDesktop = useMediaQuery("(min-width: 640px)");
	const [measured, setMeasured] = useState(false);
	useEffect(() => setMeasured(true), []);

	const held = useRef<ModalFormFactor | null>(null);
	if (!measured) return null;

	const current: ModalFormFactor = isDesktop ? "dialog" : "sheet";
	// Closed, so there is nothing to disturb: follow the breakpoint freely.
	if (!open || !held.current) held.current = current;
	return held.current;
}
