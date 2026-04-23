# Backend-Migration ExamLab — Sammeldokument

> **Zweck:** Infos zur geplanten Migration weg von Google Apps Script bündeln — Datenschutz-Rahmen, Hosting-Optionen, Kostenrahmen, Mail-Entwürfe.
>
> **Vorgeschichte:** Ein früheres, ausführliches `Pruefung/PLANUNGSDOKUMENT_v2.md` (1'065 Zeilen, 13 Kap. + 8 Anhänge) wurde in Session 107 beim Ordner-Rename gelöscht. Dieses Dokument rekonstruiert die Kernbefunde aus dem damaligen Chatverlauf. Die ursprüngliche Recherche (Sek-II-Leitfaden, Supabase-Rechtslage, peaknetworks-Profil) sollte vor verbindlicher Verwendung **verifiziert** werden — Regelungen und Anbieter-Profile können sich geändert haben.
>
> **Stand:** 20.04.2026.

---

## 1. Ausgangslage

ExamLab läuft heute auf **Google Apps Script + Google Sheets**. Drei Probleme:

1. **Langsam.** Untere Grenze pro Call: ~1.5–2s (HTTPS-Handshake + V8-Container-Init + Spreadsheet-Auth). Pro Prüf-Klick ~5.9s. Quelle: `ExamLab/HANDOFF.md:395-400`, `.claude/rules/code-quality.md:107-117`.
2. **Nicht sauber DSG-konform.** Google Sheets ist ein US-Dienst (CLOUD Act). Prüfungsergebnisse mit Noten gelten nach Sek-II-Leitfaden des Kantons Bern als **vertraulich** → Public Cloud bei US-Anbieter ist nicht zulässig (siehe Kap. 3).
3. **Schlecht skalierbar.** Apps-Script-Quoten (6 min Laufzeit, Trigger-Caps), keine echte Multi-Tenancy, Datenmodell über Sheets an der Grenze.

**Ziel:** Latenz pro Korrektur-Call **< 300 ms** (Edge/Server-Ziel), sauberer Datenschutz-Rahmen, tragfähige Grundlage für Multi-User-Skalierung.

---

## 2. Architektur-Voraussetzungen (bereits erfüllt)

- **Adapter-Pattern:** `AppsScriptAdapter` implementiert alle Backend-Interfaces → neuer Adapter genügt, Frontend bleibt. Quelle: `docs/superpowers/specs/2026-04-02-lernplattform-design.md:483`.
- **Frontend-Aggregation:** bei Migration auf Postgres wird SQL-RPC möglich, Frontend-Aggregation bleibt als Fallback. Quelle: `docs/superpowers/specs/2026-04-05-fortschritt-lernziele-design.md:330-335`.
- **Datenmodell:** Fragensammlung + Gruppen-Registry + Fortschritts-Sheets sind 1:1 in Postgres abbildbar.

---

## 3. Datenschutz-Rahmen (KERN)

**Quelle:** „Leitfaden Austausch, Verarbeitung und Speicherung von Daten an Schulen Sek II", v2.0 Juni 2025 (DSA-reviewt, durch Petra Heck an Niklaus Streit weitergeleitet — Gmail-Thread vom 11.09.2025, Anhang auf `~/Desktop/Leitfaden-Austausch_…_Sek_II (11).pdf`). Zusatzquellen: lp-sl.bkd.be.ch Datenschutzlexikon, educa.ch, edulog.ch, DLH-Handreichung KI.

### 3.1 Klassifizierung unserer Daten

| Datenart | Klassifizierung | Public Cloud US? | Public Cloud CH? | Private Cloud (Self-Hosted CH)? |
|---|---|---|---|---|
| Login / E-Mail-Adressen | intern | zulässig | zulässig | zulässig |
| Übungs-Antworten (formativ, kein Bewertungseffekt) | intern | grenzwertig | zulässig | zulässig |
| **Prüfungsergebnisse mit Noten** | **vertraulich** | **nicht zulässig** | bedingt (DSFA) | zulässig |
| Korrekturen + Musterlösungen | vertraulich | nicht zulässig | bedingt (DSFA) | zulässig |

**Konsequenz:** Sobald summative Prüfungen mit Noten im System laufen, ist die Public Cloud bei einer US-Firma ausgeschlossen — auch mit Zürich-Region. Grund: US-Firma = CLOUD Act = US-Behörden können Zugriff erzwingen, unabhängig vom Datenstandort.

### 3.2 Was das für die Hosting-Wahl bedeutet

- ✅ **Zulässig:** Server unter schweizerischer/europäischer Jurisdiktion + volle Kontrolle über Verschlüsselungsschlüssel (Self-Hosting ODER managed bei CH/AT/EU-Firma).
- ⚠️ **Bedingt zulässig:** Public Cloud einer CH/EU-Firma mit DSFA und DSA-Freigabe.
- ❌ **Nicht zulässig für vertrauliche Daten:** Supabase Cloud Pro, Vercel, Firebase, AWS, GCP, Azure — auch mit CH-Region.

### 3.3 Pflichten vor dem Go-Live

1. **Datenschutz-Folgenabschätzung (DSFA)** erstellen. Kontakt: Digitalboard Sek II (`digitalboard-sek2@be.ch`) — hilft bei Vorlage und kann an kantonale DSA eskalieren.
2. **Auftragsverarbeitungsvertrag (DPA / AVV)** mit dem Hosting-Anbieter.
3. **Datenschutzerklärung + Einwilligungen** für SuS / Eltern (Empfehlung: von DSA prüfen lassen).
4. **Technische Massnahmen:** Verschlüsselung at-rest, TLS 1.3, rollenbasierter Zugriff, Audit-Log, Backups mit dokumentiertem Restore.

---

## 4. Hosting-Optionen

### Option A — Schul-Server „Smartlearn" (Gym Hofwil)

Server im Schulnetz, keine dritte Partei involviert.

- **Kosten:** CHF 0 (bereits vorhanden)
- **Datenschutz:** ✅ Ideal — Daten verlassen das Schulnetz nicht
- **Verfügbarkeit:** ⚠️ abhängig von Schulnetz, Strom, IT-Wartung
- **Erreichbarkeit extern (SuS zu Hause):** nur mit Port-Freigabe/Reverse-Proxy/VPN — Abklärung mit Schulinformatik
- **Skalierbarkeit:** ❌ nur für Gym Hofwil, andere Schulen können nicht angebunden werden
- **Einsatzfall:** Pilotphase für Eigenbedarf, solange kein SaaS-Vertrieb geplant ist

### Option B — peaknetworks (österreichisch-schweizerisch) ⭐ FAVORIT

| Merkmal | Detail |
|---|---|
| Hauptsitz | peaknetworks Hosting GmbH, Innsbruck (AT), gegr. 2013, 11–50 MA |
| Schweiz-Präsenz | peaknetworks Schweiz GmbH, Rotkreuz ZG, seit Juni 2024 |
| Rechenzentrum CH | RZO Gais (Ostschweiz), Tier IV, ISO 27001, eigene HPE-Server |
| Jurisdiktion | AT/CH, kein US-Bezug → **kein CLOUD Act** |
| Angebot | Managed Container Hosting mit Supabase als vorkonfigurierter App |
| Preise | EUR 39/Mt (3 CPU, 4 GB RAM, 50 GB) oder EUR 79/Mt (4 CPU, 8 GB RAM, 100 GB) |
| Inklusive | Tägliche Backups (10 Tage), Firewall, SSH, Control Panel, gratis Ersteinrichtung |
| Einschränkungen | Kein explizites PITR, kein 99.9%-SLA, Firmengrösse klein |

**Warum Favorit:** Einzige Option mit „managed Supabase auf Schweizer Tier-IV-RZ ohne CLOUD-Act-Risiko" — passt genau zum Preisrahmen CHF 50–80/Mt (Erinnerung aus früherer Session).

**Offene Fragen an peaknetworks (siehe Mail-Entwurf §8.4):**
1. Supabase-Updates — automatisch oder manuell?
2. PITR oder nur tägliche pg_dump-Snapshots?
3. SLA mit Uptime-Garantie?
4. Support-Prozess, Reaktionszeiten, 24/7 oder Bürozeiten?
5. DPA/AVV für CH-DSG?
6. Skalierung wenn mehrere Schulen dazukommen?
7. Erfahrung mit Supabase Auth, Realtime, Edge Functions?
8. Exit-Strategie wenn Dienst eingestellt wird?
9. Datenresidenz: garantiert nur RZO Gais, keine Replikation ausserhalb CH?
10. Monitoring auf Applikations-Ebene verfügbar?

### Option C — Self-Hosting auf CH-VPS (Exoscale / Infomaniak)

Eigener VPS, Supabase selbst betreiben. Optional mit **Coolify** (Open-Source-PaaS) als Admin-Oberfläche.

- **Anbieter CH:** Exoscale (Swisscom-Tochter, ZH + GVA), Infomaniak (Genf/VD), Nine.ch (ZH), Hidora (VD)
- **Kosten:** CHF 50–80/Mt für 4 vCPU / 8 GB / 100 GB SSD
- **Datenschutz:** ✅ CH-Jurisdiktion, volle Kontrolle über Schlüssel
- **Wartungsaufwand:** 2–5 h/Mt (Updates, Backup-Kontrolle, OS-Patches)
- **Coolify:** reduziert DevOps-Hürde deutlich. Achtung: Jan-2026 elf kritische CVEs offengelegt (alle gepatcht) — Admin-Panel via VPN/IP-Whitelist absichern.
- **Einsatzfall:** wenn peaknetworks ausfällt oder bei Bedarf nach maximaler Kontrolle.

### Option D — Supabase Cloud Pro ❌ NICHT ZULÄSSIG

Technisch ideal (25 $/Mt, Zürich-Region eu-central-2, automatisches PITR, 99.9% SLA, Auto-Scaling). Aber:

- Supabase Inc. = Delaware Corporation → CLOUD Act
- Sub-Processors teils in USA (AWS, PostHog, Sentry)
- Keine Customer-Managed Encryption Keys → Supabase hat Klartextzugang
- Nach Sek-II-Leitfaden: Public Cloud eines US-Anbieters für vertrauliche Daten → **nicht zulässig**

**Status:** Abgelegt, ausser US-Rechtsrahmen ändert sich fundamental.

---

## 5. Kostenanalyse

Annahmen: Exoscale/peaknetworks-Preisbereich, 2 Prüfungen/LP/Mt, ~25 SuS/Prüfung, ~8 KI-korrigierte Fragen pro Prüfung, KI-Mix Haiku/Sonnet mit Prompt Caching.

### Fixkosten (unabhängig von Nutzer-Zahl)

| Komponente | 1–20 LP | 100 LP | 1'000 LP |
|---|---|---|---|
| VPS / managed Supabase | CHF 25–50 | CHF 45–80 | CHF 120+ |
| Managed PostgreSQL | inkl. | CHF 35 | CHF 80+ |
| Object Storage | CHF 3 | CHF 8 | CHF 25 |
| Domain + DNS | CHF 2 | CHF 2 | CHF 2 |
| Monitoring + Backups | CHF 0 (Free) | CHF 5 | CHF 45 |
| Email (Resend/Postmark) | CHF 0 | CHF 5 | CHF 20 |
| **Total Fixkosten/Mt** | **~CHF 50** | **~CHF 95** | **~CHF 292** |

### Variable Kosten (pro LP pro Monat)

| Komponente | CHF/LP/Mt |
|---|---|
| KI-Korrektur (400 Calls, Caching + Batch) | 3.00 |
| Speicher (~50 MB/LP) | 0.10 |
| DB-Compute | 0.20 |
| Bandwidth | 0.05 |
| Payment-Fee (bei Abo CHF 8/Mt, Stripe 2.9%+0.30) | 0.55 |
| **Total variabel/LP/Mt** | **~CHF 3.90** |

### Gesamt-Szenarien

| Szenario | Fixkosten | Variabel | Total/Mt | Pro LP/Mt | Bei CHF 8/LP Abo: Gewinn/Mt |
|---|---|---|---|---|---|
| Allein (1 LP) | 50 | 3.90 | **54** | 54.00 | −46 |
| Fachschaft (5 LP) | 50 | 19.50 | **70** | 14.00 | −30 |
| Gym Hofwil (20 LP) | 50 | 78 | **128** | 6.40 | +32 |
| 5 Schulen (100 LP) | 95 | 390 | **485** | 4.85 | +315 |
| 50 Schulen (1'000 LP) | 292 | 3'900 | **4'192** | 4.19 | +3'808 |

**Break-Even bei CHF 8/LP/Mt: ~13 LP.**

Für Gym Hofwil allein (20 LP): CHF ~1'500/Jahr. Zum Vergleich: isTest2-Schullizenz CHF 130/Jahr für 20 LP — aber ohne KI-Korrektur, ohne 20 Fragetypen, ohne Realtime-Monitoring.

---

## 6. Offene Fragen & Stand (20.04.2026)

| Frage | Stand |
|---|---|
| Timeline (Migrationsstart) | offen, hängt von Budget ab |
| Evento REST-API | beantragt, Antwort steht aus (Martin Essig, 30.03.2026 — Datenschutz-Vorbehalt) |
| Pilotschulen | informelles Interesse vorhanden |
| Budget / Finanzierungsträger | Abklärung mit Schulleitung läuft (Gmail-Entwurf 20.04.2026) |
| Rechtsberatung DSE/AGB | DSA/Digitalboard Sek II zuerst kontaktieren |
| Domain | `examlab.ch` gekauft, Aktivierung später |
| Migrationsstrategie | **Greenfield parallel** — neue App bauen, alte läuft bis Cut-over weiter |
| Datenmigration bestehender Sheets | offen (Fragensammlung ja, Schüler-Antworten wahrscheinlich nein) |

---

## 7. Empfohlene Phasenstrategie

1. **Phase 0 (jetzt):** Schulleitung-Finanzierungsantrag senden (Gmail-Entwurf), parallel DSA/Digitalboard-Kontakt, parallel Schul-IT-Abklärung Smartlearn-Server.
2. **Phase 1 (nach SL-Freigabe):** peaknetworks kontaktieren (Mail §8.4), DSFA-Vorlage vom Digitalboard beziehen.
3. **Phase 2 (Pilot):** Schul-Server (Option A) ODER peaknetworks-Trial (Option B) aufsetzen, Greenfield-Migration der Datenschicht.
4. **Phase 3:** Parallelbetrieb alt/neu, gezieltes Migrieren der Fragensammlung. SuS-Antworten bleiben in Sheets bis Semesterende.
5. **Phase 4:** Cut-over, Apps-Script abschalten.
6. **Phase 5 (später):** Öffnung für weitere Schulen, Abo-Modell (CHF 8/LP/Mt oder Schullizenz).

---

## 8. Mail- und Gesprächsentwürfe

> Alle Texte sind **Vorschläge zur Bearbeitung**. Prüfen vor Versand.

### 8.1 Schulleitung — Antrag Finanzierung

**Bestehender Gmail-Entwurf:** Thread `19daa132b50ebf92`, Betreff „Antrag Finanzierung managed Server für Schulinnovationsprojekt DUY" (20.04.2026). Den Entwurf als Primärfassung nutzen und mit folgenden Punkten abgleichen:

- Verweis auf Sek-II-Leitfaden Kap. 2.2 + 3 als rechtliche Begründung, warum Google Sheets für Prüfungsdaten nicht mehr tragbar ist
- Kostenrahmen CHF 50–80/Mt (~CHF 600–960/Jahr) mit Verweis auf peaknetworks-Angebot
- Bitte um Zuweisung zu Fachkredit WR, Innovations-Projektbudget (80h bewilligt) oder IT-Budget
- Angebot: DSFA selbst erstellen, Schulleitung nur Kenntnisnahme + Finanzierung

### 8.2 Schul-IT / Schulinformatiker — Smartlearn-Server-Abklärung

**An:** Christian Salvisberg / Martin Essig / zuständige Person Schulinformatik
**Betreff:** Backend-Migration ExamLab — Abklärung Smartlearn-Server und Datenschutz-Rahmen

```
Hallo [Name]

Vielen Dank für die Rückmeldung zur Evento-REST-Schnittstelle im März
und die Datenschutz-Hinweise. Ich bin jetzt in der Planungsphase für
die Backend-Migration von ExamLab weg von Google Apps Script. Der
Sek-II-Leitfaden (Juni 2025) verlangt für Prüfungsergebnisse mit
Noten eine Lösung unter schweizerischer Jurisdiktion — Google Sheets
fällt damit mittelfristig weg.

Drei Fragen, bei denen mir eure Einschätzung wichtig ist:

1. SMARTLEARN-SERVER
   Könnte die neue Backend-Komponente (Supabase als Docker-Stack)
   auf dem bestehenden Schul-Server laufen? Konkret:
   - Ist Docker/Docker-Compose erlaubt/installiert?
   - Wäre eine Port-Freigabe 443/HTTPS nach aussen möglich, damit
     SuS von zu Hause zugreifen können?
   - Wie ist die aktuelle Uptime/Zuverlässigkeit (Strom, Backup)?
   - Wer übernimmt Wartung wenn ich nicht verfügbar bin?

2. EXTERNER ANBIETER (FALLS SCHUL-SERVER NICHT GEHT)
   Mein Favorit wäre peaknetworks (AT/CH, Rechenzentrum Gais,
   kein CLOUD Act). Gibt es seitens Schule/Kanton Bedenken oder
   eine Anbieter-Whitelist, die ich kennen sollte?

3. EVENTO-API
   Stand meiner Anfrage vom 29.03.? Ich würde den REST-Zugang
   für Klassenlisten-Sync ins neue Backend einplanen.

Eine technische Kurzdokumentation zur geplanten Architektur kann
ich beilegen. Für einen 15–30-Minuten-Austausch bin ich jederzeit
verfügbar.

Beste Grüsse
Yannick Durand
```

### 8.3 Digitalboard Sek II — DSFA-Beratung

**An:** `digitalboard-sek2@be.ch`
**Betreff:** Anfrage DSFA-Beratung für eigenentwickelte Prüfungs-Plattform (Gymnasium Hofwil)

```
Sehr geehrte Damen und Herren

Am Gymnasium Hofwil entwickle ich im Rahmen eines bewilligten
Schulinnovations-Projekts (80 Stunden) eine digitale Übungs- und
Prüfungsplattform für das Schwerpunktfach Wirtschaft und Recht
(ExamLab). Die Plattform wird von allen meinen SF-WR-Klassen
genutzt und umfasst rund 2'300 Fragen in 26 Themenpools.

Die Plattform läuft aktuell auf Google Apps Script und Google Sheets.
Gemäss Leitfaden "Austausch, Verarbeitung und Speicherung von Daten
an Schulen Sek II" (v2.0, Juni 2025) ist diese Lösung für
Prüfungsergebnisse und Korrekturen (Klassifizierung: vertraulich)
mittelfristig nicht mehr tragbar. Ich plane deshalb die Migration
auf eine eigene Backend-Lösung unter schweizerischer Jurisdiktion.

Favorisierte Architektur:
- Backend: Supabase (Open-Source, PostgreSQL + Auth + Realtime)
- Hosting: Entweder Schul-Server (Smartlearn) oder
  peaknetworks (AT/CH, Rechenzentrum Gais, ISO 27001)
- Volle Kontrolle über Verschlüsselungsschlüssel
- Row-Level Security für Multi-Tenancy
- Audit-Log, verschlüsselte Speicherung, TLS 1.3

Vier Fragen, bei denen ich auf eure Unterstützung hoffe:

1. Stellt ihr eine DSFA-Vorlage oder ein Gerüst zur Verfügung,
   das ich für dieses Projekt nutzen kann?
2. Gibt es eine Liste bereits geprüfter / freigegebener Hosting-
   Anbieter im kantonalen Rahmen?
3. Könntet ihr (oder die kantonale DSA) den Pflicht-Prüfbericht
   erstellen, sobald DSFA und technisches Konzept vorliegen?
4. Gibt es vergleichbare Initiativen an anderen Gymnasien des
   Kantons Bern, mit denen ein Austausch sinnvoll wäre?

Eine 1-seitige Projektkurzbeschreibung und ein Architektur-Diagramm
kann ich beilegen. Für einen Termin (vor Ort oder online) stehe ich
gerne zur Verfügung.

Beste Grüsse
Yannick Durand
Gymnasium Hofwil, Münchenbuchsee
yannick.durand@gymhofwil.ch
```

### 8.4 peaknetworks — Anbieter-Anfrage

**An:** `info@peaknetworks.net` (oder CH-Kontakt falls separat: `schweiz@peaknetworks.ch`)
**Betreff:** Anfrage Managed Supabase Hosting für Schweizer Gymnasium (Datenschutz-kritisch)

```
Sehr geehrte Damen und Herren

Ich bin Gymnasiallehrer am Gymnasium Hofwil (Kanton Bern) und
entwickle eine eigene Übungs- und Prüfungsplattform (ExamLab)
für Wirtschaft und Recht. Die Plattform wird aktuell von rund
150 Schülerinnen und Schülern in 5 Klassen genutzt und soll
schrittweise auch anderen Schulen geöffnet werden.

Für die Migration weg vom aktuellen Google-Apps-Script-Backend
suche ich einen managed Supabase Anbieter unter schweizerischer
oder österreichischer Jurisdiktion. Ihr Angebot (Rechenzentrum
Gais, Tier IV, ISO 27001, kein US-Bezug) passt sehr gut zu den
Anforderungen des kantonalen Sek-II-Datenschutz-Leitfadens.

Bevor ich eine Entscheidung treffe, hätte ich zehn Fragen:

1. Wie läuft der Update-Prozess für Supabase ab (automatisch
   vs. manuell, Testing vor Produktion)?
2. Bietet ihr Point-in-Time-Recovery (PITR) oder nur tägliche
   pg_dump-Snapshots?
3. Gibt es ein SLA mit Uptime-Garantie (Prozent, Entschädigung)?
4. Wie sieht der Support-Prozess aus — Reaktionszeiten,
   24/7 oder Bürozeiten, Kanal (Ticket, Telefon, E-Mail)?
5. Könnt ihr einen DPA/AVV nach Schweizer DSG und EU-DSGVO
   zur Verfügung stellen?
6. Wie sieht die Skalierung aus, wenn mehrere Schulen (bis
   ~1'000 LP / ~15'000 SuS) auf die Plattform zugreifen?
7. Habt ihr konkrete Erfahrung mit Supabase Auth, Realtime
   und Edge Functions (Deno Runtime)?
8. Exit-Strategie: Welche Optionen hätte ich, falls peaknetworks
   den Dienst einstellt? Wie werden Daten exportiert/migriert?
9. Garantiert ihr, dass Daten ausschliesslich im Rechenzentrum
   Gais verarbeitet werden (keine Replikation nach AT)?
10. Gibt es ein Application-Level-Monitoring (Logs, Metriken,
    Alerts) oder empfehlt ihr einen externen Dienst?

Dimensionierung für den Start:
- ~150 gleichzeitige Nutzer zu Prüfungsspitzen
- ~50 MB DB, ~2 GB Storage (PDFs, Bilder)
- ~100k Edge Function Invocations/Monat
- Daten: Login-E-Mails, Übungsantworten, Prüfungsergebnisse
  mit Noten, Musterlösungen (Klassifizierung: vertraulich)

Ich freue mich über eure Rückmeldung und stehe für Rückfragen
gerne zur Verfügung.

Freundliche Grüsse
Yannick Durand
Gymnasium Hofwil, Münchenbuchsee BE
yannick.durand@gymhofwil.ch
```

---

## 9. Was Self-Hosting konkret bedeutet

> „Eigener Server" heisst **mieten, nicht kaufen.** Ein VPS ist eine Art „Wohnung in einem Rechenzentrum".

### Setup (einmalig, 1–2 Tage)

1. VPS bei Exoscale/Infomaniak bestellen (Web-Formular, Kreditkarte), Standort Zürich, Grösse 4 vCPU / 8 GB / 100 GB SSD
2. SSH-Zugang einrichten, Firewall konfigurieren
3. Coolify installieren (One-Liner-Install)
4. Supabase-Stack deployen (offizielle docker-compose.yml)
5. SSL-Zertifikat (Let's Encrypt, automatisch)
6. Backup-Strategie konfigurieren (Exoscale Object Storage oder S3-kompatibel)
7. DNS-Eintrag für Domain setzen

### Laufender Betrieb (2–5 h/Monat)

- OS-Patches / Docker-Updates einspielen
- Backup-Restore regelmässig testen (min. 1×/Quartal)
- Uptime-Monitoring (UptimeRobot, Free)
- Alerts prüfen, ggf. eingreifen

### Verantwortlichkeiten

| Anbieter (Exoscale) | Ich |
|---|---|
| Hardware, Strom, Netzwerk, Kühlung | Software auf dem Server |
| Physische Sicherheit | Updates, Backup-Config, Firewall, Monitoring |
| VM-Neustart bei Hardware-Ausfall | Applikations-Recovery |
| DDoS-Schutz (Basis) | Zugriffskontrolle, RLS-Config |

**Bei peaknetworks (Option B) entfällt vieles davon** — peaknetworks betreibt den Supabase-Stack, ich konfiguriere nur Anwendung und Nutzer.

---

## 10. Quellen im Repo und extern

**Im Repo:**
- `ExamLab/HANDOFF.md:395-404` — Speed-Befund, Latenz-Untergrenze
- `.claude/rules/code-quality.md:107-117` — Apps-Script-Plattform-Limit
- `docs/superpowers/specs/2026-04-02-lernplattform-design.md:483` — Adapter-Pattern
- `docs/superpowers/specs/2026-04-05-fortschritt-lernziele-design.md:30-35, 297-335` — Supabase-Kompatibilität
- Memory: `project_backend_migration.md` (ab heute)

**Extern (verifizieren):**
- `~/Desktop/Leitfaden-Austausch_Verarbeitung_und_Speicherung_von_Daten_an_Schulen_Sek_II (11).pdf` — **zentrale rechtliche Grundlage**
- `~/Downloads/unterlagen-datenschutz-leitfaden (1).pdf` — Volksschule-Leitfaden
- lp-sl.bkd.be.ch Datenschutzlexikon (Rechtsgrundlagen + datenschutzrechtliche Grundsätze)
- educa.ch — Informations- und Datensicherheit in der Schule
- edulog.ch — Umgang mit Daten und Datenschutz
- dlh.zh.ch — Handreichung für die Anwendung von KI-Systemen
- Privatim-Resolution 11/2025 (zu Google-Sheets-Nutzung an Schulen)

**Gmail-Threads (relevant):**
- `19daa132b50ebf92` — Schulleitungs-Entwurf „Antrag Finanzierung managed Server" (20.04.2026)
- `19d3ef3742ba4499` — Protokoll KK W13 (30.03.2026)
- `19d16a4dc0aefa50` — Schnittstelle Evento (Christian Salvisberg, 22.–23.03.2026)
- `19d3a758ac399f9a` — Fwd Evento + Martin Essig Datenschutz-Vorbehalt (29.–30.03.2026)
- `19937835630df2a7` — Leitfaden Datenschutz (Petra Heck → Niklaus Streit, 11.09.–13.10.2025)

---

## 11. Nächste konkrete Schritte

1. **Heute/diese Woche:** Schulleitungs-Entwurf in Gmail finalisieren und senden
2. **Parallel:** Mail an Digitalboard Sek II (§8.3)
3. **Nach SL-Rückmeldung:** Schul-IT kontaktieren (§8.2), Smartlearn-Server-Option klären
4. **Nach DSA/Digitalboard-Rückmeldung:** peaknetworks-Anfrage senden (§8.4)
5. **Bei positiver Finanzierung und grünem Datenschutz-Licht:** DSFA erstellen, Trial-Setup bei peaknetworks oder auf Schul-Server, Greenfield-Migration starten
