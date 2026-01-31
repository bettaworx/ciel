'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Image } from 'lucide-react';
import { useApi } from '@/lib/api/use-api';
import { useQuery } from '@tanstack/react-query';

export default function AdminDashboard() {
	const t = useTranslations('admin.dashboard');
	const api = useApi();

	const { data: stats, isLoading, isError } = useQuery({
		queryKey: ['admin', 'dashboard', 'stats'],
		queryFn: async () => {
			const result = await api.adminDashboardStats();
			if (!result.ok) {
				throw new Error(result.errorText);
			}
			return result.data;
		}
	});

	return (
		<div>
			<div className="mb-8">
				<h1 className="text-3xl font-bold">{t('title')}</h1>
				<p className="mt-2 text-muted-foreground">{t('welcome')}</p>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t('stats.totalUsers')}
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{isLoading ? '--' : isError ? 'Error' : stats?.totalUsers?.toLocaleString() ?? '0'}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t('stats.totalPosts')}
						</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{isLoading ? '--' : isError ? 'Error' : stats?.totalPosts?.toLocaleString() ?? '0'}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							{t('stats.totalMedia')}
						</CardTitle>
						<Image className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{isLoading ? '--' : isError ? 'Error' : stats?.totalMedia?.toLocaleString() ?? '0'}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
