# ============================================================
# MUSTERLÖSUNG – Übung 5: Spielereingaben mit input()
# ============================================================
# input() wartet darauf, dass der Spieler etwas eintippt und
# Enter drückt. Das Ergebnis ist IMMER ein String (Text).
# Wenn du eine Zahl brauchst, musst du umwandeln: int(input())
# ============================================================


# ============================================================
# Teilaufgabe 1: Erste Entscheidung
# ============================================================

print("""Du befindest dich in einem quadratischen Raum.
Vor dir steht ein Stahlkoffer mit einem gelben Zettel.
In einer Ecke liegen ein Blatt Papier und ein Bleistift.""")

print()

# input() zeigt den Text in Klammern an und wartet auf Eingabe.
# Das Ergebnis wird in der Variable 'wahl' gespeichert.
wahl = input("Was tust du zuerst? (papier/koffer): ")

print("Du hast gewählt:", wahl)
# Wenn du "papier" eintippst: Ausgabe → Du hast gewählt: papier
# Wenn du "koffer" eintippst: Ausgabe → Du hast gewählt: koffer
# Wenn du etwas anderes tippst: Das wird auch gespeichert!
# → Python prüft nicht automatisch, ob die Eingabe gültig ist.

print()
print("=" * 50)


# ============================================================
# Teilaufgabe 2: Richtungswahl
# ============================================================

print()
print("""Du stehst im Süd-Nord-Korridor.
Eine Tür führt nach Osten, eine nach Westen.""")

print()

# Hier verwenden wir .lower().strip() für robustere Eingabe:
# .lower() → wandelt alles in Kleinbuchstaben ("OSTEN" → "osten")
# .strip() → entfernt Leerzeichen am Anfang/Ende ("  osten  " → "osten")
richtung = input("Wohin gehst du? (osten/westen): ").lower().strip()

print()

# if-elif-else prüft die Eingabe und reagiert entsprechend.
# Nur EINER der Blöcke wird ausgeführt.
if richtung == "osten":
    print("Du öffnest die Tür nach Osten.")
    print("Du erreichst ein Büro mit leeren Tischen.")
elif richtung == "westen":
    print("Du öffnest die Tür nach Westen.")
    print("Du erreichst ein Büro mit einer Schreibmaschine.")
else:
    # else fängt ALLE anderen Eingaben ab — auch Tippfehler
    print("Das ist keine gültige Richtung!")
    print("(Gültige Eingaben: osten, westen)")

print()
print("=" * 50)


# ============================================================
# Teilaufgabe 3: Tresorcode eingeben
# ============================================================

print()

tresor_code = 423  # Der richtige Code (als Zahl gespeichert)

print("Vor dir steht ein schwerer Tresor.")

# WICHTIG: input() gibt immer einen String zurück!
# Wir müssen die Eingabe mit int() in eine Zahl umwandeln,
# damit der Vergleich mit 423 (einer Zahl) funktioniert.
eingabe = input("Gib den dreistelligen Code ein: ")

# Umwandlung: String → Ganzzahl
# ACHTUNG: Wenn der Spieler Buchstaben eingibt, stürzt das
# Programm hier ab (ValueError). Das ist für jetzt OK.
eingabe_zahl = int(eingabe)

if eingabe_zahl == tresor_code:
    print("Lautlos schwingt die Tresortür auf!")
    print("Ein gelber Zettel flattert heraus.")
else:
    print("Falscher Code. Der Tresor bleibt verschlossen.")

# ANTWORT auf die Frage: Was passiert bei Buchstaben-Eingabe?
# → Python zeigt: ValueError: invalid literal for int() with base 10
# → Das Programm bricht ab. Später lernt man, das mit try/except
#    abzufangen und eine freundliche Fehlermeldung zu zeigen.

print()
print("=" * 50)


# ============================================================
# Teilaufgabe 4: Koffercode eingeben
# ============================================================

print()

# Der Koffercode wird als STRING gespeichert (nicht als Zahl).
koffer_code = "201"

print("Der Stahlkoffer hat ein dreistelliges Zahlenschloss.")

# Hier brauchen wir KEINE Umwandlung mit int(), weil wir
# den String-Vergleich verwenden: "201" == "201"
eingabe = input("Gib den Code ein: ")

if eingabe == koffer_code:
    print("Der Koffer öffnet sich!")
    print("Im Koffer liegt eine Sprengschnur mit einer Stoppuhr.")
else:
    print("Der Code ist falsch.")

# ANTWORT auf die Frage: Warum String-Vergleich statt Zahlen-Vergleich?
#
# Beide Ansätze funktionieren. Unterschiede:
#
# String-Vergleich ("201" == "201"):
# + Keine Umwandlung nötig → kein Absturzrisiko
# + Führende Nullen bleiben erhalten ("007" ist nicht "7")
# - Kein grösser/kleiner-Vergleich sinnvoll
#
# Zahlen-Vergleich (201 == 201):
# + Grösser/Kleiner-Hinweise möglich ("zu hoch" / "zu tief")
# - Braucht int()-Umwandlung → Absturzgefahr bei falscher Eingabe
# - "007" wird zu 7 (führende Nullen gehen verloren)
#
# Für den Tresor verwenden wir Zahlen (weil wir Hinweise geben).
# Für den Koffer verwenden wir Strings (einfacher und sicherer).


# ============================================================
# ZUSAMMENFASSUNG FÜR SCHÜLER:
# ============================================================
# Was du gelernt hast:
# - input("Text: ") zeigt Text an und wartet auf Eingabe
# - input() gibt IMMER einen String zurück
# - Für Zahlenvergleiche: int(input("..."))
# - Für Textvergleiche: input("...") direkt verwenden
# - .lower().strip() macht Eingaben robuster
# - else fängt ungültige Eingaben ab
#
# Drei Bausteine erstellt:
# 1. Richtungswahl (Osten/Westen) — für Navigation
# 2. Tresorcode (Zahl) — mit Zahlenvergleich
# 3. Koffercode (String) — mit Textvergleich
# ============================================================
