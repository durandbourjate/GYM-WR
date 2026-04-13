import { useState } from 'react'

interface Props {
  onSchliessen: () => void
}

const KATEGORIEN = [
  { id: 'start', label: 'Erste Schritte' },
  { id: 'ueben', label: 'Übung starten' },
  { id: 'waehrend', label: 'Während der Übung' },
  { id: 'lernziele', label: 'Lernziele' },
  { id: 'mastery', label: 'Mastery-System' },
  { id: 'mix', label: 'Mix & Repetition' },
  { id: 'fortschritt', label: 'Mein Fortschritt' },
  { id: 'ergebnisse', label: 'Ergebnisse' },
  { id: 'faq', label: 'Häufige Fragen' },
] as const

type KategorieId = typeof KATEGORIEN[number]['id']

export default function SuSHilfePanel({ onSchliessen }: Props) {
  const [aktiv, setAktiv] = useState<KategorieId>('start')

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={onSchliessen}>
      <div
        className="bg-white dark:bg-slate-800 w-full max-w-md h-full overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold dark:text-white">Hilfe</h2>
          <button
            onClick={onSchliessen}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Kategorie-Tabs */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-1.5">
          {KATEGORIEN.map(k => (
            <button
              key={k.id}
              onClick={() => setAktiv(k.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                aktiv === k.id
                  ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-800 dark:border-slate-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-750'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>

        {/* Inhalt */}
        <div className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300 space-y-4">
          {aktiv === 'start' && <HilfeStart />}
          {aktiv === 'ueben' && <HilfeUeben />}
          {aktiv === 'waehrend' && <HilfeWaehrend />}
          {aktiv === 'lernziele' && <HilfeLernziele />}
          {aktiv === 'mastery' && <HilfeMastery />}
          {aktiv === 'mix' && <HilfeMix />}
          {aktiv === 'fortschritt' && <HilfeFortschritt />}
          {aktiv === 'ergebnisse' && <HilfeErgebnisse />}
          {aktiv === 'faq' && <HilfeFAQ />}
        </div>
      </div>
    </div>
  )
}

function Tipp({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs">
      <span className="font-semibold">💡 Tipp:</span> {children}
    </div>
  )
}

function HilfeStart() {
  return <>
    <h3 className="font-semibold dark:text-white text-base">Willkommen bei ExamLab Üben</h3>
    <p>Hier kannst du Übungsfragen zu deinen Unterrichtsthemen bearbeiten und deinen Fortschritt verfolgen.</p>
    <ol className="list-decimal list-inside space-y-2">
      <li>Logge dich über Google ein (oder per Code).</li>
      <li>Wähle auf der Startseite <strong>"Üben"</strong>.</li>
      <li>Wähle deine Gruppe (z.B. SF WR 29c).</li>
      <li>Auf dem Dashboard siehst du Themen nach Fachbereich.</li>
      <li>Klicke auf ein Thema und starte eine Übung.</li>
    </ol>
    <Tipp>Die Lehrperson kann bestimmte Themen hervorheben — diese erscheinen unter "Für dich empfohlen".</Tipp>
  </>
}

function HilfeUeben() {
  return <>
    <h3 className="font-semibold dark:text-white text-base">Übung starten</h3>
    <ol className="list-decimal list-inside space-y-2">
      <li>Klicke auf ein <strong>Thema</strong> im Dashboard.</li>
      <li>Filtere nach <strong>Unterthema</strong>, <strong>Schwierigkeit</strong> oder <strong>Fragetyp</strong>.</li>
      <li>Klicke <strong>"Übung starten"</strong>.</li>
    </ol>
    <p>Pro Übung bekommst du <strong>maximal 10 Fragen</strong>, sortiert nach dem, was du am meisten üben musst.</p>
    <h4 className="font-medium dark:text-white mt-3">Filter</h4>
    <ul className="list-disc list-inside space-y-1">
      <li><strong>Unterthemen:</strong> Wähle gezielt einen Teilbereich aus.</li>
      <li><strong>Schwierigkeit:</strong> ⭐ Einfach, ⭐⭐ Mittel, ⭐⭐⭐ Schwer.</li>
      <li><strong>Fragetyp:</strong> MC, Lückentext, Berechnung, Zuordnung, etc.</li>
    </ul>
    <Tipp>Klicke "Alle ⇄" um alle Filter einer Kategorie ein-/auszuschalten.</Tipp>
  </>
}

function HilfeWaehrend() {
  return <>
    <h3 className="font-semibold dark:text-white text-base">Während der Übung</h3>
    <ul className="list-disc list-inside space-y-2">
      <li><strong>Beantworten:</strong> Wähle deine Antwort und erhalte sofort Feedback.</li>
      <li><strong>Weiter/Zurück:</strong> Navigiere mit den Buttons oder den <strong>Pfeiltasten</strong>.</li>
      <li><strong>Überspringen:</strong> Keine Antwort? Du kannst die Frage überspringen.</li>
      <li><strong>Unsicher markieren:</strong> Markiere Fragen, bei denen du unsicher bist — sie erscheinen in der Auswertung.</li>
      <li><strong>Beenden:</strong> Klicke "Beenden" um die Zusammenfassung zu sehen.</li>
    </ul>
    <Tipp>Übersprungene Fragen werden weder als richtig noch als falsch gewertet.</Tipp>
  </>
}

function HilfeMastery() {
  return <>
    <h3 className="font-semibold dark:text-white text-base">Mastery-System</h3>
    <p>Jede Frage hat eine <strong>Mastery-Stufe</strong>, die sich durch deine Antworten verändert:</p>
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 rounded bg-slate-300 inline-block shrink-0" />
        <span><strong>Neu</strong> — noch nie bearbeitet.</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 rounded bg-yellow-400 inline-block shrink-0" />
        <span><strong>Üben</strong> — zuletzt falsch beantwortet, braucht Wiederholung.</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 rounded bg-blue-400 inline-block shrink-0" />
        <span><strong>Gefestigt</strong> — mehrmals richtig in Folge.</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 rounded bg-green-500 inline-block shrink-0" />
        <span><strong>Gemeistert</strong> — oft richtig, über mehrere Sessions.</span>
      </div>
    </div>
    <h4 className="font-medium dark:text-white mt-3">Verblassen</h4>
    <p>Wenn du eine Frage <strong>über 30 Tage</strong> nicht übst, sinkt die Mastery-Stufe. Nach 90 Tagen fällt sie auf "Üben" zurück.</p>
    <Tipp>Regelmässig kurze Sessions sind besser als selten lange. Das System belohnt Konsistenz.</Tipp>
  </>
}

function HilfeMix() {
  return <>
    <h3 className="font-semibold dark:text-white text-base">Gemischte Übung & Repetition</h3>
    <h4 className="font-medium dark:text-white mt-2">🔀 Gemischte Übung</h4>
    <p>Wähle <strong>mehrere Themen</strong> aus verschiedenen Fächern für eine gemischte Session — ideal zur Prüfungsvorbereitung.</p>
    <ol className="list-decimal list-inside space-y-1">
      <li>Klicke "Gemischte Übung" auf dem Dashboard.</li>
      <li>Wähle mindestens 2 Themen aus (auch fachübergreifend).</li>
      <li>Klicke "Übung starten" — du bekommst 10 Fragen, gleichmässig verteilt.</li>
    </ol>
    <h4 className="font-medium dark:text-white mt-3">🔄 Repetition</h4>
    <p>Trainiert automatisch deine <strong>Schwächen über alle Themen</strong>. Perfekt wenn du nicht weisst, wo du anfangen sollst.</p>
    <ul className="list-disc list-inside space-y-1">
      <li>Dauerbaustellen (oft falsch) werden bevorzugt.</li>
      <li>Fragen im Status "Üben" kommen als nächstes.</li>
      <li>Bereits gemeisterte und neue Fragen werden übersprungen.</li>
    </ul>
    <Tipp>Nutze Repetition regelmässig — so bleiben auch ältere Themen frisch.</Tipp>
  </>
}

function HilfeFortschritt() {
  return <>
    <h3 className="font-semibold dark:text-white text-base">Mein Fortschritt</h3>
    <p>Im Tab <strong>"Mein Fortschritt"</strong> siehst du:</p>
    <ul className="list-disc list-inside space-y-1">
      <li><strong>Level</strong> — steigt mit jedem Thema, das du meisterst.</li>
      <li><strong>Streak</strong> — Tage in Folge, an denen du geübt hast.</li>
      <li><strong>Gemeistert</strong> — Anzahl gemeisterter Themen.</li>
      <li><strong>Versuche</strong> — Gesamtanzahl beantworteter Fragen.</li>
    </ul>
    <h4 className="font-medium dark:text-white mt-3">Sterne</h4>
    <p>Jedes Thema hat bis zu <strong>3 Sterne</strong>:</p>
    <ul className="list-disc list-inside space-y-1">
      <li>⭐ — mehr als 30% gefestigt.</li>
      <li>⭐⭐ — mehr als 60% gefestigt.</li>
      <li>⭐⭐⭐ — mehr als 90% gemeistert.</li>
    </ul>
  </>
}

function HilfeLernziele() {
  return <>
    <h3 className="font-semibold dark:text-white text-base">Lernziele</h3>
    <p>Lernziele zeigen dir, was du am Ende eines Themas können solltest. Sie helfen dir, deinen Fortschritt einzuschätzen.</p>
    <h4 className="font-medium dark:text-white mt-3">Wo finde ich Lernziele?</h4>
    <ul className="list-disc list-inside space-y-1">
      <li><strong>🏁 Button im Header</strong> — Öffnet alle Lernziele als Akkordeon (Fach → Thema → Unterthema).</li>
      <li><strong>🏁 auf Themen-Karten</strong> — Zeigt die Lernziele für dieses spezifische Thema in einem Mini-Modal.</li>
    </ul>
    <h4 className="font-medium dark:text-white mt-3">Mastery-Status pro Lernziel</h4>
    <div className="space-y-1.5 mt-2">
      <div className="flex items-center gap-2"><span>🏁</span> <span>Offen — noch nicht bearbeitet.</span></div>
      <div className="flex items-center gap-2"><span>🟡</span> <span>In Arbeit — erste Fragen beantwortet.</span></div>
      <div className="flex items-center gap-2"><span>🔵</span> <span>Gefestigt — Fragen mehrmals richtig.</span></div>
      <div className="flex items-center gap-2"><span>✅</span> <span>Gemeistert — Lernziel erreicht!</span></div>
    </div>
    <Tipp>Klicke auf "▶ Fragen üben" bei einem Lernziel um direkt zum entsprechenden Thema zu gelangen.</Tipp>
  </>
}

function HilfeErgebnisse() {
  return <>
    <h3 className="font-semibold dark:text-white text-base">Ergebnisse</h3>
    <p>Im Tab <strong>"Ergebnisse"</strong> siehst du alle deine abgeschlossenen Übungs-Sessions.</p>
    <ul className="list-disc list-inside space-y-1">
      <li>Pro Session: Fach, Thema, Datum, Richtig/Falsch-Quote.</li>
      <li>Klicke auf eine Session für die <strong>Detail-Ansicht</strong>: Jede Frage mit Richtig/Falsch-Markierung und Musterlösung.</li>
    </ul>
    <Tipp>Die Ergebnisse werden lokal auf deinem Gerät gespeichert (bis 50 Sessions).</Tipp>
  </>
}

function HilfeFAQ() {
  return <>
    <h3 className="font-semibold dark:text-white text-base">Häufige Fragen</h3>
    <div className="space-y-3">
      <div>
        <p className="font-medium dark:text-white">Warum sehe ich ein Thema nicht?</p>
        <p className="text-slate-500 dark:text-slate-400">Deine Lehrperson gibt Themen schrittweise frei. Klicke "Alle Themen anzeigen" um alle zu sehen.</p>
      </div>
      <div>
        <p className="font-medium dark:text-white">Was bedeutet "verblasst"?</p>
        <p className="text-slate-500 dark:text-slate-400">Wenn du eine Frage länger als 30 Tage nicht übst, sinkt die Mastery-Stufe. Übe sie erneut um sie zu festigen.</p>
      </div>
      <div>
        <p className="font-medium dark:text-white">Kann ich Fragen wiederholen?</p>
        <p className="text-slate-500 dark:text-slate-400">Ja! Starte einfach eine neue Übung zum gleichen Thema. Du bekommst die Fragen, die du am meisten brauchst.</p>
      </div>
      <div>
        <p className="font-medium dark:text-white">Was ist eine Dauerbaustelle?</p>
        <p className="text-slate-500 dark:text-slate-400">Fragen, die du oft falsch beantwortest (mehr als die Hälfte bei 10+ Versuchen). Sie werden regelmässig eingestreut.</p>
      </div>
      <div>
        <p className="font-medium dark:text-white">Wie funktioniert der Repetitions-Modus?</p>
        <p className="text-slate-500 dark:text-slate-400">Er sammelt deine schwächsten Fragen über alle Themen und erstellt eine gezielte Übung. Ideal für Prüfungsvorbereitung.</p>
      </div>
      <div>
        <p className="font-medium dark:text-white">Was ist der 🏁 Button?</p>
        <p className="text-slate-500 dark:text-slate-400">Er zeigt die Lernziele — im Header alle Lernziele als Akkordeon, auf den Themen-Karten die Lernziele des jeweiligen Themas.</p>
      </div>
      <div>
        <p className="font-medium dark:text-white">Wo finde ich meine früheren Ergebnisse?</p>
        <p className="text-slate-500 dark:text-slate-400">Im Tab "Ergebnisse" auf dem Dashboard. Klicke auf eine Session für die Detail-Ansicht mit Richtig/Falsch und Musterlösung.</p>
      </div>
    </div>
  </>
}
