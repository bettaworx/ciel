import { Settings, Palette, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SettingsCategory {
	id: string;
	labelKey: string;
	icon: LucideIcon;
	href: string;
}

export const settingsCategories: SettingsCategory[] = [
	{
		id: 'profile',
		labelKey: 'settings.categories.profile',
		icon: User,
		href: '/settings/profile',
	},
	{
		id: 'general',
		labelKey: 'settings.categories.general',
		icon: Settings,
		href: '/settings/general',
	},
	{
		id: 'appearance',
		labelKey: 'settings.categories.appearance',
		icon: Palette,
		href: '/settings/appearance',
	},
];
