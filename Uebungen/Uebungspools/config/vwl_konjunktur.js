// ============================================================
// Übungspool: Konjunktur und Konjunkturpolitik
// Fachbereich: VWL
// Kapitel: Eisenhut K.5 (Konjunkturphänomen) & K.6 (Konjunkturpolitik)
// Anzahl Fragen: 83 (74 klassisch + 9 neue interaktive Typen)
// Stufe: SF GYM3–GYM4
// Erstellt: 2026-02-20
// ============================================================

window.POOL_META = {
  id: "vwl_konjunktur",
  title: "Konjunktur und Konjunkturpolitik",
  fach: "VWL",
  color: "#f89907",
  level: "SF GYM3–GYM4",
  lernziele: [
    "Ich kann den Konjunkturzyklus beschreiben und Konjunkturindikatoren interpretieren. (K2)",
    "Ich kann die Ursachen von Konjunkturschwankungen erklären. (K2)",
    "Ich kann die vier wirtschaftspolitischen Konzeptionen (Klassik, Keynesianismus, Monetarismus, Angebotsorientierung) vergleichen und beurteilen. (K5)"
  ]
};

window.TOPICS = {
  zyklus: {label: "Konjunkturzyklus & Phasen", short: "Zyklus", lernziele: ["Ich kann die vier Konjunkturphasen (Aufschwung, Hochkonjunktur, Abschwung, Rezession) beschreiben. (K2)", "Ich kann einen Konjunkturzyklus grafisch darstellen und die Phasen zuordnen. (K3)"]},
  indikatoren: {label: "Konjunkturindikatoren", short: "Indikatoren", lernziele: ["Ich kann Früh-, Präsenz- und Spätindikatoren unterscheiden und Beispiele nennen. (K2)", "Ich kann anhand von Indikatoren die aktuelle Konjunkturlage einschätzen. (K4)"]},
  ursachen: {label: "Ursachen für Konjunkturschwankungen", short: "Ursachen", lernziele: ["Ich kann endogene und exogene Ursachen von Konjunkturschwankungen unterscheiden. (K2)", "Ich kann erklären, warum es zu Konjunkturschwankungen kommt (z.B. Schocks, Erwartungen). (K2)"]},
  klassiker: {label: "Klassische Konzeption", short: "Klassik", lernziele: ["Ich kann die Grundannahmen der klassischen Wirtschaftstheorie erklären (Say'sches Theorem, flexible Preise). (K2)", "Ich kann die klassische Empfehlung der Nichtintervention begründen. (K2)"]},
  keynes: {label: "Keynesianische Konzeption", short: "Keynes", lernziele: ["Ich kann die keynesianische Erklärung von Konjunkturschwankungen (Nachfragemangel) erklären. (K2)", "Ich kann die keynesianische Fiskalpolitik (antizyklisch, deficit spending) erklären und kritisch beurteilen. (K5)"]},
  monetaristen: {label: "Monetaristische Konzeption", short: "Monetaristen", lernziele: ["Ich kann die monetaristische Position (Geldmenge als zentrale Grösse) erklären. (K2)", "Ich kann erklären, warum Monetaristen eine regelgebundene Geldpolitik bevorzugen. (K2)"]},
  angebot: {label: "Angebotsorientierte Konzeption & Synthese", short: "Angebot/Synthese", lernziele: ["Ich kann die angebotsorientierte Wirtschaftspolitik (Deregulierung, Steuersenkungen) erklären. (K2)", "Ich kann die vier Konzeptionen vergleichen und ihre unterschiedlichen Politikempfehlungen gegenüberstellen. (K4)"]}
};

window.QUESTIONS = [

  // ════════════════════════════════════════════════════════════
  //  TOPIC: zyklus – Konjunkturzyklus & Phasen
  // ════════════════════════════════════════════════════════════

  {
    id: "z01", topic: "zyklus", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was beschreibt der Begriff «Konjunktur» in der Volkswirtschaftslehre?",
    options: [
      {v: "A", t: "Die langfristige Zunahme der Wirtschaftsleistung eines Landes"},
      {v: "B", t: "Die kurzfristigen Schwankungen der wirtschaftlichen Aktivität um das Produktionspotenzial"},
      {v: "C", t: "Die Verteilung des Volkseinkommens auf verschiedene Bevölkerungsgruppen"},
      {v: "D", t: "Die Veränderung der Bevölkerungszahl über die Zeit"}
    ],
    correct: "B",
    explain: "Konjunktur bezeichnet die kurzfristigen Schwankungen der gesamtwirtschaftlichen Aktivität (gemessen am realen BIP) um den langfristigen Wachstumstrend (Produktionspotenzial). Im Gegensatz dazu beschreibt «Wachstum» die langfristige Zunahme der Wirtschaftsleistung."
  },
  {
    id: "z02", topic: "zyklus", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Welche Reihenfolge der Konjunkturphasen ist korrekt?",
    options: [
      {v: "A", t: "Aufschwung → Rezession → Boom → Depression → Stagnation"},
      {v: "B", t: "Boom → Stagnation → Erholung → Depression → Rezession"},
      {v: "C", t: "Erholung → Stagnation → Rezession → Boom → Abschwung"},
      {v: "D", t: "Rezession → Erholung/Aufschwung → Hochkonjunktur/Boom → Stagnation → Abschwung"}
    ],
    correct: "D",
    explain: "Der modellhafte Konjunkturzyklus verläuft: Rezession (Talsohle) → Erholung/Aufschwung → Hochkonjunktur/Boom → Stagnation → Abschwung/Rezession. Die wirtschaftliche Aktivität schwankt dabei um das Produktionspotenzial bei Normalauslastung."
  },
  {
    id: "z03", topic: "zyklus", type: "tf", diff: 1, tax: "K2",
 reviewed:false,
    q: "Während einer Hochkonjunktur liegt die tatsächliche Wirtschaftsleistung über dem Produktionspotenzial bei Normalauslastung.",
    correct: true,
    explain: "In der Hochkonjunktur (Boom) wird das Produktionspotenzial überdurchschnittlich stark ausgelastet. Die tatsächliche Wirtschaftsleistung liegt über der Normalauslastung. Dies führt typischerweise zu steigenden Preisen (Inflation) und sinkender Arbeitslosigkeit."
  },
  {
    id: "z04", topic: "zyklus", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Eine Rezession wird in der Regel definiert als zwei aufeinanderfolgende Quartale mit negativem BIP-Wachstum.",
    correct: true,
    explain: "Die technische Definition einer Rezession lautet: mindestens zwei aufeinanderfolgende Quartale mit negativem Wachstum des realen BIP (also einem Rückgang der Wirtschaftsleistung gegenüber dem Vorquartal)."
  },
  {
    id: "z05", topic: "zyklus", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Was unterscheidet «Wachstum» von «Konjunktur» in der Volkswirtschaftslehre?",
    options: [
      {v: "A", t: "Wachstum betrachtet die langfristige Entwicklung, Konjunktur die kurzfristigen Schwankungen"},
      {v: "B", t: "Wachstum misst nur die Exporte, Konjunktur den Binnenmarkt"},
      {v: "C", t: "Wachstum betrifft nur die Industrie, Konjunktur alle Sektoren"},
      {v: "D", t: "Wachstum ist immer positiv, Konjunktur immer negativ"}
    ],
    correct: "A",
    explain: "Wachstum fragt: «Weshalb wächst eine Volkswirtschaft langfristig?» — es geht um den Trend. Konjunktur fragt: «Wie wächst eine Volkswirtschaft in der kurzen Frist?» — es geht um die Schwankungen um diesen Trend. Das reale BIP wächst langfristig, aber nicht gleichförmig."
  },
  {
    id: "z06", topic: "zyklus", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Gemäss Art. 100 der Bundesverfassung trifft der Bund Massnahmen für eine ausgeglichene {0} Entwicklung, insbesondere zur Verhütung und Bekämpfung von {1} und {2}.",
    blanks: [
      {answer: "konjunkturelle", alts: ["konjunkturellen"]},
      {answer: "Arbeitslosigkeit", alts: []},
      {answer: "Teuerung", alts: ["Inflation"]}
    ],
    explain: "Art. 100 BV gibt dem Bund den Auftrag, für eine ausgeglichene konjunkturelle Entwicklung zu sorgen. Die beiden negativen Hauptfolgen von Konjunkturschwankungen sind: Arbeitslosigkeit (in der Rezession) und Teuerung/Inflation (in der Hochkonjunktur)."
  },
  {
    id: "z07", topic: "zyklus", type: "multi",
    img: {src: "img/vwl/konjunktur/konjunktur_zyklus_01.svg", alt: "Modellhafter Konjunkturverlauf mit Phasen"}, diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Aussagen zu Konjunkturschwankungen treffen zu? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "In der Rezession steigt typischerweise die Arbeitslosigkeit."},
      {v: "B", t: "In der Hochkonjunktur ist die Inflationsgefahr besonders gross."},
      {v: "C", t: "Konjunkturzyklen dauern immer exakt 7 Jahre."},
      {v: "D", t: "Die Schwankungen verlaufen um das langfristige Produktionspotenzial."}
    ],
    correct: ["A", "B", "D"],
    explain: "A, B und D sind korrekt: Rezessionen führen zu Arbeitslosigkeit, Hochkonjunkturen zu Inflation, und die Schwankungen verlaufen um das Produktionspotenzial. C ist falsch: Konjunkturzyklen haben keine feste Dauer — sie variieren stark je nach Ursachen und wirtschaftlichen Bedingungen."
  },
  {
    id: "z08", topic: "zyklus", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "In der Grafik der Schweizer BIP-Entwicklung seit 1955 zeigt sich ein markanter Einbruch Mitte der 1970er-Jahre. Welches Ereignis war die Hauptursache?",
    options: [
      {v: "A", t: "Die Einführung der Mehrwertsteuer in der Schweiz"},
      {v: "B", t: "Die Ölkrise von 1973/74, die zu einem massiven Angebotsschock führte"},
      {v: "C", t: "Der Zusammenbruch des Bretton-Woods-Systems 1944"},
      {v: "D", t: "Der Beitritt der Schweiz zur UNO"}
    ],
    correct: "B",
    explain: "Die Ölkrise 1973/74 war ein klassischer realer Angebotsschock: Die OPEC-Länder drosselten die Ölproduktion, was zu einem massiven Preisanstieg bei Erdöl führte. Dies traf die Schweizer Wirtschaft besonders hart und verursachte einen der stärksten Einbrüche seit dem Zweiten Weltkrieg."
  },
  {
    id: "z09", topic: "zyklus", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "In der Stagnationsphase des Konjunkturzyklus hat die Wirtschaft ihren Höhepunkt erreicht und das Wachstum verlangsamt sich.",
    correct: true,
    explain: "Die Stagnation ist die Phase zwischen Hochkonjunktur und Abschwung. Die Wirtschaft hat ihren Höhepunkt erreicht, die Wachstumsraten nehmen ab, aber die Wirtschaftsleistung ist noch hoch. Es ist der Wendepunkt vom Boom zum Abschwung."
  },
  {
    id: "z10", topic: "zyklus", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Betrachtet man die BIP-Entwicklung verschiedener Länder (Schweiz, Euroraum, USA, UK, Japan) von 2012 bis 2021: Was fällt beim Einbruch 2020 (Corona-Pandemie) besonders auf?",
    options: [
      {v: "A", t: "Japan war als einziges Land nicht betroffen."},
      {v: "B", t: "Die USA erholten sich langsamer als alle europäischen Länder."},
      {v: "C", t: "Die Schweiz hatte den stärksten Einbruch aller dargestellten Länder."},
      {v: "D", t: "Das Vereinigte Königreich erlitt den stärksten Einbruch, die Schweiz einen vergleichsweise milden."}
    ],
    correct: "D",
    explain: "Die BIP-Entwicklung zeigt, dass das Vereinigte Königreich 2020 den stärksten Einbruch der dargestellten Länder erlitt, während die Schweiz vergleichsweise mild betroffen war. Die Unterschiede erklären sich durch die unterschiedliche Wirtschaftsstruktur, die Strenge der Lockdowns und die Wirksamkeit der Stützungsmassnahmen."
  },

  // ════════════════════════════════════════════════════════════
  //  TOPIC: indikatoren – Konjunkturindikatoren
  // ════════════════════════════════════════════════════════════

  {
    id: "i01", topic: "indikatoren", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was sind Konjunkturindikatoren?",
    options: [
      {v: "A", t: "Instrumente der Nationalbank zur Geldmengensteuerung"},
      {v: "B", t: "Politische Massnahmen zur Steuerung der Konjunktur"},
      {v: "C", t: "Wirtschaftliche Kennzahlen, die den aktuellen Stand oder die künftige Entwicklung der Konjunktur anzeigen"},
      {v: "D", t: "Gesetze, die das Wirtschaftswachstum regulieren"}
    ],
    correct: "C",
    explain: "Konjunkturindikatoren sind wirtschaftliche Kennzahlen, die Auskunft über den aktuellen Stand der Konjunktur geben oder Hinweise auf die zukünftige Entwicklung liefern. Sie helfen bei der Einschätzung, in welcher Phase des Konjunkturzyklus sich eine Volkswirtschaft befindet."
  },
  {
    id: "i02", topic: "indikatoren", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "Was unterscheidet Frühindikatoren von Spätindikatoren?",
    options: [
      {v: "A", t: "Frühindikatoren zeigen die Konjunkturentwicklung vor dem BIP an, Spätindikatoren reagieren erst nach dem BIP."},
      {v: "B", t: "Frühindikatoren messen den Konsum, Spätindikatoren die Investitionen."},
      {v: "C", t: "Frühindikatoren gelten nur für die Schweiz, Spätindikatoren für das Ausland."},
      {v: "D", t: "Frühindikatoren sind genauer als Spätindikatoren."}
    ],
    correct: "A",
    explain: "Frühindikatoren (vorlaufende Indikatoren) verändern sich vor dem Konjunkturverlauf und ermöglichen Prognosen. Spätindikatoren (nachlaufende Indikatoren) reagieren erst mit Verzögerung auf die Konjunkturentwicklung. So zeigt etwa die Arbeitslosenquote als Spätindikator den Abschwung erst an, wenn er bereits eingesetzt hat."
  },
  {
    id: "i03", topic: "indikatoren", type: "multi",
    img: {src: "img/vwl/konjunktur/konjunktur_indikatoren_01.svg", alt: "Konjunkturindikatoren: Zeitliche Einordnung"}, diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden Grössen gelten als Frühindikatoren der Konjunktur? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Auftragseingänge in der Industrie"},
      {v: "B", t: "Geschäftsklimaindex (z.B. KOF-Konjunkturbarometer)"},
      {v: "C", t: "Arbeitslosenquote"},
      {v: "D", t: "Konsumentenstimmung"}
    ],
    correct: ["A", "B", "D"],
    explain: "Auftragseingänge (A), Geschäftsklimaindizes (B) und die Konsumentenstimmung (D) sind Frühindikatoren: Sie verändern sich vor dem tatsächlichen Konjunkturverlauf. Die Arbeitslosenquote (C) ist dagegen ein klassischer Spätindikator, da der Arbeitsmarkt erst mit Verzögerung auf Konjunkturveränderungen reagiert."
  },
  {
    id: "i04", topic: "indikatoren", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Die Arbeitslosenquote ist ein typischer Frühindikator der Konjunktur.",
    correct: false,
    explain: "Falsch. Die Arbeitslosenquote ist ein Spätindikator. Der Arbeitsmarkt reagiert erfahrungsgemäss mit mehrmonatiger Verzögerung auf die allgemeine Konjunkturentwicklung. Unternehmen passen ihren Personalbestand erst an, wenn sich die wirtschaftliche Lage bereits verändert hat (z.B. durch Kurzarbeit als Puffer)."
  },
  {
    id: "i05", topic: "indikatoren", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Die Expertengruppe des Bundes prognostizierte im März 2022 für das Jahr 2022 ein BIP-Wachstum von 2.8% (sporteventbereinigt). Wie ist diese Prognose einzuordnen?",
    options: [
      {v: "A", t: "Die Wirtschaft befindet sich in einer Depression."},
      {v: "B", t: "Dies signalisiert eine schwere Rezession."},
      {v: "C", t: "Dies ist ein historisch einmalig hohes Wachstum."},
      {v: "D", t: "Es handelt sich um eine Erholungsphase nach dem Corona-Einbruch 2020 mit nachlassender Dynamik."}
    ],
    correct: "D",
    explain: "Nach dem BIP-Einbruch von –2.6% (2020) und der kräftigen Erholung von 3.6% (2021) zeigte die Prognose von 2.8% für 2022 eine Fortsetzung der Erholung, allerdings mit nachlassender Dynamik. Die vorherige Prognose lag noch bei 3.0%, was die leichte Abschwächung bestätigt."
  },
  {
    id: "i06", topic: "indikatoren", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Konjunkturindikatoren, die sich vor dem BIP verändern und Prognosen ermöglichen, heissen {0}. Indikatoren, die dem BIP hinterherhinken, heissen {1}.",
    blanks: [
      {answer: "Frühindikatoren", alts: ["vorlaufende Indikatoren", "Fruhindikatoren"]},
      {answer: "Spätindikatoren", alts: ["nachlaufende Indikatoren", "Spatindikatoren"]}
    ],
    explain: "Frühindikatoren (vorlaufend) zeigen die Konjunkturentwicklung im Voraus an (z.B. Auftragseingänge, Geschäftsklima). Spätindikatoren (nachlaufend) reagieren erst mit Verzögerung (z.B. Arbeitslosenquote, Steuereinnahmen)."
  },
  {
    id: "i07", topic: "indikatoren", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Warum sind Konjunkturprognosen grundsätzlich mit Unsicherheit behaftet?",
    options: [
      {v: "A", t: "Weil Ökonomen absichtlich falsche Prognosen erstellen."},
      {v: "B", t: "Weil nur das BIP gemessen wird und keine anderen Grössen."},
      {v: "C", t: "Weil Konjunkturprognosen nur für grosse Volkswirtschaften erstellt werden können."},
      {v: "D", t: "Weil die Wirtschaft von vielen unvorhersehbaren Faktoren beeinflusst wird und Prognosemodelle die Realität nur vereinfacht abbilden."}
    ],
    correct: "D",
    explain: "Konjunkturprognosen sind unsicher, weil die Wirtschaft ein komplexes System ist: Unvorhergesehene Ereignisse (Kriege, Pandemien, Finanzkrisen), psychologische Faktoren (Stimmungsumschwünge) und politische Entscheide können die Entwicklung jederzeit verändern. Prognosemodelle bilden die Realität nur vereinfacht ab."
  },
  {
    id: "i08", topic: "indikatoren", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Das KOF-Konjunkturbarometer der ETH Zürich ist ein Beispiel für einen Frühindikator der Schweizer Konjunktur.",
    correct: true,
    explain: "Richtig. Das KOF-Konjunkturbarometer wird von der Konjunkturforschungsstelle der ETH Zürich erstellt und basiert auf Umfragen bei Unternehmen. Es gilt als einer der wichtigsten Frühindikatoren für die Schweizer Konjunktur und soll die Entwicklung des BIP vorhersagen."
  },
  {
    id: "i09", topic: "indikatoren", type: "multi", diff: 3, tax: "K4",
 reviewed:false,
    q: "Welche Aussagen zur Inflationsentwicklung verschiedener Länder (2008–2022) treffen zu? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Die Schweiz hatte durchgehend die tiefsten Inflationsraten im Vergleich zu Euroraum, USA und UK."},
      {v: "B", t: "Ab 2021 stiegen die Inflationsraten in allen dargestellten Ländern stark an."},
      {v: "C", t: "Die Schweiz erlebte in mehreren Jahren eine negative Teuerung (Deflation)."},
      {v: "D", t: "Die Inflationsraten aller Länder verlaufen immer identisch."}
    ],
    correct: ["A", "B", "C"],
    explain: "A ist korrekt: Die Schweiz hatte dank der starken Währung und der SNB-Politik durchgehend tiefere Inflationsraten. B ist korrekt: Ab 2021 stiegen die Raten aufgrund von Lieferkettenproblemen, Energiepreisen und Nachholeffekten nach Corona stark an. C ist korrekt: Die Schweiz erlebte mehrfach negative Teuerungsraten (z.B. 2015–2016). D ist falsch: Die Verläufe unterscheiden sich deutlich."
  },
  {
    id: "i10", topic: "indikatoren", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Warum wird die Arbeitslosenquote als Spätindikator der Konjunktur bezeichnet?",
    options: [
      {v: "A", t: "Weil die Arbeitslosenquote nur einmal jährlich erhoben wird."},
      {v: "B", t: "Weil die Arbeitslosenquote von der Nationalbank berechnet wird."},
      {v: "C", t: "Weil der Arbeitsmarkt erst mit Verzögerung auf Konjunkturveränderungen reagiert, z.B. durch Kurzarbeit als Puffer."},
      {v: "D", t: "Weil die Arbeitslosenquote nur die Jugendarbeitslosigkeit misst."}
    ],
    correct: "C",
    explain: "Der Arbeitsmarkt folgt dem allgemeinen Konjunkturtrend mit mehrmonatiger Verzögerung. Unternehmen setzen zuerst Instrumente wie Kurzarbeit, Überstundenabbau oder Einstellungsstopps ein, bevor sie Entlassungen vornehmen. Umgekehrt werden im Aufschwung zuerst bestehende Mitarbeitende mehr beschäftigt, bevor neue eingestellt werden."
  },

  // ════════════════════════════════════════════════════════════
  //  TOPIC: ursachen – Ursachen für Konjunkturschwankungen
  // ════════════════════════════════════════════════════════════

  {
    id: "u01", topic: "ursachen", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was besagt die Theorie der realen Schocks als Ursache von Konjunkturschwankungen?",
    options: [
      {v: "A", t: "Konjunkturschwankungen entstehen durch unerwartete reale Störungen wie Katastrophen oder technologische Durchbrüche."},
      {v: "B", t: "Konjunkturschwankungen werden ausschliesslich durch die Geldpolitik verursacht."},
      {v: "C", t: "Konjunkturschwankungen sind rein zufällig und haben keine Ursachen."},
      {v: "D", t: "Konjunkturschwankungen entstehen nur durch politische Wahlen."}
    ],
    correct: "A",
    explain: "Die Theorie realer Schocks erklärt Konjunkturschwankungen als Folge von unerwarteten realen Störungen und Veränderungen. Beispiele sind Katastrophen (Ölknappheit, Überschwemmungen, Kriege) oder technologische Innovationen (Dampfmaschine, Computer, Penicillin)."
  },
  {
    id: "u02", topic: "ursachen", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Was besagt die Überinvestitionstheorie?",
    options: [
      {v: "A", t: "Wenn der Staat zu viel investiert, verdrängt er private Investitionen."},
      {v: "B", t: "Wenn die Zentralbank die Zinsen zu hoch setzt, bricht die Investitionstätigkeit ein."},
      {v: "C", t: "Wenn Konsumenten zu viel sparen, fehlen Investitionen."},
      {v: "D", t: "Wenn die Kreditzinsen unter der erwarteten Rendite liegen, bauen Unternehmen ihre Produktionskapazitäten zu stark aus."}
    ],
    correct: "D",
    explain: "Die Überinvestitionstheorie besagt: Wenn die Kreditzinsen niedriger sind als die erwartete Rendite der Investitionen, bauen Unternehmen ihre Produktionskapazitäten zu stark aus. Es entsteht ein Überangebot, das anschliessend zu einem Einbruch und damit zu einer Rezession führt."
  },
  {
    id: "u03", topic: "ursachen", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Was besagt die Unterkonsumtionstheorie?",
    options: [
      {v: "A", t: "Die Konsumenten kaufen zu viel, was zu Inflation führt."},
      {v: "B", t: "Hohe Löhne führen zu Überkonsum und damit zu Konjunkturschwankungen."},
      {v: "C", t: "Der Staat konsumiert zu wenig und bremst damit die Wirtschaft."},
      {v: "D", t: "Durch niedriges Lohnwachstum und niedrige Konsumneigung wächst die Nachfrage im Aufschwung zu langsam."}
    ],
    correct: "D",
    explain: "Die Unterkonsumtionstheorie sieht die Ursache für Rezessionen in einem zu geringen Konsum: Niedriges Lohnwachstum und eine niedrige Konsumneigung (hohe Sparquote) führen dazu, dass die Nachfrage im Aufschwung nicht mit dem wachsenden Angebot mithalten kann."
  },
  {
    id: "u04", topic: "ursachen", type: "multi",
    img: {src: "img/vwl/konjunktur/konjunktur_ursachen_01.svg", alt: "Ursachen von Konjunkturschwankungen"}, diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden Beispiele sind «reale Schocks», die Konjunkturschwankungen auslösen können? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Eine Ölknappheit durch einen Krieg im Nahen Osten"},
      {v: "B", t: "Eine Zinssenkung durch die Nationalbank"},
      {v: "C", t: "Die Erfindung des Computers"},
      {v: "D", t: "Eine verheerende Überschwemmung"}
    ],
    correct: ["A", "C", "D"],
    explain: "Reale Schocks sind unerwartete Störungen in der realen Wirtschaft: Ölknappheit (A), technologische Innovationen wie der Computer (C) und Naturkatastrophen wie Überschwemmungen (D). Eine Zinssenkung (B) ist dagegen ein geldpolitisches Instrument und damit ein monetärer, kein realer Schock."
  },
  {
    id: "u05", topic: "ursachen", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
    q: "Die politische Konjunkturtheorie besagt, dass Regierungen vor Wahlen die Staatsausgaben erhöhen, um die Konjunktur anzukurbeln.",
    correct: true,
    explain: "Richtig. Die politische Konjunkturtheorie geht davon aus, dass Politiker ein Interesse haben, vor Wahlen die Wirtschaft zu stimulieren (z.B. durch höhere Staatsausgaben), um wiedergewählt zu werden. Nach den Wahlen wird dann gespart, was die Konjunktur dämpft. Der Grundgedanke: Wähler haben ein kurzes Gedächtnis."
  },
  {
    id: "u06", topic: "ursachen", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Was besagt die monetäre Konjunkturtheorie?",
    options: [
      {v: "A", t: "Veränderungen der Geldmenge können kurzfristig die Realwirtschaft beeinflussen, gemäss der Quantitätsgleichung MV = PY."},
      {v: "B", t: "Geld hat keinen Einfluss auf die Wirtschaft."},
      {v: "C", t: "Die Geldmenge muss jedes Jahr gleich stark wachsen wie das BIP."},
      {v: "D", t: "Nur die Fiskalpolitik kann die Konjunktur beeinflussen, nicht die Geldpolitik."}
    ],
    correct: "A",
    explain: "Die monetäre Konjunkturtheorie basiert auf der Quantitätsgleichung MV = PY (Geldmenge × Umlaufgeschwindigkeit = Preisniveau × reales BIP). Wenn sich M ändert und V/P kurzfristig konstant sind, ändert sich auch Y (das reale BIP). Mittel- bis langfristig beeinflusst die Geldpolitik allerdings nur das Preisniveau."
  },
  {
    id: "u07", topic: "ursachen", type: "fill", diff: 2, tax: "K2",
 reviewed:false,
    q: "In der Quantitätsgleichung MV = PY steht M für {0}, V für {1}, P für {2} und Y für {3}.",
    blanks: [
      {answer: "Geldmenge", alts: ["die Geldmenge"]},
      {answer: "Umlaufgeschwindigkeit", alts: ["die Umlaufgeschwindigkeit", "Geldumlaufgeschwindigkeit"]},
      {answer: "Preisniveau", alts: ["Preise", "das Preisniveau"]},
      {answer: "reales BIP", alts: ["BIP", "Bruttoinlandprodukt", "reale Wirtschaftsleistung"]}
    ],
    explain: "Die Quantitätsgleichung MV = PY beschreibt den Zusammenhang zwischen Geldmenge (M), Umlaufgeschwindigkeit des Geldes (V), Preisniveau (P) und realem BIP (Y). Sie ist zentral für die monetäre Konjunkturtheorie."
  },
  {
    id: "u08", topic: "ursachen", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Über welche Kanäle wirkte die Corona-Pandemie 2020 auf die Konjunktur?",
    options: [
      {v: "A", t: "Ausschliesslich als Nachfrageschock, weil die Menschen weniger konsumierten."},
      {v: "B", t: "Gleichzeitig als Angebots- und Nachfrageschock: Lockdowns reduzierten Produktion und Konsum, internationale Lieferketten brachen ein."},
      {v: "C", t: "Ausschliesslich als Angebotsschock, weil die Produktion einbrach."},
      {v: "D", t: "Die Corona-Pandemie hatte keine messbaren Auswirkungen auf die Konjunktur."}
    ],
    correct: "B",
    explain: "Die Corona-Pandemie war einzigartig, weil sie gleichzeitig als Angebots- und Nachfrageschock wirkte. Angebotsseite: Lockdowns legten die Produktion lahm, Lieferketten brachen ein. Nachfrageseite: Konsumenten konnten und wollten weniger kaufen (geschlossene Geschäfte, Unsicherheit). Zusätzlich kam es zu internationalen Verwerfungen im Handel."
  },
  {
    id: "u09", topic: "ursachen", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Psychologische Faktoren wie Pessimismus und Unsicherheit können als konjunkturelle Verstärker wirken.",
    correct: true,
    explain: "Richtig. Psychologische Verstärker spielen eine wichtige Rolle bei Konjunkturschwankungen. Unsicherheit über die Zukunft kann zu Pessimismus führen: Konsumenten verschieben Käufe, Unternehmen verschieben Investitionen. Dies verstärkt einen bereits eingesetzten Abschwung. Umgekehrt kann Optimismus einen Aufschwung verstärken."
  },
  {
    id: "u10", topic: "ursachen", type: "multi", diff: 3, tax: "K4",
 reviewed:false,
    q: "Welche Konjunkturtheorien erklären Schwankungen primär durch nachfrageseitige Faktoren? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Unterkonsumtionstheorie"},
      {v: "B", t: "Theorie realer Schocks"},
      {v: "C", t: "Psychologische Theorien (Pessimismus der Konsumenten)"},
      {v: "D", t: "Überinvestitionstheorie"}
    ],
    correct: ["A", "C"],
    explain: "Die Unterkonsumtionstheorie (A) sieht zu geringe Nachfrage (Konsum) als Ursache. Psychologische Theorien (C) betonen die Rolle von Konsumenten- und Investorenstimmung. Die Theorie realer Schocks (B) umfasst sowohl Angebots- als auch Nachfragefaktoren. Die Überinvestitionstheorie (D) erklärt Schwankungen primär angebotsseitig (zu viele Produktionskapazitäten)."
  },
  {
    id: "u11", topic: "ursachen", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    img: {src: "img/vwl/konjunktur/konjunktur_ursachen_01.svg", alt: "Ursachen von Konjunkturschwankungen"},
    q: "Wie nennt man unerwartete Ereignisse wie Ölkrisen, Naturkatastrophen oder Pandemien, die die Konjunktur stark beeinflussen?",
    options: [
      {v: "A", t: "Reale Schocks"},
      {v: "B", t: "Monetäre Impulse"},
      {v: "C", t: "Strukturelle Anpassungen"},
      {v: "D", t: "Konjunkturelle Normalschwankungen"}
    ],
    correct: "A",
    explain: "Reale Schocks sind unerwartete, einmalige Ereignisse, die das Angebot und/oder die Nachfrage plötzlich und stark verändern. Beispiele sind die Ölkrise (1973), Naturkatastrophen oder die Corona-Pandemie (2020). Sie gelten als eine der Hauptursachen für Konjunkturschwankungen."
  },

  // ════════════════════════════════════════════════════════════
  //  TOPIC: klassiker – Klassische Konzeption
  // ════════════════════════════════════════════════════════════

  {
    id: "k01", topic: "klassiker", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was ist der Kerngedanke der klassischen Konjunkturpolitik?",
    options: [
      {v: "A", t: "Der Staat muss aktiv die Nachfrage steuern."},
      {v: "B", t: "Die Zentralbank soll die Geldmenge stetig erhöhen."},
      {v: "C", t: "Märkte regulieren sich selbst, der Staat soll nicht in die Konjunktur eingreifen."},
      {v: "D", t: "Konjunkturschwankungen existieren in einer freien Marktwirtschaft nicht."}
    ],
    correct: "C",
    explain: "Die Klassiker (z.B. Adam Smith, Jean-Baptiste Say) vertrauen auf die Selbstheilungskräfte des Marktes. Über den Preismechanismus (flexible Preise, Löhne, Zinsen) gleichen sich Angebot und Nachfrage von selbst aus. Staatliche Eingriffe in die Konjunktur sind demnach unnötig oder sogar schädlich."
  },
  {
    id: "k02", topic: "klassiker", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
    q: "Gemäss dem Sayschen Theorem («Saysches Gesetz») schafft sich jedes Angebot seine eigene Nachfrage.",
    correct: true,
    explain: "Richtig. Das Saysche Theorem (nach Jean-Baptiste Say) besagt: Jede Produktion erzeugt in gleicher Höhe Einkommen, das wieder für den Kauf von Gütern verwendet wird. Damit kann es gemäss den Klassikern keine dauerhafte Überproduktion geben — der Markt tendiert zum Gleichgewicht bei Vollbeschäftigung."
  },
  {
    id: "k03", topic: "klassiker", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Rolle spielen flexible Preise in der klassischen Konzeption?",
    options: [
      {v: "A", t: "Flexible Preise führen zwangsläufig zu Inflation."},
      {v: "B", t: "Preisflexibilität ist in der klassischen Theorie irrelevant."},
      {v: "C", t: "Flexible Preise, Löhne und Zinsen sorgen dafür, dass sich der Markt selbst ins Gleichgewicht bringt."},
      {v: "D", t: "Preise müssen vom Staat festgelegt werden, um Konjunkturschwankungen zu vermeiden."}
    ],
    correct: "C",
    explain: "In der klassischen Konzeption sind flexible Preise der zentrale Anpassungsmechanismus: Bei Überangebot sinken die Preise, bei Übernachfrage steigen sie. Flexible Löhne sorgen für Gleichgewicht am Arbeitsmarkt, flexible Zinsen gleichen Sparen und Investieren aus. So kehrt die Wirtschaft immer zum Gleichgewicht bei Vollbeschäftigung zurück."
  },
  {
    id: "k04", topic: "klassiker", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Die Klassiker befürworten eine aktive staatliche Konjunkturpolitik, um Rezessionen zu bekämpfen.",
    correct: false,
    explain: "Falsch. Die Klassiker lehnen aktive staatliche Konjunkturpolitik ab. Sie vertrauen auf die Selbstheilungskräfte des Marktes: Durch flexible Preise, Löhne und Zinsen gleicht sich der Markt von selbst aus. Staatliche Eingriffe würden diesen Anpassungsprozess nur stören und verzögern."
  },
  {
    id: "k05", topic: "klassiker", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
    q: "Welche Kritik wird häufig an der klassischen Konzeption geübt?",
    options: [
      {v: "A", t: "Die Theorie berücksichtigt die Inflation zu stark."},
      {v: "B", t: "Die Klassiker fordern zu viel staatliche Regulierung."},
      {v: "C", t: "In der Realität sind Preise und Löhne nicht vollständig flexibel, weshalb Anpassungen lange dauern und mit hoher Arbeitslosigkeit verbunden sein können."},
      {v: "D", t: "Der Markt reagiert zu schnell, sodass die Wirtschaft nie zur Ruhe kommt."}
    ],
    correct: "C",
    explain: "Die Hauptkritik an der klassischen Konzeption (besonders von Keynes): In der Realität sind Preise und Löhne nach unten starr (Lohnrigidität, Tarifverträge, Mindestlöhne). Der Selbstheilungsprozess kann daher sehr lange dauern und ist mit hoher Arbeitslosigkeit und sozialem Leid verbunden. Die Grosse Depression der 1930er-Jahre zeigte die Grenzen des klassischen Ansatzes."
  },

  {
    id: "k06", topic: "klassiker", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Gemäss dem Sayschen Theorem schafft sich jedes {0} seine eigene {1}.",
    blanks: [
      {answer: "Angebot", alts: []},
      {answer: "Nachfrage", alts: []}
    ],
    explain: "Das Saysche Theorem (nach Jean-Baptiste Say) besagt, dass jede Produktion (Angebot) in gleicher Höhe Einkommen schafft, das dann wieder für den Kauf von Gütern (Nachfrage) verwendet wird. Daher kann es gemäss den Klassikern keine dauerhafte Überproduktion geben."
  },
  {
    id: "k07", topic: "klassiker", type: "multi",
    img: {src: "img/vwl/konjunktur/konjunktur_klassiker_01.svg", alt: "Klassische Konzeption: Selbstheilungskräfte"}, diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Anpassungsmechanismen sorgen gemäss der klassischen Konzeption für ein Gleichgewicht? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Flexible Güterpreise gleichen Angebot und Nachfrage auf dem Gütermarkt aus."},
      {v: "B", t: "Flexible Löhne sorgen für Gleichgewicht auf dem Arbeitsmarkt."},
      {v: "C", t: "Staatliche Preiskontrollen verhindern Marktschwankungen."},
      {v: "D", t: "Flexible Zinsen gleichen Sparen und Investieren aus."}
    ],
    correct: ["A", "B", "D"],
    explain: "In der klassischen Konzeption sind drei Flexibilitäten zentral: Flexible Güterpreise (A) für den Gütermarkt, flexible Löhne (B) für den Arbeitsmarkt und flexible Zinsen (D) für den Kapitalmarkt. Staatliche Preiskontrollen (C) lehnen die Klassiker ab, da sie die Anpassungsmechanismen stören."
  },
  {
    id: "k08", topic: "klassiker", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Die Grosse Depression der 1930er-Jahre stellte die klassische Konzeption vor ein grosses Problem. Warum?",
    options: [
      {v: "A", t: "Die Preise stiegen während der Depression stark an."},
      {v: "B", t: "Der Staat hatte bereits massiv in die Wirtschaft eingegriffen."},
      {v: "C", t: "Die Geldmenge war zu hoch und verursachte Inflation."},
      {v: "D", t: "Trotz fallender Preise und Löhne kehrte die Wirtschaft nicht zum Gleichgewicht zurück — die Arbeitslosigkeit blieb jahrelang extrem hoch."}
    ],
    correct: "D",
    explain: "Die Grosse Depression zeigte die Grenzen der klassischen Theorie: Obwohl Preise und Löhne fielen, stellte sich kein neues Gleichgewicht ein. Die Arbeitslosigkeit blieb über Jahre extrem hoch (in den USA über 25%). Dies widersprach der Annahme, dass flexible Preise automatisch für Vollbeschäftigung sorgen — und war der Anstoss für Keynes' neue Theorie."
  },
  {
    id: "k09", topic: "klassiker", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Gemäss der klassischen Konzeption kann es auf Dauer keine unfreiwillige Arbeitslosigkeit geben, weil flexible Löhne den Arbeitsmarkt ins Gleichgewicht bringen.",
    correct: true,
    explain: "Richtig. In der klassischen Theorie gleichen flexible Löhne Angebot und Nachfrage auf dem Arbeitsmarkt aus: Bei Arbeitslosigkeit sinken die Löhne, Arbeit wird billiger, Unternehmen stellen mehr Leute ein. Im Gleichgewicht gibt es nur freiwillige Arbeitslosigkeit (wer zum Marktlohn nicht arbeiten will). Die Annahme vollständig flexibler Löhne ist jedoch die zentrale Schwachstelle dieser Theorie."
  },
  {
    id: "k10", topic: "klassiker", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
    q: "Ein zentraler Kritikpunkt an der klassischen Theorie lautet, dass Löhne «nach unten starr» sind. Was bedeutet das konkret?",
    options: [
      {v: "A", t: "Arbeitgeber dürfen Löhne rechtlich nie senken."},
      {v: "B", t: "Löhne lassen sich in der Praxis nur schwer senken, z.B. wegen Gesamtarbeitsverträgen, Mindestlöhnen und sozialen Normen."},
      {v: "C", t: "Löhne sind immer gleich hoch, unabhängig von der Konjunktur."},
      {v: "D", t: "Löhne steigen in der Praxis nie."}
    ],
    correct: "B",
    explain: "Lohnrigidität (Starrheit nach unten) bedeutet: In der Praxis können Löhne nicht einfach gesenkt werden. Gesamtarbeitsverträge, Mindestlöhne, soziale Normen und die Angst vor Motivationsverlust bei Arbeitnehmenden verhindern Lohnsenkungen. Deshalb funktioniert der klassische Anpassungsmechanismus in der Realität oft nicht — bei fehlender Nachfrage kommt es zu Entlassungen statt Lohnsenkungen."
  },

  // ════════════════════════════════════════════════════════════
  //  TOPIC: keynes – Keynesianische Konzeption
  // ════════════════════════════════════════════════════════════

  {
    id: "j01", topic: "keynes", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was ist der zentrale Ansatz der keynesianischen Konjunkturpolitik?",
    options: [
      {v: "A", t: "Der Staat soll in der Rezession die Ausgaben kürzen und Schulden abbauen."},
      {v: "B", t: "Der Staat soll in der Rezession die Nachfrage durch höhere Ausgaben und tiefere Steuern stützen."},
      {v: "C", t: "Der Staat soll die Wirtschaft vollständig deregulieren."},
      {v: "D", t: "Die Zentralbank soll in der Rezession die Geldmenge einschränken."}
    ],
    correct: "B",
    explain: "John Maynard Keynes argumentierte, dass der Staat in Krisenzeiten für die fehlende private Nachfrage einspringen muss. Durch höhere Staatsausgaben und tiefere Steuern wird die Gesamtnachfrage gestützt, um die Wirtschaft zu stabilisieren und Arbeitslosigkeit zu bekämpfen (nachfrageorientierte/antizyklische Fiskalpolitik)."
  },
  {
    id: "j02", topic: "keynes", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Was versteht man unter «antizyklischer Fiskalpolitik»?",
    options: [
      {v: "A", t: "Der Staat hält seine Ausgaben unabhängig von der Konjunkturlage konstant."},
      {v: "B", t: "Der Staat greift nur in die Geldpolitik ein, nicht in die Fiskalpolitik."},
      {v: "C", t: "Der Staat spart in der Rezession und gibt in der Hochkonjunktur mehr aus."},
      {v: "D", t: "Der Staat gibt in der Rezession mehr aus und spart in der Hochkonjunktur, um die Konjunktur zu glätten."}
    ],
    correct: "D",
    explain: "Antizyklische Fiskalpolitik bedeutet «gegen den Zyklus»: In der Rezession erhöht der Staat die Ausgaben und senkt die Steuern (expansive Fiskalpolitik, akzeptiert Defizite). In der Hochkonjunktur senkt er die Ausgaben und erhöht ggf. die Steuern (restriktive Fiskalpolitik, erzielt Überschüsse). Ziel: Glättung der Konjunkturschwankungen."
  },
  {
    id: "j03", topic: "keynes", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Was ist der keynesianische Multiplikator?",
    options: [
      {v: "A", t: "Ein Indikator, der die Inflationsrate misst."},
      {v: "B", t: "Die Rate, mit der die Geldmenge jährlich wächst."},
      {v: "C", t: "Der Anteil der Exporte am BIP."},
      {v: "D", t: "Ein Mechanismus, der bewirkt, dass eine zusätzliche Staatsausgabe das BIP um ein Vielfaches dieser Ausgabe erhöht."}
    ],
    correct: "D",
    explain: "Der keynesianische Multiplikator beschreibt, wie eine anfängliche Ausgabe (z.B. Staatsausgabe) durch mehrfache Einkommens- und Ausgabenrunden das BIP um ein Vielfaches erhöht. Beispiel: Eine Ausgabe von 1 Mrd. CHF kann das BIP um 1.5–2 Mrd. CHF steigern, weil die Empfänger einen Teil des Geldes wieder ausgeben."
  },
  {
    id: "j04", topic: "keynes", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Keynes hielt es für notwendig, dass der Staat in der Rezession Budgetdefizite in Kauf nimmt, um die Nachfrage zu stützen.",
    correct: true,
    explain: "Richtig. Keynes argumentierte, dass der Staat in der Rezession die Ausgaben erhöhen und Steuern senken muss, auch wenn dies zu einem Budgetdefizit führt. Die Defizite sollten dann in der Hochkonjunktur durch Budgetüberschüsse wieder ausgeglichen werden. Dieses Prinzip ist der Kern der antizyklischen Fiskalpolitik."
  },
  {
    id: "j05", topic: "keynes", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Gemäss der keynesianischen Konzeption bestimmt die gesamtwirtschaftliche {0} den Grad der Beschäftigung und die Wirtschaftsleistung.",
    blanks: [
      {answer: "Nachfrage", alts: ["Gesamtnachfrage", "Nachfrageseite"]}
    ],
    explain: "In der keynesianischen Konzeption ist die gesamtwirtschaftliche Nachfrage (Konsum + Investitionen + Staatsausgaben + Nettoexporte) die bestimmende Grösse für Produktion und Beschäftigung. Bei einem Nachfragedefizit kommt es zu Unterauslastung und Arbeitslosigkeit."
  },
  {
    id: "j06", topic: "keynes", type: "multi",
    img: {src: "img/vwl/konjunktur/konjunktur_keynes_01.svg", alt: "Keynesianische Konzeption: Antizyklische Fiskalpolitik"}, diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Massnahmen empfiehlt die keynesianische Konzeption in einer Rezession? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Erhöhung der Staatsausgaben (z.B. Infrastrukturprojekte)"},
      {v: "B", t: "Senkung der Steuern, um den Konsum anzukurbeln"},
      {v: "C", t: "Kürzung der Sozialleistungen, um den Staatshaushalt zu sanieren"},
      {v: "D", t: "Budgetdefizite akzeptieren, um die Nachfrage zu stützen"}
    ],
    correct: ["A", "B", "D"],
    explain: "In einer Rezession empfiehlt die keynesianische Konzeption expansive Fiskalpolitik: höhere Staatsausgaben (A), tiefere Steuern (B) und die Akzeptanz von Budgetdefiziten (D). Die Kürzung von Sozialleistungen (C) wäre kontraproduktiv, da sie die Nachfrage weiter senken würde (prozyklisch statt antizyklisch)."
  },
  {
    id: "j07", topic: "keynes", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
    q: "Warum wird die keynesianische Konjunkturpolitik in der Praxis oft kritisiert?",
    options: [
      {v: "A", t: "Weil Keynes grundsätzlich gegen jede Form von Staatsausgaben war."},
      {v: "B", t: "Weil der Multiplikator in der Praxis nie funktioniert."},
      {v: "C", t: "Weil Regierungen in guten Zeiten oft nicht sparen (Defizitbias), Massnahmen zu spät greifen und politische Entscheidungen nicht rein ökonomisch motiviert sind."},
      {v: "D", t: "Weil die Theorie nur für kleine Volkswirtschaften gilt."}
    ],
    correct: "C",
    explain: "Die Hauptkritik: In der Praxis funktioniert die «Symmetrie» der antizyklischen Politik oft nicht — Regierungen geben in der Rezession mehr aus, sparen aber in der Hochkonjunktur nicht (Defizitbias). Zudem kommen Massnahmen oft zu spät (time lags), sind schwer dosierbar und werden von politischen statt ökonomischen Motiven geleitet."
  },
  {
    id: "j08", topic: "keynes", type: "tf", diff: 3, tax: "K4",
 reviewed:false,
    q: "Die «Liquiditätsfalle» beschreibt eine Situation, in der die Geldpolitik wirkungslos wird, weil die Zinsen bereits bei oder nahe null liegen.",
    correct: true,
    explain: "Richtig. In einer Liquiditätsfalle sind die Zinsen so tief (bei/nahe null), dass weitere Zinssenkungen nicht möglich oder wirkungslos sind. Menschen und Unternehmen horten Geld statt es auszugeben oder zu investieren. In dieser Situation empfahl Keynes, dass die Fiskalpolitik (Staatsausgaben) die Rolle der Konjunktursteuerung übernehmen muss."
  },
  {
    id: "j09", topic: "keynes", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Welche Situation bildete den historischen Hintergrund für die Entstehung der keynesianischen Theorie?",
    options: [
      {v: "A", t: "Die Ölkrise der 1970er-Jahre"},
      {v: "B", t: "Die Finanzkrise 2008/09"},
      {v: "C", t: "Die Grosse Depression der 1930er-Jahre, in der die klassische Selbstregulierung versagte"},
      {v: "D", t: "Die Dotcom-Blase der 2000er-Jahre"}
    ],
    correct: "C",
    explain: "Die keynesianische Theorie entstand als Reaktion auf die Grosse Depression der 1930er-Jahre. Die Massenarbeitslosigkeit und der lang anhaltende Wirtschaftseinbruch zeigten, dass die klassische Theorie der Selbstregulierung in dieser Krise nicht funktionierte. Keynes' «General Theory» (1936) lieferte eine Erklärung und politische Handlungsempfehlungen."
  },
  {
    id: "j10", topic: "keynes", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Der Bundesrat lancierte 2008/09 ein stufenweises Stabilisierungsprogramm gegen die Finanzkrise. Welcher konjunkturpolitische Ansatz stand dabei im Vordergrund?",
    options: [
      {v: "A", t: "Monetaristisch: Erhöhung der Geldmenge durch die SNB"},
      {v: "B", t: "Klassisch: Abwarten und auf die Selbstheilungskräfte des Marktes vertrauen"},
      {v: "C", t: "Angebotsorientiert: Deregulierung und Steuersenkungen für Unternehmen"},
      {v: "D", t: "Keynesianisch: Erhöhung der Staatsausgaben und Vorziehen von Investitionen zur Stützung der Nachfrage"}
    ],
    correct: "D",
    explain: "Das Stabilisierungsprogramm des Bundesrates (Stufe 1: 900 Mio., Stufe 2: 700 Mio.) war primär keynesianisch orientiert: Vorziehen öffentlicher Investitionen (Strasse, Schiene, Hochwasserschutz), Aufhebung von Kreditsperren, steuerliche Entlastungen. Ziel war die Stützung der Gesamtnachfrage in der Rezession."
  },
  {
    id: "j11", topic: "keynes", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "John Maynard Keynes forderte, dass der Staat in einer Rezession die {0} erhöhen soll, um die fehlende private Nachfrage zu ersetzen. Diese Politik wird als {1} Fiskalpolitik bezeichnet.",
    blanks: [
      {answer: "Staatsausgaben", alts: ["Ausgaben", "öffentlichen Ausgaben"]},
      {answer: "antizyklische", alts: ["antizyklisch"]}
    ],
    explain: "Keynes argumentierte, dass in einer Rezession die private Nachfrage einbricht und der Staat durch erhöhte Staatsausgaben (z.B. Infrastrukturprojekte) einspringen muss. Diese Politik heisst «antizyklisch», weil der Staat gegen den Konjunkturzyklus handelt: In der Rezession mehr ausgeben, im Boom sparen."
  },

  // ════════════════════════════════════════════════════════════
  //  TOPIC: monetaristen – Monetaristische Konzeption
  // ════════════════════════════════════════════════════════════

  {
    id: "m01", topic: "monetaristen", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was ist der zentrale Ansatz der monetaristischen Konjunkturpolitik?",
    options: [
      {v: "A", t: "Die Geldpolitik der Zentralbank ist das wichtigste Instrument zur Beeinflussung der Konjunktur."},
      {v: "B", t: "Der Markt soll vollständig dereguliert werden."},
      {v: "C", t: "Der Staat soll die Nachfrage durch Fiskalpolitik steuern."},
      {v: "D", t: "Die Geldmenge spielt keine Rolle für die Konjunktur."}
    ],
    correct: "A",
    explain: "Die Monetaristen (v.a. Milton Friedman) betonen die zentrale Rolle der Geldpolitik. Sie argumentieren, dass Schwankungen der Geldmenge die Hauptursache von Konjunkturschwankungen sind. Die Zentralbank soll für eine stetige, voraussagbare Geldmengenentwicklung sorgen, statt aktive Fiskalpolitik zu betreiben."
  },
  {
    id: "m02", topic: "monetaristen", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Was empfehlen Monetaristen als geldpolitische Strategie?",
    options: [
      {v: "A", t: "Eine jährliche Verdopplung der Geldmenge."},
      {v: "B", t: "Die Abschaffung der Zentralbank und eine vollständige Liberalisierung des Geldmarktes."},
      {v: "C", t: "Eine starke Erhöhung der Geldmenge in jeder Rezession."},
      {v: "D", t: "Eine stetige, regelgebundene Geldmengenausweitung, die dem langfristigen Wachstum der Wirtschaft entspricht."}
    ],
    correct: "D",
    explain: "Monetaristen empfehlen eine regelgebundene Geldpolitik: Die Geldmenge soll stetig und voraussagbar wachsen, orientiert am langfristigen Wirtschaftswachstum. Diskretionäre (fallweise) geldpolitische Eingriffe führen gemäss Monetaristen eher zu Instabilität als zu Stabilität."
  },
  {
    id: "m03", topic: "monetaristen", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Monetaristen lehnen eine aktive staatliche Fiskalpolitik zur Konjunktursteuerung ab.",
    correct: true,
    explain: "Richtig. Monetaristen sind skeptisch gegenüber aktiver Fiskalpolitik. Sie argumentieren, dass staatliche Konjunkturprogramme oft zu spät wirken (time lags), schwer dosierbar sind, zu Staatsverschuldung führen und private Investitionen verdrängen können (Crowding-Out-Effekt). Stattdessen setzen sie auf stetige Geldpolitik."
  },
  {
    id: "m04", topic: "monetaristen", type: "mc",
    img: {src: "img/vwl/konjunktur/konjunktur_crowding_out_01.svg", alt: "Wirkungskette einer staatlichen Kreditaufnahme"}, diff: 2, tax: "K2",
 reviewed:false,
    q: "Was versteht man unter dem «Crowding-Out-Effekt», auf den Monetaristen häufig verweisen?",
    options: [
      {v: "A", t: "Ausländische Investoren verdrängen inländische Anleger."},
      {v: "B", t: "Staatliche Kreditaufnahme verdrängt private Investitionen, weil sie die Zinsen in die Höhe treibt."},
      {v: "C", t: "Private Unternehmen verdrängen den Staat aus dem Markt."},
      {v: "D", t: "Grosse Unternehmen verdrängen kleine Unternehmen."}
    ],
    correct: "B",
    explain: "Der Crowding-Out-Effekt beschreibt die Verdrängung privater Investitionen durch staatliche Kreditaufnahme. Wenn der Staat sich am Kapitalmarkt verschuldet, steigen die Zinsen. Höhere Zinsen machen private Investitionen teurer und unattraktiver — die staatliche Nachfrage «verdrängt» so teilweise die private Nachfrage."
  },
  {
    id: "m05", topic: "monetaristen", type: "fill", diff: 2, tax: "K1",
 reviewed:false,
    q: "Der wichtigste Vertreter des Monetarismus ist der Ökonom {0}, der an der Universität {1} lehrte.",
    blanks: [
      {answer: "Milton Friedman", alts: ["Friedman"]},
      {answer: "Chicago", alts: ["University of Chicago"]}
    ],
    explain: "Milton Friedman (1912–2006) ist der bekannteste Vertreter des Monetarismus. Er lehrte an der University of Chicago (daher auch «Chicago School»). Er erhielt 1976 den Nobelpreis für Wirtschaftswissenschaften und prägte die Wirtschaftspolitik in den 1980er-Jahren massgeblich."
  },
  {
    id: "m06", topic: "monetaristen", type: "multi",
    img: {src: "img/vwl/konjunktur/konjunktur_monetaristen_01.svg", alt: "Monetaristische Konzeption: Quantitätsgleichung"}, diff: 3, tax: "K4",
 reviewed:false,
    q: "Welche Argumente bringen Monetaristen gegen keynesianische Konjunkturprogramme vor? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Konjunkturprogramme kommen oft zu spät (time lags)."},
      {v: "B", t: "Staatliche Verschuldung verdrängt private Investitionen (Crowding-Out)."},
      {v: "C", t: "Geldpolitik ist grundsätzlich wirkungslos."},
      {v: "D", t: "Konjunkturmassnahmen lassen sich politisch oft nicht mehr rückgängig machen."}
    ],
    correct: ["A", "B", "D"],
    explain: "A, B und D sind klassische monetaristische Kritikpunkte an Konjunkturprogrammen: Time lags (Massnahmen wirken erst, wenn die Krise vorbei ist), Crowding-Out (Verdrängung privater Investitionen) und politische Irreversibilität (einmal eingeführte Ausgabenprogramme werden selten zurückgefahren). C ist falsch — Monetaristen halten Geldpolitik gerade für sehr wirksam."
  },
  {
    id: "m07", topic: "monetaristen", type: "tf", diff: 3, tax: "K4",
 reviewed:false,
    q: "Die Modern Monetary Theory (MMT) argumentiert ähnlich wie der Monetarismus, dass die Geldmenge strikt begrenzt werden muss.",
    correct: false,
    explain: "Falsch. Die MMT argumentiert gerade das Gegenteil des Monetarismus: Ein Staat, der seine eigene Währung kontrolliert, kann sich grundsätzlich unbegrenzt verschulden und sollte die Staatsausgaben stark erhöhen. Die einzige Grenze sei die Inflation. Der Monetarismus dagegen warnt vor unkontrollierter Geldmengenausweitung."
  },
  {
    id: "m08", topic: "monetaristen", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
    q: "In welcher historischen Phase gewann der Monetarismus besonders an Einfluss?",
    options: [
      {v: "A", t: "Während der Grossen Depression der 1930er-Jahre."},
      {v: "B", t: "In den 1970er-/80er-Jahren, als die Stagflation die Grenzen der keynesianischen Politik zeigte."},
      {v: "C", t: "Während des Ersten Weltkriegs."},
      {v: "D", t: "Erst in der Corona-Pandemie 2020."}
    ],
    correct: "B",
    explain: "In den 1970er-Jahren erlebten viele Länder eine Stagflation (gleichzeitige Stagnation und Inflation) — ein Phänomen, das die keynesianische Theorie nicht gut erklären konnte. Die Monetaristen (v.a. Friedman) boten eine alternative Erklärung (übermässige Geldmengenausweitung als Ursache) und gewannen massiv an Einfluss (u.a. in der Politik von Thatcher und Reagan)."
  },

  {
    id: "m09", topic: "monetaristen", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "Was ist der Kernunterschied zwischen Monetaristen und Keynesianern?",
    options: [
      {v: "A", t: "Monetaristen lehnen jede Form von Wirtschaftspolitik ab, Keynesianer auch."},
      {v: "B", t: "Monetaristen fokussieren auf den Arbeitsmarkt, Keynesianer auf den Gütermarkt."},
      {v: "C", t: "Monetaristen setzen auf Geldpolitik und regelgebundenes Handeln, Keynesianer auf Fiskalpolitik und diskretionäre Eingriffe."},
      {v: "D", t: "Es gibt keinen Unterschied, beide Schulen empfehlen das Gleiche."}
    ],
    correct: "C",
    explain: "Der Kernunterschied: Monetaristen betonen die Geldpolitik als wichtigstes Instrument und bevorzugen feste Regeln (stetige Geldmengenausweitung). Keynesianer betonen die Fiskalpolitik (Staatsausgaben, Steuern) und befürworten diskretionäre (situationsabhängige) Eingriffe. Beide erkennen Konjunkturschwankungen an, unterscheiden sich aber fundamental in der Therapie."
  },
  {
    id: "m10", topic: "monetaristen", type: "fill", diff: 2, tax: "K2",
 reviewed:false,
    q: "Der Effekt, bei dem staatliche Kreditaufnahme private Investitionen verdrängt, weil die Zinsen steigen, wird als {0}-Effekt bezeichnet.",
    blanks: [
      {answer: "Crowding-Out", alts: ["Crowding Out", "Verdrängungs"]}
    ],
    explain: "Der Crowding-Out-Effekt (Verdrängungseffekt) beschreibt, wie staatliche Kreditaufnahme am Kapitalmarkt die Zinsen erhöht und dadurch private Investitionen verdrängt. Monetaristen verwenden dieses Argument, um zu zeigen, dass keynesianische Fiskalpolitik teilweise wirkungslos ist, weil sie private Nachfrage durch staatliche Nachfrage ersetzt."
  },
  {
    id: "m11", topic: "monetaristen", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
    q: "Milton Friedman, der bekannteste Vertreter des Monetarismus, forderte eine regelgebundene Geldpolitik, bei der die Geldmenge stetig und moderat wachsen soll.",
    correct: true,
    explain: "Richtig. Friedman misstraute diskretionärer (= fallweiser) Geldpolitik, weil deren Wirkung verzögert und schwer dosierbar sei. Stattdessen forderte er eine Geldmengenregel: Die Notenbank soll die Geldmenge im Gleichschritt mit dem langfristigen Wirtschaftswachstum ausweiten — nicht mehr, nicht weniger."
  },

  // ════════════════════════════════════════════════════════════
  //  TOPIC: angebot – Angebotsorientierte Konzeption & Synthese
  // ════════════════════════════════════════════════════════════

  {
    id: "a01", topic: "angebot", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was ist der Grundgedanke der angebotsorientierten Wirtschaftspolitik?",
    options: [
      {v: "A", t: "Die Geldmenge soll stetig wachsen."},
      {v: "B", t: "Der Staat soll die Nachfrage kurzfristig steigern."},
      {v: "C", t: "Der Staat soll alle Preise festlegen."},
      {v: "D", t: "Die langfristige Verbesserung der wirtschaftlichen Rahmenbedingungen für Unternehmen steht im Vordergrund."}
    ],
    correct: "D",
    explain: "Die angebotsorientierte Konzeption (Neoklassik) betont die Verbesserung der wirtschaftlichen Rahmenbedingungen: tiefere Steuern, weniger Regulierung, flexible Arbeitsmärkte, gute Infrastruktur, Bildung und Innovation. Durch attraktive Standortbedingungen werden Investitionen und langfristiges Wachstum gefördert."
  },
  {
    id: "a02", topic: "angebot", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Massnahmen empfiehlt die angebotsorientierte Konzeption? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Senkung der Unternehmenssteuern"},
      {v: "B", t: "Deregulierung und Abbau von Bürokratie"},
      {v: "C", t: "Erhöhung der Staatsausgaben in der Rezession"},
      {v: "D", t: "Flexibilisierung des Arbeitsmarktes"}
    ],
    correct: ["A", "B", "D"],
    explain: "Die angebotsorientierte Politik setzt auf Steuersenkungen (A), Deregulierung (B) und Arbeitsmarktflexibilisierung (D), um die Standortattraktivität und Investitionsanreize zu verbessern. Die Erhöhung der Staatsausgaben in der Rezession (C) ist dagegen ein keynesianisches Instrument, das Angebotsökonomen ablehnen."
  },
  {
    id: "a03", topic: "angebot", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Angebotsökonomen vertrauen grundsätzlich auf die Selbstheilungskräfte des Marktes und lehnen kurzfristige staatliche Konjunkturmassnahmen ab.",
    correct: true,
    explain: "Richtig. Ähnlich wie die Klassiker setzen Angebotsökonomen auf die Selbstheilungskräfte des Marktes. Kurzfristige Konjunkturmassnahmen haben ihrer Meinung nach keinen nachhaltigen Effekt und verlangsamen notwendige Anpassungen. Stattdessen sollen gute Rahmenbedingungen langfristig für Wachstum und Beschäftigung sorgen."
  },
  {
    id: "a04", topic: "angebot", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Kritikpunkte bringen Angebotsökonomen gegen staatliche Konjunkturprogramme vor?",
    options: [
      {v: "A", t: "Sie wirken nur bei kleinen Volkswirtschaften."},
      {v: "B", t: "Sie sind zu billig und haben keinen messbaren Effekt."},
      {v: "C", t: "Sie kommen zu spät, sind einseitig auf bestimmte Branchen ausgerichtet, nicht richtig dosierbar und führen zu hoher Staatsverschuldung."},
      {v: "D", t: "Sie sind nur in der Hochkonjunktur sinnvoll."}
    ],
    correct: "C",
    explain: "Angebotsökonomen nennen vier Hauptprobleme von Konjunkturprogrammen: (1) Sie kommen meist zu spät (time lags), (2) sie sind einseitig auf bestimmte Branchen ausgerichtet, (3) sie lassen sich nicht richtig dosieren und (4) sie führen zu hoher Staatsverschuldung, da sich viele Massnahmen nachher nicht mehr rückgängig machen lassen."
  },
  {
    id: "a05", topic: "angebot", type: "mc", diff: 2, tax: "K4",
 reviewed:false,
    q: "Wie lautet die Synthese der verschiedenen Konjunkturtheorien gemäss dem Eisenhut-Lehrbuch: «Wer hat recht?»",
    options: [
      {v: "A", t: "Kurzfristig hat eher Keynes recht (Nachfragestimulierung kann helfen), langfristig eher die Angebotsökonomen (Rahmenbedingungen entscheiden)."},
      {v: "B", t: "Keine der Theorien hat einen praktischen Nutzen."},
      {v: "C", t: "Nur die Klassiker haben recht, staatliche Eingriffe sind immer schädlich."},
      {v: "D", t: "Nur die Monetaristen haben recht, alle anderen Ansätze sind überholt."}
    ],
    correct: "A",
    explain: "Die Synthese im Eisenhut lautet: Kurzfristig hat eher Keynes recht — in einer akuten Krise kann staatliche Nachfragestimulierung helfen, die Wirtschaft zu stabilisieren. Langfristig sind eher die Angebotsökonomen im Recht — nachhaltiges Wachstum erfordert gute Rahmenbedingungen, Investitionsanreize und Strukturreformen."
  },
  {
    id: "a06", topic: "angebot", type: "multi",
    img: {src: "img/vwl/konjunktur/konjunktur_konzeptionen_01.svg", alt: "Konjunkturpolitische Konzeptionen im Vergleich"}, diff: 3, tax: "K5",
 reviewed:false,
    q: "Welche Aussagen zur Beurteilung der verschiedenen konjunkturpolitischen Konzeptionen treffen zu? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Die keynesianische Politik ist in akuten Krisen wirksamer als in normalen Abschwüngen."},
      {v: "B", t: "Die angebotsorientierte Politik braucht mehr Zeit, um Wirkung zu zeigen."},
      {v: "C", t: "Alle Konzeptionen kommen zum gleichen Ergebnis."},
      {v: "D", t: "In der Praxis kombinieren die meisten Länder Elemente verschiedener Konzeptionen."}
    ],
    correct: ["A", "B", "D"],
    explain: "A ist korrekt: Keynesianische Massnahmen sind in schweren Krisen besonders wirksam, wenn die Nachfrage stark einbricht. B ist korrekt: Strukturelle Verbesserungen der Rahmenbedingungen wirken erst mittel- bis langfristig. C ist falsch: Die Konzeptionen unterscheiden sich fundamental. D ist korrekt: In der Praxis verfolgen die meisten Länder einen pragmatischen Mix aus verschiedenen Ansätzen."
  },
  {
    id: "a07", topic: "angebot", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
    q: "Die Finanzkrise 2008/09 und die Corona-Krise 2020 zeigten, dass auch traditionell eher marktliberal orientierte Regierungen massive Konjunkturprogramme lancierten. Wie lässt sich das erklären?",
    options: [
      {v: "A", t: "Die Regierungen haben ihre marktwirtschaftliche Überzeugung dauerhaft aufgegeben."},
      {v: "B", t: "Die Konjunkturprogramme waren rein angebotsökonornisch motiviert."},
      {v: "C", t: "Es gab keine nennenswerten Konjunkturprogramme in diesen Krisen."},
      {v: "D", t: "In akuten, schweren Krisen setzen auch marktliberal orientierte Regierungen auf keynesianische Instrumente, weil die Selbstheilungskräfte des Marktes zu langsam wirken."}
    ],
    correct: "D",
    explain: "Beide Krisen zeigten, dass in schweren Ausnahmesituationen auch marktliberale Regierungen auf keynesianische Instrumente (Konjunkturprogramme, Rettungsschirme, Kurzarbeit) zurückgreifen. Die Corona-Krise war besonders: Sie war sowohl Angebots- als auch Nachfrageschock und erforderte massive, schnelle staatliche Intervention, um einen wirtschaftlichen Kollaps zu verhindern."
  },
  {
    id: "a08", topic: "angebot", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Die keynesianische Konzeption ist {0}orientiert und betont die Rolle der Gesamtnachfrage. Die neoklassische Konzeption ist {1}orientiert und betont die wirtschaftlichen Rahmenbedingungen.",
    blanks: [
      {answer: "nachfrage", alts: ["nachfrageorientiert", "Nachfrage"]},
      {answer: "angebots", alts: ["angebotsorientiert", "Angebots"]}
    ],
    explain: "Die keynesianische Konzeption ist nachfrageorientiert: In Krisen muss der Staat die fehlende Nachfrage ersetzen. Die angebotsorientierte (neoklassische) Konzeption betont dagegen die Angebotsseite: Gute Rahmenbedingungen (tiefe Steuern, wenig Regulierung) schaffen Investitionsanreize und langfristiges Wachstum."
  },
  {
    id: "a09", topic: "angebot", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Die Stabilisierungsmassnahmen des Bundesrates 2008/09 umfassten u.a. die Aufhebung der Kreditsperre (205 Mio.) und Investitionen in Infrastruktur (390 Mio.). Wie würde ein Angebotsökonom diese Massnahmen beurteilen?",
    options: [
      {v: "A", t: "Positiv, weil sie die Nachfrage effektiv stützen."},
      {v: "B", t: "Neutral, weil Angebotsökonomen keine Meinung zu Fiskalpolitik haben."},
      {v: "C", t: "Positiv, sofern die Massnahmen durch Steuererhöhungen finanziert werden."},
      {v: "D", t: "Kritisch, weil solche Massnahmen den Markt verzerren, zu spät wirken und langfristig zu Verschuldung führen."}
    ],
    correct: "D",
    explain: "Angebotsökonomen würden diese Massnahmen kritisch beurteilen: Sie kommen zu spät (die Kreditsperre wird erst aufgehoben, wenn die Krise schon da ist), verzerren den Markt (bestimmte Branchen profitieren), und die Verschuldung lässt sich politisch schwer zurückfahren. Angebotsökonomen würden stattdessen auf Steuersenkungen und Deregulierung setzen."
  },
  {
    id: "a10", topic: "angebot", type: "tf", diff: 3, tax: "K5",
 reviewed:false,
    q: "Die Corona-Krise 2020 war ein klassischer Konjunkturzyklus und konnte mit den üblichen konjunkturpolitischen Instrumenten bekämpft werden.",
    correct: false,
    explain: "Falsch. Die Corona-Krise war kein gewöhnlicher Konjunkturzyklus, sondern ein beispielloser gleichzeitiger Angebots- und Nachfrageschock, ausgelöst durch eine Gesundheitskrise und staatlich verordnete Lockdowns. Die Massnahmen (Kurzarbeit, Überbrückungskredite, direkte Unterstützungszahlungen) waren daher anders als klassische Konjunkturprogramme — sie zielten primär auf die Überbrückung eines temporären Stillstands, nicht auf die Ankurbelung der Nachfrage."
  },
  {
    id: "a11", topic: "angebot", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Welches Instrument steht bei der angebotsorientierten Wirtschaftspolitik NICHT im Vordergrund?",
    options: [
      {v: "A", t: "Senkung der Unternehmenssteuern"},
      {v: "B", t: "Flexibilisierung des Arbeitsmarktes"},
      {v: "C", t: "Deregulierung (Abbau von Bürokratie und Vorschriften)"},
      {v: "D", t: "Antizyklische Erhöhung der Staatsausgaben in der Rezession"}
    ],
    correct: "D",
    explain: "Die antizyklische Erhöhung der Staatsausgaben (C) ist das Kerninstrument der keynesianischen Konzeption, nicht der angebotsorientierten. Angebotsökonomen setzen stattdessen auf Deregulierung (A), Steuersenkungen (B) und flexible Arbeitsmärkte (D), um die Rahmenbedingungen für Unternehmen langfristig zu verbessern."
  },

  // ════════════════════════════════════════════════════════════
  //  NEUE FRAGETYPEN — Interaktive Aufgaben
  // ════════════════════════════════════════════════════════════

  // --- Sortierung: Konjunkturphasen in Reihenfolge ---
  {
    id: "neu01", topic: "zyklus", type: "sortierung", diff: 1, tax: "K2", reviewed: false,
    q: "Bringe die vier Konjunkturphasen in die richtige Reihenfolge (beginnend beim Tiefpunkt).",
    items: [
      "Aufschwung (Erholung)",
      "Hochkonjunktur (Boom)",
      "Abschwung (Rezession beginnt)",
      "Talsohle (Depression)"
    ],
    correct: [0, 1, 2, 3],
    explain: "Der Konjunkturzyklus beginnt am Tiefpunkt (Talsohle) mit dem Aufschwung, erreicht die Hochkonjunktur (Boom), geht in den Abschwung über und endet wieder an der Talsohle. Dann beginnt der Zyklus erneut."
  },

  // --- Sortierung: Expansive Geldpolitik ---
  {
    id: "neu02", topic: "keynes", type: "sortierung", diff: 2, tax: "K3", reviewed: false,
    q: "Ordne die Schritte der expansiven Geldpolitik in die korrekte Wirkungskette.",
    items: [
      "SNB senkt den Leitzins",
      "Geschäftsbanken vergeben günstigere Kredite",
      "Unternehmen und Haushalte investieren und konsumieren mehr",
      "Die gesamtwirtschaftliche Nachfrage steigt",
      "Produktion und Beschäftigung nehmen zu"
    ],
    correct: [0, 1, 2, 3, 4],
    explain: "Die Wirkungskette der expansiven Geldpolitik: Die SNB senkt den Leitzins → Kredite werden günstiger → Investitionen und Konsum steigen → gesamtwirtschaftliche Nachfrage nimmt zu → Produktion und Beschäftigung wachsen. Dies entspricht dem keynesianischen Transmissionsmechanismus."
  },

  // --- Formel: BIP-Wachstumsrate ---
  {
    id: "neu03", topic: "indikatoren", type: "formel", diff: 2, tax: "K2", reviewed: false,
    q: "Gib die Formel für die BIP-Wachstumsrate ein (in Prozent). Verwende BIP_t für das aktuelle und BIP_{t-1} für das Vorjahres-BIP.",
    hints: ["Die Wachstumsrate misst die prozentuale Veränderung gegenüber dem Vorjahr.", "Grundstruktur: Veränderung geteilt durch Ausgangswert, mal 100."],
    correct: "\\frac{BIP_t - BIP_{t-1}}{BIP_{t-1}} \\times 100",
    explain: "Die BIP-Wachstumsrate berechnet sich als: (BIP_t − BIP_{t−1}) / BIP_{t−1} × 100. Sie gibt an, um wie viel Prozent das reale BIP gegenüber dem Vorjahr gewachsen (oder geschrumpft) ist. Eine negative Wachstumsrate über zwei aufeinanderfolgende Quartale gilt als technische Rezession."
  },

  // --- Formel: Reales BIP ---
  {
    id: "neu04", topic: "indikatoren", type: "formel", diff: 2, tax: "K2", reviewed: false,
    q: "Gib die Formel zur Berechnung des realen BIP ein. Verwende die Variablen «nominales BIP» und «Preisindex».",
    hints: ["Das reale BIP bereinigt das nominale BIP um Preisveränderungen.", "Der Preisindex wird als Prozentwert angegeben (z.B. 105 für 5 % Inflation)."],
    correct: "\\frac{\\text{nominales BIP}}{\\text{Preisindex}} \\times 100",
    explain: "Reales BIP = nominales BIP / Preisindex × 100. Damit werden Preisveränderungen (Inflation/Deflation) herausgerechnet. Nur das reale BIP erlaubt einen aussagekräftigen Vergleich der Wirtschaftsleistung über die Zeit, da es die tatsächliche Mengenentwicklung abbildet."
  },

  // --- Zeichnen: Konjunkturzyklus ---
  {
    id: "neu05", topic: "zyklus", type: "zeichnen", diff: 2, tax: "K3", reviewed: false,
    q: "Zeichne einen Konjunkturzyklus über ca. 2 vollständige Zyklen. Zeichne auch die Trendlinie (Produktionspotenzial) ein und beschrifte die vier Phasen.",
    hints: ["Die x-Achse zeigt die Zeit, die y-Achse das reale BIP.", "Die Trendlinie steigt langfristig an (Wirtschaftswachstum).", "Die Konjunkturkurve schwankt um den Trend herum."],
    sample: {
      src: "img/vwl/konjunktur/konjunktur_zyklus_01.svg",
      alt: "Musterlösung: Konjunkturzyklus mit Trend und beschrifteten Phasen"
    },
    explain: "Ein korrekter Konjunkturzyklus zeigt: (1) eine steigende Trendlinie für das Produktionspotenzial, (2) eine wellenförmige Kurve des tatsächlichen BIP, die um den Trend schwankt, (3) vier klar erkennbare Phasen: Aufschwung, Hochkonjunktur/Boom, Abschwung und Rezession/Talsohle."
  },

  // --- Hotspot: Phase mit höchster Arbeitslosigkeit ---
  {
    id: "neu06", topic: "zyklus", type: "hotspot", diff: 1, tax: "K2", reviewed: false,
    q: "Klicke auf den Punkt im Konjunkturzyklus, an dem die Arbeitslosigkeit typischerweise am höchsten ist.",
    img: {
      src: "img/vwl/konjunktur/konjunktur_zyklus_hotspot.svg",
      alt: "Konjunkturzyklus mit vier markierten Punkten (A–D)"
    },
    hotspots: [
      {x: 20, y: 77, r: 20, label: "A: Talsohle"},
      {x: 37.5, y: 41, r: 20, label: "B: Boom"},
      {x: 48.75, y: 52, r: 20, label: "C: Abschwung"},
      {x: 29.4, y: 60, r: 20, label: "D: Aufschwung"}
    ],
    correct: [0],
    explain: "Die Arbeitslosigkeit ist an der Talsohle (Punkt A) am höchsten. In der Rezession sinkt die Produktion, Unternehmen entlassen Arbeitskräfte. Da der Arbeitsmarkt ein Spätindikator ist, erreicht die Arbeitslosigkeit ihren Höchststand erst am Tiefpunkt des Konjunkturzyklus."
  },

  // --- Bildbeschriftung: Konjunkturzyklus beschriften ---
  {
    id: "neu07", topic: "zyklus", type: "bildbeschriftung", diff: 1, tax: "K2", reviewed: false,
    q: "Beschrifte die fünf markierten Stellen im Konjunkturzyklus-Diagramm.",
    img: {
      src: "img/vwl/konjunktur/konjunktur_zyklus_beschriftung.svg",
      alt: "Konjunkturzyklus mit fünf nummerierten Beschriftungspunkten"
    },
    labels: [
      {id: "l1", text: "Trend (Produktionspotenzial)", x: 82.5, y: 25},
      {id: "l2", text: "Aufschwung", x: 28.75, y: 20},
      {id: "l3", text: "Hochkonjunktur (Boom)", x: 41.9, y: 18},
      {id: "l4", text: "Abschwung", x: 54.4, y: 25},
      {id: "l5", text: "Rezession (Talsohle)", x: 63.5, y: 78}
    ],
    explain: "Die fünf Elemente: (1) Die gestrichelte Trendlinie zeigt das Produktionspotenzial — die langfristige Wachstumskapazität. (2) Aufschwung: BIP steigt zum Trend. (3) Hochkonjunktur/Boom: BIP liegt über dem Trend (positive Outputlücke). (4) Abschwung: BIP fällt zurück. (5) Rezession/Talsohle: BIP liegt unter dem Trend (negative Outputlücke)."
  },

  // --- DragDrop: Merkmale den Phasen zuordnen ---
  {
    id: "neu08", topic: "zyklus", type: "dragdrop_bild", diff: 2, tax: "K3", reviewed: false,
    q: "Ordne die konjunkturellen Merkmale der richtigen Phase zu.",
    img: {
      src: "img/vwl/konjunktur/konjunktur_phasen_dragdrop.svg",
      alt: "Vier Konjunkturphasen mit Drop-Zonen"
    },
    zones: [
      {id: "aufschwung", x: 2.5, y: 14, w: 22.5, h: 82.5},
      {id: "boom", x: 26.25, y: 14, w: 22.5, h: 82.5},
      {id: "abschwung", x: 50, y: 14, w: 22.5, h: 82.5},
      {id: "rezession", x: 73.75, y: 14, w: 23.75, h: 82.5}
    ],
    labels: [
      {id: "m1", text: "Investitionen steigen", zone: "aufschwung"},
      {id: "m2", text: "Arbeitslosigkeit sinkt", zone: "aufschwung"},
      {id: "m3", text: "Optimistische Erwartungen", zone: "aufschwung"},
      {id: "m4", text: "Vollbeschäftigung", zone: "boom"},
      {id: "m5", text: "Preisniveau steigt stark", zone: "boom"},
      {id: "m6", text: "Kapazitäten ausgelastet", zone: "boom"},
      {id: "m7", text: "Aufträge gehen zurück", zone: "abschwung"},
      {id: "m8", text: "Gewinne sinken", zone: "abschwung"},
      {id: "m9", text: "Pessimistische Erwartungen", zone: "abschwung"},
      {id: "m10", text: "Hohe Arbeitslosigkeit", zone: "rezession"},
      {id: "m11", text: "Tiefe Kapazitätsauslastung", zone: "rezession"},
      {id: "m12", text: "Preisniveau stagniert/sinkt", zone: "rezession"}
    ],
    explain: "Jede Konjunkturphase hat typische Merkmale: Im Aufschwung steigen Investitionen und die Arbeitslosigkeit sinkt. Im Boom herrscht Vollbeschäftigung bei steigendem Preisniveau. Im Abschwung gehen Aufträge und Gewinne zurück. In der Rezession ist die Arbeitslosigkeit hoch und die Kapazitäten sind unterausgelastet."
  },

  // --- PDF: Lagebericht analysieren ---
  {
    id: "neu09", topic: "indikatoren", type: "pdf", diff: 3, tax: "K4", reviewed: false,
    q: "Lies den fiktiven Konjunktur-Lagebericht und beantworte: In welcher Konjunkturphase befindet sich die Schweiz gemäss den beschriebenen Indikatoren? Begründe deine Einschätzung mit mindestens drei Indikatoren aus dem Text.",
    pdfUrl: "img/vwl/konjunktur/konjunktur_lagebericht.pdf",
    antwortTyp: "freitext",
    hints: ["Achte auf die Entwicklung von BIP, Arbeitsmarkt, Preisen und Stimmungsindikatoren.", "Vergleiche die beschriebenen Werte mit den typischen Merkmalen der vier Konjunkturphasen.", "Eine Wachstumsrate von 1,8 % ist moderat — liegt die Wirtschaft über oder unter dem Potenzial?"],
    sample: "Die Schweiz befindet sich gemäss dem Lagebericht in einem Aufschwung, der sich der Hochkonjunktur nähert. Drei Belege: (1) Das BIP wächst mit 1,8 % solide — die Erholung setzt sich fort. (2) Die Arbeitslosenquote ist mit 2,1 % tief und weiter sinkend, bei gleichzeitig steigenden offenen Stellen. (3) Die Stimmungsindikatoren (KOF 102,5, PMI 51,3) liegen über der Wachstumsschwelle und steigen. Die moderate Inflation von 1,4 % spricht gegen einen Boom, da in der Hochkonjunktur typischerweise stärkerer Preisdruck herrscht.",
    explain: "Die Indikatoren im Lagebericht deuten auf einen Aufschwung hin: positives BIP-Wachstum, sinkende Arbeitslosigkeit, steigende Exporte und positive Stimmungsindikatoren. Die Inflation ist noch moderat (1,4 %), was gegen eine Überhitzung (Boom) spricht. Die SNB hält den Leitzins stabil — typisch für eine Phase, in der die Erholung sich festigt, aber noch keine Überhitzungsgefahr besteht."
  }
];
