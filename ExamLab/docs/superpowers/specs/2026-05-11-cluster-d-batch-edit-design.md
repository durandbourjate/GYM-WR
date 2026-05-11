---
title: Cluster D — Batch-Edit Fragensammlung
date: 2026-05-11
status: Spec-Review ausstehend
verwandt: Cluster G (Icons, Brand-Farben), Cluster B (Floating-Bar im Layout), Cluster A (Optimistic-Delete Pattern)
---

# Cluster D — Batch-Edit Fragensammlung

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
| 5 | **Tags-Feld hat Radio-Toggle** „Hinzufügen / Ersetzen". Default „Hinzufügen". | Verhindert versehentliches Tag-Plattmachen. |
| 6 | **Confirm-Modal pro Batch-Save** mit klarer Aufzählung: was wird überschrieben vs hinzugefügt. | User-Anforderung. |
| 7 | **Löschen direkt im Floating-Bar** mit eigenem Confirm-Modal — ohne Editor-Umweg. | Standard-Pattern für destruktive Aktionen, kein Editor-Detour. |
| 8 | **„Auswahl auf Filter beschränken"-Button im Floating-Bar.** | User-Escape wenn zu viel selektiert ist. |
| 9 | **Backend bekommt neuen Bulk-Update-Endpoint** `apiBulkUpdateFragen(ids, patch)`. | Heute nur Single-Update + spezieller Lückentext-Bulk; generisches Pattern nötig. |
| 10 | **Shift-Click** für Range-Select zwischen zwei Checkboxen. | Standard-Pattern, beschleunigt manuelle Auswahl. |
| 11 | **Filter-Wechsel löscht Selektion NICHT.** Indikator zeigt sichtbar/gesamt. | Konsequenz aus Entscheidung 2. |

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
  status?: 'draft' | 'sammlung';
  gefaess?: ('SF'|'EF'|'EWR'|'GF')[];
  semester?: string[];
  lernzielIds?: string[];
  // Tags: alle drei Felder operieren auf Tag-IDs (konsistent).
  // Plan-Phase verifiziert Tag-Datenmodell und passt ggf. an (z.B. Backend braucht
  // ggf. Tag-Objects statt nur IDs für Auto-Anlage neuer Tags).
  tagsHinzufuegen?: string[];    // Tag-IDs to add
  tagsErsetzen?: string[];       // Tag-IDs (mutually exclusive mit tagsHinzufuegen + tagsEntfernen)
  tagsEntfernen?: string[];      // Tag-IDs to remove
}

export async function bulkUpdateFragen(ids: string[], patch: FragenBulkPatch): Promise<{ erfolgreich: number; fehlgeschlagen: string[] }> { ... }
export async function bulkLoescheFragen(ids: string[]): Promise<{ erfolgreich: number; fehlgeschlagen: string[] }> { ... }
```

### 4.3 Backend (Apps-Script)

Neuer Endpoint `apiBulkUpdateFragen` + `apiBulkLoescheFragen` im `doPost`-Router. Implementation iteriert intern über IDs, batched die Updates auf Drive/Sheets. Partial-Success-Response listet fehlgeschlagene IDs.

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

#### Tags-Feld mit Add/Replace-Toggle

```tsx
<div className="ring-1 ring-violet-300 ...">
  <Label>Tags</Label>
  <RadioGroup value={tagsModus} onChange={setTagsModus}>
    <Radio value="hinzufuegen">Zu Bestehenden hinzufügen</Radio>
    <Radio value="ersetzen">Bestehende vollständig ersetzen</Radio>
  </RadioGroup>
  <TagInput value={tags} onChange={setTags} />
</div>
```

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

### Phase 1: Foundation
- `fragenSelectionStore.ts` + Hook + Tests (toggle, range-select, leereSelektion).
- `apiBulkUpdateFragen` / `apiBulkLoescheFragen` Backend-Endpoints + Frontend-Service-Wrapper.

### Phase 2: Checkbox + Floating-Bar
- `KompaktZeile.tsx` Checkbox-Integration.
- `FragenSelektionBar`-Komponente mit allen Buttons (Edit/Löschen/Beschränken/Auswahl aufheben).
- „Alle anzeigen"-Toggle im Filter-Header.

### Phase 3: Batch-Modus im Editor
- FrageEditor `batchMode`-Prop.
- Banner-Komponente.
- Feld-Highlighting (violet Ring).
- Tags-Add/Replace-Radio.
- Disabling nicht-batch-barer Felder.

### Phase 4: Confirm-Modals
- `BatchConfirmModal` mit Diff-Anzeige.
- `LoeschConfirmModal`.
- Integration in Editor-Submit + Löschen-Flow.

### Phase 5: Cleanup + E2E
- Performance-Test mit 1000+ Fragen-Selection.
- Browser-E2E der Happy-Path + Edge-Cases.

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

- **Cluster G (Icon-System):** Lucide-Icons für Floating-Bar (`Pencil`, `Trash2`, `X`, `Filter`). Brand-Farb-Tokens (`violet-300/500/600`). **Voraussetzung.**
- **Cluster A (Bug-Fixes):** `optimisticDelete`-Helper aus Cluster A für Bulk-Löschen-Flow. **Voraussetzung** dass Helper-Datei existiert.
- **Cluster B (Header-Redesign):** „Alle anzeigen"-Toggle wird in Filter-Header (ggf. auch Slim-Bar) integriert. Floating-Bar muss z-Index unter App-Header bleiben (`z-50` < App-Header `z-60`).
- **Cluster E (Typografie):** Floating-Bar nutzt `TYPO.body` + `TYPO.caption` Tokens.
- **Cluster F (Testdaten):** Test-Daten-Filter (`istTestdaten`) ist orthogonal — wenn Test-Daten ausgeblendet, sind die Test-Fragen nicht selektierbar (sind ja nicht in Liste).

## 10. Test-Strategie

### 10.1 Unit-Tests (Vitest)

- `fragenSelectionStore`: toggle, range-select, leereSelektion, beschraenkeAufFilter (mit verschiedenen Sichtbar-Sets).
- `bulkUpdateFragen` Service-Wrapper: error-handling, partial-success-mapping.
- `BatchConfirmModal` Diff-Berechnung: korrekte Aufteilung Überschreiben vs Hinzufügen.

### 10.2 Backend-Tests (Apps-Script)

- `apiBulkUpdateFragen` idempotent für gleichen Patch.
- Partial-Success-Response korrekt strukturiert.
- Audit-Log für Bulk-Updates (Plan-Phase entscheidet ob nötig).

### 10.3 Browser-E2E (Live-Backend, echte Logins)

1. **Multi-Select Basic:** Checkbox bei 3 Fragen anklicken → Floating-Bar zeigt „3 ausgewählt".
2. **Shift-Click Range:** 1. Frage klicken, Shift+Klick auf 10. → 10 ausgewählt.
3. **Cross-Filter-Selection:** BWL filtern, 5 wählen. Filter zu VWL wechseln. Floating-Bar zeigt „5 ausgewählt (davon 0 sichtbar)". Weitere 3 wählen → „8 (davon 3 sichtbar)".
4. **Beschränken auf Filter:** Klick „Auf Filter beschränken" → nur 3 verbleiben.
5. **Batch-Edit:** 47 wählen → „Bearbeiten" → Editor öffnet im Batch-Modus mit Banner, violet markierten Feldern. Fachbereich auf „VWL" ändern → speichern → Confirm-Modal zeigt „47 Fragen, Fachbereich wird überschrieben". Bestätigen → Toast „47 erfolgreich".
6. **Batch-Tags-Hinzufügen:** Editor → Tags: „Aktuell" + Radio „Hinzufügen" → Speichern → Confirm zeigt „Tag 'Aktuell' wird zu 47 Fragen hinzugefügt".
7. **Batch-Tags-Ersetzen:** Radio „Ersetzen" → Confirm warnt „Bestehende Tags werden bei 47 Fragen vollständig entfernt".
8. **Bulk-Löschen:** 5 wählen → „Löschen" → LoeschConfirm → bestätigen → 5 verschwinden, Toast „5 in Papierkorb".
9. **Partial-Failure-Simulation:** Network während Bulk-Update killen → Toast „43 erfolgreich, 4 fehlgeschlagen".

### 10.4 Visuelle Verifikation

- Vor/Nach: Fragensammlung mit ausgewählten Checkboxen + Floating-Bar.
- Editor im Batch-Modus mit violet Highlighting.

## 11. Offene Punkte (vor Implementation klären)

- **Apps-Script Bulk-Endpoint-Performance:** wie viele Fragen können in einem Request? Vermutlich Limit (Drive/Sheets API-Quota). Plan-Phase prüft + dokumentiert (z.B. Frontend paginiert intern bei >100).
- **Audit-Log für Bulk-Updates:** soll jeder Bulk-Update als Audit-Eintrag protokolliert werden? User-Memory hat keine Vorgabe — Plan-Phase entscheidet.
- **Tags-Datenmodell-Detail:** `Tag` ist Objekt mit `{id, name, farbe, ebene}`. Bulk-Add vs Bulk-Remove operieren auf Tag-IDs oder Tag-Namen? Plan-Phase verifiziert.
- **Range-Select bei gruppierter Liste:** wenn User auf Frage in Gruppe A klickt + Shift+Klick in Gruppe B — werden Gruppen-Header übersprungen oder Range bleibt linear? Vermutlich linear über sichtbare Frage-IDs.
- **„Alle gefilterten auswählen" Performance:** bei 5000 Fragen instantan? Plan-Phase Test.
- **Soft-Delete für Bulk-Löschen:** geht in Papierkorb-Modus heute oder ist Hard-Delete? Plan-Phase verifiziert mit existierender Lösch-Logik (Cluster A Bug 1 sollte das geklärt haben).
