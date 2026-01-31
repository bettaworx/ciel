'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Eye, Edit, Trash, Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { AgreementFilters } from '@/components/admin/agreements/AgreementFilters';
import { PublishConfirmDialog } from '@/components/admin/agreements/PublishConfirmDialog';
import { DeleteConfirmDialog } from '@/components/admin/agreements/DeleteConfirmDialog';
import {
	useAdminAgreementDocuments,
	useAdminPublishAgreementDocument,
	useAdminDeleteAgreementDocument,
} from '@/lib/hooks/use-queries';
import { toast } from 'sonner';
import type { components } from '@/lib/api/api';

type AgreementDocument = components['schemas']['AgreementDocument'];

export default function AgreementsPage() {
	const t = useTranslations('admin.agreements');
	const tEmpty = useTranslations('admin.empty.agreements');
	const router = useRouter();

	// Filters
	const [typeFilter, setTypeFilter] = useState<string>('all');
	const [languageFilter, setLanguageFilter] = useState<string>('all');
	const [statusFilter, setStatusFilter] = useState<string>('all');

	// Build query params
	const queryParams = {
		type: typeFilter !== 'all' ? (typeFilter as 'terms' | 'privacy') : undefined,
		language: languageFilter !== 'all' ? (languageFilter as 'en' | 'ja') : undefined,
		status: statusFilter !== 'all' ? (statusFilter as 'draft' | 'published') : undefined,
	};

	const { data, isLoading, error } = useAdminAgreementDocuments(queryParams);

	// Publish dialog
	const [publishDialog, setPublishDialog] = useState<{ open: boolean; documentId: string | null }>({
		open: false,
		documentId: null,
	});
	const publishMutation = useAdminPublishAgreementDocument();

	// Delete dialog
	const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; documentId: string | null }>({
		open: false,
		documentId: null,
	});
	const deleteMutation = useAdminDeleteAgreementDocument();

	const handlePublish = async () => {
		if (!publishDialog.documentId) return;
		try {
			await publishMutation.mutateAsync(publishDialog.documentId);
			toast.success(t('messages.publishSuccess'));
			setPublishDialog({ open: false, documentId: null });
		} catch (error) {
			toast.error(t('messages.publishError'));
		}
	};

	const handleDelete = async () => {
		if (!deleteDialog.documentId) return;
		try {
			await deleteMutation.mutateAsync(deleteDialog.documentId);
			toast.success(t('messages.deleteSuccess'));
			setDeleteDialog({ open: false, documentId: null });
		} catch (error) {
			toast.error(t('messages.deleteError'));
		}
	};

	const documents = data?.items || [];
	const hasDocuments = documents.length > 0;

	return (
		<div>
			<div className="mb-8 flex items-center justify-between">
				<h1 className="text-3xl font-bold">{t('title')}</h1>
				<Button onClick={() => router.push('/admin/agreements/new')}>
					<Plus className="mr-2 h-4 w-4" />
					{t('create')}
				</Button>
			</div>

			<Card className="p-6">
				<div className="mb-6">
					<AgreementFilters
						type={typeFilter}
						language={languageFilter}
						status={statusFilter}
						onTypeChange={setTypeFilter}
						onLanguageChange={setLanguageFilter}
						onStatusChange={setStatusFilter}
					/>
				</div>

				{isLoading ? (
					<div className="py-8 text-center text-muted-foreground">Loading...</div>
				) : hasDocuments ? (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t('fields.type')}</TableHead>
								<TableHead>{t('fields.language')}</TableHead>
								<TableHead>{t('fields.version')}</TableHead>
								<TableHead>{t('fields.title')}</TableHead>
								<TableHead>{t('fields.status')}</TableHead>
								<TableHead>{t('fields.updatedAt')}</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{documents.map((doc) => (
								<TableRow key={doc.id}>
									<TableCell>
										<Badge variant="outline">{t(`types.${doc.type}`)}</Badge>
									</TableCell>
									<TableCell>
										<Badge variant="outline">{t(`languages.${doc.language}`)}</Badge>
									</TableCell>
									<TableCell>v{doc.version}</TableCell>
									<TableCell className="font-medium">{doc.title}</TableCell>
									<TableCell>
										<Badge variant={doc.status === 'published' ? 'default' : 'secondary'}>
											{t(`status.${doc.status}`)}
										</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{new Date(doc.updatedAt).toLocaleDateString()}
									</TableCell>
									<TableCell className="text-right">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													•••
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												{doc.status === 'draft' && (
													<>
														<DropdownMenuItem
															onClick={() => router.push(`/admin/agreements/${doc.id}/edit`)}
														>
															<Edit className="mr-2 h-4 w-4" />
															{t('actions.edit')}
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => setPublishDialog({ open: true, documentId: doc.id })}
														>
															<Upload className="mr-2 h-4 w-4" />
															{t('actions.publish')}
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => setDeleteDialog({ open: true, documentId: doc.id })}
															className="text-destructive"
														>
															<Trash className="mr-2 h-4 w-4" />
															{t('actions.delete')}
														</DropdownMenuItem>
													</>
												)}
												{doc.status === 'published' && (
													<DropdownMenuItem
														onClick={() => router.push(`/admin/agreements/${doc.id}/edit`)}
													>
														<Eye className="mr-2 h-4 w-4" />
														View
													</DropdownMenuItem>
												)}
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				) : (
					<EmptyState icon={FileText} title={tEmpty('title')} description={tEmpty('description')} />
				)}
			</Card>

			<PublishConfirmDialog
				open={publishDialog.open}
				onOpenChange={(open) => setPublishDialog({ open, documentId: null })}
				onConfirm={handlePublish}
				isLoading={publishMutation.isPending}
			/>

			<DeleteConfirmDialog
				open={deleteDialog.open}
				onOpenChange={(open) => setDeleteDialog({ open, documentId: null })}
				onConfirm={handleDelete}
				isLoading={deleteMutation.isPending}
			/>
		</div>
	);
}
