# Ueben Security — Korrektur-Endpoint Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verhindern, dass `lernplattformLadeFragen()` Lösungsdaten (explizit + über Reihenfolgen) an SuS ausliefert. Server-side Korrektur via neuem Endpoint `lernplattformPruefeAntwort` — Client-Korrektur in `korrektur.ts` bleibt als Fallback für Demo-Modus + angeleitete Übungen.

**Architecture:** Zweiphasiger Deploy: **Phase 1** (Frontend-Defensive) erst auf `main`, um in-flight Clients während Phase 2 vor white-screen zu schützen. **Phase 2** koppelt Backend-Bereinigung + neuen Endpoint + Frontend-Async-Refactor. Die Übungs-Typen werden pro Aufruf gemischt (Fisher-Yates).

**Tech Stack:** Apps Script (Google Sheets Backend), React 19 + Zustand, Vitest, TypeScript.

**Spec:** [docs/superpowers/specs/2026-04-19-ueben-security-korrekturendpoint-design.md](../specs/2026-04-19-ueben-security-korrekturendpoint-design.md)

---

## File Structure

### Phase 1 (Frontend-Defensive)

| Datei | Aktion | Verantwortung |
|-------|--------|---------------|
| `src/utils/ueben/fragetypNormalizer.ts` | Modify | Neue Normalizer für `mc`, `richtigfalsch`, `sortierung`, `zuordnung`. Dispatch-Map in `normalisiereFrageDaten` erweitern. |
| `src/utils/ueben/fragetypNormalizer.test.ts` | Create | TDD für neue Normalizer + defensive Fallbacks |
| `src/utils/ueben/korrektur.ts` | Modify | Defensive `Array.isArray`-Guards für alle `frage.X.filter/some/every`-Aufrufe |
| `src/utils/ueben/korrektur.test.ts` | Create | TDD für Guards (bereinigte Daten → kein Crash, `false` zurück) |

### Phase 2 (Backend + Frontend-Async)

**Backend:**

| Datei | Aktion | Verantwortung |
|-------|--------|---------------|
| `ExamLab/apps-script-code.js` | Modify (mehrere Stellen) | `shuffle_`, `bereinigeFrageFuerSuSUeben_`, `pruefeAntwortServer_`, `lernplattformPruefeAntwort`, SuS-Path in `lernplattformLadeFragen`, Router-Wiring in `doPost` |

**Frontend:**

| Datei | Aktion | Verantwortung |
|-------|--------|---------------|
| `src/services/uebenKorrekturApi.ts` | Create | `pruefeAntwort(gruppeId, frageId, antwort) → Promise<PruefResultat>` |
| `src/types/ueben/pruefResultat.ts` | Create | Type-Def für `PruefResultat` |
| `src/store/ueben/uebungsStore.ts` | Modify | `pruefeAntwortJetzt` async, neue States `speichertPruefung`, `pruefFehler`, `letzteMusterloesung` |
| `src/hooks/useFrageAdapter.ts` | Modify | Propagiert `speichertPruefung`, `pruefFehler`, `letzteMusterloesung` |
| `src/components/ueben/QuizNavigation.tsx` | Modify | Spinner + `aria-busy` am Prüfen-Button |
| `src/components/ueben/UebungsScreen.tsx` | Modify | Error-Banner + Retry bei `pruefFehler` |
| `src/components/ueben/SelbstbewertungsDialog.tsx` | Modify | Empfängt `musterlosung` vom Server statt aus frage-Daten |
| `src/tests/uebenKorrekturApi.test.ts` | Create | Mock-Tests für Service |
| `src/tests/uebungsStorePruefen.test.ts` | Create | Async-Refactor + States |
| `src/tests/uebenSecurityInvariant.test.ts` | Create | Snapshot-Test: Mock-SuS-Response hat keine Lösungsfelder |

### Phase 1 + 2 gemeinsam

| Datei | Aktion | Verantwortung |
|-------|--------|---------------|
| `ExamLab/HANDOFF.md` | Modify | S121 (Phase 1) + S122 (Phase 2) Einträge |

---

## Phase 1 — Frontend-Defensive (eigene PR, Merge zu `main` VOR Phase 2)

### Task 1: Defensive Normalizer für `mc`

**Files:**
- Modify: `ExamLab/src/utils/ueben/fragetypNormalizer.ts`
- Create: `ExamLab/src/utils/ueben/fragetypNormalizer.test.ts` (falls noch nicht existiert)

- [ ] **Step 1: Test schreiben (red)**

In `fragetypNormalizer.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { normalisiereFrageDaten } from './fragetypNormalizer'

describe('normalisiereMc', () => {
  it('setzt fehlendes optionen[].korrekt auf false (Default)', () => {
    const frage: any = { id: 'f1', typ: 'mc', optionen: [{ id: 'o1', text: 'A' }, { id: 'o2', text: 'B' }] }
    const n: any = normalisiereFrageDaten(frage)
    expect(n.optionen.every((o: any) => typeof o.korrekt === 'boolean')).toBe(true)
  })

  it('behält bestehendes optionen[].korrekt', () => {
    const frage: any = { id: 'f1', typ: 'mc', optionen: [{ id: 'o1', text: 'A', korrekt: true }, { id: 'o2', text: 'B', korrekt: false }] }
    const n: any = normalisiereFrageDaten(frage)
    expect(n.optionen[0].korrekt).toBe(true)
    expect(n.optionen[1].korrekt).toBe(false)
  })

  it('handelt fehlendes optionen[] als leeres Array', () => {
    const frage: any = { id: 'f1', typ: 'mc' }
    const n: any = normalisiereFrageDaten(frage)
    expect(Array.isArray(n.optionen)).toBe(true)
    expect(n.optionen.length).toBe(0)
  })
})
```

- [ ] **Step 2: Run test**

Run: `cd ExamLab && npx vitest run src/utils/ueben/fragetypNormalizer.test.ts -t "normalisiereMc"`
Expected: FAIL (no dispatch for `mc` → Frage wird unverändert zurückgegeben → `optionen[].korrekt` bleibt undefined, oder `optionen` ist undefined)

- [ ] **Step 3: Implementation**

In `fragetypNormalizer.ts` neue Funktion ergänzen (nach `normalisiereLueckentext`):

```ts
function normalisiereMc(f: any): any {
  const optionen = Array.isArray(f.optionen) ? f.optionen : []
  return {
    ...f,
    optionen: optionen.map((o: any) => ({
      ...o,
      korrekt: typeof o.korrekt === 'boolean' ? o.korrekt : false,
    })),
  }
}
```

Dispatch in `normalisiereFrageDaten` erweitern:

```ts
case 'mc':
  return normalisiereMc(frage as any) as Frage
```

- [ ] **Step 4: Run tests**

Run: `cd ExamLab && npx vitest run src/utils/ueben/fragetypNormalizer.test.ts -t "normalisiereMc"`
Expected: PASS (3/3)

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/ueben/fragetypNormalizer.ts ExamLab/src/utils/ueben/fragetypNormalizer.test.ts
git commit -m "Phase1: defensive normalisiereMc für fehlende korrekt-Felder"
```

### Task 2: Defensive Normalizer für `richtigfalsch`

**Files:**
- Modify: `ExamLab/src/utils/ueben/fragetypNormalizer.ts`
- Modify: `ExamLab/src/utils/ueben/fragetypNormalizer.test.ts`

- [ ] **Step 1: Test (red)**

```ts
describe('normalisiereRichtigFalsch', () => {
  it('setzt fehlendes aussagen[].korrekt auf false', () => {
    const f: any = { id: 'f1', typ: 'richtigfalsch', aussagen: [{ id: 'a1', text: 'X' }] }
    const n: any = normalisiereFrageDaten(f)
    expect(typeof n.aussagen[0].korrekt).toBe('boolean')
  })
  it('fehlendes aussagen[] → []', () => {
    const n: any = normalisiereFrageDaten({ id: 'f1', typ: 'richtigfalsch' } as any)
    expect(Array.isArray(n.aussagen)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test, expect FAIL**
- [ ] **Step 3: Implementation**

```ts
function normalisiereRichtigFalsch(f: any): any {
  const aussagen = Array.isArray(f.aussagen) ? f.aussagen : []
  return {
    ...f,
    aussagen: aussagen.map((a: any) => ({
      ...a,
      korrekt: typeof a.korrekt === 'boolean' ? a.korrekt : false,
    })),
  }
}
```

Dispatch:
```ts
case 'richtigfalsch':
  return normalisiereRichtigFalsch(frage as any) as Frage
```

- [ ] **Step 4: Run tests, expect PASS**
- [ ] **Step 5: Commit**

```bash
git commit -am "Phase1: defensive normalisiereRichtigFalsch"
```

### Task 3: Defensive Normalizer für `sortierung` + `zuordnung`

**Files:**
- Modify: `ExamLab/src/utils/ueben/fragetypNormalizer.ts`
- Modify: `ExamLab/src/utils/ueben/fragetypNormalizer.test.ts`

- [ ] **Step 1: Tests (red)**

```ts
describe('normalisiereSortierung', () => {
  it('fehlendes elemente[] → []', () => {
    const n: any = normalisiereFrageDaten({ id: 'f1', typ: 'sortierung' } as any)
    expect(Array.isArray(n.elemente)).toBe(true)
  })
})
describe('normalisiereZuordnung', () => {
  it('fehlendes paare[] → [] und linksItems/rechtsItems Fallback', () => {
    const n: any = normalisiereFrageDaten({ id: 'f1', typ: 'zuordnung' } as any)
    expect(Array.isArray(n.paare)).toBe(true)
    expect(Array.isArray(n.linksItems)).toBe(true)
    expect(Array.isArray(n.rechtsItems)).toBe(true)
  })
  it('rekonstruiert paare[] aus linksItems + rechtsItems (neues Backend-Format)', () => {
    const f: any = { id: 'f1', typ: 'zuordnung', linksItems: [{ id: 'L1', text: 'a' }], rechtsItems: [{ id: 'R1', text: 'b' }] }
    const n: any = normalisiereFrageDaten(f)
    expect(Array.isArray(n.paare)).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests, expect FAIL**
- [ ] **Step 3: Implementation**

```ts
function normalisiereSortierung(f: any): any {
  return { ...f, elemente: Array.isArray(f.elemente) ? f.elemente : [] }
}

function normalisiereZuordnung(f: any): any {
  const paare = Array.isArray(f.paare) ? f.paare : []
  const linksItems = Array.isArray(f.linksItems)
    ? f.linksItems
    : paare.map((p: any, i: number) => ({ id: p.id || `L${i}`, text: p.links }))
  const rechtsItems = Array.isArray(f.rechtsItems)
    ? f.rechtsItems
    : paare.map((p: any, i: number) => ({ id: p.id || `R${i}`, text: p.rechts }))
  return { ...f, paare, linksItems, rechtsItems }
}
```

Dispatch ergänzen.

- [ ] **Step 4: Run tests, expect PASS**
- [ ] **Step 5: Commit**

```bash
git commit -am "Phase1: defensive normalisiereSortierung + normalisiereZuordnung"
```

### Task 4: Defensive Guards in `korrektur.ts`

Alle `frage.X.filter/some/every/map`-Aufrufe in `korrektur.ts::pruefeAntwort` sicher gegen `undefined`/`null`.

**Files:**
- Modify: `ExamLab/src/utils/ueben/korrektur.ts`
- Create: `ExamLab/src/utils/ueben/korrektur.test.ts`

- [ ] **Step 1: Tests (red) — Crash-Schutz für alle Fragetypen**

```ts
import { describe, it, expect } from 'vitest'
import { pruefeAntwort } from './korrektur'

describe('pruefeAntwort — defensive gegen bereinigte Pool-Daten', () => {
  it('mc ohne optionen[] crasht nicht', () => {
    expect(() => pruefeAntwort({ id:'f', typ:'mc' } as any, { typ:'mc', gewaehlteOptionen:['x'] } as any))
      .not.toThrow()
  })
  it('mc ohne optionen[] liefert false', () => {
    expect(pruefeAntwort({ id:'f', typ:'mc' } as any, { typ:'mc', gewaehlteOptionen:['x'] } as any)).toBe(false)
  })
  it('richtigfalsch ohne aussagen[] crasht nicht', () => {
    expect(() => pruefeAntwort({ id:'f', typ:'richtigfalsch' } as any, { typ:'richtigfalsch', bewertungen:{} } as any))
      .not.toThrow()
  })
  it('lueckentext ohne luecken[].korrekteAntworten crasht nicht', () => {
    const f: any = { id:'f', typ:'lueckentext', luecken:[{id:'l1'}] }
    const a: any = { typ:'lueckentext', eintraege:{l1:'x'} }
    expect(() => pruefeAntwort(f, a)).not.toThrow()
    expect(pruefeAntwort(f, a)).toBe(false)
  })
  it('sortierung ohne elemente[] crasht nicht', () => {
    const f: any = { id:'f', typ:'sortierung' }
    const a: any = { typ:'sortierung', reihenfolge:['x'] }
    expect(() => pruefeAntwort(f, a)).not.toThrow()
  })
  it('zuordnung ohne paare[] crasht nicht', () => {
    expect(() => pruefeAntwort({ id:'f', typ:'zuordnung' } as any, { typ:'zuordnung', zuordnungen:{} } as any))
      .not.toThrow()
  })
})
```

- [ ] **Step 2: Run tests, expect FAIL (meiste Crashes TypeError)**
- [ ] **Step 3: Implementation**

In `korrektur.ts::pruefeAntwort` jede Verwendung absichern:

```ts
// case 'mc':
const optionen = Array.isArray(frage.optionen) ? frage.optionen : []
if (frage.mehrfachauswahl) {
  const korrekte = optionen.filter(o => o.korrekt).map(o => o.id)
  ...
}

// case 'richtigfalsch':
const aussagen = Array.isArray(frage.aussagen) ? frage.aussagen : []
return aussagen.every(aus => a.bewertungen[aus.id] === aus.korrekt)

// case 'lueckentext':
const luecken = Array.isArray(frage.luecken) ? frage.luecken : []
return luecken.every(l => {
  const eingabe = (a.eintraege[l.id] || '').trim()
  const korrekt = Array.isArray(l.korrekteAntworten) ? l.korrekteAntworten : []
  if (korrekt.length === 0) return false
  return korrekt.some(ka => ...)
})

// case 'sortierung':
const elemente = Array.isArray(frage.elemente) ? frage.elemente : []
const reihenfolge = Array.isArray(a.reihenfolge) ? a.reihenfolge : []
return elemente.length > 0 && elemente.length === reihenfolge.length && elemente.every((e, i) => e === reihenfolge[i])

// case 'zuordnung':
const paare = Array.isArray(frage.paare) ? frage.paare : []
return paare.length > 0 && paare.every(p => a.zuordnungen[p.links] === p.rechts)
```

Und analog für `berechnung`, `buchungssatz`, `hotspot`, `bildbeschriftung`, `dragdrop_bild`, `aufgabengruppe` — überall wo ein `frage.X.Y()` auf einem Array-Member aufgerufen wird.

- [ ] **Step 4: Run tests**

```bash
cd ExamLab && npx vitest run src/utils/ueben/korrektur.test.ts
```

Expected: PASS (alle Guards greifen, kein Crash).

- [ ] **Step 5: Full test suite**

```bash
cd ExamLab && npx vitest run
```

Expected: Alle existierenden Tests weiterhin grün (keine Regression) + neue Guards-Tests grün.

- [ ] **Step 6: Commit**

```bash
git add ExamLab/src/utils/ueben/korrektur.ts ExamLab/src/utils/ueben/korrektur.test.ts
git commit -m "Phase1: Array.isArray-Guards in pruefeAntwort gegen bereinigte Pool-Daten"
```

### Task 5: Phase 1 Merge zu main

- [ ] **Step 1: Full checks lokal**

```bash
cd ExamLab
npx tsc -b
npx vitest run
npm run build
```

Alle drei müssen grün sein.

- [ ] **Step 2: Feature-Branch mergen**

Aktueller Branch: `feature/ueben-security-korrekturendpoint` (Spec + alle Phase-1-Commits). Wir **mergen Phase 1 separat** zu main, Phase 2 bleibt auf dem Branch.

Option A (einfach, empfohlen): Neuer Branch nur für Phase 1.

```bash
git checkout main
git checkout -b phase1/ueben-defensive-normalizer
# Cherry-pick alle Phase-1-Commits aus feature/ueben-security-korrekturendpoint
git cherry-pick <hash-task1> <hash-task2> <hash-task3> <hash-task4>
# Lokale Checks erneut
npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 3: Push + Staging-Verify**

```bash
git push -u origin phase1/ueben-defensive-normalizer
git push origin phase1/ueben-defensive-normalizer:preview --force-with-lease
```

Warte auf GitHub-Actions-Deploy (~2 min), dann via Chrome-in-Chrome mit echtem SuS-Login eine Übung öffnen. **Phase 1 hat KEINE sichtbare Änderung** — es geht nur um Robustheit. Verifikation: nichts crasht, alle Fragetypen funktionieren weiterhin.

- [ ] **Step 4: LP-Freigabe abwarten**

- [ ] **Step 5: Merge zu main**

```bash
git checkout main && git pull --ff-only
git merge --no-ff phase1/ueben-defensive-normalizer -m "Phase 1: Frontend-Defensive für Phase-2-Backend-Änderung"
git push origin main
git branch -d phase1/ueben-defensive-normalizer
git push origin --delete phase1/ueben-defensive-normalizer
```

- [ ] **Step 6: HANDOFF aktualisieren**

S121-Eintrag in `ExamLab/HANDOFF.md` (Phase 1 abgeschlossen, Phase 2 offen).

```bash
git commit -am "HANDOFF: S121 Phase 1 Frontend-Defensive"
git push origin main
```

**Phase 1 ist hier fertig.** Clients haben jetzt den Schutz-Normalizer. Phase 2 kann anfangen.

---

## Phase 2 — Backend + Frontend-Async (eigene PR nach Phase 1 gemergt)

Arbeitet weiter auf `feature/ueben-security-korrekturendpoint` (existiert bereits mit Spec).

```bash
git checkout feature/ueben-security-korrekturendpoint
git rebase main  # Phase 1 einziehen
```

### Task 6: Apps-Script `shuffle_` Helper

**Files:**
- Modify: `ExamLab/apps-script-code.js` (am Ende, vor `bereinigeFrageFuerSuS_`)

- [ ] **Step 1: Code einfügen**

```js
/** Fisher-Yates Shuffle (mutiert nicht, liefert neue Kopie) */
function shuffle_(arr) {
  if (!Array.isArray(arr)) return arr;
  var result = arr.slice();
  for (var i = result.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}
```

- [ ] **Step 2: Sanity-Test via Apps-Script-Editor**

Füge temporär einen Test ans Ende der Datei:

```js
function TEST_shuffle_() {
  var a = [1,2,3,4,5];
  var b = shuffle_(a);
  Logger.log('original: ' + JSON.stringify(a));
  Logger.log('shuffled: ' + JSON.stringify(b));
  Logger.log('same length: ' + (a.length === b.length));
  Logger.log('a unchanged: ' + JSON.stringify(a) === '[1,2,3,4,5]');
}
```

User führt `TEST_shuffle_` im Apps-Script-Editor aus und meldet Logger-Output. Original darf nicht verändert sein, Shuffled hat gleiche Länge. Danach `TEST_shuffle_` wieder entfernen.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Phase2-B: shuffle_ Helper (Fisher-Yates)"
```

### Task 7: Apps-Script `bereinigeFrageFuerSuSUeben_`

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 1: Neue Funktion direkt nach `bereinigeFrageFuerSuS_` einfügen**

```js
/**
 * Bereinigung für selbstständiges Üben: baut auf bereinigeFrageFuerSuS_ auf.
 * Zusätzlich: Reihenfolgen mischen (Fisher-Yates) bei 8 Typen, damit konstantes Muster
 * kein Hinweis auf Lösung gibt. Entfernt zusätzliche Lösungsfelder in FiBu-Typen.
 */
function bereinigeFrageFuerSuSUeben_(frage) {
  var f = bereinigeFrageFuerSuS_(frage);

  // Zusätzliche Lösungsfeld-Bereinigungen (nicht in Pruefungs-Variante)
  if (f.buchungen && Array.isArray(f.buchungen)) {
    // Buchungssatz: Lösung zeigt korrekte Buchungen — für SuS entfernen
    delete f.buchungen;
  }
  if (f.korrektBuchung) delete f.korrektBuchung;
  if (f.sollEintraege) delete f.sollEintraege;
  if (f.habenEintraege) delete f.habenEintraege;
  if (f.konten && Array.isArray(f.konten)) {
    f.konten = f.konten.map(function(k) {
      var c = Object.assign({}, k);
      delete c.korrekt;
      return c;
    });
  }
  if (f.bilanzEintraege && Array.isArray(f.bilanzEintraege)) {
    f.bilanzEintraege = f.bilanzEintraege.map(function(e) {
      var c = Object.assign({}, e);
      delete c.korrekt;
      return c;
    });
  }
  if (f.typ === 'formel' && f.korrekt) delete f.korrekt;

  // Bildbeschriftung / DragDrop-Bild: labels[].zoneId IST die Lösung
  if ((f.typ === 'bildbeschriftung' || f.typ === 'dragdrop_bild') && f.labels && Array.isArray(f.labels)) {
    f.labels = f.labels.map(function(l) {
      var c = Object.assign({}, l);
      delete c.zoneId;
      delete c.zone;
      delete c.korrekt;
      return c;
    });
  }

  // Hotspot: hotspots[].korrekt entfernen
  if (f.typ === 'hotspot' && f.hotspots && Array.isArray(f.hotspots)) {
    f.hotspots = f.hotspots.map(function(h) {
      var c = Object.assign({}, h);
      delete c.korrekt;
      return c;
    });
  }

  // Mischung (Fisher-Yates) pro Typ
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
      if (Array.isArray(f.paare)) {
        // Split in linksItems (reihenfolge-konstant) + rechtsItems (gemischt)
        var links = f.paare.map(function(p, i) { return { id: p.id || 'L'+i, text: p.links }; });
        var rechts = f.paare.map(function(p, i) { return { id: p.id || 'R'+i, text: p.rechts }; });
        f.linksItems = links;
        f.rechtsItems = shuffle_(rechts);
        delete f.paare; // Ersetzen
      }
      break;
    case 'bildbeschriftung':
    case 'dragdrop_bild':
      if (Array.isArray(f.labels)) f.labels = shuffle_(f.labels);
      break;
    case 'hotspot':
      if (Array.isArray(f.hotspots)) f.hotspots = shuffle_(f.hotspots);
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
  if (f.teilaufgaben && Array.isArray(f.teilaufgaben)) {
    f.teilaufgaben = f.teilaufgaben.map(bereinigeFrageFuerSuSUeben_);
  }

  return f;
}
```

- [ ] **Step 2: Sanity-Test im Apps-Script-Editor**

Temporärer Test:

```js
function TEST_bereinigeUeben_() {
  var test = {
    id: 'f1', typ: 'mc', musterlosung: 'LEAK',
    optionen: [{id:'o1', text:'A', korrekt:true}, {id:'o2', text:'B', korrekt:false}]
  };
  var r = bereinigeFrageFuerSuSUeben_(test);
  Logger.log('musterlosung entfernt: ' + (r.musterlosung === undefined));
  Logger.log('optionen[0].korrekt entfernt: ' + (r.optionen[0].korrekt === undefined));
  Logger.log('optionen Länge erhalten: ' + (r.optionen.length === 2));
}
```

Führe aus, erwarte 3× `true`. Danach Test wieder entfernen.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Phase2-B: bereinigeFrageFuerSuSUeben_ (Lösungs-Felder + Mischung)"
```

### Task 8: `lernplattformLadeFragen` SuS-Detection + Bereinigung

**Files:**
- Modify: `ExamLab/apps-script-code.js:7082` (`lernplattformLadeFragen` Funktion)

- [ ] **Step 1: Body um `email` erweitern**

Aktueller Zustand (Zeile 7084):

```js
var gruppeId = body.gruppeId;
```

Erweitern:

```js
var gruppeId = body.gruppeId;
var email = (body.email || '').toString().toLowerCase();
var istLP = istZugelasseneLP(email);
```

- [ ] **Step 2: Bereinigung vor `return jsonResponse` ergänzen**

Direkt vor dem Return (Zeile 7129 `return jsonResponse({ success: true, data: alleFragen });`):

```js
if (!istLP) {
  alleFragen = alleFragen.map(bereinigeFrageFuerSuSUeben_);
}

return jsonResponse({ success: true, data: alleFragen });
```

- [ ] **Step 3: Frontend-Adapter — `email` mitschicken**

Verifiziert: `appsScriptAdapter.ts:18` hat bereits `private getEmail(): string | undefined` und wird in `speichereFrage`/`loescheFrage` bereits verwendet. Kein neuer Helper nötig.

In `ExamLab/src/adapters/ueben/appsScriptAdapter.ts:151`:

Aktuell:
```ts
const response = await uebenApiClient.post<{ success: boolean; data: Frage[] }>(
  'lernplattformLadeFragen', { gruppeId }, token
)
```

Ändern zu:
```ts
const email = this.getEmail()
const response = await uebenApiClient.post<{ success: boolean; data: Frage[] }>(
  'lernplattformLadeFragen', { gruppeId, email }, token
)
```

- [ ] **Step 4: TypeScript-Check**

```bash
cd ExamLab && npx tsc -b
```

Expected: grün.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/apps-script-code.js ExamLab/src/adapters/ueben/appsScriptAdapter.ts
git commit -m "Phase2-B: SuS-Detection in lernplattformLadeFragen + Bereinigung"
```

### Task 9: `pruefeAntwortServer_` Port aus `korrektur.ts`

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 1: Neue Funktion einfügen (vor `lernplattformLadeFragen`)**

Port von `korrektur.ts::pruefeAntwort` nach Apps-Script. Nachfolgend der vollständige Code — spiegelt die TS-Version 1:1.

```js
var SELBSTBEWERTUNGS_TYPEN_ = ['freitext', 'visualisierung', 'pdf', 'audio', 'code'];

function istSelbstbewertungstyp_(typ) {
  return SELBSTBEWERTUNGS_TYPEN_.indexOf(typ) !== -1;
}

/**
 * Server-side Korrektur — spiegelt korrektur.ts::pruefeAntwort.
 * Rückgabe: boolean (korrekt/falsch) für auto-korrigierbare Typen,
 * null für Selbstbewertungstypen (Caller entscheidet dann über Response).
 */
function pruefeAntwortServer_(frage, antwort) {
  if (!frage || !antwort) return false;
  var a = antwort;
  switch (frage.typ) {
    case 'mc':
      if (a.typ !== 'mc') return false;
      var gewaehlt = Array.isArray(a.gewaehlteOptionen) ? a.gewaehlteOptionen : [];
      var optionen = Array.isArray(frage.optionen) ? frage.optionen : [];
      if (frage.mehrfachauswahl) {
        var korrekte = optionen.filter(function(o) { return o.korrekt; }).map(function(o) { return o.id; });
        var s1 = gewaehlt.slice().sort();
        var s2 = korrekte.slice().sort();
        return s1.length === s2.length && s1.every(function(v, i) { return v === s2[i]; });
      }
      var k = optionen.filter(function(o) { return o.korrekt; })[0];
      if (!k) return false;
      return gewaehlt[0] === k.id || gewaehlt[0] === k.text;

    case 'richtigfalsch':
      if (a.typ !== 'richtigfalsch') return false;
      var aussagen = Array.isArray(frage.aussagen) ? frage.aussagen : [];
      var bew = a.bewertungen || {};
      return aussagen.length > 0 && aussagen.every(function(x) { return bew[x.id] === x.korrekt; });

    case 'lueckentext':
      if (a.typ !== 'lueckentext') return false;
      var luecken = Array.isArray(frage.luecken) ? frage.luecken : [];
      var eintraege = a.eintraege || {};
      return luecken.length > 0 && luecken.every(function(l) {
        var eingabe = String(eintraege[l.id] || '').trim();
        var korrekt = Array.isArray(l.korrekteAntworten) ? l.korrekteAntworten : [];
        if (korrekt.length === 0) return false;
        return korrekt.some(function(ka) {
          return l.caseSensitive ? eingabe === String(ka).trim() : eingabe.toLowerCase() === String(ka).trim().toLowerCase();
        });
      });

    case 'berechnung':
      if (a.typ !== 'berechnung') return false;
      var ergebnisse = Array.isArray(frage.ergebnisse) ? frage.ergebnisse : [];
      var input = a.ergebnisse || {};
      if (ergebnisse.length === 1) {
        var istStr = input['default'] !== undefined ? input['default'] : Object.values(input)[0] || '';
        var ist = parseFloat(istStr);
        if (isNaN(ist)) return false;
        return Math.abs(ergebnisse[0].korrekt - ist) <= ergebnisse[0].toleranz;
      }
      return ergebnisse.length > 0 && ergebnisse.every(function(e) {
        var ist = parseFloat(input[e.id] || '0');
        if (isNaN(ist)) return false;
        return Math.abs(e.korrekt - ist) <= e.toleranz;
      });

    case 'sortierung':
      if (a.typ !== 'sortierung') return false;
      var elemente = Array.isArray(frage.elemente) ? frage.elemente : [];
      var reihenfolge = Array.isArray(a.reihenfolge) ? a.reihenfolge : [];
      return elemente.length > 0 && elemente.length === reihenfolge.length &&
        elemente.every(function(e, i) { return e === reihenfolge[i]; });

    case 'zuordnung':
      if (a.typ !== 'zuordnung') return false;
      var paare = Array.isArray(frage.paare) ? frage.paare : [];
      var zu = a.zuordnungen || {};
      return paare.length > 0 && paare.every(function(p) { return zu[p.links] === p.rechts; });

    case 'hotspot':
      if (a.typ !== 'hotspot') return false;
      var hotspots = Array.isArray(frage.hotspots) ? frage.hotspots : [];
      var klicks = Array.isArray(a.klicks) ? a.klicks : [];
      var korrekteHotspots = hotspots.filter(function(h) { return h.korrekt; });
      if (korrekteHotspots.length === 0 || klicks.length === 0) return false;
      return korrekteHotspots.every(function(h) {
        return klicks.some(function(k) {
          var dx = k.x - h.x, dy = k.y - h.y;
          return Math.sqrt(dx*dx + dy*dy) <= (h.radius || 5);
        });
      });

    case 'bildbeschriftung':
    case 'dragdrop_bild':
      if (a.typ !== frage.typ) return false;
      var labels = Array.isArray(frage.labels) ? frage.labels : [];
      var zuordnungen = a.zuordnungen || {};
      return labels.length > 0 && labels.every(function(l) { return zuordnungen[l.id] === l.zoneId; });

    case 'buchungssatz':
    case 'tkonto':
    case 'bilanzstruktur':
    case 'kontenbestimmung':
    case 'formel':
      // FiBu + Formel: abhängig von typ-spezifischer Logik — Port aus korrektur.ts
      return pruefeFibuAntwortServer_(frage, a);

    case 'aufgabengruppe':
      if (a.typ !== 'aufgabengruppe' && !a.teilantworten) return false;
      var ta = Array.isArray(frage.teilaufgaben) ? frage.teilaufgaben : [];
      var ans = a.teilantworten || {};
      return ta.length > 0 && ta.every(function(sub) {
        return pruefeAntwortServer_(sub, ans[sub.id]);
      });

    case 'freitext':
    case 'visualisierung':
    case 'pdf':
    case 'audio':
    case 'code':
      return null; // Selbstbewertung — Caller entscheidet
  }
  return false;
}

/** FiBu + Formel — 1:1 Port aus korrektur.ts */
function pruefeFibuAntwortServer_(frage, antwort) {
  switch (frage.typ) {
    case 'buchungssatz': {
      if (antwort.typ !== 'buchungssatz') return false;
      var korrektZeilen = Array.isArray(frage.buchungen) ? frage.buchungen : [];
      var eingabeZeilen = Array.isArray(antwort.buchungen) ? antwort.buchungen : [];
      if (korrektZeilen.length === 0 || korrektZeilen.length !== eingabeZeilen.length) return false;
      var genutzt = {};
      return korrektZeilen.every(function(kz) {
        return eingabeZeilen.some(function(ez, i) {
          if (genutzt[i]) return false;
          if (ez.sollKonto === kz.sollKonto && ez.habenKonto === kz.habenKonto && Math.abs(ez.betrag - kz.betrag) < 0.01) {
            genutzt[i] = true;
            return true;
          }
          return false;
        });
      });
    }

    case 'tkonto': {
      if (antwort.typ !== 'tkonto') return false;
      var konten = Array.isArray(frage.konten) ? frage.konten : [];
      return konten.every(function(konto) {
        var eingabe = (antwort.konten || []).find(function(k) { return k.id === konto.id; });
        if (!eingabe) return false;
        var kLinks = (konto.eintraege || []).filter(function(e) { return e.seite === 'soll'; });
        var kRechts = (konto.eintraege || []).filter(function(e) { return e.seite === 'haben'; });
        var linksOk = kLinks.length === (eingabe.eintraegeLinks || []).length &&
          kLinks.every(function(ks) {
            return (eingabe.eintraegeLinks || []).some(function(es) {
              return es.gegenkonto === ks.gegenkonto && Math.abs(es.betrag - ks.betrag) < 0.01;
            });
          });
        var rechtsOk = kRechts.length === (eingabe.eintraegeRechts || []).length &&
          kRechts.every(function(kh) {
            return (eingabe.eintraegeRechts || []).some(function(eh) {
              return eh.gegenkonto === kh.gegenkonto && Math.abs(eh.betrag - kh.betrag) < 0.01;
            });
          });
        var saldo = eingabe.saldo;
        var saldoOk = saldo ? Math.abs((saldo.betragLinks || 0) - (saldo.betragRechts || 0)) < 0.01 : true;
        return linksOk && rechtsOk && saldoOk;
      });
    }

    case 'bilanzstruktur': {
      if (antwort.typ !== 'bilanzstruktur') return false;
      var loesung = frage.loesung;
      if (!loesung || !loesung.bilanz) return false;
      var bilanzsumme = (antwort.bilanz && (antwort.bilanz.bilanzsummeLinks !== undefined ? antwort.bilanz.bilanzsummeLinks : antwort.bilanz.bilanzsummeRechts)) || 0;
      return Math.abs(bilanzsumme - loesung.bilanz.bilanzsumme) < 0.01;
    }

    case 'kontenbestimmung': {
      if (antwort.typ !== 'kontenbestimmung') return false;
      var aufgaben = Array.isArray(frage.aufgaben) ? frage.aufgaben : [];
      var antwortAufgaben = antwort.aufgaben || {};
      var antwortValues = Object.keys(antwortAufgaben).map(function(k) { return antwortAufgaben[k]; });
      return aufgaben.every(function(aufgabe, i) {
        var eingabe = (antwortValues[i] && antwortValues[i].antworten) || [];
        var erwartet = aufgabe.erwarteteAntworten || [];
        if (erwartet.length !== eingabe.length) return false;
        return erwartet.every(function(ea) {
          return eingabe.some(function(ez) {
            return ez.kontonummer === (ea.kontonummer || '') && ez.seite === ea.seite;
          });
        });
      });
    }

    case 'formel': {
      if (antwort.typ !== 'formel') return false;
      var soll = normalisiereLatex_(frage.korrekteFormel || '');
      var ist = normalisiereLatex_(antwort.latex || '');
      return soll === ist;
    }

    default:
      return false;
  }
}

function normalisiereLatex_(s) {
  return String(s).replace(/\s+/g, '').replace(/\\cdot/g, '\\times').replace(/\*\*/g, '^').toLowerCase();
}
```

- [ ] **Step 2: Zusätzliche Korrektur-Fixes**

Der Stub oben ist durch den vollständigen Port ersetzt. `hotspot`, `bildbeschriftung`, `dragdrop_bild` im Haupt-Switch verwenden noch die ALTE (vereinfachte) Logik — die echte Logik aus `korrektur.ts` (Zeilen 160-186) muss geprüft werden:

```js
case 'hotspot':
  if (antwort.typ !== 'hotspot') return false;
  var bereiche = Array.isArray(frage.bereiche) ? frage.bereiche : [];
  var klicks = Array.isArray(antwort.klicks) ? antwort.klicks : [];
  return bereiche.length === klicks.length && bereiche.every(function(b) {
    return klicks.some(function(k) {
      var r = (b.koordinaten && b.koordinaten.radius) || 10;
      var dx = b.koordinaten.x - k.x, dy = b.koordinaten.y - k.y;
      return Math.sqrt(dx*dx + dy*dy) < r;
    });
  });

case 'bildbeschriftung':
  if (antwort.typ !== 'bildbeschriftung') return false;
  var beschr = Array.isArray(frage.beschriftungen) ? frage.beschriftungen : [];
  var eintraege = antwort.eintraege || {};
  return beschr.length > 0 && beschr.every(function(b) {
    return Array.isArray(b.korrekt) && b.korrekt.some(function(ka) {
      return String(eintraege[b.id] || '').trim().toLowerCase() === String(ka).trim().toLowerCase();
    });
  });

case 'dragdrop_bild':
  if (antwort.typ !== 'dragdrop_bild') return false;
  var zielzonen = Array.isArray(frage.zielzonen) ? frage.zielzonen : [];
  var labels = Array.isArray(frage.labels) ? frage.labels : [];
  var zu = antwort.zuordnungen || {};
  return zielzonen.length > 0 && zielzonen.every(function(z) {
    if (zu[z.korrektesLabel] === z.id) return true;
    return labels.some(function(l) { return l === z.korrektesLabel && zu[l] === z.id; });
  });
```

**Achtung:** Dies überschreibt die einfachen Varianten im Haupt-Switch (Task 9, Step 1). Verwende diese ausführlicheren Versionen statt der initial skizzierten.

- [ ] **Step 3: Sanity-Test im Apps-Script-Editor**

Temporär:

```js
function TEST_pruefeAntwortServer_() {
  var frage = { typ: 'mc', optionen: [{id:'o1', korrekt:true}, {id:'o2', korrekt:false}] };
  var richtig = pruefeAntwortServer_(frage, { typ:'mc', gewaehlteOptionen:['o1'] });
  var falsch  = pruefeAntwortServer_(frage, { typ:'mc', gewaehlteOptionen:['o2'] });
  Logger.log('MC richtig: ' + richtig + ' (erwartet true)');
  Logger.log('MC falsch: ' + falsch + ' (erwartet false)');

  var rf = { typ: 'richtigfalsch', aussagen: [{id:'a1', korrekt:true}, {id:'a2', korrekt:false}] };
  Logger.log('RF richtig: ' + pruefeAntwortServer_(rf, { typ:'richtigfalsch', bewertungen:{a1:true, a2:false} }));
  Logger.log('RF falsch: ' + pruefeAntwortServer_(rf, { typ:'richtigfalsch', bewertungen:{a1:false, a2:false} }));
}
```

Führe aus, erwarte true/false/true/false.

- [ ] **Step 4: Paritäts-Test-Harness (aus autoKorrektur.test.ts Fixtures)**

In `ExamLab/src/utils/autoKorrektur.test.ts` die existierenden Fixtures identifizieren. Neues Script `ExamLab/scripts/export-parity-fixtures.mjs` erstellen, das die Test-Fixtures als JSON-Array nach `ExamLab/scripts/parity-fixtures.json` exportiert (eine Zeile pro Fall: `{ frage, antwort, erwartet }`).

Diese JSON temporär in den Apps-Script-Editor einfügen und `TEST_parity_()` durchlaufen lassen:

```js
function TEST_parity_() {
  var fixtures = [/* hier das JSON-Array einfügen */];
  var fehler = 0;
  fixtures.forEach(function(f, idx) {
    var ist = pruefeAntwortServer_(f.frage, f.antwort);
    if (ist !== f.erwartet) {
      Logger.log('[FAIL #' + idx + ' ' + f.frage.typ + '] erwartet=' + f.erwartet + ' ist=' + ist);
      fehler++;
    }
  });
  Logger.log('Parity: ' + (fixtures.length - fehler) + '/' + fixtures.length + ' pass');
}
```

Wenn `fehler > 0`, Port fixen bis alle Fixtures grün. Nach grün: `TEST_parity_` + JSON wieder entfernen (nur temporär für Verifikation).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/apps-script-code.js ExamLab/scripts/export-parity-fixtures.mjs
git commit -m "Phase2-B: pruefeAntwortServer_ Port aus korrektur.ts (inkl. FiBu) + Paritäts-Harness"
```

### Task 10: `lernplattformPruefeAntwort` Endpoint

**Files:**
- Modify: `ExamLab/apps-script-code.js` (neue Funktion + Router-Wiring)

- [ ] **Step 1: Endpoint-Funktion einfügen**

Nach `lernplattformLadeFragen`:

```js
function lernplattformPruefeAntwort(body) {
  var gruppeId = body.gruppeId;
  var frageId = body.frageId;
  var antwort = body.antwort;
  var email = (body.email || '').toString().toLowerCase();

  if (!gruppeId || !frageId || !antwort || !email) {
    return jsonResponse({ success: false, error: 'Fehlende Parameter' });
  }

  // Rate-Limit (reuse bestehende Helper)
  var rl = rateLimitCheck_('pruefe-antwort', email, 30, 60);
  if (rl.blocked) return jsonResponse({ success: false, error: rl.error });

  // Gruppen-Mitgliedschaft prüfen
  var gruppen = alleGruppenLaden_();
  var gruppe = gruppen.find(function(g) { return g.id === gruppeId; });
  if (!gruppe) return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });

  // Frage frisch laden (unbereinigt)
  var frage = ladeFrageUnbereinigtById_(frageId);
  if (!frage) return jsonResponse({ success: false, error: 'Frage nicht gefunden' });

  var korrektResult = pruefeAntwortServer_(frage, antwort);

  if (istSelbstbewertungstyp_(frage.typ)) {
    return jsonResponse({
      success: true,
      selbstbewertung: true,
      musterlosung: frage.musterlosung || '',
      bewertungsraster: frage.bewertungsraster || null,
    });
  }

  return jsonResponse({
    success: true,
    korrekt: korrektResult === true,
    musterlosung: frage.musterlosung || '',
  });
}

/** Frage unbereinigt aus Fragenbank laden — für Server-Korrektur */
function ladeFrageUnbereinigtById_(frageId) {
  var fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
  var fragenbankTabs = getFragenbankTabs_();
  for (var t = 0; t < fragenbankTabs.length; t++) {
    var sheet = fragenbank.getSheetByName(fragenbankTabs[t]);
    if (!sheet) continue;
    var daten = sheet.getDataRange().getValues();
    if (daten.length < 2) continue;
    var headers = daten[0].map(function(h) { return String(h).trim(); });
    for (var i = 1; i < daten.length; i++) {
      var row = {};
      for (var j = 0; j < headers.length; j++) {
        var key = headers[j];
        var val = daten[i][j];
        if (!key || val === '' || val === null || val === undefined) continue;
        row[key] = String(val);
      }
      if (row.id === frageId) {
        return parseFrageKanonisch_(row, fragenbankTabs[t]);
      }
    }
  }
  return null;
}
```

- [ ] **Step 2: Router-Wiring in `doPost`**

Finde `doPost` und die bestehenden `lernplattform*` Cases. Füge hinzu:

```js
case 'lernplattformPruefeAntwort':
  return lernplattformPruefeAntwort(body);
```

- [ ] **Step 3: Sanity-Test im Apps-Script-Editor**

Stub-Request simulieren:

```js
function TEST_lernplattformPruefeAntwort() {
  var r = lernplattformPruefeAntwort({
    gruppeId: '<echte-Gruppen-ID-hier>',
    frageId: '<echte-Frage-ID-mc>',
    antwort: { typ:'mc', gewaehlteOptionen:['<korrekte-option-id>'] },
    email: 'wr.test@stud.gymhofwil.ch'
  });
  Logger.log(r.getContent());
}
```

Führe aus, erwarte `{success:true, korrekt:true, musterlosung:'…'}`.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Phase2-B: lernplattformPruefeAntwort Endpoint + Router-Wiring"
```

### Task 11: Apps-Script Bereitstellung (User-Aufgabe)

**Hinweis:** Frontend-Tasks (12-16) sind **unabhängig vom Apps-Script-Deploy**. Sie können direkt nach Task 10 parallel laufen. Nur der E2E-Browser-Test (Task 19) hängt am Deploy.

- [ ] **Step 1: User deployed Apps-Script**

User öffnet Apps-Script-Editor, kopiert aktuelle `apps-script-code.js` rein, erstellt **neue Bereitstellung** (nicht „HEAD"). Deployment-URL bleibt konstant (Apps-Script-Projekt-URL).

- [ ] **Step 2: User meldet Bereitstellung fertig**

Danach Task 19 (E2E) ausführbar.

### Task 12: Frontend — `PruefResultat`-Type + Service

**Files:**
- Create: `ExamLab/src/types/ueben/pruefResultat.ts`
- Create: `ExamLab/src/services/uebenKorrekturApi.ts`

- [ ] **Step 1: Type-Def**

`src/types/ueben/pruefResultat.ts`:

```ts
export interface PruefResultat {
  success: boolean
  korrekt?: boolean
  selbstbewertung?: boolean
  musterlosung?: string
  bewertungsraster?: unknown
  error?: string
}
```

- [ ] **Step 2: Test (red)**

`src/tests/uebenKorrekturApi.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as client from '../services/uebenApiClient'
import { pruefeAntwortApi } from '../services/uebenKorrekturApi'

describe('uebenKorrekturApi.pruefeAntwortApi', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('ruft lernplattformPruefeAntwort mit korrektem Payload', async () => {
    const spy = vi.spyOn(client.uebenApiClient, 'post').mockResolvedValue({
      success: true, korrekt: true, musterlosung: 'Weil X.',
    } as any)
    const res = await pruefeAntwortApi({
      gruppeId: 'g1', frageId: 'f1',
      antwort: { typ: 'mc', gewaehlteOptionen: ['o1'] } as any,
      email: 'sus@x.ch', token: 'tok',
    })
    expect(spy).toHaveBeenCalledWith('lernplattformPruefeAntwort', expect.objectContaining({
      gruppeId: 'g1', frageId: 'f1', email: 'sus@x.ch'
    }), 'tok')
    expect(res.korrekt).toBe(true)
  })

  it('wirft bei success:false', async () => {
    vi.spyOn(client.uebenApiClient, 'post').mockResolvedValue({ success: false, error: 'Rate-Limit' } as any)
    await expect(pruefeAntwortApi({
      gruppeId:'g1', frageId:'f1', antwort:{} as any, email:'x@x.ch', token:'t'
    })).rejects.toThrow(/Rate-Limit/)
  })
})
```

Run: `npx vitest run src/tests/uebenKorrekturApi.test.ts` — erwarte FAIL.

- [ ] **Step 3: Service-Implementierung**

`src/services/uebenKorrekturApi.ts`:

```ts
import { uebenApiClient } from './uebenApiClient'
import type { Antwort } from '../types/antworten'
import type { PruefResultat } from '../types/ueben/pruefResultat'

export interface PruefenParams {
  gruppeId: string
  frageId: string
  antwort: Antwort
  email: string
  token: string
}

export async function pruefeAntwortApi(params: PruefenParams): Promise<PruefResultat> {
  const { gruppeId, frageId, antwort, email, token } = params
  const response = await uebenApiClient.post<PruefResultat>(
    'lernplattformPruefeAntwort',
    { gruppeId, frageId, antwort, email },
    token,
  )
  if (!response?.success) {
    throw new Error(response?.error || 'Prüfung fehlgeschlagen')
  }
  return response
}
```

Run: `npx vitest run src/tests/uebenKorrekturApi.test.ts` — erwarte PASS.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/types/ueben/pruefResultat.ts ExamLab/src/services/uebenKorrekturApi.ts ExamLab/src/tests/uebenKorrekturApi.test.ts
git commit -m "Phase2-F: uebenKorrekturApi Service + PruefResultat-Type"
```

### Task 13: Store-Refactor `uebungsStore.pruefeAntwortJetzt` async

**Files:**
- Modify: `ExamLab/src/store/ueben/uebungsStore.ts`
- Create: `ExamLab/src/tests/uebungsStorePruefen.test.ts`

- [ ] **Step 1: Test (red)**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUebenUebungsStore } from '../store/ueben/uebungsStore'
import * as api from '../services/uebenKorrekturApi'

describe('uebungsStore.pruefeAntwortJetzt (async)', () => {
  beforeEach(() => {
    useUebenUebungsStore.setState({
      session: { gruppeId: 'g1', email: 'sus@x.ch', token: 't' } as any,
      antworten: { 'f1': { typ: 'mc', gewaehlteOptionen: ['o1'] } as any },
      speichertPruefung: false,
      pruefFehler: null,
      letzteMusterloesung: null,
      feedbackSichtbar: false,
      letzteAntwortKorrekt: null,
    } as any)
  })

  it('setzt speichertPruefung während Request, übernimmt Resultat', async () => {
    vi.spyOn(api, 'pruefeAntwortApi').mockResolvedValue({ success: true, korrekt: true, musterlosung: 'Weil X.' })
    const p = useUebenUebungsStore.getState().pruefeAntwortJetzt('f1')
    expect(useUebenUebungsStore.getState().speichertPruefung).toBe(true)
    await p
    const s = useUebenUebungsStore.getState()
    expect(s.speichertPruefung).toBe(false)
    expect(s.letzteAntwortKorrekt).toBe(true)
    expect(s.letzteMusterloesung).toBe('Weil X.')
    expect(s.feedbackSichtbar).toBe(true)
    expect(s.pruefFehler).toBeNull()
  })

  it('setzt pruefFehler bei API-Error, kein Resultat', async () => {
    vi.spyOn(api, 'pruefeAntwortApi').mockRejectedValue(new Error('Timeout'))
    await useUebenUebungsStore.getState().pruefeAntwortJetzt('f1')
    const s = useUebenUebungsStore.getState()
    expect(s.speichertPruefung).toBe(false)
    expect(s.pruefFehler).toMatch(/Timeout/)
    expect(s.letzteAntwortKorrekt).toBeNull()
  })

  it('bei Selbstbewertung: setzt musterloesung, korrekt bleibt null', async () => {
    vi.spyOn(api, 'pruefeAntwortApi').mockResolvedValue({ success: true, selbstbewertung: true, musterlosung: 'Siehe Lösung' })
    await useUebenUebungsStore.getState().pruefeAntwortJetzt('f1')
    const s = useUebenUebungsStore.getState()
    expect(s.letzteMusterloesung).toBe('Siehe Lösung')
    expect(s.letzteAntwortKorrekt).toBeNull()
  })
})
```

Run: FAIL.

- [ ] **Step 2: Store-Änderung**

In `uebungsStore.ts`:

1. State-Interface erweitern: `speichertPruefung: boolean`, `pruefFehler: string | null`, `letzteMusterloesung: string | null`.
2. Initial-Defaults setzen.
3. `pruefeAntwortJetzt(frageId)` ist jetzt async:

```ts
pruefeAntwortJetzt: async (frageId) => {
  const state = get()
  const antwort = state.antworten[frageId]
  const session = state.session
  if (!antwort || !session) return
  set({ speichertPruefung: true, pruefFehler: null })
  try {
    const res = await pruefeAntwortApi({
      gruppeId: session.gruppeId,
      frageId,
      antwort,
      email: session.email,
      token: session.token,
    })
    set({
      speichertPruefung: false,
      letzteAntwortKorrekt: res.selbstbewertung ? null : (res.korrekt ?? null),
      letzteMusterloesung: res.musterlosung ?? null,
      feedbackSichtbar: true,
    })
  } catch (e: any) {
    set({ speichertPruefung: false, pruefFehler: e?.message || 'Prüfung fehlgeschlagen' })
  }
},
```

- [ ] **Step 3: Run tests**

```bash
cd ExamLab && npx vitest run src/tests/uebungsStorePruefen.test.ts
```

Expected: PASS (3/3).

- [ ] **Step 4: Full suite + tsc**

```bash
npx tsc -b && npx vitest run
```

Alle bisherigen Tests grün, keine Regression.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/store/ueben/uebungsStore.ts ExamLab/src/tests/uebungsStorePruefen.test.ts
git commit -m "Phase2-F: async pruefeAntwortJetzt + speichertPruefung/pruefFehler/letzteMusterloesung"
```

### Task 14: `useFrageAdapter` propagiert neue States

**Files:**
- Modify: `ExamLab/src/hooks/useFrageAdapter.ts`

- [ ] **Step 1: Interface-Erweiterung**

In `FrageAdapterResult` ergänzen:
```ts
speichertPruefung: boolean
pruefFehler: string | null
letzteMusterloesung: string | null
```

- [ ] **Step 2: Werte aus Store selektieren**

Im Body:
```ts
const uebenSpeichertPruefung = useUebenUebungsStore((s) => s.speichertPruefung)
const uebenPruefFehler = useUebenUebungsStore((s) => s.pruefFehler)
const uebenLetzteMusterloesung = useUebenUebungsStore((s) => s.letzteMusterloesung)
```

Im Return-Objekt ergänzen (nur für Übungs-Modus; Prüfungs-Modus: `false` / `null`).

- [ ] **Step 3: tsc-Check**

```bash
cd ExamLab && npx tsc -b
```

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/hooks/useFrageAdapter.ts
git commit -m "Phase2-F: useFrageAdapter propagiert speichertPruefung/pruefFehler/letzteMusterloesung"
```

### Task 15: UI — QuizNavigation Spinner + UebungsScreen Retry-Banner

**Files:**
- Modify: `ExamLab/src/components/ueben/QuizNavigation.tsx`
- Modify: `ExamLab/src/components/ueben/UebungsScreen.tsx`

- [ ] **Step 1: `QuizNavigation` — „Antwort prüfen"-Button erweitern**

Am Button-Element (aktuell: violetter „Antwort prüfen"):

```tsx
<button
  onClick={onPruefen}
  disabled={speichertPruefung}
  aria-busy={speichertPruefung}
  className="... bg-violet-600 hover:bg-violet-700 disabled:opacity-60"
>
  {speichertPruefung ? 'Prüfe…' : 'Antwort prüfen'}
</button>
```

Die `speichertPruefung`-Prop kommt von `useFrageAdapter` via `UebungsScreen`.

- [ ] **Step 2: `UebungsScreen` — `pruefFehler`-Banner**

Über der Frage-Karte:

```tsx
{pruefFehler && (
  <div role="alert" className="mb-3 p-3 rounded-lg bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 flex items-center justify-between">
    <span>Prüfung fehlgeschlagen: {pruefFehler}</span>
    <button onClick={() => onPruefen()} className="underline hover:no-underline">Erneut versuchen</button>
  </div>
)}
```

- [ ] **Step 3: Browser-Preview (Hinweis)**

Retry-Banner-Verifikation auf Staging (Task 19 Step 5), nicht `npm run dev` lokal — ohne deployed Backend gibt es keinen Prüf-Endpoint zum Testen. `npm run dev` zeigt die UI-Änderung (Spinner-State) als Vorschau, aber echter Error-Flow nur live.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/components/ueben/QuizNavigation.tsx ExamLab/src/components/ueben/UebungsScreen.tsx
git commit -m "Phase2-F: Spinner + aria-busy + Retry-Banner in Prüfen-Flow"
```

### Task 16: Security-Invariant Snapshot-Test

**Files:**
- Create: `ExamLab/src/tests/uebenSecurityInvariant.test.ts`

- [ ] **Step 1: Mock-Response-Test**

```ts
import { describe, it, expect } from 'vitest'

/**
 * Invariante: Eine SuS-Response von lernplattformLadeFragen darf KEINES der Lösungsfelder enthalten.
 * Dieser Test mockt eine Response-Payload wie sie vom Backend kommt und prüft, dass
 * kein Feld aus der Sperrliste erscheint.
 */
const SPERRLISTE = [
  'musterlosung', 'bewertungsraster',
  'korrekt', 'korrekteAntworten', 'toleranz',
  'erklaerung', 'sollKonto', 'habenKonto', 'korrektBuchung',
  'sollEintraege', 'habenEintraege',
]

function hatSperrfeld(obj: unknown, pfad: string[] = []): string | null {
  if (obj === null || typeof obj !== 'object') return null
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const hit = hatSperrfeld(obj[i], [...pfad, `[${i}]`])
      if (hit) return hit
    }
    return null
  }
  for (const key of Object.keys(obj)) {
    if (SPERRLISTE.includes(key)) return [...pfad, key].join('.')
    const hit = hatSperrfeld((obj as any)[key], [...pfad, key])
    if (hit) return hit
  }
  return null
}

describe('Security-Invariant: SuS-Response hat keine Lösungsfelder', () => {
  it('Mock-Response passt Invariante', () => {
    const saubereResponse = {
      success: true,
      data: [
        { id: 'f1', typ: 'mc', fragetext: '?', optionen: [{ id: 'o1', text: 'A' }, { id: 'o2', text: 'B' }] },
        { id: 'f2', typ: 'richtigfalsch', fragetext: '?', aussagen: [{ id: 'a1', text: 'X' }] },
        { id: 'f3', typ: 'sortierung', fragetext: '?', elemente: ['x','y','z'] },
        { id: 'f4', typ: 'zuordnung', fragetext: '?', linksItems: [], rechtsItems: [] },
        { id: 'f5', typ: 'lueckentext', fragetext: '?', textMitLuecken: '...', luecken: [{ id: 'l1' }] },
      ],
    }
    expect(hatSperrfeld(saubereResponse)).toBeNull()
  })

  it('erkennt Leak von korrekt', () => {
    const leak = { data: [{ optionen: [{ id: 'o1', korrekt: true }] }] }
    expect(hatSperrfeld(leak)).toBe('data.[0].optionen.[0].korrekt')
  })

  it('erkennt Leak von musterlosung', () => {
    const leak = { data: [{ musterlosung: 'X' }] }
    expect(hatSperrfeld(leak)).toBe('data.[0].musterlosung')
  })
})
```

- [ ] **Step 2: Run test**

```bash
cd ExamLab && npx vitest run src/tests/uebenSecurityInvariant.test.ts
```

Expected: PASS (3/3).

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/tests/uebenSecurityInvariant.test.ts
git commit -m "Phase2-F: Security-Invariant Test für SuS-Response"
```

### Task 17: Phase 2 — Lokale Vollständigkeits-Checks

- [ ] **Step 1: tsc + vitest + build**

```bash
cd ExamLab
npx tsc -b
npx vitest run
npm run build
```

Alle drei grün.

- [ ] **Step 2: HANDOFF-Update**

Neuer Eintrag `S122 — Phase 2 Backend-Security + Async-Prüfung` in `ExamLab/HANDOFF.md`.

```bash
git add ExamLab/HANDOFF.md
git commit -m "Phase2: HANDOFF S122-Eintrag"
```

### Task 18: Staging-Deploy + Apps-Script-Deployment

- [ ] **Step 1: Push zu preview**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git push -u origin feature/ueben-security-korrekturendpoint
git fetch origin

# S113-Lehre: Prüfe, ob preview Commits hat, die NICHT im Feature-Branch sind.
# Output muss LEER sein, sonst würden Commits überschrieben.
git log origin/preview ^feature/ueben-security-korrekturendpoint --oneline

git push origin feature/ueben-security-korrekturendpoint:preview --force-with-lease
```

- [ ] **Step 2: Warten auf GitHub-Actions-Deploy**

Ca. 2 Minuten. Monitor-Polling auf Chunk-Hash (siehe S120-Pattern).

- [ ] **Step 3: User deployed Apps-Script neue Bereitstellung**

User meldet „Apps-Script deployed".

### Task 19: Browser-E2E-Tests auf Staging

Mit Chrome-in-Chrome, echte Logins (LP wr.test@gymhofwil.ch + SuS wr.test@stud.gymhofwil.ch), Kontrollstufe Locker.

- [ ] **Step 1: `lernplattformLadeFragen` Network-Check**

SuS öffnet Thema → DevTools Network-Tab → Response von `lernplattformLadeFragen` als JSON prüfen:
- Kein Feld `korrekt`, `korrekteAntworten`, `musterlosung`, `bewertungsraster`, `erklaerung`
- `optionen[]`, `aussagen[]`, `elemente[]`, `labels[]`, `hotspots[]` wirken plausibel gemischt (Reload → andere Reihenfolge)

- [ ] **Step 2: Prüf-Flow (MC)**

SuS wählt MC-Option → „Antwort prüfen" → Spinner erscheint → nach ~1s Feedback (grün/rot) + Musterlösung. Network: neuer `lernplattformPruefeAntwort`-Call mit `{korrekt, musterlosung}`.

- [ ] **Step 3: Prüf-Flow (R/F, Lückentext [auch mit Dropdown-Optionen!], Zuordnung, Sortierung, Bildbeschriftung, Hotspot, DragDrop, Buchungssatz, T-Konto, Bilanzstruktur, Kontenbestimmung, Formel, Berechnung)**

Je eine Frage pro Typ testen. Korrekte Antwort → `korrekt: true`. Falsche → `korrekt: false`. **FiBu-Typen besonders sorgfältig**, weil Port-Risiko hoch (Regression würde BWL-Kernfach brechen).

Lückentext mit Dropdown: Falls die Frage `luecken[].optionen[]` hat, prüfen dass Dropdown-Optionen zwischen Reloads anders sortiert sind (Mischung-Invariante).

- [ ] **Step 4: Selbstbewertung (Freitext)**

SuS schreibt Freitext-Antwort → „Antwort prüfen" → SelbstbewertungsDialog öffnet mit Musterlösung + 3 Buttons (Richtig/Teilweise/Falsch).

- [ ] **Step 5: Offline-Simulation**

DevTools Network → „Offline" → „Antwort prüfen" → Retry-Banner erscheint. „Erneut versuchen" klicken → bei wiederhergestelltem Netzwerk funktioniert.

- [ ] **Step 6: Rate-Limit**

~40 mal hintereinander prüfen → Banner „Zu viele Anfragen — warte 1 Minute".

- [ ] **Step 7: LP-Pfad unberührt**

LP öffnet Fragensammlung → editiert eine MC-Frage → `korrekt`-Feld sichtbar → Speichern funktioniert.

### Task 20: LP-Freigabe + Merge zu main

- [ ] **Step 1: User-Report mit Screenshots / DOM-Check**

Claude meldet: „Phase 2 auf Staging verifiziert. Bereit für LP-Test."

- [ ] **Step 2: LP-Freigabe**

Warten auf explizite Freigabe.

- [ ] **Step 3: Merge**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main
git pull --ff-only
git merge --no-ff feature/ueben-security-korrekturendpoint -m "Phase 2: Backend-Security + Server-Korrektur-Endpoint für Üben"
git push origin main
```

- [ ] **Step 4: Branch-Cleanup**

```bash
git branch -D feature/ueben-security-korrekturendpoint
git push origin --delete feature/ueben-security-korrekturendpoint
```

- [ ] **Step 5: HANDOFF-Abschluss**

Eintrag S122 auf „abgeschlossen" setzen, Commit auf main.

### Task 21: Memory + Rules-Update

- [ ] **Step 1: Lehre in `rules/code-quality.md` ergänzen**

Pattern: „Backend liefert gefilterte Daten → Client braucht defensive Normalizer + Array.isArray-Guards, BEVOR das Filter aktiv wird (Deploy-Race)".

- [ ] **Step 2: Memory-Eintrag**

`MEMORY.md`-Verweis auf neue Security-Patterns (Server-Side-Korrektur für Übungs-Modus, shuffle_ für Pool-Schutz).

- [ ] **Step 3: Commit**

```bash
git add "10 Github/GYM-WR-DUY/.claude/rules/code-quality.md" \
        "/Users/durandbourjate/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/"
git commit -m "Lehre: Phase1-Defensive vor Phase2-Backend-Filter + Shuffle-Pattern"
git push origin main
```

---

## Abhängigkeiten / Reihenfolge

```
Phase 1 (rückwärtskompatibel, eigener Merge zu main):
  Task 1 → 2 → 3 → 4 → 5

Phase 2 (nach Phase 1 gemergt, gekoppelt Frontend + Backend):
  Backend: Task 6 → 7 → 8 → 9 → 10 → 11 (User-Deploy)
  Frontend: Task 12 → 13 → 14 → 15 → 16
    (12-16 können parallel zu Backend, aber E2E braucht deployed Backend)
  Integration: Task 17 → 18 → 19 → 20
  Cleanup: Task 21
```

## Definition of Done

- [ ] Phase 1 auf `main` (Task 5 Schritt 5)
- [ ] Phase 2 Backend in apps-script-code.js + Apps-Script deployed (Task 11)
- [ ] Phase 2 Frontend auf `main` (Task 20 Schritt 3)
- [ ] 6 Browser-E2E-Tests durch (Task 19)
- [ ] LP hat explizit freigegeben
- [ ] Security-Invariant Test grün (Task 16)
- [ ] tsc + vitest + build grün
- [ ] HANDOFF.md aktualisiert
- [ ] Feature-Branch gelöscht
- [ ] Lehre in rules/ + Memory dokumentiert
