import { TitelMitStern, Untertitel, Text, Schritt } from './layoutHelpers'

export default function HilfeUeben() {
  return (
    <div>
      <TitelMitStern tabId="ueben">Üben — Formative Übungen</TitelMitStern>
      <Text>
        Der Bereich <strong>Üben</strong> ermöglicht formative Übungen ohne Notendruck. Übungen verwenden die gleichen Fragetypen und den gleichen Workflow wie Prüfungen — aber ohne Punkte, Noten und strenge Sicherheitsmassnahmen.
      </Text>

      <Untertitel>Unterschiede zu Prüfungen</Untertitel>
      <Text>
        Übungen sind immer <strong>formativ</strong> (unbenotet). Folgende Elemente sind automatisch angepasst:
      </Text>
      <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1 mb-4 ml-4">
        <li>• Keine Punkte und keine Noten</li>
        <li>• Kontrollstufe standardmässig auf &laquo;Locker&raquo; (nur Logging, keine Sperre)</li>
        <li>• Open-End-Modus (kein Countdown)</li>
        <li>• &laquo;Auswertung&raquo; statt &laquo;Korrektur&raquo; — ohne Notenberechnung</li>
      </ul>

      <Untertitel>Übung erstellen</Untertitel>
      <Schritt nr={1}>
        Wechseln Sie zum Tab <strong>Üben</strong> in der Kopfzeile.
      </Schritt>
      <Schritt nr={2}>
        Klicken Sie auf <strong>+ Neue Übung</strong>.
      </Schritt>
      <Schritt nr={3}>
        Der Composer öffnet sich mit formativ-Defaults. Titel eingeben, Fragen aus der Fragensammlung hinzufügen, Abschnitte bilden.
      </Schritt>
      <Schritt nr={4}>
        Übung durchführen: gleicher 4-Phasen-Workflow (Vorbereitung → Lobby → Live → Auswertung).
      </Schritt>

      <Untertitel>SuS-Übungsbereich (Selbststudium)</Untertitel>
      <Text>
        Im Sub-Tab <strong>Übungen</strong> innerhalb von Üben verwalten Sie den Selbststudium-Bereich. Hier sind SuS in <strong>Gruppen</strong> organisiert (z.B. nach Kurs oder Familie). Jede Gruppe hat eine eigene Fragensammlung und Fortschrittsdaten.
      </Text>
      <Text>
        Das Mastery-System basiert auf <strong>Sessions</strong> (nicht auf Tagen). Fragen durchlaufen 4 Stufen: <strong>neu → üben → gefestigt → gemeistert</strong>. Persistente Schwächen werden als &laquo;Dauerbaustellen&raquo; regelmässig erneut eingestreut, blockieren aber den Fortschritt nicht.
      </Text>

      <Untertitel>Einführungsübung</Untertitel>
      <Text>
        Die <strong>Einführungsübung</strong> wird automatisch bereitgestellt und enthält Beispielaufgaben zu allen wichtigen Fragetypen. Sie erklärt auch das Mastery-System. Ideal für den Einstieg mit einer neuen Klasse.
      </Text>
    </div>
  )
}
