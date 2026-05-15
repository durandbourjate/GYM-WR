---
title: Cluster H — Tag-Modell-Migration
date: 2026-05-15
status: Spec-Review ausstehend
verwandt: Cluster D (Batch-Edit operiert auf tagIds), Cluster C (globale Suche, Tag-Lookup), Cluster G (Icons)
---

# Cluster H — Tag-Modell-Migration

## 1. Zweck

Tags wandern vom Inline-`string[]` auf der Frage zu eigenständigen Entitäten in einem Backend-Sheet. Frage referenziert nur noch Tag-IDs. Eine Migrations-Phase übersetzt alle existierenden String-Tags einmalig.

**Motivation:** Heute ist `Frage.tags: string[]`. Tippfehler erzeugen neue „Tags" (z.B. „Aktuell" und „aktuell" als 2 verschiedene), Umbenennen eines Tags bedeutet Update jeder einzelnen Frage, keine Farben, keine Verwaltung. Hybrid-Code in `useFragenFilter.ts:250` (`typeof t === 'string' ? t : t.name`) zeigt: jemand hat den Übergang schon angefangen, aber nie zu Ende geführt — latente technische Schuld.

**Cluster H ist Voraussetzung für Cluster D** (Batch-Edit), damit Bulk-Tag-Operationen sauber auf einem Object-Modell laufen statt mit String-Hybrid kämpfen müssen.

## 2. Begriffe

- **Tag-Object:** Eigenständige Entität `{id, name, farbe, archiviert, ...}` im neuen `Tags`-Sheet.
- **Tag-Referenz:** Auf einer Frage gespeichert als `tagIds: string[]` (Liste von Tag-IDs, nicht Namen).
- **Migration:** Einmaliger One-Shot-Backend-Lauf, der String-Tags in Tag-Objects übersetzt und alle Fragen auf `tagIds` umschreibt.
- **Quick-Erstellen:** Im Frage-Editor: Tag tippen + Enter → falls nicht existiert, sofort anlegen + verwenden.
- **Mergen:** Mehrere Tags zu einem zusammenfassen — Master-Tag bleibt, andere werden archiviert + an allen Fragen ersetzt.
- **Admin:** LP mit erweiterten Rechten (destruktive Aktionen). Wird über bestehendes `AdminTab`-Konstrukt definiert (Plan-Phase greppt Details).

## 3. Architektur-Entscheidungen

| # | Entscheidung | Begründung |
|---|---|---|
| 1 | **Global geteilte Tags** (ein zentrales Sheet, alle LPs nutzen dieselben). | Konsistente Klassifikation, keine Duplikate über LPs hinweg. Alternative pro-LP wäre fragmentiert. |
| 2 | **Flaches Tag-Modell + Farbe** (keine Hierarchie, keine Kategorien). | Hierarchie wäre over-engineered (existierende Strukturen `fachbereich`/`thema`/`unterthema` decken das ab). Farbe für visuelles Gruppieren reicht. |
| 3 | **Farb-Token statt Hex** (8 Tailwind-Farben). | Konsistent mit App-Design, dark-mode-fähig, kleine fixe Auswahl verhindert Wildwuchs. |
| 4 | **Auto-Migration mit nachträglich editierbar.** | Kein Wizard nötig. User kann nach Migration in der Tag-Verwaltung umbenennen/farbieren/mergen. |
| 5 | **Verwaltung als Tab in LP-Einstellungen** + Quick-Erstellen aus Editor. | Kombination aus voller Übersicht (Tab) und schneller Bedienung (Quick-Erstellen). Vorbild: andere Apps mit Tag-Systemen. |
| 6 | **Berechtigungen: jeder darf alltägliches, Admin nur destruktives.** | Quick-Erstellen + Umbenennen + Farbe ändern für jeden LP (sonst nervt Bedienung). Archivieren + Mergen + Hard-Delete nur Admin (verhindert versehentliche Massen-Änderungen). |
| 7 | **Soft-Delete (Archivieren) statt Hard-Delete als Default.** | Archivierte Tags bleiben an Fragen hängen, sind nur unsichtbar im Picker. Hard-Delete nur möglich wenn Tag nirgends referenziert. |
| 8 | **Case-Insensitive Dedup bei Migration und Erstellen.** | „aktuell" und „Aktuell" werden als 1 Tag behandelt. Kanonischer Name = häufigstes Casing (Tie-Break: alphabetisch erstes). |
| 9 | **Migrations-Endpoint idempotent.** | Wenn `Tags`-Sheet nicht leer → Endpoint gibt Fehler zurück. Verhindert versehentlichen Doppel-Lauf. |
| 10 | **Rollback-Sicherheit über `tagsLegacy`-Spalte.** | Alte String-Tags-Spalte bleibt nach Migration einige Wochen parallel als `tagsLegacy` für Notfall-Rollback. Hard-Cut erst nach Verifikation. |

## 4. Datenmodell

### 4.1 Tag-Entität (`packages/shared/src/types/tag.ts`, neu)

```ts
export type TagFarbe = 'slate' | 'red' | 'amber' | 'emerald' | 'sky' | 'violet' | 'pink' | 'stone';

export interface Tag {
  id: string;             // UUID v4
  name: string;           // ohne Whitespace-Padding, case-preserving
  farbe: TagFarbe;        // Tailwind-Farb-Token; Default 'slate'
  archiviert: boolean;    // Soft-Delete: unsichtbar im Picker, bleibt an Fragen hängen
  erstelltAm: string;     // ISO-8601
  erstelltVon: string;    // LP-Email
}
```

### 4.2 Frage-Änderung (`packages/shared/src/types/fragen-core.ts`)

- **Vorher:** `tags: string[]`
- **Nachher:** `tagIds: string[]` (Liste von Tag-IDs)
- **Übergang:** Während Migration koexistieren beide Felder (siehe §7 Phase 3).

### 4.3 Backend-Sheet `Tags`

Neues Sheet im bestehenden Configs-Spreadsheet (gleicher Spreadsheet wie `Lehrpersonen`, `Lernziele`, etc.).

| Spalte | Typ | Beispiel |
|---|---|---|
| `id` | String (UUID) | `7a3e1b...` |
| `name` | String | `aktuell` |
| `farbe` | String (Token) | `slate` |
| `archiviert` | Boolean | `FALSE` |
| `erstelltAm` | String (ISO) | `2026-05-15T10:30:00Z` |
| `erstelltVon` | String (Email) | `wr@gym-hofwil.ch` |

## 5. Backend (Apps-Script)

### 5.1 Neue API-Endpoints

Alle als `case` im bestehenden `doPost`-Router (analog `case 'speichereFrage'`).

| Endpoint | Wer | Input | Output |
|---|---|---|---|
| `apiListTags` | jeder LP | `{ inkludiereArchivierte?: boolean }` (nur Admin darf `true`) | `Tag[]` |
| `apiCreateTag` | jeder LP | `{ name: string, farbe?: TagFarbe }` | `Tag` (existierender bei Case-Conflict) |
| `apiUpdateTag` | jeder LP | `{ id: string, name?: string, farbe?: TagFarbe }` | `Tag` |
| `apiArchiveTag` | nur Admin | `{ id: string }` | `{ ok: true }` |
| `apiMergeTags` | nur Admin | `{ masterId: string, mergedIds: string[] }` | `{ ok: true, fragenAktualisiert: number }` |
| `apiHardDeleteTag` | nur Admin | `{ id: string }` | `{ ok: true }` (oder Fehler wenn referenced) |

### 5.2 Migrations-Endpoint (einmalig)

`apiMigriereTagsZuObjects` — nicht Admin-gated (System-Operation), aber idempotent.

**Algorithmus:**
1. Prüfe: `Tags`-Sheet hat 0 Datenzeilen UND mindestens eine Frage hat `tags: string[]` mit Werten. Sonst Fehler.
2. Lies alle Fragen aus allen Frage-Sheets (aktive + archivierte).
3. Sammle alle `tag` aus `frage.tags`-Arrays.
4. Trim + drop empty.
5. Case-insensitive Dedup: Map `name.toLowerCase() → {kanonName, counts: Map<casing, count>}`.
6. Für jeden Eintrag: kanonischer Name = häufigstes Casing (Tie-Break: alphabetisch erstes).
7. Für jeden kanonischen Tag: erstelle UUID, Tag-Object mit `farbe='slate'`, `archiviert=false`, `erstelltAm=now()`, `erstelltVon='migration@system'`.
8. Schreibe alle Tag-Objects ins `Tags`-Sheet.
9. Iteriere alle Fragen: ersetze `tags: string[]` (jetzt benannt zu `tagsLegacy`) durch `tagIds: string[]`. Lookup-Map-Keys sind `name.toLowerCase()` (konsistent mit dem case-insensitive Dedup aus Schritt 5), damit Frontend-Lookup nicht durch Original-Casing scheitert.
10. Response: `{ neueTags: number, fragenAktualisiert: number, dauerMs: number }`.

**Idempotenz-Check** verhindert Doppel-Lauf.

### 5.3 Berechtigungs-Helper

`pruefeAdmin_(email)` — Plan-Phase greppt bestehendes Admin-Konstrukt (Audit zeigte `AdminTab.tsx`, vermutlich Email-Whitelist im Configs-Sheet). Cluster H nutzt das bestehende, führt kein eigenes ein.

### 5.4 Cache-Invalidierung

Schreibende Tag-Endpoints (`Create`/`Update`/`Archive`/`Merge`/`HardDelete`/`Migration`) müssen in `SCHREIBENDE_ACTIONS` aufgenommen werden, damit Backend-Cache invalidiert wird.

## 6. Frontend

### 6.1 Service-Wrapper (`ExamLab/src/services/tagsApi.ts`, neu)

1:1 Wrapper zu Backend-Endpoints, alle async, Wire-Format konsistent mit `fragensammlungApi.ts`.

```ts
export async function listeTags(opts?: { inkludiereArchivierte?: boolean }): Promise<Tag[]>;
export async function erstelleTag(input: { name: string, farbe?: TagFarbe }): Promise<Tag>;
export async function updateTag(input: { id: string, name?: string, farbe?: TagFarbe }): Promise<Tag>;
export async function archiviereTag(id: string): Promise<void>;
export async function mergeTags(input: { masterId: string, mergedIds: string[] }): Promise<{ fragenAktualisiert: number }>;
export async function hardDeleteTag(id: string): Promise<void>;
```

### 6.2 Tags-Store (`ExamLab/src/store/tagsStore.ts`, neu)

Zustand-Store mit Cache (analog `configsListStore` aus Cluster C).

```ts
interface TagsState {
  tags: Tag[];                    // alle nicht-archivierten + (für Admin) archivierten
  geladen: boolean;
  ladeAlleTags: () => Promise<void>;
  upsertLokal: (tag: Tag) => void;       // für Optimistic-Updates
  entferneLokal: (id: string) => void;
  getById: (id: string) => Tag | undefined;
}
```

Selektor-Helper `useTagsByIds(ids: string[])` für Lookup im Render.

### 6.3 Lese-/Schreib-Pfade umstellen

- **`useFragenFilter.ts`:** Hybrid-Code Z.250 (`typeof t === 'string' ? t : t.name`) entfernen, ersetzen durch `tagsStore.getById(tagId)?.name`.
- **`fragensammlungStore`:** lädt jetzt parallel `tagsStore.ladeAlleTags()` mit.
- **`speichereFrage`-Service:** schreibt `tagIds` (statt `tags`).
- **Frage-Editor:** liest `tagIds`, rendert via `tagsStore.getById()`.
- **Globale Suche (Cluster C):** Tag-Such-Adapter in `sucheAdapter.ts` muss auf `tagsStore` umgestellt werden — kleiner Patch.

### 6.4 Verwaltungs-Tab `Tags` in LP-Einstellungen

Neues Tab in `EinstellungenPanel`:

```
┌─────────────────────────────────────────────────┐
│ Tags  [+ Neuer Tag]                  [🔍 Suche] │
├─────────────────────────────────────────────────┤
│ ● aktuell        rot      47 Fragen   [⋮]       │
│ ● schwer         amber     8 Fragen   [⋮]       │
│ ● Matura-25      sky      12 Fragen   [⋮]       │
│ ● ⊘ veraltet     slate     3 Fragen   [⋮]       │  ← archivierte (Admin-Toggle)
└─────────────────────────────────────────────────┘
```

- Liste sortiert nach `name` (case-insensitive).
- Verwendungs-Anzahl = Zählung über `fragensammlungStore.summaries` (clientseitig, eine Berechnung pro Render via `useMemo`).
- `[⋮]`-Menu pro Zeile:
  - **Umbenennen** (jeder LP)
  - **Farbe ändern** (jeder LP) — Picker mit 8 Tokens
  - **Archivieren** (Admin) — Confirm-Modal mit Verwendungs-Anzahl
  - **Mergen** (Admin) — Multi-Select-Modus aktivieren
  - **Endgültig löschen** (Admin, nur wenn Verwendung = 0)
- Toggle „Archivierte zeigen" oben rechts (Admin-Only).
- Mergen-Flow:
  1. Klick „Mergen" auf Tag X aktiviert Multi-Select-Modus
  2. User klickt weitere Tags an (mehrere)
  3. Floating-Bar erscheint: „3 Tags ausgewählt → [Master wählen ▼] [Mergen]"
  4. Modal: „47 Fragen werden auf Master 'aktuell' umgehängt. Andere Tags werden archiviert."
  5. Bestätigen → Backend-Call → Toast + Refresh

### 6.5 Tag-Picker im Frage-Editor (Quick-Erstellen)

Neue Komponente `TagPicker` in `packages/shared/src/editor/components/TagPicker.tsx` (oder lokal in ExamLab, Plan-Phase entscheidet wo Re-Use sinnvoll ist).

```
┌─────────────────────────────────────┐
│ Tags                                │
│ ┌─────────────────────────────────┐ │
│ │ [Such-Input: aktue]             │ │
│ └─────────────────────────────────┘ │
│ ☑ aktuell           rot             │
│ ☐ Aktualität        slate           │
│ ─────────────────────────────────── │
│ [+ "aktue" anlegen]                 │  ← bei keinem exakten Treffer
└─────────────────────────────────────┘
```

- Such-Input filtert Tag-Liste live (case-insensitive Substring-Match).
- Multi-Select via Checkbox.
- Keyboard: ↑↓ navigiert, Enter toggled.
- Bei Enter ohne Treffer: Quick-Erstellen mit getipptem Namen + Default-Farbe.
- Maximal 8 Tags pro Frage als Soft-Limit (UI-Hinweis, kein Backend-Block). Begründung: in der KompaktZeile der Fragensammlung würden mehr Tag-Chips den horizontalen Platz sprengen + Wrap-Verhalten unschön machen. Das Limit kann jederzeit nachgezogen werden, wenn sich das UI-Layout ändert.

## 7. Migration-Strategie

### Phase 0: Vorbereitung (Backend + Frontend-Wrappers)

- Apps-Script: neues `Tags`-Sheet (initial leer) + alle CRUD-Endpoints + Migrations-Endpoint deployed.
- Frontend: `tagsApi.ts` + `tagsStore.ts` + Type `Tag` in shared. Noch nicht gerendert.
- **Verifikation:** Curl-Test der Endpoints, vitest grün.

### Phase 1: One-Shot-Migration

- Admin-LP klickt einmalig „Migration starten" in temporärem Admin-Button im `AdminTab` (Wartungs-Sektion).
- Frontend zeigt Loading-Spinner + Streaming-Status (siehe Apps-Script-Limit unten).
- Bei Erfolg: Toast „32 Tags erstellt, 487 Fragen aktualisiert".
- Bei Fehler: Roll-back ist nicht nötig (Backend hat noch nichts permanent geschrieben — Atomarität pro Sheet).

**Apps-Script-Limit:** 6-Min-Execution. Bei 5000+ Fragen muss Migration ggf. in Batches laufen (Backend speichert „lastProcessedFragenId" und Frontend ruft erneut auf, bis `done: true`). Plan-Phase prüft konkrete Frage-Anzahl im Repo + entscheidet ob Batches nötig.

### Phase 2: Lese-/Schreibpfade umstellen

- `ladeFragensammlungSummary`/`ladeFrageDetail` lesen `tagIds` (mit Fallback auf `tags` solange Backend beide liefert).
- `useFragenFilter`-Hybrid-Code entfernt, durch `tagsStore`-Lookup ersetzt.
- `speichereFrage` schreibt `tagIds` (Backend nimmt `tagIds` an, leitet ggf. nach `tagsLegacy` parallel falls noch nicht migriert).
- Frage-Editor + Verwaltungs-Tab live.

### Phase 3: Cleanup

- Nach 2 Wochen Live-Betrieb ohne Probleme: `tagsLegacy`-Spalte aus Backend entfernen, Frontend-Fallback-Code entfernen.
- Hard-Cut.

### Rollback-Sicherheit

Solange `tagsLegacy` parallel existiert (Phase 2 + 3-Pre-Cleanup): Notfall-Rollback per Feature-Flag im Frontend möglich (`USE_TAG_OBJECTS=false` → liest wieder `tags: string[]`).

## 8. Berechtigungen — Detail

| Aktion | Jeder LP | Admin |
|---|---|---|
| Tags lesen (nicht-archivierte) | ✅ | ✅ |
| Tags lesen (inkl. archivierte) | ❌ | ✅ |
| Tag verwenden (an Frage anheften) | ✅ | ✅ |
| Tag erstellen (Quick aus Editor + Tab) | ✅ | ✅ |
| Tag umbenennen | ✅ | ✅ |
| Tag-Farbe ändern | ✅ | ✅ |
| Tag archivieren | ❌ | ✅ |
| Tags mergen | ❌ | ✅ |
| Tag endgültig löschen | ❌ | ✅ |
| Migration starten | ❌ | ✅ (One-Shot) |

Backend prüft `pruefeAdmin_(email)` für jede destruktive Aktion. Frontend versteckt Buttons für non-Admins.

## 9. Edge-Cases & Fehlerfälle

- **Case-Insensitive Dedup bei Migration:** „aktuell" und „Aktuell" → 1 Tag mit häufigstem Casing als kanonischem Namen (Tie-Break: alphabetisch erstes).
- **Whitespace bei Migration:** vor Dedup `trim()`. Leere Tags werden gedroppt.
- **Sonderzeichen:** erlaubt (auch `/`, `&`, `-`). Nur `<`, `>`, `"`, `'` werden HTML-escaped beim Render.
- **Konkurrierende Tag-Erstellung:** 2 LPs erstellen gleichzeitig „aktuell" → Backend `apiCreateTag` macht case-insensitive Existenz-Check und gibt den existierenden zurück statt Duplikat.
- **Verwendungs-Anzahl-Performance:** Zählung clientseitig über `fragensammlungStore.summaries`. Bei 5000 Fragen × 30 Tags ist O(n) Lookup-OK (~5ms). Plan-Phase prüft + `useMemo`-Cached.
- **Hard-Delete mit referenced Tag:** Backend wirft `400` mit `{fehler: 'Tag wird noch von 12 Fragen verwendet'}`. Frontend zeigt Toast „Erst archivieren oder Fragen umtaggen".
- **Migrations-Idempotenz:** `Tags`-Sheet nicht leer + neue Migration angefordert → `400` Fehler.
- **Frage hat unbekannte tagId:** nach Cluster-D-Bulk-Operation oder Hard-Delete kann ein orphaned `tagId` an einer Frage hängen. Frontend rendert nur bekannte Tags, ignoriert orphans + zeigt einmaligen Konsole-Warning pro Frage.
- **Mergen während andere LPs offline:** kein Lock-Mechanismus. Andere LPs sehen Effekt beim nächsten Reload (Cache-Invalidierung).
- **Migration läuft länger als Apps-Script-Limit (6 min):** Plan-Phase entscheidet Batches-Strategie nach Frage-Anzahl-Audit.
- **Backend-Migration crasht in Mitte:** Tags-Sheet ggf. teilweise befüllt, Fragen ggf. teilweise umgeschrieben. Idempotenz-Check verhindert Re-Run, aber Frontend zeigt klare Fehlermeldung mit Hinweis „Manueller Eingriff nötig — Tags-Sheet leeren". Plan-Phase erwägt Atomarität-Strategie (z.B. erst alle Tag-Objects, dann erst Frage-Updates).

## 10. Test-Strategie

### 10.1 Unit-Tests (Vitest)

- `tagsStore`: ladeAlleTags, upsertLokal, entferneLokal, getById.
- `tagsApi`-Wrapper: error-handling, Type-Mapping.
- `useFragenFilter` mit `tagIds`-Lookup statt String-Array (Regression-Schutz).
- Migrations-Helper-Funktionen (Dedup, Trim, Casing-Auswahl): Test-Cases mit verschiedenen Casing-Verteilungen.
- `TagPicker`-Komponente: Quick-Erstellen-Flow, Multi-Select, Keyboard-Nav.
- Verwaltungs-Tab: Verwendungs-Anzahl-Berechnung, Filter+Suche, Mergen-Modus-Toggle.

### 10.2 Backend-Tests (Apps-Script via simulierte Inputs)

- `apiCreateTag` mit existierendem Namen → gibt existierenden zurück, kein Duplikat.
- `apiUpdateTag` ändert Name, andere Tags unverändert.
- `apiArchiveTag` setzt `archiviert=true`, Tag bleibt im Sheet.
- `apiMergeTags` ersetzt korrekt + archiviert merged Tags.
- `apiMigriereTagsZuObjects` idempotent.
- `apiHardDeleteTag` wirft Fehler wenn referenced.
- `pruefeAdmin_` blockt non-Admin auf destruktiven Endpoints.

### 10.3 Browser-E2E (Live-Backend, echte Logins)

1. **Migration:** Admin migriert einmalig im Test-Repo. Sheet befüllt, Fragen umgeschrieben, alte UI funktioniert noch.
2. **Picker-Verwendung:** LP öffnet Frage → Tag-Picker zeigt vorhandene Tags → wählt 2 → speichert → Frage hat 2 tagIds.
3. **Quick-Erstellen:** LP tippt neuen Tag-Namen → Enter → Tag erstellt + sofort gewählt.
4. **Tab-Übersicht:** LP öffnet Tag-Tab in Einstellungen, sieht Liste mit Verwendungs-Anzahl.
5. **Umbenennen:** LP benennt Tag um → Effekt sofort an Fragen sichtbar (Reload nötig oder Live-Refresh).
6. **Farbe ändern:** LP wählt neue Farbe → Picker im Editor zeigt sofort die neue Farbe.
7. **Archivieren (Admin):** Admin archiviert Tag → unsichtbar im Picker, alte Fragen behalten ihn (nur unsichtbar im Listings).
8. **Mergen (Admin):** Admin merged 3 Tags → Confirm-Modal mit „47 Fragen werden umgehängt", bestätigt → 47 Fragen haben jetzt Master-Tag.
9. **Hard-Delete (Admin):** Admin versucht Tag mit Verwendung zu löschen → Fehler-Toast. Archiviert ihn stattdessen.
10. **Non-Admin:** Sieht keine Mergen/Archivieren/Löschen-Buttons.
11. **Konkurrierende Erstellung:** 2 Browser-Tabs erstellen gleichzeitig „aktuell" → beide bekommen den selben Tag zurück, kein Duplikat.

### 10.4 Visuelle Verifikation

- Vor/Nach: Tag-Picker im Editor mit Quick-Erstellen-Button.
- Tag-Verwaltungs-Tab mit Liste + Mergen-Modus.

## 11. Out-of-Scope (eigene Cluster später)

- **Tag-Hierarchie / Kategorien:** bleibt flach (entschieden, §3 Entscheidung 2).
- **Tag-Suche per `?tag=…` URL-Param:** kann an Cluster C.3 anhängen.
- **Tag-Vorschläge per KI:** out-of-scope.
- **Tag-Statistik-Dashboard:** Verwendungs-Anzahl im Tab reicht.
- **Tag-Verwendung in Übungen/Prüfungen-Filtern:** heute filtern Übungen+Prüfungen nicht nach Tags — wenn gewünscht, eigener Cluster.
- **Multi-Sprach-Tags:** out-of-scope (Schule ist Deutsch).
- **Audit-Log für Tag-Aktionen:** Cluster D bringt Bulk-Audit, Cluster H läuft ohne dediziertes Audit (Aktionen sind ohnehin auditierbar via Sheet-History).
- **Drag-and-Drop für Tag-Reihenfolge an Frage:** unnötig, Tags sind unsortiert.

## 12. Abhängigkeiten zu anderen Clustern

- **Cluster C** (globale Suche): Tag-Such-Adapter in `sucheAdapter.ts` muss nach Cluster H Phase 2 auf `tagsStore`-Lookup umgestellt werden — kleiner Patch (~10 Z.).
- **Cluster D** (Batch-Edit): nutzt Cluster H; Bulk-Tag-Add/Replace/Remove operiert auf `tagIds`. **Cluster D startet erst nach Cluster H Phase 3 (Cleanup).**
- **Cluster F** (Testdaten): orthogonal — Test-Tags können einfach erstellt werden, sind nicht extra markiert. Falls Test-Daten-Filter Tags ausblenden soll: separater Spawn-Task.
- **Cluster G** (Icons): Tag-Verwaltungs-UI nutzt Lucide-Icons (`Tag`, `Plus`, `Archive`, `MoreVertical`, `Combine` für Mergen). ICON_MAP-Pattern aus Cluster C.

## 13. Offene Punkte (vor Implementation klären)

- **Apps-Script-Migrations-Performance:** Bei wieviel Fragen reicht 6-Min-Limit? Plan-Phase greppt aktuelle Frage-Anzahl im Repo + entscheidet Batch-Strategie.
- **Admin-Konstrukt:** Plan-Phase greppt `AdminTab.tsx` und verwandte Files, klärt wie heute „Admin" definiert ist (vermutlich Email-Whitelist im Configs-Sheet `Lehrpersonen`, mit Spalte `istAdmin`). Cluster H nutzt das bestehende Konstrukt.
- **TagPicker-Pfad:** in `packages/shared/src/editor/components/` (re-use für andere Surfaces) oder nur in ExamLab? Plan-Phase entscheidet je nach Verwendungs-Bedarf.
- **Atomarität bei Migration-Crash:** Wenn Backend-Crash nach Tag-Object-Schreiben aber vor Frage-Update — wie aufräumen? Plan-Phase erwägt: erst alle Tag-Objects schreiben, dann Frage-Updates in einer Transaktion (Apps-Script-Lock-Service).
- **Live-Refresh nach Tag-Update:** soll das Frontend Tag-Updates anderer LPs sofort sehen oder erst beim Reload? Pragmatisch: erst beim Reload + Cache-Invalidierung (kein WebSocket).
- **Cluster-D-Verzögerung:** Cluster D wartet auf Cluster H Phase 3 (Cleanup, ~2 Wochen Live-Betrieb). Soll Cluster D direkt nach Phase 2 starten (schneller, aber mit Legacy-Fallback im Code) oder erst nach Phase 3 (sauberer)? Empfehlung Plan-Phase: nach Phase 2 starten, weil 2 Wochen Wartezeit viel ist.

## 14. Migration-Roadmap (Phasen)

| Phase | Inhalt | Aufwand |
|---|---|---|
| 0 | Backend-Setup: `Tags`-Sheet + 6 CRUD-Endpoints + Migrations-Endpoint. Frontend-Service-Wrapper + `tagsStore`. Type-Definition. Tests. | 1 Tag |
| 1 | One-Shot-Migration via Admin-Button. Live-Verifikation: Tag-Sheet befüllt, Fragen haben `tagIds`, alte UI funktioniert noch. | 0.5 Tag |
| 2 | Lese-/Schreibpfade umstellen: `useFragenFilter`-Hybrid raus, `speichereFrage` schreibt `tagIds`, `globaleSuche` umgestellt. Verwaltungs-Tab + Tag-Picker live. | 1.5 Tage |
| 3 | Cleanup nach 2 Wochen: `tagsLegacy`-Spalte raus, Frontend-Fallback raus. Hard-Cut. | 0.5 Tag |
| Tests | Unit + Backend + Browser-E2E parallel zu Phasen. | 0.5 Tag |
| **Total** | | **~4 Tage** (1 Woche mit Hotfix-Puffer) |
