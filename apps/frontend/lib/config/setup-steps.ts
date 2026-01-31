/**
 * Setup wizard step definitions
 */
export const SETUP_STEPS = [
  'welcome',
  'display-name',
  'avatar',
  'bio',
  'complete',
] as const

/**
 * Setup step type
 */
export type SetupStep = (typeof SETUP_STEPS)[number]

/**
 * Get the index of a step
 */
export const getStepIndex = (step: SetupStep): number => {
  return SETUP_STEPS.indexOf(step)
}

/**
 * Get step by index
 */
export const getStepByIndex = (index: number): SetupStep | null => {
  return SETUP_STEPS[index] ?? null
}

/**
 * Get the total number of actual steps (excluding welcome and complete)
 */
export const getTotalSteps = (): number => {
  // Welcome (0) and Complete (4) are not counted
  return 3
}

/**
 * Get the current step number for display (1, 2, 3)
 * Returns null for welcome and complete steps
 */
export const getCurrentStepNumber = (step: SetupStep): number | null => {
  const index = getStepIndex(step)
  // Welcome (0) and Complete (4) don't have step numbers
  if (index === 0 || index === 4) return null
  // display-name (1) -> 1, avatar (2) -> 2, bio (3) -> 3
  return index
}

/**
 * Validate if a step exists
 */
export const isValidStep = (step: string): step is SetupStep => {
  return SETUP_STEPS.includes(step as SetupStep)
}
