'use client';

import { useMe } from './use-queries';
import { useAgreementVersions } from './use-queries';

interface UseAgreementCheckOptions {
  enabled?: boolean;
}

/**
 * Hook to check if the current user needs to re-accept agreements
 * Note: null/undefined versions are treated as 0 (not accepted yet)
 * @param options.enabled - Whether to enable the check (default: true)
 */
export function useAgreementCheck(options: UseAgreementCheckOptions = {}) {
  const { enabled = true } = options;
  const { data: me } = useMe();
  const { data: versions, isLoading } = useAgreementVersions({ enabled });

  // Early return if check is disabled
  if (!enabled) {
    return {
      needsReaccept: false,
      needsTerms: false,
      needsPrivacy: false,
      isLoading: false,
    };
  }

  // Early return if not authenticated (me will be undefined due to enabled: false)
  if (!me) {
    return {
      needsReaccept: false,
      needsTerms: false,
      needsPrivacy: false,
      isLoading,
    };
  }

  // Treat null/undefined as 0 (not accepted yet)
  const userTermsVersion = me.termsVersion ?? 0;
  const userPrivacyVersion = me.privacyVersion ?? 0;
  const serverTermsVersion = versions?.termsVersion ?? 0;
  const serverPrivacyVersion = versions?.privacyVersion ?? 0;

  // Check if user needs to re-accept
  const needsTerms = userTermsVersion < serverTermsVersion;
  const needsPrivacy = userPrivacyVersion < serverPrivacyVersion;
  const needsReaccept = needsTerms || needsPrivacy;

  return {
    needsReaccept,
    needsTerms,
    needsPrivacy,
    isLoading,
  };
}
