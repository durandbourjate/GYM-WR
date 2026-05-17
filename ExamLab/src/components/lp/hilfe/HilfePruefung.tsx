import { TitelMitStern, Untertitel, Text } from './layoutHelpers'

export default function HilfePruefung() {
  return (
    <div>
      <TitelMitStern tabId="pruefung">Prüfung erstellen</TitelMitStern>
      <Text>
        Klicken Sie auf &laquo;+ Neue Prüfung&raquo; um den Prüfungs-Composer zu öffnen. Der Composer hat 4 Tabs:
      </Text>

      <Untertitel>1. Einstellungen</Untertitel>
      <Text>
        Titel, Klasse, Datum, Gefäss (SF/EF/EWR/GF/FF), Fach, Tags, Dauer und Prüfungstyp (summativ/formativ) festlegen. Optionen wie SEB-Pflicht, Rücknavigation, Zeitanzeige und Rechtschreibprüfung konfigurieren.
      </Text>
      <Text>
        Zeitzuschläge (Nachteilsausgleich) können pro SuS individuell vergeben werden — die zusätzlichen Minuten werden automatisch zur Prüfungsdauer addiert.
      </Text>

      <Untertitel>2. Abschnitte & Fragen</Untertitel>
      <Text>
        Erstellen Sie Abschnitte (z.B. &laquo;Teil A: Multiple Choice&raquo;) und fügen Sie Fragen aus der Fragensammlung hinzu. Abschnitte und Fragen können per Pfeiltasten umsortiert werden.
      </Text>

      <Untertitel>3. Vorschau</Untertitel>
      <Text>
        Zeigt eine Zusammenfassung der Prüfung wie sie die SuS sehen werden. Über &laquo;SuS-Ansicht öffnen&raquo; können Sie die vollständige Prüfungsansicht testen.
      </Text>

      <Untertitel>4. Analyse</Untertitel>
      <Text>
        Automatische Auswertung der Prüfung: Taxonomie-Verteilung (K1-K6), Fragetypen-Mix, geschätzter Zeitbedarf vs. Prüfungsdauer, Themen-Abdeckung und Punkteverteilung. Warnungen erscheinen bei Ungleichgewichten. Per Button kann zusätzlich eine KI-Analyse mit Verbesserungsvorschlägen gestartet werden.
      </Text>
    </div>
  )
}
