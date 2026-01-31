'use client';

import type { components } from '@/lib/api/api';

export type ApiError = components['schemas']['Error'];

export type ApiResult<T> =
	| { ok: true; status: number; data: T; headers: Headers }
	| { ok: false; status: number; errorText: string; errorJson?: unknown; headers: Headers };

export type ApiClientOptions = {
	baseUrl?: string;
	onSessionExpired?: () => void;
	onServerOffline?: () => void;
};

const DEFAULT_BASE_URL = '/api/v1';

function resolveBaseUrl(explicit?: string): string {
	const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL as string | undefined;
	const raw = (explicit ?? fromEnv ?? DEFAULT_BASE_URL).trim();
	if (!raw) return DEFAULT_BASE_URL;
	const noTrailingSlash = raw.replace(/\/+$/, '');

	// If the user provides just an origin like http://localhost:6137, assume the API lives under /api/v1.
	// This keeps the UI forgiving while still allowing explicit overrides.
	if (/^https?:\/\//.test(noTrailingSlash) && !/\/api\/v1$/.test(noTrailingSlash)) {
		return `${noTrailingSlash}/api/v1`;
	}

	return noTrailingSlash;
}

async function readBody(res: Response): Promise<{ errorText: string; errorJson?: unknown }> {
	const contentType = res.headers.get('content-type') ?? '';
	if (contentType.includes('application/json')) {
		try {
			const json = await res.json();
			return { errorText: JSON.stringify(json), errorJson: json };
		} catch {
			// fallthrough
		}
	}
	try {
		const text = await res.text();
		return { errorText: text };
	} catch {
		return { errorText: 'Failed to read response body' };
	}
}

async function parseJsonIfAny<T>(res: Response): Promise<T | undefined> {
	const contentType = res.headers.get('content-type') ?? '';
	if (!contentType.includes('application/json')) return undefined;
	return (await res.json()) as T;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export function createApiClient(options: ApiClientOptions = {}) {
	const baseUrl = resolveBaseUrl(options.baseUrl);

	async function request<T>(
		method: HttpMethod,
		path: string,
		init?: { body?: unknown; token?: string | null; headers?: Record<string, string> }
	): Promise<ApiResult<T>> {
		const url = `${baseUrl}${path}`;

		const headers: Record<string, string> = {
			...(init?.headers ?? {})
		};
		if (init?.body !== undefined) headers['content-type'] = 'application/json';

		try {
			const res = await fetch(url, {
				method,
				headers,
				body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
				credentials: 'include', // Send cookies with requests
			});

			if (!res.ok) {
				const { errorText, errorJson } = await readBody(res);
				
				// Check for agreement_required error (403)
				if (res.status === 403 && errorJson && typeof errorJson === 'object') {
					const error = errorJson as ApiError;
					if (error.code === 'agreement_required') {
						// Redirect to agreements page
						if (typeof window !== 'undefined') {
							window.location.href = '/agreements';
						}
					}
				}
				
				return { ok: false, status: res.status, errorText, errorJson, headers: res.headers };
			}

			if (res.status === 204) {
				return { ok: true, status: res.status, data: undefined as T, headers: res.headers };
			}

			const data = await parseJsonIfAny<T>(res);
			return { ok: true, status: res.status, data: data as T, headers: res.headers };
		} catch (error) {
			// Network error - likely server is offline
			if (error instanceof TypeError) {
				console.error('[API Client] Network error detected, server may be offline:', error);
				options.onServerOffline?.();
			}
			throw error;
		}
	}

	async function requestForm<T>(
		method: 'POST' | 'PUT' | 'PATCH',
		path: string,
		init: { form: FormData; token?: string | null; headers?: Record<string, string> }
	): Promise<ApiResult<T>> {
		const url = `${baseUrl}${path}`;

		const headers: Record<string, string> = {
			...(init?.headers ?? {})
		};
		// IMPORTANT: do NOT set content-type here; the browser will set the multipart boundary.

		try {
			const res = await fetch(url, {
				method,
				headers,
				body: init.form,
				credentials: 'include', // Send cookies with requests
			});

			if (!res.ok) {
				const { errorText, errorJson } = await readBody(res);
				
				// Check for agreement_required error (403)
				if (res.status === 403 && errorJson && typeof errorJson === 'object') {
					const error = errorJson as ApiError;
					if (error.code === 'agreement_required') {
						// Redirect to agreements page
						if (typeof window !== 'undefined') {
							window.location.href = '/agreements';
						}
					}
				}
				
				return { ok: false, status: res.status, errorText, errorJson, headers: res.headers };
			}

			const data = await parseJsonIfAny<T>(res);
			return { ok: true, status: res.status, data: data as T, headers: res.headers };
		} catch (error) {
			// Network error - likely server is offline
			if (error instanceof TypeError) {
				console.error('[API Client] Network error detected, server may be offline:', error);
				options.onServerOffline?.();
			}
			throw error;
		}
	}

	return {
		baseUrl,

		requestRaw: <T>(
			method: HttpMethod,
			path: string,
			init?: { body?: unknown; token?: string | null; headers?: Record<string, string> }
		) => request<T>(method, path, init),

		requestFormRaw: <T>(
			method: 'POST' | 'PUT' | 'PATCH',
			path: string,
			init: { form: FormData; token?: string | null; headers?: Record<string, string> }
		) => requestForm<T>(method, path, init),

		health: () => request<void>('GET', '/health'),

		// Server information (public endpoint)
		serverInfo: () => request<components['schemas']['ServerInfo']>('GET', '/server/info'),

		register: (body: components['schemas']['RegisterRequest']) =>
			request<components['schemas']['User']>('POST', '/auth/register', { body }),

		loginStart: (body: components['schemas']['LoginStartRequest']) =>
			request<components['schemas']['LoginStartResponse']>('POST', '/auth/login/start', { body }),

		loginFinish: (body: components['schemas']['LoginFinishRequest']) =>
			request<components['schemas']['LoginFinishResponse']>('POST', '/auth/login/finish', { body }),

		stepupStart: (body: components['schemas']['StepupStartRequest']) =>
			request<components['schemas']['StepupStartResponse']>('POST', '/auth/stepup/start', { body }),

		stepupFinish: (body: components['schemas']['StepupFinishRequest']) =>
			request<components['schemas']['StepupFinishResponse']>('POST', '/auth/stepup/finish', { body }),

		logout: () => request<void>('POST', '/auth/logout'),

		passwordChange: (
			body: components['schemas']['PasswordChangeRequest'],
			stepupToken?: string | null
		) =>
			request<void>('POST', '/auth/password/change', {
				body,
				headers: stepupToken ? { 'x-stepup-token': stepupToken } : undefined
			}),

		me: () => request<components['schemas']['User']>('GET', '/me'),

		deleteMe: (stepupToken?: string | null) =>
			request<void>('DELETE', '/me', {
				headers: stepupToken ? { 'x-stepup-token': stepupToken } : undefined
			}),

		userByUsername: (username: string) =>
			request<components['schemas']['User']>('GET', `/users/${encodeURIComponent(username)}`),

		userPosts: (username: string, params?: { limit?: number; cursor?: string | null }) => {
			const qs = new URLSearchParams();
			if (params?.limit !== undefined) qs.set('limit', String(params.limit));
			if (params?.cursor) qs.set('cursor', params.cursor);
			const suffix = qs.size ? `?${qs.toString()}` : '';
			return request<components['schemas']['UserPostsPage']>('GET', `/users/${encodeURIComponent(username)}/posts${suffix}`);
		},

		createPost: (body: components['schemas']['CreatePostRequest']) =>
			request<components['schemas']['Post']>('POST', '/posts', { body }),

		uploadMedia: (file: File) => {
			const form = new FormData();
			form.set('file', file, file.name);
			return requestForm<components['schemas']['Media']>('POST', '/media', { form });
		},

		getPost: (postId: components['schemas']['PostId']) =>
			request<components['schemas']['Post']>('GET', `/posts/${postId}`),

		deletePost: (postId: components['schemas']['PostId']) =>
			request<void>('DELETE', `/posts/${postId}`),

		timeline: (params?: { limit?: number; cursor?: string | null }) => {
			const qs = new URLSearchParams();
			if (params?.limit !== undefined) qs.set('limit', String(params.limit));
			if (params?.cursor) qs.set('cursor', params.cursor);
			const suffix = qs.size ? `?${qs.toString()}` : '';
			return request<components['schemas']['TimelinePage']>('GET', `/timeline${suffix}`);
		},

		reactionCounts: (postId: components['schemas']['PostId']) =>
			request<components['schemas']['ReactionCounts']>('GET', `/posts/${postId}/reactions`),

		addReaction: (postId: components['schemas']['PostId'], body: components['schemas']['ReactRequest']) =>
			request<components['schemas']['ReactionCounts']>('POST', `/posts/${postId}/reactions`, { body }),

		removeReaction: (postId: components['schemas']['PostId'], emoji: string) => {
			const qs = new URLSearchParams({ emoji });
			return request<components['schemas']['ReactionCounts']>(
				'DELETE',
				`/posts/${postId}/reactions?${qs.toString()}`
			);
		},

		adminRoles: () => request<components['schemas']['RoleList']>('GET', '/admin/roles'),

		adminPermissions: () =>
			request<components['schemas']['PermissionList']>('GET', '/admin/permissions'),

		adminUserRoles: (userId: components['schemas']['UserId']) =>
			request<components['schemas']['RoleList']>('GET', `/admin/users/${userId}/roles`),

		adminUpdateUserRoles: (
			userId: components['schemas']['UserId'],
			body: components['schemas']['UserRolesUpdateRequest']
		) => request<components['schemas']['RoleList']>('PUT', `/admin/users/${userId}/roles`, { body }),

		adminUserPermissions: (userId: components['schemas']['UserId']) =>
			request<components['schemas']['UserPermissionOverrides']>(
				'GET',
				`/admin/users/${userId}/permissions`
			),

		adminUpdateUserPermissions: (
			userId: components['schemas']['UserId'],
			body: components['schemas']['UserPermissionOverrides']
		) =>
			request<components['schemas']['UserPermissionOverrides']>(
				'PUT',
				`/admin/users/${userId}/permissions`,
				{ body }
			),

		adminBanUser: (userId: components['schemas']['UserId'], ttlSeconds?: number) =>
			request<void>('POST', `/admin/users/${userId}/ban`, {
				body: ttlSeconds ? ({ ttlSeconds } as components['schemas']['BanUserRequest']) : undefined
			}),

		adminUnbanUser: (userId: components['schemas']['UserId']) =>
			request<void>('DELETE', `/admin/users/${userId}/ban`),

		adminSettings: () =>
			request<components['schemas']['ServerSettings']>('GET', '/admin/settings'),

		adminUpdateSignupEnabled: (body: components['schemas']['UpdateSignupEnabledRequest']) =>
			request<components['schemas']['ServerSettings']>('PATCH', '/admin/settings/signup', { body }),

		updateProfile: (body: components['schemas']['UpdateProfileRequest']) =>
			request<components['schemas']['User']>('PATCH', '/me/profile', { body }),

		updateAvatar: (file: File) => {
			const form = new FormData();
			form.set('file', file, file.name);
			return requestForm<components['schemas']['User']>('POST', '/me/avatar', { form });
		},

		// Setup endpoints
		setupStatus: () =>
			request<components['schemas']['SetupStatusResponse']>('GET', '/setup/status'),

		setupVerifyPassword: (body: components['schemas']['VerifySetupPasswordRequest']) =>
			request<components['schemas']['VerifySetupPasswordResponse']>('POST', '/setup/verify-password', { body }),

		setupCreateAdmin: (body: components['schemas']['CreateAdminRequest']) =>
			request<components['schemas']['CreateAdminResponse']>('POST', '/setup/create-admin', { body }),

		setupComplete: (body: components['schemas']['ServerSetupRequest']) =>
			request<components['schemas']['ServerSetupResponse']>('PATCH', '/setup/complete', { body }),

		setupCreateInvite: (body: components['schemas']['CreateInviteCodeRequest']) =>
			request<components['schemas']['InviteCode']>('POST', '/setup/create-invite', { body }),

		// Agreement endpoints
		getAgreementVersions: () =>
			request<components['schemas']['AgreementVersions']>('GET', '/agreements/current'),

		getLatestAgreement: (type: 'terms' | 'privacy', language?: string) => {
			const qs = language ? `?language=${language}` : '';
			return request<components['schemas']['AgreementDocument']>('GET', `/agreements/${type}/latest${qs}`);
		},

		acceptAgreements: (body: components['schemas']['AcceptAgreementsRequest']) =>
			request<void>('POST', '/me/agreements', { body }),

		adminUpdateAgreementVersions: (body: components['schemas']['UpdateAgreementVersionsRequest']) =>
			request<components['schemas']['AgreementVersions']>('PATCH', '/admin/settings/agreements', { body }),

		// Admin - Users
		adminSearchUsers: (params?: {
			limit?: number;
			offset?: number;
			search?: string;
			sort?: 'created_asc' | 'created_desc' | 'username_asc' | 'username_desc';
		}) => {
			const qs = new URLSearchParams();
			if (params?.limit !== undefined) qs.set('limit', String(params.limit));
			if (params?.offset !== undefined) qs.set('offset', String(params.offset));
			if (params?.search) qs.set('search', params.search);
			if (params?.sort) qs.set('sort', params.sort);
			const suffix = qs.size ? `?${qs.toString()}` : '';
			return request<components['schemas']['AdminUserPage']>('GET', `/admin/users${suffix}`);
		},

		adminGetUserStats: (userId: components['schemas']['UserId']) =>
			request<components['schemas']['UserStats']>('GET', `/admin/users/${userId}/stats`),

		// Admin - Dashboard
		adminDashboardStats: () =>
			request<components['schemas']['DashboardStats']>('GET', '/admin/dashboard/stats'),

		// Admin - Posts
		adminListPosts: (params?: {
			limit?: number;
			offset?: number;
			userId?: components['schemas']['UserId'];
			visibility?: components['schemas']['PostVisibility'];
		}) => {
			const qs = new URLSearchParams();
			if (params?.limit !== undefined) qs.set('limit', String(params.limit));
			if (params?.offset !== undefined) qs.set('offset', String(params.offset));
			if (params?.userId) qs.set('userId', params.userId);
			if (params?.visibility) qs.set('visibility', params.visibility);
			const suffix = qs.size ? `?${qs.toString()}` : '';
			return request<components['schemas']['AdminPostPage']>('GET', `/admin/posts${suffix}`);
		},

		adminDeletePost: (postId: components['schemas']['PostId'], body?: components['schemas']['DeletePostRequest']) =>
			request<void>('DELETE', `/admin/posts/${postId}`, { body }),

		adminUpdatePostVisibility: (
			postId: components['schemas']['PostId'],
			body: components['schemas']['UpdatePostVisibilityRequest']
		) =>
			request<components['schemas']['AdminPost']>('PATCH', `/admin/posts/${postId}/visibility`, { body }),

		// Admin - Media
		adminListMedia: (params?: {
			limit?: number;
			offset?: number;
			userId?: components['schemas']['UserId'];
			deleted?: boolean;
		}) => {
			const qs = new URLSearchParams();
			if (params?.limit !== undefined) qs.set('limit', String(params.limit));
			if (params?.offset !== undefined) qs.set('offset', String(params.offset));
			if (params?.userId) qs.set('userId', params.userId);
			if (params?.deleted !== undefined) qs.set('deleted', String(params.deleted));
			const suffix = qs.size ? `?${qs.toString()}` : '';
			return request<components['schemas']['AdminMediaPage']>('GET', `/admin/media${suffix}`);
		},

		adminDeleteMedia: (mediaId: components['schemas']['MediaId'], body?: components['schemas']['DeleteMediaRequest']) =>
			request<void>('DELETE', `/admin/media/${mediaId}`, { body }),

		// Admin - User Mutes
		adminGetUserMutes: (userId: components['schemas']['UserId']) =>
			request<components['schemas']['UserMute'][]>('GET', `/admin/users/${userId}/mutes`),

		adminCreateUserMute: (userId: components['schemas']['UserId'], body: components['schemas']['CreateUserMuteRequest']) =>
			request<components['schemas']['UserMute']>('POST', `/admin/users/${userId}/mutes`, { body }),

		adminRemoveAllUserMutes: (userId: components['schemas']['UserId']) =>
			request<void>('DELETE', `/admin/users/${userId}/mutes`),

		adminRemoveUserMute: (userId: components['schemas']['UserId'], muteType: components['schemas']['MuteType']) =>
			request<void>('DELETE', `/admin/users/${userId}/mutes/${muteType}`),

		// Admin - Banned Words
		adminListBannedWords: (params?: { appliesTo?: components['schemas']['BannedWordAppliesTo'] }) => {
			const qs = new URLSearchParams();
			if (params?.appliesTo) qs.set('appliesTo', params.appliesTo);
			const suffix = qs.size ? `?${qs.toString()}` : '';
			return request<components['schemas']['BannedWord'][]>('GET', `/admin/banned-words${suffix}`);
		},

		adminCreateBannedWord: (body: components['schemas']['CreateBannedWordRequest']) =>
			request<components['schemas']['BannedWord']>('POST', '/admin/banned-words', { body }),

		adminGetBannedWord: (wordId: string) =>
			request<components['schemas']['BannedWord']>('GET', `/admin/banned-words/${wordId}`),

		adminDeleteBannedWord: (wordId: string) =>
			request<void>('DELETE', `/admin/banned-words/${wordId}`),

		// Admin - Banned Images
		adminListBannedImages: () =>
			request<components['schemas']['BannedImageHash'][]>('GET', '/admin/banned-images'),

		adminCreateBannedImage: (body: components['schemas']['CreateBannedImageHashRequest']) =>
			request<components['schemas']['BannedImageHash']>('POST', '/admin/banned-images', { body }),

		adminGetBannedImage: (hashId: string) =>
			request<components['schemas']['BannedImageHash']>('GET', `/admin/banned-images/${hashId}`),

		adminDeleteBannedImage: (hashId: string) =>
			request<void>('DELETE', `/admin/banned-images/${hashId}`),

		// Admin - IP Bans
		adminListIPBans: (params?: { limit?: number; offset?: number }) => {
			const qs = new URLSearchParams();
			if (params?.limit !== undefined) qs.set('limit', String(params.limit));
			if (params?.offset !== undefined) qs.set('offset', String(params.offset));
			const suffix = qs.size ? `?${qs.toString()}` : '';
			return request<components['schemas']['IPBanPage']>('GET', `/admin/ip-bans${suffix}`);
		},

		adminCreateIPBan: (body: components['schemas']['CreateIPBanRequest']) =>
			request<components['schemas']['IPBan']>('POST', '/admin/ip-bans', { body }),

		adminDeleteIPBanByAddress: (ipAddress: string) =>
			request<void>('DELETE', `/admin/ip-bans?ipAddress=${encodeURIComponent(ipAddress)}`),

		adminDeleteIPBan: (banId: string) =>
			request<void>('DELETE', `/admin/ip-bans/${banId}`),

		// Admin - Moderation Logs
		adminListModerationLogs: (params?: {
			limit?: number;
			offset?: number;
			adminUserId?: components['schemas']['UserId'];
			action?: components['schemas']['ModerationAction'];
			targetType?: components['schemas']['ModerationTargetType'];
			targetId?: string;
		}) => {
			const qs = new URLSearchParams();
			if (params?.limit !== undefined) qs.set('limit', String(params.limit));
			if (params?.offset !== undefined) qs.set('offset', String(params.offset));
			if (params?.adminUserId) qs.set('adminUserId', params.adminUserId);
			if (params?.action) qs.set('action', params.action);
			if (params?.targetType) qs.set('targetType', params.targetType);
			if (params?.targetId) qs.set('targetId', params.targetId);
			const suffix = qs.size ? `?${qs.toString()}` : '';
			return request<components['schemas']['ModerationLogPage']>('GET', `/admin/moderation-logs${suffix}`);
		},

		adminGetUserModerationLogs: (userId: components['schemas']['UserId'], params?: { limit?: number; offset?: number }) => {
			const qs = new URLSearchParams();
			if (params?.limit !== undefined) qs.set('limit', String(params.limit));
			if (params?.offset !== undefined) qs.set('offset', String(params.offset));
			const suffix = qs.size ? `?${qs.toString()}` : '';
			return request<components['schemas']['ModerationLog'][]>('GET', `/admin/users/${userId}/moderation-logs${suffix}`);
		},

		// Admin - User Notes
		adminGetUserNote: (userId: components['schemas']['UserId']) =>
			request<components['schemas']['AdminUserNote']>('GET', `/admin/users/${userId}/note`),

		adminCreateOrUpdateUserNote: (userId: components['schemas']['UserId'], body: components['schemas']['CreateAdminUserNoteRequest']) =>
			request<components['schemas']['AdminUserNote']>('PUT', `/admin/users/${userId}/note`, { body }),

		adminDeleteUserNote: (userId: components['schemas']['UserId']) =>
			request<void>('DELETE', `/admin/users/${userId}/note`),

		// Admin - Profile Management
		adminDeleteUserAvatar: (userId: components['schemas']['UserId']) =>
			request<void>('DELETE', `/admin/users/${userId}/avatar`),

		adminDeleteUserDisplayName: (userId: components['schemas']['UserId']) =>
			request<void>('DELETE', `/admin/users/${userId}/display-name`),

		adminDeleteUserBio: (userId: components['schemas']['UserId']) =>
			request<void>('DELETE', `/admin/users/${userId}/bio`),

		// Admin - Agreement Documents
		adminListAgreementDocuments: (params?: {
			limit?: number;
			offset?: number;
			status?: components['schemas']['AgreementDocumentStatus'];
			language?: components['schemas']['AgreementLanguage'];
			type?: components['schemas']['AgreementType'];
		}) => {
			const qs = new URLSearchParams();
			if (params?.limit !== undefined) qs.set('limit', String(params.limit));
			if (params?.offset !== undefined) qs.set('offset', String(params.offset));
			if (params?.status) qs.set('status', params.status);
			if (params?.language) qs.set('language', params.language);
			if (params?.type) qs.set('type', params.type);
			const suffix = qs.size ? `?${qs.toString()}` : '';
			return request<components['schemas']['AgreementDocumentPage']>('GET', `/admin/agreements/documents${suffix}`);
		},

		adminCreateAgreementDocument: (body: components['schemas']['CreateAgreementDocumentRequest']) =>
			request<components['schemas']['AgreementDocument']>('POST', '/admin/agreements/documents', { body }),

		adminGetAgreementDocument: (documentId: string) =>
			request<components['schemas']['AgreementDocument']>('GET', `/admin/agreements/documents/${documentId}`),

		adminUpdateAgreementDocument: (
			documentId: string,
			body: components['schemas']['UpdateAgreementDocumentRequest']
		) =>
			request<components['schemas']['AgreementDocument']>('PATCH', `/admin/agreements/documents/${documentId}`, { body }),

		adminDeleteAgreementDocument: (documentId: string) =>
			request<void>('DELETE', `/admin/agreements/documents/${documentId}`),

		adminPublishAgreementDocument: (documentId: string) =>
			request<components['schemas']['AgreementDocument']>('POST', `/admin/agreements/documents/${documentId}/publish`),

		adminDuplicateAgreementDocument: (documentId: string, body: { newVersion: number }) =>
			request<components['schemas']['AgreementDocument']>('POST', `/admin/agreements/documents/${documentId}/duplicate`, { body }),

		adminGetAgreementHistory: (params: {
			type: components['schemas']['AgreementType'];
			language: components['schemas']['AgreementLanguage'];
		}) => {
			const qs = new URLSearchParams();
			qs.set('type', params.type);
			qs.set('language', params.language);
			return request<components['schemas']['AgreementDocument'][]>('GET', `/admin/agreements/documents/history?${qs.toString()}`);
		},

		// Admin - Invite Codes
		adminListInviteCodes: (params?: {
			limit?: number;
			offset?: number;
		}) => {
			const qs = new URLSearchParams();
			if (params?.limit !== undefined) qs.set('limit', String(params.limit));
			if (params?.offset !== undefined) qs.set('offset', String(params.offset));
			const suffix = qs.size ? `?${qs.toString()}` : '';
			// Backend returns array directly, not wrapped in InviteCodesListResponse
			return request<components['schemas']['InviteCode'][]>('GET', `/admin/invites${suffix}`);
		},

		adminGetInviteCode: (inviteId: string) =>
			request<components['schemas']['InviteCode']>('GET', `/admin/invites/${inviteId}`),

		adminCreateInviteCode: (body: components['schemas']['CreateInviteCodeRequest']) =>
			request<components['schemas']['InviteCode']>('POST', '/admin/invites', { body }),

		adminUpdateInviteCode: (
			inviteId: string,
			body: components['schemas']['UpdateInviteCodeRequest']
		) =>
			request<components['schemas']['InviteCode']>('PATCH', `/admin/invites/${inviteId}`, { body }),

		adminDisableInviteCode: (inviteId: string) =>
			request<void>('PATCH', `/admin/invites/${inviteId}/disable`),

		adminDeleteInviteCode: (inviteId: string) =>
			request<void>('DELETE', `/admin/invites/${inviteId}`),

		adminGetInviteUsageHistory: (inviteId: string) =>
			request<components['schemas']['InviteCodeUse'][]>('GET', `/admin/invites/${inviteId}/uses`),

		// Admin - Reports
		adminListReports: (params?: {
			limit?: number;
			offset?: number;
			status?: components['schemas']['ReportStatus'];
			targetType?: components['schemas']['ReportTargetType'];
		}) => {
			const qs = new URLSearchParams();
			if (params?.limit !== undefined) qs.set('limit', String(params.limit));
			if (params?.offset !== undefined) qs.set('offset', String(params.offset));
			if (params?.status) qs.set('status', params.status);
			if (params?.targetType) qs.set('targetType', params.targetType);
			const suffix = qs.size ? `?${qs.toString()}` : '';
			return request<components['schemas']['ReportPage']>('GET', `/admin/reports${suffix}`);
		},

		adminGetReport: (reportId: string) =>
			request<components['schemas']['Report']>('GET', `/admin/reports/${reportId}`),

		adminUpdateReport: (reportId: string, body: components['schemas']['UpdateReportRequest']) =>
			request<components['schemas']['Report']>('PATCH', `/admin/reports/${reportId}`, { body })
	};
}

