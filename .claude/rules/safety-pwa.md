# Safety — PWA & Client-Side Apps

## localStorage (24 Stellen im Unterrichtsplaner)

- Jeder `JSON.parse(localStorage.getItem(...))` MUSS in try/catch stehen
- Fallback-Wert definieren wenn Parse fehlschlägt (korrupte Daten, Quote-Limit)
- Vor dem Schreiben: Grösse prüfen wenn Daten >500KB sein könnten (5MB Browser-Limit)
- Nie sensible Daten in localStorage (OAuth-Tokens ausgenommen, diese laufen ab)

## Datenverlust verhindern

- Destruktive Aktionen (Planer löschen, Sequenz löschen, Bulk-Delete) brauchen Bestätigungsdialog
- Undo-Stack für reversible Aktionen beibehalten
- Export-Funktion muss immer funktionieren (auch bei korruptem State → graceful degradation)
- Beim Laden von JSON-Importen: Schema validieren bevor State überschrieben wird

## IndexedDB vor Hard-Navigation (S149, ExamLab)

**Problem:** `window.location.href = '...'` triggert Page-Unload. Der Browser bricht in-flight IndexedDB-Schreib-Transaktionen ab, sobald die Page entladen wird. Wenn vor der Hard-Nav ein IDB-Clear oder -Write fire-and-forget gefeuert wurde, kann die Transaktion nicht committed werden — die Daten bleiben hängen.

**Konkret aufgetreten (S149, Bundle G.c):** `clearFragenbankCache()` startete `tx.objectStore.clear()` für 3 Stores, returnte sofort (ohne `tx.oncomplete`-await). `authStore.abmelden()` rief `reset()` als fire-and-forget, dann `window.location.href = '/login'`. Browser-E2E auf staging zeigte: alle 2411 Summary-Einträge blieben im IDB. Privacy-Lücke (LP-Lösungen für nächsten User auf geteilten Schul-Geräten lesbar) nachweisbar bestätigt.

**Theorie greift NICHT:** "IndexedDB serialisiert Transaktionen pro Store" stimmt — aber die Page-Lifetime-Garantie geht ihr vor. Sobald die Page entladen ist, gibt es keinen Listener mehr für `tx.oncomplete`, und der Browser kann die Transaktion abbrechen. Auch ohne Hard-Nav: ein User der den Tab schliesst direkt nach Logout-Klick hat dasselbe Problem.

**Regel:** Wenn vor einer Hard-Navigation (`window.location.href`, `location.replace`, full-page-reload) IDB-Schreib-Operationen laufen müssen:
1. Die Schreib-Funktion MUSS `tx.oncomplete` awaiten:
```ts
await new Promise<void>((resolve, reject) => {
  tx.oncomplete = () => resolve()
  tx.onerror = () => reject(tx.error)
  tx.onabort = () => reject(tx.error ?? new Error('IDB transaction aborted'))
})
```
2. Die gesamte Aufruf-Kette bis zur Hard-Nav MUSS awaiten — Promise nicht discarden mit `void` oder fire-and-forget. Inklusive umgebende Store-Actions (Zustand `reset()` etc.) — diese MÜSSEN async werden falls sie IDB-Side-Effects haben.
3. Hard-Nav läuft erst NACH Promise-Resolution.

**Existing-Bugs derselben Klasse (S149 entdeckt, NICHT in G.c gefixt):**
- `src/services/autoSave.ts::clearIndexedDB` (Z. 71-80): `store.delete(pruefungId)` ohne `tx.oncomplete`-await
- `src/store/authStore.ts::resetPruefungState` (Z. 95): ruft `clearIndexedDB(...).catch(()=>{})` als fire-and-forget vor potenzieller Hard-Nav
- Wirkung: Bei beendeter Prüfung können SuS-Antworten nach Logout im IDB hängen
- Tracking: separate Aufgabe (siehe spawn_task aus S149)

**Erkennung:** vitest+jsdom detektiert das NICHT — jsdom triggert keinen echten Page-Unload, fake-indexeddb serialisiert synchron in Memory. Einziger reliable Detektor ist Browser-E2E mit echten Logins UND IDB-Inspection vor/nach Logout (DevTools → Application → IndexedDB).

**Verwandte Pattern:** Dieselbe Lifecycle-Logik gilt für Service-Worker `postMessage` während Unload, und für `beforeunload`-Handler die async-Code starten — dort ebenfalls keine Garantie, dass die Operation durchläuft. Für unverzichtbare Persistenz vor Unload: synchrones `localStorage.setItem` (begrenzt auf <500 KB) statt IDB.

## XSS-Prävention

- Unterrichtsplaner (React): Kein `dangerouslySetInnerHTML` (aktuell: 0 Stellen — so lassen)
- pool.html (Übungspools): `innerHTML` wird verwendet (15 Stellen) — bei neuen Stellen: Inhalte escapen, keine User-Eingaben direkt in innerHTML
- Kein `eval()` (aktuell: 0 — so lassen)

## postMessage (Übungspools → LearningView)

- Origin-Check bei eingehenden Messages (`event.origin` prüfen)
- Nur erwartete Message-Formate akzeptieren, alles andere ignorieren

## Service Worker (PWA)

- Nach Deploy: Wenn Nutzer alte Version sehen, liegt es am SW-Cache
- Lösung: SW-Version in sw.js hochzählen oder `skipWaiting()` verwenden
- Bei grundlegenden Änderungen an der App-Shell: Cache-Busting sicherstellen

## Externe Abhängigkeiten

- OAuth-Tokens (Google Calendar): Nur im Memory halten oder mit Ablaufdatum in localStorage
- Keine API-Keys im Client-Code committen (aktuell keine — so lassen)
- CDN-Abhängigkeiten (pool.html): Subresource Integrity (SRI) bei neuen Einbindungen prüfen
