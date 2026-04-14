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
