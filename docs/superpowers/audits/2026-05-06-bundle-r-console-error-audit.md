# Bundle R — `console.error` Silent-Fail-Audit

**Datum:** 2026-05-06
**Branch:** feature/bundle-r-error-handling-vereinheitlichung
**Scope:** `ExamLab/src/components/` rekursiv, ohne Tests (`*.test.*`, `__tests__/**`)
**rg-Befehl:** `rg -n "console\.error" ExamLab/src/components --type-add 'tsx:*.tsx' --type ts --type tsx -g '!*.test.*' -g '!__tests__/**'`

## Methodik

3-Bucket-Klassifikation:
- **(a)** Hat eigene Error-UI (setError/setLadeStatus/ErrorBoundary/bestehender Toast/alert) → BEHALTEN
- **(b)** Silent-Fail (kein User-Surface) → in Phase 3 Toast ergänzen
- **(c)** Service/Util ohne UI-Bezug → BEHALTEN

Für jeden Treffer wurde der umgebende `catch`-Block (~10 Zeilen oben + 5 unten) gelesen. Ein Treffer fällt in Bucket (a), wenn im selben Block oder im unmittelbar folgenden Statement ein User-sichtbarer State-Setter / Toast / `alert()` steht. Wenn das `console.error` als einziges User-Feedback dasteht (eventuell mit `setLoading(false)` oder `setLoginBridged(true)` als Continuation-Flag), ist es Bucket (b).

## Zusammenfassung

| Bucket | Anzahl | Aktion |
|---|---:|---|
| (a) Has Error-UI | 9 | BEHALTEN |
| (b) Silent-Fail | 8 | TOAST ERGÄNZEN |
| (c) Service/Util | 0 | BEHALTEN |
| **Total** | **17** | |

## Bucket (a) — Has Error-UI (BEHALTEN)

| Datei : Zeile | Code-Snippet | Begleitende Surface |
|---|---|---|
| ExamLab/src/components/ErrorBoundary.tsx:30 | `console.error('[ErrorBoundary] Rendering-Fehler:', error)` | ErrorBoundary-Fallback-UI (Z. 64-122) — vollständiger Recovery-Screen |
| ExamLab/src/components/ErrorBoundary.tsx:31 | `console.error('[ErrorBoundary] Component Stack:', errorInfo.componentStack)` | ErrorBoundary-Fallback-UI (Z. 64-122) — vollständiger Recovery-Screen |
| ExamLab/src/components/lp/UebungsToolView.tsx:81 | `console.error('[UebungsToolView] LP-Login fehlgeschlagen — keine gültige Antwort:', response)` | `setLoginStatus('fehler')` Z. 82 |
| ExamLab/src/components/lp/UebungsToolView.tsx:110 | `console.error('[UebungsToolView] LP-Login Fehler:', error)` | `setLoginStatus('fehler')` Z. 112 |
| ExamLab/src/components/fragetypen/PDFFrage.tsx:150 | `console.error('[PDFFrage] Alle PDF-Quellen fehlgeschlagen:', err)` | `setLadeFehler('Alle PDF-Quellen fehlgeschlagen…')` Z. 156 (selber Pfad, fällt durch) |
| ExamLab/src/components/fragetypen/PDFFrage.tsx:155 | `console.error('[PDFFrage] Kein PDF geladen — keine Quelle verfügbar')` | `setLadeFehler('Alle PDF-Quellen fehlgeschlagen…')` Z. 156 |
| ExamLab/src/components/lp/korrektur/useKorrekturDaten.ts:123 | `console.error('Korrektur-Daten laden fehlgeschlagen:', err)` | `setLadeStatus('fehler')` Z. 124 |
| ExamLab/src/components/lp/durchfuehrung/BeendetPhase.tsx:88 | `console.error('[Export] Fehlgeschlagen:', e)` | `alert('Export fehlgeschlagen. Bitte erneut versuchen.')` Z. 89 |
| ExamLab/src/components/Layout.tsx:215 | `console.error('[Layout] Recovery fehlgeschlagen:', err)` | `setRecoveryStatus('failed')` Z. 216 + Recovery-Failed-UI Z. 236-254 |

## Bucket (b) — Silent-Fail (TOAST ERGÄNZEN)

| # | Datei : Zeile | Code-Snippet | Geplante Toast-Message | Variant |
|---|---|---|---|---|
| 1 | ExamLab/src/components/sus/SuSStartseite.tsx:55 | `console.error('[SuSStartseite] Login-Bridge fehlgeschlagen — keine gültige Antwort:', response)` | "Anmeldung am Üben-Bereich fehlgeschlagen. Bitte erneut anmelden." | error |
| 2 | ExamLab/src/components/sus/SuSStartseite.tsx:79 | `console.error('[SuSStartseite] Login-Bridge Fehler:', error)` | "Anmeldung am Üben-Bereich fehlgeschlagen. Bitte erneut anmelden." | error |
| 3 | ExamLab/src/components/lp/korrektur/useKorrekturActions.ts:139 | `console.error('[Backup] Export fehlgeschlagen:', e)` | "Backup-Export fehlgeschlagen. Bitte erneut versuchen." | error |
| 4 | ExamLab/src/components/lp/korrektur/PDFKorrektur.tsx:84 | `.catch(err => console.error('[PDFKorrektur] PDF per URL laden fehlgeschlagen:', err))` | "PDF-Annotation konnte nicht geladen werden." | error |
| 5 | ExamLab/src/components/lp/korrektur/KorrekturFrageZeile.tsx:115 | `console.error('[KI-Vorschlag] Fehler:', err)` | "KI-Vorschlag fehlgeschlagen. Bitte erneut versuchen." | error |
| 6 | ExamLab/src/components/ueben/LoginScreen.tsx:17 | `(error) => console.error('Auth-Fehler:', error)` | "Anmeldung fehlgeschlagen: {error}" (dynamisch — error-String stammt vom GIS-Init und ist user-readable) | error |
| 7 | ExamLab/src/components/lp/LPStartseite.tsx:278 | `console.error('[LP] Einrichtungsprüfung sync fehlgeschlagen:', error)` | "Einrichtungsprüfung konnte nicht synchronisiert werden. Bitte Seite neu laden." | error |
| 8 | ExamLab/src/components/lp/LPStartseite.tsx:299 | `console.error('[LP] Einführungsübung sync fehlgeschlagen:', error)` | "Einführungsübung konnte nicht synchronisiert werden. Bitte Seite neu laden." | error |

## Bucket (c) — Service/Util ohne UI-Bezug (BEHALTEN)

| Datei : Zeile | Code-Snippet | Notiz |
|---|---|---|
| _(keine)_ | | Alle 17 Treffer stehen in React-Komponenten / Komponenten-internen Hooks mit klarem User-Pfad. Generische Service-/Util-Funktionen mit `console.error` liegen ausserhalb von `ExamLab/src/components/` (z.B. unter `ExamLab/src/services/`, `ExamLab/src/utils/`) und sind out-of-scope dieses Audits. |

## Edge-Case-Notizen

- **PDFFrage.tsx:150 + 155:** Beide Treffer liegen in derselben `ladePDFAsync`-Funktion. Z. 150 ist im inneren `try/catch` des Pool/App/Extern-Pfads; Z. 155 ist im Final-No-Source-Branch. Die Surface (`setLadeFehler` Z. 156) wird nur erreicht, wenn `!abgebrochen` — bei aktivem Abbruch fällt das `console.error` Z. 150 leise durch. Pragmatisch ist das ok, weil Abbruch = Component-Unmount oder Frage-Wechsel (User sieht ohnehin neuen Inhalt). → Bucket (a).
- **LPStartseite.tsx:278 + 299:** Diese Sync-Pfade sind background-Operations beim LP-Login. Der User kann den Fehler nicht sofort handeln (kein interaktiver Trigger). Trotzdem ist ein Toast wertvoll, weil sonst die Einrichtungsprüfung/-übung in der LP-Liste fehlt und der User ratlos bleibt. → Bucket (b).
- **LoginScreen.tsx:17:** Der `fehler`-State im `useUebenAuthStore` wird in `anmeldenMitGoogle` gesetzt (NICHT im `onError`-Callback dieser Stelle). Der `onError`-Callback feuert für GIS-Init-Probleme (`VITE_GOOGLE_CLIENT_ID nicht konfiguriert`, `Google Identity Services nicht geladen`, `Kein Credential erhalten`, `JWT konnte nicht dekodiert werden`). Diese Pfade sind silent für den User. → Bucket (b).
- **ErrorBoundary.tsx:30 + 31:** Das `console.error` ist Debug-Logging *parallel* zur Fallback-UI; nicht im Error-Pfad als alleiniges Feedback. Ein zusätzlicher Toast wäre redundant — der ganze Bildschirm ist die Error-Surface. → Bucket (a).

## Eskalations-Schwellen-Check

Bundle R Plan definiert:
- **>30 Bucket-(b)-Stellen:** Stop-the-line, mit User klären (Scope-Cut oder eigenes Bundle).
- **<5 Bucket-(b)-Stellen:** Methodik-Check (Klassifikation zu konservativ?).

**Aktuelle Anzahl Bucket (b):** 8
**Status:** ✓ im Korridor 5-30 — Phase 3 kann mit 8 Subtasks geplant werden.

## Hinweise für Phase 3

- Toast-Variant ist durchgehend `error`. Falls `useToast()` ein `info`/`warning`-Variant hat, ggf. für die LPStartseite-Sync-Pfade (Z. 278/299) auf `warning` runterstufen — das ist Background-Sync, kein direkter User-Trigger.
- Für SuSStartseite.tsx:55 + 79 ist die Toast-Message identisch (gleiche Login-Bridge-Logik, ein Branch ist „leerer Response", anderer ist „thrown error") — beide können denselben Toast-Aufruf bekommen, ggf. via Helper-Function.
- LoginScreen.tsx:17 erhält den `error`-String direkt vom Auth-Service (`'VITE_GOOGLE_CLIENT_ID nicht konfiguriert'` etc.). Ein dynamischer Toast `Anmeldung fehlgeschlagen: ${error}` ist hier nutzerfreundlicher als ein generischer Hinweis — der String ist deutsch und user-readable.
- KorrekturFrageZeile.tsx:115 (KI-Vorschlag) — User-Trigger ist ein Klick auf „KI-Vorschlag holen". Ein `error`-Toast ist hier wertvoll, weil sonst der `setKiLaedt(false)` den Spinner abschaltet aber UI keine Spur des Fehlschlags zeigt.
