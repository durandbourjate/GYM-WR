import { Titel, Untertitel, Text, Schritt } from './layoutHelpers'

export default function HilfeDurchfuehrung() {
  return (
    <div>
      <Titel>Prüfung durchführen</Titel>
      <Text>
        Klicken Sie auf &laquo;Durchführen&raquo; bei der gewünschten Prüfung auf der Startseite. Der 4-Phasen-Workflow führt Sie durch den gesamten Ablauf:
      </Text>

      <Untertitel>Phase 1: Vorbereitung</Untertitel>
      <Schritt nr={1}>Klassenlisten werden automatisch aus Google Sheets geladen.</Schritt>
      <Schritt nr={2}>Wählen Sie die Kurse aus (pro Gefäss, z.B. SF WR). SuS können in mehreren Kursen vorkommen — Duplikate werden automatisch erkannt. Einzelne SuS können über die Checkboxen innerhalb der Kursübersicht ab-/angewählt werden.</Schritt>
      <Schritt nr={3}>Zeitzuschläge (Nachteilsausgleich): Geben Sie die Zusatzminuten direkt neben dem SuS-Namen ein (Eingabefeld in der Teilnehmerliste).</Schritt>
      <Schritt nr={4}>Optional: Einladungs-E-Mails an die ausgewählten SuS versenden.</Schritt>
      <Schritt nr={5}>Wählen Sie die <strong>Kontrollstufe</strong> (Soft-Lockdown): Keine (keine Einschränkungen, für Übungen), Locker (Verstösse werden gezählt und im Monitoring angezeigt, aber keine Sperre), Standard (Copy/Paste-Block, Vollbild, 3 Verstösse = Sperre) oder Streng (Sofort-Pause). iPads werden automatisch auf maximal Standard heruntergestuft.</Schritt>
      <Schritt nr={6}>Klicken Sie &laquo;Weiter zur Lobby&raquo; — die Teilnehmer werden gespeichert.</Schritt>

      <Untertitel>Phase 2: Lobby</Untertitel>
      <Text>
        Hier sehen Sie, welche SuS bereit sind (eingeloggt und wartend). Ein Fortschrittsbalken zeigt bereit/ausstehend an. Unerwartete SuS (nicht auf der Teilnehmerliste) werden separat angezeigt. Gerät, Kontrollstufe und SEB-Status sind pro SuS sichtbar. Zeitzuschläge werden inline pro SuS als ⏱-Badge angezeigt und können über den Nachteilsausgleich-Bereich angepasst werden.
      </Text>

      <Untertitel>Phase 3: Live-Monitoring</Untertitel>
      <Text>
        Im Live-Dashboard sehen Sie pro SuS: Status, Verstösse, Kontrollstufe, Gerät (Laptop/iPad), aktuelle Frage und Fortschritt. Inaktivitäts-Warnstufen zeigen an, wenn SuS länger als 1/3/5 Minuten nichts tun.
      </Text>
      <Text>
        <strong>Soft-Lockdown:</strong> Die Verstoss-Spalte zeigt den Zähler (z.B. ⚠️ 2/3). Bei Hover sehen Sie Details (Zeitpunkt, Typ). Wird ein SuS gesperrt (max. Verstösse erreicht), erscheint ein 🔒-Symbol mit &laquo;Entsperren&raquo;-Button. Die Kontrollstufe zeigt an, ob ein automatisches Downgrade stattgefunden hat (z.B. bei iPads).
      </Text>
      <Text>
        Sie können die Prüfung jederzeit beenden — sofort oder mit Restzeit (z.B. noch 5 Minuten). Über den ✕-Button in der Schülerzeile können auch einzelne SuS individuell beendet werden (z.B. bei Spickverdacht). Bei SuS mit Nachteilsausgleich wird der verbleibende Zeitzuschlag als Countdown angezeigt.
      </Text>
      <Text>
        Antworten werden alle 30 Sekunden automatisch gespeichert. Bei Verbindungsabbruch werden sie lokal zwischengespeichert und bei Reconnect nachgesendet.
      </Text>

      <Untertitel>Multi-Prüfungs-Dashboard</Untertitel>
      <Text>
        Bei Nachprüfungsterminen (verschiedene Prüfungen gleichzeitig) können Sie alle in einem Tab überwachen. Klicken Sie auf den &laquo;Multi-Dashboard&raquo;-Button auf der Prüfungsliste (erscheint ab 2 Prüfungen), wählen Sie die gewünschten Prüfungen per Checkbox und öffnen Sie das Dashboard in einem neuen Tab.
      </Text>

      <Untertitel>Phase 4: Ergebnisse</Untertitel>
      <Text>
        Nach Prüfungsende sehen Sie eine Zusammenfassung: Teilnehmer, Abgaben, No-Shows. Von hier gelangen Sie direkt zur Korrektur.
      </Text>

      <Untertitel>Zeitmodus</Untertitel>
      <Text>
        <strong>Countdown:</strong> Klassischer Modus mit fixer Dauer (z.B. 45 Min.). SuS mit Nachteilsausgleich erhalten automatisch Zusatzzeit.
      </Text>
      <Text>
        <strong>Open-End:</strong> Kein Zeitlimit — die Stoppuhr zählt aufwärts. Sie beenden die Prüfung manuell, optional mit Restzeit.
      </Text>

      <Untertitel>URL-Schema</Untertitel>
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-sm space-y-2 mb-4">
        <div><code className="text-xs bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">/Pruefung/?id=abc</code> — Prüfung für SuS / Durchführen für LP</div>
        <div><code className="text-xs bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">/Pruefung/?ids=abc,def</code> — Multi-Dashboard: mehrere Prüfungen parallel überwachen</div>
        <div><code className="text-xs bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">/Pruefung/?id=abc&ansicht=korrektur</code> — Korrektur-Dashboard</div>
      </div>
    </div>
  )
}
