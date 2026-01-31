/**
 * Admin setup wizard step definitions
 * 
 * This defines the order and available steps for the initial server setup flow.
 * The admin must complete all required steps before the server can be used.
 */

export const ADMIN_SETUP_STEPS = [
  'welcome',              // Welcome screen
  'verify-password',      // Enter INITIAL_SETUP_PASSWORD
  'create-admin',         // Create admin account (username + password)
  'admin-profile',        // Admin profile setup (display name, avatar, bio) - SKIPPABLE
  'server-info',          // Server info (name, description, icon)
  'invite-settings',      // Invite-only toggle + code generation
  'complete',             // Completion screen
] as const;

export type AdminSetupStep = typeof ADMIN_SETUP_STEPS[number];

/**
 * Validates if a given step is valid
 */
export function isValidAdminSetupStep(step: string): step is AdminSetupStep {
  return ADMIN_SETUP_STEPS.includes(step as AdminSetupStep);
}

/**
 * Gets the next step in the setup flow
 */
export function getNextAdminSetupStep(currentStep: AdminSetupStep): AdminSetupStep | null {
  const currentIndex = ADMIN_SETUP_STEPS.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === ADMIN_SETUP_STEPS.length - 1) {
    return null;
  }
  return ADMIN_SETUP_STEPS[currentIndex + 1];
}

/**
 * Gets the previous step in the setup flow
 */
export function getPreviousAdminSetupStep(currentStep: AdminSetupStep): AdminSetupStep | null {
  const currentIndex = ADMIN_SETUP_STEPS.indexOf(currentStep);
  if (currentIndex <= 0) {
    return null;
  }
  return ADMIN_SETUP_STEPS[currentIndex - 1];
}

/**
 * Calculates the progress percentage for the current step
 */
export function getAdminSetupProgress(currentStep: AdminSetupStep): number {
  const currentIndex = ADMIN_SETUP_STEPS.indexOf(currentStep);
  if (currentIndex === -1) return 0;
  return Math.round(((currentIndex + 1) / ADMIN_SETUP_STEPS.length) * 100);
}
