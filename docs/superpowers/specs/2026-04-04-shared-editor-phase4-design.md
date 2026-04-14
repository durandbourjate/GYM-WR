# Shared Editor Phase 4: EditorProvider in Pruefung verdrahten

**Datum:** 2026-04-04
**Branch:** `feature/shared-editor-phase1` (bestehend)
**Vorgänger:** Phase 1–3 (EditorContext, Typ-Editoren, Sections — alles in `packages/shared/`)

## Ziel

Die shared-Komponenten (Sections, BildUpload, FrageTypAuswahl, useKIAssistent) rufen bereits `useEditorConfig()` und `useEditorServices()` auf — aber ohne Provider funktionieren diese Hooks nicht. Phase 4 schliesst diese Lücke: FragenEditor.tsx wird mit `<EditorProvider>` gewrapped und liefert Config + Services aus den Pruefung-Stores.

## Scope

### In Scope

1. **EditorProvider in FragenEditor.tsx verdrahten** — config/services aus authStore + schulConfigStore + apiService zusammenbauen, JSX-Baum wrappen
2. **Redundante Props in MetadataSection entfernen** — Props die bereits aus dem Context gelesen werden: `lpListe`, `eigeneFachschaft`, `verfuegbareSemester`, `verfuegbareGefaesse`

### Out of Scope

- State-Migration (80 useState bleiben in FragenEditor)
- Änderungen an TypEditorDispatcher, MusterloesungSection (rein prop-basiert, kein Context nötig)
- Lernplattform-Integration (separates Thema)
- PDFEditor-Migration (Phase 5)

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| `ExamLab/src/components/lp/frageneditor/FragenEditor.tsx` | EditorProvider wrappen, editorConfig + editorServices zusammenbauen |
| `packages/shared/src/editor/sections/MetadataSection.tsx` | Props `lpListe`, `eigeneFachschaft` entfernen — liest aus `useEditorConfig()` |

## Technisches Design

### 1. EditorConfig zusammenbauen (in FragenEditor.tsx)

```typescript
const editorConfig: EditorConfig = useMemo(() => ({
  benutzer: {
    email: user?.email ?? '',
    name: user?.name,
    fachschaft: user?.fachschaft,
    fachschaften: user?.fachschaften,
  },
  verfuegbareGefaesse: schulConfig?.gefaesse ?? [],
  verfuegbareSemester: schulConfig?.semester ?? [],
  zeigeFiBuTypen: istWRFachschaft(user?.fachschaft),
  lpListe: lpListe.map(lp => ({
    email: lp.email,
    name: lp.name,
    kuerzel: lp.kuerzel,
  })),
  features: {
    kiAssistent: apiService.istKonfiguriert(),
    anhangUpload: apiService.istKonfiguriert(),
    bewertungsraster: true,
    sharing: true,
    poolSync: true,
    performance: !!performance,
  },
}), [user, schulConfig, lpListe, performance])
```

**Quellen:**
- `user` ← `useAuthStore((s) => s.user)` (bereits vorhanden)
- `schulConfig` ← `useSchulConfig((s) => s.config)` (bereits vorhanden)
- `lpListe` ← `useState` + `ladeUndCacheLPs()` (bereits vorhanden)
- `performance` ← Props von aussen

### 2. EditorServices zusammenbauen (in FragenEditor.tsx)

```typescript
const editorServices: EditorServices = useMemo(() => ({
  uploadAnhang: async (frageId: string, datei: File) => {
    if (!user) return null
    return apiService.uploadAnhang(user.email, frageId, datei)
  },
  kiAssistent: async (aktion: string, daten: Record<string, unknown>) => {
    if (!user) return null
    // apiService.kiAssistent erwartet email als 1. Parameter
    return apiService.kiAssistent(user.email, aktion, daten)
  },
  istKIVerfuegbar: () => apiService.istKonfiguriert(),
  istUploadVerfuegbar: () => apiService.istKonfiguriert() && !!user,
  ladeLernziele: async (gefaess: string, fachbereich: string) => {
    if (!user) return []
    // poolApi.ladeLernziele erwartet (email, fach?) — gefaess wird vom Pruefung-Backend nicht verwendet
    return poolApi.ladeLernziele(user.email, fachbereich)
  },
}), [user])
```

**Hinweise zu den Service-Adaptern:**
- `kiAssistent`: Die Methode heisst `apiService.kiAssistent` (nicht `kiAktion`). Der 1. Parameter ist `email`, der vom shared Interface abstrahiert wird — der Host injiziert die Email.
- `ladeLernziele`: Die Methode heisst `poolApi.ladeLernziele(email, fach?)`. Das shared Interface definiert `(gefaess, fachbereich)` — der `gefaess`-Parameter wird vom Pruefung-Backend aktuell ignoriert und nicht weitergegeben. Die Email wird vom Host injiziert.
- **Lernziel-Typ:** `packages/shared/src/types/fragen.ts` definiert `Lernziel`. Muss kompatibel sein mit `ExamLab/src/types/pool.ts:Lernziel`. Bei der Implementierung prüfen ob es derselbe Typ ist oder ob ein Mapping nötig ist.

### 3. JSX wrappen

```tsx
return (
  <EditorProvider config={editorConfig} services={editorServices}>
    <div className="fixed inset-0 ...">
      {/* Bestehender JSX-Baum — KEINE Änderungen */}
    </div>
  </EditorProvider>
)
```

### 4. MetadataSection Props bereinigen

**Vorher** (FragenEditor.tsx Zeile 705):
```tsx
<MetadataSection
  ...
  lpListe={lpListe}
  eigeneFachschaft={user?.fachschaft}
/>
```

**Nachher:**
```tsx
<MetadataSection
  ...
  // lpListe und eigeneFachschaft entfallen — kommt aus useEditorConfig()
/>
```

**In MetadataSection.tsx:**
- Props `lpListe` und `eigeneFachschaft` aus Interface entfernen
- Intern: `const config = useEditorConfig()` → `config.lpListe`, `config.benutzer.fachschaft`
- **Konkret:** Zeile mit `istWRFachschaft(eigeneFachschaft)` ändern zu `istWRFachschaft(config.benutzer.fachschaft)` — die Prop wird aktiv verwendet, nicht nur durchgereicht
- Prüfen ob `verfuegbareSemester` und `verfuegbareGefaesse` ebenfalls bereits aus Config gelesen werden — falls ja, auch diese Props entfernen

### 5. Welche Komponenten profitieren (bereits Context-Hooks eingebaut)

| Komponente | Hook | Was sie aus Context liest |
|---|---|---|
| FragetextSection | `useEditorConfig()` + `useEditorServices()` | `benutzer.email`, `services.ladeLernziele` |
| MetadataSection | `useEditorConfig()` | `verfuegbareSemester`, `verfuegbareGefaesse`, `lpListe`, `benutzer.fachschaft` |
| BildUpload | `useEditorConfig()` + `useEditorServices()` | `benutzer.email`, `services.uploadAnhang`, `istUploadVerfuegbar()` |
| FrageTypAuswahl | `useEditorConfig()` | `zeigeFiBuTypen` |
| useKIAssistent | `useEditorConfig()` + `useEditorServices()` | `benutzer.email`, `services.kiAssistent`, `istKIVerfuegbar()` |

### 6. Was sich NICHT ändert

- **TypEditorDispatcher** — reiner Prop-Dispatcher, kein Context
- **MusterloesungSection** — reine Props
- **KIAssistentPanel, KIBausteine** — reine Props / UI-Komponenten
- **AnhangEditor, PDFEditor, PoolUpdateVergleich, RueckSyncDialog** — Pruefung-spezifisch
- **Alle 80 useState in FragenEditor** — bleiben wo sie sind

## Verifikation

1. `npx tsc -b` — TypeScript-Check (CI-äquivalent)
2. `npx vitest run` — alle 193+ Tests grün
3. `npm run build` — Build erfolgreich
4. Manueller Check: FrageTypAuswahl zeigt FiBu-Typen nur wenn WR-Fachschaft (Feature-Flag via Context)

## Risiko

**Minimal.** Die Context-Hooks existieren bereits in den Sections (Phase 3). Der Provider aktiviert sie lediglich. Kein State wird verschoben, keine Business-Logik ändert sich. Falls ein Hook vor Phase 4 aufgerufen wird (kein Provider), gibt es einen klaren Runtime-Error — das ist aktuell der Fall und wird durch Phase 4 behoben.

## Geklärte Fragen (aus Spec-Review)

- **`kiAssistent`-Methode:** Heisst `apiService.kiAssistent(email, aktion, daten)` — im Adapter wird `email` vom Host injiziert.
- **`ladeLernziele`-Methode:** Heisst `poolApi.ladeLernziele(email, fach?)` — `gefaess`-Parameter des shared Interface wird nicht ans Backend weitergegeben.
- **`eigeneFachschaft` in MetadataSection:** Wird aktiv in `istWRFachschaft(eigeneFachschaft)` verwendet — muss beim Prop-Entfernen explizit auf `config.benutzer.fachschaft` umgestellt werden.
- **Lernziel-Typ-Kompatibilität:** Muss bei Implementierung geprüft werden (shared vs. Pruefung Definition).
