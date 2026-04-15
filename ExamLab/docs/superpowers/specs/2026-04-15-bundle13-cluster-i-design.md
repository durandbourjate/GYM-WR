# Bundle 13 Cluster I — Üben-Übungen Tab-Architektur

**Datum:** 2026-04-15
**Projekt:** ExamLab
**Status:** Design (zu reviewen)
**Verwandt:** HANDOFF-Backlog "Bundle 13 — Cluster I", User-Testrunde 14.04.2026

---

## Kontext

Der Üben-Bereich (LP-Sicht) hat aktuell eine Doppel-Navigation:

1. **Obere Tab-Leiste (LPStartseite):** `[Übung durchführen] [Übungen] [Analyse]`
2. **Innerhalb "Übungen" (AdminDashboard):** `[Übersicht] [Themen]`
3. **Kurs-Dropdown** in `UebungsToolView` oberhalb von AdminDashboard

Das führt zu Reibung:
- LP klickt "Übungen", sieht zuerst eine Übersicht-Seite, muss dann auf "Themen" klicken.
- Bei mehreren Kursen muss der LP zuerst im Dropdown wechseln, dann den Tab nutzen.
- "Übersicht"-Inhalte (Mitglieder-Liste, Admin-Info, Fachfreischaltung-Infos) sind eher Konfiguration als tägliche Arbeitsansicht.

Ziel: Flache Navigation mit Kurs-Auswahl direkt in der oberen Tab-Leiste.

---

## Scope

- Umbau der Üben-Tab-Architektur in LPStartseite
- Entfernung der AdminDashboard-internen Tabs
- Migration "Übersicht"-Inhalte nach Einstellungen → Übungen → Fächer/Mitglieder
- URL-Deep-Link für aktiven Kurs
- Fachfreischaltung-Editor pro Kurs im Einstellungen-Panel

Out of Scope:
- Änderungen an SuS-Seite
- Änderungen am Prüfen-Bereich
- Refactor von Gruppen-Store / Datenmodell

---

## Ziel-Zustand

### Tab-Leiste (LPStartseite, Üben-Modus)

**Ohne aktiven "Übungen"-Tab:**
```
[Übung durchführen] [Übungen] [Analyse]
```

**Mit aktivem "Übungen"-Tab:**
```
[Übung durchführen] [Übungen] [SF WR 29c] [SF WR 28bc29fs] [IN 28c] ... [Analyse]
```

- Kurs-Tabs erscheinen rechts von "Übungen" und links von "Analyse".
- Reihenfolge: wie in der Gruppen-Liste aus `useUebenGruppenStore().gruppen` (alphabetisch nach `name`).
- Aktiver Kurs-Tab ist slate-hervorgehoben (`filter-btn-active`-Stil, konsistent mit S110 Hover/Active-Design).
- Klick auf `Übung durchführen` oder `Analyse` → Kurs-Tabs verschwinden, URL wechselt zum Sub-Modus.
- Klick auf `Übungen` → aktiviert zuletzt gewählten Kurs (localStorage) oder erste Gruppe.
- Bei 0 Gruppen: Kurs-Tabs erscheinen nicht; `Übungen` zeigt "Keine Kurse"-Leerstand mit CTA.

### Viele Kurse (>6)

- Tab-Leiste verwendet `flex-wrap` mit `gap-1` — Zeilenumbruch bei Bedarf. Umgebrochene Tabs bleiben alphabetisch sortiert, keine Scroll-Bar.
- Realistischer Worst-Case: 8 Kurse — passt auf zwei Zeilen.
- Alternative Dropdown-Fallback bei >10 Kursen ist **nicht** Teil dieses Scopes (einzelner LP hat derzeit max. ~8).

### URL-Struktur

Neue Route in `Router.tsx`:
- `/uebung/kurs/:kursId` (geschützt durch LPGuard)

Bestehende Routen bleiben:
- `/uebung` → Redirect auf letzten Kurs oder erste Gruppe
- `/uebung/durchfuehren`
- `/uebung/analyse`

Verhalten bei unbekannter `kursId`:
- LPStartseite sucht Gruppe mit dieser ID in `useUebenGruppenStore().gruppen`.
- Wenn nicht gefunden: `navigate('/uebung/kurs/' + ersteGruppe.id, { replace: true })` + Toast-Warnung "Kurs nicht gefunden, erster Kurs geladen".
- Wenn `gruppen` leer ist: `navigate('/uebung', { replace: true })` (zurück zu Übersicht ohne Kurs).

localStorage-Key: `examlab-ueben-letzter-kurs` → `kursId`.
Nur bei `Klick auf "Übungen"-Tab` gelesen, nicht automatisch. Wird bei jedem Kurs-Tab-Wechsel geschrieben.

### Ansicht "Übungen" (pro Kurs)

Die bisherige `AdminDashboard`-Ansicht zeigt direkt Themen des aktiven Kurses:

```
Brotkrumen: [← Zurück zu Übungen] (wenn Kind/Thema-Detail offen)

<AdminThemensteuerung>   (der jetzige "Themen"-Tab-Inhalt)
```

Detail-Views (`AdminKindDetail`, `AdminThemaDetail`) bleiben wie heute mit Brotkrumen-Navigation.

**Entfällt:**
- Tab-Leiste `[Übersicht] [Themen]` in AdminDashboard
- `AdminUebersicht`-Seite (Mitglieder-Stats, Admin-Liste, Fach-Badges auf der Hauptansicht)
- Gruppen-Info-Bar mit Mitglieder-Zählung am oberen Rand (in UebungsToolView)

**Grund:** Die Info (Kursname, Mitglieder-Anzahl) steht bereits in den Einstellungen. Der aktive Kurs ist durch den Tab-Namen offensichtlich.

### Einstellungen → Übungen → Fächer (Fachfreischaltung)

Neue Sektion am Ende von `FaecherTab.tsx`:

```
Freigeschaltete Fächer pro Kurs
─────────────────────────────────
Diese Fächer sind für die SuS im jeweiligen Kurs sichtbar.

SF WR 29c           [VWL ✓] [BWL ✓] [Recht ✓]
SF WR 28bc29fs      [VWL ✓] [BWL ✓] [Recht ✓]
IN 28c              [Informatik ✓]
```

- Pro Gruppe (Kurs) eine Zeile.
- Fach-Chips zeigen alle Fächer aus `stammdaten.fachschaften` der Fachschaft dieses Kurses.
- Klick togglet → `sichtbareFaecher`-Array der Gruppen-Einstellungen.
- Nutzt bestehenden `useUebenSettingsStore.aktualisiereEinstellungen(gruppeId, { sichtbareFaecher })` — debounced Backend-Save ist seit S112 drin.
- Scope pro Gruppe: Aktuelle Admin-Einstellungen laden ggf. nur die aktive Gruppe. **Offen beim Bau:** Falls `einstellungen`-Store nur eine Gruppe im Cache hat, muss der neue Editor die Settings aller Gruppen parallel laden. Erst messen, dann ggf. anpassen.

Bestehende Sektionen im `FaecherTab` (Stammdaten-Fächer pro Fachschaft) bleiben **unverändert** darüber.

### Einstellungen → Übungen → Mitglieder

Keine Änderung. Der MitgliederTab ist bereits kurs-basiert (pro aktiver Gruppe) und kann weiterhin Admins markieren (Kurs-Leitung vs. Mitglied, S112).

Die "Übersicht"-Sektion mit Mitglieder-Zählung gibt es hier bereits als Liste — kein weiterer Umbau nötig.

---

## Komponenten-Änderungen (Liste)

| Datei | Änderung | Risiko |
|---|---|---|
| `ExamLab/src/components/lp/LPStartseite.tsx` | Tab-Rendering erweitern, Kurs-Tabs, URL-Sync, localStorage. Datei ist 1200+ Z., **Extract in neue `UebenTabLeiste.tsx`**. | Mittel (zentrale Datei) |
| `ExamLab/src/components/lp/uebung/UebenTabLeiste.tsx` | **Neu.** Eigenständige Tab-Leiste mit Kurs-Tabs, gekapselt. | Niedrig |
| `ExamLab/src/components/ueben/admin/AdminDashboard.tsx` | Tab-Leiste entfernen. Rendert nur noch `<AdminThemensteuerung>` + Detail-Views. | Niedrig |
| `ExamLab/src/components/ueben/admin/AdminUebersicht.tsx` | **Löschen.** | Niedrig (keine anderen Importe) |
| `ExamLab/src/components/lp/UebungsToolView.tsx` | Gruppen-Info-Bar entfernen. Kurs-ID als Prop von LPStartseite. Gruppen-Dropdown entfernt. | Niedrig |
| `ExamLab/src/components/ueben/admin/settings/FaecherTab.tsx` | Neue Sektion "Freigeschaltete Fächer pro Kurs". | Niedrig |
| `ExamLab/src/router/Router.tsx` | Neue Route `/uebung/kurs/:kursId`. | Niedrig |
| `ExamLab/src/hooks/useLPNavigation.ts` oder vergleichbar | Anpassung bei Navigation zum Üben-Modus (falls existiert). | Niedrig (muss beim Bau identifiziert werden) |

**Gelöscht:** `AdminUebersicht.tsx` + zugehörige Importe.

---

## Daten-Modell

Keine Änderungen. `GruppenEinstellungen.sichtbareFaecher: string[]` existiert bereits (`ExamLab/src/types/ueben/settings.ts:14`).

---

## Migration

Keine Daten-Migration nötig. Bestehende Gruppen haben entweder `sichtbareFaecher: []` (= alle sichtbar, Legacy-Verhalten) oder konkrete Fach-Liste. Beides bleibt gültig.

---

## Testing

1. **Unit-Tests:**
   - `UebenTabLeiste` — Rendering mit 0/1/3/8 Gruppen, Klick-Handler, aktiv-Highlight.
   - `FaecherTab` Fachfreischaltung-Sektion — Chip-Toggle schreibt korrekt in Store.
2. **Integration:**
   - URL `/uebung/kurs/sf-wr-29c` öffnet korrekten Kurs.
   - URL `/uebung/kurs/unknown` → Fallback + Toast.
   - Kurs-Tab-Klick aus "Analyse" → URL wechselt, Analyse-Tab inaktiv.
3. **Browser-Test (Chrome-in-Chrome mit Demo-LP):**
   - Tab-Leiste-Layout bei inaktivem / aktivem "Übungen"-Tab.
   - Viele Kurse → flex-wrap.
   - Dark/Light Mode.
   - Einstellungen → Fächer → Fachfreischaltung Chip-Toggle.

---

## Risiken

| Risiko | Mitigation |
|---|---|
| LPStartseite-Refactor bricht Prüfen-Tab | Scope auf Üben-Modus begrenzen. Tests vor/nach. |
| Mehrere Gruppen-Settings parallel laden | Erst messen: lädt der Store schon alle Gruppen-Settings, oder nur aktive? Falls nur aktive, Editor lädt on-demand. |
| URL-Sync-Loops (State ↔ URL) | `replace: true` bei Fallback-Redirects. Einmaliger `useEffect`-Sync auf `useParams`. |
| Kurs-Tabs zu breit bei 8+ Kursen | flex-wrap, Kurs-Namen sind kurz (z.B. "SF WR 29c" = 10 Zeichen). Realität: 2 Zeilen OK. |

---

## Offene Punkte (zum Merge klären)

1. **Fach-Chips pro Kurs** — nur Fächer der Fachschaft des Kurses anzeigen, oder alle Fächer? Vorschlag: Nur Fachschaft-Fächer, damit z.B. SF WR 29c nur VWL/BWL/Recht zeigt, nicht Informatik.
2. **Kein-Kurs-Ansicht (`/uebung`)** — bisherige Logik (falls LP auf "Übungen" klickt ohne Kurs) zeigt UebungsToolView mit "Keine Gruppen — bitte anlegen"-Banner. Bleibt so.

---

## Rollout

- Feature-Branch: `feature/bundle13-cluster-i`
- Gemerged nach Staging-Test
- Kein Apps-Script-Deploy nötig (reine Frontend-Änderung)
- HANDOFF-Update nach Abschluss
