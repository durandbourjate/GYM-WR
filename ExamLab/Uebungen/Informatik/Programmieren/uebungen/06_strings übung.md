# Übung 6: Dynamische Texte mit Strings und f-Strings

**Thema:** String-Verkettung, f-Strings, String-Methoden
**Baustein:** Dynamische Spieltexte, die sich an den Spielzustand anpassen

## Einführung

Im Spielbuch sind die Texte fix gedruckt. In deinem Programm können sie sich ändern — zum Beispiel zeigt der Text an, in welchem Raum du bist oder was du im Inventar hast. Dafür verwendest du **f-Strings**.

## Aufgabe

### Teilaufgabe 1: Raumnamen dynamisch einsetzen

Verwende eine Variable für die Raumnummer und einen f-String, um den Raumnamen dynamisch in den Text einzusetzen:

```python
aktueller_raum = 32
raum_name = ""

if aktueller_raum == 1:
    raum_name = "Startraum"
elif aktueller_raum == 31:
    raum_name = "West-Ost-Korridor"
elif aktueller_raum == 32:
    raum_name = "Süd-Nord-Korridor"
elif aktueller_raum == 101:
    raum_name = "Büro Ost"
elif aktueller_raum == 102:
    raum_name = "Lüftungsschacht-Raum"
elif aktueller_raum == 104:
    raum_name = "Sackgasse"
elif aktueller_raum == 201:
    raum_name = "Büro West"
elif aktueller_raum == 202:
    raum_name = "Tresorraum"

print(f"Du befindest dich im {raum_name}.")
```

Ändere `aktueller_raum` und teste, wie sich der Text anpasst.

### Teilaufgabe 2: Inventar-Anzeige

Baue eine Funktion, die das aktuelle Inventar anzeigt:

```python
hat_papier = True
hat_taschenmesser = False
hat_sprengschnur = False

print("=== Inventar ===")

gegenstaende = 0
if hat_papier:
    print("- Blatt Papier und Bleistift")
    gegenstaende = gegenstaende + 1
if hat_taschenmesser:
    print("- Taschenmesser mit Schraubenzieher")
    gegenstaende = gegenstaende + 1
if hat_sprengschnur:
    print("- Sprengschnur mit Stoppuhr")
    gegenstaende = gegenstaende + 1

print(f"Total: {gegenstaende} Gegenstand/Gegenstände")
```

### Teilaufgabe 3: Statuszeile

Erstelle eine kompakte Statuszeile, die den Spieler jederzeit informiert:

```python
aktueller_raum = 102
hat_taschenmesser = True
hat_sprengschnur = False

raum_name = "Lüftungsschacht-Raum"  # Für dieses Beispiel fest gesetzt

# Inventar als Symbole
inventar = ""
if hat_papier:
    inventar = inventar + "📄"
if hat_taschenmesser:
    inventar = inventar + "🔪"
if hat_sprengschnur:
    inventar = inventar + "💣"

print(f"[Raum: {raum_name} | Inventar: {inventar}]")
# Ausgabe: [Raum: Lüftungsschacht-Raum | Inventar: 📄🔪]
```

### Teilaufgabe 4: Eingabe normalisieren

Spieler tippen manchmal «Osten», manchmal «osten» oder «OSTEN». Verwende `.lower()` und `.strip()`, um die Eingabe zu normalisieren:

```python
eingabe = input("Wohin gehst du? ")
eingabe = eingabe.lower().strip()

if eingabe == "osten":
    print("Du gehst nach Osten.")
elif eingabe == "westen":
    print("Du gehst nach Westen.")
else:
    print(f"'{eingabe}' ist keine gültige Richtung.")
```

Teste mit verschiedenen Schreibweisen: `Osten`, `  osten  `, `OSTEN`.

## Ergebnis

Du hast drei wichtige Bausteine erstellt: dynamische Raumtexte mit f-Strings und if/elif, eine Inventar-Anzeige und eine robuste Eingabeverarbeitung mit `.lower().strip()`. Diese machen dein Spiel lebendiger und benutzerfreundlicher.
