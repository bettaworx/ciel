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

interface DeleteConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	isLoading?: boolean;
}

export function DeleteConfirmDialog({
	open,
	onOpenChange,
	onConfirm,
	isLoading = false,
}: DeleteConfirmDialogProps) {
	const t = useTranslations('admin.agreements.confirm');

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
					<AlertDialogDescription>{t('deleteDescription')}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>
						{useTranslations('admin.agreements.actions')('cancel')}
					</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} disabled={isLoading}>
						{useTranslations('admin.agreements.actions')('delete')}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
