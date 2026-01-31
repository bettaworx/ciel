'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Image from 'next/image';
import { ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
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

type AdminMedia = components['schemas']['AdminMedia'];

const api = createApiClient();

export default function MediaPage() {
	const t = useTranslations('admin.media');
	const tEmpty = useTranslations('admin.empty.media');
	const tCommon = useTranslations('admin.common');
	const queryClient = useQueryClient();

	// State
	const [userId, setUserId] = useState('');
	const [offset, setOffset] = useState(0);
	const limit = 20;

	// Dialogs
	const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; media: AdminMedia | null }>({
		open: false,
		media: null,
	});
	const [deleteReason, setDeleteReason] = useState('');

	// Fetch media
	const { data, isLoading, error } = useQuery({
		queryKey: ['admin', 'media', { userId, offset, limit }],
		queryFn: async () => {
			const result = await api.adminListMedia({
				userId: userId || undefined,
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
		mutationFn: async ({ mediaId, reason }: { mediaId: string; reason?: string }) => {
			const result = await api.adminDeleteMedia(mediaId, {
				reason: reason || undefined,
			});

			if (!result.ok) {
				throw new Error(result.errorText || t('deleteError'));
			}
		},
		onSuccess: () => {
			toast.success(t('deleteSuccess'));
			queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
			setDeleteDialog({ open: false, media: null });
			setDeleteReason('');
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Handlers
	const handleDelete = () => {
		if (!deleteDialog.media) return;
		deleteMutation.mutate({
			mediaId: deleteDialog.media.id,
			reason: deleteReason || undefined,
		});
	};

	const handlePreviousPage = () => {
		setOffset(Math.max(0, offset - limit));
	};

	const handleNextPage = () => {
		if (data && offset + limit < data.total) {
			setOffset(offset + limit);
		}
	};

	const handleClearFilters = () => {
		setUserId('');
		setOffset(0);
	};

	const hasActiveFilters = userId !== '';

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
					</div>
				</div>

				{/* Loading/Error/Table */}
				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				) : error ? (
					<div className="py-12 text-center text-sm text-destructive">
						{tCommon('error')}
					</div>
				) : !data?.items || data.items.length === 0 ? (
					<EmptyState
						icon={ImageIcon}
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
										<TableHead>{t('table.thumbnail')}</TableHead>
										<TableHead>ID</TableHead>
										<TableHead>{t('table.uploader')}</TableHead>
										<TableHead>Dimensions</TableHead>
										<TableHead>{t('table.uploadedAt')}</TableHead>
										<TableHead>{t('table.usedInPosts')}</TableHead>
										<TableHead className="text-right">{t('table.actions')}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.items.map((media) => (
										<TableRow key={media.id}>
										<TableCell>
											{media.type === 'image' ? (
												<div className="relative w-16 h-16">
													<Image
														src={media.url}
														alt={`Media ${media.id}`}
														fill
														unoptimized
														className="object-cover rounded"
													/>
												</div>
											) : (
												<div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs">
													{media.type}
												</div>
											)}
										</TableCell>
											<TableCell className="max-w-xs truncate font-mono text-xs">
												{media.id}
											</TableCell>
											<TableCell>
												{media.uploaderUsername ? (
													<a
														href={`/users/${media.uploaderUsername}`}
														className="text-blue-600 hover:underline"
													>
														@{media.uploaderUsername}
													</a>
												) : (
													<span className="text-muted-foreground">Unknown</span>
												)}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{media.width} × {media.height}
											</TableCell>
											<TableCell>{format(new Date(media.createdAt), 'yyyy-MM-dd HH:mm')}</TableCell>
											<TableCell className="text-center">{media.usedInPostsCount}</TableCell>
											<TableCell className="text-right space-x-2">
												<Button
													variant="destructive"
													size="sm"
													onClick={() => setDeleteDialog({ open: true, media })}
												>
													{t('deleteMedia')}
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
			<Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, media: null })}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('deleteMedia')}</DialogTitle>
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
								setDeleteDialog({ open: false, media: null });
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
		</div>
	);
}
