# Verzweigungen (if / elif / else)

Verzweigungen erlauben es, den Programmablauf abhängig von Bedingungen zu steuern — genau wie die Entscheidungen im Spielbuch.

## Einfache Verzweigung (if)

```python
code = 423
if code == 423:
    print("Tresor geöffnet!")
```

**Wichtig:** Nach der Bedingung steht ein **Doppelpunkt** `:`, und der eingerückte Block (4 Leerzeichen) wird nur ausgeführt, wenn die Bedingung wahr ist.

## Verzweigung mit Alternative (if-else)

```python
code = int(input("Gib den Code ein: "))
if code == 423:
    print("Tresor geöffnet!")
else:
    print("Falscher Code. Versuch es nochmal.")
```

## Mehrere Bedingungen (if-elif-else)

```python
wahl = input("Wohin? (osten/westen): ")

if wahl == "osten":
    print("Du gehst nach Osten → Raum 101")
elif wahl == "westen":
    print("Du gehst nach Westen → Raum 201")
else:
    print("Ungültige Richtung!")
```

`elif` steht für «else if» — es wird nur geprüft, wenn die vorherige Bedingung falsch war. Man kann beliebig viele `elif`-Blöcke verwenden.

## Verschachtelte Verzweigungen

Verzweigungen können ineinander geschachtelt werden:

```python
hat_schluessel = True
tuer = "nord"

if tuer == "nord":
    if hat_schluessel:
        print("Du öffnest die Nordtür.")
    else:
        print("Die Tür ist verschlossen.")
elif tuer == "sued":
    print("Du gehst nach Süden.")
```

## Zusammenhang mit dem Flussdiagramm

Jede Raute (Entscheidung) im Flussdiagramm entspricht einem `if` im Code. Die Pfeile nach «Ja» und «Nein» entsprechen dem `if`-Block und dem `else`-Block:

```
Flussdiagramm:                    Python-Code:

  ◇ Code == 423?                  if code == 423:
  │
  Ja → Tresor öffnet sich             print("Tresor öffnet sich!")
  │
  Nein → Falscher Code            else:
                                      print("Falscher Code!")
```

## Einrückung (Indentation)

Python verwendet **Einrückung** (4 Leerzeichen), um zusammengehörende Codeblöcke zu markieren. Das ist anders als in vielen anderen Sprachen, die geschweifte Klammern verwenden.

```python
if bedingung:
    # Dieser Block gehört zum if
    print("Bedingung ist wahr")
    print("Noch eine Zeile im Block")

print("Diese Zeile wird IMMER ausgeführt")
```

**Häufiger Fehler:** Falsche oder fehlende Einrückung führt zu einem `IndentationError`.
