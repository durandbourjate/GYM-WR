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
- Output zur Information für User-Tasks-Schätzung.

### 10.2 Phase Migration — One-Shot-Skript

Re-use `batchUpdateFragenMigration` Endpoint (Admin-only, IDOR-safe, aus C9 Phase 4).

`ExamLab/scripts/migrate-dragdrop-multi-zone/`:

- `dump.mjs` — fetch alle `dragdrop_bild` Fragen aus Sheet.
- `migrate.mjs` — pro Frage transformieren:
  ```js
  // Pro Zone:
  zone.korrekteLabels = zone.korrektesLabel ? [zone.korrektesLabel] : []
  delete zone.korrektesLabel
  // Pool:
  frage.labels = frage.labels.map(text => ({ id: nanoid(8), text }))
  // Markierung:
  frage.pruefungstauglich = false  // LP muss bestätigen
  ```
- `upload.mjs` — Batch-Upload via `batchUpdateFragenMigration`.
- `SESSION-PROTOCOL.md` — Schrittfolge wie C9.

### 10.3 Migrations-Reihenfolge (zwingend)

1. **Apps-Script-Deploy mit Dual-Read** (`LOESUNGS_FELDER_` erweitert um `korrekteLabels`).
2. **Frontend-Deploy mit Adapter** (Editor + Renderer + Korrektur lesen beide Felder, schreiben nur neues; SuS-Stack-UI; Konverter).
3. **Stichprobe-Migration** (5-10 Fragen) → Re-Dump-Verifikation.
4. **Full-Run-Migration** über alle Bestand-Fragen.
5. **Cleanup-Bundle** (separat, ca. 2 Wochen Stabilität später) — Dual-Read entfernen, alte Felder aus Code.

Sequenz analog C9: Backend kennt beide Felder, bevor Frontend irgendwas neu schreibt.

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
| `dragdropBildUtils.test.ts` (falls neu) | `labelMap`-Helper, `gruppiereStacks`-Helper |
| Apps-Script Test-Shim `testDragDropMultiZonePrivacy_` | Bereinigung beider Felder + Erklärungs-Modi |

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
| 8 | Nicht-deterministische ID-Generierung im Editor verursacht Re-Render-Loops | IDs nur **einmal** beim Mount des Editors generieren (`useState`-Init oder `useMemo`-mit-stabilem-Key). Niemals pro Render. |

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
| 10 | Merge nach `main` |

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
