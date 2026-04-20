'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useServerConfig } from '@/lib/hooks/use-queries';

/**
 * ConfigWatcher monitors server configuration changes and updates the UI.
 * - Reacts to server_config_updated WebSocket events (pushed by RealtimeProvider)
 * - Detects configVersion changes via localStorage
 * - Refreshes the page when server config is updated (name, icon, description)
 */
export function ConfigWatcher() {
  const router = useRouter();
  const { data: serverConfig } = useServerConfig();

  useEffect(() => {
    if (!serverConfig?.configVersion) return;

    const stored = localStorage.getItem('lastConfigVersion');
    const currentVersion = String(serverConfig.configVersion);

    if (stored && stored !== currentVersion) {
      console.log('[ConfigWatcher] Server config updated, refreshing...', {
        old: stored,
        new: currentVersion,
      });

      // Refresh SSR data (title, metadata)
      router.refresh();

      // Update favicon with new version
      const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (link) {
        const url = new URL(link.href, window.location.origin);
        url.searchParams.set('v', currentVersion);
        link.href = url.toString();
      }
    }

    // Store current version
    localStorage.setItem('lastConfigVersion', currentVersion);
  }, [serverConfig?.configVersion, router]);

  return null;
}
