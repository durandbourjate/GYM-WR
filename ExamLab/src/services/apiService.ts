// Barrel-Re-Export für Abwärtskompatibilität
// Alle bestehenden Imports `import { apiService } from '../services/apiService'` bleiben funktional

import { istKonfiguriert, getJson } from './apiClient'
import { ladePruefung, ladeEinzelConfig, speichereAntworten, heartbeat, schaltePruefungFrei, beendePruefung, resetPruefung, sebAusnahmeErlauben, entsperreSuS, setzeKontrollStufe } from './pruefungApi'
import { ladeAlleConfigs, ladeFragenbank, speichereConfig, loeschePruefung, speichereFrage, loescheFrage } from './fragenbankApi'
import { ladeKorrektur, ladeAbgaben, starteKorrektur, ladeKorrekturFortschritt, ladeKorrekturStatus, speichereKorrekturZeile, generiereUndSendeFeedback, korrekturFreigeben, ladeKorrekturenFuerSuS, ladeKorrekturDetail } from './korrekturApi'
import { importierePoolFragen, importiereLernziele, schreibePoolAenderung, ladeLernziele } from './poolApi'
import { ladeKlassenlisten, setzeTeilnehmer, sendeEinladungen, validiereSchuelercode } from './klassenlistenApi'
import { uploadMaterial, uploadAnhang, uploadAudioKommentar, kiAssistent } from './uploadApi'
import { sendeNachricht, ladeNachrichten } from './nachrichtenApi'
import { ladeMonitoring } from './monitoringApi'
import { ladeTrackerDaten } from './api/trackerApi'
import { ladeKurse, ladeKursDetails, ladeSchuljahr, ladeLehrplan } from './synergyApi'
import { setzeBerechtigungen, dupliziereFrage, duplizierePruefung } from './sharingApi'

export const apiService = {
  istKonfiguriert,
  ladePruefung,
  ladeEinzelConfig,
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
  ladeKorrekturStatus,
  speichereKorrekturZeile,
  generiereUndSendeFeedback,
  schaltePruefungFrei,
  beendePruefung,
  resetPruefung,
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
  entsperreSuS,
  setzeKontrollStufe,
  ladeDriveFile: (fileId: string, email: string) =>
    getJson<{ base64: string; mimeType: string; name: string }>('ladeDriveFile', { fileId, email }),
  ladeKurse,
  ladeKursDetails,
  ladeSchuljahr,
  ladeLehrplan,
  setzeBerechtigungen,
  dupliziereFrage,
  duplizierePruefung,
}

// Typ-Re-Exports für Abwärtskompatibilität
export type { KorrekturListeEintrag, KorrekturDetailBewertung, KorrekturDetailDaten, KorrekturStatus } from './korrekturApi'
export type { KlassenlistenEintrag } from './klassenlistenApi'
export type { ZentralerKurs, StundenplanEintrag, Schueler, TafPhase, KursDetails, Schuljahr, Beurteilungsregel, LehrplanDaten } from './synergyApi'
