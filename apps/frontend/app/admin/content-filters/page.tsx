'use client';

import { useTranslations } from 'next-intl';
import { Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export default function ContentFiltersPage() {
	const t = useTranslations('admin.contentFilters');
	const tEmpty = useTranslations('admin.empty.contentFilters');

	return (
		<div>
			<div className="mb-8">
				<h1 className="text-3xl font-bold">{t('title')}</h1>
			</div>

			<Card className="p-6">
				<EmptyState
					icon={Shield}
					title={tEmpty('title')}
					description={tEmpty('description')}
				/>
			</Card>
		</div>
	);
}
