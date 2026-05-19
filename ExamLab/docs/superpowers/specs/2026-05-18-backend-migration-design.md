---
title: Backend-Migration ExamLab — Greenfield auf Supabase mit peaknetworks-Hosting
date: 2026-05-18
status: Spec-Review ausstehend
verwandt: ExamLab/docs/backend migration/backend-migration.md (Sammeldokument 20.04.2026, überholt durch diese Spec)
ablöst: Memory `project_backend_migration.md` (20.04.2026, veraltet)
externe_quellen:
  - MBA-Vorgabe 900.90.900.7 (Rahmenbedingungen digitales Prüfen Sek II)
  - MBA-Vorgabe 900.90.900.4 (Umgang mit Personendaten)
  - Leitfaden Austausch/Verarbeitung/Speicherung von Daten Sek II v2.0 (19.06.2025)
  - Merkblatt "Sichere digitale Prüfungen" v2.0 (02.04.2026)
  - Digitalisierungsstrategie Schulen Sek II 2023-2027
  - Direktionsverordnung ISDS DV (BSG 152.040.2)
  - Empfehlungen zur Einführung von BYOD Sek II
---

# Backend-Migration ExamLab — Greenfield auf Supabase mit peaknetworks-Hosting

## 1. Kontext & Motivation

### 1.1 Status Quo

ExamLab läuft heute auf einem **Google-Apps-Script-Backend** mit Google Sheets als Datenbank. Die Plattform ist im Test-Einsatz bei DUY (Privatprojekt, Gymnasium Hofwil) und wurde bisher nicht produktiv mit Schülerinnen und Schülern eingesetzt.

Apps-Script hat drei strukturelle Probleme die produktiven Einsatz verhindern:

1. **Latenz** ~1.5-2 s pro API-Call (HTTPS-Handshake + V8-Container-Init + Sheet-Auth), erreichbar pro Klick ~5.9 s. Bei Heartbeat-Frequenz im Live-Betrieb produziert das Wartespiralen die SuS-Erfahrung dauerhaft beschädigen.
2. **Datenschutz-Probleme** durch US-Anbieter (Sheets/Apps-Script ist Google → CLOUD Act). Prüfungsergebnisse mit Noten gelten nach dem Sek-II-Leitfaden v2.0 als **VERTRAULICH** — dürfen nicht in US-Public-Cloud verarbeitet werden.
3. **Skalierungs-Grenze**: Apps-Script 6-Min-Laufzeit-Cap, Sheet-Spaltenlimit, keine echte Multi-Tenancy. Bei den geplanten 20'000 Fragen pro LP und Multi-School-Erweiterung nicht haltbar.

### 1.2 Externe Treiber

| Treiber | Quelle | Implikation |
|---|---|---|
| Sek-II-Leitfaden v2.0 (06.2025) klassifiziert Prüfungs-Daten als VERTRAULICH | Digitalboard Sek II, DSA-reviewed | US-Public-Cloud (auch Supabase Cloud Pro mit Zürich-Region) ausgeschlossen |
| Rahmenbedingungen digitales Prüfen 900.90.900.7 verlangen **ISDS-Analyse** der Schule + bei erhöhtem Risiko **ISDS-Konzept** an DSA | MBA-Vorgabe | Compliance-Track parallel zur Migration |
| Digitalisierungsstrategie 2023-2027 §6.5 verlangt für "dezentral entwickelte Anwendungen" entweder gemeinsame Nutzung oder Einzelbewilligung | BKD | ExamLab muss strategisch verortet werden |
| ICSG (Informations- und Cybersicherheitsgesetz) löst ISDS-DV Mitte 2026 ab | Grosser Rat Bern 12.06.2025 | Übergangs-Phase trifft unsere Migration — Klärung früh |
| Schulleitungs-OK für Hosting-Finanzierung ~CHF 1'000/Jahr Jahr 1 | DUY-Antrag, abgesegnet | Budget-Rahmen für Hosting steht |

### 1.3 Ziel der Migration

**Greenfield-Migration**: Apps-Script-Backend wird vollständig ersetzt. **Kein Dual-Betrieb**, Apps-Script wird **nicht produktiv** — direkter Cut-In auf das neue Backend zum Schuljahresstart August 2026.

Primäres Ziel: **Übungsmodus produktiv ab August 2026** für DUYs eigene Klassen + ggf. interessierte Hofwil-LP.
Sekundäres Ziel: **Prüfungsmodus produktiv ab Q4 2026 / Q1 2027** nach DSA-Approval des ISDS-Konzepts.

---

## 2. Strategische Positionierung

### 2.1 Verhältnis zu smartlearn (offizielle Kanton-BE-Prüfungsplattform)

smartlearn (whatwedo GmbH, VdIT, im Servicekatalog EDUBERN als "Sichere Prüfungslösung", an Hofwil im Einsatz für Matura-Aufsatz-Prüfungen) ist **kein Konkurrent für ExamLab**:

- smartlearn = Safe-Exam-Browser + Windows-11-VMs für Aufsatz-Prüfungen mit Office. Hardware-intensiv (physische Server in der Schule), hoher IT-Wartungsaufwand, in Hofwil-User-Feedback als komplex / unflexibel / fehleranfällig beschrieben.
- ExamLab = Web-Frage-Plattform für 20+ Fragetypen mit Auto-Korrektur, KI-Korrektur, Fragepool-System, Übungsmodus.

**Echte Konkurrenten** liegen bei kommerziellen Prüfungs-Plattformen (isTest2 et al.) — nicht bei smartlearn.

### 2.2 Verhältnis zum Kanton Bern

**Option A "erweitert"**: ExamLab bleibt **eigenständige Plattform**. Multi-School-Fähigkeit wird **technisch vorbereitet**, aber nicht erzwungen. Kantonale Integration (Servicekatalog EDUBERN, smartlearn-Modul) ist explizit **nicht** Ziel — wäre eine separate strategische Entscheidung viele Jahre später.

**Anschluss an kantonale Strukturen** über CoPs als Wissens-/Reputations-Pfad (Sichtbarkeit, Peer-Review, Empfehlungen), nicht als Governance-Einbindung:

- **CoP Digitales Prüfen** (Martin Studer, Urs Egli)
- **CoP Informationssicherheit & Datenschutz** (André Huwiler, Arnaud Forster)
- ggf. **CoP Sicheres Digitales Prüfen** (Markus Jordi, Tom Jampen)

Beitritt: E-Mail an `digitalboard-sek2@be.ch`.

### 2.3 Eigentum & Lizenzmodell

- **Eigentum**: DUY (Privatprojekt). Nicht im Rahmen des Anstellungs-Berufsauftrags entwickelt.
- **Finanzierung Jahr 1**: Gymnasium Hofwil zahlt Hosting (~CHF 1'000) als Schulinnovations-Beitrag. **Nicht** die Entwicklung.
- **Lizenzmodell**:
  - Hofwil-LP: gratis (Jahr 1 garantiert, Jahr 2+ ggf. moderate Nutzergebühr)
  - Externe Schulen / LP: Bezahlmodell (Details später, wenn Bedarf eintritt)
- **Closed Source**. Open-Source-Veröffentlichung wird **nicht angestrebt**, solange ein Bezahlmodell realistisch bleibt. Source-Code bleibt im privaten GitHub-Repo unter DUYs Kontrolle.

#### Public Money Public Code — Spannung zur Leitfaden-Empfehlung

Der Leitfaden Sek II §7.3 empfiehlt das **„Public Money, Public Code"**-Prinzip für mit öffentlichen Mitteln finanzierte Software. Diese Spec entscheidet bewusst gegen Open-Source-Veröffentlichung. Argumentation für ISDS-Konzept und DSA-Dialog:

1. **ExamLab ist nicht mit öffentlichen Mitteln entwickelt**. Die Entwicklung erfolgte als Privatprojekt durch DUY ausserhalb des Anstellungs-Berufsauftrags. Die 80h-Innovations-Bewilligung der Schule betraf ein anderes Projekt (Übungspools `Uebungen/`-Verzeichnis), das klar abgegrenzt ist.
2. **Schul-Finanzierung Jahr 1** deckt ausschliesslich **Hosting-Kosten** (~CHF 1'000), nicht die Entwicklungsleistung. Public-Money-Argument greift nur für entwicklungsfinanzierte Software.
3. **Vendor-Lock-in-Risiko** (Leitfaden §7.4) wird trotzdem mitigiert: Backend-Stack ist Open Source (Supabase, Apache 2.0), Hosting-Provider ist austauschbar (jeder Schweizer/EU-Anbieter mit Postgres + Storage geeignet), Datenexport-Garantie wird Teil des peaknetworks-AVV.

Diese Argumentation ist im ISDS-Konzept Kapitel 1 (Einleitung / Geltungsbereich) explizit zu führen, weil DSA-Reviewer das Thema voraussichtlich ansprechen.

### 2.4 Skalierungs-Erwartung

| Phase | Zielgrösse | Zeitfenster |
|---|---|---|
| Soft-Launch | 1 LP (DUY), ~100 SuS (eigene Klassen), 2'300 → wachsend Fragen | August 2026 |
| Pilot-Erweiterung | + 2-5 Hofwil-LP, evtl. erste externe Interessenten, ~10k Fragen | Schuljahr 2026/27 |
| Mittelfristig | 20+ LP, 20'000 Fragen, mehrere Schulen | 2027/28 |
| Skalierung "wenn überhaupt sehr langsam" | Unbekannt | offen |

→ Architektur muss **20'000 Fragen × 100 LP × Multi-School technisch tragen können**, ohne dass die Migration auf eine grössere Lösung später nötig wird.

---

## 3. Compliance-Rahmen

### 3.1 Datenklassifizierung (gem. Leitfaden Sek II §2.2)

| Datentyp | Klassifizierung | Speicher-Optionen |
|---|---|---|
| LP-Profile (Email, Kursliste, Fachschaft) | INTERN | Public Cloud CH ok, Private Cloud ok |
| Fragensammlung (LP-eigene Fragen) | INTERN | Public Cloud CH ok |
| Übungs-Antworten der SuS (formativ, keine Bewertungseffekt) | INTERN | Public Cloud CH ok |
| Schülerlisten (Klassen, Email) | INTERN | Public Cloud CH ok |
| **Prüfungs-Antworten der SuS mit Note** | **VERTRAULICH** | nur Private Cloud, Fachapplikation, lokal verschlüsselt |
| **Korrekturen + Musterlösungen + Bewertungsraster** | **VERTRAULICH** | nur Private Cloud, Fachapplikation, lokal verschlüsselt |
| Material (PDFs, Bilder) ohne Personenbezug | NICHT KLASSIFIZIERT | überall |

Konsequenz: Architektur muss **VERTRAULICH-tauglich** sein, auch wenn Phase 1 (Üben) nur INTERN-Daten produziert. Vorbereitung für Phase 2 (Prüfen).

### 3.2 ISDS-Track (zwei Stufen, parallel zur Implementierung)

| Stufe | Beschreibung | Wer macht | Output |
|---|---|---|---|
| **Stufe 1: ISDS-Analyse** | Voranalyse: Klassifizierung der Daten, Bestimmung des Schutzbedarfs (Grundschutz vs. erhöht) | Schule (DUY mit Schul-IT) | ~5-10 Seiten-Dokument |
| **Stufe 2: ISDS-Konzept** | Vollständige Architektur-Doku, projektspezifisch konfiguriert. Wird DSA zur Vorabkontrolle vorgelegt (Art. 17a KDSG). | Schule (DUY) mit Beratung PHBern oder CoP | ~30-60 Seiten-Dokument |

Bei ExamLab: **Stufe 2 erforderlich** (wegen VERTRAULICH-Klassifizierung der Prüfungsdaten → erhöhter Schutzbedarf).

**Inhalt ISDS-Konzept** (Struktur nach KAIO-Vorlage Kanton, analog Zug-Vorlage v2.0):

```
1. Einleitung (Ziel, Geltungsbereich, IT-Grundschutz, Ansprechpartner)
2. Schutzbedarfs-Einstufung (Grundschutz oder erhöhter Schutzbedarf)
3. Sicherheitsrelevante Systembeschreibung
   - Architekturskizze, eingesetzte Technologien, Standorte
   - Schnittstellen zu Drittsystemen (Anthropic, Google, peaknetworks)
   - Mandantenfähigkeit
   - Datenflussdiagramm + Datenlebenszyklus
4. Risikoanalyse (mit Risikomatrix Eintrittswahrscheinlichkeit × Schadensausmass)
   - Inhärentes Risiko → Bewertung → Massnahmen → Restrisiko
   - Drei Ebenen: Geschäftsprozesse, Fachanwendungen, IT-Systeme
5. Schutzmassnahmen (konkret, nicht generisch)
   - Authentisierung
   - Autorisierung (RLS-Konzept)
   - Logging & Monitoring
6. Geschäftsbetriebs-Sicherung (Wartung/Change, Notfallkonzept)
7. Einhaltung / Überprüfung
8. Abnahme durch Schul-CISO
Anhang: Risikomatrix
```

### 3.3 Übergang ISDS-DV → ICSG

Mitte 2026 löst das **ICSG** (Informations- und Cybersicherheitsgesetz) die ISDS-DV ab. Anforderungs-Struktur kann sich leicht verschieben. In der ersten Anfrage an MBA/ISDS-Beratung wird explizit geklärt:

- Wir arbeiten nach ISDS-DV-Vorlage oder bereits nach ICSG-Vorlage?
- Bei ISDS-DV-Vorlage: gibt es Übergangs-Hinweise für Projekte die Mitte 2026 laufen?

### 3.4 Ansprechpartner

| Rolle | Kontakt | Wofür |
|---|---|---|
| MBA-Rechtsdienst | Antoinette Hofmann (Leiterin Stab Rechtsdienst MBA) | ISDS-Vorlage Schul-spezifisch |
| ISDS-Beratung Kanton | `ISDS-Beratung@be.ch` | KAIO-Vorlage, ICSG-Übergang |
| KAIO | `info.kaio@be.ch`, +41 31 633 59 00 | Technische ISDS-Beratung |
| Digitalboard Sek II | `digitalboard-sek2@be.ch` | CoP-Beitritt, allgemeine Fragen |
| PHBern Schulinformatik | (über Digitalboard) | Beratung beim Konzept-Schreiben |
| DSA Kanton Bern | (über Digitalboard / Pflichten-Behörden-Seite) | DSA-Approval des ISDS-Konzepts |

### 3.5 KI-Compliance (Leitfaden §4.2)

Der Leitfaden untersagt KI-Systeme bei denen sich SuS **eindeutig gegenüber der generativen KI identifizieren müssen**. ExamLab nutzt heute Anthropic-API (Claude) für Korrektur und KI-Assistenz. Drei verschachtelte Compliance-Probleme:

**Problem 1: Identifier-Felder.** SuS-Email, -ID und -Name werden in API-Calls mitgesendet.
**Problem 2: Identifizierende Inhalte.** Aufsatz-Antworten enthalten oft identifizierende Angaben („Mein Vater Hans Müller arbeitet bei…", Schreibstil, biografische Details). Anthropic sieht das im Klartext.
**Problem 3: Daten-Retention bei Anthropic.** Standard-API-Tier speichert Inputs/Outputs für ~30 Tage (Logs, Trust-and-Safety). Trainings-Verwendung ist beim Standard-Plan deaktiviert, aber Logs bleiben.

#### Architektur-Massnahmen (mehrstufig)

| Massnahme | Adressiert | Realisierung | Status |
|---|---|---|---|
| **Identifier-Pseudonymisierung** in Edge Function | Problem 1 | SuS-ID/Email/Name werden vor Call durch Pseudonyme ersetzt | im Scope Phase 1 |
| **Inhaltliche Identifikation als Restrisiko** dokumentiert | Problem 2 | In ISDS-Konzept explizit als nicht-technisch-mitigierbar benannt. Pädagogische Massnahme: SuS-Aufklärung "keine Klarnamen anderer Personen in Antworten". Faktisches Restrisiko bleibt. | im Scope ISDS-Konzept |
| **Zero-Retention-Vereinbarung mit Anthropic** | Problem 3 | Anthropic Enterprise- oder Workspace-Tier mit explizit gesetztem `zero-retention`-Flag bzw. via vertraglicher Vereinbarung. Standard-API genügt **nicht**. | **zu klären, Mail #6 (neu)** |
| **Schweizer/EU-KI-Hosting als Phase-2-Standard** | alle drei | Apertus (Schweizer Bundes-KI), Swisscom AI Platform, Mistral (EU-Jurisdiktion) oder selbst-gehostetes Open-Weight-Modell (Llama/Mixtral via EU-Provider). Datenfluss verlässt CH/EU nie. | **Evaluations-Pflicht für Phase 2** |

#### Phasen-Strategie

- **Phase 1 (Übungsmodus, August 2026, INTERN-Daten):** Anthropic + Identifier-Pseudonymisierung + Zero-Retention-Vereinbarung. KI-Korrektur ist **opt-in pro Übung** (LP-Setting) — kann komplett deaktiviert werden. Argumentation: formative Übungsdaten sind INTERN, niedrigeres Risiko, Zero-Retention macht Anthropic-Konformität argumentierbar.
- **Phase 2 (Prüfungsmodus, Q1-Q2 2027, VERTRAULICH-Daten):** Schweizer/EU-KI-Hosting wird **Default**. Anthropic nur falls explizite DSA-Genehmigung mit dokumentierten Pseudonymisierungs- und Retention-Schutzmassnahmen. Wechsel-fähig durch Edge-Function-Abstraktion (Provider transparent austauschbar).

**Kein Phase-1-Launch ohne Zero-Retention-Vereinbarung.** Falls Anthropic-Verhandlung scheitert, wird Phase 1 ohne KI-Korrektur gelauncht (manuelle LP-Korrektur, kein Funktionsverlust für die SuS-Übungs-Erfahrung).

---

## 4. Architektur

### 4.1 Hosting

| Komponente | Hauptpfad | Alternative / Notfall |
|---|---|---|
| **Backend-Compute + DB** | peaknetworks managed Supabase (RZ Gais Schweiz, Tier IV, ISO 27001, AT/CH-Jurisdiktion, kein CLOUD Act) | Self-hosted CH-VPS (Exoscale/Infomaniak) bei Anbieter-Problemen |
| **Frontend-Hosting** | gleicher peaknetworks-Server (statisches Hosting neben Supabase) | Cloudflare Pages mit EU-Region wenn globale Performance nötig wird (kein Lock-in: Wechsel = paar Stunden) |
| **Material-Storage (PDFs, Bilder)** | Supabase Storage auf peaknetworks (Default) | EDUBERN PCDS Nextcloud-Service wenn evaluiert+verfügbar (DSA-bereits-zugelassen für VERTRAULICH) |
| **Domain** | `examlab.ch` (bereits gekauft durch DUY) | — |
| **Backup-Strategie** | Tägliche Snapshots durch peaknetworks (10 Tage) + wöchentlicher off-site-Export (S3-kompatibel) | Wiederherstellungs-Test 1×/Quartal |
| **KI-Anbieter** | Anthropic Claude (Pseudonymisierung server-seitig) | Apertus / Swisscom AI für Phase 2 wenn ISDS-Konzept es verlangt |

**peaknetworks-Vertragsbedingungen** (zu klären im AVV-Mail) mit K.o.-Kriterien:

| Frage | Mindest-Anforderung | Deal-Breaker bei |
|---|---|---|
| Update-Prozess Supabase | Testbarkeit im Staging vor Produktiv-Update | Auto-Update ohne Testfenster |
| Backup-Strategie | Tägliche Snapshots + Restore-Test 1×/Quartal | Keine garantierten Restore-Tests |
| Uptime-SLA | ≥99% Monatsdurchschnitt, dokumentierte Wartungsfenster | Keine schriftliche SLA |
| Support-Reaktionszeit | <8h Werktags, schriftlich | Best-Effort ohne Antwortzeit-Garantie |
| DPA/AVV | Schweizer-DSG-konform, Subprozessor-Liste, AT/CH-Datenresidenz garantiert | Datenresidenz nicht in DPA verankert |
| Edge Functions / Auth / Realtime | Alle Supabase-Standard-Module aktiviert und supportet | Eingeschränktes Modul-Subset |
| Exit-Strategie | Vollständiger pg_dump + Storage-Export bei Vertragsende, max. 90 Tage Aufbewahrung danach | Keine Datenexport-Garantie |
| Datenresidenz | Ausschliesslich RZ Gais (CH), keine Replikation nach AT ohne explizite Genehmigung | Replikation ausserhalb CH ohne Opt-out |
| Application-Monitoring | Logs/Metrics/Alerts zugänglich (Eigene Dashboards oder API) | Nur Provider-internes Monitoring ohne Kundenzugriff |
| Frontend-Static-Hosting | Statisches Hosting auf gleichem Server oder direkt unterstützt | Falls nicht: Frontend auf Cloudflare Pages ausweichen (Reviewer-Kritik: Cloudflare ist US-Anbieter — Backup, nicht Hauptpfad) |

**Falls Mindest-Anforderungen nicht erfüllt:** Wechsel auf Self-hosted CH-VPS (Exoscale/Infomaniak), Aufwand ~2-5h/Monat statt managed.

### 4.2 Backend-Stack

**Supabase Self-Hosted** (managed bei peaknetworks). Komponenten:

| Modul | Verwendung |
|---|---|
| **PostgreSQL 15+** | Primary DB mit Row-Level Security pro Schule/LP |
| **Supabase Auth** | Google OAuth (LP+SuS via gymhofwil.ch / stud.gymhofwil.ch), Multi-Provider erweiterbar |
| **Supabase Realtime** | WebSocket-Subscriptions für Live-Monitoring (ersetzt Polling-Heartbeat) |
| **Supabase Storage** | Materialien (PDFs, Bilder, KI-generierte Bilder) mit per-Schule-Isolation |
| **Supabase Edge Functions** (Deno) | KI-Proxy mit Pseudonymisierung, CSV-Importer (Evento), Audit-Log-Pipeline, Aggregations-Endpoints |

**Begründung Supabase vs. Custom-Stack** (siehe Brainstorming-Diskussion):

- Postgres-RLS lebt im DB-Layer → kann nicht im App-Code "vergessen" werden. Bei VERTRAULICH-Daten massiver Sicherheitsgewinn.
- peaknetworks bietet managed Supabase → kein Self-Hosting-Schmerz.
- Edge Functions Deno-basiert für KI-Proxy ideal (Pseudonymisierung in ~50 Code-Zeilen).
- Open Source unter Apache 2.0 → Anbieterwechsel möglich falls peaknetworks ausfällt.

### 4.3 Authentifizierung

**Google OAuth via Supabase Auth** für LP UND SuS — Hofwil-spezifisch durch DUY verifiziert (Mai 2026).

- **LP**: Login mit `@gymhofwil.ch`-Konto (existierende Schul-ID, Google-Workspace).
- **SuS**: Login mit `@stud.gymhofwil.ch`-Konto. Identisch zum Schulbetrieb — keine separate ExamLab-Credentials.
- **Externe LP** (zukünftig): später erweiterbar auf andere `@gymXXX.ch`, eigene Email-Domains, oder Microsoft-OAuth via Supabase. Per-Schule-Allowlist im Datenmodell.

**Wichtig: M365-Track nicht relevant für ExamLab-Login.** Hofwil-LP nutzen Microsoft 365 via EDUBERN für andere kantonale Systeme (Evento, …), aber das Schul-Google-Workspace bleibt die ExamLab-Auth-Quelle. **Nicht** über Cross-Provider-SSO mit M365 mappen — würde unnötige Komplexität schaffen.

**OAuth-Provider-Erweiterung später:** Supabase Auth unterstützt Multi-Provider (Google + Microsoft + SAML) parallel. Wenn externe Schulen einsteigen die auf M365 sind, kommt der Microsoft-Provider mit ~5 Zeilen Konfiguration dazu. Architektur-vorbereitet, nicht implementiert.

**Klassenlisten via Evento-CSV-Import**:

- DUY hat Zusicherung für regelmässige CSV-Exporte aus Evento (Kurse, Schülerlisten).
- Edge Function `importEvento` parst die CSV und schreibt in `classes` + `students`-Tabellen.
- Manueller Trigger (LP-UI-Button) oder zeitgesteuert per Cron (Supabase Cron Extension).

### 4.4 Datenmodell-Skizze (high-level)

```
schools
  - id, name, plan_id, billing_status, gratis_bis, ...

plans
  - id, name (free/basic/pro), max_lp_per_school, max_fragen_per_lp, ...

users (LP)
  - id, school_id (FK), email, oauth_provider, rolle, ...

students
  - id, school_id (FK), email, klasse, evento_id, ...

classes
  - id, school_id (FK), name, semester, lp_id (FK), ...

questions (vereinheitlicht statt aktuelle Sheet-Tab-Aufteilung BWL/VWL/Recht/IN)
  - id, lp_id (FK), school_id (FK), fach, typ, content (jsonb), bloom, ...

question_tags
  - question_id (FK), tag_id (FK)

pools
  - id, lp_id (FK), fach, thema, ...

pool_questions
  - pool_id (FK), question_id (FK)

exams (Prüfungen)
  - id, lp_id (FK), school_id (FK), class_id (FK), titel, status, ...

exam_attempts (eine pro SuS pro Prüfung)
  - id, exam_id (FK), student_id (FK), status, started_at, submitted_at, ...

exam_answers (eine pro Frage pro Attempt)
  - id, attempt_id (FK), question_id (FK), antwort (jsonb), korrektur (jsonb), punkte_erhalten, ...
  -- RLS: nur LP der Prüfung + Student selbst (mit gefilterten Feldern) sieht das

practice_attempts (Übungsversuche - INTERN klassifiziert)
  - id, student_id (FK), question_id (FK), antwort (jsonb), korrekt, attempted_at, ...

ki_calls (Audit-Log)
  - id, lp_id, kontext, pseudonym_id, tokens_used, modell, ...
  -- kein SuS-Identifier in Klartext
```

**RLS-Strategie**:

- `auth.uid()` aus JWT identifiziert den User.
- Alle Tabellen mit `school_id`: RLS-Policy `school_id = current_setting('app.current_school')::uuid`.
- LP sieht nur eigene Fragen/Pools/Prüfungen (`lp_id = auth.uid()`) plus Cross-LP-geteilte Inhalte (separate sharing-Tabelle).
- SuS sieht nur eigene Antworten + Fragen der eigenen Prüfungen.
- Cross-School-Isolation ist DB-erzwingend.

### 4.5 Daten-Migration

**Was wird migriert**:

- Fragensammlung (LP-eigene Fragen): Apps-Script-Sheets → Postgres-Schema. Verlustfrei dank existierender `Frage`-Type in `packages/shared`.
- LP-Profile, Pools, Tags, Bewertungsraster.

**Was wird NICHT migriert**:

- SuS-Antworten und Korrektur-Daten: ExamLab war nicht produktiv, alle Daten sind Test-/Dev-State.
- Apps-Script-`Probleme-Dashboard`-Einträge: irrelevant für Produktion.

**Migration-Tool**: Einmaliges Node-Skript `scripts/migrate-from-apps-script.ts`. Liest Apps-Script-`getFragensammlung`-Endpoint mit existierendem Service-Token, schreibt direkt in neue Supabase-Tabellen. Idempotent durch Question-IDs.

**Field-Drift-Audit als expliziter Migrations-Task.** Der Apps-Script-Vertrag hat Identifier-Inkonsistenzen die explizit normalisiert werden müssen:

- **`musterlosung` vs. `musterloesung`** (3 Lager im Code, siehe `.claude/rules/code-quality.md`): Migration vereinheitlicht alle Vorkommen auf `musterloesung` (mit `e`). Sheet-Spalte `musterlosung` wird zu `musterloesung` umbenannt, Frontend-Field-Drift wird aufgelöst. **Vorteil:** Bundle-P-Cleanup wird durch die Migration kostenlos miterledigt.
- **Andere `Frage`-Felder** mit Hybrid-Sprache (deutsch/englisch): Beibehalten gemäss Sprach-Konvention (`schueler`/`pruefung` deutsch ohne Umlaut, `id`/`data` englisch). Keine Umbenennungen ohne triftigen Grund.
- **`AppOrt` vs. `Favorit`**: bereits durch Cluster E-Refactor in der Apps-Script-Phase erledigt. Migration nutzt nur den `Favorit`-Type.

Migrations-Skript hat **Trockenlauf-Modus** (`--dry-run`): liest Apps-Script-Daten, baut Postgres-INSERT-Statements im Memory, schreibt Diff-Report (z.B. „2'305 Fragen, davon 17 mit Field-Drift `musterlosung` → `musterloesung` umbenannt"). Erst nach Diff-Review wird Vollmigration ausgeführt.

### 4.6 Frontend-Pattern-Migration

Stack bleibt unverändert: **React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap + KaTeX + CodeMirror 6 + Vitest**.

**Drei Pattern werden migriert** (weil sie bei 20k+ Fragen nicht skalieren):

| Pattern | Heute | Neu |
|---|---|---|
| Suche | Lunr.js im Frontend, alles in IDB-Cache | Postgres FTS (`tsvector`) via Edge Function, server-side paginiert |
| Caching | "Alles in IDB" — funktioniert nur bis ~5k Fragen | Server-side Pagination + selektiver IDB-Cache nur für aktive Prüfung (Offline-Fähigkeit) |
| Live-Monitoring | Polling-Heartbeat alle 5s | Supabase Realtime WebSocket-Subscription |

**Adapter-Pattern**: Bestehender `AppsScriptAdapter` wird durch neuen `SupabaseAdapter` ersetzt. Frontend-Komponenten (Editoren, Frage-Renderer, Korrektur-UI) bleiben unverändert. Adapter-Interface `pruefungApi.ts`, `korrekturApi.ts`, `fragenBulkApi.ts`, etc. bleibt API-stabil.

**Performance-Ziele (zu validieren mit echten Benchmarks während Implementierung):**

- API-Latenz: Ziel 50-100ms p95 (vs. heute 1'500-2'000ms p95)
- Suche über 20k Fragen: Ziel <50ms (vs. heute 2-3s bei Lunr-Reload im Frontend)
- Live-Monitoring Latenz: Ziel <500ms (vs. heute 5s Polling-Intervall)

Diese Zahlen sind **Annahmen basierend auf typischen Supabase/Postgres-Charakteristiken**, nicht gemessene Realität. Validierung erfolgt im Pilot (KW 31-32) mit echten Daten. Falls erheblich abweichend, werden Performance-Massnahmen ergänzt (DB-Indizes-Optimierung, Caching-Layer, Edge-Function-Cold-Start-Mitigation).

### 4.7 Multi-Tenancy-Vorbereitung

Schema enthält `school_id` und `plan_id` vom ersten Tag, aber **kein Pay-Layer** wird implementiert:

- Stripe / Payrexx-Integration: nicht im Scope. Kommt erst wenn externe Schule wirklich zahlt.
- Plan-Quoten-Enforcement (max_lp_per_school etc.): nicht im Scope. Aktuell alle gratis Hofwil-LP, Quoten sind effektiv unendlich.
- **Architektur-Hooks** (RLS-Policies, Foreign-Keys, Tabellen-Schema): vom ersten Tag, kostet kaum mehr Implementierungs-Zeit, erspart späteren Refactor.

### 4.8 Datenflüsse — Hauptpfade

```
LP-Login:
  Browser → Cloudflare-/peaknetworks-DNS → examlab.ch
  → React-App → Supabase Auth Google OAuth
  → JWT mit school_id, lp_id-Claim
  → RLS aktiv für alle nachfolgenden Queries

LP erstellt Frage:
  React-Frageneditor → supabase-js client → INSERT mit RLS-Check
  → Supabase Realtime broadcastet update an andere LP-Tabs des gleichen LP
  → Edge Function indexiert FTS-Vector

SuS startet Übung:
  Browser → examlab.ch → Google OAuth Student
  → JWT mit school_id, student_id-Claim
  → SELECT auf pool_questions mit RLS-Filter
  → Antwort wird in practice_attempts gespeichert
  → Optional KI-Korrektur via Edge Function

KI-Korrektur (Übung oder Prüfung):
  Edge Function:
    1. Empfängt antwort + question_id + attempt_id
    2. Lookup question + bewertungsraster aus DB
    3. Pseudonymisierung: ersetze student_id durch pseudonym_id
    4. POST an Anthropic API mit nur (antwort, frage, raster, pseudonym)
    5. Antwort speichern + ki_calls-Audit-Log Eintrag

Live-Prüfungs-Monitoring (LP):
  LP-Browser subscribe('exam_attempts WHERE exam_id=X')
  → Supabase Realtime pusht WebSocket-Events bei jedem SuS-Update
  → LP sieht Live-Fortschritt ohne Polling

Material-Upload (PDF / Bild):
  LP wählt Datei → multipart POST an Supabase Storage
  → file_url wird in question.media gespeichert
  → SuS lädt via signed-URL (zeitbegrenzt, RLS-gesteuert)

Evento-CSV-Import:
  LP triggert Edge Function `importEvento`
  → Parsed CSV → INSERT/UPDATE in students + classes
  → Idempotent durch evento_id
```

---

## 5. Roadmap & Migration-Workflow

### 5.1 Greenfield-Strategie (kein Dual-Betrieb)

Apps-Script wird **übersprungen**. Direkter Cut-In auf neue Plattform zum Schuljahresstart. Begründung:

- Apps-Script ist nicht produktiv → Cut-Over hat keine externen Stakeholder.
- Dual-Betrieb erzeugt Wartungs-Overhead ohne Mehrwert.
- Apps-Script-Performance würde ExamLab-Wahrnehmung der ersten SuS verderben — kein produktives Ausspielen lohnt sich.

Apps-Script-Code wird im Repo als **Migration-Referenz** behalten (Schema-Mapping, Data-Migration), aber nicht mehr deployed.

### 5.2 Zeitplan (Engineering Claude-Code-beschleunigt + Compliance Realzeit)

**Wichtige Anpassung gegenüber initialer Schätzung:** DSA-Antwortzeit ist im Kanton Bern realistisch **4-12 Wochen**, nicht 2. Phase 2 (Prüfungsmodus mit VERTRAULICH-Daten) wird daher auf **Q1-Q2 2027** verschoben. Phase 1 (Übungsmodus mit INTERN-Daten) startet wie geplant August 2026 — INTERN-Daten brauchen nur ISDS-Analyse Stufe 1 (Selbstdokumentation der Schule), kein DSA-Approval.

| KW | Datum | Engineering | ISDS-Track | Mail-Track |
|---|---|---|---|---|
| 21-22 | 18.05.-31.05. | Spec abgeschlossen, Plan via writing-plans skill | — | **Mails raus:** ISDS-Beratung, MBA, peaknetworks (mit AVV-Anforderungen), EDUBERN, Schul-IT, Anthropic (Zero-Retention) |
| 23-24 | 01.06.-14.06. | Backend-Skeleton, Schema, Google OAuth | KAIO-Vorlage einarbeiten | AVV peaknetworks verhandeln, CoP-Beitritt |
| 25-26 | 15.06.-28.06. | SupabaseAdapter, Edge Functions, KI-Proxy mit Pseudonymisierung | **ISDS-Analyse Stufe 1 schreiben** (ausreichend für Übungsmodus-Launch) | Anthropic Zero-Retention abklären |
| 27-28 | 29.06.-12.07. | Frontend-Pattern-Migration (FTS, Realtime, Cache), Daten-Migration-Skript mit Field-Drift-Audit | **ISDS-Konzept Stufe 2 beginnen** (für Phase 2 vorbereitet, KEIN Blocker für Phase 1) | — |
| 29-30 | 13.07.-26.07. | Integration-Tests, Browser-E2E, Performance-Validierung gegen Ziele aus §4.6, Evento-CSV-Importer | — | — |
| 31-32 | 27.07.-09.08. | Soft-Launch DUY-eigene Klassen, Bug-Fixing | — | Schul-IT-Cut-Over: DNS examlab.ch |
| **ab KW 33** | **10.08.+** | **PHASE 1 PRODUKTIV: Übungsmodus** (INTERN, KI-Korrektur opt-in mit Zero-Retention) | ISDS-Analyse Stufe 1 abgeschlossen | — |
| Q4 2026 | Sep-Dez | Prüfungsmodus implementieren parallel zum Üben-Betrieb. Schweizer-KI-Provider evaluieren | **ISDS-Konzept Stufe 2 abschliessen + DSA einreichen** | Evaluations-Anfragen Apertus / Swisscom AI |
| **Q1 2027** | **Jan-Mar** | DSA-Approval erwartet (Mitte des Quartals realistisch) | DSA-Review-Iterationen, ggf. Anpassungen | — |
| Q2 2027 | Apr-Jun | **PHASE 2 PRODUKTIV: Prüfungsmodus** mit Schweizer-KI als Default (sofern Approval) | — | Erste externe LP wenn Interesse |
| Q2-3 2027 | Apr-Aug | ICSG-Übergang verarbeiten (Vorgaben hat sich Mitte 2026 möglicherweise geändert) | ICSG-Compliance-Update | — |

**Wenn DSA-Approval später kommt:** Phase 2 verzögert sich entsprechend. Phase 1 bleibt davon unberührt — sie ist als eigenständige Wertschöpfung gebaut.

### 5.3 Soft-Launch-Strategie August 2026

**Fallback-Mode falls ISDS-Konzept-DSA-Approval nicht rechtzeitig**:

- Start mit **reinem Übungsmodus** (Daten sind INTERN — kein DSA-Approval erforderlich, nur ISDS-Analyse Stufe 1)
- Prüfungs-Modul wird ausgeblendet / deaktiviert bis Approval da ist
- Übungs-Pool zentrale Wertschöpfung für SuS — wesentlicher Mehrwert auch ohne Prüfungsmodul

**Pilot-Constraints**:

- Mindestens 2 Wochen vor Schuljahresstart (Ende Juli) End-to-End-Test mit DUY-eigenen Klassen-Daten.
- Performance-Baseline messen: API-Latenz, Suche, Live-Monitoring.
- 1 Tag Buffer für Hotfixes ohne SuS-Druck.

### 5.4 Produktiv-Phase ab Schuljahr 26/27

**Kein Bugfix / Feature direkt auf Produktion.** Workflow:

- `main`-Branch deployed auf `examlab.ch` (Produktion).
- `preview`-Branch deployed auf `preview.examlab.ch` (Staging) — analog aktueller Workflow.
- Feature-Branches → PR → Tests → preview-Merge → Browser-E2E → main-Merge.
- Hotfixes können fast-path über `fix/...`-Branch direkt nach E2E mergen, aber NIE ohne lokalen Tests + Browser-Verifikation.

**Deploy-Fenster**:

- Werktags abends (nach 18:00) oder am Wochenende.
- **Niemals während aktiver Prüfungsdurchführung.** Prüfungs-Kalender als Sperrliste.

---

## 6. Risiken & Offene Punkte

| # | Risiko / Offener Punkt | Mitigation / Klärungs-Pfad |
|---|---|---|
| 1 | DSA-Approval-Zeit 4-12 Wochen | Im Zeitplan §5.2 eingepreist. Phase 1 (Übungsmodus, INTERN) braucht kein DSA-Approval — startet wie geplant August 2026. Phase 2 (Prüfungsmodus) verschiebt sich auf Q1-Q2 2027 |
| 2 | peaknetworks-AVV-Verhandlung zieht sich | Mail KW 21 raus mit klaren K.o.-Kriterien (§4.1). Fallback: Self-hosted CH-VPS (Exoscale/Infomaniak) |
| 3 | EDUBERN PCDS-App-Backend-Tauglichkeit unbekannt | Mail an EDUBERN parallel. PCDS könnte sich auf Material-Storage reduzieren — Backend bleibt dann ausschliesslich auf peaknetworks |
| 4 | ICSG-Übergang Mitte 2026 trifft Migration | In ISDS-Anfrage explizit klären welche Vorlage zu verwenden ist. Erwartung: kleinere Anpassungen, kein Re-Design |
| 5 | **Anthropic-Daten-Retention** (Standard-API speichert ~30 Tage in Logs) | **Zero-Retention-Vereinbarung mit Anthropic Pflicht vor Phase-1-Launch.** Falls nicht erreichbar: Phase 1 ohne KI-Korrektur (manuelle LP-Korrektur), oder direkt Schweizer/EU-KI-Anbieter. KEIN Launch mit Standard-Retention. |
| 6 | KI-Inhalts-Identifikation (Aufsatz-Antworten enthalten Klarnamen, biografische Details) | Technisch nicht mitigierbar. Pädagogische Aufklärung der SuS. Im ISDS-Konzept explizit als Restrisiko dokumentiert. Schweizer-KI-Hosting löst Problem in Phase 2 strukturell. |
| 7 | **Migrations-Rollback im August 2026** — kein Apps-Script-Fallback wegen Cut-In | (a) Wöchentliche Pilot-Tests Juni-Juli mit echten DUY-Daten. (b) Falls Launch August scheitert: 2-Wochen-Verzögerung statt produktiv = SuS-Üben startet ohne Tool, kein Rückfall auf Apps-Script. (c) Notfall-Rollback-Plan: Letzte Backup-Version restore auf Backup-Provider |
| 8 | Daten-Migration aus Apps-Script-Sheets verliert Edge-Cases | Migrations-Skript mit `--dry-run`-Modus + Diff-Checker, danach Vollmigration mit Validierungs-Pass. Field-Drift-Audit (§4.5) als expliziter Task |
| 9 | Schul-IT-Verzögerung bei DNS-Setup für examlab.ch | Mail KW 21 an Schul-IT, alternativ Subdomain `examlab.gymhofwil.ch` als Fallback |
| 10 | **Bus-Faktor 1** — wenn DUY ausfällt, kennt niemand das System | (a) Architektur-Doku in `docs/` mit operativem Wiederinbetriebnahme-Runbook. (b) **Stellvertreter-Plan**: 1-2 Hofwil-LP technisch einarbeiten (mind. Login + DB-Zugriff + Restore-Prozedur dokumentiert). (c) Schul-CISO-Rolle benennen — wer hat formelle Verantwortung wenn DUY nicht erreichbar? **Dies muss im ISDS-Konzept Kapitel 1.4 verankert sein.** |
| 11 | peaknetworks geht insolvent / stellt Service ein | Wöchentliche off-site-Backups (S3-kompatibel anderer Anbieter), Exit-Strategie im AVV festschreiben, Supabase ist Open Source → jeder anderer Provider übernehmbar |
| 12 | **Minderjährigen-Schutz** (Gym1-SuS sind teilweise <16 Jahre alt) | KDSG verlangt erhöhten Schutz für Daten von Minderjährigen. Konkret: (a) Einwilligung der Eltern für SuS <16 für KI-Korrektur (opt-in pro Klasse). (b) Im ISDS-Konzept Kap. 5 Berechtigungs-Schema mit Alter-Sensitivität. (c) Leitfaden §7.1 als Grundlage zitieren. |
| 13 | **Archivierungs-Lifecycle** (ArchG / MBA-Aufbewahrungs-Vorgaben) | MBA-Vorgabe 200.90.900.1 "Aufbewahrung und Vernichtung von Akten an kantonalen Mittelschulen" bestimmt Retention-Fristen. Aktuell unklar: wie lange werden Prüfungsdaten aufbewahrt, wann werden sie gelöscht? **Klärung im Mail an MBA-Rechtsdienst.** Architektur: `deleted_at`-Spalten + scheduled-Delete-Job ab Tag der Klärung. |
| 14 | Performance-Ziele §4.6 sind Annahmen, nicht gemessen | Validierung im Pilot KW 31-32 mit echten Daten. Falls Ziele verfehlt: Performance-Massnahmen (DB-Indizes, Caching, Edge-Function-Tuning) während Soft-Launch-Phase |
| 15 | Frontend-Hosting bei peaknetworks unklar (primär Supabase-Spezialist) | Bei AVV-Verhandlung explizit klären: bietet peaknetworks Static-Hosting? Falls nein: Fallback Cloudflare Pages — **mit klarem Bewusstsein dass Cloudflare US-Anbieter ist** (aber Frontend hat keine vertraulichen Daten, daher rechtlich zulässig) |

---

## 7. Mail-Kampagne (Aktions-Items, KW 21)

Konkrete Empfänger und Themen — Templates teilweise in `ExamLab/docs/backend migration/backend-migration.md` §8 vorhanden, müssen aktualisiert werden mit Stand 18.05.2026.

| # | Empfänger | Betreff | Inhalt-Kern | Vorlage in |
|---|---|---|---|---|
| 1 | `ISDS-Beratung@be.ch` + cc MBA-Rechtsdienst (Antoinette Hofmann) | Anfrage ISDS-Vorlage und Übergangs-Klärung ICSG für Schul-Eigenentwicklung | Vorlage anfordern. Klären: ISDS-DV vs. ICSG-Vorlage. Spezifika für ExamLab-Architektur mitteilen. Aufbewahrungsfristen für Prüfungsdaten erfragen (Verweis auf MBA-Vorgabe 200.90.900.1). | Neu zu erstellen |
| 2 | `digitalboard-sek2@be.ch` | CoP-Beitritt Digitales Prüfen + CoP Informationssicherheit & Datenschutz | Beitritt anmelden, Vorhaben kurz darstellen, Peer-Review für ISDS-Konzept erbitten | Neu zu erstellen |
| 3 | peaknetworks Schweiz | Anfrage Managed Supabase Hosting + AVV mit K.o.-Kriterien (§4.1) | Technische Klärungen mit Mindest-Anforderungen, Vertragsverhandlung anstossen, Frontend-Static-Hosting-Frage adressieren | `backend-migration.md` §8.4 (aktualisieren mit K.o.-Kriterien aus §4.1 dieser Spec!) |
| 4 | EDUBERN Service Desk | Anfrage Tauglichkeit Private Cloud Data Storage (Nextcloud) für ExamLab-Material-Storage | Klären: nur File-Storage oder auch App-Backend möglich? Kosten? Bedingungen? | Neu zu erstellen |
| 5 | Hofwil Schul-IT (Christian Salvisberg / Martin Essig) | Backend-Migration ExamLab — DNS examlab.ch + Schul-CISO-Rolle + Evento-CSV-Bestätigung | DNS-Routing absprechen, Stellvertreter-Plan diskutieren (Bus-Faktor-Mitigation), Evento-CSV-Export-Modalitäten klären | `backend-migration.md` §8.2 (aktualisieren!) |
| 6 | **NEU: Anthropic Sales / Enterprise** | Zero-Retention-Vereinbarung für Schul-Use-Case | Klären: Zero-Retention-Tier verfügbar? Kosten? Vertragsbedingungen? Alternative: BAA / vertragliche Zero-Retention für Workspace-Plan | Neu zu erstellen — **Blocker für Phase-1-KI-Korrektur** |
| 7 | (später, nach #1 Antwort) PHBern Schulinformatik | Beratung beim Schreiben des ISDS-Konzepts | Nur falls #1 + #2 nicht ausreichen | Neu, später |
| 8 | (später, Q4 2026) Apertus / Swisscom AI | Schweizer-KI-Hosting für Prüfungsmodus-Korrektur (Phase 2) | API-Verfügbarkeit, Modelle, Kosten, DPA | Neu, später (Q4 2026) |

---

## 8. Was diese Spec nicht abdeckt

- **Konkreter Implementations-Plan** (Reihenfolge der Tasks, Test-Plan, Akzeptanzkriterien) → kommt via `writing-plans` Skill in separatem Dokument.
- **Detailliertes Datenbank-Schema** (alle Tabellen, alle Spalten, alle Indizes) → Teil des Plans, nicht der Spec.
- **UI-Design-Änderungen** → minimal, Stack bleibt unverändert. Falls Anpassungen nötig, separate UI-Spec.
- **Spätere Lizenzgebühr-Strukturen für externe Schulen** → kommt mit erstem konkreten externen Interessenten.

---

## 9. Entscheidungs-Log

Konsolidierte Liste der Entscheidungen aus der Brainstorming-Phase 18.05.2026 (inkl. Reviewer-Iteration 1):

1. **Strategische Positionierung Option A "erweitert"**: ExamLab bleibt eigenständig, Multi-School technisch vorbereitet, Anschluss-Strategie über CoPs.
2. **Hosting Hauptpfad peaknetworks** managed Supabase. EDUBERN PCDS für Material-Storage parallel anfragen. Hofwil-smartlearn-Server als Dev/Test-Backup.
3. **Backend-Stack Supabase** wegen RLS-Sicherheit + Edge Functions + managed Verfügbarkeit.
4. **Frontend bleibt** React/Vite/TS/Tailwind. Drei Pattern werden migriert: Suche, Caching, Realtime. Hosting auf gleichem peaknetworks-Server, Fallback Cloudflare Pages mit dokumentiertem US-Vendor-Trade-off.
5. **Greenfield-Migration ohne Apps-Script-Produktiv**: Cut-In ab August 2026.
6. **Zwei-Phasen-Rollout (revidiert)**: August 2026 Übungsmodus (INTERN, ohne DSA-Approval möglich), **Q1-Q2 2027** Prüfungsmodus (verschoben wegen realistischer DSA-Antwortzeit 4-12 Wochen).
7. **Google OAuth** für LP UND SuS, durch DUY verifiziert. M365-Track für ExamLab nicht relevant. Evento-CSV-Import für Klassenlisten.
8. **KI-Compliance (verschärft)**: Identifier-Pseudonymisierung + **Zero-Retention-Vereinbarung mit Anthropic Pflicht vor Phase-1-Launch** (kein Launch mit Standard-Retention). Schweizer/EU-KI-Hosting als **Phase-2-Default**, nicht Backup. Inhalts-Identifikation als Restrisiko dokumentiert.
9. **Closed Source**. Open-Source-Veröffentlichung wird nicht angestrebt. Public-Money-Public-Code-Spannung explizit im ISDS-Konzept Kap. 1 zu adressieren.
10. **Lizenzmodell**: Hofwil-LP gratis Jahr 1, ggf. Nutzergebühr Jahr 2+. Externe Schulen Bezahlmodell wenn Bedarf.
11. **Multi-Tenancy-Schema** (RLS + schools + plans) wird vom ersten Tag mit-gebaut. Pay-Layer (Stripe etc.) kommt später nach Bedarf.
12. **ISDS-Konzept Stufe 2** wird parallel zur Implementierung geschrieben (für Phase 2 erforderlich, kein Blocker für Phase 1). KAIO-Vorlage über DSA / `ISDS-Beratung@be.ch`.
13. **Field-Drift-Audit** (`musterlosung` → `musterloesung`) wird im Migrations-Skript als expliziter Task ausgeführt — Bundle-P-Cleanup wird durch Migration kostenlos miterledigt.
14. **Bus-Faktor-Mitigation**: Stellvertreter-Plan + Schul-CISO-Rolle benennen, im ISDS-Konzept Kap. 1.4 verankert.
15. **Minderjährigen-Schutz**: KI-Korrektur opt-in pro Klasse mit Eltern-Einwilligung für SuS <16, im ISDS-Konzept Kap. 5 mit Alter-Sensitivität.
16. **Archivierungs-Lifecycle** (MBA-Vorgabe 200.90.900.1): Retention-Fristen im Mail an MBA-Rechtsdienst zu klären, `deleted_at`-Spalten + scheduled-Delete-Job ab Klärung.
17. **Performance-Aussagen** sind Ziele, nicht Eigenschaften — Validierung im Pilot KW 31-32.

---

## 10. Versions-Historie

| Version | Datum | Änderung | Autor |
|---|---|---|---|
| 0.1 | 2026-05-18 | Spec aus Brainstorming-Session erstellt | Claude + DUY |
| 0.2 | 2026-05-18 | Reviewer-Iteration 1 eingearbeitet: KI-Compliance verschärft (Zero-Retention, Inhalts-Identifikation), SuS-OAuth-Annahme verifiziert (Google), DSA-Antwortzeit eingepreist (Phase 2 → Q1-Q2 2027), 5 zusätzliche Risiken (Anthropic-Retention, Migrations-Rollback, Minderjährige, Archivierung, Frontend-Hosting-Klärung), Field-Drift-Audit, Performance-Ziele-Disclaimer, Public-Money-Public-Code-Spannung dokumentiert, Anthropic-Mail (#6) ergänzt | Claude + DUY |

*Spec wird angepasst, sobald externe Antworten (peaknetworks-AVV, EDUBERN-PCDS-Tauglichkeit, KAIO-ISDS-Vorlage, ICSG-Übergang-Klärung, Anthropic-Zero-Retention) eingegangen sind. Bekannte offene Punkte (P3 aus Reviewer-Feedback): konkrete Frontend-Hosting-Bestätigung peaknetworks, Anthropic-Vertragsdetails.*
