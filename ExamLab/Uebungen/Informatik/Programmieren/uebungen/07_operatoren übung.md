# Übung 7: Rätsel und Codes berechnen mit Operatoren

**Thema:** Arithmetische, Vergleichs- und logische Operatoren
**Baustein:** Rätsellogik für Tresor- und Koffercode

## Einführung

Das Spielbuch enthält Rätsel, deren Lösung auf Berechnungen basiert. In dieser Übung programmierst du die Rätsellogik: den Tresorcode über das Sphinx-Rätsel und den Koffercode über das Zähl-Rätsel.

## Aufgabe

### Teilaufgabe 1: Das Sphinx-Rätsel

Die Notiz im Spiel sagt: *«Der Code zum Tresor ergibt sich aus der Zahl der Füsse im Rätsel der Sphinx, in der Reihenfolge, wie sie im Rätsel vorkommen.»*

Das Rätsel der Sphinx: Was geht am Morgen auf vier Füssen, am Mittag auf zwei Füssen und am Abend auf drei Füssen? (Antwort: der Mensch.)

Berechne den Code:

```python
morgen = 4    # Baby krabbelt auf vier Füssen
mittag = 2    # Erwachsener geht auf zwei Füssen
abend = 3     # Alter Mensch mit Stock: drei Füsse

# Code zusammensetzen
tresor_code = morgen * 100 + mittag * 10 + abend
print(f"Der Tresorcode ist: {tresor_code}")
```

**Frage:** Warum multiplizieren wir mit 100 und 10? Was passiert, wenn du einfach `morgen + mittag + abend` rechnest?

### Teilaufgabe 2: Das Zähl-Rätsel

Die Notiz aus dem Lüftungsschacht sagt: Zähle auf der Tresor-Notiz, wie oft die Ziffern 4, 7 und 3 vorkommen. Die Tresor-Notiz erwähnt die Zahlen **42** und **423**.

```python
# Die Zahlen auf der Tresor-Notiz
zahl_1 = 42    # "The answer to life..."
zahl_2 = 423   # Tresorcode

# Alle Zahlen als Text zusammensetzen, um Ziffern zu zählen
alle_ziffern = str(zahl_1) + str(zahl_2)
print(f"Alle Ziffern: {alle_ziffern}")

# Ziffern zählen
anzahl_4 = alle_ziffern.count("4")
anzahl_7 = alle_ziffern.count("7")
anzahl_3 = alle_ziffern.count("3")

koffer_code = str(anzahl_4) + str(anzahl_7) + str(anzahl_3)
print(f"Der Koffercode ist: {koffer_code}")
```

### Teilaufgabe 3: Code-Überprüfung mit Vergleichsoperatoren

Baue eine vollständige Code-Überprüfung für den Tresor:

```python
tresor_code = 423

eingabe = int(input("Tresorcode eingeben: "))

if eingabe == tresor_code:
    print("Korrekt! Der Tresor öffnet sich.")
elif eingabe > tresor_code:
    print("Der Code ist zu hoch.")
elif eingabe < tresor_code:
    print("Der Code ist zu tief.")
```

### Teilaufgabe 4: Logische Bedingungen im Spiel

Verwende logische Operatoren, um zu prüfen, ob der Spieler Rätsel lösen kann:

```python
hat_taschenmesser = True
tresor_offen = False
hat_lueftungs_notiz = False

# Kann der Spieler den Lüftungsschacht öffnen?
if hat_taschenmesser:
    print("Du schraubst das Gitter ab.")
    hat_lueftungs_notiz = True

# Kann der Spieler den Koffercode herausfinden?
if tresor_offen and hat_lueftungs_notiz:
    print("Du hast beide Hinweise! Du kannst den Koffercode berechnen.")
elif tresor_offen and not hat_lueftungs_notiz:
    print("Dir fehlt noch die Notiz aus dem Lüftungsschacht.")
elif not tresor_offen and hat_lueftungs_notiz:
    print("Dir fehlt noch die Notiz aus dem Tresor.")
else:
    print("Dir fehlen noch beide Hinweise.")
```

### Teilaufgabe 5: Wandelement berechnen

Für die Sprengung muss der Spieler das richtige Wandelement wählen. Baue eine Berechnung:

```python
wand_breite = 4    # Meter
element_breite = 1  # Meter pro Wandelement
anzahl_elemente = wand_breite // element_breite

print(f"Die Wand hat {anzahl_elemente} Wandelemente.")
print(f"Wähle ein Element von 1 bis {anzahl_elemente}.")

wahl = int(input("Welches Wandelement? "))

if wahl >= 1 and wahl <= anzahl_elemente:
    print(f"Du bringst die Sprengschnur an Element {wahl} an.")
else:
    print("Dieses Element gibt es nicht!")
```

## Ergebnis

Du hast die Rätsellogik des Spiels programmiert: das Sphinx-Rätsel für den Tresor, das Zähl-Rätsel für den Koffer und die Wandelement-Auswahl für die Sprengung.
