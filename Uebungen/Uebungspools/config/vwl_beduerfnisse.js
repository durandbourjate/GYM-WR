// Übungspool: Bedürfnisse, Knappheit & Produktionsfaktoren
// Fachbereich: VWL
// Anzahl Fragen: 70

window.POOL_META = {
  id: "vwl_beduerfnisse",
  fach: "VWL",
  title: "Übungspool: Bedürfnisse, Knappheit & Produktionsfaktoren",
  meta: "SF GYM1 · Gymnasium Hofwil · Individuell üben",
  color: "vwl"
};

window.TOPICS = {
  knappheit:{label:"Knappheit & Grundfragen der VWL",short:"Knappheit"},
  beduerfnisse:{label:"Bedürfnisse & Bedürfnispyramide",short:"Bedürfnisse"},
  gueter:{label:"Güterarten",short:"Güter"},
  produktionsfaktoren:{label:"Produktionsfaktoren",short:"Prod.faktoren"},
  oekprinzip:{label:"Ökonomisches Prinzip",short:"Ök. Prinzip"},
  arbeitsteilung:{label:"Arbeitsteilung, Tausch & Geld",short:"Arbeitsteilung"},
  sektoren:{label:"Wirtschaftssektoren & Strukturwandel",short:"Sektoren"}
};

window.QUESTIONS = [
// ──── KNAPPHEIT (k01–k10) ────
{id:"k01",topic:"knappheit",type:"mc",diff:1,tax:"K1",
 q:"Was ist das zentrale Problem, mit dem sich die Volkswirtschaftslehre beschäftigt?",
 options:[{v:"A",t:"Knappheit – die verfügbaren Mittel reichen nicht aus, um alle Bedürfnisse zu befriedigen."},{v:"B",t:"Die Maximierung der Exporte eines Landes."},{v:"C",t:"Die Verteilung der Macht zwischen Staat und Wirtschaft."},{v:"D",t:"Die Verwaltung von Unternehmen."}],
 correct:"A",explain:"Die VWL wird oft als «Lehre von Entscheidungen bei Knappheit» bezeichnet. Knappheit entsteht, weil wir von bestimmten Gütern mehr haben wollen, als uns zur Verfügung steht. Es geht also immer um das Verhältnis zwischen (unbegrenzten) Bedürfnissen und (begrenzten) Mitteln."},

{id:"k02",topic:"knappheit",type:"tf",diff:1,tax:"K1",
 q:"Knappheit bedeutet, dass ein Gut selten ist.",
 correct:false,explain:"Falsch. Knappheit bedeutet nicht dasselbe wie Seltenheit. Knappheit entsteht durch das Verhältnis zwischen Bedürfnissen und verfügbaren Mitteln: Wir wollen mehr, als vorhanden ist. Auch ein häufig vorhandenes Gut kann knapp sein, wenn die Nachfrage das Angebot übersteigt."},

{id:"k03",topic:"knappheit",type:"fill",diff:1,tax:"K1",
 q:"Die VWL beschäftigt sich mit dem Problem der {0}. Knappheit entsteht, weil die {1} der Menschen unbegrenzt sind, die {2} zur Befriedigung aber begrenzt.",
 blanks:[
   {answer:"Knappheit",alts:[]},
   {answer:"Bedürfnisse",alts:["Wünsche"]},
   {answer:"Mittel",alts:["Güter","Ressourcen"]}
 ],
 explain:"Das Grundproblem der VWL: Unbegrenzte Bedürfnisse treffen auf begrenzte Mittel (Güter, Ressourcen). Deshalb müssen wir wirtschaften, also Entscheidungen treffen, wie wir die knappen Mittel am besten einsetzen."},

{id:"k04",topic:"knappheit",type:"mc",diff:2,tax:"K2",
 q:"Was ist der Unterschied zwischen Volkswirtschaftslehre (VWL) und Betriebswirtschaftslehre (BWL)?",
 options:[{v:"A",t:"Die VWL betrachtet die gesamtwirtschaftlichen Zusammenhänge (alle Haushalte, Unternehmen, Staat), die BWL betrachtet einzelne Betriebe und deren Innenleben."},{v:"B",t:"Die VWL beschäftigt sich mit Geld, die BWL mit Gütern."},{v:"C",t:"Die VWL untersucht nur den Staat, die BWL nur die Privaten."},{v:"D",t:"Es gibt keinen wesentlichen Unterschied."}],
 correct:"A",explain:"BWL = Mikro-Perspektive (einzelnes Unternehmen, z.B. Marketing, Buchführung, Organisation). VWL = Makro-Perspektive (gesamte Volkswirtschaft, z.B. Arbeitslosigkeit, Inflation, Wirtschaftswachstum). Beide gehören zu den Wirtschaftswissenschaften, die wiederum Teil der Sozialwissenschaften sind."},

{id:"k05",topic:"knappheit",type:"open",diff:2,tax:"K2",
 q:"Erklären Sie, warum «Wirtschaften» notwendig ist. Verwenden Sie die Begriffe «Knappheit» und «Bedürfnisse».",
 sample:"Wirtschaften ist notwendig, weil die Bedürfnisse der Menschen unbegrenzt sind, die Mittel (Güter, Ressourcen, Zeit, Geld) aber begrenzt. Es entsteht Knappheit. Deshalb müssen wir Entscheidungen treffen: Welche Bedürfnisse befriedigen wir zuerst? Wie setzen wir die knappen Mittel am effizientesten ein? Wirtschaften bedeutet also das Gewinnen, Herstellen und Verteilen von knappen Gütern zur Deckung menschlicher Bedürfnisse nach dem ökonomischen Prinzip.",
 explain:"Wirtschaften = rationaler Umgang mit Knappheit. Ohne Knappheit wäre Wirtschaften überflüssig (Schlaraffenland). Da wir aber nicht alles haben können, müssen wir abwägen und Prioritäten setzen."},

{id:"k06",topic:"knappheit",type:"tf",diff:1,tax:"K1",
 q:"Die Volkswirtschaftslehre gehört zu den Sozialwissenschaften.",
 correct:true,explain:"Richtig. Die Wirtschaftswissenschaften (VWL und BWL) sind Teil der Sozialwissenschaften, zusammen mit z.B. Soziologie und Rechtswissenschaft. Sie gehören zu den Geisteswissenschaften (im Gegensatz zu den Naturwissenschaften)."},

{id:"k07",topic:"knappheit",type:"mc",diff:2,tax:"K2",
 q:"Welche drei Aufgaben hat die Volkswirtschaftslehre?",
 options:[{v:"A",t:"Beschreiben und erklären von Phänomenen, Prognostizieren von Entwicklungen, Möglichkeiten der Beeinflussung aufzeigen."},{v:"B",t:"Gewinne maximieren, Kosten senken, Märkte erobern."},{v:"C",t:"Gesetze erlassen, Steuern erheben, Währungen drucken."},{v:"D",t:"Preise festlegen, Löhne bestimmen, Handel regeln."}],
 correct:"A",explain:"Die VWL hat drei Aufgaben: (1) Theoretisch-wissenschaftlich: Phänomene beschreiben und erklären (z.B. warum gibt es Arbeitslosigkeit?). (2) Prognosen: Entwicklungen vorhersagen. (3) Wirtschaftspolitisch: Möglichkeiten der Beeinflussung aufzeigen."},

// ── NEU: k08–k10 ──
{id:"k08",topic:"knappheit",type:"multi",diff:2,tax:"K2",
 q:"Welche der folgenden Aussagen über Knappheit sind korrekt?",
 options:[{v:"A",t:"Knappheit entsteht aus dem Verhältnis von Bedürfnissen und verfügbaren Mitteln."},{v:"B",t:"Knappheit betrifft nur arme Länder."},{v:"C",t:"Auch wohlhabende Gesellschaften sind mit Knappheit konfrontiert."},{v:"D",t:"Knappheit ist dasselbe wie Armut."}],
 correct:["A","C"],explain:"A und C sind richtig. Knappheit ist ein relatives Konzept: Solange Bedürfnisse die verfügbaren Mittel übersteigen, herrscht Knappheit – unabhängig vom Wohlstandsniveau. Auch in der Schweiz sind z.B. Zeit, Bauland und Fachkräfte knapp. Armut hingegen bedeutet, dass Grundbedürfnisse nicht gedeckt werden können – das ist etwas anderes."},

{id:"k09",topic:"knappheit",type:"mc",diff:3,tax:"K4",
 q:"In einem Gedankenexperiment gäbe es plötzlich unbegrenzte Energie und alle Güter wären durch Roboter gratis herstellbar. Wäre Knappheit damit abgeschafft?",
 options:[{v:"A",t:"Nein, denn knappe Güter wie Zeit, persönliche Aufmerksamkeit und bestimmte Standorte lassen sich nicht beliebig vermehren."},{v:"B",t:"Ja, weil alle Bedürfnisse kostenlos befriedigt werden könnten."},{v:"C",t:"Ja, weil Knappheit nur ein Problem der Produktion ist."},{v:"D",t:"Nein, weil die Roboter selbst knapp wären."}],
 correct:"A",explain:"Selbst bei unbegrenzter Güterproduktion blieben bestimmte Dinge knapp: Zeit (jeder Mensch hat nur 24 Stunden), Aufmerksamkeit anderer Menschen, einzigartige Standorte (Seegrundstück), natürliche Schönheit, Status und Ansehen. Knappheit ist letztlich ein Grundproblem, das sich nicht vollständig aufheben lässt."},

{id:"k10",topic:"knappheit",type:"tf",diff:3,tax:"K4",
 q:"Wenn die Schweiz ihren Wohlstand verdoppeln würde, wäre das Knappheitsproblem gelöst.",
 correct:false,explain:"Falsch. Knappheit ist relativ: Mit steigendem Wohlstand entstehen neue, anspruchsvollere Bedürfnisse (grössere Wohnung, mehr Reisen, bessere Gesundheitsversorgung). Die Ansprüche wachsen mit dem Wohlstand. Eisenhut betont, dass die Bedürfnisse grundsätzlich unbegrenzt sind – das ändert sich auch bei Wohlstandswachstum nicht."},

// ──── BEDÜRFNISSE (b01–b11) ────
{id:"b01",topic:"beduerfnisse",type:"mc",diff:1,tax:"K1",
 q:"Was versteht man unter einem Bedürfnis?",
 options:[{v:"A",t:"Den Wunsch, einen empfundenen Mangel zu beseitigen oder zu mildern."},{v:"B",t:"Die Menge an Gütern, die ein Haushalt kauft."},{v:"C",t:"Das Einkommen einer Person."},{v:"D",t:"Die Produktionsmenge eines Unternehmens."}],
 correct:"A",explain:"Ein Bedürfnis ist der Wunsch, einen empfundenen Mangel zu beseitigen oder zu mildern. Der Begriff wird in der VWL sehr weit gefasst: Er umfasst nicht nur materielle Wünsche, sondern auch z.B. Macht, Ansehen, Sicherheit, Schönheit, Abwechslung und Selbstverwirklichung."},

{id:"b02",topic:"beduerfnisse",type:"tf",diff:1,tax:"K1",
 q:"Gemäss der VWL sind die Bedürfnisse der Menschen grundsätzlich unbegrenzt.",
 correct:true,explain:"Richtig. Ökonomen gehen davon aus, dass die Bedürfnisse der Menschen unbegrenzt sind. Sobald ein Bedürfnis befriedigt ist, entstehen neue Wünsche. Diese Annahme ist zentral für das Knappheitsproblem."},

{id:"b03",topic:"beduerfnisse",type:"sort",diff:1,tax:"K2",
 q:"Ordnen Sie die folgenden Beispiele den Stufen der Maslow'schen Bedürfnispyramide zu.",
 categories:["Körperliche Bedürfnisse","Sicherheitsbedürfnisse","Soziale Bedürfnisse","Selbstverwirklichung"],
 items:[
   {t:"Essen und Trinken",cat:0},{t:"Krankenversicherung",cat:1},
   {t:"Freundschaften pflegen",cat:2},{t:"Ein Buch schreiben",cat:3},
   {t:"Ein Dach über dem Kopf",cat:0},{t:"Stabiler Arbeitsplatz",cat:1},
   {t:"Zugehörigkeit zu einer Gruppe",cat:2},{t:"Kreativ tätig sein",cat:3}
 ],
 explain:"Maslow'sche Bedürfnispyramide von unten nach oben: (1) Körperliche Grundbedürfnisse (Nahrung, Schlaf, Wärme), (2) Sicherheit (Schutz, Versicherung, Arbeitsplatz), (3) Soziale Bedürfnisse (Zugehörigkeit, Freundschaft), (4) Wertschätzung, (5) Selbstverwirklichung. In der Praxis versuchen Menschen, mehrere Stufen gleichzeitig zu erfüllen."},

{id:"b04",topic:"beduerfnisse",type:"fill",diff:1,tax:"K1",
 q:"Die Maslow'sche Bedürfnispyramide hat vier Hauptstufen: Zuunterst die {0}, darüber die {1}, dann die {2} und zuoberst die {3}.",
 blanks:[
   {answer:"körperlichen Bedürfnisse",alts:["Grundbedürfnisse","körperliche Bedürfnisse","physiologischen Bedürfnisse"]},
   {answer:"Sicherheitsbedürfnisse",alts:["Sicherheit"]},
   {answer:"sozialen Bedürfnisse",alts:["soziale Bedürfnisse","Sozialbedürfnisse"]},
   {answer:"Selbstverwirklichung",alts:["Selbstverwirklichungsbedürfnisse"]}
 ],
 explain:"Maslow ordnet Bedürfnisse hierarchisch: Körperlich → Sicherheit → Sozial → (Wertschätzung →) Selbstverwirklichung. Die Darstellung in der Präsentation fasst Wertschätzung und Selbstverwirklichung zusammen. Eisenhut nennt 5 Stufen inkl. Wertschätzungsbedürfnisse."},

{id:"b05",topic:"beduerfnisse",type:"mc",diff:2,tax:"K2",
 q:"Jemand kauft einen teuren Geländewagen, obwohl er nur in der Stadt fährt. Welche Bedürfnisstufe wird hier primär befriedigt?",
 options:[{v:"A",t:"Wertschätzungsbedürfnisse (Status, Ansehen) – der Geländewagen dient als Statussymbol."},{v:"B",t:"Körperliche Bedürfnisse – der Wagen bietet Mobilität."},{v:"C",t:"Sicherheitsbedürfnisse – der grosse Wagen schützt bei Unfällen."},{v:"D",t:"Soziale Bedürfnisse – man gehört zu einer Gemeinschaft."}],
 correct:"A",explain:"Dieses Beispiel stammt direkt aus dem Lehrbuch (Eisenhut). Wenn jemand einen Geländewagen für den Stadtverkehr kauft, wird damit ein anderes Bedürfnis (Status, Ansehen) befriedigt als dem Gut eigentlich zugedacht ist (Geländefahrten). Das Gut wird zum Statussymbol."},

{id:"b06",topic:"beduerfnisse",type:"open",diff:2,tax:"K3",
 q:"Nennen Sie ein eigenes Beispiel für ein Gut, das als Statussymbol verwendet wird, und erklären Sie, welches Bedürfnis damit eigentlich befriedigt wird.",
 sample:"Beispiel: Teure Marken-Sneakers (z.B. Jordans für CHF 300+). Eigentlicher Zweck: Schutz der Füsse (Grundbedürfnis). Als Statussymbol: Wertschätzung und Zugehörigkeit zur Gruppe. Das Bedürfnis nach Ansehen und Anerkennung (Wertschätzungsbedürfnis) wird wichtiger als der praktische Nutzen.",
 explain:"Eisenhut nennt weitere Beispiele: Champagner verspritzen statt trinken, Van Gogh im Banktresor statt an der Wand. Statussymbole zeigen, dass Güter oft mehrere Bedürfnisstufen gleichzeitig ansprechen."},

{id:"b07",topic:"beduerfnisse",type:"tf",diff:2,tax:"K2",
 q:"Gemäss Maslow befriedigen Menschen immer zuerst alle Grundbedürfnisse, bevor sie sich höheren Bedürfnissen zuwenden.",
 correct:false,explain:"Falsch. Maslow beschreibt zwar eine Hierarchie, aber in der Praxis versuchen Menschen, Bedürfnisse aus verschiedenen Stufen gleichzeitig zu erfüllen. Eisenhut betont: «Der Mensch versucht, möglichst viele Wünsche aus den unterschiedlichen Ebenen gleichzeitig zu erfüllen.»"},

{id:"b08",topic:"beduerfnisse",type:"mc",diff:2,tax:"K3",
 q:"Ein Schüler lernt 4 Stunden für eine Prüfung und erzielt die Note 5. Am nächsten Tag merkt er, dass sein Mitschüler mit nur 2 Stunden Lernzeit dieselbe Note erreicht hat. Welches ökonomische Konzept erklärt diesen Unterschied?",
 options:[{v:"A",t:"Der Mitschüler hat das Minimumprinzip (Sparsamkeitsprinzip) besser umgesetzt."},{v:"B",t:"Der Mitschüler hat das Maximumprinzip besser umgesetzt."},{v:"C",t:"Es handelt sich um Knappheit von Lernzeit."},{v:"D",t:"Der Mitschüler hat mehr Produktionsfaktoren eingesetzt."}],
 correct:"A",explain:"Minimumprinzip: Ein bestimmtes Ergebnis (Note 5) mit minimalem Aufwand (2 statt 4 Stunden) erreichen. Das ist wirtschaftlich effizienter. Das Maximumprinzip wäre umgekehrt: Mit gegebenem Aufwand das bestmögliche Ergebnis erzielen."},

// ── NEU: b09–b11 ──
{id:"b09",topic:"beduerfnisse",type:"multi",diff:2,tax:"K2",
 q:"Welche der folgenden Beispiele gehören zu den Sicherheitsbedürfnissen in Maslows Pyramide?",
 options:[{v:"A",t:"Abschluss einer Hausratversicherung"},{v:"B",t:"Mitgliedschaft im Sportverein"},{v:"C",t:"Fester Arbeitsvertrag mit Kündigungsschutz"},{v:"D",t:"Besuch eines Konzerts mit Freunden"}],
 correct:["A","C"],explain:"A und C sind richtig. Sicherheitsbedürfnisse umfassen den Schutz vor Unsicherheit und Gefahren: Versicherungen (A) schützen vor finanziellen Risiken, ein fester Arbeitsvertrag (C) bietet wirtschaftliche Sicherheit. Der Sportverein (B) und das Konzert (D) gehören zu den sozialen Bedürfnissen (Zugehörigkeit, Gemeinschaft)."},

{id:"b10",topic:"beduerfnisse",type:"mc",diff:3,tax:"K4",
 q:"Maslow wird häufig kritisiert. Welcher Kritikpunkt ist aus volkswirtschaftlicher Sicht am gewichtigsten?",
 options:[{v:"A",t:"Die strikte Hierarchie stimmt empirisch nicht – Menschen gewichten Bedürfnisse je nach Kultur, Alter und Lebenssituation sehr unterschiedlich."},{v:"B",t:"Die Pyramide berücksichtigt nur materielle Bedürfnisse."},{v:"C",t:"Maslow hat seine Theorie nie wissenschaftlich überprüft."},{v:"D",t:"Die Pyramide gilt nur für westliche Gesellschaften, nicht für Entwicklungsländer."}],
 correct:"A",explain:"Die stärkste Kritik betrifft die starre Hierarchie: Empirisch lässt sich nicht belegen, dass Bedürfnisse strikt stufenweise befriedigt werden. In manchen Kulturen stehen soziale Bedürfnisse (Gemeinschaft) über individuellen Sicherheitsbedürfnissen. Eisenhut selbst relativiert: Menschen versuchen, Wünsche aus verschiedenen Ebenen gleichzeitig zu erfüllen. B ist falsch (die Pyramide umfasst auch immaterielle Bedürfnisse wie Zugehörigkeit und Selbstverwirklichung)."},

{id:"b11",topic:"beduerfnisse",type:"sort",diff:3,tax:"K4",
 q:"Betrachten Sie die Bedürfnispyramide. Ordnen Sie die folgenden konkreten Situationen der jeweils dominierenden Bedürfnisstufe zu.",
 img:{src:"img/vwl/beduerfnisse/beduerfnispyramide_01.svg",alt:"Bedürfnispyramide nach Maslow mit vier Stufen"},
 categories:["Körperliche Bedürfnisse","Sicherheitsbedürfnisse","Soziale Bedürfnisse","Selbstverwirklichung"],
 items:[
   {t:"Eine obdachlose Person sucht eine Notunterkunft",cat:0},
   {t:"Jemand gründet ein Start-up, um seine Vision umzusetzen",cat:3},
   {t:"Eine Familie schliesst eine Lebensversicherung ab",cat:1},
   {t:"Ein Jugendlicher passt seinen Kleidungsstil an, um dazuzugehören",cat:2},
   {t:"Eine Studentin postet Erfolge auf Social Media für Anerkennung",cat:3},
   {t:"Ein Arbeiter fordert einen unbefristeten Vertrag",cat:1}
 ],
 explain:"Die Einordnung erfordert Analyse der dominierenden Motivation: Bei der obdachlosen Person dominiert das Grundbedürfnis nach Schutz und Wärme. Lebensversicherung und unbefristeter Vertrag dienen der finanziellen Sicherheit. Der Kleidungsstil dient der Zugehörigkeit (sozial). Das Start-up und die Social-Media-Posts zielen auf Selbstverwirklichung bzw. Wertschätzung (hier zusammengefasst als Stufe 4)."},

// ──── GÜTER (g01–g11) ────
{id:"g01",topic:"gueter",type:"mc",diff:1,tax:"K1",
 q:"Was unterscheidet freie Güter von wirtschaftlichen (knappen) Gütern?",
 options:[{v:"A",t:"Freie Güter sind von der Natur in ausreichender Menge vorhanden und gratis. Wirtschaftliche Güter sind knapp und haben einen Preis."},{v:"B",t:"Freie Güter werden vom Staat bereitgestellt, wirtschaftliche von Unternehmen."},{v:"C",t:"Freie Güter sind immer Dienstleistungen."},{v:"D",t:"Es gibt keinen Unterschied."}],
 correct:"A",explain:"Freie Güter: Von der Natur ausreichend vorhanden, z.B. Luft (in den meisten Situationen), Sonnenlicht. Wirtschaftliche Güter: Knapp und begehrt, deshalb nachgefragt und mit einem Preis versehen."},

{id:"g02",topic:"gueter",type:"sort",diff:1,tax:"K2",
 q:"Ordnen Sie die folgenden Beispiele der korrekten Güterkategorie zu.",
 categories:["Konsumgüter","Investitionsgüter","Freie Güter"],
 items:[
   {t:"Smartphone",cat:0},{t:"Friteuse in einem Restaurant",cat:1},
   {t:"Sonnenlicht",cat:2},{t:"Schulbuch",cat:0},
   {t:"Lastwagen für Gütertransport",cat:1},{t:"Luft zum Atmen",cat:2},
   {t:"Fabrikgebäude",cat:1},{t:"Kleidung",cat:0}
 ],
 explain:"Konsumgüter: Dienen direkt der Bedürfnisbefriedigung (Smartphone, Buch, Kleider). Investitionsgüter: Dienen der Herstellung von anderen Gütern (Friteuse, Lastwagen, Fabrik). Freie Güter: Von der Natur gratis und ausreichend vorhanden (Luft, Sonnenlicht)."},

{id:"g03",topic:"gueter",type:"tf",diff:1,tax:"K2",
 q:"Luft ist immer ein freies Gut.",
 correct:false,explain:"Falsch. Eisenhut schreibt: «Luft ist zum Beispiel in fast allen Situationen ein freies Gut.» In bestimmten Situationen kann Luft aber knapp und somit ein wirtschaftliches Gut werden – z.B. saubere Luft in stark verschmutzten Städten oder Atemluft unter Wasser (Tauchflasche)."},

{id:"g04",topic:"gueter",type:"fill",diff:1,tax:"K1",
 q:"Güter, die direkt der Bedürfnisbefriedigung dienen, heissen {0}. Güter, die zur Herstellung anderer Güter benötigt werden, heissen {1}. Bei einer {2} geht es nicht um den Wert einer Ware, sondern um den Wert einer Leistung.",
 blanks:[
   {answer:"Konsumgüter",alts:["Konsumgut"]},
   {answer:"Investitionsgüter",alts:["Investitionsgut","Produktionsgüter"]},
   {answer:"Dienstleistung",alts:["Dienstleistungen"]}
 ],
 explain:"Konsumgüter = direkte Bedürfnisbefriedigung (z.B. Brot, Kleidung). Investitionsgüter = Herstellung anderer Güter (z.B. Maschinen, Fabrikgebäude). Dienstleistung = immaterielle Leistung (z.B. Zugfahrt, Unterricht, Beratung)."},

{id:"g05",topic:"gueter",type:"mc",diff:2,tax:"K2",
 q:"Was unterscheidet Verbrauchsgüter von Gebrauchsgütern?",
 options:[{v:"A",t:"Verbrauchsgüter werden bei der Nutzung aufgebraucht (z.B. Lebensmittel), Gebrauchsgüter können längere Zeit benutzt werden (z.B. Smartphone)."},{v:"B",t:"Verbrauchsgüter sind teurer als Gebrauchsgüter."},{v:"C",t:"Verbrauchsgüter sind immer Lebensmittel."},{v:"D",t:"Gebrauchsgüter sind immer Investitionsgüter."}],
 correct:"A",explain:"Konsumgüter werden unterteilt in: Verbrauchsgüter (einmalige Nutzung, z.B. Essen, Getränke, Benzin) und Gebrauchsgüter (mehrmalige/längere Nutzung, z.B. Velo, Handy, Kleider, Spielkonsole)."},

{id:"g06",topic:"gueter",type:"sort",diff:2,tax:"K2",
 q:"Ordnen Sie die Konsumgüter: Verbrauchsgüter oder Gebrauchsgüter?",
 categories:["Verbrauchsgüter","Gebrauchsgüter"],
 items:[
   {t:"Sandwich",cat:0},{t:"Velo",cat:1},
   {t:"Benzin",cat:0},{t:"Winterjacke",cat:1},
   {t:"Mineralwasser",cat:0},{t:"Spielkonsole",cat:1}
 ],
 explain:"Verbrauchsgüter werden beim Konsum aufgebraucht (Sandwich, Benzin, Wasser). Gebrauchsgüter können längere Zeit genutzt werden (Velo, Winterjacke, Spielkonsole)."},

{id:"g07",topic:"gueter",type:"open",diff:2,tax:"K3",
 q:"Nennen Sie je zwei Beispiele für Sachgüter und Dienstleistungen, die Sie gestern direkt genutzt haben. Erklären Sie den Unterschied.",
 sample:"Sachgüter: Brot zum Frühstück (Verbrauchsgut), Laptop für die Schule (Gebrauchsgut). Dienstleistungen: Zugfahrt zur Schule (Transportdienstleistung), Unterrichtsstunde (Bildungsdienstleistung). Unterschied: Bei Sachgütern besitzt man ein physisches Objekt. Bei Dienstleistungen geht es um den Wert einer Leistung, nicht einer Ware – sie sind immateriell und können nicht gelagert werden.",
 explain:"Eisenhut betont: «Bei einer Dienstleistung geht es nicht um den Wert einer Ware, sondern um den Wert einer Leistung.» Beispiele: Zugfahrt, Unterricht, Studienberatung, Haarschnitt."},

{id:"g08",topic:"gueter",type:"tf",diff:2,tax:"K2",
 q:"Ein Lastwagen ist immer ein Investitionsgut.",
 correct:false,explain:"Falsch. Die Zuordnung hängt von der Verwendung ab. Ein Lastwagen, der für den gewerblichen Gütertransport eingesetzt wird, ist ein Investitionsgut. Ein Lastwagen, den jemand privat als Hobby-Fahrzeug nutzt, wäre ein Konsumgut (Gebrauchsgut). Entscheidend ist der Zweck."},

// ── NEU: g09–g11 ──
{id:"g09",topic:"gueter",type:"multi",diff:2,tax:"K2",
 q:"Welche der folgenden Güter sind Investitionsgüter?",
 options:[{v:"A",t:"Nähmaschine in einer Schneiderei"},{v:"B",t:"Nähmaschine, die jemand privat zum Hobby nutzt"},{v:"C",t:"Kassensystem in einem Supermarkt"},{v:"D",t:"Laptop, den ein Schüler für die Schule nutzt"}],
 correct:["A","C"],explain:"A und C sind richtig. Investitionsgüter dienen der Herstellung anderer Güter oder Dienstleistungen (gewerblicher Zweck). Die Nähmaschine in der Schneiderei (A) produziert Kleidung, das Kassensystem (C) ermöglicht den Verkaufsprozess. Die private Nähmaschine (B) und der Schülerlaptop (D) dienen dem privaten Konsum = Konsumgüter (Gebrauchsgüter)."},

{id:"g10",topic:"gueter",type:"mc",diff:3,tax:"K4",
 q:"Die Grafik zeigt eine Klassifikation der Güterarten. Wasser aus dem Hahn kostet in der Schweiz einen kleinen Betrag, in einem Wüstengebiet kann es ein Vielfaches kosten. Was zeigt dieses Beispiel über die Güterklassifikation?",
 img:{src:"img/vwl/beduerfnisse/gueterklassifikation_01.svg",alt:"Klassifikation der Güterarten: freie vs. wirtschaftliche Güter, Sachgüter und Dienstleistungen"},
 options:[{v:"A",t:"Die Grenze zwischen freien und wirtschaftlichen Gütern ist nicht fix, sondern hängt von der Knappheitssituation ab."},{v:"B",t:"Wasser ist immer ein wirtschaftliches Gut."},{v:"C",t:"Wasser ist immer ein freies Gut, nur die Aufbereitung kostet etwas."},{v:"D",t:"Die Güterklassifikation gilt nicht für natürliche Ressourcen."}],
 correct:"A",explain:"Die Einordnung als freies oder wirtschaftliches Gut ist nicht absolut, sondern abhängig von der Knappheitssituation. Wasser in der Schweiz ist relativ günstig (geringe Knappheit), in der Wüste extrem teuer (hohe Knappheit). Ebenso kann saubere Luft in einer stark verschmutzten Stadt zum wirtschaftlichen Gut werden. Die Güterklassifikation ist also kontextabhängig."},

{id:"g11",topic:"gueter",type:"open",diff:3,tax:"K5",
 q:"Diskutieren Sie: Sollte sauberes Trinkwasser als freies Gut behandelt werden (gratis für alle), oder sollte es einen Preis haben? Argumentieren Sie mit dem Knappheitsprinzip.",
 sample:"Argument für einen Preis: Sauberes Trinkwasser ist ein knappes wirtschaftliches Gut – die Aufbereitung, Speicherung und Verteilung kosten Ressourcen. Ohne Preis fehlt der Anreiz zum sparsamen Umgang, was zu Verschwendung führt (z.B. Übernutzung). Argument für Gratis-Zugang: Wasser ist lebensnotwendig (Grundbedürfnis). Wenn arme Menschen es sich nicht leisten können, ist das ethisch problematisch. Kompromiss: Ein Grundkontingent gratis (Grundbedürfnis), darüber hinaus ein steigender Preis (Anreiz zum Sparen).",
 explain:"Diese Frage verbindet die Güterklassifikation mit einer normativen Frage der Wirtschaftspolitik. In der VWL wird betont: Wenn knappe Güter keinen Preis haben, droht Übernutzung (Tragik der Allmende). Gleichzeitig gibt es gute Gründe für einen garantierten Grundzugang zu lebensnotwendigen Gütern."},

// ──── PRODUKTIONSFAKTOREN (p01–p11) ────
{id:"p01",topic:"produktionsfaktoren",type:"mc",diff:1,tax:"K1",
 q:"Welche vier Produktionsfaktoren unterscheidet man in der VWL?",
 options:[{v:"A",t:"Arbeit, natürliche Ressourcen (Boden), Realkapital und Wissen."},{v:"B",t:"Geld, Maschinen, Rohstoffe und Energie."},{v:"C",t:"Konsum, Investitionen, Staat und Exporte."},{v:"D",t:"Löhne, Zinsen, Mieten und Gewinne."}],
 correct:"A",explain:"Die vier Produktionsfaktoren: (1) Arbeit = jede produktive Tätigkeit des Menschen. (2) Natürliche Ressourcen = Boden, Rohmaterial. (3) Realkapital = Maschinen, Anlagen, Gebäude. (4) Wissen = Humankapital (Können, Fähigkeiten) und technischer Fortschritt."},

{id:"p02",topic:"produktionsfaktoren",type:"sort",diff:1,tax:"K2",
 q:"Ordnen Sie die Beispiele den korrekten Produktionsfaktoren zu.",
 categories:["Arbeit","Natürliche Ressourcen","Realkapital","Wissen"],
 items:[
   {t:"Koch bereitet Pommes frites zu",cat:0},{t:"Kartoffeln vom Feld",cat:1},
   {t:"Friteuse im Restaurant",cat:2},{t:"Ausbildung des Kochs",cat:3},
   {t:"Servierpersonal bedient Gäste",cat:0},{t:"Erdöl für Energie",cat:1},
   {t:"Gebäude des Restaurants",cat:2},{t:"Rezepte und Know-how",cat:3}
 ],
 explain:"Am Beispiel der Pommes frites (nach Eisenhut): Um Pommes zu produzieren, braucht es immer eine Kombination aller vier Produktionsfaktoren: menschliche Arbeit, natürliche Ressourcen (Kartoffeln, Energie), Realkapital (Friteuse, Gebäude, Besteck) und Wissen (Ausbildung, Rezepte)."},

{id:"p03",topic:"produktionsfaktoren",type:"fill",diff:1,tax:"K1",
 q:"Unter dem Produktionsfaktor {0} versteht man jede produktive Tätigkeit des Menschen. {1} benötigt man z.B. in Form von Boden und Rohmaterial. {2} umfasst Maschinen, Anlagen und Gebäude.",
 blanks:[
   {answer:"Arbeit",alts:[]},
   {answer:"Natürliche Ressourcen",alts:["Boden","natürliche Ressourcen"]},
   {answer:"Realkapital",alts:["Kapital"]}
 ],
 explain:"Arbeit = produktive Tätigkeit. Natürliche Ressourcen = Boden, Rohstoffe, Energie. Realkapital = Sachkapital (Maschinen, Anlagen, Gebäude). Der vierte Faktor ist Wissen (Humankapital, technischer Fortschritt)."},

{id:"p04",topic:"produktionsfaktoren",type:"tf",diff:1,tax:"K1",
 q:"Humankapital (Wissen, Können, Fähigkeiten) gilt als eigenständiger Produktionsfaktor.",
 correct:true,explain:"Richtig. Neben Arbeit, natürlichen Ressourcen und Realkapital wird Wissen als vierter Produktionsfaktor betrachtet. Es umfasst Humankapital (Wissen, Können, Fähigkeiten, Fertigkeiten) und technischen Fortschritt. Wissen ist für die wirtschaftliche Entwicklung eines Landes besonders bedeutungsvoll."},

{id:"p05",topic:"produktionsfaktoren",type:"open",diff:2,tax:"K3",
 q:"Wählen Sie ein beliebiges Produkt aus Ihrem Alltag und beschreiben Sie, welche vier Produktionsfaktoren für dessen Herstellung nötig sind.",
 sample:"Beispiel Smartphone: (1) Arbeit: Ingenieure entwickeln das Design, Arbeiter*innen montieren die Teile. (2) Natürliche Ressourcen: Seltene Erden, Kupfer, Glas, Lithium für die Batterie. (3) Realkapital: Fabriken, Maschinen, Montagelinien, Transportmittel. (4) Wissen: Software-Entwicklung, Patente, Design-Know-how, Forschung.",
 explain:"Eisenhut betont: Um ein Gut zu produzieren, braucht es immer eine Kombination aller vier Produktionsfaktoren. Die Qualität und Quantität dieser Faktoren bestimmt den «Wohlstandskuchen» eines Landes."},

{id:"p06",topic:"produktionsfaktoren",type:"mc",diff:2,tax:"K2",
 q:"Warum wird Wissen als der wichtigste Produktionsfaktor für moderne Volkswirtschaften angesehen?",
 options:[{v:"A",t:"Weil technischer Fortschritt und Humankapital die Produktivität aller anderen Faktoren steigern."},{v:"B",t:"Weil Wissen gratis ist und unbegrenzt zur Verfügung steht."},{v:"C",t:"Weil man ohne Wissen gar keine Güter produzieren kann."},{v:"D",t:"Weil Wissen den Produktionsfaktor Arbeit ersetzt."}],
 correct:"A",explain:"Wissen erhöht die Produktivität der anderen Faktoren: Besseres Know-how → effizientere Arbeit, bessere Nutzung von Ressourcen und produktivere Maschinen. Deshalb investieren moderne Volkswirtschaften stark in Bildung und Forschung."},

{id:"p07",topic:"produktionsfaktoren",type:"tf",diff:2,tax:"K2",
 q:"Ein Bäckermeister, der seine langjährige Erfahrung im Brotbacken einsetzt, nutzt dabei nur den Produktionsfaktor Arbeit.",
 correct:false,explain:"Falsch. Der Bäckermeister nutzt mindestens zwei Produktionsfaktoren gleichzeitig: Arbeit (seine körperliche und geistige Tätigkeit) und Wissen (seine Erfahrung, sein Know-how, seine Ausbildung als Humankapital). Dazu kommen natürlich Realkapital (Backofen) und natürliche Ressourcen (Mehl, Wasser)."},

{id:"p08",topic:"produktionsfaktoren",type:"mc",diff:1,tax:"K1",
 q:"Welcher Produktionsfaktor wird mit dem Begriff «Realkapital» bezeichnet?",
 options:[{v:"A",t:"Maschinen, Anlagen und Gebäude – also produzierte Produktionsmittel."},{v:"B",t:"Das Geld auf dem Bankkonto eines Unternehmens."},{v:"C",t:"Die Arbeitskraft der Mitarbeitenden."},{v:"D",t:"Patente und geistiges Eigentum."}],
 correct:"A",explain:"Realkapital (auch Sachkapital) = produzierte Produktionsmittel wie Maschinen, Anlagen, Werkzeuge, Gebäude. Nicht zu verwechseln mit Geldkapital (Finanzmittel). Patente und Know-how gehören zum Produktionsfaktor Wissen."},

// ── NEU: p09–p11 ──
{id:"p09",topic:"produktionsfaktoren",type:"multi",diff:2,tax:"K2",
 q:"Welche der folgenden Beispiele gehören zum Produktionsfaktor «Wissen»?",
 options:[{v:"A",t:"Die Berufserfahrung einer Ärztin"},{v:"B",t:"Das Gebäude eines Spitals"},{v:"C",t:"Ein Patent für ein neues Medikament"},{v:"D",t:"Medizinische Geräte im Operationssaal"}],
 correct:["A","C"],explain:"A und C sind richtig. Wissen umfasst Humankapital (Berufserfahrung, Ausbildung, Fähigkeiten der Ärztin) und technischen Fortschritt (Patent für ein Medikament). Das Spitalgebäude (B) und die Geräte (D) sind Realkapital – sie sind produzierte Produktionsmittel."},

{id:"p10",topic:"produktionsfaktoren",type:"mc",diff:3,tax:"K4",
 q:"Die Schweiz hat wenig natürliche Ressourcen (kaum Rohstoffe, wenig Agrarfläche), ist aber eines der reichsten Länder der Welt. Welcher Produktionsfaktor erklärt diesen Widerspruch am besten?",
 options:[{v:"A",t:"Wissen – die Schweiz investiert stark in Bildung, Forschung und Innovation, was die Produktivität aller anderen Faktoren steigert."},{v:"B",t:"Realkapital – die Schweiz hat besonders viele Maschinen und Fabriken."},{v:"C",t:"Arbeit – die Schweizer arbeiten mehr Stunden als andere Völker."},{v:"D",t:"Natürliche Ressourcen – die Schweiz nutzt ihre Wasserkraft besonders gut."}],
 correct:"A",explain:"Die Schweiz ist ein Paradebeispiel dafür, dass Wissen (Humankapital + Innovation) der entscheidende Produktionsfaktor ist. Hochqualifizierte Arbeitskräfte, exzellente Forschung (ETH, Pharma), starke Berufsbildung und technologischer Fortschritt kompensieren den Mangel an Rohstoffen. Eisenhut betont: Wissen ist «für die wirtschaftliche Entwicklung eines Landes besonders bedeutungsvoll»."},

{id:"p11",topic:"produktionsfaktoren",type:"tf",diff:3,tax:"K4",
 q:"Geldkapital (z.B. Bankguthaben eines Unternehmens) ist ein Produktionsfaktor.",
 correct:false,explain:"Falsch. In der VWL-Systematik ist Geld kein Produktionsfaktor. Geld ist ein Tauschmittel, mit dem man Produktionsfaktoren erwerben kann (z.B. Maschinen kaufen = Realkapital, Löhne zahlen = Arbeit). Der dritte Produktionsfaktor heisst deshalb bewusst «Realkapital» (Sachkapital) – zur Abgrenzung von Geldkapital."},

// ──── ÖKONOMISCHES PRINZIP (o01–o09) ────
{id:"o01",topic:"oekprinzip",type:"mc",diff:1,tax:"K1",
 q:"Was besagt das Maximumprinzip (Ergiebigkeitsprinzip)?",
 options:[{v:"A",t:"Mit gegebenem Aufwand (Input) das grösstmögliche Ergebnis (Output) erzielen."},{v:"B",t:"Ein bestimmtes Ergebnis mit minimalem Aufwand erreichen."},{v:"C",t:"Immer den maximalen Preis für ein Gut verlangen."},{v:"D",t:"Möglichst viel produzieren, unabhängig von den Kosten."}],
 correct:"A",explain:"Maximumprinzip: Gegebener Input → maximaler Output. Beispiel: 4 Stunden lernen (gegebener Aufwand) → bestmögliche Note erzielen. Das Gegenstück ist das Minimumprinzip: Bestimmtes Ergebnis → minimaler Aufwand."},

{id:"o02",topic:"oekprinzip",type:"mc",diff:1,tax:"K1",
 q:"Was besagt das Minimumprinzip (Sparsamkeitsprinzip)?",
 options:[{v:"A",t:"Ein bestimmtes Ergebnis (Output) mit möglichst geringem Aufwand (Input) erreichen."},{v:"B",t:"Immer das billigste Produkt kaufen."},{v:"C",t:"So wenig wie möglich arbeiten."},{v:"D",t:"Die Produktion auf ein Minimum reduzieren."}],
 correct:"A",explain:"Minimumprinzip: Bestimmter Output → minimaler Input. Beispiel: Note 5 erreichen (bestimmtes Ergebnis) → möglichst wenig Lernzeit aufwenden. Das Optimumprinzip vereint beide: Input und Output optimal aufeinander abstimmen."},

{id:"o03",topic:"oekprinzip",type:"sort",diff:2,tax:"K3",
 q:"Ordnen Sie die Beispiele dem Maximum- oder Minimumprinzip zu.",
 categories:["Maximumprinzip","Minimumprinzip"],
 items:[
   {t:"Mit CHF 50 möglichst viele Lebensmittel einkaufen",cat:0},
   {t:"Die Note 5 mit möglichst wenig Lernaufwand erreichen",cat:1},
   {t:"In 4 Stunden Lernzeit die bestmögliche Note erzielen",cat:0},
   {t:"Die Strecke Bern-Zürich mit möglichst wenig Benzin fahren",cat:1},
   {t:"Mit einem Tank Benzin möglichst weit kommen",cat:0},
   {t:"Ein Haus bauen mit möglichst geringen Kosten",cat:1}
 ],
 explain:"Maximumprinzip: Input ist gegeben → Output maximieren (CHF 50 → max. Lebensmittel; 4h → beste Note; 1 Tank → max. Distanz). Minimumprinzip: Output ist gegeben → Input minimieren (Note 5 → min. Lernzeit; Strecke → min. Benzin; Haus → min. Kosten)."},

{id:"o04",topic:"oekprinzip",type:"fill",diff:1,tax:"K1",
 q:"Das ökonomische Prinzip hat zwei Ausprägungen: Das {0} (gegebener Aufwand → maximales Ergebnis) und das {1} (gegebenes Ergebnis → minimaler Aufwand). Zusammen bilden sie das {2}.",
 blanks:[
   {answer:"Maximumprinzip",alts:["Maximum-Prinzip","Ergiebigkeitsprinzip"]},
   {answer:"Minimumprinzip",alts:["Minimum-Prinzip","Sparsamkeitsprinzip"]},
   {answer:"Optimumprinzip",alts:["Wirtschaftlichkeitsprinzip","Optimum-Prinzip"]}
 ],
 explain:"Das Optimumprinzip (Wirtschaftlichkeitsprinzip) vereint Maximum- und Minimumprinzip: Input und Output werden optimal aufeinander abgestimmt. Wirtschaften bedeutet, nach diesem Prinzip zu handeln."},

{id:"o05",topic:"oekprinzip",type:"tf",diff:2,tax:"K2",
 q:"Wenn ein Unternehmen 1'000 Hemden mit möglichst geringen Kosten produzieren will, handelt es nach dem Maximumprinzip.",
 correct:false,explain:"Falsch. Es handelt nach dem Minimumprinzip: Das Ergebnis ist vorgegeben (1'000 Hemden), der Aufwand (Kosten) soll minimiert werden. Beim Maximumprinzip wäre es umgekehrt: Mit einem gegebenen Budget möglichst viele Hemden produzieren."},

{id:"o06",topic:"oekprinzip",type:"open",diff:2,tax:"K3",
 q:"Formulieren Sie ein eigenes Alltagsbeispiel für das Maximumprinzip und eines für das Minimumprinzip.",
 sample:"Maximumprinzip: Ich habe ein Budget von CHF 200 für Weihnachtsgeschenke und versuche, damit möglichst viele und gute Geschenke zu kaufen (gegebener Input → maximaler Output). Minimumprinzip: Ich möchte an den Bodensee fahren und suche die günstigste Verbindung (gegebenes Ziel → minimale Kosten/Aufwand).",
 explain:"Entscheidend für die Zuordnung: Beim Maximumprinzip ist der Input fix (Budget, Zeit, Menge), beim Minimumprinzip ist der Output fix (Ziel, Ergebnis, Menge). Im Alltag wenden wir beide Prinzipien ständig an."},

// ── NEU: o07–o09 ──
{id:"o07",topic:"oekprinzip",type:"multi",diff:2,tax:"K3",
 q:"Welche der folgenden Situationen sind Beispiele für das Minimumprinzip?",
 options:[{v:"A",t:"Ein Logistikunternehmen sucht die kürzeste Route für eine Lieferung nach Basel."},{v:"B",t:"Mit einem Monatsbudget von CHF 500 möglichst gut essen."},{v:"C",t:"Eine Firma will 10'000 Einheiten mit möglichst wenig Materialverlust produzieren."},{v:"D",t:"Ein Sportler will in 60 Minuten Training möglichst viele Kalorien verbrennen."}],
 correct:["A","C"],explain:"A und C sind Minimumprinzip: Das Ergebnis ist vorgegeben (Lieferung nach Basel; 10'000 Einheiten) und der Aufwand soll minimiert werden (kürzeste Route; wenig Materialverlust). B und D sind Maximumprinzip: Der Input ist fix (CHF 500; 60 Minuten) und das Ergebnis soll maximiert werden."},

{id:"o08",topic:"oekprinzip",type:"mc",diff:3,tax:"K4",
 q:"Eine Schülerin lernt für zwei Prüfungen gleichzeitig. Für Mathe hat sie 3 Stunden eingeplant, für Deutsch 2 Stunden. Nach welchem ökonomischen Prinzip handelt sie?",
 options:[{v:"A",t:"Nach dem Optimumprinzip – sie teilt ihre begrenzte Lernzeit so auf, dass das Gesamtergebnis möglichst gut wird."},{v:"B",t:"Nach dem Maximumprinzip für jedes einzelne Fach."},{v:"C",t:"Nach dem Minimumprinzip, weil sie die Lernzeit minimiert."},{v:"D",t:"Nach keinem ökonomischen Prinzip, da es sich um Lernen und nicht um Wirtschaft handelt."}],
 correct:"A",explain:"Hier handelt die Schülerin nach dem Optimumprinzip: Sie hat begrenzte Ressourcen (Gesamtlernzeit) und muss diese so auf verschiedene Verwendungen aufteilen, dass das Gesamtergebnis möglichst gut ist. Das ist die Kernidee des Wirtschaftens: knappe Mittel optimal einsetzen. Ökonomische Prinzipien gelten nicht nur in der Wirtschaft, sondern in allen Bereichen des Lebens."},

{id:"o09",topic:"oekprinzip",type:"tf",diff:3,tax:"K4",
 q:"Das ökonomische Prinzip gilt nur für Unternehmen und den Staat, nicht für private Entscheidungen im Alltag.",
 correct:false,explain:"Falsch. Das ökonomische Prinzip gilt universal – überall dort, wo knappe Mittel auf unbegrenzte Bedürfnisse treffen. Auch im Alltag wenden wir es an: beim Einkaufen (Budget einteilen), bei der Zeitplanung (knappe Freizeit optimal nutzen) oder bei der Wahl des Verkehrsmittels (schnellste/günstigste Route). Wirtschaften ist nicht auf «die Wirtschaft» beschränkt."},

// ──── ARBEITSTEILUNG, TAUSCH UND GELD (a01–a09) ────
{id:"a01",topic:"arbeitsteilung",type:"mc",diff:1,tax:"K1",
 q:"Was ist der Hauptvorteil von Arbeitsteilung und Spezialisierung?",
 options:[{v:"A",t:"Die Produktivität (Leistung pro Stunde/Arbeitskraft) steigt, weil sich jeder auf seine Stärken spezialisiert."},{v:"B",t:"Alle verdienen gleich viel."},{v:"C",t:"Es gibt weniger Arbeitslose."},{v:"D",t:"Die Preise sinken automatisch."}],
 correct:"A",explain:"Arbeitsteilung und Spezialisierung erhöhen die Produktivität: Jeder konzentriert sich auf das, was er am besten kann. Besonders Kräftige werden Bauarbeiter, kreativ Begabte Künstler, besonders Unentwegte Volkswirtschafter (Eisenhut). Das entschärft das Knappheitsproblem."},

{id:"a02",topic:"arbeitsteilung",type:"tf",diff:1,tax:"K1",
 q:"Arbeitsteilung setzt eine Bereitschaft zum Tausch voraus.",
 correct:true,explain:"Richtig. Eisenhut: «Die notwendige Ergänzung der Arbeitsteilung ist der Tausch.» Wer sich spezialisiert, produziert nur wenige Güter und muss die restlichen durch Tausch beschaffen. Ohne Tauschbereitschaft wäre Spezialisierung nicht möglich."},

{id:"a03",topic:"arbeitsteilung",type:"mc",diff:2,tax:"K2",
 q:"Welche drei Funktionen erfüllt Geld?",
 options:[{v:"A",t:"Zahlungsmittel, Rechnungseinheit und Wertaufbewahrungsmittel."},{v:"B",t:"Sparmittel, Investitionsmittel und Kreditmittel."},{v:"C",t:"Tausch, Produktion und Konsum."},{v:"D",t:"Bargeld, Buchgeld und Kryptowährung."}],
 correct:"A",explain:"Die drei Funktionen des Geldes: (1) Zahlungsmittel – ermöglicht einfachen Tausch ohne Gütertausch (spart Zeit und Kosten). (2) Rechnungseinheit – ermöglicht transparente, vergleichbare Preise. (3) Wertaufbewahrungsmittel – ermöglicht Sparen, Konsum zeitlich verschieben."},

{id:"a04",topic:"arbeitsteilung",type:"sort",diff:2,tax:"K2",
 q:"Ordnen Sie die Beispiele der korrekten Geldfunktion zu.",
 categories:["Zahlungsmittel","Rechnungseinheit","Wertaufbewahrungsmittel"],
 items:[
   {t:"Mit Banknoten an der Kasse bezahlen",cat:0},
   {t:"Preise verschiedener Handys vergleichen",cat:1},
   {t:"Geld auf dem Sparkonto für die Ferien",cat:2},
   {t:"Online-Überweisung für eine Bestellung",cat:0},
   {t:"Preis eines Autos in CHF angeben",cat:1},
   {t:"Geld für das Alter zurücklegen",cat:2}
 ],
 explain:"Zahlungsmittel: Geld zum Bezahlen verwenden. Rechnungseinheit: Preise in einer einheitlichen Währung ausdrücken und vergleichen. Wertaufbewahrung: Geld sparen, Kaufkraft über die Zeit erhalten, Konsum auf später verschieben."},

{id:"a05",topic:"arbeitsteilung",type:"fill",diff:1,tax:"K1",
 q:"Alle drei Geldfunktionen helfen, die sogenannten {0} zu senken. Darunter versteht man alle Kosten, die bei der Abwicklung eines {1} entstehen, z.B. Suche nach Tauschpartnern und {2}.",
 blanks:[
   {answer:"Transaktionskosten",alts:[]},
   {answer:"Tauschgeschäfts",alts:["Tauschgeschäftes","Tausches"]},
   {answer:"Informationsbeschaffung",alts:["Informationskosten","Vertragskosten"]}
 ],
 explain:"Transaktionskosten = alle Kosten für die Anbahnung und Abwicklung eines Tauschgeschäfts: Suche nach Tauschpartnern, Informationen über Anbieter und Preise, Vertragskosten, Kontrolle. Geld senkt diese Kosten erheblich."},

{id:"a06",topic:"arbeitsteilung",type:"open",diff:3,tax:"K4",
 q:"Stellen Sie sich vor, es gäbe kein Geld. Welche drei konkreten Probleme hätten Sie beim Tausch? Nennen Sie zu jedem Problem die Geldfunktion, die es löst.",
 sample:"(1) Problem: Ich müsste jemanden finden, der genau das will, was ich anbiete, und gleichzeitig das hat, was ich brauche (doppelte Koinzidenz der Wünsche). Lösung: Zahlungsmittelfunktion. (2) Problem: Wie viele Brote ist ein Velo wert? Ohne gemeinsame Einheit müsste man unzählige Tauschverhältnisse kennen. Lösung: Rechnungseinheit. (3) Problem: Verderbliche Güter (z.B. Äpfel) kann man nicht lagern, ohne dass sie an Wert verlieren. Lösung: Wertaufbewahrungsfunktion.",
 explain:"Eisenhut beschreibt diese drei Probleme am Beispiel einer Tauschwirtschaft. Geld löst alle drei durch seine Funktionen und senkt so die Transaktionskosten erheblich."},

{id:"a07",topic:"arbeitsteilung",type:"tf",diff:2,tax:"K2",
 q:"In einer modernen Volkswirtschaft produzieren die meisten Menschen den Grossteil der Güter, die sie täglich konsumieren, selbst.",
 correct:false,explain:"Falsch. In einer arbeitsteiligen Wirtschaft produzieren wir fast nichts von dem, was wir täglich konsumieren, selbst. Eisenhut fordert zum Nachdenken auf: Wie viele Güter stellen Sie selber her? Eines, zwei, vielleicht zehn? Wir sind Teil eines dichten Netzes der Arbeitsteilung und Spezialisierung."},

// ── NEU: a08–a09 ──
{id:"a08",topic:"arbeitsteilung",type:"multi",diff:2,tax:"K2",
 q:"Welche der folgenden Aussagen über die Wertaufbewahrungsfunktion des Geldes sind korrekt?",
 options:[{v:"A",t:"Geld ermöglicht es, Konsum in die Zukunft zu verschieben."},{v:"B",t:"Geld verliert bei Inflation an Kaufkraft, was diese Funktion einschränkt."},{v:"C",t:"Die Wertaufbewahrungsfunktion bedeutet, dass Geld immer seinen Wert behält."},{v:"D",t:"Ohne diese Funktion wäre langfristiges Sparen unmöglich."}],
 correct:["A","B","D"],explain:"A, B und D sind korrekt. Geld ermöglicht Sparen und zeitliche Verschiebung von Konsum (A, D). Bei hoher Inflation verliert Geld aber an Kaufkraft, was die Wertaufbewahrung einschränkt (B). Aussage C ist falsch: Geld behält nicht immer seinen Wert – Inflation entwertet Geld real. Deshalb legen Menschen Geld auch in Sachwerten (Immobilien, Aktien) an."},

{id:"a09",topic:"arbeitsteilung",type:"mc",diff:3,tax:"K4",
 q:"In der Coronapandemie wurden internationale Lieferketten unterbrochen, und es gab Engpässe bei Computerchips und Medikamenten. Was zeigt dies über Arbeitsteilung?",
 options:[{v:"A",t:"Arbeitsteilung erhöht zwar die Effizienz, macht aber auch verletzlich: Hohe Spezialisierung und internationale Verflechtung schaffen Abhängigkeiten."},{v:"B",t:"Arbeitsteilung funktioniert nur in guten Zeiten und sollte abgeschafft werden."},{v:"C",t:"Die Engpässe zeigen, dass Arbeitsteilung die Produktivität nicht wirklich steigert."},{v:"D",t:"Nur nationale Arbeitsteilung ist sinnvoll, internationale nicht."}],
 correct:"A",explain:"Die Pandemie hat die Kehrseite der Arbeitsteilung sichtbar gemacht: Hohe Spezialisierung und globale Lieferketten schaffen gegenseitige Abhängigkeiten. Wenn ein Glied der Kette ausfällt, kann das ganze System gestört werden. Das heisst aber nicht, dass Arbeitsteilung schlecht ist – die Vorteile (höhere Produktivität, niedrigere Kosten) überwiegen deutlich. Es zeigt jedoch die Notwendigkeit von Risikomanagement und Diversifikation."},

// ──── WIRTSCHAFTSSEKTOREN (s01–s09) ────
{id:"s01",topic:"sektoren",type:"mc",diff:1,tax:"K1",
 q:"Welche drei Wirtschaftssektoren unterscheidet man?",
 options:[{v:"A",t:"Primärer Sektor (Urproduktion), sekundärer Sektor (Industrie), tertiärer Sektor (Dienstleistungen)."},{v:"B",t:"Produktion, Handel und Konsum."},{v:"C",t:"Staat, Unternehmen und Haushalte."},{v:"D",t:"Import, Export und Binnenmarkt."}],
 correct:"A",explain:"Primärer Sektor = Urproduktion (Land-/Forstwirtschaft, Fischerei, Bergbau). Sekundärer Sektor = Veredelung/Industrie (Verarbeitung der Güter aus der Urproduktion). Tertiärer Sektor = Dienstleistungen (Handel, Banken, Versicherungen, Bildung, Gesundheit)."},

{id:"s02",topic:"sektoren",type:"sort",diff:1,tax:"K2",
 q:"Ordnen Sie die Berufe dem korrekten Wirtschaftssektor zu.",
 categories:["Primärer Sektor","Sekundärer Sektor","Tertiärer Sektor"],
 items:[
   {t:"Bauer",cat:0},{t:"Automechaniker in Fabrik",cat:1},
   {t:"Bankberaterin",cat:2},{t:"Förster",cat:0},
   {t:"Uhrmacher",cat:1},{t:"Lehrerin",cat:2},
   {t:"Fischer",cat:0},{t:"Krankenpfleger",cat:2}
 ],
 explain:"Primär: Bauer, Förster, Fischer (Urproduktion/Rohstoffgewinnung). Sekundär: Automechaniker in Fabrik, Uhrmacher (Verarbeitung/Industrie). Tertiär: Bankberaterin, Lehrerin, Krankenpfleger (Dienstleistungen)."},

{id:"s03",topic:"sektoren",type:"mc",diff:2,tax:"K2",
 q:"Wie hat sich die Beschäftigungsstruktur in der Schweiz seit 1800 verändert (Strukturwandel)?",
 options:[{v:"A",t:"Von einem Agrarland (primärer Sektor dominiert) über ein Industrieland (sekundärer Sektor dominiert) zur Dienstleistungsgesellschaft (tertiärer Sektor dominiert)."},{v:"B",t:"Der primäre Sektor ist stetig gewachsen."},{v:"C",t:"Alle drei Sektoren sind gleich gross geblieben."},{v:"D",t:"Die Industrie dominiert heute stärker als je zuvor."}],
 correct:"A",explain:"Strukturwandel der Schweiz: Um 1800 arbeiteten über 50% im primären Sektor (Agrarland). Um 1900 dominierte der sekundäre Sektor (Industrieland). Heute arbeiten über 70% im tertiären Sektor (Dienstleistungsgesellschaft). Der primäre Sektor beschäftigt nur noch ca. 3%."},

{id:"s04",topic:"sektoren",type:"tf",diff:1,tax:"K1",
 q:"Die Schweiz ist heute eine Dienstleistungsgesellschaft – der tertiäre Sektor ist der grösste.",
 correct:true,explain:"Richtig. Über 70% der Beschäftigten in der Schweiz arbeiten im tertiären Sektor (Dienstleistungen: Banken, Versicherungen, Handel, Bildung, Gesundheit, IT). Der sekundäre Sektor (Industrie) beschäftigt ca. 25%, der primäre (Landwirtschaft) nur noch ca. 3%."},

{id:"s05",topic:"sektoren",type:"fill",diff:1,tax:"K1",
 q:"Der {0} Sektor umfasst die Urproduktion (z.B. Landwirtschaft). Der {1} Sektor umfasst die Industrie. Der {2} Sektor umfasst die Dienstleistungen.",
 blanks:[
   {answer:"primäre",alts:["erste","1.","primaere"]},
   {answer:"sekundäre",alts:["zweite","2.","sekundaere"]},
   {answer:"tertiäre",alts:["dritte","3.","tertiaere"]}
 ],
 explain:"Die drei Sektoren der Volkswirtschaft: Primär (Urproduktion), sekundär (Verarbeitung/Industrie), tertiär (Dienstleistungen). Der Strukturwandel beschreibt die Verschiebung der Beschäftigung vom primären zum tertiären Sektor über die Jahrhunderte."},

{id:"s06",topic:"sektoren",type:"open",diff:3,tax:"K4",
 q:"Erklären Sie, warum der Strukturwandel von der Agrar- zur Dienstleistungsgesellschaft stattgefunden hat. Welche Rolle spielen dabei Produktivität und Arbeitsteilung?",
 sample:"Durch technischen Fortschritt (Maschinen, Düngemittel) stieg die Produktivität in der Landwirtschaft stark an – weniger Arbeitskräfte konnten mehr produzieren. Freigesetzte Arbeitskräfte wanderten in die Industrie (Industrialisierung). Dort wiederum stieg die Produktivität durch Automatisierung, und Arbeitskräfte wechselten in den Dienstleistungssektor. Zudem steigen mit dem Wohlstand die Bedürfnisse nach Dienstleistungen (Bildung, Gesundheit, Reisen, Beratung). Arbeitsteilung und Spezialisierung trieben diesen Wandel voran.",
 explain:"Der Strukturwandel ist ein zentrales Phänomen der wirtschaftlichen Entwicklung. Steigende Produktivität in einem Sektor setzt Arbeitskräfte frei, die in wachsenden Sektoren absorbiert werden. Gleichzeitig verändern sich mit steigendem Wohlstand die Bedürfnisse."},

// ── NEU: s07–s09 ──
{id:"s07",topic:"sektoren",type:"multi",diff:2,tax:"K2",
 q:"Welche der folgenden Berufe gehören zum tertiären Sektor?",
 options:[{v:"A",t:"Softwareentwicklerin bei einer Bank"},{v:"B",t:"Winzer im Wallis"},{v:"C",t:"Physiotherapeutin in einer Praxis"},{v:"D",t:"Maschinenbauingenieur in einer Fabrik"}],
 correct:["A","C"],explain:"A und C sind richtig. Softwareentwicklung bei einer Bank (A) und Physiotherapie (C) sind Dienstleistungen (tertiärer Sektor). Der Winzer (B) gehört zum primären Sektor (Urproduktion/Landwirtschaft). Der Maschinenbauingenieur in einer Fabrik (D) gehört zum sekundären Sektor (Industrie/Verarbeitung)."},

{id:"s08",topic:"sektoren",type:"mc",diff:3,tax:"K4",
 q:"Die Grafik zeigt den Strukturwandel der Schweiz. Sektor A, B und C sind nicht beschriftet. Welche Zuordnung ist korrekt?",
 img:{src:"img/vwl/beduerfnisse/strukturwandel_01.svg",alt:"Drei Linien zeigen die Beschäftigungsentwicklung dreier Sektoren in der Schweiz von 1800 bis 2020"},
 options:[{v:"A",t:"A = primärer Sektor (sinkend), B = sekundärer Sektor (erst steigend, dann sinkend), C = tertiärer Sektor (steigend)"},{v:"B",t:"A = tertiärer Sektor, B = primärer Sektor, C = sekundärer Sektor"},{v:"C",t:"A = sekundärer Sektor, B = primärer Sektor, C = tertiärer Sektor"},{v:"D",t:"A = primärer Sektor, B = tertiärer Sektor, C = sekundärer Sektor"}],
 correct:"A",explain:"Der primäre Sektor (A, grün) sinkt kontinuierlich von über 50% um 1800 auf ca. 3% heute. Der sekundäre Sektor (B, blau) steigt mit der Industrialisierung an, erreicht um 1960 seinen Höhepunkt und sinkt dann. Der tertiäre Sektor (C, orange) steigt kontinuierlich und dominiert heute mit über 70%. Dieses Muster ist typisch für den Strukturwandel aller entwickelten Volkswirtschaften."},

{id:"s09",topic:"sektoren",type:"tf",diff:2,tax:"K2",
 q:"Der Rückgang des primären Sektors in der Schweiz bedeutet, dass die Landwirtschaft weniger produziert als früher.",
 correct:false,explain:"Falsch. Der Rückgang bezieht sich auf den Anteil der Beschäftigten, nicht auf die Produktion. Dank technischem Fortschritt (Maschinen, Düngemittel, Züchtung) produziert die Schweizer Landwirtschaft heute mit viel weniger Arbeitskräften mehr als vor 200 Jahren. Die Produktivität pro Arbeitskraft ist massiv gestiegen."}
];
