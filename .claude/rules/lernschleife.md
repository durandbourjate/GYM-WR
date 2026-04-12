# Lernschleife — Aus Fehlern systematisch lernen

## Wann greift diese Regel?
- Ein Bug wurde gefunden (egal ob durch Test, Browser, User)
- Ein Pattern hat sich als problematisch erwiesen
- Ein Ansatz musste mehrfach korrigiert werden

## Prozess
1. **Root Cause verstehen** — Warum ist der Fehler passiert?
   (Nicht: "Was war der Fix?" sondern: "Warum war der Code so?")
2. **Kategorie bestimmen:**
   - Technischer Fehler → Passendes Rule-File ergänzen (code-quality, safety-pwa, etc.)
   - Prozess-Fehler → Memory-File als Feedback anlegen
   - Projekt-Wissen → Bestehendes Rule-File erweitern (bilder-in-pools, etc.)
3. **Regel formulieren:**
   - Problem beschreiben (was ging schief)
   - Regel formulieren (was ab jetzt gilt)
   - Begründung (warum diese Regel)
4. **Einordnen:** In das thematisch passende Rule-File einfügen, NICHT ein neues File pro Fehler

## Ziel
Jeder Fehler passiert genau EINMAL. Die Regel verhindert Wiederholung.
Bestehende Rule-Files wachsen organisch durch echte Erfahrungen.
