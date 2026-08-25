"use client";

import { useTranslations } from "next-intl";
import { Check, Plus } from "lucide-react";
import type { AccountEntry } from "@/atoms/accounts";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { DisplayName } from "@/components/users/DisplayName";
import { cn } from "@/lib/utils";

const MAX_DISPLAYED = 9;

interface AccountSwitcherContentProps {
	accounts: AccountEntry[];
	activeUserId: string;
	onAccountClick: (account: AccountEntry) => void;
	onAddAccount: () => void;
}

export function AccountSwitcherContent({
	accounts,
	activeUserId,
	onAccountClick,
	onAddAccount,
}: AccountSwitcherContentProps) {
	const t = useTranslations();

	// No header and no back button: this is its own sheet, and the footer's
	// Close is the only way out it needs.
	return (
		<div className="w-full">
			<div className="p-2 space-y-0.5">
				{accounts.map((account) => {
					const isActive = account.userId === activeUserId;
					const initials = (account.displayName?.[0] || account.username[0]).toUpperCase();

					return (
						<Button
							key={account.userId}
							variant="ghost"
							rounded="md"
							className={cn(
								"w-full justify-start gap-3 h-auto py-2.5 px-2",
								// The active row is not clickable, but it is the user's own
								// account: dimming it reads as "unavailable", not "current".
								isActive && "bg-muted/50 disabled:opacity-100"
							)}
							onClick={() => !isActive && onAccountClick(account)}
							disabled={isActive}
						>
							<Avatar className="h-10 w-10 shrink-0">
								<AvatarImage
									src={account.avatarUrl ?? undefined}
									alt={account.displayName || account.username}
								/>
								<AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
									{initials}
								</AvatarFallback>
							</Avatar>

							<div className="flex-1 min-w-0 text-left">
								<div className="text-sm font-semibold truncate">
									{account.displayName ? (
										<DisplayName name={account.displayName} isPrivate={false} />
									) : (
										`@${account.username}`
									)}
								</div>
								{account.displayName && (
									<div className="text-xs text-muted-foreground truncate">
										@{account.username}
									</div>
								)}
							</div>

							<div className="shrink-0 w-5 flex items-center justify-center">
								{isActive ? (
									<Check className="h-4 w-4 text-c-1" aria-label={t("accountSwitcher.active")} />
								) : account.cachedUnreadCount > 0 ? (
									<span
										role="status"
										className={cn(
											"flex h-4 min-w-4 items-center justify-center",
											"rounded-full bg-c-1 px-1 text-[9px] leading-none font-semibold text-c-foreground"
										)}
									>
										{account.cachedUnreadCount > MAX_DISPLAYED
											? `${MAX_DISPLAYED}+`
											: account.cachedUnreadCount}
									</span>
								) : null}
							</div>
						</Button>
					);
				})}
			</div>

			{accounts.length > 0 && <Separator />}

			<div className="p-2">
				<Button
					variant="ghost"
					rounded="md"
					className="w-full justify-start gap-2"
					onClick={onAddAccount}
				>
					<Plus className="h-4 w-4" />
					{t("accountSwitcher.addAccount")}
				</Button>
			</div>
		</div>
	);
}
