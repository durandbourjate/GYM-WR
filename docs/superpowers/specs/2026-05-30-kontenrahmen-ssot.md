# kontenrahmen SSOT-Konsolidierung — Design & Befund

**Datum:** 2026-05-30
**Branch:** `refactor/kontenrahmen-ssot`
**Quelle der Wahrheit:** DUYs Schulkontenplan (`04 Unterrichtsmaterial/.../5.1.3 Schulkontenplan zur Einführung der Buchhaltung.pdf`) — vereinfachter KMU-Kontenrahmen, klassen-strukturiert (1–9), traditionelle Begriffe.

## Problem

Zwei divergierende Kontensätze fütterten denselben DI:
- `ExamLab/src/data/kontenrahmen-kmu.json` (78 Konten) — von App.tsx (top-level) + den FiBu-Render-Komponenten (via `utils/kontenrahmen.ts`).
- `packages/shared/src/editor/kontenrahmenDaten.ts` (62 Konten) — von `UebenEditorProvider` + `PruefungFragenEditor` (im useEffect), die App.tsx' Fütterung **überschrieben**.

Folge: Der shared-DI (`setKontenrahmenData`) hatte je nach useEffect-Reihenfolge 62 oder 78 Konten → **Editor und SuS-Anzeige sahen unterschiedliche Kontensätze**. Schlimmer als „fehlende Konten": **9 Nummern bezeichneten in den zwei Sätzen verschiedene Konten** (teils Aufwand↔Ertrag vertauscht, z.B. 7500, 7510, 6950) → Verfälschungs-Risiko für FiBu-Prüfungen.

## Backend-Analyse (Breaking-Change-Absicherung)

Aus dem CSV-Export der BWL-Fragensammlung (535 Fragen, davon 41 FiBu: Buchungssatz/T-Konto/Kontenbestimmung/Bilanz) wurden die real genutzten Konto-Nummern extrahiert (FiBu referenziert Konten per **Nummer-String** → Umnummerierung wäre breaking):
- **24 Nummern genutzt**, alle in Kl. 1–6.
- **Klasse 7 + 8 in KEINER Frage genutzt** → schulkontenplan-konforme Neuordnung dort risikofrei.
- Genutzte Echt-Konflikte: nur `5200` (Distraktor) + `3800` (eine Frage mit inline-Name) → ohne Umnummerierung lösbar.
- Nur `1521` (3× genutzt, „Wertberichtigung Mobiliar") fehlte in beiden Sätzen → ergänzt.

## Lösung

1. **Eine Daten-Quelle:** `ExamLab/src/data/kontenrahmen-kmu.json` (84 Konten), schulkontenplan-konform: genutzte Nummern (Kl. 1–6) behalten Nummer+Bedeutung; Kl. 6-Finanz/7/8 neu geordnet (Finanzergebnis 6900/6950 · Nebenerfolge 7000/7010/7500/7510 = Nebenbetrieb+Immobilien · Kl. 8 = betriebsfremd 8000/8010, a.o. 8100/8110, Steuern 8900); Dublette 2170 entfernt.
2. **Util-SSOT:** shared `kontenrahmen.ts` (DI) bleibt; `ExamLab/src/utils/kontenrahmen.ts` → Re-Export-Shim (nur `kontoLabel`/`findKonto` extern genutzt, beide DI-kompatibel).
3. **Alle Fütterer auf die eine JSON:** App.tsx (unverändert) + `UebenEditorProvider` + `PruefungFragenEditor` (von `kontenrahmenDaten` auf die JSON umgebogen).
4. `packages/shared/src/editor/kontenrahmenDaten.ts` gelöscht (ungenutzt).

## Konflikt-Auflösungen (gemäß Schulkontenplan)

6950 = Finanzertrag (Debitorenverluste → 3805 Kl. 3) · 5200 = Lohnaufwand/Gehälter · 2900 = Gesetzliche Gewinnreserve · 7010 = Immobilienertrag · 3800/3900 = Bestandesänderungen. Dividenden/Kursgewinne → unter Finanzertrag subsumiert; Anlagenverkauf-Gewinn/Verlust → unter a.o. (8100/8110) subsumiert.

## Offene fachliche Punkte (vom Nutzer abgenommen / als Hinweis)

- `5000 Lohnaufwand` ↔ `5200 Gehälter`: beide behalten (didaktische Varianten).
- MWST/Vorsteuer-Cluster (1170/1176/2200/2206): wie-ist belassen.
- **Eine FiBu-Frage** (Maschinenverkauf) nutzt `3800` zweckentfremdet als „a.o. Ertrag" (inline-Name, self-contained, bricht nicht) → fachlich auf `8110 Ausserordentlicher Ertrag` umstellen.

## Verifikation

tsc -b grün · ExamLab ci-check alle Gates 0 Regressions · vitest 2166 (FiBu-Tests 55) · Planer tsc/vitest/build unberührt · Browser-Smoke (Editor + SuS-Anzeige derselbe Satz) → Staging-Test.
