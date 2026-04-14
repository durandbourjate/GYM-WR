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

