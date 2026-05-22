# E2E-Test-Plan — SuS-Lernziele-UX (Üben nach Lernziel)

> **Für die nächste Session:** Dies ist der fertige Browser-E2E-Test-Plan für das Feature
> SuS-Lernziele-UX. Code-Umsetzung (12 Tasks) ist komplett + reviewed; nur dieser E2E-Test
> und das Merge-Gate stehen aus. Pflicht-Workflow: `.claude/rules/regression-prevention.md` Phase 3.

**Feature:** Schüler:innen üben nach einzelnem Lernziel (Header-Akkordeon + Unterthema-Icon → Lernziel-Karte → Üben).
**Branch:** `feature/lernziele-bridge-spec` · HEAD `061f4d3` · working tree clean.
**Gates (lokal bereits grün):** `tsc -b`, `vitest run` 2109 + 4 todo, `npm run build`, 9 Lint-Gates.
**Spec:** `docs/superpowers/specs/2026-05-21-sus-lernziele-ux-design.md` · **Plan:** `docs/superpowers/plans/2026-05-21-sus-lernziele-ux.md`.

---

## 0. Precondition — Deploy auf Staging

Der E2E läuft auf Staging (`origin/preview` → GitHub Pages Staging-Build). Vor dem Test:

1. **Deploy-Fenster prüfen** (`.claude/rules/deployment-workflow.md`): KEIN Deploy während aktiver Prüfungen / kurz vor einer Prüfung. Ideal abends/Wochenende.
2. **Pre-Push-Pflicht:** `cd ExamLab && npm run ci-check` (matched CI 1:1) — muss grün sein.
3. **`origin/preview`-Stand prüfen:** `git fetch origin && git log origin/preview ^feature/lernziele-bridge-spec --oneline` — hat `preview` eigene Commits? Falls leer → Push ist sauberer Fast-Forward.
4. **Deploy:** `git push origin feature/lernziele-bridge-spec:preview` → GitHub Actions baut Staging (~2 Min). Build-Timestamp danach prüfen (Staging-Deploy-Queue kann hängen — leerer Commit als Retrigger, siehe deployment-workflow.md).

> Hinweis: Der Branch trägt auch die Lernziele-Bridge-Arbeit (Datenschicht). Der Deploy bringt beides auf Staging — gewollt (Memory-Plan: Bridge + UX zusammen).

## 1. Setup

- **Tab-Gruppe** (Chrome-in-Chrome): `tabs_context_mcp` mit `createIfEmpty: true`.
- **Tab 1 — LP:** `wr.test@gymhofwil.ch` (für den Icon-Check der Fragensammlung).
- **Tab 2 — SuS:** `wr.test@stud.gymhofwil.ch` (Hauptpfad).
- Der User macht die Logins; getestet wird erst nach „kann loslegen".
- **Daten-Voraussetzung:** Der Test-SuS muss in einer Übungs-Gruppe sein, in der Lernziele existieren UND Fragen mit `lernzielIds` getaggt sind. Falls die Gruppe keine getaggten Fragen hat → vorher LP-seitig ein paar Fragen taggen (Frageneditor `LernzielWaehler` oder Batch-Edit), sonst sind Akkordeon/Karte leer und der Üben-Flow nicht prüfbar.
- Cache-Buster `?cb=<ts>` an die Staging-URL hängen (Post-Deploy-Cache).

## 2. Zu testende Änderungen

| # | Änderung | Erwartetes Verhalten | Regressions-Risiko |
|---|---|---|---|
| 1 | Header-`Flag`-Button (SuS) | Öffnet das Lernziele-Akkordeon | LP-Header unberührt (Prop optional) |
| 2 | Lernziel klickbar → Lernziel-Karte | Master-Detail im Modal, „Zurück" zurück zur Liste | bestehender per-Thema „Fragen üben"-Button bleibt |
| 3 | „Üben" auf der Karte | Session mit genau den Fragen des Lernziels | bestehendes Thema-Üben unberührt |
| 4 | Unterthema-`Flag`-Icon (Themen-Detail) | Öffnet Mini-Modal fokussiert auf das Unterthema | Filter-Toggle des Chips muss weiter funktionieren |
| 5 | Icon-Konsistenz Lernziele = `Flag` (LP + SuS) | LP-Fragensammlung zeigt `Flag` statt `Target` | — |
| 6 | Schwierigkeit = Signal-Balken; Mastery = `CircleCheck` | ⭐-Emoji weg; Favorit-`Star` unberührt | aktive Chips: runde Ecken ohne Hairline-Naht |

## 3. Security-Check

- **Leakt Lösungsdaten?** Nein. Das Feature lädt keine neuen Daten — es filtert client-seitig die ohnehin geladenen SuS-Fragen und nutzt das bestehende `starteSession`. Keine Lösungsfelder berührt. *Sanity:* im Netzwerk-Tab prüfen, dass die SuS-Session-Responses keine Lösungsfelder enthalten (bestehendes Verhalten, kein Regress erwartet).
- **Rollen-Bypass?** Nein. Reine SuS-UI mit SuS-Stores; die LP-Änderung (Task 9) ist ein kosmetischer Icon-Swap.
- **Fraud?** Nein. Reiner **Übungs-Modus** (keine Prüfung). Kein Timer, keine Abgabe betroffen.
- **Schwächt Sicherheit?** Nein.

## 4. Betroffene kritische Pfade

**Keiner.** Die 5 kritischen Pfade aus `regression-prevention.md` §1.3 sind alle **Prüfungs-Modus** (SuS lädt Prüfung, Heartbeat, Abgabe, LP-Monitoring, LP-Korrektur). Dieses Feature berührt ausschliesslich **Übungs-Modus**-Code. `starteSession` wird *genutzt*, aber nicht *verändert*.

## 5. E2E-Szenarien (SuS, Staging, echter Login)

**A — Einstieg 1: Header → Akkordeon**
1. SuS-Login → Dashboard. Rechts in der Kopfzeile: `Flag`-Button „Lernziele" sichtbar.
2. Klick → `LernzieleAkkordeon` öffnet (Überschrift „Alle Lernziele"; bei 0 Lernzielen Leer-Zustand „Lernziele").
3. Fach aufklappen → Thema aufklappen → Lernziel-Liste mit Status-Icons.

**B — Lernziel-Karte**
4. Klick auf ein einzelnes Lernziel → `LernzielKarte` erscheint inline: Breadcrumb Fach › Thema, Lernziel-Text, Bloom-Badge (z. B. „K3 Anwenden"), Status, Fortschrittsbalken „X / Y", 4-Stufen-Aufschlüsselung, Empfehlung, „zuletzt geübt", „Üben"-Button. Bei Status „gemeistert": Pokal-Icon (`Trophy`).
5. „Zurück" → zurück zur Lernziel-Liste.

**C — Üben-Flow**
6. Lernziel → Karte → „Üben" → eine Übungs-Session startet; Fragenanzahl plausibel (entspricht dem Lernziel). Übung lässt sich normal durchspielen.
7. Randfall (falls ein Lernziel ohne Fragen existiert): Karte zeigt „Noch keine Fragen…", „Üben" ist deaktiviert.

**D — Einstieg 2: Unterthema-Icon** *(war der im Gesamt-Review gefundene Critical — besonders gründlich prüfen)*
8. Dashboard → ein Thema öffnen (Themen-Detail). Im Filter „Unterthemen": Chips von Unterthemen mit Lernzielen tragen am Ende ein kleines `Flag`-Icon (abgesetzt durch eine Trennlinie).
9. Klick auf das `Flag`-Icon → `LernzieleMiniModal` öffnet, auf dieses Unterthema fokussiert. **Muss funktionieren** (Fix `061f4d3`).
10. Im Mini-Modal ein Lernziel anklicken → Lernziel-Karte → „Üben" → Session startet.
11. Klick auf den **Chip-Körper** (neben dem Icon) → der Filter-Toggle funktioniert weiterhin (Chip an/aus, KEIN Modal).

**E — Icon-Konsistenz**
12. **Tab 1 (LP):** Fragensammlung / FragenBrowser → Fragen mit Lernzielen zeigen ein `Flag`-Badge mit Zähler (nicht mehr `Target`).
13. **Tab 2 (SuS):** Themen-Detail → Schwierigkeits-Chips zeigen Signal-Balken statt ⭐. **Aktive (selektierte) Schwierigkeits- und Fragetyp-Chips** auf eine mögliche Hairline-Naht an den runden Ecken prüfen — Light **und** Dark Mode (Carry-Note Task-7-Review: der Chip wurde auf `<span>`-Wrapper + `overflow-hidden`/`rounded-full` umgebaut).
14. SuS-Fortschritt-Analyse: die „Gemeistert"-Kachel zeigt `CircleCheck` (nicht `Star`).

**F — Light/Dark + Regression**
15. Lernziel-Karte in **Light und Dark Mode** prüfen (Kontraste, Pokal, Balken, 4-Stufen-Marker).
16. Regression: der bestehende per-Thema „Fragen üben"-Button (im Akkordeon und auf der `ThemaKarte`) funktioniert weiter; normales Thema-Üben funktioniert weiter; der per-Thema-Lernziele-Button auf der `ThemaKarte` öffnet weiterhin das Mini-Modal.

## 6. Nach dem Test prüfen

- Console: 0 Errors (nur erwartete Warnings).
- Network: alle API-Calls 200 (kein 401/403/500).
- Keine doppelten Lade-Calls.

## 7. Merge-Gate (nach grünem E2E)

`.claude/rules/regression-prevention.md` Phase 5 — alle Punkte nötig:
- [ ] E2E durchgeführt, Ergebnis dokumentiert
- [ ] Security-Check dokumentiert (§3 oben)
- [ ] `HANDOFF.md` aktualisiert
- [ ] **LP-Freigabe** („Merge OK") explizit eingeholt
- Dann: FF-Merge `feature/lernziele-bridge-spec` → `main` + Push. Memory-Plan: Bridge + UX zusammen mergen — vor dem Merge klären, ob die Lernziele-Bridge-Teile (R4-E2E) ebenfalls fertig getestet sind.

## 8. Bekannte Nicht-Blocker / Parkplatz

- 3 kosmetische Minors aus den Reviews (`feat:`/`fix:`-Header-Typo in einem Test, `Lernziel`-Import-Pfad-Varianten, stale `VITE_ENABLE_NEW_HEADER`-Kommentar) — kein Merge-Blocker.
- Separate Spawn-Task-Chips: `istLernzielFuerThema`-Refactor, `CheckCircle2`→`CircleCheck`-Alias. Unabhängig.
- `.superpowers/` in `.gitignore` — Housekeeping.
