import type { PruefungsConfig } from '../../../types/pruefung'

/** Vorlage für neue summative Prüfung */
export const leerePruefung: PruefungsConfig = {
  id: '',
  titel: '',
  klasse: '',
  gefaess: 'SF',
  semester: 'S4',
  fachbereiche: [],
  datum: new Date().toISOString().split('T')[0],
  typ: 'summativ',
  modus: 'pruefung',
  dauerMinuten: 45,
  zeitModus: 'countdown',
  gesamtpunkte: 0,
  erlaubteKlasse: '',
  sebErforderlich: false,
  abschnitte: [],
  zufallsreihenfolgeFragen: false,
  zufallsreihenfolgeOptionen: false,
  ruecknavigation: true,
  zeitanzeigeTyp: 'countdown',
  autoSaveIntervallSekunden: 30,
  heartbeatIntervallSekunden: 10,
  korrektur: { aktiviert: false, modus: 'batch' },
  feedback: { zeitpunkt: 'nach-review', format: 'in-app-und-pdf', detailgrad: 'vollstaendig' },
  freigeschaltet: true,
  zeitverlaengerungen: {},
}

/** Vorlage für formative Übungen (aus Übungstool erstellt) */
export const leereUebung: PruefungsConfig = {
  ...leerePruefung,
  typ: 'formativ',
  modus: 'uebung',
  zeitModus: 'open-end',
  dauerMinuten: 0,
  kontrollStufe: 'locker',
  zeitanzeigeTyp: 'keine',
}
