import { createContext, useContext, type ReactNode } from 'react'

export type FrageMode = 'pruefung' | 'ueben'

const FrageModeContext = createContext<FrageMode | null>(null)

export function FrageModeProvider({ mode, children }: { mode: FrageMode; children: ReactNode }) {
  return <FrageModeContext.Provider value={mode}>{children}</FrageModeContext.Provider>
}

export function useFrageMode(): FrageMode {
  const mode = useContext(FrageModeContext)
  if (!mode) throw new Error('useFrageMode muss innerhalb eines FrageModeProvider verwendet werden')
  return mode
}
