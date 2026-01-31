'use client'

import { useEffect } from 'react'
import type { AnimationDirection } from '@/lib/config/setup-animation'

interface SetupTransitionProps {
  children: React.ReactNode
  currentStep: number
  direction: AnimationDirection
  onAnimationComplete?: () => void
}

/**
 * SetupTransition component handles step transitions.
 * Animation is currently disabled to avoid hydration issues.
 */
export function SetupTransition({
  children,
  currentStep,
  direction,
  onAnimationComplete,
}: SetupTransitionProps) {
  useEffect(() => {
    onAnimationComplete?.()
  }, [currentStep, direction, onAnimationComplete])

  return <div className="w-full flex-1 h-full min-h-0 flex flex-col">{children}</div>
}
