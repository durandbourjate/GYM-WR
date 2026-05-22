import { useState, useEffect } from 'react'
import { Lightbulb, Star, Flag, Circle, CircleCheck, Shuffle, RotateCw, Play } from 'lucide-react'
import { ResizableSidebar } from '@shared/ui/ResizableSidebar'
import { TYPO } from '../../styles/typografie'
import { SchwierigkeitIcon } from './dashboard/SchwierigkeitIcon'

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

  // Ticket 7 S137: topOffset aus Header-Höhe messen — Sidebar startet unter AppHeader,
  // Titel bleibt sichtbar (vorher z-10 vs AppHeader z-[60] → verdeckt).
  const [headerH, setHeaderH] = useState(0)
  useEffect(() => {
    const h = document.querySelector('header')?.getBoundingClientRect()?.height ?? 0
    setHeaderH(h)
  }, [])

  return (
    <ResizableSidebar
      mode="overlay"
      onClose={onSchliessen}
      title="Hilfe"
      topOffset={headerH}
      storageKey="sus-hilfe-breite"
      defaultWidth={480}
      minWidth={320}
    >
      <div className="flex flex-col h-full">
        {/* Kategorie-Tabs */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-1.5 shrink-0">
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
        <div className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300 space-y-4 overflow-y-auto flex-1">
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
    </ResizableSidebar>
  )
}

function Tipp({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs">
      <span className="font-semibold inline-flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5 text-yellow-500" /> Tipp:</span> {children}
    </div>
  )
}

function HilfeStart() {
  return <>
    <h3 className={`${TYPO.h2} text-slate-800 dark:text-slate-100`}>Willkommen bei ExamLab Üben</h3>
    <p>Hier kannst du Übungsfragen zu deinen Unterrichtsthemen bearbeiten und deinen Fortschritt verfolgen.</p>
    <ol className="list-decimal list-inside space-y-2">
      <li>Logge dich über Google ein (oder per Code).</li>
      <li>Wähle auf der Startseite <strong>"Üben"</strong>.</li>
      <li>Wähle deine Gruppe (z.B. SF WR 29c).</li>
      <li>Auf dem Dashboard siehst du Themen nach Fach.</li>
      <li>Klicke auf ein Thema und starte eine Übung.</li>
    </ol>
    <Tipp>Die Lehrperson kann bestimmte Themen hervorheben — diese erscheinen unter "Für dich empfohlen".</Tipp>
  </>
}

function HilfeUeben() {
  return <>
    <h3 className={`${TYPO.h2} text-slate-800 dark:text-slate-100`}>Übung starten</h3>
    <ol className="list-decimal list-inside space-y-2">
      <li>Klicke auf ein <strong>Thema</strong> im Dashboard.</li>
      <li>Filtere nach <strong>Unterthema</strong>, <strong>Schwierigkeit</strong> oder <strong>Fragetyp</strong>.</li>
      <li>Klicke <strong>"Übung starten"</strong>.</li>
    </ol>
    <p>Pro Übung bekommst du <strong>maximal 10 Fragen</strong>, sortiert nach dem, was du am meisten üben musst.</p>
    <h4 className={`${TYPO.body} font-semibold text-slate-800 dark:text-slate-100 mt-3`}>Filter</h4>
    <ul className="list-disc list-inside space-y-1">
      <li><strong>Unterthemen:</strong> Wähle gezielt einen Teilbereich aus.</li>
      <li><strong>Schwierigkeit:</strong> <SchwierigkeitIcon stufe={1} className="w-3.5 h-3.5 inline" /> Einfach, <SchwierigkeitIcon stufe={2} className="w-3.5 h-3.5 inline" /> Mittel, <SchwierigkeitIcon stufe={3} className="w-3.5 h-3.5 inline" /> Schwer.</li>
      <li><strong>Fragetyp:</strong> MC, Lückentext, Berechnung, Zuordnung, etc.</li>
    </ul>
    <Tipp>Klicke "Alle ⇄" um alle Filter einer Kategorie ein-/auszuschalten.</Tipp>
  </>
}

function HilfeWaehrend() {
  return <>
    <h3 className={`${TYPO.h2} text-slate-800 dark:text-slate-100`}>Während der Übung</h3>
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
    <h3 className={`${TYPO.h2} text-slate-800 dark:text-slate-100`}>Mastery-System</h3>
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
    <h4 className={`${TYPO.body} font-semibold text-slate-800 dark:text-slate-100 mt-3`}>Verblassen</h4>
    <p>Wenn du eine Frage <strong>über 30 Tage</strong> nicht übst, sinkt die Mastery-Stufe. Nach 90 Tagen fällt sie auf "Üben" zurück.</p>
    <Tipp>Regelmässig kurze Sessions sind besser als selten lange. Das System belohnt Konsistenz.</Tipp>
  </>
}

function HilfeMix() {
  return <>
    <h3 className={`${TYPO.h2} text-slate-800 dark:text-slate-100`}>Gemischte Übung & Repetition</h3>
    <h4 className={`${TYPO.body} font-semibold text-slate-800 dark:text-slate-100 mt-2 inline-flex items-center gap-1.5`}><Shuffle className="w-4 h-4" /> Gemischte Übung</h4>
    <p>Wähle <strong>mehrere Themen</strong> aus verschiedenen Fächern für eine gemischte Session — ideal zur Prüfungsvorbereitung.</p>
    <ol className="list-decimal list-inside space-y-1">
      <li>Klicke "Gemischte Übung" auf dem Dashboard.</li>
      <li>Wähle mindestens 2 Themen aus (auch fachübergreifend).</li>
      <li>Klicke "Übung starten" — du bekommst 10 Fragen, gleichmässig verteilt.</li>
    </ol>
    <h4 className={`${TYPO.body} font-semibold text-slate-800 dark:text-slate-100 mt-3 inline-flex items-center gap-1.5`}><RotateCw className="w-4 h-4" /> Repetition</h4>
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
    <h3 className={`${TYPO.h2} text-slate-800 dark:text-slate-100`}>Mein Fortschritt</h3>
    <p>Im Tab <strong>"Mein Fortschritt"</strong> siehst du:</p>
    <ul className="list-disc list-inside space-y-1">
      <li><strong>Level</strong> — steigt mit jedem Thema, das du meisterst.</li>
      <li><strong>Streak</strong> — Tage in Folge, an denen du geübt hast.</li>
      <li><strong>Gemeistert</strong> — Anzahl gemeisterter Themen.</li>
      <li><strong>Versuche</strong> — Gesamtanzahl beantworteter Fragen.</li>
    </ul>
    <h4 className={`${TYPO.body} font-semibold text-slate-800 dark:text-slate-100 mt-3`}>Sterne</h4>
    <p>Jedes Thema hat bis zu <strong>3 Sterne</strong>:</p>
    <ul className="list-disc list-inside space-y-1">
      <li><Star className="w-3.5 h-3.5 inline text-yellow-500" /> — mehr als 30% gefestigt.</li>
      <li><Star className="w-3.5 h-3.5 inline text-yellow-500" /><Star className="w-3.5 h-3.5 inline text-yellow-500" /> — mehr als 60% gefestigt.</li>
      <li><Star className="w-3.5 h-3.5 inline text-yellow-500" /><Star className="w-3.5 h-3.5 inline text-yellow-500" /><Star className="w-3.5 h-3.5 inline text-yellow-500" /> — mehr als 90% gemeistert.</li>
    </ul>
  </>
}

function HilfeLernziele() {
  return <>
    <h3 className={`${TYPO.h2} text-slate-800 dark:text-slate-100`}>Lernziele</h3>
    <p>Lernziele zeigen dir, was du am Ende eines Themas können solltest. Sie helfen dir, deinen Fortschritt einzuschätzen.</p>
    <h4 className={`${TYPO.body} font-semibold text-slate-800 dark:text-slate-100 mt-3`}>Wo finde ich Lernziele?</h4>
    <ul className="list-disc list-inside space-y-1">
      <li><strong className="inline-flex items-center gap-1"><Flag className="w-3.5 h-3.5" /> Button im Header</strong> — Öffnet alle Lernziele als Akkordeon (Fach → Thema → Unterthema).</li>
      <li><strong className="inline-flex items-center gap-1"><Flag className="w-3.5 h-3.5" /> auf Themen-Karten</strong> — Zeigt die Lernziele für dieses spezifische Thema in einem Mini-Modal.</li>
    </ul>
    <h4 className={`${TYPO.body} font-semibold text-slate-800 dark:text-slate-100 mt-3`}>Mastery-Status pro Lernziel</h4>
    <div className="space-y-1.5 mt-2">
      <div className="flex items-center gap-2"><Flag className="w-4 h-4 text-slate-400" /> <span>Offen — noch nicht bearbeitet.</span></div>
      <div className="flex items-center gap-2"><Circle className="w-4 h-4 fill-yellow-500 text-yellow-500" /> <span>In Arbeit — erste Fragen beantwortet.</span></div>
      <div className="flex items-center gap-2"><Circle className="w-4 h-4 fill-blue-500 text-blue-500" /> <span>Gefestigt — Fragen mehrmals richtig.</span></div>
      <div className="flex items-center gap-2"><CircleCheck className="w-4 h-4 text-green-500" /> <span>Gemeistert — Lernziel erreicht!</span></div>
    </div>
    <Tipp>Klicke auf den <Play className="w-3 h-3 inline" /> Fragen üben Button bei einem Lernziel um direkt zum entsprechenden Thema zu gelangen.</Tipp>
  </>
}

function HilfeErgebnisse() {
  return <>
    <h3 className={`${TYPO.h2} text-slate-800 dark:text-slate-100`}>Ergebnisse</h3>
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
    <h3 className={`${TYPO.h2} text-slate-800 dark:text-slate-100`}>Häufige Fragen</h3>
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
        <p className="font-medium dark:text-white inline-flex items-center gap-1">Was ist der <Flag className="w-3.5 h-3.5" /> Button?</p>
        <p className="text-slate-500 dark:text-slate-400">Er zeigt die Lernziele — im Header alle Lernziele als Akkordeon, auf den Themen-Karten die Lernziele des jeweiligen Themas.</p>
      </div>
      <div>
        <p className="font-medium dark:text-white">Wo finde ich meine früheren Ergebnisse?</p>
        <p className="text-slate-500 dark:text-slate-400">Im Tab "Ergebnisse" auf dem Dashboard. Klicke auf eine Session für die Detail-Ansicht mit Richtig/Falsch und Musterlösung.</p>
      </div>
    </div>
  </>
}
