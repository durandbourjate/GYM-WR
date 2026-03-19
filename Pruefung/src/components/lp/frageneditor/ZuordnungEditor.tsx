import { Abschnitt } from './EditorBausteine.tsx'

interface ZuordnungEditorProps {
  paare: { links: string; rechts: string }[]
  setPaare: (p: { links: string; rechts: string }[]) => void
}

export default function ZuordnungEditor({ paare, setPaare }: ZuordnungEditorProps) {
  function updatePaar(index: number, seite: 'links' | 'rechts', wert: string): void {
    const neu = [...paare]
    neu[index] = { ...neu[index], [seite]: wert }
    setPaare(neu)
  }

  return (
    <Abschnitt titel="Zuordnungspaare">
      <div className="space-y-2">
        <div className="flex gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="flex-1">Begriff (links)</span>
          <span className="flex-1">Zuordnung (rechts)</span>
          <span className="w-6" />
        </div>
        {paare.map((paar, i) => (
          <div key={i} className="flex gap-2 items-start">
            <input
              type="text"
              value={paar.links}
              onChange={(e) => updatePaar(i, 'links', e.target.value)}
              placeholder={`Begriff ${i + 1}`}
              className="input-field flex-1"
            />
            <span className="mt-2 text-slate-400">{'\u2192'}</span>
            <input
              type="text"
              value={paar.rechts}
              onChange={(e) => updatePaar(i, 'rechts', e.target.value)}
              placeholder={`Zuordnung ${i + 1}`}
              className="input-field flex-1"
            />
            {paare.length > 2 && (
              <button
                onClick={() => setPaare(paare.filter((_, j) => j !== i))}
                className="mt-1.5 w-6 h-6 text-red-400 hover:text-red-600 dark:hover:text-red-300 cursor-pointer text-sm shrink-0"
              >×</button>
            )}
          </div>
        ))}
      </div>

      {paare.length < 10 && (
        <button
          onClick={() => setPaare([...paare, { links: '', rechts: '' }])}
          className="mt-2 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
        >
          + Paar hinzufügen
        </button>
      )}
    </Abschnitt>
  )
}
