# Fortschritt pro Mitglied + Lernziele — Design Spec

**Datum:** 2026-04-05
**Projekt:** Lernplattform (Übungstool)
**Status:** Finale (Spec-Review bestanden, 3 kritische Issues behoben)

---

## Ziel

Individualisierte Förderung ermöglichen: Das System versteht pro SuS pro Frage (und somit pro Lernziel), was beherrscht wird und was nicht. LP/Eltern können den Fortschritt analysieren, SuS sehen motivierende Fortschrittsanzeigen.

## Kontext

- Fortschritt wird aktuell nur client-seitig gespeichert (localStorage + IndexedDB)
- Backend-Endpoint `lernplattformSpeichereFortschritt` speichert bereits in den Gruppen-Sheet (Tab "Fortschritt")
- Backend-Endpoint `lernplattformLadeFortschritt` lädt nur den eigenen Fortschritt (via `gruppe.fragebankSheetId`)
- LP-Ansicht (`AdminKindDetail.tsx`) ist gebaut aber zeigt leere Daten
- Lernziele existieren nur als IDs in Fragen (`lernzielIds`), keine separate Tabelle
- Es existiert bereits ein shared `Lernziel`-Interface in `packages/shared/src/types/fragen.ts` mit Feldern: `id, fach, poolId, thema, text, bloom, aktiv`
- Der bestehende Endpoint `lernplattformLadeLernziele` extrahiert Lernziel-IDs aus den Fragen-Tabs — das ist eine andere Logik als die hier geplante

## Skalierung

- 8 Klassen à 25 SuS geplant → 200 SuS
- Pro Gruppe eigenes Sheet → kein Lock-Konflikt zwischen Klassen
- Pro Kurs: 25 SuS × einige Hundert bis Tausend Fragen = 10'000–50'000 Fortschritt-Zeilen
- Sheets-Limit: 10 Mio Zellen — technisch kein Problem, aber Ladezeiten steigen (3-5s bei 25'000+ Zeilen)
- LP-Endpoint (`ladeGruppenFortschritt`): Seltener Zugriff, 3-5s akzeptabel
- SuS-Endpoint (`ladeFortschritt`): Häufiger, aber filtert auf eine E-Mail → schnell
- Gleichzeitiges Üben: Schreibzugriffe verteilt auf verschiedene Sheets
- **Mittelfristig:** Supabase-Migration geplant — diese Architektur ist kompatibel (Frontend-Aggregation bleibt, Backend wird ausgetauscht)

---

## 1. Backend: Neuer Endpoint `lernplattformLadeGruppenFortschritt`

### Signatur

```
Action: 'lernplattformLadeGruppenFortschritt'
Input:  { gruppeId: string, sessionToken: string }
Output: { success: true, data: { fortschritte: FragenFortschritt[], sessions: SessionEintrag[] } }
```

### Verhalten

1. Token validieren
2. Gruppe aus Registry laden → `fragebankSheetId` bestimmen
3. Prüfen ob Anfragender Admin der Gruppe ist (Mitglieder-Tab, Rolle = 'admin')
4. Mitglieder-Emails aus Mitglieder-Tab laden (für Filterung)
5. Fortschritt-Tab des Gruppen-Sheets lesen, filtern auf Mitglieder-Emails
6. Sessions-Tab des Gruppen-Sheets lesen, filtern auf Mitglieder-Emails
7. Komma-separierte Felder (`sessionIds`) in Arrays splitten
8. Zurückgeben als JSON

**Hinweis:** Bei Gym-Gruppen kann `fragebankSheetId` auf das geteilte Fragenbank-Sheet zeigen. In dem Fall enthält der Fortschritt-Tab Daten aller Gym-Gruppen — Schritt 5 filtert deshalb nach den Mitgliedern der angefragten Gruppe.

### Fehlerbehandlung

- Gruppe nicht gefunden → `{ success: false, error: 'Gruppe nicht gefunden' }`
- Nicht Admin → `{ success: false, error: 'Keine Berechtigung' }`
- Sheet/Tab fehlt → `{ success: false, error: 'Fortschritt-Daten nicht verfügbar' }`

### Datenstruktur FragenFortschritt (aus Sheet)

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| email | string | SuS-E-Mail |
| fragenId | string | Fragen-ID |
| versuche | number | Gesamtversuche |
| richtig | number | Richtige Antworten |
| richtigInFolge | number | Konsekutiv richtig (Reset bei Fehler) |
| mastery | string | neu/ueben/gefestigt/gemeistert |
| letzterVersuch | string | ISO-Timestamp |
| sessionIds | string | Komma-separierte Session-IDs |

### Datenstruktur SessionEintrag (aus Sheet)

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| sessionId | string | Eindeutige Session-ID |
| email | string | SuS-E-Mail |
| fach | string | Fachbereich |
| thema | string | Thema |
| datum | string | ISO-Timestamp |
| anzahlFragen | number | Anzahl Fragen in Session |
| richtig | number | Richtige Antworten |

### Sicherheit

- Nur Admins der Gruppe dürfen den Endpoint aufrufen
- Token-Validierung wie bei allen anderen Endpoints
- Keine Lösung-Daten in der Response (nur Fortschritt-Metriken)

---

## 2. Backend: Lernziele-Sheet + Endpoints

### Sheet-Struktur

Neuer Tab "Lernziele" in:
- **Gym-Gruppen:** Geteilte Fragenbank (`FRAGENBANK_ID`) — ein zentrales Set
- **Familie-Gruppen:** Im eigenen Gruppen-Sheet — separate Lernziele

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | string | z.B. `LZ-BWL-001` |
| text | string | Lernziel-Beschreibung (LP17-orientiert) |
| fach | string | BWL, VWL, Recht, Informatik |
| thema | string | Zugehöriges Thema |
| bloom | string | K1–K6 (Bloom-Taxonomie) |
| fragenIds | string | Komma-separierte IDs zugeordneter Fragen |

### Endpoint: `lernplattformLadeLernzieleV2` (neu, ersetzt bestehenden)

Der bestehende `lernplattformLadeLernziele` extrahiert IDs aus Fragen und nimmt `fachbereich` als Input. Die neue Version liest aus dem dedizierten Lernziele-Tab und nimmt `gruppeId`. **Breaking Change:** Der alte Endpoint wird umbenannt zu `lernplattformLadeLernzieleAlt` (Fallback) und der neue übernimmt den primären Namen.

```
Action: 'lernplattformLadeLernzieleV2'
Input:  { gruppeId: string, sessionToken: string }
Output: { success: true, data: Lernziel[] }
```

Verhalten:
1. Token validieren
2. Gruppe aus Registry laden → Typ bestimmen (gym/familie)
3. Gym: Lernziele-Tab aus `FRAGENBANK_ID` lesen
4. Familie: Lernziele-Tab aus Gruppen-Sheet lesen
5. Komma-separierte `fragenIds` in Arrays splitten
6. Array von Lernziel-Objekten zurückgeben
7. Fallback: Wenn Lernziele-Tab nicht existiert → leeres Array (kein Fehler)

### Endpoint: `lernplattformSpeichereLernziel` (neu)

```
Action: 'lernplattformSpeichereLernziel'
Input:  { gruppeId: string, lernziel: Lernziel, sessionToken: string }
Output: { success: true, data: { id: string } }
```

Verhalten:
- Nur Admins
- Upsert (neue ID → append, bestehende ID → Update)
- Gym: Schreibt in `FRAGENBANK_ID` Tab "Lernziele"
- Familie: Schreibt in Gruppen-Sheet Tab "Lernziele"

---

## 3. Frontend: Adapter + Store

### Neuer FortschrittService (Interface)

```typescript
interface FortschrittService {
  ladeGruppenFortschritt(gruppeId: string): Promise<{
    fortschritte: FragenFortschritt[]
    sessions: SessionEintrag[]
  }>
  ladeLernziele(gruppeId: string): Promise<Lernziel[]>
  speichereLernziel(gruppeId: string, lernziel: Lernziel): Promise<{ id: string }>
}
```

### Adapter-Erweiterung

`appsScriptAdapter.ts` erhält eine neue Klasse `AppsScriptFortschrittAdapter` die `FortschrittService` implementiert. Drei API-Calls zu den drei Endpoints.

### Store-Erweiterung: `fortschrittStore.ts`

Neue Felder:

```typescript
// Admin-Daten (Gruppen-Fortschritt aller SuS)
gruppenFortschritt: Record<string, FragenFortschritt[]>  // key = gruppeId
gruppenSessions: Record<string, SessionEintrag[]>        // key = gruppeId
lernziele: Lernziel[]

// Neue Actions
ladeGruppenFortschritt: (gruppeId: string) => Promise<void>
ladeLernziele: (gruppeId: string) => Promise<void>
speichereLernziel: (gruppeId: string, lernziel: Lernziel) => Promise<void>

// Neue Selektoren
getFortschrittFuerSuS: (gruppeId: string, email: string) => FragenFortschritt[]
getSessionsFuerSuS: (gruppeId: string, email: string) => SessionEintrag[]
// SuS-Kontext: eigener Fortschritt (flat Record, key = fragenId)
getLernzielFortschrittSuS: (lernziel: Lernziel) => LernzielStatus
// LP-Kontext: Fortschritt eines bestimmten SuS (aus gruppenFortschritt gefiltert)
getLernzielFortschrittLP: (lernziel: Lernziel, susFortschritte: FragenFortschritt[]) => LernzielStatus
```

Gruppen-Daten werden einmal geladen und im Store gecacht (nicht in localStorage — nur transiente Admin-Ansicht).

---

## 4. Frontend: LP-Ansicht (AdminKindDetail)

### Datenquelle

`AdminKindDetail` erhält `gruppeId` als neue Prop (zusätzlich zu `email, name, onThemaKlick`). Die Parent-Komponente (`AdminDashboard`) muss `gruppeId` aus dem `gruppenStore` durchreichen. Beim Mount:
1. `ladeGruppenFortschritt(gruppeId)` aufrufen (falls nicht gecacht)
2. Aus Store filtern: `getFortschrittFuerSuS(gruppeId, email)`

### Ansichten (bestehende UI befüllen)

**a) Letzte 7 Tage** (Session-Karten)
- Sessions des SuS filtern nach Datum
- Anzahl Sessions, Gesamtfragen, Gesamtquote

**b) Dauerbaustellen**
- `istDauerbaustelle()` (existiert in `mastery.ts`) auf alle Fortschritte anwenden
- Fragen-ID auflösen zu Thema/Fach (aus Fragen-Cache)

**c) Mastery pro Fach → Thema** (Fortschrittsbalken)
- Fortschritte nach Fach/Thema gruppieren
- Mastery-Verteilung berechnen (neu/üben/gefestigt/gemeistert)
- Klickbar → AdminThemaDetail

**d) Session-Historie**
- Chronologisch, letzte 20 Sessions
- Fach, Thema, Datum, Ergebnis (richtig/gesamt)

---

## 5. Frontend: SuS-Ansicht (Lernziel-Checkliste)

### Ort

Bestehendes Lernziele-Panel (🏁-Button im AppShell-Header). Aktuell statischer Erklärungstext → wird durch dynamische Checkliste ersetzt.

### Datenquelle

- Lernziele: `ladeLernziele(gruppeId)` beim App-Start
- Fortschritt: Aus bestehendem `fortschrittStore` (eigene Daten, localStorage)

### Darstellung

Pro Lernziel:
- **Status-Icon** basierend auf Mastery der zugeordneten Fragen:
  - Alle `fragenIds` gemeistert → ✅ Gemeistert (grün)
  - ≥50% gefestigt/gemeistert → 🔵 Gefestigt (blau)
  - ≥1 geübt → 🟡 In Arbeit (gelb)
  - Alle neu → ⬜ Offen (grau)
- **Lernziel-Text**
- **Fortschrittsbalken** (mini, wie bei Themen)
- **Bloom-Badge** (K1–K6)

Gruppiert nach Fach, offene Lernziele zuerst.

### Fallback

Wenn keine Lernziele im Backend vorhanden: Bestehender statischer Erklärungstext bleibt stehen + Hinweis "Lernziele werden von der Lehrperson definiert."

---

## 6. Neue Typen

**Typ-Namenskollision:** Es existiert bereits ein `Lernziel`-Interface in `packages/shared/src/types/fragen.ts`. Wir erweitern dieses bestehende Interface um `fragenIds` (optional, da nicht alle Kontexte es brauchen). Kein neues `types/lernziel.ts` — alles bleibt im shared Package.

```typescript
// packages/shared/src/types/fragen.ts — bestehend, erweitern:
export interface Lernziel {
  id: string
  fach: string
  poolId?: string       // bestehend (Pool-Kontext)
  thema: string
  text: string
  bloom: string
  aktiv?: boolean       // bestehend (optional machen)
  fragenIds?: string[]  // NEU — zugeordnete Fragen-IDs
}

// Neuer Export im selben File oder in types/fortschritt.ts:
export type LernzielStatus = 'offen' | 'inArbeit' | 'gefestigt' | 'gemeistert'

// types/fortschritt.ts (erweitern)
export interface SessionEintrag {
  sessionId: string
  email: string
  fach: string
  thema: string
  datum: string
  anzahlFragen: number
  richtig: number
}
```

**Sheet ↔ TypeScript Konvertierung:** Alle komma-separierten Sheet-Spalten (`sessionIds`, `fragenIds`) werden im Backend in Arrays gesplittet bevor sie als JSON zurückgegeben werden. Leere Strings → leere Arrays.

---

## 7. Nicht im Scope

- LP-Dashboard über alle Gruppen hinweg (Aggregation mehrerer Gruppen) — spätere Phase
- Lernziel-Editor im Frontend (LP pflegt initial direkt im Sheet oder wir bauen das in einer Folge-Session)
- Lernziel löschen/deaktivieren — `aktiv`-Flag im Interface vorhanden, Endpoint kommt bei Bedarf
- Sessions-Tab Schreib-Logik (wann werden Session-Zeilen geschrieben) — muss ggf. in `lernplattformSpeichereFortschritt` ergänzt werden, ist aber bestehende Backend-Logik
- Supabase-Migration (Architektur ist kompatibel, aber nicht Teil dieser Iteration)
- Gamification-Elemente (Sterne, Streaks) — existieren bereits im Dashboard, werden nicht geändert

---

## 8. Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `apps-script/lernplattform-backend.js` | +2 Endpoints, Lernziele-Tab-Logik |
| `src/services/interfaces.ts` | +FortschrittService Interface |
| `src/adapters/appsScriptAdapter.ts` | +AppsScriptFortschrittAdapter |
| `packages/shared/src/types/fragen.ts` | Lernziel-Interface erweitern (+fragenIds) |
| `src/types/fortschritt.ts` | +SessionEintrag |
| `src/store/fortschrittStore.ts` | +Gruppen-Fortschritt, +Lernziele |
| `src/utils/mastery.ts` | +lernzielStatus() |
| `src/components/admin/AdminKindDetail.tsx` | Backend-Anbindung statt leere Arrays |
| `src/components/admin/AdminUebersicht.tsx` | Optional: Gruppen-Fortschritt-Zusammenfassung |
| `src/components/layout/AppShell.tsx` | Lernziele-Panel dynamisch |

---

## 9. Testplan

- Unit-Tests für `lernzielStatus()` und erweiterte Mastery-Logik
- Unit-Tests für Store-Selektoren (Filtern nach SuS, Aggregation)
- Manueller E2E-Test: LP lädt Fortschritt einer Gruppe, klickt auf SuS → Detail-Ansicht
- Manueller E2E-Test: SuS öffnet Lernziele-Panel → sieht Checkliste

---

## 10. Supabase-Kompatibilität

Die gesamte Aggregationslogik liegt im Frontend. Bei Supabase-Migration:
- Endpoints durch Supabase-RPC oder Direktzugriff ersetzen
- Frontend-Aggregation bleibt als Fallback
- Langfristig: SQL-Views für Performance
