'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MarkdownContent } from '@/components/shared/MarkdownContent';

interface AgreementEditorProps {
	content: string;
	onContentChange: (content: string) => void;
	disabled?: boolean;
}

export function AgreementEditor({ content, onContentChange, disabled = false }: AgreementEditorProps) {
	const t = useTranslations('admin.agreements');

	return (
		<div className="space-y-2">
			<Label htmlFor="content">{t('fields.content')}</Label>
			<Tabs defaultValue="edit" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="edit">{t('editor.editTab')}</TabsTrigger>
					<TabsTrigger value="preview">{t('editor.previewTab')}</TabsTrigger>
				</TabsList>
				<TabsContent value="edit" className="space-y-2">
					<Textarea
						id="content"
						value={content}
						onChange={(e) => onContentChange(e.target.value)}
						placeholder={t('placeholder.content')}
						disabled={disabled}
						className="min-h-[400px] font-mono"
					/>
					<p className="text-sm text-muted-foreground">{t('editor.markdownSupported')}</p>
				</TabsContent>
				<TabsContent value="preview" className="min-h-[400px] rounded-md border p-4">
					{content ? (
						<div className="prose prose-sm dark:prose-invert max-w-none">
							<MarkdownContent content={content} />
						</div>
					) : (
						<p className="text-sm text-muted-foreground">{t('placeholder.content')}</p>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
