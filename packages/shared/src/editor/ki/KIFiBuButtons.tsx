/**
 * KI-Buttons fuer Buchhaltungs-/FiBu-Fragetypen.
 */
import type { useKIAssistent } from '../useKIAssistent'
import { InlineAktionButton } from './KIBausteine'

// === Buchungssatz KI-Buttons ===

interface KIBuchungssatzButtonsProps {
  ki: ReturnType<typeof useKIAssistent>
  geschaeftsfall: string
}

export function KIBuchungssatzButtons({ ki, geschaeftsfall }: KIBuchungssatzButtonsProps) {
  if (!ki.verfuegbar) return null
  return (
    <div className="flex gap-1.5">
      <InlineAktionButton
        label="Konten vorschlagen"
        tooltip="KI schlaegt passende Konten fuer den Geschaeftsfall vor (KMU-Kontenrahmen)"
        hinweis={!geschaeftsfall.trim() ? 'Geschaeftsfall noetig' : undefined}
        disabled={!geschaeftsfall.trim() || ki.ladeAktion !== null}
        ladend={ki.ladeAktion === 'generiereKontenauswahl'}
        onClick={() => ki.ausfuehren('generiereKontenauswahl', { geschaeftsfall })}
      />
      <InlineAktionButton
        label="Loesung generieren"
        tooltip="KI erstellt die korrekten Buchungssaetze fuer den Geschaeftsfall"
        hinweis={!geschaeftsfall.trim() ? 'Geschaeftsfall noetig' : undefined}
        disabled={!geschaeftsfall.trim() || ki.ladeAktion !== null}
        ladend={ki.ladeAktion === 'generiereBuchungssaetze'}
        onClick={() => ki.ausfuehren('generiereBuchungssaetze', { geschaeftsfall })}
      />
    </div>
  )
}

// === T-Konto KI-Buttons ===

interface KITKontoButtonsProps {
  ki: ReturnType<typeof useKIAssistent>
  aufgabentext: string
}

export function KITKontoButtons({ ki, aufgabentext }: KITKontoButtonsProps) {
  if (!ki.verfuegbar) return null
  return (
    <div className="flex gap-1.5">
      <InlineAktionButton
        label="T-Konten generieren"
        tooltip="KI erstellt T-Konten-Loesung basierend auf dem Aufgabentext"
        hinweis={!aufgabentext.trim() ? 'Aufgabentext noetig' : undefined}
        disabled={!aufgabentext.trim() || ki.ladeAktion !== null}
        ladend={ki.ladeAktion === 'generiereTKonten'}
        onClick={() => ki.ausfuehren('generiereTKonten', { aufgabentext })}
      />
    </div>
  )
}

// === Kontenbestimmung KI-Buttons ===

interface KIKontenbestimmungButtonsProps {
  ki: ReturnType<typeof useKIAssistent>
  aufgabentext: string
}

export function KIKontenbestimmungButtons({ ki, aufgabentext }: KIKontenbestimmungButtonsProps) {
  if (!ki.verfuegbar) return null
  return (
    <div className="flex gap-1.5">
      <InlineAktionButton
        label="Aufgaben generieren"
        tooltip="KI erstellt Geschaeftsfaelle fuer die Kontenbestimmung"
        hinweis={!aufgabentext.trim() ? 'Aufgabentext noetig' : undefined}
        disabled={!aufgabentext.trim() || ki.ladeAktion !== null}
        ladend={ki.ladeAktion === 'generiereKontenaufgaben'}
        onClick={() => ki.ausfuehren('generiereKontenaufgaben', { aufgabentext })}
      />
    </div>
  )
}

// === Bilanz/ER KI-Buttons ===

interface KIBilanzERButtonsProps {
  ki: ReturnType<typeof useKIAssistent>
  aufgabentext: string
  modus: string
}

export function KIBilanzERButtons({ ki, aufgabentext, modus }: KIBilanzERButtonsProps) {
  if (!ki.verfuegbar) return null
  return (
    <div className="flex gap-1.5">
      <InlineAktionButton
        label="Struktur generieren"
        tooltip={`KI erstellt eine ${modus === 'erfolgsrechnung' ? 'Erfolgsrechnung' : 'Bilanz'}-Loesung`}
        hinweis={!aufgabentext.trim() ? 'Aufgabentext noetig' : undefined}
        disabled={!aufgabentext.trim() || ki.ladeAktion !== null}
        ladend={ki.ladeAktion === 'generiereBilanzStruktur'}
        onClick={() => ki.ausfuehren('generiereBilanzStruktur', { aufgabentext, modus })}
      />
    </div>
  )
}
