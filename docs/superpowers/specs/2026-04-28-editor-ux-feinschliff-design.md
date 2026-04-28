# ExamLab Editor-UX Feinschliff — Design Spec

> Bundle H: Editor-Vereinheitlichung (Violett-System), Fragetyp-spezifische Cleanups, SuS-Tastaturnavigation, Schülercode-UI-Ausblendung
> Datum: 2026-04-28
> Status: In Review (rev3 nach Reviewer-Findings)
> Vorgänger: S155 Bundle G.f.2 (Skeleton-Pattern, Merge `623536b`)

---

## Zusammenfassung

Editor-übergreifender Konsistenz-Pass + 4 typ-spezifische Vereinfachungen + SuS-UX-Verbesserungen. Ein **Violett-Pflichtfeld-System** ersetzt heute uneinheitliche Indigo/Emerald-Markierungen und kennzeichnet semantisch „da musst du noch etwas eingeben" — sowohl im Editor (LP) als auch im Übungs-/Prüfungs-Modus (SuS, vor Antwort prüfen). **Sortierung** wird MC-artig vereinfacht, **Bildbeschriftung** verliert die manuellen Koordinaten-Inputs, **Drag&Drop-Bild + Hotspot** verlieren die Form-/Punkte-Count-Indikatoren, **Drag&Drop-Bild** erlaubt zusätzlich Mehrfach-Zone-Akzeptanz desselben Labels mit Pool-Dedupe. **Audio**-Fragetyp wird aus dem Editor-Dropdown ausgeblendet (Backend-Code bleibt für Re-Aktivierung nach Backend-Migration). **SuS-Üben** bekommt Enter/Cmd+Enter-Hotkeys. **Schülercode-Login** wird UI-seitig deaktiviert (Code bleibt im Frontend + Apps-Script).

---

## Scope

**In Scope:**

1. Violett-Pflichtfeld-System (Editor-Hervorhebung, 3 Stufen)
2. Audio-Fragetyp aus Typ-Dropdown ausblenden
3. SuS-Tastaturnavigation (Enter/Cmd+Enter)
4. Drag&Drop-Bild + Hotspot: Form-Indicator + Punkte-Count entfernen
5. Bildbeschriftung: Manuelle Koordinaten-Inputs entfernen
6. Sortierung-Editor: MC-artige UI + Bulk-Paste
7. Drag&Drop-Bild: Pool-Dedupe (NUR Anzeige; Multi-Zone-Akzeptanz separat — siehe Out of Scope)
8. SuS-Modus: Zone-Outline-Markierung leerer Zonen / Lücken / Marker
9. Schülercode-Login UI ausblenden

**Out of Scope:**

- Performance-Audit (LP-Üben-Start 20s, SuS-Login 25s) → eigener „Bundle I — Performance" nach Latenz-Mapping
- Audio-Fragetyp Re-Aktivierung (wartet auf Backend-Migration vom Apps-Script)
- Schülercode-Login Code-Removal (frühestens 4–6 Wochen nach Bundle H, wenn keine SuS-Anfragen kommen)
- **Drag&Drop-Bild Multi-Zone-Akzeptanz** (derselbe Begriff zu mehreren Zonen) — heute indiziert der Korrektur-Algorithmus in `korrektur.ts` und `apps-script-code.js` `zuordnungen[korrektesLabel]` als Map-Key statt `[zoneId]`. Mehrfach-Akzeptanz braucht eine Datenmodell-Migration (Frontend-Korrektur, Apps-Script-Spiegel, Bestand-Migration). Wird als eigener Bundle (vorgesehen: „Bundle J — Multi-Zone-Datamodell") später adressiert.
- Globale Editor-Refactors (Datei-Splits, etc.) ausserhalb der oben genannten Punkte

---

## Entscheidungs-Tabelle

| # | Entscheidung | Gewählt | Verworfene Alternativen |
|---|---|---|---|
| A1 | Audio im Editor | Aus Typ-Dropdown filtern, Code/Renderer bleiben | Komplette Entfernung (verfrüht), Feature-Flag (überdesignt für Single-Bool) |
| A2 | Tastatur SuS-Üben | Enter ausserhalb Textarea + Cmd/Ctrl+Enter überall | Nur Enter (kollidiert mit Freitext), nur Cmd+Enter (zu unbekannt) |
| A3 | Zone-Listen-Indikatoren | Form-Icon + Punkte-Count weg | Nur Zahl weg (Icon allein verwirrend), nur Icon weg (Inkonsistent) |
| A4 | Bildbeschriftung Koord-Inputs | x/y-Number-Inputs weg, Maus-only | Behalten (Doppel-Eingabe), Konvertierung in Bewegungs-Pfeile (overengineered) |
| A5 | Pflichtfeld-Hervorhebung | Violett, 3 Stufen, gekoppelt an `pruefungstauglich` | Nur Pflicht/Optional (zu binär), Rot statt Violett (Kollision mit Fehler-Rot) |
| B1 | Schülercode-Login | UI verstecken, Backend bleibt | Code löschen (verfrüht), Server-Side abschalten (kein Rollback-Pfad) |
| B2 | Sortierung-Editor | MC-Pattern + Bulk-Paste-Knopf | Nur Textarea (Status-quo), nur Vorschau-Liste (kein Bulk-Pfad) |
| B3 | Drag&Drop Multi-Zone | Nur Pool-Dedupe in der SuS-Anzeige (rein kosmetisch). Echte Multi-Zone-Akzeptanz vertagt — siehe Out of Scope, Issue 1 im Reviewer-Findings: Korrektur-Algorithmus indiziert per Label, nicht Zone-ID, → Multi-Zone würde ohne Datenmodell-Migration zu Korrektur-Bug. | a) Voll-Migration in diesem Bundle (zu invasiv, 4 von 5 kritischen Pfaden tangiert), b) verbrauchbare Tokens mit Vermehrung (UI-komplex) |
| C1 | SuS-Status-Anzeige | Zone-Outline-Pattern (leere Zonen/Lücken violett) | Pool-Hervorhebung (Distraktor-verräterisch), zusätzlich Pool-Häkchen (UI-Lärm) |

---

## 1. Violett-Pflichtfeld-System

### Semantik

> **Violett = „Aufmerksamkeit, hier muss noch etwas hin."**

Das gilt einheitlich:

- **Im Editor (LP):** Pflichtfelder + stark empfohlene Felder, solange sie leer sind
- **Im Üben/Prüfen (SuS, vor Antwort prüfen):** leere Eingabezonen / -lücken / -marker
- **Nach Antwort prüfen (SuS):** Violett verschwindet, Korrektur-Farben (grün/rot/orange) übernehmen

Bestehende uneinheitliche Akzentfarben in den Editoren (Indigo + Emerald in `LueckentextEditor`, Grün/Rot-Badges in MC/RF) werden auf Violett vereinheitlicht, **wo es um „Aufmerksamkeit-Lenkung auf Pflichteingabe" geht**. Die R/F-Buttons selbst bleiben Grün (Richtig) / Rot (Falsch) — das ist semantisch eine andere Achse („Wahrheitswert der Aussage", nicht „hier eingeben").

### Stufen

| Stufe | Verhalten | Speicherung möglich? | Wirkung auf `pruefungstauglich` |
|---|---|---|---|
| **Pflicht** | Violett-Outline auf leerem Feld + Bestätigungsdialog beim Speichern | Ja, nach User-Bestätigung im Dialog | Frage gilt automatisch als nicht prüfungstauglich |
| **Empfohlen** | Violett-Outline auf leerem Feld | Ja | Bei mind. einer leeren Empfohlen-Stelle: `pruefungstauglich = false` (auto, nicht überschreibbar bis gefüllt) |
| **Optional** | Keine Hervorhebung | Ja | Kein Einfluss |

**Bestätigungsdialog bei Pflicht-leer (statt Save-Block):**

> „Diese Frage hat **N Pflichtfelder leer** und wird als nicht prüfungstauglich gespeichert:
> – {Feldname 1}
> – {Feldname 2}
> Trotzdem speichern?" — `[Speichern (nicht prüfungstauglich)] [Abbrechen]`

Default-Button im Dialog ist `[Abbrechen]`. User muss aktiv „Speichern (nicht prüfungstauglich)" wählen — Konsistent zum Doppelte-Label-Dialog (Sektion 7) und zur Klick-Müdigkeit-Mitigation (Risiko 7).

Hintergrund: Strikt-Block birgt Datenverlust-Risiko (Tab-Wechsel = weg) wenn die Validation einen False-Positive wirft. Die `pruefungstauglich=false`-Mechanik erfüllt den Schutz schon. Der Dialog hebt das Bewusstsein ohne Daten zu riskieren.

### Pflichtfeld-Liste pro Fragetyp

| Fragetyp | Pflicht | Empfohlen | Optional |
|---|---|---|---|
| MC | Frage-Text, ≥2 Optionen mit Text, ≥1 Option als korrekt markiert | Erklärung pro Option, Punkte | Kategorien, Tags |
| Richtig/Falsch | Frage-Text, ≥1 Aussage mit Text, jede Aussage R/F-flagged | Erklärung pro Aussage | wie MC |
| Lückentext | Frage-Text, Text-mit-Lücken, pro Lücke ≥1 korrekte Antwort (Freitext) bzw. ≥2 Dropdown-Optionen + ≥1 als korrekt markiert | — | caseSensitive, Synonyme |
| Sortierung | Frage-Text, ≥2 Elemente | Punkte-Modus (Teilpunkte) | — |
| Zuordnung | Frage-Text, ≥2 Paare beidseitig befüllt | — | — |
| Bildbeschriftung | Frage-Text, Bild-URL, ≥1 Marker mit Position + ≥1 akzeptierter Antwort | Mehrere Marker (sinnvoll bei Aufgabe ≥2) | caseSensitive |
| Drag&Drop-Bild | Frage-Text, Bild-URL, ≥1 Zone mit `korrektesLabel`, alle `korrektesLabel` müssen im Pool vorkommen | Distraktoren im Pool (≥1 für sinnvolle Aufgabe) | — |
| Hotspot | Frage-Text, Bild-URL, ≥1 Bereich | Punktzahl pro Bereich, Erklärung | — |
| Freitext | Frage-Text | Musterlösung, Bewertungsraster | — |
| Berechnung | Frage-Text, Korrekte Antwort | Toleranz, Einheit, Erklärung | — |
| FiBu (Buchungssatz / T-Konto / BilanzER / Kontenbestimmung) | Frage-Text, Lösungs-Daten vollständig | Erklärung | — |
| Visualisierung | Frage-Text + fragetyp-spezifischer Sub-Validator (Plan-Task: konkrete Pflichtfelder aus `VisualisierungFrage`-Type ableiten — vermutlich `config.title`, `config.dataPoints` o.ä.) | Erklärung | — |
| Aufgabengruppe | Frage-Text, ≥1 Teilaufgabe; **rekursiv:** alle Teilaufgaben müssen ihre eigenen Pflichten erfüllen. **Tiefen-Limit: max. 3 Verschachtelungs-Ebenen** (Performance + UX); tiefere Strukturen werden im Helper als nicht-validiert behandelt + Console-Warning | Punkte-Verteilung | — |
| PDF-Annotation | Frage-Text, PDF-URL | Punkte | — |
| Code | Frage-Text, Sprache | Musterlösung, Test-Cases | — |
| Formel | Frage-Text, Korrekte Formel | Toleranz, Erklärung | — |
| Zeichnen | Frage-Text | Bewertungsraster, Hintergrund-Bild | — |
| Audio | n/a (Typ ausgeblendet, siehe Sektion 2) | — | — |

### Visual Spec (Tailwind)

- **Violett-Outline auf leerem Pflicht-/Empfohlen-Feld:**
  `border-violet-400 dark:border-violet-500 ring-1 ring-violet-300 dark:ring-violet-600/40`
- **Auf gefülltem Feld:** Standard-Border (`border-slate-200 dark:border-slate-700`)
- **Pflicht-Section-Header (z.B. „Optionen *"):**
  Asterisk in `text-violet-600 dark:text-violet-400`
- **`pruefungstauglich=false`-Badge im Editor-Header (nur LP):**
  Kleiner Hinweis „Nicht prüfungstauglich — siehe violett markierte Felder" (klickbar zum ersten leeren Empfohlen-Feld)

### Z-Order der Outline-Klassen (bei Konflikten)

Editoren haben heute teils Format-Validierungs-Borders (z.B. Berechnung mit ungültiger Toleranz, FiBu mit negativem Saldo). Beim Konflikt rendert nur die höchste Stufe:

1. **Format-Fehler-Rot** (`border-red-400 ring-red-300`) — höchste Priorität
2. **Pflicht-Violett** (gleiche Klassen wie Empfohlen, semantisch via Section-Header-Asterisk + Dialog unterscheidbar)
3. **Empfohlen-Violett**
4. **Standard-Border** — niedrigste Priorität

Helper liefert `string` der finalen Klassen, Editor-Komponenten setzen ihn unverändert.

### Implementierungsort

Eine geteilte Validation-Helper-Funktion pro Fragetyp im neuen Modul `packages/shared/src/editor/pflichtfeldValidation.ts`:

```ts
export type FeldStatus = 'pflicht-leer' | 'empfohlen-leer' | 'ok'
export interface ValidationResult {
  pflichtErfuellt: boolean
  empfohlenErfuellt: boolean
  felderStatus: Record<string, FeldStatus>
}
export function validierePflichtfelder(frage: Frage): ValidationResult
```

Editoren konsumieren das Result, mappen `felderStatus[feldKey]` auf die Outline-Klassen. `validierePflichtfelder` läuft im zentralen Save-Path-Hook und setzt `pruefungstauglich=false` wenn `empfohlenErfuellt=false`. Wenn `pflichtErfuellt=false`: Bestätigungsdialog mit Klartext-Liste der Pflicht-leer-Felder; nach User-Bestätigung wird trotzdem gespeichert (mit `pruefungstauglich=false`).

> **Annahme zu prüfen in Plan-Phase:** Spec geht von einem zentralen Save-Path-Hook aus (vermutlich `SharedFragenEditor::handleSpeichern` oder `bereinigeFrageBeimSpeichern`). Falls keine solche Funktion existiert oder mehrere parallele Save-Pfade vorhanden sind: Plan-Task „zentralen Save-Path-Hook im Editor finden bzw. anlegen" — sonst greift Validation nicht überall.

### Defensiv-Verhalten (Pflicht aus code-quality.md S118)

`validierePflichtfelder` ist defensiv gegen Backend-Inkonsistenzen:

- Null/undefined/non-Array auf erwartet-Array-Feldern → Feld-Status `'ok'` (kein false-positive Block), Console-Warning
- **Unbekannter `frage.typ` (z.B. Tippo wie `'mcc'`)** → `pflichtErfuellt=true, empfohlenErfuellt=false` (Default-Branch im Switch). Begründung: speicherbar (kein Datenverlust), aber automatisch `pruefungstauglich=false` (defensiv: wir wissen nicht ob Pflichten gefüllt sind). Plus: Console-Warning + Sentry-Log mit dem unbekannten Typ-String, damit Tippos sichtbar werden.
- Worst-Case: Helper liefert immer ein gültiges `ValidationResult`-Objekt, niemals throw

Begründung: Validation ist Best-Effort über bekannte Felder. Ein Validation-Bug darf NIEMALS dazu führen, dass eine fertige Frage nicht mehr speicherbar ist (Save-Block-Datenverlust-Klasse). Tests decken die Defensiv-Pfade explizit ab (siehe Test-Strategie).

---

## 2. Audio-Fragetyp aus Typ-Dropdown ausblenden

**Was:** Im Fragetyp-Auswahl-Komponent (`packages/shared/src/editor/sections/FrageTypAuswahl.tsx` bzw. der Dispatcher in `SharedFragenEditor`) wird `'audio'` aus der Liste der wählbaren Typen entfernt.

**Was bleibt:**

- `AudioFrage`-Komponente und Renderer (`SuS`-Side zeigt schon Info-Box)
- Apps-Script Backend-Felder
- Bestehende Audio-Fragen in der Fragensammlung (falls vorhanden) — werden weiter geladen, aber LP kann beim Bearbeiten nicht zu Audio zurück-wechseln

**Bestandsprüfung:**

- Vor Merge: Im Fragensammlung-Sheet zählen wie viele Fragen `typ='audio'` haben (`scripts/audit-bundle-h/zaehleAudioFragen.mjs`, siehe Rollout). Memory deutet auf 0 — falls bestätigt, ist nichts weiter zu tun. Falls >0: User entscheidet, ob diese auf einen anderen Typ konvertiert oder belassen werden.

**Plan-Vorbedingung — Komplette Audio-Inventur:**

Plan-Schritt 1 (vor jeder Code-Änderung) ist ein erschöpfender Such-Sweep:

```bash
grep -rn "'audio'\|\"audio\"\|typ: 'audio'\|typ === 'audio'" \
  ExamLab/src/ ExamLab/packages/shared/src/ 10\ Github/GYM-WR-DUY/apps-script-code.js
```

Alle Stellen, die Audio in einer Liste oder Conditional führen, werden inventarisiert. Bekannte Kandidaten ausser `FrageTypAuswahl`:

- `KIAssistentPanel.tsx` / `KITypButtons.tsx` — Type-Vorschläge der KI
- Apps-Script `klassifiziereFrageEndpoint` (Bundle KI-Kalibrierung S130, siehe Memory) — liefert das Backend `typ='audio'` als Vorschlag?
- `FrageTypeRegistry` o.ä. — zentrale Registry für Typ-Properties
- Tests / Mocks

Wenn `klassifiziereFrage` Audio im Output haben kann: zusätzlich Frontend-Filter beim Empfangen der KI-Klassifikation oder Backend-Anpassung (Apps-Script) — dann **doch** Apps-Script-Deploy nötig. Plan-Phase entscheidet das nach dem Sweep.

**Code-Änderung Umfang (Frontend-only-Pfad):** ~5 Zeilen (eine `.filter()` im Type-Array). Bei Apps-Script-Pfad: ~10 Zeilen Backend + Deploy.

---

## 3. SuS-Tastaturnavigation

**Aktueller Stand:** [UebungsScreen.tsx](ExamLab/src/components/ueben/UebungsScreen.tsx) Zeile 83–93 hat bereits ←/→-Handler.

**Erweiterung:**

| Taste(n) | Wann | Aktion |
|---|---|---|
| `Enter` (Fokus NICHT in Textarea/Multi-Line-Input) | Frage offen, nicht geprüft | Antwort prüfen |
| `Enter` (Fokus NICHT in Textarea) | Frage geprüft, Feedback sichtbar | Nächste Frage |
| `Cmd/Ctrl + Enter` (überall, auch in Textarea) | Frage offen, nicht geprüft | Antwort prüfen |
| `Cmd/Ctrl + Enter` (überall) | Frage geprüft | Nächste Frage |
| `←` / `→` | wie heute | Navigation |
| `Escape` | optional, falls Modal offen | Modal schliessen (no-op falls keins) |

**Textarea-Erkennung:**

```ts
const istTextarea = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false
  if (el.tagName === 'TEXTAREA') return true
  if (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'text') {
    // Multi-line via shift+enter erlaubt? Nein, single-line Input — Enter ist OK
    return false
  }
  if (el.isContentEditable) return true  // Tiptap-Editor (Lückentext-Antworten?)
  return false
}
```

**Edge-Cases:**

- **Lückentext-Antwort-Inputs** sind `<input type="text">`, nicht Textarea → Enter darf prüfen. Aber: User könnte gerade tippen. Lösung: `Enter` prüft NUR wenn alle Eingabefelder gefüllt sind. Sonst: Toast/Inline-Hinweis „Noch {N} Lücken offen", kein Submit. Helper `alleLueckenGefuellt(frage, antworten): boolean`.
- Sortierungs-Liste (Drag-Reorder) — keine Eingabe nötig, Enter prüft sofort.
- Drag&Drop-Bild + Hotspot — Mausinteraktion, Enter prüft.
- Freitext + Berechnung — Textarea/Input, Cmd+Enter zum Prüfen.
- Audio — bleibt Mausklick (deaktiviert für SuS sowieso).

**Plan-Phase-Eintrittsbedingung — Tastatur-Spike (5 Min):**

Der writing-plans-Skill beginnt mit dem Spike als **Task 0** und blockiert weitere Plan-Tasks, bis er durchgelaufen ist. Spike-Resultate fliessen als bekannte Fakten in den Plan-Task „Tastatur-Handler" ein. In DevTools wird für jeden der 4 Spezial-Editoren geprüft, ob `el.isContentEditable` true liefert oder das Element als HTMLInputElement/Textarea erkannt wird:

| Editor | Erwartung | Wenn anders |
|---|---|---|
| Tiptap-Lückentext-Antwort | `isContentEditable=true` | siehe unten Whitelist |
| Formel-Editor (KaTeX/MathLive) | `isContentEditable=true` oder `<input>` | Whitelist |
| Code-Editor (Monaco/CodeMirror) | `isContentEditable=true` | Whitelist |
| FiBu-Tabellen-Inputs | `<input>` | OK (kein Enter-Submit erlaubt) |

**Whitelist-Pattern bei Treffern:** Spezial-Editor-Roots erhalten Attribut `data-no-enter-submit`, der globale Tastatur-Handler überspringt sie:

```ts
const istNonSubmittableElement = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false
  if (el.tagName === 'TEXTAREA') return true
  if (el.isContentEditable) return true
  if (el.closest('[data-no-enter-submit]')) return true
  return false
}
```

**Zusätzlicher visueller Hinweis:** Tooltip am „Antwort prüfen"-Button: „Enter (oder Cmd+Enter im Textfeld)".

---

## 4. Drag&Drop-Bild + Hotspot: Form-Indicator + Punkte-Count entfernen

**Aktueller Stand:**

- `DragDropBildEditor` Zone-Liste: `□ 4 ✕` → Form-Icon (`□` Rechteck, `⬡` Polygon) + Eckpunkte-Count + Löschen
- `HotspotEditor` Bereichs-Liste: identisches Muster

**Änderung:** Form-Icon + Punkte-Count weg. Verbleibend: Zone-Nummer (Index+1) + `korrektesLabel`-Input bzw. `label`-Input + Löschen-X.

**Begründung:** Auf dem Bild sieht man bereits Form (Rechteck vs Polygon-Outline) und Punkte (Eck-Marker). Die Zahlen-Indicator waren Debug-Reste aus der Zeichen-Phase und für die LP nicht relevant.

**Umfang:** ~10–15 Zeilen pro Editor (Zeilen mit `form === 'rechteck' ? '□' : '⬡'` + `{zone.punkte.length}` raus).

---

## 5. Bildbeschriftung: Manuelle Koordinaten-Inputs entfernen

**Aktueller Stand:** Pro Marker zwei `<input type="number">`-Felder für x und y (0–100, %). Datentyp: `BildbeschriftungLabel { id, position: {x, y}, korrekt: string[], caseSensitive?: boolean }` (siehe `types/fragen.ts:610`).

**Änderung:** Number-Inputs für `position.x` / `position.y` raus. Koordinaten werden ausschliesslich per Maus gesetzt (Klick aufs Bild = neuer Marker, Drag = verschieben).

**Marker-Anlage-Verhalten beim Klick:**

- Klick aufs Bild → neuer Marker mit `position={x,y}` (aus Klick-Position) + `korrekt: []` (leer)
- Marker-Anlage **ist nicht abgebrochen** — die Liste enthält den Marker sofort
- Antwort-Input ist sofort violett (Pflicht-leer, Sektion 1) — Marker gilt als unvollständig
- LP kann den Marker per ✕ wieder entfernen, falls Klick versehentlich war

**`korrekt[]`-Eingabe-Feld:** Bleibt, aber der „kommagetrennt"-Hinweis wird vom „pro-Option"-Placeholder zu einer **Section-Header-Beschriftung** verschoben: über der Marker-Liste steht „Marker (Antworten kommagetrennt eingeben)". Pro Input: nur der Inhalt, kein Hinweis-Text mehr. Backend-Parsing `value.split(',').map(t => t.trim()).filter(Boolean)` unverändert.

**Pflichtfeld-Hervorhebung (Punkt 1):** Neuer Marker mit `korrekt=[]` → Antwort-Input violett umrandet, bis ≥1 String im Array.

**`toAssetUrl`-Invariante:** Spec ändert nichts am Bild-Lade-Pfad, aber Plan-Phase muss bei der UI-Refactor-Edits sicherstellen, dass `toAssetUrl(frage.bildUrl)` weiterhin verwendet wird (S115-Regression-Klasse, siehe bilder-in-pools.md G.27). E2E-Test prüft: Bildbeschriftung-Bild lädt korrekt unter `/sus/ueben/`-SPA-Route.

---

## 6. Sortierung-Editor: MC-artige UI + Bulk-Paste

**Aktueller Stand:** Textarea (1 Zeile = 1 Element) + Vorschau-Liste mit ↑/↓-Buttons.

**Neue UI:**

- Liste von Eingabe-Reihen (wie MC-Optionen):
  - `[Drag-Handle ⋮⋮] [Input-Feld] [✕ Löschen]`
- Knopf unter der Liste: `+ Element hinzufügen`
- Knopf neben „+ Element": `📋 Bulk einfügen` → öffnet kleines Modal mit Textarea („Ein Element pro Zeile") + „Übernehmen". Zeilenumbrüche werden gesplittet, leere Zeilen weggeworfen, neue Elemente hinten angefügt (oder ersetzen die Liste — User-Wahl per Radio im Modal).
- Reihenfolge **ist die Lösung** (der erste Eintrag ist der erste in der korrekten Reihenfolge).
- Drag-Handle zum Umsortieren (mit `@dnd-kit/core`, bereits im Repo via [bilder-in-pools.md](10 Github/GYM-WR-DUY/.claude/rules/bilder-in-pools.md):27 Konvention).

**Vorschau:** Entfällt — die Liste IST die Vorschau.

**Datenmodell:** Unverändert (`elemente: string[]` + `teilpunkte: boolean`).

**Empfohlen-Markierung (Punkt 1):** Liste mit <2 Elementen → Section-Header violett.

**Migration:** Keine — Bestand bleibt funktionsidentisch, nur die Eingabe-UI ändert sich.

---

## 7. Drag&Drop-Bild: Pool-Dedupe (Anzeige-only)

**Scope:** Rein kosmetische Dedupe der Pool-Anzeige. Keine Multi-Zone-Akzeptanz (siehe Out of Scope, Issue 1 — würde ohne Datenmodell-Migration zum Korrektur-Bug führen).

**Datenmodell:** 1:1 unverändert (`zone.korrektesLabel: string`).

**LP-Editor-Verhalten:**

- Pro Zone weiter ein einzelnes `korrektesLabel`-Input
- Pool-Liste wie heute (alle Labels inkl. Distraktoren, kommagetrennt)
- **Neu — Doppelte-Label aktive Verhinderung beim Speichern:** Wenn der LP zwei Zonen mit identischem `korrektesLabel` gesetzt hat, zeigt der Editor sofort einen Violett-Outline auf den betroffenen Zonen + eine Warn-Markierung. **Beim Speichern** wird ein Bestätigungsdialog erzwungen (analog zur Pflichtfeld-Logik in Sektion 1):

  > „Diese Frage hat **N Zonen mit identischem korrektem Label** ({Liste}). Im Übungs-/Prüfungs-Modus wird dadurch immer eine dieser Zonen falsch ausgewertet, weil der Korrektur-Algorithmus pro Label-String nur eine Zone prüft. Die Multi-Zone-Akzeptanz wird in einem späteren Bundle nachgereicht.
  >
  > Trotzdem speichern (nicht prüfungstauglich)?" — `[Speichern (nicht prüfungstauglich)] [Abbrechen]`

  Wenn der User „Speichern" wählt: Frage wird gespeichert mit `pruefungstauglich=false`. Default-Button im Dialog ist `[Abbrechen]` (User muss aktiv Speichern wählen). Konsistent zum Pflichtfeld-Dialog-Pattern und zur S130-Lehre, dass Klick-Müdigkeit ein realer Risiko-Pfad ist.

- **Pool-Eingabe:** wenn der LP denselben String 2× im Pool eingibt, wird der zweite ignoriert + Warnung „Doppelter Eintrag entfernt".

**SuS-Anzeige im Pool:**

- Pool-Tokens werden auf eindeutige Strings dedupliziert für die Anzeige: `Array.from(new Set(labels.map(l => l.trim()))).filter(Boolean)` (case-sensitive Vergleich, leading/trailing-Whitespace getrimmt).
- Aktuell sind doppelte Strings im Pool ohnehin Edge-Case (LP hat sie versehentlich getippt) — Dedupe verbessert nur die Optik.
- **Heutiges Token-Verbrauchen-Verhalten unverändert:** Token wandert in Zone, ist im Pool weg (Bestands-Logik bleibt).

**Drop-Verhalten (SuS):** unverändert.

**Korrektheits-Check (unverändert):**

- Pro Zone: `zuordnungen[zone.korrektesLabel] === zone.id` (Backend-/Frontend-Logik wie heute)
- Bei doppelten `korrektesLabel`-Werten in 2 Zonen: bekannter Bug (eine wird zwingend falsch). Der LP wird via Warnung darauf hingewiesen, das Verhalten bleibt aber unverändert bis zum Multi-Zone-Bundle.

**Out of Scope (für späteren Bundle):**

- Echte Multi-Zone-Akzeptanz (siehe Out of Scope-Eintrag oben)
- Pool-Token mehrfach nutzbar (a-Variante des Brainstormings)

---

## 8. SuS-Modus: Zone-Outline-Pattern für leere Antwort-Stellen

Konsistente Anwendung des Violett-Patterns (Punkt 1) auf den **SuS-Antwort-Modus**, **vor** Antwort prüfen:

| Fragetyp | Was wird violett wenn leer | Was passiert nach Befüllung |
|---|---|---|
| MC | Section um Optionen, wenn keine ausgewählt | Violett verschwindet sobald ≥1 Option markiert |
| RF | jede unbeantwortete Aussage | pro Aussage, sobald R/F gewählt |
| Lückentext | jede leere Lücke (Outline + leichter BG) | sobald getippt |
| Sortierung | nichts (Liste ist immer initial sortiert, kein „leer"-Zustand) | n/a |
| Zuordnung | jedes leere Drop-Ziel | sobald zugeordnet |
| Bildbeschriftung | jedes leere Antwort-Input pro Marker | sobald getippt |
| Drag&Drop-Bild | jede leere Zone-Outline | sobald Label gedroppt (Pool-Token wird heute verbraucht — Verhalten unverändert, siehe Sektion 7) |
| Hotspot | nichts (User klickt aufs Bild — keine „leere Eingabe") | n/a |
| Freitext, Berechnung | leeres Input/Textarea | sobald getippt |
| FiBu | leere Eingabe-Zellen | sobald getippt |

**Nach „Antwort prüfen":** Violett verschwindet, Standard-Korrektur-Farben (grün korrekt, rot falsch, orange teilweise) übernehmen.

**Konsistenz mit Editor:** Dieselben Tailwind-Klassen wie unter Punkt 1 (Visual Spec).

**Nicht implementiert:**

- Pool-Token-Häkchen für „schon mal benutzt" (User-Entscheidung Variante a, kein Pool-Indicator)
- Mehrfach-nutzbare Pool-Token (Multi-Zone-Akzeptanz vertagt — siehe Sektion 7 + Out of Scope)

---

## 9. Schülercode-Login: UI ausblenden

**Aktueller Stand — ZWEI Login-Pfade betroffen:**

- **Pfad 1: Prüfungs-SuS-Login**
  - Komponente: `ExamLab/src/components/LoginScreen.tsx`
  - Store: `ExamLab/src/store/authStore.ts::anmeldenMitCode`
- **Pfad 2: Standalone-Üben-Login**
  - Komponente: `ExamLab/src/components/ueben/LoginScreen.tsx`
  - Store: `ExamLab/src/store/ueben/authStore.ts::anmeldenMitCode`
- **Backend:** Kein dedizierter Apps-Script-Endpoint — nur Email-Lookup

**Änderung — beide Pfade:**

- In **beiden** SuS-Login-Screens wird der Code-Input + Code-Button **entfernt** (Block-Removal)
- Frontend-Actions `anmeldenMitCode` bleiben in beiden authStores (tot, aber klar markiert mit Kommentar `// S156: UI ausgeblendet, Code für mögliche Re-Aktivierung. Löschen frühestens nach 4-6 Wochen ohne SuS-Anfragen.`)
- Backend: keine Änderung
- **Plan-Audit:** `grep -rn "anmeldenMitCode" ExamLab/src/components/` → erwartete sichtbare UI-Pfade nach Removal: 0

**Begründung:** SuS haben Schul-Google-Accounts + BYOD. Individualisierung im Üben braucht eindeutige Identität. Code-Login war Anonymitäts-Pfad, nicht mehr nötig.

**Rollback-Pfad:** UI-Block in einer Conditional `if (FEATURE_SCHUELERCODE_LOGIN_UI)` (Compile-Time-Const in `src/featureFlags.ts` o.ä.) — dann reicht ein 1-Zeilen-Toggle für Re-Aktivierung. Alternativ direkter UI-Block-Removal mit Markdown-Notiz im PR.

**Empfehlung:** Direkter Block-Removal + Kommentar im authStore. Feature-Flag-Mechanik einzuführen für ein einziges Feature ist überdesignt; die Aktion ist im Git-History-Revert reversibel.

---

## Datenmodell-Impacts

Keine. Alle Änderungen sind UI-only oder backwards-kompatibel. Insbesondere:

- Sortierung: `elemente: string[]` unverändert
- Drag&Drop-Bild: `zone.korrektesLabel: string` unverändert. **Multi-Zone-Akzeptanz wird NICHT in diesem Bundle gebaut** (siehe Out of Scope) — wäre eine Datenmodell-Migration und ist hier ausgeklammert. Pool-Dedupe ist rein anzeige-kosmetisch.
- Bildbeschriftung: `label.position: {x,y}` und `label.korrekt: string[]` unverändert (nur Eingabe-Path geändert)
- `pruefungstauglich`: existiert bereits, neue Validation-Helper schreibt automatisch via `bereinigeFrageBeimSpeichern`
- Audio: keine Migration

---

## Test-Strategie

### Vitest (Unit + Component)

Pro Editor (8 Editoren): Render-Test mit leerem State + getipptem State, Snapshot der Pflicht-/Empfohlen-Markierung. Validation-Helper-Test pro Fragetyp (Pflicht-Erkennung, Empfohlen-Erkennung, `pruefungstauglich`-Setzen).

Sortierung: Bulk-Paste-Modal-Flow (Eingabe → Übernehmen → Liste-Update + Replace-Modus). Drag-Reorder mit `@dnd-kit/core`-Test-Utilities (`fireEvent.dragStart` / `dragOver` / `drop`-Sequenz).

Drag&Drop-Bild: Pool-Dedupe-Logik (3 Zonen mit zwei doppelten Labels → Pool zeigt 2 Buttons), Doppelte-Label-LP-Warnung, **Korrektheits-Check mit gemockten Antwort-Maps** gegen den `pruefeKorrektheit`-Pfad (auch ohne echtes DnD — verifiziert dass das Bestand-Verhalten unverändert bleibt).

SuS-UebungsScreen: Tastatur-Handler (Enter ohne Textarea-Fokus, Enter mit Textarea-Fokus, Cmd+Enter überall, ←/→ unverändert, `data-no-enter-submit`-Whitelist, Lückentext-„alle Lücken gefüllt"-Check, Toast bei unvollständigen Lücken).

Pflichtfeld-Validation: Tabelle aus Punkt 1 → 1 Test-Case pro Zelle (Pflicht erfüllt vs leer × Empfohlen erfüllt vs leer × `pruefungstauglich`-Resultat). **Defensiv-Pfade**: explizite Tests mit `null` / `undefined` / `[]` / unbekanntem `frage.typ` — alle müssen `pflichtErfuellt=true` liefern (kein Crash, kein Block).

Bestätigungsdialog (Pflicht-leer Save): Render-Test mit Klartext-Liste, `[Speichern]`-Click ruft `onSpeichern` mit `pruefungstauglich=false`, `[Abbrechen]` schliesst Dialog ohne State-Änderung.

**Erwartung:** ~50–70 neue Tests, Gesamt-Suite weiterhin grün (heute 827).

### E2E-Browser-Test (Chrome-in-Chrome, echte Logins)

Pflicht-Test-Pfade (gemäss [regression-prevention.md](10 Github/GYM-WR-DUY/.claude/rules/regression-prevention.md)):

1. **LP-Editor (alle 8 betroffenen Fragetypen):**
   - Frage anlegen, Pflicht-Felder violett bestätigen
   - Felder füllen, Violett verschwindet
   - Pflicht-leer + Speichern-Klick → Bestätigungsdialog erscheint mit Klartext-Liste, „Speichern" speichert mit `pruefungstauglich=false`, „Abbrechen" verwirft
   - Empfohlen-Felder leer lassen, Speichern (ohne Dialog) → `pruefungstauglich=false`-Badge sichtbar
   - Audio-Typ darf nicht im Dropdown erscheinen (auch nicht via KI-Klassifikation, falls Backend Audio noch vorschlägt)
   - Drag&Drop-Bild: 2 Zonen mit identischem `korrektesLabel` → Doppelte-Label-Warnung sichtbar
   - Sortierung: Bulk-Paste-Knopf öffnet Modal, 5 Zeilen einfügen, übernehmen, Liste füllt sich
   - Bildbeschriftung-Bild lädt korrekt unter `/sus/ueben/`-SPA-Route (toAssetUrl-Invariante)
2. **SuS-Üben:**
   - Lückentext-Frage starten, leere Lücken violett, ←/→ funktioniert, Enter wenn alle Lücken gefüllt prüft, Enter mit offenen Lücken → Toast, kein Submit
   - Freitext-Frage offen halten, Enter im Textarea fügt Newline (kein Prüfen), Cmd+Enter prüft
   - Bildbeschriftung: Marker per Klick erstellt, getippte Antwort entfernt Violett
   - Drag&Drop-Bild: Token wandert in Zone, ist im Pool weg, Zone-Outline-Violett verschwindet
   - Schülercode-Login-Button darf NICHT erscheinen — beide Pfade (Prüfung + Standalone-Üben), Google-Login funktioniert
3. **Regressions (kritische Pfade aus regression-prevention.md):**
   - SuS lädt Prüfung
   - SuS Heartbeat + Auto-Save
   - SuS Abgabe
   - LP Monitoring
   - LP Korrektur — insb. dass Bestand-Drag&Drop-Bild-Korrektur unverändert läuft

**Test-Plan-Pflicht:** Vor Browser-Test schriftlicher Test-Plan im Chat (siehe Phase 3.0 in regression-prevention.md).

### Apps-Script-Tests

Nicht nötig — keine Backend-Änderungen.

---

## Risiken

1. **Bestandsfragen mit unvollständigen Empfohlen-Feldern:** Werden nach Bundle H **beim nächsten Edit** (nicht durch Bulk-Migration!) als nicht prüfungstauglich markiert. Memory weiss von 2412 Fragen im Sheet, alle aktuell ohnehin auf `pruefungstauglich=false` (C9 Migration). Trotzdem relevant: wenn der LP eine aktive Prüfung verwendet und beim Edit plötzlich `pruefungstauglich=false` rein-flippt, könnten Folge-Probleme entstehen. **Mitigation:** Drittes Audit-Skript `zaehleEmpfohlenLeere.mjs` (siehe Rollout) zählt Bestandsfragen mit leeren Empfohlen-Feldern pro Typ. Ergebnis dem User vor Merge melden. Plus: Spec-Klarstellung — Bestand kippt NUR beim nächsten Edit, nicht durch Server-Migration.
2. **Tastatur-Konflikt mit Tiptap/Formel/Code-Editor:** Plan-Vorbedingung 5-Min-Spike (siehe Sektion 3). Bei Treffern: `data-no-enter-submit`-Whitelist. **Verifikation:** Vitest-Test mit gemockten ContentEditable + E2E-Test im Browser pro Editor-Typ.
3. **Schülercode-Login UI-Removal:** Sollte ein SuS sich bisher nur per Code angemeldet haben (kein Google-Account hinterlegt), wäre er ausgesperrt. **Mitigation:** User hat bestätigt, dass alle SuS Google-Accounts haben. Falls Edge-Case auftaucht: Rollback per Git-Revert.
4. **Pool-Dedupe ändert SuS-Wahrnehmung:** Heute zeigt der Pool jedes Label, auch versehentliche Doppelte. Neu wird dedupliziert. **Mitigation:** Audit-Skript `zaehleDuplizierteDragDropLabels.mjs` zählt betroffene Fragen vor Merge. LP wird via Editor-Warnung auf doppelte Labels hingewiesen.
5. **Validation-Helper als zentrale Stelle:** Wenn die Definition welche Felder „Pflicht" vs „Empfohlen" sind, sich später ändert, muss die Helper-Tabelle nachgezogen werden. **Mitigation:** Tabelle in Punkt 1 + Test-Cases pro Fragetyp halten die Definition stabil. Defensiv-Verhalten (Sektion 1) garantiert: Bug im Helper kann NIE zu Save-Block werden.
6. **Multi-Zone-Korrektur-Bug bleibt vorerst bestehen:** Wenn ein LP heute zwei Zonen mit identischem `korrektesLabel` setzt, wird eine zwingend falsch ausgewertet. Bundle H verhindert das beim Speichern mit Bestätigungsdialog (Sektion 7) + automatischem `pruefungstauglich=false`. **Mitigation:** Aktive Verhinderung beim Speichern statt nur Warnung + Out-of-Scope-Eintrag dokumentiert den Bundle J-Plan. Audit-Skript `zaehleDuplizierteDragDropZonen.mjs` zählt heute betroffene Bestand-Fragen → User-Decision vor Merge ob ein Quick-Fix-Bundle vorgezogen werden muss.
7. **Klick-Müdigkeit bei Bestätigungsdialogen (neu durch rev2-Pattern):** Sowohl der Pflichtfeld-Dialog als auch der Doppelte-Label-Dialog können von einer LP unter Zeitdruck reflexartig durchgeklickt werden — die Frage wird dann degradiert ohne Awareness. **Mitigation:** (a) Default-Button im Dialog ist `[Abbrechen]`, User muss aktiv „Speichern" wählen; (b) `pruefungstauglich=false`-Badge prominent + klickbar im Editor-Header (siehe Sektion 1 Visual Spec); (c) E2E-Test prüft, dass nach Dialog-Bestätigung der Badge sichtbar ist; (d) Dialog-Button-Label ist explizit „Speichern (nicht prüfungstauglich)" statt nur „Speichern", damit das degraded-Status klar wird.

---

## Rollout

**Branch:** `feature/editor-ux-feinschliff-bundle-h`

**Apps-Script-Deploy:** Vermutlich nicht nötig — abhängig vom Audio-Sweep-Ergebnis (siehe Sektion 2). Falls KI-Klassifikation Audio im Backend vorschlägt, kommt eine Backend-Anpassung dazu.

**Audit-Skripte vor Merge:**

- `scripts/audit-bundle-h/zaehleAudioFragen.mjs` (erwartet 0)
- `scripts/audit-bundle-h/zaehleDuplizierteDragDropLabels.mjs` — Pool-Strings mit Doppel (erwartet 0; falls >0: User-Review)
- `scripts/audit-bundle-h/zaehleDuplizierteDragDropZonen.mjs` — Zonen mit identischem `korrektesLabel` über mehrere Zonen einer Frage (deckt den Multi-Zone-Bug auf; falls >0: User entscheidet ob Bundle J vorzuziehen)
- `scripts/audit-bundle-h/zaehleEmpfohlenLeere.mjs` — pro Fragetyp Anzahl Bestandsfragen mit leeren Empfohlen-Feldern. Reine Information für User vor Merge — keine harte Schwelle.

**Merge-Gate:**

- Vitest grün
- `npx tsc -b` grün
- Build grün
- E2E-Test mit echten Logins (LP+SuS) durchgeführt + dokumentiert
- Security-Verifikation (Phase 4 regression-prevention.md)
- Audit-Skript-Ergebnisse dem User gemeldet
- LP-Freigabe explizit
- HANDOFF.md aktualisiert

**Schätzung:** 6–8h Implementation in einer Session, plus 1–2h E2E-Test. Subagent-driven-development geeignet wenn Plan klar in unabhängige Tasks zerlegt ist (Validation-Helper, Sortierung, Drag&Drop-Bild, Bildbeschriftung, Tastatur, Schülercode = 6 parallele Tasks). **Wichtig (S154-Lehre):** Subagent-driven-development funktioniert NICHT im Sub-Sub-Level — Sub-Master darf nicht selbst dispatchen, Tasks müssen direkt von der Haupt-Session aus laufen.

**Post-Merge-Reminder (für Schülercode-Code-Removal):**

Der Plan muss als **letzten Task vor `git push origin main`** (gleicher Schritt wie HANDOFF.md-Update) explizit aufnehmen: „Reminder anlegen via `mcp__scheduled-tasks__create_scheduled_task` mit Datum 2026-06-09 und Prompt: ‚Sind in den letzten 6 Wochen SuS-Anfragen wegen fehlendem Code-Login gekommen? Wenn nein: Code-Removal-PR öffnen — siehe Bundle H Sektion 9.'" — Der Plan-Task ist Pflicht, damit der Reminder nicht in der Memory hängen bleibt sondern aktiv getriggert wird.

**Folge-Sessions:**

- **Bundle I — Performance-Audit** (eigener Spec): SuS-Login-Latenz, LP-Üben-Start-Latenz mit Network-Trace + Hebel-Hypothesen
- **Bundle J — Multi-Zone-Datenmodell** (eigener Spec): Drag&Drop-Bild Korrektur-Algorithmus auf Zone-ID-Key migrieren + Apps-Script-Spiegel + Bestand-Migration. Adressiert Issue 1 aus Bundle-H-Reviewer.
- **Schülercode-Code-Removal** (≈6 Wochen nach Bundle H, getriggert durch scheduled-task)

---

## Open Questions

Keine — alle Designentscheidungen wurden im Brainstorming bestätigt. Beim Übergang zur Plan-Phase werden ggf. Klein-Details (z.B. exakte Tailwind-Klassen für Light/Dark, genaue Position des `pruefungstauglich`-Badges) offen — diese gehören in den Plan, nicht den Spec.

---

## Revisionen

### rev2 (2026-04-28, nach Spec-Reviewer)

Reviewer-Findings adressiert:

- **Issue 1 (Critical):** Multi-Zone-Akzeptanz aus Bundle H entfernt → Out of Scope „Bundle J — Multi-Zone-Datenmodell". Sektion 7 auf reine Pool-Anzeige-Dedupe + LP-Warnung reduziert.
- **Issue 2 (Major):** Pflichtfeld-Tabelle um 7 Typen ergänzt (Visualisierung, Aufgabengruppe, PDF, Code, Formel, Zeichnen, Audio=n/a). Default-Branch im Helper für unbekannte Typen.
- **Issue 3 (Major):** Sektion 9 nennt beide Login-Pfade (Prüfung + Standalone-Üben) und beide authStores.
- **Issue 4 (Minor/Prozess):** Post-Merge-Reminder via `mcp__scheduled-tasks__create_scheduled_task` für 2026-06-09 in Rollout-Sektion.
- **Issue 5 (Major):** Save-Block durch Bestätigungsdialog ersetzt (Stufen-Tabelle + neue Dialog-Spec).
- **Issue 6 (Major):** Drittes Audit-Skript `zaehleEmpfohlenLeere.mjs` aufgenommen, plus viertes `zaehleDuplizierteDragDropZonen.mjs` für Multi-Zone-Bug-Detection. Klarstellung „Bestand kippt nur beim Edit".
- **Issue 7 (Minor):** Defensiv-Spec für `validierePflichtfelder` in Sektion 1 ergänzt — null/undefined/Array-Fehler liefern `pflichtErfuellt=true`, nie Crash, nie Block.
- **Issue 8 (Major):** Tastatur-Spike-Vorbedingung in Sektion 3 + Lückentext-„alle Lücken gefüllt"-Check + `data-no-enter-submit`-Whitelist-Pattern.
- **Issue 9 (Minor):** Vitest-Korrektheits-Test ohne DnD + `@dnd-kit`-Drag-Reorder-Test in Test-Strategie.
- **Issue 10 (Minor):** Sektion 5 nutzt jetzt die echten Type-Definitions (`label.position`, `label.korrekt[]`) und klärt Marker-Anlage-Verhalten.
- **Issue 11 (Minor):** `toAssetUrl`-Invariante in Sektion 5 + E2E-Test-Pfad.
- **Issue 12 (Minor):** Plan-Schritt 1 Audio-Sweep über ganzes Projekt + KI-Klassifikation-Backend prüfen.
- **Issue 13 (Minor):** Z-Order der Outline-Klassen in Sektion 1 Visual Spec.

Nicht adressiert (bewusst): keine.

### rev3 (2026-04-28, nach 2. Reviewer-Iteration)

Reviewer-rev2-Findings adressiert:

- **Issue A (Major):** Sektion 7 — Doppelte-Label-Setzung wird beim Speichern via Bestätigungsdialog aktiv verhindert (analog Pflichtfeld-Pattern), automatisch `pruefungstauglich=false`, Default-Button `[Abbrechen]`. Risiko 6 entsprechend angepasst.
- **Issue B (Minor):** Rollout — Post-Merge-Reminder als Pflicht-Plan-Task vor `git push origin main` formuliert. Wandert in writing-plans-Verantwortung.
- **Issue C (Minor):** Sektion 1 Defensiv-Verhalten — Default-Branch für unbekannten `frage.typ` konservativer: `pflichtErfuellt=true, empfohlenErfuellt=false` (speicherbar, aber `pruefungstauglich=false`) + Sentry-Log.
- **Issue D (Minor):** Sektion 3 Tastatur-Spike als harte Plan-Phase-Eintrittsbedingung (Task 0, blockiert weitere Plan-Tasks).
- **Issue E (Minor, neu):** Risiko 7 — Klick-Müdigkeit bei Bestätigungsdialogen. Mitigation: Default-Abbrechen, prominent `pruefungstauglich=false`-Badge, expliziter Button-Label „Speichern (nicht prüfungstauglich)".
- **Issue F (Minor):** Sektion 1 — `bereinigeFrageBeimSpeichern` als Plan-Phase-Annahme markiert; Plan-Task fallback falls Funktion nicht existiert.
- **Issue G (Minor):** Sektion 2 — KI-Klassifikations-Backend explizit referenziert (`klassifiziereFrageEndpoint`, S130 KI-Kalibrierung).
- **Issue H (Minor):** Pflichtfeld-Tabelle — Visualisierung präzisiert (Sub-Validator als Plan-Task), Aufgabengruppe Tiefen-Limit max. 3 Ebenen.

Nicht adressiert (bewusst): keine.
