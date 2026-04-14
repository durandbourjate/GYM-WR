# ============================================================
# MUSTERLÖSUNG – Übung 6: Dynamische Texte mit Strings/f-Strings
# ============================================================
# f-Strings (formatierte Strings) erlauben es, Variablen direkt
# in einen Text einzufügen. Dazu setzt man ein f vor den String
# und schreibt Variablen in geschweifte Klammern {}.
# ============================================================


# ============================================================
# Teilaufgabe 1: Raumnamen dynamisch einsetzen
# ============================================================

# Raumnamen mit if/elif zuweisen
# Für jede Raumnummer gibt es einen passenden Namen
aktueller_raum = 32
raum_name = ""

if aktueller_raum == 1:
    raum_name = "Startraum"
elif aktueller_raum == 31:
    raum_name = "West-Ost-Korridor"
elif aktueller_raum == 32:
    raum_name = "Süd-Nord-Korridor"
elif aktueller_raum == 101:
    raum_name = "Büro Ost"
elif aktueller_raum == 102:
    raum_name = "Lüftungsschacht-Raum"
elif aktueller_raum == 103:
    raum_name = "Verbindungsraum"
elif aktueller_raum == 104:
    raum_name = "Sackgasse"
elif aktueller_raum == 201:
    raum_name = "Büro West"
elif aktueller_raum == 202:
    raum_name = "Tresorraum"

print(f"Du befindest dich im {raum_name}.")
# Ausgabe: Du befindest dich im Süd-Nord-Korridor.

# Raum wechseln — der Text passt sich automatisch an!
aktueller_raum = 202
raum_name = ""
if aktueller_raum == 1:
    raum_name = "Startraum"
elif aktueller_raum == 202:
    raum_name = "Tresorraum"
# (Alle elif-Blöcke wie oben — hier gekürzt)
print(f"Du befindest dich im {raum_name}.")
# Ausgabe: Du befindest dich im Tresorraum.

print()


# ============================================================
# Teilaufgabe 2: Inventar-Anzeige
# ============================================================

print("=== Inventar-Anzeige ===")
print()

hat_papier = True
hat_taschenmesser = False
hat_sprengschnur = False

print("=== Inventar ===")

# Wir zählen die Gegenstände mit einer Zähler-Variable
gegenstaende = 0

# Für jeden Gegenstand: Wenn vorhanden → anzeigen und zählen
if hat_papier:
    print("- Blatt Papier und Bleistift")
    gegenstaende = gegenstaende + 1  # Zähler um 1 erhöhen

if hat_taschenmesser:
    print("- Taschenmesser mit Schraubenzieher")
    gegenstaende = gegenstaende + 1

if hat_sprengschnur:
    print("- Sprengschnur mit Stoppuhr")
    gegenstaende = gegenstaende + 1

# f-String für die Zusammenfassung
print(f"Total: {gegenstaende} Gegenstand/Gegenstände")
# Ausgabe: Total: 1 Gegenstand/Gegenstände

# Jetzt mit mehr Gegenständen testen:
print()
hat_taschenmesser = True
hat_sprengschnur = True

print("=== Inventar (nach Fund) ===")
gegenstaende = 0
if hat_papier:
    print("- Blatt Papier und Bleistift")
    gegenstaende = gegenstaende + 1
if hat_taschenmesser:
    print("- Taschenmesser mit Schraubenzieher")
    gegenstaende = gegenstaende + 1
if hat_sprengschnur:
    print("- Sprengschnur mit Stoppuhr")
    gegenstaende = gegenstaende + 1
print(f"Total: {gegenstaende} Gegenstand/Gegenstände")
# Ausgabe: Total: 3 Gegenstand/Gegenstände

print()


# ============================================================
# Teilaufgabe 3: Statuszeile
# ============================================================

print("=== Statuszeile ===")
print()

aktueller_raum = 102
hat_papier = True
hat_taschenmesser = True
hat_sprengschnur = False

# Raumname per if/elif zuweisen (wie in Teilaufgabe 1)
raum_name = ""
if aktueller_raum == 102:
    raum_name = "Lüftungsschacht-Raum"
# (In der Praxis: alle Räume mit if/elif abdecken)

# Inventar als Emoji-Symbole zusammenbauen
# Wir starten mit einem leeren String und hängen Emojis an
inventar = ""
if hat_papier:
    inventar = inventar + "📄"       # String-Verkettung mit +
if hat_taschenmesser:
    inventar = inventar + "🔪"
if hat_sprengschnur:
    inventar = inventar + "💣"

# Wenn nichts im Inventar → "(leer)" anzeigen
if inventar == "":
    inventar = "(leer)"

# Alles in einer kompakten Statuszeile ausgeben
print(f"[Raum: {raum_name} | Inventar: {inventar}]")
# Ausgabe: [Raum: Lüftungsschacht-Raum | Inventar: 📄🔪]

# Noch ein Test mit anderem Zustand:
aktueller_raum = 1
hat_papier = False
hat_taschenmesser = False
hat_sprengschnur = False

raum_name = ""
if aktueller_raum == 1:
    raum_name = "Startraum"
inventar = ""
if hat_papier:
    inventar = inventar + "📄"
if hat_taschenmesser:
    inventar = inventar + "🔪"
if hat_sprengschnur:
    inventar = inventar + "💣"
if inventar == "":
    inventar = "(leer)"

print(f"[Raum: {raum_name} | Inventar: {inventar}]")
# Ausgabe: [Raum: Startraum | Inventar: (leer)]

print()


# ============================================================
# Teilaufgabe 4: Eingabe normalisieren
# ============================================================

print("=== Eingabe normalisieren ===")
print()

# .lower() → Grossbuchstaben werden zu Kleinbuchstaben
# .strip() → Leerzeichen am Anfang und Ende werden entfernt
# Diese Methoden können verkettet werden (Chaining).

eingabe = input("Wohin gehst du? ")

# Normalisierung: egal ob "Osten", "OSTEN", "  osten  " → "osten"
eingabe = eingabe.lower().strip()

if eingabe == "osten":
    print("Du gehst nach Osten.")
elif eingabe == "westen":
    print("Du gehst nach Westen.")
else:
    # f-String in der Fehlermeldung: zeigt dem Spieler, was er
    # eingegeben hat, damit er seinen Fehler erkennen kann
    print(f"'{eingabe}' ist keine gültige Richtung.")

# Teste mit: "Osten", "  osten  ", "OSTEN", "OsTeN"
# → Alle werden zu "osten" und funktionieren korrekt.
# Teste mit: "norden", "xyz"
# → Werden als ungültig erkannt.


# ============================================================
# ZUSAMMENFASSUNG FÜR SCHÜLER:
# ============================================================
# Was du gelernt hast:
# - f-Strings: f"Text {variable} mehr Text"
# - Variablen und Berechnungen in {} einfügen
# - if/elif-Ketten für Nachschlage-Logik (z.B. Raumnummer → Name)
# - String-Verkettung mit + ("A" + "B" = "AB")
# - .lower() und .strip() für robuste Eingabeverarbeitung
# - Methoden-Chaining: .lower().strip() in einer Zeile
#
# Drei Bausteine erstellt:
# 1. Dynamische Raumtexte mit if/elif und f-Strings
# 2. Inventar-Anzeige mit Emojis
# 3. Normalisierte Eingabeverarbeitung
# ============================================================
