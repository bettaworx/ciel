'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Plus, Copy, Check, MoreVertical, Ticket } from 'lucide-react';
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import {
	useAdminInviteCodes,
	useAdminDisableInviteCode,
	useAdminDeleteInviteCode,
} from '@/lib/hooks/use-queries';
import { toast } from 'sonner';
import type { components } from '@/lib/api/api';

type InviteCode = components['schemas']['InviteCode'];

export default function InviteCodesPage() {
	const t = useTranslations('admin.invites');
	const tEmpty = useTranslations('admin.empty.invites');
	const router = useRouter();

	const [limit] = useState(50);
	const [offset] = useState(0);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const { data, isLoading } = useAdminInviteCodes({ limit, offset });

	const disableMutation = useAdminDisableInviteCode();
	const deleteMutation = useAdminDeleteInviteCode();

	const [disableDialog, setDisableDialog] = useState<{ open: boolean; inviteId: string | null }>({
		open: false,
		inviteId: null,
	});
	const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; inviteId: string | null }>({
		open: false,
		inviteId: null,
	});

	const handleCopyCode = async (code: string, id: string) => {
		try {
			await navigator.clipboard.writeText(code);
			setCopiedId(id);
			toast.success(t('messages.codeCopied'));
			setTimeout(() => setCopiedId(null), 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
			toast.error(t('messages.copyError'));
		}
	};

	const handleDisable = async () => {
		if (!disableDialog.inviteId) return;
		try {
			await disableMutation.mutateAsync(disableDialog.inviteId);
			toast.success(t('messages.disableSuccess'));
			setDisableDialog({ open: false, inviteId: null });
		} catch (error) {
			toast.error(t('messages.disableError'));
		}
	};

	const handleDelete = async () => {
		if (!deleteDialog.inviteId) return;
		try {
			await deleteMutation.mutateAsync(deleteDialog.inviteId);
			toast.success(t('messages.deleteSuccess'));
			setDeleteDialog({ open: false, inviteId: null });
		} catch (error) {
			toast.error(t('messages.deleteError'));
		}
	};

	const getInviteStatus = (invite: InviteCode): 'active' | 'disabled' | 'expired' | 'exhausted' => {
		if (invite.disabled) return 'disabled';
		if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return 'expired';
		if (invite.maxUses != null && invite.useCount >= invite.maxUses) return 'exhausted';
		return 'active';
	};

	const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
		switch (status) {
			case 'active':
				return 'default';
			case 'disabled':
				return 'secondary';
			case 'expired':
			case 'exhausted':
				return 'destructive';
			default:
				return 'outline';
		}
	};

	const invites = data || [];
	const hasInvites = invites.length > 0;

	return (
		<div>
			<div className="mb-8 flex items-center justify-between">
				<h1 className="text-3xl font-bold">{t('title')}</h1>
				<Button onClick={() => router.push('/admin/invite/new')}>
					<Plus className="mr-2 h-4 w-4" />
					{t('create')}
				</Button>
			</div>

			<Card className="p-6">
				{isLoading ? (
					<div className="py-8 text-center text-muted-foreground">Loading...</div>
				) : hasInvites ? (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t('fields.code')}</TableHead>
								<TableHead>{t('fields.status')}</TableHead>
								<TableHead>{t('fields.useCount')}</TableHead>
								<TableHead>{t('fields.expiresAt')}</TableHead>
								<TableHead>{t('fields.createdAt')}</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{invites.map((invite) => {
								const status = getInviteStatus(invite);
								const isCopied = copiedId === invite.id;

								return (
									<TableRow key={invite.id}>
										<TableCell>
											<div className="flex items-center gap-2">
												<code className="rounded bg-muted px-2 py-1 font-mono text-sm font-bold">
													{invite.code}
												</code>
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6"
													onClick={() => handleCopyCode(invite.code, invite.id)}
												>
													{isCopied ? (
														<Check className="h-3 w-3" />
													) : (
														<Copy className="h-3 w-3" />
													)}
												</Button>
											</div>
										</TableCell>
										<TableCell>
											<Badge variant={getStatusVariant(status)}>{t(`status.${status}`)}</Badge>
										</TableCell>
										<TableCell>
											{invite.useCount}
											{invite.maxUses != null ? ` / ${invite.maxUses}` : ' / ∞'}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{invite.expiresAt
												? new Date(invite.expiresAt).toLocaleString()
												: '—'}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{new Date(invite.createdAt).toLocaleDateString()}
										</TableCell>
										<TableCell className="text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="sm">
														<MoreVertical className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() => router.push(`/admin/invite/${invite.id}`)}
													>
														{t('actions.view')}
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => router.push(`/admin/invite/${invite.id}/edit`)}
													>
														{t('actions.edit')}
													</DropdownMenuItem>
													{!invite.disabled && (
														<DropdownMenuItem
															onClick={() =>
																setDisableDialog({ open: true, inviteId: invite.id })
															}
														>
															{t('actions.disable')}
														</DropdownMenuItem>
													)}
													<DropdownMenuItem
														onClick={() => setDeleteDialog({ open: true, inviteId: invite.id })}
														className="text-destructive"
													>
														{t('actions.delete')}
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				) : (
					<EmptyState icon={Ticket} title={tEmpty('title')} description={tEmpty('description')} />
				)}
			</Card>

			{/* Disable Confirmation Dialog */}
			<Dialog open={disableDialog.open} onOpenChange={(open) => setDisableDialog({ open, inviteId: null })}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('confirm.disableTitle')}</DialogTitle>
						<DialogDescription>{t('confirm.disableDescription')}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDisableDialog({ open: false, inviteId: null })}
						>
							{t('actions.cancel')}
						</Button>
						<Button onClick={handleDisable} disabled={disableMutation.isPending}>
							{t('actions.disable')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, inviteId: null })}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('confirm.deleteTitle')}</DialogTitle>
						<DialogDescription>{t('confirm.deleteDescription')}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteDialog({ open: false, inviteId: null })}
						>
							{t('actions.cancel')}
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={deleteMutation.isPending}
						>
							{t('actions.delete')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
