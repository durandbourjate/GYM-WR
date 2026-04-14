# Übung 9: Die Spielschleife bauen

**Thema:** `while`-Schleife, `for`-Schleife, `break`
**Baustein:** Hauptschleife des Spiels — das Herzstück

## Einführung

Im Spielbuch blätterst du von Seite zu Seite, bis du den Ausgang findest. In Python erledigt das eine **Spielschleife**: Das Programm zeigt immer wieder einen Raum an, wartet auf deine Eingabe und wechselt zum nächsten Raum — bis das Spiel vorbei ist.

## Aufgabe

### Teilaufgabe 1: Einfache Spielschleife mit zwei Räumen

Beginne mit einer minimalen Version — nur Startraum und Korridor:

```python
aktueller_raum = 1
spiel_laeuft = True

while spiel_laeuft:
    if aktueller_raum == 1:
        print()
        print("=== STARTRAUM ===")
        print("Du bist in einem dunklen Raum. Im Norden ist eine Tür.")
        print()
        wahl = input("Was tust du? (norden/quit): ").lower().strip()

        if wahl == "norden":
            aktueller_raum = 31
        elif wahl == "quit":
            spiel_laeuft = False
        else:
            print("Das verstehe ich nicht.")

    elif aktueller_raum == 31:
        print()
        print("=== WEST-OST-KORRIDOR ===")
        print("Ein langer Korridor. Im Norden ist eine weitere Tür.")
        print()
        wahl = input("Was tust du? (norden/zurueck/quit): ").lower().strip()

        if wahl == "norden":
            aktueller_raum = 32
        elif wahl == "zurueck":
            aktueller_raum = 1
        elif wahl == "quit":
            spiel_laeuft = False
        else:
            print("Das verstehe ich nicht.")

    elif aktueller_raum == 32:
        print()
        print("=== SÜD-NORD-KORRIDOR ===")
        print("Du siehst ein 'Ausgang'-Schild, aber die Tür ist verschlossen.")
        print("Es gibt Türen nach Osten und nach Westen.")
        print()
        wahl = input("Wohin? (osten/westen/zurueck/quit): ").lower().strip()

        if wahl == "osten":
            aktueller_raum = 101
        elif wahl == "westen":
            aktueller_raum = 201
        elif wahl == "zurueck":
            aktueller_raum = 31
        elif wahl == "quit":
            spiel_laeuft = False
        else:
            print("Das verstehe ich nicht.")

    else:
        print(f"Raum {aktueller_raum} ist noch nicht programmiert.")
        spiel_laeuft = False

print()
print("Spiel beendet.")
```

Teste das Programm und navigiere durch die Räume.

### Teilaufgabe 2: Räume ergänzen

Erweitere die Spielschleife um zwei weitere Räume. Wähle aus:

- **Raum 101** (Büro Ost): Leere Tische, Tür nach Norden zu Raum 102
- **Raum 102** (Lüftungsschacht): Lüftungsschacht, Tür nach Norden zu Raum 103
- **Raum 201** (Büro West): Schreibmaschine, Tür nach Süden zu Raum 202
- **Raum 202** (Tresorraum): Tresor auf dem Schreibtisch

Für jeden Raum brauchst du einen neuen `elif`-Block in der Schleife.

### Teilaufgabe 3: Code-Eingabe mit Wiederholung

Beim Tresor soll der Spieler mehrere Versuche haben. Verwende eine **innere while-Schleife**:

```python
elif aktueller_raum == 202:
    print()
    print("=== TRESORRAUM ===")
    print("Ein riesiger Schreibtisch mit einem schweren Tresor.")

    if not tresor_offen:
        while True:
            print()
            eingabe = input("Tresorcode eingeben (oder 'zurueck'): ").strip()

            if eingabe == "zurueck":
                aktueller_raum = 201
                break

            code = int(eingabe)
            if code == 423:
                print("Der Tresor öffnet sich!")
                tresor_offen = True
                break
            else:
                print("Falscher Code. Versuch es nochmal.")
    else:
        print("Der Tresor ist bereits offen und leer.")
        eingabe = input("Zurück? (ja): ")
        aktueller_raum = 201
```

### Teilaufgabe 4: Quit-Bestätigung

Füge eine Bestätigung hinzu, bevor das Spiel beendet wird:

```python
elif wahl == "quit":
    antwort = input("Wirklich beenden? (ja/nein): ").lower().strip()
    if antwort == "ja":
        spiel_laeuft = False
```

## Ergebnis

Du hast das Herzstück des Spiels gebaut: die Spielschleife, die den Spieler durch die Räume navigieren lässt. In der letzten Übung fügst du noch das Inventarsystem mit Listen hinzu.
