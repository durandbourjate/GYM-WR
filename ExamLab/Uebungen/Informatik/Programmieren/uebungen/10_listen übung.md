# Übung 10: Inventarsystem mit Listen

**Thema:** Listen, `append()`, `in`, `for`-Schleife über Listen
**Baustein:** Inventarverwaltung und besuchte Räume

## Einführung

Bisher hast du für jeden Gegenstand eine eigene Variable verwendet (`hat_papier`, `hat_taschenmesser`). Mit **Listen** geht das eleganter: Eine einzige Liste enthält alle Gegenstände, die du eingesammelt hast.

## Aufgabe

### Teilaufgabe 1: Inventar als Liste

Ersetze die einzelnen Bool-Variablen durch eine Inventar-Liste:

```python
inventar = []

# Papier aufheben
print("Du findest Papier und Bleistift.")
inventar.append("Papier")
inventar.append("Bleistift")
print(f"Inventar: {inventar}")

# Taschenmesser aufheben
print("Du findest ein Taschenmesser!")
inventar.append("Taschenmesser")
print(f"Inventar: {inventar}")
```

### Teilaufgabe 2: Prüfen mit `in`

Ersetze die alten Bool-Abfragen durch Listen-Abfragen:

```python
# Alt:
# if hat_taschenmesser:

# Neu:
if "Taschenmesser" in inventar:
    print("Du schraubst das Lüftungsgitter mit dem Schraubenzieher ab.")
else:
    print("Du brauchst einen Schraubenzieher, um das Gitter zu öffnen.")

# Koffer öffnen → Sprengschnur erhalten
if "Sprengschnur" not in inventar:
    print("Im Koffer liegt eine Sprengschnur mit Stoppuhr.")
    inventar.append("Sprengschnur")
else:
    print("Den Koffer hast du bereits geöffnet.")
```

### Teilaufgabe 3: Inventar anzeigen

Baue eine schöne Inventar-Anzeige mit einer `for`-Schleife:

```python
def zeige_inventar():
    print()
    print("╔══════════════════════╗")
    print("║     🎒 INVENTAR      ║")
    print("╠══════════════════════╣")

    if len(inventar) == 0:
        print("║  (leer)              ║")
    else:
        for gegenstand in inventar:
            print(f"║  - {gegenstand:<18}║")

    print(f"╚══════════════════════╝")
    print(f"  {len(inventar)} Gegenstand/Gegenstände")
    print()

# Testen
inventar = ["Papier", "Bleistift", "Taschenmesser"]
zeige_inventar()
```

**Hinweis:** `def` definiert eine **Funktion** — einen wiederverwendbaren Codeblock. Die Funktion `zeige_inventar()` kannst du im Spiel jederzeit aufrufen.

### Teilaufgabe 4: Besuchte Räume merken

Verwende eine zweite Liste, um zu speichern, welche Räume der Spieler schon besucht hat:

```python
besuchte_raeume = []

aktueller_raum = 1

# Beim Betreten eines Raums:
if aktueller_raum not in besuchte_raeume:
    besuchte_raeume.append(aktueller_raum)
    print("Diesen Raum betritst du zum ersten Mal.")
else:
    print("Hier warst du schon einmal.")

# Fortschritt anzeigen
alle_raeume = [1, 31, 32, 101, 102, 103, 104, 201, 202]
print(f"Erkundet: {len(besuchte_raeume)} von {len(alle_raeume)} Räumen")
```

### Teilaufgabe 5: Integration in die Spielschleife

Integriere das Inventar- und Raumsystem in deine Spielschleife aus Übung 9. Ergänze den Befehl `inventar`, damit der Spieler jederzeit sein Inventar abrufen kann:

```python
# In der Spielschleife, VOR den Raum-Abfragen:
if wahl == "inventar":
    zeige_inventar()
    continue    # Springt zurück zum Anfang der Schleife

# Im Raum 104 (Sackgasse):
elif aktueller_raum == 104:
    print("=== SACKGASSE ===")
    print("An der Wand hängt ein Zettel, befestigt mit einem Taschenmesser.")

    if "Taschenmesser" not in inventar:
        print("Du nimmst das Taschenmesser mit.")
        inventar.append("Taschenmesser")

    # ... Rest der Raumlogik
```

## Ergebnis

Du hast ein vollständiges Inventarsystem mit Listen gebaut und es in die Spielschleife integriert. Zusammen mit allen vorherigen Bausteinen hast du jetzt alle Zutaten für das fertige Spiel «Raus hier!» in Python.

## Nächster Schritt: Alles zusammensetzen

Du hast nun alle Bausteine erstellt:

1. Kommentarstruktur (Programmgerüst)
2. Raumtexte (`print()`)
3. Spielvariablen (Variablen)
4. Typkorrekte Codes (Datentypen)
5. Spielereingaben (`input()`)
6. Dynamische Texte (f-Strings)
7. Rätsellogik (Operatoren)
8. Entscheidungen (Verzweigungen)
9. Spielschleife (Schleifen)
10. Inventarsystem (Listen)

Setze diese Bausteine jetzt in einer einzigen Datei `raus_hier.py` zum vollständigen Spiel zusammen. Ergänze die fehlenden Räume und teste das gesamte Spiel von Anfang bis Ende!
