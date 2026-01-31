'use client';

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
import { WifiOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface WebSocketDisconnectAlertProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onReconnect: () => void;
}

export function WebSocketDisconnectAlert({
	open,
	onOpenChange,
	onReconnect,
}: WebSocketDisconnectAlertProps) {
	const t = useTranslations('websocket.inactivity');

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent
				className="fixed left-auto top-6 right-6 translate-x-0 translate-y-0 max-w-md shadow-none"
			>
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center gap-3">
						<WifiOff className="h-5 w-5 text-muted-foreground" />
						<span>{t('title')}</span>
					</AlertDialogTitle>
					<AlertDialogDescription className="text-left">
						{t('description')}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t('dismiss')}</AlertDialogCancel>
					<AlertDialogAction
						onClick={onReconnect}
						variant="default"
						className="transition-colors duration-160 ease"
					>
						{t('reconnect')}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
