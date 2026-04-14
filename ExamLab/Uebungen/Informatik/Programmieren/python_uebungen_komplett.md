# Übungsreihe: Vom Spielbuch zum Python-Programm (Sammeldokument)

*Vollständige Übungssammlung für die Lernsequenz «Programmieren in Python» — GYM1, Gymnasium Hofwil*

---

# Übungsreihe: Vom Spielbuch zum Python-Programm

## Ziel

In dieser Übungsreihe programmierst du Schritt für Schritt Bausteine für das Spielbuch «Raus hier!». Jede Übung behandelt ein neues Python-Thema und erzeugt einen Baustein, den du am Ende zum funktionierenden Spiel zusammensetzen kannst.

## Übersicht der Bausteine

| Übung | Thema | Baustein für das Spiel |
|-------|-------|------------------------|
| 1 | Kommentare | Programmstruktur planen |
| 2 | print() | Raumtexte ausgeben |
| 3 | Variablen | Spielzustand speichern |
| 4 | Datentypen | Inventar und Codes richtig typisieren |
| 5 | input() | Spielereingaben entgegennehmen |
| 6 | Strings & f-Strings | Dynamische Texte zusammensetzen |
| 7 | Operatoren | Rätsel und Codes berechnen |
| 8 | Verzweigungen | Entscheidungen programmieren |
| 9 | Schleifen | Spielschleife bauen |
| 10 | Listen | Inventarsystem erstellen |

## So arbeitest du

1. Lies zuerst die **Theorie** zum jeweiligen Thema.
2. Bearbeite dann die **Übung** — sie baut immer einen konkreten Teil des Spiels.
3. **Teste** deinen Code nach jeder Teilaufgabe.
4. Am Ende setzt du alle Bausteine zum fertigen Spiel zusammen.

Viel Spass beim Programmieren!

---

# Übung 1: Programmstruktur planen mit Kommentaren

**Thema:** Kommentare (`#`)
**Baustein:** Grundgerüst des Spiels als Kommentarstruktur

## Einführung

Bevor du Code schreibst, planst du die Struktur deines Programms. Kommentare helfen dir, den Überblick zu behalten — genau wie die Karte, die du im Spielbuch gezeichnet hast.

## Aufgabe

Erstelle eine neue Python-Datei `raus_hier.py` und schreibe die Grundstruktur des Spiels als Kommentare. Dein Programm soll noch keinen ausführbaren Code enthalten — nur Kommentare, die beschreiben, was später an welcher Stelle passieren soll.

### Teilaufgabe 1: Programmkopf

Schreibe einen Kommentarblock ganz oben in der Datei mit folgenden Informationen:

- Titel des Programms
- Dein Name
- Datum
- Kurzbeschreibung (1–2 Sätze)

### Teilaufgabe 2: Abschnitte planen

Ergänze darunter Kommentare für die folgenden Abschnitte des Spiels. Zwischen den Kommentaren lässt du jeweils ein paar Leerzeilen frei — dort kommt später der Code hin.

```
# --- Spieltexte definieren ---

# --- Spielvariablen initialisieren ---

# --- Spielschleife ---

    # --- Startraum ---

    # --- West-Ost-Korridor ---

    # --- Süd-Nord-Korridor ---

    # --- Büro Ost (leere Tische) ---

    # --- Lüftungsschacht ---

    # --- Sackgasse mit Taschenmesser ---

    # --- Büro West (Schreibmaschine) ---

    # --- Tresorraum ---

    # --- Koffer öffnen ---

    # --- Sprengung ---

# --- Spielende ---
```

### Teilaufgabe 3: Details ergänzen

Wähle zwei Abschnitte aus und ergänze detailliertere Kommentare, die beschreiben, was dort genau passieren soll. Zum Beispiel:

```python
# --- Startraum ---
# Text anzeigen: Dunkelheit, Ausrüstung beschreiben
# Spieler wählt: Zuerst Blatt Papier oder Koffer?
# Je nach Wahl → anderen Raum anzeigen
```

## Ergebnis

Deine Datei `raus_hier.py` enthält jetzt die komplette Planungsstruktur des Spiels. Wenn du sie ausführst, passiert noch nichts — aber du hast einen klaren Bauplan, den du Schritt für Schritt mit Code füllen wirst.

---

# Übung 2: Raumtexte ausgeben mit print()

**Thema:** Ausgabe mit `print()`
**Baustein:** Spieltexte für den Startraum und die Korridore

## Einführung

Das Spielbuch lebt von seinen Texten. In dieser Übung lernst du, wie du die Raumtexte aus «Raus hier!» mit Python auf dem Bildschirm ausgibst.

## Aufgabe

Öffne deine Datei `raus_hier.py` und fülle den Abschnitt `# --- Spieltexte definieren ---` mit den ersten Texten.

### Teilaufgabe 1: Startraum-Text

Gib den folgenden Text mit `print()` aus — verwende dabei **einen** `print()`-Befehl mit einem mehrzeiligen String (dreifache Anführungszeichen):

```python
print("""Es ist stockdunkel und riecht nach Keller.
In der Stille ist das leise Rauschen einer Lüftungsanlage zu hören.
Deine Ausrüstung umfasst eine LED-Taschenlampe, einen Kompass und
eine Trinkflasche, die sich noch recht voll anfühlt.""")
```

Führe das Programm aus und überprüfe die Ausgabe.

### Teilaufgabe 2: Weitere Raumtexte

Schreibe weitere `print()`-Befehle für diese Texte (du kannst sie kürzen oder in eigenen Worten formulieren):

1. **Startraum Teil 2:** Der Spieler schaltet die Taschenlampe ein und sieht den Raum, den Stahlkoffer und das Blatt Papier.
2. **West-Ost-Korridor:** Beschreibung des Korridors mit den verschlossenen Türen.
3. **Süd-Nord-Korridor:** Beschreibung mit dem Ausgangsschild und dem Treppenhaus.

### Teilaufgabe 3: Trennung und Übersichtlichkeit

Füge zwischen den Raumtexten optische Trennlinien ein:

```python
print("=" * 50)
```

Und verwende leere `print()`-Befehle für Leerzeilen:

```python
print()
```

Teste, wie sich die Ausgabe verändert, wenn du Trennlinien und Abstände einfügst.

### Teilaufgabe 4: Sonderzeichen

Experimentiere mit besonderen Zeichen in deinen Texten:

```python
print("🔦 Du schaltest die Taschenlampe ein.")
print("🧭 Dein Kompass zeigt nach Norden.")
print("🚪 Vor dir ist eine Tür.")
```

## Ergebnis

Wenn du dein Programm ausführst, werden nacheinander alle Raumtexte angezeigt. Das ist noch kein interaktives Spiel — aber du hast die Textausgabe als Baustein fertig.

---

# Übung 3: Spielzustand speichern mit Variablen

**Thema:** Variablen und Zuweisung
**Baustein:** Spielvariablen für Raum, Inventar und Fortschritt

## Einführung

Im Spielbuch musst du dir merken, in welchem Raum du bist, was du eingepackt hast und welche Rätsel du schon gelöst hast. In Python speichern **Variablen** diese Informationen.

## Aufgabe

Ergänze in deiner Datei `raus_hier.py` den Abschnitt `# --- Spielvariablen initialisieren ---`.

### Teilaufgabe 1: Raum-Variable

Erstelle eine Variable, die den aktuellen Raum speichert. Verwende die Raumnummern aus dem Spielbuch:

```python
aktueller_raum = 1  # Startraum
```

Gib den aktuellen Raum mit `print()` aus:

```python
print("Du bist in Raum:", aktueller_raum)
```

Ändere den Wert der Variable und führe das Programm erneut aus:

```python
aktueller_raum = 31  # West-Ost-Korridor
print("Du bist jetzt in Raum:", aktueller_raum)
```

### Teilaufgabe 2: Spielzustand

Erstelle weitere Variablen für den Spielzustand:

```python
spiel_laeuft = True
hat_papier = False
hat_taschenmesser = False
hat_sprengschnur = False
tresor_offen = False
tresor_code = 423
koffer_code = "201"
```

Gib alle Variablen übersichtlich aus:

```python
print("=== Spielzustand ===")
print("Aktueller Raum:", aktueller_raum)
print("Spiel läuft:", spiel_laeuft)
print("Papier dabei:", hat_papier)
print("Taschenmesser dabei:", hat_taschenmesser)
```

### Teilaufgabe 3: Variablen verändern

Simuliere, dass der Spieler das Blatt Papier aufhebt:

```python
print("Du hebst das Blatt Papier auf.")
hat_papier = True
print("Papier dabei:", hat_papier)
```

Simuliere einen Raumwechsel:

```python
print("Du verlässt den Startraum.")
aktueller_raum = 31
print("Du bist jetzt im West-Ost-Korridor (Raum", aktueller_raum, ")")
```

### Teilaufgabe 4: Spieltexte als Variablen

Speichere die Raumtexte aus Übung 2 jetzt in Variablen, anstatt sie direkt zu drucken:

```python
txt_start = """Es ist stockdunkel und riecht nach Keller.
In der Stille ist das leise Rauschen einer Lüftungsanlage zu hören."""

txt_korridor = """Du befindest dich in einem Korridor,
der von West nach Ost verläuft."""

# Text ausgeben über die Variable
print(txt_start)
```

## Ergebnis

Du hast jetzt alle wichtigen Spielvariablen definiert und die Raumtexte in Variablen gespeichert. Das sind zentrale Bausteine, die du in den nächsten Übungen weiterverwendest.

---

# Übung 4: Datentypen richtig einsetzen

**Thema:** Datentypen (`int`, `float`, `str`, `bool`) und Typumwandlung
**Baustein:** Korrekte Typisierung von Codes, Inventar und Zuständen

## Einführung

Im Spiel «Raus hier!» gibt es verschiedene Arten von Daten: der Tresorcode ist eine Zahl, die Raumtexte sind Text, und ob du das Taschenmesser hast, ist wahr oder falsch. Python unterscheidet diese **Datentypen** — und du musst sie richtig einsetzen.

## Aufgabe

### Teilaufgabe 1: Typen untersuchen

Ergänze dein Programm um folgende Zeilen und führe es aus. Was gibt `type()` jeweils aus?

```python
tresor_code = 423
koffer_code = "201"
spiel_laeuft = True
raumgroesse = 4.0

print(type(tresor_code))
print(type(koffer_code))
print(type(spiel_laeuft))
print(type(raumgroesse))
```

**Frage:** Warum ist `tresor_code` eine Zahl (`int`), aber `koffer_code` ein String (`str`)? Überlege, wann du welchen Typ verwendest.

### Teilaufgabe 2: Typumwandlung beim Tresorcode

Der Spieler gibt den Tresorcode über die Tastatur ein. `input()` liefert immer einen String. Deshalb musst du umwandeln:

```python
eingabe = "423"           # So kommt es von input()
eingabe_als_zahl = int(eingabe)

print(eingabe == 423)             # False! (String vs. Zahl)
print(eingabe_als_zahl == 423)    # True!
```

### Teilaufgabe 3: Gefährliche Umwandlungen

Teste, was passiert, wenn die Umwandlung fehlschlägt:

```python
# Das funktioniert:
print(int("42"))

# Das gibt einen Fehler — warum?
# print(int("hallo"))

# Und das?
# print(int("42.5"))
```

Kommentiere die fehlerhaften Zeilen ein (entferne das `#`) und lies die Fehlermeldung. Was sagt Python dir?

### Teilaufgabe 4: Bool-Werte im Spiel

Im Spielzustand verwendest du `True` und `False`. Teste, wie Python mit Bool-Werten rechnet:

```python
hat_taschenmesser = True
hat_papier = True

# Bool-Werte in Berechnungen
anzahl_gegenstaende = hat_taschenmesser + hat_papier
print("Anzahl Gegenstände:", anzahl_gegenstaende)

# Bool-Werte als Bedingung
if hat_taschenmesser:
    print("Du hast ein Taschenmesser!")
```

## Ergebnis

Du verstehst jetzt die vier wichtigsten Datentypen und kannst zwischen ihnen umwandeln. Das ist besonders wichtig für die Eingabeverarbeitung in den nächsten Übungen.

---

# Übung 5: Spielereingaben mit input()

**Thema:** Eingabe mit `input()` und Typumwandlung
**Baustein:** Interaktive Entscheidungen und Code-Eingabe

## Einführung

Im Spielbuch triffst du Entscheidungen: «Willst du nach Osten oder nach Westen?» In Python übernimmt `input()` diese Aufgabe — der Spieler tippt seine Wahl ein.

## Aufgabe

### Teilaufgabe 1: Erste Entscheidung

Baue die erste Entscheidungssituation im Spiel: Nach dem Startraum wählt der Spieler, ob er zuerst das Blatt Papier oder den Koffer untersucht.

```python
print("""Du befindest dich in einem quadratischen Raum.
Vor dir steht ein Stahlkoffer mit einem gelben Zettel.
In einer Ecke liegen ein Blatt Papier und ein Bleistift.""")

print()
wahl = input("Was tust du zuerst? (papier/koffer): ")
print("Du hast gewählt:", wahl)
```

Führe das Programm aus und teste verschiedene Eingaben.

### Teilaufgabe 2: Richtungswahl

Im Süd-Nord-Korridor gibt es zwei Türen. Baue die Richtungswahl:

```python
print("""Du stehst im Süd-Nord-Korridor.
Eine Tür führt nach Osten, eine nach Westen.""")

print()
richtung = input("Wohin gehst du? (osten/westen): ")

print()
if richtung == "osten":
    print("Du öffnest die Tür nach Osten.")
    print("Du erreichst ein Büro mit leeren Tischen.")
elif richtung == "westen":
    print("Du öffnest die Tür nach Westen.")
    print("Du erreichst ein Büro mit einer Schreibmaschine.")
else:
    print("Das ist keine gültige Richtung!")
```

### Teilaufgabe 3: Tresorcode eingeben

Der Tresor verlangt einen dreistelligen Code. Baue die Code-Eingabe:

```python
tresor_code = 423

print("Vor dir steht ein schwerer Tresor.")
eingabe = input("Gib den dreistelligen Code ein: ")

# Eingabe in Zahl umwandeln
eingabe_zahl = int(eingabe)

if eingabe_zahl == tresor_code:
    print("Lautlos schwingt die Tresortür auf!")
else:
    print("Falscher Code. Der Tresor bleibt verschlossen.")
```

**Teste:** Was passiert, wenn du statt einer Zahl einen Buchstaben eingibst?

### Teilaufgabe 4: Koffercode eingeben

Der Koffer hat den Code `201`. Baue die Eingabe so, dass der Code als **String** verglichen wird (drei Zeichen):

```python
koffer_code = "201"

print("Der Stahlkoffer hat ein dreistelliges Zahlenschloss.")
eingabe = input("Gib den Code ein: ")

if eingabe == koffer_code:
    print("Der Koffer öffnet sich!")
    print("Im Koffer liegt eine Sprengschnur mit einer Stoppuhr.")
else:
    print("Der Code ist falsch.")
```

**Frage:** Warum verwenden wir hier einen String-Vergleich und beim Tresor einen Zahlen-Vergleich? Wann ist welcher Ansatz besser?

## Ergebnis

Du hast drei interaktive Eingabe-Bausteine gebaut: die Richtungswahl, den Tresorcode und den Koffercode. Diese wirst du später in die Spielschleife einbauen.

---

# Übung 6: Dynamische Texte mit Strings und f-Strings

**Thema:** String-Verkettung, f-Strings, String-Methoden
**Baustein:** Dynamische Spieltexte, die sich an den Spielzustand anpassen

## Einführung

Im Spielbuch sind die Texte fix gedruckt. In deinem Programm können sie sich ändern — zum Beispiel zeigt der Text an, in welchem Raum du bist oder was du im Inventar hast. Dafür verwendest du **f-Strings**.

## Aufgabe

### Teilaufgabe 1: Raumnamen dynamisch einsetzen

Erstelle ein Dictionary (eine Art Nachschlagetabelle) für die Raumnamen und verwende f-Strings, um dynamische Texte zu erzeugen:

```python
raum_namen = {
    1: "Startraum",
    31: "West-Ost-Korridor",
    32: "Süd-Nord-Korridor",
    101: "Büro Ost",
    102: "Lüftungsschacht-Raum",
    104: "Sackgasse",
    201: "Büro West",
    202: "Tresorraum"
}

aktueller_raum = 32
print(f"Du befindest dich im {raum_namen[aktueller_raum]}.")
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

raum_name = raum_namen[aktueller_raum]

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

Du hast drei wichtige Bausteine erstellt: dynamische Raumtexte mit f-Strings, eine Inventar-Anzeige und eine robuste Eingabeverarbeitung. Diese machen dein Spiel lebendiger und benutzerfreundlicher.

---

# Übung 7: Rätsel und Codes berechnen mit Operatoren

**Thema:** Arithmetische, Vergleichs- und logische Operatoren
**Baustein:** Rätsellogik für Tresor- und Koffercode

## Einführung

Das Spielbuch enthält Rätsel, deren Lösung auf Berechnungen basiert. In dieser Übung programmierst du die Rätsellogik: den Tresorcode über das Sphinx-Rätsel und den Koffercode über das Zähl-Rätsel.

## Aufgabe

### Teilaufgabe 1: Das Sphinx-Rätsel

Die Notiz im Spiel sagt: *«Der Code zum Tresor ergibt sich aus der Zahl der Füsse im Rätsel der Sphinx, in der Reihenfolge, wie sie im Rätsel vorkommen.»*

Das Rätsel der Sphinx: Was geht am Morgen auf vier Füssen, am Mittag auf zwei Füssen und am Abend auf drei Füssen? (Antwort: der Mensch.)

Berechne den Code:

```python
morgen = 4    # Baby krabbelt auf vier Füssen
mittag = 2    # Erwachsener geht auf zwei Füssen
abend = 3     # Alter Mensch mit Stock: drei Füsse

# Code zusammensetzen
tresor_code = morgen * 100 + mittag * 10 + abend
print(f"Der Tresorcode ist: {tresor_code}")
```

**Frage:** Warum multiplizieren wir mit 100 und 10? Was passiert, wenn du einfach `morgen + mittag + abend` rechnest?

### Teilaufgabe 2: Das Zähl-Rätsel

Die Notiz aus dem Lüftungsschacht sagt: Zähle auf der Tresor-Notiz, wie oft die Ziffern 4, 7 und 3 vorkommen. Die Tresor-Notiz erwähnt die Zahlen **42** und **423**.

```python
# Die Zahlen auf der Tresor-Notiz
zahl_1 = 42    # "The answer to life..."
zahl_2 = 423   # Tresorcode

# Alle Zahlen als Text zusammensetzen, um Ziffern zu zählen
alle_ziffern = str(zahl_1) + str(zahl_2)
print(f"Alle Ziffern: {alle_ziffern}")

# Ziffern zählen
anzahl_4 = alle_ziffern.count("4")
anzahl_7 = alle_ziffern.count("7")
anzahl_3 = alle_ziffern.count("3")

koffer_code = str(anzahl_4) + str(anzahl_7) + str(anzahl_3)
print(f"Der Koffercode ist: {koffer_code}")
```

### Teilaufgabe 3: Code-Überprüfung mit Vergleichsoperatoren

Baue eine vollständige Code-Überprüfung für den Tresor:

```python
tresor_code = 423

eingabe = int(input("Tresorcode eingeben: "))

if eingabe == tresor_code:
    print("Korrekt! Der Tresor öffnet sich.")
elif eingabe > tresor_code:
    print("Der Code ist zu hoch.")
elif eingabe < tresor_code:
    print("Der Code ist zu tief.")
```

### Teilaufgabe 4: Logische Bedingungen im Spiel

Verwende logische Operatoren, um zu prüfen, ob der Spieler Rätsel lösen kann:

```python
hat_taschenmesser = True
tresor_offen = False
hat_lueftungs_notiz = False

# Kann der Spieler den Lüftungsschacht öffnen?
if hat_taschenmesser:
    print("Du schraubst das Gitter ab.")
    hat_lueftungs_notiz = True

# Kann der Spieler den Koffercode herausfinden?
if tresor_offen and hat_lueftungs_notiz:
    print("Du hast beide Hinweise! Du kannst den Koffercode berechnen.")
elif tresor_offen and not hat_lueftungs_notiz:
    print("Dir fehlt noch die Notiz aus dem Lüftungsschacht.")
elif not tresor_offen and hat_lueftungs_notiz:
    print("Dir fehlt noch die Notiz aus dem Tresor.")
else:
    print("Dir fehlen noch beide Hinweise.")
```

### Teilaufgabe 5: Wandelement berechnen

Für die Sprengung muss der Spieler das richtige Wandelement wählen. Baue eine Berechnung:

```python
wand_breite = 4    # Meter
element_breite = 1  # Meter pro Wandelement
anzahl_elemente = wand_breite // element_breite

print(f"Die Wand hat {anzahl_elemente} Wandelemente.")
print(f"Wähle ein Element von 1 bis {anzahl_elemente}.")

wahl = int(input("Welches Wandelement? "))

if wahl >= 1 and wahl <= anzahl_elemente:
    print(f"Du bringst die Sprengschnur an Element {wahl} an.")
else:
    print("Dieses Element gibt es nicht!")
```

## Ergebnis

Du hast die Rätsellogik des Spiels programmiert: das Sphinx-Rätsel für den Tresor, das Zähl-Rätsel für den Koffer und die Wandelement-Auswahl für die Sprengung.

---

# Übung 8: Entscheidungen programmieren mit Verzweigungen

**Thema:** `if` / `elif` / `else`, verschachtelte Verzweigungen
**Baustein:** Raumlogik mit Entscheidungen und Zustandsänderungen

## Einführung

Jede Entscheidung im Spielbuch — «Willst du nach Osten oder Westen?» — ist eine Verzweigung. In deinem Flussdiagramm hast du diese Entscheidungen als Rauten gezeichnet. Jetzt setzt du sie in Python-Code um.

## Aufgabe

### Teilaufgabe 1: Startraum-Entscheidung

Im Startraum wählt der Spieler, ob er zuerst das Papier oder den Koffer untersucht. Baue diese Verzweigung:

```python
print("Du siehst einen Stahlkoffer und ein Blatt Papier.")
print()
wahl = input("Was tust du zuerst? (papier/koffer): ").lower().strip()

if wahl == "papier":
    print("Das Blatt ist leer. Du packst Papier und Bleistift ein.")
    hat_papier = True
    print("Dann wendest du dich dem Koffer zu.")
elif wahl == "koffer":
    print("Der Koffer ist mit einem Zahlenschloss gesichert.")
    print("Du schaust dich weiter um und findest Papier und Bleistift.")
    hat_papier = True
else:
    print("Das verstehe ich nicht. Versuche 'papier' oder 'koffer'.")
```

### Teilaufgabe 2: Raum mit mehreren Aktionen

Im Raum 104 (Sackgasse) passieren mehrere Dinge nacheinander: Der Spieler findet das Taschenmesser und liest die Notiz. Baue die Logik mit verschachtelten Verzweigungen:

```python
aktueller_raum = 104
hat_taschenmesser = False

if aktueller_raum == 104:
    print("Dieser Raum ist eine Sackgasse.")
    print("An der Südwand hängt ein Zettel, befestigt mit einem Taschenmesser.")
    print()

    if not hat_taschenmesser:
        print("Du packst das Taschenmesser ein. Es hat einen Schraubenzieher!")
        hat_taschenmesser = True
    else:
        print("Das Taschenmesser hast du bereits.")

    print()
    print("Auf dem Zettel steht:")
    print("'Der Code zum Tresor ergibt sich aus der Zahl der Füsse")
    print("im Rätsel der Sphinx, in der Reihenfolge, wie sie vorkommen.'")
```

### Teilaufgabe 3: Tresor-Interaktion

Der Tresor kann mehrmals besucht werden. Baue die Logik so, dass der Zustand korrekt verfolgt wird:

```python
tresor_offen = False
tresor_code = 423

print("Vor dir steht ein schwerer Tresor.")
print()

if tresor_offen:
    print("Der Tresor ist bereits geöffnet und leer.")
else:
    eingabe = input("Gib den Code ein (oder 'zurueck'): ").strip()

    if eingabe == "zurueck":
        print("Du gehst zurück.")
    else:
        code = int(eingabe)
        if code == tresor_code:
            print("Der Tresor öffnet sich!")
            print("Ein gelber Zettel flattert heraus:")
            print("'The answer to life, the universe and everything.")
            print("Ausserdem der Code, mit dem du diesen Tresor geöffnet hast.'")
            tresor_offen = True
        else:
            print("Falscher Code. Der Tresor bleibt verschlossen.")
```

### Teilaufgabe 4: Sprengungsentscheidung

Am Ende des Spiels muss der Spieler den richtigen Raum und das richtige Wandelement für die Sprengung wählen. Baue die verschachtelte Entscheidungskette:

```python
print("In welchem Raum willst du die Wand sprengen?")
print("1 = Startraum")
print("2 = West-Ost-Korridor")
print("3 = Süd-Nord-Korridor")
print("4 = Sackgasse (Taschenmesser-Raum)")
print()

raum_wahl = input("Deine Wahl (1-4): ").strip()

if raum_wahl == "4":
    print("Gute Wahl! Dieser Raum grenzt ans Treppenhaus.")
    print()
    wand = input("Welche Wand? (nord/ost/sued/west): ").lower().strip()

    if wand == "sued":
        element = int(input("Welches Wandelement? (1-4): "))
        if element == 1 or element == 2:
            print()
            print("BUMM!")
            print("Ein rundes Loch führt ins Treppenhaus.")
            print("Du kriechst durch und steigst die Treppe hoch.")
            print()
            print("🎉 Raus hier! Du hast es geschafft!")
        else:
            print("Leider kein Erfolg. Kein Durchgang zum Treppenhaus.")
    else:
        print("Diese Wand grenzt nicht ans Treppenhaus. Kein Erfolg.")
else:
    print("Dieser Raum grenzt nicht ans Treppenhaus. Kein Erfolg.")
```

## Ergebnis

Du hast die zentralen Entscheidungspunkte des Spiels programmiert: die Startraum-Wahl, die Tresor-Interaktion und die Sprengungsentscheidung. Im nächsten Schritt verbindest du diese Bausteine mit einer Schleife.

---

# Übung 9: Die Spielschleife bauen

**Thema:** `while`-Schleife, `for`-Schleife, `break`
**Baustein:** Hauptschleife des Spiels — das Herzstück

## Einführung

Im Spielbuch blätterst du von Seite zu Seite, bis du den Ausgang findest. In Python erledigt das eine **Spielschleife**: Das Programm zeigt immer wieder einen Raum an, wartet auf deine Eingabe und wechselt zum nächsten Raum — bis das Spiel vorbei ist.

## Aufgabe

### Teilaufgabe 1: Einfache Spielschleife mit zwei Räumen

Beginne mit einer minimalen Version — nur Startraum und Korridor:

```python
aktueller_raum = 1
spiel_laeuft = True

while spiel_laeuft:
    if aktueller_raum == 1:
        print()
        print("=== STARTRAUM ===")
        print("Du bist in einem dunklen Raum. Im Norden ist eine Tür.")
        print()
        wahl = input("Was tust du? (norden/quit): ").lower().strip()

        if wahl == "norden":
            aktueller_raum = 31
        elif wahl == "quit":
            spiel_laeuft = False
        else:
            print("Das verstehe ich nicht.")

    elif aktueller_raum == 31:
        print()
        print("=== WEST-OST-KORRIDOR ===")
        print("Ein langer Korridor. Im Norden ist eine weitere Tür.")
        print()
        wahl = input("Was tust du? (norden/zurueck/quit): ").lower().strip()

        if wahl == "norden":
            aktueller_raum = 32
        elif wahl == "zurueck":
            aktueller_raum = 1
        elif wahl == "quit":
            spiel_laeuft = False
        else:
            print("Das verstehe ich nicht.")

    elif aktueller_raum == 32:
        print()
        print("=== SÜD-NORD-KORRIDOR ===")
        print("Du siehst ein 'Ausgang'-Schild, aber die Tür ist verschlossen.")
        print("Es gibt Türen nach Osten und nach Westen.")
        print()
        wahl = input("Wohin? (osten/westen/zurueck/quit): ").lower().strip()

        if wahl == "osten":
            aktueller_raum = 101
        elif wahl == "westen":
            aktueller_raum = 201
        elif wahl == "zurueck":
            aktueller_raum = 31
        elif wahl == "quit":
            spiel_laeuft = False
        else:
            print("Das verstehe ich nicht.")

    else:
        print(f"Raum {aktueller_raum} ist noch nicht programmiert.")
        spiel_laeuft = False

print()
print("Spiel beendet.")
```

Teste das Programm und navigiere durch die Räume.

### Teilaufgabe 2: Räume ergänzen

Erweitere die Spielschleife um zwei weitere Räume. Wähle aus:

- **Raum 101** (Büro Ost): Leere Tische, Tür nach Norden zu Raum 102
- **Raum 102** (Lüftungsschacht): Lüftungsschacht, Tür nach Norden zu Raum 103
- **Raum 201** (Büro West): Schreibmaschine, Tür nach Süden zu Raum 202
- **Raum 202** (Tresorraum): Tresor auf dem Schreibtisch

Für jeden Raum brauchst du einen neuen `elif`-Block in der Schleife.

### Teilaufgabe 3: Code-Eingabe mit Wiederholung

Beim Tresor soll der Spieler mehrere Versuche haben. Verwende eine **innere while-Schleife**:

```python
elif aktueller_raum == 202:
    print()
    print("=== TRESORRAUM ===")
    print("Ein riesiger Schreibtisch mit einem schweren Tresor.")

    if not tresor_offen:
        while True:
            print()
            eingabe = input("Tresorcode eingeben (oder 'zurueck'): ").strip()

            if eingabe == "zurueck":
                aktueller_raum = 201
                break

            code = int(eingabe)
            if code == 423:
                print("Der Tresor öffnet sich!")
                tresor_offen = True
                break
            else:
                print("Falscher Code. Versuch es nochmal.")
    else:
        print("Der Tresor ist bereits offen und leer.")
        eingabe = input("Zurück? (ja): ")
        aktueller_raum = 201
```

### Teilaufgabe 4: Quit-Bestätigung

Füge eine Bestätigung hinzu, bevor das Spiel beendet wird:

```python
elif wahl == "quit":
    antwort = input("Wirklich beenden? (ja/nein): ").lower().strip()
    if antwort == "ja":
        spiel_laeuft = False
```

## Ergebnis

Du hast das Herzstück des Spiels gebaut: die Spielschleife, die den Spieler durch die Räume navigieren lässt. In der letzten Übung fügst du noch das Inventarsystem mit Listen hinzu.

---

# Übung 10: Inventarsystem mit Listen

**Thema:** Listen, `append()`, `in`, `for`-Schleife über Listen
**Baustein:** Inventarverwaltung und besuchte Räume

## Einführung

Bisher hast du für jeden Gegenstand eine eigene Variable verwendet (`hat_papier`, `hat_taschenmesser`). Mit **Listen** geht das eleganter: Eine einzige Liste enthält alle Gegenstände, die du eingesammelt hast.

## Aufgabe

### Teilaufgabe 1: Inventar als Liste

Ersetze die einzelnen Bool-Variablen durch eine Inventar-Liste:

```python
inventar = []

# Papier aufheben
print("Du findest Papier und Bleistift.")
inventar.append("Papier")
inventar.append("Bleistift")
print(f"Inventar: {inventar}")

# Taschenmesser aufheben
print("Du findest ein Taschenmesser!")
inventar.append("Taschenmesser")
print(f"Inventar: {inventar}")
```

### Teilaufgabe 2: Prüfen mit `in`

Ersetze die alten Bool-Abfragen durch Listen-Abfragen:

```python
# Alt:
# if hat_taschenmesser:

# Neu:
if "Taschenmesser" in inventar:
    print("Du schraubst das Lüftungsgitter mit dem Schraubenzieher ab.")
else:
    print("Du brauchst einen Schraubenzieher, um das Gitter zu öffnen.")

# Koffer öffnen → Sprengschnur erhalten
if "Sprengschnur" not in inventar:
    print("Im Koffer liegt eine Sprengschnur mit Stoppuhr.")
    inventar.append("Sprengschnur")
else:
    print("Den Koffer hast du bereits geöffnet.")
```

### Teilaufgabe 3: Inventar anzeigen

Baue eine schöne Inventar-Anzeige mit einer `for`-Schleife:

```python
def zeige_inventar():
    print()
    print("╔══════════════════════╗")
    print("║     🎒 INVENTAR      ║")
    print("╠══════════════════════╣")

    if len(inventar) == 0:
        print("║  (leer)              ║")
    else:
        for gegenstand in inventar:
            print(f"║  - {gegenstand:<18}║")

    print(f"╚══════════════════════╝")
    print(f"  {len(inventar)} Gegenstand/Gegenstände")
    print()

# Testen
inventar = ["Papier", "Bleistift", "Taschenmesser"]
zeige_inventar()
```

**Hinweis:** `def` definiert eine **Funktion** — einen wiederverwendbaren Codeblock. Die Funktion `zeige_inventar()` kannst du im Spiel jederzeit aufrufen.

### Teilaufgabe 4: Besuchte Räume merken

Verwende eine zweite Liste, um zu speichern, welche Räume der Spieler schon besucht hat:

```python
besuchte_raeume = []

aktueller_raum = 1

# Beim Betreten eines Raums:
if aktueller_raum not in besuchte_raeume:
    besuchte_raeume.append(aktueller_raum)
    print("Diesen Raum betritst du zum ersten Mal.")
else:
    print("Hier warst du schon einmal.")

# Fortschritt anzeigen
alle_raeume = [1, 31, 32, 101, 102, 103, 104, 201, 202]
print(f"Erkundet: {len(besuchte_raeume)} von {len(alle_raeume)} Räumen")
```

### Teilaufgabe 5: Integration in die Spielschleife

Integriere das Inventar- und Raumsystem in deine Spielschleife aus Übung 9. Ergänze den Befehl `inventar`, damit der Spieler jederzeit sein Inventar abrufen kann:

```python
# In der Spielschleife, VOR den Raum-Abfragen:
if wahl == "inventar":
    zeige_inventar()
    continue    # Springt zurück zum Anfang der Schleife

# Im Raum 104 (Sackgasse):
elif aktueller_raum == 104:
    print("=== SACKGASSE ===")
    print("An der Wand hängt ein Zettel, befestigt mit einem Taschenmesser.")

    if "Taschenmesser" not in inventar:
        print("Du nimmst das Taschenmesser mit.")
        inventar.append("Taschenmesser")

    # ... Rest der Raumlogik
```

## Ergebnis

Du hast ein vollständiges Inventarsystem mit Listen gebaut und es in die Spielschleife integriert. Zusammen mit allen vorherigen Bausteinen hast du jetzt alle Zutaten für das fertige Spiel «Raus hier!» in Python.

## Nächster Schritt: Alles zusammensetzen

Du hast nun alle Bausteine erstellt:

1. Kommentarstruktur (Programmgerüst)
2. Raumtexte (`print()`)
3. Spielvariablen (Variablen)
4. Typkorrekte Codes (Datentypen)
5. Spielereingaben (`input()`)
6. Dynamische Texte (f-Strings)
7. Rätsellogik (Operatoren)
8. Entscheidungen (Verzweigungen)
9. Spielschleife (Schleifen)
10. Inventarsystem (Listen)

Setze diese Bausteine jetzt in einer einzigen Datei `raus_hier.py` zum vollständigen Spiel zusammen. Ergänze die fehlenden Räume und teste das gesamte Spiel von Anfang bis Ende!
