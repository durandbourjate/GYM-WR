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
