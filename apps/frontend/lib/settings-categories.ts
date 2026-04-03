import { Settings, Palette, User, UserCog, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SettingsCategory {
	id: string;
	labelKey: string;
	icon: LucideIcon;
	href: string;
}

export const settingsCategories: SettingsCategory[] = [
	{
		id: 'general',
		labelKey: 'settings.categories.general',
		icon: Settings,
		href: '/settings/general',
	},
	{
		id: 'profile',
		labelKey: 'settings.categories.profile',
		icon: User,
		href: '/settings/profile',
	},
	{
		id: 'account',
		labelKey: 'settings.categories.account',
		icon: UserCog,
		href: '/settings/account',
	},
	{
		id: 'appearance',
		labelKey: 'settings.categories.appearance',
		icon: Palette,
		href: '/settings/appearance',
	},
	{
		id: 'security',
		labelKey: 'settings.categories.security',
		icon: Shield,
		href: '/settings/security',
	},
];
