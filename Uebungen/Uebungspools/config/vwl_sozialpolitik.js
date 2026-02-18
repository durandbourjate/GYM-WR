// Übungspool: Sozialpolitik und Sozialversicherungen
// Fachbereich: VWL
// Stufe: SF GYM3
// Anzahl Fragen: 105

window.POOL_META = {
  id: "vwl_sozialpolitik",
  fach: "VWL",
  title: "Übungspool: Sozialpolitik und Sozialversicherungen",
  meta: "SF GYM3 · Gymnasium Hofwil · Individuell üben",
  color: "vwl"
};

window.TOPICS = {
  verteilung: {label:"Einkommensverteilung & Umverteilung", short:"Verteilung"},
  gerechtigkeit: {label:"Gerechtigkeitstheorien", short:"Gerechtigkeit"},
  sozialversicherungen: {label:"Sozialversicherungssystem Schweiz", short:"Sozialvers."},
  finanzierung: {label:"Finanzierung der Sozialversicherungen", short:"Finanzierung"},
  versicherung: {label:"Versicherungsprinzipien & -theorie", short:"Versicherung"},
  staatseingriffe: {label:"Staatseingriffe & Staatsversagen", short:"Staatseingriffe"},
  herausforderungen: {label:"Herausforderungen & Reformen", short:"Reformen"}
};

window.QUESTIONS = [
// ══════════════════════════════════════════════
// ── VERTEILUNG (v01–v15) ──
// ══════════════════════════════════════════════
{id:"v01", topic:"verteilung", type:"mc", diff:1, tax:"K1",
 q:"Was zeigt die Lorenzkurve?",
 img: {src:"img/vwl/sozialpolitik/lorenzkurve_ch.svg", alt:"Lorenzkurve Schweiz – primäre und sekundäre Einkommensverteilung"},
 options:[
   {v:"A", t:"Die personelle Einkommensverteilung zu einem bestimmten Zeitpunkt."},
   {v:"B", t:"Die Entwicklung des BIP über die Zeit."},
   {v:"C", t:"Die Verteilung der Staatsausgaben auf verschiedene Bereiche."},
   {v:"D", t:"Den Zusammenhang zwischen Inflation und Arbeitslosigkeit."}
 ],
 correct:"A",
 explain:"Die Lorenzkurve stellt die personelle Einkommensverteilung grafisch dar. Je «bauchiger» die Kurve, desto ungleicher ist das Einkommen verteilt."},

{id:"v02", topic:"verteilung", type:"tf", diff:1, tax:"K1",
 q:"Ein Gini-Koeffizient von 0 bedeutet, dass alle Einkommen vollständig gleich verteilt sind (Einheitslohn).",
 correct:true,
 explain:"Korrekt. Bei einem Gini-Koeffizienten von 0 herrscht vollständige Gleichverteilung. Bei einem Wert von 1 würde eine einzige Person alles verdienen."},

{id:"v03", topic:"verteilung", type:"mc", diff:2, tax:"K2",
 q:"Worin liegt der Hauptgrund für die Lohnunterschiede zwischen verschiedenen Branchen?",
 options:[
   {v:"A", t:"Unterschiedliche gesetzliche Mindestlöhne pro Branche."},
   {v:"B", t:"Die grossen Differenzen bei der Arbeitsproduktivität zwischen den Branchen."},
   {v:"C", t:"Unterschiedliche Arbeitszeiten in den verschiedenen Branchen."},
   {v:"D", t:"Die Anzahl der Beschäftigten pro Branche."}
 ],
 correct:"B",
 explain:"Der Hauptgrund für Lohnunterschiede zwischen Branchen sind die grossen Differenzen bei der Produktivität (Wertschöpfung pro Vollzeitstelle). Je grösser die Wertschöpfung pro Arbeitsplatz, desto höhere Löhne können bezahlt werden."},

{id:"v04", topic:"verteilung", type:"fill", diff:1, tax:"K1",
 q:"Die Einkommensverteilung vor staatlichen Eingriffen (Steuern, Sozialversicherungen) heisst {0} Einkommensverteilung. Die Verteilung nach staatlichen Eingriffen heisst {1} Einkommensverteilung.",
 blanks:[
   {answer:"primäre", alts:["primaere"]},
   {answer:"sekundäre", alts:["sekundaere"]}
 ],
 explain:"Die primäre Einkommensverteilung entsteht durch den Markt (v.a. bestimmt durch die Produktivität). Durch Steuern und Sozialversicherungen entsteht die sekundäre Einkommensverteilung, die gleichmässiger ist als die primäre."},

{id:"v05", topic:"verteilung", type:"mc", diff:2, tax:"K2",
 q:"Die Schweiz hat vor Steuern und Sozialabgaben einen Gini-Koeffizienten von 0.38, nach Steuern und Sozialabgaben von 0.29. Was lässt sich daraus schliessen?",
 options:[
   {v:"A", t:"Die staatliche Umverteilung vergrössert die Einkommensunterschiede."},
   {v:"B", t:"Die staatliche Umverteilung reduziert die Einkommensunterschiede deutlich."},
   {v:"C", t:"Die Schweiz hat die höchste Ungleichheit in Europa."},
   {v:"D", t:"Die primäre Verteilung ist bereits vollständig gleich."}
 ],
 correct:"B",
 explain:"Ein Rückgang des Gini-Koeffizienten von 0.38 auf 0.29 zeigt, dass Steuern und Sozialversicherungen die Einkommensunterschiede deutlich reduzieren. Die sekundäre Verteilung ist gleichmässiger als die primäre."},

{id:"v06", topic:"verteilung", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Konzepte dem passenden Gerechtigkeitsprinzip zu.",
 categories:["Leistungsgerechtigkeit", "Bedarfsgerechtigkeit"],
 items:[
   {t:"Verteilung nach Produktivität", cat:0},
   {t:"Anrecht auf Existenzminimum unabhängig von Leistung", cat:1},
   {t:"Wer mehr leistet, soll mehr verdienen", cat:0},
   {t:"Jeder Mensch hat Anrecht auf angemessenes Einkommen", cat:1},
   {t:"Marktlöhne als gerechte Entlohnung", cat:0},
   {t:"Staatlich finanzierte Grundsicherung", cat:1}
 ],
 explain:"Leistungsgerechtigkeit stuft eine Verteilung nach Produktivität als gerecht ein. Bedarfsgerechtigkeit gewährt jedem Menschen unabhängig von seiner Leistungsfähigkeit ein angemessenes Einkommen. Beide Prinzipien widerspiegeln den Zielkonflikt zwischen Effizienz und Verteilungsgerechtigkeit."},

{id:"v07", topic:"verteilung", type:"sort", diff:1, tax:"K2",
 q:"Ordnen Sie die folgenden sozialpolitischen Instrumente der richtigen Kategorie zu.",
 categories:["Einnahmenseite (Staat nimmt)", "Ausgabenseite (Staat gibt)"],
 items:[
   {t:"Progressive Einkommenssteuer", cat:0},
   {t:"Sozialversicherungsleistungen (z.B. AHV-Rente)", cat:1},
   {t:"Lohnprozente (Arbeitnehmer- und Arbeitgeberbeiträge)", cat:0},
   {t:"Prämienverbilligungen Krankenkasse", cat:1},
   {t:"Subventionen für Kinderkrippen", cat:1},
   {t:"Mehrwertsteuer", cat:0}
 ],
 explain:"Die Umverteilung erfolgt über die Einnahmenseite (progressive Steuern, Lohnbeiträge) und die Ausgabenseite (Sozialversicherungsleistungen, Subventionen, Prämienverbilligungen). Beide Seiten zusammen bewirken eine gleichmässigere sekundäre Einkommensverteilung."},

{id:"v08", topic:"verteilung", type:"open", diff:3, tax:"K5",
 q:"Die Schweiz hat im internationalen Vergleich bereits vor staatlichen Eingriffen eine relativ gleichmässige primäre Einkommensverteilung (Gini 0.38 vs. OECD-Durchschnitt 0.44). Beurteilen Sie, ob dies ein Argument für oder gegen einen Ausbau der staatlichen Umverteilung ist.",
 sample:"Man kann argumentieren, dass eine bereits relativ gleichmässige Primärverteilung weniger Umverteilung nötig macht (Effizienzargument). Gleichzeitig bleibt die Differenz von 0.38 auf 0.29 nach Umverteilung erheblich, was zeigt, dass Eingriffe weiterhin Wirkung zeigen. Es kommt auf die zugrundeliegende Gerechtigkeitsvorstellung an: Aus liberaler Sicht reicht die Primärverteilung, aus sozialliberaler oder sozialistischer Sicht bleibt Handlungsbedarf.",
 explain:"Die Antwort hängt von der Gerechtigkeitsvorstellung ab. Die relativ gleichmässige Primärverteilung der Schweiz ist teilweise auf die geringen Produktivitätsunterschiede zurückzuführen. Der Zielkonflikt zwischen Effizienz und Verteilungsgerechtigkeit bleibt bestehen."},

// ── Neue Fragen Verteilung (v09–v15) ──
{id:"v09", topic:"verteilung", type:"multi", diff:2, tax:"K2",
 q:"Welche der folgenden Faktoren tragen dazu bei, dass die primäre Einkommensverteilung der Schweiz relativ gleichmässig ist?",
 options:[
   {v:"A", t:"Geringe Produktivitätsunterschiede zwischen den Branchen im Vergleich zu anderen Ländern."},
   {v:"B", t:"Das duale Berufsbildungssystem sorgt für breite Qualifikation."},
   {v:"C", t:"Die Schweiz hat einen gesetzlichen Mindestlohn auf Bundesebene."},
   {v:"D", t:"Hoher Anteil an Beschäftigten im Dienstleistungssektor mit relativ guten Löhnen."}
 ],
 correct:["A","B","D"],
 explain:"Die relativ gleichmässige Primärverteilung erklärt sich u.a. durch geringe Produktivitätsunterschiede, das duale Berufsbildungssystem (breite Qualifikation) und einen starken Dienstleistungssektor. Die Schweiz hat keinen flächendeckenden gesetzlichen Mindestlohn auf Bundesebene (nur einzelne Kantone wie GE, NE, BS)."},

{id:"v10", topic:"verteilung", type:"mc", diff:1, tax:"K1",
 q:"Was versteht man unter funktionaler Einkommensverteilung?",
 options:[
   {v:"A", t:"Die Verteilung des Einkommens auf verschiedene Produktionsfaktoren (Arbeit, Kapital, Boden)."},
   {v:"B", t:"Die Verteilung des Einkommens auf einzelne Personen oder Haushalte."},
   {v:"C", t:"Die Verteilung des Einkommens nach Regionen."},
   {v:"D", t:"Die Verteilung des Einkommens über verschiedene Zeitperioden."}
 ],
 correct:"A",
 explain:"Die funktionale Einkommensverteilung zeigt, wie das Volkseinkommen auf die Produktionsfaktoren verteilt wird: Löhne/Gehälter (Arbeit), Zinsen und Dividenden (Kapital), Mieten/Pachten (Boden). Die personelle Verteilung hingegen betrachtet Individuen oder Haushalte."},

{id:"v11", topic:"verteilung", type:"tf", diff:2, tax:"K2",
 q:"Die Vermögensverteilung in der Schweiz ist deutlich ungleicher als die Einkommensverteilung.",
 correct:true,
 explain:"Korrekt. Die Vermögensverteilung ist in der Schweiz (und in den meisten Ländern) deutlich ungleicher als die Einkommensverteilung. Das reichste Prozent der Bevölkerung besitzt einen überproportional hohen Anteil am Gesamtvermögen. Dies liegt u.a. daran, dass Vermögen über Generationen vererbt und durch Kapitalerträge kumuliert wird."},

{id:"v12", topic:"verteilung", type:"multi", diff:2, tax:"K3",
 q:"Welche der folgenden Massnahmen wirken umverteilend von Reich zu Arm?",
 options:[
   {v:"A", t:"Progressive Einkommenssteuer"},
   {v:"B", t:"Prämienverbilligungen für die Krankenkasse"},
   {v:"C", t:"Die Mehrwertsteuer (MWST)"},
   {v:"D", t:"AHV-Renten mit Maximalrente (Deckel)"}
 ],
 correct:["A","B","D"],
 explain:"Progressive Steuern belasten höhere Einkommen stärker. Prämienverbilligungen entlasten Einkommensschwache gezielt. Bei der AHV zahlen Reiche mehr ein, erhalten aber maximal die Höchstrente – die Differenz fliesst an Einkommensschwache (Solidaritätsprinzip). Die MWST dagegen belastet alle gleich und wirkt tendenziell regressiv, da Einkommensschwache einen grösseren Anteil ihres Einkommens für Konsum ausgeben."},

{id:"v13", topic:"verteilung", type:"calc", diff:2, tax:"K3",
 q:"In einem Land verdienen die ärmsten 20% der Bevölkerung zusammen 5% des gesamten Einkommens. Die reichsten 20% verdienen 45% des gesamten Einkommens. Berechnen Sie:",
 rows:[
   {label:"Verhältnis der reichsten zu den ärmsten 20% (S80/S20-Verhältnis)", answer:9, tolerance:0.1, unit:""}
 ],
 explain:"Das S80/S20-Verhältnis = Einkommen der reichsten 20% / Einkommen der ärmsten 20% = 45% / 5% = 9. Das bedeutet, dass die reichsten 20% neunmal so viel verdienen wie die ärmsten 20%. Je höher das Verhältnis, desto ungleicher die Verteilung."},

{id:"v14", topic:"verteilung", type:"fill", diff:2, tax:"K2",
 q:"Die Differenz zwischen der Gleichverteilungslinie und der Lorenzkurve wird als {0} bezeichnet. Je grösser diese Fläche, desto {1} ist die Einkommensverteilung.",
 blanks:[
   {answer:"Konzentrationsfläche", alts:["Ungleichheitsfläche","Gini-Fläche"]},
   {answer:"ungleicher", alts:["ungleichmässiger"]}
 ],
 explain:"Die Konzentrationsfläche (auch Gini-Fläche) zwischen der Gleichverteilungsgeraden (45°-Linie) und der Lorenzkurve ist die grafische Grundlage für den Gini-Koeffizienten. Der Gini-Koeffizient berechnet sich als Verhältnis dieser Fläche zur gesamten Fläche unter der Gleichverteilungsgeraden."},

{id:"v15", topic:"verteilung", type:"mc", diff:3, tax:"K4",
 q:"Land A hat einen Gini-Koeffizienten von 0.25, Land B von 0.45. Beide Länder haben ein ähnliches BIP pro Kopf. Welche Schlussfolgerung ist korrekt?",
 options:[
   {v:"A", t:"Die Menschen in Land A sind reicher als in Land B."},
   {v:"B", t:"In Land A ist die Einkommensverteilung gleichmässiger, aber das sagt nichts über das absolute Wohlstandsniveau aus."},
   {v:"C", t:"Land B hat eine bessere Sozialpolitik."},
   {v:"D", t:"In Land B sind alle Einwohner arm."}
 ],
 correct:"B",
 explain:"Der Gini-Koeffizient misst nur die Gleichmässigkeit der Verteilung, nicht das absolute Einkommensniveau. Ein Land kann einen tiefen Gini-Koeffizienten haben (gleichmässig verteilt), aber trotzdem arm sein. Bei gleichem BIP pro Kopf bedeutet ein tieferer Gini, dass die Einkommen gleichmässiger verteilt sind – es gibt weniger Extreme."},

// ══════════════════════════════════════════════
// ── GERECHTIGKEITSTHEORIEN (g01–g15) ──
// ══════════════════════════════════════════════
{id:"g01", topic:"gerechtigkeit", type:"mc", diff:1, tax:"K1",
 q:"Welche Wirtschaftsordnung vertreten die Libertarians (Neo-Liberale)?",
 options:[
   {v:"A", t:"Soziale Marktwirtschaft"},
   {v:"B", t:"Reine Marktwirtschaft"},
   {v:"C", t:"Sozialismus"},
   {v:"D", t:"Planwirtschaft"}
 ],
 correct:"B",
 explain:"Libertarians (Neo-Liberale) wie Nozick, Hayek und Friedman befürworten eine reine Marktwirtschaft. Sie lehnen Umverteilung ab, da sie die ökonomische Freiheit einschränkt. Der Markt und sein Ergebnis können ihrer Meinung nach nicht gerecht oder ungerecht sein."},

{id:"g02", topic:"gerechtigkeit", type:"tf", diff:1, tax:"K1",
 q:"Gemäss dem naturrechtlichen Liberalismus (Nozick) ist Besteuerung eine Form von Diebstahl.",
 correct:true,
 explain:"Korrekt. Nozick vertritt die Position, dass jedes Individuum das natürliche Recht hat, sich die durch seine Arbeit erworbenen Erträge anzueignen. Die Hauptaufgabe des Staates beschränkt sich auf den Schutz der Eigentumsrechte. Besteuerung wird als Eingriff in dieses Recht betrachtet."},

{id:"g03", topic:"gerechtigkeit", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Positionen der richtigen Gerechtigkeitstheorie zu.",
 img: {src:"img/vwl/sozialpolitik/gerechtigkeitstheorien.svg", alt:"Gerechtigkeitstheorien – Politisches Spektrum von Collectivists über Liberals zu Libertarians"},
 categories:["Libertarians (Neo-Liberale)", "Liberals (Sozial-Liberale)", "Collectivists (Sozialisten)"],
 items:[
   {t:"Umverteilung ist eine Einschränkung der Freiheit", cat:0},
   {t:"Differenzprinzip: Nutzen des Schwächsten maximieren", cat:1},
   {t:"Verstaatlichung der Produktionsmittel", cat:2},
   {t:"Kombination von Kapitalismus und Staatseingriffen", cat:1},
   {t:"Mehrwert = Ausbeutung der Arbeiterschaft", cat:2},
   {t:"Staatseingriffe reduzieren die Wohlfahrt", cat:0}
 ],
 explain:"Libertarians lehnen Umverteilung und Staatseingriffe ab. Liberals (z.B. Rawls) befürworten eine Kombination von Markt und Staat, wobei der Schwächste bessergestellt werden soll (Differenzprinzip). Collectivists (insbesondere Marxisten) fordern die Verstaatlichung der Produktionsmittel und sehen im Kapitalismus Ausbeutung."},

{id:"g04", topic:"gerechtigkeit", type:"mc", diff:2, tax:"K2",
 q:"Was besagt das Differenzprinzip von John Rawls?",
 options:[
   {v:"A", t:"Alle Menschen sollen exakt gleich viel verdienen."},
   {v:"B", t:"Ungleichheiten sind nur dann gerechtfertigt, wenn sie dem am schlechtesten Gestellten nützen."},
   {v:"C", t:"Der Staat soll sich aus der Wirtschaft vollständig heraushalten."},
   {v:"D", t:"Die Produktionsmittel sollen verstaatlicht werden."}
 ],
 correct:"B",
 explain:"Rawls' Differenzprinzip (Maxmin-Regel) besagt, dass der Nutzen des am schlechtesten gestellten Individuums maximiert werden soll. Ungleichheiten sind akzeptabel, wenn sie auch den Schwächsten besser stellen als eine Gleichverteilung."},

{id:"g05", topic:"gerechtigkeit", type:"fill", diff:2, tax:"K2",
 q:"Rawls' Gedankenexperiment heisst «Schleier des {0}». Dabei wählen Menschen eine Gesellschaftsordnung, ohne zu wissen, welche {1} sie in dieser Gesellschaft einnehmen werden.",
 blanks:[
   {answer:"Nichtwissens", alts:["Unwissens","Unwissenheit"]},
   {answer:"Stellung", alts:["Position","Rolle"]}
 ],
 explain:"Hinter dem Schleier des Nichtwissens kennen die Menschen weder ihr Geschlecht, ihre Gesundheit, ihren Reichtum, ihre Intelligenz noch ihren sozialen Status. Rawls argumentiert, dass Menschen unter diesen Bedingungen eine Gesellschaftsordnung mit Freiheitsprinzip, Differenzprinzip und Chancengleichheit wählen würden."},

{id:"g06", topic:"gerechtigkeit", type:"tf", diff:2, tax:"K2",
 q:"Der Utilitarismus strebt eine Gleichverteilung aller Güter an.",
 correct:false,
 explain:"Falsch. Der Utilitarismus strebt nicht Gleichverteilung an, sondern die Maximierung der gesellschaftlichen Wohlfahrt (Nutzensumme). Dies berücksichtigt sowohl Effizienz als auch Gerechtigkeit, ist aber nicht gleichbedeutend mit Gleichverteilung. Die optimale Verteilung ergibt sich dort, wo die Grenznutzen aller Individuen gleich sind."},

{id:"g07", topic:"gerechtigkeit", type:"open", diff:3, tax:"K4",
 q:"Erklären Sie den Unterschied zwischen erzwungener und freiwilliger Umverteilung. Warum reicht freiwillige Umverteilung gemäss ökonomischer Theorie nicht aus?",
 sample:"Erzwungene Umverteilung geschieht über Steuern und Sozialversicherungen durch den Staat. Freiwillige Umverteilung beruht darauf, dass der Nutzen der Reichen auch vom Einkommen der Armen abhängt (Spenden, Philanthropie). Freiwillige Umverteilung reicht nicht aus, weil die Einkommensunterstützung der Armen Eigenschaften eines öffentlichen Gutes hat: Es kommt zu Trittbrettfahrerverhalten – jeder Reiche hofft, dass andere spenden. Deshalb bleibt das Niveau der Einkommensunterstützung unter dem gesellschaftlichen Optimum.",
 explain:"Das Trittbrettfahrerproblem bei freiwilliger Umverteilung ist ein klassisches ökonomisches Argument für staatliche Umverteilung: Weil die Verringerung von Armut ein öffentliches Gut ist, investieren Individuen freiwillig weniger als das gesellschaftliche Optimum."},

{id:"g08", topic:"gerechtigkeit", type:"mc", diff:3, tax:"K4",
 q:"Welche Aussage beschreibt am besten die Haltung der Marxisten gegenüber Sozialpolitik?",
 options:[
   {v:"A", t:"Sozialpolitik ist immer positiv, da sie die Arbeiterschaft unterstützt."},
   {v:"B", t:"Sozialpolitik ist überflüssig, weil der Markt alles regelt."},
   {v:"C", t:"Marxisten sind ambivalent: Sozialpolitik kann als Sieg der Arbeiterschaft oder als Schutz des Kapitalismus interpretiert werden."},
   {v:"D", t:"Marxisten lehnen jede Form von Sozialpolitik kategorisch ab."}
 ],
 correct:"C",
 explain:"Marxisten sind tatsächlich ambivalent gegenüber Sozialpolitik. Einerseits kann sie als Errungenschaft der Arbeiterschaft gesehen werden. Andererseits könnte Sozialpolitik den Kapitalismus stabilisieren und damit die Revolution verhindern – sie wirkt dann systemerhaltend."},

// ── Neue Fragen Gerechtigkeit (g09–g15) ──
{id:"g09", topic:"gerechtigkeit", type:"multi", diff:2, tax:"K2",
 q:"Welche der folgenden Aussagen gehören zum Rawls'schen Gedankenexperiment des «Schleiers des Nichtwissens»?",
 options:[
   {v:"A", t:"Die Menschen kennen ihr eigenes Geschlecht und Alter nicht."},
   {v:"B", t:"Die Menschen wissen, welchen Beruf sie ausüben werden."},
   {v:"C", t:"Die Menschen kennen ihren Gesundheitszustand nicht."},
   {v:"D", t:"Die Menschen wissen nicht, wie reich oder arm sie sein werden."}
 ],
 correct:["A","C","D"],
 explain:"Hinter dem Schleier des Nichtwissens kennen die Menschen weder Geschlecht, Alter, Gesundheitszustand, Reichtum, Intelligenz noch sozialen Status. Gerade weil niemand weiss, welche Position er oder sie in der Gesellschaft einnehmen wird, wählen rationale Menschen laut Rawls eine Gesellschaftsordnung, die auch den Schwächsten schützt."},

{id:"g10", topic:"gerechtigkeit", type:"mc", diff:1, tax:"K1",
 q:"Welcher Denker wird am stärksten mit dem Konzept der «unsichtbaren Hand» assoziiert?",
 options:[
   {v:"A", t:"Karl Marx"},
   {v:"B", t:"John Rawls"},
   {v:"C", t:"Adam Smith"},
   {v:"D", t:"John Maynard Keynes"}
 ],
 correct:"C",
 explain:"Adam Smith (1723–1790) beschrieb die «unsichtbare Hand» des Marktes: Wenn jedes Individuum seinen eigenen Vorteil verfolgt, wird durch den Preismechanismus die gesamtgesellschaftliche Wohlfahrt maximiert. Diese Idee bildet die Grundlage für die liberale Wirtschaftstheorie."},

{id:"g11", topic:"gerechtigkeit", type:"tf", diff:2, tax:"K2",
 q:"Gemäss dem Utilitarismus ist bei abnehmendem Grenznutzen des Einkommens eine gewisse Umverteilung von Reich zu Arm wohlfahrtssteigernd.",
 correct:true,
 explain:"Korrekt. Wenn der Grenznutzen des Einkommens abnimmt (ein zusätzlicher Franken bringt einem Armen mehr Nutzen als einem Reichen), dann kann die gesellschaftliche Gesamtwohlfahrt durch Umverteilung gesteigert werden. Allerdings muss dies mit den negativen Anreizeffekten der Umverteilung abgewogen werden."},

{id:"g12", topic:"gerechtigkeit", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die Schweizer Parteipositionen der nächstliegenden Gerechtigkeitstheorie zu.",
 categories:["Libertarians (Neo-Liberale)", "Liberals (Sozial-Liberale)", "Collectivists (Sozialisten)"],
 items:[
   {t:"Junge SVP: Rückbau des Sozialstaats, Eigenverantwortung", cat:0},
   {t:"Jungfreisinnige: Sozialstaat «fertig gebaut», Reform nötig", cat:1},
   {t:"Junge SP: Ausbau des Sozialstaats, mehr Kinderbetreuung", cat:2},
   {t:"Gegen Steuererhöhungen, für Wettbewerb", cat:0},
   {t:"Für gezielte Interventionen bei Marktversagen", cat:1},
   {t:"Für Verstaatlichung im Gesundheitswesen", cat:2}
 ],
 explain:"In der Schweizer Politik lassen sich die Parteipositionen den Gerechtigkeitstheorien zuordnen: Die SVP steht den Libertarians nahe (weniger Staat), die FDP/GLP den Liberals (gezielter Staat), die SP/Grüne den Collectivists (mehr Staat und Umverteilung). Natürlich sind die Zuordnungen vereinfacht."},

{id:"g13", topic:"gerechtigkeit", type:"fill", diff:1, tax:"K1",
 q:"Gemäss den {0} (Sozialisten/Marxisten) beutet der Kapitalist die Arbeiterschaft aus, indem er den sogenannten {1} abschöpft – die Differenz zwischen dem Wert der Arbeit und dem bezahlten Lohn.",
 blanks:[
   {answer:"Collectivists", alts:["Kollektivisten","Marxisten","Sozialisten"]},
   {answer:"Mehrwert", alts:[]}
 ],
 explain:"Im marxistischen Modell entsteht der «Mehrwert» dadurch, dass die Arbeiter mehr Wert produzieren, als sie als Lohn erhalten. Dieser Mehrwert wird vom Kapitalisten als Profit einbehalten. Marx sah darin die zentrale Ungerechtigkeit des kapitalistischen Systems."},

{id:"g14", topic:"gerechtigkeit", type:"multi", diff:3, tax:"K4",
 q:"Welche der folgenden Aussagen treffen auf das Rawls'sche Differenzprinzip zu?",
 options:[
   {v:"A", t:"Es erlaubt Ungleichheiten, sofern sie allen zugutekommen."},
   {v:"B", t:"Es fordert, dass der am schlechtesten Gestellte bessergestellt wird als bei Gleichverteilung."},
   {v:"C", t:"Es ist kompatibel mit einem gewissen Mass an Einkommensunterschieden."},
   {v:"D", t:"Es verlangt die vollständige Abschaffung von Privateigentum."}
 ],
 correct:["A","B","C"],
 explain:"Das Differenzprinzip erlaubt Ungleichheiten, wenn sie dem Schwächsten nützen (A). Es maximiert den Nutzen des am schlechtesten Gestellten – dieser soll besser dastehen als bei Gleichverteilung (B). Einkommensunterschiede sind daher erlaubt (C). Die Abschaffung von Privateigentum gehört nicht zu Rawls' Theorie – das ist eine kollektivistische Position (D)."},

{id:"g15", topic:"gerechtigkeit", type:"open", diff:3, tax:"K5",
 q:"Die Schweiz kennt weder eine reine Marktwirtschaft noch eine Planwirtschaft, sondern eine «soziale Marktwirtschaft». Beurteilen Sie, welcher Gerechtigkeitstheorie dieses Modell am nächsten kommt und begründen Sie Ihre Einschätzung.",
 sample:"Die soziale Marktwirtschaft der Schweiz kommt dem Modell der Liberals (Sozial-Liberale) am nächsten. Wie Rawls es fordert, gibt es ein marktwirtschaftliches Grundsystem mit individuellem Eigentum und Wettbewerb. Gleichzeitig greift der Staat gezielt ein: Sozialversicherungen, progressive Steuern und Prämienverbilligungen stellen sicher, dass auch die Schwächsten abgesichert sind. Das System verfolgt einen Mittelweg zwischen Effizienz (Marktwirtschaft) und Gerechtigkeit (Sozialstaat) – genau wie es die sozial-liberale Theorie vorsieht.",
 explain:"Die Schweiz verkörpert den Kompromiss zwischen Markt und Staat: Sie schützt Eigentumsrechte (liberales Element), umverteilt aber auch gezielt (soziales Element). Dies entspricht der Position der Liberals, die Ungleichheiten akzeptieren, solange der Schwächste davon profitiert."},

// ══════════════════════════════════════════════
// ── SOZIALVERSICHERUNGSSYSTEM (s01–s16) ──
// ══════════════════════════════════════════════
{id:"s01", topic:"sozialversicherungen", type:"mc", diff:1, tax:"K1",
 q:"Wie viele Hauptzweige umfasst das Schweizer Sozialversicherungssystem?",
 options:[
   {v:"A", t:"5 Zweige"},
   {v:"B", t:"6 Zweige"},
   {v:"C", t:"8 Zweige"},
   {v:"D", t:"10 Zweige"}
 ],
 correct:"C",
 explain:"Das Schweizer Sozialversicherungssystem umfasst 8 Hauptzweige: AHV (inkl. EL), IV, Berufliche Vorsorge (BV), EO/Mutterschaft, Unfallversicherung, Krankenversicherung, Arbeitslosenversicherung und Familienzulagen."},

{id:"s02", topic:"sozialversicherungen", type:"sort", diff:1, tax:"K1",
 q:"Ordnen Sie die Sozialversicherungen der richtigen Säule der Altersvorsorge zu.",
 img: {src:"img/vwl/sozialpolitik/drei_saeulen.svg", alt:"Drei-Säulen-System der Altersvorsorge (Schweiz)"},
 categories:["1. Säule (AHV)", "2. Säule (BV)", "3. Säule (Individuelle Vorsorge)"],
 items:[
   {t:"Deckung des Existenzbedarfs im Alter", cat:0},
   {t:"Fortführung der gewohnten Lebenshaltung", cat:1},
   {t:"Deckung des Komfortbedarfs im Alter", cat:2},
   {t:"Obligatorisch seit 1948", cat:0},
   {t:"Obligatorisch seit 1985", cat:1},
   {t:"Steuerlich begünstigt, aber freiwillig", cat:2}
 ],
 explain:"Die 1. Säule (AHV) sichert das Existenzminimum, die 2. Säule (Berufliche Vorsorge) ermöglicht die Fortführung der gewohnten Lebenshaltung, und die 3. Säule (individuelle Vorsorge) dient dem Komfortbedarf. Zusammen bilden sie das Drei-Säulen-System der Schweizer Altersvorsorge."},

{id:"s03", topic:"sozialversicherungen", type:"tf", diff:1, tax:"K1",
 q:"Die Krankenversicherung (Grundversicherung) bietet für alle Versicherten pro Kasse und Region die gleichen Prämien für Erwachsene.",
 correct:true,
 explain:"Korrekt. Nach dem KVG muss jede Kasse in der Grundversicherung dasselbe Leistungsangebot führen. Die Prämien sind für alle Erwachsenen pro Kasse und Region gleich hoch (Kopfprämie). Personen in bescheidenen wirtschaftlichen Verhältnissen erhalten Prämienverbilligungen von den Kantonen."},

{id:"s04", topic:"sozialversicherungen", type:"fill", diff:1, tax:"K1",
 q:"Die AHV wurde im Jahr {0} eingeführt und gehört zur {1}. Säule der Altersvorsorge. Ihr Zweck ist die Deckung des {2} der nicht mehr im Berufsleben stehenden Personen.",
 blanks:[
   {answer:"1948", alts:[]},
   {answer:"1", alts:["ersten","erste","1."]},
   {answer:"Existenzbedarfs", alts:["Existenzminimums"]}
 ],
 explain:"Die AHV (Alters- und Hinterlassenenversicherung) wurde 1948 eingeführt. Als 1. Säule soll sie den Existenzbedarf der Rentnerinnen und Rentner, Witwen, Witwer und Waisen decken."},

{id:"s05", topic:"sozialversicherungen", type:"mc", diff:2, tax:"K2",
 q:"Worin unterscheiden sich Sozialversicherungen von privaten Versicherungen?",
 options:[
   {v:"A", t:"Sozialversicherungen sind freiwillig, private Versicherungen obligatorisch."},
   {v:"B", t:"Bei Sozialversicherungen zahlen Ärmere kleinere Beiträge, und sie sind obligatorisch."},
   {v:"C", t:"Private Versicherungen bieten bessere Leistungen als Sozialversicherungen."},
   {v:"D", t:"Sozialversicherungen decken nur Risiken ab, private Versicherungen auch Sparen."}
 ],
 correct:"B",
 explain:"Im Unterschied zu privaten Versicherungen sind Sozialversicherungen erstens obligatorisch und zweitens zahlen Ärmere kleinere Beiträge als Reichere (Solidaritätsprinzip). Auch Personen, die sich keine Prämien leisten können, sind versichert."},

{id:"s06", topic:"sozialversicherungen", type:"tf", diff:2, tax:"K2",
 q:"Die Berufliche Vorsorge (2. Säule), die AHV und die Krankenversicherung vereinigen zusammen rund 80% der Sozialversicherungseinnahmen auf sich.",
 img: {src:"img/vwl/sozialpolitik/sozialversicherungen_anteile.svg", alt:"Sozialversicherungseinnahmen nach Zweig (2017): BV 39%, AHV 25%, KV 17%"},
 correct:true,
 explain:"Korrekt. Gemäss den Daten von 2017 entfallen auf die BV 39%, die AHV (inkl. EL) 25% und die Krankenversicherung 17% der Einnahmen – zusammen also rund 81%. Sie sind damit die mit Abstand wichtigsten Zweige des sozialen Sicherungssystems."},

{id:"s07", topic:"sozialversicherungen", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Risikogruppen der passenden Sozialversicherung zu.",
 categories:["ALV", "IV", "UV", "KV"],
 items:[
   {t:"Stellenlose Erwerbstätige", cat:0},
   {t:"Personen mit dauerhafter Beeinträchtigung", cat:1},
   {t:"Bei Betriebsunfall Verunglückte", cat:2},
   {t:"Erkrankte Personen (ambulante Behandlung)", cat:3}
 ],
 explain:"Die ALV schützt gegen Verdienstausfall bei Arbeitslosigkeit, die IV unterstützt invalide Personen, die UV deckt Betriebs- und Nichtbetriebsunfälle ab, und die KV übernimmt Kosten bei Krankheit."},

{id:"s08", topic:"sozialversicherungen", type:"open", diff:2, tax:"K2",
 q:"Erklären Sie den Unterschied zwischen den drei Armutskonzepten: absolute, relative und subjektive Armut.",
 sample:"Absolute Armut: Das Einkommen oder Vermögen reicht nicht, um sich mit dem Lebensnotwendigen zu versorgen (Existenzminimum). Relative Armut: Man ist arm im Vergleich zum allgemeinen Lebensstandard, z.B. weniger als die Hälfte des Durchschnittseinkommens. Subjektive Armut: Das persönliche Empfinden, arm zu sein – jemand mit unterdurchschnittlichem Einkommen kann sich nicht arm fühlen, während jemand mit überdurchschnittlichem Einkommen sich arm fühlen kann.",
 explain:"Welches Armutskonzept als relevant angesehen wird, hat direkte Auswirkungen darauf, wie weit die staatliche Umverteilung gehen soll. In der Schweiz garantiert die Bundesverfassung die wirtschaftliche Existenzsicherung (Schutz vor absoluter Armut)."},

// ── Neue Fragen Sozialversicherungen (s09–s16) ──
{id:"s09", topic:"sozialversicherungen", type:"multi", diff:1, tax:"K1",
 q:"Welche der folgenden Versicherungen gehören zum Schweizer Sozialversicherungssystem?",
 options:[
   {v:"A", t:"Arbeitslosenversicherung (ALV)"},
   {v:"B", t:"Private Haftpflichtversicherung"},
   {v:"C", t:"Erwerbsersatzordnung (EO)"},
   {v:"D", t:"Familienzulagen (FZ)"}
 ],
 correct:["A","C","D"],
 explain:"ALV, EO und Familienzulagen gehören zum Sozialversicherungssystem (zusammen mit AHV, IV, BV, KV und UV – insgesamt 8 Zweige). Die private Haftpflichtversicherung ist eine freiwillige Privatversicherung und gehört nicht dazu."},

{id:"s10", topic:"sozialversicherungen", type:"mc", diff:2, tax:"K2",
 q:"Was ist der Hauptunterschied zwischen Ergänzungsleistungen (EL) und Sozialhilfe?",
 options:[
   {v:"A", t:"EL sind ein Rechtsanspruch für AHV/IV-Bezüger; Sozialhilfe ist das letzte soziale Netz für alle Bedürftigen."},
   {v:"B", t:"Sozialhilfe wird vom Bund finanziert, EL von den Kantonen."},
   {v:"C", t:"EL sind höher als Sozialhilfe."},
   {v:"D", t:"Es gibt keinen Unterschied, beide Begriffe bezeichnen dasselbe."}
 ],
 correct:"A",
 explain:"Ergänzungsleistungen (EL) sind ein Rechtsanspruch, der AHV- und IV-Bezügern zusteht, wenn Renten und Einkommen die minimalen Lebenskosten nicht decken. Die Sozialhilfe hingegen ist das «letzte Netz» für alle Personen, die weder durch Sozialversicherungen noch durch eigene Mittel ihren Lebensunterhalt bestreiten können. Sie wird von den Gemeinden/Kantonen ausgerichtet."},

{id:"s11", topic:"sozialversicherungen", type:"tf", diff:1, tax:"K1",
 q:"Die Unfallversicherung (UV) für Arbeitnehmer wird vollständig vom Arbeitgeber finanziert.",
 correct:false,
 explain:"Falsch. Bei der Unfallversicherung wird zwischen Betriebs- und Nichtbetriebsunfällen unterschieden: Die Betriebsunfallversicherung (BUV) wird vom Arbeitgeber bezahlt. Die Nichtbetriebsunfallversicherung (NBUV) wird vom Arbeitnehmer bezahlt (ab 8 Stunden Arbeitszeit pro Woche)."},

{id:"s12", topic:"sozialversicherungen", type:"fill", diff:2, tax:"K2",
 q:"Die Krankenversicherung in der Schweiz kennt das System der {0}: Alle Erwachsenen zahlen pro Kasse und Region denselben Betrag, unabhängig vom Einkommen. Zur Entlastung einkommensschwacher Haushalte gibt es {1}.",
 blanks:[
   {answer:"Kopfprämie", alts:["Kopfprämien","Einheitsprämie","Einheitsprämien"]},
   {answer:"Prämienverbilligungen", alts:["Praemienverbilligungen","individuelle Prämienverbilligungen","IPV"]}
 ],
 explain:"Die Kopfprämie (gleiche Prämie für alle Erwachsenen einer Kasse/Region) unterscheidet die Schweizer KV von einkommensabhängigen Systemen anderer Länder. Da Kopfprämien Einkommensschwache überproportional belasten, gibt es Prämienverbilligungen als sozialen Ausgleich."},

{id:"s13", topic:"sozialversicherungen", type:"multi", diff:2, tax:"K2",
 q:"Welche der folgenden Aussagen treffen auf die AHV (1. Säule) zu?",
 options:[
   {v:"A", t:"Sie funktioniert nach dem Umlageverfahren."},
   {v:"B", t:"Die Beiträge werden je hälftig von Arbeitgeber und Arbeitnehmer bezahlt."},
   {v:"C", t:"Es gibt eine Maximalrente (Deckel), auch wenn man mehr eingezahlt hat."},
   {v:"D", t:"Sie wird ausschliesslich über Lohnbeiträge finanziert."}
 ],
 correct:["A","B","C"],
 explain:"Die AHV funktioniert im Umlageverfahren (A), mit paritätischen Beiträgen von AG und AN (B), und es gibt eine Maximalrente (C) – wer mehr verdient, zahlt zwar mehr ein, erhält aber höchstens die Maximalrente (Solidaritätsprinzip). Falsch ist D: Die AHV wird nicht nur über Lohnbeiträge finanziert, sondern auch über Bundesbeiträge und einen Anteil der MWST."},

{id:"s14", topic:"sozialversicherungen", type:"mc", diff:2, tax:"K2",
 q:"Was versteht man unter dem «Drei-Säulen-Konzept» der Schweizer Altersvorsorge?",
 img: {src:"img/vwl/sozialpolitik/drei_saeulen.svg", alt:"Drei-Säulen-System der Altersvorsorge"},
 options:[
   {v:"A", t:"Drei verschiedene Steuersätze für drei Einkommensgruppen."},
   {v:"B", t:"Die Kombination aus staatlicher Vorsorge (AHV), beruflicher Vorsorge (Pensionskasse) und privater Vorsorge (Säule 3a/3b)."},
   {v:"C", t:"Drei verschiedene Krankenkassen, die man wählen kann."},
   {v:"D", t:"Die Aufteilung der Sozialversicherungen auf Bund, Kanton und Gemeinde."}
 ],
 correct:"B",
 explain:"Das Drei-Säulen-Konzept kombiniert die staatliche Vorsorge (1. Säule: AHV/IV), die berufliche Vorsorge (2. Säule: Pensionskasse) und die private Vorsorge (3. Säule: 3a/3b). Ziel ist, dass alle drei Säulen zusammen ca. 60% des letzten Lohns im Alter sicherstellen."},

{id:"s15", topic:"sozialversicherungen", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Lebenssituationen der zuständigen Sozialversicherung zu.",
 categories:["AHV", "IV", "EO", "ALV", "KV"],
 items:[
   {t:"Pensionierung mit 65 Jahren", cat:0},
   {t:"Schwere Behinderung nach Krankheit", cat:1},
   {t:"Militärdienst (Rekrutenschule)", cat:2},
   {t:"Kündigung durch den Arbeitgeber", cat:3},
   {t:"Grippe mit Arztbesuch", cat:4}
 ],
 explain:"Die AHV zahlt Altersrenten, die IV unterstützt bei Invalidität, die EO gleicht den Erwerbsausfall bei Militär-/Zivildienst und Mutterschaft aus, die ALV sichert gegen Arbeitslosigkeit ab, und die KV deckt Krankheitskosten."},

{id:"s16", topic:"sozialversicherungen", type:"open", diff:3, tax:"K4",
 q:"Erklären Sie, warum in der Schweiz die Sozialhilfe oft als «stigmatisierend» empfunden wird und welche Folgen dies hat.",
 sample:"Die Sozialhilfe gilt als letztes Netz und ist an strenge Bedingungen geknüpft: Bedürftigkeitsprüfung, Offenlegung der finanziellen Verhältnisse und oft auch Auflagen zur Arbeitssuche. Viele Betroffene empfinden dies als demütigend. Die Folge ist eine hohe «Nichtbezugsquote»: Schätzungen zufolge verzichten 20–30% der Anspruchsberechtigten auf Sozialhilfe, obwohl sie Anspruch hätten. Dies kann zu verdeckter Armut führen und den Zweck der sozialen Sicherung untergraben.",
 explain:"Die Stigmatisierung der Sozialhilfe ist ein bekanntes Problem in vielen Ländern. Ansätze zur Lösung umfassen die negative Einkommenssteuer (automatische Auszahlung) oder ein Grundeinkommen, die beide die Stigmatisierung reduzieren könnten."},

// ══════════════════════════════════════════════
// ── FINANZIERUNG (f01–f15) ──
// ══════════════════════════════════════════════
{id:"f01", topic:"finanzierung", type:"mc", diff:1, tax:"K1",
 q:"Wie wird die AHV (1. Säule) finanziert?",
 options:[
   {v:"A", t:"Im Kapitaldeckungsverfahren: Individuelle Beiträge werden angespart und verzinst."},
   {v:"B", t:"Im Umlageverfahren: Laufende Einnahmen werden für laufende Ausgaben verwendet."},
   {v:"C", t:"Ausschliesslich über die Mehrwertsteuer."},
   {v:"D", t:"Durch freiwillige Spenden der Bevölkerung."}
 ],
 correct:"B",
 explain:"Die AHV wird im Umlageverfahren finanziert: Die aktuellen Beiträge der Erwerbstätigen (Lohnprozente, je hälftig Arbeitgeber/Arbeitnehmer) werden direkt für die laufenden Renten verwendet. Die heutigen Erwerbstätigen finanzieren die heutigen Rentner (Generationenvertrag)."},

{id:"f02", topic:"finanzierung", type:"tf", diff:1, tax:"K1",
 q:"Bei der Beruflichen Vorsorge (2. Säule) werden individuelle Beiträge auf einem persönlichen Konto angespart und verzinst (Kapitaldeckungsverfahren).",
 correct:true,
 explain:"Korrekt. Im Gegensatz zur AHV funktioniert die 2. Säule nach dem Kapitaldeckungsverfahren: Arbeitgeber und Arbeitnehmer zahlen je hälftig Beiträge ein, die auf einem individuellen Konto angespart und mit Zins für die spätere Pension verwendet werden."},

{id:"f03", topic:"finanzierung", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die Merkmale dem richtigen Finanzierungsverfahren zu.",
 img: {src:"img/vwl/sozialpolitik/umlage_vs_kapital.svg", alt:"Umlageverfahren vs. Kapitaldeckungsverfahren im Vergleich"},
 categories:["Umlageverfahren", "Kapitaldeckungsverfahren"],
 items:[
   {t:"Generationenvertrag: Junge finanzieren Alte", cat:0},
   {t:"Individuelles Sparkonto mit Zins", cat:1},
   {t:"Stark abhängig von der demografischen Entwicklung", cat:0},
   {t:"Stark abhängig von der Entwicklung der Finanzmärkte", cat:1},
   {t:"AHV als Beispiel", cat:0},
   {t:"Pensionskasse als Beispiel", cat:1}
 ],
 explain:"Das Umlageverfahren (AHV) ist ein Generationenvertrag und daher stark von der Demografie abhängig. Das Kapitaldeckungsverfahren (BV/Pensionskasse) basiert auf individuellem Ansparen und ist daher von den Finanzmärkten abhängig. Beide Verfahren haben unterschiedliche Stärken und Schwächen."},

{id:"f04", topic:"finanzierung", type:"fill", diff:1, tax:"K1",
 q:"Die {0} misst die Sozialversicherungseinnahmen in Prozent des BIP. Die {1} misst die Sozialversicherungsleistungen in Prozent des BIP.",
 blanks:[
   {answer:"Soziallastquote", alts:[]},
   {answer:"Sozialleistungsquote", alts:[]}
 ],
 explain:"Die Soziallastquote zeigt, wie stark die Volkswirtschaft durch Sozialversicherungseinnahmen belastet wird. Die Sozialleistungsquote zeigt, welcher Teil der Wirtschaftsleistung durch Empfänger von Sozialleistungen beansprucht wird. Beide Quoten sind seit 1960 stark gestiegen."},

{id:"f05", topic:"finanzierung", type:"calc", diff:2, tax:"K3",
 q:"Die Sozialversicherungseinnahmen der Schweiz betrugen 2017 rund 182 Mrd. CHF. Das BIP lag bei ca. 670 Mrd. CHF. Berechnen Sie:",
 rows:[
   {label:"Soziallastquote (in %)", answer:27.2, tolerance:0.5, unit:"%"}
 ],
 explain:"Soziallastquote = Sozialversicherungseinnahmen / BIP × 100 = 182 / 670 × 100 ≈ 27.2%. Das bedeutet, dass von jedem Franken Wertschöpfung rund 27 Rappen für die soziale Sicherheit aufgewendet werden."},

{id:"f06", topic:"finanzierung", type:"mc", diff:2, tax:"K2",
 q:"Die Sozialausgaben des Bundes sind von 326 Mio. CHF (1960) auf über 22 Mrd. CHF (2019) gestiegen. Welcher Anteil der gesamten Bundesausgaben entfiel 2019 auf die Sozialausgaben?",
 options:[
   {v:"A", t:"Rund 12%"},
   {v:"B", t:"Rund 21%"},
   {v:"C", t:"Rund 31%"},
   {v:"D", t:"Rund 45%"}
 ],
 correct:"C",
 explain:"2019 machten die Sozialausgaben rund 31.3% der gesamten Bundesausgaben aus. Dieser Anteil ist seit 1960 (12.5%) kontinuierlich gestiegen und zeigt die wachsende Bedeutung der sozialen Sicherheit in den Staatsausgaben."},

{id:"f07", topic:"finanzierung", type:"open", diff:3, tax:"K5",
 q:"Das Umlageverfahren der AHV wird oft als «Generationenvertrag» bezeichnet. Beurteilen Sie, inwiefern dieser Vertrag unter den heutigen demografischen Bedingungen noch tragfähig ist.",
 sample:"Der Generationenvertrag gerät unter Druck, weil der Alterslastquotient sinkt: 1948 finanzierten 9.5 Erwerbstätige einen Rentner, heute sind es nur noch 2.9, und bis 2050 werden es voraussichtlich nur noch 2 sein. Das bedeutet, dass immer weniger Beitragszahlende immer mehr Renten finanzieren müssen. Ohne Reformen (höheres Rentenalter, höhere Beiträge oder Leistungskürzungen) wird die AHV in ein strukturelles Defizit geraten. Allerdings könnte ein starkes Wirtschaftswachstum oder eine höhere Geburtenrate die Situation entspannen.",
 explain:"Bis 2035 wird die AHV einen zusätzlichen Finanzierungsbedarf von rund 15 Mrd. CHF haben. Die Lösung erfordert entweder höhere Beiträge, tiefere Renten, ein höheres Rentenalter oder alternative Finanzierungsquellen (z.B. MWST)."},

// ── Neue Fragen Finanzierung (f08–f15) ──
{id:"f08", topic:"finanzierung", type:"multi", diff:2, tax:"K2",
 q:"Aus welchen Quellen wird die AHV (1. Säule) finanziert?",
 options:[
   {v:"A", t:"Lohnbeiträge (Arbeitgeber- und Arbeitnehmeranteil)"},
   {v:"B", t:"Beiträge des Bundes"},
   {v:"C", t:"Anteil an der Mehrwertsteuer"},
   {v:"D", t:"Erträge aus dem AHV-Ausgleichsfonds"}
 ],
 correct:["A","B","C","D"],
 explain:"Die AHV wird aus vier Quellen finanziert: Lohnbeiträge (je 4.35% von AG und AN = 8.7% total), Beiträge des Bundes (ca. 20% der Ausgaben), ein MWST-Anteil (Demografieprozent) und Erträge aus dem AHV-Ausgleichsfonds. Alle vier Quellen sind korrekt."},

{id:"f09", topic:"finanzierung", type:"tf", diff:2, tax:"K2",
 q:"Beim Kapitaldeckungsverfahren (2. Säule) können die angesammelten Gelder durch eine Finanzkrise erheblich an Wert verlieren.",
 correct:true,
 explain:"Korrekt. Da das Kapitaldeckungsverfahren auf der Anlage von Kapital am Finanzmarkt beruht, können Börsencrashs oder Finanzkrisen die Pensionskassenvermögen stark verringern. Das ist ein zentrales Risiko dieses Verfahrens – im Gegensatz zum Umlageverfahren, das von Finanzmarktentwicklungen weitgehend unabhängig ist."},

{id:"f10", topic:"finanzierung", type:"mc", diff:1, tax:"K1",
 q:"Was bedeutet der Begriff «paritätisch» bei der Finanzierung der AHV?",
 options:[
   {v:"A", t:"Der Bund und die Kantone teilen sich die Kosten."},
   {v:"B", t:"Arbeitgeber und Arbeitnehmer zahlen je die Hälfte der Beiträge."},
   {v:"C", t:"Alle Versicherten zahlen den gleichen Betrag."},
   {v:"D", t:"Die Beiträge werden jährlich angepasst."}
 ],
 correct:"B",
 explain:"Paritätisch bedeutet «zu gleichen Teilen»: Arbeitgeber und Arbeitnehmer zahlen je 4.35% des Bruttolohns in die AHV ein – zusammen 8.7%. Dieses Prinzip gilt auch für die 2. Säule."},

{id:"f11", topic:"finanzierung", type:"calc", diff:2, tax:"K3",
 q:"Eine Arbeitnehmerin verdient CHF 6'000 brutto pro Monat. Der AHV-Beitragssatz beträgt insgesamt 8.7% (je hälftig AG/AN). Berechnen Sie:",
 rows:[
   {label:"Monatlicher AHV-Beitrag der Arbeitnehmerin (CHF)", answer:261, tolerance:1, unit:"CHF"},
   {label:"Monatlicher AHV-Beitrag des Arbeitgebers (CHF)", answer:261, tolerance:1, unit:"CHF"}
 ],
 explain:"AHV-Beitrag total: 8.7% von CHF 6'000 = CHF 522. Davon trägt die Arbeitnehmerin die Hälfte (4.35% = CHF 261) und der Arbeitgeber die andere Hälfte (4.35% = CHF 261)."},

{id:"f12", topic:"finanzierung", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die Finanzierungsmerkmale der richtigen Sozialversicherung zu.",
 categories:["AHV (1. Säule)", "BV (2. Säule)", "KV (Grundversicherung)"],
 items:[
   {t:"Einkommensabhängige Lohnbeiträge", cat:0},
   {t:"Individuelle Sparkonten mit Kapitalertrag", cat:1},
   {t:"Einheitliche Kopfprämie pro Kasse/Region", cat:2},
   {t:"Bundesbeiträge und MWST-Anteil", cat:0},
   {t:"Mindestens paritätische Beiträge AG/AN", cat:1},
   {t:"Prämienverbilligungen für Einkommensschwache", cat:2}
 ],
 explain:"Die drei wichtigsten Sozialversicherungszweige haben grundlegend verschiedene Finanzierungsmodelle: Die AHV basiert auf einkommensabhängigen Lohnbeiträgen (plus Bundesbeiträge), die BV auf individuellem Kapitalsparen (paritätisch), und die KV auf einheitlichen Kopfprämien (mit Prämienverbilligungen als sozialer Korrektur)."},

{id:"f13", topic:"finanzierung", type:"multi", diff:3, tax:"K4",
 q:"Welche der folgenden Aussagen zur Finanzierung des Schweizer Sozialstaats sind korrekt?",
 options:[
   {v:"A", t:"Die Soziallastquote der Schweiz ist seit 1960 kontinuierlich gestiegen."},
   {v:"B", t:"Die grössten Einnahmen fliessen in die Berufliche Vorsorge (2. Säule)."},
   {v:"C", t:"Die Krankenversicherung wird ausschliesslich über Kopfprämien finanziert."},
   {v:"D", t:"Der Anteil der Sozialausgaben an den Bundesausgaben beträgt rund ein Drittel."}
 ],
 correct:["A","B","D"],
 explain:"Die Soziallastquote stieg von ca. 10% (1960) auf über 27% (2017) (A). Die BV hat mit 39% den grössten Anteil an den Sozialversicherungseinnahmen (B). Die Sozialausgaben des Bundes machen ca. 31% der Bundesausgaben aus (D). Falsch ist C: Die Grundversicherung wird zwar primär über Kopfprämien finanziert, aber die Prämienverbilligungen kommen aus Steuergeldern der Kantone und des Bundes."},

{id:"f14", topic:"finanzierung", type:"tf", diff:1, tax:"K1",
 q:"Selbstständige müssen den vollen AHV-Beitragssatz alleine bezahlen, da sie keinen Arbeitgeber haben, der die Hälfte übernimmt.",
 correct:true,
 explain:"Korrekt. Selbstständig Erwerbende zahlen den gesamten AHV-Beitrag selber. Allerdings profitieren sie von einem reduzierten Beitragssatz (sinkende Skala bei tiefem Einkommen). Nicht erwerbstätige Personen (z.B. Studierende) bezahlen einen Mindestbeitrag."},

{id:"f15", topic:"finanzierung", type:"open", diff:3, tax:"K5",
 q:"Vergleichen Sie die Finanzierungsprinzipien der AHV (Umlageverfahren) und der Beruflichen Vorsorge (Kapitaldeckungsverfahren). Welches Verfahren ist «besser»?",
 sample:"Beide Verfahren haben Vor- und Nachteile. Das Umlageverfahren (AHV) ist solidarisch und inflationsresistent, aber stark abhängig von der demografischen Entwicklung (Alterslastquotient). Das Kapitaldeckungsverfahren (BV) ist individuell zurechenbar und demografieunabhängig, aber abhängig von Finanzmärkten und Zinsentwicklung. Es gibt kein «besseres» Verfahren – deshalb setzt die Schweiz bewusst auf eine Kombination beider Systeme. Die Risiken diversifizieren sich gegenseitig: Was dem einen schadet (Demografie), betrifft das andere nicht (Finanzmärkte) und umgekehrt.",
 explain:"Die Kombination beider Verfahren im Schweizer Drei-Säulen-System ist international anerkannt. Sie diversifiziert die Risiken und kombiniert Solidarität (AHV) mit individueller Verantwortung (BV)."},

// ══════════════════════════════════════════════
// ── VERSICHERUNGSPRINZIPIEN (i01–i15) ──
// ══════════════════════════════════════════════
{id:"i01", topic:"versicherung", type:"mc", diff:1, tax:"K1",
 q:"Was ist das Grundprinzip einer Versicherung?",
 options:[
   {v:"A", t:"Der Staat übernimmt alle individuellen Risiken."},
   {v:"B", t:"Risiken werden zusammengelegt und gemeinsam getragen (kollektive Risikoübernahme)."},
   {v:"C", t:"Jede Person spart individuell für den Schadensfall."},
   {v:"D", t:"Versicherungen verhindern das Eintreten von Schäden."}
 ],
 correct:"B",
 explain:"Das Grundprinzip einer Versicherung ist die kollektive Risikoübernahme (Solidaritätsprinzip): Risiken werden zusammengelegt und gemeinsam getragen. Nur bei einem kleinen Teil der Versicherten tritt tatsächlich ein Schaden ein, sodass sich die Kosten auf viele Prämienzahlende verteilen."},

{id:"i02", topic:"versicherung", type:"fill", diff:1, tax:"K1",
 q:"Das «{0}» besagt: Je grösser die Zahl der Versicherten, desto genauer kann die Versicherung die tatsächliche Zahl der Schadensfälle vorhersagen.",
 blanks:[
   {answer:"Gesetz der grossen Zahlen", alts:["Gesetz der Grossen Zahlen"]}
 ],
 explain:"Das Gesetz der grossen Zahlen ist ein mathematisches Prinzip: Bei einer grossen Anzahl Versicherter nähert sich die Häufigkeit eines Schadensfalls dem theoretischen Mittelwert an. So kann die Versicherung die Kosten zuverlässig kalkulieren."},

{id:"i03", topic:"versicherung", type:"mc", diff:2, tax:"K2",
 q:"Was versteht man unter «Adverse Selektion» (Negativauslese) bei Versicherungen?",
 img: {src:"img/vwl/sozialpolitik/adverse_selektion.svg", alt:"Adverse Selektion – Todesspirale bei Einheitsprämien ohne Obligatorium"},
 options:[
   {v:"A", t:"Versicherungen wählen absichtlich die schlechtesten Kunden aus."},
   {v:"B", t:"Gute Risiken scheiden nach und nach aus dem Markt aus, weil die Durchschnittsprämie für sie zu hoch ist."},
   {v:"C", t:"Versicherte verhalten sich nach Abschluss einer Versicherung riskanter."},
   {v:"D", t:"Der Staat wählt aus, welche Risiken versichert werden dürfen."}
 ],
 correct:"B",
 explain:"Bei adverser Selektion ist die Durchschnittsprämie für «gute» Risiken (z.B. vorsichtige Autofahrer) unattraktiv, da sie mehr zahlen als ihrem Risiko entspricht. Sie verzichten auf die Versicherung, wodurch der Anteil «schlechter» Risiken steigt, die Prämien weiter steigen und im Extremfall der Markt zusammenbrechen kann."},

{id:"i04", topic:"versicherung", type:"mc", diff:2, tax:"K2",
 q:"Was ist «Moral Hazard» im Versicherungskontext?",
 options:[
   {v:"A", t:"Eine betrügerische Absicht beim Abschluss einer Versicherung."},
   {v:"B", t:"Die Verhaltensänderung von Versicherten, die nach Abschluss einer Versicherung grössere Risiken eingehen."},
   {v:"C", t:"Die Gefahr, dass die Versicherungsgesellschaft insolvent wird."},
   {v:"D", t:"Ein moralisches Dilemma bei der Festlegung von Prämien."}
 ],
 correct:"B",
 explain:"Moral Hazard (moralisches Risiko) beschreibt die Verhaltensänderung nach Abschluss einer Versicherung: Versicherte geben sich weniger Mühe, Schäden zu verhindern, weil der Schaden ja gedeckt wäre. Beispiel: Ein Autofahrer mit Vollkaskoversicherung fährt unvorsichtiger."},

{id:"i05", topic:"versicherung", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die Gegenmassnahmen dem richtigen Versicherungsproblem zu.",
 categories:["Gegen Moral Hazard", "Gegen Adverse Selektion"],
 items:[
   {t:"Selbstbehalt einführen", cat:0},
   {t:"Bonus-Malus-System", cat:0},
   {t:"Verschiedene Risikogruppen unterschiedlich versichern", cat:1},
   {t:"Obligatorium (Versicherungspflicht)", cat:1}
 ],
 explain:"Gegen Moral Hazard helfen Selbstbehalt (eigene Kostenbeteiligung reduziert Anreiz zu riskantem Verhalten) und Bonus-Malus-Systeme (schadenfreie Versicherte erhalten Prämienreduktionen). Gegen adverse Selektion helfen Risikoklassifizierung (unterschiedliche Prämien für unterschiedliche Risiken) und Obligatorien (alle müssen versichert sein, auch die «guten» Risiken)."},

{id:"i06", topic:"versicherung", type:"tf", diff:2, tax:"K2",
 q:"Ersparnisse auf einem Bankkonto können bei kleinen Schäden (z.B. Glasbruch) eine sinnvolle Alternative zu einer Versicherung sein.",
 correct:true,
 explain:"Korrekt. Bei Schäden mit hoher Eintrittswahrscheinlichkeit und kleiner Schadenssumme (z.B. Glasbruch) ist die Prämie im Verhältnis zum Schaden hoch. Ersparnisse bieten den Vorteil, dass sie gegen verschiedenste Risiken schützen. Bei grossen Schäden (z.B. Brand, Krankheit) sind Ersparnisse hingegen keine echte Alternative."},

{id:"i07", topic:"versicherung", type:"open", diff:3, tax:"K4",
 q:"In der Schweizer Krankenversicherung (Grundversicherung) zahlen alle Erwachsenen pro Kasse und Region die gleiche Prämie, unabhängig von Alter oder Gesundheitszustand. Analysieren Sie, welche versicherungstheoretischen Probleme dadurch entstehen und warum trotzdem ein Obligatorium besteht.",
 sample:"Einheitsprämien schaffen ein Problem der adversen Selektion: Junge, Gesunde zahlen relativ zu ihrem Risiko zu viel, Ältere und Kranke zu wenig. Ohne Obligatorium würden viele Junge und Gesunde die Versicherung verlassen. Das Obligatorium verhindert dieses Ausscheiden der «guten» Risiken und stellt sicher, dass die Solidargemeinschaft bestehen bleibt. Die Einheitsprämie dient dem Solidaritätsprinzip (Umverteilung von Gesund zu Krank und von Jung zu Alt). Prämienverbilligungen mildern die Belastung für Einkommensschwache.",
 explain:"Die Schweizer Krankenversicherung kombiniert bewusst das Versicherungsprinzip mit dem Solidaritätsprinzip. Das Obligatorium ist nötig, um die adverse Selektion zu verhindern, die bei freiwilliger Teilnahme und Einheitsprämien unvermeidlich wäre."},

// ── Neue Fragen Versicherung (i08–i15) ──
{id:"i08", topic:"versicherung", type:"multi", diff:2, tax:"K2",
 q:"Welche der folgenden Massnahmen wirken gegen Moral Hazard in der Krankenversicherung?",
 options:[
   {v:"A", t:"Franchise (Selbstbehalt, den der Versicherte selber trägt)"},
   {v:"B", t:"Kostenbeteiligung von 10% der Kosten über der Franchise"},
   {v:"C", t:"Obligatorium für alle Einwohner"},
   {v:"D", t:"Wahlfranchisen mit Prämienrabatt bei höherer Franchise"}
 ],
 correct:["A","B","D"],
 explain:"Franchise (A), Kostenbeteiligung (B) und Wahlfranchisen mit Rabatt (D) sind Instrumente gegen Moral Hazard: Sie geben den Versicherten einen finanziellen Anreiz, nicht unnötig zum Arzt zu gehen. Das Obligatorium (C) hingegen wirkt gegen adverse Selektion, nicht gegen Moral Hazard."},

{id:"i09", topic:"versicherung", type:"mc", diff:1, tax:"K1",
 q:"Warum ist eine Versicherung gegen hohe Schäden mit niedriger Eintrittswahrscheinlichkeit (z.B. Hausbrand) sinnvoller als eine Versicherung gegen kleine, häufige Schäden (z.B. Glasbruch)?",
 options:[
   {v:"A", t:"Weil die Prämien bei seltenen Schäden günstiger sind als die Prämien bei häufigen Schäden."},
   {v:"B", t:"Weil hohe Schäden mit tiefer Wahrscheinlichkeit die individuelle finanzielle Existenz bedrohen können und Ersparnisse nicht ausreichen."},
   {v:"C", t:"Weil Versicherungen nur seltene Schäden versichern dürfen."},
   {v:"D", t:"Weil der Staat Versicherungen gegen kleine Schäden verbietet."}
 ],
 correct:"B",
 explain:"Das zentrale Argument für Versicherungen ist der Schutz gegen existenzbedrohende Risiken. Bei kleinen, häufigen Schäden ist die Prämie im Verhältnis zum Schaden hoch (die Versicherung muss Verwaltungskosten und Gewinn decken). Ersparnisse sind hier oft günstiger. Bei seltenen, aber sehr hohen Schäden (Brand, schwere Krankheit) übersteigt der potenzielle Schaden jedoch jede individuelle Sparfähigkeit."},

{id:"i10", topic:"versicherung", type:"tf", diff:2, tax:"K2",
 q:"Asymmetrische Information bedeutet, dass die Versicherung mehr über das Risiko des Versicherten weiss als der Versicherte selbst.",
 correct:false,
 explain:"Falsch – es ist genau umgekehrt. Bei asymmetrischer Information weiss der Versicherte mehr über sein eigenes Risiko als die Versicherung. Zum Beispiel kennt ein Autofahrer seinen eigenen Fahrstil besser als die Versicherungsgesellschaft. Diese Informationsasymmetrie ist die Ursache sowohl für adverse Selektion als auch für Moral Hazard."},

{id:"i11", topic:"versicherung", type:"fill", diff:2, tax:"K2",
 q:"Das Problem der {0} entsteht vor Vertragsabschluss (die Versicherung kann gute und schlechte Risiken nicht unterscheiden). Das Problem des {1} entsteht nach Vertragsabschluss (der Versicherte ändert sein Verhalten).",
 blanks:[
   {answer:"adversen Selektion", alts:["Adverse Selektion","Negativauslese","adversen Selection"]},
   {answer:"Moral Hazard", alts:["moralischen Risikos","Moral hazard","moral hazard"]}
 ],
 explain:"Die zeitliche Unterscheidung ist zentral: Adverse Selektion ist ein Problem der Informationsasymmetrie VOR Vertragsabschluss (ex ante). Moral Hazard ist ein Problem der Verhaltensänderung NACH Vertragsabschluss (ex post). Beide Probleme haben unterschiedliche Ursachen und erfordern unterschiedliche Gegenmassnahmen."},

{id:"i12", topic:"versicherung", type:"multi", diff:3, tax:"K4",
 q:"In der Schweizer Autoversicherung gibt es ein Bonus-Malus-System. Welche der folgenden Aussagen treffen zu?",
 options:[
   {v:"A", t:"Es wirkt gegen Moral Hazard, weil schadenfreies Fahren belohnt wird."},
   {v:"B", t:"Es wirkt gegen adverse Selektion, weil sich die Prämie dem individuellen Risiko anpasst."},
   {v:"C", t:"Es schafft einen finanziellen Anreiz, Unfälle zu vermeiden."},
   {v:"D", t:"Es ersetzt das Obligatorium der Haftpflichtversicherung."}
 ],
 correct:["A","B","C"],
 explain:"Das Bonus-Malus-System wirkt doppelt: Gegen Moral Hazard, weil Unfälle zu höheren Prämien führen und somit vorsichtiges Fahren belohnt wird (A, C). Gegen adverse Selektion, weil sich die Prämie über die Zeit dem individuellen Risiko annähert – vorsichtige Fahrer zahlen weniger als riskante (B). Es ersetzt aber nicht das Obligatorium der Haftpflichtversicherung (D), das separat besteht."},

{id:"i13", topic:"versicherung", type:"mc", diff:2, tax:"K3",
 q:"Eine Versicherung berechnet die Prämie für eine Hausratversicherung. Die erwartete Schadenssumme beträgt CHF 200 pro Jahr pro Versichertem. Welcher der folgenden Prämienansätze ist am realistischsten?",
 options:[
   {v:"A", t:"CHF 150 pro Jahr (unter dem erwarteten Schaden)"},
   {v:"B", t:"CHF 200 pro Jahr (exakt der erwartete Schaden)"},
   {v:"C", t:"CHF 260 pro Jahr (erwarteter Schaden plus Verwaltungskosten und Gewinn)"},
   {v:"D", t:"CHF 500 pro Jahr (möglichst hohe Sicherheitsmarge)"}
 ],
 correct:"C",
 explain:"Eine realistische Prämie muss den erwarteten Schaden (CHF 200) plus Verwaltungskosten, Rückstellungen und Gewinnmarge decken. Eine Prämie unter dem erwarteten Schaden (A) wäre nicht kostendeckend, die exakte Schadenshöhe (B) deckt keine Kosten, und eine zu hohe Prämie (D) wäre am Markt nicht konkurrenzfähig."},

{id:"i14", topic:"versicherung", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die Beispiele dem richtigen Versicherungsproblem zu.",
 categories:["Adverse Selektion", "Moral Hazard"],
 items:[
   {t:"Junge, gesunde Personen verzichten auf eine freiwillige Zusatzversicherung", cat:0},
   {t:"Ein vollkaskoversicherter Autobesitzer parkt sein Auto unabgeschlossen", cat:1},
   {t:"Eine Person mit chronischer Krankheit schliesst sofort eine Versicherung ab", cat:0},
   {t:"Nach Abschluss einer Reiseversicherung wird die Reise in ein Risikogebiet gebucht", cat:1},
   {t:"Versicherte mit geringem Risiko wechseln zu einer günstigeren Kasse", cat:0},
   {t:"Ein Hausbesitzer vernachlässigt den Brandschutz nach Abschluss der Feuerversicherung", cat:1}
 ],
 explain:"Adverse Selektion betrifft die Zusammensetzung des Versichertenkreises (wer versichert sich?). Moral Hazard betrifft das Verhalten nach Abschluss der Versicherung (wie verhält sich der Versicherte?). Die Unterscheidung ist zentral für die Wahl der richtigen Gegenmassnahme."},

{id:"i15", topic:"versicherung", type:"open", diff:3, tax:"K5",
 q:"Diskutieren Sie, ob die Franchise in der Schweizer Grundversicherung (Mindestfranchise CHF 300, Wahlfranchisen bis CHF 2'500) ein geeignetes Instrument gegen Moral Hazard ist. Berücksichtigen Sie dabei auch mögliche negative Effekte.",
 sample:"Die Franchise wirkt grundsätzlich gegen Moral Hazard, weil Versicherte einen Teil der Kosten selber tragen und somit einen Anreiz haben, unnötige Arztbesuche zu vermeiden. Allerdings gibt es negative Effekte: Einkommensschwache Personen könnten notwendige Arztbesuche aufschieben, was langfristig zu höheren Kosten führt (verschleppte Krankheiten). Zudem wählen Personen mit guter Gesundheit hohe Franchisen (CHF 2'500) und zahlen dadurch tiefere Prämien, was die Solidarität im System reduziert. Die Mindestfranchise ist ein Kompromiss zwischen Kostenkontrolle und Zugänglichkeit.",
 explain:"Die Franchise-Debatte ist ein klassisches Beispiel für den Zielkonflikt zwischen Effizienz (weniger Moral Hazard) und Gerechtigkeit (Zugang zu Gesundheitsversorgung). Die Schweiz versucht mit der Bandbreite von CHF 300–2'500 einen Kompromiss."},

// ══════════════════════════════════════════════
// ── STAATSEINGRIFFE & STAATSVERSAGEN (e01–e14) ──
// ══════════════════════════════════════════════
{id:"e01", topic:"staatseingriffe", type:"mc", diff:1, tax:"K1",
 q:"Welches ist KEIN Grund für Staatseingriffe in die Wirtschaft?",
 options:[
   {v:"A", t:"Marktversagen (z.B. öffentliche Güter, externe Effekte)"},
   {v:"B", t:"Sicherung des Wettbewerbs und Bekämpfung von Monopolen"},
   {v:"C", t:"Maximierung des Gewinns einzelner Unternehmen"},
   {v:"D", t:"Bereitstellung öffentlicher Güter"}
 ],
 correct:"C",
 explain:"Die Maximierung von Unternehmensgewinnen ist kein legitimer Grund für Staatseingriffe. Staatliche Eingriffe sind gerechtfertigt bei Marktversagen, zur Sicherung des Wettbewerbs, zur Bereitstellung öffentlicher Güter und zum Schutz bei externen Effekten oder asymmetrischer Information."},

{id:"e02", topic:"staatseingriffe", type:"sort", diff:1, tax:"K1",
 q:"Ordnen Sie die Beispiele der richtigen Art des Staatseingriffs zu.",
 categories:["Regulierung", "Finanzierung (Steuern/Subventionen)", "Produktion", "Transfers"],
 items:[
   {t:"Obligatorische Sozialversicherungsbeiträge", cat:0},
   {t:"Verbilligung der Krankenkassenprämien", cat:1},
   {t:"Staatliche Schulhäuser und Lehrpersonen", cat:2},
   {t:"Sozialhilfe und Mietbeiträge", cat:3},
   {t:"Mindestlöhne", cat:0},
   {t:"Einkommenssteuer", cat:1}
 ],
 explain:"Der Staat greift auf vier Arten ein: Regulierung (Qualitäts-, Quantitäts- und Preiskontrolle), Finanzierung (Steuern und Subventionen), Produktion (öffentliche Güter bereitstellen) und Transfers (direkte Geld- oder Sachleistungen an Bedürftige)."},

{id:"e03", topic:"staatseingriffe", type:"fill", diff:2, tax:"K2",
 q:"In einer Welt mit {0} Wettbewerb, {1} Märkten und keinem Marktversagen bräuchte es keine Staatseingriffe. Da diese Bedingungen in der Realität nicht erfüllt sind, können Interventionen sinnvoll sein.",
 blanks:[
   {answer:"vollkommenem", alts:["vollständigem","perfektem"]},
   {answer:"vollständigen", alts:["vollkommenen","perfekten"]}
 ],
 explain:"Ohne Staatseingriffe funktioniert die Wirtschaft effizient, wenn drei Bedingungen erfüllt sind: vollkommener Wettbewerb (keine Marktmacht), vollständige Märkte (für jedes Gut existiert ein Markt) und kein Marktversagen. Da diese Idealbedingungen nie vollständig erfüllt sind, gibt es Raum für staatliche Interventionen."},

{id:"e04", topic:"staatseingriffe", type:"mc", diff:2, tax:"K2",
 q:"Was ist mit «Staatsversagen» gemeint?",
 options:[
   {v:"A", t:"Der Staat geht in Konkurs."},
   {v:"B", t:"Staatliche Massnahmen verfehlen ihre Ziele oder verursachen unbeabsichtigte Nebenwirkungen."},
   {v:"C", t:"Die Bürger verweigern die Steuerzahlung."},
   {v:"D", t:"Der Staat stellt keine öffentlichen Güter mehr bereit."}
 ],
 correct:"B",
 explain:"Staatsversagen bedeutet, dass staatliche Eingriffe ihre Ziele nicht erreichen oder sogar unbeabsichtigte negative Nebenwirkungen haben. Gründe sind u.a.: Eigendynamik/Überangebot, Ineffizienz, veränderte Leistungsanreize und unbeabsichtigte Nebenwirkungen (z.B. Arbeitnehmerschutz führt zu mehr Arbeitslosigkeit)."},

{id:"e05", topic:"staatseingriffe", type:"tf", diff:2, tax:"K2",
 q:"Arbeitnehmerschutz kann als unbeabsichtigte Nebenwirkung zu mehr Arbeitslosigkeit führen.",
 correct:true,
 explain:"Korrekt. Strenger Arbeitnehmerschutz kann den Kündigungsschutz so stark erhöhen, dass Unternehmen weniger Arbeitskräfte einstellen (Insider-Outsider-Modell). Die «Insider» (Angestellte) profitieren, während «Outsider» (Arbeitslose) schlechtere Chancen haben. Dies ist ein klassisches Beispiel für Staatsversagen durch unbeabsichtigte Nebenwirkungen."},

{id:"e06", topic:"staatseingriffe", type:"mc", diff:3, tax:"K4",
 q:"Die Sozialhilfe bietet ein Einkommen ohne Gegenleistung. Welches ökonomische Problem entsteht dadurch?",
 options:[
   {v:"A", t:"Inflation steigt, weil mehr Geld im Umlauf ist."},
   {v:"B", t:"Ein Moral-Hazard-Problem: Der Anreiz, erwerbstätig zu sein, sinkt durch das «Gratiseinkommen»."},
   {v:"C", t:"Die Arbeitsproduktivität der Gesamtwirtschaft steigt."},
   {v:"D", t:"Der Staat spart langfristig Geld."}
 ],
 correct:"B",
 explain:"Je grosszügiger staatliche Sozialtransfers sind, desto grösser ist der Anreiz, die eigene Leistungsbereitschaft zu reduzieren (Moral-Hazard-Problem). Dies kann zu einem Teufelskreis führen: Geringere Leistungsbereitschaft reduziert die Wirtschaftsleistung, was die Finanzierung der Sozialwerke erschwert."},

{id:"e07", topic:"staatseingriffe", type:"open", diff:3, tax:"K5",
 q:"«Grundsätzlich sollten Umverteilungsmassnahmen als Geldleistungen und nicht als Sachleistungen erfolgen.» Diskutieren Sie diese Aussage und nennen Sie Argumente für und gegen Sachleistungen.",
 sample:"Für Geldleistungen spricht, dass Individuen ihre eigenen Präferenzen am besten kennen und das Geld optimal einsetzen können (Konsumentensouveränität). Für Sachleistungen sprechen paternalistische Gründe (z.B. sicherstellen, dass Arme tatsächlich Essen kaufen) und das Konzept meritorischer Güter (vom Markt ungenügend bereitgestellte Güter wie Bildung). Sachleistungen können auch gezielter sein, bergen aber die Gefahr, dass sie nicht den tatsächlichen Bedürfnissen entsprechen.",
 explain:"Die Debatte zwischen Geld- und Sachleistungen ist ein Kernthema der Sozialpolitik. In der Praxis gibt es in der Schweiz beides: Geldleistungen (Sozialhilfe, AHV-Renten) und Sachleistungen bzw. zweckgebundene Transfers (Prämienverbilligungen, subventionierte Kitaplätze)."},

// ── Neue Fragen Staatseingriffe (e08–e14) ──
{id:"e08", topic:"staatseingriffe", type:"multi", diff:2, tax:"K2",
 q:"Welche der folgenden Phänomene sind Beispiele für Staatsversagen?",
 options:[
   {v:"A", t:"Bürokratie verteuert und verlangsamt öffentliche Dienstleistungen."},
   {v:"B", t:"Subventionen für eine Industrie verhindern notwendigen Strukturwandel."},
   {v:"C", t:"Der Staat baut Strassen und Schulen."},
   {v:"D", t:"Sozialtransfers reduzieren den Anreiz zur Erwerbstätigkeit."}
 ],
 correct:["A","B","D"],
 explain:"Bürokratie (A), Strukturerhaltung durch Subventionen (B) und reduzierte Leistungsanreize (D) sind klassische Formen des Staatsversagens. Der Bau von Strassen und Schulen (C) ist hingegen eine sinnvolle Bereitstellung öffentlicher Güter und meritorischer Güter – also ein Grund für Staatseingriffe, nicht ein Beispiel für Staatsversagen."},

{id:"e09", topic:"staatseingriffe", type:"tf", diff:2, tax:"K2",
 q:"Die «Armutsfalle» entsteht, wenn Sozialhilfeempfänger bei Aufnahme einer Arbeit kaum mehr Geld zur Verfügung haben als ohne Arbeit.",
 correct:true,
 explain:"Korrekt. Die Armutsfalle (auch «Schwelleneffekt» oder «poverty trap») entsteht, wenn der Entzug von Sozialhilfe und Prämienverbilligungen bei steigendem Einkommen dazu führt, dass sich Arbeiten kaum lohnt. Das verfügbare Einkommen steigt nur minimal oder gar nicht, obwohl die Person arbeitet. Dies ist ein wichtiges Beispiel für unbeabsichtigte Nebenwirkungen der Sozialpolitik."},

{id:"e10", topic:"staatseingriffe", type:"mc", diff:2, tax:"K2",
 q:"Welches Konzept beschreibt Güter, die der Markt in zu geringer Menge bereitstellt, weil die Individuen deren Nutzen unterschätzen?",
 options:[
   {v:"A", t:"Öffentliche Güter"},
   {v:"B", t:"Meritorische Güter"},
   {v:"C", t:"Demeritorische Güter"},
   {v:"D", t:"Clubgüter"}
 ],
 correct:"B",
 explain:"Meritorische Güter sind Güter, deren Nutzen die Individuen unterschätzen (z.B. Bildung, Gesundheitsvorsorge, Altersvorsorge). Der Staat fördert ihren Konsum – etwa durch Obligatorien (Schulpflicht, Versicherungspflicht) oder Subventionen. Demeritorische Güter sind das Gegenteil: Güter, die übermässig konsumiert werden (z.B. Tabak, Alkohol) und die der Staat einschränkt."},

{id:"e11", topic:"staatseingriffe", type:"sort", diff:2, tax:"K3",
 q:"Ordnen Sie die Beispiele der richtigen Kategorie von Staatsversagen zu.",
 categories:["Veränderte Leistungsanreize", "Eigendynamik / Überangebot", "Unbeabsichtigte Nebenwirkungen"],
 items:[
   {t:"Grosszügige Arbeitslosenversicherung verlängert die Stellensuche", cat:0},
   {t:"Einmal eingeführte Subventionen sind politisch kaum mehr abschaffbar", cat:1},
   {t:"Strenger Kündigungsschutz erschwert Neueinstellungen", cat:2},
   {t:"Hohe Sozialhilfe reduziert den Anreiz zu arbeiten", cat:0},
   {t:"Sozialausgaben wachsen schneller als das BIP", cat:1},
   {t:"Mietpreisbremse führt zu Wohnungsknappheit", cat:2}
 ],
 explain:"Staatsversagen hat verschiedene Ursachen: Veränderte Leistungsanreize (Moral Hazard durch Sozialtransfers), Eigendynamik/Überangebot (einmal eingeführte Massnahmen wachsen und sind schwer rückgängig zu machen) und unbeabsichtigte Nebenwirkungen (gut gemeinte Regulierungen haben gegenteilige Effekte)."},

{id:"e12", topic:"staatseingriffe", type:"multi", diff:3, tax:"K4",
 q:"Welche der folgenden Aussagen zum Verhältnis von Marktversagen und Staatsversagen sind korrekt?",
 options:[
   {v:"A", t:"Marktversagen ist eine notwendige, aber nicht hinreichende Bedingung für Staatseingriffe."},
   {v:"B", t:"Ein Staatseingriff ist nur dann sinnvoll, wenn er das Ergebnis gegenüber dem Markt verbessert."},
   {v:"C", t:"Wenn der Markt versagt, ist der Staat immer die bessere Lösung."},
   {v:"D", t:"Auch staatliche Eingriffe können zu Wohlfahrtsverlusten führen."}
 ],
 correct:["A","B","D"],
 explain:"Marktversagen allein rechtfertigt noch keinen Staatseingriff – man muss prüfen, ob der Staat es tatsächlich besser macht (A). Ein Eingriff lohnt sich nur, wenn er das Ergebnis verbessert (B). Auch der Staat kann scheitern (D). Falsch ist C: Staatsversagen zeigt, dass der Staat nicht automatisch die bessere Lösung ist."},

{id:"e13", topic:"staatseingriffe", type:"fill", diff:2, tax:"K2",
 q:"Das {0}-Outsider-Modell erklärt, warum strenger Arbeitnehmerschutz zu mehr Arbeitslosigkeit führen kann: Die {0} (Beschäftigten) profitieren vom Schutz, während die {1} (Arbeitslosen) schlechtere Chancen auf eine Anstellung haben.",
 blanks:[
   {answer:"Insider", alts:[]},
   {answer:"Outsider", alts:[]}
 ],
 explain:"Das Insider-Outsider-Modell ist ein zentrales Konzept der Arbeitsmarktökonomie. Es zeigt, wie gut gemeinte Schutzmassnahmen für Beschäftigte (Insider) die Situation für Arbeitslose (Outsider) verschlechtern können – ein klassisches Beispiel für Staatsversagen durch unbeabsichtigte Nebenwirkungen."},

{id:"e14", topic:"staatseingriffe", type:"open", diff:3, tax:"K5",
 q:"In der Schweiz wurde 2014 die Volksinitiative für einen flächendeckenden Mindestlohn von CHF 22/Stunde abgelehnt. Analysieren Sie aus ökonomischer Sicht die möglichen Vor- und Nachteile eines Mindestlohns als sozialpolitisches Instrument.",
 sample:"Vorteile: Schutz vor Lohndumping, Existenzsicherung für Geringverdienende, Reduktion der Working Poor, weniger Sozialhilfeabhängigkeit. Nachteile: Erhöhte Arbeitslosigkeit bei Geringqualifizierten (wenn Mindestlohn über dem Marktlohn liegt), Insider-Outsider-Problematik, mögliche Preissteigerungen, Wettbewerbsnachteile für arbeitsintensive Branchen. In der Schweiz wird das Argument stark gemacht, dass die Lohnfindung durch Sozialpartnerschaft (GAV) flexibler ist als ein staatlicher Mindestlohn.",
 explain:"Die Mindestlohn-Debatte berührt den Zielkonflikt zwischen Effizienz (flexible Lohnfindung) und Gerechtigkeit (Existenzsicherung). Die Schweiz setzt primär auf Gesamtarbeitsverträge (GAV) statt auf einen einheitlichen Mindestlohn – einige Kantone haben aber kantonale Mindestlöhne eingeführt."},

// ══════════════════════════════════════════════
// ── HERAUSFORDERUNGEN & REFORMEN (h01–h15) ──
// ══════════════════════════════════════════════
{id:"h01", topic:"herausforderungen", type:"mc", diff:1, tax:"K1",
 q:"Wie hat sich der Alterslastquotient (Verhältnis der über 64-Jährigen zu den 20–64-Jährigen) in der Schweiz entwickelt?",
 img: {src:"img/vwl/sozialpolitik/alterslastquotient.svg", alt:"Alterslastquotient Schweiz 1948–2050: sinkend von 9.5:1 auf prognostizierte 2:1"},
 options:[
   {v:"A", t:"Er ist von 2:1 (1948) auf 9.5:1 (heute) gestiegen."},
   {v:"B", t:"Er ist von 9.5:1 (1948) auf ca. 2.9:1 (heute) gesunken und wird weiter auf 2:1 sinken."},
   {v:"C", t:"Er ist stabil bei 5:1 geblieben."},
   {v:"D", t:"Er hat sich seit 1948 nicht verändert."}
 ],
 correct:"B",
 explain:"Der Alterslastquotient ist von 9.5:1 (1948) auf heute 2.9:1 gesunken. Bis 2050 wird er voraussichtlich auf 2:1 absinken. Das bedeutet: 1948 finanzierten 9.5 Erwerbstätige einen Rentner, heute nur noch 2.9. Dies ist eine der grössten Herausforderungen für das Umlageverfahren der AHV."},

{id:"h02", topic:"herausforderungen", type:"tf", diff:1, tax:"K1",
 q:"Am 5. Juni 2016 hat das Schweizer Stimmvolk die Initiative für ein bedingungsloses Grundeinkommen abgelehnt.",
 correct:true,
 explain:"Korrekt. Die Initiative forderte ein bedingungsloses Grundeinkommen von CHF 2'500 pro Monat für jede in der Schweiz lebende Person (Kinder CHF 625), ohne jede Bedingung. Sie wurde vom Volk abgelehnt."},

{id:"h03", topic:"herausforderungen", type:"mc", diff:2, tax:"K2",
 q:"Was ist die «negative Einkommenssteuer»?",
 options:[
   {v:"A", t:"Eine Steuer, die nur auf negative Einkommen (Verluste) erhoben wird."},
   {v:"B", t:"Ein System, bei dem Haushalte mit tiefem Einkommen Transferzahlungen erhalten statt Steuern zu zahlen."},
   {v:"C", t:"Eine Steuer, die bei sinkendem BIP automatisch gesenkt wird."},
   {v:"D", t:"Die Abschaffung aller Einkommenssteuern."}
 ],
 correct:"B",
 explain:"Die negative Einkommenssteuer verbindet Sozial- und Steuersystem: Tiefe Einkommen erhalten Transferzahlungen (negative Steuer), die mit steigendem Einkommen abnehmen. Ab einem Schwellenwert werden reguläre Steuern fällig. Da die Transfers nicht vollständig gekürzt werden, besteht immer ein Anreiz zur Erwerbstätigkeit – die «Armutsfalle» wird vermieden."},

{id:"h04", topic:"herausforderungen", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die Reformvorschläge der richtigen Seite zu.",
 categories:["Leistungsseite (Ausgaben ändern)", "Finanzierungsseite (Einnahmen ändern)"],
 items:[
   {t:"Heraufsetzung des Rentenalters", cat:0},
   {t:"Umstellung auf Kapitaldeckungsverfahren", cat:1},
   {t:"Einführung einer steuerfreien Einheitsrente", cat:0},
   {t:"Finanzierung über Mehrwertsteuer statt Lohnprozente", cat:1},
   {t:"Privatisierung der ALV", cat:0},
   {t:"Finanzierung aus Ökosteuern", cat:1}
 ],
 explain:"Reformen können entweder die Leistungsseite (was und wie viel ausbezahlt wird) oder die Finanzierungsseite (wie die Einnahmen generiert werden) betreffen. Oft braucht es eine Kombination beider Ansätze."},

{id:"h05", topic:"herausforderungen", type:"open", diff:3, tax:"K5",
 q:"Im Interview mit den Jungparteien werden drei unterschiedliche Positionen zum Sozialstaat vertreten. Vergleichen Sie die Positionen von Junger SP, Jungfreisinnigen und Junger SVP zur Frage, ob der Sozialstaat weiter ausgebaut werden soll.",
 sample:"Junge SP (Jansen): Fordert einen Ausbau des Sozialstaats, besonders im Gesundheitsbereich und bei der Kinderbetreuung. Begründung: Pflegeleistungen sind kaum rationalisierbar, daher steigen die Kosten zwangsläufig. Lehnt Kürzungen ab. Jungfreisinnige (Müller): Sehen den Sozialstaat als «fertig gebaut». Fordern Eigenverantwortung und warnen, dass die Jungen die Lasten des Ausbaus tragen müssen. Junge SVP (Trachsel): Fordert sogar einen Rückbau, da das aufgeblasene Netz eine Anspruchsmentalität fördert und die Selbstverantwortung lähmt. Sieht die Grenzen der Finanzierbarkeit als erreicht.",
 explain:"Die drei Positionen widerspiegeln die Gerechtigkeitstheorien: Die Junge SP steht den Collectivists/Liberals nahe (mehr Umverteilung), die Jungfreisinnigen den Liberals/Libertarians (Eigenverantwortung), die Junge SVP den Libertarians (weniger Staat). Diese Debatte ist zentral für die Schweizer Sozialpolitik."},

// ── Neue Fragen Herausforderungen (h06–h15) ──
{id:"h06", topic:"herausforderungen", type:"multi", diff:2, tax:"K2",
 q:"Welche demografischen Trends belasten das Umlageverfahren der AHV?",
 options:[
   {v:"A", t:"Steigende Lebenserwartung: Die Renten müssen länger bezahlt werden."},
   {v:"B", t:"Sinkende Geburtenrate: Weniger zukünftige Beitragszahlende."},
   {v:"C", t:"Babyboomer-Generation geht in Rente: Grosse Kohorte wechselt von Beitragszahlern zu Rentnern."},
   {v:"D", t:"Zunehmende Erwerbstätigkeit von Frauen: Mehr Beitragszahlende."}
 ],
 correct:["A","B","C"],
 explain:"Steigende Lebenserwartung (A), sinkende Geburtenrate (B) und die Pensionierung der Babyboomer-Generation (C) belasten die AHV. Die zunehmende Erwerbstätigkeit von Frauen (D) wirkt hingegen entlastend, da mehr Personen Beiträge zahlen. Trotzdem überwiegen die belastenden Faktoren deutlich."},

{id:"h07", topic:"herausforderungen", type:"mc", diff:2, tax:"K2",
 q:"Was versteht man unter der «Armutsfalle» (poverty trap)?",
 options:[
   {v:"A", t:"Die Tatsache, dass arme Länder nie reich werden können."},
   {v:"B", t:"Die Situation, in der sich Erwerbsarbeit kaum lohnt, weil das Einkommen durch den Wegfall von Sozialleistungen nicht oder kaum steigt."},
   {v:"C", t:"Die Vererbung von Armut über Generationen."},
   {v:"D", t:"Die Verschuldung von armen Haushalten durch Konsumkredite."}
 ],
 correct:"B",
 explain:"Die Armutsfalle entsteht, wenn bei steigendem Erwerbseinkommen Sozialhilfe, Prämienverbilligungen und andere Transfers gekürzt werden. Unter Umständen steigt das verfügbare Einkommen bei Aufnahme einer Arbeit kaum. Dies reduziert den Anreiz zur Erwerbstätigkeit und ist ein zentrales Problem der Sozialpolitik."},

{id:"h08", topic:"herausforderungen", type:"tf", diff:2, tax:"K2",
 q:"Die negative Einkommenssteuer würde das Problem der Armutsfalle lösen, weil die Transfers mit steigendem Einkommen nur teilweise und nicht vollständig gekürzt werden.",
 correct:true,
 explain:"Korrekt. Bei der negativen Einkommenssteuer wird der Transfer mit steigendem Einkommen zwar reduziert, aber nicht im Verhältnis 1:1. Das bedeutet, dass sich jeder verdiente Franken lohnt – das verfügbare Einkommen steigt immer mit dem Erwerbseinkommen. So wird die Armutsfalle vermieden."},

{id:"h09", topic:"herausforderungen", type:"multi", diff:3, tax:"K4",
 q:"Welche Argumente werden FÜR ein bedingungsloses Grundeinkommen (BGE) vorgebracht?",
 options:[
   {v:"A", t:"Es beseitigt die Armutsfalle und die Stigmatisierung der Sozialhilfe."},
   {v:"B", t:"Es ermöglicht mehr Freiheit in der Wahl von Arbeit, Pflege und Weiterbildung."},
   {v:"C", t:"Es reduziert die Bürokratie des bestehenden Sozialsystems."},
   {v:"D", t:"Es ist günstiger als das heutige Sozialsystem."}
 ],
 correct:["A","B","C"],
 explain:"Das BGE wird mit dem Abbau der Armutsfalle (A), mehr individueller Freiheit (B) und weniger Bürokratie (C) begründet. Es ist allerdings nicht unbedingt günstiger als das bestehende System (D) – je nach Höhe des BGE könnten die Kosten sogar massiv steigen. In der Schweizer Abstimmung 2016 wurde das BGE u.a. wegen Finanzierungsbedenken abgelehnt."},

{id:"h10", topic:"herausforderungen", type:"fill", diff:1, tax:"K1",
 q:"Im Jahr 2024 stimmte das Schweizer Volk der AHV-Reform «AHV 21» zu. Eine zentrale Massnahme war die Erhöhung des Rentenalters der Frauen von {0} auf {1} Jahre.",
 blanks:[
   {answer:"64", alts:[]},
   {answer:"65", alts:[]}
 ],
 explain:"Die AHV-Reform «AHV 21» (in Kraft seit 2024) hat das Referenzalter der Frauen von 64 auf 65 Jahre erhöht und damit an dasjenige der Männer angeglichen. Zudem wurde ein MWST-Prozent für die AHV erhöht und ein flexibler Rentenbezug (63–70) eingeführt."},

{id:"h11", topic:"herausforderungen", type:"mc", diff:2, tax:"K3",
 q:"Ein Land steht vor der Wahl: Rentenalter auf 67 erhöhen ODER Lohnbeiträge um 2 Prozentpunkte erhöhen. Welche Auswirkung hat die Erhöhung des Rentenalters im Vergleich zur Beitragserhöhung?",
 options:[
   {v:"A", t:"Rentenalter-Erhöhung wirkt doppelt: mehr Beiträge (längere Erwerbstätigkeit) und weniger Leistungen (kürzerer Rentenbezug)."},
   {v:"B", t:"Beide Massnahmen wirken identisch auf die AHV-Finanzen."},
   {v:"C", t:"Die Beitragserhöhung wirkt stärker, weil sie sofort greift."},
   {v:"D", t:"Die Rentenalter-Erhöhung hat keine Wirkung auf die AHV-Finanzen."}
 ],
 correct:"A",
 explain:"Die Erhöhung des Rentenalters hat einen doppelten Effekt: Einerseits zahlen die Betroffenen länger Beiträge (Einnahmenseite), andererseits beziehen sie kürzer Rente (Ausgabenseite). Eine reine Beitragserhöhung wirkt nur auf der Einnahmenseite. Daher ist die Rentenalter-Erhöhung aus rein finanzieller Sicht oft wirkungsvoller."},

{id:"h12", topic:"herausforderungen", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die Argumente zum bedingungslosen Grundeinkommen (BGE) der richtigen Kategorie zu.",
 categories:["Argumente FÜR das BGE", "Argumente GEGEN das BGE"],
 items:[
   {t:"Keine Stigmatisierung mehr, weil alle das BGE erhalten", cat:0},
   {t:"Massive Kosten: CHF 2'500 × 12 × alle Einwohner", cat:1},
   {t:"Weniger Bürokratie als das heutige System", cat:0},
   {t:"Sinkende Erwerbsmotivation bei grosszügigem BGE", cat:1},
   {t:"Mehr Freiheit für Pflege, Ehrenamt und Weiterbildung", cat:0},
   {t:"Unklar, wie es finanziert werden soll", cat:1}
 ],
 explain:"Die BGE-Debatte ist ein Kernthema der modernen Sozialpolitik. Befürworter betonen die Entbürokratisierung, die Freiheit und die Entstigmatisierung. Gegner warnen vor den enormen Kosten, sinkender Erwerbsmotivation und fehlender Finanzierbarkeit. In der Schweizer Abstimmung 2016 wurde das BGE mit 77% Nein-Stimmen deutlich abgelehnt."},

{id:"h13", topic:"herausforderungen", type:"multi", diff:2, tax:"K2",
 q:"Welche der folgenden Reformansätze wurden in der Schweiz bereits umgesetzt oder sind in Diskussion?",
 options:[
   {v:"A", t:"Angleichung des Rentenalters von Mann und Frau (AHV 21)"},
   {v:"B", t:"Zusätzliche MWST-Finanzierung für die AHV"},
   {v:"C", t:"Einführung eines bedingungslosen Grundeinkommens"},
   {v:"D", t:"Flexibler Rentenbezug zwischen 63 und 70 Jahren"}
 ],
 correct:["A","B","D"],
 explain:"Die AHV 21 hat das Referenzalter der Frauen auf 65 erhöht (A), einen MWST-Zuschlag eingeführt (B) und einen flexiblen Rentenbezug ermöglicht (D). Das bedingungslose Grundeinkommen (C) wurde 2016 in einer Volksabstimmung abgelehnt und ist nicht umgesetzt."},

{id:"h14", topic:"herausforderungen", type:"mc", diff:3, tax:"K4",
 q:"Warum wird die Gesundheitsversorgung im Vergleich zum Rest der Wirtschaft immer teurer (sog. «Baumol'sche Kostenkrankheit»)?",
 options:[
   {v:"A", t:"Weil Ärzte zu viel verdienen."},
   {v:"B", t:"Weil personalintensive Dienstleistungen wie Pflege und Medizin kaum durch technischen Fortschritt rationalisierbar sind, die Löhne aber mit der Gesamtwirtschaft steigen."},
   {v:"C", t:"Weil die Pharmabranche zu hohe Gewinne macht."},
   {v:"D", t:"Weil Patienten immer häufiger krank werden."}
 ],
 correct:"B",
 explain:"Die Baumol'sche Kostenkrankheit beschreibt das Phänomen, dass personalintensive Dienstleistungen (Pflege, Bildung, Kunst) kaum produktiver werden: Eine Pflegefachperson kann nicht doppelt so viele Patienten betreuen wie vor 50 Jahren. Da die Löhne aber mit der Gesamtwirtschaft mitsteigen (sonst würde niemand mehr in der Pflege arbeiten), steigen die Kosten relativ zum BIP."},

{id:"h15", topic:"herausforderungen", type:"open", diff:3, tax:"K5",
 q:"Die Schweizer Krankenversicherungsprämien steigen seit Jahren stärker als die Löhne. Beurteilen Sie zwei mögliche Reformansätze: (a) Umstellung von Kopfprämien auf einkommensabhängige Prämien und (b) Stärkere Einschränkung des Leistungskatalogs.",
 sample:"(a) Einkommensabhängige Prämien würden die Finanzierung solidarischer gestalten und die Belastung für Einkommensschwache direkt reduzieren. Allerdings verliert das System seinen Versicherungscharakter und wird steuerähnlich. Es könnte auch die Eigenverantwortung reduzieren (weniger Kostenbewusstsein). (b) Eine Einschränkung des Leistungskatalogs könnte Kosten senken, birgt aber die Gefahr einer Zwei-Klassen-Medizin: Wer es sich leisten kann, versichert sich privat zusätzlich. Beide Ansätze haben Trade-offs zwischen Effizienz, Solidarität und Qualität der Versorgung.",
 explain:"Die KV-Reform ist eines der komplexesten sozialpolitischen Themen der Schweiz. Jeder Reformansatz berührt den Zielkonflikt zwischen Effizienz, Solidarität und Qualität. In der politischen Praxis scheitern Reformversuche oft an den unterschiedlichen Interessen der Akteure (Versicherer, Ärzte, Patienten, Kantone)."}
];
