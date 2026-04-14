# Datentypen und Typumwandlung

Jeder Wert in Python hat einen **Datentyp**. Die vier wichtigsten sind:

| Datentyp | Abkürzung | Beispiel | Beschreibung |
|----------|-----------|----------|-------------|
| Ganzzahl | `int` | `42` | Ganze Zahlen ohne Komma |
| Kommazahl | `float` | `3.14` | Zahlen mit Dezimalpunkt |
| Text | `str` | `"Hallo"` | Zeichenketten (Strings) |
| Wahrheitswert | `bool` | `True` | Wahr (`True`) oder Falsch (`False`) |

## Datentyp herausfinden

Mit `type()` könnt ihr den Datentyp eines Wertes anzeigen:

```python
print(type(42))          # <class 'int'>
print(type(3.14))        # <class 'float'>
print(type("Hallo"))     # <class 'str'>
print(type(True))        # <class 'bool'>
```

## Typumwandlung (Konvertierung)

Manchmal muss man einen Datentyp in einen anderen umwandeln:

```python
# String → Ganzzahl
alter_text = "16"
alter_zahl = int(alter_text)    # 16 als int

# String → Kommazahl
preis_text = "9.90"
preis = float(preis_text)       # 9.9 als float

# Zahl → String
punkte = 100
text = str(punkte)              # "100" als str
```

**Wichtig:** `input()` gibt immer einen String zurück. Wenn ihr mit der Eingabe rechnen wollt, müsst ihr sie zuerst umwandeln:

```python
alter = input("Wie alt bist du? ")     # z.B. "16" (String!)
alter = int(alter)                      # 16 (Ganzzahl)
# Oder in einer Zeile:
alter = int(input("Wie alt bist du? "))
```
