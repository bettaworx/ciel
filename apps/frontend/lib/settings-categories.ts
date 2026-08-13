import { Settings, Palette, Shield, EyeOff } from 'lucide-react';
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
		id: 'privacy',
		labelKey: 'settings.categories.privacy',
		icon: EyeOff,
		href: '/settings/privacy',
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
