# Bundle J — DnD-Bild Multi-Zone-Datenmodell-Migration (Design-Spec)

**Datum:** 2026-04-28
**Bundle:** J (Out-of-Scope-Folge von Bundle H)
**Scope:** ExamLab — Drag&Drop-Bild-Fragetyp
**Status:** Spec-Entwurf

---

## 1. Ausgangslage

Bundle H hat zwei DnD-Bild-Probleme als Out of Scope deklariert, weil sie eine Datenmodell-Migration erfordern:

1. **Multi-Zone-Bug** — zwei Zonen mit identischem `korrektesLabel` führen heute zwingend zu einer falsch ausgewerteten Zone.
2. **Multi-Label-Akzeptanz pro Zone** — `bilder-in-pools.md` Regel 5 verlangt: „Zonen MÜSSEN mehrere Labels akzeptieren". Im ExamLab-Datenmodell heute nicht möglich.

Die ursprüngliche Bundle-H-Diagnose („Korrektur-Algorithmus indiziert `zuordnungen[korrektesLabel]` als Map-Key") ist ungenau. Der Frontend-Algo (`autoKorrektur.ts:485`) indiziert per **Zone-ID**. Die echte Bug-Mechanik:

- Antwort-Format `zuordnungen: Record<labelText, zoneId>` — ein Label-String kann nur in **einer** Zone liegen (Map-Key).
- SuS-Pool ist `dedupedLabels` (Bundle H Phase 9.2, case-sensitive) — Pool kann faktisch keine Duplikate enthalten.
- Bei zwei Zonen mit identischem `korrektesLabel='Aktiva'` kann SuS „Aktiva" nur einmal platzieren → eine Zone bleibt zwingend leer → falsch.

Bundle J adressiert beides in einer Datenmodell-Migration, um eine zweite Bestand-Migration zu vermeiden.

## 2. Ziele

- DnD-Bild-Fragen können mehrere Zonen mit identischem korrektem Label haben (Multi-Zone).
- Eine Zone kann mehrere alternative Texte als korrekt akzeptieren (Multi-Label / Synonyme).
- Bestehende Fragen migrieren ohne Verhaltensänderung (1:1-Mapping `string` → `string[]`).
- Erweiterung des LP-Editors auf neues Datenmodell, mit minimaler UX-Disruption.
- SuS-UX bleibt vertraut: Pool zeigt Stacks mit Counter, Drag/Tap-Mechanik unverändert.

## 3. Nicht-Ziele (Out of Scope)

- **Echte Templates mit unbegrenzter Wiederverwendung** — eigene Frage-Variante, separater Bundle bei Bedarf.
- **Visuelles Drag-Setup im LP-Editor** — komplette UI-Neugestaltung, separater Bundle bei Bedarf.
- **Auto-Sync-Pool aus Zonen** — separates Datenmodell, separater Bundle bei Bedarf.
- **Performance-Audit** — Bundle I, eigener Spec.
- **Cleanup-Phase** (Dual-Read-Code entfernen) — eigener Bundle in ca. 2 Wochen nach Migration-Stabilität, sobald keine alten Daten mehr im System sind.

## 4. Use-Cases (User-bestätigt)

LP-Beispiele aus dem W&R-Unterricht:

- **Bilanz-Schema** — mehrere „Aktiva"- oder „Passiva"-Zonen
- **T-Konto-Beschriftung** — drei T-Konten mit je „Soll" und „Haben" als Bezeichner
- **Saldo-Positionierung** — „Saldo" in mehreren T-Konten
- **Marketing-Mix** — Zone akzeptiert „Marketing-Mix" oder „4P" oder „McCarthys 4P"
- **Recht/OR** — analog Synonyme oder Mehrfach-Vorkommen

Generelle Aussage des LP: „Begriffe sollen mehreren Orten korrekt zugeordnet werden können — das erweitert die Art der möglichen Fragen."

## 5. Datenmodell

### 5.1 Frage-Typ (`packages/shared/src/types/fragen.ts`)

```ts
export interface DragDropBildZielzone {
  id: string
  form: 'rechteck' | 'polygon'
  punkte: { x: number; y: number }[]
  /** Min. 1 Eintrag Pflicht. Mehrere = Synonyme. Match: text.trim().toLowerCase(). */
  korrekteLabels: string[]
  /** @deprecated entfällt nach Cleanup-Bundle. Dual-Read in Migrations-Phase. */
  korrektesLabel?: string
  /** Teilerklärung (C9) — welches Label hierhin gehört und warum. */
  erklaerung?: string
}

export interface DragDropBildLabel {
  /** Stabile Instanz-ID, generiert beim Editor-Speichern. Ohne Lösungs-Info. */
  id: string
  text: string
}

export interface DragDropBildFrage extends FrageBase {
  typ: 'dragdrop_bild'
  fragetext: string
  bildUrl: string
  bildDriveFileId?: string  // legacy
  bild?: MediaQuelle
  zielzonen: DragDropBildZielzone[]
  /** Pool-Tokens mit IDs. Duplikate erlaubt (Multi-Zone-Tokens). */
  labels: DragDropBildLabel[]
  /** @deprecated entfällt nach Cleanup-Bundle. */
  legacyLabels?: string[]
}
```

### 5.2 Antwort-Typ (`ExamLab/src/types/antworten.ts`)

```ts
| { typ: 'dragdrop_bild'; zuordnungen: Record<string, string> }
//                                       ^labelId    ^zoneId
//                                       (vorher: labelText → zoneId)
```

**Begründung:** Der Wechsel von Text-Key zu ID-Key ist zwingend, weil bei Multi-Zone zwei Tokens mit identischem Text in unterschiedlichen Zonen liegen müssen.

### 5.2.1 Zentraler Frage-Normalizer (`ExamLab/src/utils/ueben/fragetypNormalizer.ts::normalisiereDragDropBild`)

Analog zum `normalisiereLueckentext`-Pattern (S118-Lehre, `.claude/rules/code-quality.md`): Daten aus Apps-Script werden am Eintrittspunkt normalisiert, nicht im UI-Code verzweigt. Damit ist Dual-Read an einer einzigen Stelle.

```ts
function normalisiereDragDropBild(frage: any): DragDropBildFrage {
  const labels = (frage.labels ?? []).map((l: any, i: number) => {
    if (typeof l === 'string') {
      return { id: stabilId(frage.id, l, i), text: l }
    }
    return { id: l.id ?? stabilId(frage.id, l.text ?? '', i), text: l.text ?? '' }
  })
  const zielzonen = (frage.zielzonen ?? []).map((z: any) => ({
    ...z,
    korrekteLabels: Array.isArray(z.korrekteLabels) && z.korrekteLabels.length > 0
      ? z.korrekteLabels
      : z.korrektesLabel
        ? [z.korrektesLabel]
        : [],
  }))
  return { ...frage, labels, zielzonen }
}
```

**`stabilId(frageId, text, index)`:** deterministischer Hash (`SHA-1(frageId + '|' + text + '|' + index)`, erste 8 chars base32). Index ist **zwingend** in der Signatur — bei zwei Labels mit identischem Text (Multi-Zone-Fall, Kern-Use-Case!) sonst ID-Kollision. Helper liegt in `packages/shared/src/util/stabilId.ts`, weil sowohl Frontend als auch Migrations-Skript ihn brauchen müssen (siehe Sektion 10.2).

**Wo der Frage-Normalizer aufgerufen wird (vollständige Liste der Lese-Pfade):**

| # | Pfad | Datei | Wann normalisieren |
|---|------|-------|--------------------|
| 1 | LP-Editor (Mount-Adapter) | `packages/shared/src/editor/typen/DragDropBildEditor.tsx` | `useState`-Init mit `frage`-Arg, `key={frage.id}` am Editor (S129-Lehre) |
| 2 | SuS-Renderer | `ExamLab/src/components/fragetypen/DragDropBildFrage.tsx` | `useMemo([frage.id])` am Top |
| 3 | Auto-Korrektur (Prüfen) | `ExamLab/src/utils/autoKorrektur.ts::korrigiereDragDropBild` | Erste Zeile der Funktion |
| 4 | Üben-Korrektur | `ExamLab/src/utils/ueben/korrektur.ts:226` | Erste Zeile der DnD-Logik |
| 5 | Antwort-Status-Detektor | `ExamLab/src/utils/antwortStatus.ts:142` | Erste Zeile von `istDnDBildBeantwortet` |
| 6 | LP-Korrektur-Vollansicht | `ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx:535` | `useMemo([frage.id])` am Top des dragdrop_bild-Branch |
| 7 | Druckansicht | `ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht.tsx:734` | An derselben Stelle |
| 8 | Üben-Store-Merge | `ExamLab/src/store/ueben/uebungsStore.ts:65` | `mergeById(merged.labels, slice.labels)` setzt voraus dass beide Seiten normalisiert sind — Normalizer im Caller (vor Merge) |
| 9 | Pool-Konverter | `ExamLab/src/utils/poolConverter.ts:550` | Im case-Branch direkt ausgeführt (Pool-Format ist anders, aber Output-Frage muss normalisiert sein) |
| 10 | Frage-Factory | `packages/shared/src/editor/fragenFactory.ts:280` | Factory schreibt direkt neues Format (kein Normalizer nötig — Quelle ist „neu") |
| 11 | Util-Helpers | `ExamLab/src/utils/dragdropBildUtils.ts::labelsInZone/zoneKorrektBelegt` | Helper bekommen normalisierte Frage als Argument — keine eigene Normalisierung |
| 12 | Apps-Script-Bereinigung | `apps-script-code.js::bereinigeFrageFuerSuS_` | Schreibt nur `korrekteLabels`-Feld, bereinigt `korrektesLabel` weiterhin (Defense-in-Depth). String-Guard im `labels.map(Object.assign)` (S122-Lehre): `typeof l !== 'object' ? l : Object.assign({}, l)` |
| 13 | Apps-Script-Korrektur | `apps-script-code.js:2668-2672` | Eigener Apps-Script-Normalizer-Helper analog (Korrektur-Spiegel). |
| 14 | Demo-Frage `einr-dd-kontinente` | `apps-script-code.js:8223` (`labels: ['Nordamerika',...]`) | Beim Frontend-Deploy bleibt String-Format, läuft durch Normalizer-Pfad 2/3 — funktioniert. Kann später beim Cleanup auf neues Format aktualisiert werden. |

Tests (Sektion 11) decken alle 14 Pfade ab — pro Pfad mindestens ein Multi-Zone-Test, der ohne Normalizer falsch korrigieren würde.

### 5.2.2 Zentraler Antwort-Normalizer (`normalisiereDragDropAntwort`)

Schema-Wechsel von `Record<labelText, zoneId>` (alt) auf `Record<labelId, zoneId>` (neu) bricht persistierte Antworten in IndexedDB (`pruefung-backup.antworten`) und im Sheet (`Antworten`-Tab). Antwort-Normalizer mappt am Lese-Eintrittspunkt:

```ts
function normalisiereDragDropAntwort(
  antwort: { typ: 'dragdrop_bild'; zuordnungen: Record<string, string> },
  frage: DragDropBildFrage,
): { typ: 'dragdrop_bild'; zuordnungen: Record<string, string> } {
  const labelById = new Map(frage.labels.map(l => [l.id, l]))
  const labelByText = new Map(frage.labels.map(l => [l.text.trim().toLowerCase(), l.id]))
  const out: Record<string, string> = {}
  for (const [key, zoneId] of Object.entries(antwort.zuordnungen ?? {})) {
    if (labelById.has(key)) {
      out[key] = zoneId  // bereits ID-Key
    } else {
      const id = labelByText.get(key.trim().toLowerCase())
      if (id) out[id] = zoneId  // Pre-Migration text-Key → id-Key
    }
  }
  return { ...antwort, zuordnungen: out }
}
```

**Eindeutigkeit der Text→ID-Auflösung:** Pre-Migration-Pools hatten dank `dedupedLabels` (Bundle H Phase 9.2) keine identischen Text-Duplikate auf SuS-Seite. Daher ist die Auflösung `text → labelId` für persistierte Antworten **immer eindeutig**. Nach Migration werden Antworten direkt mit ID-Key geschrieben — der Normalizer wird zur No-Op für neue Daten.

**Aufruf-Stellen:** überall wo eine Antwort gelesen wird — Pfade 3, 4, 5, 6 aus Tabelle 5.2.1, plus IndexedDB-Restore in `autoSave.ts::restoreFromIndexedDB`. Schreib-Pfade (autoSave-Persist) nutzen das neue ID-Format direkt.

Antwort-Normalizer wird **vor** dem Frage-Normalizer aufgerufen — er braucht die normalisierte Frage als Kontext.

### 5.3 Korrektur-Logik (`ExamLab/src/utils/autoKorrektur.ts::korrigiereDragDropBild`)

```ts
function korrigiereDragDropBild(frage, antwort) {
  const labelMap = new Map(frage.labels.map(l => [l.id, l]))
  const punkteProZone = frage.punkte / Math.max(1, frage.zielzonen.length)
  const details: KorrekturDetail[] = []

  for (const zone of frage.zielzonen) {
    const platzierteTexte = Object.entries(antwort.zuordnungen)
      .filter(([, zid]) => zid === zone.id)
      .map(([lid]) => labelMap.get(lid)?.text?.trim().toLowerCase())
      .filter((t): t is string => !!t)

    const sollSet = new Set(zone.korrekteLabels.map(s => s.trim().toLowerCase()))
    const korrekt = platzierteTexte.some(t => sollSet.has(t))

    details.push({
      bezeichnung: `Zone: ${zone.korrekteLabels.join(' / ')}`,
      korrekt,
      erreicht: korrekt ? punkteProZone : 0,
      max: punkteProZone,
      kommentar: korrekt ? undefined : (platzierteTexte.length
        ? `Zugeordnet: ${platzierteTexte.join(', ')}`
        : 'Nicht zugeordnet'),
    })
  }

  const erreich = details.reduce((s, d) => s + d.erreicht, 0)
  return {
    erreichtePunkte: Math.round(erreich * 100) / 100,
    maxPunkte: frage.punkte,
    details,
  }
}
```

**Multi-Zone funktioniert automatisch:** zwei Zonen mit `korrekteLabels: ['Aktiva']` + Pool mit `[{id:'L1', text:'Aktiva'}, {id:'L2', text:'Aktiva'}]`. SuS legt jede Aktiva-Instanz in eine der beiden Aktiva-Zonen → beide korrekt. Reihenfolge egal.

**Multi-Label-Akzeptanz funktioniert automatisch:** Zone mit `korrekteLabels: ['Marketing-Mix', '4P']` + Pool mit beliebigem Token aus dieser Liste → korrekt.

## 6. LP-Editor-UX (Option α — klassisch erweitert)

Bestehende Editor-Struktur bleibt, zwei Anpassungen:

### 6.1 Pro Zone — Chip-Input für Synonyme

- Heute: 1 Text-Input pro Zone für `korrektesLabel`
- Neu: Chip-Liste pro Zone (Add per Enter, Remove per X). Bestehende Pflichtfeld-Outline-Logik (Bundle H) bleibt — Zone ohne Chips = leer = Pflichtfeld-Outline.
- Default beim Anlegen einer Zone: 1 Chip „Label N" (wie heute der String-Default).
- Bulk-Paste-Modal aus Bundle H bleibt, akzeptiert komma-/zeilen-getrennte Eingabe.
- Beim Speichern: `korrekteLabels: [...new Set(chips.map(s => s.trim()))].filter(Boolean)` — leer wird beim Trim weggeworfen, Duplikate dedupliziert.

### 6.2 Pool-Editor — Liste mit Duplikaten erlaubt

- UI bleibt Tag-Input wie heute (LP gibt Texte ein).
- Beim Hinzufügen wird intern eine stabile ID generiert (`crypto.randomUUID().slice(0, 8)` oder vorhandener `genId()`-Helper).
- **Duplikate sichtbar:** zwei Chips „Aktiva" werden zwei separate Items in der Liste — visuell wie zwei Bausteine, intern via ID unterscheidbar.
- Bulk-Paste-Modal: `Aktiva, Aktiva, Aktiva, Passiva, Übertrag` erzeugt 5 Pool-Items mit eindeutigen IDs.
- Bestehende Bundle-H-Pool-Dedupe-Warnung wird **entfernt** (Duplikate sind jetzt Feature).

### 6.3 Was aus Bundle H entfällt

- `DoppelteLabelDialog` (Warnung beim Speichern wenn zwei Zonen identisches `korrektesLabel`) → **entfernt**, Multi-Zone ist Feature.
- Pool-Dedupe-Warnung (Bundle H Phase 9.2 case-sensitive) → **entfernt**.

### 6.4 Konsistenz-Hinweise (rein informativ, nicht blockierend)

Match-Logik: `text.trim().toLowerCase()`. Hinweise erscheinen unter dem Editor:

- ⚠️ „Zone 3 akzeptiert 'Soll', aber Pool hat 0 Tokens mit Text 'Soll'" — wahrscheinlich Fehler.
- ℹ️ „Pool hat 5× 'Aktiva', 3 Zonen akzeptieren 'Aktiva' (= 2 Distraktoren)" — Info.
- ℹ️ „Pool-Token 'Saldo' passt zu keiner Zone" — wahrscheinlich Distraktor (oder Tippfehler).

Hinweise blockieren das Speichern nicht. LP entscheidet.

### 6.5 Migrations-Adapter beim Editor-Mount

Beim Öffnen einer alten Frage:

- `frage.zielzonen[i].korrektesLabel: 'X'` → Chip-Input zeigt `['X']`.
- `frage.labels: ['A', 'B']` (string[]) → Pool-Editor zeigt `[{id, text:'A'}, {id, text:'B'}]`, IDs werden beim Mount generiert und beim ersten Speichern persistiert.

Beim Speichern wird **immer** das neue Modell geschrieben. Das alte Feld (`korrektesLabel`) wird bewusst **nicht mehr** gesetzt — der Cleanup-Bundle entfernt später die Dual-Read-Logik.

## 7. SuS-UX (Stacked-Tokens, Variante A2)

### 7.1 Pool-Anzeige

- Pool gruppiert Tokens nach `text` für die Anzeige (UI-Aggregation, Datenmodell unverändert).
- Counter wird angezeigt **wenn Stack > 1 Instanz**: `Soll ×3`. Bei Stack = 1: kein Counter (sieht aus wie heute).
- Beim Tap auf Stack: nächste verfügbare Label-ID wird ausgewählt (deterministisch, z.B. erste).
- Bei letzter Platzierung verschwindet der Stack aus dem Pool (Counter = 0).

### 7.2 Drag/Tap-Mechanik

- Mobile-Pattern aus `bilder-in-pools.md` (Tap-to-Select → Tap-to-Place) bleibt unverändert.
- HTML5-Drag-API weiterhin **nicht** verwendet (Touch-Inkompatibilität).
- SuS-State: `zuordnungen: Record<labelId, zoneId>`. Setter-Logik:
  - Platzieren: `{ ...zuordnungen, [labelId]: zoneId }`.
  - Entfernen: `delete zuordnungen[labelId]`.
- Token aus Zone zurück in Pool ziehen: Counter +1, Stack erscheint wieder wenn vorher verschwunden.
- **Stack-Pick-Determinismus:** Beim Tap auf einen Stack wird die Label-Instanz mit dem **kleinsten Index in `frage.labels`**, deren `id` noch nicht in `Object.keys(zuordnungen)` vorkommt, ausgewählt. Damit ist die Auswahl nach Re-Render konsistent und nicht zufällig.

### 7.3 Zone-Anzeige (innen)

- Wie heute: platzierte Labels als Chips innerhalb der Zone (Texte werden über Label-Map aus Frage aufgelöst).
- Mehrere Tokens pro Zone weiterhin möglich (heute schon so).
- Zone-Outline-Style aus Bundle H bleibt (leer = Outline aktiv).

### 7.4 Korrektur-Phase (Üben-Modus, `modus='loesung'`)

- Pro Zone Soll-Anzeige bei Multi-Label: „**Marketing-Mix** oder **4P** oder **McCarthys 4P**" (Komma-separiert).
- Bei Single-Label: wie heute „**Aktiva**" (kein „oder").
- Erklärung (C9 Teilerklärung) bleibt unverändert.
- Layout aus C9 Phase 2/3 bleibt (`AntwortZeile`, `MusterloesungsBlock`, `ZoneLabel`).

### 7.5 Beispiel-Flow FiBu-T-Konto

- 3 T-Konten, je 2 Zonen (Soll, Haben) = 6 Zonen.
- LP-Pool: `[Soll, Soll, Soll, Haben, Haben, Haben, Saldo]` → 7 Tokens, 1 Distraktor („Saldo").
- SuS sieht: `Soll ×3 | Haben ×3 | Saldo`.
- Korrekt: jede Soll-Instanz in einer der drei Soll-Zonen, jede Haben-Instanz in einer Haben-Zone. „Saldo" bleibt im Pool — keine Zone akzeptiert „Saldo" → 0 Punkte Abzug für Distraktor (heute auch so).

## 8. Privacy / Anti-Cheat

### 8.1 Apps-Script `bereinigeFrageFuerSuS_`

`LOESUNGS_FELDER_` erweitert:

```js
{ feld: 'zielzonen', subFelder: ['korrektesLabel', 'korrekteLabels', 'erklaerung'] },
//                                ↑ legacy weiter löschen   ↑ neu
```

- `zielzonen[i].korrekteLabels` → entfernt für SuS-Prüfen.
- `zielzonen[i].korrektesLabel` (Legacy) → wird weiter entfernt — sicherheitskritisch, falls die Cleanup-Bundle verschoben wird.
- `zielzonen[i].erklaerung` → wie heute, nur in Üben-Modus mit `behalteErklaerung=true` sichtbar.
- `labels: [{id, text}]` → bleibt unverändert. **Begründung:** Text wird auf SuS-Seite zur Anzeige gebraucht; IDs sind stabil und enthalten keine Lösungs-Information.

### 8.2 ID-Determinismus

- Label-IDs werden beim **Editor-Speichern** generiert (oder beim Migrations-Skript einmalig).
- IDs sind **nicht render-abhängig** und **nicht zone-bezogen** (kein `id: 'L_zone1'`).
- Pattern: `crypto.randomUUID().slice(0, 8)` oder existierender `genId()`-Helper.
- Sicherheits-Test prüft: keine ID enthält `zone`, kein ID-Pattern korreliert mit Zone-Reihenfolge.

### 8.3 Sicherheits-Test (`securityInvarianten.test.ts`)

Erweitert um:

- Frage mit nur `korrekteLabels` → bereinigt entfernt es.
- Frage mit nur `korrektesLabel` (Legacy) → bereinigt entfernt es weiter.
- Frage mit beiden Feldern (Migrations-Übergang) → beide entfernt.
- `labels[].id`-Pattern enthält keine Zone-Information.
- `labels[].text` bleibt erhalten.

## 9. Pool-Konverter (`ExamLab/src/utils/poolConverter.ts:550`)

Pool-Format (`packages/shared/src/types/pool.ts`) ist Multi-Zone-fähig:

```ts
labels?: { id?: string; text?: string; x?: number; y?: number; zone?: string }[]
zones?: { id, x, y, w, h }[]
```

Alter Konverter:

```ts
korrektesLabel: (poolFrage.labels ?? []).find(l => l.zone === zone.id)?.text ?? ''
```

Neuer Konverter:

```ts
case 'dragdrop_bild': {
  const poolLabels = poolFrage.labels ?? []
  const zielzonen = (poolFrage.zones ?? []).map(zone => ({
    id: zone.id || genId(),
    form: 'rechteck' as const,
    punkte: [
      { x: zone.x, y: zone.y },
      { x: zone.x + zone.w, y: zone.y },
      { x: zone.x + zone.w, y: zone.y + zone.h },
      { x: zone.x, y: zone.y + zone.h },
    ],
    korrekteLabels: poolLabels
      .filter(l => l.zone === zone.id)
      .map(l => (l.text ?? '').trim())
      .filter(t => t.length > 0),
  }))
  const labels: DragDropBildLabel[] = poolLabels.map(l => ({
    id: l.id ?? genId(),
    text: l.text ?? '',
  }))
  return { ...basis, typ: 'dragdrop_bild', fragetext: poolFrage.q, bildUrl, zielzonen, labels }
}
```

`bilder-in-pools.md` Regel 5 ist damit endlich erfüllt — der Konverter sammelt jetzt alle Labels einer Zone, nicht nur das erste.

## 10. Bestand-Migration

### 10.1 Phase 0 — Audit

`ExamLab/scripts/audit-bundle-j/zaehleDragDropFragen.mjs`:

- Total `dragdrop_bild` Fragen → Migrations-Scope.
- Fragen mit Multi-Zone-Bug heute (≥2 Zonen identisches `korrektesLabel`, case-insensitive) → diese sollten nach Migration LP-Re-Edit (verhalten sich nach Migration gleich wie vorher, weil `korrekteLabels: ['X']` 1-elementig ist; LP muss Pool ergänzen damit Multi-Zone-Token-Anzahl stimmt).
- Fragen mit Distraktoren (`labels.length > zielzonen.length`) → Info.
- **Aktive `dragdrop_bild`-Üben-Sessions** im IndexedDB (Sheet `Übungssessions` falls vorhanden, sonst Skript-Note für User-Manual-Check) → Risiko-Kohorte für IndexedDB-orphan-Antworten.
- **`dragdrop_bild`-Antworten in laufenden (nicht beendeten) Prüfungen** im `Antworten`-Sheet → Risiko-Kohorte für Sheet-orphan-Antworten.
- Output zur Information für User-Tasks-Schätzung und Wahl des Migrations-Fensters.

### 10.2 Phase Migration — One-Shot-Skript

Re-use `batchUpdateFragenMigration` Endpoint (Admin-only, IDOR-safe, aus C9 Phase 4).

`ExamLab/scripts/migrate-dragdrop-multi-zone/`:

- `dump.mjs` — fetch alle `dragdrop_bild` Fragen aus Sheet.
- `migrate.mjs` — pro Frage transformieren:
  ```js
  import { stabilId } from '../../../packages/shared/src/util/stabilId.mjs'
  // Pro Zone:
  zone.korrekteLabels = zone.korrektesLabel ? [zone.korrektesLabel] : []
  delete zone.korrektesLabel
  // Pool — DESELBE stabilId-Funktion wie Frontend-Normalizer (Sektion 5.2.1):
  frage.labels = frage.labels.map((text, i) => ({
    id: stabilId(frage.id, text, i),
    text,
  }))
  // Markierung:
  frage.pruefungstauglich = false  // LP muss bestätigen
  ```
- `upload.mjs` — Batch-Upload via `batchUpdateFragenMigration`.
- `SESSION-PROTOCOL.md` — Schrittfolge wie C9.

**ID-Determinismus über die Migrations-Schwelle (zwingend):** Sowohl Frontend-Normalizer (Sektion 5.2.1) als auch Migrations-Skript verwenden **denselben** `stabilId(frageId, text, index)`-Algorithmus. Damit produziert das Migrations-Skript für eine Pre-Migration-Frage `{labels: ['Aktiva', 'Aktiva', 'Passiva']}` exakt dieselben IDs wie der Frontend-Normalizer beim Mount derselben Frage. SuS, die vor der Migration eine Antwort gespeichert haben (mit Frontend-Normalizer-IDs), bekommen nach Migration **identische** IDs aus dem Sheet — die Antwort matcht weiterhin. Tests in Sektion 11 verifizieren das Cross-Environment-Determinismus (Frontend + Node-Skript liefern für gleichen Input gleiche Output-IDs).

`stabilId`-Helper liegt deshalb in `packages/shared/src/util/stabilId.{ts,mjs}` — TypeScript-Variante für Frontend, ESM-Variante für Migrations-Skript, beide implementieren denselben SHA-1-Hash.

### 10.3 Migrations-Reihenfolge (zwingend)

1. **Apps-Script-Deploy mit Dual-Read** (`LOESUNGS_FELDER_` erweitert um `korrekteLabels`).
2. **Frontend-Deploy mit Normalizer** (Editor + Renderer + Korrektur rufen alle `normalisiereDragDropBild` auf — eine Stelle, vier Pfade. Schreibt nur neues Format. SuS-Stack-UI; Konverter.).
3. **Stichprobe-Migration** (5-10 Fragen) → Re-Dump-Verifikation.
4. **Full-Run-Migration** über alle Bestand-Fragen.
5. **Cleanup-Bundle** (separat, ca. 2 Wochen Stabilität später) — Normalizer-Dual-Read-Pfad entfernen, alte Felder aus Code, `legacyLabels`/`korrektesLabel` aus Type-Definitionen.

Sequenz analog C9: Backend kennt beide Felder, bevor Frontend irgendwas neu schreibt.

**Robustheit zwischen Schritten 2 und 4:** Im Fenster zwischen Frontend-Deploy und Migrations-Skript-Run können alte Bestand-Fragen weiterhin SuS gespielt werden — der Normalizer liefert für jede Frage immer das neue Modell, egal ob das Sheet `korrektesLabel` oder `korrekteLabels` enthält. Stable-IDs (Sektion 5.2.1) sichern, dass SuS-Antworten beim Reload denselben Label-Instanzen zugeordnet bleiben.

### 10.4 User-Tasks (im Plan zu detaillieren)

- Apps-Script Bereitstellung erstellen (neue Version).
- Google-Sheets-Backup vor Migration.
- Env-Variablen für Migrations-Skripte (analog C9).
- Stichprobe verifizieren.
- Full-Run starten.
- Multi-Zone-Bug-Fragen LP-Re-Edit (Pool-Tokens vermehren) — Anzahl aus Audit bekannt.

## 11. Tests

| Datei | Was getestet wird |
|---|---|
| `autoKorrektur.test.ts` | Multi-Zone (3 Aktiva-Zonen, 3 Aktiva-Tokens, beliebige Reihenfolge); Multi-Label (2 Synonyme); Mix (Multi-Zone + Synonyme); Distraktoren ignoriert; leere Zone falsch; Label-ID nicht in Pool ignoriert defensive |
| `DragDropBildEditorMultiZone.test.tsx` | Chip-Add per Enter, Chip-Remove per X, Pflichtfeld-Outline bei leeren Zonen, Pool-Duplikate-Erlauben, Konsistenz-Hinweise (Pool vs. Zonen-Bedarf), Migrations-Adapter (alte Frage öffnen → neue UI) |
| `DragDropBildFrageStacks.test.tsx` | Counter-Anzeige ab Stack ≥ 2, kein Counter bei Stack = 1, Tap-Mechanik wählt nächste ID, Pool-leer-bei-letzter-Platzierung, Drag-Back-zum-Pool inkrementiert Counter |
| `securityInvarianten.test.ts` | `korrekteLabels` entfernt für SuS, `korrektesLabel` (Legacy) entfernt, Erklärung-Privacy unverändert (C9), Label-ID-Determinismus (kein zone-Pattern) |
| `poolConverter.test.ts` | Multi-Label aus Pool-Zone-Attribut, Distraktoren ohne zone-Match werden Pool-Items ohne Zone-Bindung, IDs werden generiert wenn Pool-Format keine `id` hat |
| `dragdropBildUtils.test.ts` (falls neu) | `labelMap`-Helper, `gruppiereStacks`-Helper, deterministische Stack-Pick-Logik (kleinster Index nicht-platziert) |
| `fragetypNormalizer.test.ts` | `normalisiereDragDropBild` — Dual-Read alte/neue/gemischte Form. `stabilId`-Determinismus: 2 Labels mit gleichem Text bekommen unterschiedliche IDs. Token mit leerem Text wird ignoriert. `normalisiereDragDropAntwort` mappt Text-Key auf ID-Key (Pre-Migration-Antwort) und lässt ID-Key unverändert (Post-Migration). |
| `stabilId.test.ts` | Cross-Environment-Determinismus: Frontend-TS + Node-ESM liefern für gleichen `(frageId, text, index)` byte-identische Output-IDs. SHA-1-Hash + base32-encode-Kompatibilität. |
| `dragdropAntwortMigration.test.ts` | Pre-Migration-Antwort `{'Aktiva': 'z1'}` + post-migration-Frage mit `labels: [{id: stabilId(...), text: 'Aktiva'}]` → Antwort-Normalizer mappt korrekt. Bei Multi-Zone-Pool (2× 'Aktiva') wird Pre-Migration-Antwort korrekt aufgelöst (eindeutig dank `dedupedLabels`-Garantie). |
| Apps-Script Test-Shim `testDragDropMultiZonePrivacy_` | Bereinigung beider Felder + Erklärungs-Modi + S122-Type-Guard für `labels.map(Object.assign)` (heterogene String/Object-Pool-Items). |
| Apps-Script Test-Shim `testDragDropMultiZoneKorrektur_` | Spiegel-Korrektur im Backend (falls vorhanden) liefert gleiche Punkte wie Frontend für Multi-Zone- und Multi-Label-Cases. |

Test-Bestand vor Bundle J: 1082 vitest passes (S157). Ziel nach Bundle J: ≥1100.

## 12. Risiken & Mitigationen

| # | Risiko | Mitigation |
|---|--------|------------|
| 1 | Cleanup-Bundle wird nie gemacht → Dual-Read-Code-Schuld | Dual-Read-Code-Pfade explizit mit `// LEGACY: Cleanup-Bundle` markieren. ScheduleWakeup nach 2 Wochen für Cleanup-Reminder. |
| 2 | LP-Re-Edit der Multi-Zone-Bug-Fragen wird vergessen | Audit-Output ist User-Task-Liste mit Fragen-IDs. `pruefungstauglich=false` blockiert versehentliche Verwendung. |
| 3 | Apps-Script-Migration läuft mit altem Frontend → Crash | Migrations-Reihenfolge in Sektion 10.3 zwingend. Skript läuft erst NACH Frontend-Deploy. |
| 4 | ID-Kollisionen bei generierten IDs | `nanoid(8)` hat ~10^14 Kombinationen pro Frage; Frontend-Defensive: bei Mount-Adapter `Set` über IDs prüfen, regenerieren bei Kollision. |
| 5 | SuS-Stack-Zähler verrät Lösungsstruktur ohne Distraktoren | LP-Verantwortung: Distraktoren hinzufügen wenn Anti-Hint relevant. UI zeigt Hinweis im Editor wenn Pool exakt zu Zonen-Bedarf passt. |
| 6 | Browser-Test-Aufwand groß (alle Fragetypen-Risiko-Gruppen) | Test-Plan in Plan-Phase mit konkreten Pfaden. Verwandtschaftsgruppen aus `regression-prevention.md` einhalten. |
| 7 | Migrations-Skript bricht mid-run ab | `batchUpdateFragenMigration` ist idempotent (überschreibt selbe Felder). Resume möglich via Dump-Re-Lauf. |
| 8 | Nicht-deterministische ID-Generierung im Editor verursacht Re-Render-Loops | IDs nur **einmal** beim Mount des Editors generieren (`useState`-Init oder `useMemo`-mit-stabilem-Key `frage.id`). Niemals pro Render. |
| 9 | Adapter nur im Editor → Korrektur/Renderer crashen bei Bestand-Fragen ohne `korrekteLabels` | Zentraler `normalisiereDragDropBild` (Sektion 5.2.1) wird an **allen 14 Pfaden** aus der Pfad-Tabelle aufgerufen: Editor, SuS-Renderer, Auto-Korrektur, Üben-Korrektur, Antwort-Status-Detektor, LP-Korrektur-Vollansicht, Druckansicht, Üben-Store-Merge, Pool-Konverter, Frage-Factory, Util-Helpers, Apps-Script-Bereinigung, Apps-Script-Korrektur, Demo-Frage. `stabilId(frageId, text, index)` sichert Determinismus über mehrfache Mounts. |
| 10 | Persistierte SuS-Antworten (IndexedDB + Sheet) sind Pre-Migration text-keyed, aber Antwort-Schema wechselt auf id-keyed → Antwort-Verlust nach Frontend-Deploy | Antwort-Normalizer (Sektion 5.2.2) mappt am Lese-Eintrittspunkt Text-Keys auf ID-Keys. Pre-Migration-Pools hatten dank `dedupedLabels` keine identischen Texte → Mapping ist eindeutig. Schreibseite nutzt direkt neues ID-Format. |
| 11 | `stabilId`-Mismatch zwischen Frontend (Hash) und Migrations-Skript (`nanoid` random) → SuS-Antworten orphanen sich beim ID-Wechsel über die Migrations-Schwelle | Migrations-Skript verwendet **denselben** `stabilId(frageId, text, index)`-Algorithmus wie Frontend. Helper liegt in `packages/shared/src/util/stabilId.{ts,mjs}` und ist sowohl von Frontend als auch von Node-Skript importierbar. Cross-Environment-Determinismus-Test (`stabilId.test.ts`) verifiziert byte-identische Outputs. |
| 12 | S122-Bug in `bereinigeFrageFuerSuS_`: `Object.assign({}, l)` über String-Items → `{0:'A',1:'k',...}`-Char-Objekt | Type-Guard im Apps-Script `labels.map`-Pfad: `typeof l !== 'object' \|\| l === null ? l : Object.assign({}, l)`. Tests im Apps-Script-Shim (`testDragDropMultiZonePrivacy_`) decken heterogene `string \| object`-Pool-Items ab. |

## 13. Migrations-Phasen-Übersicht

(Detaillierter Plan kommt in separatem `writing-plans`-Schritt.)

| Phase | Inhalt |
|---|---|
| 0 | Audit-Skript bauen + ausführen, Aufwand-Schätzung |
| 1 | Datenmodell-Erweiterung in `packages/shared` (Dual-Read Types) + Adapter |
| 2 | Apps-Script `LOESUNGS_FELDER_` erweitern + Test-Shim + Deploy |
| 3 | LP-Editor Chip-Input + Pool-Duplikate + Konsistenz-Hinweise |
| 4 | SuS-Stacks + Drag/Tap-Mechanik mit Counter |
| 5 | Korrektur-Algorithmus auf Array-Match + Tests |
| 6 | Pool-Konverter `filter` statt `find` + Tests |
| 7 | One-Shot Migrations-Skript (dump, migrate, upload) |
| 8 | Stichprobe-Run + Full-Run + Verification |
| 9 | E2E Browser-Test (echte Logins, Multi-Zone-Frage, Multi-Label-Frage, Migrations-Frage) |
| 10 | Merge nach `main` + ScheduleWakeup-Reminder für Cleanup-Bundle nach 2 Wochen Stabilität (analog `bundle-h-schuelercode-removal-check`) |

## 14. Akzeptanzkriterien

- Multi-Zone-Frage (3× „Aktiva") wird in allen drei Zonen korrekt erkannt — beliebige Reihenfolge.
- Multi-Label-Frage (Zone akzeptiert „Marketing-Mix" oder „4P") wird mit beiden Synonymen korrekt.
- Bestand-Frage (vor Migration) verhält sich nach Migration **identisch** (1:1-Mapping ohne semantische Änderung).
- SuS-API-Response enthält weder `korrekteLabels` noch `korrektesLabel`.
- Sicherheits-Test grün (`securityInvarianten.test.ts` + Apps-Script-Shim).
- `tsc -b` + `vitest run` + `npm run build` grün im ExamLab-Modul.
- Browser-E2E auf Staging mit echten LP+SuS-Logins durchgeführt: LP erstellt Multi-Zone-Frage, SuS löst, Korrektur stimmt.
- Migrations-Skript: 100% der Bestand-Fragen erfolgreich aktualisiert, 0 Fehler.

---

**Nächster Schritt:** writing-plans-Skill → detaillierter Implementations-Plan mit Tasks, Reihenfolge, Tests pro Phase.
