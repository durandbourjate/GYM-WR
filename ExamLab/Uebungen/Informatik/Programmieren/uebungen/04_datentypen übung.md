# Übung 4: Datentypen richtig einsetzen

**Thema:** Datentypen (`int`, `float`, `str`, `bool`) und Typumwandlung
**Baustein:** Korrekte Typisierung von Codes, Inventar und Zuständen

## Einführung

Im Spiel «Raus hier!» gibt es verschiedene Arten von Daten: der Tresorcode ist eine Zahl, die Raumtexte sind Text, und ob du das Taschenmesser hast, ist wahr oder falsch. Python unterscheidet diese **Datentypen** — und du musst sie richtig einsetzen.

## Aufgabe

### Teilaufgabe 1: Typen untersuchen

Ergänze dein Programm um folgende Zeilen und führe es aus. Was gibt `type()` jeweils aus?

```python
tresor_code = 423
koffer_code = "201"
spiel_laeuft = True
raumgroesse = 4.0

print(type(tresor_code))
print(type(koffer_code))
print(type(spiel_laeuft))
print(type(raumgroesse))
```

**Frage:** Warum ist `tresor_code` eine Zahl (`int`), aber `koffer_code` ein String (`str`)? Überlege, wann du welchen Typ verwendest.

### Teilaufgabe 2: Typumwandlung beim Tresorcode

Der Spieler gibt den Tresorcode über die Tastatur ein. `input()` liefert immer einen String. Deshalb musst du umwandeln:

```python
eingabe = "423"           # So kommt es von input()
eingabe_als_zahl = int(eingabe)

print(eingabe == 423)             # False! (String vs. Zahl)
print(eingabe_als_zahl == 423)    # True!
```

### Teilaufgabe 3: Gefährliche Umwandlungen

Teste, was passiert, wenn die Umwandlung fehlschlägt:

```python
# Das funktioniert:
print(int("42"))

# Das gibt einen Fehler — warum?
# print(int("hallo"))

# Und das?
# print(int("42.5"))
```

Kommentiere die fehlerhaften Zeilen ein (entferne das `#`) und lies die Fehlermeldung. Was sagt Python dir?

### Teilaufgabe 4: Bool-Werte im Spiel

Im Spielzustand verwendest du `True` und `False`. Teste, wie Python mit Bool-Werten rechnet:

```python
hat_taschenmesser = True
hat_papier = True

# Bool-Werte in Berechnungen
anzahl_gegenstaende = hat_taschenmesser + hat_papier
print("Anzahl Gegenstände:", anzahl_gegenstaende)

# Bool-Werte als Bedingung
if hat_taschenmesser:
    print("Du hast ein Taschenmesser!")
```

## Ergebnis

Du verstehst jetzt die vier wichtigsten Datentypen und kannst zwischen ihnen umwandeln. Das ist besonders wichtig für die Eingabeverarbeitung in den nächsten Übungen.
