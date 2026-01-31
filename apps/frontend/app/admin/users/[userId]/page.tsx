'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useApi } from '@/lib/api/use-api';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { use } from 'react';

export default function UserDetailPage({
	params
}: {
	params: Promise<{ userId: string }>;
}) {
	const { userId } = use(params);
	const t = useTranslations('admin.users');
	const tCommon = useTranslations('admin.common');
	const api = useApi();

	const { data: user, isLoading: userLoading } = useQuery({
		queryKey: ['adminUser', userId],
		queryFn: async () => {
			// Note: We don't have a dedicated admin user detail endpoint,
			// so we'll need to add this or use the regular user endpoint
			// For now, using a placeholder
			return null;
		}
	});

	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ['adminUserStats', userId],
		queryFn: async () => {
			const res = await api.adminGetUserStats(userId);
			if (!res.ok) throw new Error('Failed to fetch user stats');
			return res.data;
		}
	});

	const { data: mutes } = useQuery({
		queryKey: ['adminUserMutes', userId],
		queryFn: async () => {
			const res = await api.adminGetUserMutes(userId);
			if (!res.ok) throw new Error('Failed to fetch user mutes');
			return res.data;
		}
	});

	const { data: note } = useQuery({
		queryKey: ['adminUserNote', userId],
		queryFn: async () => {
			const res = await api.adminGetUserNote(userId);
			if (!res.ok) {
				if (res.status === 404) return null;
				throw new Error('Failed to fetch user note');
			}
			return res.data;
		}
	});

	const isLoading = userLoading || statsLoading;

	if (isLoading) {
		return (
			<div>
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			</div>
		);
	}

	return (
		<div>
			<div className="mb-8">
				<Link href="/admin/users">
					<Button variant="ghost" size="sm" className="mb-4">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Users
					</Button>
				</Link>
				<h1 className="text-3xl font-bold">User Details</h1>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* User Info */}
				<Card>
					<CardHeader>
						<CardTitle>User Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center space-x-4">
							<Avatar className="h-16 w-16">
								<AvatarImage src={`/placeholder-avatar.png`} />
								<AvatarFallback>
									<UserIcon className="h-8 w-8" />
								</AvatarFallback>
							</Avatar>
							<div>
								<div className="font-medium">User ID: {userId}</div>
								<div className="text-sm text-muted-foreground">
									Loading user details...
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Statistics */}
				<Card>
					<CardHeader>
						<CardTitle>Statistics</CardTitle>
					</CardHeader>
					<CardContent>
						{stats ? (
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Posts</span>
									<span className="font-medium">{stats.postsCount}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Media Uploaded</span>
									<span className="font-medium">{stats.mediaCount}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Reports Submitted</span>
									<span className="font-medium">{stats.reportsCount}</span>
								</div>
							</div>
						) : (
							<div className="text-sm text-muted-foreground">No statistics available</div>
						)}
					</CardContent>
				</Card>

				{/* Mutes */}
				<Card>
					<CardHeader>
						<CardTitle>Active Mutes</CardTitle>
					</CardHeader>
					<CardContent>
						{mutes && mutes.length > 0 ? (
							<div className="space-y-2">
								{mutes.map((mute) => (
									<div key={mute.muteType} className="flex items-center justify-between rounded-lg border p-3">
										<div>
											<div className="font-medium">{mute.muteType}</div>
											{mute.expiresAt && (
												<div className="text-xs text-muted-foreground">
													Expires: {format(new Date(mute.expiresAt), 'yyyy-MM-dd HH:mm')}
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-sm text-muted-foreground">No active mutes</div>
						)}
					</CardContent>
				</Card>

				{/* Admin Note */}
				<Card>
					<CardHeader>
						<CardTitle>Admin Note</CardTitle>
					</CardHeader>
					<CardContent>
						{note ? (
							<div className="space-y-2">
								<p className="text-sm">{note.content}</p>
								<div className="text-xs text-muted-foreground">
									Last updated: {format(new Date(note.updatedAt), 'yyyy-MM-dd HH:mm')}
								</div>
							</div>
						) : (
							<div className="text-sm text-muted-foreground">No admin note</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
