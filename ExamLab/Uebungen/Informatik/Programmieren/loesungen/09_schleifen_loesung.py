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
