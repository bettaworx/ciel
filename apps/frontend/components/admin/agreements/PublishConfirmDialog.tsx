'use client';

import { useTranslations } from 'next-intl';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PublishConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	isLoading?: boolean;
}

export function PublishConfirmDialog({
	open,
	onOpenChange,
	onConfirm,
	isLoading = false,
}: PublishConfirmDialogProps) {
	const t = useTranslations('admin.agreements.confirm');

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t('publishTitle')}</AlertDialogTitle>
					<AlertDialogDescription>{t('publishDescription')}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>
						{useTranslations('admin.agreements.actions')('cancel')}
					</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} disabled={isLoading}>
						{useTranslations('admin.agreements.actions')('publish')}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
