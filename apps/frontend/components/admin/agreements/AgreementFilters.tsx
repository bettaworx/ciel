'use client';

import { useTranslations } from 'next-intl';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

interface AgreementFiltersProps {
	type: string;
	language: string;
	status: string;
	onTypeChange: (value: string) => void;
	onLanguageChange: (value: string) => void;
	onStatusChange: (value: string) => void;
}

export function AgreementFilters({
	type,
	language,
	status,
	onTypeChange,
	onLanguageChange,
	onStatusChange,
}: AgreementFiltersProps) {
	const t = useTranslations('admin.agreements');

	return (
		<div className="flex flex-col gap-4 sm:flex-row">
			<div className="flex-1">
				<Select value={type} onValueChange={onTypeChange}>
					<SelectTrigger>
						<SelectValue placeholder={t('filters.type')} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t('filters.all')}</SelectItem>
						<SelectItem value="terms">{t('types.terms')}</SelectItem>
						<SelectItem value="privacy">{t('types.privacy')}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex-1">
				<Select value={language} onValueChange={onLanguageChange}>
					<SelectTrigger>
						<SelectValue placeholder={t('filters.language')} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t('filters.all')}</SelectItem>
						<SelectItem value="en">{t('languages.en')}</SelectItem>
						<SelectItem value="ja">{t('languages.ja')}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="flex-1">
				<Select value={status} onValueChange={onStatusChange}>
					<SelectTrigger>
						<SelectValue placeholder={t('filters.status')} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t('filters.all')}</SelectItem>
						<SelectItem value="draft">{t('status.draft')}</SelectItem>
						<SelectItem value="published">{t('status.published')}</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
