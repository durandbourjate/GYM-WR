import { FileText, AlertTriangle } from 'lucide-react'
import { Titel, Untertitel, Text, Schritt, Hinweis } from './layoutHelpers'

export default function HilfeKorrektur() {
  return (
    <div>
      <Titel>Korrektur & Feedback</Titel>

      <Text>
        Nach der Prüfung können Sie über &laquo;Korrektur&raquo; auf der Startseite das Korrektur-Dashboard öffnen.
      </Text>

      <Untertitel>Autokorrektur</Untertitel>
      <Text>
        Mit &laquo;Autokorrektur starten&raquo; werden alle Antworten automatisch bewertet. Deterministische Fragetypen (MC, R/F, Lückentext, Zuordnung, Berechnung, FiBu) werden algorithmisch korrigiert. Für komplexe Fragetypen (Freitext, Zeichnen, PDF) können Sie pro Frage einen KI-Vorschlag via Claude API anfordern. Bei Fragen mit Bewertungsraster und Niveaustufen bewertet die KI jedes Kriterium einzeln — Sie sehen Punkte und Kurzkommentar pro Kriterium. Alle Werte können manuell überschrieben werden.
      </Text>

      <Untertitel>Review-Workflow</Untertitel>
      <Schritt nr={1}><strong>Autokorrektur</strong> — MC, R/F, Lückentext, Zuordnung, Berechnung und FiBu werden algorithmisch bewertet. Punkte erscheinen direkt. Diese Fragen werden automatisch als «Geprüft» markiert.</Schritt>
      <Schritt nr={2}><strong>KI-Vorschlag</strong> — Für Freitext, Zeichnen und PDF-Annotation können Sie pro Frage einen KI-Korrekturvorschlag (Claude API) anfordern.</Schritt>
      <Schritt nr={3}><strong>LP prüft</strong> — Punkte ändern, Kommentar schreiben oder Audio aufnehmen markiert die Frage automatisch als &laquo;Geprüft&raquo;. Wenn alle Fragen eines SuS geprüft sind, wechselt der Status auf &laquo;Review fertig&raquo;.</Schritt>
      <Schritt nr={4}><strong>Ergebnisse freigeben</strong> — Wenn alle SuS korrigiert sind, erscheint ein grünes Banner. Die Freigabe ist blockiert solange Bewertungen ohne Punkte existieren (Schutz vor versehentlich unvollständiger Korrektur). Export und Feedback zeigen eine Warnung bei fehlenden Punkten.</Schritt>

      <Untertitel>SuS-PDFs & Export</Untertitel>
      <Text>
        Pro SuS kann ein druckbares PDF erstellt werden (<FileText className="inline w-3.5 h-3.5 align-text-bottom text-slate-500" aria-label="PDF" />-Button pro SuS oder &laquo;Korrektur-PDFs&raquo; im Header). Die PDF-Ansicht enthält alle Fragen, Antworten, Punkte und Kommentare. Über den Browser-Druckdialog können Sie &laquo;Als PDF speichern&raquo; wählen.
      </Text>
      <Text>
        Der &laquo;Excel-Export (Detailliert)&raquo; erstellt eine CSV-Datei mit Antwort-Text und Punkten pro Frage/SuS — wie ein Google-Forms-Export.
      </Text>
      <Text>
        Der &laquo;Backup exportieren&raquo;-Button (blau) erstellt ein vollständiges Excel-Backup (.xlsx) mit einem Übersichts-Tab (Noten, Punkte pro Frage) und einem eigenen Tab pro SuS (Fragen, Antworten, Punkte, Kommentare). Verfügbar im &laquo;Ergebnisse&raquo;-Tab (nach Durchführung, ohne Bewertungen) und im &laquo;Korrektur&raquo;-Tab (mit Bewertungen). Ideal zur Archivierung.
      </Text>

      <Hinweis>
        Die KI-Punkte sind Vorschläge. Sie entscheiden — Ihre manuellen Punkte überschreiben die KI-Bewertung immer.
      </Hinweis>

      <Untertitel>Korrektur-Einsicht freigeben</Untertitel>
      <Text>
        Die Freigabe erfolgt zweistufig: <strong>Einsicht freigeben</strong> (SuS sehen ihre Korrektur online) und <strong>PDF freigeben</strong> (SuS können ihr Korrektur-PDF herunterladen). Beide können unabhängig voneinander aktiviert und jederzeit zurückgenommen werden.
      </Text>

      <Untertitel>Feedback-System</Untertitel>
      <Text>
        SuS und LP können direkt aus der Plattform Probleme oder Wünsche melden. Das Feedback wird in einem eigenen Tab im Google Sheet gesammelt.
      </Text>
      <Text>
        <strong>Für LP:</strong> Im Header finden Sie ein <AlertTriangle className="inline w-3.5 h-3.5 align-text-bottom text-yellow-500" aria-label="Warnung" />-Icon neben dem Theme-Toggle. In der Korrektur-Ansicht erscheint zusätzlich ein &laquo;Problem melden&raquo;-Link unter jeder Frage — damit können Sie fachliche Fehler oder technische Probleme direkt im Kontext der Frage melden.
      </Text>
      <Text>
        <strong>Für SuS:</strong> In der Korrektur-Einsicht (nach Freigabe) finden SuS ein <AlertTriangle className="inline w-3.5 h-3.5 align-text-bottom text-yellow-500" aria-label="Warnung" />-Icon im Header und einen &laquo;Problem melden&raquo;-Link unter jeder Frage — z.B. wenn eine Bewertung unklar ist.
      </Text>
    </div>
  )
}
