'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { AgreementEditor } from '@/components/admin/agreements/AgreementEditor';
import { useAdminCreateAgreementDocument, useAdminAgreementDocuments } from '@/lib/hooks/use-queries';
import { toast } from 'sonner';

export default function NewAgreementPage() {
	const t = useTranslations('admin.agreements');
	const router = useRouter();

	// Form state
	const [type, setType] = useState<'terms' | 'privacy' | ''>('');
	const [language, setLanguage] = useState<'en' | 'ja' | ''>('');
	const [version, setVersion] = useState<string>('');
	const [title, setTitle] = useState<string>('');
	const [content, setContent] = useState<string>('');

	// Fetch existing documents to suggest next version
	const { data: existingDocs } = useAdminAgreementDocuments({
		type: type || undefined,
		language: language || undefined,
	});

	// Auto-suggest version when type and language are selected
	useEffect(() => {
		if (type && language && existingDocs?.items) {
			const maxVersion = existingDocs.items.reduce((max: number, doc: typeof existingDocs.items[number]) => {
				if (doc.type === type && doc.language === language) {
					return Math.max(max, doc.version);
				}
				return max;
			}, 0);
			setVersion(String(maxVersion + 1));
		}
	}, [type, language, existingDocs]);

	const createMutation = useAdminCreateAgreementDocument();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!type || !language || !version || !title || !content) {
			toast.error(t('validation.titleRequired'));
			return;
		}

		const versionNum = parseInt(version, 10);
		if (isNaN(versionNum) || versionNum < 1) {
			toast.error(t('validation.versionMin'));
			return;
		}

		try {
			await createMutation.mutateAsync({
				type,
				language,
				version: versionNum,
				title,
				content,
			});
			toast.success(t('messages.createSuccess'));
			// Wait a bit for cache invalidation to propagate
			setTimeout(() => {
				router.push('/admin/agreements');
			}, 100);
		} catch (error) {
			toast.error(t('messages.createError'));
		}
	};

	return (
		<div>
			<div className="mb-8">
				<Button variant="ghost" onClick={() => router.push('/admin/agreements')} className="mb-4">
					<ArrowLeft className="mr-2 h-4 w-4" />
					{t('actions.back')}
				</Button>
				<h1 className="text-3xl font-bold">{t('new')}</h1>
			</div>

			<Card className="p-6">
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="type">{t('fields.type')}</Label>
							<Select value={type} onValueChange={(value) => setType(value as 'terms' | 'privacy')}>
								<SelectTrigger id="type">
									<SelectValue placeholder={t('placeholder.selectType')} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="terms">{t('types.terms')}</SelectItem>
									<SelectItem value="privacy">{t('types.privacy')}</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="language">{t('fields.language')}</Label>
							<Select value={language} onValueChange={(value) => setLanguage(value as 'en' | 'ja')}>
								<SelectTrigger id="language">
									<SelectValue placeholder={t('placeholder.selectLanguage')} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="en">{t('languages.en')}</SelectItem>
									<SelectItem value="ja">{t('languages.ja')}</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="version">{t('fields.version')}</Label>
						<Input
							id="version"
							type="number"
							min="1"
							value={version}
							onChange={(e) => setVersion(e.target.value)}
							placeholder={t('placeholder.version')}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="title">{t('fields.title')}</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder={t('placeholder.title')}
							required
						/>
					</div>

					<AgreementEditor content={content} onContentChange={setContent} />

					<div className="flex justify-end gap-4">
						<Button type="button" variant="outline" onClick={() => router.push('/admin/agreements')}>
							{t('actions.cancel')}
						</Button>
						<Button type="submit" disabled={createMutation.isPending}>
							{createMutation.isPending ? 'Saving...' : t('actions.saveDraft')}
						</Button>
					</div>
				</form>
			</Card>
		</div>
	);
}
