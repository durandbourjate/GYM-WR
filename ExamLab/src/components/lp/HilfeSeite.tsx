import { useState, useRef, useEffect, type ComponentType } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap.ts'
import { ResizableSidebar } from '@shared/ui/ResizableSidebar'
import { tabsFuerSurface } from '../../utils/tabRegistry'
import HilfeEinstieg from './hilfe/HilfeEinstieg'
import HilfeUeben from './hilfe/HilfeUeben'
import HilfePruefung from './hilfe/HilfePruefung'
import HilfeFragen from './hilfe/HilfeFragen'
import HilfeZusammenarbeit from './hilfe/HilfeZusammenarbeit'
import HilfeKI from './hilfe/HilfeKI'
import HilfeDurchfuehrung from './hilfe/HilfeDurchfuehrung'
import HilfeKorrektur from './hilfe/HilfeKorrektur'
import HilfeBloom from './hilfe/HilfeBloom'
import HilfeFAQ from './hilfe/HilfeFAQ'

interface Props {
  onSchliessen: () => void
}

const KOMPONENTEN: Record<string, ComponentType> = {
  einstieg: HilfeEinstieg,
  fragen: HilfeFragen,
  pruefung: HilfePruefung,
  durchfuehrung: HilfeDurchfuehrung,
  korrektur: HilfeKorrektur,
  ueben: HilfeUeben,
  ki: HilfeKI,
  bloom: HilfeBloom,
  zusammenarbeit: HilfeZusammenarbeit,
  faq: HilfeFAQ,
}

/** Hilfe-/Anleitungsseite für Lehrpersonen */
export default function HilfeSeite({ onSchliessen }: Props) {
  const tabs = tabsFuerSurface('hilfe', { istAdmin: false })
  const [kategorie, setKategorie] = useState<string>('einstieg')
  const AktiveKomponente = KOMPONENTEN[kategorie]
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef)

  // Header-Höhe messen, damit Overlay unterhalb des Headers beginnt
  const [headerH, setHeaderH] = useState(0)
  useEffect(() => {
    const h = document.querySelector('header')?.getBoundingClientRect()?.height ?? 0
    setHeaderH(h)
  }, [])

  return (
    <ResizableSidebar
      mode="overlay"
      onClose={onSchliessen}
      topOffset={headerH}
      storageKey="hilfe-breite"
    >
      <div ref={panelRef} className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Hilfe & Anleitung
          </h2>
          <button
            onClick={onSchliessen}
            className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            Schliessen
          </button>
        </div>

        {/* Navigation */}
        <div
          data-testid="hilfe-nav"
          className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex gap-1 overflow-x-auto shrink-0"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setKategorie(t.id)}
              aria-pressed={kategorie === t.id}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer
                ${kategorie === t.id
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }
              `}
            >
              {t.titel}
            </button>
          ))}
        </div>

        {/*
          Inhalt — defensive Fallback: falls Registry-ID nicht in KOMPONENTEN
          existiert (z.B. neuer Tab im Registry ohne Map-Eintrag), rendert
          die Seite nichts statt zu crashen. tabRegistry.test.ts hat einen
          Drift-Schutz-Test, der diesen Fall früh fängt.
        */}
        <div className="flex-1 overflow-auto px-6 py-5">
          {AktiveKomponente ? <AktiveKomponente /> : null}
        </div>
      </div>
    </ResizableSidebar>
  )
}
