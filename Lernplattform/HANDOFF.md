# Uebungstool — HANDOFF

## Aktueller Stand

**Branch:** `fix/lernplattform-ux-phase2`
**Phase:** Farbschema + Themen-Hierarchie + SuS-Dashboard Redesign (05.04.2026)
**Status:** TSC OK, 101 LP-Tests + 193 Pruefungs-Tests gruen, Build OK
**Apps Script:** Aenderungen pending (User muss deployen)

### Architektur
- **Ein Format:** Kanonisch aus `@shared/types/fragen` (discriminated union)
- **Eine Fragenbank:** `FRAGENBANK_ID` = Pruefungstool-Sheet (Gym-Gruppen), eigenes Sheet (Familie)
- **Ein Editor:** SharedFragenEditor mit allen Features (KI, Anhaenge, Sharing, Lernziele)
- **Kein Adapter:** Keine Konvertierung zwischen LP und Pruefungstool-Format
- **CSS:** Slate-basiertes Farbschema (identisch mit Pruefungstool)
- **Themen-Hierarchie:** Backend mappt poolId → Thema/Unterthema via THEMEN_MAPPING

---

## In dieser Session erledigt (05.04.2026 — Session 2)

### Phase 1: Quick-Fixes
| # | Fix | Details |
|---|-----|---------|
| 1 | Farbschema Blau → Slate | 30+ Dateien: bg-blue → bg-slate, Buttons, Tabs, Links, Focus-States |
| 2 | Mitglieder-Race-Condition | gruppenStore: await statt Background-Promise bei Auto-Select |
| 3 | Schwierigkeit-Default | parseFrageKanonisch_: Default 2 (Mittel) statt undefined |
| 4 | Fremde Email Meldung | GruppenAuswahl: "Keine Gruppe zugeordnet" + Hinweis an LP |

### Phase 2: Themen-Hierarchie
| # | Feature | Details |
|---|---------|---------|
| 1 | Pool-Configs Parser | scripts/generateThemaMapping.mjs: 26 Pools, 190 Unterthemen, 2500 Fragen |
| 2 | THEMEN_MAPPING | Backend: poolId-Prefix → Pool-Titel als Thema, bisheriges Thema → Unterthema |
| 3 | Automatisches Mapping | parseFrageKanonisch_ extrahiert Hierarchie beim Laden (kein Sheet-Migration noetig) |

### Phase 3: SuS-Dashboard Redesign
| # | Feature | Details |
|---|---------|---------|
| 1 | Pool-Stil Navigation | Fachbereich-Chips → Thema-Karten-Grid → Thema-Detail mit Filtern |
| 2 | Chip-Filter | Unterthema, Schwierigkeit, Fragetyp als togglebare Chips (wie pool.html) |
| 3 | "Alle ⇄" Toggle | Pro Filtergruppe alle Chips an/aus schalten |
| 4 | Thema-Karten | Titel, Fach-Farbpunkt, Anzahl Fragen/Unterthemen, Fortschrittsbalken |
| 5 | Gefiltert starten | "Uebung starten" mit vorgefilterter Fragenauswahl (fragenOverride) |
| 6 | Keine 10-Fragen-Grenze | Gym-SuS koennen alle gefilterten Fragen erhalten |

---

## Geaenderte Dateien

| Datei | Aenderung |
|-------|----------|
| `apps-script/lernplattform-backend.js` | THEMEN_MAPPING, schwierigkeit Default, getFragenbankTabs_ |
| `src/components/Dashboard.tsx` | Komplett umgebaut: Pool-Stil mit Chips, Karten, Detail-Ansicht |
| `src/store/uebungsStore.ts` | starteSession: fragenOverride Parameter |
| `src/store/gruppenStore.ts` | Mitglieder await statt Background-Promise |
| `src/components/GruppenAuswahl.tsx` | Bessere Fehlermeldung bei 0 Gruppen |
| 30+ Komponenten | Farbschema: blue-* → slate-* |
| `scripts/generateThemaMapping.mjs` | Pool-Config-Parser fuer Themen-Mapping |

---

## Offene Punkte

| # | Thema | Details | Aufwand |
|---|-------|---------|--------|
| 1 | **Apps Script deployen** | lernplattform-backend.js in Apps Script Editor kopieren + neue Bereitstellung | User |
| 2 | **E2E-Browser-Test** | Nach Deploy: SuS-Dashboard, Themen-Hierarchie, Filter, Farbschema | Mittel |
| 3 | **Lernziele im Dashboard** | 🏁 Mini-Modal pro Unterthema (noch nicht implementiert) | Klein |
| 4 | **10-Fragen-Limit** | blockBuilder MAX_BLOCK_SIZE kontextabhaengig machen (Gym vs Familie) | Klein |

---

## Verifikation

```bash
cd Lernplattform && npx tsc -b && npx vitest run && npm run build
cd Pruefung && npx tsc -b && npx vitest run && npm run build
```
