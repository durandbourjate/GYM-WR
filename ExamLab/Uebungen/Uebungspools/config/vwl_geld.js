// ══════════════════════════════════════════════════════════════
// Übungspool: Geld, Geldpolitik und Finanzmärkte
// Fach: VWL | Stufe: SF GYM3–GYM4
// Erstellt: Februar 2026
// Quelle: Iconomix – Geldmengen und Preise + Geld und Tausch
// Kombinierter Pool: 100 Fragen über 13 Themen
// ══════════════════════════════════════════════════════════════

window.POOL_META = {
  id: "vwl_geld",
  fach: "VWL",
  title: "Übungspool: Geld, Geldpolitik und Finanzmärkte",
  meta: "SF GYM3–GYM4 · Gymnasium Hofwil · Individuell üben",
  color: "vwl",
  lernziele: [
    "Ich kann die Funktionen und Eigenschaften von Geld erklären und verschiedene Geldarten unterscheiden. (K2)",
    "Ich kann die Geldmengenaggregate (M0–M3) und den Prozess der Geldschöpfung beschreiben. (K2)",
    "Ich kann die geldpolitischen Instrumente der Schweizerischen Nationalbank erklären und ihre Wirkung analysieren. (K4)",
    "Ich kann den Zusammenhang zwischen Geldmenge, Preisniveau und Kaufkraft erklären. (K2)"
  ]
};

window.TOPICS = {
  "tauschwirtschaft": {label:"Tauschwirtschaft vs. Geldwirtschaft", short:"Tauschwirtschaft", lernziele: ["Ich kann die Nachteile der Tauschwirtschaft erklären und begründen, warum Geld erfunden wurde. (K2)", "Ich kann die Vorteile der Geldwirtschaft gegenüber der Tauschwirtschaft aufzeigen. (K2)"]},
  "geldfunktionen":   {label:"Geldfunktionen", short:"Geldfunktionen", lernziele: ["Ich kann die drei Geldfunktionen (Tausch-, Wertaufbewahrungs-, Wertmassfunktion) nennen und erklären. (K1)", "Ich kann für konkrete Beispiele die jeweilige Geldfunktion identifizieren. (K3)"]},
  "eigenschaften":    {label:"Eigenschaften von Geld", short:"Eigenschaften", lernziele: ["Ich kann die Eigenschaften von gutem Geld (Teilbarkeit, Haltbarkeit, Knappheit, Akzeptanz) nennen. (K1)", "Ich kann beurteilen, ob ein Gut als Geld geeignet ist. (K5)"]},
  "geldarten":        {label:"Warengeld, Papiergeld & Buchgeld", short:"Geldarten", lernziele: ["Ich kann die Entwicklung von Warengeld zu Buchgeld beschreiben. (K2)", "Ich kann Warengeld, Papiergeld und Buchgeld unterscheiden und Beispiele zuordnen. (K1)"]},
  "vertrauen":        {label:"Vertrauen & Rolle der Nationalbank", short:"Vertrauen", lernziele: ["Ich kann erklären, warum Vertrauen die Grundlage des Geldsystems ist. (K2)", "Ich kann die Rolle der Nationalbank bei der Sicherung des Geldwertes erklären. (K2)"]},
  "preise":           {label:"Absolute & relative Preise", short:"Preise", lernziele: ["Ich kann zwischen absoluten und relativen Preisen unterscheiden. (K2)", "Ich kann relative Preise berechnen und ihre ökonomische Bedeutung erklären. (K3)"]},
  "grundlagen":       {label:"Grundlagen: Geld und Geldfunktionen", short:"Grundlagen", lernziele: ["Ich kann die Grundlagen des Geldes zusammenfassend erklären (Funktionen, Arten, Vertrauen). (K2)", "Ich kann die Bedeutung von Geld für eine moderne Volkswirtschaft erläutern. (K2)"]},
  "kaufkraft":        {label:"Geldmenge, Kaufkraft und Preisniveau", short:"Kaufkraft", lernziele: ["Ich kann den Zusammenhang zwischen Geldmenge und Preisniveau erklären (Quantitätstheorie). (K2)", "Ich kann die Kaufkraft des Geldes berechnen und Inflation/Deflation erklären. (K3)"]},
  "geldnachfrage":    {label:"Geldnachfrage", short:"Geldnachfrage", lernziele: ["Ich kann die Motive der Geldhaltung (Transaktions-, Vorsichts-, Spekulationsmotiv) erklären. (K2)", "Ich kann die Geldnachfragekurve interpretieren und Einflussfaktoren nennen. (K2)"]},
  "geldangebot":      {label:"Geldangebot und Geldschöpfung", short:"Geldangebot", lernziele: ["Ich kann den Prozess der Geldschöpfung durch Geschäftsbanken erklären. (K2)", "Ich kann die Rolle der Zentralbank bei der Steuerung des Geldangebots beschreiben. (K2)"]},
  "geldmengen":       {label:"Geldmengen und Geldaggregate (M0–M3)", short:"Geldmengen", lernziele: ["Ich kann die Geldmengenaggregate M0, M1, M2 und M3 definieren und voneinander abgrenzen. (K1)", "Ich kann erklären, warum verschiedene Geldmengenaggregate existieren und wofür sie verwendet werden. (K2)"]},
  "zinssteuerung":    {label:"Konventionelle Geldpolitik und Transmissionskanäle", short:"Zinssteuerung", lernziele: ["Ich kann das geldpolitische Konzept der SNB (Leitzins, SARON) erklären. (K2)", "Ich kann die Transmissionskanäle der Geldpolitik (Zinskanal, Wechselkurskanal) beschreiben. (K2)"]},
  "unkonventionell":  {label:"Unkonventionelle Geldpolitik seit der Finanzkrise", short:"Unkonventionell", lernziele: ["Ich kann unkonventionelle geldpolitische Instrumente (Negativzins, Mindestkurs, quantitative Lockerung) erklären. (K2)", "Ich kann beurteilen, warum die SNB zu unkonventionellen Massnahmen greifen musste und welche Risiken damit verbunden sind. (K5)"]}
};

window.QUESTIONS = [
  {
    "id": "t01",
    "topic": "tauschwirtschaft",
    "type": "mc",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Was versteht man unter einer Tauschwirtschaft?",
    "options": [
      {
        "v": "A",
        "t": "Ein Wirtschaftssystem, in dem alle Güter gratis verteilt werden."
      },
      {
        "v": "B",
        "t": "Ein Wirtschaftssystem, in dem nur mit Gold bezahlt wird."
      },
      {
        "v": "C",
        "t": "Ein Wirtschaftssystem, in dem Waren direkt gegen andere Waren getauscht werden."
      },
      {
        "v": "D",
        "t": "Ein Wirtschaftssystem, in dem der Staat den Preis aller Güter festlegt."
      }
    ],
    "correct": "C",
    "explain": "In einer Tauschwirtschaft gibt es kein allgemein akzeptiertes Zahlungsmittel. Güter und Dienstleistungen werden direkt gegeneinander getauscht (z.B. Schuhe gegen Brot). Dieses System wird auch als Naturaltausch oder Barterhandel bezeichnet."
  },
  {
    "id": "t02",
    "topic": "tauschwirtschaft",
    "type": "tf",
    "diff": 1,
    "tax": "K2",
    "reviewed":false,
    "q": "In einer reinen Tauschwirtschaft muss jeder Tauschpartner genau das Gut besitzen, das der andere haben möchte – man spricht von der «doppelten Koinzidenz der Bedürfnisse».",
    "correct": true,
    "explain": "Das ist korrekt. Die «doppelte Koinzidenz der Bedürfnisse» (double coincidence of wants) ist die zentrale Schwierigkeit einer Tauschwirtschaft: Beide Tauschpartner müssen gleichzeitig genau das anbieten, was der andere sucht. Dies macht den Tausch sehr aufwändig."
  },
  {
    "id": "t03",
    "topic": "tauschwirtschaft",
    "type": "multi",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Welche der folgenden Probleme treten in einer reinen Tauschwirtschaft auf? (Mehrere Antworten möglich.)",
    "options": [
      {
        "v": "A",
        "t": "Es ist schwierig, einen passenden Tauschpartner zu finden."
      },
      {
        "v": "B",
        "t": "Der Wertvergleich zwischen verschiedenen Gütern ist kompliziert."
      },
      {
        "v": "C",
        "t": "Güter wie Lebensmittel können nur begrenzt gelagert und somit schlecht als «Vermögen» aufbewahrt werden."
      },
      {
        "v": "D",
        "t": "Der Staat kann keine Steuern erheben."
      }
    ],
    "correct": [
      "A",
      "B",
      "C"
    ],
    "explain": "Alle drei Probleme sind typisch für Tauschwirtschaften: (A) Die doppelte Koinzidenz der Bedürfnisse macht die Partnersuche schwierig. (B) Ohne gemeinsame Recheneinheit ist der Wertvergleich mühsam (z.B. Wie viele Brote ist ein Haarschnitt wert?). (C) Viele Güter sind verderblich und eignen sich schlecht zur Wertaufbewahrung. D ist zwar eine Konsequenz, aber kein direktes Grundproblem der Tauschwirtschaft an sich."
  },
  {
    "id": "t04",
    "topic": "tauschwirtschaft",
    "type": "mc",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Im Spiel BOB (Barter or Buy) übernimmt der Buchstabe X eine besondere Funktion. Was passiert nachweislich, wenn X konsequent als Tauschmittel eingesetzt wird?",
    "options": [
      {
        "v": "A",
        "t": "Die Spielenden erzielen im Durchschnitt deutlich mehr Punkte (ca. 110 statt 80)."
      },
      {
        "v": "B",
        "t": "Die Punktzahl bleibt ungefähr gleich, aber das Spiel dauert kürzer."
      },
      {
        "v": "C",
        "t": "Nur die Spielenden, die X sammeln, erzielen mehr Punkte."
      },
      {
        "v": "D",
        "t": "Die Spielenden erzielen im Durchschnitt weniger Punkte, weil X wertvoll ist."
      }
    ],
    "correct": "A",
    "explain": "Systemtests zeigen: Wird X konsequent als Tauschmittel eingesetzt, erzielen Spielende durchschnittlich 110 Punkte gegenüber nur rund 80 Punkten ohne X. Der Grund: X erleichtert den Tausch erheblich, weil jede Person es akzeptiert. Man muss keinen direkten Tauschpartner mehr finden und kann über den Umweg X flexibler handeln."
  },
  {
    "id": "t05",
    "topic": "tauschwirtschaft",
    "type": "tf",
    "diff": 2,
    "tax": "K4",
    "reviewed":false,
    "q": "Im Spiel BOB findet eine Entwicklung von der Autarkie (Selbstversorgung) über eine Tauschwirtschaft hin zu einer Geldwirtschaft statt.",
    "correct": true,
    "explain": "Zu Beginn versuchen die Spielenden, allein mit den eigenen Buchstaben Wörter zu bilden (Autarkie). Dann beginnen sie, Buchstaben untereinander zu tauschen (Tauschwirtschaft). Schliesslich setzt sich X als allgemein akzeptiertes Tauschmittel durch (Geldwirtschaft). Diese Entwicklung spiegelt die historische Entstehung von Geld."
  },
  {
    "id": "t06",
    "topic": "tauschwirtschaft",
    "type": "mc",
    "diff": 3,
    "tax": "K4",
    "reviewed":false,
    "q": "Warum sind die Vorteile einer Geldwirtschaft in der realen Welt noch grösser als im Spiel BOB?",
    "options": [
      {
        "v": "A",
        "t": "Weil in der Realität weniger verschiedene Güter gehandelt werden als im Spiel."
      },
      {
        "v": "B",
        "t": "Weil Geld in der Realität immer seinen Wert behält."
      },
      {
        "v": "C",
        "t": "Weil in der Realität viel mehr Güter, Personen und Bedürfnisse existieren und die Wahrscheinlichkeit einer doppelten Koinzidenz daher noch geringer ist."
      },
      {
        "v": "D",
        "t": "Weil im Spiel bereits alle Güter vorhanden sind."
      }
    ],
    "correct": "C",
    "explain": "In der realen Welt gibt es Tausende verschiedener Güter, Millionen von Wirtschaftsteilnehmern und hochgradig spezialisierte Produktionsprozesse. Die Wahrscheinlichkeit, einen passenden Tauschpartner mit genau der gewünschten Ware zu finden, wäre verschwindend gering. Im Spiel ist die Vielfalt auf wenige Buchstaben und eine kleine Gruppe begrenzt. Geld ist also in der Realität noch viel wichtiger als im Spiel."
  },
  {
    "id": "t07",
    "topic": "tauschwirtschaft",
    "type": "fill",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "In einer Geldwirtschaft wird nicht Ware gegen Ware getauscht, sondern Ware gegen {0}. Dies erleichtert den Handel, weil man keinen Tauschpartner finden muss, der genau die angebotene Ware braucht – man spricht vom Wegfall der doppelten {1} der Bedürfnisse.",
    "blanks": [
      {
        "answer": "Geld",
        "alts": [
          "Zahlungsmittel"
        ]
      },
      {
        "answer": "Koinzidenz",
        "alts": [
          "Übereinstimmung"
        ]
      }
    ],
    "explain": "In einer Geldwirtschaft tauscht man Ware gegen ein allgemein akzeptiertes Zahlungsmittel (Geld). Dadurch entfällt das Problem der «doppelten Koinzidenz der Bedürfnisse»: Man muss nicht mehr jemanden finden, der genau das eigene Gut will und gleichzeitig das gewünschte Gut anbietet."
  },
  {
    "id": "t08",
    "topic": "tauschwirtschaft",
    "type": "mc",
    "diff": 3,
    "tax": "K5",
    "reviewed":false,
    "q": "Eine Kollegin behauptet: «Geld ist eigentlich überflüssig – man könnte auch einfach tauschen.» Welches Argument entkräftet diese Aussage am besten?",
    "options": [
      {
        "v": "A",
        "t": "Geld ermöglicht Arbeitsteilung und Spezialisierung, weil es den Tausch massiv vereinfacht – ohne Geld wäre die heutige Wirtschaft nicht funktionsfähig."
      },
      {
        "v": "B",
        "t": "Die Regierung hat beschlossen, dass Geld verwendet werden muss."
      },
      {
        "v": "C",
        "t": "Geld ist ein Statussymbol und deswegen unverzichtbar."
      },
      {
        "v": "D",
        "t": "Ohne Geld müsste man alle Waren selbst herstellen, was gesetzlich verboten ist."
      }
    ],
    "correct": "A",
    "explain": "Das stärkste Argument ist der Zusammenhang zwischen Geld und Spezialisierung. Geld ermöglicht es Menschen, sich auf eine Tätigkeit zu spezialisieren und ihren Lohn dann für beliebige Waren auszugeben. Ohne Geld wäre Arbeitsteilung kaum möglich, weil jeder Produzent erst passende Tauschpartner finden müsste. Die moderne, hochspezialisierte Wirtschaft wäre ohne Geld undenkbar."
  },
  {
    "id": "f01",
    "topic": "geldfunktionen",
    "type": "mc",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Welche drei Funktionen erfüllt Geld?",
    "img": {
      "src": "img/vwl/geld/geld_funktionen_01.svg",
      "alt": "Übersicht der drei Geldfunktionen"
    },
    "options": [
      {
        "v": "A",
        "t": "Konsummittel, Recheneinheit, Spekulationsmittel"
      },
      {
        "v": "B",
        "t": "Tauschmittel, Schuldenmittel, Produktionsmittel"
      },
      {
        "v": "C",
        "t": "Tauschmittel, Recheneinheit, Wertaufbewahrungsmittel"
      },
      {
        "v": "D",
        "t": "Zahlungsmittel, Sparmittel, Investitionsmittel"
      }
    ],
    "correct": "C",
    "explain": "Die drei klassischen Geldfunktionen sind: (1) Tauschmittel bzw. Zahlungsmittel – Geld erleichtert den Kauf und Verkauf von Gütern. (2) Recheneinheit – Geld dient als gemeinsamer Massstab, um Preise zu vergleichen. (3) Wertaufbewahrungsmittel – Geld ermöglicht es, Kaufkraft über die Zeit zu speichern."
  },
  {
    "id": "f02",
    "topic": "geldfunktionen",
    "type": "fill",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "In modernen Volkswirtschaften wird in der Regel nicht Ware gegen Ware getauscht, sondern Ware gegen Geld. Somit spielt Geld eine zentrale Rolle als {0}. Eng mit dieser Rolle verknüpft ist die Funktion als {1}, weil man vor jedem Kauf den Wert der Gegenleistung einschätzen will. Wenn man Geld zur Seite legt, um es später auszugeben, dient es als {2}.",
    "blanks": [
      {
        "answer": "Zahlungsmittel",
        "alts": [
          "Tauschmittel"
        ]
      },
      {
        "answer": "Recheneinheit",
        "alts": [
          "Wertmassstab",
          "Wertmesser"
        ]
      },
      {
        "answer": "Wertaufbewahrungsmittel",
        "alts": [
          "Wertaufbewahrung",
          "Sparmittel"
        ]
      }
    ],
    "explain": "Die drei Geldfunktionen: (1) Zahlungsmittel/Tauschmittel – ermöglicht Kauf und Verkauf. (2) Recheneinheit – alle Preise werden in einer Einheit (z.B. CHF) ausgedrückt, was Vergleiche ermöglicht. (3) Wertaufbewahrungsmittel – Geld kann gespart und später eingesetzt werden."
  },
  {
    "id": "f03",
    "topic": "geldfunktionen",
    "type": "mc",
    "diff": 2,
    "tax": "K3",
    "reviewed":false,
    "q": "Max verkauft seine gebrauchte Spielkonsole für CHF 200 und legt das Geld auf sein Sparkonto, um sich in einigen Monaten ein neues Fahrrad zu kaufen. Welche Geldfunktionen werden in diesem Beispiel genutzt?",
    "options": [
      {
        "v": "A",
        "t": "Nur Tauschmittel"
      },
      {
        "v": "B",
        "t": "Tauschmittel und Recheneinheit"
      },
      {
        "v": "C",
        "t": "Alle drei Geldfunktionen"
      },
      {
        "v": "D",
        "t": "Tauschmittel und Wertaufbewahrungsmittel"
      }
    ],
    "correct": "C",
    "explain": "Alle drei Funktionen sind beteiligt: (1) Tauschmittel – Max erhält Geld für die Konsole. (2) Recheneinheit – der Preis von CHF 200 drückt den Wert der Konsole in einer vergleichbaren Einheit aus. (3) Wertaufbewahrungsmittel – Max legt das Geld auf sein Sparkonto, um es später für das Fahrrad einzusetzen."
  },
  {
    "id": "f04",
    "topic": "geldfunktionen",
    "type": "multi",
    "diff": 2,
    "tax": "K3",
    "reviewed":false,
    "q": "In welchen der folgenden Situationen wird die Funktion des Geldes als Recheneinheit besonders deutlich? (Mehrere Antworten möglich.)",
    "options": [
      {
        "v": "A",
        "t": "Man vergleicht die Preise von drei verschiedenen Smartphones in einem Onlineshop."
      },
      {
        "v": "B",
        "t": "Man bewahrt CHF 500 unter dem Kopfkissen auf."
      },
      {
        "v": "C",
        "t": "Das BIP der Schweiz wird in Schweizer Franken angegeben."
      },
      {
        "v": "D",
        "t": "Man bezahlt die Rechnung im Restaurant mit Bargeld."
      }
    ],
    "correct": [
      "A",
      "C"
    ],
    "explain": "Die Recheneinheit-Funktion zeigt sich dort, wo Geld als gemeinsamer Massstab dient: (A) Beim Preisvergleich verschiedener Produkte – alle Preise sind in CHF ausgedrückt und somit direkt vergleichbar. (C) Das BIP wird in einer Geldeinheit gemessen, um die Wirtschaftsleistung quantifizierbar zu machen. (B) ist Wertaufbewahrung, (D) ist Tauschmittel."
  },
  {
    "id": "f05",
    "topic": "geldfunktionen",
    "type": "tf",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Im Spiel BOB übernimmt X neben der Funktion als Tauschmittel auch die Funktion als Wertaufbewahrungsmittel, da X im Gegensatz zu anderen Buchstaben zwischen den Runden behalten werden darf.",
    "correct": true,
    "explain": "X bleibt zwischen den Runden erhalten, während alle anderen nicht eingesetzten Buchstaben zurückgegeben werden müssen. Damit kann X über mehrere Runden hinweg «gespart» werden – es dient also als Wertaufbewahrungsmittel. X funktioniert auch als Tauschmittel und gewissermassen als Recheneinheit (1 X = 1 Siegpunkt)."
  },
  {
    "id": "f06",
    "topic": "geldfunktionen",
    "type": "mc",
    "diff": 3,
    "tax": "K4",
    "reviewed":false,
    "q": "Welche Geldfunktion wird durch eine hohe Inflation am stärksten beeinträchtigt?",
    "options": [
      {
        "v": "A",
        "t": "Wertaufbewahrungsmittel – weil das Geld kontinuierlich an Kaufkraft verliert."
      },
      {
        "v": "B",
        "t": "Recheneinheit – weil alle Preise gleich stark steigen."
      },
      {
        "v": "C",
        "t": "Tauschmittel – weil niemand mehr Geld annimmt."
      },
      {
        "v": "D",
        "t": "Keine – Inflation hat keinen Einfluss auf die Geldfunktionen."
      }
    ],
    "correct": "A",
    "explain": "Bei hoher Inflation verliert Geld laufend an Kaufkraft. Wer heute CHF 100 spart, kann sich in einem Jahr möglicherweise deutlich weniger dafür kaufen. Damit wird die Funktion als Wertaufbewahrungsmittel direkt untergraben. Auch die Recheneinheit-Funktion leidet, weil sich Preise ständig ändern und Vergleiche schwieriger werden. Die Tauschmittel-Funktion ist erst bei extremer Hyperinflation gefährdet."
  },
  {
    "id": "f07",
    "topic": "geldfunktionen",
    "type": "mc",
    "diff": 3,
    "tax": "K5",
    "reviewed":false,
    "q": "Stellen Sie sich vor, in einem Land verlören Banknoten nach einer Woche ihren Wert und würden wertlos. Welche Auswirkung hätte dies voraussichtlich auf das Wirtschaftsverhalten der Bevölkerung?",
    "options": [
      {
        "v": "A",
        "t": "Die Menschen würden mehr sparen, um den Verlust auszugleichen."
      },
      {
        "v": "B",
        "t": "Es hätte keine Auswirkungen, da der Staat neues Geld drucken könnte."
      },
      {
        "v": "C",
        "t": "Die Menschen würden möglichst schnell Waren kaufen und Geld nicht mehr halten wollen."
      },
      {
        "v": "D",
        "t": "Die Menschen würden nur noch mit Kreditkarten bezahlen."
      }
    ],
    "correct": "C",
    "explain": "Wenn Geld schnell an Wert verliert, würden die Menschen es sofort ausgeben – denn Warten bedeutet Kaufkraftverlust. Dies entspricht dem Phänomen der «Flucht in Sachwerte» bei Hyperinflation. Niemand würde sparen wollen. Der Konsum würde kurzfristig ansteigen, aber die langfristige Planung und Investition würde massiv erschwert."
  },
  {
    "id": "f08",
    "topic": "geldfunktionen",
    "type": "tf",
    "diff": 1,
    "tax": "K2",
    "reviewed":false,
    "q": "Die Recheneinheit-Funktion des Geldes ermöglicht es, den Wert unterschiedlicher Güter in einer gemeinsamen Einheit (z.B. Schweizer Franken) auszudrücken und somit Preise einfach zu vergleichen.",
    "correct": true,
    "explain": "Genau das ist die Recheneinheit-Funktion: Geld dient als gemeinsamer Massstab. Statt unzählige Tauschverhältnisse zu kennen (wie viele Brote ist ein Haarschnitt wert? wie viele Haarschnitte ein Kinoticket?), genügt es, den Preis jedes Gutes in einer Einheit auszudrücken."
  },
  {
    "id": "e01",
    "topic": "eigenschaften",
    "type": "multi",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Welche Eigenschaften sollte ein Gegenstand aufweisen, damit er als Geld geeignet ist? (Mehrere Antworten möglich.)",
    "options": [
      {
        "v": "A",
        "t": "Haltbarkeit"
      },
      {
        "v": "B",
        "t": "Hohes Gewicht"
      },
      {
        "v": "C",
        "t": "Knappheit"
      },
      {
        "v": "D",
        "t": "Teilbarkeit"
      }
    ],
    "correct": [
      "A",
      "C",
      "D"
    ],
    "explain": "Geld muss haltbar sein (nicht verderben), knapp (nicht unbegrenzt verfügbar, sonst verliert es seinen Wert), und teilbar (um verschiedene Beträge darstellen zu können). Hohes Gewicht ist keine wünschenswerte Eigenschaft – im Gegenteil: Geld sollte leicht transportierbar sein."
  },
  {
    "id": "e02",
    "topic": "eigenschaften",
    "type": "mc",
    "diff": 1,
    "tax": "K2",
    "reviewed":false,
    "q": "Warum eignen sich Wassermelonen schlecht als Geld?",
    "options": [
      {
        "v": "A",
        "t": "Weil sie verderblich, schwer und schlecht teilbar sind."
      },
      {
        "v": "B",
        "t": "Weil sie nicht knapp genug sind."
      },
      {
        "v": "C",
        "t": "Weil sie zu wertvoll sind."
      },
      {
        "v": "D",
        "t": "Weil sie nicht von allen akzeptiert werden."
      }
    ],
    "correct": "A",
    "explain": "Wassermelonen erfüllen mehrere Geldeigenschaften nicht: Sie sind nicht haltbar (verderben), nicht gut transportierbar (schwer), und schwer gleichmässig teilbar. Geld muss dagegen haltbar, leicht, teilbar und einheitlich sein – deshalb eignen sich z.B. Münzen oder Banknoten viel besser."
  },
  {
    "id": "e03",
    "topic": "eigenschaften",
    "type": "tf",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Im Spiel BOB eignet sich X besonders gut als Tauschmittel, weil es in keinem Wort des vorgegebenen Satzes vorkommt und deshalb von allen als «neutrale Tauschware» akzeptiert wird.",
    "correct": true,
    "explain": "X kommt in keinem der zu bildenden Wörter vor. Deshalb ist X für niemanden direkt nützlich zum Wortbilden, aber als Tauschmittel akzeptieren es alle. Zudem ist X haltbar (wird nicht eingesammelt), relativ knapp und einheitlich – es erfüllt also viele Geldeigenschaften."
  },
  {
    "id": "e04",
    "topic": "eigenschaften",
    "type": "multi",
    "diff": 2,
    "tax": "K3",
    "reviewed":false,
    "q": "Welche Eigenschaften von Geld sind bei Zigaretten als Zahlungsmittel in Gefangenenlagern des Zweiten Weltkriegs erfüllt? (Mehrere Antworten möglich.)",
    "options": [
      {
        "v": "A",
        "t": "Knappheit – Zigaretten waren begrenzt verfügbar."
      },
      {
        "v": "B",
        "t": "Haltbarkeit – Zigaretten verderben nicht schnell."
      },
      {
        "v": "C",
        "t": "Teilbarkeit – man kann einzelne Zigaretten oder Packungen handeln."
      },
      {
        "v": "D",
        "t": "Einheitlichkeit – Zigaretten derselben Marke sind gleichwertig."
      }
    ],
    "correct": [
      "A",
      "B",
      "C",
      "D"
    ],
    "explain": "Zigaretten erfüllen tatsächlich alle genannten Geldeigenschaften: Sie sind knapp (begrenzte Lieferungen ins Lager), relativ haltbar, gut teilbar (einzelne Zigaretten oder Packungen) und einheitlich (gleiche Marke = gleicher Wert). Deshalb setzten sie sich als Zahlungsmittel durch."
  },
  {
    "id": "e05",
    "topic": "eigenschaften",
    "type": "mc",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Warum ist «Knappheit» eine wichtige Eigenschaft von Geld?",
    "options": [
      {
        "v": "A",
        "t": "Weil knappes Geld leichter zu fälschen ist."
      },
      {
        "v": "B",
        "t": "Weil es sonst zu viele Münzen gäbe und die Taschen zu schwer würden."
      },
      {
        "v": "C",
        "t": "Weil knappes Geld schöner aussieht."
      },
      {
        "v": "D",
        "t": "Weil Geld, das unbeschränkt verfügbar ist, seinen Wert verliert – niemand würde wertvolle Güter dagegen tauschen."
      }
    ],
    "correct": "D",
    "explain": "Knappheit ist eine Grundvoraussetzung für Wert. Wäre Geld unbeschränkt verfügbar (wie Sand in der Wüste), hätte es keinen Tauschwert – niemand würde wertvolle Güter gegen etwas tauschen, das jeder in beliebiger Menge besitzt. Deshalb muss Geld knapp sein, aber auch nicht zu knapp, damit genügend Zahlungsmittel für den Wirtschaftsverkehr vorhanden sind."
  },
  {
    "id": "e06",
    "topic": "eigenschaften",
    "type": "mc",
    "diff": 3,
    "tax": "K5",
    "reviewed":false,
    "q": "Was ist für die Funktion von Geld wichtiger: Dass pro Geldeinheit möglichst viele Waren erhältlich sind, oder dass das Geld von allen als Zahlungsmittel akzeptiert wird?",
    "options": [
      {
        "v": "A",
        "t": "Der Warenwert pro Geldeinheit – denn nur wertvolles Geld wird benutzt."
      },
      {
        "v": "B",
        "t": "Die allgemeine Akzeptanz – denn ohne Akzeptanz ist Geld nutzlos, egal wie hoch sein Nennwert ist."
      },
      {
        "v": "C",
        "t": "Beides ist gleich wichtig und voneinander unabhängig."
      },
      {
        "v": "D",
        "t": "Weder noch – entscheidend ist nur die Anzahl der im Umlauf befindlichen Geldeinheiten."
      }
    ],
    "correct": "B",
    "explain": "Die allgemeine Akzeptanz ist die fundamentalste Eigenschaft von Geld. Wenn niemand ein Zahlungsmittel akzeptiert, ist es wertlos – egal wie viel darauf steht. Erst wenn alle es akzeptieren, kann es seine Tauschmittelfunktion erfüllen. Der Warenwert pro Geldeinheit ist ein Ergebnis von Angebot und Nachfrage und kann sich verändern, ohne dass Geld seine Funktion verliert."
  },
  {
    "id": "e07",
    "topic": "eigenschaften",
    "type": "tf",
    "diff": 3,
    "tax": "K4",
    "reviewed":false,
    "q": "Geld muss zwingend einen eigenen materiellen Wert haben (z.B. aus Gold oder Silber bestehen), um als Zahlungsmittel funktionieren zu können.",
    "correct": false,
    "explain": "Falsch. Modernes Papiergeld (und erst recht Buchgeld) hat praktisch keinen materiellen Eigenwert – die Produktion einer 100-Franken-Note kostet nur rund 40 Rappen. Entscheidend ist nicht der Materialwert, sondern das Vertrauen der Bevölkerung und die allgemeine Akzeptanz. Solange alle das Geld annehmen, funktioniert es – auch ohne eigenen Materialwert."
  },
  {
    "id": "e08",
    "topic": "eigenschaften",
    "type": "fill",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Damit ein Gegenstand als Geld funktioniert, muss er unter anderem {0} (nicht verderblich), {1} (begrenzt verfügbar) und {2} (leicht zu transportieren) sein.",
    "blanks": [
      {
        "answer": "haltbar",
        "alts": [
          "dauerhaft"
        ]
      },
      {
        "answer": "knapp",
        "alts": [
          "begrenzt"
        ]
      },
      {
        "answer": "transportierbar",
        "alts": [
          "transportfähig",
          "leicht"
        ]
      }
    ],
    "explain": "Die wichtigsten Eigenschaften von Geld umfassen Haltbarkeit (nicht verderblich), Knappheit (begrenzte Verfügbarkeit), Transportierbarkeit (leichtes Gewicht, handliches Format), sowie Teilbarkeit, Einheitlichkeit und Wertstabilität."
  },
  {
    "id": "ga01",
    "topic": "geldarten",
    "type": "mc",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Wie nennt man Geld, das selbst einen konkreten Wert als Ware aufweist (z.B. Goldmünzen, Muscheln, Tierfelle)?",
    "options": [
      {
        "v": "A",
        "t": "Buchgeld"
      },
      {
        "v": "B",
        "t": "Warengeld"
      },
      {
        "v": "C",
        "t": "Kryptogeld"
      },
      {
        "v": "D",
        "t": "Papiergeld"
      }
    ],
    "correct": "B",
    "explain": "Warengeld hat neben seiner Geldfunktion auch einen Eigenwert als Ware. Historische Beispiele sind Goldmünzen, Silber, Muscheln, Salz oder Tierfelle. Der Vorteil: Der Gegenstand hat auch dann einen Wert, wenn er nicht mehr als Zahlungsmittel akzeptiert wird."
  },
  {
    "id": "ga02",
    "topic": "geldarten",
    "type": "fill",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Die drei historischen Entwicklungsstufen des Geldes sind: Zunächst {0} (z.B. Goldmünzen), dann {1} (z.B. Banknoten) und schliesslich {2} (z.B. Bankguthaben).",
    "img": {
      "src": "img/vwl/geld/geld_geldarten_01.svg",
      "alt": "Zeitstrahl der Entwicklung der Geldarten"
    },
    "blanks": [
      {
        "answer": "Warengeld",
        "alts": [
          "Münzgeld"
        ]
      },
      {
        "answer": "Papiergeld",
        "alts": [
          "Banknoten"
        ]
      },
      {
        "answer": "Buchgeld",
        "alts": [
          "Giralgeld"
        ]
      }
    ],
    "explain": "Die historische Entwicklung: (1) Warengeld – Gegenstände mit Eigenwert (Muscheln, Edelmetalle). (2) Papiergeld – Banknoten, die selbst kaum materiellen Wert haben, aber staatlich garantiert sind. (3) Buchgeld – elektronische Kontoguthaben, die nur als Buchungseinträge existieren."
  },
  {
    "id": "ga03",
    "topic": "geldarten",
    "type": "multi",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Welche der folgenden Aussagen über Buchgeld sind korrekt? (Mehrere Antworten möglich.)",
    "options": [
      {
        "v": "A",
        "t": "Buchgeld existiert nur als Buchungseintrag auf Konten."
      },
      {
        "v": "B",
        "t": "Buchgeld kann man physisch in den Händen halten."
      },
      {
        "v": "C",
        "t": "Buchgeld ist die abstrakteste Form des Geldes."
      },
      {
        "v": "D",
        "t": "Buchgeld wird heute für den Grossteil aller Zahlungen verwendet."
      }
    ],
    "correct": [
      "A",
      "C",
      "D"
    ],
    "explain": "Buchgeld (auch Giralgeld genannt) besteht lediglich aus elektronischen Buchungseinträgen auf Bank- oder Postkonten. Man kann es nicht physisch halten (B ist falsch). Es ist die abstrakteste Geldform und macht heute den weitaus grössten Teil aller Zahlungen und der gesamten Geldmenge aus."
  },
  {
    "id": "ga04",
    "topic": "geldarten",
    "type": "mc",
    "diff": 2,
    "tax": "K3",
    "reviewed":false,
    "q": "Im Spiel BOB hat X einen eigenen Wert (1 Siegpunkt). Welcher Geldart entspricht X im Spiel am ehesten?",
    "options": [
      {
        "v": "A",
        "t": "Warengeld – denn X hat neben seiner Tauschmittelfunktion auch einen eigenen Wert (Siegpunkte)."
      },
      {
        "v": "B",
        "t": "Buchgeld – denn X ist nur eine Zahl auf dem Punkteblatt."
      },
      {
        "v": "C",
        "t": "Papiergeld – denn X ist aus Papier."
      },
      {
        "v": "D",
        "t": "Kryptowährung – denn X ist digital."
      }
    ],
    "correct": "A",
    "explain": "X ist Warengeld, weil es einen eigenen Wert besitzt (jedes X gibt 1 Siegpunkt). Es hat also neben der Tauschmittelfunktion auch einen konkreten Eigenwert als «Ware». Wäre X nur ein wertloses Plättchen, das allein zum Tauschen dient, wäre es Papiergeld. Würde X als reiner Kontostand geführt, wäre es Buchgeld."
  },
  {
    "id": "ga05",
    "topic": "geldarten",
    "type": "tf",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Die Produktion einer Schweizer 100-Franken-Banknote kostet rund 40 Rappen. Banknoten sind deshalb ein Beispiel für Warengeld.",
    "correct": false,
    "explain": "Falsch. Gerade weil der Materialwert (ca. 40 Rappen) weit unter dem Nennwert (100 Franken) liegt, handelt es sich um Papiergeld – nicht um Warengeld. Warengeld hätte einen materiellen Eigenwert, der dem Nennwert entspricht (z.B. eine Goldmünze). Beim Papiergeld beruht der Wert auf dem Vertrauen in die herausgebende Institution."
  },
  {
    "id": "ga06",
    "topic": "geldarten",
    "type": "mc",
    "diff": 3,
    "tax": "K4",
    "reviewed":false,
    "q": "Unter welchen Voraussetzungen würde X im Spiel BOB eher Papiergeld entsprechen?",
    "options": [
      {
        "v": "A",
        "t": "Wenn X keinen eigenen Punktewert hätte, aber trotzdem von allen als Tauschmittel akzeptiert würde."
      },
      {
        "v": "B",
        "t": "Wenn es mehr X im Spiel gäbe."
      },
      {
        "v": "C",
        "t": "Wenn X aus echtem Papier statt aus Karton hergestellt würde."
      },
      {
        "v": "D",
        "t": "Wenn X nur von der Spielleitung ausgegeben würde."
      }
    ],
    "correct": "A",
    "explain": "Papiergeld hat keinen nennenswerten Eigenwert – sein Wert beruht rein auf Vertrauen und Akzeptanz. Wenn X keine Siegpunkte wert wäre (keinen Eigenwert hätte), aber trotzdem allgemein als Tauschmittel akzeptiert würde, hätte es dieselbe Eigenschaft wie Papiergeld: Wert durch Vertrauen statt durch materiellen Gehalt."
  },
  {
    "id": "ga07",
    "topic": "geldarten",
    "type": "tf",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Als Erfinder des Papiergeldes gelten die Chinesen. Erste Formen von Papiergeld kamen in China im 7. Jahrhundert auf.",
    "correct": true,
    "explain": "Korrekt. Erste Formen von Papiergeld entstanden tatsächlich im China des 7. Jahrhunderts, setzten sich allerdings damals noch nicht dauerhaft durch. In Europa wurden die ersten regulären Banknoten erst im 17. Jahrhundert eingeführt."
  },
  {
    "id": "ga08",
    "topic": "geldarten",
    "type": "mc",
    "diff": 3,
    "tax": "K5",
    "reviewed":false,
    "q": "In der herkömmlichen Sichtweise entstand Geld, weil eine spezielle Ware zum allgemeinen Tauschmittel erhoben wurde. Eine alternative Sichtweise sieht Geld primär als etwas anderes. Welche Funktion steht in der alternativen Sichtweise im Vordergrund?",
    "options": [
      {
        "v": "A",
        "t": "Geld dient primär als Anreiz für Arbeit."
      },
      {
        "v": "B",
        "t": "Geld dient primär als Statussymbol."
      },
      {
        "v": "C",
        "t": "Geld dient primär zur Dokumentation von Schuldverhältnissen in einer Gesellschaft."
      },
      {
        "v": "D",
        "t": "Geld dient primär als Mittel zur staatlichen Kontrolle."
      }
    ],
    "correct": "C",
    "explain": "Die alternative Sichtweise (u.a. von David Graeber vertreten) sieht Geld nicht primär als Tauschmittel, sondern als System zur Dokumentation von Schulden. Wenn jemand eine Ware erhält, ohne sofort eine Gegenleistung zu erbringen, entsteht eine Schuld. Geld dient als «Erinnerung» an diese Schuld. Historisch gibt es keine Belege für Gesellschaften mit reinem Tauschhandel (z.B. eine Kuh gegen drei Schafe)."
  },
  {
    "id": "v01",
    "topic": "vertrauen",
    "type": "mc",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Welche Institution hat in der Schweiz das alleinige Recht, Banknoten herauszugeben?",
    "options": [
      {
        "v": "A",
        "t": "Die Schweizerische Nationalbank (SNB)"
      },
      {
        "v": "B",
        "t": "Die Geschäftsbanken (UBS, Raiffeisen etc.)"
      },
      {
        "v": "C",
        "t": "Die Swissmint"
      },
      {
        "v": "D",
        "t": "Der Bundesrat"
      }
    ],
    "correct": "A",
    "explain": "In der Schweiz hat die Schweizerische Nationalbank (SNB) das Monopol auf die Herausgabe von Banknoten. Münzen werden hingegen von der Swissmint (einer Einheit der Bundesverwaltung) geprägt. Geschäftsbanken dürfen keine eigenen Banknoten drucken."
  },
  {
    "id": "v02",
    "topic": "vertrauen",
    "type": "multi",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Wie sorgt die Nationalbank für Vertrauen in das Geld? (Mehrere Antworten möglich.)",
    "options": [
      {
        "v": "A",
        "t": "Sie hält die Inflation möglichst tief, indem sie die Geldmenge steuert."
      },
      {
        "v": "B",
        "t": "Sie versieht die Banknoten mit Sicherheitsmerkmalen gegen Fälschungen."
      },
      {
        "v": "C",
        "t": "Sie garantiert, dass man Banknoten jederzeit in Gold umtauschen kann."
      },
      {
        "v": "D",
        "t": "Sie sorgt dafür, dass nicht zu viel Geld im Umlauf ist."
      }
    ],
    "correct": [
      "A",
      "B",
      "D"
    ],
    "explain": "Die Nationalbank sichert das Vertrauen auf zwei Wegen: (1) Preisstabilität – sie hält die Inflation tief, indem sie die Geldmenge kontrolliert (A und D). (2) Fälschungssicherheit – Sicherheitsmerkmale wie Wasserzeichen oder Glitzerzahlen erschweren das Fälschen (B). C ist falsch: Seit der Aufhebung des Goldstandards (1971 weltweit, 2000 in der Schweiz) besteht keine Goldeinlösepflicht mehr."
  },
  {
    "id": "v03",
    "topic": "vertrauen",
    "type": "tf",
    "diff": 1,
    "tax": "K2",
    "reviewed":false,
    "q": "Das Geldmonopol liegt in der Schweiz beim Staat beziehungsweise bei der Schweizerischen Nationalbank.",
    "correct": true,
    "explain": "Korrekt. In modernen Volkswirtschaften ist die Herausgabe von Geld ein staatliches Monopol. In der Schweiz darf nur die SNB Banknoten herausgeben. Dies ist wichtig, damit die Geldmenge kontrolliert werden kann und Vertrauen in die Währung besteht."
  },
  {
    "id": "v04",
    "topic": "vertrauen",
    "type": "mc",
    "diff": 2,
    "tax": "K4",
    "reviewed":false,
    "q": "Was würde passieren, wenn es viele gut gemachte Fälschungen von Banknoten gäbe?",
    "options": [
      {
        "v": "A",
        "t": "Die Nationalbank würde einfach mehr Geld drucken, um die Fälschungen auszugleichen."
      },
      {
        "v": "B",
        "t": "Die Akzeptanz von Banknoten würde sinken, da Geschäfte aufwändig prüfen müssten und das Vertrauen in Bargeld schwinden würde."
      },
      {
        "v": "C",
        "t": "Die Preise würden sinken, weil mehr Geld im Umlauf wäre."
      },
      {
        "v": "D",
        "t": "Gar nichts – die Wirtschaft funktioniert auch mit gefälschtem Geld."
      }
    ],
    "correct": "B",
    "explain": "Viele Fälschungen würden das Vertrauen in Bargeld untergraben. Geschäfte würden Banknoten nur noch widerwillig und nach mühsamer Prüfung annehmen. Die Tauschmittelfunktion wäre beeinträchtigt. Deshalb investiert die Nationalbank stark in Sicherheitsmerkmale, die das Fälschen erschweren."
  },
  {
    "id": "v05",
    "topic": "vertrauen",
    "type": "mc",
    "diff": 3,
    "tax": "K5",
    "reviewed":false,
    "q": "Stellen Sie sich einen Staat vor, der seiner Bevölkerung unbegrenzt Banknoten druckt und auf der Strasse verteilt. Wäre dies «das Paradies auf Erden»?",
    "options": [
      {
        "v": "A",
        "t": "Nein, denn die Gütermenge bleibt gleich; durch die massive Geldvermehrung würden die Preise explodieren (Hyperinflation) und das Geld wäre wertlos."
      },
      {
        "v": "B",
        "t": "Nein, denn die Bank würde die Zinsen erhöhen."
      },
      {
        "v": "C",
        "t": "Ja, denn alle hätten genug Geld, um sich alles zu kaufen."
      },
      {
        "v": "D",
        "t": "Ja, denn mehr Geld führt automatisch zu mehr Produktion."
      }
    ],
    "correct": "A",
    "explain": "Mehr Geld bei gleichbleibender Gütermenge führt zu steigenden Preisen (Inflation). Würde unbegrenzt Geld gedruckt, käme es zur Hyperinflation – das Geld verlöre seinen Wert. Historische Beispiele: Deutschland 1923, Simbabwe 2008, Venezuela 2018. Der Wohlstand einer Gesellschaft hängt von der realen Güterproduktion ab, nicht von der Geldmenge."
  },
  {
    "id": "v06",
    "topic": "vertrauen",
    "type": "tf",
    "diff": 3,
    "tax": "K4",
    "reviewed":false,
    "q": "Die Tatsache, dass Papiergeld keinen materiellen Eigenwert hat, macht Vertrauen zu einer noch wichtigeren Voraussetzung als bei Warengeld.",
    "correct": true,
    "explain": "Korrekt. Bei Warengeld (z.B. Goldmünzen) hat das Zahlungsmittel auch ohne seine Geldfunktion einen Materialwert. Bei Papiergeld dagegen ist der Materialwert praktisch null – eine 100-Franken-Note kostet ca. 40 Rappen in der Herstellung. Deshalb ist das Vertrauen in die herausgebende Institution und die Stabilität des Geldes hier besonders entscheidend."
  },
  {
    "id": "v07",
    "topic": "vertrauen",
    "type": "fill",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Wenn eine hohe {0} herrscht, das heisst, wenn man für gleich viel Geld mit der Zeit immer weniger Waren erhält, wird die Verwendung von Geld unattraktiv. Die Nationalbank muss deshalb dafür sorgen, dass nicht zu viel Geld im {1} ist.",
    "blanks": [
      {
        "answer": "Inflation",
        "alts": [
          "Teuerung"
        ]
      },
      {
        "answer": "Umlauf",
        "alts": [
          "Wirtschaftskreislauf"
        ]
      }
    ],
    "explain": "Bei hoher Inflation verliert Geld an Kaufkraft. Die Nationalbank steuert dies, indem sie die Geldmenge kontrolliert – nicht zu viel (sonst Inflation) und nicht zu wenig (sonst Deflation). Ihr Ziel ist Preisstabilität."
  },
  {
    "id": "v08",
    "topic": "vertrauen",
    "type": "mc",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Welches der folgenden Sicherheitsmerkmale findet sich auf Schweizer Banknoten?",
    "options": [
      {
        "v": "A",
        "t": "Ein QR-Code mit dem Kontostand des Besitzers"
      },
      {
        "v": "B",
        "t": "Ein eingebauter Mikrochip"
      },
      {
        "v": "C",
        "t": "Wasserzeichen, Glitzerzahlen und spezielle Drucktechniken"
      },
      {
        "v": "D",
        "t": "Ein Ablaufdatum wie bei Lebensmitteln"
      }
    ],
    "correct": "C",
    "explain": "Schweizer Banknoten verfügen über zahlreiche Sicherheitsmerkmale wie Wasserzeichen, Glitzerzahlen (irisierende Elemente), spezielle Drucktechniken und weitere schwer fälschbare Eigenschaften. Diese befinden sich mehrheitlich auf der Porträtseite der Note. Mikrochips, QR-Codes mit Kontostand oder Ablaufdaten gibt es nicht."
  },
  {
    "id": "p01",
    "topic": "preise",
    "type": "mc",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Was versteht man unter einem «absoluten Preis»?",
    "options": [
      {
        "v": "A",
        "t": "Den Preis eines Gutes, ausgedrückt in einer Geldeinheit (z.B. in Franken)."
      },
      {
        "v": "B",
        "t": "Den Preis eines Gutes im Vergleich zu einem anderen Gut."
      },
      {
        "v": "C",
        "t": "Den höchsten Preis, den jemand jemals für ein Gut bezahlt hat."
      },
      {
        "v": "D",
        "t": "Den Preis, der vom Staat festgelegt wurde."
      }
    ],
    "correct": "A",
    "explain": "Ein absoluter Preis ist der Preis eines Gutes, ausgedrückt in einer Geldeinheit (Recheneinheit). Zum Beispiel: Ein Brot kostet 5 Franken. Dies unterscheidet sich vom relativen Preis, der das Tauschverhältnis zwischen zwei Gütern ausdrückt."
  },
  {
    "id": "p02",
    "topic": "preise",
    "type": "mc",
    "diff": 1,
    "tax": "K2",
    "reviewed":false,
    "q": "Was ist ein «relativer Preis»?",
    "options": [
      {
        "v": "A",
        "t": "Der Preis nach Abzug der Inflation."
      },
      {
        "v": "B",
        "t": "Das Tauschverhältnis zwischen zwei Gütern – z.B. 1 Hemd = 2 Bücher."
      },
      {
        "v": "C",
        "t": "Ein besonders günstiger Preis für Verwandte."
      },
      {
        "v": "D",
        "t": "Der Durchschnittspreis aller Güter in einer Volkswirtschaft."
      }
    ],
    "correct": "B",
    "explain": "Der relative Preis drückt aus, wie viel von einem Gut man für ein anderes Gut erhalten kann. Beispiel: Kostet ein Hemd CHF 40 und ein Buch CHF 20, beträgt der relative Preis 1 Hemd = 2 Bücher. Relative Preise zeigen den Wert eines Gutes im Vergleich zu anderen Gütern."
  },
  {
    "id": "p03",
    "topic": "preise",
    "type": "calc",
    "diff": 2,
    "tax": "K3",
    "reviewed":false,
    "q": "In einer Ortschaft werden alle Preise in Kilo Salz ausgedrückt: 1 Apfel = 1 Kilo Salz, 1 Kuchen = 20 Kilo Salz, 1 Banane = 2 Kilo Salz, 1 Brot = 10 Kilo Salz. Wie viele Äpfel ist ein Kuchen wert?",
    "rows": [
      {
        "label": "1 Kuchen = … Äpfel",
        "answer": 20,
        "tolerance": 0,
        "unit": "Äpfel"
      }
    ],
    "explain": "1 Kuchen = 20 Kilo Salz und 1 Apfel = 1 Kilo Salz. Somit ist 1 Kuchen = 20 Kilo Salz ÷ 1 Kilo Salz pro Apfel = 20 Äpfel. Die gemeinsame Recheneinheit (Salz) macht den Vergleich einfach."
  },
  {
    "id": "p04",
    "topic": "preise",
    "type": "calc",
    "diff": 3,
    "tax": "K3",
    "reviewed":false,
    "q": "In einer Volkswirtschaft werden 5 verschiedene Güter gehandelt. Wie viele Tauschverhältnisse (relative Preise) müsste man ohne gemeinsame Recheneinheit kennen? (Formel: n × (n − 1) / 2)",
    "img": {
      "src": "img/vwl/geld/geld_tauschwirtschaft_01.svg",
      "alt": "Vergleich: Tauschbeziehungen bei Tausch- vs. Geldwirtschaft"
    },
    "rows": [
      {
        "label": "Anzahl Tauschverhältnisse bei 5 Gütern",
        "answer": 10,
        "tolerance": 0,
        "unit": ""
      }
    ],
    "explain": "Die Formel lautet n × (n − 1) / 2. Bei 5 Gütern: 5 × 4 / 2 = 10 Tauschverhältnisse. Mit einer Recheneinheit bräuchte man nur 5 absolute Preise. Bei 100 Gütern wären es sogar 4950 Tauschverhältnisse statt 100 Preise – dies zeigt den enormen Nutzen der Recheneinheit-Funktion."
  },
  {
    "id": "p05",
    "topic": "preise",
    "type": "tf",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Wenn sich alle absoluten Preise in einer Volkswirtschaft verdoppeln, ändern sich auch die relativen Preise.",
    "correct": false,
    "explain": "Falsch. Wenn sich alle absoluten Preise proportional verdoppeln, bleiben die relativen Preise (Tauschverhältnisse) gleich. Beispiel: Wenn ein Hemd von CHF 40 auf CHF 80 steigt und ein Buch von CHF 20 auf CHF 40, kostet ein Hemd immer noch genau 2 Bücher. Relative Preise ändern sich nur, wenn sich einzelne Preise stärker oder schwächer als andere verändern."
  },
  {
    "id": "p06",
    "topic": "preise",
    "type": "mc",
    "diff": 3,
    "tax": "K4",
    "reviewed":false,
    "q": "Der Preis von einem Kilo Zucker steigt innerhalb eines Jahres um 40 %, während die allgemeine Teuerung nahe bei null liegt. Was lässt sich daraus schliessen?",
    "options": [
      {
        "v": "A",
        "t": "Die Nationalbank hat zu viel Geld gedruckt."
      },
      {
        "v": "B",
        "t": "Es handelt sich um allgemeine Inflation, die alle Preise betrifft."
      },
      {
        "v": "C",
        "t": "Der relative Preis hat sich nicht verändert, weil nur ein Preis gestiegen ist."
      },
      {
        "v": "D",
        "t": "Der relative Preis von Zucker ist gestiegen – Zucker ist im Vergleich zu anderen Gütern teurer geworden, z.B. wegen einer Misserntemittel oder erhöhter Nachfrage."
      }
    ],
    "correct": "D",
    "explain": "Bei nahezu null Inflation ist der allgemeine Preisstand stabil. Wenn ein einzelnes Gut trotzdem 40 % teurer wird, ist das ein Zeichen für eine Änderung des relativen Preises: Zucker ist im Vergleich zu anderen Gütern teurer geworden. Mögliche Ursachen sind z.B. Missernten, gestiegene Produktionskosten oder erhöhte Nachfrage nach Zucker."
  },
  {
    "id": "p07",
    "topic": "preise",
    "type": "mc",
    "diff": 3,
    "tax": "K5",
    "reviewed":false,
    "q": "Bei einer hohen und unberechenbaren Inflation (20–50 % pro Jahr) steigt der Zuckerpreis um 40 %. Warum ist die Interpretation dieses Preisanstiegs jetzt schwieriger als bei stabilen Preisen?",
    "options": [
      {
        "v": "A",
        "t": "Weil die Geschäfte die Preise nicht mehr anpassen."
      },
      {
        "v": "B",
        "t": "Weil unklar ist, ob sich der relative Preis von Zucker verändert hat oder ob der Anstieg einfach die allgemeine Teuerung widerspiegelt."
      },
      {
        "v": "C",
        "t": "Weil man bei hoher Inflation keine Preise mehr ablesen kann."
      },
      {
        "v": "D",
        "t": "Weil Zucker bei Inflation weniger nachgefragt wird."
      }
    ],
    "correct": "B",
    "explain": "Bei hoher und unberechenbarer Inflation weiss man nicht, ob der Zuckerpreis «überproportional» gestiegen ist (relativer Preis gestiegen) oder nur die allgemeine Teuerung widerspiegelt. Die Signalfunktion der Preise geht verloren: Man kann nicht mehr erkennen, ob ein Gut wirklich knapper geworden ist. Dies ist eine der schwerwiegendsten negativen Folgen hoher Inflation – die Recheneinheit-Funktion des Geldes wird beeinträchtigt."
  },
  {
    "id": "p08",
    "topic": "preise",
    "type": "multi",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Welche Vorteile bietet eine gemeinsame Recheneinheit (z.B. Franken) gegenüber einem System mit lauter bilateralen Tauschverhältnissen? (Mehrere Antworten möglich.)",
    "options": [
      {
        "v": "A",
        "t": "Man braucht weniger Preisinformationen, um den Markt zu überblicken."
      },
      {
        "v": "B",
        "t": "Preisvergleiche zwischen verschiedenen Gütern werden viel einfacher."
      },
      {
        "v": "C",
        "t": "Alle Güter kosten automatisch gleich viel."
      },
      {
        "v": "D",
        "t": "Man kann den Wert von Gütern über die Zeit vergleichen."
      }
    ],
    "correct": [
      "A",
      "B",
      "D"
    ],
    "explain": "Eine Recheneinheit vereinfacht das Wirtschaftsleben enorm: (A) Statt n(n−1)/2 Tauschverhältnisse braucht man nur n absolute Preise. (B) Alle Preise sind direkt vergleichbar. (D) Man kann Preise über die Zeit verfolgen. C ist falsch – eine gemeinsame Recheneinheit macht Güter nicht gleich teuer, sie macht nur den Vergleich einfacher."
  },
  {
    "id": "g01",
    "topic": "grundlagen",
    "type": "mc",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Was versteht man in der Volkswirtschaftslehre unter «Geld»?",
    "options": [
      {
        "v": "A",
        "t": "Alle Wertgegenstände, die sich verkaufen lassen"
      },
      {
        "v": "B",
        "t": "Den liquidesten Teil des Vermögens, der sich leicht für Transaktionen verwenden lässt"
      },
      {
        "v": "C",
        "t": "Ausschliesslich Banknoten und Münzen"
      },
      {
        "v": "D",
        "t": "Das gesamte Vermögen einer Person"
      }
    ],
    "correct": "B",
    "explain": "Geld ist der liquideste, also flüssigste Teil des Vermögens. «Viel Geld haben» und «reich sein» sind nicht dasselbe: Zum Vermögen gehören auch Aktien, Immobilien oder Kunstwerke, die sich aber im Alltag nicht als Zahlungsmittel eignen."
  },
  {
    "id": "g02",
    "topic": "grundlagen",
    "type": "multi",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Welche Eigenschaften muss Geld aufweisen, damit es als Zahlungsmittel akzeptiert wird? (Mehrere Antworten möglich.)",
    "options": [
      {
        "v": "A",
        "t": "Knappheit"
      },
      {
        "v": "B",
        "t": "Einheitlichkeit"
      },
      {
        "v": "C",
        "t": "Haltbarkeit, Transportierbarkeit und Teilbarkeit"
      },
      {
        "v": "D",
        "t": "Hoher Materialwert"
      }
    ],
    "correct": [
      "A",
      "B",
      "C"
    ],
    "explain": "Geld muss knapp, einheitlich, haltbar, transportierbar und teilbar sein. Ein hoher Materialwert ist hingegen nicht nötig — Papiergeld hat praktisch keinen Materialwert. Entscheidend ist das Vertrauen in den Herausgeber."
  },
  {
    "id": "g03",
    "topic": "grundlagen",
    "type": "tf",
    "diff": 1,
    "tax": "K2",
    "reviewed":false,
    "q": "Eine Kreditkarte (z.B. Visa) ist selbst kein Geld, sondern dient lediglich als Mittel, um Buchgeld von einem Konto auf ein anderes zu übertragen.",
    "correct": true,
    "explain": "Korrekt. Debitkarten, Kreditkarten und mobile Zahlungsformen sind strikt genommen kein Geld. Sie sind Instrumente, um Buchgeld zu übertragen — sie erzeugen kein neues Geld."
  },
  {
    "id": "g04",
    "topic": "grundlagen",
    "type": "mc",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Was unterscheidet Warengeld von Papiergeld?",
    "options": [
      {
        "v": "A",
        "t": "Warengeld wird von der Zentralbank herausgegeben, Papiergeld von Geschäftsbanken"
      },
      {
        "v": "B",
        "t": "Papiergeld kann nur für kleine Beträge verwendet werden"
      },
      {
        "v": "C",
        "t": "Papiergeld ist älter als Warengeld"
      },
      {
        "v": "D",
        "t": "Warengeld hat einen konkreten Materialwert, Papiergeld praktisch keinen"
      }
    ],
    "correct": "D",
    "explain": "Warengeld (z.B. Gold- oder Silbermünzen, Muscheln) hat für die Nutzer einen konkreten Materialwert. Papiergeld (Banknoten) hat praktisch keinen Materialwert — die Produktion einer 100-Franken-Note kostet weniger als 40 Rappen. Es funktioniert nur durch Vertrauen."
  },
  {
    "id": "g05",
    "topic": "grundlagen",
    "type": "fill",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "In der Schweiz darf nur die {0} Banknoten herausgeben. Man spricht vom Geld- oder {1} des Staates.",
    "blanks": [
      {
        "answer": "Schweizerische Nationalbank",
        "alts": [
          "SNB",
          "Nationalbank"
        ]
      },
      {
        "answer": "Notenmonopol",
        "alts": [
          "Banknotenmonopol"
        ]
      }
    ],
    "explain": "Das Geldmonopol liegt beim Staat bzw. bei der staatlichen Zentralbank. In der Schweiz hat die SNB das alleinige Recht, Banknoten herauszugeben (Notenmonopol). Die Münzen werden von Swissmint hergestellt."
  },
  {
    "id": "g06",
    "topic": "grundlagen",
    "type": "mc",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Weshalb eignen sich Wassermelonen oder Baumstämme nicht als Geld?",
    "options": [
      {
        "v": "A",
        "t": "Sie werden bereits für andere Zwecke verwendet"
      },
      {
        "v": "B",
        "t": "Sie haben keinen Materialwert"
      },
      {
        "v": "C",
        "t": "Sie sind zu selten"
      },
      {
        "v": "D",
        "t": "Sie erfüllen die Eigenschaften Haltbarkeit, Transportierbarkeit und Teilbarkeit nicht ausreichend"
      }
    ],
    "correct": "D",
    "explain": "Wassermelonen sind nicht haltbar (sie verderben), Baumstämme sind nicht leicht transportierbar und kaum teilbar. Geld muss haltbar, transportierbar und teilbar sein — Muscheln, Zigaretten oder Silbermünzen erfüllen diese Bedingungen besser."
  },
  {
    "id": "g07",
    "topic": "grundlagen",
    "type": "tf",
    "diff": 3,
    "tax": "K4",
    "reviewed":false,
    "q": "Buchgeld (Bankguthaben) ist sicherer als Bargeld, da es durch die Zentralbank garantiert wird.",
    "correct": false,
    "explain": "Falsch. Buchgeld besteht aus Guthaben auf Konten bei Geschäftsbanken — es ist eine Forderung gegenüber der jeweiligen Bank, nicht der Zentralbank. Bei einer Bankpleite wäre dieses Guthaben (über die Einlagensicherung hinaus) gefährdet. Bargeld hingegen ist eine direkte Forderung an die Zentralbank."
  },
  {
    "id": "k01",
    "topic": "kaufkraft",
    "type": "mc",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Was misst der Landesindex der Konsumentenpreise (LIK)?",
    "options": [
      {
        "v": "A",
        "t": "Den Preis eines typischen Warenkorbs, den ein durchschnittlicher Haushalt konsumiert"
      },
      {
        "v": "B",
        "t": "Das Bruttoinlandprodukt pro Kopf"
      },
      {
        "v": "C",
        "t": "Die Kaufkraft des Schweizer Frankens im Vergleich zum Euro"
      },
      {
        "v": "D",
        "t": "Die Gesamtmenge aller im Umlauf befindlichen Banknoten"
      }
    ],
    "correct": "A",
    "explain": "Der LIK (Landesindex der Konsumentenpreise) misst den Preis eines typischen Warenkorbs mit den wichtigsten Waren und Dienstleistungen eines durchschnittlichen Haushalts. Die Höhe des Indexwerts in einem bestimmten Jahr entspricht dem Preisniveau."
  },
  {
    "id": "k02",
    "topic": "kaufkraft",
    "type": "tf",
    "diff": 1,
    "tax": "K2",
    "reviewed":false,
    "q": "Je höher das Preisniveau, desto geringer ist die Kaufkraft des Geldes.",
    "correct": true,
    "explain": "Richtig. Kaufkraft und Preisniveau verhalten sich umgekehrt zueinander. Steigt das Preisniveau, bekommt man für eine Geldeinheit weniger Waren und Dienstleistungen — die Kaufkraft sinkt."
  },
  {
    "id": "k03",
    "topic": "kaufkraft",
    "type": "mc",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Betrachten Sie das Geldmarktdiagramm. Was geschieht mit der Kaufkraft des Geldes, wenn die Zentralbank das Geldangebot stark ausweitet (bei gleichbleibender Geldnachfrage)?",
    "img": {
      "src": "img/vwl/geld/geld_geldmarkt_01.svg",
      "alt": "Diagramm: Gleichgewicht von Geldangebot und Geldnachfrage"
    },
    "options": [
      {
        "v": "A",
        "t": "Die Kaufkraft steigt zuerst und sinkt dann"
      },
      {
        "v": "B",
        "t": "Die Kaufkraft sinkt, da das Geld an Wert verliert"
      },
      {
        "v": "C",
        "t": "Die Kaufkraft steigt, weil mehr Geld verfügbar ist"
      },
      {
        "v": "D",
        "t": "Die Kaufkraft bleibt unverändert"
      }
    ],
    "correct": "B",
    "explain": "Steigt das Geldangebot (Verschiebung der senkrechten Angebotskurve nach rechts), sinkt bei gleichbleibender Geldnachfrage die Kaufkraft — das Geld verliert an Wert. Ein viel zu grosses Geldangebot führt zum Wertzerfall des Geldes."
  },
  {
    "id": "k04",
    "topic": "kaufkraft",
    "type": "fill",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Ein anhaltender Anstieg des allgemeinen Preisniveaus wird als {0} bezeichnet. Das Gegenteil — ein anhaltendes Sinken des Preisniveaus — nennt man {1}.",
    "blanks": [
      {
        "answer": "Inflation",
        "alts": [
          "Teuerung"
        ]
      },
      {
        "answer": "Deflation",
        "alts": []
      }
    ],
    "explain": "Inflation bedeutet, dass das allgemeine Preisniveau über einen längeren Zeitraum kontinuierlich steigt. Von Deflation spricht man, wenn das allgemeine Preisniveau über einen längeren Zeitraum andauernd sinkt. Einzelne Preisänderungen (z.B. nur Benzin) bedeuten noch keine Inflation oder Deflation."
  },
  {
    "id": "k05",
    "topic": "kaufkraft",
    "type": "tf",
    "diff": 2,
    "tax": "K4",
    "reviewed":false,
    "q": "Wenn sich nur der Benzinpreis deutlich verteuert, alle anderen Preise aber stabil bleiben, herrscht Inflation.",
    "correct": false,
    "explain": "Falsch. Von Inflation spricht man erst, wenn das allgemeine Preisniveau über einen längeren Zeitraum kontinuierlich steigt. Verteuert sich lediglich ein einzelnes Gut (z.B. Benzin), bedeutet dies nicht, dass Inflation herrscht."
  },
  {
    "id": "k06",
    "topic": "kaufkraft",
    "type": "multi",
    "diff": 3,
    "tax": "K4",
    "reviewed":false,
    "q": "Welche Verschiebungen im Geldmarkt führen zu einer Erhöhung des Preisniveaus (Inflation)? (Mehrere Antworten möglich.)",
    "options": [
      {
        "v": "A",
        "t": "Zunahme des Geldangebots"
      },
      {
        "v": "B",
        "t": "Zunahme der Geldnachfrage"
      },
      {
        "v": "C",
        "t": "Abnahme der Geldnachfrage"
      },
      {
        "v": "D",
        "t": "Abnahme des Geldangebots"
      }
    ],
    "correct": [
      "A",
      "C"
    ],
    "explain": "Eine Zunahme des Geldangebots (Verschiebung nach rechts) senkt die Kaufkraft, was das Preisniveau erhöht. Ebenso führt eine Abnahme der Geldnachfrage (Verschiebung nach links) zu sinkender Kaufkraft und steigendem Preisniveau. Umgekehrt: Eine Zunahme der Geldnachfrage oder eine Abnahme des Geldangebots würde das Preisniveau senken."
  },
  {
    "id": "n01",
    "topic": "geldnachfrage",
    "type": "mc",
    "diff": 1,
    "tax": "K2",
    "reviewed":false,
    "q": "Weshalb hat die Geldnachfragekurve eine negative Steigung?",
    "options": [
      {
        "v": "A",
        "t": "Je höher die Kaufkraft des Geldes, desto weniger Geld braucht man für den Alltag"
      },
      {
        "v": "B",
        "t": "Die Banken vergeben weniger Kredite bei hoher Kaufkraft"
      },
      {
        "v": "C",
        "t": "Die Zentralbank verringert das Angebot bei steigender Nachfrage"
      },
      {
        "v": "D",
        "t": "Je höher die Kaufkraft, desto mehr Geld wollen die Leute halten"
      }
    ],
    "correct": "A",
    "explain": "Je höher die Kaufkraft des Geldes, desto mehr kann man sich mit weniger Geld leisten. Man benötigt also weniger Geld für die täglichen Einkäufe — die nachgefragte Geldmenge sinkt. Umgekehrt: Bei tiefer Kaufkraft braucht man mehr Geld."
  },
  {
    "id": "n02",
    "topic": "geldnachfrage",
    "type": "tf",
    "diff": 1,
    "tax": "K2",
    "reviewed":false,
    "q": "Wenn das reale BIP einer Volkswirtschaft zunimmt, steigt in der Regel auch die Geldnachfrage.",
    "correct": true,
    "explain": "Richtig. Je mehr eine Wirtschaft produziert, desto mehr Transaktionen finden statt. Für jede Transaktion wird Geld benötigt, daher steigt die Geldnachfrage bei zunehmendem BIP (Verschiebung der Geldnachfrage nach rechts)."
  },
  {
    "id": "n03",
    "topic": "geldnachfrage",
    "type": "mc",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Was sind die Opportunitätskosten der Geldhaltung?",
    "options": [
      {
        "v": "A",
        "t": "Die entgangenen Zinsen, die man mit einer alternativen Anlage (z.B. Sparkonto, Aktien) hätte erzielen können"
      },
      {
        "v": "B",
        "t": "Die Gebühren, die eine Bank für die Kontoführung verlangt"
      },
      {
        "v": "C",
        "t": "Die Kosten für die Herstellung von Banknoten"
      },
      {
        "v": "D",
        "t": "Die Inflationsrate multipliziert mit dem Geldbetrag"
      }
    ],
    "correct": "A",
    "explain": "Wer Geld im Portemonnaie oder auf dem Lohnkonto hält, verzichtet auf Zinserträge eines Sparkontos oder Renditen von Wertpapieren. Diese entgangenen Erträge sind die Opportunitätskosten der Geldhaltung."
  },
  {
    "id": "n04",
    "topic": "geldnachfrage",
    "type": "tf",
    "diff": 2,
    "tax": "K3",
    "reviewed":false,
    "q": "Steigen die Zinsen auf Sparkonten, nehmen die Opportunitätskosten der Bargeldhaltung zu, und das Publikum hält weniger Bargeld.",
    "correct": true,
    "explain": "Richtig. Höhere Zinsen auf Sparkonten bedeuten höhere entgangene Erträge, wenn man Geld als Bargeld oder auf dem Lohnkonto hält. Die Opportunitätskosten steigen, weshalb das Publikum tendenziell weniger Bargeld hält und mehr auf verzinsliche Konten einzahlt."
  },
  {
    "id": "n05",
    "topic": "geldnachfrage",
    "type": "mc",
    "diff": 2,
    "tax": "K4",
    "reviewed":false,
    "q": "Während der Finanzkrise 2007/2008 stieg der Umlauf grosser Banknoten (1000-Franken-Noten) stark an. Was war der Hauptgrund?",
    "options": [
      {
        "v": "A",
        "t": "Die Banken zahlten Kredite in bar aus"
      },
      {
        "v": "B",
        "t": "Die Nachfrage nach Bargeld als sicherer Wertaufbewahrung stieg, weil andere Anlagen als riskant galten"
      },
      {
        "v": "C",
        "t": "Die Inflation war sehr hoch"
      },
      {
        "v": "D",
        "t": "Die SNB druckte mehr grosse Noten als gewöhnlich"
      }
    ],
    "correct": "B",
    "explain": "In Krisenzeiten steigt der Bedarf an liquiden Geldmitteln, weil andere Vermögensanlagen (Aktien, Obligationen) als riskant erscheinen. Bargeld gilt als besonders sichere Anlageform — die Geldnachfrage verschiebt sich nach rechts."
  },
  {
    "id": "n06",
    "topic": "geldnachfrage",
    "type": "multi",
    "diff": 3,
    "tax": "K4",
    "reviewed":false,
    "q": "Welche Faktoren führen zu einer Erhöhung der Geldnachfrage? (Mehrere Antworten möglich.)",
    "options": [
      {
        "v": "A",
        "t": "Zunahme des realen BIP"
      },
      {
        "v": "B",
        "t": "Steigende Zinsen auf Sparkonten"
      },
      {
        "v": "C",
        "t": "Zunehmende Unsicherheit auf den Finanzmärkten"
      },
      {
        "v": "D",
        "t": "Steigende Mindestreserveanforderungen"
      }
    ],
    "correct": [
      "A",
      "C",
      "D"
    ],
    "explain": "Die Geldnachfrage steigt bei: (A) mehr Transaktionen durch BIP-Wachstum, (C) höherem Sicherheitsbedürfnis (Bargeld als «sicherer Hafen»), (D) höheren Mindestreserveanforderungen (Banken müssen mehr Notenbankgeld halten). Steigende Sparzinsen (B) hingegen erhöhen die Opportunitätskosten der Geldhaltung und senken die Geldnachfrage."
  },
  {
    "id": "n07",
    "topic": "geldnachfrage",
    "type": "fill",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "{0} sind Guthaben, welche die Geschäftsbanken bei der Nationalbank halten müssen. Der aktuelle Mindestreservesatz beträgt {1} Prozent.",
    "blanks": [
      {
        "answer": "Mindestreserven",
        "alts": [
          "Reserven"
        ]
      },
      {
        "answer": "2,5",
        "alts": [
          "2.5"
        ]
      }
    ],
    "explain": "Das Nationalbankgesetz schreibt vor, dass die Banken ihre Verbindlichkeiten (Sicht-, Termin- und 20% der Spargelder) zu 2,5% mit Reserven bei der Nationalbank hinterlegen müssen. Diese Mindestreserven sichern die Nachfrage nach Notenbankgeld."
  },
  {
    "id": "a01",
    "topic": "geldangebot",
    "type": "mc",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Was sind die gesetzlichen Zahlungsmittel in der Schweiz?",
    "options": [
      {
        "v": "A",
        "t": "Nur Banknoten"
      },
      {
        "v": "B",
        "t": "Bargeld (Banknoten und Münzen) sowie Giroguthaben der Geschäftsbanken bei der SNB"
      },
      {
        "v": "C",
        "t": "Bargeld und Kreditkarten"
      },
      {
        "v": "D",
        "t": "Alle Guthaben auf Bankkonten"
      }
    ],
    "correct": "B",
    "explain": "Die SNB bringt als einzige die gesetzlichen Zahlungsmittel in Umlauf: Bargeld und die Giroguthaben der Geschäftsbanken bei der Nationalbank. Buchgeld auf normalen Bankkonten zählt zwar zur Geldmenge, ist aber kein gesetzliches Zahlungsmittel."
  },
  {
    "id": "a02",
    "topic": "geldangebot",
    "type": "mc",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Wie schaffen Geschäftsbanken neues Geld?",
    "options": [
      {
        "v": "A",
        "t": "Indem sie Banknoten drucken"
      },
      {
        "v": "B",
        "t": "Indem sie Kredite vergeben und den Kreditbetrag dem Konto des Kreditnehmers gutschreiben (Buchgeld)"
      },
      {
        "v": "C",
        "t": "Indem sie Spareinlagen der Kunden an andere Kunden weiterreichen"
      },
      {
        "v": "D",
        "t": "Indem sie Devisen an die SNB verkaufen"
      }
    ],
    "correct": "B",
    "explain": "Wenn eine Bank einen Kredit vergibt, schreibt sie den Betrag dem Bankkonto des Kreditnehmers gut — so entsteht Buchgeld. Dieses Buchgeld kann für Zahlungen verwendet werden und zählt zur Geldmenge. Die Geldmenge hat sich durch die Kreditvergabe erhöht."
  },
  {
    "id": "a03",
    "topic": "geldangebot",
    "type": "multi",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Welche Faktoren begrenzen die Geldschöpfung durch Geschäftsbanken? (Mehrere Antworten möglich.)",
    "options": [
      {
        "v": "A",
        "t": "Die Höhe der Kreditnachfrage"
      },
      {
        "v": "B",
        "t": "Mindestreservevorschriften"
      },
      {
        "v": "C",
        "t": "Die Kreditpolitik der Banken (Bonitätsprüfung)"
      },
      {
        "v": "D",
        "t": "Die Anzahl der Bankomaten im Land"
      }
    ],
    "correct": [
      "A",
      "B",
      "C"
    ],
    "explain": "Die Geldschöpfung wird begrenzt durch: (A) Die Kreditnachfrage von Haushalten und Firmen, die von Wirtschaftslage und Zinsniveau abhängt. (B) Mindestreserve- und Eigenkapitalvorschriften. (C) Die Kreditpolitik der Bank — sie vergibt nur Kredite, wenn der Kreditnehmer voraussichtlich zurückzahlen kann."
  },
  {
    "id": "a04",
    "topic": "geldangebot",
    "type": "tf",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Wenn ein Kreditnehmer seinen Kredit zurückzahlt (Tilgung), wird zuvor geschaffenes Geld wieder vernichtet.",
    "correct": true,
    "explain": "Richtig. Die Kreditrückzahlung ist der umgekehrte Prozess der Geldschöpfung: Das bei der Kreditvergabe geschaffene Buchgeld wird bei der Tilgung wieder aus der Geldmenge entfernt. Geldschöpfung und Geldvernichtung sind also zwei Seiten desselben Prozesses."
  },
  {
    "id": "a05",
    "topic": "geldangebot",
    "type": "mc",
    "diff": 3,
    "tax": "K4",
    "reviewed":false,
    "q": "Was geschieht im Zahlungsverkehr, wenn Bank A einen Kredit an einen Kunden vergibt und dieser eine Zahlung an einen Kunden von Bank B tätigt?",
    "options": [
      {
        "v": "A",
        "t": "Bank A überweist Bargeld an Bank B"
      },
      {
        "v": "B",
        "t": "Die SNB überweist automatisch den Betrag"
      },
      {
        "v": "C",
        "t": "Bank A überweist von ihrem Giroguthaben bei der SNB auf das Giroguthaben von Bank B bei der SNB"
      },
      {
        "v": "D",
        "t": "Die beiden Banken verrechnen den Betrag direkt ohne die SNB"
      }
    ],
    "correct": "C",
    "explain": "Der Zahlungsverkehr zwischen Banken erfolgt über Giroguthaben bei der SNB. Bank A überweist Notenbankgeld von ihrem Girokonto bei der SNB auf das Girokonto von Bank B. Deshalb können Banken nur dann Kredite vergeben, wenn sie genügend Giroguthaben bei der SNB haben."
  },
  {
    "id": "a06",
    "topic": "geldangebot",
    "type": "tf",
    "diff": 1,
    "tax": "K2",
    "reviewed":false,
    "q": "Die Geldangebotskurve verläuft senkrecht, weil das Geldangebot von der Zentralbank festgelegt wird.",
    "correct": true,
    "explain": "Richtig. Die Zentralbank bestimmt das Geldangebot, unabhängig von der Kaufkraft. Deshalb verläuft die Angebotskurve im Geldmarktdiagramm senkrecht (vertikal)."
  },
  {
    "id": "a07",
    "topic": "geldangebot",
    "type": "fill",
    "diff": 3,
    "tax": "K3",
    "reviewed":false,
    "q": "Die Geldschöpfung ist ein zweistufiger Prozess: Die {0} schöpft Notenbankgeld (M0), und die {1} schöpfen daraus über die Kreditvergabe die breiteren Geldmengen (M1–M3).",
    "blanks": [
      {
        "answer": "Zentralbank",
        "alts": [
          "SNB",
          "Nationalbank",
          "Schweizerische Nationalbank"
        ]
      },
      {
        "answer": "Geschäftsbanken",
        "alts": [
          "Banken",
          "Geschäftsbanken",
          "Kommerzbanken"
        ]
      }
    ],
    "explain": "Die Zentralbank (SNB) schöpft Notenbankgeld (Banknoten und Giroguthaben der Banken bei der SNB). Die Geschäftsbanken schaffen darauf aufbauend Buchgeld durch Kreditvergabe. So entstehen die breiteren Geldaggregate M1, M2 und M3."
  },
  {
    "id": "m01",
    "topic": "geldmengen",
    "type": "mc",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Woraus setzt sich die Notenbankgeldmenge (M0) zusammen?",
    "options": [
      {
        "v": "A",
        "t": "Notenumlauf plus Giroguthaben der Geschäftsbanken bei der SNB"
      },
      {
        "v": "B",
        "t": "Notenumlauf plus Münzumlauf"
      },
      {
        "v": "C",
        "t": "Alle Bankguthaben plus Bargeld"
      },
      {
        "v": "D",
        "t": "Bargeldumlauf plus Spareinlagen"
      }
    ],
    "correct": "A",
    "explain": "Die Notenbankgeldmenge M0 (monetäre Basis) besteht aus dem Notenumlauf und den Giroguthaben inländischer Geschäftsbanken bei der SNB. Münzen gehören nicht dazu, da sie Verpflichtungen des Bundes (nicht der SNB) darstellen."
  },
  {
    "id": "m02",
    "topic": "geldmengen",
    "type": "mc",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Betrachten Sie die Übersicht der Geldmengen. Wie unterscheidet sich M1 von M2?",
    "img": {
      "src": "img/vwl/geld/geld_geldmengen_02.svg",
      "alt": "Übersicht der Geldmengen M0, M1, M2, M3"
    },
    "options": [
      {
        "v": "A",
        "t": "M1 und M2 unterscheiden sich nur durch den Bargeldumlauf"
      },
      {
        "v": "B",
        "t": "M1 enthält nur Bargeld, M2 auch Sichteinlagen"
      },
      {
        "v": "C",
        "t": "M2 enthält zusätzlich zu M1 die Termineinlagen"
      },
      {
        "v": "D",
        "t": "M2 enthält zusätzlich zu M1 die Spareinlagen"
      }
    ],
    "correct": "D",
    "explain": "M1 umfasst den Bargeldumlauf, Sichteinlagen und Transaktionskonten. M2 ist M1 plus Spareinlagen (ohne gebundene Vorsorgegelder und ohne die bereits in M1 enthaltenen Transaktionskonten). M3 wiederum ist M2 plus Termineinlagen."
  },
  {
    "id": "m03",
    "topic": "geldmengen",
    "type": "fill",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Die SNB definiert die Geldmenge M3 als Summe der Geldmenge {0} und der {1}.",
    "blanks": [
      {
        "answer": "M2",
        "alts": []
      },
      {
        "answer": "Termineinlagen",
        "alts": [
          "Termingelder"
        ]
      }
    ],
    "explain": "M3 = M2 + Termineinlagen (Kreditoren auf Zeit und Geldmarktpapiere). M3 ist das breiteste von der SNB definierte Geldaggregat."
  },
  {
    "id": "m04",
    "topic": "geldmengen",
    "type": "multi",
    "diff": 2,
    "tax": "K3",
    "reviewed":false,
    "q": "Sie zahlen eine 100-Franken-Note auf Ihr Sparkonto ein. Wie verändern sich die Geldmengen? (Mehrere Antworten möglich.)",
    "options": [
      {
        "v": "A",
        "t": "M1 sinkt"
      },
      {
        "v": "B",
        "t": "M2 bleibt unverändert"
      },
      {
        "v": "C",
        "t": "M3 bleibt unverändert"
      },
      {
        "v": "D",
        "t": "M1 steigt"
      }
    ],
    "correct": [
      "A",
      "B",
      "C"
    ],
    "explain": "Durch die Einzahlung sinkt der Bargeldumlauf (Teil von M1), also sinkt M1. Gleichzeitig steigen die Spareinlagen — da M2 = M1 + Spareinlagen, gleicht sich die Änderung aus, und M2 bleibt unverändert. M3 bleibt ebenfalls gleich, da sich M2 nicht verändert."
  },
  {
    "id": "m05",
    "topic": "geldmengen",
    "type": "mc",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Was ist der Geldschöpfungsmultiplikator?",
    "options": [
      {
        "v": "A",
        "t": "Der Zinssatz, zu dem Banken untereinander Geld leihen"
      },
      {
        "v": "B",
        "t": "Die Rate, mit der die Zentralbank Geld druckt"
      },
      {
        "v": "C",
        "t": "Das Verhältnis von Bargeld zu Buchgeld"
      },
      {
        "v": "D",
        "t": "Ein Faktor, der angibt, um wie viel die breiteren Geldmengen grösser sind als die Notenbankgeldmenge"
      }
    ],
    "correct": "D",
    "explain": "Der Geldschöpfungsmultiplikator beschreibt den Zusammenhang zwischen Notenbankgeldmenge (M0) und den breiteren Geldaggregaten (z.B. M3 = m₃ × M0). Er ist grösser als 1, da die Geschäftsbanken aus einer gegebenen Menge an Notenbankgeld eine grössere Geldmenge schöpfen können."
  },
  {
    "id": "m06",
    "topic": "geldmengen",
    "type": "tf",
    "diff": 3,
    "tax": "K4",
    "reviewed":false,
    "q": "Der Geldschöpfungsmultiplikator ist ein fester, unveränderlicher Wert.",
    "correct": false,
    "explain": "Falsch. Der Multiplikator kann über die Zeit stark schwanken. Er hängt ab vom Zinsniveau, von der Bargeldnachfrage und der Bereitschaft der Banken, Kredite zu vergeben. In Krisenzeiten (z.B. nach 2008) sinkt er typischerweise, weil Banken vorsichtiger werden und grössere Reserven halten."
  },
  {
    "id": "m07",
    "topic": "geldmengen",
    "type": "tf",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Münzen gehören nicht zur Notenbankgeldmenge M0, da sie Verpflichtungen des Bundes (nicht der SNB) darstellen.",
    "correct": true,
    "explain": "Richtig. Die Münzen werden von Swissmint (einer Einheit der Bundesverwaltung) hergestellt und an die SNB verkauft. Die SNB bringt sie zwar in Umlauf, aber sie gelten als Verpflichtungen des Bundes und gehören deshalb nicht zur Notenbankgeldmenge M0."
  },
  {
    "id": "z01",
    "topic": "zinssteuerung",
    "type": "fill",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Die Nationalbank setzt ihre Geldpolitik um, indem sie den {0} festlegt. Der wichtigste kurzfristige Geldmarktzinssatz ist der {1}.",
    "blanks": [
      {
        "answer": "SNB-Leitzins",
        "alts": [
          "Leitzins"
        ]
      },
      {
        "answer": "SARON",
        "alts": [
          "Swiss Average Rate Overnight"
        ]
      }
    ],
    "explain": "Die SNB legt den SNB-Leitzins fest, der die angestrebte Höhe der kurzfristigen Geldmarktzinssätze signalisiert. Der SARON (Swiss Average Rate Overnight) ist der wichtigste dieser Zinssätze — er ist der Zinssatz für Übernachtkredite zwischen Banken."
  },
  {
    "id": "z02",
    "topic": "zinssteuerung",
    "type": "mc",
    "diff": 2,
    "tax": "K3",
    "reviewed":false,
    "q": "Die Inflationsprognose der SNB zeigt steigende Teuerung. Betrachten Sie das Schema des Kreditkanals. Wie reagiert die Nationalbank?",
    "img": {
      "src": "img/vwl/geld/geld_kreditkanal_03.svg",
      "alt": "Flussdiagramm: Kreditkanal der Geldpolitik"
    },
    "options": [
      {
        "v": "A",
        "t": "Sie senkt den Leitzins, damit Kredite billiger werden"
      },
      {
        "v": "B",
        "t": "Sie erhöht die Mindestreserven der Banken"
      },
      {
        "v": "C",
        "t": "Sie kauft Devisen, um den Wechselkurs zu stabilisieren"
      },
      {
        "v": "D",
        "t": "Sie erhöht den Leitzins, was über steigende Kreditzinsen die Nachfrage dämpft und so die Inflation bremst"
      }
    ],
    "correct": "D",
    "explain": "Bei drohender Inflation erhöht die SNB den Leitzins → SARON steigt → Banken erhöhen ihre Kreditzinsen → Unternehmen und Haushalte nehmen weniger Kredite auf → Nachfrage nach Waren und Dienstleistungen sinkt → Preisanstieg wird gedämpft."
  },
  {
    "id": "z03",
    "topic": "zinssteuerung",
    "type": "mc",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Was versteht man unter dem Wechselkurskanal der Geldpolitik?",
    "options": [
      {
        "v": "A",
        "t": "Eine Zinsänderung beeinflusst den Wechselkurs, der wiederum die Import- und Exportpreise und damit das Preisniveau verändert"
      },
      {
        "v": "B",
        "t": "Die Banken tauschen Franken gegen Euro, wenn die Zinsen steigen"
      },
      {
        "v": "C",
        "t": "Die SNB legt den Wechselkurs direkt fest"
      },
      {
        "v": "D",
        "t": "Wechselkursänderungen haben keinen Einfluss auf die Geldpolitik"
      }
    ],
    "correct": "A",
    "explain": "Eine Zinserhöhung macht Anlagen in CHF attraktiver → Nachfrage nach Franken steigt → Franken wertet auf → Schweizer Güter werden für Ausländer teurer (Nachfrage sinkt, indirekter Effekt) und Importe werden billiger (direkter Effekt). Beides wirkt dämpfend auf die Inflation."
  },
  {
    "id": "z04",
    "topic": "zinssteuerung",
    "type": "multi",
    "diff": 3,
    "tax": "K4",
    "reviewed":false,
    "q": "Welche Transmissionskanäle der Geldpolitik werden im Fachtext beschrieben? (Mehrere Antworten möglich.)",
    "options": [
      {
        "v": "A",
        "t": "Kreditkanal"
      },
      {
        "v": "B",
        "t": "Inflationserwartungen"
      },
      {
        "v": "C",
        "t": "Wechselkurskanal"
      },
      {
        "v": "D",
        "t": "Fiskalkanal"
      }
    ],
    "correct": [
      "A",
      "B",
      "C"
    ],
    "explain": "Der Fachtext beschreibt drei Transmissionskanäle: (A) Kreditkanal: Zinsänderung → Kreditkosten → Nachfrage → Preise. (B) Inflationserwartungen: Erwartungen über zukünftige Teuerung beeinflussen langfristige Zinsen. (C) Wechselkurskanal: Zinsänderung → Wechselkurs → Import-/Exportpreise. Ein «Fiskalkanal» wird nicht als Transmissionskanal der Geldpolitik beschrieben."
  },
  {
    "id": "z05",
    "topic": "zinssteuerung",
    "type": "tf",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Inflationserwartungen können zu einer «sich selbst erfüllenden Prophezeiung» werden: Bereits die blosse Erwartung einer Geldentwertung kann tatsächlich zur Geldentwertung führen.",
    "correct": true,
    "explain": "Richtig. Wenn Kreditgeber steigende Inflation erwarten, verlangen sie höhere Zinsen (Fisher-Effekt). Die höheren Nominalzinsen verteuern Kredite und beeinflussen Real- und Finanzwirtschaft. Die Erwartung wird so zur «self-fulfilling prophecy»."
  },
  {
    "id": "z06",
    "topic": "zinssteuerung",
    "type": "mc",
    "diff": 3,
    "tax": "K5",
    "reviewed":false,
    "q": "Weshalb ist die Glaubwürdigkeit einer Zentralbank entscheidend für die Wirksamkeit der Geldpolitik?",
    "options": [
      {
        "v": "A",
        "t": "Weil nur eine glaubwürdige Zentralbank Banknoten drucken darf"
      },
      {
        "v": "B",
        "t": "Weil die Geschäftsbanken sonst keine Kredite mehr vergeben"
      },
      {
        "v": "C",
        "t": "Weil die Zentralbank über die Inflationserwartungen des Publikums die langfristigen Zinsen beeinflusst — und das nur bei Glaubwürdigkeit funktioniert"
      },
      {
        "v": "D",
        "t": "Weil die Bevölkerung sonst auf Bargeld verzichten würde"
      }
    ],
    "correct": "C",
    "explain": "Die Zentralbank kann über die Erwartungen des Publikums die langfristigen Zinsen und damit Preisniveau und Konjunktur beeinflussen. Dafür muss sie glaubwürdig das Ziel der Preisstabilität verfolgen. Verliert sie Glaubwürdigkeit, können sich Inflationserwartungen verselbstständigen und die Zinssteuerung wird unwirksam."
  },
  {
    "id": "u01",
    "topic": "unkonventionell",
    "type": "mc",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Was versteht man unter «Quantitative Easing» (mengenmässige Lockerung)?",
    "options": [
      {
        "v": "A",
        "t": "Die Reduktion der Geldmenge zur Inflationsbekämpfung"
      },
      {
        "v": "B",
        "t": "Den Kauf von Staatsanleihen durch die Zentralbank, um die langfristigen Zinsen zu senken"
      },
      {
        "v": "C",
        "t": "Die Erhöhung der Mindestreserven"
      },
      {
        "v": "D",
        "t": "Die Senkung des Leitzinses auf null"
      }
    ],
    "correct": "B",
    "explain": "Quantitative Easing (QE) bezeichnet die Politik, namentlich Staatsanleihen des eigenen Währungsraums zu kaufen, um die langfristigen Zinsen zu senken. Der Begriff gewann durch die Finanzkrise 2007/2008 an Bedeutung, als Ben Bernanke als Fed-Präsident das erste QE-Programm verkündete."
  },
  {
    "id": "u02",
    "topic": "unkonventionell",
    "type": "fill",
    "diff": 2,
    "tax": "K1",
    "reviewed":false,
    "q": "Am {0} 2011 führte die SNB einen Mindestkurs von {1} Franken pro Euro ein, um die Frankenaufwertung zu stoppen.",
    "blanks": [
      {
        "answer": "6. September",
        "alts": [
          "6.9.",
          "6. Sept.",
          "September"
        ]
      },
      {
        "answer": "1.20",
        "alts": [
          "1,20",
          "CHF 1.20"
        ]
      }
    ],
    "explain": "Am 6. September 2011 legte die SNB einen Mindestkurs von 1.20 Franken pro Euro fest. Der starke Franken drohte zu einem Wachstumseinbruch und einer Deflation zu führen. Am 15. Januar 2015 wurde der Mindestkurs wieder aufgehoben."
  },
  {
    "id": "u03",
    "topic": "unkonventionell",
    "type": "mc",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Wie hat die SNB den Mindestkurs von 1.20 CHF/EUR durchgesetzt?",
    "options": [
      {
        "v": "A",
        "t": "Durch ein Verbot von Devisentransaktionen unter 1.20"
      },
      {
        "v": "B",
        "t": "Durch Devisenkäufe: Sie kaufte Euro und andere Fremdwährungen mit neu geschaffenen Franken"
      },
      {
        "v": "C",
        "t": "Durch Erhöhung des Leitzinses"
      },
      {
        "v": "D",
        "t": "Durch Senkung der Mindestreserven der Geschäftsbanken"
      }
    ],
    "correct": "B",
    "explain": "Die SNB kaufte Devisen (v.a. Euro) und bezahlte diese mit neu geschaffenen Franken. So erhöhte sie das Angebot an Franken und stützte die Nachfrage nach Euro. Zwischen August 2011 und Januar 2015 wurden Devisen im Wert von über 200 Mrd. Franken gekauft."
  },
  {
    "id": "u04",
    "topic": "unkonventionell",
    "type": "tf",
    "diff": 2,
    "tax": "K2",
    "reviewed":false,
    "q": "Der Negativzins der SNB (eingeführt im Januar 2015) zielte darauf ab, Anlagen in Franken weniger attraktiv zu machen und so den Aufwertungsdruck auf den Franken zu begrenzen.",
    "correct": true,
    "explain": "Richtig. Der Negativzins von –0,75% auf Sichtguthaben bei der SNB sollte die Attraktivität von Frankenanlagen senken und damit die Nachfrage nach CHF und den Aufwertungsdruck reduzieren. Der Negativzins übertrug sich auf weitere Zinssätze über alle Laufzeiten."
  },
  {
    "id": "u05",
    "topic": "unkonventionell",
    "type": "mc",
    "diff": 3,
    "tax": "K4",
    "reviewed":false,
    "q": "Weshalb kann die SNB die Zinsen nicht unbegrenzt in den negativen Bereich senken?",
    "options": [
      {
        "v": "A",
        "t": "Weil negative Zinsen gesetzlich verboten sind"
      },
      {
        "v": "B",
        "t": "Weil der Franken dann seinen Status als Reservewährung verlieren würde"
      },
      {
        "v": "C",
        "t": "Weil die Geschäftsbanken die Negativzinsen nicht weitergeben können"
      },
      {
        "v": "D",
        "t": "Weil ab einer gewissen Grenze Anleger vom Konto ins Bargeld umschichten würden (Bargeld hat einen Zins von null)"
      }
    ],
    "correct": "D",
    "explain": "Ab einer bestimmten Grenze («effektive Untergrenze») lohnt es sich für Anleger, Geld als Bargeld zu halten (Zins = 0%) statt auf Konten mit negativer Verzinsung. Die logistischen und versicherungstechnischen Kosten der Bargeldhaltung bestimmen, wo diese Grenze liegt."
  },
  {
    "id": "u06",
    "topic": "unkonventionell",
    "type": "multi",
    "diff": 3,
    "tax": "K4",
    "reviewed":false,
    "q": "Welche Aussagen zur Auswirkung der unkonventionellen Geldpolitik auf die Geldmengen treffen zu? (Mehrere Antworten möglich.)",
    "options": [
      {
        "v": "A",
        "t": "Die Notenbankgeldmenge (M0) stieg durch die Devisenkäufe massiv an"
      },
      {
        "v": "B",
        "t": "Die breiteren Geldaggregate (M1–M3) stiegen im gleichen Masse wie M0"
      },
      {
        "v": "C",
        "t": "Der Geldschöpfungsmultiplikator ging stark zurück"
      },
      {
        "v": "D",
        "t": "Trotz der Geldmengenausweitung kam es nicht zu Inflation, weil die Umlaufgeschwindigkeit sank"
      }
    ],
    "correct": [
      "A",
      "C",
      "D"
    ],
    "explain": "Die Devisenkäufe liessen M0 massiv steigen (A). Die breiteren Geldaggregate stiegen jedoch deutlich weniger, weshalb der Multiplikator sank (C). Trotz der Geldmengenausweitung blieb die Inflation aus, da die lockere Geldpolitik die Umlaufgeschwindigkeit des Geldes senkte (D). Gemäss der Quantitätsgleichung (M × V = P × Y) kann bei sinkendem V die Geldmenge steigen, ohne Inflation auszulösen."
  },
  {
    "id": "u07",
    "topic": "unkonventionell",
    "type": "mc",
    "diff": 1,
    "tax": "K1",
    "reviewed":false,
    "q": "Wann wurde der EUR/CHF-Mindestkurs der SNB aufgehoben?",
    "options": [
      {
        "v": "A",
        "t": "15. Januar 2015"
      },
      {
        "v": "B",
        "t": "6. September 2011"
      },
      {
        "v": "C",
        "t": "1. Januar 2016"
      },
      {
        "v": "D",
        "t": "22. Januar 2015"
      }
    ],
    "correct": "A",
    "explain": "Am 15. Januar 2015 hob die SNB den Mindestkurs von 1.20 CHF/EUR auf. Der Mindestkurs war nicht mehr nachhaltig, da er nur noch mit anhaltenden und rasch zunehmenden Devisenkäufen durchzusetzen gewesen wäre."
  },
  {
    "id": "u08",
    "topic": "unkonventionell",
    "type": "tf",
    "diff": 3,
    "tax": "K5",
    "reviewed":false,
    "q": "Ein Negativzins wirkt sich nachteilig auf die Profitabilität der Geschäftsbanken aus, da diese den Negativzins nur ungern an ihre Sparkunden weitergeben.",
    "correct": true,
    "explain": "Richtig. Banken betreiben ein Zinsdifferenzgeschäft: Sie zahlen tiefere Zinsen auf Spareinlagen als sie bei der Kreditvergabe einnehmen. Wenn die Giroguthaben bei der SNB negativ verzinst werden, aber Spargelder weiter positiv verzinst werden, sinken die Zinseinnahmen der Banken. Banken können dies teilweise durch höhere Gebühren kompensieren."
  },
  {
    "id": "k07",
    "topic": "kaufkraft",
    "type": "mc",
    "diff": 3,
    "tax": "K3",
    "reviewed":false,
    "q": "Die Quantitätsgleichung lautet M × V = P × Y. Was passiert laut dieser Gleichung, wenn die Geldmenge (M) stärker steigt als das reale BIP (Y), bei konstanter Umlaufgeschwindigkeit (V)?",
    "options": [
      {
        "v": "A",
        "t": "Das reale BIP (Y) passt sich automatisch an"
      },
      {
        "v": "B",
        "t": "Das Preisniveau (P) muss steigen"
      },
      {
        "v": "C",
        "t": "Die Geldmenge (M) reguliert sich selbst"
      },
      {
        "v": "D",
        "t": "Die Umlaufgeschwindigkeit (V) muss sinken"
      }
    ],
    "correct": "B",
    "explain": "Bei konstanter Umlaufgeschwindigkeit (V) und wenn die Geldmenge (M) stärker steigt als das reale BIP (Y), muss das Preisniveau (P) steigen, damit die Gleichung M × V = P × Y erfüllt bleibt. Das bedeutet: Zu viel Geld jagt zu wenig Güter → Inflation."
  },
  {
    "id": "g08",
    "topic": "grundlagen",
    "type": "mc",
    "diff": 3,
    "tax": "K5",
    "reviewed":false,
    "q": "Warum ist es in modernen Volkswirtschaften die Aufgabe der Zentralbank (und nicht des freien Marktes), für die Werthaltigkeit des Geldes zu sorgen?",
    "options": [
      {
        "v": "A",
        "t": "Weil Geschäftsbanken kein Interesse an stabilem Geld haben"
      },
      {
        "v": "B",
        "t": "Weil Papiergeld praktisch keinen Materialwert hat und leicht vermehrt werden kann — ohne staatliche Kontrolle würde das Vertrauen schwinden"
      },
      {
        "v": "C",
        "t": "Weil Warengeld nur in staatlicher Hand funktioniert"
      },
      {
        "v": "D",
        "t": "Weil der Staat möglichst viel Geld drucken möchte, um seine Ausgaben zu finanzieren"
      }
    ],
    "correct": "B",
    "explain": "Papiergeld hat praktisch keinen Materialwert und lässt sich theoretisch leicht vermehren. Ohne eine vertrauenswürdige Institution, die für die Knappheit und den Wert des Geldes sorgt, würde das Vertrauen in die Währung zusammenbrechen. Das Geldmonopol liegt daher beim Staat bzw. der Zentralbank."
  },
  {
    "id": "z07",
    "topic": "zinssteuerung",
    "type": "tf",
    "diff": 3,
    "tax": "K4",
    "reviewed":false,
    "q": "Eine Aufwertung des Schweizer Frankens wirkt sich immer inflationär auf das Preisniveau in der Schweiz aus.",
    "correct": false,
    "explain": "Falsch. Eine Aufwertung des Frankens wirkt dämpfend (deflationär) auf das Preisniveau — nicht inflationär. Importe werden billiger (direkter Effekt), und Schweizer Exportgüter werden für Ausländer teurer, was die Nachfrage und damit die Konjunktur dämpft (indirekter Effekt). Beide Effekte senken das Preisniveau."
  },
  {
    "id": "n08",
    "topic": "geldnachfrage",
    "type": "mc",
    "diff": 3,
    "tax": "K3",
    "reviewed":false,
    "q": "Die Geldnachfragefunktion lautet Mᵈ = P × f(Y, R, …). Was bedeutet es, wenn die Nominalzinsen (R) sinken?",
    "options": [
      {
        "v": "A",
        "t": "Die Geldnachfrage steigt, weil mehr Transaktionen stattfinden"
      },
      {
        "v": "B",
        "t": "Die Geldnachfrage sinkt, weil das Geld weniger wert wird"
      },
      {
        "v": "C",
        "t": "Die Geldnachfrage steigt, weil die Opportunitätskosten der Geldhaltung sinken"
      },
      {
        "v": "D",
        "t": "Die Geldnachfrage bleibt unverändert, da R nur die Sparquote beeinflusst"
      }
    ],
    "correct": "C",
    "explain": "Wenn die Nominalzinsen (R) sinken, sinken auch die Opportunitätskosten der Geldhaltung — der entgangene Ertrag durch das Halten von Geld statt Sparguthaben wird kleiner. Deshalb hält das Publikum mehr Geld, und die Geldnachfrage steigt."
  },

  // --- Sortierungsfragen ---
  {
    id: "neu_sort_01", topic: "geldarten", type: "sortierung", diff: 2, tax: "K3", reviewed: false,
    q: "Ordnen Sie die folgenden Geldformen in die historisch korrekte Entwicklungsreihenfolge.",
    items: [
      "Warengeld (z.B. Muscheln, Salz, Vieh)",
      "Münzgeld aus Edelmetallen (Gold- und Silbermünzen)",
      "Banknoten mit Golddeckung (einlösbar gegen Gold)",
      "Fiat-Geld ohne Golddeckung (modernes Papiergeld, gesetzliches Zahlungsmittel)",
      "Buchgeld / Giralgeld (elektronische Bankguthaben)"
    ],
    correct: [0, 1, 2, 3, 4],
    explain: "Die Geldentwicklung verlief über Jahrtausende: Erst Warengeld (Tauschgüter), dann Münzgeld (standardisiert, ca. 600 v. Chr.), später Banknoten mit Golddeckung (ab 17. Jh.), dann Fiat-Geld ohne Deckung (Nixon Shock 1971 beendete den Goldstandard), und schliesslich dominiert heute Buchgeld (über 90% der Geldmenge M1 in der Schweiz)."
  },
  {
    id: "neu_sort_02", topic: "geldmengen", type: "sortierung", diff: 2, tax: "K3", reviewed: false,
    q: "Ordnen Sie die Geldmengenaggregate der SNB vom engsten (liquidesten) zum weitesten.",
    items: [
      "M0 (Notenbankgeldmenge: Bargeld + Giroguthaben der Banken bei der SNB)",
      "M1 (Bargeld + Sichteinlagen bei Banken)",
      "M2 (M1 + Spareinlagen)",
      "M3 (M2 + Termineinlagen)"
    ],
    correct: [0, 1, 2, 3],
    explain: "Die Geldmengenaggregate werden immer breiter: M0 umfasst nur das Zentralbankgeld, M1 fügt Sichteinlagen hinzu (jederzeit verfügbar), M2 ergänzt Spareinlagen (etwas weniger liquide), und M3 schliesst auch Termineinlagen ein (festgelegt auf bestimmte Laufzeit). Je breiter das Aggregat, desto weniger liquide die enthaltenen Komponenten."
  },
  {
    id: "neu_sort_03", topic: "zinssteuerung", type: "sortierung", diff: 3, tax: "K3", reviewed: false,
    q: "Ordnen Sie die Schritte des geldpolitischen Transmissionsmechanismus in die korrekte Wirkungskette – von der SNB-Entscheidung bis zur Wirkung auf die Realwirtschaft.",
    items: [
      "Die SNB senkt den Leitzins (SNB-Leitzins / SARON)",
      "Die Geschäftsbanken senken ihre Kreditzinsen",
      "Unternehmen und Haushalte nehmen mehr Kredite auf",
      "Konsum und Investitionen steigen",
      "Das BIP wächst und die Beschäftigung nimmt zu"
    ],
    correct: [0, 1, 2, 3, 4],
    explain: "Der Zinskanal der Geldpolitik wirkt stufenweise: Die SNB senkt den Leitzins → Banken geben die tieferen Zinsen weiter → Kredite werden günstiger → Unternehmen investieren mehr, Haushalte konsumieren mehr → Die gesamtwirtschaftliche Nachfrage steigt → BIP und Beschäftigung nehmen zu. Dieser Prozess dauert typischerweise 6–18 Monate (Time Lag)."
  },

// ──── ZEICHNEN ────
  {
    id: "neu_zeichnen_01", topic: "geldmengen", type: "zeichnen", diff: 3, tax: "K3", reviewed: false,
    q: "Zeichne den Prozess der Geldschöpfung durch Geschäftsbanken (multiple Geldschöpfung). Zeige mindestens 3 Runden mit Einlage, Mindestreserve und Kreditvergabe bei einem Mindestreservesatz von 10%.",
    hints: ["Starte mit einer Einlage von 1000 CHF bei Bank A.", "Bank A behält 10% (100 CHF) als Reserve und verleiht 900 CHF.", "Die 900 CHF werden bei Bank B eingelegt, die wieder 10% behält und den Rest verleiht."],
    sample: { src: "img/vwl/geld/geld_geldschoepfung_zeichnen.svg", alt: "Musterlösung: Multiple Geldschöpfung" },
    explain: "Bei einem Mindestreservesatz von 10% beträgt der Geldschöpfungsmultiplikator m = 1/0.1 = 10. Aus einer Einlage von 1000 CHF kann theoretisch bis zu 10'000 CHF Buchgeld entstehen. In der Praxis ist der Multiplikator kleiner, da Banken freiwillige Reserven halten und nicht alle Kredite als Einlagen zurückkehren."
  },

// ===== INTERAKTIVE FRAGETYPEN (Hotspot, Bildbeschriftung, DragDrop) =====

// --- Hotspot: Geldmarkt-Gleichgewicht ---
{
  id: "hotspot01", topic: "geldnachfrage", type: "hotspot", diff: 1, tax: "K2", reviewed: false,
  q: "Klicke auf den Punkt, der das Geldmarktgleichgewicht darstellt — dort wo Geldangebot und Geldnachfrage übereinstimmen.",
  img: { src: "img/vwl/geld/geld_geldmarkt_hotspot.svg", alt: "Geldmarkt-Diagramm mit vier markierten Punkten (A–D)" },
  hotspots: [
    {x: 50, y: 51.2, r: 8, label: "A: Gleichgewicht"},
    {x: 50, y: 33.3, r: 8, label: "B: Überschüssiges Geldangebot"},
    {x: 30, y: 36.9, r: 8, label: "C: Geldknappheit"},
    {x: 70, y: 71.4, r: 8, label: "D: Kein Schnittpunkt"}
  ],
  correct: [0],
  explain: "Das Geldmarktgleichgewicht liegt dort, wo das (von der Zentralbank fixierte) Geldangebot auf die Geldnachfrage trifft. Der Gleichgewichtszinssatz stellt sich so ein, dass die Wirtschaftssubjekte genau die vorhandene Geldmenge halten wollen."
},
// --- Bildbeschriftung: Geldmengen M0–M3 ---
{
  id: "beschriftung01", topic: "geldmengen", type: "bildbeschriftung", diff: 1, tax: "K2", reviewed: false,
  q: "Beschrifte die vier Geldmengenaggregate und ihre Bestandteile.",
  img: { src: "img/vwl/geld/geld_geldmengen_beschriftung.svg", alt: "Geldmengenaggregate M0–M3 als konzentrische Schichten mit vier nummerierten Beschriftungspunkten" },
  labels: [
    {id: "l1", text: "M0: Notenbankgeld (Bargeld + Giroguthaben bei SNB)", x: 39, y: 57},
    {id: "l2", text: "M1: Bargeld + Sichteinlagen", x: 24, y: 42},
    {id: "l3", text: "M2: M1 + Spareinlagen", x: 16, y: 34},
    {id: "l4", text: "M3: M2 + Termineinlagen", x: 10, y: 22}
  ],
  explain: "Die Geldmengenaggregate sind ineinander geschachtelt: M0 (monetäre Basis) → M1 (Transaktionsgeld) → M2 (+ Spareinlagen) → M3 (+ Termineinlagen). Je weiter aussen, desto weniger liquide."
},
// --- DragDrop: Geldarten den Kategorien zuordnen ---
{
  id: "dragdrop01", topic: "geldarten", type: "dragdrop_bild", diff: 2, tax: "K3", reviewed: false,
  q: "Ordne die folgenden Beispiele der richtigen Geldart zu.",
  img: { src: "img/vwl/geld/geld_geldarten_dragdrop.svg", alt: "Drei Spalten: Warengeld, Kreditgeld, Digitales Geld" },
  zones: [
    {id: "waren", x: 2.5, y: 14, w: 30, h: 82},
    {id: "kredit", x: 34, y: 14, w: 30, h: 82},
    {id: "digital", x: 65.5, y: 14, w: 32, h: 82}
  ],
  labels: [
    {id: "m1", text: "Goldmünzen", zone: "waren"},
    {id: "m2", text: "Salz als Zahlungsmittel", zone: "waren"},
    {id: "m3", text: "Kaurimuscheln", zone: "waren"},
    {id: "m4", text: "Lohnüberweisung auf Bankkonto", zone: "kredit"},
    {id: "m5", text: "Hypothekarkredit", zone: "kredit"},
    {id: "m6", text: "Sichteinlage bei der UBS", zone: "kredit"},
    {id: "m7", text: "Bitcoin", zone: "digital"},
    {id: "m8", text: "TWINT-Zahlung", zone: "digital"},
    {id: "m9", text: "CBDC (digitales Zentralbankgeld)", zone: "digital"}
  ],
  explain: "Warengeld hat inneren Wert (Gold, Salz, Muscheln). Kreditgeld entsteht durch Bankenschöpfung (Kontoguthaben). Digitales Geld umfasst Kryptowährungen (Bitcoin), mobile Zahlungssysteme (TWINT) und potenziell CBDC."
}

];
