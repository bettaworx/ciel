/**
 * Setup wizard animation configuration
 */
export const SETUP_ANIMATION_CONFIG = {
  /**
   * Enable animation on mobile devices
   * Set to true to enable animations on all screen sizes
   * Set to false to disable animations on mobile (performance optimization)
   */
  enableMobileAnimation: false,

  /**
   * Animation duration in seconds
   */
  duration: 0.4,

  /**
   * GSAP easing function
   */
  ease: 'power2.inOut',

  /**
   * Mobile breakpoint in pixels (matches Tailwind's sm: breakpoint)
   */
  mobileBreakpoint: 640,
} as const

/**
 * Animation direction for transitions
 */
export type AnimationDirection = 'forward' | 'backward'
