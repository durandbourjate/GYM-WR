# `no-danger` Bestandsaufnahme (28.05.2026)

> **UPDATE 28.05.2026 SPÄT-2:** Der primäre Audit-Target `FreitextFrage.tsx:317` wurde direkt im Anschluss an dieses Inventar gefixt (Commit `ecc5e5c`). Diese Datei dokumentiert den Stand vor dem Fix; eine spätere `no-danger`-Audit-Session braucht nur noch die übrigen 39 Markdown/LaTeX-Stellen + 2 KaTeX-Sonstiges-Stellen + 1 Backend-HTML-Stelle auf saubere Sanitization-Pfade prüfen. Alle 4 SuS-Antwort-HTML-Render-Stellen sind jetzt DOMPurify-geschützt.

**Zweck:** Vorbereitung für Pre-Sanitisierungs-Audit der ~46 React-Danger-Prop-Stellen aus react-doctor-Warnings vom 28.05.2026.

**Quelle:** `grep -rn 'dangerouslySetInnerHTML' src/ --include='*.tsx' --include='*.ts' | grep -v -E '(test\.|\.test)'`

**Stand:** main @ `efc8287` (Branch `fix/react-doctor-folge-prio1-prio2`)

**Gesamt-Anzahl:** 47 Hits (Memory rechnete mit ~46 — passt gut).

> Hinweis: 2 weitere Zeilen im grep-Output sind Kommentar-/Doku-Zeilen (`src/utils/highlight.tsx:6` und `src/utils/markdown.ts:4`) — kein echtes Prop. Nicht in den Tabellen aufgeführt.

---

## Kategorisierung

### Markdown/LaTeX-Rendering (sanitisiert via `renderMarkdown` / `renderLatexSync` / KaTeX)

Diese 40 Stellen rendern Lehrperson-erstellten Inhalt aus dem Frageneditor. Der Text wird durch `renderMarkdown` (markdown-it) oder `renderLatexSync` (KaTeX-Wrapper) transformiert. Das Risiko hängt davon ab, ob markdown-it HTML-Tags erlaubt und wie streng die Allowlist ist — zu prüfen in `src/utils/markdown.ts`.

| File:Line | Kontext | Sanitization-Quelle (zu prüfen) |
|---|---|---|
| `src/components/fragetypen/AudioFrage.tsx:43` | `frage.fragetext` | `renderMarkdown` |
| `src/components/fragetypen/AufgabengruppeFrage.tsx:87` | `frage.kontext` | `renderMarkdown` |
| `src/components/fragetypen/BerechnungFrage.tsx:66` | `frage.fragetext` (SuS-Übungsansicht) | `renderMarkdown` |
| `src/components/fragetypen/BerechnungFrage.tsx:172` | `frage.fragetext` (Lösungsansicht) | `renderMarkdown` |
| `src/components/fragetypen/BilanzERAufgabe.tsx:117` | `frage.aufgabentext` | `renderMarkdown` |
| `src/components/fragetypen/BilanzERLoesung.tsx:61` | `frage.aufgabentext` | `renderMarkdown` |
| `src/components/fragetypen/BildbeschriftungFrage.tsx:63` | `frage.fragetext` (SuS-Ansicht) | `renderMarkdown` |
| `src/components/fragetypen/BildbeschriftungFrage.tsx:156` | `frage.fragetext` (Lösungsansicht) | `renderMarkdown` |
| `src/components/fragetypen/BuchungssatzFrage.tsx:134` | `frage.geschaeftsfall` (SuS-Ansicht) | `renderMarkdown` |
| `src/components/fragetypen/BuchungssatzFrage.tsx:293` | `frage.geschaeftsfall` (Lösungsansicht) | `renderMarkdown` |
| `src/components/fragetypen/DragDropBildFrage.tsx:153` | `frage.fragetext` (SuS-Ansicht) | `renderMarkdown` |
| `src/components/fragetypen/DragDropBildFrage.tsx:327` | `frage.fragetext` (Lösungsansicht) | `renderMarkdown` |
| `src/components/fragetypen/FreitextFrage.tsx:169` | `frage.fragetext` (SuS-Editor-Ansicht) | `renderMarkdown` |
| `src/components/fragetypen/FreitextFrage.tsx:306` | `frage.fragetext` (Korrektur-Ansicht) | `renderMarkdown` |
| `src/components/fragetypen/HotspotFrage.tsx:87` | `frage.fragetext` (SuS-Ansicht) | `renderMarkdown` |
| `src/components/fragetypen/HotspotFrage.tsx:182` | `frage.fragetext` (Lösungsansicht) | `renderMarkdown` |
| `src/components/fragetypen/KontenbestimmungFrage.tsx:101` | `frage.aufgabentext` (SuS-Ansicht) | `renderMarkdown` |
| `src/components/fragetypen/KontenbestimmungFrage.tsx:250` | `frage.aufgabentext` (Lösungsansicht) | `renderMarkdown` |
| `src/components/fragetypen/LueckentextFrage.tsx:103` | `frage.fragetext` (Intro-Block) | `renderMarkdown` |
| `src/components/fragetypen/LueckentextFrage.tsx:166` | `teil` (Lückentext-Segment, SuS) | `renderMarkdown` |
| `src/components/fragetypen/LueckentextFrage.tsx:224` | `frage.fragetext` (Lösungs-Intro) | `renderMarkdown` |
| `src/components/fragetypen/LueckentextFrage.tsx:252` | `teil` (Lückentext-Segment, Lösung) | `renderMarkdown` |
| `src/components/fragetypen/MCFrage.tsx:71` | `frage.fragetext` (SuS-Ansicht) | `renderMarkdown` |
| `src/components/fragetypen/MCFrage.tsx:156` | `frage.fragetext` (Lösungsansicht) | `renderMarkdown` |
| `src/components/fragetypen/PDFFrage.tsx:241` | `frage.fragetext` (SuS-Ansicht) | `renderMarkdown` |
| `src/components/fragetypen/PDFFrage.tsx:284` | `frage.fragetext` (Lösungsansicht) | `renderMarkdown` |
| `src/components/fragetypen/RichtigFalschFrage.tsx:66` | `frage.fragetext` (SuS-Ansicht) | `renderMarkdown` |
| `src/components/fragetypen/RichtigFalschFrage.tsx:170` | `frage.fragetext` (Lösungsansicht) | `renderMarkdown` |
| `src/components/fragetypen/SortierungFrage.tsx:160` | `frage.fragetext` (SuS-Ansicht) | `renderMarkdown` |
| `src/components/fragetypen/SortierungFrage.tsx:275` | `frage.fragetext` (Lösungsansicht) | `renderMarkdown` |
| `src/components/fragetypen/TKontoFrage.tsx:113` | `frage.aufgabentext` | `renderMarkdown` |
| `src/components/fragetypen/ZeichnenFrage.tsx:267` | `frage.fragetext` | `renderMarkdown` |
| `src/components/fragetypen/ZuordnungFrage.tsx:105` | `frage.fragetext` (SuS-Ansicht) | `renderMarkdown` |
| `src/components/fragetypen/ZuordnungFrage.tsx:211` | `frage.fragetext` (Lösungsansicht) | `renderMarkdown` |
| `src/components/fragetypen/tkonto/TKontoLoesungAnsicht.tsx:47` | `frage.aufgabentext` | `renderMarkdown` |
| `src/components/shared/FrageText.tsx:101` | generischer `text`-Prop (kein Code, kein LaTeX) | `renderMarkdown` |
| `src/components/shared/FrageText.tsx:115` | generischer `text`-Prop (mit LaTeX, kein Code) | `renderMarkdown` + `renderLatexSync` |
| `src/components/shared/FrageText.tsx:143` | `seg.inhalt` (Code-Segmente mit Markdown/LaTeX) | `renderMarkdown` + opt. `renderLatexSync` |
| `src/components/shared/LatexText.tsx:32` | `html`-Prop nach LaTeX-Post-Processing | `renderLatexSync` (KaTeX — kein HTML-Injection-Risk) |
| `src/components/fragetypen/FormelFrageComponent.tsx:239` | `vorschauHtml` (KaTeX.renderToString aus LP/SuS-LaTeX-Eingabe) | KaTeX direkt — `throwOnError:false`, kein DOMPurify |

---

### SuS-Antwort-HTML (Quill/Editor-Output)

SuS geben Freitext-Antworten über einen Quill-basierten Rich-Text-Editor ein. Die Antwort wird als HTML-String gespeichert. Beim Rendern der Korrektur-/Feedback-Ansicht wird dieser HTML-String eingesetzt.

**Befund:** Die Korrektur-Pfade (`FreitextAnzeige.tsx`, `KorrekturPDFAnsicht.tsx`, `AbgabeZusammenfassung.tsx`) haben alle DOMPurify. Der SuS-Feedback-Pfad in `FreitextFrage.tsx:317` (Ansicht der eigenen Antwort nach Abgabe) fehlt DOMPurify — `text = antwort.text` wird direkt gerendert.

| File:Line | Kontext | Sanitization-Quelle (zu prüfen) |
|---|---|---|
| `src/components/fragetypen/FreitextFrage.tsx:317` | `antwort.text` (SuS-Antwort, Quill-Output, Feedback-Ansicht) | **kein DOMPurify** — direktes Rendering |
| `src/components/lp/korrektur/KorrekturFrageVollansicht/FreitextAnzeige.tsx:14` | `antwort.text` (SuS-Antwort im LP-Korrektur-Panel) | `DOMPurify.sanitize` ✓ |
| `src/components/lp/korrektur/KorrekturPDFAnsicht.tsx:199` | `antwort.text` (SuS-Antwort in PDF-Druckansicht) | `DOMPurify.sanitize` ✓ |
| `src/components/AbgabeZusammenfassung.tsx:208` | `text` (SuS-Antwort in Abgabe-Zusammenfassung) | `DOMPurify.sanitize` ✓ |

---

### Backend-HTML (Material-Inhalte aus Sheet)

Material-Inhalte (`material.inhalt`) kommen aus dem Apps-Script-Backend (Sheets). LP-verwalteter Content, kein SuS-Input.

| File:Line | Kontext | Sanitization-Quelle (zu prüfen) |
|---|---|---|
| `src/components/MaterialPanel.tsx:295` | `material.inhalt` (Backend-HTML aus Sheets) | `DOMPurify.sanitize` ✓ |

---

### Sonstiges (manuelle Review bei Audit)

| File:Line | Kontext | Sanitization-Quelle (zu prüfen) |
|---|---|---|
| `src/components/lp/korrektur/KorrekturFrageVollansicht/FormelAnzeige.tsx:25` | `html` (KaTeX.renderToString von `antwort.latex`, SuS-LaTeX-Eingabe) | KaTeX direkt — kein DOMPurify, aber KaTeX-Output ist typsicher — zu prüfen ob Injection via rohem LaTeX möglich |

---

## Audit-Befund: höchste Priorität

**`FreitextFrage.tsx:317`** — einzige Stelle, die SuS-generierten HTML-Content ohne DOMPurify rendert. Alle anderen SuS-Antwort-Render-Pfade sind durch DOMPurify geschützt. Diese Stelle ist der primäre Kandidat für einen Fix im nächsten Audit.

Die `FormelFrageComponent.tsx:239` und `KorrekturFrageVollansicht/FormelAnzeige.tsx:25` rendern KaTeX-Output aus SuS-LaTeX-Eingabe ohne DOMPurify. KaTeX produziert mathematisches SVG/MathML — ein HTML-Injection via LaTeX ist unwahrscheinlich, sollte aber im Audit formal bestätigt werden.

---

## Reading-List für späteren Audit

Empfohlene Reihenfolge für die spätere Audit-Session:

1. **FreitextFrage.tsx:317 (höchste Prio)** — einzige SuS-Input-Stelle ohne DOMPurify. Fix: `DOMPurify.sanitize(text)` analog zu den 3 anderen Freitext-Stellen. Vermutlich 5-Minuten-Fix.
2. **Markdown/LaTeX-Stellen (Bulk-Sweep)** — 40 Stellen, alle via `renderMarkdown`. Zu prüfen: Hat `renderMarkdown` (markdown-it in `src/utils/markdown.ts`) HTML-Tags in der Allowlist erlaubt? Wenn `html: false` (Default), ist kein Fix nötig. Wenn `html: true`, braucht es DOMPurify als zweite Schicht. Schnellster Sweep wenn Markdown-Konfiguration bekannt.
3. **KaTeX-Stellen** — `FormelFrageComponent.tsx:239` + `FormelAnzeige.tsx:25` + `LatexText.tsx:32`. KaTeX-Output ist konstruktionssicher gegen XSS, aber formal bestätigen (z.B. kein `renderToString`-Flag der unsafen HTML-Mode aktiviert).
4. **MaterialPanel.tsx:295** — bereits DOMPurify, aber Allowlist-Konfiguration prüfen (welche Tags/Attribute erlaubt?).
5. **AbgabeZusammenfassung.tsx:208, KorrekturPDFAnsicht.tsx:199, FreitextAnzeige.tsx:14** — alle bereits DOMPurify, zur Vollständigkeit dokumentieren.

---

## Bekannte Sanitization-Pfade im Repo

- `src/utils/markdown.ts::renderMarkdown` — markdown-it, Konfiguration prüfen (`html:`-Option, ggf. Allowlist via Plugin)
- `src/utils/latexRenderer.ts::renderLatexSync` — KaTeX-Wrapper für synchrones LaTeX-Rendering (eigentlich kein HTML-Injection-Risk)
- `src/components/MaterialPanel.tsx` verwendet **DOMPurify** für Backend-HTML ✓
- `src/components/lp/korrektur/KorrekturFrageVollansicht/FreitextAnzeige.tsx` verwendet **DOMPurify** ✓
- `src/components/lp/korrektur/KorrekturPDFAnsicht.tsx` verwendet **DOMPurify** ✓
- `src/components/AbgabeZusammenfassung.tsx` verwendet **DOMPurify** ✓
- Apps-Script-Backend-Bereinigung: `bereinigeFrageFuerSuSUeben_` — entfernt Lösungsfelder, keine HTML-Sanitisierung (nicht relevant hier)
