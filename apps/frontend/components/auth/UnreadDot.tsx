"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * The "something is waiting on one of your other accounts" mark.
 *
 * Deliberately a dot and not a count: it rides on the avatar and the menu row
 * that lead to the switcher, where the per-account numbers already are.
 * Position it with the className — the parent has to be `relative`.
 */
export function UnreadDot({ className }: { className?: string }) {
	const t = useTranslations();

	return (
		<span
			role="status"
			aria-label={t("accountSwitcher.otherAccountsUnread")}
			className={cn(
				"pointer-events-none absolute h-2 w-2 rounded-full bg-c-1 ring-2 ring-background",
				className
			)}
		/>
	);
}
