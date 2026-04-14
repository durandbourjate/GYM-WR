# Ausgabe mit print()

Der Befehl `print()` gibt Text oder Werte auf dem Bildschirm aus. Er ist das wichtigste Werkzeug, um dem Benutzer Informationen zu zeigen.

## Text ausgeben

Text (sogenannte **Strings**) steht in Anführungszeichen — einfache `'...'` oder doppelte `"..."` funktionieren beide:

```python
print("Hallo Welt!")
print('Es ist stockdunkel und riecht nach Keller.')
```

## Mehrere Werte ausgeben

Mit Kommas könnt ihr mehrere Werte in einem `print()` kombinieren. Python fügt automatisch ein Leerzeichen dazwischen ein:

```python
print("Raum", 12, "ist verschlossen.")
# Ausgabe: Raum 12 ist verschlossen.
```

## Leere Zeile

Ein `print()` ohne Inhalt gibt eine leere Zeile aus:

```python
print("Zeile 1")
print()
print("Zeile 3")
```

## Sonderzeichen

Um spezielle Zeichen in einem String darzustellen, nutzt ihr einen Backslash `\`:

| Zeichen | Bedeutung |
|---------|-----------|
| `\n` | Neue Zeile |
| `\t` | Tabulator |
| `\\` | Ein Backslash |
| `\"` | Ein Anführungszeichen |

```python
print("Zeile 1\nZeile 2")
# Ausgabe:
# Zeile 1
# Zeile 2
```

## Mehrzeilige Strings (Triple Quotes)

Für längere Texte über mehrere Zeilen gibt es **Triple Quotes** — drei Anführungszeichen am Anfang und Ende (`"""..."""`):

```python
print("""Du betrittst den Raum.
Es ist dunkel und kalt.
Vor dir steht ein Koffer.""")
```

Das ist übersichtlicher als viele `print()`-Aufrufe oder `\n` in einem langen String. Triple Quotes werden vor allem für mehrzeilige Texte oder Erklärungen im Code verwendet.

## String-Wiederholung mit *

Mit dem Operator `*` kann ein String mehrfach wiederholt werden:

```python
print("=" * 30)
# Ausgabe: ==============================

print("-" * 20)
# Ausgabe: --------------------
```

Das ist nützlich, um **Trennlinien** oder **Rahmen** in der Konsolenausgabe zu zeichnen — zum Beispiel zwischen Räumen im Spielbuch.
