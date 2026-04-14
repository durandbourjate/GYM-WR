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
