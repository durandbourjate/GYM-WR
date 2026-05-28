# Security Guidance — GYM-WR-DUY

Threat-Model für ExamLab (Prüfungs- + Übungsplattform) und Unterrichtsplaner. Wird vom `security-guidance`-Plugin bei jedem End-of-Turn-Diff- und Commit-Review zusätzlich zur Built-in-Checkliste geladen.

## Kontext

- **Nutzer:** Lehrpersonen (LP) + Schüler:innen (SuS) am Gymnasium Hofwil
- **Datenklassifizierung (Kanton Bern ISDS):**
  - Bis Q3 2026: **INTERN** (Übungsmodus + Unterrichtsplaner)
  - Ab Q4 2026: **VERTRAULICH** (Prüfungsmodus mit Notenwirkung, ISDS-Konzept-pflichtig)
- **Backend:** Apps-Script + Sheets (Legacy, bis Q3 2026), dann Supabase mit RLS (CH/AT, managed by peaknetworks)
- **Frontend:** React + Vite, PWA, GitHub Pages

## Identitäts- und Rollen-Invarianten

- **Rolle aus E-Mail-Domain ableiten:** `*@gymhofwil.ch` = LP, `*@stud.gymhofwil.ch` = SuS. `restoreSession()` muss die Rolle bei jedem Re-Mount validieren — niemals aus Client-State vertrauen.
- **Session-Token bei ALLEN API-Calls** (GET + POST), nicht nur bei mutierenden. Token muss zur angefragten E-Mail passen (IDOR-Schutz).
- **LP ≠ SuS:** kein UI-Pfad darf SuS-Tokens für LP-Endpoints akzeptieren oder umgekehrt.

## Daten-Leak-Prävention (Prüfungsintegrität)

- **SuS-Response darf NIEMALS enthalten:** `korrekt`, `musterlosung` / `musterloesung*`, `bewertungsraster`, `korrekteAntworten`, `toleranz`, `loesung*`, `erwartet*`, oder andere Lösungs-Felder. Bei jeder neuen API-Response prüfen, ob `bereinigeFrageFuerSuSUeben_`/analog läuft.
- **LP-Response muss vollständig sein** — Lösungsfelder werden NUR bei SuS-Pfaden entfernt.
- **`speichereAntworten` muss bei `status === 'beendet'` blockieren** (kein Nach-Korrektur-Schummeln).
- **Heartbeat-Endpoints:** keine Lösungsdaten im Response.
- Bei neuen Schreib-/Lese-Pfaden mit SuS-Beteiligung: explizit benennen, welche Felder rein-/rausgehen.

## IDOR / Authorization

- **Fire-and-forget-Helper im Apps-Script-Dispatcher:** der Dispatcher-Case MUSS prüfen, dass die manipulierte ID (`feedbackId`, `pruefungId`, `kommentarId`, etc.) wirklich dem anfragenden LP/SuS gehört. `istZugelasseneLP(body.email)` allein reicht nicht.
- **Drive-File-Zugriff:** nur aus den explizit erlaubten Ordnern (Whitelist in Backend-Code).
- **Supabase RLS (ab Q3 2026):** jede neue Tabelle braucht RLS-Policies. Bei Code-Reviews für Supabase-Code: prüfen, ob Schreib- UND Lese-Path RLS-geschützt sind. Service-Role-Key NIEMALS im Client.

## XSS / Code-Injection

- **`dangerouslySetInnerHTML`:** bekannte legitime Stellen sind MathJax/LaTeX-Rendering, Markdown-Renderer und Backend-HTML-Strings für Aufgabentexte. Bei JEDER neuen Stelle: woher kommt der HTML-String, ist er pre-sanitisiert? Niemals SuS-Eingaben direkt in `__html`.
- **`new Function()` / `eval()`:** genau eine bewusste Stelle existiert (`src/services/poolSync.ts` für Pool-Config-Loader, eslint-disabled, eigene `.js`-Files). KEINE NEUEN.
- **pool.html `innerHTML`:** bei neuen Stellen Inhalte escapen, keine User-Eingaben direkt.

## Backend / Apps-Script

- **`postJson`-Helper verwenden** (kein direktes `fetch` für Apps-Script-URLs). Der zentrale Helper nutzt `text/plain` um CORS-Preflight zu vermeiden, hat Retry-Logik und Error-Handling.
- **Apps-Script-Code-Schreibungen:** sicherheits-sensitive Dispatcher-Cases brauchen `istZugelasseneLP`/`istZugelasseneSuS` + IDOR-Owner-Check.
- **Sheet-Lese-Pfade:** Timestamps via `toIsoStr_`-Normalizer (sonst Date-Auto-Parsing → Filter-Vergleiche brechen).

## Client-Side-Storage / PWA

- **localStorage:** keine sensitiven Daten unverschlüsselt. Jeder `JSON.parse(localStorage.getItem(...))` MUSS in `try/catch`. OAuth-Tokens nur memory oder mit Ablaufdatum.
- **IndexedDB vor Hard-Navigation:** `tx.oncomplete` awaiten, sonst werden bei `window.location.href = ...` Schreib-Transaktionen abgebrochen (S149). Bei LP-Lösungen die nach Logout im IDB hängen können: Privacy-Lücke auf geteilten Schul-Geräten.
- **Service Worker:** Cache-Busting bei App-Shell-Änderungen sicherstellen.

## Media / iframes / CSP

- **`<iframe>` ohne `sandbox`:** für Drive-PDFs nötig (Chrome-PDF-Plugin braucht Plugin-Zugriff, `sandbox` blockiert). Andere iframes (Material-Panels, MediaAnhänge) sollten `sandbox` haben. Bei neuen iframes: Begründung notieren, wenn `sandbox` weggelassen wird.
- **`<iframe sandbox="allow-scripts allow-same-origin">` ist effektiv KEIN Sandbox** — die Kombination erlaubt dem iframe sich selbst zu entsandboxen. Vermeiden, oder beide flags weglassen.
- **CSP bei neuen Medienquellen:** `frame-src`, `img-src`, `connect-src` alle prüfen wenn Drive/externe Services eingebunden werden.
- **postMessage (Übungspools → LearningView):** Origin-Check bei eingehenden Messages, nur erwartete Message-Formate akzeptieren.
- **Upload-MIME-Whitelist:** bei neuen Upload-Pfaden Datei-Typ prüfen.

## PII / Logging

- **Keine SuS-IDs, Namen, E-Mails oder Antworten in Logs auf `INFO`+** Level. `console.error` darf Stack-Traces zeigen, aber keine SuS-PII.
- **Apps-Script Stackdriver-Logging** (in den Backend-Sheets): keine personenbezogenen Daten persistieren ausserhalb der Domain-Tabellen.

## Externe Abhängigkeiten

- **Keine API-Keys/Secrets im Client-Code** (Stand: 0 — so lassen). Apps-Script-`SCRIPT_PROPERTIES` darf nicht via Endpoint exfiltriert werden.
- **CDN-Abhängigkeiten in pool.html:** Subresource Integrity (SRI) bei neuen Einbindungen prüfen.
- **OAuth-Tokens (Google Calendar):** nur memory oder mit Ablaufdatum in localStorage. Kein Refresh-Token client-side.

## Verifikations-Reminder

- TypeScript-Strenge: `as any` ist verboten (CI-Gate `lint:as-any`). Defensive-Pattern ist `as unknown as <Type> /* Defensive: <Grund> */`.
- Tests mocken niemals den Security-Pfad weg — wenn ein Test Token-Validierung umgeht, ist das ein Risiko-Indikator.
- Bei Backend-Änderungen: Frontend + Backend gemeinsam reviewen (Vertrag, nicht eine Seite isoliert).
