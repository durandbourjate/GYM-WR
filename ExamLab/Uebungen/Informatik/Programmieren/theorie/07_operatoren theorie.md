# Operatoren

## Arithmetische Operatoren

| Operator | Beschreibung | Beispiel | Ergebnis |
|----------|-------------|---------|----------|
| `+` | Addition | `5 + 3` | `8` |
| `-` | Subtraktion | `10 - 4` | `6` |
| `*` | Multiplikation | `3 * 7` | `21` |
| `/` | Division (Kommazahl) | `10 / 3` | `3.333...` |
| `//` | Ganzzahl-Division | `10 // 3` | `3` |
| `%` | Modulo (Rest) | `10 % 3` | `1` |
| `**` | Potenz | `2 ** 3` | `8` |

## Reihenfolge (Operatorhierarchie)

Wie in der Mathematik gilt: Potenz vor Punkt vor Strich. Klammern haben höchste Priorität.

```python
x = (2 + 3) * 10 - 3
# 1. Klammer: 2 + 3 = 5
# 2. Multiplikation: 5 * 10 = 50
# 3. Subtraktion: 50 - 3 = 47
```

## Vergleichsoperatoren

Vergleiche liefern einen Wahrheitswert (`True` oder `False`):

| Operator | Bedeutung | Beispiel | Ergebnis |
|----------|----------|---------|----------|
| `==` | gleich | `5 == 5` | `True` |
| `!=` | ungleich | `5 != 3` | `True` |
| `<` | kleiner als | `3 < 5` | `True` |
| `>` | grösser als | `3 > 5` | `False` |
| `<=` | kleiner oder gleich | `5 <= 5` | `True` |
| `>=` | grösser oder gleich | `3 >= 5` | `False` |

**Wichtig:** `=` ist eine **Zuweisung** (Wert speichern), `==` ist ein **Vergleich** (Werte prüfen).

## Logische Operatoren

Mit logischen Operatoren können mehrere Bedingungen kombiniert werden:

| Operator | Bedeutung | Beispiel |
|----------|----------|---------|
| `and` | Beide müssen wahr sein | `alter >= 18 and hat_ausweis == True` |
| `or` | Mindestens eine muss wahr sein | `tuer_offen or hat_schluessel` |
| `not` | Kehrt den Wert um | `not tuer_verschlossen` |

```python
alter = 16
hat_erlaubnis = True

if alter >= 18 or hat_erlaubnis:
    print("Zutritt erlaubt")
```
