import { FileText, Monitor } from 'lucide-react'

export function PDFHinweis() {
  return (
    <p className="text-sm italic text-slate-500 print:text-slate-600 inline-flex items-center gap-1.5">
      <FileText className="w-4 h-4" aria-hidden="true" /> Diese Aufgabe ist nur digital verfügbar (PDF-Annotation).
    </p>
  )
}

export function DigitalHinweis({ typ }: { typ: string }) {
  return (
    <p className="text-sm italic text-slate-500 print:text-slate-600 inline-flex items-center gap-1.5">
      <Monitor className="w-4 h-4" aria-hidden="true" /> {typ} — nur digital verfügbar.
    </p>
  )
}

export function ZeichenDruck() {
  return (
    <div className="border-2 border-slate-300 print:border-slate-400 rounded-lg h-48">
      <p className="text-xs text-slate-400 print:text-slate-500 p-2">Zeichne hier:</p>
    </div>
  )
}

export function CodeDruck() {
  return (
    <div className="border border-slate-300 print:border-slate-400 rounded bg-slate-50 print:bg-white p-3">
      <p className="text-xs font-medium text-slate-600 print:text-black mb-2">Code:</p>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="druck-linie" />
      ))}
    </div>
  )
}

export function FormelDruck() {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="font-medium text-slate-700 print:text-black">Formel:</span>
      <span className="flex-1 border-b border-dotted border-slate-400 print:border-black h-8">&nbsp;</span>
    </div>
  )
}
