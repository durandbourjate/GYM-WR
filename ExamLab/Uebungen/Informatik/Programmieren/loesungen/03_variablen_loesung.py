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
