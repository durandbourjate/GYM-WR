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
