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
