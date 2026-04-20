# Bundle P — Prüfung-Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alle SuS-Ladepfade (Prüfung, angeleitete Übung, selbstständiges Üben) bereinigen dieselben Lösungsfelder — durch Konsolidierung der zwei Bereinigungs-Funktionen im Apps-Script-Backend auf eine strenge Basis + Extraktion der Mischung in eine separate Funktion.

**Architecture:** Backend-only Refactor in `ExamLab/apps-script-code.js`. `bereinigeFrageFuerSuS_` erhält die volle strenge Bereinigung (aktueller Inhalt von `bereinigeFrageFuerSuSUeben_` minus Mischung). Mischung wird in neue Funktion `mischeFrageOptionen_` ausgelagert. `bereinigeFrageFuerSuSUeben_` wird zu einem Ein-Zeiler-Wrapper. Das Frontend bleibt unverändert — `pruefungStore` nutzt die Lösungsfelder nicht.

**Tech Stack:** Google Apps Script (JavaScript ES5-Style), Vitest für Invariant-Tests, Chrome-Staging für E2E-Verifikation.

**Spec:** `ExamLab/docs/superpowers/specs/2026-04-20-musterloesungen-bereinigung-design.md` (Bundle P Abschnitt)

**Branch:** `feature/musterloesungen-bereinigung` (bereits aktiv, 2 Spec-Commits `ec5915f`, `1c132fe`)

---

## File Structure

**Modify:**
- `ExamLab/apps-script-code.js:1639-1843` — Zwei Funktionen werden umstrukturiert, eine neue Funktion dazwischen eingefügt
- `ExamLab/src/tests/uebenSecurityInvariant.test.ts` — Sperrliste um fehlende Felder erweitern

**No new files.** Keine neuen Verzeichnisse, keine neuen Module.

**Files-Touched Working Directory:**
- `cd "10 Github/GYM-WR-DUY"` für alle Git-Operationen (Repo-Root)

---

## Test-Strategie

Apps-Script-Code ist nicht direkt in Vitest ausführbar (Apps-Script-Globals wie `SpreadsheetApp`, `CacheService`, `UrlFetchApp` sind nur im Apps-Script-Runtime verfügbar). **Deshalb:**

1. **Vitest-Invariant-Test** (`uebenSecurityInvariant.test.ts`) verifiziert die Sperrliste der nicht-erlaubten Felder in SuS-Responses. Erweitere Sperrliste um alle Felder die strenge Bereinigung neu erwischt. Test zeigt keine Regression, aber er dokumentiert die Invariante + erwischt künftige Leaks in Mock-Tests.
2. **Manuelle Staging-Verifikation** (zwingend vor Merge) — echte Browser-Logins, Network-Tab-Audit der `ladePruefung`-Response in der Einführungsprüfung (deckt Hotspot, Bildbeschriftung, DragDrop, FiBu-Typen ab).
3. **Kein TDD im Apps-Script-Code** — der Test wäre ein Eval-Hack, der fragiler ist als ein sauber durchgeführter manueller Staging-Test.

---

## Task 1: Vitest-Sperrliste erweitern

**Files:**
- Modify: `ExamLab/src/tests/uebenSecurityInvariant.test.ts`

Der bestehende Test hat eine Sperrliste für SuS-Response-Felder (Zeile 8–13). Die Sperrliste ist aus Sicht des Übungs-Endpoints gebaut und deckt noch nicht alle strengen Felder ab. Wir erweitern die Liste — bestehende Tests bleiben grün, neue Tests decken die neuen Felder ab.

- [ ] **Step 1: Failing Test hinzufügen**

Öffne `ExamLab/src/tests/uebenSecurityInvariant.test.ts`. Füge nach dem bestehenden `it('erkennt Leak von musterlosung', ...)`-Block folgenden Test ein:

```typescript
  it('erkennt Leak von konten[].korrekt (FiBu)', () => {
    const leak = { data: [{ typ: 'buchungssatz', konten: [{ id: 'k1', korrekt: true }] }] }
    expect(hatSperrfeld(leak)).toBe('data.[0].konten.[0].korrekt')
  })

  it('erkennt Leak von labels[].zoneId (Bildbeschriftung)', () => {
    const leak = { data: [{ typ: 'bildbeschriftung', labels: [{ id: 'l1', text: 'Zellkern', zoneId: 'z1' }] }] }
    expect(hatSperrfeld(leak)).toBe('data.[0].labels.[0].zoneId')
  })

  it('erkennt Leak von bereiche[].korrekt (Hotspot)', () => {
    const leak = { data: [{ typ: 'hotspot', bereiche: [{ id: 'b1', korrekt: true }] }] }
    expect(hatSperrfeld(leak)).toBe('data.[0].bereiche.[0].korrekt')
  })

  it('erkennt Leak von korrekteFormel (Formel)', () => {
    const leak = { data: [{ typ: 'formel', korrekteFormel: 'a^2+b^2=c^2' }] }
    expect(hatSperrfeld(leak)).toBe('data.[0].korrekteFormel')
  })

  it('erkennt Leak von erwarteteAntworten (Kontenbestimmung)', () => {
    const leak = { data: [{ typ: 'kontenbestimmung', aufgaben: [{ id: 'a1', erwarteteAntworten: ['1000'] }] }] }
    expect(hatSperrfeld(leak)).toBe('data.[0].aufgaben.[0].erwarteteAntworten')
  })
```

- [ ] **Step 2: Test laufen lassen — Teil-Failures erwartet**

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
npx vitest run src/tests/uebenSecurityInvariant.test.ts
```

Erwartet: **mindestens 3 neue Tests FAIL** — die Tests für `zoneId`, `korrekteFormel`, `erwarteteAntworten` fallen durch, weil diese Felder nicht in der Sperrliste sind. Die Tests für `konten[].korrekt` und `bereiche[].korrekt` laufen möglicherweise bereits grün, weil `'korrekt'` schon in der bestehenden Sperrliste steht — das ist in Ordnung, Step 3 stellt sicher dass die Tests inhaltlich korrekt werden (kontextuelle Pfad-Verifikation).

- [ ] **Step 3: Sperrliste erweitern**

In derselben Datei, ersetze den `SPERRLISTE`-Block (Zeile 8–13):

```typescript
const SPERRLISTE = [
  // Gemeinsam bei allen Fragetypen
  'musterlosung', 'bewertungsraster',
  // Typ-spezifische Lösungsfelder
  'korrekt', 'korrekteAntworten', 'toleranz',
  'erklaerung',
  // FiBu-Typen
  'sollKonto', 'habenKonto', 'korrektBuchung',
  'sollEintraege', 'habenEintraege', 'buchungen',
  'erwarteteAntworten', 'loesung',
  // Bildbeschriftung / DragDrop
  'zoneId', 'korrektesLabel',
  // Formel
  'korrekteFormel',
]
```

Hinweis: `zone` wurde bewusst nicht übernommen — `zone` ist ein breiter Begriff (z.B. Zeitzone, UI-Zone) und würde false-positives auslösen. Strenge Bereinigung entfernt `zone` trotzdem im Apps-Script; der Test fokussiert auf eindeutig Lösungs-spezifische Felder.

- [ ] **Step 4: Test laufen lassen — alle grün**

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
npx vitest run src/tests/uebenSecurityInvariant.test.ts
```

Erwartet: alle Tests PASS (ursprüngliche 3 + 5 neue).

- [ ] **Step 5: Commit**

```bash
cd "10 Github/GYM-WR-DUY"
git add ExamLab/src/tests/uebenSecurityInvariant.test.ts
git commit -m "$(cat <<'EOF'
ExamLab: Security-Invariant-Sperrliste um FiBu/Hotspot/Bildbeschriftungs-Felder erweitert

Neue Sperrlist-Einträge: sollEintraege, habenEintraege, buchungen,
erwarteteAntworten, loesung, zoneId, korrektesLabel, korrekteFormel.
5 neue Tests decken die Leak-Erkennung pro Fragetyp ab.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `mischeFrageOptionen_` extrahieren

**Files:**
- Modify: `ExamLab/apps-script-code.js:1795-1840`

Extrahiere den Switch-Block + rekursiven Teilaufgaben-Mischungs-Aufruf aus `bereinigeFrageFuerSuSUeben_` in eine neue Top-Level-Funktion. Die Funktion darf das Objekt mutieren (der Aufrufer hat bereits deep-copy gemacht).

- [ ] **Step 1: Neue Funktion einfügen**

Öffne `ExamLab/apps-script-code.js`. Direkt NACH Funktion `shuffle_` (nach Zeile 1637) und VOR `function bereinigeFrageFuerSuS_` (Zeile 1639) einfügen:

```javascript
/**
 * Mischt Reihenfolgen der Antwort-Optionen pro Fragetyp (Fisher-Yates).
 * Mutiert das übergebene Objekt. Aufrufer muss bereits eine Deep-Copy haben,
 * wenn Original-Frage unverändert bleiben soll.
 * Rekursiv für Aufgabengruppen.
 */
function mischeFrageOptionen_(frage) {
  var f = frage;
  switch (f.typ) {
    case 'mc':
      if (Array.isArray(f.optionen)) f.optionen = shuffle_(f.optionen);
      break;
    case 'richtigfalsch':
      if (Array.isArray(f.aussagen)) f.aussagen = shuffle_(f.aussagen);
      break;
    case 'sortierung':
      if (Array.isArray(f.elemente)) f.elemente = shuffle_(f.elemente);
      break;
    case 'zuordnung':
      // Mische die rechts-Spalte unabhängig von links — Paarung verschleiert,
      // UI-Komponente liest weiterhin paare[].links + paare[].rechts.
      if (Array.isArray(f.paare)) {
        var rechtsValues = f.paare.map(function(p) { return p.rechts; });
        var rechtsShuffled = shuffle_(rechtsValues);
        f.paare = f.paare.map(function(p, i) {
          return Object.assign({}, p, { rechts: rechtsShuffled[i] });
        });
      }
      break;
    case 'bildbeschriftung':
    case 'dragdrop_bild':
      if (Array.isArray(f.labels)) f.labels = shuffle_(f.labels);
      break;
    case 'hotspot':
      if (Array.isArray(f.hotspots)) f.hotspots = shuffle_(f.hotspots);
      if (Array.isArray(f.bereiche)) f.bereiche = shuffle_(f.bereiche);
      break;
    case 'lueckentext':
      if (Array.isArray(f.luecken)) {
        f.luecken = f.luecken.map(function(l) {
          if (Array.isArray(l.optionen)) {
            return Object.assign({}, l, { optionen: shuffle_(l.optionen) });
          }
          return l;
        });
      }
      break;
  }

  // Aufgabengruppe: rekursiv
  if (Array.isArray(f.teilaufgaben)) {
    f.teilaufgaben = f.teilaufgaben.map(mischeFrageOptionen_);
  }

  return f;
}

```

Achte auf die Leerzeile nach der Funktion (Trennung zu `bereinigeFrageFuerSuS_`).

- [ ] **Step 2: Sanity-Check — Datei parsebar**

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
node --check apps-script-code.js
```

Erwartet: kein Output (keine Syntax-Errors). Wenn rot: Syntax-Fehler in der neuen Funktion korrigieren.

Task 2 ist noch nicht committet — Task 3 hängt daran.

---

## Task 3: `bereinigeFrageFuerSuS_` strengen

**Files:**
- Modify: `ExamLab/apps-script-code.js:1639-1703`

Die bestehende Funktion `bereinigeFrageFuerSuS_` bekommt alle strengen Bereinigungen der aktuellen `bereinigeFrageFuerSuSUeben_` (Zeilen 1713–1793) eingemerged — minus Mischung (jetzt in Task 2).

- [ ] **Step 1: `bereinigeFrageFuerSuS_` komplett ersetzen**

Ersetze die komplette Funktion (aktuell Zeilen 1639–1703, inkl. `function`-Keyword und schliessender `}`) durch folgenden Block:

```javascript
function bereinigeFrageFuerSuS_(frage) {
  var f = JSON.parse(JSON.stringify(frage)); // Deep Copy

  // Gemeinsame Felder
  delete f.musterlosung;
  delete f.bewertungsraster;

  // MC: korrekt + erklaerung aus Optionen entfernen
  if (f.optionen && Array.isArray(f.optionen)) {
    f.optionen = f.optionen.map(function(o) {
      var cleaned = Object.assign({}, o);
      delete cleaned.korrekt;
      delete cleaned.erklaerung;
      return cleaned;
    });
  }

  // R/F: korrekt-Feld aus Aussagen entfernen
  if (f.aussagen && Array.isArray(f.aussagen)) {
    f.aussagen = f.aussagen.map(function(a) {
      var cleaned = Object.assign({}, a);
      delete cleaned.korrekt;
      delete cleaned.erklaerung;
      return cleaned;
    });
  }

  // Lückentext: korrekteAntworten + korrekt aus Lücken entfernen
  if (f.luecken && Array.isArray(f.luecken)) {
    f.luecken = f.luecken.map(function(l) {
      var cleaned = Object.assign({}, l);
      delete cleaned.korrekteAntworten;
      delete cleaned.korrekt;
      return cleaned;
    });
  }

  // Berechnung: korrekt-Wert + toleranz aus Ergebnissen entfernen
  if (f.ergebnisse && Array.isArray(f.ergebnisse)) {
    f.ergebnisse = f.ergebnisse.map(function(e) {
      var cleaned = Object.assign({}, e);
      delete cleaned.korrekt;
      delete cleaned.toleranz;
      return cleaned;
    });
  }

  // Formel: korrekteFormel + korrekt entfernen
  if (f.korrekteFormel) delete f.korrekteFormel;
  if (f.typ === 'formel' && f.korrekt) delete f.korrekt;

  // Buchungssatz: buchungen, korrektBuchung, sollEintraege, habenEintraege
  if (f.buchungen) delete f.buchungen;
  if (f.korrektBuchung) delete f.korrektBuchung;
  if (f.sollEintraege) delete f.sollEintraege;
  if (f.habenEintraege) delete f.habenEintraege;

  // FiBu Konten: korrekt, eintraege, saldo, anfangsbestand (bedingt)
  if (Array.isArray(f.konten)) {
    f.konten = f.konten.map(function(k) {
      var c = Object.assign({}, k);
      delete c.korrekt;
      delete c.eintraege;
      delete c.saldo;
      if (!c.anfangsbestandVorgegeben) {
        delete c.anfangsbestand;
      }
      return c;
    });
  }

  // Bilanzstruktur / Bilanz-ER
  if (Array.isArray(f.bilanzEintraege)) {
    f.bilanzEintraege = f.bilanzEintraege.map(function(e) {
      var c = Object.assign({}, e);
      delete c.korrekt;
      return c;
    });
  }
  if (f.loesung) delete f.loesung;

  // Kontenbestimmung: aufgaben[].erwarteteAntworten
  if (Array.isArray(f.aufgaben)) {
    f.aufgaben = f.aufgaben.map(function(a) {
      var c = Object.assign({}, a);
      delete c.erwarteteAntworten;
      return c;
    });
  }

  // Bildbeschriftung / DragDrop: labels[].zoneId/zone/korrekt, beschriftungen[].korrekt, zielzonen[].korrektesLabel
  // ACHTUNG: labels[] ist je nach Pool-Daten string[] (DragDrop-Bild) oder {id,text,zoneId}[]
  // (Bildbeschriftung). Strings unverändert lassen, sonst werden sie zu Char-Objekten.
  if ((f.typ === 'bildbeschriftung' || f.typ === 'dragdrop_bild') && Array.isArray(f.labels)) {
    f.labels = f.labels.map(function(l) {
      if (typeof l !== 'object' || l === null) return l;
      var c = Object.assign({}, l);
      delete c.zoneId;
      delete c.zone;
      delete c.korrekt;
      return c;
    });
  }
  if (Array.isArray(f.beschriftungen)) {
    f.beschriftungen = f.beschriftungen.map(function(b) {
      var c = Object.assign({}, b);
      delete c.korrekt;
      return c;
    });
  }
  if (Array.isArray(f.zielzonen)) {
    f.zielzonen = f.zielzonen.map(function(z) {
      var c = Object.assign({}, z);
      delete c.korrektesLabel;
      return c;
    });
  }

  // Hotspot: bereiche[].korrekt + hotspots[].korrekt
  if (f.typ === 'hotspot' && Array.isArray(f.bereiche)) {
    f.bereiche = f.bereiche.map(function(b) {
      var c = Object.assign({}, b);
      delete c.korrekt;
      return c;
    });
  }
  if (f.typ === 'hotspot' && Array.isArray(f.hotspots)) {
    f.hotspots = f.hotspots.map(function(h) {
      var c = Object.assign({}, h);
      delete c.korrekt;
      return c;
    });
  }

  // Aufgabengruppe: Teilaufgaben rekursiv bereinigen
  if (f.teilaufgaben && Array.isArray(f.teilaufgaben)) {
    f.teilaufgaben = f.teilaufgaben.map(bereinigeFrageFuerSuS_);
  }

  return f;
}
```

- [ ] **Step 2: Sanity-Check — Datei parsebar**

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
node --check apps-script-code.js
```

Erwartet: kein Output.

---

## Task 4: `bereinigeFrageFuerSuSUeben_` auf Wrapper reduzieren

**Files:**
- Modify: `ExamLab/apps-script-code.js:1710-1843`

Die Funktion enthält jetzt nur noch die Wrapper-Logik.

- [ ] **Step 1: `bereinigeFrageFuerSuSUeben_` komplett ersetzen**

Ersetze die komplette Funktion (inkl. `function`-Keyword und schliessender `}`, aktuell der gesamte Block von Zeile 1710 bis vor `// === SERVER-SIDE KORREKTUR (Port aus korrektur.ts) ===`) durch folgenden Block:

```javascript
/**
 * Bereinigung für selbstständiges Üben: strenge Bereinigung + Mischung.
 * Strenge Bereinigung steckt vollständig in bereinigeFrageFuerSuS_;
 * diese Funktion fügt nur noch Fisher-Yates-Mischung hinzu.
 */
function bereinigeFrageFuerSuSUeben_(frage) {
  return mischeFrageOptionen_(bereinigeFrageFuerSuS_(frage));
}
```

- [ ] **Step 2: Sanity-Check — Datei parsebar**

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
node --check apps-script-code.js
```

Erwartet: kein Output.

- [ ] **Step 3: Keine verwaisten Referenzen**

Prüfe dass die alte Mischungs-Logik nicht mehr in der Datei steht:

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
grep -n "shuffle_(f.optionen)" apps-script-code.js
```

Erwartet: genau 1 Treffer (in `mischeFrageOptionen_`). Falls 2 → alte Kopie nicht sauber ersetzt.

```bash
grep -n "f.korrekteFormel" apps-script-code.js
```

Erwartet: genau 1 Treffer (in `bereinigeFrageFuerSuS_`). Falls 2 → alte Kopie in `bereinigeFrageFuerSuSUeben_` nicht entfernt.

---

## Task 5: Verification (Apps-Script Build + Frontend-Build)

- [ ] **Step 1: TypeScript-Build grün**

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
npx tsc -b
```

Erwartet: exit 0, kein Output. (TS ignoriert `apps-script-code.js`, aber stellt sicher dass der Test aus Task 1 keine Types bricht.)

- [ ] **Step 2: Vitest grün**

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
npx vitest run
```

Erwartet: alle Tests PASS. Wenn Tests brechen die mit Task 1 nichts zu tun haben → Regression untersuchen.

- [ ] **Step 3: Vite-Build grün**

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
npm run build
```

Erwartet: exit 0, Build-Artefakt `dist/` erstellt.

- [ ] **Step 4: Commit der Backend-Änderung**

```bash
cd "10 Github/GYM-WR-DUY"
git add ExamLab/apps-script-code.js
git commit -m "$(cat <<'EOF'
ExamLab: Apps-Script-Bereinigungsfunktionen konsolidiert (Bundle P)

bereinigeFrageFuerSuS_ erhält die volle strenge Bereinigung inkl.
FiBu/Hotspot/Bildbeschriftung/DragDrop/Formel — damit liefert
ladePruefung automatisch die strenge Variante an SuS.

mischeFrageOptionen_ neu extrahiert — kapselt den Fisher-Yates-Switch
pro Fragetyp. Rekursiv für Aufgabengruppen.

bereinigeFrageFuerSuSUeben_ ist jetzt ein Ein-Zeiler:
return mischeFrageOptionen_(bereinigeFrageFuerSuS_(frage));

Call-Sites (ladePruefung, lernplattformLadeFragen, ladeAbgabe) bleiben
unverändert — alle erhalten automatisch die strengere Bereinigung.

Fixt Lücke 1 aus 2026-04-20-musterloesungen-bereinigung-design.md:
SuS sah in Prüfungen FiBu/Hotspot/Bildbeschriftungs-Lösungsfelder im
Network-Tab.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Staging-Deploy + manueller E2E-Test (User-Aktion)

**Files:**
- Manual: Apps-Script-Editor (Google Cloud Console)

Apps-Script-Backend-Änderungen brauchen einen manuellen User-Deploy. **Während dieser Task ausgeführt wird, darf keine aktive Prüfung laufen** (siehe `.claude/rules/deployment-workflow.md`).

- [ ] **Step 1: User-Vorbereitung — Backup der aktuellen Deployment-URL**

User-Aktion (Claude kann nicht):
1. Apps-Script-Editor öffnen.
2. "Bereitstellen → Bereitstellungen verwalten" — aktuelle Deployment-Version notieren (für Rollback).

- [ ] **Step 2: Apps-Script-Code deployen**

User-Aktion:
1. Kompletten Inhalt von `ExamLab/apps-script-code.js` in den Apps-Script-Editor kopieren (überschreibt).
2. "Bereitstellen → Bereitstellung verwalten → Bearbeiten (Stift-Icon) → Version: Neu → Bereitstellen".
3. Kurz warten bis Deployment aktiv ist.
4. Claude bestätigen: "Apps-Script deployed".

**Post-Deploy Smoke-Check** (Claude-Aktion, **vor** Step 3):

Öffne einen Staging-Tab, führe einen Test-`ladePruefung`-Call aus (beliebige existierende Prüfung als SuS laden) und prüfe via `mcp__Claude_in_Chrome__read_network_requests`:
- Response enthält `fragen: [...]`.
- **Spot-Check:** In mindestens einer Frage mit `typ: 'hotspot'` oder `typ: 'bildbeschriftung'` sind `bereiche[].korrekt` / `labels[].zoneId` nicht mehr vorhanden.

Wenn die Felder noch da sind: Deploy-Queue hängt (bekanntes Problem aus S118). Trigger leerer Commit:
```bash
cd "10 Github/GYM-WR-DUY"
git commit --allow-empty -m "Trigger Apps-Script deploy refresh"
```
User deployt erneut, Smoke-Check wiederholen. Erst weiter zu Step 3 wenn Spot-Check grün.

- [ ] **Step 3: Staging-E2E-Test — LP-Sicht**

User öffnet 2-Tab-Setup (wie in regression-prevention.md beschrieben):
- Tab 1 LP: `wr.test@gymhofwil.ch` auf Staging.
- Tab 2 SuS: `wr.test@stud.gymhofwil.ch` auf Staging.

User in Tab 1 (LP):
1. Dashboard → Test-Prüfung "Einrichtungsprüfung" auswählen.
2. Lobby öffnen → Test-SuS hinzufügen.
3. Prüfung live schalten.
4. Optional: Einen Blick in "Fragen" werfen → LP sieht weiterhin alle Lösungsfelder.

User meldet Claude: "LP Setup OK".

- [ ] **Step 4: Staging-E2E-Test — SuS-Sicht (Network-Audit)**

User in Tab 2 (SuS), mit Claude-Observation via `mcp__Claude_in_Chrome`:
1. DevTools öffnen, Network-Tab aktiv, Filter auf "Fetch/XHR".
2. "Prüfung starten" klicken.
3. Der `ladePruefung`-Call erscheint.

Claude prüft (via `read_network_requests`):
- Response enthält `fragen: [...]`.
- Keines der folgenden Felder ist in irgendeiner Frage enthalten: `musterlosung`, `bewertungsraster`, `korrekteFormel`, `korrektBuchung`, `sollEintraege`, `habenEintraege`, `buchungen`, `loesung`, `erwarteteAntworten`.
- In `optionen[]`, `aussagen[]`, `luecken[]`, `ergebnisse[]`, `bereiche[]`, `hotspots[]`, `bilanzEintraege[]`, `beschriftungen[]` ist kein `korrekt` enthalten.
- In `labels[]` (bildbeschriftung/dragdrop_bild) ist kein `zoneId`/`zone` enthalten.
- In `zielzonen[]` ist kein `korrektesLabel` enthalten.
- In `konten[]` ist kein `korrekt`/`eintraege`/`saldo` enthalten, `anfangsbestand` nur wenn `anfangsbestandVorgegeben: true`.
- In `aufgaben[]` ist kein `erwarteteAntworten` enthalten.

Bei Treffer: Bug dokumentieren, Backend-Fix nachschieben.

- [ ] **Step 5: Funktionaler SuS-Flow bestätigen**

Die Prüfung muss weiterhin normal beantwortbar sein (keine Regression):
- Claude klickt durch die Einführungsprüfungs-Abschnitte A bis F.
- Bei jedem Abschnitt: Eine Frage beantworten, "Weiter" klickt.
- Beim Abschnitt mit Hotspot: Klicken auf "Schweiz" funktioniert, Marker erscheint.
- Beim Abschnitt mit Bildbeschriftung: Label-Auswahl zeigt Labels ohne zoneId.
- Am Ende: Abgabe möglich.

User bestätigt: "E2E grün".

- [ ] **Step 6: Lernplattform-Regression-Check**

User startet zusätzlich eine selbstständige Üben-Session in Tab 2:
1. `/sus/ueben/`-Route öffnen.
2. Irgendein Thema starten.
3. Network-Tab: `lernplattformLadeFragen`-Response prüfen — muss identisch bereinigt sein wie vorher.
4. Eine auto-korrigierbare Frage beantworten + "Antwort prüfen" → funktioniert weiterhin (läuft über `lernplattformPruefeAntwort`).

User bestätigt: "Üben-Regression OK".

---

## Task 7: Merge-Gate + Cleanup

- [ ] **Step 1: HANDOFF.md aktualisieren**

Öffne `ExamLab/HANDOFF.md`. Suche die Überschrift "Für die nächste Session (S126+) — Aktueller Stand" und ergänze direkt oberhalb der bestehenden "Offene Punkte"-Liste folgenden Abschnitt. **Fallback:** Falls die Überschrift nicht exakt so heisst, füge den Abschnitt direkt nach der obersten Session-Log-Überschrift ein (also nach dem Tabellen-Header, vor dem letzten eingetragenen Session-Eintrag) — die Struktur der Datei ist chronologisch absteigend.

```markdown
### Session 126 (2026-04-20) — Bundle P: Prüfung-Hardening

`feature/musterloesungen-bereinigung` — Apps-Script-Bereinigungsfunktionen
konsolidiert. `bereinigeFrageFuerSuS_` (ladePruefung-Pfad) liefert nun
die volle strenge Bereinigung inkl. FiBu/Hotspot/Bildbeschriftung/Formel.
`bereinigeFrageFuerSuSUeben_` ist ein Wrapper um
`mischeFrageOptionen_(bereinigeFrageFuerSuS_(...))`.

Apps-Script deployed (User-Aktion), Staging-E2E grün, LP-Pfad
unverändert, SuS-Pfad erhält in Prüfung keine Lösungsfelder mehr.

Spec: `docs/superpowers/specs/2026-04-20-musterloesungen-bereinigung-design.md`
Plan: `docs/superpowers/plans/2026-04-20-bundle-p-pruefung-hardening.md`

Bundle Ü (Üben-Pre-Load für instant Client-Korrektur) folgt in eigener
Session — Plan wird erst nach Freigabe von Bundle P geschrieben.
```

- [ ] **Step 2: HANDOFF committen**

```bash
cd "10 Github/GYM-WR-DUY"
git add ExamLab/HANDOFF.md
git commit -m "$(cat <<'EOF'
ExamLab: HANDOFF für S126 Bundle P ergänzt

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Merge-Gate prüfen**

Claude meldet dem User:

```
Bundle P ready for merge. Checklist:
- [x] tsc -b grün
- [x] vitest grün
- [x] npm run build grün
- [x] Apps-Script deployed (User)
- [x] Staging-E2E Prüfungs-Flow grün (User)
- [x] Staging-E2E Üben-Regression grün (User)
- [x] Network-Tab-Audit: keine Lösungsfelder in SuS-Response
- [x] LP-Pfad unverändert
- [x] HANDOFF.md aktualisiert

Bereit für Merge auf main?
```

User antwortet "ja" → Step 4. User antwortet "nein" / nennt Bug → Fix nachlegen, Step 3 wiederholen.

- [ ] **Step 4: Merge + Push**

```bash
cd "10 Github/GYM-WR-DUY"
git checkout main
git merge --no-ff feature/musterloesungen-bereinigung -m "$(cat <<'EOF'
Bundle P: Prüfung-Hardening

Konsolidiert Apps-Script-Bereinigung: bereinigeFrageFuerSuS_
(ladePruefung-Pfad) liefert jetzt die volle strenge Bereinigung.
Keine FiBu/Hotspot/Bildbeschriftungs-Lösungsfelder mehr in
SuS-Response bei Prüfungen.

Spec: docs/superpowers/specs/2026-04-20-musterloesungen-bereinigung-design.md
Plan: docs/superpowers/plans/2026-04-20-bundle-p-pruefung-hardening.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push
```

- [ ] **Step 5: Branch aufräumen**

```bash
cd "10 Github/GYM-WR-DUY"
git branch -d feature/musterloesungen-bereinigung
# Falls remote-Branch existiert:
# git push origin --delete feature/musterloesungen-bereinigung
```

- [ ] **Step 6: Claude meldet Abschluss**

```
Bundle P auf main. Letzter Commit: <sha>. Bundle Ü (Üben-Pre-Load) ist
nicht gestartet — das ist eine eigene Session mit eigenem Plan, der
erst geschrieben wird wenn du dazu grünes Licht gibst.
```

---

## Rollback-Plan

Wenn Task 6 eine Regression aufdeckt, die nicht schnell fixbar ist:

1. **Apps-Script-Rollback:** Im Apps-Script-Editor "Bereitstellungen verwalten" → alte Version (vor Task 6 Step 2 notiert) reaktivieren. Frontend auf `main` ist noch nicht verändert, funktioniert mit alter Apps-Script-Version weiter.
2. **Git-Rollback (nur falls gepusht):** `git revert <merge-commit>` auf `main`.
3. **Feature-Branch behalten** — kein `branch -d` vor erfolgreicher Verifikation.

---

## Risiken & Annahmen

**Annahme 1:** Kein Frontend-Fragentyp-Component im Prüfungs-Pfad liest ein Lösungsfeld, das durch die strengere Bereinigung wegfällt. Audit-Grep am 2026-04-20 zeigte: alle Lese-Stellen für `musterlosung`/`korrekt`/`zoneId` etc. sind in LP-Komponenten (Korrekturansicht, Editor) oder hinter Mode-Guards. Falls ein versteckter Pfad auftaucht → Task 6 fängt das im funktionalen SuS-Flow-Test.

**Annahme 2:** Der `pruefungStore` nutzt die Lösungsfelder wirklich nicht für Rendering/Berechnung. Audit-Grep bestätigt. Risiko minimiert.

**Annahme 3:** `mischeFrageOptionen_` mutiert das Objekt gefahrlos — weil `bereinigeFrageFuerSuS_` eine Deep-Copy via `JSON.parse(JSON.stringify(...))` macht. Wenn künftig jemand `mischeFrageOptionen_` direkt aufruft ohne vorherige Deep-Copy, kann das Probleme geben. Mitigation: JSDoc-Kommentar auf `mischeFrageOptionen_` dokumentiert die Vorbedingung.

**Risiko (niedrig):** Apps-Script-Quote erreicht — die konsolidierte Funktion durchläuft für `ladePruefung` nun mehr `delete`-Operationen + `.map()`-Aufrufe. Pro Frage sind das einige Mikrosekunden mehr. Für typische Prüfung mit 20–40 Fragen unbedenklich.

**Risiko (niedrig):** Wenn `ladeAbgabe` oder ein weiterer Endpoint `bereinigeFrageFuerSuS_` aufruft, das wir übersehen haben, könnten dortige SuS-sichtbare Fragen ebenfalls strenger werden. Das ist gewünscht — alle SuS-Pfade sollen strikt sein. Pre-Deploy-Grep auf `bereinigeFrageFuerSuS_` listet alle Call-Sites zur Kontrolle.

---

## Definition of Done

- [ ] `bereinigeFrageFuerSuS_` + `mischeFrageOptionen_` + `bereinigeFrageFuerSuSUeben_` wie spezifiziert umgestellt.
- [ ] `uebenSecurityInvariant.test.ts` Sperrliste erweitert, 5 neue Tests grün.
- [ ] `npx tsc -b` grün, `npx vitest run` grün, `npm run build` grün.
- [ ] Apps-Script deployed (User-Aktion).
- [ ] Staging-E2E: `ladePruefung`-Response enthält keine Lösungsfelder.
- [ ] Staging-E2E: Prüfungs-Flow als SuS funktioniert normal.
- [ ] Staging-E2E: `lernplattformLadeFragen` keine Regression.
- [ ] `HANDOFF.md` dokumentiert Session 126 Bundle P.
- [ ] Merge auf main + Push + Branch gelöscht.
