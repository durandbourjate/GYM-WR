/**
 * EditorProvider für ExamLab Üben.
 * Konfiguriert den SharedFragenEditor mit allen Features.
 * Nutzt dieselben Endpoints wie ExamLab Prüfen für KI, Upload, Lernziele.
 */
import { useMemo, useEffect, type ReactNode } from 'react'
import { EditorProvider } from '@shared/editor/EditorContext'
import type { EditorConfig, EditorServices } from '@shared/editor/types'
import { setKontenrahmenData } from '@shared/editor/kontenrahmen'
import kontenrahmenDaten from '@shared/editor/kontenrahmenDaten'
import { useUebenAuthStore } from '../../../store/ueben/authStore'
import { uebenApiClient } from '../../../services/ueben/apiClient'

interface Props {
  children: ReactNode
}

export default function UebenEditorProvider({ children }: Props) {
  const user = useUebenAuthStore(s => s.user)

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
      poolSync: false, // Pool-Sync nur in ExamLab Prüfen (Übungspools-Brücke)
      performance: false, // Performance-Daten nur in ExamLab Prüfen
    },
  }), [user?.email, user?.name])

  const services: EditorServices = useMemo(() => ({
    // KI-Assistent: Ruft das ExamLab-Backend für KI-Aktionen auf
    kiAssistent: async (aktion: string, daten: Record<string, unknown>) => {
      try {
        const response = await uebenApiClient.post<{ success: boolean; data: Record<string, unknown> }>(
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
        const response = await uebenApiClient.post<{ success: boolean; data: import('@shared/types/fragen').FrageAnhang }>(
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
        const response = await uebenApiClient.post<{ success: boolean; data: import('@shared/types/fragen').Lernziel[] }>(
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
    const stored = localStorage.getItem('ueben-auth')
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
