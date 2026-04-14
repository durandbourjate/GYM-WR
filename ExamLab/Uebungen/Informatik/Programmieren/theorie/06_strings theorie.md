# Strings und f-Strings

**Strings** sind Zeichenketten — also Text. Sie werden mit Anführungszeichen markiert.

## Strings zusammensetzen (Verkettung)

Mit dem Operator `+` kann man Strings verbinden:

```python
vorname = "Alice"
nachname = "Müller"
name = vorname + " " + nachname
print(name)   # Ausgabe: Alice Müller
```

**Achtung:** Man kann einen String nicht direkt mit einer Zahl verbinden. Das gibt einen Fehler:

```python
alter = 16
# print("Ich bin " + alter + " Jahre alt.")  # Fehler!
print("Ich bin " + str(alter) + " Jahre alt.")  # So geht's
```

## f-Strings (formatierte Strings)

Einfacher und lesbarer geht es mit **f-Strings**. Man setzt ein `f` vor den String und schreibt Variablen in geschweifte Klammern `{}`:

```python
name = "Alice"
raum = 31
print(f"Hallo {name}, du bist in Raum {raum}.")
# Ausgabe: Hallo Alice, du bist in Raum 31.
```

In den geschweiften Klammern können auch Berechnungen stehen:

```python
preis = 10
menge = 3
print(f"Total: {preis * menge} CHF")
# Ausgabe: Total: 30 CHF
```

## Nützliche String-Methoden

| Methode | Beschreibung | Beispiel |
|---------|-------------|---------|
| `.upper()` | Alles in Grossbuchstaben | `"hallo".upper()` → `"HALLO"` |
| `.lower()` | Alles in Kleinbuchstaben | `"HALLO".lower()` → `"hallo"` |
| `.strip()` | Leerzeichen am Anfang/Ende entfernen | `" hi ".strip()` → `"hi"` |
| `.replace(a, b)` | Teiltext ersetzen | `"Hallo".replace("a","o")` → `"Hollo"` |
| `.count(x)` | Zählt, wie oft x vorkommt | `"42423".count("4")` → `2` |
| `len(s)` | Länge des Strings | `len("Hallo")` → `5` |

### Methoden verketten (Chaining)

String-Methoden können direkt hintereinander aufgerufen werden. Das Ergebnis der ersten Methode wird sofort an die nächste weitergegeben:

```python
eingabe = input("Wohin? ")
eingabe = eingabe.lower().strip()
# Erst .lower() → alles klein, dann .strip() → Leerzeichen weg
# "  OSTEN  " → "  osten  " → "osten"
```

Das ist kürzer als zwei separate Zeilen und wird im Spielbuch für die Eingabeverarbeitung verwendet.

## String-Indexierung

Einzelne Zeichen können über ihren **Index** angesprochen werden. Die Zählung beginnt bei 0:

```python
wort = "Python"
print(wort[0])    # P
print(wort[1])    # y
print(wort[-1])   # n (letztes Zeichen)
```
