import { Abschnitt, Feld } from './EditorBausteine.tsx'

interface FreitextEditorProps {
  laenge: 'kurz' | 'mittel' | 'lang'
  setLaenge: (v: 'kurz' | 'mittel' | 'lang') => void
  placeholder: string
  setPlaceholder: (v: string) => void
}

export default function FreitextEditor({ laenge, setLaenge, placeholder, setPlaceholder }: FreitextEditorProps) {
  return (
    <Abschnitt titel="Freitext-Optionen">
      <div className="grid grid-cols-2 gap-3">
        <Feld label="Erwartete Länge">
          <select value={laenge} onChange={(e) => setLaenge(e.target.value as 'kurz' | 'mittel' | 'lang')} className="input-field">
            <option value="kurz">Kurz (1-3 Sätze)</option>
            <option value="mittel">Mittel (1 Absatz)</option>
            <option value="lang">Lang (mehrere Absätze)</option>
          </select>
        </Feld>
        <Feld label="Hilfstext (Placeholder)">
          <input type="text" value={placeholder} onChange={(e) => setPlaceholder(e.target.value)}
            placeholder="Hinweis für SuS..." className="input-field" />
        </Feld>
      </div>
    </Abschnitt>
  )
}
