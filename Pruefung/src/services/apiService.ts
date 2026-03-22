// Barrel-Re-Export für Abwärtskompatibilität
// Alle bestehenden Imports `import { apiService } from '../services/apiService'` bleiben funktional

import { istKonfiguriert } from './apiClient'
import { ladePruefung, speichereAntworten, heartbeat, schaltePruefungFrei, beendePruefung, sebAusnahmeErlauben } from './pruefungApi'
import { ladeAlleConfigs, ladeFragenbank, speichereConfig, loeschePruefung, speichereFrage, loescheFrage } from './fragenbankApi'
import { ladeKorrektur, ladeAbgaben, starteKorrektur, ladeKorrekturFortschritt, speichereKorrekturZeile, generiereUndSendeFeedback, korrekturFreigeben, ladeKorrekturenFuerSuS, ladeKorrekturDetail } from './korrekturApi'
import { importierePoolFragen, importiereLernziele, schreibePoolAenderung, ladeLernziele } from './poolApi'
import { ladeKlassenlisten, setzeTeilnehmer, sendeEinladungen, validiereSchuelercode } from './klassenlistenApi'
import { uploadMaterial, uploadAnhang, uploadAudioKommentar, kiAssistent } from './uploadApi'
import { sendeNachricht, ladeNachrichten } from './nachrichtenApi'
import { ladeMonitoring } from './monitoringApi'
import { ladeTrackerDaten } from './api/trackerApi'

export const apiService = {
  istKonfiguriert,
  ladePruefung,
  speichereAntworten,
  heartbeat,
  ladeMonitoring,
  ladeAlleConfigs,
  ladeFragenbank,
  speichereConfig,
  loeschePruefung,
  speichereFrage,
  loescheFrage,
  importierePoolFragen,
  importiereLernziele,
  schreibePoolAenderung,
  ladeLernziele,
  validiereSchuelercode,
  ladeKorrektur,
  ladeAbgaben,
  starteKorrektur,
  ladeKorrekturFortschritt,
  speichereKorrekturZeile,
  generiereUndSendeFeedback,
  schaltePruefungFrei,
  beendePruefung,
  sendeNachricht,
  ladeNachrichten,
  uploadMaterial,
  uploadAnhang,
  kiAssistent,
  uploadAudioKommentar,
  korrekturFreigeben,
  ladeKorrekturenFuerSuS,
  ladeKorrekturDetail,
  ladeKlassenlisten,
  setzeTeilnehmer,
  sendeEinladungen,
  ladeTrackerDaten,
  sebAusnahmeErlauben,
}

// Typ-Re-Exports für Abwärtskompatibilität
export type { KorrekturListeEintrag, KorrekturDetailBewertung, KorrekturDetailDaten } from './korrekturApi'
export type { KlassenlistenEintrag } from './klassenlistenApi'
