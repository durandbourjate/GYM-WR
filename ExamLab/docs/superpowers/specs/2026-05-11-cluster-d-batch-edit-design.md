---
title: Cluster D — Batch-Edit Fragensammlung
date: 2026-05-11
updated: 2026-05-15
status: Spec-Update nach Cluster H Phase 2 LIVE — Plan-Phase ausstehend
verwandt: Cluster H (Tag-Object-Modell, Voraussetzung erfüllt), Cluster G (Icons, Brand-Farben), Cluster B (Floating-Bar im Layout), Cluster A (Optimistic-Delete Pattern)
---

# Cluster D — Batch-Edit Fragensammlung

> **Update 2026-05-15:** Post-Cluster-H-Phase-2-Spec-Refresh. Konkretes Tag-Object-Modell statt vager Verweis, Phase 0 für `status`-Feld vorgeschoben (heute nicht im Editor), Tag-Operations auf 3 Modi (Add/Replace/Remove) erweitert, Audit-Log via bestehender `auditLog_()`-Infrastruktur konkretisiert. Audit-Befund: 6 von 7 Batch-Feldern bereits im Editor (`fachbereich`/`bloom`/`gefaesse`/`semester`/`tagIds`/`lernzielIds`), nur `status` fehlt → Phase 0.

## 1. Zweck

LP soll in der Fragensammlung mehrere Fragen gleichzeitig anwählen und gemeinsam bearbeiten können (Fach, Bloom, Status, Gefäss, Semester, Tags, Lernziele) oder löschen. Heute kein Multi-Select; jede Frage muss einzeln editiert werden — bei 50+ Pflege-Aktionen unzumutbar.

User-Anforderung: „**unbedingt jeweils bestätigungsmodal damit nicht ausversehen viele fragendetails überschrieben werden**" — Sicherheit ist erste Priorität. Cluster D verwendet daher den **normalen Frage-Editor im Batch-Modus** statt einer eigenen Batch-Aktion-UI. Vorteile: bestehende Form-Validierung, weniger UI-Duplikation, eine konsistente Mental-Model.

## 2. Begriffe

- **Selection:** Set von Frage-IDs `Set<string>` über alle Filter-Zustände hinweg stabil.
- **Sichtbar:** Teilmenge der Selektion die im aktuellen Filter im UI sichtbar ist (z.B. 12 von 47).
- **Batch-Modus:** Frage-Editor mit Banner + violet markierten Feldern, gilt auf alle Selektion.
- **Batch-fähig:** Felder die gemeinsam für viele Fragen gesetzt werden können (Enums + Tags + Lernziele).
- **Batch-Action:** Direktaktion via Floating-Bar (z.B. Löschen) ohne Editor-Umweg.
- **Cross-Filter-Selektion:** Selektion bleibt erhalten wenn der User Filter wechselt — Plattform-Power-Feature.

## 3. Architektur-Entscheidungen

| # | Entscheidung | Begründung |
|---|---|---|
| 1 | **Checkbox pro Zeile** + **Floating-Action-Bar** unten bei ≥1 Selektion. | Etabliertes Pattern, Vorbild `BatchExportDialog`. |
| 2 | **Cross-Filter-Selektion** (D2-Power-Safe). Selektion stabil über Filter-Wechsel. | Power-Use ermöglicht (manuelle Selektion über Themen-Grenzen), durch Visibility-Indikator + Confirm-Warnung abgesichert. |
| 3 | **Edit via normalen Editor im Batch-Modus** statt eigener Action-Buttons pro Feld. | Eine UI, eine Form-Validierung, klare Mental-Model. Spart Pflege-Duplikation. |
| 4 | **Batch-fähige Felder violet hervorgehoben** (`ring-1 ring-violet-300 dark:ring-violet-700` + leichter Background `bg-violet-50/30 dark:bg-violet-900/10`). | Klare visuelle Trennung zu nicht-batch-baren Feldern. |
| 5 | **Tags-Feld hat 3-Modi-Radio** „Hinzufügen / Ersetzen / Entfernen". Default „Hinzufügen". | Alle 3 Operationen sind reale Use-Cases (Add: häufig; Replace: Tag-Standardisierung; Remove: Tag-Ausmusterung pro Frage-Gruppe). 3 Modi sind in API + UI symmetrisch. |
| 6 | **Confirm-Modal pro Batch-Save** mit klarer Aufzählung: was wird überschrieben vs hinzugefügt. | User-Anforderung. |
| 7 | **Löschen direkt im Floating-Bar** mit eigenem Confirm-Modal — ohne Editor-Umweg. | Standard-Pattern für destruktive Aktionen, kein Editor-Detour. |
| 8 | **„Auswahl auf Filter beschränken"-Button im Floating-Bar.** | User-Escape wenn zu viel selektiert ist. |
| 9 | **Backend bekommt neuen Bulk-Update-Endpoint** `apiBulkUpdateFragen(ids, patch)`. | Heute nur Single-Update + spezieller Lückentext-Bulk; generisches Pattern nötig. |
| 10 | **Shift-Click** für Range-Select zwischen zwei Checkboxen. | Standard-Pattern, beschleunigt manuelle Auswahl. |
| 11 | **Filter-Wechsel löscht Selektion NICHT.** Indikator zeigt sichtbar/gesamt. | Konsequenz aus Entscheidung 2. |
| 12 | **Audit-Log via bestehender `auditLog_()`-Infrastruktur** in Apps-Script. Sheet `AuditLog` (vorhanden). Eintrag `{action, email, details (JSON)}` mit `details = {count, affectedIds, failedIds, patch, tagsModus?, tagIds?}`. | Bestehende Infrastruktur bleibt single-source-of-truth; keine Sheet-Vermehrung; affectedIds ermöglichen späteren Undo-Cluster. |
| 13 | **Phase 0: `status`-Feld in Editor + Backend einbauen** bevor Batch-Phasen starten. | Audit-Befund 15.05.2026: `status` ist heute nur in ExamLab-Storage-Extension, fehlt in `FrageBase.ts` Core + im Editor. Batch-Modus piggy-backt auf Single-Editor — also muss Single-Edit für `status` zuerst funktionieren. |

## 4. Datenmodell

### 4.1 Selektions-State (neuer Store oder Hook)

`src/store/fragenSelectionStore.ts` (neu):

```ts
interface FragenSelectionState {
  selektiert: Set<string>;            // Frage-IDs
  toggle: (id: string, opts?: { shift?: boolean }) => void;
  setzeSelektion: (ids: Set<string>) => void;
  leereSelektion: () => void;
  alleSichtbarenAuswaehlen: (sichtbareIds: string[]) => void;
  beschraenkeAufFilter: (sichtbareIds: string[]) => void;
}
```

- Range-Select (Shift-Click) braucht „letzte geklickte ID" als Referenz im Store.
- `Set<string>` für O(1)-Lookup bei Checkbox-Render.

### 4.2 Batch-Update-API (`src/services/fragenApi.ts`)

```ts
interface FragenBulkPatch {
  fachbereich?: 'VWL' | 'BWL' | 'Recht' | 'Informatik' | 'Allgemein';
  bloom?: 'K1'|'K2'|'K3'|'K4'|'K5'|'K6';
  status?: 'draft' | 'sammlung';        // Phase-0-Feld — siehe §3 #13
  gefaesse?: string[];                  // ('SF'|'EF'|'EWR'|'GF')[]
  semester?: string[];
  lernzielIds?: string[];

  // Tag-Operationen — Cluster-H-Phase-2-konform: Tag-IDs (UUID v4) aus tagsStore.
  // Backend resolved IDs intern, schreibt direkt in fragen-sheet `tagIds`-Spalte.
  // Genau eine der drei Felder darf gesetzt sein (mutually exclusive, Backend-Validierung).
  tagsHinzufuegen?: string[];    // tagIds = unique([...alteTagIds, ...neueTagIds])
  tagsErsetzen?: string[];       // tagIds = neueTagIds  (alte Tags weg)
  tagsEntfernen?: string[];      // tagIds = alteTagIds.filter(id => !neueTagIds.includes(id))
}

interface FragenBulkResult {
  erfolgreich: number;
  affectedIds: string[];
  fehlgeschlagen: string[];     // IDs die nicht aktualisiert werden konnten
}

export async function bulkUpdateFragen(ids: string[], patch: FragenBulkPatch, email: string): Promise<FragenBulkResult> { ... }
export async function bulkLoescheFragen(ids: string[], email: string): Promise<FragenBulkResult> { ... }
```

**Anmerkung Tag-Modell (post Cluster H Phase 2):**
- `Tag` lebt in `packages/shared/src/types/tag.ts`: `{id, name, farbe (TagFarbe), archiviert, erstelltAm, erstelltVon}`.
- Frage-Lookup heute über `useTagsStore(s => s.getByIds(ids))` (Hook) bzw. `useTagsStore.getState().getByIds(ids)` (Effects). Pattern unverändert übernehmen.
- `tagsStore.upsertLokal` für Optimistic-Updates **nach** Bulk-Add (Tag selber existiert ja bereits — nur Frage-tagIds-Spalte ändert sich).
- Falls User im Batch-Editor neuen Tag anlegt: bestehender DI-Slot-Pattern (`erstelleTag`-Closure aus `PruefungFragenEditor.tsx:100-117`) wiederverwenden.

### 4.3 Backend (Apps-Script)

Neuer Endpoint `apiBulkUpdateFragen` + `apiBulkLoescheFragen` im `doPost`-Router. Implementation iteriert intern über IDs, batched die Updates auf Drive/Sheets. Partial-Success-Response listet fehlgeschlagene IDs.

**Mutually-Exclusive-Validation:** Wenn mehr als ein `tags*`-Feld im Patch → 400-Response mit klarer Fehlermeldung. Frontend stellt das bereits via Radio sicher; Backend doppelt sicher.

**Audit-Log nach erfolgreichem Sheet-Schreib-Pfad** (siehe §3 #12, §4.4).

### 4.4 Audit-Log-Format

Bestehende Funktion `auditLog_(action, email, details)` in `apps-script-code.js:384-394` schreibt in Sheet `AuditLog` mit Spalten `timestamp | action | email | details (JSON)`.

**Cluster-D-Eintragsformat:**

```js
// Bulk-Update
auditLog_('batchEditFragen', email, {
  count: 47,
  affectedIds: ['frage-uuid-1', 'frage-uuid-2', ...],
  failedIds: [],
  patch: { fachbereich: 'BWL', status: 'sammlung' },
  tagsModus: 'hinzufuegen',      // wenn Tag-Operation involved
  tagIds: ['tag-uuid-1', ...]    // wenn Tag-Operation involved
});

// Bulk-Soft-Delete
auditLog_('batchLoescheFragen', email, {
  count: 5,
  affectedIds: ['frage-uuid-3', ...],
  failedIds: []
});

// Phase-0 One-shot
auditLog_('backfillStatus', email, {
  count: 2416,
  defaultWert: 'sammlung'
});
```

**Schreibreihenfolge:** Audit-Log wird **nach** dem Sheet-Schreib-Pfad geschrieben (nicht davor), damit `affectedIds` + `failedIds` korrekt erfasst sind. Bei Komplett-Fehlschlag (Lock-Konflikt etc.) kein Audit-Eintrag — Frontend retried. Bei **Partial-Failure** wird Audit-Eintrag geschrieben mit befüllten `affectedIds` und `failedIds`.

**Edge-Case Crash zwischen Sheet-Schreib und Audit-Log-Schreib:** Daten sind persistiert, Audit-Eintrag fehlt → akzeptiert (Toleranz, kein Roll-back). Empirisch selten, da `auditLog_` direkt nach Sheet-Schreib läuft und Apps-Script atomare Funktions-Beendigung garantiert. Plan-Phase darf das nochmal evaluieren.

**Größe:** 500 UUIDs ≈ 20 KB JSON-String → Sheets-Zellen-Limit (~50 KB) gedeckelt. Bei >1000 Fragen im Patch Plan-Phase prüft Pagination (siehe §11).

## 5. Komponenten

### 5.1 Checkbox in `KompaktZeile.tsx` (und ggf. Detail-Variante)

Links neben Frage-Info ein 16-px-Checkbox:
```tsx
<input
  type="checkbox"
  checked={selektiert.has(frage.id)}
  onChange={(e) => toggle(frage.id, { shift: e.nativeEvent.shiftKey })}
  className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
  aria-label={`Frage ${frage.id} auswählen`}
/>
```

### 5.2 `FragenSelektionBar` (Floating-Action-Bar, neu)

`src/components/lp/fragensammlung/fragenbrowser/FragenSelektionBar.tsx`:

Position: `fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50`. Erscheint mit fade-in wenn `selektiert.size > 0`.

```tsx
<div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-slate-800 dark:bg-slate-900 text-white shadow-lg rounded-full px-5 py-3 flex items-center gap-3 transition-all">
  <span className={TYPO.body}>
    <strong>{selektiert.size}</strong> Fragen ausgewählt
    {sichtbare < selektiert.size && (
      <span className="text-xs text-slate-300 ml-2">
        (davon {sichtbare} im Filter sichtbar)
      </span>
    )}
  </span>
  <Button onClick={openBatchEditor} variant="primary"><Pencil className="w-4 h-4 mr-1" />Bearbeiten</Button>
  <Button onClick={openLoeschConfirm} variant="danger"><Trash2 className="w-4 h-4 mr-1" />Löschen</Button>
  <Button onClick={beschraenkeAufFilter} variant="ghost">Auf Filter beschränken</Button>
  <Button onClick={leereSelektion} variant="ghost" aria-label="Auswahl aufheben"><X className="w-4 h-4" /></Button>
</div>
```

Icons aus Cluster G (`Pencil`, `Trash2`, `X`).

### 5.3 Batch-Modus im Frage-Editor

**Pfad-Hinweis (Memory-Lehre S156):** Der Frage-Editor lebt als shared-Komponente in `packages/shared/src/editor/`, mit Re-Export-Stubs in `ExamLab/src/components/lp/frageneditor/`. Plan-Phase verifiziert konkreten Modifikations-Pfad.

Der Editor bekommt Prop `batchMode?: { count: number; sichtbareCount: number }`:

#### Banner oben
```tsx
{batchMode && (
  <div className={`${TYPO.body} bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 rounded-lg p-3 mb-4`}>
    <strong>Batch-Bearbeitung von {batchMode.count} Fragen</strong>
    {batchMode.sichtbareCount < batchMode.count && (
      <span className="text-xs text-violet-700 dark:text-violet-300 ml-2">
        (nur {batchMode.sichtbareCount} im aktuellen Filter sichtbar)
      </span>
    )}
    <p className={`${TYPO.caption} mt-1`}>
      Geänderte Felder werden bei allen {batchMode.count} Fragen angewendet.
      Felder ohne <span className="text-violet-600">violetten Rand</span> sind in Batch nicht änderbar.
    </p>
  </div>
)}
```

#### Feld-Highlighting

Batch-fähige Felder bekommen Wrapper:
```tsx
<div className={batchMode ? 'ring-1 ring-violet-300 dark:ring-violet-700 rounded-lg p-2 bg-violet-50/30 dark:bg-violet-900/10' : ''}>
  <Label>Fachbereich</Label>
  <Select ... />
</div>
```

Nicht batch-fähige Felder (Fragetext, Lösung, Optionen, Lücken, Fragetyp):
```tsx
<div className={batchMode ? 'opacity-50 pointer-events-none' : ''}>
  <Label>Fragetext</Label>
  <Textarea disabled={batchMode} />
  {batchMode && <p className={TYPO.caption}>Nicht im Batch bearbeitbar</p>}
</div>
```

#### Tags-Feld mit 3-Modi-Radio

`TagPicker`-DI-Slot ist im `SharedFragenEditor.tsx:184-198` bereits definiert (`{ tagIds, onChange }`). Im Batch-Modus reicht der Caller (`PruefungFragenEditor` Batch-Variant oder neue `BatchFragenEditor`-Wrapper) den Slot weiter, wraps ihn aber mit der 3-Modi-Auswahl. **Kein Refactor an `TagPicker`** — Cluster H Phase 2 hat den Slot stabilisiert.

```tsx
<div className="ring-1 ring-violet-300 dark:ring-violet-700 rounded-lg p-2 bg-violet-50/30 dark:bg-violet-900/10">
  <Label>Tags</Label>
  <RadioGroup value={tagsModus} onChange={setTagsModus}>
    <Radio value="hinzufuegen">Hinzufügen (bestehende bleiben)</Radio>
    <Radio value="ersetzen">Ersetzen (alle bestehenden Tags verlieren)</Radio>
    <Radio value="entfernen">Entfernen (gewählte Tags raus, andere bleiben)</Radio>
  </RadioGroup>
  {/* Bestehender DI-Slot, Cluster H Phase 2 stabil */}
  {tagPickerSlot?.({ tagIds, onChange: setTagIds })}
</div>
```

Der `tagPickerSlot` selber bleibt im Batch-Modus visuell und funktional identisch zu Single-Edit. Lediglich die Bedeutung der ausgewählten `tagIds` ändert sich durch den `tagsModus`-Modus.

### 5.4 `BatchConfirmModal` (neu)

`src/components/lp/fragensammlung/BatchConfirmModal.tsx`:

```tsx
<Modal>
  <h2 className={TYPO.h2}>Batch-Bearbeitung bestätigen</h2>

  <p>{anzahl} Fragen werden bearbeitet.{nichtSichtbar > 0 && (
    <strong className="text-yellow-600"> Achtung: {nichtSichtbar} davon sind im aktuellen Filter nicht sichtbar.</strong>
  )}</p>

  {ueberschriebeneFelder.length > 0 && (
    <section>
      <h3 className={TYPO.h2}>Diese Felder werden ÜBERSCHRIEBEN:</h3>
      <ul>
        {ueberschriebeneFelder.map(f => (
          <li><strong>{f.label}:</strong> → "{f.neuWert}"</li>
        ))}
      </ul>
    </section>
  )}

  {/* Tags-Diff je nach Modus visuell unterschiedlich */}
  {tagsModus === 'hinzufuegen' && tagIds.length > 0 && (
    <section className="text-emerald-700 dark:text-emerald-300">
      <h3 className={TYPO.h2}>Tags werden HINZUGEFÜGT:</h3>
      <ul>{tagNamen.map(n => <li key={n}>+ {n}</li>)}</ul>
    </section>
  )}
  {tagsModus === 'ersetzen' && (
    <section className="text-red-700 dark:text-red-300">
      <h3 className={TYPO.h2}>⚠ Tags werden vollständig ERSETZT:</h3>
      <p>Alle bestehenden Tags bei {anzahl} Fragen werden entfernt, dann diese neu gesetzt:</p>
      <ul>{tagNamen.map(n => <li key={n}>{n}</li>)}</ul>
    </section>
  )}
  {tagsModus === 'entfernen' && tagIds.length > 0 && (
    <section className="text-orange-700 dark:text-orange-300">
      <h3 className={TYPO.h2}>Tags werden ENTFERNT (andere bleiben):</h3>
      <ul>{tagNamen.map(n => <li key={n}>− {n}</li>)}</ul>
    </section>
  )}

  {hinzugefuegteFelder.length > 0 && (
    <section>
      <h3 className={TYPO.h2}>Diese Werte werden HINZUGEFÜGT (bestehende bleiben):</h3>
      <ul>
        {hinzugefuegteFelder.map(f => (
          <li><strong>{f.label}:</strong> + {f.neuWerte.join(', ')}</li>
        ))}
      </ul>
    </section>
  )}

  <div className="flex justify-end gap-2 mt-6">
    <Button onClick={onAbbrechen} variant="ghost">Abbrechen</Button>
    <Button onClick={onBestaetigen} variant="primary">Endgültig anwenden</Button>
  </div>
</Modal>
```

### 5.5 `LoeschConfirmModal` (separater Flow für Bulk-Löschen)

```tsx
<Modal>
  <h2 className={TYPO.h2}>{anzahl} Fragen löschen?</h2>
  <p>{anzahl} Fragen werden in den Papierkorb verschoben (Soft-Delete).</p>
  {nichtSichtbar > 0 && <p className="text-yellow-600">{nichtSichtbar} davon sind im aktuellen Filter nicht sichtbar.</p>}
  <div className="flex justify-end gap-2 mt-6">
    <Button onClick={onAbbrechen} variant="ghost">Abbrechen</Button>
    <Button onClick={onLoeschen} variant="danger">Löschen</Button>
  </div>
</Modal>
```

Verwendet `optimisticDelete`-Helper aus Cluster A für UI-Sofort-Update + Rollback bei Fehler.

### 5.6 „Alle anzeigen"-Toggle im Filter-Header

Im Voll-Header (oder Slim-Bar aus Cluster B) ein Button „Alle anzeigen auswählen (256)" — selektiert alle gefilterten Fragen, nicht nur die virtualisiert-sichtbaren.

### 5.7 Shift-Click Range-Select

Logic in `toggle`-Action:
```ts
toggle(id, { shift }) {
  if (shift && lastClickedId && lastClickedId !== id) {
    const range = rangeIdsBetween(lastClickedId, id, sichtbareIds);
    const targetState = !selektiert.has(id);
    range.forEach(rid => targetState ? selektiert.add(rid) : selektiert.delete(rid));
  } else {
    selektiert.has(id) ? selektiert.delete(id) : selektiert.add(id);
  }
  lastClickedId = id;
}
```

## 6. Migration

### Phase 0: `status`-Feld pre-Batch (~0.5 Tag)
**Neu im Spec-Update 15.05.2026.** Status-Feld zuerst im Single-Edit lauffähig, bevor Batch ihn als batch-fähig zeigt.

**Storage-Extension-Beziehung:** `status` lebt heute nur in `ExamLab/src/types/fragen-storage.ts:27` als Storage-Extension-Feld (`status?: 'draft' | 'sammlung'`). Phase 0 macht **Hard-Cut zu FrageBase**: Feld zieht in Core (`packages/shared/src/types/fragen-core.ts`), Storage-Extension-Feld wird gleichzeitig entfernt. Single source of truth, kein Hybrid (anders als Cluster H tagsLegacy, weil status noch keine produktiven Daten in der Storage-Extension hat — Audit zeigt: nur im Type, nicht im Editor → Backfill ist die Erst-Befüllung, nicht eine Migration). Phase 0 ist atomarer Single-PR.

- `status: 'draft' | 'sammlung'` in `packages/shared/src/types/fragen-core.ts` `FrageBase` ergänzen. Optional zunächst (`status?:`), nach Backfill required machen.
- ExamLab-Storage-Extension `fragen-storage.ts:27` `status`-Feld **entfernen** (Hard-Cut, kein Hybrid).
- Apps-Script `apiBackfillStatusDefault` als one-shot Admin-Action: alle Fragen ohne `status` → Default `'sammlung'`. Audit-Log-Eintrag `'backfillStatus'`. Analog zur Tag-Migration aus Cluster H.
- Editor-UI: 2er-Toggle/RadioGroup `Entwurf | Sammlung` in `MetadataSection.tsx` unter `bloom` einfügen, Tailwind-Pattern aus den anderen Feldern wiederverwenden.
- Backend-`parseFrage` + 4 Schreib-Pfade bestätigen `status` durchschleifen (analog Cluster H Phase 0 Sub-Task 2).
- Vitest für Pre-Phase: Editor rendert Status-Toggle, Backfill-Helper testen, Default-Fallback bei Legacy-Frage ohne `status`.

### Phase 1: Foundation (~1 Tag)
- `fragenSelectionStore.ts` + Hook + Tests (toggle, range-select, leereSelektion, beschraenkeAufFilter).
- `apiBulkUpdateFragen` / `apiBulkLoescheFragen` Backend-Endpoints inkl. Mutually-Exclusive-Validation für Tag-Modi + `auditLog_()`-Integration nach Sheet-Schreib.
- Frontend-Service-Wrapper `bulkUpdateFragen` / `bulkLoescheFragen` (mit `email`-Pflicht-Param siehe `feedback_service_wrapper_email_pflicht.md`).

### Phase 2: Checkbox + Floating-Bar (~1 Tag)
- `KompaktZeile.tsx` Checkbox-Integration.
- `FragenSelektionBar`-Komponente mit allen Buttons (Edit/Löschen/Beschränken/Auswahl aufheben).
- „Alle anzeigen"-Toggle im Filter-Header.

### Phase 3: Batch-Modus im Editor (~1.5 Tag)
- `SharedFragenEditor` `batchMode`-Prop **bevorzugt** (kleinerer Diff, alle Single-Edit-Funktionalität bleibt erhalten, Mode wird via Prop geschaltet) statt neue `BatchFragenEditor`-Wrapper-Komponente (saubere Trennung, aber doppelter Maintenance-Aufwand bei Editor-Änderungen). Plan-Phase darf entscheiden anders, aber Spec-Empfehlung ist `batchMode`-Prop.
- Banner-Komponente.
- Feld-Highlighting (violet Ring) auf 7 batch-fähigen Feldern (fachbereich/bloom/**status**/gefaesse/semester/tagIds/lernzielIds).
- Tags 3-Modi-Radio mit DI-Slot-Reuse.
- Disabling nicht-batch-barer Felder (Fragetext, Lösung, Optionen, Lücken, Fragetyp).

### Phase 4: Confirm-Modals (~0.5 Tag)
- `BatchConfirmModal` mit Diff-Anzeige + Tag-Modus-spezifischen Sektionen (grün/rot/orange).
- `LoeschConfirmModal`.
- Integration in Editor-Submit + Löschen-Flow.

### Phase 5: Cleanup + E2E (~0.5 Tag)
- Performance-Test mit 1000+ Fragen-Selection.
- Audit-Log-Verifikation: nach Bulk-Update Sheet `AuditLog` händisch geprüft (Eintrag enthält affectedIds + patch + tagsModus).
- Browser-E2E der Happy-Path + Edge-Cases.

**Gesamt-Aufwand:** ~4.5 Tage (Phase 0 0.5 + Phase 1 1 + Phase 2 1 + Phase 3 1.5 + Phase 4 0.5 + Phase 5 0.5).

## 7. Edge-Cases & Fehlerfälle

- **Selektion enthält gelöschte Fragen** (nach optimistic delete + Backend-Reload): Selektion wird beim Refresh um nicht-existente IDs bereinigt.
- **Backend-Partial-Failure:** Bulk-Update-Response listet fehlgeschlagene IDs. Frontend zeigt Toast „43 von 47 erfolgreich. 4 fehlgeschlagen: …".
- **Konflikt zwischen Tags-Hinzufügen und Tags-Ersetzen:** Nur einer kann aktiv sein. Radio-Toggle erzwingt das.
- **Frage-Typ-Wechsel-Versuch:** Fragetyp ist nicht im `FragenBulkPatch` — Editor zeigt Fragetyp-Feld disabled mit Hint.
- **Performance Select-All bei 5000 Fragen:** `Set<string>` mit 5000 Einträgen ist OK. Checkbox-Render durch Virtualisierung gedeckelt auf ~20 sichtbare gleichzeitig.
- **Sichtbarkeits-Diff:** Wenn `selektiert.size === 47` aber `sichtbareCount === 0` (alle ausserhalb Filter) — Floating-Bar bleibt mit klarer Anzeige.
- **Browser-Tab-Reload:** Selektion ist in-memory, geht beim Reload verloren. Bewusst — Persistierung wäre Over-Engineering.
- **Backend-Migration während Bulk-Update:** Lock-Service o.ä. nicht nötig, weil partielle Erfolge erlaubt sind. Plan-Phase prüft Apps-Script-Backend.
- **Tag-Replace bei mixed Existing-Tags:** Wenn 47 Fragen verschiedene Tags haben und User „ersetzen" wählt → alle alten Tags weg, neue gesetzt. Confirm-Modal warnt explizit: „Bestehende Tags werden bei 47 Fragen vollständig entfernt."

## 8. Out-of-Scope

- **Undo nach Bulk-Action:** keine native Undo-History. User muss manuell wiederherstellen (über Papierkorb für Löschen, manuell für Änderungen).
- **Bulk-Edit für Fragetext / Lösung:** Schema-Wechsel zu komplex, separate Feature.
- **Bulk-Operationen auf andere Surfaces (Prüfungen, Übungen):** nur Fragensammlung in diesem Cluster.
- **Multi-Tab Selektion-Sync:** Selektion ist tab-lokal.
- **Drag-Select per Rechteck-Zeichnen:** nicht nötig, Shift-Click reicht.

## 9. Abhängigkeiten zu anderen Clustern

- **Cluster H (Tag-Object-Modell):** ✅ **Erfüllt** (Phase 2 LIVE 15.05.2026). Konkretes Modell: `Tag` in `packages/shared/src/types/tag.ts`, `tagsStore.getByIds()`, `TagPicker`-DI-Slot in `SharedFragenEditor.tsx:184-198`, Backend-Endpoints `apiListTags`/`apiCreateTag`/`apiArchiveTag`/`apiMergeTags`. Cluster D Tag-Operations bauen direkt darauf auf.
  - **Cluster D ist unabhängig von Cluster H Phase 3** (tagsLegacy-Cleanup, ab ~29.05.). Cluster D liest Tags ausschliesslich via `tagsStore.getByIds()` und schreibt neue `tagIds` direkt — `tagsLegacy`-Spalte wird vom Bulk-Pfad nicht angerührt. Cluster D darf sofort nach Phase-2-Live starten, muss nicht auf 29.05. warten.
- **Cluster G (Icon-System):** Lucide-Icons für Floating-Bar (`Pencil`, `Trash2`, `X`, `Filter`). Brand-Farb-Tokens (`violet-300/500/600`). **Voraussetzung.**
- **Cluster A (Bug-Fixes):** `optimisticDelete`-Helper aus Cluster A für Bulk-Löschen-Flow. **Voraussetzung** dass Helper-Datei existiert.
- **Cluster B (Header-Redesign):** „Alle anzeigen"-Toggle wird in Filter-Header (ggf. auch Slim-Bar) integriert. Floating-Bar muss z-Index unter App-Header bleiben (`z-50` < App-Header `z-60`).
- **Cluster E (Typografie):** Floating-Bar nutzt `TYPO.body` + `TYPO.caption` Tokens.
- **Cluster F (Testdaten):** Test-Daten-Filter (`istTestdaten`) ist orthogonal — wenn Test-Daten ausgeblendet, sind die Test-Fragen nicht selektierbar (sind ja nicht in Liste).

## 10. Test-Strategie

### 10.1 Unit-Tests (Vitest)

- `fragenSelectionStore`: toggle, range-select, leereSelektion, beschraenkeAufFilter (mit verschiedenen Sichtbar-Sets).
- `bulkUpdateFragen` Service-Wrapper: error-handling, partial-success-mapping, `email`-Pflicht-Param.
- `BatchConfirmModal` Diff-Berechnung: korrekte Aufteilung Überschreiben vs Hinzufügen vs Tags-Modi.
- Phase-0: Editor rendert Status-Toggle, Default-Fallback bei Legacy-Frage ohne `status`.
- Tag-Operations: `hinzufuegen` (unique), `ersetzen` (komplett-replace), `entfernen` (Filter-Logic).

### 10.2 Backend-Tests (Apps-Script)

- `apiBulkUpdateFragen` idempotent für gleichen Patch.
- Mutually-Exclusive-Validation: 2+ Tag-Modi gleichzeitig → 400-Response.
- Partial-Success-Response korrekt strukturiert (`affectedIds` + `failedIds`).
- Audit-Log-Eintrag NACH Sheet-Schreib mit korrekten `affectedIds` + `failedIds`.
- Bei Komplett-Fehlschlag (Lock-Konflikt) **kein** Audit-Eintrag.
- Phase-0 `apiBackfillStatusDefault`: idempotent, schreibt nur in Fragen ohne `status`.

### 10.3 Browser-E2E (Live-Backend, echte Logins)

1. **Phase-0 Status-Single-Edit:** Frage öffnen → neuer Toggle „Entwurf | Sammlung" sichtbar → wechseln → speichern → Sheet-Zelle aktualisiert.
2. **Phase-0 Backfill:** AdminTab → „Status-Backfill" klicken → 2416 Fragen bekommen Default `sammlung` → AuditLog hat Eintrag `'backfillStatus'`.
3. **Multi-Select Basic:** Checkbox bei 3 Fragen anklicken → Floating-Bar zeigt „3 ausgewählt".
4. **Shift-Click Range:** 1. Frage klicken, Shift+Klick auf 10. → 10 ausgewählt.
5. **Cross-Filter-Selection:** BWL filtern, 5 wählen. Filter zu VWL wechseln. Floating-Bar zeigt „5 ausgewählt (davon 0 sichtbar)". Weitere 3 wählen → „8 (davon 3 sichtbar)".
6. **Beschränken auf Filter:** Klick „Auf Filter beschränken" → nur 3 verbleiben.
7. **Batch-Edit Status:** 47 wählen → „Bearbeiten" → Editor im Batch-Modus → Status auf „Sammlung" → speichern → Confirm zeigt „47 Fragen, Status wird überschrieben" → Toast „47 erfolgreich".
8. **Batch-Edit Fachbereich:** 47 wählen → Fachbereich auf „VWL" → Confirm → Toast „47 erfolgreich".
9. **Batch-Tags-Hinzufügen:** Editor → Tags: „Aktuell" + Radio „Hinzufügen" → Speichern → Confirm zeigt „Tag 'Aktuell' wird zu 47 Fragen hinzugefügt".
10. **Batch-Tags-Ersetzen:** Radio „Ersetzen" → Confirm warnt rot „Bestehende Tags werden bei 47 Fragen vollständig entfernt".
11. **Batch-Tags-Entfernen:** Radio „Entfernen" + Tag „Alt-WR" wählen → Confirm zeigt orange „Tag 'Alt-WR' wird aus 47 Fragen entfernt, andere Tags bleiben".
12. **Bulk-Löschen:** 5 wählen → „Löschen" → LoeschConfirm → bestätigen → 5 verschwinden, Toast „5 in Papierkorb".
13. **Partial-Failure-Simulation:** Network während Bulk-Update killen → Toast „43 erfolgreich, 4 fehlgeschlagen". **Anmerkung:** Network-Kill ist nicht-deterministisch. Plan-Phase darf einen Backend-Test-Hook (`?simulateFailureForIds=...`) erwägen — Trade-off zwischen Test-Determinismus und Backend-Komplexität.
14. **Audit-Log-Verifikation:** Nach jedem Bulk-Schritt Sheet `AuditLog` öffnen → Eintrag mit `action: 'batchEditFragen'`, `email`, `details.count`, `details.affectedIds`, `details.tagsModus` (wenn Tag-Op).

### 10.4 Visuelle Verifikation

- Vor/Nach: Fragensammlung mit ausgewählten Checkboxen + Floating-Bar.
- Editor im Batch-Modus mit violet Highlighting.

## 11. Offene Punkte (vor Implementation klären)

**Geklärt im Spec-Update 15.05.2026:**
- ✅ **Audit-Log:** Vollformat via bestehender `auditLog_()` mit `affectedIds` (siehe §3 #12, §4.4).
- ✅ **Tags-Datenmodell:** Tag-IDs (UUID v4) aus Cluster H, `packages/shared/src/types/tag.ts`. Bulk-Add/Replace/Remove als 3-Modi-Radio (siehe §3 #5, §4.2).
- ✅ **Pre-Phase-Scope:** Phase 0 für `status`-Feld in Cluster D (siehe §3 #13, §6 Phase 0).

**Plan-Phase prüft noch:**
- **Apps-Script Bulk-Endpoint-Performance:** Apps-Script 6-Min-Execution-Limit. Bei 1000+ Fragen ggf. Frontend-Paginierung intern (z.B. Chunks à 200, Audit-Log dann pro Chunk oder konsolidiert). Plan-Phase misst + entscheidet.
- **Range-Select bei gruppierter Liste:** wenn User auf Frage in Gruppe A klickt + Shift+Klick in Gruppe B — werden Gruppen-Header übersprungen oder Range bleibt linear? Vermutlich linear über sichtbare Frage-IDs.
- **„Alle gefilterten auswählen" Performance:** bei 5000 Fragen instantan? Plan-Phase Test.
- **Soft-Delete für Bulk-Löschen:** geht in Papierkorb-Modus heute oder ist Hard-Delete? Plan-Phase verifiziert mit existierender Lösch-Logik (Cluster A Bug 1 sollte das geklärt haben).
- **Audit-Log-JSON-Größe bei >1000 IDs:** Plan-Phase prüft Sheets-Zellen-Limit (~50 KB). Falls über-/zu nahe Limit → Eintrag splitten in mehrere Rows oder Pagination wie oben.

## 12. Lehren aus Cluster H berücksichtigen (Memory-Auszug)

Beim Plan + Implementation explizit anwenden:

- `feedback_service_wrapper_email_pflicht.md` — alle neuen Bulk-API-Wrapper brauchen `email` im body.
- `feedback_zustand_selector_useshallow.md` — `useFragenSelektion`-Selector mit Array/Object-Output braucht `useShallow`.
- `feedback_push_konflikt_rate.md` — 1 Push pro Sub-Task am Ende der Implementation.
- `feedback_subagent_task_buendelung.md` — tightly-coupled Plan-Tasks (gleiche Datei + sequentiell) zu Sub-Tasks bündeln (Cluster H Phase 0 → 14 Tasks zu 3 Sub-Tasks).
- `feedback_grep_anwesenheit_nicht_abwesenheit.md` — Plan-Phase Editor-Felder anwesenheit beweisen, nicht aus „kein TagPicker" auf „Slot fehlt" schliessen.
