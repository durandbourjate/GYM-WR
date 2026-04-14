# Planungsdokument: Pruefungsplattform v2 — Zukunftssichere Architektur

> Lebendes Dokument. Letzte Aktualisierung: 29.03.2026
> Status: Entwurf — Recherche + Konzeptphase (erste Runde abgeschlossen)

## Context

Die Pruefungsplattform ist produktiv im Einsatz (20 Fragetypen, ~50'000 LOC, Live-Tests seit 25.03.2026). Das aktuelle Backend (Google Sheets + Apps Script) hat sich als Prototyp bewaehrt, stoesst aber an Grenzen:

- **Datenschutz:** Google Sheets ist fuer Leistungsdaten (Noten) gemaess Privatim-Entscheid 11/2025 und Kanton Bern nicht DSG-konform (US CLOUD Act, besonders schuetzenswerte Personendaten)
- **Performance:** Apps Script hat 30-Sekunden-Timeouts, 90KB-Cache-Limit, kein Realtime (Polling alle 10–30s)
- **Skalierbarkeit:** Single-Tenant, manuelle Konfiguration via Sheets, keine Multi-School-Faehigkeit
- **Sicherheit:** Session-Tokens in Apps Script (3h TTL, rate-limited) — aber kein echtes Auth-Framework
- **Wartung:** Backend-Aenderungen erfordern manuelles Kopieren in Apps Script Editor + neue Bereitstellung

**Ziel:** Ein zukunftssicheres, datenschutzkonformes, skalierbares Backend, das das Tool als selbsttragendes (oder profitables) SaaS-Produkt fuer Schweizer Schulen positioniert.

---

## Uebersicht: Geplante Struktur & Infrastruktur

### Infrastruktur-Stack

| Schicht | Technologie | Standort |
|---------|------------|----------|
| **Frontend** | React 19 + TypeScript + Vite (bleibt) | GitHub Pages / Cloudflare Pages |
| **Backend** | Supabase Self-Hosted (PostgreSQL + Auth + Realtime + Storage + Edge Functions) | **Exoscale** (Swisscom, Schweizer RZ) |
| **Datenbank** | PostgreSQL (Managed bei Exoscale) | Schweiz |
| **Dateien** | Supabase Storage (Materialien, Audio, PDFs) | Schweiz |
| **KI** | Claude API + OpenAI (Multi-Provider, serverseitig via Edge Functions) | API-Calls, keine Daten gespeichert |
| **CDN** | Cloudflare (nur statische Assets, keine Nutzerdaten) | Global |

### Architektur-Diagramm

```
┌─────────────────────────────────────────────┐
│  React PWA (bestehend)                      │
│  Supabase Client SDK statt apiClient.ts     │
│  IndexedDB Offline-Cache (bleibt)           │
└──────────────┬──────────────────────────────┘
               │ TLS 1.3 / WebSockets (wss://)
┌──────────────▼──────────────────────────────┐
│  Supabase Self-Hosted (Docker auf Exoscale) │
│  ├── Auth (Google OAuth, Magic Links, Code) │
│  ├── Realtime (WebSockets statt Polling)    │
│  ├── Edge Functions (KI, Exports, Emails)   │
│  └── Storage (Dateien)                      │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  PostgreSQL (Managed, Exoscale CH)          │
│  ├── Row-Level Security (school_id/Zeile)   │
│  ├── Rollen: Admin > School > LP > SuS     │
│  ├── Audit-Log (append-only)                │
│  └── Verschluesselt at Rest                 │
└─────────────────────────────────────────────┘
```

### Multi-Tenancy (Kern-Idee)

**Eine Datenbank, alle Schulen.** Jede Zeile hat eine `school_id`. PostgreSQL RLS (Row-Level Security) stellt sicher, dass Schule A niemals Daten von Schule B sieht — auf DB-Level, nicht nur im Code. Das JWT-Token enthaelt die `school_id` als Claim.

### Rollen-Hierarchie

```
Platform Admin (Betreiber) → sieht alles
  └── School Admin (IT-Person) → verwaltet eigene Schule
        └── LP → eigene Pruefungen + geteilte
              └── SuS → nur eigene Antworten, nur aktive Pruefung
```

### Was sich aendert vs. bleibt

| Bleibt | Aendert sich |
|--------|-------------|
| React + Zustand + Tailwind | Google Sheets → PostgreSQL |
| 20 Fragetypen | Apps Script → Supabase Edge Functions |
| IndexedDB Offline-Cache | Polling → Realtime (WebSockets) |
| Soft-Lockdown | Selbstgebaute Auth → Supabase Auth |
| PWA + Service Worker | Manuelle Config → Admin-Panel |
| Demo-Modus | Single-Tenant → Multi-Tenant |

---

## 1. Datenschutz & Compliance

### 1.1 Anwendbares Recht

**Wichtig:** Fuer oeffentliche Schulen (inkl. Gymnasien) gilt NICHT das eidgenoessische nDSG, sondern das **kantonale Datenschutzgesetz (KDSG, BSG 152.04)**. Das nDSG (seit 01.09.2023) gilt nur fuer Bundesbehoerden und Private.

| Regelwerk | Relevanz |
|-----------|----------|
| **KDSG** (BSG 152.04) | Kantonales Datenschutzgesetz — massgebend fuer Gym Hofwil |
| **DSV** (BSG 152.040.1) | Datenschutzverordnung Kanton Bern |
| **ISDS DV** (BSG 152.040.2) | Direktionsverordnung ueber Informationssicherheit und Datenschutz |
| **DVBS** | Direktionsverordnung ueber Beurteilung und Schullaufbahnentscheide |
| **Privatim-Resolution** (18.11.2025) | Internationale Clouds fuer sensible Behoerdendaten unzulaessig (CLOUD Act) |
| **Sek-II-Leitfaden** (v2.0, 19.06.2025) | "Austausch, Verarbeitung und Speicherung von Daten an Schulen Sek II" — von DSA reviewt und freigegeben |

**Quellen:**
- [Rechtsgrundlagen Volksschule BE](https://www.lp-sl.bkd.be.ch/de/start/schulleitungen/datenschutzlexikon/rechtsgrundlagen.html)
- [Datenschutzrechtliche Grundsaetze BE](https://www.lp-sl.bkd.be.ch/de/start/schulleitungen/datenschutzlexikon/datenschutzrechtliche-grundsaetze.html)
- [educa.ch — Informationssicherheit Schule](https://www.educa.ch/de/taetigkeiten/fragen-aus-der-bildungspraxis/informations-und-datensicherheit-der-schule-und-im)
- [Privatim-Resolution](https://www.privatim.ch/de/privatim-verabschiedet-resolution-zu-internationalen-cloud-losungen/)
- Sek-II-Leitfaden (PDF, BKD/MBA, Version 2.0)
- Volksschul-Leitfaden (PDF, ERZ/AKVB)

### 1.2 Datenklassifizierung (Sek-II-Leitfaden, Kap. 2.2)

Der Kanton Bern klassifiziert Schuldaten in 4 Stufen. Das hoechste Schutzniveau gilt.

| Klassifizierung | Beschreibung | Beispiele aus dem Pruefungstool |
|-----------------|-------------|-------------------------------|
| **GEHEIM** | Schwere Gefahr fuer Leib/Leben | Im Schulumfeld sehr selten. Nicht relevant. |
| **VERTRAULICH** | Besonders schuetzenswerte Personendaten | **Notenspiegel, Notenlisten, Zeugnisse, formative Beurteilungen, Nachteilsausgleich-Daten, Pruefungsergebnisse mit Personenbezug** |
| **INTERN** | Allgemeine Personendaten | **Klassenlisten (Name, E-Mail, Klasse), Schularbeiten OHNE Bewertung, Stundenplan mit LP-Namen** |
| **NICHT KLASSIFIZIERT** | Oeffentliche Informationen | **Unterrichtsvorbereitungen, Pruefungsfragen ohne Personenbezug, Uebungspools** |

### 1.3 Erlaubte Speicherorte pro Klassifizierung

Aus dem Sek-II-Leitfaden (Kap. 3, Tabelle S. 7):

| Klassifizierung | E-Mail | Public Cloud (M365, Google, Supabase Cloud) | Private Cloud (Nextcloud, Self-Hosted) | Lokale Festplatte (verschluesselt) | Fachapplikation (Evento) |
|-----------------|--------|---------------------------------------------|----------------------------------------|------------------------------------|--------------------------|
| **VERTRAULICH** | NEIN | **NEIN** | JA (mit DSFA + DSA-Pruefbericht) | JA | JA |
| **INTERN** | JA | JA | JA | JA | JA |
| **NICHT KLASS.** | JA | JA | JA | JA | JA |

**Konkreter Befund zu M365 via EDUBERN (Kap. 5.1):** Die Microsoft-Cloud-Palette von EDUBERN ist "nicht zusaetzlich oder speziell abgesichert und darf daher auch nicht fuer die Ablage von Daten der Klassifizierungen 'vertraulich' und 'geheim' genutzt werden." Fuer vertrauliche Daten bietet EDUBERN den Service "Private Cloud Data Storage" (Nextcloud).

### 1.4 Konsequenz fuer das Pruefungstool

Das Pruefungstool verarbeitet Daten auf ALLEN Stufen:

| Datenkategorie | Klassifizierung | Public Cloud erlaubt? |
|---------------|----------------|----------------------|
| Pruefungsfragen (ohne Personenbezug) | NICHT KLASSIFIZIERT | JA |
| Klassenlisten (Name, E-Mail, Klasse) | INTERN | JA |
| SuS-Antworten OHNE Bewertung | INTERN | JA |
| SuS-Antworten MIT Bewertung/Punkte | **VERTRAULICH** | **NEIN** |
| Korrektur-Ergebnisse, Noten | **VERTRAULICH** | **NEIN** |
| Nachteilsausgleich, Zeitzuschlaege | **VERTRAULICH** | **NEIN** |
| Lockdown-Verstoesse (Pruefungsordnung) | **VERTRAULICH** | **NEIN** |

**Ergebnis:** Sobald Antworten mit Punkten/Noten verknuepft sind, sind sie VERTRAULICH. Public-Cloud-Dienste (Supabase Cloud, Google Sheets, Firebase, AWS) sind dafuer **nicht zulässig** — unabhaengig davon ob die Region Zuerich, Frankfurt oder anderswo liegt. Entscheidend ist die **US-Jurisdiktion** des Anbieters (CLOUD Act).

### 1.5 Kann Supabase Cloud trotzdem genutzt werden?

**Supabase Cloud — Faktencheck:**
- Firma: Supabase, Inc. (Delaware Corporation, USA) → **unterliegt CLOUD Act**
- Region Zuerich (eu-central-2): Seit August 2024 verfuegbar
- DPA: Vorhanden, deckt GDPR + Swiss DSG ab, mit SCCs
- SOC 2 Type 2: Vorhanden. ISO 27001: Noch nicht.
- Verschluesselung: AES-256 at rest (AWS-managed), TLS in transit
- **Kritisch:** Serverseitige Verschluesselung — Supabase hat Zugang zu Klartextdaten
- **Kritisch:** DPA Klausel 6.2 sagt Daten werden "primarily" (nicht ausschliesslich) in der Region verarbeitet
- Sub-Processors: AWS, Google Analytics, Sentry, PostHog, OpenAI — teils US-basiert
- Kein Customer-Managed Encryption Keys (im Gegensatz zu AWS/Azure)

**Bewertung nach Sek-II-Leitfaden:**
Supabase Cloud ist eine **Public Cloud** eines **US-Anbieters** → fuer VERTRAULICHE Daten (Noten, Korrekturen) **nicht zulaessig**. Die Zuerich-Region aendert daran nichts, weil:
1. US CLOUD Act erlaubt US-Behoerden Datenzugriff unabhaengig vom Serverstandort
2. Keine clientseitige E2E-Verschluesselung (Supabase hat Klartextzugang)
3. Privatim-Resolution verlangt Verschluesselung, bei der der Provider keinen Schluessel hat

### 1.6 Hosting-Entscheid

**Self-Hosting auf Schweizer Infrastruktur ist fuer VERTRAULICHE Daten zwingend.**

Es gibt aber einen pragmatischen Mittelweg:

| Datenkategorie | Hosting | Begruendung |
|---------------|---------|-------------|
| **App-Frontend** (React PWA) | GitHub Pages / Cloudflare Pages | Kein Personendaten-Zugriff, nur statische Assets |
| **NICHT KLASS. + INTERN** (Fragen, Klassenlisten) | Koennte theoretisch Public Cloud sein | Aber: Trennung ist komplex, besser alles zusammen |
| **VERTRAULICH** (Antworten, Noten, Korrekturen) | **Self-Hosted auf Schweizer Server** | Sek-II-Leitfaden, Privatim-Resolution |

**Empfehlung: Alles auf einem Self-Hosted Supabase auf Schweizer Server.** Die Trennung von Daten auf verschiedene Backends waere zu komplex und fehleranfaellig. Supabase Self-Hosted ist technisch identisch mit Supabase Cloud, aber unter voller eigener Kontrolle.

### 1.7 KI-Nutzung und Datenschutz

Aus dem Sek-II-Leitfaden (Kap. 4):

| Regel | Umsetzung im Pruefungstool |
|-------|---------------------------|
| Keine Daten eingeben, die Personen eindeutig identifizieren | ✅ Bereits implementiert: DATENSCHUTZ-Guards in allen KI-Prompts, keine SuS-Namen/E-Mails |
| Keine KI-Systeme mit persoenlichen SuS-Accounts | ✅ KI laeuft serverseitig via Edge Function, SuS haben keinen direkten KI-Zugang |
| Anonymisierte/pseudonymisierte Plattformen bevorzugen | ✅ Claude API = kein SuS-Account, nur API-Key der LP/Schule |
| Microsoft Copilot (unkontrollierbarer Datenabfluss) vermeiden | ✅ Nicht verwendet |
| KI nur als Hilfsmittel, nicht als Ersatz fuer Bewertung | ✅ LP muss KI-Korrektur immer pruefen und bestaetigen |

**API-Aufrufe an Claude/OpenAI:** Die KI-Prompts enthalten nur Fragetext + anonymisierte Antwort + Bewertungsraster. Keine Personendaten. Dies ist gemaess Leitfaden zulaessig.

### 1.8 Erforderliche Massnahmen

| Massnahme | Prioritaet | Status |
|-----------|-----------|--------|
| Self-Hosted Supabase auf Schweizer Server (Exoscale/Infomaniak) | MUSS | Geplant |
| ISDS-Analyse / Datenschutz-Folgenabschaetzung (DSFA) erstellen | MUSS | Offen |
| DSFA der kantonalen Datenschutzaufsichtsstelle (DSA) vorlegen | MUSS | Offen |
| Datenschutzerklaerung fuer Schulen erstellen | MUSS | Offen |
| Auftragsverarbeitungsvertrag (AVV) als Vorlage | MUSS | Offen |
| Transport-Verschluesselung TLS 1.3 | MUSS | Supabase Default |
| Speicher-Verschluesselung AES-256 at rest | MUSS | Exoscale Managed PG |
| Zugriffsprotokollierung (Audit-Trail) | MUSS | Geplant |
| Rollenbasierte Zugriffskontrolle (RLS) | MUSS | Geplant |
| MFA fuer Lehrpersonen | SOLL | Supabase Auth unterstuetzt es |
| Recht auf Loeschung / Datenexport pro Schule | MUSS | Geplant |
| Aufbewahrungsfristen implementieren (15 Jahre fuer Beurteilungen) | MUSS | Geplant |
| Pseudonymisierung bei KI-Aufrufen | MUSS | ✅ Bereits implementiert |
| Kontakt beim Digitalboard Sek II aufnehmen (digitalboard-sek2@be.ch) | SOLL | Offen |

### 1.9 Grundsaetze fuer Softwareentwicklung (Sek-II-Leitfaden, Kap. 7.3)

Der Leitfaden empfiehlt fuer schulische Software explizit:
- **"Public Money, Public Code"** — Open Source bevorzugen → ✅ Supabase ist Open Source
- **Modularitaet** — offene Standards, keine Inselloesungen → ✅ PostgreSQL, REST/GraphQL
- **Privacy by Design + Security by Design** — Datenschutz ab Konzeptphase → ✅ RLS, DSFA
- **Vermeidung Vendor-Lock-in** — Anbieterwechsel muss moeglich sein → ✅ Standard PostgreSQL, exportierbar
- **Fruehzeitige ISDS-Analyse** — vor Entwicklung, nicht danach → In Arbeit
- **Partizipation** — Nutzer einbeziehen → ✅ LP-Feedback seit Session 1

---

## 2. Empfohlener Tech Stack

### Backend: Supabase Self-Hosted

**Warum Supabase?** (Vergleich mit 6 Alternativen durchgefuehrt)
- PostgreSQL mit nativem Row-Level Security (RLS) — ideal fuer Multi-Tenancy
- Integrierte Auth (Email/Password, OAuth, Magic Links)
- Realtime via WebSockets (ersetzt Polling-Heartbeat)
- Storage fuer Dateien (Materialien, Audio, PDFs)
- Edge Functions fuer serverseitige Logik (KI-Korrektur, Exports)
- Open Source, vollstaendig self-hostbar
- Grosses Ecosystem, aktive Entwicklung, TypeScript SDK

**Verworfen:**
- PocketBase: Pre-1.0, Einpersonen-Projekt, kein RLS
- Firebase: US-Firma, nicht DSG-konform
- Appwrite: Kein natives RLS, kleinere Community
- Custom Node/Express: Zu hoher Aufwand fuer Auth, Security, Realtime
- Cloudflare D1: Keine CH-Datenresidenz, kein Auth

### Hosting: 4 Optionen im Vergleich

#### Option A: Schul-Server (Smartlearn, Gym Hofwil)

| Aspekt | Bewertung |
|--------|-----------|
| **Kosten** | CHF 0 (bereits vorhanden) |
| **DSG-Konformitaet** | ✅ Bestens — physisch in der Schule, kein Dritter involviert |
| **Kontrolle** | ✅ Volle Kontrolle |
| **Verfuegbarkeit** | ⚠️ Abhaengig von Schul-Netz, Strom, IT-Wartungsfenster |
| **Erreichbarkeit** | ⚠️ Braucht Port-Freigabe (443/HTTPS) nach aussen fuer SuS-Zugriff |
| **Wartung** | ⚠️ Schulinformatiker muss involviert sein |
| **SaaS-Faehigkeit** | ❌ Nur fuer Gym Hofwil nutzbar, andere Schulen koennen nicht zugreifen |

**Klaerungsbedarf mit Schulinformatiker:**
- Kann auf dem Smartlearn-Server Docker laufen?
- Ist eine Port-Freigabe (443/HTTPS) nach aussen moeglich?
- Wie zuverlaessig ist der Server (Uptime, Strom, Backup)?
- Welches OS laeuft? (Ubuntu/Debian ideal fuer Coolify)
- Wieviel RAM/CPU/Storage ist verfuegbar?

#### Option B: Managed Supabase bei peaknetworks (AT/CH) — Detailbewertung

**Firma:**
- peaknetworks Hosting GmbH, Innsbruck (AT), gegruendet 2013, 11–50 Mitarbeiter
- peaknetworks Schweiz GmbH, Rotkreuz ZG, seit Juni 2024, CHE-153.705.140
- Rechenzentrum: **RZO Gais (Ostschweiz)** — Tier IV (Uptime Institute), ISO 27001, eigene HPE-Server
- **Kein CLOUD-Act-Risiko** — rein AT/CH-Firma, eigene Hardware, keine US-Hyperscaler

**Angebot und Preise:**

| Plan | CPU | RAM | SSD | Preis |
|------|-----|-----|-----|-------|
| Standard | 3 | 4 GB | 50 GB | **EUR 39/Mt** |
| Performance | 4 | 8 GB | 100 GB | **EUR 79/Mt** |

Inklusive: Taegliche Backups (10 Tage Retention), Firewall, SSH-Zugang, Control Panel, **gratis Ersteinrichtung durch Techniker**.

**Bewertung:**

| Aspekt | Bewertung | Detail |
|--------|-----------|--------|
| Datenschutz/DSG | ✅ Sehr gut | AT/CH-Firma, Schweizer Tier-IV-RZ, kein CLOUD Act |
| Preis | ✅ Gut | EUR 39–79/Mt, guenstiger als Self-Hosting auf Exoscale |
| Komfort vs. Self-Hosting | ✅ Besser | Ersteinrichtung gratis, Support, Backups inkl. |
| Komfort vs. Supabase Cloud | ⚠️ Weniger | Kein PITR, kein Auto-Scaling, kein publiziertes SLA |
| Firmengroesse | ⚠️ Klein | 11–50 MA, CH-GmbH erst seit 2024 mit CHF 20'000 Stammkapital |
| Supabase-Expertise | ⚠️ Unklar | Eher generischer Container-Hoster als Supabase-Spezialist |
| Langfristige Zuverlaessigkeit | ⚠️ Risiko | Kleine Firma, Abhaengigkeit — Exit-Strategie klaeren |
| SaaS-Faehigkeit | ✅ Ja | Oeffentlich erreichbar, skalierbar (groesseren Plan waehlen) |

**Offene Fragen fuer Erstkontakt:**

1. Wie laufen Supabase-Updates (neue Versionen)? Automatisch oder muss ich das anstossen?
2. Gibt es PITR (Point-in-Time-Recovery) oder nur taegliche pg_dump-Backups?
3. Gibt es ein SLA mit Uptime-Garantie (z.B. 99.5%+)?
4. Support-Prozess: Reaktionszeiten? 24/7 oder Buerozeiten?
5. Koennt ihr ein DPA (Auftragsverarbeitungsvertrag) stellen, das das Schweizer DSG (KDSG Bern) abdeckt?
6. Wie funktioniert Skalierung, wenn mehrere Schulen dazukommen? (Groesserer Plan? Mehrere Instanzen?)
7. Habt ihr Erfahrung mit Supabase Auth, Realtime, Edge Functions — oder nur PostgreSQL + PostgREST?
8. Was passiert wenn peaknetworks den Dienst einstellt? (Datenmigration, Kuendigungsfrist)
9. Kann ich die Supabase-Konfiguration selbst anpassen (docker-compose, Env-Variablen)?
10. Ist Monitoring/Alerting enthalten (z.B. Benachrichtigung bei hoher DB-Last oder Container-Crash)?

**Gesamtfazit:** Vielversprechendste externe Option. EUR 39–79/Mt fuer managed Supabase auf Schweizer Tier-IV-RZ ohne CLOUD Act — besser als selbst hosten (weniger Aufwand) und besser als Supabase Cloud (DSG-konform). Ein Erstkontakt lohnt sich definitiv.

[peaknetworks.com/server-cloud/hosting/supabase](https://www.peaknetworks.com/server-cloud/hosting/supabase)

#### Option C: VPS bei Exoscale/Infomaniak (Self-Hosted)

| Anbieter | Vorteil | Nachteil | Kosten |
|----------|---------|----------|--------|
| **Exoscale** (Swisscom) | Managed PostgreSQL, DSG-konform, CH-Standort | Teurer | ~EUR 50–150/Mt |
| **Infomaniak** | Guenstiger, managed PG (neu!), 100% Schweizer Personal | — | ~EUR 50–80/Mt |
| Hetzner (DE) | Sehr guenstig | Nicht Schweiz, DSG-Grauzone | ~EUR 30–50/Mt |

#### Option D: Supabase Cloud Pro (Zuerich-Region)

| Aspekt | Bewertung |
|--------|-----------|
| **Kosten** | $25/Mt (Pro) |
| **Komfort** | ✅ Maximaler Komfort — PITR, Auto-Updates, SLA 99.9% |
| **DSG-Konformitaet** | ❌ US-Firma (CLOUD Act), fuer VERTRAULICHE Daten nicht zulaessig |

Technisch ideal, rechtlich nicht zulaessig fuer Pruefungsdaten (siehe Kap. 1.5).

#### Empfohlene Strategie: Phasenweise

```
Phase 1 — Eigenbedarf (jetzt/Sommer 2026):
  Falls Schul-Server geeignet → Option A (CHF 0, maximaler Datenschutz)
  Falls nicht → Option C (Infomaniak/Exoscale VPS, CHF 50–80/Mt)

Phase 2 — Multi-School / SaaS (spaeter):
  Option B (peaknetworks managed Supabase, CH-Server) pruefen
  Oder Option C skalieren (groesserer VPS)
```

**Quellen:**
- [Exoscale Pricing](https://www.exoscale.com/pricing/)
- [Infomaniak Public Cloud](https://www.infomaniak.com/en/hosting/public-cloud/prices)
- [peaknetworks Supabase](https://www.peaknetworks.com/server-cloud/hosting/supabase)
- [Elestio Supabase (IE/EU)](https://elest.io/open-source/supabase)
- [WZ-IT Managed Supabase (DE)](https://wz-it.com/en/expertises/supabase/)

### Frontend: Bestehender React-Stack (beibehalten)

React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 bleibt. Migration betrifft nur die Datenschicht:
- `apiClient.ts` → Supabase Client SDK
- Apps Script Endpoints → Supabase Edge Functions + RLS-Queries
- Google OAuth → Supabase Auth (kann weiterhin Google als Provider nutzen)
- IndexedDB Offline-Cache → bleibt (Offline-First beibehalten)

---

## 3. Architektur

### Multi-Tenancy: Shared DB + Row-Level Security

```
schools
  ├── school_members (user ↔ school, mit Rolle)
  ├── exams (school_id + RLS)
  ├── questions (school_id + RLS)
  ├── answers (school_id + RLS)
  ├── corrections (school_id + RLS)
  └── school_config (Faecher, Noten, Branding)
```

- Jede Tabelle hat `school_id` — PostgreSQL RLS filtert automatisch
- JWT Custom Claim `school_id` wird bei Login gesetzt
- Selbst bei App-Bugs: DB-Layer verhindert Tenant-Uebergriffe
- Migrations betreffen alle Tenants gleichzeitig

### Rollen-Hierarchie

```
Platform Admin (Betreiber)
  └── School Admin (IT-Verantwortliche/r)
        └── Department Head (Fachgruppen-Leitung, optional)
              └── Teacher (LP)
                    └── Student (SuS, nur waehrend Pruefung)
```

RLS-Policies pro Rolle:
- **Platform Admin:** Zugriff auf alle Tenants (fuer Support/Monitoring)
- **School Admin:** Voller Zugriff innerhalb eigener Schule, LP verwalten, Config aendern
- **Teacher:** Eigene Pruefungen + geteilte (Berechtigungsmodell wie jetzt)
- **Student:** Nur eigene Antworten lesen/schreiben, nur aktive Pruefungen sehen

### Realtime statt Polling

| Feature | Aktuell (Polling) | Neu (Realtime) |
|---------|-------------------|----------------|
| Live-Monitoring | Heartbeat alle 10s | WebSocket-Subscription auf `answers` + `heartbeats` |
| Status-Updates | LP pollt alle 5s | Push-Notification bei Aenderung |
| Pruefungsende-Signal | SuS pollt Heartbeat | Realtime-Broadcast an alle SuS |
| Nachrichten LP→SuS | SuS pollt | Realtime-Channel pro Pruefung |

Reduktion API-Last um geschaetzt 80-90%, deutlich schnellere Reaktionszeiten.

---

## 4. Sicherheit & Fraud Prevention

### 4.1 Authentifizierung

| Aspekt | Aktuell | Neu |
|--------|---------|-----|
| LP-Login | Google OAuth (Domain-Check) | Supabase Auth + Google OAuth (Multi-Provider) |
| SuS-Login | Schuelercode oder Google | Supabase Auth + Magic Link + Code |
| Session | sessionStorage + selbstgebauter Token | Supabase JWT (auto-refresh, httpOnly optional) |
| Rate Limiting | Apps Script Cache (5 Versuche/15min) | Supabase + Edge Function (konfigurierbar) |

### 4.2 Datensicherheit

**Transport:**
- TLS 1.3 fuer alle Verbindungen (Supabase Default)
- WebSocket-Verbindungen ebenfalls verschluesselt (wss://)
- HSTS-Header erzwingen

**Speicherung:**
- PostgreSQL: Encryption at Rest (Exoscale Managed = automatisch)
- Backups: Verschluesselt, taegliche automatische Snapshots
- Sensible Felder (z.B. API-Keys): Zusaetzlich verschluesselt in DB (pgcrypto)

**Client-seitig (Browser):**
- localStorage/IndexedDB enthaelt nur eigene Antworten (wie bisher)
- **Neu:** Antworten client-seitig hashen (Integritaetspruefung)
- Service Worker cached nur App-Shell, keine Pruefungsdaten
- sessionStorage fuer Auth-Token (Tab-gebunden, kein XSS-Zugriff ueber Tabs)

### 4.3 Fraud Prevention (SuS-Manipulation)

| Angriffsvektor | Aktuell | Neu |
|----------------|---------|-----|
| **localStorage manipulieren** | SuS koennte Antworten aendern | Server ist Source of Truth, lokale Daten nur Cache. Manipulation wird beim naechsten Save ueberschrieben. Hash-Vergleich erkennt Tampering. |
| **API-Calls faelschen** | Theoretisch moeglich (Endpoint + Session-Token sichtbar) | RLS: SuS kann nur eigene Zeile schreiben, nur waehrend Pruefung aktiv. Edge Function validiert Zeitfenster + Pruefungs-Status. |
| **Andere SuS-Antworten lesen** | Apps Script prueft Session — sollte nicht moeglich sein | RLS: `auth.uid() = student_id` in Policy. DB-Level, nicht App-Level. |
| **Pruefungsfragen vorab sehen** | Config-Endpoint liefert nur bei aktiver Pruefung | RLS: Fragen nur sichtbar wenn `exam.status = 'aktiv'` UND SuS in Teilnehmerliste |
| **Noten/Korrektur aendern** | Kein Schreibzugriff fuer SuS | RLS: Korrektur-Tabelle nur LP-schreibbar. SuS = read-only nach Freigabe. |
| **DevTools / Console** | Soft-Lockdown blockiert F12 | Lockdown bleibt. Zusaetzlich: Server validiert alle Writes. Client-seitige Checks sind nur UX, nicht Security. |

**Grundsatz:** Server + DB = Security. Client = UX. Alles was im Browser laeuft, ist manipulierbar. Deshalb:
- Alle Berechtigungspruefungen auf DB-Level (RLS)
- Alle Schreiboperationen serverseitig validieren
- Client-seitige Lockdown-Checks sind Abschreckung, nicht Schutz

### 4.4 Audit-Trail

Alle sicherheitsrelevanten Aktionen loggen:
- Login-Versuche (erfolgreich + gescheitert)
- Antwort-Speicherungen (Timestamp, Hash, IP)
- Lockdown-Verstoesse
- Admin-Aktionen (LP-Verwaltung, Config-Aenderungen)
- Daten-Exporte

PostgreSQL Trigger + separate `audit_log`-Tabelle (append-only, kein DELETE fuer Nicht-Admins).

---

## 5. Benutzer-Rollen & Admin-Interface

### Self-Service Admin-Panel

Aktuell wird alles manuell in Google Sheets konfiguriert. Neu:

| Funktion | Wer | Beschreibung |
|----------|-----|--------------|
| **Schule registrieren** | Platform Admin | Name, Domain, Abo-Plan, Branding |
| **LP verwalten** | School Admin | Hinzufuegen/Entfernen, Rolle zuweisen, Fachschaften |
| **Faecher konfigurieren** | School Admin | Fachbezeichnungen, Farben, Lehrplan-Referenzen |
| **Notenskala** | School Admin | 1-6 (CH), 1-15 (DE), Punkte, custom |
| **SEB-Defaults** | School Admin | Standard-Lockdown-Stufe, Whitelist-URLs |
| **KI-Einstellungen** | School Admin | Erlaubte Modelle, Budget-Limit, BYOK-Option |
| **Abo verwalten** | School Admin | Plan anzeigen, Nutzung, Rechnungen |
| **Klassen importieren** | School Admin / LP | CSV/Evento-Import, manuelle Eingabe |
| **Statistiken** | School Admin | Nutzung, Pruefungsanzahl, KI-Credits verbraucht |

Das Admin-Panel ist eine eigene View im bestehenden React-Frontend (kein separates Tool).

---

## 6. Preismodell

### Markt-Benchmark (Schweiz/Europa)

| Tool | Preis | Modell |
|------|-------|--------|
| isTest2 (CH) | CHF 5/aktive LP/Jahr | Gruppenlizenz |
| Classtime (CH) | $5/LP/Monat | Subscription |
| Socrative | $90/LP/Jahr | K-12 |

**Quellen:** [isTest2 Preise](https://istest2.ch/staticdocs/de/prices.de.html), [Classtime Premium](https://www.classtime.com/en/premium)

### Empfohlenes Modell: Freemium + Schullizenz

| Plan | Preis | Enthalten |
|------|-------|-----------|
| **Free** | CHF 0 | 1 LP, 3 Pruefungen/Monat, 50 SuS, kein KI, 5 Fragetypen |
| **Teacher** | CHF 8/LP/Monat (oder CHF 80/Jahr) | Unbegrenzte Pruefungen, alle 20 Fragetypen, KI-Korrektur (200 Korrekturen/Mt), Fragenbank |
| **School** | CHF 500–1'500/Jahr (nach Groesse) | Alle LP, Admin-Panel, Evento-Integration, erhoehtes KI-Limit, Priority Support |
| **KI-Zusatz** | CHF 5 / 500 Korrekturen | Ueber Limit hinaus, oder BYOK (kostenlos) |

### Detaillierte Kostenanalyse

#### Annahmen

| Parameter | Wert |
|-----------|------|
| Hosting | Exoscale (Schweiz, Managed PostgreSQL) |
| KI-Modell | Mix: Haiku fuer einfache, Sonnet fuer komplexe Korrekturen |
| KI-Optimierung | Prompt Caching + Batch API (ca. 70% Ersparnis) |
| Pruefungen pro LP/Monat | ~2 |
| SuS pro Pruefung | ~25 |
| KI-korrigierte Fragen pro Pruefung | ~8 (Rest auto-korrigiert) |

#### Fixkosten (monatlich, unabhaengig von Nutzeranzahl)

| Komponente | 1–20 LP | 100 LP | 1'000 LP |
|------------|---------|--------|----------|
| VM (Supabase Services) | CHF 25 (2 vCPU, 4GB) | CHF 45 (4 vCPU, 8GB) | CHF 120 (8 vCPU, 16GB + Replica) |
| Managed PostgreSQL | CHF 20 (Small) | CHF 35 (Medium) | CHF 80 (Large + Replicas) |
| Object Storage (50–500GB) | CHF 3 | CHF 8 | CHF 25 |
| Domain + DNS | CHF 2 | CHF 2 | CHF 2 |
| Monitoring (Sentry, Uptime) | CHF 0 (Free Tier) | CHF 0 | CHF 30 (Paid Tier) |
| Email-Service (Resend/Postmark) | CHF 0 (Free Tier) | CHF 5 | CHF 20 |
| Backups (PITR) | inkl. Managed PG | inkl. | inkl. + CHF 15 ext. |
| CDN (Cloudflare) | CHF 0 (Free) | CHF 0 | CHF 0 |
| **Total Fixkosten/Mt** | **~CHF 50** | **~CHF 95** | **~CHF 292** |

#### Variable Kosten (pro LP pro Monat)

| Komponente | Berechnung | Pro LP/Mt |
|------------|-----------|-----------|
| **KI-Korrektur** | 2 Pruef. × 25 SuS × 8 Fragen = 400 Korrekt. Mix Haiku/Sonnet + Caching | **CHF 3.00** |
| **Speicher** (Fragen, Antworten, Materialien) | ~50MB/LP/Mt | **CHF 0.10** |
| **DB-Compute** (Queries, Connections) | Marginal bei Shared DB | **CHF 0.20** |
| **Bandwidth** | ~200MB/LP/Mt | **CHF 0.05** |
| **Payment Processing** (Stripe 2.9%+0.30) | Bei CHF 8/Mt Abo | **CHF 0.53** |
| **Total variable Kosten/LP/Mt** | | **~CHF 3.90** |

#### Gesamtkosten nach Szenario

| Szenario | Fixkosten/Mt | Variable/Mt | **Total/Mt** | **Pro LP/Mt** | Bei CHF 8 Abo: **Gewinn/Mt** |
|----------|-------------|------------|-------------|--------------|-------------------------------|
| **Alleine (1 LP)** | CHF 50 | CHF 3.90 | **CHF 54** | **CHF 54.00** | −CHF 46 (reine Kosten) |
| **5 LP** | CHF 50 | CHF 19.50 | **CHF 70** | **CHF 14.00** | −CHF 30 |
| **20 LP** | CHF 50 | CHF 78 | **CHF 128** | **CHF 6.40** | +CHF 32 |
| **100 LP** | CHF 95 | CHF 390 | **CHF 485** | **CHF 4.85** | +CHF 315 |
| **1'000 LP** | CHF 292 | CHF 3'900 | **CHF 4'192** | **CHF 4.19** | +CHF 3'808 |

**Break-Even bei ca. 13 LP** (mit CHF 8/LP/Mt Abo-Preis).

#### Nur eigene Schule (ohne SaaS)

| Variante | Kosten/Mt | Kosten/Jahr |
|----------|-----------|------------|
| Nur du (1 LP) | CHF 54 | CHF 648 |
| Fachschaft (~5 LP) | CHF 70 | CHF 840 |
| Ganze Schule (~20 LP) | CHF 128 | CHF 1'536 |

Vergleich: isTest2-Schullizenz fuer 20 LP = CHF 130/Jahr (aber ohne KI, ohne 20 Fragetypen, ohne Realtime).

#### Sparpotenzial

| Massnahme | Ersparnis |
|-----------|-----------|
| Infomaniak statt Exoscale (eigene PG) | −CHF 15–25/Mt Fixkosten |
| Hetzner fuer Dev/Staging | −CHF 20/Mt (kein CH-Standort) |
| KI nur Haiku (kein Sonnet) | −50% KI-Kosten (~CHF 1.50/LP statt 3.00) |
| KI optional / BYOK | Variable Kosten sinken auf ~CHF 0.90/LP |
| Schullizenz statt Pro-LP | Planbarer, weniger Payment-Fees |

#### Kostenrechnung bei SaaS-Betrieb (Tragfaehigkeit)

| Szenario | Einnahmen/Mt | Hosting/Mt | KI-Kosten/Mt | Gewinn/Mt |
|----------|-------------|------------|--------------|-----------|
| 1 Schule (10 LP) | CHF 80 | CHF 50–80 | CHF 20 | CHF -20 bis +10 |
| 5 Schulen (50 LP) | CHF 400 | CHF 80–120 | CHF 100 | CHF +180–220 |
| 20 Schulen (200 LP) | CHF 1'600 | CHF 120–200 | CHF 400 | CHF +1'000–1'080 |
| School License (5x CHF 800) | CHF 333/Mt | CHF 80–120 | CHF 100 | CHF +113–153 |

**Ab ~3–5 Schulen kostendeckend, ab 10+ Schulen profitabel.**

---

## 7. KI-Integration

### Architektur

```
Frontend → Supabase Edge Function → Claude/OpenAI API
                                        ↓
                               Prompt Caching (90% Ersparnis)
                               Batch API (50% Ersparnis bei Massenkorrektur)
                               Modell-Routing (Haiku fuer MC, Sonnet fuer Freitext)
```

### Kosten pro Pruefungskorrektur (Schaetzung)

| Modell | Kosten pro Frage | 20 Fragen x 25 SuS |
|--------|-----------------|---------------------|
| Claude Haiku 4.5 | ~$0.003 | ~$1.50 |
| Claude Sonnet 4.6 | ~$0.009 | ~$4.50 |
| GPT-4o-mini | ~$0.0004 | ~$0.20 |

### Kosten-Management

- **Modell-Routing:** Auto-korrigierbare Fragen (MC, R/F, Lueckentext) brauchen keine KI → kostenlos. Nur Freitext, Code, Zeichnung gehen an KI.
- **Prompt Caching:** System-Prompt pro Pruefung identisch fuer alle SuS → 90% Cache-Hit
- **Batch API:** Nach Pruefungsende alle Korrekturen als Batch → 50% Rabatt
- **Geschaetzte Kosten pro Pruefung (25 SuS, 10 Freitext-Fragen):** CHF 1–3 mit Haiku, CHF 3–5 mit Sonnet

### Multi-Provider-Support

- Claude (Anthropic) als Default
- OpenAI als Fallback/Alternative
- Konfigurierbar pro Schule (School Admin)
- BYOK-Option fuer Schulen mit eigenem API-Budget

---

## 8. Performance & Responsiveness

### Ziel: <200ms fuer alle UI-Interaktionen

| Aspekt | Aktuell | Ziel |
|--------|---------|------|
| Antwort speichern | 1–5s (Apps Script) | <200ms (Supabase Direct Insert) |
| Pruefung laden | 3–8s (Cache-Miss) | <500ms (PostgreSQL Index) |
| Live-Monitoring | 10s Polling-Intervall | <1s Realtime Push |
| Fragenbank laden | 5–15s (alle Fragen) | <1s (Pagination + Index) |
| KI-Korrektur (einzeln) | 5–15s | 3–8s (Stream-Response) |

### Massnahmen

- **Supabase Client SDK:** Direkte DB-Queries statt HTTP-Roundtrip zu Apps Script
- **Indices:** school_id + exam_id + student_id auf allen relevanten Tabellen
- **Pagination:** Fragenbank nicht komplett laden, sondern paginiert + gefiltert
- **Optimistic Updates:** Antwort sofort in UI anzeigen, async an DB senden
- **Connection Pooling:** Supabase PgBouncer (Default bei Self-Hosted)
- **CDN:** Static Assets (React-Bundle, Bilder) ueber Cloudflare CDN
- **Edge Functions:** KI-Aufrufe server-seitig, Streaming-Response an Client

---

## 9. Skalierbarkeit & Internationalisierung

### Skalierung

| Dimension | Massnahme |
|-----------|-----------|
| **Mehr Schulen** | Shared DB + RLS, kein zusaetzlicher Aufwand pro Tenant |
| **Mehr SuS gleichzeitig** | PostgreSQL Read Replicas, Connection Pooling |
| **Mehr Faecher** | Dynamische Fach-Config pro Schule, keine Hardcoding |
| **Mehr Fragetypen** | Plugin-Architektur (Fragetyp-Registry, lazy-loaded) |
| **Mehr Daten** | Archivierung alter Pruefungen (nach 2 Jahren in Cold Storage) |

### Internationalisierung (i18n)

| Schritt | Aufwand | Prioritaet |
|---------|---------|------------|
| **UI-Texte externalisieren** | Mittel (i18next oder similar) | Phase 2 |
| **Franzoesisch** | Gering (Uebersetzung) | Phase 2 (BE ist zweisprachig!) |
| **Deutsch (DE/AT)** | Gering (Notenskala + Terminologie) | Phase 3 |
| **Englisch** | Mittel | Phase 3 |
| **Lehrplan-Adapter** | Hoch (pro Kanton/Land) | Phase 4 |

---

## 10. Wartbarkeit

### Deployment & DevOps

| Aspekt | Aktuell | Neu |
|--------|---------|-----|
| Frontend-Deploy | GitHub Actions → GitHub Pages | Bleibt (oder Vercel/Cloudflare Pages) |
| Backend-Deploy | Manuell in Apps Script Editor | Docker Compose + CI/CD (GitHub Actions → Exoscale) |
| DB-Migrations | Manuell (Sheets-Spalten) | Supabase Migrations (SQL-Dateien, versioniert) |
| Monitoring | Keines | Supabase Dashboard + Sentry (Errors) + Uptime-Check |
| Backups | Google Sheets Auto-Versioning | Exoscale Managed PG: Taegliche Snapshots, PITR |

### Coolify als Deployment-Plattform (Option)

[Coolify](https://coolify.io/) ist ein Open-Source, selbst gehostetes PaaS (wie Vercel/Heroku, aber auf eigenem Server). Es koennte die DevOps-Huerde fuer das Self-Hosting deutlich senken.

**Was Coolify uebernimmt:**
- Automatische SSL-Zertifikate (Let's Encrypt + Traefik)
- Reverse Proxy (Traefik built-in)
- Supabase-Deployment (One-Click-Template oder eigene docker-compose.yml)
- Geplante DB-Backups auf S3-kompatiblen Storage (z.B. Exoscale Object Storage)
- Web-Dashboard fuer Verwaltung (statt SSH-Zugang fuer alles)
- Git-Push-Deployments via Webhooks

**Geplante Infrastruktur mit Coolify:**
```
Exoscale VPS (Schweiz, 4 vCPU, 8GB RAM, ~EUR 40/Mt)
  └── Coolify (Admin-Panel, nur via VPN/IP-Whitelist zugaenglich)
        ├── Supabase Self-Hosted (offizielle docker-compose.yml)
        │     ├── PostgreSQL + PostgREST + GoTrue (Auth)
        │     ├── Realtime + Storage + Edge Functions
        │     └── Supabase Studio (Admin-UI)
        ├── Automatische SSL-Zertifikate
        └── Geplante Backups → Exoscale Object Storage
```

**Bedenken:**
- **Sicherheit:** 11 kritische CVEs im Januar 2026 (CVSS 10.0, alle gepatcht). Admin-Panel MUSS per VPN oder IP-Whitelist abgesichert werden.
- **Kein PITR:** Nur pg_dump-Snapshots, kein Point-in-Time-Recovery. WAL-Archivierung muesste manuell eingerichtet werden.
- **Supabase-Template:** Hat bekannte Bugs (Analytics-Crash, Port-Exposure). Alternative: Offizielle Supabase docker-compose.yml direkt deployen.
- **Wartung:** Geschaetzt 5–10h/Monat. Bei Problemen braucht man Docker-Grundwissen.
- **Einordnung:** Coolify reduziert die DevOps-Huerde von "hoch" auf "mittel". Es ist kein "Set and Forget", aber deutlich einfacher als reines Docker Compose + SSH.

**Alternativen zu Coolify:** Dokploy (leichter, neuer), CapRover (aehnlich, schwaecherer Compose-Support), Portainer (nur Container-Management, kein SSL/Domain), plain Docker Compose + systemd (maximale Kontrolle, hoechster Aufwand).

### Code-Organisation

```
pruefung/
├── src/                    # Frontend (bestehend, schrittweise migriert)
│   ├── lib/supabase.ts     # Supabase Client Singleton
│   ├── services/           # apiClient.ts → supabase queries
│   └── ...
├── supabase/
│   ├── migrations/         # SQL-Migrations (versioniert)
│   ├── functions/          # Edge Functions (KI, Export, Notifications)
│   ├── seed.sql            # Demo-/Testdaten
│   └── config.toml         # Supabase-Konfiguration
└── docker-compose.yml      # Self-Hosted Supabase
```

### Einfache Wartung

- **DB-Aenderungen:** SQL-Migration schreiben, `supabase db push` → fertig
- **Edge Functions:** TypeScript, Hot-Reload, lokales Testen moeglich
- **Kein manuelles Deployen:** CI/CD baut + deployt automatisch bei Push
- **Monitoring:** Supabase Dashboard zeigt DB-Load, aktive Connections, Fehler
- **Rollback:** Git-basierte Migrations, jede Aenderung revertierbar

---

## 11. Weitere Ueberlegungen

### Punkte die ueber die initialen Anforderungen hinausgehen

| Thema | Warum relevant |
|-------|---------------|
| **Offline-Resilienz** | Pruefungen muessen auch bei Netzunterbruch weiterlaufen. IndexedDB-Cache + Service Worker beibehalten, Sync bei Reconnect. |
| **Barrierefreiheit (a11y)** | Schweizer Behindertengleichstellungsgesetz (BehiG) gilt auch fuer Schultools. WCAG 2.1 AA als Ziel. |
| **Browser-Kompatibilitaet** | SuS nutzen verschiedene Geraete. Safari (iPad), Chrome (Laptop), Firefox. Testen! |
| **Daten-Export & Portabilitaet** | Schulen muessen ihre Daten jederzeit exportieren koennen (nDSG). CSV/JSON-Export aller Daten pro Schule. |
| **Backup & Disaster Recovery** | RPO: Max 1 Stunde Datenverlust. RTO: Max 4 Stunden Wiederherstellung. |
| **Uptime / SLA** | Waehrend Pruefungszeiten (06:00–18:00 Mo–Fr) muss das Tool verfuegbar sein. Ziel: 99.5% |
| **Load Testing** | Vor Go-Live: Simuliere 500 gleichzeitige SuS (realistische Schul-Last) |
| **GDPR (EU-Erweiterung)** | Falls Tool an deutsche/oesterreichische Schulen verkauft wird: GDPR-Compliance noetig |
| **Evento-Integration** | Automatischer Klassenlisten-Import statt manuellem CSV. REST-API-Zugang beantragen. |
| **Benachrichtigungen** | Email bei Pruefungsende, Korrektur-Freigabe, SuS-Probleme. Transactional Email Service (Resend, Postmark). |
| **Versionierung** | SemVer fuer das Produkt. Changelog fuer Schulen. Update-Benachrichtigungen. |
| **Rechtliches** | AGB, Datenschutzerklaerung, AVV-Vorlage, Impressum. Eventuell juristisch pruefen lassen. |
| **Support-Kanal** | FAQ/Hilfe-Seite, Bug-Report-Formular, ggf. Ticket-System |
| **Onboarding** | Gefuehrter Setup-Wizard fuer neue Schulen. Demo-Modus beibehalten + erweitern. |

---

## 12. Migrations-Roadmap (High-Level)

### Phase 0: Vorbereitung (parallel zum laufenden Betrieb)
- Supabase lokal aufsetzen + Datenmodell entwerfen
- DB-Schema mit RLS-Policies definieren
- Automatisierte Tests fuer RLS-Policies schreiben
- CI/CD-Pipeline einrichten

### Phase 1: Backend-Migration (Feature-Parity)
- Supabase Self-Hosted auf Exoscale deployen
- Alle Apps Script Endpoints als Supabase Edge Functions nachbauen
- Auth migrieren (Supabase Auth + Google OAuth)
- Daten-Migration-Script (Sheets → PostgreSQL)
- Frontend: apiClient.ts → Supabase SDK (hinter Abstraktion, Endpoint fuer Endpoint)

### Phase 2: Multi-Tenancy + Admin
- school_id in alle Tabellen, RLS-Policies aktivieren
- Admin-Panel bauen (Schul-Verwaltung, LP-Management, Config)
- Rollen-System implementieren
- Self-Service Onboarding fuer Schulen

### Phase 3: Performance + Realtime
- Polling → Realtime-Subscriptions migrieren
- Pagination fuer Fragenbank
- CDN fuer Static Assets
- Load Testing

### Phase 4: Monetarisierung
- Stripe-Integration (oder Swiss Alternative: Datatrans, PayRexx)
- Abo-Verwaltung im Admin-Panel
- KI-Credit-System + Usage Tracking
- Free/Premium Feature Gates

### Phase 5: Internationalisierung + Skalierung
- i18n-Framework (i18next)
- Franzoesisch als erste Zweitsprache
- Lehrplan-Adapter-System
- Marketing-Website + Onboarding-Flow

---

## 13. Offene Fragen — Stand 29.03.2026

| # | Frage | Antwort | Naechster Schritt |
|---|-------|---------|-------------------|
| 1 | **Timeline** | Noch unklar — haengt von Budget und Pilotschulen ab | Klaerung nach Budget-Gespraech mit Schule |
| 2 | **Evento REST-API** | Beantragt beim Schulinformatiker, warte auf Antwort | Nachfassen falls bis Ende April keine Rueckmeldung |
| 3 | **Pilotschulen** | Informelles Interesse von Kolleg:innen, nichts Konkretes | Nach funktionierendem Prototyp konkret anfragen |
| 4 | **Budget** | Abklaerung mit Schule, ob/wieviel sie uebernimmt | Gespraech mit SL/IT initiieren |
| 5 | **Rechtsberatung** | Zuerst DSA + Digitalboard Sek II kontaktieren (digitalboard-sek2@be.ch) | E-Mail an Digitalboard vorbereiten |
| 6 | **Domain** | Spaeter — erstmal unter bestehender Infrastruktur laufen lassen | Fruehestens bei Go-Live fuer externe Schulen |
| 7 | **Migrationsstrategie** | **Greenfield parallel** — neue App von Grund auf bauen, altes Tool laeuft weiter | Bestehender React-Code kann weitgehend uebernommen werden, nur Datenschicht neu |
| 8 | **Datenmigration** | Noch unklar — haengt vom Aufwand ab | Migrationsskript evaluieren sobald DB-Schema steht |

### Zusaetzliche offene Punkte

| Punkt | Prioritaet | Notizen |
|-------|-----------|---------|
| Gespraech mit Schulleitung re: Budget + Datenschutz | Hoch | Idealerweise mit Verweis auf Sek-II-Leitfaden |
| Kontakt Digitalboard Sek II | Mittel | Projekt vorstellen, DSFA-Unterstuetzung anfragen |
| Evento-API Nachfassen | Mittel | Falls bis Ende April keine Antwort |
| Informelles Interesse formalisieren | Niedrig | Erst nach funktionierendem Prototyp |
| Domain reservieren | Niedrig | Erst bei SaaS-Launch relevant |

---

## Anhang A: Backend-Vergleichstabelle

| Option | DSG-konform? | Auth | Realtime | RLS/Multi-Tenant | Aufwand | Empfehlung |
|--------|-------------|------|----------|-------------------|---------|------------|
| **Supabase (self-hosted)** | JA (CH-Server) | Voll | Ja | Nativ (PostgreSQL) | Mittel | **EMPFOHLEN** |
| PocketBase | JA (CH-Server) | Voll | Ja | Nein (App-Logic) | Gering | MVP/Prototyp |
| Firebase | NEIN | Voll | Ja | Security Rules | Gering | Nicht empfohlen |
| Appwrite (self-hosted) | JA (CH-Server) | Voll | Ja | Nein (App-Logic) | Mittel-Hoch | Alternative |
| Directus (self-hosted) | JA (CH-Server) | Basis | Ja | Permissions | Mittel | Admin-Panel |
| Custom Node/PG | JA (CH-Server) | Selbst | Selbst | Selbst | Hoch | Nur bei Spezial |
| Cloudflare D1 | Grauzone (EU) | Nein | Komplex | Nein | Mittel | Nicht empfohlen |

## Anhang B: Hosting-Kostenabschaetzung

| Komponente | Exoscale | Infomaniak |
|------------|----------|------------|
| VM fuer Supabase (4 vCPU, 8GB RAM) | ~EUR 30–50/Mt | ~EUR 25–40/Mt |
| Managed PostgreSQL (oder selbst) | ~EUR 20–40/Mt (managed) | — (selbst auf VM) |
| Object Storage (50GB) | ~EUR 2–5/Mt | ~EUR 2–5/Mt |
| **Total (single school)** | **~EUR 50–95/Mt** | **~EUR 30–50/Mt** |
| **Total (multi-tenant, 10 Schulen)** | **~EUR 80–150/Mt** | **~EUR 50–80/Mt** |

## Anhang C: Beschaffungswege Schweizer Schulen

- **Gymnasien (Sek II):** Meist ueber IT-Verantwortliche oder Fachgruppen. Budget pro Fachschaft oder zentral.
- **Kantonale Beschaffung:** Fuer groessere Loesungen gibt es kantonale Rahmenvertraege.
- **Entscheidungswege sind langsam.** Pilotphasen (1 Semester) sind ueblich.
- isTest2-Modell (CHF 5/aktive LP) ist ein guter Benchmark fuer Schweizer Gymnasien.

## Anhang D: Was Self-Hosting konkret bedeutet

### Ueberblick

Self-Hosting heisst: Die Pruefungsplattform laeuft nicht bei Google oder einem US-Cloud-Anbieter, sondern auf einem gemieteten Server in einem Schweizer Rechenzentrum (Exoscale oder Infomaniak). Du bist der Betreiber — mit voller Kontrolle ueber die Daten, aber auch mit Verantwortung fuer den Betrieb.

### Was du einmalig tun musst (Setup, ca. 1–2 Tage)

1. **Server mieten** bei Exoscale oder Infomaniak (Web-Formular, Kreditkarte, 10 Min)
2. **Coolify installieren** auf dem Server (1 Befehl via SSH, 5 Min)
3. **Supabase deployen** via Coolify-Dashboard (Docker-Compose hochladen, Env-Variablen setzen, 1–2h)
4. **Domain verbinden** (DNS-Eintrag setzen, SSL wird automatisch eingerichtet)
5. **Backups konfigurieren** (Coolify-UI: Zeitplan + S3-Ziel, 15 Min)
6. **Admin-Panel absichern** (IP-Whitelist oder VPN, 30 Min)

Bei all diesen Schritten kann ich (Claude) dich Schritt fuer Schritt anleiten.

### Was regelmaessig anfaellt (laufender Betrieb)

| Aufgabe | Haeufigkeit | Aufwand | Wie |
|---------|------------|---------|-----|
| **Coolify + Supabase Updates** | Alle 2–4 Wochen | 15 Min | Button im Coolify-Dashboard |
| **Backup-Kontrolle** | Woechentlich | 5 Min | Coolify-Dashboard pruefen ob Backups laufen |
| **Server-Monitoring** | Laufend (passiv) | 0 Min | Uptime-Check (z.B. UptimeRobot, gratis) schickt E-Mail bei Ausfall |
| **OS-Updates** | Monatlich | 15–30 Min | SSH: `apt update && apt upgrade` |
| **Fehler-Debugging** | Bei Bedarf | 30–60 Min | Coolify-Logs lesen, ggf. Container neustarten |
| **DB-Migration bei neuen Features** | Bei Releases | 10 Min | SQL-Datei ausfuehren via Supabase Studio |
| **Zertifikats-Erneuerung** | Nie (automatisch) | 0 Min | Let's Encrypt via Coolify |

**Geschaetzter Gesamtaufwand: 2–5 Stunden pro Monat im Normalbetrieb.**

### Was passiert wenn etwas kaputt geht?

| Szenario | Auswirkung | Loesung |
|----------|-----------|---------|
| Server faellt aus | Plattform nicht erreichbar | Exoscale startet VM automatisch neu (SLA). Pruefung laeuft offline weiter (IndexedDB). |
| Datenbank-Korruption | Datenverlust moeglich | Backup wiederherstellen (letzter pg_dump, max. 24h alt) |
| Supabase-Container crasht | Einzelner Dienst nicht verfuegbar | Coolify-Dashboard: Container neustarten (1 Klick) |
| Coolify selbst crasht | Dashboard nicht erreichbar, aber Supabase laeuft weiter | SSH-Zugang, `docker restart coolify` |
| Sicherheitsluecke entdeckt | Potentielles Risiko | Update einspielen (Coolify-Dashboard oder SSH) |
| DU bist nicht verfuegbar | Niemand kann Server warten | Notfall-Anleitung fuer IT-Verantwortlichen der Schule hinterlegen |

### Vergleich: Self-Hosting vs. Managed Cloud

| Aspekt | Self-Hosted (Coolify + Exoscale) | Managed Cloud (z.B. Supabase Pro) |
|--------|--------------------------------|-----------------------------------|
| Datenschutz | ✅ Volle Kontrolle, DSG-konform | ❌ US-Firma, CLOUD Act |
| Kosten | CHF 50–80/Mt (VPS + Storage) | CHF 25–75/Mt (Pro-Plan) |
| Wartungsaufwand | 2–5h/Mt | ~0h/Mt |
| Verfuegbarkeit | 99–99.5% (eigene Verantwortung) | 99.9% (SLA-Garantie) |
| Backups | Selbst konfigurieren | Automatisch inkl. PITR |
| Updates | Selbst einspielen | Automatisch |
| Skalierung | Manuell (groesseren Server mieten) | Automatisch |
| Kontrolle | Volle root-Kontrolle | Eingeschraenkt |

**Fazit:** Self-Hosting kostet etwas mehr Zeit (2–5h/Mt), ist aber die einzige DSG-konforme Option fuer Pruefungsdaten. Mit Coolify ist es machbar fuer jemanden mit Basis-IT-Kenntnissen — du musst kein Systemadministrator sein.

---

## Anhang E: E-Mail-Entwurf Digitalboard Sek II

**An:** digitalboard-sek2@be.ch
**Betreff:** Digitale Pruefungsplattform — Beratung zu Datenschutz und ISDS-Analyse

---

Sehr geehrte Mitglieder des Digitalboards

Ich bin Lehrperson am Gymnasium Hofwil (W&R, Informatik) und habe in den letzten Monaten eine digitale Pruefungsplattform entwickelt, die seit Maerz 2026 im Unterricht erprobt wird. Das Tool unterstuetzt 20 Fragetypen, KI-gestuetzte Korrektur, Live-Monitoring und ist als Progressive Web App realisiert (React, TypeScript, Open Source).

Aktuell laeuft das Backend ueber Google Sheets und Apps Script. Gemaess dem Leitfaden "Austausch, Verarbeitung und Speicherung von Daten an Schulen Sek II" (Version 2.0, Juni 2025) sind Pruefungsergebnisse mit Personenbezug als VERTRAULICH klassifiziert und duerfen nicht in Public-Cloud-Diensten gespeichert werden.

Ich plane deshalb die Migration auf eine Self-Hosted-Loesung (Supabase auf Schweizer Infrastruktur, z.B. Exoscale). Dabei moechte ich die Plattform auch fuer andere Fachschaften und perspektivisch fuer andere Schulen oeffnen.

**Meine Fragen an Sie:**

1. Koennen Sie mich bei der Erstellung einer ISDS-Analyse / Datenschutz-Folgenabschaetzung (DSFA) fuer die Plattform unterstuetzen oder beraten?
2. Gibt es kantonale Anforderungen oder Vorlagen fuer eine solche DSFA, die ich nutzen kann?
3. Waere das Digitalboard an einer Zusammenarbeit oder Begleitung eines solchen Projekts interessiert?
4. Gibt es aehnliche Initiativen an anderen Sek-II-Schulen im Kanton Bern?

Die Plattform ist Open Source und orientiert sich an den Grundsaetzen des Leitfadens (Privacy by Design, Modularitaet, Vermeidung von Vendor-Lock-in). Ich wuerde mich ueber eine Rueckmeldung oder ein Gespraech sehr freuen.

Freundliche Gruesse
Yannick Durand
Gymnasium Hofwil, Muenchenbuchsee

---

## Anhang F: Gespraechsleitfaden Schulleitung

**Ziel:** Budget-Klaerung + Unterstuetzung fuer datenschutzkonforme Hosting-Loesung

### Kontext fuer das Gespraech

Die digitale Pruefungsplattform ist seit Maerz 2026 im Einsatz und wird von Kolleg:innen mit Interesse verfolgt. Das aktuelle Backend (Google Sheets) ist gemaess dem kantonalen Sek-II-Leitfaden fuer Pruefungsdaten nicht datenschutzkonform. Eine Migration auf Schweizer Infrastruktur ist noetig.

### Kernbotschaften

1. **Datenschutz-Pflicht:** Der Sek-II-Leitfaden (v2.0, Juni 2025, von der DSA freigegeben) klassifiziert Pruefungsergebnisse als VERTRAULICH. Public-Cloud-Dienste (Google, Microsoft) sind dafuer nicht zulaessig. Self-Hosting auf Schweizer Servern ist die empfohlene Loesung.

2. **Kosten sind ueberschaubar:** CHF 50–80 pro Monat fuer einen Schweizer Server (Exoscale/Infomaniak). Zum Vergleich: Eine isTest2-Schullizenz kostet CHF 30 + CHF 5/aktive LP/Jahr — und bietet deutlich weniger Funktionen.

3. **Potenzial ueber die eigene Schule hinaus:** Informelles Interesse anderer LP ist vorhanden. Langfristig koennte die Plattform als SaaS an andere Schulen lizenziert werden — kostendeckend ab ca. 3–5 Schulen, profitabel ab 10+.

4. **Kein grosser Zeitaufwand:** Der laufende Betrieb erfordert ca. 2–5 Stunden pro Monat. Die Entwicklung geschieht im Rahmen meiner bestehenden Taetigkeit.

### Offene Fragen an die Schulleitung

| Frage | Hintergrund |
|-------|-------------|
| Kann die Schule die Hosting-Kosten uebernehmen (CHF 50–80/Mt)? | Datenschutz-Compliance ist letztlich Verantwortung der Schule (Sek-II-Leitfaden, Kap. 1.2) |
| Gibt es ein IT-Budget fuer digitale Unterrichtswerkzeuge? | Eventuell bereits Posten fuer Lizenzen (isTest2, Classtime etc.) vorhanden |
| Waere eine Pilotphase (1 Semester) denkbar? | Ueblich bei Sek-II-Schulen fuer neue Software |
| Soll der Schulinformatiker einbezogen werden? | Fuer Server-Setup, Evento-API, Netzwerk |
| Unterstuetzung fuer DSFA? | Die Schule ist verpflichtet, vor dem Einsatz eine ISDS-Analyse durchzufuehren (Leitfaden Kap. 1.2) |
| Interesse an Praesentiation fuer die Fachschaft/Kollegium? | Um informelles Interesse zu formalisieren |

## Anhang G: Gespraechsleitfaden Schul-IT (Schulinformatiker)

**Ziel:** Abklaeren ob ein Schul-Server (z.B. Smartlearn) fuer die Pruefungsplattform genutzt werden kann, und welche Unterstuetzung die Schul-IT leisten koennte.

### Kontext fuer das Gespraech

Ich habe eine digitale Pruefungsplattform entwickelt (React PWA, 20 Fragetypen, KI-Korrektur, Live-Monitoring). Das aktuelle Backend (Google Sheets) ist gemaess dem kantonalen Sek-II-Leitfaden fuer Pruefungsdaten nicht datenschutzkonform. Ich brauche eine Self-Hosted-Loesung auf Schweizer Infrastruktur.

### Technische Fragen zum Schul-Server

| Frage | Warum relevant | Ideale Antwort |
|-------|---------------|----------------|
| Welches OS laeuft auf dem Smartlearn-Server? | Coolify/Docker braucht Linux (Ubuntu/Debian ideal) | Ubuntu 22.04+ oder Debian 12+ |
| Kann Docker auf dem Server laufen? | Supabase laeuft als Docker-Container-Stack (~15 Container) | Ja, Docker + Docker Compose installiert oder installierbar |
| Wieviel RAM/CPU/Storage ist verfuegbar/zuteilbar? | Supabase braucht mind. 4 vCPU, 8GB RAM, 50GB Storage | Genuegend freie Ressourcen oder eigene VM moeglich |
| Ist eine Port-Freigabe (443/HTTPS) nach aussen moeglich? | SuS muessen von zu Hause/unterwegs auf die Plattform zugreifen | Ja, mit Reverse Proxy oder direkter Freigabe |
| Gibt es eine feste oeffentliche IP oder DynDNS? | Fuer SSL-Zertifikat und stabile Erreichbarkeit | Feste IP oder zumindest DynDNS-Dienst |
| Wie ist die Verfuegbarkeit? (Uptime, Wartungsfenster) | Waehrend Pruefungen (06:00–18:00 Mo–Fr) muss das Tool laufen | Hohe Verfuegbarkeit, Wartung nur am Wochenende/nachts |
| Gibt es eine USV (Unterbrechungsfreie Stromversorgung)? | Server-Ausfall waehrend Pruefung waere kritisch | Ja |
| Wie werden Backups gemacht? | Pruefungsdaten muessen gesichert sein | Regelmaessige Snapshots oder Backup-Loesung vorhanden |
| Kann ich SSH-Zugang zum Server bekommen? | Fuer Installation und Wartung von Coolify/Supabase | Ja, eigener SSH-Account oder sudo-Zugang auf VM |
| Waere eine eigene VM (Virtuelle Maschine) moeglich? | Isolation von anderen Diensten auf dem Server | Idealerweise eigene VM nur fuer die Pruefungsplattform |
| Wie ist die Netzwerkanbindung? (Bandbreite) | 30 SuS gleichzeitig bei einer Pruefung = ~50–100 Requests/Sekunde | Genuegend Bandbreite (mind. 100 Mbit/s) |

### Fragen zur Zusammenarbeit

| Frage | Hintergrund |
|-------|-------------|
| Koenntest du bei der Ersteinrichtung helfen? (Netzwerk, Firewall, DNS) | Ich kann Docker/Coolify/Supabase, aber Netzwerk-Konfiguration am Schul-Server ist dein Bereich |
| Wer waere Ansprechperson bei Server-Problemen? | Wenn der Server waehrend einer Pruefung ausfaellt |
| Gibt es ein Monitoring fuer den Server? | Damit wir Probleme frueh erkennen |
| Wie stehst du zum Evento-API-Zugang? (Offene Anfrage) | Fuer automatischen Klassenlisten-Import |
| Darf ich Coolify (Open-Source-PaaS) auf dem Server installieren? | Vereinfacht Deployment, SSL, Backups — aber ist ein zusaetzlicher Dienst |

### Fallback-Szenario

Falls der Schul-Server nicht geeignet ist (kein Docker, kein Port 443, zu wenig Ressourcen), waere der Plan:
- **VPS bei Exoscale oder Infomaniak mieten** (CHF 50–80/Mt, Schweizer Rechenzentrum)
- Kosten muessten von der Schule getragen werden (siehe Gespraech mit Schulleitung)
- Schul-IT waere dann nur noch fuer Evento-API und Netzwerk-Fragen Ansprechpartner

### Wichtig: Kein Mehraufwand fuer die Schul-IT im Betrieb

Die laufende Wartung (Updates, Backups, Monitoring) mache ich selbst — ca. 2–5h/Monat. Die Schul-IT wird nur fuer die Ersteinrichtung und bei Server/Netzwerk-Problemen gebraucht. Ich erstelle eine Notfall-Anleitung fuer den Fall, dass ich nicht verfuegbar bin.

## Anhang H: E-Mail-Entwurf peaknetworks (Hosting-Anfrage)

**An:** info@peaknetworks.com (oder CH-Kontakt falls vorhanden)
**Betreff:** Managed Supabase Hosting auf Schweizer Infrastruktur — Anfrage Bildungsplattform

---

Sehr geehrtes peaknetworks-Team

Ich entwickle eine digitale Pruefungsplattform fuer Schweizer Gymnasien (React PWA, 20 Fragetypen, KI-gestuetzte Korrektur, Live-Monitoring). Das Tool ist seit Maerz 2026 im Einsatz an meiner Schule (Gymnasium Hofwil, Kanton Bern) und soll perspektivisch weiteren Schulen zur Verfuegung stehen.

Das aktuelle Backend (Google Sheets / Apps Script) muss aus Datenschutzgruenden migriert werden: Der kantonale Leitfaden "Austausch, Verarbeitung und Speicherung von Daten an Schulen Sek II" (Kanton Bern, 2025) klassifiziert Pruefungsergebnisse als VERTRAULICH. Public-Cloud-Dienste von US-Firmen sind dafuer nicht zulaessig (CLOUD Act). Ich suche deshalb einen Managed-Supabase-Anbieter auf Schweizer Infrastruktur — und bin auf Ihr Angebot gestossen.

**Mein Bedarf:**
- Supabase Self-Hosted (PostgreSQL + Auth + Realtime + Storage + Edge Functions)
- Standort Schweiz (Ihr RZO Gais waere ideal)
- Datenschutzkonformitaet nach Schweizer DSG / KDSG Kanton Bern
- Start: voraussichtlich Sommer/Herbst 2026
- Skalierung: Anfangs 1 Schule (~20 Lehrpersonen, ~500 Schueler), spaeter Multi-Tenant

**Meine konkreten Fragen:**

1. **Supabase-Umfang:** Beinhaltet Ihr Managed-Supabase-Angebot den vollen Stack (PostgreSQL, GoTrue/Auth, Realtime, Storage, Edge Functions, PostgREST)? Oder primaer PostgreSQL + PostgREST?
2. **Updates:** Wie werden Supabase-Versionsupgrades eingespielt? Automatisch, auf Anfrage, oder selbst?
3. **Backups:** Gibt es Point-in-Time-Recovery (PITR/WAL-Archivierung) oder nur taegliche pg_dump-Snapshots?
4. **SLA:** Gibt es eine Uptime-Garantie (z.B. 99.5%+)?
5. **DPA/AVV:** Koennen Sie einen Auftragsverarbeitungsvertrag (DPA) stellen, der das Schweizer DSG und speziell das KDSG Kanton Bern abdeckt?
6. **Skalierung:** Wie funktioniert der Uebergang, wenn mehrere Schulen dazukommen? Groesserer Plan, separate Instanzen, oder beides moeglich?
7. **Konfiguration:** Kann ich die Supabase-Konfiguration selbst anpassen (Docker Compose, Env-Variablen, RLS-Policies)?
8. **Monitoring:** Ist Alerting enthalten (z.B. bei Container-Crash, hoher DB-Last)?
9. **Exit-Strategie:** Wie laeuft eine Migration weg von peaknetworks, falls noetig? (Datenexport, Kuendigungsfrist)
10. **Preis:** Waere der Performance-Plan (4 CPU, 8 GB RAM, 100 GB, EUR 79/Mt) fuer den Start ausreichend?

Das Projekt ist Open Source und orientiert sich an den Grundsaetzen des kantonalen Leitfadens (Privacy by Design, Modularitaet, Vermeidung von Vendor-Lock-in). Ich wuerde mich ueber ein Angebot oder ein kurzes Gespraech sehr freuen.

Freundliche Gruesse
Yannick Durand
Gymnasium Hofwil, Muenchenbuchsee
