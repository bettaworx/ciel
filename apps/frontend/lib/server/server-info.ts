import { cache } from 'react';
import { getInternalApiBaseUrl } from '@/lib/server/api-base-url';

type ServerInfo = {
	serverName: string;
	serverDescription: string | null;
	serverIconUrl: string | null;
};

/**
 * サーバー情報を取得する（サーバーサイドでキャッシュ）
 * Fetches server information (cached on server-side)
 */
export const getServerInfo = cache(async (): Promise<ServerInfo | null> => {
	try {
		const apiUrl = getInternalApiBaseUrl();
		
		// タイムアウト付きでfetch（ビルド時の遅延を防ぐ）
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 2000); // 2秒タイムアウト

		const response = await fetch(`${apiUrl}/server/info`, {
			signal: controller.signal,
			next: { revalidate: 30 }, // 30秒間キャッシュ
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			console.error('Failed to fetch server info:', response.status);
			return null;
		}

		const data = await response.json();
		return data as ServerInfo;
	} catch (error) {
		// ビルド時やバックエンドが起動していない場合は静かに失敗
		if ((error as Error).name !== 'AbortError') {
			console.error('Error fetching server info:', error);
		}
		return null;
	}
});

/**
 * サーバー名を取得する（フォールバック付き）
 * Gets server name with fallback to "Ciel"
 */
export async function getServerName(): Promise<string> {
	const serverInfo = await getServerInfo();
	return serverInfo?.serverName || 'Ciel';
}
