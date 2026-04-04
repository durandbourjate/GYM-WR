import { useMemo, type ReactNode } from 'react'
import { EditorProvider } from '@shared/editor/EditorContext'
import type { EditorConfig, EditorServices } from '@shared/editor/types'
import { useAuthStore } from '../../store/authStore'

interface Props {
  children: ReactNode
}

export default function LernplattformEditorProvider({ children }: Props) {
  const user = useAuthStore(s => s.user)

  const config: EditorConfig = useMemo(() => ({
    benutzer: {
      email: user?.email ?? '',
      name: user?.name ?? '',
    },
    verfuegbareGefaesse: [],
    verfuegbareSemester: [],
    zeigeFiBuTypen: true,
    features: {
      kiAssistent: false,
      anhangUpload: false,
      bewertungsraster: false,
      sharing: false,
      poolSync: false,
      performance: false,
    },
  }), [user?.email, user?.name])

  const services: EditorServices = useMemo(() => ({
    istKIVerfuegbar: () => false,
    istUploadVerfuegbar: () => false,
  }), [])

  return (
    <EditorProvider config={config} services={services}>
      {children}
    </EditorProvider>
  )
}
