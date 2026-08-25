"use client";

import { useTranslations } from "next-intl";
import { Check, Plus, ChevronLeft } from "lucide-react";
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
	onBack?: () => void;
}

export function AccountSwitcherContent({
	accounts,
	activeUserId,
	onAccountClick,
	onAddAccount,
	onBack,
}: AccountSwitcherContentProps) {
	const t = useTranslations();

	return (
		<div className="w-full">
			<div className="flex items-center gap-2 p-3">
				{onBack && (
					<Button
						variant="ghost"
						size="icon"
						rounded="md"
						className="h-8 w-8 shrink-0"
						onClick={onBack}
						aria-label={t("common.back")}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
				)}
				{!onBack && (
					<h2 className="text-sm font-semibold">{t("userMenu.switchAccount")}</h2>
				)}
			</div>

			<Separator />

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
								isActive && "bg-muted/50"
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
