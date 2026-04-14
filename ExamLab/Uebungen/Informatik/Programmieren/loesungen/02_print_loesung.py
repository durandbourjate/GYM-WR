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
