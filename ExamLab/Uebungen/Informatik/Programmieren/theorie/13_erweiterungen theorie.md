# Erweiterungen: Von der einfachen zur erweiterten Version

Du hast das Spiel «Raus hier!» mit den Grundkonzepten aus den Übungen 1–10 gebaut. Die **erweiterte Version** (`raus_hier.py`) verwendet vier zusätzliche Konzepte, die den Code kürzer und eleganter machen. Hier lernst du sie kennen.

---

## 1. Funktionen (`def`)

**Problem:** Der Inventar-Code steht in der einfachen Version an **8 verschiedenen Stellen** — immer derselbe Block. Wenn du etwas ändern willst, musst du es 8-mal anpassen.

**Lösung:** Mit `def` definierst du einen wiederverwendbaren Code-Block:

```python
# Funktion definieren (einmal, ganz oben)
def zeige_inventar(inventar):
    print("=== INVENTAR ===")
    if len(inventar) == 0:
        print("  (leer)")
    else:
        for gegenstand in inventar:
            print(f"  - {gegenstand}")

# Funktion aufrufen (so oft du willst)
zeige_inventar(inventar)
```

**Wie es funktioniert:**
- `def name(parameter):` definiert eine Funktion mit einem Namen und optionalen Parametern
- Der eingerückte Code darunter ist der «Funktionskörper»
- Mit `name(argument)` wird die Funktion aufgerufen
- Der Wert in Klammern wird dem Parameter zugewiesen

**Merke:** Funktionen helfen, Wiederholungen zu vermeiden. Wenn derselbe Code mehr als zweimal vorkommt, lohnt sich eine Funktion.

---

## 2. Dictionaries (`{}`)

**Problem:** In der einfachen Version bestimmen wir den Raumnamen mit einer langen `if/elif`-Kette (9 Bedingungen). Das ist umständlich.

**Lösung:** Ein Dictionary speichert Schlüssel-Wert-Paare:

```python
# Dictionary definieren
raum_namen = {
    1:   "Startraum",
    32:  "Sued-Nord-Korridor",
    101: "Buero Ost",
    202: "Tresorraum"
}

# Wert nachschlagen
print(raum_namen[32])       # → "Sued-Nord-Korridor"

# Sicher nachschlagen (mit Ersatzwert)
print(raum_namen.get(999, "Unbekannt"))  # → "Unbekannt"
```

**Wie es funktioniert:**
- `{schlüssel: wert, ...}` erstellt ein Dictionary
- `dict[schlüssel]` gibt den Wert zurück (Fehler wenn Schlüssel nicht existiert)
- `dict.get(schlüssel, ersatzwert)` gibt den Wert zurück oder den Ersatzwert

**Merke:** Dictionaries sind wie ein Nachschlagewerk — du suchst etwas (den Schlüssel) und bekommst die zugehörige Information (den Wert).

---

## 3. Fehlerbehandlung (`try / except`)

**Problem:** Wenn der Spieler beim Tresor statt einer Zahl ein Wort eingibt, stürzt das Programm mit `int("hallo")` ab.

**Einfache Lösung** (aus der einfachen Version): Wir vergleichen einfach Strings (`eingabe == "423"`), dann brauchen wir keine Umwandlung.

**Elegantere Lösung** (aus der erweiterten Version): Wir versuchen die Umwandlung und fangen den Fehler ab:

```python
eingabe = input("Code: ")

try:
    code = int(eingabe)          # Versuche umzuwandeln
    if code == 423:
        print("Richtig!")
    elif code > 423:
        print("Zu hoch!")
    else:
        print("Zu tief!")
except ValueError:               # Falls es keine Zahl ist
    print("Bitte eine Zahl eingeben.")
```

**Wie es funktioniert:**
- `try:` markiert Code, der fehlschlagen könnte
- `except FehlerTyp:` fängt einen bestimmten Fehler ab
- Das Programm stürzt nicht ab, sondern führt den `except`-Block aus

**Merke:** `try/except` ist nützlich, wenn Benutzereingaben zu Fehlern führen könnten. Die einfache String-Variante funktioniert aber genauso — du brauchst `try/except` nur, wenn du mit den Zahlen auch rechnen willst (z.B. «zu hoch / zu tief»).

---

## 4. `continue` in Schleifen

**Problem:** In einer Schleife willst du manchmal den Rest des Durchlaufs überspringen und direkt zum nächsten Durchlauf weitergehen.

**Lösung:**

```python
while True:
    eingabe = input("Code: ")

    if eingabe == "inventar":
        print("Dein Inventar...")
        continue    # ← Springt direkt zum nächsten Schleifendurchlauf

    if eingabe == "423":
        print("Richtig!")
        break
    else:
        print("Falsch.")
```

**Wie es funktioniert:**
- `continue` überspringt den Rest des aktuellen Durchlaufs
- Die Schleife läuft sofort mit dem nächsten Durchlauf weiter
- Das ist praktisch für «Zwischenaktionen» wie Inventar anzeigen

**Merke:** `continue` spart verschachtelte `if/else`-Blöcke. Ohne `continue` müsstest du den restlichen Code in einen `else`-Block packen.

---

## Vergleich: Einfach vs. Erweitert

| Konzept | Einfache Version | Erweiterte Version |
|---|---|---|
| Inventar anzeigen | 8× kopierter Code-Block | 1× Funktion `zeige_inventar()` |
| Raumnamen | 9 `if/elif`-Zeilen | 1 Dictionary mit `.get()` |
| Tresorcode prüfen | String-Vergleich `== "423"` | `int()` + `try/except` (mit Hinweis hoch/tief) |
| Inventar in Schleife | verschachteltes `if/else` | `continue` für sauberen Ablauf |
| Codezeilen total | ~550 | ~680 |

Beide Versionen tun dasselbe — die erweiterte ist einfach **eleganter** und **wartbarer**. Das sind Qualitäten, die mit zunehmender Erfahrung wichtiger werden.
