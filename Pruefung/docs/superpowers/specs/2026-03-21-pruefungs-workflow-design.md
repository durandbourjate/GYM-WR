# Prüfungs-Workflow: Teilnehmer-Auswahl, Lobby, Start, Monitoring, Beenden

**Datum:** 2026-03-21
**Status:** Genehmigt
**Scope:** Erweiterung des Monitoring-Tabs um einen vollständigen Prüfungs-Workflow

## Kontext

Bisher fehlt ein strukturierter Ablauf von der Teilnehmer-Auswahl bis zum Prüfungsende. Die LP muss manuell Links verteilen, hat keine Lobby und kein Live-Monitoring. Dieses Design erweitert den bestehenden Monitoring-Tab um einen phasenbasierten Workflow.

## Design-Entscheide

| Frage | Entscheid |
|-------|-----------|
| Teilnehmer-Quelle | Klassenlisten (Google Sheet) + manuelle E-Mail-Eingabe |
| Wann auswählen | Primär im Monitoring vor Start, optional im Composer vorbereitbar |
| Monitoring-Struktur | Phasen-Flow (kein Tab-Wechsel), eine Ansicht die sich mit Phase ändert |
| Lobby-Modell | Einfach — Freischalten = sofortiger Start |
| Link-Verteilung | Automatische E-Mail-Einladung + manuell kopierbarer URL, kein QR-Code |
| Zugangs-Validierung | Semi-offen — unerwartete SuS werden angezeigt, LP entscheidet |
| Architektur | Monitoring-Tab-Erweiterung mit Sub-Komponenten pro Phase |

## 1. State-Machine & Phasen-Flow

### Vier Phasen

```
vorbereitung → lobby → aktiv → beendet
```

Die Phase wird **deterministisch** aus bestehendem Zustand abgeleitet (nicht separat persistiert). **Evaluationsreihenfolge: erste Übereinstimmung gewinnt** (höchste Priorität zuerst):

```typescript
function bestimmePhase(config: PruefungsConfig, schuelerStatus: SchuelerStatus[]): Phase {
  if (config.beendetUm)                          return 'beendet'
  if (config.freigeschaltet)                      return 'aktiv'
  if (config.teilnehmer?.length > 0
      && schuelerStatus.some(s => s.status !== 'nicht-gestartet'))
                                                  return 'lobby'
  return 'vorbereitung'
}
```

### Neue/Erweiterte Felder in PruefungsConfig

```typescript
// NEU: Teilnehmer-Array
teilnehmer: Array<{
  email: string
  name: string
  vorname: string
  klasse: string
  quelle: 'klassenliste' | 'manuell'
  einladungGesendet?: boolean
}>

// NEU: Beendet-Zeitstempel (bisher nur in HeartbeatResponse)
beendetUm?: string  // ISO-Zeitstempel
```

### Migration: erlaubteKlasse/erlaubteEmails → teilnehmer

Die bestehenden Felder `erlaubteKlasse: string` und `erlaubteEmails?: string[]` in `PruefungsConfig` werden **beibehalten für Rückwärtskompatibilität**. Neue Logik:

- `teilnehmer[]` ist die primäre Quelle für den Workflow (Lobby, Monitoring, Einladungen)
- `erlaubteKlasse` / `erlaubteEmails` bleiben als **Zugangs-Gate** bestehen (SuS-Seite prüft weiterhin)
- Beim Setzen von `teilnehmer[]` werden `erlaubteKlasse` und `erlaubteEmails` automatisch synchronisiert:
  - `erlaubteEmails` = alle E-Mails aus `teilnehmer[]`
  - `erlaubteKlasse` = erste Klasse (oder leer bei gemischten Klassen)
- Bestehende Prüfungen ohne `teilnehmer[]`: Monitoring zeigt direkt die aktive Phase (Fallback)

### Phasen-Übergänge

- `vorbereitung → lobby`: Automatisch sobald Teilnehmer gesetzt und erste SuS eingeloggt
- `lobby → aktiv`: LP klickt «Freischalten» → setzt `freigeschaltet: true`
- `aktiv → beendet`: LP klickt «Prüfung beenden» → setzt `beendetUm`
- `lobby → vorbereitung`: LP klickt «Zurück zur Vorbereitung» (Reset möglich)
- **Kein Zurück** von `aktiv` oder `beendet`

## 2. Vorbereitungs-Phase — Teilnehmer-Auswahl

### Klassenlisten laden

- Neue Apps-Script-Aktion `ladeKlassenlisten`
- Liest das bestehende **«Klassenlisten»-Sheet** aus (identifiziert per Sheet-Name, hardcoded)
- **Erwartetes Format:** Spalte A = Klasse, Spalte B = Nachname, Spalte C = Vorname, Spalte D = E-Mail. Erste Zeile = Header.
- Gibt zurück: `Array<{ klasse: string, email: string, name: string, vorname: string }>`
- Gruppierung nach `klasse` im Frontend
- Caching im Zustand: einmal pro Session, Button «Neu laden» für Refresh
- **Fehler:** Wenn Sheet nicht existiert oder leer → Fehlermeldung im UI, manuelle Eingabe bleibt möglich

### UI-Aufbau

```
┌─────────────────────────────────────────────────┐
│  Prüfung: [Titel]              Status: Entwurf  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Teilnehmer auswählen                           │
│  ┌───────────────────────────────────────────┐  │
│  │ ☑ Klasse 24a (18)    ☐ Klasse 25c (22)   │  │
│  │ ☑ Klasse 24b (20)    ☐ Klasse 26a (19)   │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  Ausgewählt: 38 SuS                             │
│  ┌───────────────────────────────────────────┐  │
│  │ ☑ Müller, Anna       24a                  │  │
│  │ ☑ Schmidt, Ben       24a                  │  │
│  │ ☐ Weber, Clara       24a  ← einzeln       │  │
│  │ ☑ Fischer, David     24b     abwählen     │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  + Manuell hinzufügen (E-Mail)                  │
│  ┌──────────────────────┐ [Hinzufügen]          │
│  │ vorname.name@schule  │                       │
│  └──────────────────────┘                       │
│                                                  │
│  [Einladungen versenden]     [Prüfung starten]  │
└─────────────────────────────────────────────────┘
```

### Interaktionslogik

- **Klasse anklicken** → alle SuS dieser Klasse ein-/ausschalten
- **Einzelne SuS** → individuell abwählbar (z.B. abwesend/dispensiert)
- **Manuell hinzufügen** → E-Mail-Eingabe, `quelle: 'manuell'`
- **Persistent** → `pruefungsConfig.teilnehmer[]` im Google Sheet gespeichert

### Einladungen versenden

- Apps-Script-Aktion `sendeEinladungen`
- E-Mail pro SuS: Prüfungstitel, Datum/Zeit, Direktlink
- Status-Tracking: `einladungGesendet: boolean` pro Teilnehmer, ✉ Icon
- Erneut senden möglich (Nachzügler)
- **Fehlerbehandlung:** `sendeEinladungen` gibt pro Empfänger Erfolg/Fehler zurück. Bei Teilfehlern (ungültige Adresse, Quota): Erfolgreiche werden als `einladungGesendet: true` markiert, fehlgeschlagene zeigen ❌ mit Fehlermeldung. LP kann einzelne erneut versuchen.
- **Gmail-Quota:** Google Workspace erlaubt 1500 E-Mails/Tag — bei Schulklassen (max. ~120 SuS) kein Problem

### Prüfungs-URL

- Format: `https://[domain]/pruefung?id=[pruefungsId]`
- Manuell kopierbar über «Link kopieren»-Button (📋)
- Kein QR-Code

### Auch im Composer vorbereitbar (Phase 2 — nicht im ersten Release)

- Optionaler Abschnitt «Teilnehmer» im Composer
- Gleiche Klassen-Auswahl-UI, vereinfacht (ohne Einladungs-Versand)
- LP kann beim Erstellen schon die Klasse zuweisen
- **Scope:** Wird als Folge-Feature nach dem Monitoring-Workflow implementiert

## 3. Lobby-Phase — Warten & Freischalten

### LP-Sicht

```
┌─────────────────────────────────────────────────┐
│  Prüfung: [Titel]           Status: Lobby 🟡    │
├─────────────────────────────────────────────────┤
│                                                  │
│  Bereit: 14 / 38          ██████████░░░░  37%   │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ 🟢 Müller, Anna       24a    bereit       │  │
│  │ 🟢 Schmidt, Ben       24a    bereit       │  │
│  │ ⚪ Weber, Clara        24a    ausstehend   │  │
│  │ ⚠️ unbekannt@mail.ch   —     unerwartet   │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  [Zurück zur Vorbereitung]   [▶ Freischalten]   │
└─────────────────────────────────────────────────┘
```

### SuS-Sicht

- Login mit Schul-E-Mail (Google-Auth, bestehend)
- Wartebildschirm: Prüfungstitel, «Die LP hat die Prüfung noch nicht freigegeben.»
- Dezente Puls-Animation (Seite lebt)
- Kein Zugriff auf Fragen

### Bereitschafts-Erkennung

- SuS-Login per Polling erkannt (bestehendes Sheet-System)
- Status: `ausstehend → bereit` bei Login
- **Unerwartete SuS** (E-Mail nicht in `teilnehmer[]`): orange markiert mit ⚠️
  - LP sieht: E-Mail + Name (aus Google-Auth-Profil)
  - **Akzeptieren** → SuS wird zu `teilnehmer[]` hinzugefügt (`quelle: 'manuell'`), E-Mail in `erlaubteEmails` aufgenommen
  - **Ignorieren** → SuS bleibt im Wartebildschirm, sieht weiterhin «Warten auf Freigabe»
  - Nach Freischaltung: nur akzeptierte + eingeladene SuS erhalten Zugang. `erlaubteEmails` ist das Zugangs-Gate.

### Freischalten

- «▶ Freischalten» → `freigeschaltet: true` im Sheet
- **Transition Lobby → Aktiv:** Die bestehende Heartbeat-Response enthält `freigeschaltet`-Flag. SuS-Client prüft bei jedem Heartbeat (~10s) ob `freigeschaltet === true` und wechselt automatisch von Wartebildschirm zur Prüfungsansicht.
- Nachzügler die sich nach Freischaltung einloggen: `ladePruefung` gibt `freigeschaltet: true` zurück → sie sehen direkt die Prüfung (kein Lobby-Bildschirm)
- **Kein Zurück** nach Freischaltung

### Zurück zur Vorbereitung

- Vor Freischaltung möglich
- Bereits eingeloggte SuS bleiben im Wartebildschirm (kein Rauswurf)

## 4. Aktive Phase — Monitoring & Live-Überwachung

### LP-Sicht

```
┌─────────────────────────────────────────────────┐
│  Prüfung: [Titel]          Status: Aktiv 🟢     │
│  Gestartet: 10:15    Dauer: 00:42:17 ⏱         │
├─────────────────────────────────────────────────┤
│                                                  │
│  🔵 24 aktiv · ✅ 8 abgegeben · ⚪ 6 ausstehend │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ Name            Klasse  Frage  Fortschr.  │  │
│  │ Müller, Anna    24a     7/12   ██████░ 58%│  │
│  │ Schmidt, Ben    24a     4/12   ████░░░ 33%│  │
│  │ Fischer, David  24b    12/12   ✅ Abgeg.  │  │
│  │ Weber, Clara    24a      —     ⚪ Nicht da │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  Sortierung: [Fortschritt ▾]                    │
│  Abgegeben: 8 / 38                              │
│                                                  │
│          [⏹ Prüfung beenden]                    │
└─────────────────────────────────────────────────┘
```

### Neue/Erweiterte Felder in SchuelerStatus

```typescript
// NEU: Aktuelle Frage (Index 0-basiert)
aktuelleFrage: number | null  // Wird beim Fragenwechsel im SuS-Client geschrieben

// BESTEHEND, wird für Inaktivität genutzt:
letzterHeartbeat: string | null   // ISO-Zeitstempel, alle ~10s
letzterSave: string | null        // ISO-Zeitstempel, bei Antwort-Speichern
```

`letzteAktivitaet` wird **nicht als eigenes Feld** gespeichert, sondern im Frontend abgeleitet:

```typescript
const letzteAktivitaet = Math.max(
  new Date(schueler.letzterHeartbeat ?? 0).getTime(),
  new Date(schueler.letzterSave ?? 0).getTime()
)
```

### Live-Daten pro SuS

| Feld | Quelle | Anzeige |
|------|--------|---------|
| Aktuelle Frage | `aktuelleFrage` in SchuelerStatus (neu) | «Frage 7/12» |
| Fortschritt | `beantworteteFragen / gesamtFragen` (bestehend) | Balken + Prozent |
| Status | `status` + `abgabezeit` (bestehend) | ✅ Abgegeben / 🔵 Aktiv / ⚪ Nicht erschienen |
| Letzte Aktivität | `max(letzterHeartbeat, letzterSave)` (abgeleitet) | Inaktivitäts-Warnung (gestuft) |

### Inaktivitäts-Warnung (abgestuft)

| Dauer ohne Aktivität | Stufe | Anzeige |
|---|---|---|
| >1 Minute | 🟡 Gelb | Dezenter Hinweis |
| >3 Minuten | 🟠 Orange | Auffällig |
| >5 Minuten | 🔴 Rot | Deutliche Warnung |

**Aktivität = jede Interaktion:** Fragenwechsel (schreibt `aktuelleFrage`), Antwort speichern (aktualisiert `letzterSave`), Heartbeat (aktualisiert `letzterHeartbeat`). Ein SuS der aktiv tippt hat durch Autosave (~300ms Debounce) ständig frische `letzterSave`-Zeitstempel — Warnung greift nur bei echter Inaktivität.

### Detail-Ansicht pro SuS

Klick auf SuS öffnet **Slide-in-Panel** (rechts):

- **Kopf:** Name, Klasse, E-Mail, Login-Zeit
- **Fragen-Übersicht:** Status-Icons pro Frage
  - ✅ Beantwortet (mit Zeitstempel)
  - ✏️ Aktuell aktiv
  - ⚪ Noch nicht besucht
- **Zeitverlauf:** Chronologische Liste wann welche Frage besucht/beantwortet
- **Keine Antwort-Inhalte** — nur Metadaten (Korrektur kommt separat)

Panel schliesst per ✕ oder Klick auf anderen SuS.

### Sortierung & Filterung

- **Sortieroptionen:** Name (A-Z), Klasse, Fortschritt, Status
- **Schnellfilter:** Alle | Aktiv | Abgegeben | Nicht erschienen

### Einschränkungen während aktiver Phase

- LP kann Fragen und Teilnehmer **nicht** ändern
- Einzige Aktionen: Beobachten + Prüfung beenden

## 5. Beenden-Phase & Abschluss

### Bestätigungs-Dialog

```
┌─────────────────────────────────────┐
│  Prüfung wirklich beenden?         │
│                                     │
│  32 von 38 SuS haben abgegeben.    │
│  6 SuS haben noch nicht abgegeben: │
│  · Weber, Clara (Frage 9/12)       │
│  · Keller, Eva (Frage 11/12)       │
│  · ...                              │
│                                     │
│  ⚠ Nicht abgegebene Prüfungen      │
│  werden im aktuellen Zustand       │
│  gespeichert.                       │
│                                     │
│  [Abbrechen]    [Prüfung beenden]  │
└─────────────────────────────────────┘
```

### Ablauf

1. LP klickt «⏹ Prüfung beenden»
2. Bestätigungs-Dialog mit Übersicht nicht abgegebener SuS
3. `freigeschaltet → false`, `beendetUm → Zeitstempel`
4. Phase wechselt zu `beendet`

### SuS-Sicht beim Beenden

- Nächster Poll-Zyklus (~10s): Prüfung gesperrt
- Anzeige: «Die Prüfung wurde von der Lehrperson beendet. Deine Antworten wurden gespeichert.»
- Autosave (300ms Debounce) + `beforeunload`-Flush minimiert Datenverlust

### LP-Sicht nach Beenden

```
┌─────────────────────────────────────────────────┐
│  Prüfung: [Titel]        Status: Beendet ⏹     │
│  Dauer: 10:15 – 11:02 (47 Min.)                │
├─────────────────────────────────────────────────┤
│                                                  │
│  Zusammenfassung                                │
│  Teilnehmer: 38 | Abgegeben: 32 (84%)          │
│  Erzwungen: 4   | Nicht erschienen: 2           │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ Name            Status      Abgabe        │  │
│  │ Müller, Anna    ✅ Abgegeben  10:48       │  │
│  │ Fischer, David  ⚠️ Erzwungen  11:02       │  │
│  │ Weber, Clara    ⚪ Nicht ersch.  —         │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  [Ergebnisse exportieren]   [Zur Korrektur →]  │
└─────────────────────────────────────────────────┘
```

### Aktionen nach Beenden

- **Ergebnisse exportieren** → bestehender Batch-Export mit Teilnehmer-Metadaten
- **Zur Korrektur** → Wechsel in bestehenden Korrektur-Workflow
- **Kein «Erneut öffnen»** — einmal beendet = beendet (vermeidet Manipulation)

### Daten-Persistenz

- Alle Antworten bereits im Sheet (laufender Autosave)
- `beendetUm`-Zeitstempel ins Prüfungs-Sheet
- Teilnehmer-Status permanent gespeichert

## Komponenten-Struktur

```
MonitoringTab.tsx          (bestehend, wird erweitert)
├── PhaseHeader.tsx        (Status-Anzeige + Timer)
├── VorbereitungPhase.tsx  (Teilnehmer-Auswahl)
│   ├── KlassenAuswahl.tsx
│   └── TeilnehmerListe.tsx
├── LobbyPhase.tsx         (Bereitschafts-Übersicht)
├── AktivPhase.tsx         (Live-Monitoring)
│   ├── TeilnehmerTabelle.tsx
│   ├── ZusammenfassungsLeiste.tsx
│   └── SusDetailPanel.tsx (Slide-in)
└── BeendetPhase.tsx       (Zusammenfassung + Export)
```

## Neue Apps-Script-Aktionen

| Aktion | Beschreibung |
|--------|-------------|
| `ladeKlassenlisten` | Liest Klassenlisten-Sheet, gibt gruppierte SuS zurück |
| `sendeEinladungen` | Sendet E-Mail mit Prüfungslink an ausgewählte SuS |
| `setzeTeilnehmer` | Speichert Teilnehmer-Array in Prüfungs-Config |

Bestehende Aktionen die erweitert werden:
- `speicherePruefung` — `teilnehmer`-Feld + `beendetUm`-Feld hinzufügen
- `ladePruefung` — `teilnehmer`-Feld + `beendetUm`-Feld zurückgeben
- Heartbeat-Handler — `aktuelleFrage` (Index) vom SuS-Client entgegennehmen und im Sheet speichern

## Annahmen & Einschränkungen

- **Single-Session:** Es wird angenommen, dass die LP das Monitoring in einem Browser-Tab bedient. Multi-Tab wird nicht explizit gesperrt, aber alle Aktionen (Freischalten, Beenden) sind **idempotent** — ein doppelter Klick hat keinen Effekt, da der Sheet-Zustand geprüft wird.
- **Daten-Grösse:** `teilnehmer[]` wird als JSON in einer Sheet-Zelle gespeichert. Bei 40 SuS × ~120 Bytes ≈ 5KB — weit unter dem 50.000-Zeichen-Limit von Google Sheets.
