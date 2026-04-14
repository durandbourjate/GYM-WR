# Übung 5: Spielereingaben mit input()

**Thema:** Eingabe mit `input()` und Typumwandlung
**Baustein:** Interaktive Entscheidungen und Code-Eingabe

## Einführung

Im Spielbuch triffst du Entscheidungen: «Willst du nach Osten oder nach Westen?» In Python übernimmt `input()` diese Aufgabe — der Spieler tippt seine Wahl ein.

## Aufgabe

### Teilaufgabe 1: Erste Entscheidung

Baue die erste Entscheidungssituation im Spiel: Nach dem Startraum wählt der Spieler, ob er zuerst das Blatt Papier oder den Koffer untersucht.

```python
print("""Du befindest dich in einem quadratischen Raum.
Vor dir steht ein Stahlkoffer mit einem gelben Zettel.
In einer Ecke liegen ein Blatt Papier und ein Bleistift.""")

print()
wahl = input("Was tust du zuerst? (papier/koffer): ")
print("Du hast gewählt:", wahl)
```

Führe das Programm aus und teste verschiedene Eingaben.

### Teilaufgabe 2: Richtungswahl

Im Süd-Nord-Korridor gibt es zwei Türen. Baue die Richtungswahl:

```python
print("""Du stehst im Süd-Nord-Korridor.
Eine Tür führt nach Osten, eine nach Westen.""")

print()
richtung = input("Wohin gehst du? (osten/westen): ")

print()
if richtung == "osten":
    print("Du öffnest die Tür nach Osten.")
    print("Du erreichst ein Büro mit leeren Tischen.")
elif richtung == "westen":
    print("Du öffnest die Tür nach Westen.")
    print("Du erreichst ein Büro mit einer Schreibmaschine.")
else:
    print("Das ist keine gültige Richtung!")
```

### Teilaufgabe 3: Tresorcode eingeben

Der Tresor verlangt einen dreistelligen Code. Baue die Code-Eingabe:

```python
tresor_code = 423

print("Vor dir steht ein schwerer Tresor.")
eingabe = input("Gib den dreistelligen Code ein: ")

# Eingabe in Zahl umwandeln
eingabe_zahl = int(eingabe)

if eingabe_zahl == tresor_code:
    print("Lautlos schwingt die Tresortür auf!")
else:
    print("Falscher Code. Der Tresor bleibt verschlossen.")
```

**Teste:** Was passiert, wenn du statt einer Zahl einen Buchstaben eingibst?

### Teilaufgabe 4: Koffercode eingeben

Der Koffer hat den Code `201`. Baue die Eingabe so, dass der Code als **String** verglichen wird (drei Zeichen):

```python
koffer_code = "201"

print("Der Stahlkoffer hat ein dreistelliges Zahlenschloss.")
eingabe = input("Gib den Code ein: ")

if eingabe == koffer_code:
    print("Der Koffer öffnet sich!")
    print("Im Koffer liegt eine Sprengschnur mit einer Stoppuhr.")
else:
    print("Der Code ist falsch.")
```

**Frage:** Warum verwenden wir hier einen String-Vergleich und beim Tresor einen Zahlen-Vergleich? Wann ist welcher Ansatz besser?

## Ergebnis

Du hast drei interaktive Eingabe-Bausteine gebaut: die Richtungswahl, den Tresorcode und den Koffercode. Diese wirst du später in die Spielschleife einbauen.
