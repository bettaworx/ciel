'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import { createApiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/api';

type PostVisibility = components['schemas']['PostVisibility'];
type AdminPost = components['schemas']['AdminPost'];

const api = createApiClient();

export default function PostsPage() {
	const t = useTranslations('admin.posts');
	const tEmpty = useTranslations('admin.empty.posts');
	const tCommon = useTranslations('admin.common');
	const queryClient = useQueryClient();

	// State
	const [userId, setUserId] = useState('');
	const [visibility, setVisibility] = useState<PostVisibility | 'all'>('all');
	const [offset, setOffset] = useState(0);
	const limit = 20;

	// Dialogs
	const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; post: AdminPost | null }>({
		open: false,
		post: null,
	});
	const [deleteReason, setDeleteReason] = useState('');

	const [visibilityDialog, setVisibilityDialog] = useState<{
		open: boolean;
		post: AdminPost | null;
	}>({
		open: false,
		post: null,
	});
	const [newVisibility, setNewVisibility] = useState<PostVisibility>('public');

	// Fetch posts
	const { data, isLoading, error } = useQuery({
		queryKey: ['admin', 'posts', { userId, visibility, offset, limit }],
		queryFn: async () => {
			const result = await api.adminListPosts({
				userId: userId || undefined,
				visibility: visibility === 'all' ? undefined : visibility,
				offset,
				limit,
			});

			if (!result.ok) {
				throw new Error(result.errorText || tCommon('error'));
			}

			return result.data;
		},
	});

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async ({ postId, reason }: { postId: string; reason?: string }) => {
			const result = await api.adminDeletePost(postId, {
				reason: reason || undefined,
			});

			if (!result.ok) {
				throw new Error(result.errorText || t('deleteError'));
			}
		},
		onSuccess: () => {
			toast.success(t('deleteSuccess'));
			queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
			setDeleteDialog({ open: false, post: null });
			setDeleteReason('');
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Update visibility mutation
	const visibilityMutation = useMutation({
		mutationFn: async ({ postId, visibility }: { postId: string; visibility: PostVisibility }) => {
			const result = await api.adminUpdatePostVisibility(postId, { visibility });

			if (!result.ok) {
				throw new Error(result.errorText || t('visibilityUpdateError'));
			}
		},
		onSuccess: () => {
			toast.success(t('visibilityUpdateSuccess'));
			queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
			setVisibilityDialog({ open: false, post: null });
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Handlers
	const handleDelete = () => {
		if (!deleteDialog.post) return;
		deleteMutation.mutate({
			postId: deleteDialog.post.id,
			reason: deleteReason || undefined,
		});
	};

	const handleUpdateVisibility = () => {
		if (!visibilityDialog.post) return;
		visibilityMutation.mutate({
			postId: visibilityDialog.post.id,
			visibility: newVisibility,
		});
	};

	const handleOpenVisibilityDialog = (post: AdminPost) => {
		setVisibilityDialog({ open: true, post });
		setNewVisibility(post.visibility);
	};

	const handlePreviousPage = () => {
		setOffset(Math.max(0, offset - limit));
	};

	const handleNextPage = () => {
		if (data && offset + limit < data.total) {
			setOffset(offset + limit);
		}
	};

	const getVisibilityBadgeColor = (vis: PostVisibility) => {
		switch (vis) {
			case 'public':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
			case 'hidden':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
			case 'deleted':
				return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
		}
	};

	const handleClearFilters = () => {
		setUserId('');
		setVisibility('all');
		setOffset(0);
	};

	const hasActiveFilters = userId !== '' || visibility !== 'all';

	return (
		<div>
			<div className="mb-8">
				<h1 className="text-3xl font-bold">{t('title')}</h1>
			</div>

			<Card className="p-6">
				{/* Filters */}
				<div className="mb-6 space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<Label htmlFor="userId">{t('filterByUser')}</Label>
							<Input
								id="userId"
								placeholder={t('filterByUserPlaceholder')}
								value={userId}
								onChange={(e) => {
									setUserId(e.target.value);
									setOffset(0);
								}}
							/>
						</div>
						<div>
							<Label htmlFor="visibility">{t('filterByVisibility')}</Label>
							<Select
								value={visibility}
								onValueChange={(value) => {
									setVisibility(value as PostVisibility | 'all');
									setOffset(0);
								}}
							>
								<SelectTrigger id="visibility">
									<SelectValue placeholder={t('allVisibility')} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t('allVisibility')}</SelectItem>
									<SelectItem value="public">{t('visibility.public')}</SelectItem>
									<SelectItem value="hidden">{t('visibility.hidden')}</SelectItem>
									<SelectItem value="deleted">{t('visibility.deleted')}</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				{/* Table */}
				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				) : error ? (
					<div className="py-12 text-center text-sm text-destructive">{tCommon('error')}</div>
				) : !data?.items || data.items.length === 0 ? (
					<EmptyState
						icon={FileText}
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
				) : (
					<>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t('table.content')}</TableHead>
										<TableHead>{t('table.author')}</TableHead>
										<TableHead>{t('table.visibility')}</TableHead>
										<TableHead>{t('table.createdAt')}</TableHead>
										<TableHead className="text-right">{t('table.actions')}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.items.map((post) => (
										<TableRow key={post.id}>
											<TableCell className="max-w-md truncate">{post.content}</TableCell>
											<TableCell>
												<a
													href={`/users/${post.author.username}`}
													className="text-blue-600 hover:underline"
												>
													@{post.author.username}
												</a>
											</TableCell>
											<TableCell>
												<span
													className={`px-2 py-1 rounded-full text-xs font-medium ${getVisibilityBadgeColor(
														post.visibility
													)}`}
												>
											{t(`visibility.${post.visibility}`)}
										</span>
									</TableCell>
									<TableCell>{format(new Date(post.createdAt), 'yyyy-MM-dd HH:mm')}</TableCell>
									<TableCell className="text-right space-x-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleOpenVisibilityDialog(post)}
										>
											{t('changeVisibility')}
										</Button>
										<Button
											variant="destructive"
											size="sm"
											onClick={() => setDeleteDialog({ open: true, post })}
										>
											{t('deletePost')}
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				{/* Pagination */}
				{data.total > limit && (
					<div className="mt-6 flex items-center justify-between">
						<div className="text-sm text-muted-foreground">
							{offset + 1} - {Math.min(offset + limit, data.total)} / {data.total}
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handlePreviousPage}
								disabled={offset === 0}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleNextPage}
								disabled={offset + limit >= data.total}
							>
								Next
							</Button>
						</div>
					</div>
				)}
			</>
			)}
		</Card>

			{/* Delete Dialog */}
			<Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, post: null })}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('deletePost')}</DialogTitle>
						<DialogDescription>{t('deleteConfirm')}</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="deleteReason">{t('deleteReason')}</Label>
							<Textarea
								id="deleteReason"
								placeholder={t('deleteReasonPlaceholder')}
								value={deleteReason}
								onChange={(e) => setDeleteReason(e.target.value)}
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setDeleteDialog({ open: false, post: null });
								setDeleteReason('');
							}}
						>
							{tCommon('cancel')}
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending ? tCommon('loading') : tCommon('delete')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Visibility Dialog */}
			<Dialog
				open={visibilityDialog.open}
				onOpenChange={(open) => setVisibilityDialog({ open, post: null })}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('changeVisibility')}</DialogTitle>
						<DialogDescription>{t('selectVisibility')}</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="newVisibility">{t('table.visibility')}</Label>
							<Select value={newVisibility} onValueChange={(v) => setNewVisibility(v as PostVisibility)}>
								<SelectTrigger id="newVisibility">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="public">{t('visibility.public')}</SelectItem>
									<SelectItem value="hidden">{t('visibility.hidden')}</SelectItem>
									<SelectItem value="deleted">{t('visibility.deleted')}</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setVisibilityDialog({ open: false, post: null })}
						>
							{tCommon('cancel')}
						</Button>
						<Button
							onClick={handleUpdateVisibility}
							disabled={visibilityMutation.isPending}
						>
							{visibilityMutation.isPending ? tCommon('loading') : t('updateVisibility')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
