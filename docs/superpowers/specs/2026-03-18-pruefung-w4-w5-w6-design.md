# Design: W4 Schülercode-Validierung, W5 Focus-Trap, W6 FragenEditor Split

> Prüfungsplattform — Code-Review-Rückstand (3 Tasks)
> Datum: 2026-03-18

---

## W6: FragenEditor Split (Refactoring)

### Ziel

`FragenEditor.tsx` (949 Zeilen) in separate Dateien aufteilen. Keine funktionalen Änderungen.

### Neue Verzeichnisstruktur

```
components/lp/frageneditor/
├── FragenEditor.tsx         — Hauptkomponente (State, Validierung, Speichern, Shell)
├── MCEditor.tsx             — MC-Optionen Editor
├── FreitextEditor.tsx       — Freitext-Optionen (Länge, Placeholder)
├── LueckentextEditor.tsx    — Lückentext mit Auto-Parse
├── ZuordnungEditor.tsx      — Zuordnungspaare
├── RichtigFalschEditor.tsx  — Richtig/Falsch Aussagen
├── BerechnungEditor.tsx     — Berechnungs-Parameter
├── EditorBausteine.tsx      — Abschnitt, Feld Komponenten (shared UI)
└── editorUtils.ts           — FrageTyp, generiereFrageId(), parseLuecken()
```

### Änderungen an bestehenden Dateien

- `FragenBrowser.tsx`: Import-Pfad `'./FragenEditor.tsx'` → `'./frageneditor/FragenEditor.tsx'`
- `components/lp/FragenEditor.tsx`: Datei wird gelöscht (ersetzt durch Verzeichnis)

### Import-Pfad-Anpassungen (neuer Pfad relativ zu `frageneditor/`)

| Alter Import | Neuer Import |
|--------------|-------------|
| `../../types/fragen.ts` | `../../../types/fragen.ts` |
| `../../utils/fachbereich.ts` | `../../../utils/fachbereich.ts` |

### Typ-Alias `FrageTyp`

Der lokale Typ `type FrageTyp = 'mc' | 'freitext' | ...` (Zeile 10) wird nach `editorUtils.ts` verschoben und von dort exportiert.

### Regeln

- Reine Verschiebung — kein Refactoring der Logik
- `Abschnitt` und `Feld` werden aus `EditorBausteine.tsx` exportiert und in allen Sub-Editoren importiert
- Jeder Sub-Editor bekommt ein eigenes Props-Interface (statt inline-Typen)

---

## W5: Focus-Trap für Modals

### Ziel

Keyboard-Fokus bleibt innerhalb offener Modals/Dialoge. Kein Tab-Escape möglich.

### Implementierung

Neuer Hook `src/hooks/useFocusTrap.ts` (~40 Zeilen). Verzeichnis `src/hooks/` existiert bereits.

```typescript
function useFocusTrap(containerRef: RefObject<HTMLElement | null>): void
```

**Verhalten:**
1. Beim Mount: Erstes fokussierbares Element im Container fokussieren
2. `Tab` / `Shift+Tab`: Fokus zyklisch innerhalb des Containers halten
3. `Escape`: Nicht abgefangen (wird von den Modals selbst gehandelt)
4. Beim Unmount: Vorherigen Fokus wiederherstellen (`document.activeElement` beim Mount merken)

**Fokussierbare Elemente** (Selektor):
```
a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])
```

**Dynamischer Inhalt:** Fokussierbare Elemente werden bei jedem Tab-Keydown neu abgefragt (nicht beim Mount gecacht). So funktioniert der Hook auch wenn sich der Modal-Inhalt ändert (z.B. AbgabeDialog wechselt zwischen `bereit` → `senden` → `erfolg`/`fehler`). Falls keine fokussierbaren Elemente vorhanden sind (z.B. Spinner-State), wird Tab ignoriert.

### Einsatzorte

| Komponente | Modal-Typ | Änderung |
|------------|-----------|----------|
| `AbgabeDialog.tsx` | Zentrierter Dialog (4 States) | `ref` auf äusseren Container + `useFocusTrap(ref)` |
| `PruefungsComposer.tsx` | Lösch-Bestätigungsdialog | `ref` auf Dialog-Container + `useFocusTrap(ref)` |
| `FragenBrowser.tsx` | Slide-over Panel | `ref` auf Panel-Container + `useFocusTrap(ref)` |
| `frageneditor/FragenEditor.tsx` | Slide-over Panel | `ref` auf Panel-Container + `useFocusTrap(ref)` |

Pro Datei: ~3 Zeilen Änderung (Import, useRef, Hook-Call).

---

## W4: Schülercode-Validierung (Backend)

### Ziel

Schülercode-Login gegen Klassenliste im Backend validieren. Aktuell wird der Code nur client-seitig auf Format geprüft (4 Ziffern).

### Backend (Apps Script)

Neuer Case in `doPost`:

```javascript
case 'validiereSchuelercode':
  return validiereSchuelercode(body);
```

Neue Funktion `validiereSchuelercode(body)`:

- Input: `{ email, schuelerCode }`
- Sucht in allen Tabs des Klassenlisten-Sheets nach `email`
- Vergleicht `schuelerCode` mit der Spalte `schuelerCode` der gefundenen Zeile
- Gibt zurück:
  - Erfolg: `{ success: true, name: row.name, vorname: row.vorname, klasse: row.klasse }`
  - E-Mail nicht gefunden: `{ error: 'E-Mail nicht in der Klassenliste' }`
  - Code falsch: `{ error: 'Schülercode ungültig' }`

**Hinweis:** POST statt GET, da Credentials mitgeschickt werden (konsistent mit `speichereAntworten` etc.).

### Frontend

**`apiService.ts`** — Neuer API-Call (POST mit `text/plain` wie alle bestehenden POST-Endpoints):

```typescript
async validiereSchuelercode(email: string, code: string): Promise<{
  success: boolean
  name?: string
  vorname?: string
  klasse?: string
  error?: string
} | null>  // null bei Netzwerkfehler
```

**`LoginScreen.tsx`** — `handleCodeLogin` anpassen:

```
1. E-Mail normalisieren (wie bisher)
2. Format-Check (wie bisher)
3. NEU: Falls Backend konfiguriert → apiService.validiereSchuelercode(email, code)
   - null (Netzwerkfehler) → setFehler('Verbindungsfehler. Bitte erneut versuchen.') + return
   - error → setFehler(error) + return
   - Erfolg → Name aus Backend verwenden: `${response.vorname} ${response.name}`
4. anmeldenMitCode(code, vollerName, email)
```

- Im Demo-Modus / ohne Backend: Kein API-Call, Name aus Formularfeld (wie bisher)
- Loading-State während Validierung (Button disabled + "Anmelden...")
- Name-Feld im Formular bleibt sichtbar (wird bei Backend-Validierung durch Backend-Antwort überschrieben, dient als Fallback ohne Backend)

### Sicherheitshinweis

Dies ist eine einfache Code-Validierung, kein vollwertiges Auth-System. Der Schülercode ist ein shared secret zwischen LP und SuS. In Kombination mit SEB ist das ausreichend für den Schulkontext. Kein Rate-Limiting nötig — SEB verhindert automatisierte Requests, und die Codes werden nur während der Prüfung verwendet.

---

## Implementierungsreihenfolge

1. **W6: FragenEditor Split** — Refactoring, keine funktionale Änderung
2. **W5: Focus-Trap** — Neuer Hook + Integration in 4 Modals
3. **W4: Schülercode-Validierung** — Backend + Frontend

## Dateien (Zusammenfassung)

### Neue Dateien
- `src/hooks/useFocusTrap.ts`
- `src/components/lp/frageneditor/FragenEditor.tsx`
- `src/components/lp/frageneditor/MCEditor.tsx`
- `src/components/lp/frageneditor/FreitextEditor.tsx`
- `src/components/lp/frageneditor/LueckentextEditor.tsx`
- `src/components/lp/frageneditor/ZuordnungEditor.tsx`
- `src/components/lp/frageneditor/RichtigFalschEditor.tsx`
- `src/components/lp/frageneditor/BerechnungEditor.tsx`
- `src/components/lp/frageneditor/EditorBausteine.tsx`
- `src/components/lp/frageneditor/editorUtils.ts`

### Geänderte Dateien
- `src/components/lp/FragenBrowser.tsx` (Import-Pfad)
- `src/components/AbgabeDialog.tsx` (Focus-Trap)
- `src/components/lp/PruefungsComposer.tsx` (Focus-Trap)
- `src/services/apiService.ts` (neuer Endpoint)
- `src/components/LoginScreen.tsx` (Backend-Validierung)
- `Google_Workspace_Setup.md` (neuer Endpoint dokumentieren)

### Gelöschte Dateien
- `src/components/lp/FragenEditor.tsx` (ersetzt durch Verzeichnis)
