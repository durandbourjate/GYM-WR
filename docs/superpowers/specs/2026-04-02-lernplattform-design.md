# Lernplattform — Design Spec

> Adaptive Übungsplattform mit Login, Fortschritts-Tracking und Eltern-/LP-Dashboard.
> Zwei Kontexte: Gymnasium Hofwil (SuS) + Familie (Kinder 3.–6. Klasse).

---

## 1. Projektziele

### Projekt 1: Login + Lern-Analytik (Infrastruktur)
- Google OAuth Login (wie Prüfungstool) + Code-Fallback (nur Kinder)
- Fortschritts-Tracking pro Lernende/r (Mastery-Stufen)
- Stärken/Schwächen-Erkennung inkl. Dauerbaustellen
- Eltern-/LP-Dashboard mit feinmaschiger Einsicht
- Auftrags-System + adaptive Empfehlungen
- Gilt für Gym-SuS UND Kinder

### Projekt 2: Kinder-Pools (Inhalte + UX)
- Fächer: Mathe, Deutsch, Französisch (3.–6. Klasse)
- Altersgerechte UX: Touch-first, grosse Elemente, kurze Blöcke
- Dezente Gamification: Sterne, Streaks, Fortschrittsbalken
- Besonderer Fokus: Deutsch-Förderung für englisch aufgewachsene Kinder
- Lücken-Modus: gezielt älterer Stoff wo Schwächen erkannt

### Nicht-Ziele
- Kein Prüfungstool (keine Timer, kein Lockdown, keine Noten)
- Kein LMS (keine Kursstruktur, keine Video-Lektionen)
- Kein Ersatz für Unterricht (übt und festigt, erklärt nicht)

---

## 2. Architektur

### Repo-Struktur

```
GYM-WR-DUY/
├── Unterrichtsplaner/     (bestehend, unverändert)
├── ExamLab/              (bestehend, Auth-Code wird geteilt)
├── Lernplattform/         ← NEU: React 19 + TS + Vite + Zustand + Tailwind
├── Uebungen/              (bestehend, läuft parallel weiter)
│   └── Uebungspools/
│       └── config/*.js    ← Bestehende Pools, können migriert werden
└── apps-script-code.js    (erweitert: neue Endpoints für Analytik)
```

### Stack

React 19 + TypeScript + Vite + Zustand + Tailwind CSS (identisch mit Prüfungstool)

### Drei Schichten

| Schicht | Verantwortung | Technologie |
|---------|--------------|-------------|
| **Frontend** | Übungs-UI, Dashboard, Aufträge, Gamification | React 19 + Vite |
| **Auth** | Login, Session, Rollen | Shared mit Prüfungstool (Google OAuth + Code-Login) |
| **Backend** | Analytik, Fortschritt, Aufträge, adaptives Routing | Apps Script + Google Sheets |

### Backend-Abstraktionsschicht

```
React-Komponenten
       ↓
  Service-Layer (TypeScript Interfaces)
       ↓
  API-Adapter (aktuell: Apps Script — austauschbar)
       ↓
  Google Sheets
```

Das Frontend kennt nur die Service-Interfaces. Der Apps-Script-Adapter ist austauschbar. Bei Migration zu einem anderen Backend: neuen Adapter schreiben, Service-Interface bleibt identisch.

### Deploy

Gleicher GitHub Actions Workflow, erweitert um Lernplattform-Build.
URL: `durandbourjate.github.io/GYM-WR-DUY/Lernplattform/`

---

## 3. Rollen + Auth

### Rollen

| Rolle | Erkennung | Sieht |
|-------|-----------|-------|
| **Admin (LP/Eltern)** | Ersteller der Gruppe | Dashboard, Aufträge, Fortschritt aller Mitglieder, Fragenbank |
| **Lernende/r (SuS/Kind)** | Eingeladen in Gruppe | Eigene Übungen, eigener Fortschritt, Aufträge, Sterne |

### Login-Methoden

| Kontext | Login-Methode |
|---------|--------------|
| **Schule** (SuS) | Google OAuth only (`@stud.gymhofwil.ch`) |
| **Privat** (Kinder) | Google OAuth (Standard) + 6-stelliger Code-Fallback |
| **Admin** (LP/Eltern) | Google OAuth only |

Code-Login: Admin generiert pro Kind einen 6-stelligen Code. An E-Mail gebunden, zeitlich unbegrenzt, rotierbar.

### Auth-Flow

```
Lernende/r öffnet App
    ↓
Eingeloggt? (localStorage Session)
    ├─ Ja → Session validieren → Dashboard
    └─ Nein → Login-Screen
                ├─ Google-Button → OAuth → JWT → Backend validiert
                └─ Code-Feld (nur Kinder) → Backend validiert
                        ↓
                Backend: E-Mail → Gruppen-Registry → Gruppen laden
                        ↓
                Dashboard (Gruppen-Auswahl wenn >1)
```

---

## 4. Datentrennung + Gruppen

### Prinzip

Jede Gruppe (Familie, Klasse) hat **eigene Google Sheets**. Keine Vermischung von privaten und schulischen Daten.

### Gruppen-Registry (zentrales Sheet)

```typescript
interface Gruppe {
  id: string                    // "familie-durand", "sf-wr-29c"
  name: string                  // "Familie Durand", "SF WR 29c"
  typ: 'privat' | 'schule'
  adminEmail: string
  fragebankSheetId: string
  analytikSheetId: string
  mitglieder: string[]
}
```

### Sheets-Struktur pro Gruppe

**Fragenbank-Sheet:**
- Tab pro Fach (Schule: VWL, BWL, Recht, IN | Familie: Mathe, Deutsch, Französisch)
- Spalten: id, thema, stufe, typ, schwierigkeit, frage, [typ-spezifisch], erklaerung, tags, uebung, pruefungstauglich

**Analytik-Sheet:**
- Tab `Fortschritt`: email, fragenId, versuche, richtig, richtigInFolge, mastery, letzterVersuch, letzteSession
- Tab `Sessions`: email, datum, fach, thema, anzahlFragen, score, dauer
- Tab `Auftraege`: id, zielEmail, titel, filter, frist, status
- Tab `Antworten`: email, fragenId, sessionId, antwort, korrekt, zeitMs, datum

### Geteilte Fragenbank (Prüfungstool ↔ Lernplattform)

```
                    Fragenbank (Google Sheets)
                    ┌──────────────────────┐
  Schul-Sheet:      │ VWL │ BWL │ Recht │ IN │
                    └──┬───────────┬───────┘
                       │           │
            ┌──────────┘           └──────────┐
            ▼                                  ▼
    Prüfungstool                       Lernplattform
    (pruefungstauglich=true)           (uebung=true)

  Familien-Sheet:   ┌─────────────────────────┐
                    │ Mathe │ Deutsch │ Franz. │
                    └──────────┬──────────────┘
                               │
                               ▼
                        Lernplattform
                        (alles = Übung)
```

Kein Sync nötig — gleiche Quelle, verschiedene Filter. Eine Frage im Prüfungstool-Composer erstellt → sofort als Übung verfügbar (Standard: `uebung: true`, `pruefungstauglich: false`).

---

## 5. Datenmodell

### Frage

```typescript
interface Frage {
  id: string
  fach: string                  // "Mathe" | "Deutsch" | "Französisch" | "VWL" | ...
  thema: string
  stufe?: string                // "3"–"6" (Kinder) oder "GYM1"–"GYM4" (Gym)
  lernziel?: string
  typ: FrageTyp                 // mc, fill, calc, sort, sortierung, ...
  schwierigkeit: 1 | 2 | 3
  taxonomie?: string            // K1–K6 (Gym), optional bei Kindern
  frage: string
  // ... typ-spezifische Felder (options, correct, blanks, rows, etc.)
  erklaerung?: string
  tags?: string[]
  uebung: boolean               // Default: true
  pruefungstauglich: boolean    // Default: false
}
```

### Fortschritt

```typescript
interface FragenFortschritt {
  fragenId: string
  email: string
  versuche: number
  richtig: number
  richtigInFolge: number
  letzterVersuch: string        // ISO-Datum
  letzteSession: string         // Session-ID
  mastery: 'neu' | 'ueben' | 'gefestigt' | 'gemeistert'
}
```

### Mastery-Logik

| Stufe | Bedingung | Rückfall |
|-------|-----------|---------|
| **neu** | Noch nie beantwortet | — |
| **üben** | < 3x richtig in Folge | Aus "gefestigt" wenn falsch |
| **gefestigt** | 3x richtig in Folge | Aus "gemeistert" wenn falsch |
| **gemeistert** | 5x richtig in Folge über mind. 2 Sessions | → "gefestigt" wenn bei Wiederholung falsch |

Gemeisterte Fragen tauchen weiterhin auf: 1 von 10 Fragen pro Block ist ein Wiederholungs-Check.

### Dauerbaustelle

```typescript
interface Dauerbaustelle {
  thema: string
  email: string
  versucheSeit: string          // ISO-Datum Erstversuch
  gesamtVersuche: number        // > 10
  aktuelleQuote: number         // < 50%
  trend: number                 // Veränderung letzte 4 Wochen (%)
  einstreuenProBlock: number    // 1-2 Fragen pro Session
}
```

Erkennung: Thema nach 10+ Versuchen unter 50% Mastery → Dauerbaustelle.

Verhalten:
- Blockiert nie den Fortschritt in anderen Themen
- 1-2 Fragen pro Session einstreuen, egal welches Thema geübt wird
- Verschiedene Kontexte/Sätze (Variation statt Wiederholung)
- Fortschritt als Trend statt Absolut-Wert messen

### Auftrag

```typescript
interface Auftrag {
  id: string
  gruppeId: string
  erstelltVon: string
  zielEmail: string[]
  titel: string
  filter: {
    fach?: string
    themen?: string[]
    stufe?: string
    tags?: string[]
    maxFragen?: number
  }
  frist?: string
  status: 'aktiv' | 'abgeschlossen' | 'archiviert'
}
```

---

## 6. Übungsablauf

### Dashboard (Kind-Sicht)

```
┌─────────────────────────────────────┐
│ 📋 Aufträge von Papi          (0-3) │
│ 💡 Empfohlen für dich          (1-3) │
│ 📚 Alle Themen            (Browse)  │
│    Mathe ▸  Deutsch ▸  Français ▸   │
└─────────────────────────────────────┘
```

Kind kann jederzeit frei Themen wählen. Aufträge und Empfehlungen prominent, aber nicht zwingend.

### Block-Zusammenstellung (max. 10 Fragen)

| Anteil | Quelle |
|--------|--------|
| 7 | Aus gewähltem Thema (priorisiert: üben > gefestigt > neu) |
| 2 | Lücken-Wiederholung (andere Themen, Status "üben" oder Dauerbaustelle) |
| 1 | Gemeistert-Check (zufällig aus "gemeistert") |

### Fragen-Priorisierung

| Priorität | Auswahl |
|-----------|---------|
| 1 (höchst) | Status "üben", zuletzt falsch |
| 2 | Status "üben", noch nie richtig |
| 3 | Status "neu" |
| 4 | Status "gefestigt" (Festigung) |
| 5 (tiefst) | Status "gemeistert" (Wiederholungs-Check) |

### Empfehlungs-Logik ("Für dich")

Max. 3 Vorschläge:
1. **Aktiver Auftrag** (falls vorhanden, immer zuoberst)
2. **Grösste Lücke** (Thema mit tiefstem Mastery, rückwärts bis zur richtigen Stufe)
3. **Festigung** (Thema kurz vor "gemeistert" — Motivation)

Kein Vorgreifen auf neue Themen ausser Admin schaltet sie explizit frei.

### Zwei Achsen der Übung

- **Horizontal:** Aktueller Schulstoff (Admin steuert den Scope)
- **Vertikal:** Lücken aus früheren Jahren (System erkennt + empfiehlt rückwärts)

---

## 7. Kinder-UX

### Grundprinzipien

- Touch-first, min. 48px Tippflächen
- Wenig Text in der UI, klare Icons
- Fröhlich aber nicht überladen
- Max. 10 Fragen pro Block, jederzeit pausierbar
- Schriftgrösse mind. 18px Basis
- iPad muss funktionieren

### Feedback

- **Richtig:** Grüner Haken + variierende Ermutigung ("Super!", "Genau!", "Stark!")
- **Falsch:** Rote Markierung + Erklärung. Kein "Falsch!" — eher "Fast! Die richtige Antwort ist..."
- Erklärung aufklappbar (nicht erzwungen)

### Gamification (dezent)

| Element | Verhalten |
|---------|-----------|
| **Sterne** | 0-3 pro Thema (basierend auf Mastery-%) |
| **Streak** | Sessions in Folge (nicht Tage) |
| **Fortschrittsbalken** | Pro Thema + Gesamt pro Fach |
| **Session-Zusammenfassung** | "7 von 10 richtig! 2 Sterne verdient" |

Kein Punkte-System, kein Shop, keine Minispiele, keine Rangliste.

---

## 8. Eltern-/LP-Dashboard

### Drei Ebenen

**Ebene 1 — Übersicht (alle Kinder/SuS):**
```
Anna    Mathe ████████░░  Deutsch ███░░░░░  Franz ██████░░
Leo     Mathe ██████░░░░  Deutsch ██░░░░░░  Franz ████░░░░
```

**Ebene 2 — Pro Kind (Drill-Down):**
```
Anna — Deutsch
  Wortschatz      ████████░░  80% gemeistert
  Rechtschreibung ██████░░░░  60% gefestigt
  Fälle           ██░░░░░░░░  20% 🔄 Dauerbaustelle (Trend ↑)
  Satzglieder     ░░░░░░░░░░  neu

  Letzte 7 Tage: 3 Sessions, 42 Fragen, 71% richtig
  Streak: 🔥 3 Sessions
```

**Ebene 3 — Pro Thema (tiefster Detail):**
```
Anna — Deutsch — Fälle
  Gesamt: 47 Versuche, 21 richtig (45%)
  Trend: ↗ steigend (30% → 45% letzte 4 Wochen)

  Typische Fehler:
    "der" statt "das" bei Neutrum (12x)
    Dativ-Formen verwechselt (8x)

  Letzte Session (28.03.):
    ✓ "__ Hund" → der (richtig)
    ✗ "__ Mädchen" → die (falsch, korrekt: das)

  Verlauf:
    03.28  3/5 richtig
    03.25  2/5 richtig
    03.20  1/5 richtig
```

Typische Fehler: aus gespeicherten Antworten aggregiert (häufigste falsche Optionen/Eingaben).

---

## 9. Fragen-Erstellung

### Drei Wege

| Weg | Beschreibung | Für wen |
|-----|-------------|---------|
| **Prüfungstool-Composer** | Bestehender Editor. Frage → Sheet → sofort in Lernplattform. | LP (Gym) |
| **KI-Generierung** | `generiereFrageZuLernziel` im Apps Script. Direkt ins Sheet. | LP + Eltern |
| **Lernplattform-Admin** | Einfacherer Editor (weniger Felder, kein Bewertungsraster). | Eltern |

### Fragetypen

**Übernommen (funktionieren 1:1):**
mc, multi, tf, fill, calc, sort, sortierung, zuordnung

**Neue Typen (bei Bedarf ergänzen):**

| Typ | Beschreibung | Fach |
|-----|-------------|------|
| `wortschatz` | Bild → Wort oder Wort → Übersetzung | Deutsch, Französisch |
| `konjugation` | Tabelle ausfüllen (je mange, tu ___, ...) | Französisch |
| `diktat` | Audio abspielen (TTS) → Kind tippt | Deutsch, Französisch |
| `rechenweg` | Mehrstufige Berechnung, Zwischenschritte | Mathe |
| `zuordnung_bild` | Bilder zu Kategorien zuordnen (visueller) | Alle |

Audio als Quelle (TTS im Browser) ist vorgesehen. Audio als Aufnahme (SuS spricht) vorerst nicht.

**Nicht übernommen:** code, formel, hotspot, bildbeschriftung, dragdrop_bild, zeichnen, pdf, buchungssatz, tkonto, bilanz, kontenbestimmung — bei Bedarf ergänzbar.

---

## 10. Fragetypen-Rendering (Portierung)

Die bestehende TYPE_HANDLERS-Registry aus pool.html wird als React-Komponenten portiert. Pro Fragetyp eine Komponente:

```
src/components/fragetypen/
├── MCFrage.tsx
├── MultiFrage.tsx
├── TFFrage.tsx
├── FillFrage.tsx
├── CalcFrage.tsx
├── SortFrage.tsx
├── SortierungFrage.tsx
├── ZuordnungFrage.tsx
└── index.ts              ← Registry: typ → Komponente
```

Gleiche Korrektur-Logik wie in Pools/Prüfungstool. Touch-optimiert (Pointer Events, `touchAction: none`, min. 48px Targets).

---

## 11. Service-Interfaces

```typescript
interface FragenService {
  ladeFragen(gruppeId: string, filter?: FragenFilter): Promise<Frage[]>
  speichereFrage(gruppeId: string, frage: Frage): Promise<void>
}

interface AnalytikService {
  ladeFortschritt(gruppeId: string, email: string): Promise<FragenFortschritt[]>
  speichereAntwort(gruppeId: string, antwort: Antwort): Promise<void>
  ladeDauerbaustellen(gruppeId: string, email: string): Promise<Dauerbaustelle[]>
  ladeTypischeFehler(gruppeId: string, email: string, thema: string): Promise<FehlerCluster[]>
  ladeSessions(gruppeId: string, email: string): Promise<SessionLog[]>
}

interface AuftraegeService {
  ladeAuftraege(gruppeId: string, email?: string): Promise<Auftrag[]>
  erstelleAuftrag(gruppeId: string, auftrag: Auftrag): Promise<void>
  aktualisiereAuftrag(gruppeId: string, id: string, updates: Partial<Auftrag>): Promise<void>
}

interface GruppenService {
  ladeGruppen(email: string): Promise<Gruppe[]>
  erstelleGruppe(gruppe: Gruppe): Promise<void>
  ladeMitglieder(gruppeId: string): Promise<Mitglied[]>
  einladen(gruppeId: string, email: string): Promise<void>
}

interface AuthService {
  anmelden(credential: GoogleCredential): Promise<AuthUser>
  abmelden(): Promise<void>
  codeLogin(code: string): Promise<AuthUser>
  generiereCode(gruppeId: string, email: string): Promise<string>
}
```

Aktuell: `AppsScriptAdapter` implementiert alle Interfaces. Bei Backend-Migration: neuen Adapter schreiben, Interfaces bleiben stabil.

---

## 12. Apps Script: Neue Endpoints

| Endpoint | Beschreibung |
|----------|-------------|
| `ladeGruppen` | Gruppen für E-Mail aus Registry |
| `erstelleGruppe` | Neue Gruppe + Sheets automatisch anlegen |
| `ladeFragen` | Fragen aus Gruppen-Sheet (gefiltert) |
| `speichereFrage` | Frage in Gruppen-Sheet schreiben |
| `speichereAntwort` | Antwort loggen + Fortschritts-Update |
| `ladeFortschritt` | Mastery-Daten pro Lernende/r |
| `ladeDauerbaustellen` | Themen mit persistenter Schwäche |
| `ladeTypischeFehler` | Aggregierte Fehlermuster |
| `ladeSessions` | Session-Historie pro Lernende/r |
| `erstelleAuftrag` | Neuer Auftrag |
| `generiereCode` | Login-Code für Kind generieren |
| `validiereCode` | Code-Login prüfen |

---

## 13. Routing (Seiten)

```
/                       → Login oder Dashboard (Auth-Guard)
/dashboard              → Aufträge + Empfehlungen + Alle Themen
/ueben/:themaId         → Übungsblock (10 Fragen)
/zusammenfassung        → Session-Ergebnis + Sterne
/admin                  → Eltern-/LP-Dashboard (Übersicht)
/admin/kind/:email      → Detail-Ansicht pro Kind/SuS
/admin/auftraege        → Aufträge verwalten
/admin/fragenbank       → Fragen anschauen/erstellen
/admin/gruppe           → Gruppe verwalten, Mitglieder, Codes
```

---

## 14. Abgrenzung Prüfungstool ↔ Lernplattform

| Aspekt | Prüfungstool | Lernplattform |
|--------|-------------|---------------|
| Zweck | Summative Bewertung | Formatives Üben |
| Timer | Ja, strikt | Nein |
| Lockdown/SEB | Ja | Nein |
| Noten | Ja | Nein, nur Mastery |
| Gamification | Nein | Ja (dezent) |
| Adaptiv | Nein (fixe Fragen) | Ja (Routing + Dauerbaustellen) |
| Auth | Google OAuth | Google OAuth + Code |
| Fragenbank | Sheets | Sheets (geteiltes Format) |
| Fragen-Erstellung | Composer (voll) | Vereinfachter Editor + KI + Composer |

### Geteilte Infrastruktur

| Komponente | Geteilt? |
|------------|----------|
| Auth-System (Google OAuth) | Ja, gleicher Code + Client-ID |
| Apps Script Backend | Ja, erweitert |
| Fragenbank-Format | Gleiche Typen-Registry + Datenstruktur |
| GitHub Actions Deploy | Erweitert um Lernplattform-Build |

---

## 15. Implementierungs-Phasen

| Phase | Inhalt | Resultat |
|-------|--------|----------|
| **1** | Grundgerüst + Auth + Gruppen | Login, Gruppen erstellen, Mitglieder einladen |
| **2** | Fragenbank + Übungs-Engine | Fragen laden, Block zusammenstellen, beantworten, Feedback |
| **3** | Fortschritt + Mastery | Tracking, Mastery-Stufen, Dauerbaustellen-Erkennung |
| **4** | Eltern-Dashboard | Übersicht, Drill-Down, typische Fehler, Trends |
| **5** | Aufträge + Empfehlungen | Admin erstellt Aufträge, System empfiehlt |
| **6** | Gamification + Kinder-UX | Sterne, Streaks, altersgerechtes Feedback, Touch-Optimierung |
| **7** | Gym-Pool-Migration | Bestehende 27 Pools in Sheets migrieren |

Phase 1–3 = minimales nutzbares Produkt. Kinder können ab Phase 3 üben (mit manuell erstellten Fragen).

---

## 16. Wettbewerbs-Positionierung

### Marktlücke

Kein bestehendes Tool kombiniert: LP21-konforme Inhalte + echte Gamification + adaptives Routing + Eltern-Dashboard + Französisch.

| Tool | Stärke | Fehlt |
|------|--------|-------|
| Anton | Gamification, gratis | DE-Lehrplan, kein Franz. |
| MeinKlett | LP21, QR-Login | Keine Gamification, nicht adaptiv |
| Khan Academy | Adaptiv, KI-Tutor | Nicht LP21, kein Franz. |
| Lernwolke | CH-spezifisch, Stift | Nur Deutsch + Mathe |

### Differenzierung

- Massgeschneiderte Inhalte (Eltern/LP erstellen passend zum aktuellen Schulstoff)
- Adaptives Routing mit Dauerbaustellen-Erkennung
- Geteilte Fragenbank mit Prüfungstool (Gym-Kontext)
- Feinmaschiges Eltern-Dashboard mit Fehleranalyse
- Zwei Kontexte (Schule + Familie) in einer App

---

## 17. Offline-Handling

### Problem
Kinder üben zu Hause oder unterwegs — Netzwerkausfälle sind zu erwarten. Verlorene Antworten zerstören das Vertrauen ins Mastery-System.

### Lösung: Offline-Queue

```
Antwort gegeben
    ↓
In localStorage-Queue schreiben (immer, auch online)
    ↓
Sync-Versuch zum Backend
    ├─ Erfolg → aus Queue entfernen
    └─ Fehlschlag → Queue behalten, bei nächster Gelegenheit retry
```

- **Queue:** `lernplattform-queue-{email}` in localStorage (Array von Antworten)
- **Sync:** Bei App-Start + nach jedem Block + bei `online`-Event
- **Konflikte:** Last-Write-Wins auf `FragenFortschritt` (Antwort-Timestamp entscheidet). Antworten-Log ist append-only (kein Konflikt).
- **UI:** Offline-Indikator ("Offline — Antworten werden gespeichert"). Kein Blocker — Kind kann weiterüben.
- **Limit:** Max. 500 Antworten in Queue. Danach Warnung "Bitte verbinden um Fortschritt zu sichern."

### Fragen-Cache
Beim ersten Laden eines Themas werden die Fragen in localStorage gecacht. Kind kann offline weiterüben mit gecachten Fragen. Mastery-Updates lokal berechnen, bei Reconnect mit Backend abgleichen.

---

## 18. Auth-Sicherheit

### Session-Tokens
Wie beim Prüfungstool: Apps Script generiert Session-Token bei Login. Jeder API-Call sendet Token im Header. Token validierung serverseitig.

```
Login (OAuth/Code)
    ↓
Apps Script: validiereLogin → generiereSessionToken_(email)
    ↓
Token an Client → localStorage
    ↓
Jeder API-Call: { token, email, action, ... }
    ↓
Apps Script: validiereSessionToken_(token, email) → erlaubt/blockiert
```

Token-TTL: 24 Stunden (länger als Prüfungstool, da keine Prüfungsbindung).

### Code-Login Sicherheit
- **6-stellig alphanumerisch** (36^6 ≈ 2 Mrd. Kombinationen statt 10^6)
- **Rate Limiting:** Max. 5 Versuche pro Minute pro IP/Fingerprint
- **Rotation:** Admin kann Code jederzeit rotieren. Empfehlung: alle 90 Tage.

### IDOR-Schutz
- Jeder API-Call validiert: Token-E-Mail muss zur angefragten E-Mail passen
- Admin-Calls: Token-E-Mail muss Admin der angefragten Gruppe sein
- Kind kann nur eigene Daten lesen/schreiben

---

## 19. Sheets-Skalierung

### Problem
Antworten-Log wächst schnell: 2 Kinder × 30 Fragen/Tag × 365 = ~22'000 Zeilen/Jahr. Schulklasse: ~260'000/Jahr. Apps Script wird ab ~50'000 Zeilen langsam.

### Strategie

**Antworten-Tab:** Quartalsweise archivieren.
- Aktiver Tab: `Antworten` (aktuelles Quartal)
- Archiv-Tabs: `Antworten_2026_Q1`, `Antworten_2026_Q2`, ...
- Apps Script schreibt immer in aktiven Tab, liest Archiv nur für Trend-Berechnungen

**Fortschritt-Tab:** Bleibt kompakt (1 Zeile pro Frage × Lernende/r). Max. ~5'000 Zeilen pro Gruppe. Kein Skalierungsproblem.

**Dauerbaustellen + Typische Fehler:** Vorberechnet und gecacht.
- Apps Script berechnet bei Session-Ende (nicht bei jedem Aufruf)
- Ergebnis in Cache-Tab `_Aggregationen` (1 Zeile pro Lernende/r × Thema)
- Dashboard liest nur den Cache-Tab

### Export/Backup
- Admin kann jederzeit Excel-Export aller Daten pro Kind auslösen
- Sheets haben eingebaute Versionshistorie (Google Drive)

---

## 20. Geteilte Fragenbank — Klarstellung

### Schule: Shared Sheet (gleiche Instanz)

Das Schul-Fragenbank-Sheet ist **dasselbe Sheet** wie im Prüfungstool. Kein Kopieren, kein Sync. Die `fragebankSheetId` in der Gruppen-Registry zeigt auf die bestehende Fragenbank.

**Concurrent Writes:** Kein Problem — Prüfungstool und Lernplattform schreiben beide über Apps Script (serialisiert via Lock Service). Apps Script garantiert atomare Schreiboperationen pro Aufruf.

### Familie: Eigenes Sheet

Das Familien-Fragenbank-Sheet ist unabhängig. Keine Verbindung zum Schulkontext.

### Flags

| Flag | Default | Beschreibung |
|------|---------|-------------|
| `uebung` | `true` | In Lernplattform sichtbar |
| `pruefungstauglich` | `false` | In Prüfungstool verwendbar (LP muss explizit freigeben) |

---

## 21. Weitere Klarstellungen

### sort vs. sortierung
- `sort`: Elemente in **Kategorien** einordnen (z.B. "Ordne zu: Arbeit / Boden / Kapital")
- `sortierung`: Elemente in **Reihenfolge** bringen (Pick-to-Order, z.B. "Sortiere chronologisch")

### Session-Definition
Eine Session = ein Übungsblock (max. 10 Fragen). Start: Kind klickt "Üben". Ende: Block abgeschlossen oder abgebrochen. Jede Session erhält eine ID: `s_{timestamp}_{random}`.

### Streak-Definition
Streak zählt Sessions (nicht Tage). Bricht ab wenn **14 Tage** ohne Session vergehen. Zwei Sessions am selben Tag zählen als 2.

### Gruppen-Kontext im Routing
Aktive Gruppe wird im Zustand-Store gehalten (nach Login/Auswahl). Routes brauchen keinen `gruppeId`-Parameter — der Store liefert den Kontext. Bei Gruppenwechsel: zurück zum Dashboard.

### Mitglied-Interface

```typescript
interface Mitglied {
  email: string
  name: string
  rolle: 'admin' | 'lernend'
  code?: string                 // Nur bei Kindern (privat)
  beigetreten: string           // ISO-Datum
}
```

### Diktat-Fallback
Browser-TTS (`SpeechSynthesis`) als Standard. Wenn keine passende Stimme verfügbar: Frage wird als normaler Lückentext angezeigt mit Hinweis "Audio nicht verfügbar". Langfristig: optionale Audio-Dateien in Google Drive als Alternative zu TTS.

### Datenschutz
- Kinder-Daten (3.–6. Klasse): Nur mit elterlicher Einwilligung
- Schul-Daten: Gemäss ICT-Nutzungsreglement Gymnasium Hofwil
- Daten-Retention: Antworten-Archiv nach 2 Jahren löschbar
- Export: Admin kann alle Daten pro Kind als Excel exportieren
- Löschung: Admin kann Kind-Profil + alle zugehörigen Daten löschen

### Gruppen-Erstellung Fehlerbehandlung
`erstelleGruppe` erstellt Sheets transaktional:
1. Fragenbank-Sheet erstellen
2. Analytik-Sheet erstellen
3. Registry-Eintrag schreiben
Bei Fehler in Schritt 2/3: bereits erstellte Sheets aufräumen. Retry-Button im UI bei Fehlschlag.

### Block-Komposition Edge Cases
- Weniger als 7 Fragen im Thema → Block schrumpft (min. 3 Fragen)
- Keine "gemeistert"-Fragen → Slot entfällt, Block hat 9 Fragen
- Keine Dauerbaustellen/Lücken → Slots werden mit Thema-Fragen aufgefüllt
- Komplett neuer User (alles "neu") → Block = 10 neue Fragen, kein Routing
