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
