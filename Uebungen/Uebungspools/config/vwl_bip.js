// Übungspool: Bruttoinlandprodukt (BIP)
// Fachbereich: VWL
// Anzahl Fragen: 60

const POOL_META = {
  id: "vwl_bip",
  fach: "VWL",
  title: "Übungspool: Bruttoinlandprodukt (BIP)",
  meta: "EWR GYM2 · Gymnasium Hofwil · Individuell üben",
  color: "vwl"
};

const TOPICS = {
  definition:{label:"Definition & Grundbegriffe",short:"Definition"},
  messprobleme:{label:"Was das BIP (nicht) misst",short:"Messprobleme"},
  dreiseiten:{label:"Drei Seiten des BIP",short:"3 Seiten"},
  nomreal:{label:"Nominales & Reales BIP",short:"Nom./Real"},
  kreislauf:{label:"Wirtschaftskreislauf",short:"Kreislauf"},
  verteilung:{label:"Verteilung & Ungleichheit",short:"Verteilung"},
  wachstum:{label:"Wachstum & Nachhaltigkeit",short:"Wachstum"}
};

const QUESTIONS = [
// ──── DEFINITION & GRUNDBEGRIFFE (d01–d10) ────
{id:"d01",topic:"definition",type:"mc",diff:1,tax:"K1",
 q:"Was misst das Bruttoinlandprodukt (BIP)?",
 options:[{v:"A",t:"Den Marktwert aller in einem Land während eines Jahres hergestellten Endprodukte."},{v:"B",t:"Die Summe aller in einem Land produzierten Güter inklusive Vorleistungen."},{v:"C",t:"Den Wert aller Exporte eines Landes."},{v:"D",t:"Das Gesamtvermögen aller Einwohner eines Landes."}],
 correct:"A",explain:"Das BIP entspricht dem Marktwert aller Endprodukte (Waren und Dienstleistungen), die in einem Land innerhalb eines Jahres hergestellt werden. Vorleistungen werden abgezogen, um Doppelzählungen zu vermeiden."},

{id:"d02",topic:"definition",type:"tf",diff:1,tax:"K1",
 q:"Vorleistungen werden beim BIP abgezogen, um Doppelzählungen zu vermeiden.",
 correct:true,explain:"Korrekt. Das BIP misst nur die Wertschöpfung jeder Produktionsstufe. Würde man den gesamten Produktionswert zählen, wäre das BIP künstlich aufgebläht."},

{id:"d03",topic:"definition",type:"fill",diff:1,tax:"K1",
 q:"Das BIP misst die {0} einer Volkswirtschaft. Dabei werden nur {1} berücksichtigt, nicht Vorleistungen, um {2} zu vermeiden.",
 blanks:[
   {answer:"Wertschöpfung",alts:["Wertschoepfung"]},
   {answer:"Endprodukte",alts:["Endgüter"]},
   {answer:"Doppelzählungen",alts:["Doppelzaehlungen"]}
 ],
 explain:"BIP = Marktwert aller Endprodukte. Endprodukte sind Güter, die nicht weiterverarbeitet, sondern direkt konsumiert oder investiert werden."},

{id:"d04",topic:"definition",type:"mc",diff:1,tax:"K1",
 q:"Welche vier Produktionsfaktoren unterscheidet man in der VWL?",
 options:[{v:"A",t:"Arbeit, Boden (natürliche Ressourcen), Kapital und Wissen"},{v:"B",t:"Geld, Maschinen, Rohstoffe und Energie"},{v:"C",t:"Konsum, Investitionen, Staat und Exporte"},{v:"D",t:"Löhne, Zinsen, Mieten und Gewinne"}],
 correct:"A",explain:"Die vier Produktionsfaktoren: Arbeit (körperliche/geistige Tätigkeit), Boden (Rohstoffe, Standort, Energie), Kapital (Sach-/Geldkapital, Maschinen), Wissen (Humankapital, Know-how, Patente)."},

{id:"d05",topic:"definition",type:"open",diff:2,tax:"K2",
 q:"Erklären Sie in eigenen Worten, warum Vorleistungen bei der BIP-Berechnung abgezogen werden. Verwenden Sie ein Beispiel.",
 sample:"Vorleistungen werden abgezogen, um Doppelzählungen zu vermeiden. Beispiel: Bauer verkauft Mehl für CHF 30 an Bäcker, Bäcker verkauft Brot für CHF 100 an Händler, Händler verkauft es für CHF 120. Ohne Abzug: 30+100+120 = CHF 250. Wertschöpfung aber nur: 30+70+20 = CHF 120.",
 explain:"Das BIP misst die Wertschöpfung, nicht den Umsatz. Im Brot-Beispiel: Bauer (30) + Bäcker (100–30=70) + Händler (120–100=20) = BIP von 120 = Endproduktpreis."},

{id:"d06",topic:"definition",type:"calc",diff:2,tax:"K3",
 q:"Drei Produzenten: Bauer verkauft Weizen für CHF 40 an Müller. Müller verkauft Mehl für CHF 90 an Bäcker. Bäcker verkauft Brot für CHF 150 an Konsumenten. Berechnen Sie:",
 rows:[
   {label:"BIP der Volkswirtschaft",answer:150,tolerance:0,unit:"CHF"},
   {label:"Wertschöpfung des Bäckers",answer:60,tolerance:0,unit:"CHF"}
 ],
 explain:"BIP = Endproduktpreis = CHF 150. Wertschöpfung Bauer: 40, Müller: 90–40=50, Bäcker: 150–90=60. Summe: 40+50+60 = 150 = BIP."},

{id:"d07",topic:"definition",type:"tf",diff:1,tax:"K1",
 q:"Die Wertschöpfung eines Unternehmens berechnet sich als Produktionswert minus Vorleistungen.",
 correct:true,explain:"Richtig. Wertschöpfung = Verkaufspreis – zugekaufte Vorleistungen = der neu geschaffene Wert auf dieser Produktionsstufe."},

{id:"d08",topic:"definition",type:"sort",diff:1,tax:"K2",
 q:"Ordnen Sie die Begriffe den korrekten Produktionsfaktoren zu.",
 categories:["Arbeit","Boden / Natürl. Ressourcen","Kapital","Wissen"],
 items:[
   {t:"Lohn einer Verkäuferin",cat:0},{t:"Rohstoffe aus der Erde",cat:1},
   {t:"Maschinen und Anlagen",cat:2},{t:"Patente und Lizenzen",cat:3},
   {t:"Standort / Grundstück",cat:1},{t:"Ausbildung / Know-how",cat:3},
   {t:"Geldkapital für Investitionen",cat:2},{t:"Körperliche Arbeitskraft",cat:0}
 ],
 explain:"Arbeit = körperliche/geistige Tätigkeit. Boden = Standort, Rohstoffe. Kapital = Sach- und Geldkapital. Wissen = Humankapital, Patente, Know-how."},

{id:"d09",topic:"definition",type:"mc",diff:2,tax:"K2",
 q:"Was ist der Unterschied zwischen Wohlstand und Wohlfahrt?",
 options:[{v:"A",t:"Wohlstand = materielle Güterversorgung (BIP pro Kopf), Wohlfahrt = zusätzlich Gesundheit, Bildung, Umwelt etc."},{v:"B",t:"Wohlstand und Wohlfahrt sind Synonyme für das BIP."},{v:"C",t:"Wohlfahrt misst nur die staatlichen Sozialleistungen."},{v:"D",t:"Wohlstand berücksichtigt die Umwelt, Wohlfahrt nicht."}],
 correct:"A",explain:"Wohlstand = materieller Lebensstandard (BIP pro Kopf). Wohlfahrt = umfassenderes Wohlergehen inkl. Gesundheit, Bildung, Freizeit, Umwelt, soziale Sicherheit. Das BIP misst Wohlstand, aber nicht Wohlfahrt."},

{id:"d10",topic:"definition",type:"tf",diff:2,tax:"K2",
 q:"Das BIP pro Kopf ist ein geeignetes Mass für die Lebensqualität einer Bevölkerung.",
 correct:false,explain:"Falsch. Das BIP pro Kopf misst den materiellen Wohlstand, nicht die Lebensqualität. Es ignoriert Umweltschäden, Einkommensverteilung, Gesundheit, Bildung und Freizeit. Mehr Autounfälle erhöhen z.B. das BIP, senken aber die Lebensqualität."},

// ──── MESSPROBLEME (m01–m10) ────
{id:"m01",topic:"messprobleme",type:"mc",diff:1,tax:"K1",
 q:"Welche Leistung wird im BIP NICHT erfasst?",
 options:[{v:"A",t:"Hausarbeit und Eigenleistungen (z.B. selber kochen)"},{v:"B",t:"Die Produktion eines Automobilherstellers"},{v:"C",t:"Dienstleistungen eines Coiffeurs"},{v:"D",t:"Staatliche Leistungen wie Polizei und Schulen"}],
 correct:"A",explain:"Hausarbeit, Eigenleistungen und DIY werden nicht erfasst, da kein Marktpreis existiert. Wenn eine Familie die Kinderbetreuung in eine Krippe auslagert, steigt das BIP – obwohl die Leistung gleich bleibt."},

{id:"m02",topic:"messprobleme",type:"tf",diff:1,tax:"K2",
 q:"Wenn ein Jahrhunderthochwasser Milliardenschäden verursacht, sinkt das BIP.",
 correct:false,explain:"Falsch – das BIP steigt sogar! Die Wiederaufbauarbeiten werden als Wertschöpfung erfasst. Die Zerstörung selbst wird nicht als negative Position verbucht. Das zeigt eine wichtige Schwäche des BIP."},

{id:"m03",topic:"messprobleme",type:"mc",diff:2,tax:"K2",
 q:"Warum ist die Bewertung staatlicher Leistungen im BIP problematisch?",
 options:[{v:"A",t:"Staatliche Leistungen werden zu ihren Kosten bewertet – eine Lohnerhöhung für Beamte erhöht das BIP, ohne dass die Leistung besser wird."},{v:"B",t:"Staatliche Leistungen werden gar nicht erfasst."},{v:"C",t:"Der Staat produziert keine Güter."},{v:"D",t:"Staatliche Leistungen werden doppelt gezählt."}],
 correct:"A",explain:"Da Staatsleistungen nicht am Markt verkauft werden, fehlt ein Marktpreis. Sie werden zu ihren Kosten (v.a. Löhne) bewertet. Eine Lohnerhöhung erhöht das BIP, ohne Leistungsverbesserung."},

{id:"m04",topic:"messprobleme",type:"tf",diff:2,tax:"K2",
 q:"Seit 2014 werden in der Schweiz auch Schätzungen zu Drogenhandel und Prostitution ins BIP eingerechnet.",
 correct:true,explain:"Richtig. Seit September 2014 werden gemäss einer europäischen Richtlinie illegale Aktivitäten wie Drogenhandel und Prostitution geschätzt und im BIP erfasst (Statistik-Revision)."},

{id:"m05",topic:"messprobleme",type:"sort",diff:2,tax:"K2",
 q:"Ordnen Sie zu: Wird die Aktivität im BIP erfasst oder nicht?",
 categories:["Im BIP erfasst","NICHT im BIP erfasst"],
 items:[
   {t:"Putzfrau offiziell angestellt",cat:0},{t:"Selber die Wohnung putzen",cat:1},
   {t:"Kind in Krippe betreuen lassen",cat:0},{t:"Kind zu Hause selber betreuen",cat:1},
   {t:"Schwarzarbeit (nicht angemeldet)",cat:1},{t:"Kalbsbraten im Restaurant",cat:0},
   {t:"Kalbsbraten selber kochen",cat:1},{t:"Reparatur durch eine Garage",cat:0}
 ],
 explain:"Die VGR erfasst nur monetäre Markttransaktionen. Eigenleistungen und Schwarzarbeit fehlen. Dieselbe Leistung wird erfasst, sobald sie über den Markt abgewickelt wird."},

{id:"m06",topic:"messprobleme",type:"open",diff:3,tax:"K4",
 q:"Ein Nationalrat beschäftigte eine Putzfrau schwarz. Nachdem der Fall publik wurde, stieg die Zahl der offiziellen Anmeldungen von Haushaltshilfen stark. Analysieren Sie die Auswirkung auf das BIP.",
 sample:"Das BIP steigt, obwohl sich die tatsächliche Wirtschaftsleistung nicht verändert. Die Putzarbeiten wurden vorher als Schwarzarbeit geleistet und nicht erfasst. Durch die offizielle Anmeldung werden dieselben Leistungen nun registriert – das BIP bildet einen höheren Wert ab, nur weil bisher nicht erfasste Leistungen sichtbar werden.",
 explain:"Schwarzarbeit (geschätzt ca. 7% des BIP in der Schweiz) wird nicht vollständig erfasst. Eine Legalisierung erhöht das gemessene BIP, ohne die tatsächliche Wirtschaftsleistung zu verändern."},

{id:"m07",topic:"messprobleme",type:"mc",diff:2,tax:"K2",
 q:"Welche Herausforderung stellt die Digitalisierung für die BIP-Messung dar?",
 options:[{v:"A",t:"Digitale Werte wie Daten und kostenlose Online-Dienste haben keinen klassischen Marktpreis."},{v:"B",t:"Digitale Güter sind zu günstig."},{v:"C",t:"Die Digitalisierung hat keinen Einfluss auf das BIP."},{v:"D",t:"Digitale Produkte werden doppelt gezählt."}],
 correct:"A",explain:"Kostenlose Online-Dienste (soziale Medien, Wikipedia) generieren Nutzen, erscheinen aber nicht im BIP. Zudem lässt sich die Wertschöpfung oft nicht klar einem Land zuordnen."},

{id:"m08",topic:"messprobleme",type:"tf",diff:1,tax:"K1",
 q:"Umweltschäden durch die Produktion werden im BIP als negative Position verbucht.",
 correct:false,explain:"Falsch. Umweltschäden werden nicht abgezogen. Die Beseitigung von Umweltschäden wird sogar als positive Wertschöpfung gezählt. Das BIP erfasst externe Kosten nicht."},

{id:"m09",topic:"messprobleme",type:"open",diff:3,tax:"K5",
 q:"Beurteilen Sie: «Das BIP ist trotz aller Schwächen das beste Mass für den Wohlstand.»",
 sample:"Pro: International standardisiert, objektiv messbar, ermöglicht Vergleiche. Contra: Ignoriert Eigenleistungen, Schwarzarbeit, Umweltschäden, Verteilung, Lebensqualität. Alternative Indikatoren (HDI, Happy Planet Index) versuchen Lücken zu schliessen, sind aber weniger standardisiert. Fazit: Nützlicher, aber unvollständiger Indikator – sollte mit anderen Kennzahlen ergänzt werden.",
 explain:"Diese K5-Frage erfordert eine differenzierte Beurteilung mit Pro und Contra. Das BIP hat klare Stärken (Vergleichbarkeit) und Schwächen (fehlende Erfassung vieler wohlstandsrelevanter Aspekte)."},

{id:"m10",topic:"messprobleme",type:"fill",diff:1,tax:"K1",
 q:"Die VGR erfasst nur {0} Flüsse. Deshalb fehlen im BIP z.B. {1} und Eigenleistungen. Zudem werden {2} nicht als Kosten abgezogen.",
 blanks:[
   {answer:"monetäre",alts:["monetaere","geldmässige"]},
   {answer:"Schwarzarbeit",alts:["Schattenwirtschaft"]},
   {answer:"Umweltschäden",alts:["Umweltschaeden","externe Kosten"]}
 ],
 explain:"Drei Hauptkritikpunkte: (1) Nicht erfasste Leistungen (Eigenarbeit, Schwarzarbeit), (2) Nicht erfasste Schäden (Umwelt), (3) Problematische Bewertung (Staatsleistungen zu Kosten)."},

// ──── DREI SEITEN DES BIP (s01–s07) ────
{id:"s01",topic:"dreiseiten",type:"mc",diff:1,tax:"K1",
 q:"Das BIP kann auf drei Arten berechnet werden. Welche?",
 options:[{v:"A",t:"Produktionsansatz, Einkommensansatz und Verwendungsansatz"},{v:"B",t:"Konsumansatz, Sparansatz und Investitionsansatz"},{v:"C",t:"Exportansatz, Importansatz und Binnenmarktansatz"},{v:"D",t:"Brutto-, Netto- und Realansatz"}],
 correct:"A",explain:"(1) Produktionsansatz = Summe aller Wertschöpfungen, (2) Einkommensansatz = Summe aller Einkommen, (3) Verwendungsansatz = C + I + G + NX. Alle drei ergeben denselben Wert."},

{id:"s02",topic:"dreiseiten",type:"fill",diff:1,tax:"K1",
 q:"Beim {0} wird das BIP als Summe aller Wertschöpfungen berechnet. Beim {1} zählt man alle Einkommen zusammen. Beim {2} betrachtet man, wofür die Güter verwendet werden.",
 blanks:[
   {answer:"Produktionsansatz",alts:["Produktions-Ansatz"]},
   {answer:"Einkommensansatz",alts:["Einkommens-Ansatz"]},
   {answer:"Verwendungsansatz",alts:["Verwendungs-Ansatz"]}
 ],
 explain:"Die drei Ansätze sind gleichwertige Methoden. Produktionsansatz: Wertschöpfung aller Unternehmen. Einkommensansatz: Alle Faktoreinkommen. Verwendungsansatz: C + I + G + NX."},

{id:"s03",topic:"dreiseiten",type:"mc",diff:2,tax:"K2",
 q:"BIP = C + I + G + (X – M). Was bedeuten die Variablen?",
 options:[{v:"A",t:"C = privater Konsum, I = Investitionen, G = Staatsausgaben, X = Exporte, M = Importe"},{v:"B",t:"C = Kapital, I = Importe, G = Gewinne, X = Exporte, M = Mieten"},{v:"C",t:"C = Konsum, I = Zinsen, G = Geld, X = Exporte, M = Maschinen"},{v:"D",t:"C = Kosten, I = Investitionen, G = Grundstücke, X = Extra, M = Mehrwert"}],
 correct:"A",explain:"BIP nach Verwendungsansatz: C = privater Konsum (Haushalte), I = Bruttoinvestitionen, G = Staatskonsum (Government), X–M = Nettoexporte. In der Schweiz macht der private Konsum den grössten Anteil aus."},

{id:"s04",topic:"dreiseiten",type:"sort",diff:2,tax:"K2",
 q:"Ordnen Sie die Beispiele dem korrekten BIP-Berechnungsansatz zu.",
 categories:["Produktionsansatz","Einkommensansatz","Verwendungsansatz"],
 items:[
   {t:"Summe aller Löhne und Gewinne",cat:1},{t:"Wertschöpfung aller Unternehmen",cat:0},
   {t:"C + I + G + NX",cat:2},{t:"Produktionswert minus Vorleistungen",cat:0},
   {t:"Export von Uhren ins Ausland",cat:2},{t:"Lohn einer Lehrerin",cat:1}
 ],
 explain:"Produktionsansatz: Wertschöpfung. Einkommensansatz: Alle Einkommen. Verwendungsansatz: Wofür das BIP ausgegeben wird (C+I+G+NX). Uhrenexport = Nettoexport, Lehrerlohn = Einkommen."},

{id:"s05",topic:"dreiseiten",type:"tf",diff:2,tax:"K2",
 q:"Der Produktionsansatz und der Einkommensansatz müssen immer denselben Wert ergeben.",
 correct:true,explain:"Richtig. Die drei Ansätze betrachten denselben Sachverhalt aus drei Perspektiven: Was produziert wird, fliesst als Einkommen zu und wird verwendet. Alle drei = gleiches BIP."},

{id:"s06",topic:"dreiseiten",type:"calc",diff:2,tax:"K3",
 q:"Berechnen Sie das BIP (Verwendungsansatz): Privater Konsum = 400 Mrd., Investitionen = 150 Mrd., Staatsausgaben = 100 Mrd., Exporte = 250 Mrd., Importe = 200 Mrd.",
 rows:[
   {label:"Nettoexporte (X – M)",answer:50,tolerance:0,unit:"Mrd."},
   {label:"BIP (C + I + G + NX)",answer:700,tolerance:0,unit:"Mrd."}
 ],
 explain:"NX = 250–200 = 50 Mrd. BIP = 400+150+100+50 = 700 Mrd."},

{id:"s07",topic:"dreiseiten",type:"open",diff:2,tax:"K2",
 q:"Erklären Sie, warum die drei Berechnungsarten des BIP zum selben Ergebnis führen müssen.",
 sample:"Jedes produzierte Gut wird konsumiert, investiert, vom Staat gekauft oder exportiert (Verwendung). Die Einnahmen fliessen als Löhne, Gewinne, Zinsen, Mieten an die Produktionsfaktoren (Einkommen). Die Wertschöpfung bei der Herstellung entspricht dem Endproduktwert (Produktion). Es ist derselbe Geldfluss aus drei Blickwinkeln.",
 explain:"Der Kreislaufgedanke: Was produziert wird = was als Einkommen verteilt wird = was verwendet wird. Drei Perspektiven auf denselben ökonomischen Vorgang."},
// ──── NOMINALES & REALES BIP (n01–n07) ────
{id:"n01",topic:"nomreal",type:"mc",diff:1,tax:"K1",
 q:"Was unterscheidet das nominale vom realen BIP?",
 options:[{v:"A",t:"Nominal = aktuelle Preise, real = konstante Preise eines Basisjahres (inflationsbereinigt)."},{v:"B",t:"Das nominale BIP berücksichtigt die Inflation, das reale nicht."},{v:"C",t:"Das reale BIP wird nur für die Schweiz berechnet."},{v:"D",t:"Es gibt keinen Unterschied."}],
 correct:"A",explain:"Nominales BIP = Produktion zu aktuellen Marktpreisen (enthält Preisveränderungen). Reales BIP = Produktion zu konstanten Preisen eines Basisjahres. Nur das reale BIP zeigt die tatsächliche Mengenveränderung."},

{id:"n02",topic:"nomreal",type:"tf",diff:1,tax:"K2",
 q:"Wenn das nominale BIP steigt, bedeutet das immer, dass die Wirtschaft gewachsen ist.",
 correct:false,explain:"Falsch. Ein Anstieg des nominalen BIP kann nur auf Inflation zurückzuführen sein. Nur ein Anstieg des realen BIP zeigt echtes Wirtschaftswachstum."},

{id:"n03",topic:"nomreal",type:"calc",diff:2,tax:"K3",
 q:"Nominales BIP 2023 = CHF 800 Mrd., Preisindex = 105 (Basis 2020 = 100). Berechnen Sie:",
 rows:[
   {label:"Reales BIP (zu Preisen von 2020)",answer:761.9,tolerance:0.5,unit:"Mrd. CHF"},
   {label:"Inflationsrate seit 2020",answer:5,tolerance:0,unit:"%"}
 ],
 explain:"Reales BIP = Nominales BIP / Preisindex × 100 = 800/105×100 = 761.9 Mrd. Inflation = 105–100 = 5%."},

{id:"n04",topic:"nomreal",type:"mc",diff:2,tax:"K2",
 q:"Warum verwendet man bei internationalen BIP-Vergleichen Kaufkraftparitäten (PPP)?",
 options:[{v:"A",t:"Weil Wechselkurse schwanken und man in verschiedenen Ländern für denselben Betrag unterschiedlich viel kaufen kann."},{v:"B",t:"Weil PPP einfacher zu berechnen sind."},{v:"C",t:"Weil das BIP in PPP immer höher ist."},{v:"D",t:"Weil die UNO PPP vorschreibt."}],
 correct:"A",explain:"Wechselkurse spiegeln nicht die tatsächliche Kaufkraft wider. Mit CHF 10 kauft man in der Schweiz weniger als mit dem Gegenwert in Thailand. PPP berücksichtigt die Preisniveauunterschiede."},

{id:"n05",topic:"nomreal",type:"fill",diff:1,tax:"K1",
 q:"Für zeitliche Vergleiche verwendet man das {0} BIP, das die {1} herausrechnet. Für internationale Vergleiche rechnet man in {2} um.",
 blanks:[
   {answer:"reale",alts:["reales"]},
   {answer:"Inflation",alts:["Teuerung","Preissteigerung"]},
   {answer:"Kaufkraftparitäten",alts:["PPP","Kaufkraftparität","KKP"]}
 ],
 explain:"Reales BIP = inflationsbereinigt (zeitliche Vergleiche). Kaufkraftparitäten (PPP) = berücksichtigen Preisniveauunterschiede (internationale Vergleiche)."},

{id:"n06",topic:"nomreal",type:"tf",diff:2,tax:"K2",
 q:"Beim BIP-Vergleich mit Kaufkraftparitäten (PPP) rutscht die Schweiz in der Rangliste tendenziell nach unten.",
 correct:true,explain:"Richtig. Die Schweiz hat ein sehr hohes Preisniveau. Bei PPP-Bereinigung wird berücksichtigt, dass man in der Schweiz für denselben Betrag weniger kaufen kann. Länder mit tiefem Preisniveau (z.B. China) steigen entsprechend auf."},

{id:"n07",topic:"nomreal",type:"calc",diff:3,tax:"K3",
 q:"Land A: nominales BIP/Kopf = USD 60'000, PPP-Faktor = 0.85. Land B: BIP/Kopf = USD 25'000, PPP-Faktor = 1.6. Berechnen Sie das BIP/Kopf in PPP.",
 rows:[
   {label:"Land A: BIP/Kopf in PPP",answer:51000,tolerance:100,unit:"USD"},
   {label:"Land B: BIP/Kopf in PPP",answer:40000,tolerance:100,unit:"USD"}
 ],
 explain:"Land A: 60'000 × 0.85 = 51'000 USD (sinkt wegen hohem Preisniveau). Land B: 25'000 × 1.6 = 40'000 USD (steigt wegen tiefem Preisniveau). Unterschied schrumpft von 35'000 auf 11'000."},

// ──── WIRTSCHAFTSKREISLAUF (k01–k08) ────
{id:"k01",topic:"kreislauf",type:"mc",diff:1,tax:"K1",
 q:"Welche zwei Akteure stehen im Zentrum des einfachen Wirtschaftskreislaufs?",
 options:[{v:"A",t:"Haushalte und Unternehmen"},{v:"B",t:"Staat und Ausland"},{v:"C",t:"Banken und Versicherungen"},{v:"D",t:"Arbeitnehmer und Arbeitgeber"}],
 correct:"A",explain:"Der einfache Wirtschaftskreislauf: Haushalte bieten Produktionsfaktoren an und fragen Güter nach. Unternehmen produzieren Güter und fragen Produktionsfaktoren nach."},

{id:"k02",topic:"kreislauf",type:"sort",diff:1,tax:"K2",
 q:"Ordnen Sie die Ströme im einfachen Wirtschaftskreislauf zu.",
 categories:["Haushalte \u2192 Unternehmen","Unternehmen \u2192 Haushalte"],
 items:[
   {t:"Arbeitskraft (Produktionsfaktor)",cat:0},{t:"Lohnzahlung",cat:1},
   {t:"Bezahlung für Güter",cat:0},{t:"Güter und Dienstleistungen",cat:1},
   {t:"Kapital (Produktionsfaktor)",cat:0},{t:"Zinszahlung",cat:1}
 ],
 explain:"Haushalte → Unternehmen: Produktionsfaktoren (Arbeit, Kapital) + Geld für Güter. Unternehmen → Haushalte: Güter + Faktorentgelte (Löhne, Zinsen)."},

{id:"k03",topic:"kreislauf",type:"mc",diff:2,tax:"K1",
 q:"Welche zusätzlichen Akteure kommen im erweiterten Wirtschaftskreislauf hinzu?",
 options:[{v:"A",t:"Staat, Ausland und Banken"},{v:"B",t:"Nur der Staat"},{v:"C",t:"Gewerkschaften und Verbände"},{v:"D",t:"Börse und Nationalbank"}],
 correct:"A",explain:"Erweiterter Kreislauf: + Staat (Steuern, Güter, Transfers), + Ausland (Exporte/Importe), + Banken (Ersparnisse, Kredite)."},

{id:"k04",topic:"kreislauf",type:"tf",diff:1,tax:"K1",
 q:"Im Wirtschaftskreislauf steht jedem Geldstrom ein Güterstrom (oder Faktorstrom) gegenüber.",
 correct:true,explain:"Richtig. Der Kreislauf besteht aus realen Strömen (Güter, Faktoren) und monetären Strömen (Geld), die in entgegengesetzter Richtung fliessen."},

{id:"k05",topic:"kreislauf",type:"fill",diff:2,tax:"K1",
 q:"Im erweiterten Kreislauf finanziert sich der Staat über {0}. Er verwendet diese für den Kauf von {1} und für {2} an die Haushalte.",
 blanks:[
   {answer:"Steuern",alts:["Steuereinnahmen"]},
   {answer:"Gütern",alts:["Güter","Waren und Dienstleistungen"]},
   {answer:"Transfers",alts:["Transferzahlungen","Sozialleistungen"]}
 ],
 explain:"Staat: Einnahmen = Steuern. Ausgaben = Güterkäufe + Löhne an Staatsangestellte + Transfers (z.B. AHV-Renten, Sozialhilfe – Leistungen ohne direkte Gegenleistung)."},

{id:"k06",topic:"kreislauf",type:"open",diff:2,tax:"K3",
 q:"Frau Studer arbeitet als Verkäuferin im Globus (CHF 2'800/Monat) und kauft dort eine Bluse für CHF 70. Beschreiben Sie Güter- und Geldkreislauf.",
 sample:"Faktormarkt: Frau Studer liefert Arbeitskraft an Globus (Güterstrom) \u2192 Globus zahlt CHF 2'800 Lohn (Geldstrom). Gütermarkt: Globus liefert Bluse (Güterstrom) \u2192 Frau Studer zahlt CHF 70 (Geldstrom). Es handelt sich um den einfachen Wirtschaftskreislauf mit zwei Tauschbeziehungen.",
 explain:"Dieses Beispiel illustriert den einfachen Wirtschaftskreislauf: Faktormarkt (Arbeit gegen Lohn) und Gütermarkt (Bluse gegen Geld). Geldströme laufen jeweils entgegengesetzt zu den Güterströmen."},

{id:"k07",topic:"kreislauf",type:"mc",diff:2,tax:"K2",
 q:"Was versteht man unter einem Transfer im Wirtschaftskreislauf?",
 options:[{v:"A",t:"Eine staatliche Leistung ohne direkte Gegenleistung, z.B. AHV-Renten oder Sozialhilfe."},{v:"B",t:"Die Überweisung von Geld ins Ausland."},{v:"C",t:"Den Export von Gütern."},{v:"D",t:"Eine Steuerzahlung an den Staat."}],
 correct:"A",explain:"Transfers = Zahlungen des Staates an Haushalte ohne Gegenleistung (anders als Löhne). Beispiele: AHV, IV, Sozialhilfe, Kinderzulagen, Stipendien."},

{id:"k08",topic:"kreislauf",type:"tf",diff:2,tax:"K2",
 q:"Im erweiterten Kreislauf fliessen Zahlungen für Importe von den Haushalten ans Ausland.",
 correct:true,explain:"Richtig. Schweizer Haushalte kaufen ausländische Güter (Importe) \u2192 Geld fliesst ans Ausland. Umgekehrt fliessen Exporteinnahmen vom Ausland an inländische Unternehmen."},
// ──── VERTEILUNG & UNGLEICHHEIT (v01–v09) ────
{id:"v01",topic:"verteilung",type:"mc",diff:1,tax:"K1",
 q:"Was zeigt die Lorenzkurve?",
 options:[{v:"A",t:"Die Verteilung von Einkommen oder Vermögen – je weiter von der 45\u00b0-Linie, desto ungleicher."},{v:"B",t:"Das Wirtschaftswachstum über die Zeit."},{v:"C",t:"Den Zusammenhang zwischen Inflation und Arbeitslosigkeit."},{v:"D",t:"Die Entwicklung des BIP pro Kopf."}],
 correct:"A",explain:"Die Lorenzkurve zeigt die kumulative Verteilung. Die 45\u00b0-Linie = perfekte Gleichverteilung. Je stärker die Kurve abweicht, desto ungleicher die Verteilung."},

{id:"v02",topic:"verteilung",type:"fill",diff:1,tax:"K1",
 q:"Der {0} misst die Ungleichheit. Er nimmt Werte zwischen {1} (Gleichverteilung) und {2} (maximale Ungleichheit) an.",
 blanks:[
   {answer:"Gini-Koeffizient",alts:["Gini Koeffizient","Ginikoeffizient","Gini"]},
   {answer:"0",alts:["null"]},
   {answer:"1",alts:["eins"]}
 ],
 explain:"Gini = Fläche zwischen 45\u00b0-Linie und Lorenzkurve / Gesamtdreiecksfläche. 0 = alle haben gleich viel, 1 = eine Person hat alles."},

{id:"v03",topic:"verteilung",type:"mc",diff:2,tax:"K2",
 q:"Der Gini-Koeffizient beträgt in der Schweiz ca. 0.29 und in den USA ca. 0.37. Was bedeutet das?",
 options:[{v:"A",t:"Die Einkommensungleichheit ist in den USA deutlich grösser als in der Schweiz."},{v:"B",t:"Die Schweiz ist reicher als die USA."},{v:"C",t:"Die USA haben ein höheres BIP pro Kopf."},{v:"D",t:"In der Schweiz gibt es mehr Milliardäre."}],
 correct:"A",explain:"Höherer Gini = grössere Ungleichheit. Schweiz 0.29 (relativ gleichmässig), USA 0.37 (deutlich ungleicher). Durch Umverteilung sinkt der Gini in der Schweiz von ca. 0.34 (Primäreinkommen) auf 0.29 (verfügbares Einkommen)."},

{id:"v04",topic:"verteilung",type:"mc",diff:2,tax:"K2",
 q:"Was versteht Branko Milanovic unter \u00abguter\u00bb und \u00abschlechter\u00bb Ungleichheit?",
 options:[{v:"A",t:"Gute Ungleichheit schafft Leistungsanreize. Schlechte Ungleichheit zementiert Privilegien und verhindert Chancengleichheit."},{v:"B",t:"Gute Ungleichheit betrifft nur Vermögen, schlechte nur Einkommen."},{v:"C",t:"Gute Ungleichheit gibt es nur in reichen Ländern."},{v:"D",t:"Jede Form von Ungleichheit ist schlecht."}],
 correct:"A",explain:"Nach Milanovic: \u00abGute\u00bb Ungleichheit ist leistungsbezogen (Anreize, Wachstum). \u00abSchlechte\u00bb entsteht durch Rent-Seeking (politischen Einfluss zum Machterhalt) oder fehlenden Bildungszugang für Arme."},

{id:"v05",topic:"verteilung",type:"tf",diff:2,tax:"K2",
 q:"Gemäss aktueller Forschung ist Frühförderung das effizienteste Mittel gegen Ungleichheit.",
 correct:true,explain:"Richtig. Nobelpreisträger Heckman zeigt: ca. 50% der Einkommensunterschiede werden vor dem 18. Lebensjahr geprägt. Frühförderung ist effektiver als spätere Umverteilung, da sie an der Wurzel ansetzt."},

{id:"v06",topic:"verteilung",type:"sort",diff:2,tax:"K2",
 q:"Ordnen Sie zu: Umverteilung (Symptombekämpfung) oder Ursachenbekämpfung?",
 categories:["Umverteilung","Ursachenbekämpfung"],
 items:[
   {t:"Progressive Besteuerung",cat:0},{t:"Frühförderung für bildungsferne Familien",cat:1},
   {t:"Sozialhilfe und Transfers",cat:0},{t:"Kostenloser Zugang zu Bildung",cat:1},
   {t:"AHV-Renten",cat:0},{t:"Stipendien für talentierte Kinder",cat:1}
 ],
 explain:"Umverteilung (Steuern, Transfers) wirkt schnell, kann aber Anreize verringern. Ursachenbekämpfung (Bildung, Frühförderung) setzt bei den Wurzeln an und fördert gleichzeitig das Humankapital."},

{id:"v07",topic:"verteilung",type:"tf",diff:1,tax:"K1",
 q:"Die Vermögensverteilung in der Schweiz ist deutlich ungleicher als die Einkommensverteilung.",
 correct:true,explain:"Richtig. Die Lorenzkurve für Vermögen weicht viel stärker ab als für Einkommen. Im Kanton Bern z.B. besitzen ca. 209'000 Personen gar kein Vermögen, während 770 Personen rund 20% des Gesamtvermögens besitzen."},

{id:"v08",topic:"verteilung",type:"open",diff:3,tax:"K5",
 q:"\u00abMehr Gleichheit bedeutet automatisch weniger Wirtschaftswachstum.\u00bb Nehmen Sie kritisch Stellung.",
 sample:"Zu vereinfacht. Moderate Ungleichheit kann wachstumsfördernd sein (Anreize), aber zu hohe Ungleichheit schadet: mangelnde Bildungschancen, soziale Instabilität, Polarisierung. Entscheidend ist die Art: Leistungsbezogene Ungleichheit motiviert, privilegienbasierte hemmt. Kluge Politik (Frühförderung statt nur Umverteilung) kann Gleichheit und Wachstum gleichzeitig fördern.",
 explain:"Die Forschung zeigt: Die Beziehung ist nicht linear. Der Schlüssel liegt in der Unterscheidung zwischen \u00abguter\u00bb und \u00abschlechter\u00bb Ungleichheit (Milanovic)."},

{id:"v09",topic:"verteilung",type:"mc",diff:3,tax:"K4",
 q:"Warum kann sehr hohe Ungleichheit das Wirtschaftswachstum gefährden?",
 options:[{v:"A",t:"Extreme Ungleichheit provoziert soziale Unruhen, verringert Vertrauen und hemmt Investitionen."},{v:"B",t:"Hohe Ungleichheit hat keinen Einfluss auf den sozialen Frieden."},{v:"C",t:"In ungleichen Gesellschaften investieren die Reichen mehr."},{v:"D",t:"Soziale Unruhen führen zu mehr Konsum."}],
 correct:"A",explain:"Bei sehr hoher Ungleichheit (Gini > ca. 0.4) steigt das Risiko sozialer Instabilität. Menschen werden kriminell statt produktiv. Die Unsicherheit hemmt Investitionen. Zudem entstehen Forderungen nach starker Umverteilung."},

// ──── WACHSTUM & NACHHALTIGKEIT (w01–w09) ────
{id:"w01",topic:"wachstum",type:"mc",diff:1,tax:"K1",
 q:"Auf welche zwei Arten kann eine Volkswirtschaft wachsen?",
 options:[{v:"A",t:"Durch mehr Arbeitsstunden oder durch höhere Produktivität."},{v:"B",t:"Durch mehr Exporte oder weniger Importe."},{v:"C",t:"Durch mehr Konsum oder mehr Sparen."},{v:"D",t:"Durch höhere Preise oder mehr Steuern."}],
 correct:"A",explain:"BIP-Wachstum durch: (1) Mehr Arbeitsstunden (mehr Erwerbstätige, Zuwanderung) oder (2) Höhere Arbeitsproduktivität (mehr Kapital, bessere Technologie, Humankapital). Für den Wohlstand pro Kopf ist v.a. die Produktivität entscheidend."},

{id:"w02",topic:"wachstum",type:"fill",diff:1,tax:"K1",
 q:"Nachhaltige Entwicklung befriedigt die Bedürfnisse der {0}, ohne zu riskieren, dass {1} Generationen ihre Bedürfnisse nicht befriedigen können. Diese Definition stammt aus dem {2}-Bericht von 1987.",
 blanks:[
   {answer:"Gegenwart",alts:["heutigen Generation"]},
   {answer:"künftige",alts:["zukünftige","kommende","nachfolgende"]},
   {answer:"Brundtland",alts:[]}
 ],
 explain:"Die Brundtland-Definition (1987) betont intergenerationelle Gerechtigkeit: Heutige Bedürfnisbefriedigung darf nicht auf Kosten zukünftiger Generationen gehen."},

{id:"w03",topic:"wachstum",type:"mc",diff:2,tax:"K2",
 q:"Was sind externe Effekte (Externalitäten)?",
 options:[{v:"A",t:"Kosten oder Nutzen, die bei Produktion/Konsum entstehen, aber nicht vom Verursacher getragen werden."},{v:"B",t:"Auswirkungen von Exporten auf das BIP."},{v:"C",t:"Kosten, die im Ausland anfallen."},{v:"D",t:"Gewinne für ausländische Investoren."}],
 correct:"A",explain:"Externe Effekte = Kosten/Nutzen für Dritte, die nicht im Preis berücksichtigt werden. Negativ: Fabrik verschmutzt Fluss (Allgemeinheit trägt Kosten). Positiv: Impfung schützt andere. Bei negativen Externalitäten wird \u00abzu viel\u00bb produziert \u2192 Marktversagen."},

{id:"w04",topic:"wachstum",type:"sort",diff:2,tax:"K2",
 q:"Ordnen Sie die Instrumente der Umweltpolitik den Kategorien zu.",
 categories:["Gebote und Verbote","Lenkungsabgaben","Umweltzertifikate"],
 items:[
   {t:"CO\u2082-Abgabe auf Brennstoffe",cat:1},{t:"Schadstoff-Grenzwerte",cat:0},
   {t:"Handel mit Emissionsrechten",cat:2},{t:"Verbot von FCKW",cat:0},
   {t:"Klimarappen auf Benzin",cat:1},{t:"EU-Emissionshandelssystem (ETS)",cat:2}
 ],
 explain:"(1) Gebote/Verbote: direkte Regeln. (2) Lenkungsabgaben: Preisanreize, Einnahmen rückverteilt. (3) Umweltzertifikate: Staat legt Gesamtmenge fest, Handel bestimmt Preis. Marktbasiert und kosteneffizient."},

{id:"w05",topic:"wachstum",type:"tf",diff:2,tax:"K2",
 q:"Lenkungsabgaben sollen dem Staat primär höhere Einnahmen verschaffen.",
 correct:false,explain:"Falsch. Lenkungsabgaben zielen auf Verhaltensänderung, nicht auf Einnahmen. Die Einnahmen werden vollumfänglich an die Bevölkerung rückverteilt. Wer umweltfreundlich handelt, erhält mehr zurück als er einzahlt."},

{id:"w06",topic:"wachstum",type:"mc",diff:3,tax:"K3",
 q:"Was besagt das Coase-Theorem?",
 options:[{v:"A",t:"Bei klar definierten Eigentumsrechten und geringen Transaktionskosten können Betroffene externe Effekte durch Verhandlungen lösen."},{v:"B",t:"Der Staat muss immer eingreifen bei externen Effekten."},{v:"C",t:"Umweltverschmutzung kann nicht durch den Markt gelöst werden."},{v:"D",t:"Externe Effekte existieren nur bei Monopolen."}],
 correct:"A",explain:"Das Coase-Theorem: Wenn Eigentums- und Klagerechte klar definiert sind und die Transaktionskosten gering, können die Betroffenen das Problem durch freiwillige Verhandlungen lösen \u2013 ohne Staatseingriff."},

{id:"w07",topic:"wachstum",type:"tf",diff:1,tax:"K1",
 q:"Wirtschaftswachstum und Nachhaltigkeit schliessen sich gegenseitig aus.",
 correct:false,explain:"Falsch. Qualitatives Wachstum (bessere Technologie, Effizienz, Dienstleistungen) kann mit Nachhaltigkeit vereinbar sein. Es geht nicht darum, kein Wachstum zu haben, sondern die Art des Wachstums zu verändern \u2013 weg von ressourcenintensiver Produktion hin zu nachhaltigerem Wirtschaften."},

{id:"w08",topic:"wachstum",type:"open",diff:3,tax:"K5",
 q:"Ein Zementwerk verursacht erhebliche CO\u2082-Emissionen. Vergleichen Sie zwei Instrumente (z.B. Lenkungsabgabe vs. Emissionshandel), mit denen der Staat dieses Problem angehen kann.",
 sample:"Lenkungsabgabe: Der Staat legt eine CO\u2082-Abgabe pro Tonne fest. Vorteil: Planungssicherheit beim Preis, einfache Umsetzung. Nachteil: Die tatsächliche Reduktionsmenge ist unsicher. Emissionshandel: Der Staat legt eine Obergrenze (Cap) fest und verteilt Zertifikate. Vorteil: Die Gesamtmenge ist fix, der Markt findet den günstigsten Weg zur Reduktion (Kosteneffizienz). Nachteil: Preisschwankungen, komplexe Administration. Beide internalisieren externe Kosten, aber auf unterschiedlichem Weg: Preis vs. Menge.",
 explain:"Lenkungsabgabe = Preislösung (Preis fix, Menge variabel). Emissionshandel = Mengenlösung (Menge fix, Preis variabel). Beide Instrumente internalisieren externe Kosten und sind theoretisch gleich effizient."},

{id:"w09",topic:"wachstum",type:"sort",diff:2,tax:"K2",
 q:"Ordnen Sie die Beispiele zu: Handelt es sich um einen negativen oder positiven externen Effekt?",
 categories:["Negativer externer Effekt","Positiver externer Effekt"],
 items:[
   {t:"Fabrik verschmutzt einen Fluss",cat:0},{t:"Imker-Bienen bestäuben Nachbars Obstbäume",cat:1},
   {t:"Fluglärm belästigt Anwohner",cat:0},{t:"Impfung schützt auch Ungeimpfte",cat:1},
   {t:"Abgase im Stadtverkehr",cat:0},{t:"Forschung nützt der ganzen Gesellschaft",cat:1}
 ],
 explain:"Negative Externalitäten: Kosten für Dritte (Verschmutzung, Lärm, Abgase) \u2192 zu viel Produktion. Positive Externalitäten: Nutzen für Dritte (Bestäubung, Impfschutz, Forschung) \u2192 zu wenig Produktion. Beides = Marktversagen."}
];
