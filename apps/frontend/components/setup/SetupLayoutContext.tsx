'use client'

import { createContext, useContext, useState } from 'react'

interface ProgressState {
  visible: boolean
  currentStep: number
  totalSteps: number
}

interface SetupLayoutContextValue {
  progress: ProgressState
  footer: React.ReactNode | null
  setProgress: (state: ProgressState) => void
  setFooter: (footer: React.ReactNode | null) => void
}

const SetupLayoutContext = createContext<SetupLayoutContextValue | null>(null)

export function SetupLayoutProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [progress, setProgress] = useState<ProgressState>({
    visible: false,
    currentStep: 0,
    totalSteps: 0,
  })
  const [footer, setFooter] = useState<React.ReactNode | null>(null)

  return (
    <SetupLayoutContext.Provider
      value={{
        progress,
        footer,
        setProgress,
        setFooter,
      }}
    >
      {children}
    </SetupLayoutContext.Provider>
  )
}

export function useSetupLayout() {
  const context = useContext(SetupLayoutContext)

  if (!context) {
    throw new Error('useSetupLayout must be used within SetupLayoutProvider')
  }

  return context
}
