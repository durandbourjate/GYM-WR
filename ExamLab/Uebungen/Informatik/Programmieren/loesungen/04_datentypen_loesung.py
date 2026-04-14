# ============================================================
# MUSTERLÖSUNG – Übung 4: Datentypen richtig einsetzen
# ============================================================
# Python unterscheidet verschiedene Datentypen. Die wichtigsten:
# - int:   Ganzzahlen (z.B. 423, -5, 0)
# - float: Kommazahlen (z.B. 4.0, 3.14)
# - str:   Text/Zeichenketten (z.B. "Hallo", "201")
# - bool:  Wahrheitswerte (True oder False)
# ============================================================


# ============================================================
# Teilaufgabe 1: Typen untersuchen
# ============================================================

tresor_code = 423          # Eine Ganzzahl (int)
koffer_code = "201"        # Ein String (str) — trotz Ziffern!
spiel_laeuft = True        # Ein Wahrheitswert (bool)
raumgroesse = 4.0          # Eine Kommazahl (float)

# type() zeigt den Datentyp einer Variable an
print("Typ von tresor_code:", type(tresor_code))
# Ausgabe: <class 'int'>

print("Typ von koffer_code:", type(koffer_code))
# Ausgabe: <class 'str'>

print("Typ von spiel_laeuft:", type(spiel_laeuft))
# Ausgabe: <class 'bool'>

print("Typ von raumgroesse:", type(raumgroesse))
# Ausgabe: <class 'float'>

# ANTWORT auf die Frage: Warum ist tresor_code ein int, aber
# koffer_code ein str?
# → tresor_code = 423       (ohne Anführungszeichen = Zahl)
# → koffer_code = "201"     (mit Anführungszeichen = Text)
#
# Im Spiel verwenden wir den Tresorcode als Zahl, weil wir ihn
# mit einer eingegebenen Zahl VERGLEICHEN wollen (z.B. < oder >).
# Den Koffercode verwenden wir als String, weil wir ihn als
# Zeichenfolge vergleichen (Zeichen für Zeichen).
# Beide Ansätze sind gültig — wichtig ist Konsistenz.


# ============================================================
# Teilaufgabe 2: Typumwandlung beim Tresorcode
# ============================================================

print()
print("=== Typumwandlung ===")

eingabe = "423"  # So kommt es von input() — IMMER als String!

# Vergleich String mit Zahl → KLAPPT NICHT wie erwartet
print(eingabe == 423)           # False!
# Erklärung: "423" (String) ist NICHT dasselbe wie 423 (Zahl).
# Python vergleicht hier zwei verschiedene Datentypen und sagt:
# "Ein Text ist niemals gleich einer Zahl."

# Lösung: Den String in eine Zahl umwandeln mit int()
eingabe_als_zahl = int(eingabe)
print(eingabe_als_zahl == 423)  # True!
# Jetzt vergleichen wir Zahl mit Zahl — das funktioniert.

# So sieht die Umwandlung im Detail aus:
print(f"eingabe = '{eingabe}' (Typ: {type(eingabe).__name__})")
print(f"eingabe_als_zahl = {eingabe_als_zahl} (Typ: {type(eingabe_als_zahl).__name__})")


# ============================================================
# Teilaufgabe 3: Gefährliche Umwandlungen
# ============================================================

print()
print("=== Gefährliche Umwandlungen ===")

# Das funktioniert problemlos:
print(int("42"))    # Ausgabe: 42
# Erklärung: "42" enthält nur Ziffern → int() kann es umwandeln.

# Das gibt einen Fehler (ValueError):
# print(int("hallo"))
# Fehlermeldung: ValueError: invalid literal for int() with base 10: 'hallo'
# Erklärung: "hallo" enthält Buchstaben, keine Ziffern.
# Python kann daraus keine Zahl machen.

# Das gibt ebenfalls einen Fehler:
# print(int("42.5"))
# Fehlermeldung: ValueError: invalid literal for int() with base 10: '42.5'
# Erklärung: "42.5" enthält einen Punkt. int() erwartet eine
# Ganzzahl ohne Komma. Lösung: Zuerst float(), dann int():
print(int(float("42.5")))  # Ausgabe: 42
# float("42.5") → 42.5, dann int(42.5) → 42 (abgerundet)

# WICHTIG FÜR DAS SPIEL:
# Wenn der Spieler statt einer Zahl einen Buchstaben eingibt,
# stürzt das Programm ab! Später lernt man try/except, um das
# abzufangen. Für jetzt reicht es, zu wissen, dass int() nur
# mit reinen Ziffern-Strings funktioniert.


# ============================================================
# Teilaufgabe 4: Bool-Werte im Spiel
# ============================================================

print()
print("=== Bool-Werte ===")

hat_taschenmesser = True
hat_papier = True
hat_sprengschnur = False

# Überraschung: Python behandelt True als 1 und False als 0!
# Deshalb kann man mit Bool-Werten rechnen.
anzahl_gegenstaende = hat_taschenmesser + hat_papier + hat_sprengschnur
print("Anzahl Gegenstände:", anzahl_gegenstaende)
# Ausgabe: 2 (True + True + False = 1 + 1 + 0 = 2)

# Bool-Werte als Bedingung in if-Abfragen:
# Man muss NICHT "== True" schreiben — "if variable:" reicht.
if hat_taschenmesser:
    print("Du hast ein Taschenmesser!")
    # Wird ausgeführt, weil hat_taschenmesser = True

if hat_sprengschnur:
    print("Du hast eine Sprengschnur!")
    # Wird NICHT ausgeführt, weil hat_sprengschnur = False

# Das Gegenteil prüfen mit "not":
if not hat_sprengschnur:
    print("Du hast noch keine Sprengschnur.")
    # Wird ausgeführt, weil not False = True


# ============================================================
# ZUSAMMENFASSUNG FÜR SCHÜLER:
# ============================================================
# Was du gelernt hast:
# - Die 4 wichtigsten Datentypen: int, float, str, bool
# - type() zeigt den Typ einer Variable
# - int("123") wandelt einen String in eine Zahl um
# - str(123) wandelt eine Zahl in einen String um
# - int() funktioniert NUR mit reinen Ziffern-Strings
# - True = 1 und False = 0 (man kann damit rechnen)
# - "if variable:" prüft, ob der Wert True ist
#
# Typische Fehlerquelle im Spiel:
# input() gibt IMMER einen String zurück!
# → Für Zahlenvergleiche: int(input("Code: "))
# → Für Textvergleiche: input("Richtung: ")
# ============================================================
