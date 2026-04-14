# Bundle 1 — Quick Wins: Design-Spec

> 6 kleine, isolierte UI-Korrekturen. Keine architektonischen Änderungen.
> Datum: 13.04.2026

---

## N3 — Doppelte "Fragensammlung" im Header entfernen

**Problem:** LPHeader.tsx zeigt "Fragensammlung" zweimal — einmal als Tab (TABS-Array Zeile 36) und einmal als separater Button (Zeile 130).

**Lösung:** Den Button nur ausblenden wenn die Tabs sichtbar sind (Dashboard ohne `zurueck`). Auf Sub-Pages (PruefungsComposer, KorrekturDashboard etc.) sind die Tabs verborgen und der Button ist der einzige Zugang zur Fragensammlung-Seitenleiste — dort muss er bleiben.

Konkret: Button nur rendern wenn `!istDashboard || zurueck` (d.h. Tabs nicht sichtbar).

**Dateien:** `src/components/lp/LPHeader.tsx`

**Risiko:** Gering, aber wichtig: Der Button hat auf Sub-Pages eine andere Funktion (togglet Seitenleiste) als der Tab (setzt Modus). Daher nicht pauschal entfernen.

---

## N5+N6 — Kleine Bildvorschau entfernen, Lösch-Button versetzen

**Problem:** Bei Bild-Fragetypen (Hotspot, Bildbeschriftung, DragDrop-Bild) wird das Bild zweimal angezeigt: klein in BildUpload.tsx (Vorschau) und gross im jeweiligen Editor. Die kleine Version ist redundant. Der rote X-Lösch-Button am kleinen Bild sitzt an nicht-intuitiver Position (unten links).

**Lösung:**
1. Kleine Bildvorschau (`<img>` + roter X-Button) in BildUpload.tsx entfernen
2. Neuer dezenter "Bild entfernen"-Textbutton rechts neben dem URL-Eingabefeld, **nur sichtbar wenn `bildUrl` gesetzt ist**
3. Layout URL-Zeile: `[oder] [URL-Feld] [Bild entfernen]` — flex-row, gap
4. Bei Data-URL-Uploads (wo URL-Feld leer bleibt): Kleiner Hinweis "(Bild geladen)" neben dem URL-Feld, damit User weiss dass ein Bild vorhanden ist

**Dateien:** `packages/shared/src/editor/components/BildUpload.tsx`

**Risiko:** Gering. Das grosse Bild im Editor (HotspotEditor, BildbeschriftungEditor, DragDropBildEditor) bleibt unverändert und zeigt weiterhin das hochgeladene Bild.

---

## N10 — Begriffe umbenennen (nur Übungs-Themen)

**Problem:** Übungs-Themen-Status heissen "Aktiv" und "Abgeschl." — sollen "Aktuell" und "Freigegeben" heissen. Nicht freigegebene Themen brauchen kein Label.

**Änderungen:**

| Datei | Zeile | Alt | Neu |
|-------|-------|-----|-----|
| `src/components/ueben/admin/AdminThemensteuerung.tsx` | 253 | `'Aktiv'` | `'Aktuell'` |
| `src/components/ueben/admin/AdminThemensteuerung.tsx` | 253 | `'z.T. aktiv'` | `'z.T. aktuell'` |
| `src/components/ueben/admin/AdminThemensteuerung.tsx` | 254 | `'Abgeschl.'` | `'Freigegeben'` |
| `src/components/ueben/admin/AdminThemensteuerung.tsx` | 254 | `'Nicht freig.'` | Badge komplett entfernen (kein leerer Span, `null` zurückgeben) |

**Nicht ändern:**
- `Home.tsx:207` — dort ist "Aktiv" ein **Prüfungsstatus** (configStatus für Prüfungen), nicht für Übungsthemen
- `SchuelerZeile.tsx`, `AktivPhase.tsx` — ebenfalls Prüfungsstatus
- `ThemaKarte.tsx:80` — zeigt bereits "Aktuell" (SuS-Ansicht, korrekt)

**Risiko:** Gering. Nur UI-Labels, keine Logik-Änderung. Grep nach weiteren Vorkommen im Übungs-Kontext vor Umsetzung.

---

## N13 — Fach-Farbpunkte: Position konsistent (links)

**Problem:** LP-Ansicht zeigt den Fach-Farbpunkt links vom Themennamen, SuS-Ansicht zeigt ihn rechts (in ThemaKarte.tsx Zeile 114-116, in einem `flex justify-between` Container).

**Lösung:** In ThemaKarte.tsx den Farbpunkt von rechts (Ende des flex-Containers) nach links verschieben — vor den Themennamen, wie in der LP-Ansicht.

**Dateien:** `src/components/ueben/ThemaKarte.tsx`

**Risiko:** Gering. Layout-Änderung, prüfen ob Dark Mode + Mobile korrekt.

---

## N17 — "Fachbereich" → "Fach" (nur UI-Label)

**Problem:** Im Frageneditor-Dropdown "Gruppieren" steht "Fachbereich" statt "Fach".

**Lösung:** `FragenBrowserHeader.tsx` Zeile 339: `<option value="fachbereich">Fachbereich</option>` → `<option value="fachbereich">Fach</option>`. Nur das sichtbare Label, der `value` bleibt `"fachbereich"`.

**Dateien:** `src/components/lp/fragenbank/fragenbrowser/FragenBrowserHeader.tsx`

**Risiko:** Keine. Rein kosmetisch, ein Wort.

---

## N18 — Icons bei Fragetypen entfernen

**Problem:** Die Fragetyp-Kategorien in FrageTypAuswahl.tsx zeigen Emoji-Icons vor dem Kategorienamen (📝, ☑️, 🖼️, 🔬, 📊, 📦).

**Lösung:**
1. `icon`-Feld aus dem `Kategorie`-Interface und `KATEGORIEN`-Array entfernen
2. Rendering ändern: `{kat.icon} {kat.label}` → `{kat.label}`

**Dateien:** `packages/shared/src/editor/components/FrageTypAuswahl.tsx`

**Risiko:** Keine. Rein kosmetisch.

---

## Zusammenfassung der betroffenen Dateien

| Datei | Änderungen |
|-------|-----------|
| `src/components/lp/LPHeader.tsx` | N3: Button nur auf Dashboard ausblenden |
| `packages/shared/src/editor/components/BildUpload.tsx` | N5+N6: Vorschau entfernen, Textbutton neben URL |
| `src/components/ueben/admin/AdminThemensteuerung.tsx` | N10: Labels umbenennen (Aktuell, Freigegeben) |
| `src/components/ueben/ThemaKarte.tsx` | N13: Farbpunkt nach links |
| `src/components/lp/fragenbank/fragenbrowser/FragenBrowserHeader.tsx` | N17: "Fachbereich" → "Fach" |
| `packages/shared/src/editor/components/FrageTypAuswahl.tsx` | N18: Icons entfernen |

## Testplan

- [ ] LPHeader Dashboard: Nur ein "Fragensammlung"-Eintrag sichtbar (Tab), kein separater Button
- [ ] LPHeader Sub-Page (z.B. PruefungsComposer): Fragensammlung-Button weiterhin sichtbar und funktional
- [ ] BildUpload: Kein kleines Vorschaubild, "Bild entfernen" rechts neben URL, grosses Bild im Editor weiterhin korrekt
- [ ] AdminThemensteuerung: "Aktuell" statt "Aktiv", "z.T. aktuell" statt "z.T. aktiv"
- [ ] AdminThemensteuerung: "Freigegeben" statt "Abgeschl.", kein Badge für nicht freigegebene
- [ ] ThemaKarte (SuS): Farbpunkt links vom Themennamen
- [ ] FragenBrowserHeader: Dropdown zeigt "Fach" statt "Fachbereich"
- [ ] FrageTypAuswahl: Keine Emoji-Icons vor Kategorienamen
- [ ] Light + Dark Mode bei allen Änderungen prüfen
- [ ] tsc -b ✅, vitest run ✅, build ✅
