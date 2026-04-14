# Bundle 3 — Übungs-Themen UX

> Design-Spec für 4 UX-Verbesserungen im Übungsbereich.
> Session 100, 13.04.2026.

---

## Kontext

Aus dem User-Test vom 13.04.2026 ergaben sich 21 UX-Verbesserungen, gruppiert in 7 Bundles. Bundle 1 (Quick Wins) und Bundle 2 (Favoriten-Redesign) sind abgeschlossen. Bundle 3 betrifft die Themensteuerung im Übungsbereich — sowohl LP- als auch SuS-Sicht.

### Betroffene Dateien (Ist-Zustand)

| Datei | Zeilen | Rolle |
|-------|--------|-------|
| `src/types/ueben/themenSichtbarkeit.ts` | 36 | ThemenStatus-Typen, `MAX_AKTIVE_THEMEN = 3` |
| `src/store/ueben/themenSichtbarkeitStore.ts` | 134 | Status-Management, FIFO-Logik |
| `src/store/ueben/settingsStore.ts` | 28 | GruppenEinstellungen (Farben, Fächer, Mastery) |
| `src/types/ueben/settings.ts` | — | `GruppenEinstellungen` Interface, `DEFAULT_GYM`/`DEFAULT_FAMILIE` |
| `src/store/lpUIStore.ts` | — | `EinstellungenTab` Union-Type |
| `src/components/ueben/admin/AdminThemensteuerung.tsx` | 371 | LP: Themen aktivieren/deaktivieren |
| `src/components/ueben/admin/AdminDashboard.tsx` | 92 | LP: Üben-Admin-Navigation (4 Tabs) |
| `src/components/ueben/admin/AdminSettings.tsx` | 35 | LP: Üben-Einstellungen (4 Sub-Tabs) |
| `src/components/ueben/Dashboard.tsx` | 748 | SuS: Themen-Übersicht |
| `src/components/ueben/ThemaKarte.tsx` | 150 | SuS: Einzelne Thema-Karte |
| `src/components/settings/EinstellungenPanel.tsx` | 541 | Globales LP-Einstellungen-Panel |

---

## N9 — Konfigurierbares Limit aktuelle Themen

### Anforderung
- Maximal konfigurierbare Anzahl Themen gleichzeitig als "aktuell" (Default: 5, bisher hardcodiert 3)
- Bei Überschreitung: ältestes aktives Thema automatisch zu "freigegeben" (FIFO, bestehende Logik)
- LP kann den Wert in den Übungs-Einstellungen anpassen

### Änderungen

**`src/types/ueben/themenSichtbarkeit.ts`**
- Konstante `MAX_AKTIVE_THEMEN` entfernen

**`src/types/ueben/settings.ts`**
- Neues Feld `maxAktiveThemen: number` im Interface `GruppenEinstellungen`
- Default-Wert 5 in `DEFAULT_GYM` und `DEFAULT_FAMILIE` setzen

**`src/store/ueben/settingsStore.ts`**
- `defaultEinstellungen()` erbt den neuen Default automatisch aus den Konstanten

**`src/store/ueben/themenSichtbarkeitStore.ts`**
- `setzeStatus()`: Limit aus `useUebenSettingsStore.getState().einstellungen.maxAktiveThemen` lesen statt aus Konstante
- FIFO-Logik bleibt identisch

### Edge Case: Limit wird unter aktuelle Anzahl gesenkt
Wenn die LP `maxAktiveThemen` von z.B. 5 auf 2 senkt, während 5 Themen aktiv sind: **Die bestehenden Themen bleiben aktiv.** Das Limit greift erst bei der nächsten Aktivierung (dann wird per FIFO abgebaut bis das Limit eingehalten wird). Die Anzeige zeigt `5/2` mit Amber-Warnung. Die LP kann den Wert jederzeit speichern — kein Blocker.

**`src/components/ueben/admin/AdminThemensteuerung.tsx`**
- Anzeige `{n}/{max}` liest max aus settingsStore
- Amber-Warnung wenn Limit erreicht

**Neues UI (im Sub-Tab "Allgemein" der Übungs-Einstellungen):**
- Number-Input oder Stepper für "Max. aktuelle Themen" (Min: 1, Max: 20)
- Speichert in settingsStore → Backend-Sync

---

## N11 — SuS-Sortierung mit Sektionen

### Anforderung
- Aktuelle Themen in eigener Sektion zuoberst (fachübergreifend)
- Darunter: freigegebene Themen nach Fach gruppiert
- Sortier-Toggle: alphabetisch (Default) oder zuletzt geübt
- Sortier-Präferenz in localStorage

### Änderungen

**`src/components/ueben/Dashboard.tsx`**
- `sichtbareThemenListe` aufteilen in:
  1. `aktuelleThemen` — alle mit Status `aktiv`, fachübergreifend
  2. `freigegebeneThemenNachFach` — `abgeschlossen`, gruppiert nach Fach
- Neue Sektion "Aktuelle Themen" mit Überschrift rendern, danach Fach-Sektionen
- Nicht freigeschaltete Themen: weiterhin nur bei "Alle Themen anzeigen" sichtbar

**Sortier-Toggle:**
- State: `sortierung: 'alphabetisch' | 'zuletztGeuebt'`
- Persist: `localStorage.setItem('examlab-ueben-sortierung', sortierung)`
- Position: kleiner Button/Dropdown oben rechts über der Themen-Liste
- Gilt für alle Sektionen gleichzeitig

**"Zuletzt geübt"-Sortierung — Datenquelle:**
- Pro Thema: `max(letzterVersuch)` über alle `FragenFortschritt`-Einträge der Fragen dieses Themas
- `FragenFortschritt.letzterVersuch` ist ein ISO-Timestamp (bereits vorhanden in `fortschrittStore`)
- Berechnung: `useMemo` im Dashboard, gruppiert die Fortschrittsdaten nach Thema und bestimmt den neuesten Timestamp
- Themen ohne Fortschrittsdaten (nie geübt) werden am Ende sortiert

**Rendering-Reihenfolge:**
```
┌─────────────────────────────┐
│ Sortierung: [Alphabetisch ▾]│
├─────────────────────────────┤
│ ★ Aktuelle Themen           │
│   [ThemaKarte] [ThemaKarte] │
│   [ThemaKarte]              │
├─────────────────────────────┤
│ 🟠 VWL                      │
│   [ThemaKarte] [ThemaKarte] │
├─────────────────────────────┤
│ 🔵 BWL                      │
│   [ThemaKarte] [ThemaKarte] │
└─────────────────────────────┘
```

---

## N12 — LP-Status-Differenzierung

### Anforderung
- Nicht freigeschaltete Themen visuell erkennbar als "inaktiv", aber gut lesbar (LP muss sie auswählen können)

### Änderungen

**`src/components/ueben/admin/AdminThemensteuerung.tsx`**
- Themen mit Status `nicht_freigeschaltet`:
  - `opacity: 0.7` auf die gesamte Thema-Zeile
  - 🔒-Icon vor dem Themennamen
  - Kein Status-Badge
- Themen mit Status `aktiv`: wie bisher (grünes "Aktuell"-Badge)
- Themen mit Status `abgeschlossen`: wie bisher (neutrales "Freigegeben"-Badge)

---

## N14 — Übungs-Einstellungen ins globale EinstellungenPanel

### Anforderung
- Alle Übungs-Einstellungen aus dem AdminDashboard ins globale Einstellungen-Panel verschieben
- AdminDashboard verliert den Tab "Einstellungen"

### Änderungen

**`src/store/lpUIStore.ts`**
- `EinstellungenTab` erweitern: `'profil' | 'lernziele' | 'favoriten' | 'uebungen' | 'admin'`

**`src/components/settings/EinstellungenPanel.tsx`**
- Neuer Tab **"Übungen"** (key: `'uebungen'`, an Index 3 im tabs-Array — nach "Favoriten", vor "Admin")
- Rendert `AdminSettings`-Komponente (wiederverwendet, nicht dupliziert)
- Sichtbarkeit: `useUebenGruppenStore().aktiveGruppe !== null` (LP ist in mindestens einer Übungs-Gruppe)

**`src/components/ueben/admin/AdminDashboard.tsx`**
- Tab "Einstellungen" entfernen
- `AdminAnsicht`-Typ: `'einstellungen'` entfernen
- Verbleibende Tabs: Übersicht, Aufträge, Themen (3 statt 4)

**`src/components/ueben/admin/AdminSettings.tsx`**
- Bleibt als eigenständige Komponente bestehen
- Wird jetzt vom EinstellungenPanel importiert statt vom AdminDashboard
- Sub-Tabs bleiben: Allgemein (+ neues Max-Themen-Setting aus N9), Fächer, Farben, Mitglieder

---

## Abhängigkeiten zwischen den Tasks

```
N14 (Einstellungen verschieben) ← N9 (Max-Themen-Setting braucht UI-Ort)
N11 (SuS-Sortierung) — unabhängig
N12 (LP-Status) — unabhängig
```

Empfohlene Reihenfolge:
1. N14 — Einstellungen verschieben (schafft UI-Ort für N9)
2. N9 — Konfigurierbares Limit (braucht N14 für Settings-UI)
3. N12 — LP-Status-Differenzierung (klein, isoliert)
4. N11 — SuS-Sortierung (grösste Änderung, am Schluss)

---

## Nicht im Scope

- Design-Schliff / Farbkonzept (Bundle 7)
- Resizable Sidebar (Bundle 7)
- Layout-Umbau Durchführen (Bundle 4)
- Backend-Änderungen (maxAktiveThemen wird über bestehenden Settings-Sync persistiert)
