import { Titel, Untertitel, Text, Schritt } from './layoutHelpers'

export default function HilfeEinstieg() {
  return (
    <div>
      <Titel>Willkommen bei ExamLab</Titel>
      <Text>
        ExamLab ermöglicht digitale Prüfungen direkt im Browser — für alle Fachschaften am Gymnasium Hofwil. Sie erstellen Prüfungen im Composer, die Schülerinnen und Schüler bearbeiten sie online, und die Korrektur kann KI-unterstützt erfolgen.
      </Text>

      <Untertitel>Anmeldung</Untertitel>
      <Text>
        Melden Sie sich mit Ihrem <strong>@gymhofwil.ch</strong>-Konto über Google OAuth an. Die Rolle (Lehrperson oder SuS) wird automatisch anhand der E-Mail-Adresse zugewiesen. Lehrpersonen erhalten Zugriff auf Composer, Fragensammlung, Monitoring und Korrektur.
      </Text>
      <Text>
        SuS melden sich mit dem gleichen Login an und sehen direkt die ihnen zugewiesene Prüfung (über den Link mit Prüfungs-ID).
      </Text>

      <Untertitel>Überblick: Ihr Workflow</Untertitel>
      <Schritt nr={1}>
        <strong>Fragen erstellen</strong> — In der Fragensammlung Fragen mit 20 verschiedenen Typen anlegen (MC, Freitext, Lückentext, Zuordnung, Richtig/Falsch, Berechnung, Buchungssatz, T-Konto, Kontenbestimmung, Bilanz/ER, Aufgabengruppe, Zeichnen, PDF-Annotation, Sortierung, Hotspot, Bildbeschriftung, Audio-Aufnahme, Drag & Drop (Bild), Code-Editor, Formel (LaTeX)).
      </Schritt>
      <Schritt nr={2}>
        <strong>Prüfung zusammenstellen</strong> — Im Composer eine neue Prüfung erstellen: Einstellungen festlegen, Abschnitte bilden, Fragen aus der Fragensammlung zuordnen.
      </Schritt>
      <Schritt nr={3}>
        <strong>Prüfung analysieren</strong> — Im Analyse-Tab die Prüfung auf Taxonomie-Verteilung, Zeitbedarf und Fragetypen-Mix prüfen.
      </Schritt>
      <Schritt nr={4}>
        <strong>Prüfung durchführen</strong> — Klicken Sie auf &laquo;Durchführen&raquo; auf der Startseite. Der 4-Phasen-Workflow führt Sie durch: Teilnehmer auswählen (Vorbereitung) → Bereitschaft prüfen (Lobby) → Live-Monitoring → Ergebnisse.
      </Schritt>
      <Schritt nr={5}>
        <strong>Korrigieren</strong> — Im Korrektur-Dashboard die Antworten KI-gestützt bewerten lassen und Feedback versenden. Individuelle SuS-PDFs drucken.
      </Schritt>
      <Schritt nr={6}>
        <strong>Nachverfolgen</strong> — Im Tracker-Tab sehen Sie: Wer hat gefehlt? Wie viele Noten gibt es pro Kurs? Fragen-Statistiken zeigen Lösungsquoten über alle Durchführungen.
      </Schritt>

      <Untertitel>Favoriten & Direktlinks</Untertitel>
      <Text>
        Markieren Sie häufig verwendete Prüfungen oder Übungen mit dem <strong>☆-Button</strong> auf jeder Karte. Favoriten erscheinen oben in der jeweiligen Liste und sind über das <strong>⭐-Dropdown</strong> in der Kopfzeile jederzeit erreichbar.
      </Text>
      <Text>
        Favoriten sind <strong>Account-verknüpft</strong> — sie werden automatisch mit Ihrem LP-Profil im Backend gespeichert und stehen auf allen Geräten zur Verfügung. Im Dropdown können Sie über das 🔗-Icon einen <strong>Direktlink</strong> kopieren, der direkt zur Prüfung oder Übung führt. Diese Links können Sie z.B. in Ihrem Browser als Lesezeichen speichern oder an Kolleginnen und Kollegen weitergeben.
      </Text>

      <Untertitel>Demo-Modus</Untertitel>
      <Text>
        Ohne Backend-Konfiguration läuft die App im Demo-Modus mit Beispieldaten. Sie können alle Funktionen ausprobieren — Änderungen werden aber nicht gespeichert. Klicken Sie auf dem Login-Screen auf &laquo;Als Lehrperson&raquo; oder &laquo;Als Schüler/in&raquo; unter &laquo;Demo ohne Login starten&raquo;.
      </Text>
    </div>
  )
}
