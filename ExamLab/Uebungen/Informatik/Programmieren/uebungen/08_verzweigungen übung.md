# Übung 8: Entscheidungen programmieren mit Verzweigungen

**Thema:** `if` / `elif` / `else`, verschachtelte Verzweigungen
**Baustein:** Raumlogik mit Entscheidungen und Zustandsänderungen

## Einführung

Jede Entscheidung im Spielbuch — «Willst du nach Osten oder Westen?» — ist eine Verzweigung. In deinem Flussdiagramm hast du diese Entscheidungen als Rauten gezeichnet. Jetzt setzt du sie in Python-Code um.

## Aufgabe

### Teilaufgabe 1: Startraum-Entscheidung

Im Startraum wählt der Spieler, ob er zuerst das Papier oder den Koffer untersucht. Baue diese Verzweigung:

```python
print("Du siehst einen Stahlkoffer und ein Blatt Papier.")
print()
wahl = input("Was tust du zuerst? (papier/koffer): ").lower().strip()

if wahl == "papier":
    print("Das Blatt ist leer. Du packst Papier und Bleistift ein.")
    hat_papier = True
    print("Dann wendest du dich dem Koffer zu.")
elif wahl == "koffer":
    print("Der Koffer ist mit einem Zahlenschloss gesichert.")
    print("Du schaust dich weiter um und findest Papier und Bleistift.")
    hat_papier = True
else:
    print("Das verstehe ich nicht. Versuche 'papier' oder 'koffer'.")
```

### Teilaufgabe 2: Raum mit mehreren Aktionen

Im Raum 104 (Sackgasse) passieren mehrere Dinge nacheinander: Der Spieler findet das Taschenmesser und liest die Notiz. Baue die Logik mit verschachtelten Verzweigungen:

```python
aktueller_raum = 104
hat_taschenmesser = False

if aktueller_raum == 104:
    print("Dieser Raum ist eine Sackgasse.")
    print("An der Südwand hängt ein Zettel, befestigt mit einem Taschenmesser.")
    print()

    if not hat_taschenmesser:
        print("Du packst das Taschenmesser ein. Es hat einen Schraubenzieher!")
        hat_taschenmesser = True
    else:
        print("Das Taschenmesser hast du bereits.")

    print()
    print("Auf dem Zettel steht:")
    print("'Der Code zum Tresor ergibt sich aus der Zahl der Füsse")
    print("im Rätsel der Sphinx, in der Reihenfolge, wie sie vorkommen.'")
```

### Teilaufgabe 3: Tresor-Interaktion

Der Tresor kann mehrmals besucht werden. Baue die Logik so, dass der Zustand korrekt verfolgt wird:

```python
tresor_offen = False
tresor_code = 423

print("Vor dir steht ein schwerer Tresor.")
print()

if tresor_offen:
    print("Der Tresor ist bereits geöffnet und leer.")
else:
    eingabe = input("Gib den Code ein (oder 'zurueck'): ").strip()

    if eingabe == "zurueck":
        print("Du gehst zurück.")
    else:
        code = int(eingabe)
        if code == tresor_code:
            print("Der Tresor öffnet sich!")
            print("Ein gelber Zettel flattert heraus:")
            print("'The answer to life, the universe and everything.")
            print("Ausserdem der Code, mit dem du diesen Tresor geöffnet hast.'")
            tresor_offen = True
        else:
            print("Falscher Code. Der Tresor bleibt verschlossen.")
```

### Teilaufgabe 4: Sprengungsentscheidung

Am Ende des Spiels muss der Spieler den richtigen Raum und das richtige Wandelement für die Sprengung wählen. Baue die verschachtelte Entscheidungskette:

```python
print("In welchem Raum willst du die Wand sprengen?")
print("1 = Startraum")
print("2 = West-Ost-Korridor")
print("3 = Süd-Nord-Korridor")
print("4 = Sackgasse (Taschenmesser-Raum)")
print()

raum_wahl = input("Deine Wahl (1-4): ").strip()

if raum_wahl == "4":
    print("Gute Wahl! Dieser Raum grenzt ans Treppenhaus.")
    print()
    wand = input("Welche Wand? (nord/ost/sued/west): ").lower().strip()

    if wand == "sued":
        element = int(input("Welches Wandelement? (1-4): "))
        if element == 1 or element == 2:
            print()
            print("BUMM!")
            print("Ein rundes Loch führt ins Treppenhaus.")
            print("Du kriechst durch und steigst die Treppe hoch.")
            print()
            print("🎉 Raus hier! Du hast es geschafft!")
        else:
            print("Leider kein Erfolg. Kein Durchgang zum Treppenhaus.")
    else:
        print("Diese Wand grenzt nicht ans Treppenhaus. Kein Erfolg.")
else:
    print("Dieser Raum grenzt nicht ans Treppenhaus. Kein Erfolg.")
```

## Ergebnis

Du hast die zentralen Entscheidungspunkte des Spiels programmiert: die Startraum-Wahl, die Tresor-Interaktion und die Sprengungsentscheidung. Im nächsten Schritt verbindest du diese Bausteine mit einer Schleife.
