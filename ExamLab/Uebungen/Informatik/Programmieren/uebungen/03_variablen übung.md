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
