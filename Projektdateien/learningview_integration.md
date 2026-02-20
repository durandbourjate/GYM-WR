# LearningView-Integration: postMessage Score-Übermittlung

## Übersicht

Drei chirurgische Änderungen an `pool.html`, damit der Übungspool den Fortschritt automatisch an LearningView meldet, wenn er als Iframe eingebettet ist (Aufgabentyp «Interaktiv (extern)»).

**Protokoll:** xAPI-Score-Objekt via `window.parent.postMessage()`
**Format:** `{ result: { score: { scaled: 0–1, max: N, raw: N } } }`

---

## Änderung 1: Neue Funktion `sendScoreToLV()`

**Einfügen nach:** `let pickedSortItem=null;` (Ende des STATE-Blocks)

```javascript
// ══════════════════════════════════════════
// LEARNINGVIEW INTEGRATION
// Sends xAPI score via postMessage when embedded as iframe.
// Protocol: xAPI result.score object.
// LearningView uses result.score.scaled (0–1) as primary value.
// Sends progressively after each answer AND on quiz end.
// ══════════════════════════════════════════
function sendScoreToLV(){
  if(window.parent===window)return;          // Not in iframe → skip
  if(state.maxScore===0)return;              // No answers yet → skip
  var scaled=state.score/state.maxScore;     // 0.0 to 1.0
  var xAPIscore={
    result:{
      score:{
        scaled: Math.round(scaled*1000)/1000,  // Round to 3 decimals
        max:    state.maxScore,
        raw:    state.score
      }
    }
  };
  try{ window.parent.postMessage(xAPIscore,'*'); }catch(e){}
}
```

---

## Änderung 2: Progressiver Score nach jeder Antwort

**In Funktion `finishAnswer()`**, nach dem Block:
```javascript
state.answered.push({id:q.id,correct});
```

**Einfügen:**
```javascript
sendScoreToLV();
```

---

## Änderung 3: Finaler Score bei Quiz-Ende

**In Funktion `endQuiz()`**, nach der Zeile:
```javascript
const pct=state.maxScore?Math.round(state.score/state.maxScore*100):0;
```

**Einfügen:**
```javascript
sendScoreToLV();
```

---

## Verhalten

| Situation | Verhalten |
|---|---|
| Pool als Standalone (normaler Browseraufruf) | `window.parent===window` → kein postMessage, keine Auswirkung |
| Pool im Iframe (LearningView «Interaktiv extern») | Score wird nach jeder Antwort und beim Quiz-Ende gesendet |
| Nutzer bricht Quiz vorzeitig ab | Letzter Stand wird beim Klick auf «Übung beenden» gesendet |
| Nur offene Fragen beantwortet | Score basiert auf Selbsteinschätzung (✅ Gewusst / ❌ Nicht gewusst) |

## Kein Risiko für Standalone-Nutzung

Die Prüfung `window.parent===window` ist der Standard-Check für Iframe-Kontext. Wenn der Pool direkt im Browser geöffnet wird, ist `window.parent` identisch mit `window`, und die Funktion kehrt sofort zurück. Es gibt keinerlei Seiteneffekte.
