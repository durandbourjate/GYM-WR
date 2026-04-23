# Autokorrektur in ExamLab — Ist-Zustand & geplante Anpassungen

**Stand:** 23.04.2026 (Session S137)
**Referenz:** `ExamLab/src/utils/ueben/korrektur.ts` (Frontend) + `apps-script-code.js::pruefeAntwortServer_` (Backend-Spiegel)

Dieses Dokument beschreibt, wie SuS-Antworten im selbstständigen Üben automatisch bewertet werden — pro Fragetyp. Es dient als Referenz für LP und als Grundlage für künftige Verbesserungen.

---

## Pfad (Überblick)

Seit Session 122 (19.04.2026) läuft die Antwort-Korrektur **serverseitig** (Apps-Script `lernplattformPruefeAntwort`), damit Musterlösungen nicht an SuS ausgeliefert werden müssen. Der Frontend-Korrekturcode (`korrektur.ts`) wird nur noch als Preview benutzt, wenn die Lösungen clientseitig vorgeladen wurden (Bundle Ü). Beide Pfade sollen **identische Logik** haben; ein 1:1-Port existiert im Backend.

## Pro Fragetyp

### Textbasiert (SuS tippt etwas)

| Typ | Normalisierung | Vergleich | Alternativen | Besonderheiten |
|---|---|---|---|---|
| **Lückentext** | `trim()` + optional `toLowerCase()` | exakt-String | `korrekteAntworten[]` | `caseSensitive`-Flag **pro Lücke** (Default `false`, wenn nicht gesetzt) |
| **Bildbeschriftung** | `trim()` + **immer** `toLowerCase()` | exakt-String | ja | **hartcodiert** case-insensitive — inkonsistent zu Lückentext |
| **Formel** | Whitespace, `\cdot→\times`, `**→^`, lowercase | exakt nach Norm | nein | robust |
| **Freitext** | – | KI-Korrektur (`korrigiereFreitext`) | – | kein Regelvergleich, Self-Assessment möglich |

### Strukturiert (Auswahl/Anordnung)

- **MC (Mehrfachauswahl)**: Array-Sort + Equal-Vergleich, Reihenfolge egal. Match per ID.
- **Richtig/Falsch**: pro Aussage exakte Boolean-Gleichheit, **alle** müssen korrekt sein.
- **Zuordnung**: alle Paare `{links → rechts}` exakt.
- **Sortierung**: Reihenfolge exakt, ID-Match.

### Numerisch

- **Berechnung**: `|soll − ist| ≤ toleranz` (Toleranz pro Aufgabe in der LP-Maske konfigurierbar).
- **Buchungssatz / T-Konto / Bilanz / ER**: `|soll − ist| ≤ 0.01` **hardcoded**, nicht konfigurierbar.

### Bild / Self-Assessment

- **Hotspot**: Ray-Casting pro Polygon; alle korrekten Bereiche getroffen + keine Distraktoren.
- **DragDrop-Bild**: Label→Zone-Mapping exakt.
- **PDF/Audio/Code/Visualisierung/Zeichnen**: keine Auto-Korrektur, SuS bewertet selbst („korrekt"/„teilweise"/„falsch").

---

## Lückentext (am häufigsten genutzt) — Details

```ts
const eingabe = (eintraege[l.id] || '').trim()
const korrekt = Array.isArray(l.korrekteAntworten) ? l.korrekteAntworten : []
if (korrekt.length === 0) return false
return korrekt.some(ka =>
  l.caseSensitive
    ? eingabe === ka.trim()
    : eingabe.toLowerCase() === ka.trim().toLowerCase()
)
```

**Aktiv toleriert:**
- ✅ Whitespace am Anfang/Ende (via `trim()`)
- ✅ Case-Insensitivity pro Lücke flagbar (`caseSensitive`)
- ✅ Mehrere alternative Antworten (`korrekteAntworten[]`)

**NICHT toleriert (häufigste Falsch-Negativ-Quellen):**
- ❌ Mehrfach-Leerzeichen innerhalb der Antwort (`"a  b"` ≠ `"a b"`)
- ❌ Tabs, Newlines in der Eingabe
- ❌ Typos / Levenshtein
- ❌ Unicode-Normalisierung (`é` ≠ `e` + `´`)
- ❌ Akzent-unabhängig (`Gymnasium` ≠ `Gymnásium`)
- ❌ Synonyme (ausser explizit von LP eingetragen)

---

## UX-Label-Logik (Musterlösungs-Block)

[UebungsScreen.tsx:157-158](../src/components/ueben/UebungsScreen.tsx):
```ts
variant={letzteAntwortKorrekt === false ? 'falsch' : 'korrekt'}
label={letzteAntwortKorrekt === false ? 'Nicht ganz — Musterlösung' : 'Musterlösung'}
```

**Quellen für `letzteAntwortKorrekt`** (uebungsStore.ts): lokales `pruefeAntwort` (wenn Lösung preloaded) oder `res.korrekt` vom Server. `pruefeAntwort` ist **binär**: `true` nur wenn **alle** Teile (Aussagen/Lücken/Paare) korrekt.

**Beobachtete Symptome (User-Screenshots S137):**

- Screenshot 2 — R/F „Beschränkt Handlungsunfähige … schadenersatzpflichtig": SuS sagt „Richtig", System markiert als falsch, obwohl die Erklärung die Aussage bestätigt (Art. 19 Abs. 3 ZGB). **Root Cause:** Daten-Bug in der Frage — `aussage.korrekt = false` widerspricht der Erklärung. Die Korrektur läuft technisch korrekt; **der Fehler liegt im Fragen-Content**. Label „NICHT GANZ" ist dabei trotzdem irreführend (die Antwort ist 100% falsch → sollte „LEIDER FALSCH" heissen).
- Screenshot 3 — Lückentext „Gemäss Art. 11 ZGB ist jeder ___ rechtsfähig": SuS tippt „Mensch" (gemäss Art. 11 wörtlich korrekt). Vermutlich enthält `korrekteAntworten` nur ein Synonym (z. B. `["Person"]`), Match schlägt fehl. **Root Cause:** fehlende Alternative in den Frage-Daten. Dies ist der klassische Fall, den die **KI-Synonym-Erweiterung** (siehe unten) strukturell verhindern soll.

**Label-Bug (getrennt davon):** Die binäre Kommunikation (true/false) unterscheidet nicht zwischen **voll falsch** und **teilweise richtig**. Bei Multi-Item-Fragen (mehrere Aussagen/Lücken) ist die Teilpunkt-Kommunikation deshalb unpräzise.

---

## Geplante Anpassungen (S137 Bundle)

### Umsetzung im aktuellen Branch `fix/s137-ui-autokorrektur-bundle`

1. **Mehrfach-Leerzeichen normalisieren** — Lückentext + Bildbeschriftung: `str.replace(/\s+/g, ' ').trim()`. Frontend (`korrektur.ts`) UND Backend (`apps-script-code.js::pruefeAntwortServer_`) synchron anpassen.
2. **Lückentext-Default case-insensitive** — Flag-Semantik umkehren: LP muss aktiv „Groß-/Kleinschreibung relevant" setzen, sonst wird case-insensitive verglichen (Default). Löst den „Output"/"output"-Fall direkt. Bestehende Fragen mit `caseSensitive=true` bleiben case-sensitive — kein Daten-Migration nötig, nur Editor-Default dreht sich um.
3. **Label-Bug dreistufig** — Titel/Variant basierend auf Score statt binär:
   - `KORREKT` (grün) — alle richtig
   - `TEILWEISE RICHTIG (x/n)` (gelb) — gemischt, bei Multi-Item-Fragen (R/F, Lückentext mit mehreren Lücken, Zuordnung, Sortierung)
   - `LEIDER FALSCH` (rot) — alle falsch
   - Für Single-Item-Fragen: nur grün/rot, kein gelb.
4. **Bildbeschriftung konsistent** — `caseSensitive`-Flag hinzufügen (wie Lückentext), Default false, LP kann pro Beschriftungsfeld setzen.

### Anschlussthema: KI-Synonym-Vorschläge

Beim Generieren der Musterlösung via KI (`generiereMusterloesung`-Endpoint) werden für `lueckentext` und `bildbeschriftung` automatisch 2–3 plausible Alternativen in `korrekteAntworten[]` vorgeschlagen. LP kann pro Vorschlag per Checkbox übernehmen/verwerfen (wie bei den Teilerklärungen in C9 Phase 2). Bei manueller Lösungseingabe bleibt Eigenverantwortung der LP — System schlägt dort nichts vor.

Prompt-Erweiterung: „Für jede Lücke/Beschriftung gib neben der Musterantwort 2–3 sinnvolle Alternativen (Synonyme, gängige Schreibweisen, gleichwertige Ausdrücke) im Array `korrekteAntworten` an."

### Nicht in diesem Bundle (für später)

- Unicode-Normalisierung + akzent-unabhängig (kleiner Gewinn)
- FiBu-Toleranz relativ statt fix `0.01` (bei Beträgen > 10'000 CHF)
- Typo-Toleranz (Levenshtein) — **nicht empfohlen**, bei kurzen Fachbegriffen zu unscharf

---

## Referenzen

- [`korrektur.ts`](../src/utils/ueben/korrektur.ts)
- [`uebungsStore.ts`](../src/store/ueben/uebungsStore.ts) — Quellen von `letzteAntwortKorrekt`
- [`UebungsScreen.tsx`](../src/components/ueben/UebungsScreen.tsx) — Label-Rendering
- `apps-script-code.js` — Backend-Spiegel `pruefeAntwortServer_`
