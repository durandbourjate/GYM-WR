/**
 * React Context für den Shared FragenEditor.
 * Host-Apps wrappen den Editor in einem EditorProvider mit ihrer Config/Services.
 */
import { createContext, useContext, type ReactNode } from 'react'
import type { EditorConfig, EditorServices } from './types'

interface EditorContextValue {
  config: EditorConfig
  services: EditorServices
}

const EditorCtx = createContext<EditorContextValue | null>(null)

interface EditorProviderProps {
  config: EditorConfig
  services: EditorServices
  children: ReactNode
}

export function EditorProvider({ config, services, children }: EditorProviderProps) {
  return (
    <EditorCtx.Provider value={{ config, services }}>
      {children}
    </EditorCtx.Provider>
  )
}

export function useEditorContext(): EditorContextValue {
  const ctx = useContext(EditorCtx)
  if (!ctx) throw new Error('useEditorContext muss innerhalb von EditorProvider verwendet werden')
  return ctx
}

export function useEditorConfig(): EditorConfig {
  return useEditorContext().config
}

export function useEditorServices(): EditorServices {
  return useEditorContext().services
}
