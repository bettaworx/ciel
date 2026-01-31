'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AgreementEditor } from '@/components/admin/agreements/AgreementEditor';
import {
	useAdminAgreementDocument,
	useAdminUpdateAgreementDocument,
} from '@/lib/hooks/use-queries';
import { toast } from 'sonner';

export default function EditAgreementPage() {
	const t = useTranslations('admin.agreements');
	const router = useRouter();
	const params = useParams();
	const documentId = params.id as string;

	// Form state
	const [title, setTitle] = useState<string>('');
	const [content, setContent] = useState<string>('');

	const { data: document, isLoading } = useAdminAgreementDocument(documentId);
	const updateMutation = useAdminUpdateAgreementDocument(documentId);

	// Initialize form with document data
	useEffect(() => {
		if (document) {
			setTitle(document.title);
			setContent(document.content);
		}
	}, [document]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!title || !content) {
			toast.error(t('validation.titleRequired'));
			return;
		}

		try {
			await updateMutation.mutateAsync({ title, content });
			toast.success(t('messages.updateSuccess'));
			router.push('/admin/agreements');
		} catch (error) {
			toast.error(t('messages.updateError'));
		}
	};

	const isPublished = document?.status === 'published';
	const canEdit = document?.status === 'draft';

	if (isLoading) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				Loading...
			</div>
		);
	}

	if (!document) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				Agreement not found
			</div>
		);
	}

	return (
		<div>
			<div className="mb-8">
				<Button variant="ghost" onClick={() => router.push('/admin/agreements')} className="mb-4">
					<ArrowLeft className="mr-2 h-4 w-4" />
					{t('actions.back')}
				</Button>
				<h1 className="text-3xl font-bold">{t('edit')}</h1>
			</div>

			<Card className="p-6">
				{isPublished && (
					<Alert className="mb-6">
						<AlertDescription>{t('messages.cannotEditPublished')}</AlertDescription>
					</Alert>
				)}

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div className="space-y-2">
							<Label>{t('fields.type')}</Label>
							<div>
								<Badge variant="outline">{t(`types.${document.type}`)}</Badge>
							</div>
						</div>

						<div className="space-y-2">
							<Label>{t('fields.language')}</Label>
							<div>
								<Badge variant="outline">{t(`languages.${document.language}`)}</Badge>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<Label>{t('fields.version')}</Label>
						<div className="flex items-center gap-2">
							<span className="text-sm">v{document.version}</span>
							<Badge variant={isPublished ? 'default' : 'secondary'}>
								{t(`status.${document.status}`)}
							</Badge>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="title">{t('fields.title')}</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={t('placeholder.title')}
							disabled={!canEdit}
							required
						/>
					</div>

					<AgreementEditor content={content} onContentChange={setContent} disabled={!canEdit} />

					<div className="flex justify-end gap-4">
						<Button type="button" variant="outline" onClick={() => router.push('/admin/agreements')}>
							{isPublished ? 'Close' : t('actions.cancel')}
						</Button>
						{canEdit && (
							<Button type="submit" disabled={updateMutation.isPending}>
								{updateMutation.isPending ? 'Saving...' : t('actions.save')}
							</Button>
						)}
					</div>
				</form>
			</Card>
		</div>
	);
}
