// Übungspool: Staatsverschuldung
// Fachbereich: VWL
// Kapitel: Eisenhut, Aktuelle Volkswirtschaftslehre (2021), Kapitel 11
// Quellen: Eisenhut Kap. 11, Präsentation Staatsschulden, Arbeitsauftrag Staatsverschuldung
// Anzahl Fragen: 90

window.POOL_META = {
  id: "vwl_staatsverschuldung",
  fach: "VWL",
  title: "Übungspool: Staatsverschuldung",
  meta: "SF GYM3 · Gymnasium Hofwil · Individuell üben",
  color: "vwl",
  lernziele: [
    "Ich kann die Struktur des schweizerischen Staatshaushalts (Einnahmen und Ausgaben) beschreiben. (K2)",
    "Ich kann die Verschuldungssituation der Schweiz im internationalen Vergleich einordnen. (K3)",
    "Ich kann Gefahren einer hohen Staatsverschuldung erklären und die Schuldenbremse beurteilen. (K5)"
  ]
};

window.TOPICS = {
  staatsanteil: {label:"Staatsanteil, Staatsquote & Fiskalquote", short:"Staatsanteil", lernziele:["Ich kann den Umfang des Staatssektors mit der Staatsquote messen. (K2)","Ich kann Gründe für das Wachstum des Staatssektors (Wagner'sches Gesetz) nennen. (K2)"]},
  ausgaben:     {label:"Ausgaben des Bundes", short:"Ausgaben", lernziele:["Ich kann die Struktur der Bundesausgaben (Soziale Wohlfahrt, Verkehr, Bildung etc.) beschreiben. (K1)","Ich kann erklären, warum bestimmte Aufgaben staatlich und nicht privat erbracht werden (öffentliche Güter, Externalitäten). (K2)"]},
  einnahmen:    {label:"Einnahmen des Bundes", short:"Einnahmen", lernziele:["Ich kann die Einnahmenstruktur des Bundes (direkte Bundessteuer, MWST, Verrechnungssteuer etc.) beschreiben. (K1)","Ich kann die Laffer-Kurve erklären und deren Aussage zur optimalen Steuerhöhe diskutieren. (K4)"]},
  defizite:     {label:"Konjunkturelle & strukturelle Defizite", short:"Defizite", lernziele:["Ich kann den Unterschied zwischen Defizit (Flussgrösse) und Schuldenstand (Bestandesgrösse) erklären. (K2)","Ich kann die Schuldenquote berechnen und interpretieren. (K3)"]},
  international:{label:"Internationale Staatsverschuldung", short:"International", lernziele:["Ich kann die Verschuldungssituation der Schweiz mit jener anderer Länder (EU, USA, Japan) vergleichen. (K3)","Ich kann erklären, warum unterschiedliche Verschuldungsniveaus existieren. (K4)"]},
  gefahren:     {label:"Gefahren & Risiken der Verschuldung", short:"Gefahren", lernziele:["Ich kann Gefahren einer hohen Staatsverschuldung (Zinsbelastung, Crowding-out, Generationengerechtigkeit) erklären. (K2)","Ich kann die Argumente für und gegen Staatsverschuldung (keynesianisch vs. neoklassisch) gegenüberstellen. (K5)"]},
  richtlinien:  {label:"Richtlinien & Schuldenbremse", short:"Richtlinien", lernziele:["Ich kann die Funktionsweise der Schweizer Schuldenbremse erklären. (K2)","Ich kann Vor- und Nachteile von Fiskalregeln beurteilen. (K5)"]}
};

window.QUESTIONS = [
// ── STAATSANTEIL (s01–s09) ──
{id:"s01", topic:"staatsanteil", type:"mc", diff:1, tax:"K1",reviewed:false,
 q:"Was misst die Staatsquote?",
 options:[
   {v: "A", t:"Den Anteil der Steuereinnahmen am BIP."},
   {v: "B", t:"Den Anteil der Staatsausgaben am BIP."},
   {v: "C", t:"Den Anteil der Sozialversicherungsbeiträge am BIP."},
   {v: "D", t:"Den Anteil der Staatsschulden am BIP."}
 ],
 correct:"B",
 explain:"Die Staatsquote gibt an, wie viel der gesamten volkswirtschaftlichen Leistung (BIP) durch die Hand des Staates fliesst. Sie umfasst die Ausgaben von Bund, Kantonen, Gemeinden und öffentlichen Sozialversicherungen."},

{id:"s02", topic:"staatsanteil", type:"mc", diff:1, tax:"K1",reviewed:false,
 q:"Was misst die Fiskalquote?",
 options:[
   {v: "A", t:"Die Gesamtausgaben des Staates in % des BIP."},
   {v: "B", t:"Die Fiskaleinnahmen aller Staatsebenen inkl. Sozialversicherungsbeiträge in % des BIP."},
   {v: "C", t:"Den Anteil der Mehrwertsteuer an den gesamten Steuern."},
   {v: "D", t:"Die Verschuldung des Staates in % des BIP."}
 ],
 correct:"B",
 explain:"Die Fiskalquote entspricht den Fiskaleinnahmen aller Staatsebenen einschliesslich der obligatorischen Sozialversicherungsbeiträge in Prozent des BIP. Sie misst somit die gesamte Steuerbelastung."},

{id:"s03", topic:"staatsanteil", type:"tf", diff:1, tax:"K1",reviewed:false,
 q:"Die Staatsquote der Schweiz liegt im internationalen Vergleich auf einem tiefen Niveau.",
 correct:true,
 explain:"Korrekt. Die Staatsquote der Schweiz lag zuletzt bei rund 33%, was im internationalen Vergleich tief ist. Der OECD-Durchschnitt der Fiskalquote liegt bei ca. 35%."},

{id:"s04", topic:"staatsanteil", type:"tf", diff:2, tax:"K2",reviewed:false,
 q:"Gemäss dem 'Gesetz der wachsenden Ausdehnung der Staatstätigkeit' von Adolf Wagner wachsen die Staatsausgaben langfristig proportional zum Wirtschaftswachstum.",
 correct:false,
 explain:"Falsch. Wagner formulierte, dass die Staatsausgaben überproportional zum Wirtschaftswachstum ansteigen – also schneller als die Wirtschaft wächst."},

{id:"s05", topic:"staatsanteil", type:"sort", diff:2, tax:"K2",reviewed:false,
 q:"Ordnen Sie die folgenden Aussagen den Gründen für das Wachstum der Staatsausgaben zu.",
 categories:["Zunehmende Staatsaufgaben", "Neue Politische Ökonomie (Public Choice)"],
 items:[
   {t:"Ausbau der Sozial- und Bildungspolitik", cat:0},
   {t:"Budgetmaximierung durch Verwaltungsbeamte", cat:1},
   {t:"Staatliche Eingriffe im Umwelt- und Gesundheitssektor", cat:0},
   {t:"Ausgabenfreudigkeit der Parlamente", cat:1},
   {t:"Wachsende Infrastrukturaufgaben", cat:0},
   {t:"Macht und Prestige durch hohes Budget", cat:1}
 ],
 explain:"Die Neue Politische Ökonomie erklärt das Ausgabenwachstum durch eigeninteressierte Akteure (Beamte, Politiker). Zunehmende Staatsaufgaben ergeben sich aus erweiterten Aufgabenbereichen wie Sozial-, Bildungs- und Umweltpolitik."},

{id:"s06", topic:"staatsanteil", type:"fill", diff:1, tax:"K1",reviewed:false,
 q:"Der TAX-I (Tax Independence Day) bezeichnet den Tag, an dem ein Steuerzahler das Geld zum Bezahlen seiner {0} verdient hat. In der Schweiz lag dieser Tag zuletzt ca. Mitte {1}.",
 blanks:[
   {answer:"Steuern", alts:["Steuerlast","Steuerbelastung"]},
   {answer:"April", alts:[]}
 ],
 explain:"Rechnet man die Fiskalquote in Tage um, benötigt der durchschnittliche Steuerzahler gut 100 Tage, um seine Steuer- und Sozialversicherungsverpflichtungen zu erfüllen. Nimmt man die erweiterte Fiskalquote, verschiebt sich der TAX-I sogar auf Ende Mai."},

{id:"s07", topic:"staatsanteil", type:"mc", diff:2, tax:"K2",reviewed:false,
 q:"Warum sind die Möglichkeiten zur Produktivitätssteigerung im öffentlichen Sektor geringer als in der Privatwirtschaft?",
 options:[
   {v: "A", t:"Der Staat hat keinen Zugang zum Kapitalmarkt."},
   {v: "B", t:"Staatsangestellte arbeiten grundsätzlich weniger produktiv."},
   {v: "C", t:"Der Staat darf keine modernen Technologien einsetzen."},
   {v: "D", t:"Öffentliche Dienstleistungen sind arbeitsintensiv und schwer automatisierbar."}
 ],
 correct:"D",
 explain:"Öffentliche Leistungen wie Bildung, Gesundheit und Verwaltung sind personalintensiv. Anders als in der industriellen Produktion lässt sich die Arbeitsproduktivität hier nur beschränkt steigern, was zu einer überdurchschnittlichen Kostenentwicklung führt."},

{id:"s08", topic:"staatsanteil", type:"open", diff:3, tax:"K4",reviewed:false,
 q:"Die Neue Politische Ökonomie (Public Choice) überträgt das ökonomische Prinzip auf den politischen Bereich. Erklären Sie, warum dieses Verhalten tendenziell zu steigenden Staatsausgaben führt.",
 sample:"Die Bürokratie strebt nach Budget- und Ausgabenmaximierung, weil Macht, Prestige und Einkommen an die Grösse des verwalteten Budgets geknüpft sind. Beamte haben einen Anreiz, ihr Budget jährlich auszudehnen. Kombiniert mit der Ausgabenfreudigkeit der Parlamente, die vor Wahlen gerne Ausgaben bewilligen, entsteht eine systematische Tendenz zu höheren Staatsausgaben.",
 explain:"Der Public-Choice-Ansatz erklärt, warum staatliche Ausgaben wachsen, obwohl dies nicht immer im Interesse der Bürger ist. Es fehlt ein Gewinnkriterium wie in der Privatwirtschaft – stattdessen dient die Budgetgrösse als Erfolgsindikator."},

{id:"s09", topic:"staatsanteil", type:"tf", diff:2, tax:"K2",reviewed:false,
 q:"Mit steigendem Einkommen steigt die Nachfrage nach Staatsleistungen überproportional an.",
 correct:true,
 explain:"Korrekt. Öffentliche Leistungen (z.B. Bildung, Gesundheit, Sicherheit) gelten als einkommenselastisch: Je wohlhabender eine Gesellschaft, desto mehr erwartet sie vom Staat."},

// ── AUSGABEN (a01–a08) ──
{id:"a01", topic:"ausgaben", type:"mc", diff:1, tax:"K1",reviewed:false,
 q:"Welcher Ausgabenposten des Bundes ist der grösste?",
 options:[
   {v: "A", t:"Verkehr"},
   {v: "B", t:"Soziale Wohlfahrt"},
   {v: "C", t:"Bildung"},
   {v: "D", t:"Landesverteidigung"}
 ],
 correct:"B",
 explain:"Die soziale Wohlfahrt ist mit rund 22 Mrd. Fr. (Rechnung 2018) der mit Abstand grösste Ausgabenposten des Bundes. Am stärksten angestiegen sind allerdings die Ausgaben für Bildung (+67% seit 2008)."},

{id:"a02", topic:"ausgaben", type:"tf", diff:1, tax:"K1",reviewed:false,
 q:"Der Bundeshaushalt der Schweiz wird als 'Transferhaushalt' bezeichnet, weil der Bund zwei Drittel seiner Mittel als Übertragungen an Dritte weitergibt.",
 correct:true,
 explain:"Korrekt. Nur ein Drittel der Bundesausgaben verbleibt für eigene Zwecke (Verwaltung, Verteidigung, Hochschulen). Rund 59% der Gesamtausgaben sind Subventionen, die grösstenteils in die soziale Wohlfahrt fliessen."},

{id:"a03", topic:"ausgaben", type:"fill", diff:1, tax:"K1",reviewed:false,
 q:"{0} sind unentgeltliche finanzielle Leistungen der öffentlichen Hand. Sie beanspruchen rund {1}% der gesamten Bundesausgaben.",
 blanks:[
   {answer:"Subventionen", alts:[]},
   {answer:"59", alts:["60"]}
 ],
 explain:"Subventionen machen ca. 59% der Bundesausgaben aus. 45% aller Subventionen entfallen auf die soziale Wohlfahrt, gefolgt von Bildung und Forschung (17%), Verkehr (15%) und Landwirtschaft (9%)."},

{id:"a04", topic:"ausgaben", type:"sort", diff:2, tax:"K2",reviewed:false,
 q:"Ordnen Sie die folgenden Ausgabenposten nach ihrem Anteil an den Bundesausgaben (2018): vom grössten zum kleinsten.",
 img:{src:"img/vwl/staatsverschuldung/bundesausgaben_zusammensetzung.svg", alt:"Ausgaben des Bundes nach Aufgabengebieten 2018"},
 categories:["Rang 1 (grösster)", "Rang 2", "Rang 3"],
 items:[
   {t:"Soziale Wohlfahrt (ca. 22 Mrd. Fr.)", cat:0},
   {t:"Finanzen und Steuern (ca. 10 Mrd. Fr.)", cat:1},
   {t:"Verkehr (ca. 10 Mrd. Fr.)", cat:1},
   {t:"Bildung (ca. 8 Mrd. Fr.)", cat:2},
   {t:"Landesverteidigung (ca. 6 Mrd. Fr.)", cat:2}
 ],
 explain:"Soziale Wohlfahrt dominiert mit ca. 22 Mrd. Fr. Es folgen Finanzen/Steuern und Verkehr (je ca. 10 Mrd. Fr.), dann Bildung (ca. 8 Mrd. Fr.) und Landesverteidigung (ca. 6 Mrd. Fr.)."},

{id:"a05", topic:"ausgaben", type:"mc", diff:2, tax:"K2",reviewed:false,
 q:"Im Ausgabenposten 'Finanzen und Steuern' des Bundes sind vor allem enthalten:",
 options:[
   {v: "A", t:"Schuldzinsen und Kantonsanteile an den Bundessteuern."},
   {v: "B", t:"Die Kosten für die Steuerhinterziehungsbekämpfung."},
   {v: "C", t:"Die Gehälter der Steuerbeamten."},
   {v: "D", t:"Die Ausgaben für die Eidgenössische Steuerverwaltung."}
 ],
 correct:"A",
 explain:"Der Posten 'Finanzen und Steuern' enthält insbesondere die Schuldzinsen auf der Bundesschuld sowie die Kantonsanteile an den Bundessteuern (z.B. direkte Bundessteuer)."},

{id:"a06", topic:"ausgaben", type:"mc", diff:2, tax:"K2",reviewed:false,
 q:"Welcher Bundesausgabenbereich verzeichnete zwischen 2008 und 2018 das stärkste prozentuales Wachstum?",
 options:[
   {v:"A", t:"Bildung"},
   {v:"B", t:"Soziale Wohlfahrt"},
   {v:"C", t:"Verkehr"},
   {v:"D", t:"Landesverteidigung"}
 ],
 correct:"A",
 explain:"Die Bildungsausgaben stiegen mit +67% am stärksten, gefolgt von der sozialen Wohlfahrt (+27%). Die Ausgaben für Finanzen und Steuern sanken sogar um 5%."},

{id:"a07", topic:"ausgaben", type:"tf", diff:2, tax:"K2",reviewed:false,
 q:"Dem Bund verbleibt der grössere Teil seiner Mittel für eigene Zwecke wie Verwaltung und Landesverteidigung.",
 correct:false,
 explain:"Falsch. Dem Bund verbleibt nur der kleinere Teil (ca. ein Drittel) für eigene Zwecke. Zwei Drittel werden als Übertragungen an Dritte weitergegeben – hauptsächlich als Subventionen."},

{id:"a08", topic:"ausgaben", type:"open", diff:3, tax:"K4",reviewed:false,
 q:"Erklären Sie, warum der Bundeshaushalt als 'Transferhaushalt' bezeichnet wird, und diskutieren Sie eine mögliche Problematik dieser Struktur.",
 sample:"Der Bund gibt ca. zwei Drittel seiner Mittel als Übertragungen (vor allem Subventionen) an Kantone, Gemeinden, Sozialversicherungen und andere Empfänger weiter. Nur ein Drittel nutzt er für eigene Aufgaben. Eine Problematik besteht darin, dass der Bund so hauptsächlich Gelder umverteilt, was die Ausgabensteuerung erschwert: Die gebundenen Transfers lassen wenig Spielraum für Kürzungen bei Bedarf.",
 explain:"Der Begriff 'Transferhaushalt' verdeutlicht, dass der Bund primär als Umverteiler fungiert. 45% aller Subventionen fliessen in die soziale Wohlfahrt."},

// ── EINNAHMEN (e01–e08) ──
{id:"e01", topic:"einnahmen", type:"mc", diff:1, tax:"K1",reviewed:false,
 q:"Welche Steuer ist die wichtigste Einnahmequelle des Bundes?",
 options:[
   {v: "A", t:"Die Mehrwertsteuer"},
   {v: "B", t:"Die Mineralölsteuer"},
   {v: "C", t:"Die Einkommenssteuer"},
   {v: "D", t:"Die Verrechnungssteuer"}
 ],
 correct:"A",
 explain:"Die Mehrwertsteuer und die direkte Bundessteuer sind die beiden dominierenden Einnahmequellen des Bundes. Die Mehrwertsteuer ist eine indirekte Steuer auf den Verbrauch."},

{id:"e02", topic:"einnahmen", type:"sort", diff:1, tax:"K1",reviewed:false,
 q:"Ordnen Sie die folgenden Steuern der korrekten Kategorie zu.",
 categories:["Direkte Steuern", "Indirekte Steuern"],
 items:[
   {t:"Einkommenssteuer", cat:0},
   {t:"Mehrwertsteuer", cat:1},
   {t:"Vermögenssteuer", cat:0},
   {t:"Mineralölsteuer", cat:1},
   {t:"Direkte Bundessteuer", cat:0},
   {t:"Tabaksteuer", cat:1}
 ],
 explain:"Direkte Steuern werden auf Einkommen und Vermögen erhoben. Indirekte Steuern belasten den Verbrauch (Konsum). Nirgendwo in Europa ist der Anteil der direkten Steuern so hoch wie in der Schweiz."},

{id:"e03", topic:"einnahmen", type:"fill", diff:1, tax:"K1",reviewed:false,
 q:"Direkte Steuern werden auf {0} und {1} erhoben. Indirekte Steuern werden auf den {2} erhoben.",
 blanks:[
   {answer:"Einkommen", alts:["das Einkommen", "Vermögen", "das Vermögen"]},
   {answer:"Vermögen", alts:["das Vermögen", "Einkommen", "das Einkommen"]},
   {answer:"Verbrauch", alts:["Konsum"]}
 ],
 explain:"Direkte Steuern betreffen direkt die wirtschaftliche Leistungsfähigkeit (Einkommen, Vermögen). Indirekte Steuern belasten den Verbrauch – die wichtigste ist die Mehrwertsteuer."},

{id:"e04", topic:"einnahmen", type:"tf", diff:1, tax:"K1",reviewed:false,
 q:"Nirgendwo in Europa ist der Anteil der direkten Steuern so hoch wie in der Schweiz.",
 correct:true,
 explain:"Korrekt. Die Schweiz hat im europäischen Vergleich einen besonders hohen Anteil an direkten Steuern (Einkommens- und Vermögenssteuern) an den Gesamtsteuereinnahmen."},

{id:"e05", topic:"einnahmen", type:"mc", diff:2, tax:"K2",reviewed:false,
 q:"Neben Steuern erzielt der Bund auch Einnahmen aus anderen Quellen. Welche der folgenden gehört NICHT dazu?",
 options:[
   {v: "A", t:"Zölle auf Importe aus der EU"},
   {v: "B", t:"Erträge aus privatrechtlicher Tätigkeit (z.B. Museen)"},
   {v: "C", t:"Gewinnablieferung der SNB"},
   {v: "D", t:"Gebühren für Amtshandlungen"}
 ],
 correct:"A",
 explain:"Die Schweiz erhebt als Nicht-EU-Mitglied zwar Zölle, diese machen aber keinen wesentlichen Einnahmeposten aus. Zu den übrigen Einnahmen gehören Gebühren, Monopolerträge (z.B. SNB-Gewinnablieferung) und Erträge aus privatrechtlicher Tätigkeit."},

{id:"e06", topic:"einnahmen", type:"tf", diff:2, tax:"K2",reviewed:false,
 q:"Die Verrechnungssteuer ist eine direkte Steuer auf Kapitalerträge.",
 correct:false,
 explain:"Falsch. Die Verrechnungssteuer ist eine indirekte Steuer, die als Sicherungssteuer auf Kapitalerträgen (z.B. Dividenden, Zinsen) erhoben wird. Sie soll die korrekte Deklaration in der Steuererklärung sicherstellen und wird bei korrekter Deklaration zurückerstattet."},

{id:"e07", topic:"einnahmen", type:"mc", diff:2, tax:"K2",reviewed:false,
 q:"Die gesamten Einnahmen des Bundes sind von 2008 bis 2019 um wie viel Prozent gestiegen?",
 options:[
   {v: "A", t:"Etwa 25%"},
   {v: "B", t:"Etwa 5%"},
   {v: "C", t:"Etwa 15,6%"},
   {v: "D", t:"Etwa 8%"}
 ],
 correct:"C",
 explain:"Die Einnahmen des Bundes stiegen von 2008 bis 2019 um 15,6%. Im gleichen Zeitraum stiegen die Ausgaben nur um 8% – was auf eine Verbesserung der Haushaltslage hindeutet."},

{id:"e08", topic:"einnahmen", type:"open", diff:3, tax:"K4",reviewed:false,
 q:"Erklären Sie den Unterschied zwischen der Fiskalquote und der erweiterten Fiskalquote der Schweiz und diskutieren Sie, warum dieser Unterschied relevant ist.",
 sample:"Die Fiskalquote umfasst die Steuern und obligatorischen Sozialversicherungsbeiträge in % des BIP (ca. 28,6% in der Schweiz). Die erweiterte Fiskalquote berücksichtigt alle Zwangsabgaben und liegt gemäss Avenir Suisse bei ca. 45%. Der Unterschied ist relevant, weil er zeigt, dass die tatsächliche Belastung der Bürger deutlich höher ist als die offizielle Fiskalquote suggeriert – nur gut die Hälfte des Einkommens steht zur freien Verfügung.",
 explain:"Die erweiterte Fiskalquote schliesst z.B. obligatorische Krankenkassenprämien und weitere Zwangsabgaben ein, die in der offiziellen Statistik nicht enthalten sind."},

// ── DEFIZITE (d01–d08) ──
{id:"d01", topic:"defizite", type:"mc", diff:1, tax:"K1",reviewed:false,
 q:"Was versteht man unter einem konjunkturellen Defizit?",
 options:[
   {v: "A", t:"Ein vorübergehendes Defizit aufgrund rezessionsbedingt tieferer Einnahmen und höherer Ausgaben."},
   {v: "B", t:"Ein Defizit, das durch zu hohe Zinszahlungen verursacht wird."},
   {v: "C", t:"Ein dauerhaftes Defizit, das auch bei guter Konjunktur bestehen bleibt."},
   {v: "D", t:"Ein Defizit, das durch Fehlinvestitionen des Staates entsteht."}
 ],
 correct:"A",
 explain:"Konjunkturelle Defizite entstehen in Rezessionsphasen durch sinkende Steuereinnahmen und steigende Sozialausgaben. Sie verschwinden im Aufschwung von selbst und wirken als automatische Stabilisatoren."},

{id:"d02", topic:"defizite", type:"mc", diff:1, tax:"K1",reviewed:false,
 q:"Was kennzeichnet ein strukturelles Defizit?",
 options:[
   {v: "A", t:"Es entsteht nur in Phasen einer Rezession."},
   {v: "B", t:"Es verschwindet automatisch im nächsten Aufschwung."},
   {v: "C", t:"Die Einnahmen decken die Ausgaben auch bei konjunktureller Normallage nicht."},
   {v: "D", t:"Es wird durch sinkende Zinsen verursacht."}
 ],
 correct:"C",
 explain:"Strukturelle Defizite bestehen unabhängig von der Konjunkturlage. Sie können nur durch Ausgabenkürzungen oder Steuererhöhungen beseitigt werden – im Gegensatz zu konjunkturellen Defiziten, die sich im Aufschwung von selbst korrigieren."},

{id:"d03", topic:"defizite", type:"sort", diff:2, tax:"K2",reviewed:false,
 q:"Ordnen Sie die folgenden Merkmale den Defizitarten zu.",
 img:{src:"img/vwl/staatsverschuldung/defizite_konjunkturell_strukturell.svg", alt:"Konjunkturelle und strukturelle Defizite im Konjunkturzyklus"},
 categories:["Konjunkturelles Defizit", "Strukturelles Defizit"],
 items:[
   {t:"Verschwindet im Aufschwung von selbst", cat:0},
   {t:"Nur durch Ausgabenkürzungen oder Steuererhöhungen beseitigbar", cat:1},
   {t:"Wirkt als automatischer Stabilisator", cat:0},
   {t:"Auch als 'selbstverschuldetes Defizit' bezeichenbar", cat:1},
   {t:"Entsteht durch rezessionsbedingt tiefere Einnahmen", cat:0},
   {t:"Dauerhaft nicht finanzierte Ausgaben", cat:1}
 ],
 explain:"Konjunkturelle Defizite sind temporär und stabilisierend (automatische Stabilisatoren). Strukturelle Defizite sind dauerhaft und erfordern aktives Handeln zur Beseitigung."},

{id:"d04", topic:"defizite", type:"tf", diff:2, tax:"K2",reviewed:false,
 q:"Konjunkturelle Defizite sind unproblematisch, weil sie als automatische Stabilisatoren wirken.",
 correct:true,
 explain:"Korrekt. In einer Rezession stützen konjunkturelle Defizite die gesamtwirtschaftliche Nachfrage (keynesianische Logik). Im Aufschwung verschwinden sie dank steigender Einkommen, Gewinne und Umsätze wieder."},

{id:"d05", topic:"defizite", type:"fill", diff:2, tax:"K2",reviewed:false,
 q:"Die Veränderung des {0} Defizits widerspiegelt den Impuls der aktiven Finanzpolitik – den sogenannten {1}.",
 blanks:[
   {answer:"strukturellen", alts:[]},
   {answer:"Fiskalimpuls", alts:[]}
 ],
 explain:"Der Fiskalimpuls misst, wie stark der Staat aktiv in die Konjunktur eingreift. Eine Veränderung des strukturellen Defizits zeigt den bewussten finanzpolitischen Impuls – im Gegensatz zu automatischen, konjunkturbedingten Schwankungen."},

{id:"d06", topic:"defizite", type:"mc", diff:2, tax:"K3",reviewed:false,
 q:"In einer Rezession sinken die Einnahmen aus der Mehrwertsteuer besonders stark. Warum?",
 options:[
   {v: "A", t:"Weil die Konsumausgaben der Haushalte und Unternehmen zurückgehen."},
   {v: "B", t:"Weil die Mehrwertsteuer nur auf Exporte erhoben wird."},
   {v: "C", t:"Weil die Bevölkerung in Rezessionen keine Steuern mehr zahlen muss."},
   {v: "D", t:"Weil der Staat den Mehrwertsteuersatz in Rezessionen automatisch senkt."}
 ],
 correct:"A",
 explain:"Die Mehrwertsteuer wird auf den Konsum erhoben. In einer Rezession geben Haushalte und Unternehmen weniger aus, wodurch die Steuereinnahmen sinken. Auch die Verrechnungssteuer und Stempelabgaben reagieren konjunktursensibel."},

{id:"d07", topic:"defizite", type:"tf", diff:2, tax:"K2",reviewed:false,
 q:"Bestimmte Bundesausgaben wie Personalausgaben und Renten sind indexgebunden und reagieren daher verzögert auf Konjunktureinbrüche.",
 correct:true,
 explain:"Korrekt. Indexgebundene Ausgaben (z.B. Löhne, Renten) lassen sich kurzfristig nicht senken. Manche Ausgaben steigen in Rezessionen sogar – z.B. Arbeitslosenentschädigungen. Das führt zu einem 'Schereneffekt' zwischen sinkenden Einnahmen und steigenden Ausgaben."},

{id:"d08", topic:"defizite", type:"open", diff:3, tax:"K4",reviewed:false,
 q:"Erklären Sie anhand eines Beispiels, warum ein strukturelles Defizit problematischer ist als ein konjunkturelles Defizit.",
 sample:"Ein konjunkturelles Defizit entsteht z.B., wenn in einer Rezession die MwSt.-Einnahmen sinken und die Arbeitslosenentschädigungen steigen. Es korrigiert sich im Aufschwung automatisch. Ein strukturelles Defizit entsteht dagegen, wenn der Staat z.B. dauerhaft höhere Renten beschliesst, ohne die Finanzierung sicherzustellen. Dieses Defizit bleibt auch bei guter Konjunktur bestehen und lässt sich nur durch schmerzhafte Massnahmen (Leistungskürzungen oder Steuererhöhungen) beseitigen.",
 explain:"Strukturelle Defizite sind gefährlicher, weil sie sich kumulieren und über die Zeit zu einer wachsenden Verschuldung führen – unabhängig davon, wie gut die Wirtschaft läuft."},

// ── INTERNATIONAL (i01–i07) ──
{id:"i01", topic:"international", type:"mc", diff:1, tax:"K1",reviewed:false,
 q:"Welches Land weist weltweit die höchste Schuldenquote (Schulden in % des BIP) auf?",
 options:[
   {v: "A", t:"Griechenland"},
   {v: "B", t:"Japan"},
   {v: "C", t:"USA"},
   {v: "D", t:"Italien"}
 ],
 correct:"B",
 explain:"Japan hat mit über 230% des BIP die höchste Schuldenquote weltweit. Es folgen Griechenland, Italien und Portugal. Die Schweiz belegt mit unter 30% einen der besten Plätze."},

{id:"i02", topic:"international", type:"tf", diff:1, tax:"K1",reviewed:false,
 q:"Die Schweiz gehört im internationalen Vergleich zu den am stärksten verschuldeten Ländern.",
 correct:false,
 explain:"Falsch. Die Schweiz hat eine der tiefsten Schuldenquoten weltweit. Die Schuldenquote lag bei unter 30% des BIP, während z.B. Japan über 230%, Italien über 130% und die USA über 100% aufweisen."},

{id:"i03", topic:"international", type:"mc", diff:2, tax:"K2",reviewed:false,
 q:"Warum wird die Staatsverschuldung typischerweise als Schuldenquote (in % des BIP) und nicht in absoluten Zahlen verglichen?",
 options:[
   {v: "A", t:"Weil absolute Zahlen schwieriger zu berechnen sind."},
   {v: "B", t:"Weil absolute Zahlen geheim gehalten werden."},
   {v: "C", t:"Weil erst das Verhältnis zur Wirtschaftsleistung die Tragbarkeit der Schulden zeigt."},
   {v: "D", t:"Weil die UNO nur prozentuale Angaben akzeptiert."}
 ],
 correct:"C",
 explain:"Absolute Schulden allein sagen wenig aus. Erst der Bezug zum BIP zeigt, ob ein Staat seine Schulden tragen kann. Ein Land mit hohem BIP kann höhere absolute Schulden bewältigen als ein kleines Land."},

{id:"i04", topic:"international", type:"fill", diff:2, tax:"K1",reviewed:false,
 q:"In der Schweiz entfallen die Gesamtschulden (ohne Finanzsektor) zu 47% auf {0}, zu 35% auf {1} und zu 18% auf den {2}.",
 blanks:[
   {answer:"Private Haushalte", alts:["Haushalte"]},
   {answer:"Unternehmen", alts:[]},
   {answer:"Staat", alts:[]}
 ],
 explain:"In der Schweiz haben die privaten Haushalte den grössten Schuldenanteil (v.a. Hypotheken). Der Staatsanteil ist mit 18% vergleichsweise tief."},

{id:"i05", topic:"international", type:"mc", diff:2, tax:"K2",reviewed:false,
 q:"Was ist der Unterschied zwischen Bruttoverschuldung und Nettoverschuldung eines Staates?",
 options:[
   {v: "A", t:"Die Nettoverschuldung berücksichtigt nur die Auslandsschulden."},
   {v: "B", t:"Die Bruttoverschuldung umfasst nur die Inlandsschulden."},
   {v: "C", t:"Die Nettoverschuldung berücksichtigt auch die Vermögenswerte des Staates."},
   {v: "D", t:"Es gibt keinen Unterschied – beide Begriffe sind synonym."}
 ],
 correct:"C",
 explain:"Die Nettoverschuldung = Bruttoschulden minus Vermögenswerte (z.B. Infrastruktur, Staatsbeteiligungen). Sie wäre aussagekräftiger, doch es fehlen internationale Standards zur Bewertung staatlicher Vermögen."},

{id:"i06", topic:"international", type:"tf", diff:2, tax:"K2",reviewed:false,
 q:"Die Staatsverschuldung ist ausschliesslich ein Problem der Industrieländer.",
 correct:false,
 explain:"Falsch. In jüngster Zeit wachsen die Schulden auch in China und anderen Schwellenländern stark an. Die Verschuldung ist ein globales Problem, das alle Ländergruppen betrifft."},

{id:"i07", topic:"international", type:"open", diff:3, tax:"K5",reviewed:false,
 q:"Beurteilen Sie: Warum ist es für Staaten politisch attraktiv, Ausgaben über Kredite statt über Steuererhöhungen zu finanzieren?",
 sample:"Kreditfinanzierung verschiebt die Zahllast auf zukünftige Generationen. Die heutigen Wähler profitieren von den Ausgaben, ohne die Kosten sofort tragen zu müssen. Steuererhöhungen sind politisch unpopulär und können zu Wahlniederlagen führen. Ökonomisch betrachtet ist Schulden-Machen kurzfristig rational – die Schweizer Schuldenbremse zeigt aber, dass langfristige Rationalität durch institutionelle Regeln erzwungen werden kann.",
 explain:"Die Verschiebung der Zahllast auf zukünftige Generationen macht die Kreditfinanzierung politisch attraktiv. Dies erklärt, warum viele Demokratien zu steigender Verschuldung neigen."},

// ── GEFAHREN (g01–g10) ──
{id:"g01", topic:"gefahren", type:"mc", diff:1, tax:"K1",reviewed:false,
 q:"Was versteht man unter dem Verdrängungseffekt ('Crowding-out')?",
 options:[
   {v: "A", t:"Der Staat verdrängt als Kreditnehmer private Investoren vom Kapitalmarkt."},
   {v: "B", t:"Hohe Steuern verdrängen Unternehmen ins Ausland."},
   {v: "C", t:"Ausländische Investoren verdrängen inländische Anleger."},
   {v: "D", t:"Private Unternehmen verdrängen den Staat vom Arbeitsmarkt."}
 ],
 correct:"A",
 explain:"Beim Crowding-out konkurriert der Staat auf den Geld- und Kapitalmärkten mit privaten Investoren. Investoren ziehen den sicheren Schuldner Staat den privaten Nachfragern vor – private Investitionen werden dadurch verdrängt."},

{id:"g02", topic:"gefahren", type:"fill", diff:1, tax:"K1",reviewed:false,
 q:"Der Staat kann seine Finanzierungslücke entweder durch den Verkauf von {0} am Kapitalmarkt oder durch {1} bei der Nationalbank decken.",
 blanks:[
   {answer:"Staatsobligationen", alts:["Wertpapieren","Staatsanleihen"]},
   {answer:"Kreditaufnahme", alts:["Kredite","Geldschöpfung"]}
 ],
 explain:"Beide Finanzierungswege haben unterschiedliche Auswirkungen: Kapitalmarktfinanzierung kann Zinsen treiben und Crowding-out verursachen. Zentralbankfinanzierung (Monetisierung) vergrössert die Geldmenge und birgt Inflationsgefahren."},

{id:"g03", topic:"gefahren", type:"tf", diff:2, tax:"K2",reviewed:false,
 q:"Wenn der Staat seine Defizite durch Kreditaufnahme bei der Nationalbank finanziert, vergrössert sich die Geldmenge.",
 correct:true,
 explain:"Korrekt. Im Gegensatz zur Finanzierung am Kapitalmarkt führt die Monetisierung zu einer Ausweitung der Geldmenge. Dies birgt langfristig Inflationsgefahren, wenn die Geldmenge schneller wächst als das BIP."},

{id:"g04", topic:"gefahren", type:"mc", diff:2, tax:"K2",reviewed:false,
 q:"Was passiert tendenziell mit den Zinsen, wenn der Staat am Kapitalmarkt grosse Mengen an Staatsanleihen ausgibt?",
 options:[
   {v: "A", t:"Die Zinsen bleiben unverändert, weil der Staat kein normaler Marktteilnehmer ist."},
   {v: "B", t:"Die Zinsen steigen, weil die Geldnachfrage zunimmt."},
   {v: "C", t:"Die Zinsen sinken, weil Staatsanleihen als sichere Anlagen gelten."},
   {v: "D", t:"Die Zinsen sinken, weil mehr Geld im Umlauf ist."}
 ],
 correct:"B",
 explain:"Beschafft sich der Staat Mittel am Kapitalmarkt, erhöht sich die Geldnachfrage. Dies übt Druck auf die Zinsen nach oben aus. Bei freiem Kapitalverkehr können steigende Zinsen eines grossen Landes auch andere Länder betreffen."},

{id:"g05", topic:"gefahren", type:"mc", diff:2, tax:"K2",reviewed:false,
 q:"Was versteht man unter dem 'Schneeballeffekt' der Staatsverschuldung?",
 img:{src:"img/vwl/staatsverschuldung/schneeballeffekt.svg", alt:"Kreislaufdiagramm: Selbstverstärkende Dynamik der Staatsverschuldung"},
 options:[
   {v: "A", t:"Schulden werden von Kanton zu Kanton weitergereicht."},
   {v: "B", t:"Die Schulden schmelzen im Aufschwung wie Schnee in der Sonne."},
   {v: "C", t:"Kleine Steuererhöhungen lösen eine Lawine an Steuervermeidung aus."},
   {v: "D", t:"Steigende Schulden führen zu höherer Zinslast, die nur durch neue Schulden finanzierbar ist."}
 ],
 correct:"D",
 explain:"Der Schneeballeffekt entsteht, wenn die Zinslast auf den Schulden selbst wieder mit neuen Schulden finanziert werden muss. Die Verschuldung beginnt ein Eigenleben zu führen und wird zum Teufelskreis. Besonders gefährlich ist dies, wenn die Schulden zusätzlich zu höheren Zinsen (Risikoprämien) führen."},

{id:"g06", topic:"gefahren", type:"sort", diff:2, tax:"K2",reviewed:false,
 q:"Ordnen Sie die Auswirkungen dem jeweiligen Finanzierungsweg zu.",
 categories:["Finanzierung am Kapitalmarkt", "Finanzierung bei der Nationalbank (Monetisierung)"],
 items:[
   {t:"Zinsdruck nach oben", cat:0},
   {t:"Geldmenge wird ausgeweitet", cat:1},
   {t:"Crowding-out privater Investitionen", cat:0},
   {t:"Inflationsgefahr steigt", cat:1},
   {t:"Geldmenge bleibt unverändert", cat:0},
   {t:"Zinsen sinken kurzfristig", cat:1}
 ],
 explain:"Kapitalmarktfinanzierung: Zinsdruck, Crowding-out, keine Geldmengenausweitung. Monetisierung: Geldmengenausweitung, Inflationsgefahr, kurzfristig sinkende Zinsen (aber langfristig steigende)."},

{id:"g07", topic:"gefahren", type:"tf", diff:2, tax:"K2",reviewed:false,
 q:"Für die Schweiz hat das Crowding-out-Argument grosse Relevanz.",
 correct:false,
 explain:"Falsch. Für die Schweiz hat das Crowding-out-Argument keine grosse Relevanz, weil der private Sektor einen chronischen Sparüberhang aufweist – es gibt also genügend Kapital am Markt. Anders ist die Lage z.B. in den USA."},

{id:"g08", topic:"gefahren", type:"mc", diff:3, tax:"K3",reviewed:false,
 q:"Eine Studie der Ökonomen Rogoff und Reinhart ergab 2013 einen kritischen Schwellenwert für die Schuldenquote. Bei welchem Wert beginnen gemäss dieser Studie die negativen Wachstumseffekte zu dominieren?",
 options:[
   {v: "A", t:"90% des BIP"},
   {v: "B", t:"60% des BIP"},
   {v: "C", t:"50% des BIP"},
   {v: "D", t:"120% des BIP"}
 ],
 correct:"A",
 explain:"Die Studie 'Growth in Time of Debt' ergab einen Schwellenwert von 90% des BIP. Die Frage, ab welcher Schuldenquote die negativen Auswirkungen überwiegen, bleibt aber umstritten."},

{id:"g09", topic:"gefahren", type:"open", diff:3, tax:"K4",reviewed:false,
 q:"Erklären Sie den Schneeballeffekt der Staatsverschuldung und weshalb er zu einem Teufelskreis führen kann.",
 sample:"Wenn ein Staat mehr ausgibt als er einnimmt, muss er die Differenz mit Schulden finanzieren. Auf diese Schulden fallen Zinsen an. Selbst bei einem ausgeglichenen Primärhaushalt (ohne Zinszahlungen) muss der Staat die Zinslast durch neue Schulden finanzieren. Mit steigenden Schulden steigen auch die Zinszahlungen, was wiederum neue Schulden erfordert. Der Effekt wird verstärkt, wenn steigende Schulden zu höheren Risikoprämien und damit höheren Zinssätzen führen.",
 explain:"Der Schneeballeffekt führt dazu, dass die Verschuldung ein Eigenleben entwickelt. Für Privatpersonen bedeutet dies Konkurs – für Staaten den faktischen Bankrott."},

{id:"g10", topic:"gefahren", type:"mc", diff:3, tax:"K3",reviewed:false,
 q:"Was passiert, wenn ein Staat faktisch zahlungsunfähig wird?",
 options:[
   {v: "A", t:"Alle Bürger müssen ihre privaten Ersparnisse abgeben."},
   {v: "B", t:"Er verhandelt mit Gläubigern über Schuldenumstrukturierung oder -erlass, die Währung wird oft ruiniert."},
   {v: "C", t:"Der Staat wird aufgelöst und in Nachbarländer eingegliedert."},
   {v: "D", t:"Die UNO übernimmt automatisch die Schulden."}
 ],
 correct:"B",
 explain:"Bei einem Staatsbankrott werden Verhandlungen mit Gläubigern geführt, die zu Zahlungsaufschub oder einem Schuldenerlass ('Haircut') führen können. Die Währung verliert oft dramatisch an Wert und muss saniert werden. Der IWF begleitet häufig den Neuanfang mit strengen Auflagen."},

// ── RICHTLINIEN (r01–r10) ──
{id:"r01", topic:"richtlinien", type:"mc", diff:1, tax:"K1",reviewed:false,
 q:"Was besagt die 'Goldene Finanzierungsregel'?",
 options:[
   {v: "A", t:"Kantone und Bund müssen ihre Budgets genau hälftig teilen."},
   {v: "B", t:"Budgetdefizite sollten die Höhe der Staatsinvestitionen nicht übersteigen."},
   {v: "C", t:"Die Staatsschulden sollten jedes Jahr um 1% sinken."},
   {v: "D", t:"Der Goldbestand der Nationalbank muss die Staatsschulden decken."}
 ],
 correct:"B",
 explain:"Die Goldene Finanzierungsregel besagt, dass Kredite nur für investive Zwecke (z.B. Infrastruktur) aufgenommen werden sollten, weil diese zu Wachstum und höheren Steuereinnahmen führen. Konsumausgaben (z.B. Sozial-, Personalausgaben) sollten nicht auf Pump finanziert werden."},

{id:"r02", topic:"richtlinien", type:"fill", diff:1, tax:"K1",reviewed:false,
 q:"Die Schweizer {0} ist in der Verfassung verankert. Sie besagt, dass über einen gesamten {1} die Staatseinnahmen und Staatsausgaben ausgeglichen sein müssen.",
 img:{src:"img/vwl/staatsverschuldung/schuldenbremse_mechanismus.svg", alt:"Mechanismus einer fiskalischen Regel über den Konjunkturverlauf"},
 blanks:[
   {answer:"Schuldenbremse", alts:[]},
   {answer:"Konjunkturzyklus", alts:["Konjunkturzyklus hinweg"]}
 ],
 explain:"Die Schuldenbremse wurde 2003 in der Schweiz eingeführt. In Rezessionen sind Defizite erlaubt (sogar erwünscht), aber im Aufschwung müssen Überschüsse erzielt werden. Über den ganzen Zyklus muss der Haushalt ausgeglichen sein."},

{id:"r03", topic:"richtlinien", type:"tf", diff:1, tax:"K1",reviewed:false,
 q:"Gemäss der Schuldenbremse sind Staatsdefizite in einer Rezession erlaubt.",
 correct:true,
 explain:"Korrekt. Die Schuldenbremse verbietet Defizite nicht generell, sondern verlangt einen Ausgleich über den gesamten Konjunkturzyklus. In einer Rezession sind Defizite sogar erwünscht, weil sie als Stabilisatoren wirken."},

{id:"r04", topic:"richtlinien", type:"mc", diff:2, tax:"K2",reviewed:false,
 q:"Was ist ein 'ausgeglichener Primärhaushalt'?",
 options:[
   {v: "A", t:"Ein Haushalt, bei dem Einnahmen und Ausgaben ohne Berücksichtigung der Zinszahlungen ausgeglichen sind."},
   {v: "B", t:"Ein Haushalt, bei dem nur die primären Steuern erhoben werden."},
   {v: "C", t:"Ein Haushalt, bei dem alle Schulden getilgt sind."},
   {v: "D", t:"Ein Haushalt, bei dem die Einnahmen die Ausgaben inklusive Zinsen übersteigen."}
 ],
 correct:"A",
 explain:"Der Primärhaushalt = Haushaltssaldo ohne Zinszahlungen. Ein ausgeglichener Primärhaushalt bedeutet, dass die laufenden Einnahmen die laufenden Ausgaben (ohne Zinsen) decken. Bei einem stabilen Zinssatz und positivem Wirtschaftswachstum bleibt die Schuldenquote dann stabil."},

{id:"r05", topic:"richtlinien", type:"tf", diff:2, tax:"K2",reviewed:false,
 q:"Die dritte Richtlinie für die Staatsverschuldung besagt, dass die Ausgaben im Gleichschritt mit dem Wirtschaftswachstum zunehmen sollten. Die Schweiz hält diese Regel ein.",
 correct:false,
 explain:"Falsch. Auch die Schweiz hält diese Regel nicht ein – die Staatsausgaben sind in den letzten Jahrzehnten schneller angestiegen als das Wirtschaftswachstum (Wagners Gesetz)."},

{id:"r06", topic:"richtlinien", type:"sort", diff:2, tax:"K2",reviewed:false,
 q:"Ordnen Sie zu: Welche Formen der Verschuldung sind gerechtfertigt und welche problematisch?",
 categories:["Gerechtfertigt", "Problematisch"],
 items:[
   {t:"Kredite für Infrastrukturinvestitionen", cat:0},
   {t:"Schulden zur Finanzierung von Konsumausgaben", cat:1},
   {t:"Defizite zur Konjunkturstabilisierung in der Rezession", cat:0},
   {t:"Dauerhaft über die Verhältnisse leben", cat:1},
   {t:"Kredite für Bildungsinvestitionen", cat:0},
   {t:"Schulden zur Finanzierung laufender Personalausgaben", cat:1}
 ],
 explain:"Investive Schulden und temporäre Konjunkturdefizite sind gerechtfertigt, weil sie zu zukünftigem Wachstum oder Stabilisierung beitragen. Schulden für Konsumausgaben sind problematisch, weil sie keine zukünftigen Erträge generieren."},

{id:"r07", topic:"richtlinien", type:"mc", diff:2, tax:"K2",reviewed:false,
 q:"Seit der Einführung der Schuldenbremse im Jahr 2003 hat die Schweiz Schulden in welcher Höhe abgebaut?",
 options:[
   {v: "A", t:"Fast 27 Mrd. Fr."},
   {v: "B", t:"Fast 50 Mrd. Fr."},
   {v: "C", t:"Es wurden keine Schulden abgebaut."},
   {v: "D", t:"Fast 10 Mrd. Fr."}
 ],
 correct:"A",
 explain:"Gemäss Christoph Schaltegger wurden seit 2003 fast 27 Mrd. Fr. an Schulden abgebaut. Diese Resilienz ermöglichte es der Schweiz, in der Coronakrise schnell und umfangreich Fiskalimpulse zu setzen."},

{id:"r08", topic:"richtlinien", type:"open", diff:3, tax:"K5",reviewed:false,
 q:"'Die Schulden von heute sind die Steuern von morgen.' Beurteilen Sie diese Aussage von Christoph Schaltegger im Zusammenhang mit der Generationengerechtigkeit.",
 sample:"Die Aussage bedeutet, dass heutige Kreditfinanzierung die Zahllast auf zukünftige Generationen verschiebt. Diese müssen die Schulden über Steuererhöhungen oder Ausgabenkürzungen abtragen – obwohl sie an den ursprünglichen Ausgabeentscheiden nicht beteiligt waren. Das ist ein Problem der Generationengerechtigkeit: Die heutige Generation profitiert von den Ausgaben, die nächste Generation trägt die Kosten. Die Schuldenbremse soll genau dies verhindern, indem sie langfristig ausgeglichene Haushalte erzwingt.",
 explain:"Generationengerechtigkeit ist ein zentrales Argument für eine verantwortungsvolle Haushaltspolitik. Die Schweizer Schuldenbremse wird als Instrument gesehen, das langfristige Rationalität erzwingt."},

{id:"r09", topic:"richtlinien", type:"mc", diff:3, tax:"K3",reviewed:false,
 q:"Welche drei Optionen stehen einem Staat grundsätzlich zur Verfügung, um eine hohe Staatsverschuldung abzubauen?",
 options:[
   {v: "A", t:"IWF-Beitritt, EU-Hilfe und Schuldenerlass."},
   {v: "B", t:"Schulden ignorieren, neue Schulden aufnehmen und Währung abwerten."},
   {v: "C", t:"Haushaltsdisziplin (Ausgabenkürzungen/Steuererhöhungen), Inflation und Wirtschaftswachstum."},
   {v: "D", t:"Goldreserven verkaufen, Steuern abschaffen und Subventionen streichen."}
 ],
 correct:"C",
 explain:"Die drei Hauptoptionen sind: 1) Haushaltsdisziplin (weniger ausgeben oder mehr einnehmen), 2) Inflation (realer Wert der Schulden sinkt), 3) Wirtschaftswachstum (BIP wächst, Schuldenquote sinkt). Alle drei Optionen haben Vor- und Nachteile."},

{id:"r10", topic:"richtlinien", type:"open", diff:3, tax:"K5",reviewed:false,
 q:"Beurteilen Sie die Debatte 'Sparen vs. Wachstum' in der europäischen Schuldenkrise: Warum ist es weder ein reines 'Entweder-oder', sondern ein 'Sowohl-als-auch'?",
 sample:"Nur Sparen (Austerität) bremst kurzfristig die Konjunktur und kann die Krise verschärfen. Nur Wachstumsprogramme ohne Konsolidierung führen zu weiterer Verschuldung. Die Lösung liegt in einer Kombination: Einerseits muss der Haushalt konsolidiert werden (weniger Konsum-, mehr Investitionsausgaben). Andererseits müssen langfristige Wachstumsimpulse gesetzt werden – vor allem durch bessere Rahmenbedingungen für Unternehmen (Liberalisierungen, Strukturreformen, Bildungspolitik). Wachstum dank Investitionen ist primär Sache der Unternehmen, nicht des Staates.",
 explain:"Die historische Erfahrung zeigt: Weder reine Sparpolitik noch reine Schuldenfinanzierung führen aus der Krise. Strukturreformen und verbesserte Rahmenbedingungen sind der Schlüssel."},

// ── ZUSÄTZLICHE QUERSCHNITTSFRAGEN ──
{id:"q01", topic:"gefahren", type:"fill", diff:2, tax:"K2",reviewed:false,
 q:"Der Fachbegriff für den Aufkauf von Staatsanleihen durch die eigene Zentralbank lautet {0} der Staatsschuld.",
 blanks:[
   {answer:"Monetisierung", alts:[]}
 ],
 explain:"Bei der Monetisierung kauft die Zentralbank Staatsanleihen auf. Dies ist prinzipiell nicht unüblich, wird aber schädlich, wenn eine zu lockere Geldpolitik mit inflationären Folgen betrieben wird."},

{id:"q02", topic:"international", type:"fill", diff:2, tax:"K1",reviewed:false,
 q:"Die {0} Staatsverschuldung umfasst die aktuell bestehenden Verpflichtungen. Die {1} Staatsverschuldung berücksichtigt zusätzlich zukünftige, nicht gedeckte Verpflichtungen wie Rentenansprüche.",
 blanks:[
   {answer:"explizite", alts:[]},
   {answer:"implizite", alts:[]}
 ],
 explain:"Die implizite Verschuldung beträgt oft ein Vielfaches der expliziten. Für die Schweiz ergibt sich z.B. allein in der AHV bis 2030 ein geschätzter Fehlbetrag von 5 bis 11 Mrd. Fr."},

{id:"q03", topic:"richtlinien", type:"tf", diff:2, tax:"K2",reviewed:false,
 q:"Direkte Demokratien wie die Schweiz tendieren gemäss ökonomischer Analyse eher zu langfristiger Rationalität in der Finanzpolitik.",
 correct:true,
 explain:"Korrekt. Die Einführung der Schuldenbremse per Volksabstimmung zeigt, dass direkte Demokratien langfristige Interessen besser berücksichtigen können. Die Bürger haben erkannt, dass kurzfristiges Schulden-Machen langfristige Kosten verursacht."},

{id:"q04", topic:"gefahren", type:"mc", diff:3, tax:"K3",reviewed:false,
 q:"Warum haben die Notenbanken nach der Finanzkrise 2008 und der Coronakrise 2020 massiv Staatsanleihen aufgekauft?",
 options:[
   {v: "A", t:"Um die Inflation absichtlich zu erhöhen."},
   {v: "B", t:"Um die Zinsen der hochverschuldeten Staaten zu senken und die Wirtschaft zu stützen."},
   {v: "C", t:"Um die Staatsschulden endgültig zu tilgen."},
   {v: "D", t:"Um die Geldmenge dauerhaft zu reduzieren."}
 ],
 correct:"B",
 explain:"Die Zentralbanken (EZB, FED) kauften Staatsanleihen, um die Zinsen zu senken und die Finanzierungskosten der Staaten tragbar zu halten. Man erhoffte sich, dass die Staaten die Entlastung für den Schuldenabbau nutzen – was aber grösstenteils nicht geschah."},

{id:"q05", topic:"einnahmen", type:"mc", diff:2, tax:"K2",reviewed:false,
 q:"Was versteht man unter dem Finanzausgleich?",
 options:[
   {v: "A", t:"Ein System, das finanzielle Unterschiede zwischen finanzstarken und finanzschwachen Kantonen ausgleicht."},
   {v: "B", t:"Den jährlichen Ausgleich zwischen Einnahmen und Ausgaben des Bundes."},
   {v: "C", t:"Die Verteilung der SNB-Gewinne an die Kantone."},
   {v: "D", t:"Die Angleichung der Steuersätze aller Kantone."}
 ],
 correct:"A",
 explain:"Der Finanzausgleich sorgt dafür, dass auch finanzschwache Kantone ihre Aufgaben erfüllen können. Finanzstarke Kantone zahlen in den Ausgleich ein, finanzschwache erhalten Beiträge."},

// ── NEUE FRAGEN: STAATSANTEIL (s10–s12) ──
{id:"s10", topic:"staatsanteil", type:"multi", diff:2, tax:"K2",reviewed:false,
 q:"Welche der folgenden Faktoren erklären gemäss ökonomischer Theorie das langfristige Wachstum der Staatsausgaben? Mehrere Antworten können richtig sein.",
 options:[
   {v:"A", t:"Wagners Gesetz: Staatsausgaben wachsen überproportional zur Wirtschaft."},
   {v:"B", t:"Neue Politische Ökonomie: Budgetmaximierung durch Verwaltung."},
   {v:"C", t:"Sinkende Exportquoten zwingen den Staat zu höheren Ausgaben."},
   {v:"D", t:"Steigende Nachfrage nach öffentlichen Gütern bei wachsendem Wohlstand."}
 ],
 correct:["A","B","D"],
 explain:"Wagners Gesetz, Public Choice und die steigende Nachfrage nach öffentlichen Leistungen erklären alle das Wachstum der Staatsausgaben. Sinkende Exportquoten stehen nicht im Zusammenhang mit dem Wachstum der Staatsausgaben."},

{id:"s11", topic:"staatsanteil", type:"mc", diff:3, tax:"K4",reviewed:false,
 q:"Avenir Suisse schätzt die erweiterte Fiskalquote der Schweiz auf ca. 45%, während die offizielle Fiskalquote bei rund 28,6% liegt. Was erklärt diese Differenz?",
 options:[
   {v: "A", t:"Die erweiterte Quote schliesst obligatorische Zwangsabgaben ein, die statistisch nicht als Steuern gelten (z.B. Krankenkassenprämien)."},
   {v: "B", t:"Die Differenz ergibt sich aus der unterschiedlichen Berechnung des BIP."},
   {v: "C", t:"Die offizielle Quote berücksichtigt die Inflation nicht."},
   {v: "D", t:"Die erweiterte Quote zählt auch freiwillige Spenden an den Staat dazu."}
 ],
 correct:"A",
 explain:"Die offizielle Fiskalquote erfasst nur Steuern und obligatorische Sozialversicherungsbeiträge. Die erweiterte Fiskalquote berücksichtigt zusätzlich weitere Zwangsabgaben wie obligatorische Krankenkassenprämien, Gebühren und regulatorische Kosten, die in der offiziellen Statistik nicht enthalten sind."},

{id:"s12", topic:"staatsanteil", type:"tf", diff:1, tax:"K1",reviewed:false,
 q:"Die Fiskalquote der Schweiz ist höher als der OECD-Durchschnitt.",
 correct:false,
 explain:"Falsch. Die Fiskalquote der Schweiz (ca. 28,6%) liegt deutlich unter dem OECD-Durchschnitt (ca. 35%). Die Schweiz hat im internationalen Vergleich eine tiefe Steuerbelastung."},

// ── NEUE FRAGEN: AUSGABEN (a09–a11) ──
{id:"a09", topic:"ausgaben", type:"tf", diff:1, tax:"K1",reviewed:false,
 q:"Subventionen machen den grössten Anteil an den Bundesausgaben aus.",
 correct:true,
 explain:"Korrekt. Rund 59% der gesamten Bundesausgaben fliessen als Subventionen an Dritte. Davon entfallen 45% auf die soziale Wohlfahrt, 17% auf Bildung und Forschung und 15% auf den Verkehr."},

{id:"a10", topic:"ausgaben", type:"mc", diff:3, tax:"K4",reviewed:false,
 q:"Der Bund wird als 'Transferhaushalt' bezeichnet. Welche Problematik ergibt sich daraus für die Haushaltssteuerung?",
 options:[
   {v: "A", t:"Ein Grossteil der Ausgaben ist gebunden und kann kurzfristig nicht gekürzt werden."},
   {v: "B", t:"Der Bund muss alle Transfers jährlich neu vom Parlament genehmigen lassen."},
   {v: "C", t:"Die Kantone können die Transfers beliebig zurückweisen."},
   {v: "D", t:"Der Bund hat zu wenige Einnahmen, um die Transfers zu finanzieren."}
 ],
 correct:"A",
 explain:"Da rund zwei Drittel der Bundesausgaben als Übertragungen gebunden sind (Sozialversicherungen, Subventionen, Kantonsanteile), hat der Bund nur geringen Spielraum für kurzfristige Anpassungen. Sparanstrengungen können daher fast nur beim verbleibenden Drittel der Eigenausgaben ansetzen."},

{id:"a11", topic:"ausgaben", type:"fill", diff:1, tax:"K1",reviewed:false,
 q:"Die Ausgaben für {0} und Forschung wuchsen zwischen 2008 und 2018 mit +{1}% am stärksten.",
 blanks:[
   {answer:"Bildung", alts:[]},
   {answer:"67", alts:[]}
 ],
 explain:"Die Bildungsausgaben des Bundes stiegen von 2008 bis 2018 um 67%, gefolgt von der sozialen Wohlfahrt (+27%). Die Ausgaben für Finanzen und Steuern sanken sogar um 5%."},

// ── NEUE FRAGEN: EINNAHMEN (e09–e11) ──
{id:"e09", topic:"einnahmen", type:"multi", diff:2, tax:"K2",reviewed:false,
 q:"Welche der folgenden Steuern sind besonders konjunktursensibel, d.h. ihre Einnahmen schwanken stark mit der Wirtschaftslage?",
 options:[
   {v:"A", t:"Verrechnungssteuer"},
   {v:"B", t:"Mehrwertsteuer"},
   {v:"C", t:"Stempelabgaben"},
   {v:"D", t:"Mineralölsteuer"}
 ],
 correct:["A","B","C"],
 explain:"Die Verrechnungssteuer, Mehrwertsteuer und Stempelabgaben reagieren stark auf Konjunkturschwankungen: In Rezessionen sinken Konsum, Kapitalerträge und Börsentransaktionen. Die Mineralölsteuer ist dagegen relativ konjunkturunabhängig, da der Treibstoffverbrauch wenig schwankt."},

{id:"e10", topic:"einnahmen", type:"mc", diff:3, tax:"K4",reviewed:false,
 q:"Die Schweiz hat im Vergleich zu anderen europäischen Ländern einen besonders hohen Anteil an direkten Steuern. Welchen Vorteil hat dieses System?",
 options:[
   {v: "A", t:"Direkte Steuern verursachen keine Verzerrungen auf den Märkten."},
   {v: "B", t:"Direkte Steuern lassen sich besser vor den Bürgern verbergen."},
   {v: "C", t:"Direkte Steuern können progressiv gestaltet werden und die Steuerbelastung an die wirtschaftliche Leistungsfähigkeit anpassen."},
   {v: "D", t:"Direkte Steuern sind einfacher zu erheben als indirekte Steuern."}
 ],
 correct:"C",
 explain:"Direkte Steuern ermöglichen eine progressive Besteuerung nach Leistungsfähigkeit. Wer mehr verdient, zahlt proportional mehr. Dies erlaubt eine gerechtere Steuerbelastung als indirekte Steuern (z.B. Mehrwertsteuer), die alle gleich belasten und damit regressiv wirken."},

{id:"e11", topic:"einnahmen", type:"tf", diff:1, tax:"K1",reviewed:false,
 q:"Die Verrechnungssteuer wird bei korrekter Deklaration in der Steuererklärung zurückerstattet.",
 correct:true,
 explain:"Korrekt. Die Verrechnungssteuer (35% auf Kapitalerträge) ist eine Sicherungssteuer. Sie soll sicherstellen, dass Steuerpflichtige ihre Kapitalerträge korrekt deklarieren. Bei ordnungsgemässer Deklaration wird sie vollständig zurückerstattet."},

// ── NEUE FRAGEN: DEFIZITE (d09–d11) ──
{id:"d09", topic:"defizite", type:"mc", diff:1, tax:"K1",reviewed:false,
 q:"Was sind 'automatische Stabilisatoren'?",
 options:[
   {v: "A", t:"Geldpolitische Instrumente der Nationalbank."},
   {v: "B", t:"Staatliche Einnahmen und Ausgaben, die ohne politische Entscheide konjunkturglättend wirken."},
   {v: "C", t:"Internationale Abkommen zur Wirtschaftsstabilisierung."},
   {v: "D", t:"Konjunkturprogramme, die vom Parlament beschlossen werden."}
 ],
 correct:"B",
 explain:"Automatische Stabilisatoren wirken ohne aktive politische Entscheide: In Rezessionen sinken Steuereinnahmen und steigen Sozialausgaben (z.B. Arbeitslosenentschädigung) automatisch, was die Nachfrage stützt. Im Aufschwung kehrt sich der Effekt um."},

{id:"d10", topic:"defizite", type:"fill", diff:1, tax:"K1",reviewed:false,
 q:"Ein {0} Defizit entsteht in Rezessionsphasen und verschwindet im Aufschwung von selbst. Ein {1} Defizit besteht auch bei normaler Konjunkturlage.",
 blanks:[
   {answer:"konjunkturelles", alts:["konjunkturelles"]},
   {answer:"strukturelles", alts:["strukturelles"]}
 ],
 explain:"Konjunkturelle Defizite sind vorübergehend und wirken stabilisierend (automatische Stabilisatoren). Strukturelle Defizite dagegen sind dauerhaft und müssen durch aktive Massnahmen beseitigt werden."},

{id:"d11", topic:"defizite", type:"open", diff:3, tax:"K5",reviewed:false,
 q:"Beurteilen Sie: In der Coronakrise 2020 gab die Schweiz über 30 Mrd. Fr. für Soforthilfe aus. War dieses Defizit konjunkturell oder strukturell? Begründen Sie Ihre Einschätzung.",
 sample:"Das Corona-Defizit war primär konjunkturell: Es entstand durch eine einmalige, externe Krise (Pandemie), nicht durch dauerhafte Ausgabenüberschüsse. Die Soforthilfen (Kurzarbeitsentschädigungen, Härtefalldarlehen, Erwerbsersatz) waren zeitlich befristet und auf die Krise beschränkt. Dank der Schuldenbremse konnte die Schweiz die aufgenommenen Schulden als ausserordentlich verbuchen. Der Bundesrat hat einen Abbauplan über sechs Jahre vorgelegt, was zeigt, dass die Verschuldung als temporär betrachtet wird.",
 explain:"Die Corona-Defizite waren grösstenteils konjunkturell bzw. krisenbedingt. Die Schweizer Schuldenbremse unterscheidet zwischen ordentlichem und ausserordentlichem Haushalt und sieht für Letzteres eine spezielle Tilgungsregel vor."},

// ── NEUE FRAGEN: INTERNATIONAL (i08–i10) ──
{id:"i08", topic:"international", type:"tf", diff:1, tax:"K1",reviewed:false,
 q:"In der Schweiz haben die privaten Haushalte einen grösseren Schuldenanteil als der Staat.",
 correct:true,
 explain:"Korrekt. Von den gesamten Schulden der Schweiz (ohne Finanzsektor) entfallen 47% auf private Haushalte (vor allem Hypotheken), 35% auf Unternehmen und nur 18% auf den Staat."},

{id:"i09", topic:"international", type:"multi", diff:2, tax:"K2",reviewed:false,
 q:"Welche Länder liegen gemäss IWF-Daten über der Rogoff/Reinhart-Schwelle von 90% Schuldenquote?",
 img:{src:"img/vwl/staatsverschuldung/schuldenquoten_international.svg", alt:"Schuldenquoten ausgewählter Länder"},
 options:[
   {v:"A", t:"Japan"},
   {v:"B", t:"Griechenland"},
   {v:"C", t:"Italien"},
   {v:"D", t:"Deutschland"}
 ],
 correct:["A","B","C"],
 explain:"Japan (ca. 263%), Griechenland (ca. 177%) und Italien (ca. 144%) liegen alle deutlich über dem Schwellenwert von 90%. Deutschland (ca. 64%) und die Schweiz (ca. 27%) liegen darunter."},

{id:"i10", topic:"international", type:"mc", diff:3, tax:"K4",reviewed:false,
 q:"Japan hat trotz einer Schuldenquote von über 230% bisher keinen Staatsbankrott erlitten. Was ist eine wichtige Erklärung dafür?",
 options:[
   {v: "A", t:"Der IWF garantiert die Schulden Japans."},
   {v: "B", t:"Japan hat seine Schulden im Geheimen bereits getilgt."},
   {v: "C", t:"Der Grossteil der japanischen Staatsschulden wird von inländischen Sparern und Institutionen gehalten."},
   {v: "D", t:"Japan hat eine höhere Bevölkerungszahl als andere verschuldete Länder."}
 ],
 correct:"C",
 explain:"Etwa 90% der japanischen Staatsschulden werden von inländischen Gläubigern (Banken, Versicherungen, Zentralbank, Privatpersonen) gehalten. Dies reduziert das Risiko eines Kapitalabzugs durch ausländische Investoren und ermöglicht sehr tiefe Zinsen. Allerdings ist diese Situation nicht risikolos – besonders angesichts der alternden Bevölkerung."},

// ── NEUE FRAGEN: GEFAHREN (g11–g13) ──
{id:"g11", topic:"gefahren", type:"tf", diff:1, tax:"K1",reviewed:false,
 q:"Beim Crowding-out verdrängt der Staat als Kreditnehmer private Investoren vom Kapitalmarkt.",
 correct:true,
 explain:"Korrekt. Wenn der Staat grosse Mengen an Kapital am Markt aufnimmt, konkurriert er mit privaten Investoren. Investoren bevorzugen oft den sicheren Schuldner Staat, wodurch privaten Unternehmen weniger Kapital zur Verfügung steht."},

{id:"g12", topic:"gefahren", type:"multi", diff:3, tax:"K4",reviewed:false,
 q:"Welche der folgenden Aussagen treffen auf die Monetisierung von Staatsschulden zu?",
 options:[
   {v:"A", t:"Die Zentralbank kauft Staatsanleihen auf."},
   {v:"B", t:"Die Geldmenge wird dadurch ausgeweitet."},
   {v:"C", t:"Die Zinsen steigen sofort und dauerhaft."},
   {v:"D", t:"Langfristig steigt die Inflationsgefahr."}
 ],
 correct:["A","B","D"],
 explain:"Bei der Monetisierung kauft die Zentralbank Staatsanleihen, was die Geldmenge ausweitet und langfristig inflationäre Folgen haben kann. Die Zinsen sinken kurzfristig sogar (wegen der zusätzlichen Liquidität), können aber langfristig aufgrund von Inflationserwartungen steigen."},

{id:"g13", topic:"gefahren", type:"mc", diff:1, tax:"K1",reviewed:false,
 q:"Was droht einem Staat, der seine Schulden nicht mehr bedienen kann?",
 options:[
   {v: "A", t:"Der Staat wird automatisch von der UNO übernommen."},
   {v: "B", t:"Alle Bürger müssen persönlich für die Staatsschulden haften."},
   {v: "C", t:"Ein Staatsbankrott mit möglichem Schuldenerlass ('Haircut') für die Gläubiger."},
   {v: "D", t:"Die Schulden verfallen nach 10 Jahren automatisch."}
 ],
 correct:"C",
 explain:"Bei Zahlungsunfähigkeit verhandelt der Staat mit seinen Gläubigern über eine Umschuldung. Oft wird ein 'Haircut' vereinbart, bei dem die Gläubiger auf einen Teil ihrer Forderungen verzichten. Der IWF unterstützt häufig den Neuanfang, stellt aber strenge Auflagen."},

// ── NEUE FRAGEN: RICHTLINIEN (r11–r14) ──
{id:"r11", topic:"richtlinien", type:"tf", diff:1, tax:"K1",reviewed:false,
 q:"Die Schweizer Schuldenbremse ist in der Bundesverfassung verankert.",
 correct:true,
 explain:"Korrekt. Die Schuldenbremse wurde 2001 vom Volk mit 84,7% Zustimmung angenommen und ist seit 2003 in Kraft. Sie ist in der Bundesverfassung (Art. 126 BV) verankert und bindet Bundesrat und Parlament."},

{id:"r12", topic:"richtlinien", type:"mc", diff:2, tax:"K3",reviewed:false,
 q:"In der Coronakrise hat der Bund über 30 Mrd. Fr. an ausserordentlichen Ausgaben getätigt. Wie lässt sich das mit der Schuldenbremse vereinbaren?",
 options:[
   {v: "A", t:"Die Schuldenbremse sieht einen ausserordentlichen Haushalt für Krisenausgaben vor, der separat geführt und innerhalb von sechs Jahren abgebaut werden muss."},
   {v: "B", t:"Die Coronaausgaben wurden nicht als Staatsausgaben verbucht."},
   {v: "C", t:"Die Schuldenbremse wurde für die Dauer der Krise ausser Kraft gesetzt."},
   {v: "D", t:"Die Schuldenbremse erlaubt unbegrenzte Ausgaben in Notfällen."}
 ],
 correct:"A",
 explain:"Die Schuldenbremse unterscheidet zwischen ordentlichem und ausserordentlichem Haushalt. Ausserordentliche Ausgaben (wie in der Coronakrise) werden separat verbucht und müssen innerhalb von sechs Jahren wieder abgebaut werden. So bleibt die langfristige Haushaltsdisziplin gewahrt."},

{id:"r13", topic:"richtlinien", type:"mc", diff:3, tax:"K5",reviewed:false,
 q:"Seit 2003 hat die Schweiz dank der Schuldenbremse fast 27 Mrd. Fr. Schulden abgebaut. Ein Kritikpunkt lautet, der Bund spare 'zu viel'. Was könnte damit gemeint sein?",
 options:[
   {v: "A", t:"Der Schuldenabbau verursacht Inflation."},
   {v: "B", t:"Die Kantone werden durch die Schuldenbremse zu höheren Ausgaben gezwungen."},
   {v: "C", t:"Der systematische Schuldenabbau reduziert den Handlungsspielraum für Investitionen und öffentliche Leistungen."},
   {v: "D", t:"Die Schuldenbremse führt dazu, dass der Staat überhaupt keine Schulden mehr haben darf."}
 ],
 correct:"C",
 explain:"Kritiker argumentieren, dass der kontinuierliche Schuldenabbau dazu führt, dass nötige Investitionen (z.B. in Infrastruktur, Bildung, Digitalisierung) unterbleiben. Die Schuldenbremse erzeuge einen strukturellen Überschuss, der den Handlungsspielraum des Bundes unnötig einschränke. Befürworter halten dagegen, dass die Resilienz der Schweiz (z.B. in der Coronakrise) gerade auf diesen Puffern beruht."},

{id:"r14", topic:"richtlinien", type:"sort", diff:2, tax:"K2",reviewed:false,
 q:"Ordnen Sie die folgenden Massnahmen zum Abbau hoher Staatsschulden der passenden Strategie zu.",
 categories:["Haushaltsdisziplin", "Wirtschaftswachstum", "Inflation"],
 items:[
   {t:"Ausgabenkürzungen bei Sozialleistungen", cat:0},
   {t:"BIP wächst schneller als die Schulden → Schuldenquote sinkt", cat:1},
   {t:"Geldmenge steigt → realer Wert der Schulden sinkt", cat:2},
   {t:"Steuererhöhungen zur Erhöhung der Einnahmen", cat:0},
   {t:"Strukturreformen verbessern Produktivität", cat:1},
   {t:"Kaufkraft der Gläubiger wird geschmälert", cat:2}
 ],
 explain:"Schulden können durch Haushaltsdisziplin (Sparen), Wirtschaftswachstum (Schuldenquote sinkt relativ) oder Inflation (realer Wert der Schulden sinkt) abgebaut werden. Alle drei Strategien haben Vor- und Nachteile: Sparen bremst kurzfristig, Wachstum braucht Zeit, und Inflation schadet den Gläubigern und der Bevölkerung."},

// --- Sortierungsfragen ---
{id: "neu_sort_01", topic: "richtlinien", type: "sortierung", diff: 2, tax: "K3", reviewed: false,
 q: "Ordnen Sie die Schritte der Schweizer Schuldenbremse in die korrekte funktionale Reihenfolge.",
 items: [
   "Konjunkturfaktor bestimmen (Verhältnis Trend-BIP zu aktuellem BIP)",
   "Ausgabenplafond berechnen (geschätzte Einnahmen × Konjunkturfaktor)",
   "Budget des Bundes an den Ausgabenplafond anpassen",
   "In Boomphasen Überschüsse erzielen (Einnahmen > Ausgaben)",
   "In Rezessionen moderate Defizite zulassen (Ausgaben > Einnahmen)"
 ],
 correct: [0, 1, 2, 3, 4],
 explain: "Die Schweizer Schuldenbremse (seit 2003 in der BV verankert) funktioniert antizyklisch: Der Konjunkturfaktor erlaubt in Rezessionen höhere Ausgaben und erzwingt in Boomphasen Sparen. Über den Konjunkturzyklus hinweg sollen sich Defizite und Überschüsse ausgleichen. Die Schuldenbremse hat wesentlich zur Reduktion der Schweizer Schuldenquote beigetragen."
},
{id: "neu_sort_02", topic: "gefahren", type: "sortierung", diff: 3, tax: "K3", reviewed: false,
 q: "Ordnen Sie die folgenden Gefahren einer hohen Staatsverschuldung nach ihrem typischen zeitlichen Auftreten – von der kurzfristigen zur langfristigen Gefahr.",
 items: [
   "Steigende Zinsausgaben schränken den Handlungsspielraum im laufenden Budget ein",
   "Crowding-out: Staatliche Kreditaufnahme verdrängt private Investitionen",
   "Verlust des Vertrauens der Finanzmärkte (steigende Risikoprämien)",
   "Generationenungerechtigkeit: Künftige Generationen müssen die Schulden zurückzahlen"
 ],
 correct: [0, 1, 2, 3],
 explain: "Zinsbelastung wirkt sofort (jedes Budgetjahr). Crowding-out zeigt sich mittelfristig, wenn der Staat die Kreditnachfrage hochtreibt. Vertrauensverlust kann plötzlich eintreten (Schuldenkrise, z.B. Griechenland 2010). Generationenungerechtigkeit ist ein langfristiges Problem – die heutigen Schulden werden von künftigen Steuerzahlern getragen."
},
{id: "neu_sort_03", topic: "international", type: "sortierung", diff: 2, tax: "K3", reviewed: false,
 q: "Ordnen Sie die folgenden Länder nach ihrer Schuldenquote (Staatsverschuldung in % des BIP) – vom niedrigsten zum höchsten Wert.",
 items: [
   "Schweiz (ca. 27% des BIP)",
   "Deutschland (ca. 65% des BIP)",
   "USA (ca. 120% des BIP)",
   "Japan (ca. 260% des BIP)"
 ],
 correct: [0, 1, 2, 3],
 explain: "Die Schweiz hat dank der Schuldenbremse eine der tiefsten Schuldenquoten weltweit. Deutschland liegt im EU-Mittelfeld (Maastricht-Kriterium: max. 60%). Die USA haben ihre Verschuldung seit der Finanzkrise und COVID massiv erhöht. Japan hat die höchste Schuldenquote aller Industrieländer – finanziert aber den Grossteil im Inland."
},

// ===== INTERAKTIVE FRAGETYPEN (Hotspot, Bildbeschriftung, DragDrop) =====

// --- Bildbeschriftung: Schuldenbremse ---
{
  id: "beschriftung01", topic: "richtlinien", type: "bildbeschriftung", diff: 2, tax: "K2", reviewed: false,
  q: "Beschrifte die Elemente der Schweizer Schuldenbremse.",
  img: { src: "img/vwl/staatsverschuldung/staatsverschuldung_schuldenbremse_beschriftung.svg", alt: "Schuldenbremse-Mechanismus mit fünf nummerierten Beschriftungspunkten" },
  labels: [
    {id: "l1", text: "Konjunkturfaktor (k)", x: 50, y: 17},
    {id: "l2", text: "Ausgabenplafond = Einnahmen × k", x: 50, y: 37},
    {id: "l3", text: "Boom: k < 1 → Pflicht zu Überschüssen", x: 19, y: 62},
    {id: "l4", text: "Rezession: k > 1 → Defizite erlaubt", x: 81, y: 62},
    {id: "l5", text: "Ausgleichskonto: Kontrolle über Zyklen", x: 50, y: 84}
  ],
  explain: "Schweizer Schuldenbremse (seit 2003): Der Konjunkturfaktor k steuert die erlaubten Ausgaben. Im Boom (k<1) Überschüsse, in der Rezession (k>1) Defizite. Das Ausgleichskonto überwacht den Ausgleich über den Zyklus."
},
// --- DragDrop: Fiskalpolitische Massnahmen ---
{
  id: "dragdrop01", topic: "defizite", type: "dragdrop_bild", diff: 2, tax: "K3", reviewed: false,
  q: "Ordne die folgenden fiskalpolitischen Massnahmen der richtigen Ausrichtung zu.",
  img: { src: "img/vwl/staatsverschuldung/staatsverschuldung_fiskalpolitik_dragdrop.svg", alt: "Zwei Spalten: Expansive und Restriktive Fiskalpolitik" },
  zones: [
    {id: "expansiv", x: 2.5, y: 14, w: 46, h: 82},
    {id: "restriktiv", x: 51.5, y: 14, w: 46, h: 82}
  ],
  labels: [
    {id: "m1", text: "Erhöhung der Staatsausgaben", zone: "expansiv"},
    {id: "m2", text: "Steuersenkungen", zone: "expansiv"},
    {id: "m3", text: "Konjunkturprogramme", zone: "expansiv"},
    {id: "m4", text: "Subventionen erhöhen", zone: "expansiv"},
    {id: "m5", text: "Kürzung der Staatsausgaben", zone: "restriktiv"},
    {id: "m6", text: "Steuererhöhungen", zone: "restriktiv"},
    {id: "m7", text: "Sparprogramme", zone: "restriktiv"},
    {id: "m8", text: "Abbau von Subventionen", zone: "restriktiv"}
  ],
  explain: "Expansiv (Rezession): Mehr Ausgaben, weniger Steuern → stimuliert Nachfrage. Restriktiv (Überhitzung/Schuldenabbau): Weniger Ausgaben, mehr Steuern → bremst Nachfrage."
}

];
