# Musterlösungen: Vom Spielbuch zum Python-Programm (Sammeldokument)

*Vollständige Lösungssammlung für die Lernsequenz «Programmieren in Python» — GYM1, Gymnasium Hofwil*

---

## Lösung 1: Kommentare

```python
# ============================================================
# MUSTERLÖSUNG – Übung 1: Programmstruktur planen mit Kommentaren
# ============================================================
# In dieser Übung geht es darum, die Struktur eines Programms
# zu planen, BEVOR man Code schreibt. Kommentare dienen als
# Bauplan — wie die Karte, die du im Spielbuch gezeichnet hast.
#
# Kommentare beginnen immer mit dem Zeichen #
# Python ignoriert alles, was nach # steht.
# ============================================================


# ============================================================
# Teilaufgabe 1: Programmkopf
# ============================================================
# Titel:        Raus hier! – Das Python-Spielbuch
# Autor/in:     [Dein Name]
# Datum:        [Heutiges Datum]
# Beschreibung: Textbasiertes Abenteuerspiel, in dem der Spieler
#               einen Keller erkundet, Rätsel löst und den Ausgang
#               findet. Basierend auf dem Spielbuch «Raus hier!».
# ============================================================


# ============================================================
# Teilaufgabe 2: Abschnitte planen
# ============================================================
# Die folgenden Kommentare zeigen die Grobstruktur des Spiels.
# Zwischen den Abschnitten lassen wir Platz für späteren Code.
# ============================================================


# --- Spieltexte definieren ---
# Hier kommen später die Raumtexte als Variablen hin.
# Jeder Raum bekommt einen eigenen Text.


# --- Spielvariablen initialisieren ---
# Hier speichern wir den Startzustand:
# - In welchem Raum bin ich?
# - Welche Gegenstände habe ich?
# - Welche Rätsel habe ich gelöst?


# --- Spielschleife ---
# Die Hauptschleife: Solange das Spiel läuft, wird immer wieder
# der aktuelle Raum angezeigt und auf Eingabe gewartet.

    # --- Startraum ---
    # Erster Raum: dunkel, Koffer, Papier
    # Entscheidung: Papier oder Koffer zuerst?

    # --- West-Ost-Korridor ---
    # Langer Korridor mit verschlossenen Türen
    # Weiter nach Norden möglich

    # --- Süd-Nord-Korridor ---
    # Ausgang-Schild (verschlossen), Türen nach Osten/Westen

    # --- Büro Ost (leere Tische) ---
    # 8x8m Raum, leere Tische, Tür nach Norden

    # --- Lüftungsschacht ---
    # Gelber Zettel hinter dem Gitter
    # Schraubenzieher nötig, um Gitter zu öffnen

    # --- Sackgasse mit Taschenmesser ---
    # Taschenmesser finden (hat Schraubenzieher!)
    # Notiz: Sphinx-Rätsel für Tresorcode

    # --- Büro West (Schreibmaschine) ---
    # 8x8m Raum, verstaubte Schreibmaschine
    # Tür nach Süden zum Tresorraum

    # --- Tresorraum ---
    # Code eingeben (423 = Sphinx-Rätsel)
    # Tresor enthält Hinweis-Zettel

    # --- Koffer öffnen ---
    # Code eingeben (201 = Zähl-Rätsel)
    # Koffer enthält Sprengschnur

    # --- Sprengung ---
    # Raum wählen, Wand wählen, Wandelement wählen
    # Richtige Lösung: Sackgasse, Südwand, Element 1 oder 2

# --- Spielende ---
# Gratulation oder Nachricht, dass das Spiel beendet wurde


# ============================================================
# Teilaufgabe 3: Details ergänzen (zwei Beispiele)
# ============================================================

# --- Startraum (detailliert) ---
# 1. Text anzeigen: Es ist dunkel, Ausrüstung beschreiben
#    (Taschenlampe, Kompass, Trinkflasche)
# 2. Taschenlampe einschalten: Raum beschreiben
#    (quadratisch, 4x4m, Betonwände)
# 3. Spieler sieht: Stahlkoffer mit gelbem Zettel, Papier + Bleistift
# 4. Entscheidung: Zuerst Papier oder Koffer?
#    → Papier: Blatt ist leer, einpacken, dann Koffer
#    → Koffer: verschlossen, Zahlenschloss, Zettel lesen
# 5. Zettel auf Koffer: Anweisung, Keller zu erkunden
# 6. Raum vermessen und auf Karte zeichnen
# 7. Durch Nordtür den Raum verlassen → West-Ost-Korridor

# --- Tresorraum (detailliert) ---
# 1. Raum beschreiben: 8x8m, riesiger Schreibtisch, Tresor
# 2. Prüfen: Ist der Tresor schon offen?
#    → Ja: "Der Tresor ist bereits offen und leer."
#    → Nein: Code-Eingabe
# 3. Code-Eingabe: Spieler gibt dreistelligen Code ein
#    → 423 (richtig): Tresor öffnet sich, Zettel fällt heraus
#      Zettel-Text: "The answer to life..." + "Ausserdem der Code..."
#      Variable tresor_offen = True
#    → Falsch: "Falscher Code", nochmal versuchen oder zurück


# ============================================================
# HINWEIS FÜR SCHÜLER:
# ============================================================
# Wenn du dieses Programm ausführst, passiert NICHTS — und das
# ist genau richtig! Kommentare sind unsichtbar für Python.
# Du hast aber einen klaren Bauplan erstellt, der dir in den
# nächsten Übungen hilft, den Code Schritt für Schritt zu
# schreiben. Gute Programmierer planen zuerst, bevor sie coden!
# ============================================================
```

---

## Lösung 2: Print-Ausgaben

```python
# ============================================================
# MUSTERLÖSUNG – Übung 2: Raumtexte ausgeben mit print()
# ============================================================
# In dieser Übung lernst du, wie man Text auf dem Bildschirm
# ausgibt. print() ist der einfachste und wichtigste Befehl
# in Python — und die Grundlage für dein Textabenteuer.
# ============================================================


# ============================================================
# Teilaufgabe 1: Startraum-Text
# ============================================================
# Wir verwenden dreifache Anführungszeichen ("""), um einen
# mehrzeiligen String zu erstellen. So können wir den ganzen
# Raumtext in einem einzigen print()-Befehl ausgeben.

print("""Es ist stockdunkel und riecht nach Keller.
In der Stille ist das leise Rauschen einer Lüftungsanlage zu hören.
Deine Ausrüstung umfasst eine LED-Taschenlampe, einen Kompass und
eine Trinkflasche, die sich noch recht voll anfühlt.""")

# HINWEIS: Alles zwischen den dreifachen Anführungszeichen wird
# genau so ausgegeben, wie es geschrieben steht — inklusive
# Zeilenumbrüche. Das ist ideal für längere Texte.


# ============================================================
# Teilaufgabe 2: Weitere Raumtexte
# ============================================================

# --- Startraum Teil 2: Taschenlampe einschalten ---
# Hier verwenden wir wieder dreifache Anführungszeichen.
print("""
Ein Schluck Wasser hilft ein wenig gegen den Geschmack von Staub.
Dann schaltest du die Taschenlampe ein und blickst dich um:
Du befindest dich in einem quadratischen Raum aus Betonelementen.
Vor dir auf dem Boden steht ein Stahlkoffer mit einem gelben Zettel.
In einer Ecke liegen ein Blatt Papier und ein Bleistift.""")

# --- West-Ost-Korridor ---
# Tipp: Du kannst den Text auch in eigenen Worten formulieren,
# solange die wichtigen Informationen enthalten sind.
print("""
Du befindest dich in einem Korridor, der von West nach Ost verläuft.
Er hat eine Länge von 20 Meter und ist 4 Meter breit.
Im Süden und Norden gibt es mehrere verschlossene Türen.
In der Mitte der Nordwand ist eine Tür, die nicht verschlossen ist.""")

# --- Süd-Nord-Korridor ---
print("""
Du hast einen weiteren Korridor erreicht.
Dieser verläuft von Süden nach Norden, ebenfalls 20 Meter lang.
Sofort fällt dein Blick auf das Schild: "Ausgang"
Leider ist die schwere Stahltür verschlossen.
Du entdeckst zwei weitere Türen: eine nach Osten, eine nach Westen.""")


# ============================================================
# Teilaufgabe 3: Trennung und Übersichtlichkeit
# ============================================================

# print("=" * 50) erzeugt eine Linie aus 50 Gleichheitszeichen.
# Das funktioniert, weil Python den String "=" genau 50 Mal
# wiederholt (Multiplikation von Strings).

print("=" * 50)             # Trennlinie: ==================================================
print()                     # Leere Zeile (print ohne Argument)
print("=== STARTRAUM ===")

print("""Es ist stockdunkel und riecht nach Keller.
In der Stille ist das leise Rauschen einer Lüftungsanlage zu hören.
Deine Ausrüstung umfasst eine LED-Taschenlampe, einen Kompass und
eine Trinkflasche, die sich noch recht voll anfühlt.""")

print()                     # Leere Zeile für Abstand
print("=" * 50)
print()
print("=== WEST-OST-KORRIDOR ===")

print("""Du befindest dich in einem Korridor, der von West nach Ost verläuft.
Er hat eine Länge von 20 Meter und ist 4 Meter breit.""")

print()
print("=" * 50)
print()
print("=== SÜD-NORD-KORRIDOR ===")

print("""Du hast einen weiteren Korridor erreicht.
Sofort fällt dein Blick auf das Schild: "Ausgang"
Leider ist die schwere Stahltür verschlossen.""")


# ============================================================
# Teilaufgabe 4: Sonderzeichen
# ============================================================

print()
print("=" * 50)
print()

# Emojis können direkt in Python-Strings verwendet werden.
# Sie machen die Ausgabe visuell ansprechender.
print("🔦 Du schaltest die Taschenlampe ein.")
print("🧭 Dein Kompass zeigt nach Norden.")
print("🚪 Vor dir ist eine Tür.")
print("📄 In der Ecke liegt ein Blatt Papier.")
print("🧳 Auf dem Boden steht ein Stahlkoffer.")

# HINWEIS: Nicht alle Terminals zeigen Emojis korrekt an.
# Im Zweifelsfall kannst du auch ASCII-Zeichen verwenden:
print()
print("[TASCHENLAMPE] Du schaltest die Taschenlampe ein.")
print("[KOMPASS] Dein Kompass zeigt nach Norden.")
print("[TUER] Vor dir ist eine Tür.")


# ============================================================
# ZUSAMMENFASSUNG FÜR SCHÜLER:
# ============================================================
# Was du gelernt hast:
# - print("Text") gibt Text auf dem Bildschirm aus
# - Dreifache Anführungszeichen (""") erlauben mehrzeilige Texte
# - print() ohne Argument erzeugt eine leere Zeile
# - "=" * 50 wiederholt ein Zeichen 50 Mal (String-Multiplikation)
# - Emojis funktionieren direkt in Python-Strings
#
# Diese Raumtexte werden in der nächsten Übung in Variablen
# gespeichert, damit du sie im Spiel flexibel verwenden kannst.
# ============================================================
```

---

## Lösung 3: Variablen

```python
# ============================================================
# MUSTERLÖSUNG – Übung 3: Spielzustand speichern mit Variablen
# ============================================================
# Variablen sind wie beschriftete Schubladen: Du gibst ihnen
# einen Namen und legst einen Wert hinein. Der Wert kann sich
# im Laufe des Programms ändern — genau wie dein Spielzustand.
# ============================================================


# ============================================================
# Teilaufgabe 1: Raum-Variable
# ============================================================

# Eine Variable wird mit dem Gleichheitszeichen (=) erstellt.
# Links steht der Name, rechts der Wert.
aktueller_raum = 1  # Startraum (Raum 1)

# Mit print() geben wir den Wert der Variable aus.
# Das Komma in print() fügt automatisch ein Leerzeichen ein.
print("Du bist in Raum:", aktueller_raum)
# Ausgabe: Du bist in Raum: 1

# Den Wert einer Variable kann man jederzeit ändern.
# Der alte Wert wird dabei überschrieben.
aktueller_raum = 31  # Jetzt sind wir im West-Ost-Korridor
print("Du bist jetzt in Raum:", aktueller_raum)
# Ausgabe: Du bist jetzt in Raum: 31

# Nochmal ändern — Raum für Raum, wie im Spielbuch
aktueller_raum = 32  # Süd-Nord-Korridor
print("Du bist jetzt in Raum:", aktueller_raum)
# Ausgabe: Du bist jetzt in Raum: 32


# ============================================================
# Teilaufgabe 2: Spielzustand
# ============================================================

# Zurück zum Start für eine saubere Initialisierung:
aktueller_raum = 1

# Bool-Variablen (True/False) für Ja/Nein-Zustände
spiel_laeuft = True          # Ist das Spiel noch aktiv?
hat_papier = False            # Hat der Spieler das Papier?
hat_taschenmesser = False     # Hat der Spieler das Taschenmesser?
hat_sprengschnur = False      # Hat der Spieler die Sprengschnur?
tresor_offen = False          # Wurde der Tresor geöffnet?

# Zahlen-Variablen für die Codes
tresor_code = 423             # Der richtige Tresorcode (int)
koffer_code = "201"           # Der richtige Koffercode (str)

# Übersichtliche Ausgabe aller Variablen
print("=== Spielzustand ===")
print("Aktueller Raum:", aktueller_raum)
print("Spiel läuft:", spiel_laeuft)
print("Papier dabei:", hat_papier)
print("Taschenmesser dabei:", hat_taschenmesser)
print("Sprengschnur dabei:", hat_sprengschnur)
print("Tresor offen:", tresor_offen)
print("Tresorcode:", tresor_code)
print("Koffercode:", koffer_code)

# Erwartete Ausgabe:
# === Spielzustand ===
# Aktueller Raum: 1
# Spiel läuft: True
# Papier dabei: False
# Taschenmesser dabei: False
# Sprengschnur dabei: False
# Tresor offen: False
# Tresorcode: 423
# Koffercode: 201


# ============================================================
# Teilaufgabe 3: Variablen verändern
# ============================================================

print()
print("=== Spielfortschritt simulieren ===")
print()

# Schritt 1: Papier aufheben
print("Du hebst das Blatt Papier auf.")
hat_papier = True  # Wert ändert sich von False auf True
print("Papier dabei:", hat_papier)
# Ausgabe: Papier dabei: True

print()

# Schritt 2: Raum wechseln
print("Du verlässt den Startraum.")
aktueller_raum = 31  # Neuer Wert überschreibt den alten (1 → 31)
print("Du bist jetzt im West-Ost-Korridor (Raum", aktueller_raum, ")")
# Ausgabe: Du bist jetzt im West-Ost-Korridor (Raum 31 )

# HINWEIS: Bei print() mit Komma erscheint am Ende eine zusätzliche
# Klammer und ein Leerzeichen. In Übung 6 lernst du f-Strings,
# die das eleganter lösen: print(f"Raum {aktueller_raum}")

print()

# Schritt 3: Weiter durch den Keller
print("Du gehst weiter nach Norden.")
aktueller_raum = 32
print("Du bist jetzt im Süd-Nord-Korridor (Raum", aktueller_raum, ")")


# ============================================================
# Teilaufgabe 4: Spieltexte als Variablen
# ============================================================

print()
print("=" * 50)
print()

# Statt die Texte direkt in print() zu schreiben, speichern
# wir sie in Variablen. So können wir sie mehrfach verwenden
# und das Programm bleibt übersichtlich.

txt_start = """Es ist stockdunkel und riecht nach Keller.
In der Stille ist das leise Rauschen einer Lüftungsanlage zu hören.
Deine Ausrüstung umfasst eine LED-Taschenlampe, einen Kompass und
eine Trinkflasche, die sich noch recht voll anfühlt."""

txt_start_2 = """Ein Schluck Wasser hilft ein wenig gegen den Staub.
Du schaltest die Taschenlampe ein und blickst dich um:
Ein quadratischer Raum aus Betonelementen.
Vor dir steht ein Stahlkoffer mit einem gelben Zettel.
In einer Ecke liegen ein Blatt Papier und ein Bleistift."""

txt_korridor_ow = """Du befindest dich in einem Korridor,
der von West nach Ost verläuft. Er ist 20 Meter lang und 4 Meter breit.
Im Norden gibt es eine offene Tür."""

txt_korridor_sn = """Du hast einen weiteren Korridor erreicht.
Sofort fällt dein Blick auf das Schild: "Ausgang"
Leider ist die Stahltür verschlossen.
Es gibt Türen nach Osten und nach Westen."""

# Text ausgeben über die Variable — genau gleich wie vorher,
# aber jetzt flexibler und wiederverwendbar
print("=== STARTRAUM ===")
print(txt_start)
print()
print(txt_start_2)

print()
print("=== WEST-OST-KORRIDOR ===")
print(txt_korridor_ow)

print()
print("=== SÜD-NORD-KORRIDOR ===")
print(txt_korridor_sn)


# ============================================================
# ZUSAMMENFASSUNG FÜR SCHÜLER:
# ============================================================
# Was du gelernt hast:
# - Variablen erstellen: name = wert
# - Variablen ändern: name = neuer_wert (alter Wert wird überschrieben)
# - Verschiedene Werttypen: Zahlen (1, 423), Text ("201"), Bool (True/False)
# - Mehrzeilige Strings in Variablen speichern (mit """)
# - Variablen in print() ausgeben
#
# Warum Variablen wichtig sind:
# - Der Spielzustand wird im Laufe des Spiels verändert
# - Texte in Variablen sind wiederverwendbar
# - Codes in Variablen machen das Programm flexibel
# ============================================================
```

---

## Lösung 4: Datentypen

```python
# ============================================================
# MUSTERLÖSUNG – Übung 4: Datentypen richtig einsetzen
# ============================================================
# Python unterscheidet verschiedene Datentypen. Die wichtigsten:
# - int:   Ganzzahlen (z.B. 423, -5, 0)
# - float: Kommazahlen (z.B. 4.0, 3.14)
# - str:   Text/Zeichenketten (z.B. "Hallo", "201")
# - bool:  Wahrheitswerte (True oder False)
# ============================================================


# ============================================================
# Teilaufgabe 1: Typen untersuchen
# ============================================================

tresor_code = 423          # Eine Ganzzahl (int)
koffer_code = "201"        # Ein String (str) — trotz Ziffern!
spiel_laeuft = True        # Ein Wahrheitswert (bool)
raumgroesse = 4.0          # Eine Kommazahl (float)

# type() zeigt den Datentyp einer Variable an
print("Typ von tresor_code:", type(tresor_code))
# Ausgabe: <class 'int'>

print("Typ von koffer_code:", type(koffer_code))
# Ausgabe: <class 'str'>

print("Typ von spiel_laeuft:", type(spiel_laeuft))
# Ausgabe: <class 'bool'>

print("Typ von raumgroesse:", type(raumgroesse))
# Ausgabe: <class 'float'>

# ANTWORT auf die Frage: Warum ist tresor_code ein int, aber
# koffer_code ein str?
# → tresor_code = 423       (ohne Anführungszeichen = Zahl)
# → koffer_code = "201"     (mit Anführungszeichen = Text)
#
# Im Spiel verwenden wir den Tresorcode als Zahl, weil wir ihn
# mit einer eingegebenen Zahl VERGLEICHEN wollen (z.B. < oder >).
# Den Koffercode verwenden wir als String, weil wir ihn als
# Zeichenfolge vergleichen (Zeichen für Zeichen).
# Beide Ansätze sind gültig — wichtig ist Konsistenz.


# ============================================================
# Teilaufgabe 2: Typumwandlung beim Tresorcode
# ============================================================

print()
print("=== Typumwandlung ===")

eingabe = "423"  # So kommt es von input() — IMMER als String!

# Vergleich String mit Zahl → KLAPPT NICHT wie erwartet
print(eingabe == 423)           # False!
# Erklärung: "423" (String) ist NICHT dasselbe wie 423 (Zahl).
# Python vergleicht hier zwei verschiedene Datentypen und sagt:
# "Ein Text ist niemals gleich einer Zahl."

# Lösung: Den String in eine Zahl umwandeln mit int()
eingabe_als_zahl = int(eingabe)
print(eingabe_als_zahl == 423)  # True!
# Jetzt vergleichen wir Zahl mit Zahl — das funktioniert.

# So sieht die Umwandlung im Detail aus:
print(f"eingabe = '{eingabe}' (Typ: {type(eingabe).__name__})")
print(f"eingabe_als_zahl = {eingabe_als_zahl} (Typ: {type(eingabe_als_zahl).__name__})")


# ============================================================
# Teilaufgabe 3: Gefährliche Umwandlungen
# ============================================================

print()
print("=== Gefährliche Umwandlungen ===")

# Das funktioniert problemlos:
print(int("42"))    # Ausgabe: 42
# Erklärung: "42" enthält nur Ziffern → int() kann es umwandeln.

# Das gibt einen Fehler (ValueError):
# print(int("hallo"))
# Fehlermeldung: ValueError: invalid literal for int() with base 10: 'hallo'
# Erklärung: "hallo" enthält Buchstaben, keine Ziffern.
# Python kann daraus keine Zahl machen.

# Das gibt ebenfalls einen Fehler:
# print(int("42.5"))
# Fehlermeldung: ValueError: invalid literal for int() with base 10: '42.5'
# Erklärung: "42.5" enthält einen Punkt. int() erwartet eine
# Ganzzahl ohne Komma. Lösung: Zuerst float(), dann int():
print(int(float("42.5")))  # Ausgabe: 42
# float("42.5") → 42.5, dann int(42.5) → 42 (abgerundet)

# WICHTIG FÜR DAS SPIEL:
# Wenn der Spieler statt einer Zahl einen Buchstaben eingibt,
# stürzt das Programm ab! Später lernt man try/except, um das
# abzufangen. Für jetzt reicht es, zu wissen, dass int() nur
# mit reinen Ziffern-Strings funktioniert.


# ============================================================
# Teilaufgabe 4: Bool-Werte im Spiel
# ============================================================

print()
print("=== Bool-Werte ===")

hat_taschenmesser = True
hat_papier = True
hat_sprengschnur = False

# Überraschung: Python behandelt True als 1 und False als 0!
# Deshalb kann man mit Bool-Werten rechnen.
anzahl_gegenstaende = hat_taschenmesser + hat_papier + hat_sprengschnur
print("Anzahl Gegenstände:", anzahl_gegenstaende)
# Ausgabe: 2 (True + True + False = 1 + 1 + 0 = 2)

# Bool-Werte als Bedingung in if-Abfragen:
# Man muss NICHT "== True" schreiben — "if variable:" reicht.
if hat_taschenmesser:
    print("Du hast ein Taschenmesser!")
    # Wird ausgeführt, weil hat_taschenmesser = True

if hat_sprengschnur:
    print("Du hast eine Sprengschnur!")
    # Wird NICHT ausgeführt, weil hat_sprengschnur = False

# Das Gegenteil prüfen mit "not":
if not hat_sprengschnur:
    print("Du hast noch keine Sprengschnur.")
    # Wird ausgeführt, weil not False = True


# ============================================================
# ZUSAMMENFASSUNG FÜR SCHÜLER:
# ============================================================
# Was du gelernt hast:
# - Die 4 wichtigsten Datentypen: int, float, str, bool
# - type() zeigt den Typ einer Variable
# - int("123") wandelt einen String in eine Zahl um
# - str(123) wandelt eine Zahl in einen String um
# - int() funktioniert NUR mit reinen Ziffern-Strings
# - True = 1 und False = 0 (man kann damit rechnen)
# - "if variable:" prüft, ob der Wert True ist
#
# Typische Fehlerquelle im Spiel:
# input() gibt IMMER einen String zurück!
# → Für Zahlenvergleiche: int(input("Code: "))
# → Für Textvergleiche: input("Richtung: ")
# ============================================================
```

---

## Lösung 5: Input und Eingabe

```python
# ============================================================
# MUSTERLÖSUNG – Übung 5: Spielereingaben mit input()
# ============================================================
# input() wartet darauf, dass der Spieler etwas eintippt und
# Enter drückt. Das Ergebnis ist IMMER ein String (Text).
# Wenn du eine Zahl brauchst, musst du umwandeln: int(input())
# ============================================================


# ============================================================
# Teilaufgabe 1: Erste Entscheidung
# ============================================================

print("""Du befindest dich in einem quadratischen Raum.
Vor dir steht ein Stahlkoffer mit einem gelben Zettel.
In einer Ecke liegen ein Blatt Papier und ein Bleistift.""")

print()

# input() zeigt den Text in Klammern an und wartet auf Eingabe.
# Das Ergebnis wird in der Variable 'wahl' gespeichert.
wahl = input("Was tust du zuerst? (papier/koffer): ")

print("Du hast gewählt:", wahl)
# Wenn du "papier" eintippst: Ausgabe → Du hast gewählt: papier
# Wenn du "koffer" eintippst: Ausgabe → Du hast gewählt: koffer
# Wenn du etwas anderes tippst: Das wird auch gespeichert!
# → Python prüft nicht automatisch, ob die Eingabe gültig ist.

print()
print("=" * 50)


# ============================================================
# Teilaufgabe 2: Richtungswahl
# ============================================================

print()
print("""Du stehst im Süd-Nord-Korridor.
Eine Tür führt nach Osten, eine nach Westen.""")

print()

# Hier verwenden wir .lower().strip() für robustere Eingabe:
# .lower() → wandelt alles in Kleinbuchstaben ("OSTEN" → "osten")
# .strip() → entfernt Leerzeichen am Anfang/Ende ("  osten  " → "osten")
richtung = input("Wohin gehst du? (osten/westen): ").lower().strip()

print()

# if-elif-else prüft die Eingabe und reagiert entsprechend.
# Nur EINER der Blöcke wird ausgeführt.
if richtung == "osten":
    print("Du öffnest die Tür nach Osten.")
    print("Du erreichst ein Büro mit leeren Tischen.")
elif richtung == "westen":
    print("Du öffnest die Tür nach Westen.")
    print("Du erreichst ein Büro mit einer Schreibmaschine.")
else:
    # else fängt ALLE anderen Eingaben ab — auch Tippfehler
    print("Das ist keine gültige Richtung!")
    print("(Gültige Eingaben: osten, westen)")

print()
print("=" * 50)


# ============================================================
# Teilaufgabe 3: Tresorcode eingeben
# ============================================================

print()

tresor_code = 423  # Der richtige Code (als Zahl gespeichert)

print("Vor dir steht ein schwerer Tresor.")

# WICHTIG: input() gibt immer einen String zurück!
# Wir müssen die Eingabe mit int() in eine Zahl umwandeln,
# damit der Vergleich mit 423 (einer Zahl) funktioniert.
eingabe = input("Gib den dreistelligen Code ein: ")

# Umwandlung: String → Ganzzahl
# ACHTUNG: Wenn der Spieler Buchstaben eingibt, stürzt das
# Programm hier ab (ValueError). Das ist für jetzt OK.
eingabe_zahl = int(eingabe)

if eingabe_zahl == tresor_code:
    print("Lautlos schwingt die Tresortür auf!")
    print("Ein gelber Zettel flattert heraus.")
else:
    print("Falscher Code. Der Tresor bleibt verschlossen.")

# ANTWORT auf die Frage: Was passiert bei Buchstaben-Eingabe?
# → Python zeigt: ValueError: invalid literal for int() with base 10
# → Das Programm bricht ab. Später lernt man, das mit try/except
#    abzufangen und eine freundliche Fehlermeldung zu zeigen.

print()
print("=" * 50)


# ============================================================
# Teilaufgabe 4: Koffercode eingeben
# ============================================================

print()

# Der Koffercode wird als STRING gespeichert (nicht als Zahl).
koffer_code = "201"

print("Der Stahlkoffer hat ein dreistelliges Zahlenschloss.")

# Hier brauchen wir KEINE Umwandlung mit int(), weil wir
# den String-Vergleich verwenden: "201" == "201"
eingabe = input("Gib den Code ein: ")

if eingabe == koffer_code:
    print("Der Koffer öffnet sich!")
    print("Im Koffer liegt eine Sprengschnur mit einer Stoppuhr.")
else:
    print("Der Code ist falsch.")

# ANTWORT auf die Frage: Warum String-Vergleich statt Zahlen-Vergleich?
#
# Beide Ansätze funktionieren. Unterschiede:
#
# String-Vergleich ("201" == "201"):
# + Keine Umwandlung nötig → kein Absturzrisiko
# + Führende Nullen bleiben erhalten ("007" ist nicht "7")
# - Kein grösser/kleiner-Vergleich sinnvoll
#
# Zahlen-Vergleich (201 == 201):
# + Grösser/Kleiner-Hinweise möglich ("zu hoch" / "zu tief")
# - Braucht int()-Umwandlung → Absturzgefahr bei falscher Eingabe
# - "007" wird zu 7 (führende Nullen gehen verloren)
#
# Für den Tresor verwenden wir Zahlen (weil wir Hinweise geben).
# Für den Koffer verwenden wir Strings (einfacher und sicherer).


# ============================================================
# ZUSAMMENFASSUNG FÜR SCHÜLER:
# ============================================================
# Was du gelernt hast:
# - input("Text: ") zeigt Text an und wartet auf Eingabe
# - input() gibt IMMER einen String zurück
# - Für Zahlenvergleiche: int(input("..."))
# - Für Textvergleiche: input("...") direkt verwenden
# - .lower().strip() macht Eingaben robuster
# - else fängt ungültige Eingaben ab
#
# Drei Bausteine erstellt:
# 1. Richtungswahl (Osten/Westen) — für Navigation
# 2. Tresorcode (Zahl) — mit Zahlenvergleich
# 3. Koffercode (String) — mit Textvergleich
# ============================================================
```

---

## Lösung 6: Strings und f-Strings

```python
# ============================================================
# MUSTERLÖSUNG – Übung 6: Dynamische Texte mit Strings/f-Strings
# ============================================================
# f-Strings (formatierte Strings) erlauben es, Variablen direkt
# in einen Text einzufügen. Dazu setzt man ein f vor den String
# und schreibt Variablen in geschweifte Klammern {}.
# ============================================================


# ============================================================
# Teilaufgabe 1: Raumnamen dynamisch einsetzen
# ============================================================

# Ein Dictionary (dict) ist wie ein Nachschlagewerk:
# Zu jedem Schlüssel (key) gehört ein Wert (value).
# Hier: Raumnummer → Raumname
raum_namen = {
    1: "Startraum",
    31: "West-Ost-Korridor",
    32: "Süd-Nord-Korridor",
    101: "Büro Ost",
    102: "Lüftungsschacht-Raum",
    103: "Verbindungsraum",
    104: "Sackgasse",
    201: "Büro West",
    202: "Tresorraum"
}

# Mit raum_namen[nummer] holen wir den Namen zum Schlüssel
aktueller_raum = 32
print(f"Du befindest dich im {raum_namen[aktueller_raum]}.")
# Ausgabe: Du befindest dich im Süd-Nord-Korridor.

# Raum wechseln — der Text passt sich automatisch an!
aktueller_raum = 202
print(f"Du befindest dich im {raum_namen[aktueller_raum]}.")
# Ausgabe: Du befindest dich im Tresorraum.

aktueller_raum = 1
print(f"Du befindest dich im {raum_namen[aktueller_raum]}.")
# Ausgabe: Du befindest dich im Startraum.

print()


# ============================================================
# Teilaufgabe 2: Inventar-Anzeige
# ============================================================

print("=== Inventar-Anzeige ===")
print()

hat_papier = True
hat_taschenmesser = False
hat_sprengschnur = False

print("=== Inventar ===")

# Wir zählen die Gegenstände mit einer Zähler-Variable
gegenstaende = 0

# Für jeden Gegenstand: Wenn vorhanden → anzeigen und zählen
if hat_papier:
    print("- Blatt Papier und Bleistift")
    gegenstaende = gegenstaende + 1  # Zähler um 1 erhöhen

if hat_taschenmesser:
    print("- Taschenmesser mit Schraubenzieher")
    gegenstaende = gegenstaende + 1

if hat_sprengschnur:
    print("- Sprengschnur mit Stoppuhr")
    gegenstaende = gegenstaende + 1

# f-String für die Zusammenfassung
print(f"Total: {gegenstaende} Gegenstand/Gegenstände")
# Ausgabe: Total: 1 Gegenstand/Gegenstände

# Jetzt mit mehr Gegenständen testen:
print()
hat_taschenmesser = True
hat_sprengschnur = True

print("=== Inventar (nach Fund) ===")
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
# Ausgabe: Total: 3 Gegenstand/Gegenstände

print()


# ============================================================
# Teilaufgabe 3: Statuszeile
# ============================================================

print("=== Statuszeile ===")
print()

aktueller_raum = 102
hat_papier = True
hat_taschenmesser = True
hat_sprengschnur = False

# Raumname aus dem Dictionary holen
raum_name = raum_namen[aktueller_raum]

# Inventar als Emoji-Symbole zusammenbauen
# Wir starten mit einem leeren String und hängen Emojis an
inventar = ""
if hat_papier:
    inventar = inventar + "📄"       # String-Verkettung mit +
if hat_taschenmesser:
    inventar = inventar + "🔪"
if hat_sprengschnur:
    inventar = inventar + "💣"

# Wenn nichts im Inventar → "(leer)" anzeigen
if inventar == "":
    inventar = "(leer)"

# Alles in einer kompakten Statuszeile ausgeben
print(f"[Raum: {raum_name} | Inventar: {inventar}]")
# Ausgabe: [Raum: Lüftungsschacht-Raum | Inventar: 📄🔪]

# Noch ein Test mit anderem Zustand:
aktueller_raum = 1
hat_papier = False
hat_taschenmesser = False
hat_sprengschnur = False

raum_name = raum_namen[aktueller_raum]
inventar = ""
if hat_papier:
    inventar = inventar + "📄"
if hat_taschenmesser:
    inventar = inventar + "🔪"
if hat_sprengschnur:
    inventar = inventar + "💣"
if inventar == "":
    inventar = "(leer)"

print(f"[Raum: {raum_name} | Inventar: {inventar}]")
# Ausgabe: [Raum: Startraum | Inventar: (leer)]

print()


# ============================================================
# Teilaufgabe 4: Eingabe normalisieren
# ============================================================

print("=== Eingabe normalisieren ===")
print()

# .lower() → Grossbuchstaben werden zu Kleinbuchstaben
# .strip() → Leerzeichen am Anfang und Ende werden entfernt
# Diese Methoden können verkettet werden (Chaining).

eingabe = input("Wohin gehst du? ")

# Normalisierung: egal ob "Osten", "OSTEN", "  osten  " → "osten"
eingabe = eingabe.lower().strip()

if eingabe == "osten":
    print("Du gehst nach Osten.")
elif eingabe == "westen":
    print("Du gehst nach Westen.")
else:
    # f-String in der Fehlermeldung: zeigt dem Spieler, was er
    # eingegeben hat, damit er seinen Fehler erkennen kann
    print(f"'{eingabe}' ist keine gültige Richtung.")

# Teste mit: "Osten", "  osten  ", "OSTEN", "OsTeN"
# → Alle werden zu "osten" und funktionieren korrekt.
# Teste mit: "norden", "xyz"
# → Werden als ungültig erkannt.


# ============================================================
# ZUSAMMENFASSUNG FÜR SCHÜLER:
# ============================================================
# Was du gelernt hast:
# - f-Strings: f"Text {variable} mehr Text"
# - Variablen und Berechnungen in {} einfügen
# - Dictionaries für Nachschlage-Tabellen (z.B. Raumnummern → Namen)
# - String-Verkettung mit + ("A" + "B" = "AB")
# - .lower() und .strip() für robuste Eingabeverarbeitung
#
# Drei Bausteine erstellt:
# 1. Dynamische Raumtexte mit raum_namen-Dictionary
# 2. Inventar-Anzeige mit Emojis
# 3. Normalisierte Eingabeverarbeitung
# ============================================================
```

---

## Lösung 7: Operatoren

```python
# ============================================================
# MUSTERLÖSUNG – Übung 7: Rätsel und Codes mit Operatoren
# ============================================================
# Operatoren sind die Werkzeuge für Berechnungen und Vergleiche.
# Arithmetisch: +, -, *, /, //, %, **
# Vergleich:    ==, !=, <, >, <=, >=
# Logisch:      and, or, not
# ============================================================


# ============================================================
# Teilaufgabe 1: Das Sphinx-Rätsel
# ============================================================

print("=== Das Sphinx-Rätsel ===")
print()

# Das Rätsel der Sphinx:
# "Was geht am Morgen auf vier Füssen, am Mittag auf zwei
# Füssen und am Abend auf drei Füssen?"
# Antwort: Der Mensch (Baby, Erwachsener, Greis mit Stock)

morgen = 4    # Baby krabbelt auf 4 Füssen
mittag = 2    # Erwachsener geht auf 2 Füssen
abend = 3     # Alter Mensch mit Stock: 3 "Füsse"

# Code zusammensetzen: 4-2-3 → 423
# Wir müssen die Ziffern an die richtige Stelle setzen:
# morgen (4) ist die Hunderterstelle → * 100
# mittag (2) ist die Zehnerstelle   → * 10
# abend  (3) ist die Einerstelle    → * 1
tresor_code = morgen * 100 + mittag * 10 + abend
print(f"Der Tresorcode ist: {tresor_code}")
# Ausgabe: Der Tresorcode ist: 423

# ANTWORT auf die Frage: Was passiert bei einfacher Addition?
einfache_summe = morgen + mittag + abend
print(f"Einfache Addition: {einfache_summe}")
# Ausgabe: 9 — das ist NICHT der Code, sondern die Summe!
# 4 + 2 + 3 = 9, aber wir brauchen 423 (Ziffern nebeneinander)

print()


# ============================================================
# Teilaufgabe 2: Das Zähl-Rätsel
# ============================================================

print("=== Das Zähl-Rätsel ===")
print()

# Die Notiz im Lüftungsschacht verlangt:
# Zähle auf der Tresor-Notiz, wie oft die Ziffern 4, 7, 3 vorkommen.
# Die Tresor-Notiz nennt die Zahlen: 42 ("answer to life...") und 423

zahl_1 = 42    # "The answer to life, the universe and everything"
zahl_2 = 423   # Der Tresorcode

# Trick: Zahlen in Strings umwandeln und zusammensetzen
# str(42) → "42", str(423) → "423"
# "42" + "423" → "42423" (String-Verkettung!)
alle_ziffern = str(zahl_1) + str(zahl_2)
print(f"Alle Ziffern: {alle_ziffern}")
# Ausgabe: Alle Ziffern: 42423

# .count() zählt, wie oft ein Zeichen im String vorkommt
anzahl_4 = alle_ziffern.count("4")  # "4" kommt 2x vor (in 42 und 423)
anzahl_7 = alle_ziffern.count("7")  # "7" kommt 0x vor
anzahl_3 = alle_ziffern.count("3")  # "3" kommt 1x vor

print(f"Anzahl 4: {anzahl_4}")  # 2
print(f"Anzahl 7: {anzahl_7}")  # 0
print(f"Anzahl 3: {anzahl_3}")  # 1

# Koffercode zusammensetzen
# str() wandelt Zahlen in Strings um, damit wir sie verketten können
koffer_code = str(anzahl_4) + str(anzahl_7) + str(anzahl_3)
print(f"Der Koffercode ist: {koffer_code}")
# Ausgabe: Der Koffercode ist: 201

print()


# ============================================================
# Teilaufgabe 3: Code-Überprüfung mit Vergleichsoperatoren
# ============================================================

print("=== Code-Überprüfung ===")
print()

tresor_code = 423

eingabe = int(input("Tresorcode eingeben: "))

# == prüft auf Gleichheit (nicht verwechseln mit = für Zuweisung!)
# > und < ermöglichen Hinweise ("zu hoch" / "zu tief")
if eingabe == tresor_code:
    print("Korrekt! Der Tresor öffnet sich.")
elif eingabe > tresor_code:
    print("Der Code ist zu hoch.")
    # Beispiel: Eingabe 500 → 500 > 423 → "zu hoch"
elif eingabe < tresor_code:
    print("Der Code ist zu tief.")
    # Beispiel: Eingabe 100 → 100 < 423 → "zu tief"

# HINWEIS: elif wird nur geprüft, wenn die vorherige Bedingung
# False war. Es gibt also nie zwei Ausgaben gleichzeitig.

print()


# ============================================================
# Teilaufgabe 4: Logische Bedingungen im Spiel
# ============================================================

print("=== Logische Bedingungen ===")
print()

hat_taschenmesser = True
tresor_offen = False
hat_lueftungs_notiz = False

# Schritt 1: Lüftungsschacht öffnen (braucht Taschenmesser)
if hat_taschenmesser:
    print("Du schraubst das Gitter ab.")
    hat_lueftungs_notiz = True  # Notiz gefunden!

print()

# Schritt 2: Kann der Koffercode berechnet werden?
# Dafür braucht man BEIDE Hinweise: Tresor-Notiz UND Lüftungs-Notiz
# "and" → beide Bedingungen müssen True sein
# "not" → kehrt den Wert um (True → False, False → True)

if tresor_offen and hat_lueftungs_notiz:
    # Beide True → Spieler hat alle Informationen
    print("Du hast beide Hinweise! Du kannst den Koffercode berechnen.")
elif tresor_offen and not hat_lueftungs_notiz:
    # Tresor offen, aber Lüftungs-Notiz fehlt
    print("Dir fehlt noch die Notiz aus dem Lüftungsschacht.")
elif not tresor_offen and hat_lueftungs_notiz:
    # Lüftungs-Notiz da, aber Tresor noch zu
    print("Dir fehlt noch die Notiz aus dem Tresor.")
else:
    # Beides fehlt
    print("Dir fehlen noch beide Hinweise.")

# In unserem Fall: hat_taschenmesser=True, tresor_offen=False,
# hat_lueftungs_notiz=True → Ausgabe: "Dir fehlt noch die Notiz aus dem Tresor."

print()


# ============================================================
# Teilaufgabe 5: Wandelement berechnen
# ============================================================

print("=== Wandelement berechnen ===")
print()

wand_breite = 4       # Die Wand ist 4 Meter breit
element_breite = 1    # Jedes Wandelement ist 1 Meter breit

# // ist die Ganzzahl-Division (Division ohne Rest)
# 4 // 1 = 4 (die Wand hat 4 Elemente)
anzahl_elemente = wand_breite // element_breite

print(f"Die Wand hat {anzahl_elemente} Wandelemente.")
print(f"Wähle ein Element von 1 bis {anzahl_elemente}.")

wahl = int(input("Welches Wandelement? "))

# "and" verknüpft zwei Bedingungen: BEIDE müssen True sein
# wahl >= 1 → Element existiert (nicht 0 oder negativ)
# wahl <= anzahl_elemente → Element existiert (nicht zu hoch)
if wahl >= 1 and wahl <= anzahl_elemente:
    print(f"Du bringst die Sprengschnur an Element {wahl} an.")

    # Im Spiel: Nur Element 1 oder 2 in der Sackgasse (Südwand)
    # führt ins Treppenhaus
    if wahl <= 2:
        print("→ Dieses Element grenzt ans Treppenhaus!")
    else:
        print("→ Dieses Element grenzt leider nicht ans Treppenhaus.")
else:
    print("Dieses Element gibt es nicht!")


# ============================================================
# ZUSAMMENFASSUNG FÜR SCHÜLER:
# ============================================================
# Was du gelernt hast:
# - Arithmetische Operatoren: *, +, // für Berechnungen
# - .count() zum Zählen von Zeichen in Strings
# - str() und int() für Typumwandlung bei Berechnungen
# - Vergleichsoperatoren: ==, >, < für Code-Prüfung
# - Logische Operatoren: and, or, not für komplexe Bedingungen
#
# Drei Rätsel programmiert:
# 1. Sphinx-Rätsel → Tresorcode 423
# 2. Zähl-Rätsel → Koffercode 201
# 3. Wandelement-Auswahl → Sprengung
# ============================================================
```

---

## Lösung 8: Verzweigungen

```python
# ============================================================
# MUSTERLÖSUNG – Übung 8: Entscheidungen mit Verzweigungen
# ============================================================
# Jede Raute in deinem Flussdiagramm ist eine Verzweigung
# im Code: if prüft eine Bedingung, elif prüft weitere,
# else fängt alles andere ab.
# ============================================================


# ============================================================
# Teilaufgabe 1: Startraum-Entscheidung
# ============================================================

print("=== STARTRAUM ===")
print()

# Spielvariable für diese Teilaufgabe
hat_papier = False

print("Du siehst einen Stahlkoffer und ein Blatt Papier.")
print()

# .lower() → Gross-/Kleinschreibung egal
# .strip() → Leerzeichen am Rand entfernen
wahl = input("Was tust du zuerst? (papier/koffer): ").lower().strip()

if wahl == "papier":
    # Spieler wählt Papier → Papier aufheben, dann Koffer
    print("Das Blatt ist leer. Du packst Papier und Bleistift ein.")
    hat_papier = True       # Zustand ändert sich!
    print("Dann wendest du dich dem Koffer zu.")
elif wahl == "koffer":
    # Spieler wählt Koffer → Koffer beschreiben, dann Papier
    print("Der Koffer ist mit einem Zahlenschloss gesichert.")
    print("Du schaust dich weiter um und findest Papier und Bleistift.")
    hat_papier = True       # Papier wird trotzdem eingepackt
else:
    # Ungültige Eingabe → freundliche Fehlermeldung
    # Im fertigen Spiel würde man hier die Frage wiederholen
    print("Das verstehe ich nicht. Versuche 'papier' oder 'koffer'.")

# Zur Kontrolle: Hat der Spieler das Papier?
print(f"\nPapier eingepackt: {hat_papier}")

print()
print("=" * 50)


# ============================================================
# Teilaufgabe 2: Raum mit mehreren Aktionen (Sackgasse)
# ============================================================

print()
print("=== SACKGASSE (Raum 104) ===")
print()

aktueller_raum = 104
hat_taschenmesser = False  # Noch nicht gefunden

if aktueller_raum == 104:
    print("Dieser Raum ist eine Sackgasse.")
    print("An der Südwand hängt ein Zettel, befestigt mit einem Taschenmesser.")
    print()

    # VERSCHACHTELTE VERZWEIGUNG: if innerhalb eines if
    # Prüft, ob der Spieler das Taschenmesser schon hat
    if not hat_taschenmesser:
        # "not hat_taschenmesser" bedeutet: hat_taschenmesser ist False
        # Also: Der Spieler hat das Messer noch NICHT
        print("Du packst das Taschenmesser ein. Es hat einen Schraubenzieher!")
        hat_taschenmesser = True   # Jetzt hat er es
    else:
        # Der Spieler war schon einmal hier und hat es bereits
        print("Das Taschenmesser hast du bereits.")

    print()
    print("Auf dem Zettel steht:")
    print("'Der Code zum Tresor ergibt sich aus der Zahl der Füsse")
    print("im Rätsel der Sphinx, in der Reihenfolge, wie sie vorkommen.'")

# Zur Kontrolle:
print(f"\nTaschenmesser dabei: {hat_taschenmesser}")

print()
print("=" * 50)


# ============================================================
# Teilaufgabe 3: Tresor-Interaktion
# ============================================================

print()
print("=== TRESORRAUM ===")
print()

tresor_offen = False
tresor_code = 423

print("Vor dir steht ein schwerer Tresor.")
print()

# Äussere Verzweigung: Ist der Tresor schon offen?
if tresor_offen:
    # Spieler war schon hier und hat den Tresor geöffnet
    print("Der Tresor ist bereits geöffnet und leer.")
else:
    # Tresor ist noch verschlossen → Code-Eingabe
    eingabe = input("Gib den Code ein (oder 'zurueck'): ").strip()

    if eingabe == "zurueck":
        # Spieler will nicht raten → zurückgehen
        print("Du gehst zurück.")
    else:
        # Spieler gibt einen Code ein → umwandeln und prüfen
        code = int(eingabe)

        # Innere Verzweigung: Ist der Code richtig?
        if code == tresor_code:
            print("Der Tresor öffnet sich!")
            print("Ein gelber Zettel flattert heraus:")
            print("'The answer to life, the universe and everything.")
            print("Ausserdem der Code, mit dem du diesen Tresor geöffnet hast.'")
            tresor_offen = True    # Zustand ändert sich!
        else:
            print("Falscher Code. Der Tresor bleibt verschlossen.")

# Zur Kontrolle:
print(f"\nTresor offen: {tresor_offen}")

print()
print("=" * 50)


# ============================================================
# Teilaufgabe 4: Sprengungsentscheidung
# ============================================================

print()
print("=== SPRENGUNG ===")
print()

print("In welchem Raum willst du die Wand sprengen?")
print("1 = Startraum")
print("2 = West-Ost-Korridor")
print("3 = Süd-Nord-Korridor")
print("4 = Sackgasse (Taschenmesser-Raum)")
print()

raum_wahl = input("Deine Wahl (1-4): ").strip()

# VERSCHACHTELTE ENTSCHEIDUNGSKETTE:
# Nur wenn Raum 4 (Sackgasse) → Wand fragen
#   Nur wenn Südwand → Wandelement fragen
#     Nur wenn Element 1 oder 2 → Erfolg!

if raum_wahl == "4":
    # Raum 4 = Sackgasse — grenzt ans Treppenhaus
    print("Gute Wahl! Dieser Raum grenzt ans Treppenhaus.")
    print()

    wand = input("Welche Wand? (nord/ost/sued/west): ").lower().strip()

    if wand == "sued":
        # Südwand — grenzt ans Treppenhaus
        element = int(input("Welches Wandelement? (1-4): "))

        # "or" → mindestens eine Bedingung muss True sein
        if element == 1 or element == 2:
            # Elemente 1 und 2 grenzen ans Treppenhaus
            print()
            print("BUMM!")
            print()
            print("Ein rundes Loch führt ins Treppenhaus.")
            print("Du kriechst durch und steigst die Treppe hoch.")
            print()
            print("🎉 Raus hier! Du hast es geschafft!")
        else:
            # Elemente 3 und 4 grenzen NICHT ans Treppenhaus
            # (Das Treppenhaus ist nur 4m breit, die Sackgasse auch,
            # aber das Treppenhaus ist versetzt — nur die westlichen
            # 2 Meter der Südwand grenzen ans Treppenhaus)
            print("Leider kein Erfolg. Kein Durchgang zum Treppenhaus.")
    else:
        # Andere Wände: Nord, Ost, West → führen nicht ins Treppenhaus
        print("Diese Wand grenzt nicht ans Treppenhaus. Kein Erfolg.")
else:
    # Andere Räume grenzen nicht direkt ans Treppenhaus
    # (genauer: nicht an eine sprengbare Wand des Treppenhauses)
    print("Dieser Raum grenzt nicht ans Treppenhaus. Kein Erfolg.")


# ============================================================
# ZUSAMMENFASSUNG FÜR SCHÜLER:
# ============================================================
# Was du gelernt hast:
# - if / elif / else für einfache Entscheidungen
# - Verschachtelte if-Blöcke (if innerhalb von if)
# - "not" um eine Bedingung umzukehren
# - "or" um alternative Bedingungen zu prüfen
# - Zustandsänderungen innerhalb von Verzweigungen
#
# Wichtig für die Einrückung:
# - Jeder if/elif/else-Block wird um 4 Leerzeichen eingerückt
# - Verschachtelte Blöcke werden nochmals 4 Leerzeichen eingerückt
# - Falsche Einrückung → IndentationError!
#
# Vier Bausteine erstellt:
# 1. Startraum: Papier/Koffer-Wahl
# 2. Sackgasse: Taschenmesser finden (mit Wiederbesuch-Schutz)
# 3. Tresor: Code-Eingabe mit Zustandsänderung
# 4. Sprengung: Dreistufige Entscheidungskette (Raum → Wand → Element)
# ============================================================
```

---

## Lösung 9: Schleifen

```python
# ============================================================
# MUSTERLÖSUNG – Übung 9: Die Spielschleife bauen
# ============================================================
# Die while-Schleife ist das Herzstück des Spiels:
# Solange spiel_laeuft == True, wird der Schleifenkörper
# wiederholt — Raum anzeigen, Eingabe abwarten, Raum wechseln.
# ============================================================


# ============================================================
# Spielvariablen initialisieren
# ============================================================

# Raum und Spielzustand
aktueller_raum = 1          # Wir starten im Startraum
spiel_laeuft = True         # Steuert die Hauptschleife

# Inventar und Fortschritt
hat_papier = False
hat_taschenmesser = False
tresor_offen = False


# ============================================================
# Teilaufgabe 1 + 2: Spielschleife mit mehreren Räumen
# ============================================================
# Die Schleife enthält für jeden Raum einen elif-Block.
# Jeder Block zeigt den Raumtext an, fragt nach Eingabe
# und ändert aktueller_raum für den nächsten Durchlauf.
# ============================================================

while spiel_laeuft:

    # --------------------------------------------------------
    # STARTRAUM (Raum 1)
    # --------------------------------------------------------
    if aktueller_raum == 1:
        print()
        print("=== STARTRAUM ===")
        print("Du bist in einem dunklen Raum. Es riecht nach Keller.")
        print("Vor dir steht ein Stahlkoffer. Im Norden ist eine Tür.")

        if not hat_papier:
            print("In einer Ecke liegen Papier und Bleistift.")

        print()
        wahl = input("Was tust du? (norden/papier/quit): ").lower().strip()

        if wahl == "norden":
            # Raumwechsel: aktueller_raum wird geändert, und beim
            # nächsten Schleifendurchlauf wird der neue Raum angezeigt
            aktueller_raum = 31
        elif wahl == "papier" and not hat_papier:
            print("Du packst Papier und Bleistift ein.")
            hat_papier = True
            # aktueller_raum bleibt 1 → gleicher Raum nochmal
        elif wahl == "papier" and hat_papier:
            print("Du hast das Papier bereits.")
        elif wahl == "quit":
            # Teilaufgabe 4: Quit-Bestätigung
            antwort = input("Wirklich beenden? (ja/nein): ").lower().strip()
            if antwort == "ja":
                spiel_laeuft = False  # Schleife wird beendet
        else:
            print("Das verstehe ich nicht.")

    # --------------------------------------------------------
    # WEST-OST-KORRIDOR (Raum 31)
    # --------------------------------------------------------
    elif aktueller_raum == 31:
        print()
        print("=== WEST-OST-KORRIDOR ===")
        print("Ein langer Korridor (20m). Verschlossene Türen im Süden und Norden.")
        print("In der Mitte der Nordwand ist eine offene Tür.")
        print()
        wahl = input("Was tust du? (norden/zurueck/quit): ").lower().strip()

        if wahl == "norden":
            aktueller_raum = 32
        elif wahl == "zurueck":
            aktueller_raum = 1
        elif wahl == "quit":
            antwort = input("Wirklich beenden? (ja/nein): ").lower().strip()
            if antwort == "ja":
                spiel_laeuft = False
        else:
            print("Das verstehe ich nicht.")

    # --------------------------------------------------------
    # SÜD-NORD-KORRIDOR (Raum 32)
    # --------------------------------------------------------
    elif aktueller_raum == 32:
        print()
        print("=== SÜD-NORD-KORRIDOR ===")
        print("Du siehst ein 'Ausgang'-Schild — die Tür ist verschlossen.")
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
            antwort = input("Wirklich beenden? (ja/nein): ").lower().strip()
            if antwort == "ja":
                spiel_laeuft = False
        else:
            print("Das verstehe ich nicht.")

    # --------------------------------------------------------
    # BÜRO OST (Raum 101)
    # --------------------------------------------------------
    elif aktueller_raum == 101:
        print()
        print("=== BÜRO OST ===")
        print("Ein 8x8m Raum mit ein paar leeren Tischen.")
        print("Im Norden gibt es eine Tür.")
        print()
        wahl = input("Was tust du? (norden/zurueck/quit): ").lower().strip()

        if wahl == "norden":
            aktueller_raum = 102
        elif wahl == "zurueck":
            aktueller_raum = 32
        elif wahl == "quit":
            antwort = input("Wirklich beenden? (ja/nein): ").lower().strip()
            if antwort == "ja":
                spiel_laeuft = False
        else:
            print("Das verstehe ich nicht.")

    # --------------------------------------------------------
    # LÜFTUNGSSCHACHT-RAUM (Raum 102)
    # --------------------------------------------------------
    elif aktueller_raum == 102:
        print()
        print("=== LÜFTUNGSSCHACHT-RAUM ===")
        print("Die Lüftung ist hier laut. In der Ostwand ist ein Lüftungsschacht.")
        print("Hinter dem Gitter siehst du einen gelben Zettel.")

        if hat_taschenmesser:
            print("Du könntest das Gitter mit dem Schraubenzieher abschrauben.")
        else:
            print("Ohne Schraubenzieher kannst du das Gitter nicht öffnen.")

        print("Im Norden geht es weiter.")
        print()
        wahl = input("Was tust du? (norden/gitter/zurueck/quit): ").lower().strip()

        if wahl == "norden":
            aktueller_raum = 103
        elif wahl == "gitter" and hat_taschenmesser:
            print("Du schraubst das Gitter ab und liest die Notiz:")
            print("'Um den Code für den Koffer zu finden, zähle unter")
            print("allen Zahlen auf der Notiz im Tresor die Ziffern 4, 7, 3.'")
        elif wahl == "gitter" and not hat_taschenmesser:
            print("Du brauchst einen Schraubenzieher!")
        elif wahl == "zurueck":
            aktueller_raum = 101
        elif wahl == "quit":
            antwort = input("Wirklich beenden? (ja/nein): ").lower().strip()
            if antwort == "ja":
                spiel_laeuft = False
        else:
            print("Das verstehe ich nicht.")

    # --------------------------------------------------------
    # VERBINDUNGSRAUM (Raum 103) — führt zur Sackgasse
    # --------------------------------------------------------
    elif aktueller_raum == 103:
        print()
        print("=== VERBINDUNGSRAUM ===")
        print("Ein L-förmiger Raum mit zwei Türen im Süden.")
        print("Du gehst durch die westliche Tür weiter.")
        print()
        wahl = input("Was tust du? (weiter/zurueck/quit): ").lower().strip()

        if wahl == "weiter":
            aktueller_raum = 104
        elif wahl == "zurueck":
            aktueller_raum = 102
        elif wahl == "quit":
            antwort = input("Wirklich beenden? (ja/nein): ").lower().strip()
            if antwort == "ja":
                spiel_laeuft = False
        else:
            print("Das verstehe ich nicht.")

    # --------------------------------------------------------
    # SACKGASSE MIT TASCHENMESSER (Raum 104)
    # --------------------------------------------------------
    elif aktueller_raum == 104:
        print()
        print("=== SACKGASSE ===")
        print("Eine Sackgasse. An der Wand hängt ein Zettel.")

        if not hat_taschenmesser:
            print("Er ist mit einem Taschenmesser befestigt.")
            print("Du nimmst das Taschenmesser mit. Es hat einen Schraubenzieher!")
            hat_taschenmesser = True

        print()
        print("Die Notiz sagt:")
        print("'Der Code zum Tresor ergibt sich aus der Zahl der Füsse")
        print("im Rätsel der Sphinx, in der Reihenfolge, wie sie vorkommen.'")
        print()
        wahl = input("Was tust du? (zurueck/quit): ").lower().strip()

        if wahl == "zurueck":
            aktueller_raum = 103
        elif wahl == "quit":
            antwort = input("Wirklich beenden? (ja/nein): ").lower().strip()
            if antwort == "ja":
                spiel_laeuft = False
        else:
            print("Das verstehe ich nicht.")

    # --------------------------------------------------------
    # BÜRO WEST / TRESORRAUM (Raum 201 + 202)
    # --------------------------------------------------------
    elif aktueller_raum == 201:
        print()
        print("=== BÜRO WEST ===")
        print("Ein 8x8m Raum mit einer verstaubten Schreibmaschine.")
        print("Im Süden gibt es eine Tür.")
        print()
        wahl = input("Was tust du? (sueden/zurueck/quit): ").lower().strip()

        if wahl == "sueden":
            aktueller_raum = 202
        elif wahl == "zurueck":
            aktueller_raum = 32
        elif wahl == "quit":
            antwort = input("Wirklich beenden? (ja/nein): ").lower().strip()
            if antwort == "ja":
                spiel_laeuft = False
        else:
            print("Das verstehe ich nicht.")

    # --------------------------------------------------------
    # Teilaufgabe 3: TRESORRAUM mit Wiederholungs-Schleife
    # --------------------------------------------------------
    elif aktueller_raum == 202:
        print()
        print("=== TRESORRAUM ===")
        print("Ein riesiger Schreibtisch mit einem schweren Tresor.")

        if not tresor_offen:
            # INNERE WHILE-SCHLEIFE: Der Spieler kann mehrfach raten
            # "while True" läuft endlos — bis "break" sie beendet
            while True:
                print()
                eingabe = input("Tresorcode eingeben (oder 'zurueck'): ").strip()

                if eingabe == "zurueck":
                    aktueller_raum = 201   # Zurück zum Büro West
                    break                  # Innere Schleife verlassen

                # Code prüfen
                code = int(eingabe)
                if code == 423:
                    print("Der Tresor öffnet sich!")
                    print("'The answer to life, the universe and everything.")
                    print("Ausserdem der Code, mit dem du diesen Tresor geöffnet hast.'")
                    tresor_offen = True
                    break                  # Innere Schleife verlassen
                else:
                    print("Falscher Code. Versuch es nochmal.")
                    # Kein break → Schleife läuft weiter, neue Eingabe
        else:
            print("Der Tresor ist bereits offen und leer.")
            eingabe = input("Zurück? (ja): ")
            aktueller_raum = 201

    # --------------------------------------------------------
    # UNBEKANNTER RAUM (Sicherheitsnetz)
    # --------------------------------------------------------
    else:
        # Falls aktueller_raum einen Wert hat, für den es keinen
        # elif-Block gibt → Fehlermeldung und Spiel beenden
        print(f"\nRaum {aktueller_raum} ist noch nicht programmiert.")
        spiel_laeuft = False


# ============================================================
# SPIELENDE
# ============================================================

print()
print("=" * 50)
print("Spiel beendet. Danke fürs Spielen!")
print("=" * 50)


# ============================================================
# ZUSAMMENFASSUNG FÜR SCHÜLER:
# ============================================================
# Was du gelernt hast:
# - while-Schleife als Spielschleife (Hauptloop)
# - aktueller_raum steuert, welcher elif-Block ausgeführt wird
# - Raumwechsel durch Ändern von aktueller_raum
# - Innere while-Schleife für mehrere Versuche (Tresor)
# - break zum vorzeitigen Verlassen einer Schleife
# - spiel_laeuft = False zum Beenden der Hauptschleife
#
# Struktur der Spielschleife:
#   while spiel_laeuft:
#       if aktueller_raum == 1:    → Startraum
#       elif aktueller_raum == 31: → Korridor 1
#       elif aktueller_raum == 32: → Korridor 2
#       ...
#       else:                       → Sicherheitsnetz
#
# In Übung 10 ergänzt du die Listen für das Inventarsystem!
# ============================================================

```

---

## Lösung 10: Listen

```python
# ============================================================
# MUSTERLÖSUNG – Übung 10: Inventarsystem mit Listen
# ============================================================
# Listen speichern mehrere Werte in einer Sammlung. Statt
# einzelner Bool-Variablen (hat_papier, hat_taschenmesser)
# verwenden wir eine einzige Liste für alle Gegenstände.
# ============================================================


# ============================================================
# Teilaufgabe 1: Inventar als Liste
# ============================================================

print("=== Inventar als Liste ===")
print()

# Eine leere Liste erstellen: eckige Klammern []
inventar = []
print(f"Start-Inventar: {inventar}")
# Ausgabe: Start-Inventar: []

# .append() fügt ein Element am Ende der Liste hinzu
print("Du findest Papier und Bleistift.")
inventar.append("Papier")
inventar.append("Bleistift")
print(f"Inventar: {inventar}")
# Ausgabe: Inventar: ['Papier', 'Bleistift']

# Noch ein Gegenstand
print("Du findest ein Taschenmesser!")
inventar.append("Taschenmesser")
print(f"Inventar: {inventar}")
# Ausgabe: Inventar: ['Papier', 'Bleistift', 'Taschenmesser']

# Die Reihenfolge bleibt erhalten: Papier zuerst, Taschenmesser zuletzt

print()
print("=" * 50)


# ============================================================
# Teilaufgabe 2: Prüfen mit "in"
# ============================================================

print()
print("=== Prüfen mit 'in' ===")
print()

# "in" prüft, ob ein Element in der Liste vorhanden ist
# Das ersetzt die alten Bool-Variablen:
# Alt: if hat_taschenmesser:
# Neu: if "Taschenmesser" in inventar:

if "Taschenmesser" in inventar:
    print("Du schraubst das Lüftungsgitter mit dem Schraubenzieher ab.")
else:
    print("Du brauchst einen Schraubenzieher, um das Gitter zu öffnen.")

print()

# "not in" prüft, ob ein Element NICHT in der Liste ist
# Damit verhindern wir, dass ein Gegenstand doppelt aufgehoben wird
if "Sprengschnur" not in inventar:
    print("Im Koffer liegt eine Sprengschnur mit Stoppuhr.")
    inventar.append("Sprengschnur")
    # Sprengschnur wird nur hinzugefügt, wenn sie noch nicht da ist
else:
    print("Den Koffer hast du bereits geöffnet.")

print(f"Inventar: {inventar}")

print()
print("=" * 50)


# ============================================================
# Teilaufgabe 3: Inventar anzeigen (mit Funktion)
# ============================================================

print()
print("=== Inventar-Anzeige ===")
print()

# "def" definiert eine FUNKTION — einen wiederverwendbaren Codeblock.
# Die Funktion wird mit ihrem Namen aufgerufen: zeige_inventar()
# Sie kann beliebig oft aufgerufen werden.

def zeige_inventar():
    """Zeigt das aktuelle Inventar in einer formatierten Box an."""

    # Rahmen zeichnen mit Unicode-Zeichen
    print()
    print("╔══════════════════════╗")
    print("║     🎒 INVENTAR      ║")
    print("╠══════════════════════╣")

    # len() gibt die Anzahl Elemente in der Liste zurück
    if len(inventar) == 0:
        # Liste ist leer → "(leer)" anzeigen
        print("║  (leer)              ║")
    else:
        # for-Schleife: Geht jeden Gegenstand in der Liste durch
        # Bei jedem Durchlauf enthält "gegenstand" den aktuellen Wert
        for gegenstand in inventar:
            # f-String mit Formatierung:
            # {gegenstand:<18} → linksbündig, 18 Zeichen breit
            # Das sorgt dafür, dass die Rahmenlinien ausgerichtet sind
            print(f"║  - {gegenstand:<18}║")

    print(f"╚══════════════════════╝")
    print(f"  {len(inventar)} Gegenstand/Gegenstände")
    print()


# Funktion aufrufen und testen
inventar = ["Papier", "Bleistift", "Taschenmesser"]
zeige_inventar()

# Nochmal mit leerem Inventar testen
inventar = []
zeige_inventar()

# Und mit vollem Inventar
inventar = ["Papier", "Bleistift", "Taschenmesser", "Sprengschnur"]
zeige_inventar()

print("=" * 50)


# ============================================================
# Teilaufgabe 4: Besuchte Räume merken
# ============================================================

print()
print("=== Besuchte Räume ===")
print()

# Zweite Liste: Welche Räume wurden schon besucht?
besuchte_raeume = []

# Alle Räume im Spiel (zum Vergleich)
alle_raeume = [1, 31, 32, 101, 102, 103, 104, 201, 202]

# Simulation: Spieler betritt Räume nacheinander
raeume_zu_besuchen = [1, 31, 32, 101, 31, 32, 201]  # 31 und 32 doppelt!

for raum in raeume_zu_besuchen:
    if raum not in besuchte_raeume:
        # Raum wird zum ersten Mal betreten
        besuchte_raeume.append(raum)
        print(f"Raum {raum}: Zum ersten Mal hier!")
    else:
        # Raum wurde schon besucht
        print(f"Raum {raum}: Hier warst du schon.")

print()

# Fortschrittsanzeige
print(f"Erkundet: {len(besuchte_raeume)} von {len(alle_raeume)} Räumen")
print(f"Besuchte Räume: {besuchte_raeume}")
# Ausgabe: Besuchte Räume: [1, 31, 32, 101, 201]
# → 31 und 32 erscheinen nur einmal, weil "not in" Duplikate verhindert

print()
print("=" * 50)


# ============================================================
# Teilaufgabe 5: Integration in die Spielschleife (Auszug)
# ============================================================

print()
print("=== Integration in die Spielschleife ===")
print()

# Hier zeigen wir, wie das Inventar in die Spielschleife
# aus Übung 9 integriert wird. Das ist nur ein AUSZUG —
# im fertigen Spiel steht das innerhalb der while-Schleife.

# Spielvariablen
inventar = ["Papier", "Bleistift"]  # Start-Inventar
besuchte_raeume = []
aktueller_raum = 104  # Wir simulieren Raum 104
spiel_laeuft = True

# Beispiel: Ein Schleifendurchlauf für Raum 104
# (In echt steht das in "while spiel_laeuft:")

# Raum als besucht markieren
if aktueller_raum not in besuchte_raeume:
    besuchte_raeume.append(aktueller_raum)

print("=== SACKGASSE ===")
print("An der Wand hängt ein Zettel, befestigt mit einem Taschenmesser.")

# Taschenmesser: nur aufheben wenn noch nicht im Inventar
if "Taschenmesser" not in inventar:
    print("Du nimmst das Taschenmesser mit.")
    inventar.append("Taschenmesser")
else:
    print("Das Taschenmesser hast du bereits.")

print()
wahl = input("Was tust du? (inventar/zurueck): ").lower().strip()

# "inventar" als universeller Befehl — funktioniert in jedem Raum
if wahl == "inventar":
    zeige_inventar()
    # In der echten Schleife: continue → springt zum nächsten Durchlauf
    # Hier simulieren wir das nur
    print("(In der Spielschleife: continue → Raum wird nochmal angezeigt)")
elif wahl == "zurueck":
    aktueller_raum = 103
    print(f"Du gehst zurück zu Raum {aktueller_raum}.")


# ============================================================
# ZUSAMMENFASSUNG FÜR SCHÜLER:
# ============================================================
# Was du gelernt hast:
# - Listen erstellen: inventar = []
# - Elemente hinzufügen: inventar.append("Gegenstand")
# - Prüfen ob vorhanden: "Gegenstand" in inventar
# - Prüfen ob NICHT vorhanden: "Gegenstand" not in inventar
# - Länge einer Liste: len(inventar)
# - for-Schleife über Listen: for item in inventar:
# - Funktionen definieren: def zeige_inventar():
# - Funktionen aufrufen: zeige_inventar()
#
# Vorteile gegenüber Bool-Variablen:
# - Eine Variable statt vieler (inventar statt hat_papier, hat_messer...)
# - Neue Gegenstände hinzufügen ohne neue Variablen
# - Einfach alle Gegenstände anzeigen mit for-Schleife
# - Anzahl Gegenstände mit len() zählen
#
# Du hast jetzt ALLE Bausteine für das Spiel «Raus hier!»:
# Texte, Variablen, Eingaben, Berechnungen, Entscheidungen,
# Schleifen und Listen. Setze sie zum fertigen Spiel zusammen!
# ============================================================

```

---

## Komplettes Spiel: Raus hier! (erweiterte Version)

Diese Version verwendet zusätzlich: Funktionen (`def`), Dictionaries, Fehlerbehandlung (`try/except`) und `continue`.

```python
# ============================================================
# RAUS HIER! — Das Python-Spielbuch
# ============================================================
# Ein textbasiertes Abenteuerspiel, basierend auf dem Spielbuch
# «Raus hier!». Der Spieler erkundet einen Keller, löst Rätsel
# und findet den Weg in die Freiheit.
#
# Dieses Programm setzt alle Bausteine aus den Übungen 1–10
# zusammen: print(), Variablen, Datentypen, input(), Strings,
# Operatoren, Verzweigungen, Schleifen und Listen.
# ============================================================


# ============================================================
# SPIELTEXTE DEFINIEREN
# ============================================================
# Alle Raumtexte als Variablen — so bleibt die Spielschleife
# übersichtlich und die Texte sind leicht anpassbar.
# ============================================================

txt_intro = """
╔══════════════════════════════════════════════════╗
║           🔦  R A U S   H I E R !  🔦           ║
║          Ein Python-Textabenteuer                ║
╚══════════════════════════════════════════════════╝

Befehle: Tippe die angezeigte Option ein und drücke Enter.
         'inventar' → zeigt deine Gegenstände
         'quit'     → beendet das Spiel
"""

txt_01a = """Es ist stockdunkel und riecht nach Keller.
In der Stille ist das leise Rauschen einer Lüftungsanlage zu hören.
Deine Ausrüstung umfasst eine LED-Taschenlampe, einen Kompass und
eine Trinkflasche, die sich noch recht voll anfühlt. Ob der Strom
oder das Wasser zuerst ausgeht, wird sich zeigen. Am besten ist,
du findest schnell einen Weg raus hier!"""

txt_01b = """Ein Schluck Wasser hilft ein wenig gegen den Geschmack von Staub
auf der Zunge. Dann schaltest du die Taschenlampe ein und blickst
dich um: Du befindest dich in einem quadratischen Raum aus billigen
Betonelementen. Vor dir auf dem kahlen Betonboden steht ein
Stahlkoffer, an dem ein gelber Zettel klebt.
In einer Ecke liegen ein Blatt Papier und ein Bleistift."""

txt_11 = """Das Blatt ist im Format A4 (4mm kariert). Es ist leer.
Du packst Papier und Bleistift ein, vielleicht sind sie ja noch
nützlich. Dann wendest du dich dem Koffer zu."""

txt_12 = """Der Stahlkoffer ist mit einem dreistelligen Zahlenschloss
gesichert. Auf dem gelben Zettel steht:

'Erkunde den Keller, um den Code zum Koffer zu finden;
dann kannst du den Weg in die Freiheit öffnen. Zeichne eine genaue
Karte des Kellers, sie wird entscheidend sein für deinen Erfolg!'

Du betrachtest den Raum noch einmal genau. Laut deinem Kompass
verlaufen die Wände genau in Nord-Süd- bzw. Ost-West-Richtung.
Der Raum ist exakt vier mal vier Meter gross. In der Mitte der
Nordwand befindet sich eine Tür mit einer Glasscheibe.

Du zeichnest den Raum auf dein Blatt Papier.
Dann öffnest du die Tür und verlässt den Raum."""

txt_31 = """Du befindest dich in einem Korridor, der von West nach Ost
verläuft. Er hat eine Länge von 20 Meter und ist 4 Meter breit.

Im Süden und Norden gibt es mehrere verschlossene Türen mit
Glasscheiben. Hinter jeder Tür liegt ein identischer 4x4-Meter-Raum.

In der Mitte der Nordwand hat der Korridor eine weitere Tür,
die nicht verschlossen ist. Also gehst du da weiter."""

txt_32 = """Du hast einen weiteren Korridor erreicht. Dieser verläuft von
Süden nach Norden und ist ebenfalls 20 Meter lang und 4 Meter breit.

Sofort fällt dein Blick auf das Schild in der Mitte der Ostwand:
"Ausgang" — aber die schwere Stahltür hinter dem Panzerglas ist
verschlossen! Durch das Glas erkennst du ein Treppenhaus, das
nach oben führt.

Du entdeckst zwei weitere Türen: eine führt nach Osten (4m vom
südlichen Ende), die andere nach Westen (4m vom nördlichen Ende)."""

txt_101 = """Du öffnest die Tür nach Osten und erreichst einen Raum,
der 8 Meter auf 8 Meter misst. Es scheint ein Büro gewesen zu sein,
aber du findest nur noch ein paar leere Tische.

2 Meter von der Ostwand entfernt gibt es eine Tür in der Nordwand."""

txt_102 = """Du erreichst einen rechteckigen Raum, der sich 8 Meter nach
Norden erstreckt und 4 Meter breit ist.

Hier ist das Geräusch der Lüftung recht laut und du entdeckst in
der Mitte der Ostwand einen Lüftungsschacht. Hinter dem Gitter
erkennst du eine Nachricht auf einem gelben Zettel — aber du
kannst sie nicht lesen und das Gitter nicht ohne Werkzeug entfernen.

Am Nordende gibt es eine Tür, die weiter nach Norden führt."""

txt_102_gitter = """Du schraubst mit dem Schraubenzieher das Gitter ab
und liest die Notiz auf dem gelben Zettel:

'Um den Code für den Koffer zu finden, zähle unter allen Zahlen,
die auf der Notiz im Tresor genannt werden:

1. Wie oft die Ziffer 4 vorkommt.
2. Wie oft die Ziffer 7 vorkommt.
3. Wie oft die Ziffer 3 vorkommt.'"""

txt_103 = """Dieser Raum erstreckt sich 8 Meter nach Westen und 4 Meter
nach Norden. Hier gibt es nichts zu sehen ausser zwei Türen in der
Südwand. Du gehst durch die westliche Tür weiter."""

txt_104 = """Dieser Raum misst 4 Meter auf 4 Meter und ist eine Sackgasse:
es gibt nur die eine Tür, durch die du hereingekommen bist.

An der Südwand hängt ein gelber Zettel. Er ist mit einem
Taschenmesser befestigt, das in einer Wandritze klemmt."""

txt_104_notiz = """Du liest die Notiz:

'Der Code zum Tresor ergibt sich aus der Zahl der Füsse im Rätsel
der Sphinx, in der Reihenfolge, wie sie im Rätsel vorkommen.'"""

txt_201 = """Du öffnest die Tür nach Westen und erreichst einen Raum,
der 8 Meter auf 8 Meter misst. Es scheint ein Büro gewesen zu sein.
Du findest hier nur einen Tisch mit einer verstaubten
Underwood-Schreibmaschine. Schön, aber nicht hilfreich.

Im Süden gibt es eine weitere Tür."""

txt_202 = """Du erreichst ein weiteres Büro. Dieser Raum misst 8 Meter
auf 8 Meter. Es gibt einen riesigen Schreibtisch, auf dem ein
schwerer Tresor steht."""

txt_tresor_offen = """Du nimmst die Notiz aus dem Tresor nochmals zur Hand:

'The answer to life, the universe and everything.
Ausserdem der Code, mit dem du diesen Tresor geöffnet hast.'"""

txt_tresor_zettel = """Lautlos schwingt die Tresortür auf und ein gelber Zettel
flattert heraus. Abgesehen davon ist der Tresor leer.
Du hebst den Zettel auf und liest:

'The answer to life, the universe and everything.
Ausserdem der Code, mit dem du diesen Tresor geöffnet hast.'"""

txt_301 = """Du stellst den Code ein und versuchst, den Stahlkoffer zu
öffnen. Es gelingt!

Im Koffer liegt etwas, was wie ein aufgewickeltes Stück Sprengschnur
aussieht, mit einer Art Stoppuhr am Ende. Darunter liegt ein Zettel:

'Diese Sprengschnur kann verwendet werden, um ein Loch in eines
der Betonwandelemente zu sprengen. Zünden kannst du sie, indem du
einen Countdown auf der Uhr einstellst.

Warnung: Die Sprengkraft reicht nur für die Betonelemente.
Die Stahltür und das Panzerglas beim Treppenhaus sind zu stabil!'"""

txt_sprengung_erfolg = """
Du bringst die Sprengschnur am Wandelement an und stellst die
Stoppuhr auf 60 Sekunden. Du gehst in den Nachbarraum, hältst
die Ohren zu und den Mund offen...

💥 BUMM!

Die Luft füllt sich mit Staub. Du hustest kurz und wartest.
Dann leuchtest du mit der Taschenlampe auf das Resultat:

Präzisionsarbeit! Ein rundes Loch, gerade gross genug zum
Durchkriechen, führt ins Treppenhaus!

Du kriechst durch und steigst die Treppe hoch.

╔══════════════════════════════════════════════════╗
║     🎉  R A U S   H I E R !  🎉                 ║
║     Du hast den Keller verlassen!                ║
╚══════════════════════════════════════════════════╝"""

txt_sprengung_fehlschlag = """
Du bringst die Sprengschnur am Wandelement an und stellst die
Stoppuhr auf 60 Sekunden. Du gehst in den Nachbarraum, hältst
die Ohren zu und den Mund offen...

💥 BUMM!

Die Luft füllt sich mit Staub. Du hustest kurz und wartest.
Dann leuchtest du mit der Taschenlampe auf das Resultat:

Leider kein Durchgang. Dahinter liegt kein Treppenhaus.
Schade — die Sprengschnur ist verbraucht!"""


# ============================================================
# RAUMNAMEN (Dictionary für die Statuszeile)
# ============================================================

raum_namen = {
    1:   "Startraum",
    31:  "West-Ost-Korridor",
    32:  "Süd-Nord-Korridor",
    101: "Büro Ost",
    102: "Lüftungsschacht-Raum",
    103: "Verbindungsraum",
    104: "Sackgasse",
    201: "Büro West",
    202: "Tresorraum"
}


# ============================================================
# HILFSFUNKTIONEN
# ============================================================

def zeige_inventar(inventar):
    """Zeigt das aktuelle Inventar in einer formatierten Box an."""
    print()
    print("╔════════════════════════════╗")
    print("║       🎒 INVENTAR          ║")
    print("╠════════════════════════════╣")
    if len(inventar) == 0:
        print("║  (leer)                    ║")
    else:
        for gegenstand in inventar:
            print(f"║  - {gegenstand:<24}║")
    print(f"╚════════════════════════════╝")
    print(f"  {len(inventar)} Gegenstand/Gegenstände")
    print()


def zeige_status(raum, inventar):
    """Zeigt eine kompakte Statuszeile an."""
    symbole = ""
    if "Papier" in inventar:
        symbole += "📄"
    if "Taschenmesser" in inventar:
        symbole += "🔪"
    if "Sprengschnur" in inventar:
        symbole += "💣"
    if symbole == "":
        symbole = "–"
    name = raum_namen.get(raum, f"Raum {raum}")
    print(f"  [{name} | Inventar: {symbole}]")


def eingabe_holen(optionen_text):
    """Zeigt Optionen an und holt normalisierte Eingabe."""
    print()
    print(optionen_text)
    wahl = input("> ").lower().strip()
    return wahl


def trennlinie():
    """Zeichnet eine optische Trennlinie."""
    print()
    print("─" * 50)


# ============================================================
# SPIELVARIABLEN INITIALISIEREN
# ============================================================

aktueller_raum = 0          # 0 = Intro, 1 = Startraum, etc.
spiel_laeuft = True
gewonnen = False

# Inventar als Liste (statt einzelner Bool-Variablen)
inventar = []

# Fortschritts-Flags
tresor_offen = False
gitter_offen = False
koffer_offen = False
hat_sphinx_hinweis = False
hat_lueftungs_hinweis = False

# Besuchte Räume (für Erstbesuch-Texte)
besuchte_raeume = []


# ============================================================
# INTRO
# ============================================================

print(txt_intro)
input("Drücke Enter, um zu beginnen...")

trennlinie()
print(txt_01a)
input("\nDrücke Enter...")

trennlinie()
print(txt_01b)

# Erste Entscheidung: Papier oder Koffer?
while True:
    wahl = eingabe_holen("Was tust du zuerst? (papier / koffer)")

    if wahl == "papier":
        trennlinie()
        print(txt_11)
        inventar.append("Papier")
        inventar.append("Bleistift")
        input("\nDrücke Enter...")
        trennlinie()
        print(txt_12)
        break
    elif wahl == "koffer":
        trennlinie()
        print(txt_12)
        # Papier wird trotzdem eingepackt
        inventar.append("Papier")
        inventar.append("Bleistift")
        break
    else:
        print("Bitte tippe 'papier' oder 'koffer'.")

input("\nDrücke Enter...")

# Korridor 1 (automatisch)
trennlinie()
print(txt_31)
input("\nDrücke Enter...")

# Korridor 2 (automatisch)
trennlinie()
print(txt_32)

# Ab hier beginnt die freie Erkundung
aktueller_raum = 32
besuchte_raeume = [1, 31, 32]


# ============================================================
# HAUPTSCHLEIFE (Spielschleife)
# ============================================================

while spiel_laeuft:

    trennlinie()
    zeige_status(aktueller_raum, inventar)

    # --------------------------------------------------------
    # SÜD-NORD-KORRIDOR (Raum 32)
    # --------------------------------------------------------
    if aktueller_raum == 32:
        if 32 not in besuchte_raeume:
            besuchte_raeume.append(32)
            print(txt_32)

        optionen = "Wohin? (osten / westen"
        if koffer_offen:
            optionen += " / koffer"
        optionen += " / quit)"
        wahl = eingabe_holen(optionen)

        if wahl == "inventar":
            zeige_inventar(inventar)
        elif wahl == "osten":
            aktueller_raum = 101
        elif wahl == "westen":
            aktueller_raum = 201
        elif wahl == "koffer" and koffer_offen:
            print("\nDu hast den Koffer bereits geöffnet.")
        elif wahl == "quit":
            antwort = input("Wirklich beenden? (ja/nein): ").lower().strip()
            if antwort == "ja":
                spiel_laeuft = False
        else:
            print("Das verstehe ich nicht.")

    # --------------------------------------------------------
    # BÜRO OST (Raum 101)
    # --------------------------------------------------------
    elif aktueller_raum == 101:
        if 101 not in besuchte_raeume:
            besuchte_raeume.append(101)
            print(txt_101)
        else:
            print("\nDas Büro mit den leeren Tischen. Türen nach Norden und Westen.")

        wahl = eingabe_holen("Was tust du? (norden / zurueck)")

        if wahl == "inventar":
            zeige_inventar(inventar)
        elif wahl == "norden":
            aktueller_raum = 102
        elif wahl == "zurueck":
            aktueller_raum = 32
        else:
            print("Das verstehe ich nicht.")

    # --------------------------------------------------------
    # LÜFTUNGSSCHACHT-RAUM (Raum 102)
    # --------------------------------------------------------
    elif aktueller_raum == 102:
        if 102 not in besuchte_raeume:
            besuchte_raeume.append(102)
            print(txt_102)
        else:
            print("\nDer Raum mit dem Lüftungsschacht.")
            if gitter_offen:
                print("Das Gitter ist abgeschraubt.")
            else:
                print("Hinter dem Gitter siehst du einen gelben Zettel.")

        optionen = "Was tust du? (norden"
        if not gitter_offen and "Taschenmesser" in inventar:
            optionen += " / gitter"
        elif not gitter_offen:
            optionen += " / gitter [verschlossen]"
        optionen += " / zurueck)"
        wahl = eingabe_holen(optionen)

        if wahl == "inventar":
            zeige_inventar(inventar)
        elif wahl == "norden":
            aktueller_raum = 103
        elif wahl == "gitter":
            if "Taschenmesser" in inventar:
                gitter_offen = True
                hat_lueftungs_hinweis = True
                print(txt_102_gitter)
                if tresor_offen:
                    print()
                    print(txt_tresor_offen)
                    # Koffercode berechnen und anzeigen
                    print()
                    print("Die Zahlen auf der Tresor-Notiz sind: 42 und 423.")
                    print("Ziffer 4 kommt 2x vor, Ziffer 7 kommt 0x vor, Ziffer 3 kommt 1x vor.")
                    print("→ Der Koffercode ist: 201")
            else:
                print("Du brauchst einen Schraubenzieher, um das Gitter zu öffnen.")
        elif wahl == "zurueck":
            aktueller_raum = 101
        else:
            print("Das verstehe ich nicht.")

    # --------------------------------------------------------
    # VERBINDUNGSRAUM (Raum 103)
    # --------------------------------------------------------
    elif aktueller_raum == 103:
        if 103 not in besuchte_raeume:
            besuchte_raeume.append(103)
            print(txt_103)
        else:
            print("\nDer Verbindungsraum mit zwei Türen nach Süden.")

        wahl = eingabe_holen("Was tust du? (weiter / zurueck)")

        if wahl == "inventar":
            zeige_inventar(inventar)
        elif wahl == "weiter":
            aktueller_raum = 104
        elif wahl == "zurueck":
            aktueller_raum = 102
        else:
            print("Das verstehe ich nicht.")

    # --------------------------------------------------------
    # SACKGASSE MIT TASCHENMESSER (Raum 104)
    # --------------------------------------------------------
    elif aktueller_raum == 104:
        if 104 not in besuchte_raeume:
            besuchte_raeume.append(104)
            print(txt_104)
        else:
            print("\nDie Sackgasse.")

        # Taschenmesser aufheben (nur beim ersten Mal)
        if "Taschenmesser" not in inventar:
            print("\nDu packst das Taschenmesser ein. Es verfügt über einen Schraubenzieher!")
            inventar.append("Taschenmesser")

        # Sphinx-Hinweis immer anzeigen
        hat_sphinx_hinweis = True
        print(txt_104_notiz)

        wahl = eingabe_holen("Was tust du? (zurueck)")

        if wahl == "inventar":
            zeige_inventar(inventar)
        elif wahl == "zurueck":
            aktueller_raum = 103
        else:
            print("Das verstehe ich nicht.")

    # --------------------------------------------------------
    # BÜRO WEST (Raum 201)
    # --------------------------------------------------------
    elif aktueller_raum == 201:
        if 201 not in besuchte_raeume:
            besuchte_raeume.append(201)
            print(txt_201)
        else:
            print("\nDas Büro mit der Schreibmaschine. Türen nach Süden und Osten.")

        wahl = eingabe_holen("Was tust du? (sueden / zurueck)")

        if wahl == "inventar":
            zeige_inventar(inventar)
        elif wahl == "sueden" or wahl == "süden":
            aktueller_raum = 202
        elif wahl == "zurueck":
            aktueller_raum = 32
        else:
            print("Das verstehe ich nicht.")

    # --------------------------------------------------------
    # TRESORRAUM (Raum 202)
    # --------------------------------------------------------
    elif aktueller_raum == 202:
        if 202 not in besuchte_raeume:
            besuchte_raeume.append(202)
            print(txt_202)
        else:
            print("\nDer Tresorraum.")

        if tresor_offen:
            print("Der Tresor ist bereits geöffnet und leer.")
            print(txt_tresor_offen)
            wahl = eingabe_holen("Was tust du? (zurueck)")
            if wahl == "inventar":
                zeige_inventar(inventar)
            elif wahl == "zurueck":
                aktueller_raum = 201
            else:
                print("Das verstehe ich nicht.")
        else:
            # Tresor noch verschlossen → Code-Eingabe
            while True:
                print()
                eingabe = input("Tresorcode eingeben (oder 'zurueck'): ").strip()

                if eingabe.lower() == "zurueck":
                    aktueller_raum = 201
                    break
                elif eingabe.lower() == "inventar":
                    zeige_inventar(inventar)
                    continue

                # Versuche die Eingabe als Zahl zu interpretieren
                try:
                    code = int(eingabe)
                except ValueError:
                    print("Bitte gib eine dreistellige Zahl ein.")
                    continue

                if code == 423:
                    print(txt_tresor_zettel)
                    tresor_offen = True
                    # Falls Lüftungshinweis schon bekannt → Code berechnen
                    if hat_lueftungs_hinweis:
                        print()
                        print("Du erinnerst dich an die Notiz aus dem Lüftungsschacht!")
                        print("Die Zahlen auf der Tresor-Notiz sind: 42 und 423.")
                        print("Ziffer 4 kommt 2x vor, Ziffer 7 kommt 0x vor, Ziffer 3 kommt 1x vor.")
                        print("→ Der Koffercode ist: 201")
                    break
                elif code > 423:
                    print("Falscher Code. (Vielleicht etwas zu hoch?)")
                elif code < 423:
                    print("Falscher Code. (Vielleicht etwas zu tief?)")

    # --------------------------------------------------------
    # ZURÜCK IM KORRIDOR → KOFFER ÖFFNEN (nach Sprengschnur)
    # --------------------------------------------------------
    # Wenn der Spieler beide Hinweise hat und den Koffercode kennt,
    # kann er im Startraum den Koffer öffnen.
    # Wir fangen das über den Raum 32 ab (Koffer liegt im Startraum,
    # aber der Spieler muss durch den Korridor zurück).

    # --------------------------------------------------------
    # SICHERHEITSNETZ
    # --------------------------------------------------------
    else:
        print(f"\nRaum {aktueller_raum} ist unbekannt. Zurück zum Korridor.")
        aktueller_raum = 32

    # --------------------------------------------------------
    # KOFFER-CHECK: Kann der Spieler den Koffer öffnen?
    # --------------------------------------------------------
    # Wenn beide Hinweise vorhanden und Koffer noch nicht offen,
    # bieten wir im Süd-Nord-Korridor die Koffer-Option an.
    if (aktueller_raum == 32 and tresor_offen and hat_lueftungs_hinweis
            and not koffer_offen and spiel_laeuft):

        trennlinie()
        print("\n💡 Du hast beide Hinweise! Zeit, den Koffer im Startraum zu öffnen.")
        print("Du gehst zurück durch den West-Ost-Korridor zum Startraum.")

        while True:
            print()
            eingabe = input("Koffercode eingeben: ").strip()

            try:
                code_eingabe = eingabe
            except ValueError:
                print("Bitte gib den dreistelligen Code ein.")
                continue

            if code_eingabe == "201":
                print(txt_301)
                inventar.append("Sprengschnur")
                koffer_offen = True

                # --- SPRENGUNG ---
                print()
                print("Du gehst zurück in den Süd-Nord-Korridor.")
                print("Zeit, diesen Keller zu verlassen!")

                trennlinie()
                print("\nIn welchem Raum willst du die Wand sprengen?")
                print("  1 = Startraum")
                print("  2 = West-Ost-Korridor")
                print("  3 = Süd-Nord-Korridor")
                print("  4 = Büro Ost (leere Tische)")
                print("  5 = Lüftungsschacht-Raum")
                print("  6 = Verbindungsraum")
                print("  7 = Sackgasse (Taschenmesser-Raum)")
                print("  8 = Büro West (Schreibmaschine)")
                print("  9 = Tresorraum")

                raum_wahl = input("\nDeine Wahl (1-9): ").strip()

                if raum_wahl == "7":
                    # Sackgasse — einziger Raum, der an das Treppenhaus
                    # grenzt (über eine sprengbare Betonwand)
                    print("\nGute Wahl! Die Sackgasse.")
                    print()
                    print("In welcher Wand willst du das Loch sprengen?")
                    wand = input("(nord / ost / sued / west): ").lower().strip()

                    if wand == "sued" or wand == "süd":
                        print("\nDie Südwand hat 4 Wandelemente (je 1 Meter breit).")
                        element = input("Welches Element? (1-4): ").strip()

                        if element in ["1", "2"]:
                            # ERFOLG! Elemente 1–2 grenzen ans Treppenhaus
                            print(txt_sprengung_erfolg)
                            gewonnen = True
                            spiel_laeuft = False
                        else:
                            print(txt_sprengung_fehlschlag)
                            print("\nOhne Sprengschnur sitzt du fest.")
                            spiel_laeuft = False
                    else:
                        print(txt_sprengung_fehlschlag)
                        print("\nOhne Sprengschnur sitzt du fest.")
                        spiel_laeuft = False
                else:
                    print(txt_sprengung_fehlschlag)
                    print("\nOhne Sprengschnur sitzt du fest.")
                    spiel_laeuft = False
                break
            else:
                print("Falscher Code. Versuche es nochmal.")


# ============================================================
# SPIELENDE
# ============================================================

trennlinie()
print()

if gewonnen:
    print(f"Du hast {len(besuchte_raeume)} von {len(raum_namen)} Räumen erkundet.")
    zeige_inventar(inventar)
    print("Gratulation! Du hast «Raus hier!» geschafft! 🎉")
else:
    print("Das Spiel ist zu Ende.")
    print("Vielleicht klappt es beim nächsten Versuch!")

print()

```

---

## Komplettes Spiel: Raus hier! (einfache Version)

Diese Version verwendet **nur** Konzepte aus den Übungen 1–10: keine Funktionen, keine Dictionaries, kein `try/except`.

```python
# ============================================================
# RAUS HIER! — Das Python-Spielbuch (Einfache Version)
# ============================================================
# Ein textbasiertes Abenteuerspiel, basierend auf dem Spielbuch
# «Raus hier!». Der Spieler erkundet einen Keller, löst Rätsel
# und findet den Weg in die Freiheit.
#
# Diese Version verwendet NUR Konzepte aus den Übungen 1–10:
#   - print(), Kommentare
#   - Variablen und Datentypen
#   - input(), Typumwandlung
#   - Strings und f-Strings
#   - Operatoren und Vergleiche
#   - Verzweigungen (if / elif / else)
#   - Schleifen (while, for)
#   - Listen (append, in, len)
#
# Was hier NICHT vorkommt (siehe Erweiterte Version):
#   - Funktionen (def)
#   - Fehlerbehandlung (try / except)
#   - Dictionaries ({})
# ============================================================


# ============================================================
# SPIELTEXTE DEFINIEREN
# ============================================================
# Alle Raumtexte als Variablen — so bleibt die Spielschleife
# übersichtlich und die Texte sind leicht anpassbar.
# ============================================================

txt_intro = """
======================================================
           RAUS HIER!
           Ein Python-Textabenteuer
======================================================

Befehle: Tippe die angezeigte Option ein und druecke Enter.
         'inventar' zeigt deine Gegenstaende
         'quit'     beendet das Spiel
"""

txt_01a = """Es ist stockdunkel und riecht nach Keller.
In der Stille ist das leise Rauschen einer Lueftungsanlage zu hoeren.
Deine Ausruestung umfasst eine LED-Taschenlampe, einen Kompass und
eine Trinkflasche, die sich noch recht voll anfuehlt. Ob der Strom
oder das Wasser zuerst ausgeht, wird sich zeigen. Am besten ist,
du findest schnell einen Weg raus hier!"""

txt_01b = """Ein Schluck Wasser hilft ein wenig gegen den Geschmack von Staub
auf der Zunge. Dann schaltest du die Taschenlampe ein und blickst
dich um: Du befindest dich in einem quadratischen Raum aus billigen
Betonelementen. Vor dir auf dem kahlen Betonboden steht ein
Stahlkoffer, an dem ein gelber Zettel klebt.
In einer Ecke liegen ein Blatt Papier und ein Bleistift."""

txt_11 = """Das Blatt ist im Format A4 (4mm kariert). Es ist leer.
Du packst Papier und Bleistift ein, vielleicht sind sie ja noch
nuetzlich. Dann wendest du dich dem Koffer zu."""

txt_12 = """Der Stahlkoffer ist mit einem dreistelligen Zahlenschloss
gesichert. Auf dem gelben Zettel steht:

'Erkunde den Keller, um den Code zum Koffer zu finden;
dann kannst du den Weg in die Freiheit oeffnen. Zeichne eine genaue
Karte des Kellers, sie wird entscheidend sein fuer deinen Erfolg!'

Du betrachtest den Raum noch einmal genau. Laut deinem Kompass
verlaufen die Waende genau in Nord-Sued- bzw. Ost-West-Richtung.
Der Raum ist exakt vier mal vier Meter gross. In der Mitte der
Nordwand befindet sich eine Tuer mit einer Glasscheibe.

Du zeichnest den Raum auf dein Blatt Papier.
Dann oeffnest du die Tuer und verlaesst den Raum."""

txt_31 = """Du befindest dich in einem Korridor, der von West nach Ost
verlaeuft. Er hat eine Laenge von 20 Meter und ist 4 Meter breit.

Im Sueden und Norden gibt es mehrere verschlossene Tueren mit
Glasscheiben. Hinter jeder Tuer liegt ein identischer 4x4-Meter-Raum.

In der Mitte der Nordwand hat der Korridor eine weitere Tuer,
die nicht verschlossen ist. Also gehst du da weiter."""

txt_32 = """Du hast einen weiteren Korridor erreicht. Dieser verlaeuft von
Sueden nach Norden und ist ebenfalls 20 Meter lang und 4 Meter breit.

Sofort faellt dein Blick auf das Schild in der Mitte der Ostwand:
"Ausgang" — aber die schwere Stahltuer hinter dem Panzerglas ist
verschlossen! Durch das Glas erkennst du ein Treppenhaus, das
nach oben fuehrt.

Du entdeckst zwei weitere Tueren: eine fuehrt nach Osten (4m vom
suedlichen Ende), die andere nach Westen (4m vom noerdlichen Ende)."""

txt_101 = """Du oeffnest die Tuer nach Osten und erreichst einen Raum,
der 8 Meter auf 8 Meter misst. Es scheint ein Buero gewesen zu sein,
aber du findest nur noch ein paar leere Tische.

2 Meter von der Ostwand entfernt gibt es eine Tuer in der Nordwand."""

txt_102 = """Du erreichst einen rechteckigen Raum, der sich 8 Meter nach
Norden erstreckt und 4 Meter breit ist.

Hier ist das Geraeusch der Lueftung recht laut und du entdeckst in
der Mitte der Ostwand einen Lueftungsschacht. Hinter dem Gitter
erkennst du eine Nachricht auf einem gelben Zettel — aber du
kannst sie nicht lesen und das Gitter nicht ohne Werkzeug entfernen.

Am Nordende gibt es eine Tuer, die weiter nach Norden fuehrt."""

txt_102_gitter = """Du schraubst mit dem Schraubenzieher das Gitter ab
und liest die Notiz auf dem gelben Zettel:

'Um den Code fuer den Koffer zu finden, zaehle unter allen Zahlen,
die auf der Notiz im Tresor genannt werden:

1. Wie oft die Ziffer 4 vorkommt.
2. Wie oft die Ziffer 7 vorkommt.
3. Wie oft die Ziffer 3 vorkommt.'"""

txt_103 = """Dieser Raum erstreckt sich 8 Meter nach Westen und 4 Meter
nach Norden. Hier gibt es nichts zu sehen ausser zwei Tueren in der
Suedwand. Du gehst durch die westliche Tuer weiter."""

txt_104 = """Dieser Raum misst 4 Meter auf 4 Meter und ist eine Sackgasse:
es gibt nur die eine Tuer, durch die du hereingekommen bist.

An der Suedwand haengt ein gelber Zettel. Er ist mit einem
Taschenmesser befestigt, das in einer Wandritze klemmt."""

txt_104_notiz = """Du liest die Notiz:

'Der Code zum Tresor ergibt sich aus der Zahl der Fuesse im Raetsel
der Sphinx, in der Reihenfolge, wie sie im Raetsel vorkommen.'"""

txt_201 = """Du oeffnest die Tuer nach Westen und erreichst einen Raum,
der 8 Meter auf 8 Meter misst. Es scheint ein Buero gewesen zu sein.
Du findest hier nur einen Tisch mit einer verstaubten
Underwood-Schreibmaschine. Schoen, aber nicht hilfreich.

Im Sueden gibt es eine weitere Tuer."""

txt_202 = """Du erreichst ein weiteres Buero. Dieser Raum misst 8 Meter
auf 8 Meter. Es gibt einen riesigen Schreibtisch, auf dem ein
schwerer Tresor steht."""

txt_tresor_offen = """Du nimmst die Notiz aus dem Tresor nochmals zur Hand:

'The answer to life, the universe and everything.
Ausserdem der Code, mit dem du diesen Tresor geoeffnet hast.'"""

txt_tresor_zettel = """Lautlos schwingt die Tresortuer auf und ein gelber Zettel
flattert heraus. Abgesehen davon ist der Tresor leer.
Du hebst den Zettel auf und liest:

'The answer to life, the universe and everything.
Ausserdem der Code, mit dem du diesen Tresor geoeffnet hast.'"""

txt_301 = """Du stellst den Code ein und versuchst, den Stahlkoffer zu
oeffnen. Es gelingt!

Im Koffer liegt etwas, was wie ein aufgewickeltes Stueck Sprengschnur
aussieht, mit einer Art Stoppuhr am Ende. Darunter liegt ein Zettel:

'Diese Sprengschnur kann verwendet werden, um ein Loch in eines
der Betonwandelemente zu sprengen. Zuenden kannst du sie, indem du
einen Countdown auf der Uhr einstellst.

Warnung: Die Sprengkraft reicht nur fuer die Betonelemente.
Die Stahltuer und das Panzerglas beim Treppenhaus sind zu stabil!'"""

txt_sprengung_erfolg = """
Du bringst die Sprengschnur am Wandelement an und stellst die
Stoppuhr auf 60 Sekunden. Du gehst in den Nachbarraum, haeltst
die Ohren zu und den Mund offen...

*** BUMM! ***

Die Luft fuellt sich mit Staub. Du hustest kurz und wartest.
Dann leuchtest du mit der Taschenlampe auf das Resultat:

Praezisionsarbeit! Ein rundes Loch, gerade gross genug zum
Durchkriechen, fuehrt ins Treppenhaus!

Du kriechst durch und steigst die Treppe hoch.

======================================================
       RAUS HIER!
       Du hast den Keller verlassen!
======================================================"""

txt_sprengung_fehlschlag = """
Du bringst die Sprengschnur am Wandelement an und stellst die
Stoppuhr auf 60 Sekunden. Du gehst in den Nachbarraum, haeltst
die Ohren zu und den Mund offen...

*** BUMM! ***

Die Luft fuellt sich mit Staub. Du hustest kurz und wartest.
Dann leuchtest du mit der Taschenlampe auf das Resultat:

Leider kein Durchgang. Dahinter liegt kein Treppenhaus.
Schade — die Sprengschnur ist verbraucht!"""


# ============================================================
# SPIELVARIABLEN INITIALISIEREN
# ============================================================
# Hier werden alle Variablen definiert, die den Spielzustand
# speichern. Das entspricht dem Baustein aus Übung 3 (Variablen).
# ============================================================

aktueller_raum = 0          # 0 = Intro, dann Raumnummern wie im Spielbuch
spiel_laeuft = True
gewonnen = False

# Inventar als Liste (Übung 10: Listen)
inventar = []

# Fortschritts-Flags (Übung 3: Bool-Variablen)
tresor_offen = False
gitter_offen = False
koffer_offen = False
hat_sphinx_hinweis = False
hat_lueftungs_hinweis = False

# Besuchte Räume merken (Übung 10: Listen)
besuchte_raeume = []


# ============================================================
# INTRO-SEQUENZ
# ============================================================
# Lineare Abfolge: Texte ausgeben, Eingabe abwarten.
# Entspricht den Bausteinen aus Übungen 2 (print) und 5 (input).
# ============================================================

print(txt_intro)
input("Druecke Enter, um zu beginnen...")

print()
print("--------------------------------------------------")
print(txt_01a)
input("\nDruecke Enter...")

print()
print("--------------------------------------------------")
print(txt_01b)

# Erste Entscheidung: Papier oder Koffer? (Übung 8: Verzweigungen)
# Die while-Schleife wiederholt die Frage bei ungültiger Eingabe.
wahl = ""
while wahl != "papier" and wahl != "koffer":
    print()
    print("Was tust du zuerst? (papier / koffer)")
    wahl = input("> ").lower().strip()

    if wahl == "papier":
        print()
        print("--------------------------------------------------")
        print(txt_11)
        inventar.append("Papier")
        inventar.append("Bleistift")
        input("\nDruecke Enter...")
        print()
        print("--------------------------------------------------")
        print(txt_12)
    elif wahl == "koffer":
        print()
        print("--------------------------------------------------")
        print(txt_12)
        # Papier wird trotzdem eingepackt
        inventar.append("Papier")
        inventar.append("Bleistift")
    else:
        print("Bitte tippe 'papier' oder 'koffer'.")

input("\nDruecke Enter...")

# Korridor 1 (automatisch durchlaufen)
print()
print("--------------------------------------------------")
print(txt_31)
input("\nDruecke Enter...")

# Korridor 2 (automatisch durchlaufen)
print()
print("--------------------------------------------------")
print(txt_32)

# Ab hier beginnt die freie Erkundung
aktueller_raum = 32
besuchte_raeume = [1, 31, 32]


# ============================================================
# HAUPTSCHLEIFE (Spielschleife)
# ============================================================
# Dies ist das Herzstück des Spiels (Übung 9: Schleifen).
# Die while-Schleife läuft, solange spiel_laeuft == True.
# In jedem Durchlauf prüft eine if/elif-Kette, in welchem
# Raum sich der Spieler befindet, und führt die passende
# Logik aus.
# ============================================================

while spiel_laeuft:

    # --- Trennlinie und Statusanzeige (inline, ohne Funktion) ---
    print()
    print("--------------------------------------------------")

    # Raumnamen über if/elif bestimmen (statt Dictionary)
    raum_name = ""
    if aktueller_raum == 1:
        raum_name = "Startraum"
    elif aktueller_raum == 31:
        raum_name = "West-Ost-Korridor"
    elif aktueller_raum == 32:
        raum_name = "Sued-Nord-Korridor"
    elif aktueller_raum == 101:
        raum_name = "Buero Ost"
    elif aktueller_raum == 102:
        raum_name = "Lueftungsschacht-Raum"
    elif aktueller_raum == 103:
        raum_name = "Verbindungsraum"
    elif aktueller_raum == 104:
        raum_name = "Sackgasse"
    elif aktueller_raum == 201:
        raum_name = "Buero West"
    elif aktueller_raum == 202:
        raum_name = "Tresorraum"
    else:
        raum_name = f"Raum {aktueller_raum}"

    # Inventar-Symbole zusammenstellen (Übung 6: f-Strings)
    symbole = ""
    if "Papier" in inventar:
        symbole = symbole + "[Papier]"
    if "Taschenmesser" in inventar:
        symbole = symbole + "[Messer]"
    if "Sprengschnur" in inventar:
        symbole = symbole + "[Sprengschnur]"
    if symbole == "":
        symbole = "(leer)"

    print(f"  [{raum_name} | Inventar: {symbole}]")


    # --------------------------------------------------------
    # SUED-NORD-KORRIDOR (Raum 32)
    # --------------------------------------------------------
    if aktueller_raum == 32:
        # Erstbesuch-Text nur beim ersten Mal anzeigen
        if 32 not in besuchte_raeume:
            besuchte_raeume.append(32)
            print(txt_32)

        # Optionen zusammenstellen (Übung 6: String-Verkettung)
        optionen = "Wohin? (osten / westen"
        if koffer_offen:
            optionen = optionen + " / koffer"
        optionen = optionen + " / quit)"

        print()
        print(optionen)
        wahl = input("> ").lower().strip()

        # Inventar anzeigen (inline, statt Funktion)
        if wahl == "inventar":
            print()
            print("=== INVENTAR ===")
            if len(inventar) == 0:
                print("  (leer)")
            else:
                for gegenstand in inventar:
                    print(f"  - {gegenstand}")
            print(f"  {len(inventar)} Gegenstand/Gegenstaende")
            print()
        elif wahl == "osten":
            aktueller_raum = 101
        elif wahl == "westen":
            aktueller_raum = 201
        elif wahl == "koffer" and koffer_offen:
            print("\nDu hast den Koffer bereits geoeffnet.")
        elif wahl == "quit":
            antwort = input("Wirklich beenden? (ja/nein): ").lower().strip()
            if antwort == "ja":
                spiel_laeuft = False
        else:
            print("Das verstehe ich nicht.")


    # --------------------------------------------------------
    # BUERO OST (Raum 101)
    # --------------------------------------------------------
    elif aktueller_raum == 101:
        if 101 not in besuchte_raeume:
            besuchte_raeume.append(101)
            print(txt_101)
        else:
            print("\nDas Buero mit den leeren Tischen. Tueren nach Norden und Westen.")

        print()
        print("Was tust du? (norden / zurueck)")
        wahl = input("> ").lower().strip()

        if wahl == "inventar":
            print()
            print("=== INVENTAR ===")
            if len(inventar) == 0:
                print("  (leer)")
            else:
                for gegenstand in inventar:
                    print(f"  - {gegenstand}")
            print(f"  {len(inventar)} Gegenstand/Gegenstaende")
            print()
        elif wahl == "norden":
            aktueller_raum = 102
        elif wahl == "zurueck":
            aktueller_raum = 32
        else:
            print("Das verstehe ich nicht.")


    # --------------------------------------------------------
    # LUEFTUNGSSCHACHT-RAUM (Raum 102)
    # --------------------------------------------------------
    elif aktueller_raum == 102:
        if 102 not in besuchte_raeume:
            besuchte_raeume.append(102)
            print(txt_102)
        else:
            print("\nDer Raum mit dem Lueftungsschacht.")
            if gitter_offen:
                print("Das Gitter ist abgeschraubt.")
            else:
                print("Hinter dem Gitter siehst du einen gelben Zettel.")

        # Optionen je nach Spielzustand
        optionen = "Was tust du? (norden"
        if not gitter_offen and "Taschenmesser" in inventar:
            optionen = optionen + " / gitter"
        elif not gitter_offen:
            optionen = optionen + " / gitter [verschlossen]"
        optionen = optionen + " / zurueck)"

        print()
        print(optionen)
        wahl = input("> ").lower().strip()

        if wahl == "inventar":
            print()
            print("=== INVENTAR ===")
            if len(inventar) == 0:
                print("  (leer)")
            else:
                for gegenstand in inventar:
                    print(f"  - {gegenstand}")
            print(f"  {len(inventar)} Gegenstand/Gegenstaende")
            print()
        elif wahl == "norden":
            aktueller_raum = 103
        elif wahl == "gitter":
            if "Taschenmesser" in inventar:
                gitter_offen = True
                hat_lueftungs_hinweis = True
                print(txt_102_gitter)
                if tresor_offen:
                    print()
                    print(txt_tresor_offen)
                    # Koffercode berechnen und anzeigen
                    print()
                    print("Die Zahlen auf der Tresor-Notiz sind: 42 und 423.")
                    print("Ziffer 4 kommt 2x vor, Ziffer 7 kommt 0x vor, Ziffer 3 kommt 1x vor.")
                    print("Der Koffercode ist: 201")
            else:
                print("Du brauchst einen Schraubenzieher, um das Gitter zu oeffnen.")
        elif wahl == "zurueck":
            aktueller_raum = 101
        else:
            print("Das verstehe ich nicht.")


    # --------------------------------------------------------
    # VERBINDUNGSRAUM (Raum 103)
    # --------------------------------------------------------
    elif aktueller_raum == 103:
        if 103 not in besuchte_raeume:
            besuchte_raeume.append(103)
            print(txt_103)
        else:
            print("\nDer Verbindungsraum mit zwei Tueren nach Sueden.")

        print()
        print("Was tust du? (weiter / zurueck)")
        wahl = input("> ").lower().strip()

        if wahl == "inventar":
            print()
            print("=== INVENTAR ===")
            if len(inventar) == 0:
                print("  (leer)")
            else:
                for gegenstand in inventar:
                    print(f"  - {gegenstand}")
            print(f"  {len(inventar)} Gegenstand/Gegenstaende")
            print()
        elif wahl == "weiter":
            aktueller_raum = 104
        elif wahl == "zurueck":
            aktueller_raum = 102
        else:
            print("Das verstehe ich nicht.")


    # --------------------------------------------------------
    # SACKGASSE MIT TASCHENMESSER (Raum 104)
    # --------------------------------------------------------
    elif aktueller_raum == 104:
        if 104 not in besuchte_raeume:
            besuchte_raeume.append(104)
            print(txt_104)
        else:
            print("\nDie Sackgasse.")

        # Taschenmesser aufheben (nur beim ersten Mal)
        if "Taschenmesser" not in inventar:
            print("\nDu packst das Taschenmesser ein. Es verfuegt ueber einen Schraubenzieher!")
            inventar.append("Taschenmesser")

        # Sphinx-Hinweis immer anzeigen
        hat_sphinx_hinweis = True
        print(txt_104_notiz)

        print()
        print("Was tust du? (zurueck)")
        wahl = input("> ").lower().strip()

        if wahl == "inventar":
            print()
            print("=== INVENTAR ===")
            if len(inventar) == 0:
                print("  (leer)")
            else:
                for gegenstand in inventar:
                    print(f"  - {gegenstand}")
            print(f"  {len(inventar)} Gegenstand/Gegenstaende")
            print()
        elif wahl == "zurueck":
            aktueller_raum = 103
        else:
            print("Das verstehe ich nicht.")


    # --------------------------------------------------------
    # BUERO WEST (Raum 201)
    # --------------------------------------------------------
    elif aktueller_raum == 201:
        if 201 not in besuchte_raeume:
            besuchte_raeume.append(201)
            print(txt_201)
        else:
            print("\nDas Buero mit der Schreibmaschine. Tueren nach Sueden und Osten.")

        print()
        print("Was tust du? (sueden / zurueck)")
        wahl = input("> ").lower().strip()

        if wahl == "inventar":
            print()
            print("=== INVENTAR ===")
            if len(inventar) == 0:
                print("  (leer)")
            else:
                for gegenstand in inventar:
                    print(f"  - {gegenstand}")
            print(f"  {len(inventar)} Gegenstand/Gegenstaende")
            print()
        elif wahl == "sueden":
            aktueller_raum = 202
        elif wahl == "zurueck":
            aktueller_raum = 32
        else:
            print("Das verstehe ich nicht.")


    # --------------------------------------------------------
    # TRESORRAUM (Raum 202)
    # --------------------------------------------------------
    elif aktueller_raum == 202:
        if 202 not in besuchte_raeume:
            besuchte_raeume.append(202)
            print(txt_202)
        else:
            print("\nDer Tresorraum.")

        if tresor_offen:
            # Tresor ist bereits geöffnet
            print("Der Tresor ist bereits geoeffnet und leer.")
            print(txt_tresor_offen)

            print()
            print("Was tust du? (zurueck)")
            wahl = input("> ").lower().strip()

            if wahl == "inventar":
                print()
                print("=== INVENTAR ===")
                if len(inventar) == 0:
                    print("  (leer)")
                else:
                    for gegenstand in inventar:
                        print(f"  - {gegenstand}")
                print(f"  {len(inventar)} Gegenstand/Gegenstaende")
                print()
            elif wahl == "zurueck":
                aktueller_raum = 201
            else:
                print("Das verstehe ich nicht.")

        else:
            # Tresor noch verschlossen — Code-Eingabe
            # Hier verwenden wir String-Vergleich statt int(),
            # damit wir kein try/except brauchen.
            code_richtig = False
            while not code_richtig:
                print()
                eingabe = input("Tresorcode eingeben (oder 'zurueck'): ").strip()

                if eingabe.lower() == "zurueck":
                    aktueller_raum = 201
                    # code_richtig bleibt False, aber wir brechen ab
                    break
                elif eingabe.lower() == "inventar":
                    print()
                    print("=== INVENTAR ===")
                    if len(inventar) == 0:
                        print("  (leer)")
                    else:
                        for gegenstand in inventar:
                            print(f"  - {gegenstand}")
                    print(f"  {len(inventar)} Gegenstand/Gegenstaende")
                    print()
                elif eingabe == "423":
                    # Richtiger Code! (String-Vergleich)
                    print(txt_tresor_zettel)
                    tresor_offen = True
                    code_richtig = True
                    # Falls Lüftungshinweis schon bekannt
                    if hat_lueftungs_hinweis:
                        print()
                        print("Du erinnerst dich an die Notiz aus dem Lueftungsschacht!")
                        print("Die Zahlen auf der Tresor-Notiz sind: 42 und 423.")
                        print("Ziffer 4 kommt 2x vor, Ziffer 7 kommt 0x vor, Ziffer 3 kommt 1x vor.")
                        print("Der Koffercode ist: 201")
                else:
                    print("Falscher Code. Versuche es nochmal.")


    # --------------------------------------------------------
    # SICHERHEITSNETZ
    # --------------------------------------------------------
    else:
        print(f"\nRaum {aktueller_raum} ist unbekannt. Zurueck zum Korridor.")
        aktueller_raum = 32


    # --------------------------------------------------------
    # KOFFER-CHECK: Kann der Spieler den Koffer oeffnen?
    # --------------------------------------------------------
    # Wenn beide Hinweise vorhanden und Koffer noch nicht offen,
    # wird der Spieler automatisch zum Koffer geführt.
    if (aktueller_raum == 32 and tresor_offen and hat_lueftungs_hinweis
            and not koffer_offen and spiel_laeuft):

        print()
        print("--------------------------------------------------")
        print()
        print("Du hast beide Hinweise! Zeit, den Koffer im Startraum zu oeffnen.")
        print("Du gehst zurueck durch den West-Ost-Korridor zum Startraum.")

        # Koffercode-Eingabe (String-Vergleich statt int())
        koffer_code_richtig = False
        while not koffer_code_richtig:
            print()
            eingabe = input("Koffercode eingeben: ").strip()

            if eingabe == "201":
                print(txt_301)
                inventar.append("Sprengschnur")
                koffer_offen = True
                koffer_code_richtig = True

                # --- SPRENGUNG ---
                print()
                print("Du gehst zurueck in den Sued-Nord-Korridor.")
                print("Zeit, diesen Keller zu verlassen!")

                print()
                print("--------------------------------------------------")
                print()
                print("In welchem Raum willst du die Wand sprengen?")
                print("  1 = Startraum")
                print("  2 = West-Ost-Korridor")
                print("  3 = Sued-Nord-Korridor")
                print("  4 = Buero Ost (leere Tische)")
                print("  5 = Lueftungsschacht-Raum")
                print("  6 = Verbindungsraum")
                print("  7 = Sackgasse (Taschenmesser-Raum)")
                print("  8 = Buero West (Schreibmaschine)")
                print("  9 = Tresorraum")

                raum_wahl = input("\nDeine Wahl (1-9): ").strip()

                if raum_wahl == "7":
                    # Sackgasse — grenzt ans Treppenhaus
                    print("\nGute Wahl! Die Sackgasse.")
                    print()
                    print("In welcher Wand willst du das Loch sprengen?")
                    wand = input("(nord / ost / sued / west): ").lower().strip()

                    if wand == "sued":
                        print("\nDie Suedwand hat 4 Wandelemente (je 1 Meter breit).")
                        element = input("Welches Element? (1-4): ").strip()

                        if element == "1" or element == "2":
                            # ERFOLG!
                            print(txt_sprengung_erfolg)
                            gewonnen = True
                            spiel_laeuft = False
                        else:
                            print(txt_sprengung_fehlschlag)
                            print("\nOhne Sprengschnur sitzt du fest.")
                            spiel_laeuft = False
                    else:
                        print(txt_sprengung_fehlschlag)
                        print("\nOhne Sprengschnur sitzt du fest.")
                        spiel_laeuft = False
                else:
                    print(txt_sprengung_fehlschlag)
                    print("\nOhne Sprengschnur sitzt du fest.")
                    spiel_laeuft = False
            else:
                print("Falscher Code. Versuche es nochmal.")


# ============================================================
# SPIELENDE
# ============================================================
# Am Schluss wird das Ergebnis angezeigt.
# ============================================================

print()
print("--------------------------------------------------")
print()

if gewonnen:
    # Anzahl besuchter Räume anzeigen
    print(f"Du hast {len(besuchte_raeume)} von 9 Raeumen erkundet.")

    # Inventar anzeigen (inline)
    print()
    print("=== INVENTAR ===")
    if len(inventar) == 0:
        print("  (leer)")
    else:
        for gegenstand in inventar:
            print(f"  - {gegenstand}")
    print(f"  {len(inventar)} Gegenstand/Gegenstaende")
    print()

    print("Gratulation! Du hast 'Raus hier!' geschafft!")
else:
    print("Das Spiel ist zu Ende.")
    print("Vielleicht klappt es beim naechsten Versuch!")

print()

```
