'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/lib/api/use-api';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, ExternalLink, Users } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { components } from '@/lib/api/api';

type SortOption = 'created_desc' | 'created_asc' | 'username_asc' | 'username_desc';

export default function UsersPage() {
	const t = useTranslations('admin.users');
	const tEmpty = useTranslations('admin.empty.users');
	const tCommon = useTranslations('admin.common');
	const api = useApi();

	const [search, setSearch] = useState('');
	const [sort, setSort] = useState<SortOption>('created_desc');
	const [offset, setOffset] = useState(0);
	const limit = 20;

	const { data, isLoading, error } = useQuery({
		queryKey: ['adminUsers', search, sort, offset, limit],
		queryFn: async () => {
			const res = await api.adminSearchUsers({
				search: search || undefined,
				sort,
				offset,
				limit
			});
			if (!res.ok) throw new Error('Failed to fetch users');
			return res.data;
		}
	});

	// Fetch roles for all users in parallel
	const { data: userRoles, isLoading: rolesLoading } = useQuery({
		queryKey: ['adminUserRoles', data?.items?.map((u) => u.id)],
		queryFn: async () => {
			if (!data?.items) return new Map<string, components['schemas']['RoleId'][]>();

			// Fetch all roles in parallel
			const rolePromises = data.items.map(async (user) => {
				try {
					const res = await api.adminUserRoles(user.id);
					return {
						userId: user.id,
						roles: res.ok ? res.data : [],
					};
				} catch {
					// Silently fail - show nothing for this user
					return {
						userId: user.id,
						roles: [],
					};
				}
			});

			const results = await Promise.all(rolePromises);

			// Convert to Map for easy lookup
			const rolesMap = new Map<string, components['schemas']['RoleId'][]>();
			results.forEach(({ userId, roles }) => {
				rolesMap.set(userId, roles);
			});

			return rolesMap;
		},
		enabled: !!data?.items && data.items.length > 0,
	});

	// Helper function to get badge variant based on role
	const getRoleBadgeVariant = (roleId: string): 'default' | 'secondary' => {
		switch (roleId) {
			case 'admin':
				return 'default'; // Blue
			case 'user':
				return 'secondary'; // Gray
			default:
				return 'secondary';
		}
	};

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setOffset(0);
	};

	const handleClearFilters = () => {
		setSearch('');
		setOffset(0);
	};

	const hasActiveFilters = search !== '';

	return (
		<div>
			<div className="mb-8">
				<h1 className="text-3xl font-bold">{t('title')}</h1>
			</div>

			<Card className="p-6">
				<form onSubmit={handleSearchSubmit} className="mb-6 flex gap-4">
					<div className="flex-1">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="text"
								placeholder={t('searchPlaceholder')}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-10"
							/>
						</div>
					</div>
					<Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
						<SelectTrigger className="w-[200px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="created_desc">{t('sortOptions.created_desc')}</SelectItem>
							<SelectItem value="created_asc">{t('sortOptions.created_asc')}</SelectItem>
							<SelectItem value="username_asc">{t('sortOptions.username_asc')}</SelectItem>
							<SelectItem value="username_desc">{t('sortOptions.username_desc')}</SelectItem>
						</SelectContent>
					</Select>
				</form>

				{isLoading && (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				)}

				{error && (
					<div className="py-12 text-center text-sm text-destructive">
						{tCommon('error')}
					</div>
				)}

				{data && (
					<>
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b text-left text-sm font-medium text-muted-foreground">
										<th className="pb-3">{t('table.username')}</th>
										<th className="pb-3">{t('table.displayName')}</th>
										<th className="pb-3">{t('table.roles')}</th>
										<th className="pb-3">{t('table.createdAt')}</th>
										<th className="pb-3">{t('table.actions')}</th>
									</tr>
								</thead>
								<tbody>
									{data.items?.map((user) => (
										<tr key={user.id} className="border-b last:border-0">
											<td className="py-4">
												<Link
													href={`/users/${user.username}`}
													className="font-medium hover:underline"
												>
													{user.username}
												</Link>
											</td>
											<td className="py-4 text-muted-foreground">
												{user.displayName || '-'}
											</td>
											<td className="py-4">
												<div className="flex flex-wrap gap-1">
													{rolesLoading ? (
														// Loading skeleton - show max 3 placeholders
														<>
															<div className="h-5 w-12 animate-pulse rounded-md bg-muted" />
															<div className="h-5 w-16 animate-pulse rounded-md bg-muted" />
														</>
													) : userRoles?.get(user.id)?.length ? (
														// Display roles with badges (max 3 + "...")
														<>
															{userRoles
																.get(user.id)!
																.slice(0, 3)
																.map((roleId) => (
																	<Badge
																		key={roleId}
																		variant={getRoleBadgeVariant(roleId)}
																	>
																		{t(`roles.${roleId}`)}
																	</Badge>
																))}
															{userRoles.get(user.id)!.length > 3 && (
																<span className="text-xs text-muted-foreground">
																	+{userRoles.get(user.id)!.length - 3}
																</span>
															)}
														</>
													) : (
														// No roles or error - show nothing
														<span className="text-xs text-muted-foreground">-</span>
													)}
												</div>
											</td>
											<td className="py-4 text-sm text-muted-foreground">
												{format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm')}
											</td>
											<td className="py-4">
												<Link href={`/admin/users/${user.id}`}>
													<Button variant="outline" size="sm">
														<ExternalLink className="mr-1 h-3 w-3" />
														{t('viewDetails')}
													</Button>
												</Link>
											</td>
										</tr>
									))}
					</tbody>
						</table>
					</div>

					{(!data.items || data.items.length === 0) && (
						<EmptyState
							icon={Users}
							title={tEmpty('title')}
							description={hasActiveFilters ? tEmpty('description') : undefined}
							action={
								hasActiveFilters
									? {
											label: tEmpty('clearFilters'),
											onClick: handleClearFilters,
									  }
									: undefined
							}
						/>
					)}

						{data.total > limit && (
							<div className="mt-6 flex items-center justify-between">
								<div className="text-sm text-muted-foreground">
									{offset + 1} - {Math.min(offset + limit, data.total)} / {data.total}
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={offset === 0}
										onClick={() => setOffset(Math.max(0, offset - limit))}
									>
										Previous
									</Button>
									<Button
										variant="outline"
										size="sm"
										disabled={offset + limit >= data.total}
										onClick={() => setOffset(offset + limit)}
									>
										Next
									</Button>
								</div>
							</div>
						)}
					</>
				)}
			</Card>
		</div>
	);
}
