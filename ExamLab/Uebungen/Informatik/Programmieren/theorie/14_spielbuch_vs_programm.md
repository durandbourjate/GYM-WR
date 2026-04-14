# Vom Spielbuch zum Programm: Warum das Spiel weniger Texte braucht

Das Spielbuch «Raus hier!» enthält über 40 Textblöcke (`spieltext.py`). Das fertige Python-Spiel verwendet davon nur rund die Hälfte. Das ist kein Fehler — es zeigt einen grundlegenden Unterschied zwischen einem Abenteuerbuch und einem Programm.

---

## Das Problem des Spielbuchs

Ein Abenteuerbuch funktioniert mit Seitenverweisen: «Willst du nach Osten? → Seite 101. Nach Westen? → Seite 201.» Das Buch hat **kein Gedächtnis**. Es weiss nicht, welche Räume du schon besucht hast oder welche Hinweise du schon kennst. Deshalb muss es für jede mögliche Reihenfolge eine eigene «Seite» bereithalten.

Ein Programm hingegen kann **Variablen** verwenden, um sich den Spielzustand zu merken:

```python
tresor_offen = False
hat_sphinx_hinweis = False
hat_lueftungs_hinweis = False
besuchte_raeume = []
```

Mit diesen Variablen kann das Programm auf einer einzigen «Seite» entscheiden, was passiert — je nachdem, was der Spieler vorher getan hat.

---

## Drei Kategorien von «fehlenden» Texten

### 1. Reihenfolge-Varianten

Das Spielbuch beschreibt dieselben physischen Räume mehrfach, je nachdem ob man zuerst nach Osten oder nach Westen geht:

| Spielbuch (Ost-zuerst) | Spielbuch (West-zuerst) | Programm |
|---|---|---|
| `txt_101` — Büro Ost | `txt_203` — Büro Ost | **1× Raum 101** |
| `txt_102` — Lüftungsschacht | `txt_204` — Lüftungsschacht | **1× Raum 102** |
| `txt_103` — Verbindungsraum | `txt_205` — Verbindungsraum | **1× Raum 103** |
| `txt_104` — Sackgasse | `txt_206` — Sackgasse | **1× Raum 104** |
| `txt_201` — Büro West | `txt_162` — Büro West | **1× Raum 201** |

Im Programm reicht **ein einziger Textblock pro Raum**. Ein `if`-Block prüft, ob es der Erstbesuch ist:

```python
if 101 not in besuchte_raeume:
    besuchte_raeume.append(101)
    print(txt_101)         # Ausführlicher Erstbesuch-Text
else:
    print("Das Büro mit den leeren Tischen.")  # Kurzer Revisit-Text
```

### 2. Kombinationsvarianten

Das Spielbuch hat separate Seiten für alle möglichen Wissenskombinationen:

| Spielbuch-Texte | Situation | Programm-Lösung |
|---|---|---|
| `txt_111`–`txt_114` | Sphinx-Hinweis bekannt → Tresor suchen → Lüftung holen | `if hat_sphinx_hinweis and tresor_offen:` |
| `txt_161a/b`, `txt_164` | Sphinx-Hinweis bekannt → Lüftung zuerst → dann Tresor | `if hat_lueftungs_hinweis and not tresor_offen:` |
| `txt_207`, `txt_209` | West-Route: Lüftung vor Tresor | gleiche `if`-Logik |
| `txt_112` / `txt_202` | Tresor mit/ohne Code-Wissen | `if hat_sphinx_hinweis:` |

Das Programm braucht nur **eine Tresorraum-Logik**, die mit `if/elif` den aktuellen Wissensstand abfragt:

```python
if tresor_offen:
    print("Der Tresor ist bereits geöffnet.")
else:
    eingabe = input("Tresorcode eingeben: ")
    if eingabe == "423":
        print(txt_tresor_zettel)
        tresor_offen = True
```

### 3. Detaillierte Sprengungssequenz

Das Spielbuch enthält eine deutlich ausführlichere Sprengungssequenz:

| Spielbuch | Inhalt | Programm |
|---|---|---|
| `txt_301a` | Detaillierte Beschreibung der Panzerglaswand | vereinfacht |
| `txt_301b` | Exakte Masse des Treppenhauses (Zwischenboden, Treppe) | vereinfacht |
| `txt_301c` | Betonausfüllung, Analyse welche Wände sprengbar sind | vereinfacht |
| `txt_311`–`txt_313` | Falscher Raum → Wand wählen → Fehlschlag | 1 Fehlschlag-Text |
| `txt_321`–`txt_323` | Richtiger Raum, falsche Wand → Fehlschlag | 1 Fehlschlag-Text |
| `txt_331`–`txt_333` | Richtiger Raum, richtige Wand, Element 1/2 → Erfolg | 1 Erfolg-Text |

Das Programm fasst dies in einer einfacheren Entscheidungskette zusammen: Raum → Wand → Element → Erfolg oder Fehlschlag.

---

## Die zentrale Erkenntnis

| Spielbuch | Programm |
|---|---|
| Hat **kein Gedächtnis** | Hat **Variablen** |
| Braucht für jeden Pfad eine eigene Seite | Braucht pro Raum nur einen Codeblock |
| ~40 Textblöcke für 9 Räume | ~20 Textblöcke für 9 Räume |
| Duplikate sind **nötig** | Duplikate sind **überflüssig** |

Genau das ist der Grund, warum wir das Spielbuch als Programm umsetzen: **Variablen und Verzweigungen ersetzen Seitenverweise.** Was im Buch Dutzende von Seiten braucht, löst das Programm mit ein paar `if`-Abfragen und `True`/`False`-Werten.

---

*Dieses Dokument gehört zur Unterrichtsreihe «Vom Spielbuch zum Programm» (GYM1, Gymnasium Hofwil).*
