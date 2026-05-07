# Bundle T.b — TKontoFrage Komponenten-Split (Sub-Spec)

**Datum:** 2026-05-07
**Status:** Draft (vor Spec-Review)
**Master-Spec:** [`2026-05-06-bundle-t-hooks-splits-design.md`](2026-05-06-bundle-t-hooks-splits-design.md)
**Vorgänger:** Bundle T.a (DurchfuehrenDashboard, Merge `4c3400f` 2026-05-07)

## 1. Kontext

Aus der Master-Spec von Bundle T (2026-05-06): T.b zerlegt `ExamLab/src/components/fragetypen/TKontoFrage.tsx` (763 Z.) per Komponenten-Split + file-lokales `tkontoUtils.ts` ohne Verhaltensänderung. Bundle T überträgt das Folder-Pattern aus Bundle S auf Komponenten-State; T.a hat die Phase-useState-Konvention etabliert. T.b ist das zweite mittel-Risiko-Sub-Bundle und braucht keinen Hook-Cut — Master-Spec sagt explizit: Komponenten-Split + Util-File.

Der File hat zwei klar getrennte Modi (`aufgabe` / `loesung`), und der `aufgabe`-Render-Body weist eine starke links/rechts-Symmetrie auf (~110 Z. fast 1:1 dupliziert in der Buchungszeilen-Grid). Ein zweistufiger Komponenten-Split (`<KontoEingabeForm>` → 2× `<KontoSeite>`) eliminiert die Duplikation, ohne State-Geometrie oder Adapter-Hook-Aufruf zu verändern.

## 2. Ziel

`TKontoFrage.tsx` von 763 Z. auf ~200 Z. (Wrapper + State-Holder), Hotspot-Bilanz Files >500 Z. **12 → 11**, ohne Verhaltensänderung. Decimal-Konvertierungs-Logic (`zuAntwort`/`vonAntwort`) und Korrektur-Logic (`matcheEintraege`, neu `bewerteKonto`) als pure Functions in `tkontoUtils.ts` mit Vitest-Coverage.

## 3. Scope

### In Scope

| Sub | File | heute | nachher | Verantwortung |
|---|---|---:|---:|---|
| Modify | `ExamLab/src/components/fragetypen/TKontoFrage.tsx` | 763 Z. | ~200 Z. | Wrapper-Dispatcher + `TKontoAufgabe` (State-Holder + Adapter-Hook + 6 Update-Funktionen + Render-Frame mit Header/Aufgabentext/Konten-Loop) |
| New | `ExamLab/src/components/fragetypen/tkonto/KontoEingabeForm.tsx` | – | ~80–100 Z. | 1 Konto: Konto-Header (Kontoname, Kontenkategorie-Select) + 2× `<KontoSeite>` |
| New | `ExamLab/src/components/fragetypen/tkonto/KontoSeite.tsx` | – | ~120–140 Z. | 1 Seite (`'links'` oder `'rechts'`): Beschriftung-Select + Z/A-Select + AB-Feld + Buchungszeilen-Map (mit `KontenSelect`) + Saldo-Feld |
| New | `ExamLab/src/components/fragetypen/tkonto/TKontoLoesungAnsicht.tsx` | – | ~150 Z. | Loesungsmodus-Render inkl. lokalem `EintragBadge`-Helper. Nutzt `bewerteKonto` für Pro-Konto-Bewertung + `alleKontenKorrekt`-Vorab-Berechnung |
| New | `ExamLab/src/components/fragetypen/tkonto/tkontoUtils.ts` | – | ~125 Z. | Pure Functions: `neueId`, `leereZeile`, `leereKontoEingabe`, `zuAntwort`, `vonAntwort`, `matcheEintraege`, `bewerteKonto`, `brd` + Types `EintragZeile`, `KontoEingabe`, `SusEintrag`, `EintragStatus`, `KontoBewertung`, `TKontoAntwort` |
| New | `ExamLab/src/components/fragetypen/tkonto/tkontoUtils.test.ts` | – | ~85 Z. | Vitest, 23 Tests, co-located |

### Out of Scope

- Wire-Vertrag-Änderungen (Apps Script bleibt unangetastet)
- `useTKontoState`-Hook-Cut (Master-Spec verlangt nur Komponenten-Split + Util)
- Loesungsmodus-Antwort-Schema-Migration (`saldo`/`eintraege`-Backend-Format)
- T-Konto-Editor (LP-Frageneditor) — nicht Teil von TKontoFrage.tsx
- Refactor von `KontenSelect` (shared) oder `MusterloesungsBlock`
- `kontoLabel`/`renderMarkdown`/`fachbereichFarbe` Util-Refactor (bleiben extern)

## 4. Architektur

### 4.1 Datei-Struktur (analog `zeichnen/`)

```
ExamLab/src/components/fragetypen/
├── TKontoFrage.tsx                      ← Modify (763 → ~200 Z.)
└── tkonto/
    ├── KontoEingabeForm.tsx             ← New
    ├── KontoSeite.tsx                   ← New
    ├── TKontoLoesungAnsicht.tsx         ← New
    ├── tkontoUtils.ts                   ← New
    └── tkontoUtils.test.ts              ← New
```

Konvention etabliert (siehe `fragetypen/zeichnen/`). Bundle-S/L-Lehre: Folder-Pattern bei >450 Z. Cuts ist Standard.

### 4.2 `tkontoUtils.ts` API

```typescript
// Types (aus TKontoFrage.tsx hochgehoben)
export interface EintragZeile { id: string; gegenkonto: string; betrag: string; gfNr: string }
export interface KontoEingabe {
  id: string
  beschriftungLinks: string; beschriftungRechts: string
  kontenkategorie: string
  sollHaben: string; zunahmeAbnahme: string                     // Legacy (nicht mehr im UI)
  zunahmeAbnahmeLinks: string; zunahmeAbnahmeRechts: string
  anfangsbestandLinks: string; anfangsbestandRechts: string
  eintraegeLinks: EintragZeile[]; eintraegeRechts: EintragZeile[]
  saldoLinks: string; saldoRechts: string
}
export type SusEintrag = { gegenkonto: string; betrag: number }
export type EintragStatus =
  | { art: 'korrekt'; gegenkonto: string; betrag: number }
  | { art: 'falsch'; gegenkonto: string; betrag: number; hinweis: string }
  | { art: 'fehlend'; gegenkonto: string; betrag: number }
export interface KontoBewertung {
  linksStatus: EintragStatus[]
  rechtsStatus: EintragStatus[]
  alleLinksOk: boolean
  alleRechtsOk: boolean
  saldoBalanciert: boolean
  kontoKorrekt: boolean
}

// Pure functions
export function neueId(): string
export function leereZeile(): EintragZeile
export function leereKontoEingabe(id: string): KontoEingabe
export function zuAntwort(konten: KontoEingabe[]): TKontoAntwort
export function vonAntwort(antwort: TKontoAntwort | undefined, frageDefs: TKontoFrageType['konten']): KontoEingabe[]
export function matcheEintraege(korrekt: SusEintrag[], sus: SusEintrag[]): EintragStatus[]
export function bewerteKonto(
  konto: TKontoFrageType['konten'][0],
  sus: TKontoAntwort['konten'][0] | undefined
): KontoBewertung
export function brd(wert: string, readOnly: boolean): string  // Border-Klasse: violett wenn leer + nicht readOnly
```

`TKontoAntwort` = `Extract<Antwort, { typ: 'tkonto' }>` (re-exportiert aus `tkontoUtils.ts` als Convenience).

`bewerteKonto` ist neu — extrahiert das doppelte Pro-Konto-Berechnungs-Logic (heute 1× in `alleKontenKorrekt`-Vorab-Loop, 1× im Pro-Konto-Render-Loop in `TKontoLoesung`). Single Source of Truth.

`brd` ist heute Z. 18-21 in `TKontoFrage.tsx`. Da der Helper in `<KontoSeite>`, `<KontoEingabeForm>` und `<TKontoLoesungAnsicht>` (Saldo-Felder im AB-Render) gebraucht wird, wandert er nach `tkontoUtils.ts` statt aus `TKontoFrage.tsx` exportiert oder dupliziert zu werden.

`zuAntwort`/`vonAntwort` byte-identisch zur heutigen Inline-Implementation — keine Logik-Änderung. Round-Trip-Test sichert das ab.

**Legacy-Feld-Typisierung:** Die heutige `vonAntwort` (Z. 119-122 in TKontoFrage.tsx) nutzt `(eingabe as Record<string, unknown>).sollHaben as string` für die Legacy-Felder `sollHaben`, `zunahmeAbnahme`, `zunahmeAbnahmeLinks`, `zunahmeAbnahmeRechts`. Beim Move auf `tkontoUtils.ts` werden diese Felder als Optional-Felder im `TKontoAntwort['konten'][0]`-Type hinzugefügt (`sollHaben?: string`, `zunahmeAbnahme?: string`, etc.), so dass die Casts entfallen können. Damit bleibt das `lint:as-any`-Gate clean ohne neue Defensive-Marker.

### 4.3 Komponenten-Schnittstellen

```typescript
// TKontoFrage.tsx (Wrapper)
interface Props {
  frage: TKontoFrageType
  modus?: 'aufgabe' | 'loesung'
  antwort?: Antwort | null
}
export default function TKontoFrage({ frage, modus = 'aufgabe', antwort }: Props) {
  if (modus === 'loesung') return <TKontoLoesungAnsicht frage={frage} antwort={antwort ?? null} />
  return <TKontoAufgabe frage={frage} />
}

// TKontoAufgabe (interne Sub-Komponente in TKontoFrage.tsx)
function TKontoAufgabe({ frage }: { frage: TKontoFrageType }) {
  const { antwort, onAntwort, speichereZwischenstand, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)
  // useState<KontoEingabe[]>, frage.id-Reload-useEffect
  // 6 Update-Funktionen: aktualisiere, deepCopy, eintragAendern, zeileHinzufuegen, zeileEntfernen, feldAendern
  // Render: Badges + Aufgabentext + Geschäftsfälle + konten.map(<KontoEingabeForm/>) + Feedback
}
```

```typescript
// tkonto/KontoEingabeForm.tsx
interface KontoEingabeFormProps {
  konto: KontoEingabe
  def: TKontoFrageType['konten'][0]
  bewertungsoptionen: TKontoFrageType['bewertungsoptionen']
  hatGeschaeftsfaelle: boolean
  kontenauswahl: TKontoFrageType['kontenauswahl']
  readOnly: boolean
  onFeldAendern: (feld: keyof KontoEingabe, wert: string) => void
  onEintragAendern: (seite: 'links' | 'rechts', zeileIdx: number, feld: 'gegenkonto' | 'betrag' | 'gfNr', wert: string) => void
  onZeileHinzufuegen: (seite: 'links' | 'rechts') => void
  onZeileEntfernen: (seite: 'links' | 'rechts', zeileIdx: number) => void
}
// Render: Konto-Header (Kontoname + Kategorie-Select) + 2× <KontoSeite seite="links"/"rechts">
```

```typescript
// tkonto/KontoSeite.tsx
interface KontoSeiteProps {
  seite: 'links' | 'rechts'
  konto: KontoEingabe
  def: TKontoFrageType['konten'][0]
  bewertungsoptionen: TKontoFrageType['bewertungsoptionen']
  hatGeschaeftsfaelle: boolean
  kontenauswahl: TKontoFrageType['kontenauswahl']
  readOnly: boolean
  onFeldAendern: (feld: keyof KontoEingabe, wert: string) => void
  onEintragAendern: (zeileIdx: number, feld: 'gegenkonto' | 'betrag' | 'gfNr', wert: string) => void
  onZeileHinzufuegen: () => void
  onZeileEntfernen: (zeileIdx: number) => void
}
// Internal: `seite === 'links'` schaltet zwischen beschriftungLinks/Rechts, eintraegeLinks/Rechts,
// zunahmeAbnahmeLinks/Rechts, anfangsbestandLinks/Rechts, saldoLinks/Rechts
// Render: Beschriftung-Select + Z/A-Select + AB-Feld + Buchungszeilen-Map + Saldo-Feld
```

```typescript
// tkonto/TKontoLoesungAnsicht.tsx
interface Props { frage: TKontoFrageType; antwort: Antwort | null }
export default function TKontoLoesungAnsicht({ frage, antwort }: Props) {
  // alleKontenKorrekt = konten.every(k => bewerteKonto(k, sus).kontoKorrekt)
  // Render: Badges + Aufgabentext + konten.map(bewerteKonto + T-Tabelle + Saldo + erwarteter Saldo)
  //         + MusterloesungsBlock(variant: alleKontenKorrekt ? 'korrekt' : 'falsch')
}
// Internal: EintragBadge-Helper (lokal, ~25 Z.)
```

### 4.4 Datenfluss

State liegt im Parent (`TKontoAufgabe`). `<KontoEingabeForm>` und `<KontoSeite>` sind dumme Render-Komponenten mit Callback-Props.

```
TKontoAufgabe                                     useFrageAdapter
  ├── konten: KontoEingabe[]   (useState)              │
  ├── aktualisiere(neueKonten) ─────────────────► onAntwort/speichereZwischenstand
  └── konten.map((k, kIdx) => <KontoEingabeForm
        konto={k}
        onEintragAendern={(seite, zIdx, feld, wert) =>
          eintragAendern(kIdx, seite, zIdx, feld, wert)}
        ...
      />)
            │
            └── <KontoSeite seite="links" onEintragAendern={(zIdx, feld, wert) =>
                                            props.onEintragAendern('links', zIdx, feld, wert)}
                            ... />
            └── <KontoSeite seite="rechts" ... />
```

Pro-Konto-Closures captureн `kIdx` einmal in `<KontoEingabeForm>`. Pro-Seite-Closures schaltet auf `seite`-Argument im `<KontoSeite>`-Adapter.

Kein `useCallback` nötig — Re-Renders sind nicht hot path (max. ~5 Konten pro Frage).

### 4.5 Hybrid-Sprach-Konvention (Bundle V)

Domain (Konto/Saldo/Eintrag/Beschriftung/Buchung/Bewertung/Geschäftsfall) deutsch. UI-Strings deutsch mit Umlaut. Identifier ohne Umlaut (z.B. `geschaeftsfaelle`, `zunahmeAbnahmeLinks`). React-Konventionen englisch (`onChange`, `onClick`, `useState`, `useEffect`). Programming-Primitives englisch (`id`, `disabled`, `props`, `index`).

## 5. Test-Strategie

### 5.1 `tkontoUtils.test.ts` (23 Tests, Vitest, co-located)

| Funktion | Tests |
|---|---|
| `zuAntwort` | (1) leere Beträge → 0; (2) Decimal '3.50' → 3.5; (3) gfNr optional ('5'→5, ''→undefined); (4) saldo nur wenn links\|\|rechts gesetzt; (5) leere Beschriftungs-Felder → undefined |
| `vonAntwort` | (1) antwort=undefined → leere Konten; (2) Round-Trip `vonAntwort(zuAntwort(x)) ≈ x` modulo Eintrag-IDs UND modulo `anfangsbestandLinks/Rechts` (heute nicht serialisiert in `zuAntwort`, kommen als `''` zurück); (3) Saldo-Werte als String restauriert; (4) Konten matched per `id` (nicht Index); (5) leere Eintragslisten → `[leereZeile()]`; (6) Legacy-Felder `sollHaben`/`zunahmeAbnahme*` werden aus Antwort gelesen wenn vorhanden, sonst `''` |
| `matcheEintraege` | (1) beide leer → []; (2) Reihenfolge-unabhängig (greedy); (3) sus<korrekt → fehlend-Status; (4) sus>korrekt → falsch (überflüssig); (5) Decimal-Toleranz `<0.01` (100.005≈100.01); (6) NICHT-Toleranz `≥0.01` (100.01≠100.02); (7) genutzt-Set bei Duplikaten in sus |
| `bewerteKonto` | (1) alle korrekt → kontoKorrekt=true; (2) fehlend links → kontoKorrekt=false; (3) Saldo unbalanciert → kontoKorrekt=false; (4) kein sus.saldo → saldoBalanciert=true; (5) sus=undefined → kontoKorrekt=false |

`leereZeile`/`leereKontoEingabe`/`neueId`/`brd` ungetestet — triviale Factory- und Klassen-Helpers, indirekt durch `vonAntwort`-Tests bzw. Browser-E2E (Border-Farbe sichtbar) gedeckt. Keine Mocks nötig — alle Functions pure.

**Insgesamt 23 Tests** (5 + 6 + 7 + 5).

### 5.2 Browser-E2E (echte Logins, staging)

| Pfad | Erwartung |
|---|---|
| LP — Prüfung mit T-Konto-Frage erstellen, durchführen, korrigieren | Editor lädt; Loesungsmodus zeigt links/rechts/Saldo korrekt mit grün/rot-Badges |
| SuS — Üben mit T-Konto-Frage | Buchungszeilen eintragen, Saldo, Feedback erscheint, Navigation weiter funktioniert |
| Multi-Konten-Frage | 3+ Konten parallel ausfüllen, alle persistieren beim Tab-Switch |
| Geschäftsfall-Modus | gfNr-Spalte erscheint, persistiert |
| Bewertungsoptionen-Toggle | `kontenkategorie` an/aus, `beschriftungSollHaben` an/aus, `zunahmeAbnahme` an/aus |

Service-Worker-Cache-Flush vor E2E (SW-unregister + caches.delete + reload). 0 Console-Errors.

## 6. Risiken & Mitigationen

| Risiko | Mitigation |
|---|---|
| Decimal-Drift durch `parseFloat`/`String` Round-Trip | Round-Trip-Test in `vonAntwort` + 6 Decimal-Tests in `matcheEintraege`/`zuAntwort` |
| `<KontoSeite>`-Symmetrie-Bug (links/rechts vertauscht) | Browser-E2E mit Multi-Konten-Frage; Test-Checkliste prüft beide Seiten getrennt |
| `bewerteKonto` Verhaltensänderung | Refactor byte-identisch — extrahiert exakt die heute existierende Berechnung. Tests decken alle Pfade (alle korrekt / fehlend / Saldo unbalanciert / kein sus.saldo / sus=undefined) |
| Auto-Save-Race (Lehre Bundle 3) | Update-Pfad (`speichereZwischenstand`/`onAntwort`) byte-identisch — nur Render-Cuts. Browser-E2E Tab-Switch verifiziert |
| `useFrageAdapter`-Coupling | TKontoAufgabe behält Adapter-Hook-Aufruf — keine Re-Mount-Geometrie-Änderung |
| Service-Worker-Cache | SW-unregister + caches.delete + reload als Routine vor E2E (auch wenn kein Wire-Vertrag berührt) |
| Subagent-Branch-Drift | Branch `feature/bundle-t-b-tkonto-frage` von main, explizit im Subagent-Prompt + remote pushen vor Folge-Subagents (Lehre `feedback_subagent_shell_context`) |

## 7. Definition of Done (Bundle-S/L-Standard)

- [ ] `npx vitest run` grün — drift +23 Tests dokumentiert
- [ ] `npx tsc -b` clean (Output direkt prüfen, nicht nur Exit-Code — Lehre `feedback_tsc_b_exit_misleading`)
- [ ] `npm run lint:as-any` clean
- [ ] `npm run lint:no-alert` clean
- [ ] `npm run lint:no-tests-dir` clean (Bundle-Q-Gate)
- [ ] `npm run lint:musterloesung` clean (Bundle-P-Gate)
- [ ] `TKontoFrage.tsx` <500 Z. (Ziel ~200 Z.)
- [ ] Browser-E2E auf staging mit echten LP+SuS-Logins, alle 5 Pfade aus 5.2 ✓
- [ ] 0 Console-Errors auf staging
- [ ] Code-Reviewer-Subagent APPROVED
- [ ] Memory-Update mit Lehren
- [ ] HANDOFF.md-Eintrag

**Hotspot-Bilanz nach T.b:** Files >500 Z. **12 → 11** (TKontoFrage.tsx raus aus Hotspot).

## 8. Roadmap-Position

T.b ist Sub-Bundle 2/6 in Bundle T. Risiko-aufsteigende Reihenfolge: T.a ✓ → **T.b** → T.c (FragenBrowser) → T.d (ZeichnenCanvas) → T.e (Dashboard-Üben) → T.f (LPStartseite). Pattern aus T.b (Komponenten-Split + Util-File mit Decimal-Tests) fliesst optional in T.c falls dort Pure-Logic-Cuts möglich sind.

Nach T.c Master-Spec-Pause-Punkt für Zwischen-Reflexion (Hook-Naming, Test-Hybrid-Schwelle).
