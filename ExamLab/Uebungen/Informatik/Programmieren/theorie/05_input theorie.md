# Benutzereingaben mit input()

Der Befehl `input()` wartet darauf, dass der Benutzer etwas eintippen und mit Enter bestätigen. Der eingegebene Text wird als **String** zurückgegeben.

## Grundform

```python
name = input("Wie heisst du? ")
print("Hallo", name)
```

Ablauf:
1. Python zeigt den Text `Wie heisst du? ` an
2. Der Benutzer tippt z.B. `Alice` und drückt Enter
3. Der Wert `"Alice"` wird in der Variable `name` gespeichert
4. `print()` gibt `Hallo Alice` aus

## Eingabe als Zahl verwenden

Da `input()` immer einen String liefert, muss man für Berechnungen umwandeln:

```python
code = int(input("Gib den Code ein: "))
if code == 423:
    print("Tresor geöffnet!")
```

## Spielbuch-Beispiel

So könnte eine einfache Raumauswahl aussehen:

```python
print("Du stehst vor zwei Türen.")
print("1: Osten")
print("2: Westen")
wahl = input("Wohin gehst du? (1/2): ")

if wahl == "1":
    print("Du gehst nach Osten...")
elif wahl == "2":
    print("Du gehst nach Westen...")
else:
    print("Ungültige Eingabe!")
```
