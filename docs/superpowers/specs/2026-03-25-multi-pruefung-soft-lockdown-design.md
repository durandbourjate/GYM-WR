# Design: Multi-Prüfungs-Dashboard + Soft-Lockdown

> Datum: 25.03.2026
> Status: Entwurf
> Projekt: Prüfungsplattform (ExamLab/)

---

## 1. Übersicht

Zwei zusammenhängende Features für die Prüfungsplattform:

1. **Multi-Prüfungs-Dashboard:** LP kann mehrere Prüfungen gleichzeitig in einem Browser-Tab verwalten (Use-Case: Nachprüfungstermin mit verschiedenen Prüfungen parallel).

2. **Soft-Lockdown:** SEB-unabhängige Sicherheitsmassnahmen direkt in der Web-App. 3 Stufen (Locker/Standard/Streng), pro Prüfung konfigurierbar, mit automatischer Geräteerkennung und -anpassung.

---

## 2. Feature 1: Multi-Prüfungs-Dashboard

### 2.1 Use-Case

Nachprüfungstermin: LP beaufsichtigt gleichzeitig z.B. 3 Prüfungen (VWL 29c, Recht 28bc, BWL 29c). Jede Prüfung hat eigene Fragen, Config und Teilnehmer.

**Abgrenzung:** Gemeinsames Prüfen (mehrere Klassen, gleiche Prüfung) funktioniert bereits — alle Klassen in einem Dashboard einladen. Kein Handlungsbedarf.

### 2.2 Architektur

#### Einstieg: Multi-Prüfungs-URL

Neue URL-Struktur für Multi-Modus:
```
?ids=pruefung-a,pruefung-b,pruefung-c
```

Bestehende Einzel-URL (`?id=pruefung-a`) bleibt unverändert.

Bei ungültigen oder nicht-existierenden IDs in der `?ids=`-Liste: UI zeigt Fehlermeldung pro ungültige Prüfung und lädt die restlichen normal.

#### Phasen-Handling

| Phase | Verhalten |
|-------|-----------|
| **Vorbereitung** | Pro Prüfung separat: Teilnehmer einladen, Config prüfen. Tab-artige Navigation zwischen Prüfungen. |
| **Lobby** | Pro Prüfung separat: Freischalten unabhängig voneinander. |
| **Live-Monitoring** | **Zusammengefasst:** Eine Übersicht, SuS pro Prüfung gruppiert. |
| **Ergebnisse** | Pro Prüfung separat. |
| **Korrektur** | Pro Prüfung separat. |

#### State-Architektur

Aktuell: `DurchfuehrenDashboard` hält State lokal in React-State (nicht im globalen Store). Das ist gut — kein Store-Konflikt.

Für Multi-Modus:
- Array von `pruefungId`s statt einzelner ID
- State pro Prüfung in einem `Map<pruefungId, DashboardState>`
- Monitoring-Polling für alle Prüfungen parallel (ein `ladeMonitoring()` pro Prüfung, alle 5s)
- Backend braucht keine Änderungen — alle Endpoints sind bereits per `pruefungId` parametrisiert

#### UI-Konzept: Live-Monitoring

Spaltenreihenfolge:
```
Name | Status | Verstösse | Kontrolle | Gerät | Frage (X/Y) | Fortschritt (Progressbar)
```

- SuS **pro Prüfung gruppiert** mit klappbarem Header
- Header zeigt: Prüfungsname, Klasse, Kontrollstufe, Zusammenfassung (X aktiv, Y abgegeben, Z gesperrt)
- Zusammenfassungs-Badges oben: Total aktiv/abgegeben/gesperrt über alle Prüfungen
- Gesperrte SuS in normaler Liste (rot hinterlegt, Entsperren-Button inline)
- Verstoss-Details per Mouse-Over (Tooltip mit Zeitstempel + Typ)

### 2.3 Einschränkungen

- SuS können weiterhin nur eine Prüfung gleichzeitig im gleichen Browser schreiben (Store-Isolation). Für Nachprüfungstermine kein Problem — jeder SuS schreibt nur eine.
- Multi-Modus ist rein LP-seitig. SuS-Flow ändert sich nicht.

---

## 3. Feature 2: Soft-Lockdown

### 3.1 Drei Kontrollstufen

#### 🟢 Locker
- Tab-Wechsel loggen + **Warnung an SuS**
- Kein Vollbild erzwungen
- Kein Copy/Paste-Block
- **Zielgruppe:** Übungen, formative Tests

#### 🟡 Standard (Default)
- Copy/Paste blockiert (`oncopy`, `onpaste`, `oncut` → `preventDefault`)
- Rechtsklick blockiert (`oncontextmenu` → `preventDefault`)
- DevTools-Keyboard-Sperren (F12, Ctrl+Shift+I/J/C, Cmd+Option+I/J/C)
- Vollbild erzwingen auf Laptops (`requestFullscreen()` beim Prüfungsstart)
- Tab-Wechsel-Erkennung + **Warnung an SuS mit Zähler**
- Split-View-Erkennung auf iPad (Viewport-Breite-Änderung)
- **3 Verstösse → Prüfung gesperrt, LP muss entsperren**
- Verstoss-Zähler für LP konfigurierbar (Default: 3)
- **Zielgruppe:** Reguläre Prüfungen

#### 🔴 Streng
- Alles von Standard
- Vollbild-Verlust → Prüfung sofort pausiert (nicht erst nach 3 Verstössen)
- SEB empfohlen (Info-Banner wenn nicht im SEB)
- **Zielgruppe:** Summative Prüfungen, Matura-Simulationen

### 3.2 Automatische Geräteerkennung

Bei SuS-Login wird das Gerät erkannt:
- **Laptop** (Windows/Mac/Linux): Alle Features verfügbar
- **iPad/Tablet** (iOS/iPadOS/Android): Kein `requestFullscreen()`, kein Gesten-Block → automatisches Downgrade

Downgrade-Regeln:
| LP wählt | Laptop | iPad |
|----------|--------|------|
| Locker | Locker | Locker |
| Standard | Standard | Standard (ohne Vollbild) |
| Streng | Streng | Standard (ohne Vollbild) |

LP sieht im Monitoring den **effektiven** Kontrollgrad pro SuS (z.B. "🟡→🟢 auto").

**Streng auf iPad:** Da Vollbild nicht möglich ist, entfällt "sofort pausiert bei Vollbild-Verlust". Split-View-Erkennung folgt auf iPad immer dem Zähler-Modell (Standard-Verhalten), auch wenn LP Streng gewählt hat.

Erkennung via User-Agent:
```typescript
function erkenneGeraet(): 'laptop' | 'tablet' | 'unbekannt' {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.maxTouchPoints > 1 && /Mac/.test(ua))) return 'tablet'
  if (/Android/.test(ua) && !/Mobile/.test(ua)) return 'tablet'
  return 'laptop'
}
```

### 3.3 Kontrollgrad-Konfiguration

**In der Vorbereitung (pro Prüfung):**
- Segmented Control: Locker / Standard / Streng
- Info-Text unter der Auswahl erklärt was aktiv ist
- Hinweis: "Auf iPads wird die Stufe automatisch angepasst"

**Im Monitoring (pro SuS):**
- LP kann einzelne SuS hoch-/runterstufen
- iPad-Einschränkungen bleiben (Streng nicht wählbar auf iPad)
- Änderung wird sofort wirksam (nächster Heartbeat)

### 3.4 Verstoss-Typen

| Verstoss | Erkennung | Locker | Standard | Streng |
|----------|-----------|--------|----------|--------|
| Tab-Wechsel | `visibilitychange` (≥2s) | Log + Warnung | Log + Warnung + Zähler | Sofort pausiert |
| Copy/Paste-Versuch | `oncopy/onpaste/oncut` | — | Blockiert + Log + Warnung | Blockiert + Log + Warnung |
| Vollbild verlassen | `fullscreenchange` Event | — | Log + Warnung + Zähler | Sofort pausiert |
| Split-View (iPad) | `resize` Event (Breite <90% Original) | — | Log + Warnung + Zähler | Log + Warnung + Zähler |
| Rechtsklick | `contextmenu` Event | — | Blockiert (kein Zähler) | Blockiert |
| DevTools-Shortcut | `keydown` Event | — | Blockiert (kein Zähler) | Blockiert |

**Nur Tab-Wechsel, Vollbild-Verlust und Split-View zählen als Verstösse für den Zähler.** Copy/Paste und Rechtsklick werden blockiert und gewarnt, erhöhen aber den Zähler nicht.

### 3.5 SuS-Warnung bei Verstoss

Overlay (ganzer Bildschirm, nicht schliessbar ausser per Button):
```
⚠️
Tab-Wechsel erkannt
Dieser Verstoss wurde protokolliert (2 von 3)

Das Verlassen der Prüfung ist nicht erlaubt.
Bei 3 Verstössen wird die Prüfung gesperrt
und muss von der Lehrperson freigeschaltet werden.

[Zurück zur Prüfung]
```

Bei Sperre (3/3):
```
🔒
Prüfung gesperrt
Du hast 3 Verstösse begangen.

Deine Prüfung wurde gesperrt.
Wende dich an die Lehrperson zur Freischaltung.
Deine bisherigen Antworten sind gespeichert.
```

### 3.6 LP-Monitoring: Verstoss-Anzeige

- Spalte "Verstösse" im Monitoring: `—` / `⚠️ 1/3` / `⚠️ 2/3` / `🔒 3/3`
- Farbcodierung: 0 = grau, 1 = amber, 2 = orange, 3 = rot
- **Mouse-Over Tooltip:** Liste aller Verstösse mit Zeitstempel und Typ
- Bei Sperre: "Entsperren"-Button inline in der SuS-Zeile
- Entsperren setzt Zähler auf 0 zurück

### 3.7 Vollbild-Flow (Laptop, Standard/Streng)

1. SuS klickt "Prüfung starten"
2. App ruft `document.documentElement.requestFullscreen()` auf
3. Browser zeigt native Bestätigung → SuS bestätigt
4. Prüfung startet im Vollbild
5. Bei `fullscreenchange` Event (Vollbild verlassen):
   - **Standard:** Warnung + Zähler + 1, Aufforderung zurück ins Vollbild
   - **Streng:** Prüfung sofort pausiert, Overlay

**Wenn SuS Fullscreen ablehnt** (Browser-Bestätigung verweigert):
- Prüfung startet trotzdem (kein Hard-Block)
- LP sieht im Monitoring: "Vollbild: Nein"
- Zählt als 1 Verstoss

### 3.8 iPad-spezifische Massnahmen

- Kein `requestFullscreen()` (nicht unterstützt)
- PWA-Empfehlung: Info-Banner "Für beste Prüfungserfahrung: App zum Home-Bildschirm hinzufügen"
- CSS: `-webkit-touch-callout: none` (Long-Press-Menü unterdrücken)
- CSS: `user-select: none` auf Fragentext (kein Text-Auswählen)
- Split-View-Erkennung: `window.resize` Event → wenn Breite <90% der ursprünglichen Breite → Verstoss
- `visibilitychange` funktioniert zuverlässig auf iPads

### 3.9 Heartbeat-Erweiterung

Bestehender Heartbeat (alle 10s) wird erweitert:

**SuS → Backend (zusätzliche Felder):**
```typescript
{
  // bestehend
  pruefungId, email, aktuelleFrageIndex, beantworteteFragen,
  // neu
  geraet: 'laptop' | 'tablet',
  vollbild: boolean,
  kontrollStufe: 'locker' | 'standard' | 'streng', // effektiv
  verstossZaehler: number,
  gesperrt: boolean,
  neusteVerstoesse: Verstoss[] // seit letztem Heartbeat, bei Netzwerkfehler lokal gequeued und beim nächsten erfolgreichen Heartbeat nachgeliefert
}
```

**Backend → SuS (zusätzliche Felder):**
```typescript
{
  // bestehend
  beendetUm, sebAusnahme,
  // neu
  kontrollStufeOverride?: 'locker' | 'standard' | 'streng', // LP-Änderung
  entsperrt?: boolean // LP hat entsperrt
}
```

### 3.10 Backend-Änderungen (Apps Script)

Minimale Änderungen:

1. **`heartbeat` Endpoint:** Neue Felder speichern (`geraet`, `vollbild`, `kontrollStufe`, `verstossZaehler`, `gesperrt`, `verstoesse`)
2. **`ladeMonitoring` Endpoint:** Neue Felder zurückgeben
3. **`speichereConfig` Endpoint:** `kontrollStufe` Feld (Default: 'standard')
4. **Neuer Endpoint `entsperreSuS(pruefungId, email, schuelerEmail)`:** LP-Auth via `email` (konsistent mit bestehenden Endpoints). Setzt `entsperrt=true` im Monitoring-Sheet, SuS liest es beim nächsten Heartbeat.
5. **Neuer Endpoint `setzeKontrollStufe(pruefungId, email, schuelerEmail, stufe)`:** LP-Auth via `email`. Überschreibt Kontrollstufe für einzelne SuS.

### 3.11 Kombination mit SEB

Soft-Lockdown und SEB sind unabhängig und ergänzen sich:

| Konfiguration | Effekt |
|--------------|--------|
| Locker + kein SEB | Minimaler Schutz (nur Logging) |
| Standard + kein SEB | Guter Schutz (Soft-Lockdown) |
| Standard + SEB | Sehr guter Schutz (doppelte Absicherung) |
| Streng + SEB | Maximaler Schutz |

`sebErforderlich` bleibt als separate Config-Option bestehen.

---

## 4. Neue Dateien (geschätzt)

```
src/hooks/useLockdown.ts              — Zentral-Hook: Vollbild, Copy/Paste, DevTools, Verstoss-Zähler
src/hooks/useGeraetErkennung.ts       — Geräteerkennung + Fullscreen-Capability
src/components/VerstossOverlay.tsx     — SuS-Warnung bei Verstoss
src/components/SperreOverlay.tsx       — SuS-Sperre bei 3 Verstössen
src/components/lp/MultiDashboard.tsx   — Multi-Prüfungs-Container
src/components/lp/KontrollStufeSelect.tsx — Segmented Control für Kontrollgrad
```

## 5. Geänderte Dateien (geschätzt)

```
src/components/lp/DurchfuehrenDashboard.tsx — Multi-Prüfungs-Support
src/components/lp/AktivPhase.tsx            — Verstoss-Spalte, Kontrollgrad, Entsperren
src/components/lp/VorbereitungPhase.tsx     — Kontrollgrad-Auswahl
src/components/lp/TeilnehmerListe.tsx       — Gerät + Kontrollgrad pro SuS
src/components/Startbildschirm.tsx          — Vollbild-Trigger beim Start
src/components/Layout.tsx                   — useLockdown-Hook einbinden
src/hooks/usePruefungsMonitoring.ts         — Heartbeat-Felder erweitern
src/hooks/useTabKonflikt.ts                — In useLockdown integrieren
src/services/monitoringApi.ts              — Neue Felder
src/types/fragen.ts                        — Verstoss-Typ, Kontrollstufe-Typ
apps-script-code.js                        — Endpoints erweitern
```

---

## 6. Nicht im Scope

- Guided Access / MDM-Integration für iPads (OS-Level, nicht in Web-App machbar)
- Kamera-Überwachung
- IP-basierte Standort-Prüfung
- Browser-Extension als SEB-Alternative
- Multi-Prüfungs-Korrektur (bleibt pro Prüfung)
