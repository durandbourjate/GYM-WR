# Quick-Wins (A1–A4) — Implementierungsplan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4 Erweiterungen bestehender Fragetypen: Wörterzähler, Inline-Choice, steuerbare Rechtschreibprüfung, Rich-Text-Referenzpanel.

**Architecture:** Additive Erweiterungen — bestehende Komponenten erweitern, keine neuen Fragetypen.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS v4, Tiptap, Vitest

**Spec:** `docs/superpowers/specs/2026-03-28-oeffnung-plattform-design.md` (Strang 2, Gruppe A)

---

## Task 1: Wörterzähler (A1)

**Files:**
- Modify: `src/components/fragetypen/FreitextFrage.tsx` (SuS-Ansicht — hat bereits Wort-/Zeichenzähler!)
- Modify: `src/components/lp/frageneditor/FreitextEditor.tsx` (LP-Editor)
- Modify: `src/types/fragen.ts` (FreitextFrage-Interface)

**Aktueller Stand:** FreitextFrage.tsx zeigt BEREITS Wort- und Zeichenzähler (Zeile ~220). Es gibt auch `maxZeichen` als Limit. Was FEHLT: `minWoerter`/`maxWoerter` als LP-konfigurierbare Limits.

- [ ] **Step 1:** In `types/fragen.ts`, `FreitextFrage`-Interface erweitern:
  ```typescript
  minWoerter?: number    // optionales Minimum
  maxWoerter?: number    // optionales Maximum
  ```

- [ ] **Step 2:** In `FreitextEditor.tsx` zwei numerische Inputs hinzufügen: "Min. Wörter" und "Max. Wörter" (optional, leer = kein Limit).

- [ ] **Step 3:** In `FreitextFrage.tsx` den bestehenden Wörterzähler erweitern: bei Über-/Unterschreitung des Limits Warnung in rot/amber anzeigen (nicht blockierend).

- [ ] **Step 4:** `npx tsc -b && npx vitest run` — alles grün.

- [ ] **Step 5:** Commit: `feat: Wörterzähler mit Min/Max-Limit für Freitext`

---

## Task 2: Inline-Choice / Dropdown-Lückentext (A2)

**Files:**
- Modify: `src/types/fragen.ts` (LueckentextFrage.luecken Item)
- Modify: `src/components/fragetypen/LueckentextFrage.tsx` (SuS: select statt input)
- Modify: `src/components/lp/frageneditor/LueckentextEditor.tsx` (LP: Dropdown-Optionen definieren)
- No change needed: `src/utils/autoKorrektur.ts` (Vergleich gegen korrekteAntworten funktioniert bereits)

- [ ] **Step 1:** In `types/fragen.ts`, Lücken-Item erweitern:
  ```typescript
  luecken: {
    id: string;
    korrekteAntworten: string[];
    caseSensitive: boolean;
    dropdownOptionen?: string[];  // NEU: wenn gesetzt → Dropdown statt Freitext
  }[];
  ```

- [ ] **Step 2:** In `LueckentextFrage.tsx` (SuS): Im `{{N}}`-Branch prüfen ob `luecke.dropdownOptionen?.length > 0`. Falls ja → `<select>` rendern mit allen Optionen (zufällig gemischt) + leere Default-Option "– wählen –". Falls nein → bestehender `<input>`.

- [ ] **Step 3:** In `LueckentextEditor.tsx` (LP): Pro Lücke ein zusätzliches Feld "Dropdown-Optionen" (Komma-getrennt). Wenn ausgefüllt → Lücke wird als Dropdown dargestellt. Erste korrekte Antwort muss in den Optionen enthalten sein (Validierung/Hinweis).

- [ ] **Step 4:** `npx tsc -b && npx vitest run` — alles grün.

- [ ] **Step 5:** Commit: `feat: Inline-Choice — Lückentext mit Dropdown-Optionen`

---

## Task 3: Rechtschreibprüfung steuerbar (A3)

**Files:**
- Modify: `src/types/pruefung.ts` (PruefungsConfig)
- Modify: `src/components/lp/vorbereitung/composer/ConfigTab.tsx` (LP-Einstellung)
- Modify: `src/components/fragetypen/FreitextFrage.tsx` (spellcheck-Attribut)
- Modify: `src/components/fragetypen/LueckentextFrage.tsx` (spellcheck-Attribut)
- Modify: `src/store/pruefungStore.ts` oder `Layout.tsx` (Config an Fragetypen durchreichen)

- [ ] **Step 1:** In `types/pruefung.ts`, PruefungsConfig erweitern:
  ```typescript
  rechtschreibpruefung?: boolean  // Default true (Browser-Verhalten), LP kann deaktivieren
  rechtschreibSprache?: 'de' | 'fr' | 'en' | 'it'  // setzt lang-Attribut
  ```

- [ ] **Step 2:** In `ConfigTab.tsx`: Toggle "Rechtschreibprüfung" (Default: aktiv) + Sprach-Dropdown wenn deaktiviert nicht nötig, wenn aktiv: Sprachauswahl.

- [ ] **Step 3:** In `FreitextFrage.tsx` und `LueckentextFrage.tsx`: `spellCheck` und `lang` Attribute aus der Prüfungs-Config lesen und auf Input/Editor setzen. Wenn `rechtschreibpruefung === false` → `spellCheck={false}`.

- [ ] **Step 4:** `npx tsc -b && npx vitest run` — alles grün.

- [ ] **Step 5:** Commit: `feat: Rechtschreibprüfung pro Prüfung steuerbar`

---

## Task 4: Rich-Text-Referenzpanel (A4)

**Files:**
- Modify: `src/types/pruefung.ts` (PruefungsMaterial — `typ: 'richtext'` hinzufügen)
- Modify: `src/components/MaterialPanel.tsx` (Rich-Text rendern)
- Modify: `src/components/lp/vorbereitung/composer/ConfigTab.tsx` oder MaterialEditor (Rich-Text als Material-Option)

- [ ] **Step 1:** In `types/pruefung.ts`, `PruefungsMaterial.typ` erweitern um `'richtext'`. Feld `inhalt?: string` wird für den HTML-Content genutzt (existiert bereits).

- [ ] **Step 2:** In `MaterialPanel.tsx`: Neuer Branch für `typ === 'richtext'`: `inhalt` als HTML rendern via `dangerouslySetInnerHTML` mit DOMPurify-Sanitierung. Styling: `prose dark:prose-invert` Tailwind-Klassen für schöne Typografie.

- [ ] **Step 3:** Im Material-Editor (LP-Seite): Option "Rich-Text" als Material-Typ hinzufügen. Tiptap-Editor für den Inhalt (gleicher Editor wie im Fragentext). LP kann Referenztext formatiert eingeben.

- [ ] **Step 4:** `npx tsc -b && npx vitest run && npm run build` — alles grün.

- [ ] **Step 5:** Commit: `feat: Rich-Text-Referenzpanel als Material-Typ`

---

## Task 5: Abschluss-Verifikation

- [ ] `npx tsc -b` → 0 errors
- [ ] `npx vitest run` → alle Tests grün
- [ ] `npm run build` → success
- [ ] HANDOFF.md aktualisieren
- [ ] Finaler Commit + Push
