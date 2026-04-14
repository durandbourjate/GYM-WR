// Übungspool: Bruttoinlandprodukt (BIP)
// Fachbereich: VWL
// Anzahl Fragen: 81

window.POOL_META = {
  id: "vwl_bip",
  fach: "VWL",
  title: "Übungspool: Bruttoinlandprodukt (BIP)",
  meta: "EWR GYM2 · Gymnasium Hofwil · Individuell üben",
  color: "vwl",
  lernziele: [
    "Ich kann das BIP definieren und von verwandten Grössen (BNE, Volkseinkommen) abgrenzen. (K2)",
    "Ich kann den Wirtschaftskreislauf erklären und die drei Berechnungsansätze des BIP unterscheiden. (K2)",
    "Ich kann nominales und reales BIP unterscheiden und den BIP-Deflator erklären. (K2)",
    "Ich kann die Aussagekraft des BIP als Wohlstandsindikator kritisch beurteilen und alternative Indikatoren nennen. (K5)"
  ]
};

window.TOPICS = {
  definition:{label:"Definition & Grundbegriffe",short:"Definition",lernziele:["Ich kann das BIP definieren (Marktwert aller Endprodukte, in einem Land, in einer Periode). (K1)","Ich kann die Begriffe BIP, BNE und Volkseinkommen voneinander abgrenzen. (K2)"]},
  messprobleme:{label:"Was das BIP (nicht) misst",short:"Messprobleme",lernziele:["Ich kann erklären, welche wirtschaftlichen Aktivitäten im BIP nicht erfasst werden (Hausarbeit, Schwarzarbeit, Umweltschäden). (K2)","Ich kann die Grenzen des BIP als Wohlstandsindikator erläutern und alternative Masse (HDI, BLI, GPI) beschreiben. (K5)"]},
  dreiseiten:{label:"Drei Seiten des BIP",short:"3 Seiten",lernziele:["Ich kann die drei Berechnungsansätze des BIP (Entstehungs-, Verteilungs-, Verwendungsrechnung) erklären. (K2)","Ich kann eine einfache BIP-Berechnung nach dem Verwendungsansatz (C + I + G + NX) durchführen. (K3)"]},
  nomreal:{label:"Nominales & Reales BIP",short:"Nom./Real",lernziele:["Ich kann den Unterschied zwischen nominalem und realem BIP erklären. (K2)","Ich kann das reale BIP mit Hilfe des BIP-Deflators berechnen. (K3)"]},
  kreislauf:{label:"Wirtschaftskreislauf",short:"Kreislauf",lernziele:["Ich kann den einfachen und den erweiterten Wirtschaftskreislauf zeichnen und die Geld- und Güterströme zuordnen. (K3)","Ich kann die Sektoren (Haushalte, Unternehmen, Staat, Ausland, Banken) und ihre Beziehungen beschreiben. (K2)"]},
  verteilung:{label:"Verteilung & Ungleichheit",short:"Verteilung",lernziele:["Ich kann die Einkommensverteilung mit dem Gini-Koeffizienten und der Lorenzkurve beschreiben. (K2)","Ich kann das BIP pro Kopf berechnen und für internationale Vergleiche nutzen (inkl. Kaufkraftparität). (K3)"]},
  wachstum:{label:"Wachstum & Nachhaltigkeit",short:"Wachstum",lernziele:["Ich kann die Wachstumsrate des BIP berechnen und interpretieren. (K3)","Ich kann beurteilen, ob BIP-Wachstum automatisch zu mehr Wohlstand führt. (K5)"]}
};

window.QUESTIONS = [
// ──── DEFINITION & GRUNDBEGRIFFE (d01–d12) ────
{id:"d01",topic:"definition",type:"mc",diff:1,tax:"K1",reviewed:false,
 q:"Was misst das Bruttoinlandprodukt (BIP)?",
 options:[{v: "A",t:"Den Wert aller Exporte eines Landes."},{v: "B",t:"Den Marktwert aller in einem Land während eines Jahres hergestellten Endprodukte."},{v: "C",t:"Die Summe aller in einem Land produzierten Güter inklusive Vorleistungen."},{v: "D",t:"Das Gesamtvermögen aller Einwohner eines Landes."}],
 correct:"B",explain:"Das BIP entspricht dem Marktwert aller Endprodukte (Waren und Dienstleistungen), die in einem Land innerhalb eines Jahres hergestellt werden. Vorleistungen werden abgezogen, um Doppelzählungen zu vermeiden."},

{id:"d02",topic:"definition",type:"tf",diff:1,tax:"K1",reviewed:false,
 q:"Vorleistungen werden beim BIP abgezogen, um Doppelzählungen zu vermeiden.",
 correct:true,explain:"Korrekt. Das BIP misst nur die Wertschöpfung jeder Produktionsstufe. Würde man den gesamten Produktionswert zählen, wäre das BIP künstlich aufgebläht."},

{id:"d03",topic:"definition",type:"fill",diff:1,tax:"K1",reviewed:false,
 q:"Das BIP misst die {0} einer Volkswirtschaft. Dabei werden nur {1} berücksichtigt, nicht Vorleistungen, um {2} zu vermeiden.",
 blanks:[
   {answer:"Wertschöpfung",alts:["Wertschoepfung"]},
   {answer:"Endprodukte",alts:["Endgüter"]},
   {answer:"Doppelzählungen",alts:["Doppelzaehlungen"]}
 ],
 explain:"BIP = Marktwert aller Endprodukte. Endprodukte sind Güter, die nicht weiterverarbeitet, sondern direkt konsumiert oder investiert werden."},

{id:"d04",topic:"definition",type:"mc",diff:1,tax:"K1",reviewed:false,
 q:"Welche vier Produktionsfaktoren unterscheidet man in der VWL?",
 options:[{v: "A",t:"Arbeit, Boden (natürliche Ressourcen), Kapital und Wissen"},{v: "B",t:"Löhne, Zinsen, Mieten und Gewinne"},{v: "C",t:"Geld, Maschinen, Rohstoffe und Energie"},{v: "D",t:"Konsum, Investitionen, Staat und Exporte"}],
 correct:"A",explain:"Die vier Produktionsfaktoren: Arbeit (körperliche/geistige Tätigkeit), Boden (Rohstoffe, Standort, Energie), Kapital (Sach-/Geldkapital, Maschinen), Wissen (Humankapital, Know-how, Patente)."},

{id:"d05",topic:"definition",type:"open",diff:2,tax:"K2",reviewed:false,
 q:"Erklären Sie in eigenen Worten, warum Vorleistungen bei der BIP-Berechnung abgezogen werden. Verwenden Sie ein Beispiel.",
 sample:"Vorleistungen werden abgezogen, um Doppelzählungen zu vermeiden. Beispiel: Bauer verkauft Mehl für CHF 30 an Bäcker, Bäcker verkauft Brot für CHF 100 an Händler, Händler verkauft es für CHF 120. Ohne Abzug: 30+100+120 = CHF 250. Wertschöpfung aber nur: 30+70+20 = CHF 120.",
 explain:"Das BIP misst die Wertschöpfung, nicht den Umsatz. Im Brot-Beispiel: Bauer (30) + Bäcker (100–30=70) + Händler (120–100=20) = BIP von 120 = Endproduktpreis."},

{id:"d06",topic:"definition",type:"calc",diff:2,tax:"K3",reviewed:false,
 q:"Drei Produzenten: Bauer verkauft Weizen für CHF 40 an Müller. Müller verkauft Mehl für CHF 90 an Bäcker. Bäcker verkauft Brot für CHF 150 an Konsumenten. Berechnen Sie:",
 rows:[
   {label:"BIP der Volkswirtschaft",answer:150,tolerance:0,unit:"CHF"},
   {label:"Wertschöpfung des Bäckers",answer:60,tolerance:0,unit:"CHF"}
 ],
 explain:"BIP = Endproduktpreis = CHF 150. Wertschöpfung Bauer: 40, Müller: 90–40=50, Bäcker: 150–90=60. Summe: 40+50+60 = 150 = BIP."},

{id:"d07",topic:"definition",type:"tf",diff:1,tax:"K1",reviewed:false,
 q:"Die Wertschöpfung eines Unternehmens berechnet sich als Produktionswert minus Vorleistungen.",
 correct:true,explain:"Richtig. Wertschöpfung = Verkaufspreis – zugekaufte Vorleistungen = der neu geschaffene Wert auf dieser Produktionsstufe."},

{id:"d08",topic:"definition",type:"sort",diff:1,tax:"K2",reviewed:false,
 q:"Ordnen Sie die Begriffe den korrekten Produktionsfaktoren zu.",
 categories:["Arbeit","Boden / Natürl. Ressourcen","Kapital","Wissen"],
 items:[
   {t:"Lohn einer Verkäuferin",cat:0},{t:"Rohstoffe aus der Erde",cat:1},
   {t:"Maschinen und Anlagen",cat:2},{t:"Patente und Lizenzen",cat:3},
   {t:"Standort / Grundstück",cat:1},{t:"Ausbildung / Know-how",cat:3},
   {t:"Geldkapital für Investitionen",cat:2},{t:"Körperliche Arbeitskraft",cat:0}
 ],
 explain:"Arbeit = körperliche/geistige Tätigkeit. Boden = Standort, Rohstoffe. Kapital = Sach- und Geldkapital. Wissen = Humankapital, Patente, Know-how."},

{id:"d09",topic:"definition",type:"mc",diff:2,tax:"K2",reviewed:false,
 q:"Was ist der Unterschied zwischen Wohlstand und Wohlfahrt?",
 options:[{v: "A",t:"Wohlstand = materielle Güterversorgung (BIP pro Kopf), Wohlfahrt = zusätzlich Gesundheit, Bildung, Umwelt etc."},{v: "B",t:"Wohlstand berücksichtigt die Umwelt, Wohlfahrt nicht."},{v: "C",t:"Wohlfahrt misst nur die staatlichen Sozialleistungen."},{v: "D",t:"Wohlstand und Wohlfahrt sind Synonyme für das BIP."}],
 correct:"A",explain:"Wohlstand = materieller Lebensstandard (BIP pro Kopf). Wohlfahrt = umfassenderes Wohlergehen inkl. Gesundheit, Bildung, Freizeit, Umwelt, soziale Sicherheit. Das BIP misst Wohlstand, aber nicht Wohlfahrt."},

{id:"d10",topic:"definition",type:"tf",diff:2,tax:"K2",reviewed:false,
 q:"Das BIP pro Kopf ist ein geeignetes Mass für die Lebensqualität einer Bevölkerung.",
 correct:false,explain:"Falsch. Das BIP pro Kopf misst den materiellen Wohlstand, nicht die Lebensqualität. Es ignoriert Umweltschäden, Einkommensverteilung, Gesundheit, Bildung und Freizeit. Mehr Autounfälle erhöhen z.B. das BIP, senken aber die Lebensqualität."},


{id:"d11",topic:"definition",type:"multi",diff:2,tax:"K2",reviewed:false,
 q:"Welche der folgenden Güter sind Endprodukte (und gehen ins BIP ein)?",
 options:[
   {v:"A",t:"Ein von einer Familie gekauftes Auto"},
   {v:"B",t:"Stahl, den ein Autohersteller zur Produktion einkauft"},
   {v:"C",t:"Ein Computer, den eine Firma für das Büro kauft (Investition)"},
   {v:"D",t:"Mehl, das eine Bäckerei für die Brotproduktion kauft"}
 ],
 correct:["A","C"],
 explain:"Endprodukte = Güter, die nicht weiterverarbeitet werden. Das Familienauto (Konsum) und der Bürocomputer (Investition) sind Endprodukte. Stahl und Mehl sind Vorleistungen, weil sie weiterverarbeitet werden."},

{id:"d12",topic:"definition",type:"mc",diff:3,tax:"K4",reviewed:false,
 q:"Ein Möbelhersteller kauft Holz für CHF 500 und Schrauben für CHF 20. Er produziert einen Tisch, den er für CHF 1\u2019200 an einen Händler verkauft. Der Händler verkauft den Tisch für CHF 1\u2019500 an einen Konsumenten. Welche Aussage ist korrekt?",
 options:[{v:"A",t:"Der BIP-Beitrag dieser Wertschöpfungskette beträgt CHF 1\u2019500."},{v:"B",t:"Der BIP-Beitrag beträgt CHF 3\u2019220 (Summe aller Transaktionen)."},{v:"C",t:"Die Wertschöpfung des Händlers beträgt CHF 1\u2019500."},{v:"D",t:"Die Wertschöpfung des Möbelherstellers beträgt CHF 1\u2019200."}],
 correct:"A",explain:"BIP = Endproduktpreis = CHF 1\u2019500. Wertschöpfung: Zulieferer = 520, Möbelhersteller = 1\u2019200 – 520 = 680, Händler = 1\u2019500 – 1\u2019200 = 300. Summe: 520 + 680 + 300 = 1\u2019500. Antwort D ist falsch, weil 1\u2019200 der Produktionswert, nicht die Wertschöpfung ist."},

// ──── MESSPROBLEME (m01–m12) ────
{id:"m01",topic:"messprobleme",type:"mc",diff:1,tax:"K1",reviewed:false,
 q:"Welche Leistung wird im BIP NICHT erfasst?",
 options:[{v: "A",t:"Dienstleistungen eines Coiffeurs"},{v: "B",t:"Die Produktion eines Automobilherstellers"},{v: "C",t:"Hausarbeit und Eigenleistungen (z.B. selber kochen)"},{v: "D",t:"Staatliche Leistungen wie Polizei und Schulen"}],
 correct:"C",explain:"Hausarbeit, Eigenleistungen und DIY werden nicht erfasst, da kein Marktpreis existiert. Wenn eine Familie die Kinderbetreuung in eine Krippe auslagert, steigt das BIP – obwohl die Leistung gleich bleibt."},

{id:"m02",topic:"messprobleme",type:"tf",diff:1,tax:"K2",reviewed:false,
 q:"Wenn ein Jahrhunderthochwasser Milliardenschäden verursacht, sinkt das BIP.",
 correct:false,explain:"Falsch – das BIP steigt sogar! Die Wiederaufbauarbeiten werden als Wertschöpfung erfasst. Die Zerstörung selbst wird nicht als negative Position verbucht. Das zeigt eine wichtige Schwäche des BIP."},

{id:"m03",topic:"messprobleme",type:"mc",diff:2,tax:"K2",reviewed:false,
 q:"Warum ist die Bewertung staatlicher Leistungen im BIP problematisch?",
 options:[{v: "A",t:"Staatliche Leistungen werden zu ihren Kosten bewertet – eine Lohnerhöhung für Beamte erhöht das BIP, ohne dass die Leistung besser wird."},{v: "B",t:"Staatliche Leistungen werden doppelt gezählt."},{v: "C",t:"Staatliche Leistungen werden gar nicht erfasst."},{v: "D",t:"Der Staat produziert keine Güter."}],
 correct:"A",explain:"Da Staatsleistungen nicht am Markt verkauft werden, fehlt ein Marktpreis. Sie werden zu ihren Kosten (v.a. Löhne) bewertet. Eine Lohnerhöhung erhöht das BIP, ohne Leistungsverbesserung."},

{id:"m04",topic:"messprobleme",type:"tf",diff:2,tax:"K2",reviewed:false,
 q:"Seit 2014 werden in der Schweiz auch Schätzungen zu Drogenhandel und Prostitution ins BIP eingerechnet.",
 correct:true,explain:"Richtig. Seit September 2014 werden gemäss einer europäischen Richtlinie illegale Aktivitäten wie Drogenhandel und Prostitution geschätzt und im BIP erfasst (Statistik-Revision)."},

{id:"m05",topic:"messprobleme",type:"sort",diff:2,tax:"K2",reviewed:false,
 q:"Ordnen Sie zu: Wird die Aktivität im BIP erfasst oder nicht?",
 categories:["Im BIP erfasst","NICHT im BIP erfasst"],
 items:[
   {t:"Putzfrau offiziell angestellt",cat:0},{t:"Selber die Wohnung putzen",cat:1},
   {t:"Kind in Krippe betreuen lassen",cat:0},{t:"Kind zu Hause selber betreuen",cat:1},
   {t:"Schwarzarbeit (nicht angemeldet)",cat:1},{t:"Kalbsbraten im Restaurant",cat:0},
   {t:"Kalbsbraten selber kochen",cat:1},{t:"Reparatur durch eine Garage",cat:0}
 ],
 explain:"Die VGR erfasst nur monetäre Markttransaktionen. Eigenleistungen und Schwarzarbeit fehlen. Dieselbe Leistung wird erfasst, sobald sie über den Markt abgewickelt wird."},

{id:"m06",topic:"messprobleme",type:"open",diff:3,tax:"K4",reviewed:false,
 q:"Ein Nationalrat beschäftigte eine Putzfrau schwarz. Nachdem der Fall publik wurde, stieg die Zahl der offiziellen Anmeldungen von Haushaltshilfen stark. Analysieren Sie die Auswirkung auf das BIP.",
 sample:"Das BIP steigt, obwohl sich die tatsächliche Wirtschaftsleistung nicht verändert. Die Putzarbeiten wurden vorher als Schwarzarbeit geleistet und nicht erfasst. Durch die offizielle Anmeldung werden dieselben Leistungen nun registriert – das BIP bildet einen höheren Wert ab, nur weil bisher nicht erfasste Leistungen sichtbar werden.",
 explain:"Schwarzarbeit (geschätzt ca. 7% des BIP in der Schweiz) wird nicht vollständig erfasst. Eine Legalisierung erhöht das gemessene BIP, ohne die tatsächliche Wirtschaftsleistung zu verändern."},

{id:"m07",topic:"messprobleme",type:"mc",diff:2,tax:"K2",reviewed:false,
 q:"Welche Herausforderung stellt die Digitalisierung für die BIP-Messung dar?",
 options:[{v: "A",t:"Digitale Güter sind zu günstig."},{v: "B",t:"Die Digitalisierung hat keinen Einfluss auf das BIP."},{v: "C",t:"Digitale Werte wie Daten und kostenlose Online-Dienste haben keinen klassischen Marktpreis."},{v: "D",t:"Digitale Produkte werden doppelt gezählt."}],
 correct:"C",explain:"Kostenlose Online-Dienste (soziale Medien, Wikipedia) generieren Nutzen, erscheinen aber nicht im BIP. Zudem lässt sich die Wertschöpfung oft nicht klar einem Land zuordnen."},

{id:"m08",topic:"messprobleme",type:"tf",diff:1,tax:"K1",reviewed:false,
 q:"Umweltschäden durch die Produktion werden im BIP als negative Position verbucht.",
 correct:false,explain:"Falsch. Umweltschäden werden nicht abgezogen. Die Beseitigung von Umweltschäden wird sogar als positive Wertschöpfung gezählt. Das BIP erfasst externe Kosten nicht."},

{id:"m09",topic:"messprobleme",type:"open",diff:3,tax:"K5",reviewed:false,
 q:"Beurteilen Sie: «Das BIP ist trotz aller Schwächen das beste Mass für den Wohlstand.»",
 sample:"Pro: International standardisiert, objektiv messbar, ermöglicht Vergleiche. Contra: Ignoriert Eigenleistungen, Schwarzarbeit, Umweltschäden, Verteilung, Lebensqualität. Alternative Indikatoren (HDI, Happy Planet Index) versuchen Lücken zu schliessen, sind aber weniger standardisiert. Fazit: Nützlicher, aber unvollständiger Indikator – sollte mit anderen Kennzahlen ergänzt werden.",
 explain:"Diese K5-Frage erfordert eine differenzierte Beurteilung mit Pro und Contra. Das BIP hat klare Stärken (Vergleichbarkeit) und Schwächen (fehlende Erfassung vieler wohlstandsrelevanter Aspekte)."},

{id:"m10",topic:"messprobleme",type:"fill",diff:1,tax:"K1",reviewed:false,
 q:"Die VGR erfasst nur {0} Flüsse. Deshalb fehlen im BIP z.B. {1} und Eigenleistungen. Zudem werden {2} nicht als Kosten abgezogen.",
 blanks:[
   {answer:"monetäre",alts:["monetaere","geldmässige"]},
   {answer:"Schwarzarbeit",alts:["Schattenwirtschaft"]},
   {answer:"Umweltschäden",alts:["Umweltschaeden","externe Kosten"]}
 ],
 explain:"Drei Hauptkritikpunkte: (1) Nicht erfasste Leistungen (Eigenarbeit, Schwarzarbeit), (2) Nicht erfasste Schäden (Umwelt), (3) Problematische Bewertung (Staatsleistungen zu Kosten)."},


{id:"m11",topic:"messprobleme",type:"multi",diff:2,tax:"K2",reviewed:false,
 q:"Welche der folgenden Faktoren werden vom BIP NICHT oder nur unzureichend erfasst?",
 options:[
   {v:"A",t:"Ehrenamtliche Arbeit (z.B. Freiwilligenarbeit im Sportverein)"},
   {v:"B",t:"Die Produktion von Medikamenten durch Novartis"},
   {v:"C",t:"Umweltzerstörung durch eine Chemiefabrik"},
   {v:"D",t:"Der Nutzen kostenloser Apps wie Wikipedia oder Google Maps"}
 ],
 correct:["A","C","D"],
 explain:"Ehrenamtliche Arbeit hat keinen Marktpreis (fehlt). Umweltschäden werden nicht als Kosten erfasst (Schwäche). Kostenlose digitale Dienste generieren Nutzen ohne Marktpreis (fehlt). Nur die Medikamentenproduktion (B) wird über den Marktpreis korrekt erfasst."},

{id:"m12",topic:"messprobleme",type:"mc",diff:1,tax:"K1",reviewed:false,
 q:"Der Human Development Index (HDI) ergänzt das BIP um welche Dimensionen?",
 options:[{v:"A",t:"Gesundheit (Lebenserwartung) und Bildung (Schuljahre)"},{v:"B",t:"Umweltqualität und CO\u2082-Emissionen"},{v:"C",t:"Militärausgaben und Sicherheit"},{v:"D",t:"Exportquote und Handelsbilanz"}],
 correct:"A",explain:"Der HDI (UNDP) kombiniert drei Dimensionen: (1) Gesundheit (Lebenserwartung), (2) Bildung (erwartete und durchschnittliche Schuljahre), (3) Lebensstandard (BNE pro Kopf in PPP). Er ist ein häufig verwendetes Mass, das über das reine BIP hinausgeht."},

// ──── DREI SEITEN DES BIP (s01–s10) ────
{id:"s01",topic:"dreiseiten",type:"mc",diff:1,tax:"K1",reviewed:false,
 q:"Das BIP kann auf drei Arten berechnet werden. Welche?",
 options:[{v: "A",t:"Konsumansatz, Sparansatz und Investitionsansatz"},{v: "B",t:"Brutto-, Netto- und Realansatz"},{v: "C",t:"Exportansatz, Importansatz und Binnenmarktansatz"},{v: "D",t:"Produktionsansatz, Einkommensansatz und Verwendungsansatz"}],
 correct:"D",explain:"(1) Produktionsansatz = Summe aller Wertschöpfungen, (2) Einkommensansatz = Summe aller Einkommen, (3) Verwendungsansatz = C + I + G + NX. Alle drei ergeben denselben Wert."},

{id:"s02",topic:"dreiseiten",type:"fill",diff:1,tax:"K1",reviewed:false,
 q:"Beim {0} wird das BIP als Summe aller Wertschöpfungen berechnet. Beim {1} zählt man alle Einkommen zusammen. Beim {2} betrachtet man, wofür die Güter verwendet werden.",
 blanks:[
   {answer:"Produktionsansatz",alts:["Produktions-Ansatz"]},
   {answer:"Einkommensansatz",alts:["Einkommens-Ansatz"]},
   {answer:"Verwendungsansatz",alts:["Verwendungs-Ansatz"]}
 ],
 explain:"Die drei Ansätze sind gleichwertige Methoden. Produktionsansatz: Wertschöpfung aller Unternehmen. Einkommensansatz: Alle Faktoreinkommen. Verwendungsansatz: C + I + G + NX."},

{id:"s03",topic:"dreiseiten",type:"mc",diff:2,tax:"K2",reviewed:false,
 q:"BIP = C + I + G + (X – M). Was bedeuten die Variablen?",
 options:[{v: "A",t:"C = privater Konsum, I = Investitionen, G = Staatsausgaben, X = Exporte, M = Importe"},{v: "B",t:"C = Kosten, I = Investitionen, G = Grundstücke, X = Extra, M = Mehrwert"},{v: "C",t:"C = Konsum, I = Zinsen, G = Geld, X = Exporte, M = Maschinen"},{v: "D",t:"C = Kapital, I = Importe, G = Gewinne, X = Exporte, M = Mieten"}],
 correct:"A",explain:"BIP nach Verwendungsansatz: C = privater Konsum (Haushalte), I = Bruttoinvestitionen, G = Staatskonsum (Government), X–M = Nettoexporte. In der Schweiz macht der private Konsum den grössten Anteil aus."},

{id:"s04",topic:"dreiseiten",type:"sort",diff:2,tax:"K2",reviewed:false,
 q:"Ordnen Sie die Beispiele dem korrekten BIP-Berechnungsansatz zu.",
 categories:["Produktionsansatz","Einkommensansatz","Verwendungsansatz"],
 items:[
   {t:"Summe aller Löhne und Gewinne",cat:1},{t:"Wertschöpfung aller Unternehmen",cat:0},
   {t:"C + I + G + NX",cat:2},{t:"Produktionswert minus Vorleistungen",cat:0},
   {t:"Export von Uhren ins Ausland",cat:2},{t:"Lohn einer Lehrerin",cat:1}
 ],
 explain:"Produktionsansatz: Wertschöpfung. Einkommensansatz: Alle Einkommen. Verwendungsansatz: Wofür das BIP ausgegeben wird (C+I+G+NX). Uhrenexport = Nettoexport, Lehrerlohn = Einkommen."},

{id:"s05",topic:"dreiseiten",type:"tf",diff:2,tax:"K2",reviewed:false,
 q:"Der Produktionsansatz und der Einkommensansatz müssen immer denselben Wert ergeben.",
 correct:true,explain:"Richtig. Die drei Ansätze betrachten denselben Sachverhalt aus drei Perspektiven: Was produziert wird, fliesst als Einkommen zu und wird verwendet. Alle drei = gleiches BIP."},

{id:"s06",topic:"dreiseiten",type:"calc",diff:2,tax:"K3",reviewed:false,
 q:"Berechnen Sie das BIP (Verwendungsansatz): Privater Konsum = 400 Mrd., Investitionen = 150 Mrd., Staatsausgaben = 100 Mrd., Exporte = 250 Mrd., Importe = 200 Mrd.",
 rows:[
   {label:"Nettoexporte (X – M)",answer:50,tolerance:0,unit:"Mrd."},
   {label:"BIP (C + I + G + NX)",answer:700,tolerance:0,unit:"Mrd."}
 ],
 explain:"NX = 250–200 = 50 Mrd. BIP = 400+150+100+50 = 700 Mrd."},

{id:"s07",topic:"dreiseiten",type:"open",diff:2,tax:"K2",reviewed:false,
 q:"Erklären Sie, warum die drei Berechnungsarten des BIP zum selben Ergebnis führen müssen.",
 sample:"Jedes produzierte Gut wird konsumiert, investiert, vom Staat gekauft oder exportiert (Verwendung). Die Einnahmen fliessen als Löhne, Gewinne, Zinsen, Mieten an die Produktionsfaktoren (Einkommen). Die Wertschöpfung bei der Herstellung entspricht dem Endproduktwert (Produktion). Es ist derselbe Geldfluss aus drei Blickwinkeln.",
 explain:"Der Kreislaufgedanke: Was produziert wird = was als Einkommen verteilt wird = was verwendet wird. Drei Perspektiven auf denselben ökonomischen Vorgang."},

{id:"s08",topic:"dreiseiten",type:"multi",diff:2,tax:"K2",reviewed:false,
 q:"Welche der folgenden Posten gehören zur BIP-Berechnung nach dem Verwendungsansatz (C + I + G + NX)?",
 options:[
   {v:"A",t:"Kauf eines neuen Autos durch eine Familie (Konsum)"},
   {v:"B",t:"Wertschöpfung einer Schreinerei"},
   {v:"C",t:"Bau einer neuen Fabrikhalle (Investition)"},
   {v:"D",t:"Lohnzahlung an einen Bankangestellten"}
 ],
 correct:["A","C"],
 explain:"Verwendungsansatz = C + I + G + NX. Autokauf (C = Konsum) und Fabrikbau (I = Investition) gehören dazu. Die Wertschöpfung (B) gehört zum Produktionsansatz, die Lohnzahlung (D) zum Einkommensansatz."},

{id:"s09",topic:"dreiseiten",type:"mc",diff:3,tax:"K4",reviewed:false,
 q:"In einer kleinen Volkswirtschaft produziert ein Unternehmen Güter im Wert von CHF 500. Die Löhne betragen CHF 300, Gewinne CHF 200. Die Haushalte konsumieren CHF 400 und importieren CHF 100 aus dem Ausland. Der Staat gibt CHF 100 aus, Investitionen betragen CHF 100. Es gibt keine Exporte. Was stimmt?",
 options:[{v: "A",t:"Der Einkommensansatz ergibt CHF 600."},{v: "B",t:"Die Importe erhöhen das BIP."},{v: "C",t:"Das BIP nach Verwendungsansatz ist höher als nach Produktionsansatz."},{v: "D",t:"Alle drei Ansätze ergeben CHF 500 – die Rechnung geht auf."}],
 correct:"D",explain:"Produktion: Wertschöpfung = 500. Einkommen: 300 + 200 = 500. Verwendung: C(400) + I(100) + G(100) + NX(0–100) = 500. Importe werden abgezogen, weil sie zwar konsumiert, aber nicht im Inland produziert wurden."},

{id:"s10",topic:"dreiseiten",type:"tf",diff:3,tax:"K4",reviewed:false,
 q:"Wenn die Schweiz mehr importiert als exportiert, ist der Beitrag der Nettoexporte zum BIP negativ – das BIP sinkt dadurch zwingend.",
 correct:false,explain:"Falsch. Negative Nettoexporte (NX < 0) bedeuten nur, dass dieser Teilposten negativ ist. Das BIP kann trotzdem steigen, wenn Konsum, Investitionen oder Staatsausgaben stärker wachsen. NX ist nur eine von vier Komponenten."},

// ──── NOMINALES & REALES BIP (n01–n09) ────
{id:"n01",topic:"nomreal",type:"mc",diff:1,tax:"K1",reviewed:false,
 q:"Was unterscheidet das nominale vom realen BIP?",
 options:[{v: "A",t:"Das nominale BIP berücksichtigt die Inflation, das reale nicht."},{v: "B",t:"Es gibt keinen Unterschied."},{v: "C",t:"Nominal = aktuelle Preise, real = konstante Preise eines Basisjahres (inflationsbereinigt)."},{v: "D",t:"Das reale BIP wird nur für die Schweiz berechnet."}],
 correct:"C",explain:"Nominales BIP = Produktion zu aktuellen Marktpreisen (enthält Preisveränderungen). Reales BIP = Produktion zu konstanten Preisen eines Basisjahres. Nur das reale BIP zeigt die tatsächliche Mengenveränderung."},

{id:"n02",topic:"nomreal",type:"tf",diff:1,tax:"K2",reviewed:false,
 q:"Wenn das nominale BIP steigt, bedeutet das immer, dass die Wirtschaft gewachsen ist.",
 correct:false,explain:"Falsch. Ein Anstieg des nominalen BIP kann nur auf Inflation zurückzuführen sein. Nur ein Anstieg des realen BIP zeigt echtes Wirtschaftswachstum."},

{id:"n03",topic:"nomreal",type:"calc",diff:2,tax:"K3",reviewed:false,
 q:"Nominales BIP 2023 = CHF 800 Mrd., Preisindex = 105 (Basis 2020 = 100). Berechnen Sie:",
 rows:[
   {label:"Reales BIP (zu Preisen von 2020)",answer:761.9,tolerance:0.5,unit:"Mrd. CHF"},
   {label:"Inflationsrate seit 2020",answer:5,tolerance:0,unit:"%"}
 ],
 explain:"Reales BIP = Nominales BIP / Preisindex × 100 = 800/105×100 = 761.9 Mrd. Inflation = 105–100 = 5%."},

{id:"n04",topic:"nomreal",type:"mc",diff:2,tax:"K2",reviewed:false,
 q:"Warum verwendet man bei internationalen BIP-Vergleichen Kaufkraftparitäten (PPP)?",
 options:[{v: "A",t:"Weil die UNO PPP vorschreibt."},{v: "B",t:"Weil PPP einfacher zu berechnen sind."},{v: "C",t:"Weil das BIP in PPP immer höher ist."},{v: "D",t:"Weil Wechselkurse schwanken und man in verschiedenen Ländern für denselben Betrag unterschiedlich viel kaufen kann."}],
 correct:"D",explain:"Wechselkurse spiegeln nicht die tatsächliche Kaufkraft wider. Mit CHF 10 kauft man in der Schweiz weniger als mit dem Gegenwert in Thailand. PPP berücksichtigt die Preisniveauunterschiede."},

{id:"n05",topic:"nomreal",type:"fill",diff:1,tax:"K1",reviewed:false,
 q:"Für zeitliche Vergleiche verwendet man das {0} BIP, das die {1} herausrechnet. Für internationale Vergleiche rechnet man in {2} um.",
 blanks:[
   {answer:"reale",alts:["reales"]},
   {answer:"Inflation",alts:["Teuerung","Preissteigerung"]},
   {answer:"Kaufkraftparitäten",alts:["PPP","Kaufkraftparität","KKP"]}
 ],
 explain:"Reales BIP = inflationsbereinigt (zeitliche Vergleiche). Kaufkraftparitäten (PPP) = berücksichtigen Preisniveauunterschiede (internationale Vergleiche)."},

{id:"n06",topic:"nomreal",type:"tf",diff:2,tax:"K2",reviewed:false,
 q:"Beim BIP-Vergleich mit Kaufkraftparitäten (PPP) rutscht die Schweiz in der Rangliste tendenziell nach unten.",
 correct:true,explain:"Richtig. Die Schweiz hat ein sehr hohes Preisniveau. Bei PPP-Bereinigung wird berücksichtigt, dass man in der Schweiz für denselben Betrag weniger kaufen kann. Länder mit tiefem Preisniveau (z.B. China) steigen entsprechend auf."},

{id:"n07",topic:"nomreal",type:"calc",diff:3,tax:"K3",reviewed:false,
 q:"Land A: nominales BIP/Kopf = USD 60'000, PPP-Faktor = 0.85. Land B: BIP/Kopf = USD 25'000, PPP-Faktor = 1.6. Berechnen Sie das BIP/Kopf in PPP.",
 rows:[
   {label:"Land A: BIP/Kopf in PPP",answer:51000,tolerance:100,unit:"USD"},
   {label:"Land B: BIP/Kopf in PPP",answer:40000,tolerance:100,unit:"USD"}
 ],
 explain:"Land A: 60'000 × 0.85 = 51'000 USD (sinkt wegen hohem Preisniveau). Land B: 25'000 × 1.6 = 40'000 USD (steigt wegen tiefem Preisniveau). Unterschied schrumpft von 35'000 auf 11'000."},


{id:"n08",topic:"nomreal",type:"multi",diff:2,tax:"K2",reviewed:false,
 q:"Welche der folgenden Aussagen zum nominalen und realen BIP sind korrekt?",
 options:[
   {v:"A",t:"Das reale BIP ist besser geeignet, um echtes Wirtschaftswachstum zu messen."},
   {v:"B",t:"Bei Deflation ist das nominale BIP höher als das reale BIP."},
   {v:"C",t:"Nominales und reales BIP sind im Basisjahr identisch."},
   {v:"D",t:"Das reale BIP kann nie höher sein als das nominale BIP."}
 ],
 correct:["A","C"],
 explain:"A ist korrekt: Nur das reale BIP zeigt die Mengenentwicklung. C ist korrekt: Im Basisjahr ist der Preisindex = 100, daher sind nominal und real gleich. B ist falsch: Bei Deflation (Preise sinken) ist das reale BIP höher als das nominale. D ist falsch: Bei Deflation (Preisindex < 100) ist das reale BIP grösser."},

{id:"n09",topic:"nomreal",type:"tf",diff:2,tax:"K2",reviewed:false,
 q:"Kaufkraftparitäten (PPP) korrigieren für Wechselkursschwankungen, nicht für Preisunterschiede zwischen Ländern.",
 correct:false,explain:"Falsch. PPP korrigieren gerade für Preisunterschiede zwischen Ländern. In einem Hochpreisland (z.B. Schweiz) kann man für denselben USD-Betrag weniger kaufen als in einem Niedrigpreisland (z.B. Indien). PPP rechnen auf gleiche Kaufkraft um."},

// ──── WIRTSCHAFTSKREISLAUF (k01–k11) ────
{id:"k01",topic:"kreislauf",type:"mc",diff:1,tax:"K1",reviewed:false,
 q:"Welche zwei Akteure stehen im Zentrum des einfachen Wirtschaftskreislaufs?",
 options:[{v: "A",t:"Staat und Ausland"},{v: "B",t:"Arbeitnehmer und Arbeitgeber"},{v: "C",t:"Banken und Versicherungen"},{v: "D",t:"Haushalte und Unternehmen"}],
 correct:"D",explain:"Der einfache Wirtschaftskreislauf: Haushalte bieten Produktionsfaktoren an und fragen Güter nach. Unternehmen produzieren Güter und fragen Produktionsfaktoren nach."},

{id:"k02",topic:"kreislauf",type:"sort",diff:1,tax:"K2",reviewed:false,
 q:"Ordnen Sie die Ströme im einfachen Wirtschaftskreislauf zu.",
 categories:["Haushalte \u2192 Unternehmen","Unternehmen \u2192 Haushalte"],
 items:[
   {t:"Arbeitskraft (Produktionsfaktor)",cat:0},{t:"Lohnzahlung",cat:1},
   {t:"Bezahlung für Güter",cat:0},{t:"Güter und Dienstleistungen",cat:1},
   {t:"Kapital (Produktionsfaktor)",cat:0},{t:"Zinszahlung",cat:1}
 ],
 explain:"Haushalte → Unternehmen: Produktionsfaktoren (Arbeit, Kapital) + Geld für Güter. Unternehmen → Haushalte: Güter + Faktorentgelte (Löhne, Zinsen)."},

{id:"k03",topic:"kreislauf",type:"mc",diff:2,tax:"K1",reviewed:false,
 q:"Welche zusätzlichen Akteure kommen im erweiterten Wirtschaftskreislauf hinzu?",
 options:[{v: "A",t:"Nur der Staat"},{v: "B",t:"Börse und Nationalbank"},{v: "C",t:"Gewerkschaften und Verbände"},{v: "D",t:"Staat, Ausland und Banken"}],
 correct:"D",explain:"Erweiterter Kreislauf: + Staat (Steuern, Güter, Transfers), + Ausland (Exporte/Importe), + Banken (Ersparnisse, Kredite)."},

{id:"k04",topic:"kreislauf",type:"tf",diff:1,tax:"K1",reviewed:false,
 q:"Im Wirtschaftskreislauf steht jedem Geldstrom ein Güterstrom (oder Faktorstrom) gegenüber.",
 correct:true,explain:"Richtig. Der Kreislauf besteht aus realen Strömen (Güter, Faktoren) und monetären Strömen (Geld), die in entgegengesetzter Richtung fliessen."},

{id:"k05",topic:"kreislauf",type:"fill",diff:2,tax:"K1",reviewed:false,
 q:"Im erweiterten Kreislauf finanziert sich der Staat über {0}. Er verwendet diese für den Kauf von {1} und für {2} an die Haushalte.",
 blanks:[
   {answer:"Steuern",alts:["Steuereinnahmen"]},
   {answer:"Gütern",alts:["Güter","Waren und Dienstleistungen"]},
   {answer:"Transfers",alts:["Transferzahlungen","Sozialleistungen"]}
 ],
 explain:"Staat: Einnahmen = Steuern. Ausgaben = Güterkäufe + Löhne an Staatsangestellte + Transfers (z.B. AHV-Renten, Sozialhilfe – Leistungen ohne direkte Gegenleistung)."},

{id:"k06",topic:"kreislauf",type:"open",diff:2,tax:"K3",reviewed:false,
 q:"Frau Studer arbeitet als Verkäuferin im Globus (CHF 2'800/Monat) und kauft dort eine Bluse für CHF 70. Beschreiben Sie Güter- und Geldkreislauf.",
 sample:"Faktormarkt: Frau Studer liefert Arbeitskraft an Globus (Güterstrom) \u2192 Globus zahlt CHF 2'800 Lohn (Geldstrom). Gütermarkt: Globus liefert Bluse (Güterstrom) \u2192 Frau Studer zahlt CHF 70 (Geldstrom). Es handelt sich um den einfachen Wirtschaftskreislauf mit zwei Tauschbeziehungen.",
 explain:"Dieses Beispiel illustriert den einfachen Wirtschaftskreislauf: Faktormarkt (Arbeit gegen Lohn) und Gütermarkt (Bluse gegen Geld). Geldströme laufen jeweils entgegengesetzt zu den Güterströmen."},

{id:"k07",topic:"kreislauf",type:"mc",diff:2,tax:"K2",reviewed:false,
 q:"Was versteht man unter einem Transfer im Wirtschaftskreislauf?",
 options:[{v: "A",t:"Den Export von Gütern."},{v: "B",t:"Eine staatliche Leistung ohne direkte Gegenleistung, z.B. AHV-Renten oder Sozialhilfe."},{v: "C",t:"Die Überweisung von Geld ins Ausland."},{v: "D",t:"Eine Steuerzahlung an den Staat."}],
 correct:"B",explain:"Transfers = Zahlungen des Staates an Haushalte ohne Gegenleistung (anders als Löhne). Beispiele: AHV, IV, Sozialhilfe, Kinderzulagen, Stipendien."},

{id:"k08",topic:"kreislauf",type:"tf",diff:2,tax:"K2",reviewed:false,
 q:"Im erweiterten Kreislauf fliessen Zahlungen für Importe von den Haushalten ans Ausland.",
 correct:true,explain:"Richtig. Schweizer Haushalte kaufen ausländische Güter (Importe) \u2192 Geld fliesst ans Ausland. Umgekehrt fliessen Exporteinnahmen vom Ausland an inländische Unternehmen."},

{id:"k09",topic:"kreislauf",type:"multi",diff:2,tax:"K2",reviewed:false,
 q:"Welche der folgenden Ströme fliessen im erweiterten Wirtschaftskreislauf vom Staat an die Haushalte?",
 options:[
   {v:"A",t:"Transferzahlungen (z.B. AHV-Renten, Sozialhilfe)"},
   {v:"B",t:"Löhne an Staatsangestellte"},
   {v:"C",t:"Subventionen an Unternehmen"},
   {v:"D",t:"Steuereinnahmen"}
 ],
 correct:["A","B"],
 explain:"Vom Staat an Haushalte fliessen: Transfers (AHV, Sozialhilfe – ohne Gegenleistung) und Löhne (an Staatsangestellte – als Entgelt für Arbeit). Subventionen (C) fliessen an Unternehmen, Steuern (D) fliessen in die umgekehrte Richtung (Haushalte \u2192 Staat)."},

{id:"k10",topic:"kreislauf",type:"mc",diff:3,tax:"K4",reviewed:false,
 q:"Was passiert im Wirtschaftskreislauf, wenn die Haushalte plötzlich deutlich mehr sparen und weniger konsumieren?",
 options:[{v: "A",t:"Das BIP steigt, weil Sparen eine Investition ist."},{v: "B",t:"Es hat keinen Effekt, da das Geld bei den Banken landet und sofort weitergeleitet wird."},{v: "C",t:"Der Staat gleicht die Lücke automatisch aus."},{v: "D",t:"Die Unternehmen erhalten weniger Einnahmen, produzieren weniger und zahlen tiefere Löhne – ein Abschwung droht."}],
 correct:"D",explain:"Höheres Sparen = weniger Konsum = weniger Nachfrage auf dem Gütermarkt. Die Unternehmen verkaufen weniger, reduzieren Produktion und Beschäftigung. Das Einkommen sinkt (Kreislauf-Effekt). Dieses Phänomen heisst \u00abSparparadoxon\u00bb: Was für den Einzelnen vernünftig ist (sparen), kann gesamtwirtschaftlich schaden."},

{id:"k11",topic:"kreislauf",type:"open",diff:3,tax:"K4",reviewed:false,
 q:"Im Wirtschaftskreislauf spricht man von Sickerströmen (Abflüssen) und Zuflüssen. Erklären Sie, warum Sparen, Steuern und Importe als Sickerströme gelten, und nennen Sie die zugehörigen Zuflüsse.",
 sample:"Sickerströme = Geld, das den Güterkreislauf zwischen Haushalten und Unternehmen verlässt: Sparen (Geld fliesst an Banken statt in Konsum), Steuern (Geld fliesst an den Staat statt in Konsum/Investition), Importe (Geld fliesst ans Ausland statt an inländische Unternehmen). Zuflüsse: Investitionen (Banken \u2192 Unternehmen), Staatsausgaben (Staat \u2192 Unternehmen/Haushalte), Exporte (Ausland \u2192 Unternehmen). Damit der Kreislauf stabil bleibt, müssen Sickerströme \u2248 Zuflüsse sein.",
 explain:"Sickerströme (S + T + M) und Zuflüsse (I + G + X). Im Gleichgewicht gilt: S + T + M = I + G + X. Diese Gleichung ist eine Umformung der Verwendungsgleichung Y = C + I + G + (X\u2013M)."},

// ──── VERTEILUNG & UNGLEICHHEIT (v01–v12) ────
{id:"v01",topic:"verteilung",type:"mc",diff:1,tax:"K1",reviewed:false,
 q:"Was zeigt die Lorenzkurve?",
 options:[{v:"A",t:"Die Verteilung von Einkommen oder Vermögen – je weiter von der 45\u00b0-Linie, desto ungleicher."},{v:"B",t:"Das Wirtschaftswachstum über die Zeit."},{v:"C",t:"Den Zusammenhang zwischen Inflation und Arbeitslosigkeit."},{v:"D",t:"Die Entwicklung des BIP pro Kopf."}],
 correct:"A",explain:"Die Lorenzkurve zeigt die kumulative Verteilung. Die 45\u00b0-Linie = perfekte Gleichverteilung. Je stärker die Kurve abweicht, desto ungleicher die Verteilung."},

{id:"v02",topic:"verteilung",type:"fill",diff:1,tax:"K1",reviewed:false,
 q:"Der {0} misst die Ungleichheit. Er nimmt Werte zwischen {1} (Gleichverteilung) und {2} (maximale Ungleichheit) an.",
 blanks:[
   {answer:"Gini-Koeffizient",alts:["Gini Koeffizient","Ginikoeffizient","Gini"]},
   {answer:"0",alts:["null"]},
   {answer:"1",alts:["eins"]}
 ],
 explain:"Gini = Fläche zwischen 45\u00b0-Linie und Lorenzkurve / Gesamtdreiecksfläche. 0 = alle haben gleich viel, 1 = eine Person hat alles."},

{id:"v03",topic:"verteilung",type:"mc",diff:2,tax:"K2",reviewed:false,
 q:"Der Gini-Koeffizient beträgt in der Schweiz ca. 0.29 und in den USA ca. 0.37. Was bedeutet das?",
 options:[{v: "A",t:"In der Schweiz gibt es mehr Milliardäre."},{v: "B",t:"Die Schweiz ist reicher als die USA."},{v: "C",t:"Die USA haben ein höheres BIP pro Kopf."},{v: "D",t:"Die Einkommensungleichheit ist in den USA deutlich grösser als in der Schweiz."}],
 correct:"D",explain:"Höherer Gini = grössere Ungleichheit. Schweiz 0.29 (relativ gleichmässig), USA 0.37 (deutlich ungleicher). Durch Umverteilung sinkt der Gini in der Schweiz von ca. 0.34 (Primäreinkommen) auf 0.29 (verfügbares Einkommen)."},

{id:"v04",topic:"verteilung",type:"mc",diff:2,tax:"K2",reviewed:false,
 q:"Was versteht Branko Milanovic unter \u00abguter\u00bb und \u00abschlechter\u00bb Ungleichheit?",
 options:[{v: "A",t:"Gute Ungleichheit betrifft nur Vermögen, schlechte nur Einkommen."},{v: "B",t:"Gute Ungleichheit gibt es nur in reichen Ländern."},{v: "C",t:"Jede Form von Ungleichheit ist schlecht."},{v: "D",t:"Gute Ungleichheit schafft Leistungsanreize. Schlechte Ungleichheit zementiert Privilegien und verhindert Chancengleichheit."}],
 correct:"D",explain:"Nach Milanovic: \u00abGute\u00bb Ungleichheit ist leistungsbezogen (Anreize, Wachstum). \u00abSchlechte\u00bb entsteht durch Rent-Seeking (politischen Einfluss zum Machterhalt) oder fehlenden Bildungszugang für Arme."},

{id:"v05",topic:"verteilung",type:"tf",diff:2,tax:"K2",reviewed:false,
 q:"Gemäss aktueller Forschung ist Frühförderung das effizienteste Mittel gegen Ungleichheit.",
 correct:true,explain:"Richtig. Nobelpreisträger Heckman zeigt: ca. 50% der Einkommensunterschiede werden vor dem 18. Lebensjahr geprägt. Frühförderung ist effektiver als spätere Umverteilung, da sie an der Wurzel ansetzt."},

{id:"v06",topic:"verteilung",type:"sort",diff:2,tax:"K2",reviewed:false,
 q:"Ordnen Sie zu: Umverteilung (Symptombekämpfung) oder Ursachenbekämpfung?",
 categories:["Umverteilung","Ursachenbekämpfung"],
 items:[
   {t:"Progressive Besteuerung",cat:0},{t:"Frühförderung für bildungsferne Familien",cat:1},
   {t:"Sozialhilfe und Transfers",cat:0},{t:"Kostenloser Zugang zu Bildung",cat:1},
   {t:"AHV-Renten",cat:0},{t:"Stipendien für talentierte Kinder",cat:1}
 ],
 explain:"Umverteilung (Steuern, Transfers) wirkt schnell, kann aber Anreize verringern. Ursachenbekämpfung (Bildung, Frühförderung) setzt bei den Wurzeln an und fördert gleichzeitig das Humankapital."},

{id:"v07",topic:"verteilung",type:"tf",diff:1,tax:"K1",reviewed:false,
 q:"Die Vermögensverteilung in der Schweiz ist deutlich ungleicher als die Einkommensverteilung.",
 correct:true,explain:"Richtig. Die Lorenzkurve für Vermögen weicht viel stärker ab als für Einkommen. Im Kanton Bern z.B. besitzen ca. 209'000 Personen gar kein Vermögen, während 770 Personen rund 20% des Gesamtvermögens besitzen."},

{id:"v08",topic:"verteilung",type:"open",diff:3,tax:"K5",reviewed:false,
 q:"\u00abMehr Gleichheit bedeutet automatisch weniger Wirtschaftswachstum.\u00bb Nehmen Sie kritisch Stellung.",
 sample:"Zu vereinfacht. Moderate Ungleichheit kann wachstumsfördernd sein (Anreize), aber zu hohe Ungleichheit schadet: mangelnde Bildungschancen, soziale Instabilität, Polarisierung. Entscheidend ist die Art: Leistungsbezogene Ungleichheit motiviert, privilegienbasierte hemmt. Kluge Politik (Frühförderung statt nur Umverteilung) kann Gleichheit und Wachstum gleichzeitig fördern.",
 explain:"Die Forschung zeigt: Die Beziehung ist nicht linear. Der Schlüssel liegt in der Unterscheidung zwischen \u00abguter\u00bb und \u00abschlechter\u00bb Ungleichheit (Milanovic)."},

{id:"v09",topic:"verteilung",type:"mc",diff:3,tax:"K4",reviewed:false,
 q:"Warum kann sehr hohe Ungleichheit das Wirtschaftswachstum gefährden?",
 options:[{v: "A",t:"Extreme Ungleichheit provoziert soziale Unruhen, verringert Vertrauen und hemmt Investitionen."},{v: "B",t:"In ungleichen Gesellschaften investieren die Reichen mehr."},{v: "C",t:"Hohe Ungleichheit hat keinen Einfluss auf den sozialen Frieden."},{v: "D",t:"Soziale Unruhen führen zu mehr Konsum."}],
 correct:"A",explain:"Bei sehr hoher Ungleichheit (Gini > ca. 0.4) steigt das Risiko sozialer Instabilität. Menschen werden kriminell statt produktiv. Die Unsicherheit hemmt Investitionen. Zudem entstehen Forderungen nach starker Umverteilung."},


{id:"v10",topic:"verteilung",type:"mc",diff:2,tax:"K3",reviewed:false,
 q:"Betrachten Sie das Diagramm mit den Lorenzkurven zweier Länder. Welche Aussage trifft zu?",
 img:{
   src:"img/vwl/bip/lorenzkurve_vergleich.svg",
   alt:"Lorenzkurven von Land A und Land B im Vergleich"
 },
 options:[{v:"A",t:"Land B hat eine ungleichere Einkommensverteilung als Land A, weil seine Kurve weiter von der 45\u00b0-Linie entfernt ist."},{v:"B",t:"Land A ist ungleicher, weil seine Kurve näher an der 45\u00b0-Linie liegt."},{v:"C",t:"Beide Länder haben denselben Gini-Koeffizienten."},{v:"D",t:"Die Kurven zeigen das BIP-Wachstum, nicht die Verteilung."}],
 correct:"A",explain:"Je weiter eine Lorenzkurve von der 45\u00b0-Linie (= perfekte Gleichverteilung) entfernt ist, desto ungleicher ist die Verteilung. Land B weicht stärker ab \u2192 höherer Gini \u2192 grössere Ungleichheit."},

{id:"v11",topic:"verteilung",type:"multi",diff:2,tax:"K2",reviewed:false,
 q:"Welche der folgenden Massnahmen verringern typischerweise die Einkommensungleichheit?",
 options:[
   {v:"A",t:"Progressive Einkommenssteuer (höherer Steuersatz bei höherem Einkommen)"},
   {v:"B",t:"Senkung der Sozialleistungen"},
   {v:"C",t:"Investitionen in öffentliche Bildung"},
   {v:"D",t:"Abschaffung der Erbschaftssteuer"}
 ],
 correct:["A","C"],
 explain:"Progressive Steuern belasten hohe Einkommen stärker und finanzieren Umverteilung. Bildungsinvestitionen schaffen Chancengleichheit und erhöhen das Humankapital der Ärmeren. Senkung der Sozialleistungen (B) und Abschaffung der Erbschaftssteuer (D) würden die Ungleichheit eher vergrössern."},

{id:"v12",topic:"verteilung",type:"tf",diff:1,tax:"K1",reviewed:false,
 q:"Ein Gini-Koeffizient von 0 bedeutet, dass alle Personen exakt das gleiche Einkommen haben.",
 correct:true,explain:"Richtig. Gini = 0 entspricht der 45\u00b0-Linie (perfekte Gleichverteilung). Jeder Prozentanteil der Bevölkerung erhält denselben Prozentanteil des Gesamteinkommens."},

// ──── WACHSTUM & NACHHALTIGKEIT (w01–w12) ────
{id:"w01",topic:"wachstum",type:"mc",diff:1,tax:"K1",reviewed:false,
 q:"Auf welche zwei Arten kann eine Volkswirtschaft wachsen?",
 options:[{v: "A",t:"Durch höhere Preise oder mehr Steuern."},{v: "B",t:"Durch mehr Exporte oder weniger Importe."},{v: "C",t:"Durch mehr Konsum oder mehr Sparen."},{v: "D",t:"Durch mehr Arbeitsstunden oder durch höhere Produktivität."}],
 correct:"D",explain:"BIP-Wachstum durch: (1) Mehr Arbeitsstunden (mehr Erwerbstätige, Zuwanderung) oder (2) Höhere Arbeitsproduktivität (mehr Kapital, bessere Technologie, Humankapital). Für den Wohlstand pro Kopf ist v.a. die Produktivität entscheidend."},

{id:"w02",topic:"wachstum",type:"fill",diff:1,tax:"K1",reviewed:false,
 q:"Nachhaltige Entwicklung befriedigt die Bedürfnisse der {0}, ohne zu riskieren, dass {1} Generationen ihre Bedürfnisse nicht befriedigen können. Diese Definition stammt aus dem {2}-Bericht von 1987.",
 blanks:[
   {answer:"Gegenwart",alts:["heutigen Generation"]},
   {answer:"künftige",alts:["zukünftige","kommende","nachfolgende"]},
   {answer:"Brundtland",alts:[]}
 ],
 explain:"Die Brundtland-Definition (1987) betont intergenerationelle Gerechtigkeit: Heutige Bedürfnisbefriedigung darf nicht auf Kosten zukünftiger Generationen gehen."},

{id:"w03",topic:"wachstum",type:"mc",diff:2,tax:"K2",reviewed:false,
 q:"Was sind externe Effekte (Externalitäten)?",
 options:[{v: "A",t:"Gewinne für ausländische Investoren."},{v: "B",t:"Kosten, die im Ausland anfallen."},{v: "C",t:"Auswirkungen von Exporten auf das BIP."},{v: "D",t:"Kosten oder Nutzen, die bei Produktion/Konsum entstehen, aber nicht vom Verursacher getragen werden."}],
 correct:"D",explain:"Externe Effekte = Kosten/Nutzen für Dritte, die nicht im Preis berücksichtigt werden. Negativ: Fabrik verschmutzt Fluss (Allgemeinheit trägt Kosten). Positiv: Impfung schützt andere. Bei negativen Externalitäten wird \u00abzu viel\u00bb produziert \u2192 Marktversagen."},

{id:"w04",topic:"wachstum",type:"sort",diff:2,tax:"K2",reviewed:false,
 q:"Ordnen Sie die Instrumente der Umweltpolitik den Kategorien zu.",
 categories:["Gebote und Verbote","Lenkungsabgaben","Umweltzertifikate"],
 items:[
   {t:"CO\u2082-Abgabe auf Brennstoffe",cat:1},{t:"Schadstoff-Grenzwerte",cat:0},
   {t:"Handel mit Emissionsrechten",cat:2},{t:"Verbot von FCKW",cat:0},
   {t:"Klimarappen auf Benzin",cat:1},{t:"EU-Emissionshandelssystem (ETS)",cat:2}
 ],
 explain:"(1) Gebote/Verbote: direkte Regeln. (2) Lenkungsabgaben: Preisanreize, Einnahmen rückverteilt. (3) Umweltzertifikate: Staat legt Gesamtmenge fest, Handel bestimmt Preis. Marktbasiert und kosteneffizient."},

{id:"w05",topic:"wachstum",type:"tf",diff:2,tax:"K2",reviewed:false,
 q:"Lenkungsabgaben sollen dem Staat primär höhere Einnahmen verschaffen.",
 correct:false,explain:"Falsch. Lenkungsabgaben zielen auf Verhaltensänderung, nicht auf Einnahmen. Die Einnahmen werden vollumfänglich an die Bevölkerung rückverteilt. Wer umweltfreundlich handelt, erhält mehr zurück als er einzahlt."},

{id:"w06",topic:"wachstum",type:"mc",diff:3,tax:"K3",reviewed:false,
 q:"Was besagt das Coase-Theorem?",
 options:[{v: "A",t:"Externe Effekte existieren nur bei Monopolen."},{v: "B",t:"Der Staat muss immer eingreifen bei externen Effekten."},{v: "C",t:"Umweltverschmutzung kann nicht durch den Markt gelöst werden."},{v: "D",t:"Bei klar definierten Eigentumsrechten und geringen Transaktionskosten können Betroffene externe Effekte durch Verhandlungen lösen."}],
 correct:"D",explain:"Das Coase-Theorem: Wenn Eigentums- und Klagerechte klar definiert sind und die Transaktionskosten gering, können die Betroffenen das Problem durch freiwillige Verhandlungen lösen \u2013 ohne Staatseingriff."},

{id:"w07",topic:"wachstum",type:"tf",diff:1,tax:"K1",reviewed:false,
 q:"Wirtschaftswachstum und Nachhaltigkeit schliessen sich gegenseitig aus.",
 correct:false,explain:"Falsch. Qualitatives Wachstum (bessere Technologie, Effizienz, Dienstleistungen) kann mit Nachhaltigkeit vereinbar sein. Es geht nicht darum, kein Wachstum zu haben, sondern die Art des Wachstums zu verändern \u2013 weg von ressourcenintensiver Produktion hin zu nachhaltigerem Wirtschaften."},

{id:"w08",topic:"wachstum",type:"open",diff:3,tax:"K5",reviewed:false,
 q:"Ein Zementwerk verursacht erhebliche CO\u2082-Emissionen. Vergleichen Sie zwei Instrumente (z.B. Lenkungsabgabe vs. Emissionshandel), mit denen der Staat dieses Problem angehen kann.",
 sample:"Lenkungsabgabe: Der Staat legt eine CO\u2082-Abgabe pro Tonne fest. Vorteil: Planungssicherheit beim Preis, einfache Umsetzung. Nachteil: Die tatsächliche Reduktionsmenge ist unsicher. Emissionshandel: Der Staat legt eine Obergrenze (Cap) fest und verteilt Zertifikate. Vorteil: Die Gesamtmenge ist fix, der Markt findet den günstigsten Weg zur Reduktion (Kosteneffizienz). Nachteil: Preisschwankungen, komplexe Administration. Beide internalisieren externe Kosten, aber auf unterschiedlichem Weg: Preis vs. Menge.",
 explain:"Lenkungsabgabe = Preislösung (Preis fix, Menge variabel). Emissionshandel = Mengenlösung (Menge fix, Preis variabel). Beide Instrumente internalisieren externe Kosten und sind theoretisch gleich effizient."},

{id:"w09",topic:"wachstum",type:"sort",diff:2,tax:"K2",reviewed:false,
 q:"Ordnen Sie die Beispiele zu: Handelt es sich um einen negativen oder positiven externen Effekt?",
 categories:["Negativer externer Effekt","Positiver externer Effekt"],
 items:[
   {t:"Fabrik verschmutzt einen Fluss",cat:0},{t:"Imker-Bienen bestäuben Nachbars Obstbäume",cat:1},
   {t:"Fluglärm belästigt Anwohner",cat:0},{t:"Impfung schützt auch Ungeimpfte",cat:1},
   {t:"Abgase im Stadtverkehr",cat:0},{t:"Forschung nützt der ganzen Gesellschaft",cat:1}
 ],
 explain:"Negative Externalitäten: Kosten für Dritte (Verschmutzung, Lärm, Abgase) \u2192 zu viel Produktion. Positive Externalitäten: Nutzen für Dritte (Bestäubung, Impfschutz, Forschung) \u2192 zu wenig Produktion. Beides = Marktversagen."},

{id:"w10",topic:"wachstum",type:"multi",diff:2,tax:"K2",reviewed:false,
 q:"Welche der folgenden Situationen sind Beispiele für negative externe Effekte?",
 options:[
   {v:"A",t:"Ein Nachbar renoviert sein Haus und der Baulärm stört die Anwohner."},
   {v:"B",t:"Eine Universität bildet Fachkräfte aus, die in der ganzen Region Arbeitsplätze schaffen."},
   {v:"C",t:"Eine Fabrik leitet Abwasser in einen See, in dem Fischer ihre Existenz haben."},
   {v:"D",t:"Ein Flughafen verursacht Lärm und tiefere Immobilienpreise in der Umgebung."}
 ],
 correct:["A","C","D"],
 explain:"A, C und D sind negative externe Effekte: Dritte tragen Kosten (Lärm, Verschmutzung, Wertminderung), ohne entschädigt zu werden. B ist ein positiver externer Effekt: Die Ausbildungsleistung der Universität nützt auch Dritten (Unternehmen, Region)."},

{id:"w11",topic:"wachstum",type:"tf",diff:1,tax:"K1",reviewed:false,
 q:"Die drei Dimensionen der Nachhaltigkeit sind Ökologie, Ökonomie und Gesellschaft (Soziales).",
 correct:true,explain:"Richtig. Das Drei-Säulen-Modell der Nachhaltigkeit: (1) Ökologische Nachhaltigkeit (Umwelt schützen), (2) Ökonomische Nachhaltigkeit (wirtschaftliche Leistungsfähigkeit erhalten), (3) Soziale Nachhaltigkeit (Gerechtigkeit, Teilhabe). Alle drei Dimensionen müssen gleichgewichtig berücksichtigt werden."},

{id:"w12",topic:"wachstum",type:"mc",diff:3,tax:"K4",reviewed:false,
 q:"Was beschreibt die \u00abTragik der Allmende\u00bb (Tragedy of the Commons)?",
 options:[{v: "A",t:"Der Staat muss alle Ressourcen privatisieren."},{v: "B",t:"Gemeinsames Eigentum ist immer effizienter als privates."},{v: "C",t:"Wenn eine Ressource allen gehört, wird sie übernutzt, weil jeder seinen eigenen Nutzen maximiert, die Kosten aber die Allgemeinheit trägt."},{v: "D",t:"Die Allmende bezeichnet das BIP eines Landes."}],
 correct:"C",explain:"Beispiel: Eine gemeinsame Weide wird übernutzt, weil jeder Hirte ein zusätzliches Tier hinstellt – der Nutzen ist privat, die Kosten (Überweidung) tragen alle. Lösungen: Privatisierung, Regulierung, oder Selbstorganisation (Ostrom). Das Konzept ist zentral für Umweltprobleme wie Überfischung und Klimawandel."},

// --- Sortierungsfragen ---
{id: "neu_sort_01", topic: "kreislauf", type: "sortierung", diff: 2, tax: "K3", reviewed: false,
 q: "Ordnen Sie die Sektoren des erweiterten Wirtschaftskreislaufs in der Reihenfolge, in der sie typischerweise in Lehrbüchern eingeführt werden – vom einfachsten zum komplexesten Modell.",
 items: [
   "Haushalte und Unternehmen (einfacher Kreislauf)",
   "Hinzufügen des Staates (erweiterter Kreislauf mit Steuern und Staatsausgaben)",
   "Hinzufügen der Banken (Sparen und Investitionen)",
   "Hinzufügen des Auslands (Exporte und Importe)"
 ],
 correct: [0, 1, 2, 3],
 explain: "Der Wirtschaftskreislauf wird schrittweise aufgebaut: Zuerst der einfache 2-Sektoren-Kreislauf (Haushalte ↔ Unternehmen), dann wird der Staat ergänzt (Steuern, Transfers, Staatskonsum), dann die Banken (Kapitalmarkt: Sparen und Investieren), und schliesslich das Ausland (Exporte, Importe, Kapitalströme)."
},
{id: "neu_sort_02", topic: "dreiseiten", type: "sortierung", diff: 3, tax: "K3", reviewed: false,
 q: "Ordnen Sie die Komponenten des BIP nach dem Verwendungsansatz (Y = C + I + G + NX) nach ihrem typischen Anteil am Schweizer BIP – vom grössten zum kleinsten.",
 items: [
   "Privater Konsum (C) – ca. 50–55%",
   "Staatskonsum (G) – ca. 10–12%",
   "Investitionen (I) – ca. 25–30%",
   "Nettoexporte (NX = Exporte − Importe) – ca. 5–10%"
 ],
 correct: [0, 2, 1, 3],
 explain: "In der Schweiz ist der private Konsum mit über 50% die grösste BIP-Komponente, gefolgt von den Investitionen (ca. 25–30%). Der Staatskonsum liegt bei rund 10–12%. Die Nettoexporte (Exporte minus Importe) schwanken und machen nur wenige Prozent aus – trotz der starken Exportwirtschaft, weil die Schweiz auch viel importiert."
},
{id: "neu_sort_03", topic: "nomreal", type: "sortierung", diff: 2, tax: "K3", reviewed: false,
 q: "Ordnen Sie die folgenden Schritte zur Berechnung des realen BIP in die korrekte Reihenfolge.",
 items: [
   "Nominales BIP des laufenden Jahres bestimmen (Menge × aktuelle Preise)",
   "Ein Basisjahr als Referenz festlegen",
   "BIP-Deflator berechnen (Preisindex: aktuelle Preise / Basisjahr-Preise × 100)",
   "Reales BIP berechnen (Nominales BIP / BIP-Deflator × 100)"
 ],
 correct: [0, 1, 2, 3],
 explain: "Um das reale BIP zu berechnen, muss zuerst das nominale BIP bekannt sein. Dann wählt man ein Basisjahr, berechnet den BIP-Deflator (Preisveränderung gegenüber dem Basisjahr) und bereinigt das nominale BIP um die Preisentwicklung. So erhält man ein Mass für die tatsächliche Mengenveränderung."
},

// ──── ZEICHNEN ────
  {
    id: "neu_zeichnen_01", topic: "dreiseiten", type: "zeichnen", diff: 2, tax: "K3", reviewed: false,
    q: "Stelle die Verwendungsseite des BIP grafisch dar (z.B. als Balkendiagramm oder Kreisdiagramm). Beschrifte die vier Komponenten und gib ungefähre prozentuale Anteile für die Schweiz an.",
    hints: ["Die vier Komponenten sind: Konsum (C), Investitionen (I), Staatsausgaben (G) und Nettoexporte (NX).", "Der private Konsum macht in der Schweiz über die Hälfte aus.", "Die Formel lautet: Y = C + I + G + NX."],
    sample: { src: "img/vwl/bip/bip_verwendungsseite_zeichnen.svg", alt: "Musterlösung: BIP-Verwendungsseite" },
    explain: "Das BIP nach Verwendungsseite: Y = C + I + G + NX. In der Schweiz: Konsum ca. 55%, Investitionen ca. 25%, Staatsausgaben ca. 12%, Nettoexporte ca. 8%. Die Aufteilung zeigt, dass der private Konsum die wichtigste Nachfragekomponente ist."
  },

// ===== INTERAKTIVE FRAGETYPEN (Hotspot, Bildbeschriftung, DragDrop) =====

// --- Bildbeschriftung: BIP nach Verwendungsseite ---
{
  id: "beschriftung01", topic: "dreiseiten", type: "bildbeschriftung", diff: 1, tax: "K2", reviewed: false,
  q: "Beschrifte die vier Komponenten des BIP nach Verwendungsseite und die Formel.",
  img: { src: "img/vwl/bip/bip_verwendung_beschriftung.svg", alt: "BIP-Verwendungskomponenten mit fünf nummerierten Beschriftungspunkten" },
  labels: [
    {id: "l1", text: "Privater Konsum (C)", x: 40, y: 41},
    {id: "l2", text: "Staatlicher Konsum (G)", x: 32, y: 79},
    {id: "l3", text: "Investitionen (I)", x: 49, y: 67},
    {id: "l4", text: "Nettoexporte (NX = X − M)", x: 22, y: 57},
    {id: "l5", text: "Y = C + I + G + NX", x: 85, y: 92}
  ],
  explain: "Das BIP nach Verwendungsseite: Y = C + I + G + NX. Privater Konsum (C, ca. 52%), Staatlicher Konsum (G, ca. 12%), Investitionen (I, ca. 25%), Nettoexporte (NX, ca. 11% in der Schweiz)."
},
// --- DragDrop: BIP-Berechnungsmethoden ---
{
  id: "dragdrop01", topic: "dreiseiten", type: "dragdrop_bild", diff: 2, tax: "K3", reviewed: false,
  q: "Ordne die folgenden Begriffe der richtigen BIP-Berechnungsseite zu.",
  img: { src: "img/vwl/bip/bip_dreiseiten_dragdrop.svg", alt: "Drei Spalten: Entstehungsseite, Verwendungsseite, Verteilungsseite" },
  zones: [
    {id: "entstehung", x: 2.5, y: 14, w: 30, h: 82},
    {id: "verwendung", x: 34, y: 14, w: 30, h: 82},
    {id: "verteilung", x: 65.5, y: 14, w: 32, h: 82}
  ],
  labels: [
    {id: "m1", text: "Wertschöpfung der Branchen", zone: "entstehung"},
    {id: "m2", text: "Bruttoproduktionswert − Vorleistungen", zone: "entstehung"},
    {id: "m3", text: "Primär-/Sekundär-/Tertiärsektor", zone: "entstehung"},
    {id: "m4", text: "Privater Konsum (C)", zone: "verwendung"},
    {id: "m5", text: "Investitionen (I)", zone: "verwendung"},
    {id: "m6", text: "Nettoexporte (NX)", zone: "verwendung"},
    {id: "m7", text: "Arbeitnehmerentgelt", zone: "verteilung"},
    {id: "m8", text: "Unternehmensgewinne", zone: "verteilung"},
    {id: "m9", text: "Vermögenseinkommen", zone: "verteilung"}
  ],
  explain: "Das BIP kann auf drei Arten berechnet werden: Entstehungsseite (Wertschöpfung der Sektoren), Verwendungsseite (Y=C+I+G+NX), Verteilungsseite (Löhne + Gewinne + Vermögenseinkommen). Alle drei ergeben dasselbe BIP."
}

];
