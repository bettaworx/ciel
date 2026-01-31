'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAgreementCheck } from '@/lib/hooks/use-agreement-check';
import { useMe } from '@/lib/hooks/use-queries';

interface AgreementCheckProviderProps {
  children: React.ReactNode;
}

/**
 * Provider that checks if the user needs to re-accept updated agreements
 * and redirects to /agreements page if necessary.
 */
export function AgreementCheckProvider({
  children,
}: AgreementCheckProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: me } = useMe();
  
  // Skip agreement check on excluded pages to prevent redirect loops
  const isExcludedPage = 
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/signup') ||
    pathname?.startsWith('/server-setup') ||
    pathname?.startsWith('/admin-setup') ||
    pathname?.startsWith('/agreements');
  
  // Conditionally call useAgreementCheck only when NOT on excluded page
  // This prevents unnecessary API calls and potential redirect loops
  const shouldCheck = !isExcludedPage && !!me;
  const { needsReaccept } = useAgreementCheck({ enabled: shouldCheck });

  useEffect(() => {
    // Don't check if user is not logged in
    if (!me) {
      return;
    }

    // Don't redirect if user is already on excluded pages
    if (isExcludedPage) {
      return;
    }

    if (needsReaccept) {
      router.push('/agreements');
    }
  }, [me, needsReaccept, pathname, router, isExcludedPage]);

  return <>{children}</>;
}
