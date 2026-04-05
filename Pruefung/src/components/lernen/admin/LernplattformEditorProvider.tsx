/**
 * EditorProvider für die Lernplattform.
 * Konfiguriert den SharedFragenEditor mit allen Features.
 * Nutzt dieselben Endpoints wie das Prüfungstool für KI, Upload, Lernziele.
 */
import { useMemo, useEffect, type ReactNode } from 'react'
import { EditorProvider } from '@shared/editor/EditorContext'
import type { EditorConfig, EditorServices } from '@shared/editor/types'
import { setKontenrahmenData } from '@shared/editor/kontenrahmen'
import kontenrahmenDaten from '@shared/editor/kontenrahmenDaten'
import { useLernenAuthStore } from '../../../store/lernen/authStore'
import { lernenApiClient } from '../../../services/lernen/apiClient'

interface Props {
  children: ReactNode
}

export default function LernplattformEditorProvider({ children }: Props) {
  const user = useLernenAuthStore(s => s.user)

  // Kontenrahmen einmalig laden (für FiBu-Fragetypen)
  useEffect(() => { setKontenrahmenData(kontenrahmenDaten) }, [])

  const config: EditorConfig = useMemo(() => ({
    benutzer: {
      email: user?.email ?? '',
      name: user?.name ?? '',
    },
    verfuegbareGefaesse: ['SF', 'EF', 'EWR', 'GF'],
    verfuegbareSemester: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'],
    zeigeFiBuTypen: true,
    features: {
      kiAssistent: true,
      anhangUpload: true,
      bewertungsraster: true,
      sharing: true,
      poolSync: false, // Pool-Sync nur im Prüfungstool (Übungspools-Brücke)
      performance: false, // Performance-Daten nur im Prüfungstool
    },
  }), [user?.email, user?.name])

  const services: EditorServices = useMemo(() => ({
    // KI-Assistent: Ruft das Prüfungstool-Backend für KI-Aktionen auf
    kiAssistent: async (aktion: string, daten: Record<string, unknown>) => {
      try {
        const response = await lernenApiClient.post<{ success: boolean; data: Record<string, unknown> }>(
          'lernplattformKIAssistent',
          { aktion, daten, email: user?.email },
          getToken()
        )
        return response?.data ?? null
      } catch { return null }
    },

    // Upload: Datei an Drive hochladen
    uploadAnhang: async (frageId: string, datei: File) => {
      try {
        const base64 = await dateiZuBase64(datei)
        const response = await lernenApiClient.post<{ success: boolean; data: import('@shared/types/fragen').FrageAnhang }>(
          'lernplattformUploadAnhang',
          { frageId, dateiname: datei.name, mimeType: datei.type, base64, email: user?.email },
          getToken()
        )
        return response?.data ?? null
      } catch { return null }
    },

    istKIVerfuegbar: () => !!user?.email,
    istUploadVerfuegbar: () => !!user?.email,

    // Lernziele laden (aus Fragenbank-Metadaten)
    ladeLernziele: async (_gefaess: string, fachbereich: string) => {
      try {
        const response = await lernenApiClient.post<{ success: boolean; data: import('@shared/types/fragen').Lernziel[] }>(
          'lernplattformLadeLernziele',
          { fachbereich, email: user?.email },
          getToken()
        )
        return response?.data ?? []
      } catch { return [] }
    },
  }), [user?.email])

  return (
    <EditorProvider config={config} services={services}>
      {children}
    </EditorProvider>
  )
}

function getToken(): string | undefined {
  try {
    const stored = localStorage.getItem('lernplattform-auth')
    return stored ? JSON.parse(stored).sessionToken : undefined
  } catch { return undefined }
}

function dateiZuBase64(datei: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(datei)
  })
}
