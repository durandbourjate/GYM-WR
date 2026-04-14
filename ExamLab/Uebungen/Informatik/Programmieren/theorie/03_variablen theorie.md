# Variablen

Eine **Variable** ist ein Name, der auf einen Wert zeigt — wie ein beschriftetes Kästchen, in dem man etwas ablegen kann.

## Variablen erstellen

Man erstellt eine Variable, indem man ihr mit dem Gleichheitszeichen `=` einen Wert zuweist:

```python
raum_nummer = 1
spieler_name = "Alice"
hat_taschenmesser = False
wasserstand = 0.75
```

## Regeln für Variablennamen

- Dürfen Buchstaben, Zahlen und Unterstriche enthalten
- Dürfen **nicht** mit einer Zahl beginnen
- Dürfen **keine Leerzeichen** enthalten (stattdessen Unterstriche verwenden)
- Gross-/Kleinschreibung wird unterschieden (`Name` und `name` sind verschiedene Variablen)
- Reservierte Wörter (z.B. `print`, `if`, `while`) dürfen nicht als Variablennamen verwendet werden

**Konvention:** In Python verwendet man `snake_case` — also Kleinbuchstaben mit Unterstrichen: `raum_nummer`, `hat_schluessel`, `spieler_name`.

## Variablen überschreiben

Eine Variable kann jederzeit einen neuen Wert erhalten:

```python
raum_nummer = 1
print(raum_nummer)   # Ausgabe: 1

raum_nummer = 31
print(raum_nummer)   # Ausgabe: 31
```

## Variablen in print() verwenden

Variablen werden **ohne** Anführungszeichen geschrieben, damit Python ihren Wert einsetzt:

```python
name = "Alice"
print("Hallo", name)   # Ausgabe: Hallo Alice
print("name")          # Ausgabe: name (der Text, nicht der Wert!)
```
