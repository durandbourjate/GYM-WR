---
title: Cluster A — Bug-Fixes Fragensammlung & Problemmeldungen
date: 2026-05-11
status: Spec-Review ausstehend
verwandt: Cluster E (Typografie-Tokens für Header), Cluster G (Icon-System für Buttons + Brand-Farben), Cluster F (Backend-Settings-Sync)
---

# Cluster A — Bug-Fixes Fragensammlung & Problemmeldungen

## 1. Zweck

Sechs konkrete Bugs aus dem Test-Sweep vom 11.05.2026 beheben. Alle wurden im Audit auf Source-Ebene lokalisiert. Cluster A bündelt sie, weil sie thematisch verwandt sind (Fragensammlung-Interaktion + Einstellungen-Konsistenz) und gemeinsam getestet werden können.

## 2. Begriffe

- **Optimistic Delete with Error-Recovery:** UI entfernt sofort, Backend-Call läuft parallel; bei Fehler wird der Eintrag wieder eingeblendet + Banner.
- **Sticky Header:** CSS-Position `sticky` mit `top: 0` für Scrolling-stabile Header.
- **DeepLink:** Hook der per URL/Route + Parametern eine bestimmte App-Lokation öffnet (z.B. Fragensammlung → spezifische Frage).

## 3. Architektur-Entscheidungen

| # | Entscheidung | Begründung |
|---|---|---|
| 1 | **Optimistic Delete mit Error-Recovery** (Pattern c). Bei Backend-Fehler: Eintrag wieder einfügen + Toast/Banner mit Retry. | Beste UX, sichtbare Fehler statt silent failure. |
| 2 | **Entwürfe-Header übernimmt Themen-Header-Style** (sticky, bg-slate-100, border-bottom). | User-Feedback, visuelle Konsistenz. |
| 3 | **Entwürfe-Section bekommt eigenen Scroll-Container** (`max-height: 40vh`, `overflow-y: auto`). | Scrolling der Hauptliste unblock, deutliche Sektion-Grenze. |
| 4 | **`ladeGruppen()` zieht in `EinstellungenPanel`-Mount.** | Eine Mount-Quelle, alle Tabs profitieren, kein Race. |
| 5 | **Lückentext-Buttons + Selects** bekommen Brand-Styling (Violet-Tokens aus Cluster G). | Eliminiert Blau (default browser) aus Brand-fremder Stelle. |
| 6a | Problemmeldung-Bug Text-Anzeige: Datenmodell-Audit Backend + Frontend prüft Persistenz von `comment`-Feld, Fix entsprechend. | Konkreter Render-Bug, Fix sobald Audit klärt. |
| 6b | `useDeepLink` wird so erweitert dass Navigation tatsächlich erfolgt (Route + Params). | Funktionalität liefert was Button verspricht. |
| 6c | Problemmeldungen können gelöscht werden (UI + Backend-Endpoint). Confirm-Modal. | User-Anforderung, schließt CRUD-Lücke. |

## 4. Bugs im Detail

### Bug 1: Gelöschte Entwürfe kommen nach Hard-Reload zurück

**Symptom:** User löscht Entwurf in Fragensammlung → verschwindet aus UI. Nach Hard-Reload (Cmd+Shift+R) ist er wieder da.

**Root-Cause:** `useFragenAktionen.bestaetigenLoeschen()` triggert Backend-Call, schluckt aber Fehler. UI-State wird sofort aktualisiert (optimistic), Backend-Persistenz kann fehlschlagen — Reload lädt Entwurf neu.

**Fix:**
- `useFragenAktionen.ts`: Backend-Call mit explicit `.then`/`.catch`.
- Bei Erfolg: Toast „Entwurf gelöscht" (informativ, default).
- Bei Fehler: Entwurf wird zurück in den Store eingefügt + Toast (`type: 'error'`) „Konnte nicht gelöscht werden — bitte erneut versuchen" mit Retry-Button.
- Cache-Invalidierung: nicht nötig, Backend-Endpoint ist die source of truth.

**Betroffene Dateien:** `src/hooks/useFragenAktionen.ts`, `src/store/fragensammlungStore.ts`.

### Bug 2: Entwürfe-Header-Style ≠ Themen-Style

**Symptom:** Entwürfe-Header in Fragensammlung sieht anders aus als BWL/VWL/Recht-Header.

**Root-Cause:** `DraftsSection.tsx` nutzt flach `text-sm font-semibold text-slate-700`, ohne Sticky-Positioning oder Background. `VirtualisierteFragenListe.tsx` nutzt `sticky bg-slate-100 dark:bg-slate-800 border-b`.

**Fix:**
- `DraftsSection.tsx`-Header übernimmt: `sticky top-0 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700` + Typografie-Token `TYPO.h2` (aus Cluster E).
- Toggle-Chevron-Icon: `ChevronDown`/`ChevronRight` (Lucide aus Cluster G) statt heute-vorhandenem Symbol.

**Betroffene Dateien:** `src/components/lp/fragensammlung/DraftsSection.tsx`.

### Bug 3: Entwürfe ausgeklappt blockiert Scroll

**Symptom:** Wenn Entwürfe-Sektion ausgeklappt ist, kann User nicht durch die Fragen-Liste scrollen. Bei Themen-Sektionen (BWL/VWL/Recht) funktioniert Scroll.

**Root-Cause:** `DraftsSection` ist kein Scroll-Container. Bei vielen Drafts expandiert es und drückt die VirtualisierteFragenListe nach unten — Scroll-Container darüber ist blockiert.

**Fix:**
- `DraftsSection.tsx` bekommt im ausgeklappten Zustand: `max-h-[40vh] overflow-y-auto` (Tailwind-Klassen). Sektion-Inhalt scrollt unabhängig.
- Alternative wenn Liste nicht zu lang: `max-h-[60vh]` oder `max-h-screen/2`. Plan-Phase entscheidet.
- Parent-Container (`FragenBrowserBody`) bleibt scroll-fähig — die Hauptliste scrollt weiter.

**Betroffene Dateien:** `src/components/lp/fragensammlung/DraftsSection.tsx`, ggf. `src/components/lp/fragensammlung/fragenbrowser/FragenBrowserBody.tsx`.

### Bug 4: Einstellungen → Übungen leer (Lazy-Load-Bug)

**Symptom:** User öffnet Einstellungen → Übungen → Dropdown der Gruppen ist leer. Erst nach Klick auf den App-Tab „Übungen" außerhalb der Einstellungen werden Gruppen geladen.

**Root-Cause:** `ladeGruppen()` läuft im `useEffect` von `AdminSettings.tsx` (nur bei dem Mount). Andere Komponenten brauchen Gruppen aber laden sie nicht.

**Fix:**
- `ladeGruppen()`-Effekt in `EinstellungenPanel`-Mount verlegen (oder höher in App-Root falls allgemein verwendet).
- AdminSettings-eigener `useEffect` bleibt als Backup für Direct-Navigation, aber prüft `gruppen.length === 0` und macht no-op wenn bereits geladen.
- Vermeidet Race wenn beide gleichzeitig laden würden.

**Betroffene Dateien:** `src/components/settings/EinstellungenPanel.tsx`, `src/components/ueben/admin/AdminSettings.tsx`, `src/store/ueben/gruppenStore.ts`.

### Bug 5: Lückentext-Buttons / Selects sind blau

**Symptom:** In Lückentextfragen sind Freitext-/Dropdown-Buttons + Browser-Default-Select blau (Standard-Browser-Focus). Passt nicht ins Brand-Design (Violet-500).

**Root-Cause:** `<select>`-Elemente in `LueckentextFrage.tsx` haben kein `focus:ring`/`focus:outline`-Styling — Browser-Defaults rendern blau. Auch die Toggle-Buttons zwischen Freitext und Dropdown nutzen heute keinen Brand-Style.

**Fix:**
- Custom-Select-Wrapper (oder existierender `Select`-UI-Komponente prüfen) mit Brand-Styling: `focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none`.
- Toggle-Buttons: Lucide-Icons (`IconAbc` für Freitext, `IconAB` für Lückentext aus Cluster G Custom-Icons) + Brand-Aktiv-Style (`bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300`).
- Inaktiver Zustand: `text-slate-500 hover:text-violet-600`.

**Betroffene Dateien:** `src/components/fragetypen/LueckentextFrage.tsx`, ggf. neue `src/components/ui/Select.tsx` falls noch nicht existent.

### Bug 6: Problemmeldungen — drei Sub-Bugs

#### 6a) Text-Anzeige leer

**Symptom:** User sendet Problemmeldung mit Text „test", wird ohne Text angezeigt.

**Root-Cause-Hypothese (Plan-Phase verifiziert):** Datenmodell-Mismatch zwischen Send-Path und Load-Path. Send schreibt vermutlich Feld `text` ins Backend, Load liest `comment` oder umgekehrt.

**Fix:**
- Plan-Phase: Backend-Schema lesen (Apps-Script-Code für Problemmeldungen).
- Frontend-Type für Problemmeldung mit Backend-Schema abgleichen.
- Field-Name harmonisieren (vermutlich `text`), Migration falls heute Mix.

**Betroffene Dateien:** `src/components/settings/problemmeldungen/ProblemmeldungZeile.tsx`, `src/services/problemmeldungenApi.ts`, Apps-Script-Endpoint.

#### 6b) „Öffnen"-Button tut nichts

**Symptom:** User klickt „Öffnen"-Button bei einer Problemmeldung → nichts passiert.

**Root-Cause:** `useDeepLink`-Hook ist unvollständig — entweder kein Navigation-Trigger oder silent error.

**Fix:**
- `useDeepLink` implementiert Navigation via React-Router (oder Zustand-basiertem Routing falls in Verwendung).
- Problemmeldung hat `ziel`-Feld mit Format `{ screen, params }` — Hook navigiert dahin.
- Falls Ziel nicht mehr existiert (Frage gelöscht, etc.) → Toast „Verknüpfter Inhalt nicht mehr verfügbar".

**Betroffene Dateien:** `src/hooks/useDeepLink.ts` (oder Pfad finden), `src/components/settings/problemmeldungen/ProblemmeldungZeile.tsx`.

#### 6c) Löschen-Funktion fehlt

**Symptom:** Keine Möglichkeit Problemmeldungen zu löschen.

**Root-Cause:** UI-Lücke. Backend-Endpoint kann fehlen oder existieren.

**Fix:**
- Plan-Phase: prüfen ob Apps-Script-Endpoint `apiAdminLoescheProblemmeldung` o.ä. existiert. Wenn nicht, anlegen.
- Frontend: Trash-Icon (Lucide-`Trash2` aus Cluster G) pro Problemmeldung-Zeile, Confirm-Modal vor Delete, Optimistic Delete mit Error-Recovery (Pattern aus Bug 1).
- Permission: Wer darf löschen — nur Admin oder jeder LP der die Meldung erstellt hat? Plan-Phase klärt.

**Betroffene Dateien:** `src/components/settings/problemmeldungen/ProblemmeldungZeile.tsx`, `src/services/problemmeldungenApi.ts`, Apps-Script-Endpoint.

## 5. Komponenten / Code-Anpassungen

### 5.1 Generischer Optimistic-Delete-Helper (`src/utils/optimisticDelete.ts` — neu)

```ts
export async function optimisticDelete<T>({
  optimisticRemove,
  backendCall,
  rollback,
  onSuccess,
  onError,
}: {
  optimisticRemove: () => void;
  backendCall: () => Promise<void>;
  rollback: () => void;
  onSuccess: (toast: ToastApi) => void;
  onError: (toast: ToastApi, err: Error) => void;
}) {
  optimisticRemove();
  try {
    await backendCall();
    onSuccess(toast);
  } catch (err) {
    rollback();
    onError(toast, err as Error);
  }
}
```

Wird von Bug 1 (Entwurf-Löschen) und Bug 6c (Problemmeldung-Löschen) genutzt. Pattern: einmal definieren, mehrmals verwenden.

### 5.2 Touched-Files-Übersicht

| Datei | Bugs | Änderung |
|---|---|---|
| `src/hooks/useFragenAktionen.ts` | 1 | Optimistic-Delete-Pattern mit Rollback |
| `src/store/fragensammlungStore.ts` | 1 | Hook für Re-Insert nach Backend-Fehler |
| `src/components/lp/fragensammlung/DraftsSection.tsx` | 2, 3 | Header-Style + Scroll-Container |
| `src/components/lp/fragensammlung/fragenbrowser/FragenBrowserBody.tsx` | 3 | Möglicherweise Layout-Anpassung |
| `src/components/settings/EinstellungenPanel.tsx` | 4 | `ladeGruppen()`-Mount |
| `src/components/ueben/admin/AdminSettings.tsx` | 4 | useEffect als Backup, no-op wenn geladen |
| `src/store/ueben/gruppenStore.ts` | 4 | Idempotenz von `ladeGruppen` |
| `src/components/fragetypen/LueckentextFrage.tsx` | 5 | Brand-Styling für Toggle + Select |
| `src/components/ui/Select.tsx` (neu) | 5 | Brand-konformer Select-Wrapper |
| `src/services/problemmeldungenApi.ts` | 6a, 6c | Schema-Audit + Delete-Endpoint |
| `src/components/settings/problemmeldungen/ProblemmeldungZeile.tsx` | 6a, 6b, 6c | Render-Fix + DeepLink + Trash-Button |
| `src/hooks/useDeepLink.ts` (Pfad-prüfen) | 6b | Navigation-Implementierung |
| `src/utils/optimisticDelete.ts` (neu) | 1, 6c | Wiederverwendbarer Helper |
| Apps-Script (`apps-script-code.js`) | 6a, 6c | Schema-Klarstellung + Delete-Endpoint falls fehlend |

## 6. Edge-Cases & Fehlerfälle

- **Bug 1 Race:** User löscht Entwurf, dann sofort wieder hinzufügen (mit gleicher Frage-ID) während Backend-Delete noch läuft. Plan-Phase muss klären ob die Frage-ID nach Re-Add wieder existiert (Backend-Delete arbeitet auf alter ID → kein Konflikt) oder ob neue ID generiert wird (sauberer).
- **Bug 3 Sehr lange Drafts-Liste:** Wenn 100+ Drafts: 40vh-Container scrollt intern. Acceptable.
- **Bug 4 Mehrfach-Mount:** Wenn EinstellungenPanel ge-/unmountet wird (z.B. Tab-Wechsel), `ladeGruppen()` läuft erneut. Idempotent: prüfen `gruppen.length === 0` vor Reload.
- **Bug 5 Wide-Browser-Compat:** `focus:ring` ist nicht in allen Browsern gleich — Safari hat eigene Focus-Style. Plan-Phase prüft visuell.
- **Bug 6a Backend-Cleanup:** Wenn alte Problemmeldungen ohne `comment`-Feld in DB sind: Display zeigt „(Kein Text)" statt Crash.
- **Bug 6c Permission:** Wenn ein LP eine fremde Problemmeldung löscht (z.B. weil Admin): Audit-Log? Plan-Phase entscheidet ob nötig oder ob nur Admin löschen darf.

## 7. Out-of-Scope

- **Soft-Delete für Entwürfe (Papierkorb-Workflow):** heute hard delete. Soft-Delete mit Retention wäre separate Feature-Erweiterung.
- **Bulk-Lösch-Funktion für Problemmeldungen:** einzeln löschen reicht initial. Batch wäre Cluster D-Pattern (Multi-Select).
- **Problemmeldung-Status-Workflow** („gelesen", „in Bearbeitung", „erledigt"): heute kein Status. Eigene Feature.

## 8. Abhängigkeiten zu anderen Clustern

- **Cluster E (Konsistenz):** Bug 2 nutzt `TYPO.h2` Typografie-Token. Bug 4 Fix profitiert von Cluster E's Tab-Registry insofern als Tab-Mount-Logik konsolidiert wird.
- **Cluster G (Icon-System):** Bugs 2, 5, 6c brauchen Lucide-Icons (`ChevronDown`/`ChevronRight`, `IconAbc`/`IconAB`, `Trash2`) und Brand-Farb-Tokens (`violet-500`, `violet-100`). Cluster G Phase 1 muss vor Cluster A umgesetzt werden.
- **Cluster F (Testdaten):** Wenn Test-Daten aktiv sind, sollten Test-Problemmeldungen unter dem Toggle filterbar sein. Filter-Logik aus Cluster F greift automatisch.
- **Cluster D (Batch-Edit):** Out-of-Scope-Punkt zu Batch-Lösch-Problemmeldungen kann später als Erweiterung von Cluster D's Pattern kommen.

## 9. Test-Strategie

### 9.1 Unit-Tests (Vitest)

- `optimisticDelete()` Helper: success-Pfad, error-Pfad mit Rollback.
- `useFragenAktionen.bestaetigenLoeschen` mit Mock-Backend (success/error).
- DeepLink-Hook: navigiert mit korrekten Params, behandelt fehlende Ziele.

### 9.2 Browser-E2E (Live-Backend, echte Logins)

1. **Bug 1:** Entwurf erstellen → löschen → Hard-Reload → Entwurf bleibt weg. Toast-Erfolg sichtbar.
2. **Bug 1 Error-Pfad:** Network während Delete killen → UI zeigt Entwurf wieder + Toast-Fehler + Retry.
3. **Bug 2:** Fragensammlung öffnen → Entwürfe-Header hat selben Style wie BWL/VWL/Recht-Header (visueller Vergleich).
4. **Bug 3:** Entwürfe aufklappen → durch Hauptliste scrollen funktioniert. Entwürfe-Liste scrollt intern.
5. **Bug 4:** Frischer Login → direkt zu Einstellungen → Übungen → Gruppen-Dropdown ist sofort gefüllt.
6. **Bug 5:** Lückentextfrage öffnen → Freitext/Dropdown-Buttons in Violet, kein blau. Focus-Ring violet.
7. **Bug 6a:** Problemmeldung mit Text „test" einreichen → Text wird in Einstellungen → Problemmeldungen angezeigt.
8. **Bug 6b:** Klick auf „Öffnen" einer Problemmeldung mit Frage-Referenz → Navigation zur Frage funktioniert.
9. **Bug 6c:** Trash-Icon klicken → Confirm-Modal → Löschen → Problemmeldung verschwindet, Reload zeigt sie nicht mehr.

### 9.3 Visuelle Verifikation

- Vor/Nach-Screenshots: Fragensammlung Entwürfe-Header, Lückentextfrage-Editor, Problemmeldungen-Tab.

## 10. Offene Punkte (vor Implementation klären)

- **Bug 1 Race-ID-Strategie:** Behält Re-Add nach Delete die alte ID oder vergibt neue? Plan-Phase greppt im Source und entscheidet.
- **Bug 6a Backend-Schema:** Plan-Phase muss Apps-Script-Code für Problemmeldung-CRUD lesen, Field-Names verifizieren.
- **Bug 6c Permission-Modell:** Plan-Phase klärt ob nur Admin oder auch Ersteller löschen darf. Heute hat User-Memory keine Vorgabe — vermutlich Admin-only ist sicherer.
- **Bug 3 max-height-Wert:** 40vh vs 60vh — Plan-Phase visueller Vergleich.
- **Custom-Select-Komponente:** Existiert sie schon irgendwo (`src/components/ui/Select.tsx`)? Plan-Phase prüft und entscheidet ob neu oder erweitern.
