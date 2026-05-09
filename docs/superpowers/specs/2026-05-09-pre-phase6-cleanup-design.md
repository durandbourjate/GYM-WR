# Pre-Phase-6 Cleanup (S1+S3+S4) — Design Spec

**Datum:** 2026-05-09
**Branch:** `cleanup/pre-phase6-s1-s3-s4`
**Ziel:** Aufwärm-Bundle vor Media-Phase 6. Drei niedrig-Risiko Spawn-Tasks aus dem Media-Phase-3-5-Spec abarbeiten, damit Phase 6 sauber starten kann (Demo-Daten + Pool-Konverter bereits MediaQuelle-aware, Orphan-Duplikat weg).

---

## 1 · Status-Audit (2026-05-09)

| Task | Datei | Befund |
|------|-------|--------|
| **S1** | `ExamLab/src/utils/fragenValidierung.ts` (96 Z.) | Orphan: 0 Konsumenten in `ExamLab/src/`. Funktional identisch zu `packages/shared/src/editor/fragenValidierung.ts` (re-exportiert via `@shared`). Diff: nur Doc-Comment + Type-Import-Pfad (`fragen-storage` vs `fragen-core`). |
| **S4** | `ExamLab/src/utils/poolConverter/konvertiereBild.ts` (108 Z.) | Schreibt nur Alt-Feld `bildUrl: POOL_IMG_BASE_URL + poolFrage.img.src` für 3 Sub-Types (hotspot, bildbeschriftung, dragdrop_bild). Kein `bild?: MediaQuelle`-Output. |
| **S3** | `ExamLab/src/data/einrichtungsFragen.ts` + `…UebungFragen.ts` | 4 Media-Stellen (3× `bildUrl: './demo-bilder/...svg'` + 1× `pdfUrl: './materialien/witzsammlung.pdf'` + `pdfDateiname`). Kein Dual-Write `bild`/`pdf` zu MediaQuelle. |

S2 (Token-Rename) bleibt explizit out-of-scope — gehört in Phase 6.

---

## 2 · Architektur-Entscheidungen

### 2.1 Reihenfolge S1 → S4 → S3

Klein zu groß: S1 ist 1 Datei-Delete (5 Min), S4 ist 1 Konverter-Erweiterung mit klaren 3 Branches (30 Min), S3 ist Demo-Daten-Migration über 2 Files (~1 Session). Jeder Schritt ist unabhängig.

### 2.2 S1: Orphan-Delete ohne Re-Export-Bridge

`grep` zeigt 0 Konsumenten in ExamLab/src — Datei kann direkt weg ohne Stub. Konsumenten via `import { validiereFrage } from '@shared/editor/fragenValidierung'` oder via Barrel `@shared` (Z. 8 in `packages/shared/src/index.ts`).

### 2.3 S4: pool-Variante (nicht extern)

Pool-Bilder sind semantisch `MediaQuelle.pool { poolPfad, mimeType }`. `POOL_IMG_BASE_URL === POOL_BASE_URL` aus `mediaQuelleUrl.ts` — `mediaQuelleZuImgSrc` rendert `pool` als `POOL_BASE_URL + poolPfad`, exakt das, was `bildUrl` aktuell enthält.

`poolPfad` = `poolFrage.img.src` (relativer Pfad ohne Basis). `mimeType` aus dem Pfad-Suffix (PNG/JPG/SVG/etc.) — Helper aus dem Migrator wiederverwenden ist over-engineered; inline-Helper für die 4-5 Image-MIME-Types reicht.

**Dual-Write:** `bildUrl` bleibt erhalten (Pflicht im Frage-Type bis Phase 6). Zusätzlich `bild: MediaQuelle.pool { … }`.

**Kein Helper in shared/utils:** Der Konverter ist ExamLab-intern + Pool-spezifisch. MIME-Detection als 8-Zeilen-Inline-Helper im selben Modul.

### 2.4 S3: app-Variante für Demo-Assets

Demo-Bilder liegen in `ExamLab/public/demo-bilder/*.svg` und `ExamLab/public/materialien/witzsammlung.pdf` — also App-Assets via `MediaQuelle.app { appPfad, mimeType, dateiname? }`. `appPfad` ohne führenden Slash und ohne `./`-Prefix.

**Dual-Write:** Bestehende `bildUrl: './demo-bilder/...'` und `pdfUrl: './materialien/...'` + `pdfDateiname: '...'` bleiben (Alt-Felder). Zusätzlich `bild: { typ: 'app', appPfad, mimeType }` bzw. `pdf: { typ: 'app', appPfad, mimeType, dateiname }`.

### 2.5 Self-Review-Modus (kein 2-Iter-Reviewer-Loop)

Niedrig-Risiko: keine Wire-Vertrag-Änderungen, keine Read-Pfad-Änderungen (Renderer lesen weiter über `ermittleBildQuelle`/`ermittlePdfQuelle` — die nutzen entweder direkt das neue `bild`/`pdf`-Feld ODER fallen zurück auf `bildUrl`/`pdfUrl`-Migrator). Alle drei Cuts sind Schreibseiten-Erweiterungen ohne Veränderung der Read-Verträge.

---

## 3 · DoD pro Task

### S1 DoD
- [ ] `ExamLab/src/utils/fragenValidierung.ts` gelöscht
- [ ] tsc -b clean (kein Konsument betroffen, da grep 0 Treffer)

### S4 DoD
- [ ] `konvertiereBild.ts` schreibt `bild: MediaQuelle.pool { poolPfad: poolFrage.img.src, mimeType }` für alle 3 Sub-Types
- [ ] MIME-Type via Inline-Helper (`mimeTypeAusEndung`) für png/jpg/jpeg/gif/webp/svg
- [ ] `bildUrl` bleibt unverändert (Dual-Write)
- [ ] Bestehender Test `poolConverter.test.ts` bleibt grün; +3 Tests (hotspot/bildbeschriftung/dragdrop_bild) verifizieren `bild`-Output (typ: 'pool', poolPfad, mimeType)
- [ ] Bei `poolFrage.img == null`: kein `bild`-Feld geschrieben (analog zu `bildUrl: ''` Verhalten)

### S3 DoD
- [ ] `einrichtungsFragen.ts` Z. 358-359 (PDF-Frage): `pdf: { typ: 'app', appPfad: 'materialien/witzsammlung.pdf', mimeType: 'application/pdf', dateiname: 'witzsammlung.pdf' }`
- [ ] `einrichtungsFragen.ts` Z. 726/773/809 (3× Bild): `bild: { typ: 'app', appPfad: 'demo-bilder/europa-karte.svg', mimeType: 'image/svg+xml' }` (analog tierzelle/weltkarte)
- [ ] Spiegelbildlich in `einrichtungsUebungFragen.ts` (selbe 4 Stellen)
- [ ] Alt-Felder bleiben unverändert (Dual-Write)

### Bundle-DoD
- [ ] vitest 1514 → 1517 erwartet (+3 für S4 hotspot/bildbeschriftung/dragdrop_bild)
- [ ] tsc -b clean
- [ ] 4× lint clean (lint:as-any 0, lint:no-alert 0, lint:no-tests-dir clean, lint:musterloesung Baseline)
- [ ] vite build grün
- [ ] Browser-E2E auf Staging mit echten LP+SuS-Logins:
  - LP: Pruefen-Tab → Einführungsprüfung Vorschau → 3 Demo-Bilder rendern + 1 PDF-Material zeigt „Datei: witzsammlung.pdf"
  - SuS: Einführungs-Übung → Demo-Bild-Frage rendert Bild + PDF-Frage rendert PDF
  - 0 Console-Errors

---

## 4 · Risiko + Rollback

**Risiko niedrig:** Reine Schreibseiten-Erweiterung. Keine Type-Removal, keine Read-Pfad-Änderung. Resolver-Migrator hat MediaQuelle-Felder schon Vorrang gegenüber Alt-Feldern (S5 Pattern).

**Rollback:** `git revert <commit>` pro Task. S1 isoliert, S4 isoliert, S3 isoliert.

---

## 5 · Was NICHT gemacht wird

- S2 Token-Rename (`bildUrl` → `bild`, `pdfDriveFileId` → `pdf`) — gehört in Phase 6 zusammen mit Type-Removal
- Phase 4.a/4.b Editor-State-Refactor — wartet auf nächstes Editor-Bundle
- `apps-script-code.js` Änderungen — Dual-Write existiert bereits via Phase 3
- Hotspot-Cleanup oder neue Vitest-Strukturen
