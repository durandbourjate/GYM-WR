# ============================================================
# MUSTERLÖSUNG – Übung 7: Rätsel und Codes mit Operatoren
# ============================================================
# Operatoren sind die Werkzeuge für Berechnungen und Vergleiche.
# Arithmetisch: +, -, *, /, //, %, **
# Vergleich:    ==, !=, <, >, <=, >=
# Logisch:      and, or, not
# ============================================================


# ============================================================
# Teilaufgabe 1: Das Sphinx-Rätsel
# ============================================================

print("=== Das Sphinx-Rätsel ===")
print()

# Das Rätsel der Sphinx:
# "Was geht am Morgen auf vier Füssen, am Mittag auf zwei
# Füssen und am Abend auf drei Füssen?"
# Antwort: Der Mensch (Baby, Erwachsener, Greis mit Stock)

morgen = 4    # Baby krabbelt auf 4 Füssen
mittag = 2    # Erwachsener geht auf 2 Füssen
abend = 3     # Alter Mensch mit Stock: 3 "Füsse"

# Code zusammensetzen: 4-2-3 → 423
# Wir müssen die Ziffern an die richtige Stelle setzen:
# morgen (4) ist die Hunderterstelle → * 100
# mittag (2) ist die Zehnerstelle   → * 10
# abend  (3) ist die Einerstelle    → * 1
tresor_code = morgen * 100 + mittag * 10 + abend
print(f"Der Tresorcode ist: {tresor_code}")
# Ausgabe: Der Tresorcode ist: 423

# ANTWORT auf die Frage: Was passiert bei einfacher Addition?
einfache_summe = morgen + mittag + abend
print(f"Einfache Addition: {einfache_summe}")
# Ausgabe: 9 — das ist NICHT der Code, sondern die Summe!
# 4 + 2 + 3 = 9, aber wir brauchen 423 (Ziffern nebeneinander)

print()


# ============================================================
# Teilaufgabe 2: Das Zähl-Rätsel
# ============================================================

print("=== Das Zähl-Rätsel ===")
print()

# Die Notiz im Lüftungsschacht verlangt:
# Zähle auf der Tresor-Notiz, wie oft die Ziffern 4, 7, 3 vorkommen.
# Die Tresor-Notiz nennt die Zahlen: 42 ("answer to life...") und 423

zahl_1 = 42    # "The answer to life, the universe and everything"
zahl_2 = 423   # Der Tresorcode

# Trick: Zahlen in Strings umwandeln und zusammensetzen
# str(42) → "42", str(423) → "423"
# "42" + "423" → "42423" (String-Verkettung!)
alle_ziffern = str(zahl_1) + str(zahl_2)
print(f"Alle Ziffern: {alle_ziffern}")
# Ausgabe: Alle Ziffern: 42423

# .count() zählt, wie oft ein Zeichen im String vorkommt
anzahl_4 = alle_ziffern.count("4")  # "4" kommt 2x vor (in 42 und 423)
anzahl_7 = alle_ziffern.count("7")  # "7" kommt 0x vor
anzahl_3 = alle_ziffern.count("3")  # "3" kommt 1x vor

print(f"Anzahl 4: {anzahl_4}")  # 2
print(f"Anzahl 7: {anzahl_7}")  # 0
print(f"Anzahl 3: {anzahl_3}")  # 1

# Koffercode zusammensetzen
# str() wandelt Zahlen in Strings um, damit wir sie verketten können
koffer_code = str(anzahl_4) + str(anzahl_7) + str(anzahl_3)
print(f"Der Koffercode ist: {koffer_code}")
# Ausgabe: Der Koffercode ist: 201

print()


# ============================================================
# Teilaufgabe 3: Code-Überprüfung mit Vergleichsoperatoren
# ============================================================

print("=== Code-Überprüfung ===")
print()

tresor_code = 423

eingabe = int(input("Tresorcode eingeben: "))

# == prüft auf Gleichheit (nicht verwechseln mit = für Zuweisung!)
# > und < ermöglichen Hinweise ("zu hoch" / "zu tief")
if eingabe == tresor_code:
    print("Korrekt! Der Tresor öffnet sich.")
elif eingabe > tresor_code:
    print("Der Code ist zu hoch.")
    # Beispiel: Eingabe 500 → 500 > 423 → "zu hoch"
elif eingabe < tresor_code:
    print("Der Code ist zu tief.")
    # Beispiel: Eingabe 100 → 100 < 423 → "zu tief"

# HINWEIS: elif wird nur geprüft, wenn die vorherige Bedingung
# False war. Es gibt also nie zwei Ausgaben gleichzeitig.

print()


# ============================================================
# Teilaufgabe 4: Logische Bedingungen im Spiel
# ============================================================

print("=== Logische Bedingungen ===")
print()

hat_taschenmesser = True
tresor_offen = False
hat_lueftungs_notiz = False

# Schritt 1: Lüftungsschacht öffnen (braucht Taschenmesser)
if hat_taschenmesser:
    print("Du schraubst das Gitter ab.")
    hat_lueftungs_notiz = True  # Notiz gefunden!

print()

# Schritt 2: Kann der Koffercode berechnet werden?
# Dafür braucht man BEIDE Hinweise: Tresor-Notiz UND Lüftungs-Notiz
# "and" → beide Bedingungen müssen True sein
# "not" → kehrt den Wert um (True → False, False → True)

if tresor_offen and hat_lueftungs_notiz:
    # Beide True → Spieler hat alle Informationen
    print("Du hast beide Hinweise! Du kannst den Koffercode berechnen.")
elif tresor_offen and not hat_lueftungs_notiz:
    # Tresor offen, aber Lüftungs-Notiz fehlt
    print("Dir fehlt noch die Notiz aus dem Lüftungsschacht.")
elif not tresor_offen and hat_lueftungs_notiz:
    # Lüftungs-Notiz da, aber Tresor noch zu
    print("Dir fehlt noch die Notiz aus dem Tresor.")
else:
    # Beides fehlt
    print("Dir fehlen noch beide Hinweise.")

# In unserem Fall: hat_taschenmesser=True, tresor_offen=False,
# hat_lueftungs_notiz=True → Ausgabe: "Dir fehlt noch die Notiz aus dem Tresor."

print()


# ============================================================
# Teilaufgabe 5: Wandelement berechnen
# ============================================================

print("=== Wandelement berechnen ===")
print()

wand_breite = 4       # Die Wand ist 4 Meter breit
element_breite = 1    # Jedes Wandelement ist 1 Meter breit

# // ist die Ganzzahl-Division (Division ohne Rest)
# 4 // 1 = 4 (die Wand hat 4 Elemente)
anzahl_elemente = wand_breite // element_breite

print(f"Die Wand hat {anzahl_elemente} Wandelemente.")
print(f"Wähle ein Element von 1 bis {anzahl_elemente}.")

wahl = int(input("Welches Wandelement? "))

# "and" verknüpft zwei Bedingungen: BEIDE müssen True sein
# wahl >= 1 → Element existiert (nicht 0 oder negativ)
# wahl <= anzahl_elemente → Element existiert (nicht zu hoch)
if wahl >= 1 and wahl <= anzahl_elemente:
    print(f"Du bringst die Sprengschnur an Element {wahl} an.")

    # Im Spiel: Nur Element 1 oder 2 in der Sackgasse (Südwand)
    # führt ins Treppenhaus
    if wahl <= 2:
        print("→ Dieses Element grenzt ans Treppenhaus!")
    else:
        print("→ Dieses Element grenzt leider nicht ans Treppenhaus.")
else:
    print("Dieses Element gibt es nicht!")


# ============================================================
# ZUSAMMENFASSUNG FÜR SCHÜLER:
# ============================================================
# Was du gelernt hast:
# - Arithmetische Operatoren: *, +, // für Berechnungen
# - .count() zum Zählen von Zeichen in Strings
# - str() und int() für Typumwandlung bei Berechnungen
# - Vergleichsoperatoren: ==, >, < für Code-Prüfung
# - Logische Operatoren: and, or, not für komplexe Bedingungen
#
# Drei Rätsel programmiert:
# 1. Sphinx-Rätsel → Tresorcode 423
# 2. Zähl-Rätsel → Koffercode 201
# 3. Wandelement-Auswahl → Sprengung
# ============================================================
