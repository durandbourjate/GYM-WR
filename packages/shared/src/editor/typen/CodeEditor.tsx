/**
 * LP-Editor für Code-Fragetyp.
 * Sprache auswählen, optionaler Starter-Code, optionale Musterlösung.
 */

interface CodeEditorProps {
  sprache: string
  setSprache: (v: string) => void
  starterCode: string
  setStarterCode: (v: string) => void
  musterLoesungCode: string
  setMusterLoesungCode: (v: string) => void
}

const SPRACHEN = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'java', label: 'Java' },
]

export default function CodeEditor({
  sprache, setSprache,
  starterCode, setStarterCode,
  musterLoesungCode, setMusterLoesungCode,
}: CodeEditorProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Sprache */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Programmiersprache
        </label>
        <select
          value={sprache}
          onChange={(e) => setSprache(e.target.value)}
          className="input-field"
        >
          {SPRACHEN.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Starter-Code */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Starter-Code <span className="text-slate-400 font-normal">(optional — wird SuS vorgegeben)</span>
        </label>
        <textarea
          value={starterCode}
          onChange={(e) => setStarterCode(e.target.value)}
          rows={5}
          placeholder="# Vorgabe-Code für SuS..."
          className="input-field font-mono text-sm resize-y"
        />
      </div>

      {/* Musterlösung */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Musterlösung (Code) <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={musterLoesungCode}
          onChange={(e) => setMusterLoesungCode(e.target.value)}
          rows={5}
          placeholder="# Erwartete Lösung..."
          className="input-field font-mono text-sm resize-y"
        />
      </div>
    </div>
  )
}
