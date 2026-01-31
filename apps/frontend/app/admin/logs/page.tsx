'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';

export default function LogsPage() {
	const t = useTranslations('admin.nav');

	return (
		<div>
			<div className="mb-8">
				<h1 className="text-3xl font-bold">{t('logs')}</h1>
			</div>

			<Card className="p-6">
				<div className="text-center py-12 text-muted-foreground">
					Coming soon...
				</div>
			</Card>
		</div>
	);
}
