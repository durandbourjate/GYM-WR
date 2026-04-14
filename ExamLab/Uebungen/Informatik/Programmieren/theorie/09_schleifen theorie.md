# Schleifen

Schleifen wiederholen einen Codeblock — entweder eine bestimmte Anzahl Mal oder solange eine Bedingung erfüllt ist. Im Spielbuch entspricht das dem wiederholten Durchlaufen von Räumen.

## while-Schleife

Die `while`-Schleife wiederholt den Block, **solange** die Bedingung wahr ist:

```python
versuch = 0
code = ""

while code != "201":
    code = input("Gib den Koffer-Code ein: ")
    versuch = versuch + 1

print(f"Geschafft nach {versuch} Versuchen!")
```

**Flussdiagramm-Entsprechung:** Eine Schleife im Flussdiagramm ist ein Pfeil, der zurück zu einer Entscheidungsraute führt.

## Endlosschleifen vermeiden

Wenn die Bedingung nie falsch wird, läuft die Schleife endlos:

```python
# ACHTUNG: Endlosschleife!
i = 1
while i <= 5:
    print(i)
    # i wird nie erhöht → Bedingung bleibt immer wahr
```

**Lösung:** Sicherstellen, dass sich die Bedingungsvariable im Schleifenkörper verändert:

```python
i = 1
while i <= 5:
    print(i)
    i = i + 1    # i wird bei jedem Durchlauf erhöht
```

## Spielbuch-Schleife

Das Grundgerüst eines textbasierten Spiels verwendet eine `while`-Schleife:

```python
raum = 1
spiel_laeuft = True

while spiel_laeuft:
    if raum == 1:
        print("Du bist im Startraum.")
        wahl = input("Osten (o) oder Westen (w)? ")
        if wahl == "o":
            raum = 101
        elif wahl == "w":
            raum = 201
    elif raum == 101:
        print("Du bist im Büro.")
        # ... weitere Logik
    # ... weitere Räume
```

## while True mit break

Manchmal weiss man nicht im Voraus, wann die Schleife enden soll — zum Beispiel wenn ein Spieler einen Code raten muss. Dafür gibt es das Muster `while True` mit `break`:

```python
while True:
    eingabe = input("Tresorcode eingeben (oder 'zurueck'): ")

    if eingabe == "zurueck":
        break                  # Schleife sofort verlassen

    code = int(eingabe)
    if code == 423:
        print("Korrekt! Der Tresor öffnet sich.")
        break                  # Schleife sofort verlassen
    else:
        print("Falsch. Versuch es nochmal.")
```

`while True` läuft **endlos** — bis ein `break` die Schleife von innen beendet. Das ist nützlich, wenn die Abbruchbedingung **mitten im Schleifenkörper** geprüft wird (nicht nur am Anfang).

**Wann `while True` statt `while bedingung`?**
- `while bedingung:` → Die Abbruchbedingung ist am **Anfang** klar (z.B. `while spiel_laeuft:`)
- `while True:` + `break` → Die Abbruchbedingung ergibt sich erst **im Verlauf** des Schleifenkörpers (z.B. nach einer Eingabe)

## for-Schleife

Die `for`-Schleife durchläuft eine **Sequenz** (z.B. eine Liste oder einen Bereich):

```python
# Über einen Bereich (range) iterieren
for i in range(5):
    print(i)
# Ausgabe: 0, 1, 2, 3, 4

# Über eine Liste iterieren
raeume = [1, 31, 32, 101, 201]
for raum in raeume:
    print(f"Raum {raum}")
```

## range() im Detail

`range()` erzeugt eine Zahlenfolge:

| Aufruf | Erzeugt | Beschreibung |
|--------|---------|-------------|
| `range(5)` | 0, 1, 2, 3, 4 | Von 0 bis 4 |
| `range(1, 6)` | 1, 2, 3, 4, 5 | Von 1 bis 5 |
| `range(0, 10, 2)` | 0, 2, 4, 6, 8 | Von 0 bis 8, Schritt 2 |

## break und continue

- `break` bricht die Schleife sofort ab
- `continue` überspringt den Rest des aktuellen Durchlaufs

```python
# break: Schleife beenden, wenn Ausgang gefunden
raeume = [1, 31, 32, 101, 201, 301, 302]
for raum in raeume:
    print(f"Prüfe Raum {raum}...")
    if raum == 302:
        print("Ausgang gefunden!")
        break

# continue: Verschlossene Räume überspringen
for raum in raeume:
    if raum in [1, 101, 201]:  # verschlossene Türen
        continue
    print(f"Raum {raum} ist zugänglich.")
```
