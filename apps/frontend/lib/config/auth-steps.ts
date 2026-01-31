/**
 * Auth wizard step definitions for login and signup flows
 */

export const LOGIN_STEPS = ['username', 'password'] as const
export const SIGNUP_STEPS = ['terms', 'privacy', 'username', 'password', 'invite-code'] as const

/**
 * Login step type
 */
export type LoginStep = (typeof LOGIN_STEPS)[number]

/**
 * Signup step type
 */
export type SignupStep = (typeof SIGNUP_STEPS)[number]

/**
 * Get the index of a login step
 */
export const getLoginStepIndex = (step: LoginStep): number => {
  return LOGIN_STEPS.indexOf(step)
}

/**
 * Get the index of a signup step
 */
export const getSignupStepIndex = (step: SignupStep): number => {
  return SIGNUP_STEPS.indexOf(step)
}

/**
 * Get login step by index
 */
export const getLoginStepByIndex = (index: number): LoginStep | null => {
  return LOGIN_STEPS[index] ?? null
}

/**
 * Get signup step by index
 */
export const getSignupStepByIndex = (index: number): SignupStep | null => {
  return SIGNUP_STEPS[index] ?? null
}

/**
 * Validate if a login step exists
 */
export const isValidLoginStep = (step: string): step is LoginStep => {
  return LOGIN_STEPS.includes(step as LoginStep)
}

/**
 * Validate if a signup step exists
 */
export const isValidSignupStep = (step: string): step is SignupStep => {
  return SIGNUP_STEPS.includes(step as SignupStep)
}
