// Übungspool: Wirtschaftswachstum – Triebkräfte und Effekte
// Fachbereich: VWL
// Anzahl Fragen: 76

window.POOL_META = {
  id: "vwl_wachstum",
  fach: "VWL",
  title: "Übungspool: Wirtschaftswachstum – Triebkräfte und Effekte",
  meta: "SF GYM1–GYM4 · Gymnasium Hofwil · Individuell üben",
  color: "vwl"
};

window.TOPICS = {
  definition: {label:"Definition & Grundbegriffe", short:"Definition"},
  ebene1: {label:"Unmittelbare Ebene: Einkommen & Produktion", short:"Einkommen"},
  ebene2: {label:"Zwischenebene: Investitionen & Innovation", short:"Investitionen"},
  ebene3: {label:"Tief liegende Ebene: Institutionen & Rahmenbedingungen", short:"Institutionen"},
  verteilung: {label:"Wachstum & Verteilung", short:"Verteilung"},
  nachhaltigkeit: {label:"Wachstum & Nachhaltigkeit", short:"Nachhaltigkeit"}
};

window.QUESTIONS = [
// ── DEFINITION & GRUNDBEGRIFFE (d01–d10) ──
{id:"d01", topic:"definition", type:"mc", diff:1, tax:"K1",
 q:"Was versteht man unter wirtschaftlichem Wachstum?",
 options:[
   {v:"A", t:"Die langfristige Entwicklung des realen BIP pro Kopf."},
   {v:"B", t:"Die kurzfristige Schwankung des nominalen BIP."},
   {v:"C", t:"Den Anstieg der Konsumentenpreise über mehrere Jahre."},
   {v:"D", t:"Die Zunahme der Bevölkerung eines Landes."}
 ],
 correct:"A",
 explain:"Wirtschaftliches Wachstum bezeichnet die langfristige Entwicklung des realen BIP pro Kopf. Es geht um den Trend über Jahre und Jahrzehnte, nicht um kurzfristige Konjunkturschwankungen."},

{id:"d02", topic:"definition", type:"tf", diff:1, tax:"K1",
 q:"Wenn das reale BIP eines Landes um 3 % wächst und die Bevölkerung ebenfalls um 3 % zunimmt, steigt der Wohlstand pro Kopf.",
 correct:false,
 explain:"Falsch. Wenn BIP und Bevölkerung gleich stark wachsen, bleibt das BIP pro Kopf konstant. Der einzelne Einwohner kann sich nicht mehr Güter leisten als zuvor."},

{id:"d03", topic:"definition", type:"mc", diff:1, tax:"K2",
 q:"Worin unterscheiden sich «Konjunktur» und «Wachstum» als volkswirtschaftliche Konzepte?",
 options:[
   {v:"A", t:"Konjunktur betrachtet kurzfristige BIP-Schwankungen, Wachstum den langfristigen Trend des BIP pro Kopf."},
   {v:"B", t:"Konjunktur betrifft nur die Industrie, Wachstum die gesamte Volkswirtschaft."},
   {v:"C", t:"Konjunktur misst nominale Grössen, Wachstum reale Grössen."},
   {v:"D", t:"Es gibt keinen wesentlichen Unterschied."}
 ],
 correct:"A",
 explain:"Konjunktur beschäftigt sich mit dem Auf und Ab des BIP in kurzer Frist (Quartale, 1–2 Jahre). Wachstum hingegen betrachtet die langfristige Entwicklung des realen BIP pro Kopf über Jahre und Jahrzehnte."},

{id:"d04", topic:"definition", type:"calc", diff:2, tax:"K3",
 img:{src:"img/wachstumsvergleich.svg", alt:"Exponentielles Wachstum bei unterschiedlichen Wachstumsraten"},
 q:"Ein Land hat eine jährliche Wachstumsrate des BIP pro Kopf von 2 %. Berechnen Sie mit der 70er-Regel:",
 rows:[
   {label:"Anzahl Jahre bis zur Verdopplung des BIP pro Kopf", answer:35, tolerance:0.5, unit:"Jahre"}
 ],
 explain:"Die 70er-Regel besagt: Verdopplungszeit ≈ 70 / Wachstumsrate. Also 70 / 2 = 35 Jahre. Bei 2 % jährlichem Wachstum verdoppelt sich das BIP pro Kopf in ca. 35 Jahren."},

{id:"d05", topic:"definition", type:"calc", diff:2, tax:"K3",
 q:"China wuchs zwischen 2012 und 2019 mit einer Rate von 6,5 % pro Jahr (BIP pro Kopf). In wie vielen Jahren verdoppelt sich bei dieser Rate das BIP pro Kopf?",
 rows:[
   {label:"Verdopplungszeit (gerundet)", answer:10.8, tolerance:0.5, unit:"Jahre"}
 ],
 explain:"70 / 6,5 ≈ 10,8 Jahre. Bei einer Wachstumsrate von 6,5 % verdoppelt sich das BIP pro Kopf in knapp 11 Jahren – das erklärt Chinas rasanten Wohlstandszuwachs."},

{id:"d06", topic:"definition", type:"sort", diff:1, tax:"K2",
 q:"Ordnen Sie die folgenden Aspekte den Kategorien «Vorteil des Wirtschaftswachstums» oder «Nachteil/Herausforderung» zu.",
 categories:["Vorteil des Wachstums", "Nachteil / Herausforderung"],
 items:[
   {t:"Bessere Bedürfnisbefriedigung", cat:0},
   {t:"Sinkende Arbeitslosigkeit", cat:0},
   {t:"Umweltverschmutzung", cat:1},
   {t:"Erleichterte Sozialpolitik", cat:0},
   {t:"Ressourcenausbeutung", cat:1},
   {t:"Mehr Freizeit bei gleichem Einkommen möglich", cat:0}
 ],
 explain:"Wirtschaftswachstum bietet zahlreiche Vorteile (Bedürfnisbefriedigung, Beschäftigung, Sozialpolitik, Freizeit), bringt aber auch Herausforderungen wie Umweltbelastung und Ressourcenverbrauch mit sich."},

{id:"d07", topic:"definition", type:"open", diff:2, tax:"K2",
 q:"Erklären Sie, weshalb Wirtschaftswachstum kein Selbstzweck ist, aber dennoch als notwendig betrachtet wird.",
 sample:"Wachstum ist kein Selbstzweck, sondern entsteht, weil Menschen unbefriedigte Bedürfnisse haben – z.B. nach besserer Bildung, Gesundheitsversorgung oder intakterer Umwelt. Ohne Wachstum wäre Umverteilung ein Nullsummenspiel: Was einer Gruppe gegeben wird, müsste einer anderen weggenommen werden. Zudem sind unsere Sozialsysteme (AHV, IV etc.) auf Wachstum angewiesen.",
 explain:"Wachstum ermöglicht es, steigende Ansprüche zu erfüllen, ohne anderen etwas wegnehmen zu müssen. Es ist die Grundlage für die Finanzierung der Sozialwerke und des Staates."},

{id:"d08", topic:"definition", type:"tf", diff:2, tax:"K2",
 q:"«Immer mehr» und «immer besser» bedeuten beim Wirtschaftswachstum dasselbe.",
 correct:false,
 explain:"Falsch. Wachstum wandelt sich zunehmend vom «immer mehr» zum «immer besser»: effizientere Geräte, bessere Qualität, sparsamere Technologien. Das BIP misst den Wert (Wertschöpfung), nicht die Menge der produzierten Güter."},

{id:"d09", topic:"definition", type:"fill", diff:1, tax:"K1",
 q:"Unter wirtschaftlichem Wachstum versteht man die langfristige Entwicklung des {0} BIP pro {1}.",
 blanks:[
   {answer:"realen", alts:["reelles"]},
   {answer:"Kopf", alts:["Einwohner"]}
 ],
 explain:"Die Definition betont zwei wichtige Aspekte: «real» (also preisbereinigt, ohne Inflationseffekte) und «pro Kopf» (um das Bevölkerungswachstum herauszurechnen)."},

{id:"d10", topic:"definition", type:"mc", diff:2, tax:"K2",
 q:"Weshalb ist Nullwachstum gemäss Eisenhut eine «wirtschaftspolitische Illusion»?",
 options:[
   {v:"A", t:"Weil Umverteilung ohne Wachstum ein Nullsummenspiel wäre und die Sozialwerke auf Wachstum angewiesen sind."},
   {v:"B", t:"Weil die Bevölkerung immer schrumpft."},
   {v:"C", t:"Weil Nullwachstum automatisch zu Inflation führt."},
   {v:"D", t:"Weil technischer Fortschritt verboten werden müsste."}
 ],
 correct:"A",
 explain:"Bei Nullwachstum könnte niemand materiell reicher werden, ohne dass jemand anderes ärmer wird. Zudem sind die Sozialwerke so konzipiert, dass ihre Finanzierung ohne Wachstum stark gefährdet wäre."},

{id:"d11", topic:"definition", type:"multi", diff:2, tax:"K2",
 q:"Welche der folgenden Aussagen treffen auf das Konzept «Wirtschaftswachstum» zu? (Mehrere Antworten möglich.)",
 options:[
   {v:"A", t:"Es bezieht sich auf die langfristige Entwicklung, nicht auf kurzfristige Schwankungen."},
   {v:"B", t:"Es wird anhand des realen (preisbereinigten) BIP gemessen."},
   {v:"C", t:"Es berücksichtigt nur die Menge der produzierten Güter, nicht deren Qualität."},
   {v:"D", t:"Es wird pro Kopf betrachtet, um das Bevölkerungswachstum herauszurechnen."}
 ],
 correct:["A","B","D"],
 explain:"Wachstum ist langfristig (A), real gemessen (B) und pro Kopf betrachtet (D). Aussage C ist falsch: Das BIP misst den Wert der Güter, nicht nur die Menge. Qualitätsverbesserungen («immer besser» statt «immer mehr») fliessen in die Wertschöpfung ein."},

{id:"d12", topic:"definition", type:"mc", diff:3, tax:"K4",
 q:"Land A und Land B hatten im Jahr 2000 beide ein BIP pro Kopf von CHF 40'000. Land A wächst seither mit 1 %, Land B mit 3 %. Welche Aussage ist nach 25 Jahren am zutreffendsten?",
 options:[
   {v:"A", t:"Land B hat sein BIP pro Kopf ungefähr verdoppelt, Land A liegt noch deutlich darunter."},
   {v:"B", t:"Beide Länder haben ihr BIP pro Kopf ungefähr verdoppelt."},
   {v:"C", t:"Der Unterschied zwischen den Ländern beträgt weniger als CHF 10'000."},
   {v:"D", t:"Land A hat Land B inzwischen überholt."}
 ],
 correct:"A",
 explain:"Nach 25 Jahren: Land A ≈ 40'000 × 1,01²⁵ ≈ 51'300. Land B ≈ 40'000 × 1,03²⁵ ≈ 83'800. Land B hat sein BIP also mehr als verdoppelt, Land A liegt weit zurück. Der Unterschied beträgt über CHF 32'000 – die Kraft des Zinseszinses."},

{id:"d13", topic:"definition", type:"calc", diff:3, tax:"K3",
 q:"Land X hat ein BIP pro Kopf von CHF 20'000 und wächst mit 5 % pro Jahr. Land Y hat ein BIP pro Kopf von CHF 60'000 und wächst mit 1 % pro Jahr.",
 rows:[
   {label:"Verdopplungszeit Land X (70er-Regel)", answer:14, tolerance:0.5, unit:"Jahre"},
   {label:"Verdopplungszeit Land Y (70er-Regel)", answer:70, tolerance:1, unit:"Jahre"},
   {label:"Ungefähres BIP pro Kopf Land X nach 28 Jahren", answer:80000, tolerance:5000, unit:"CHF"}
 ],
 explain:"Land X: 70/5 = 14 Jahre, Land Y: 70/1 = 70 Jahre. Nach 28 Jahren hat sich das BIP von Land X zweimal verdoppelt: 20'000 → 40'000 → 80'000. Land Y hat in dieser Zeit kaum aufgeholt (≈ 79'000). Die Konvergenz zeigt: Hohe Wachstumsraten in ärmeren Ländern können den Abstand zu reichen Ländern schliessen."},

// ── UNMITTELBARE EBENE: EINKOMMEN & PRODUKTION (e01–e08) ──
{id:"e01", topic:"ebene1", type:"mc", diff:1, tax:"K1",
 q:"Auf welche zwei grundsätzlichen Arten kann eine Volkswirtschaft wachsen?",
 options:[
   {v:"A", t:"Mehr Arbeitsstunden leisten oder die Arbeitsproduktivität erhöhen."},
   {v:"B", t:"Mehr Geld drucken oder die Steuern senken."},
   {v:"C", t:"Mehr exportieren oder weniger importieren."},
   {v:"D", t:"Mehr Rohstoffe abbauen oder mehr Arbeitskräfte einstellen."}
 ],
 correct:"A",
 explain:"Grundsätzlich kann das BIP pro Kopf nur steigen, wenn entweder mehr Arbeitsstunden geleistet werden oder die Produktivität (Output pro Arbeitsstunde) zunimmt."},

{id:"e02", topic:"ebene1", type:"tf", diff:2, tax:"K2",
 q:"Der Wohlstandszuwachs in der Schweiz seit dem Jahr 2000 ist hauptsächlich auf eine Erhöhung der Arbeitsstunden zurückzuführen.",
 correct:false,
 explain:"Falsch. Der Arbeitseinsatz pro Einwohner ist in der Schweiz seit 2000 sogar um ca. 7 % gesunken. Der Wohlstandszuwachs ist ausschliesslich dem Produktivitätswachstum zu verdanken (ca. +25 % von 2000–2018)."},

{id:"e03", topic:"ebene1", type:"mc", diff:2, tax:"K2",
 q:"Was versteht man unter der Erwerbsquote?",
 options:[
   {v:"A", t:"Das Verhältnis der Erwerbspersonen zur Bevölkerung im Alter von 15–64 Jahren."},
   {v:"B", t:"Den Anteil der Arbeitslosen an der Gesamtbevölkerung."},
   {v:"C", t:"Die durchschnittliche Anzahl Arbeitsstunden pro Woche."},
   {v:"D", t:"Das Verhältnis von Teilzeit- zu Vollzeitbeschäftigten."}
 ],
 correct:"A",
 explain:"Die Erwerbsquote gibt an, wie gross der Anteil der Bevölkerung im erwerbsfähigen Alter ist, der tatsächlich am Arbeitsmarkt teilnimmt (erwerbstätig oder arbeitssuchend)."},

{id:"e04", topic:"ebene1", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Massnahmen zu: Führen sie zu «mehr Arbeitsstunden» oder zu «höherer Produktivität»?",
 categories:["Mehr Arbeitsstunden", "Höhere Produktivität"],
 items:[
   {t:"Erhöhung des Pensionierungsalters", cat:0},
   {t:"Bessere Ausbildung der Arbeitskräfte", cat:1},
   {t:"Zuwanderung von Fachkräften", cat:0},
   {t:"Einsatz neuer Technologien", cat:1},
   {t:"Mehr Kindertagesstätten (höhere Erwerbsquote)", cat:0},
   {t:"Investitionen in Maschinen und Anlagen", cat:1}
 ],
 explain:"Die Ansatzpunkte für Wachstum lassen sich klar in zwei Kategorien teilen: Massnahmen zur Erhöhung der Arbeitsstunden (Erwerbsquote, Zuwanderung, Pensionierungsalter) und Massnahmen zur Produktivitätssteigerung (Bildung, Technologie, Investitionen)."},

{id:"e05", topic:"ebene1", type:"calc", diff:2, tax:"K3",
 q:"In der Schweiz stieg die Produktivität pro Arbeitsstunde von 2000 bis 2018 um 25 %, der Arbeitseinsatz pro Einwohner sank um 7 %. Berechnen Sie das BIP-Wachstum pro Einwohner:",
 rows:[
   {label:"BIP-Wachstum pro Einwohner (in %)", answer:16.25, tolerance:1.0, unit:"%"}
 ],
 explain:"BIP pro Einwohner = Arbeitseinsatz × Produktivität. Also: (1 + 0,25) × (1 − 0,07) = 1,25 × 0,93 = 1,1625 → ca. +16 %. Der gesamte Wohlstandszuwachs stammt aus der Produktivitätssteigerung."},

{id:"e06", topic:"ebene1", type:"open", diff:2, tax:"K2",
 img:{src:"img/bip_formel.svg", alt:"Zerlegung des BIP pro Einwohner"},
 q:"Erklären Sie anhand der Formel «BIP pro Einwohner = Arbeitseinsatz pro Einwohner × Arbeitsproduktivität», weshalb die Produktivität für den Wohlstand in der Schweiz entscheidend ist.",
 sample:"Da der Arbeitseinsatz pro Einwohner in der Schweiz seit Jahren sinkt (weniger Wochenstunden, alternde Bevölkerung), kann das BIP pro Kopf nur steigen, wenn die Produktivität überproportional wächst. Tatsächlich ist der gesamte Wohlstandszuwachs der Schweiz der letzten Jahrzehnte auf Produktivitätssteigerungen zurückzuführen.",
 explain:"Mehr Arbeitsstunden sind begrenzt (max. 24h/Tag, Erwerbsquote bereits hoch in der Schweiz). Daher ist Produktivitätswachstum der einzig nachhaltige Weg zu mehr Wohlstand."},

{id:"e07", topic:"ebene1", type:"tf", diff:1, tax:"K1",
 q:"Die durchschnittliche Wochenarbeitszeit hat sich in den letzten 150 Jahren mehr als halbiert.",
 correct:true,
 explain:"Richtig. Um 1850 betrug die Wochenarbeitszeit in Europa ca. 80+ Stunden (7-Tage-Woche). Heute liegt sie bei ca. 35–42 Stunden (5-Tage-Woche). Trotzdem ist der Wohlstand massiv gestiegen – dank Produktivitätssteigerungen."},

{id:"e08", topic:"ebene1", type:"mc", diff:2, tax:"K2",
 q:"Weshalb kann «mehr Arbeiten» allein kein stetiges Wirtschaftswachstum ermöglichen?",
 options:[
   {v:"A", t:"Weil der Arbeitseinsatz durch die maximale Tageszeit (24h) und die Erwerbsquote begrenzt ist (Niveaueffekt)."},
   {v:"B", t:"Weil Arbeiten gesundheitsschädlich ist."},
   {v:"C", t:"Weil es nicht genügend Arbeitsplätze gibt."},
   {v:"D", t:"Weil die Bevölkerung immer kleiner wird."}
 ],
 correct:"A",
 explain:"Die Arbeitsmenge hat eine natürliche Obergrenze (Niveaueffekt): Niemand kann mehr als 24 Stunden pro Tag arbeiten, und die Erwerbsquote kann nicht über 100 % steigen. Zudem zeigen Studien, dass übermässig viel Arbeit die Produktivität pro Stunde senkt."},

{id:"e09", topic:"ebene1", type:"multi", diff:2, tax:"K2",
 q:"Welche der folgenden Massnahmen steigern die Arbeitsproduktivität? (Mehrere Antworten möglich.)",
 options:[
   {v:"A", t:"Investitionen in bessere Maschinen und Anlagen."},
   {v:"B", t:"Erhöhung des Rentenalters von 65 auf 67."},
   {v:"C", t:"Weiterbildungsprogramme für Arbeitnehmende."},
   {v:"D", t:"Einführung neuer Software zur Automatisierung von Routinetätigkeiten."}
 ],
 correct:["A","C","D"],
 explain:"A, C und D steigern die Produktivität (mehr Output pro Stunde): besseres Sachkapital (A), besseres Humankapital (C), technischer Fortschritt (D). Die Erhöhung des Rentenalters (B) erhöht den Arbeitseinsatz, nicht die Produktivität pro Stunde."},

{id:"e10", topic:"ebene1", type:"fill", diff:1, tax:"K1",
 q:"Das BIP pro Einwohner lässt sich zerlegen in: {0} pro Einwohner multipliziert mit der {1}.",
 blanks:[
   {answer:"Arbeitseinsatz", alts:["Arbeitsstunden","Arbeitsvolumen"]},
   {answer:"Arbeitsproduktivität", alts:["Produktivität"]}
 ],
 explain:"Die fundamentale Wachstumsgleichung: BIP/Einwohner = Arbeitseinsatz/Einwohner × Arbeitsproduktivität. Sie zeigt die zwei grundsätzlichen Hebel für mehr Wohlstand."},

{id:"e11", topic:"ebene1", type:"mc", diff:3, tax:"K4",
 img:{src:"img/bip_formel.svg", alt:"Zerlegung des BIP pro Einwohner"},
 q:"Die Schweiz hat eine der höchsten Erwerbsquoten Europas. Die durchschnittliche Wochenarbeitszeit sinkt aber seit Jahrzehnten. Welche Schlussfolgerung ist am überzeugendsten?",
 options:[
   {v:"A", t:"Die Schweiz muss ihre Produktivität stetig steigern, da kaum noch Potenzial bei der Arbeitsmenge besteht."},
   {v:"B", t:"Die Schweiz sollte die Arbeitszeit wieder erhöhen, um weiter zu wachsen."},
   {v:"C", t:"Sinkende Arbeitszeit führt automatisch zu sinkendem Wohlstand."},
   {v:"D", t:"Die Erwerbsquote ist für das Wachstum irrelevant."}
 ],
 correct:"A",
 explain:"Da der Arbeitseinsatz kaum noch steigerbar ist (hohe Erwerbsquote, sinkende Wochenstunden), bleibt die Produktivitätssteigerung der einzige nachhaltige Wachstumsmotor. Die Schweiz zeigt: Weniger Arbeitsstunden bei gleichzeitig höherem Wohlstand – dank Produktivität."},

{id:"e12", topic:"ebene1", type:"calc", diff:3, tax:"K3",
 q:"Land A hat 5 Mio. Einwohner. Die Erwerbsquote beträgt 70 %, jede Erwerbsperson arbeitet im Schnitt 1'600 Stunden pro Jahr. Die Produktivität beträgt CHF 80 pro Stunde.",
 rows:[
   {label:"Total Arbeitsstunden pro Jahr (in Mio.)", answer:5600, tolerance:50, unit:"Mio. h"},
   {label:"BIP total (in Mrd. CHF)", answer:448, tolerance:5, unit:"Mrd. CHF"},
   {label:"BIP pro Kopf (in CHF)", answer:89600, tolerance:500, unit:"CHF"}
 ],
 explain:"Erwerbspersonen: 5 Mio. × 0,70 = 3,5 Mio. Total Arbeitsstunden: 3,5 Mio. × 1'600 = 5'600 Mio. h. BIP = 5'600 Mio. h × CHF 80 = CHF 448 Mrd. BIP pro Kopf = 448 Mrd. / 5 Mio. = CHF 89'600."},

// ── ZWISCHENEBENE: INVESTITIONEN & INNOVATION (i01–i10) ──
{id:"i01", topic:"ebene2", type:"mc", diff:1, tax:"K1",
 q:"Welcher Produktionsfaktor ist gemäss Eisenhut hauptverantwortlich für stetiges wirtschaftliches Wachstum?",
 options:[
   {v:"A", t:"Wissen (Humankapital und technischer Fortschritt)."},
   {v:"B", t:"Natürliche Ressourcen."},
   {v:"C", t:"Arbeit."},
   {v:"D", t:"Realkapital."}
 ],
 correct:"A",
 explain:"Der Produktionsfaktor Wissen (Humankapital + technischer Fortschritt) ist der einzige Faktor, der unlimitiert ist und stetiges Wachstum ermöglicht. Alle anderen Faktoren stossen an natürliche Grenzen."},

{id:"i02", topic:"ebene2", type:"fill", diff:1, tax:"K1",
 q:"Die {0} misst den Output pro Zeiteinheit. Sie kann durch Investitionen in {1} und {2} gesteigert werden.",
 blanks:[
   {answer:"Produktivität", alts:["Arbeitsproduktivität"]},
   {answer:"Sachkapital", alts:["Realkapital","Kapital"]},
   {answer:"Humankapital", alts:["Bildung","Ausbildung"]}
 ],
 explain:"Produktivität = Output pro Zeiteinheit. Sie wird bestimmt durch die Ausstattung mit Sachkapital, Humankapital (Bildung) und die eingesetzte Technologie."},

{id:"i03", topic:"ebene2", type:"mc", diff:2, tax:"K2",
 q:"Warum ist eine hohe Investitionsquote (Investitionen in % des BIP) wichtig für das Wirtschaftswachstum?",
 options:[
   {v:"A", t:"Weil Investitionen den Kapitalstock vergrössern und die Produktivität steigern."},
   {v:"B", t:"Weil hohe Investitionen automatisch zu Vollbeschäftigung führen."},
   {v:"C", t:"Weil Investitionen den Konsum ersetzen."},
   {v:"D", t:"Weil nur Länder mit hohen Investitionen handeln dürfen."}
 ],
 correct:"A",
 explain:"Empirische Daten zeigen eine enge Korrelation: China (Investitionsquote 44 %, Wachstum 6,5 %) vs. USA (15,7 %, Wachstum 1,7 %). Mehr Kapital pro Arbeitnehmer bedeutet höhere Produktivität."},

{id:"i04", topic:"ebene2", type:"tf", diff:2, tax:"K2",
 q:"Laut der neuen Wachstumstheorie sind Bildungsausgaben als Investitionen zu betrachten, nicht als Konsum.",
 correct:true,
 explain:"Richtig. Die neue Wachstumstheorie betont, dass Bildungsausgaben Investitionen in Humankapital sind: Man investiert Zeit und Geld, um in Zukunft ein höheres Einkommen zu erzielen. Zudem erzeugt Bildung positive externe Effekte für die ganze Volkswirtschaft."},

{id:"i05", topic:"ebene2", type:"open", diff:2, tax:"K3",
 q:"Hans Rosling zeigt im TED-Talk, wie die Waschmaschine den Wohlstand beeinflusst hat. Erläutern Sie den Zusammenhang zwischen Waschmaschine und den Begriffen Produktivität, Opportunitätskosten und Rolle der Frauen.",
 sample:"Die Waschmaschine hat die zeitintensive Handarbeit des Wäschewaschens ersetzt (höhere Produktivität durch technischen Fortschritt). Dadurch sanken die Opportunitätskosten der Erwerbstätigkeit für Frauen: Die Zeit, die zuvor fürs Waschen aufgewendet wurde, konnte nun für Bildung und Erwerbsarbeit genutzt werden. Dies führte zu höherer Erwerbsquote, besserem Humankapital und letztlich zu mehr Wirtschaftswachstum.",
 explain:"Das Beispiel zeigt, wie eine einzelne Innovation (Waschmaschine) über mehrere Kanäle wirkt: Produktivitätssteigerung, Senkung der Opportunitätskosten, Bildungszugang und höhere Erwerbsbeteiligung."},

{id:"i06", topic:"ebene2", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Beispiele den Innovationstypen «Produktinnovation» oder «Prozessinnovation» zu.",
 categories:["Produktinnovation", "Prozessinnovation"],
 items:[
   {t:"Erfindung des Smartphones", cat:0},
   {t:"Einführung von Fliessbandarbeit", cat:1},
   {t:"Entwicklung eines neuen Medikaments", cat:0},
   {t:"Automatisierung durch Roboter in der Fabrik", cat:1},
   {t:"Elektroauto als neues Produkt", cat:0},
   {t:"3D-Druck als Herstellungsverfahren", cat:1}
 ],
 explain:"Produktinnovationen schaffen neue oder verbesserte Güter (Smartphone, Medikament, Elektroauto). Prozessinnovationen verbessern die Herstellungsverfahren und steigern so die Produktivität (Fliessbandarbeit, Roboter, 3D-Druck)."},

{id:"i07", topic:"ebene2", type:"mc", diff:2, tax:"K2",
 q:"Welche der folgenden Aussagen beschreibt das Patent-Paradox korrekt?",
 options:[
   {v:"A", t:"Patente schaffen Anreize für Innovation, führen aber nachher zu Ineffizienz durch Monopolmacht des Patenthalters."},
   {v:"B", t:"Patente sind immer schlecht für die Innovation."},
   {v:"C", t:"Patente verhindern, dass Erfindungen gemacht werden."},
   {v:"D", t:"Patente funktionieren nur in der Landwirtschaft."}
 ],
 correct:"A",
 explain:"Das Patent-Paradox beschreibt den Zielkonflikt: Vorher bietet das Patent einen Anreiz zur Innovation (Belohnung für Forschungsaufwand). Nachher entsteht Ineffizienz, weil der Patenthalter Monopolmacht hat (höhere Preise, weniger Zugang, potenziell weniger Folgeinnovationen)."},

{id:"i08", topic:"ebene2", type:"mc", diff:1, tax:"K1",
 q:"Welcher Strukturwandel hat in der Schweiz seit 1800 stattgefunden?",
 options:[
   {v:"A", t:"Vom Agrarland über das Industrieland zur Dienstleistungsgesellschaft."},
   {v:"B", t:"Von der Dienstleistungsgesellschaft zum Industrieland."},
   {v:"C", t:"Vom Industrieland zum Agrarland."},
   {v:"D", t:"Es hat kein wesentlicher Strukturwandel stattgefunden."}
 ],
 correct:"A",
 explain:"Die Schweiz entwickelte sich von einem Agrarland (1800, 1. Sektor dominant) über ein Industrieland (1900, 2. Sektor dominant) zur heutigen Dienstleistungsgesellschaft (3. Sektor mit über 70 % der Beschäftigten)."},

{id:"i09", topic:"ebene2", type:"tf", diff:2, tax:"K2",
 q:"Natürliche Ressourcen sind eine notwendige Bedingung für ein hohes BIP pro Kopf.",
 correct:false,
 explain:"Falsch. Japan und die Schweiz gehören zu den wohlhabendsten Ländern der Welt, verfügen aber über wenige natürliche Ressourcen. Entscheidend sind vielmehr Humankapital, technischer Fortschritt und gute Institutionen."},

{id:"i10", topic:"ebene2", type:"open", diff:3, tax:"K4",
 q:"Analysieren Sie, weshalb Länder, die reich an natürlichen Ressourcen sind (z.B. Erdöl), nicht automatisch zu den wohlhabendsten Nationen gehören. Nennen Sie mögliche Erklärungen.",
 sample:"Ressourcenreichtum kann sogar zum Fluch werden (Resource Curse / Dutch Disease): Die Einnahmen aus Rohstoffen können zu Korruption, mangelnder Diversifikation der Wirtschaft und Vernachlässigung von Bildung und Innovation führen. Zudem steigt oft die Währung, was andere Exporte verteuert. Länder wie die Schweiz oder Japan zeigen, dass Investitionen in Humankapital und Innovation wichtiger sind als natürliche Ressourcen.",
 explain:"Der sogenannte «Ressourcenfluch» zeigt, dass Rohstoffreichtum ohne gute Institutionen, Bildung und Diversifikation sogar schaden kann. Entscheidend sind die gestaltbaren Rahmenbedingungen."},

{id:"i11", topic:"ebene2", type:"multi", diff:2, tax:"K2",
 q:"Welche der folgenden Beispiele sind Investitionen in Humankapital? (Mehrere Antworten möglich.)",
 options:[
   {v:"A", t:"Ein Unternehmen finanziert Sprachkurse für seine Angestellten."},
   {v:"B", t:"Der Staat baut eine neue Autobahnbrücke."},
   {v:"C", t:"Eine Studentin absolviert ein Masterstudium in Informatik."},
   {v:"D", t:"Ein Betrieb kauft neue CNC-Fräsmaschinen."}
 ],
 correct:["A","C"],
 explain:"Humankapital umfasst Wissen, Fähigkeiten und Erfahrung von Menschen. Sprachkurse (A) und ein Studium (C) sind Investitionen in Humankapital. Eine Autobahnbrücke (B) ist Infrastruktur (Sachkapital), CNC-Maschinen (D) sind Investitionen in Sachkapital/Realkapital."},

{id:"i12", topic:"ebene2", type:"calc", diff:2, tax:"K3",
 q:"Land A investiert 15 % seines BIP von 500 Mrd. CHF. Land B investiert 40 % seines BIP von 200 Mrd. CHF.",
 rows:[
   {label:"Investitionsvolumen Land A (in Mrd. CHF)", answer:75, tolerance:0.5, unit:"Mrd. CHF"},
   {label:"Investitionsvolumen Land B (in Mrd. CHF)", answer:80, tolerance:0.5, unit:"Mrd. CHF"}
 ],
 explain:"Land A: 500 × 0,15 = 75 Mrd. CHF. Land B: 200 × 0,40 = 80 Mrd. CHF. Obwohl Land B ein viel kleineres BIP hat, investiert es absolut mehr. Die hohe Investitionsquote erklärt, weshalb solche Länder (z. B. China) schnell wachsen."},

{id:"i13", topic:"ebene2", type:"mc", diff:3, tax:"K4",
 img:{src:"img/strukturwandel_ch.svg", alt:"Strukturwandel der Schweiz: Beschäftigungsanteile nach Sektoren"},
 q:"Die Grafik zeigt den Strukturwandel der Schweiz. Was ist die wahrscheinlichste Erklärung dafür, dass der 3. Sektor heute dominiert?",
 options:[
   {v:"A", t:"Produktivitätssteigerungen in Landwirtschaft und Industrie haben Arbeitskräfte freigesetzt, die in den Dienstleistungssektor gewechselt sind."},
   {v:"B", t:"Die Schweiz hat Landwirtschaft und Industrie verboten."},
   {v:"C", t:"Die Nachfrage nach Agrarprodukten ist auf null gesunken."},
   {v:"D", t:"Der 3. Sektor wächst automatisch mit der Bevölkerung."}
 ],
 correct:"A",
 explain:"Der Strukturwandel wird primär durch Produktivitätssteigerungen getrieben: Dank Mechanisierung braucht die Landwirtschaft weniger Arbeitskräfte für denselben Output. Dank Automatisierung gilt Ähnliches für die Industrie. Die freigesetzten Arbeitskräfte wandern in den Dienstleistungssektor, wo die Nachfrage mit steigendem Einkommen überproportional wächst."},

// ── TIEF LIEGENDE EBENE: INSTITUTIONEN & RAHMENBEDINGUNGEN (r01–r09) ──
{id:"r01", topic:"ebene3", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Wirtschaftsordnungen chronologisch ihrer historischen Entwicklung zu.",
 categories:["1. Zuerst", "2. Dann", "3. Zuletzt"],
 items:[
   {t:"Laissez-faire-Marktwirtschaft (Nachtwächterstaat)", cat:0},
   {t:"Neoliberale Wirtschaftsordnung (aktive Wettbewerbspolitik)", cat:1},
   {t:"Soziale Marktwirtschaft (Verteilungsaufgaben)", cat:2}
 ],
 explain:"Die Entwicklung der Wirtschaftsordnungen verläuft von der Laissez-faire-Marktwirtschaft (Staat nur für Recht, Verteidigung, Infrastruktur) über die neoliberale Ordnung (aktive Monopolbekämpfung) zur sozialen Marktwirtschaft (Umverteilung, Bekämpfung von Arbeitslosigkeit)."},

{id:"r02", topic:"ebene3", type:"mc", diff:2, tax:"K2",
 q:"Welche Aufgabe hat der Staat NICHT im Kontext der Wachstumsförderung?",
 options:[
   {v:"A", t:"Die Preise aller Güter staatlich festlegen."},
   {v:"B", t:"Voraussetzungen für die Marktwirtschaft schaffen (Privateigentum, Vertragsfreiheit)."},
   {v:"C", t:"Öffentliche Güter bereitstellen."},
   {v:"D", t:"Bei externen Effekten eingreifen."}
 ],
 correct:"A",
 explain:"Der Staat soll Spielregeln setzen, Voraussetzungen schaffen und Marktversagen verhindern – aber nicht die Preise aller Güter staatlich festlegen. Preise sollen sich grundsätzlich über den Markt bilden."},

{id:"r03", topic:"ebene3", type:"sort", diff:2, tax:"K2",
 img:{src:"img/gueterarten_matrix.svg", alt:"Güterarten nach Rivalität und Ausschliessbarkeit"},
 q:"Ordnen Sie die folgenden Güter der korrekten Güterart zu.",
 categories:["Privates Gut", "Klubgut", "Allmendegut", "Öffentliches Gut"],
 items:[
   {t:"Auto", cat:0},
   {t:"Pay-TV", cat:1},
   {t:"Fischbestände im Meer", cat:2},
   {t:"Landesverteidigung", cat:3},
   {t:"Kleider", cat:0},
   {t:"Saubere Luft", cat:3}
 ],
 explain:"Die Güterarten unterscheiden sich nach Rivalität und Ausschliessbarkeit im Konsum. Private Güter (rival + ausschliessbar), Klubgüter (nicht-rival + ausschliessbar), Allmendegüter (rival + nicht-ausschliessbar), Öffentliche Güter (nicht-rival + nicht-ausschliessbar)."},

{id:"r04", topic:"ebene3", type:"fill", diff:1, tax:"K1",
 q:"Öffentliche Güter zeichnen sich durch {0} im Konsum und {1} vom Konsum aus.",
 blanks:[
   {answer:"Nichtrivalität", alts:["keine Rivalität","Nicht-Rivalität"]},
   {answer:"Nichtausschliessbarkeit", alts:["keine Ausschliessbarkeit","Nicht-Ausschliessbarkeit"]}
 ],
 explain:"Nichtausschliessbarkeit bedeutet, dass niemand vom Konsum ausgeschlossen werden kann. Nichtrivalität bedeutet, dass der Konsum einer Person den Konsum anderer nicht einschränkt."},

{id:"r05", topic:"ebene3", type:"mc", diff:2, tax:"K2",
 q:"Welche fünf wirtschaftspolitischen Bereiche beeinflussen gemäss Eisenhut das Wachstumspotenzial wesentlich?",
 options:[
   {v:"A", t:"Wettbewerbs-, Aussenwirtschafts-, Bildungs-, Innovations- und Finanzpolitik."},
   {v:"B", t:"Geld-, Fiskal-, Handels-, Umwelt- und Sozialpolitik."},
   {v:"C", t:"Agrar-, Industrie-, Dienstleistungs-, Digital- und Verteidigungspolitik."},
   {v:"D", t:"Steuer-, Zoll-, Subventions-, Preis- und Lohnpolitik."}
 ],
 correct:"A",
 explain:"Die fünf Bereiche sind: 1) Wettbewerbspolitik (Effizienz, Innovationsanreize), 2) Aussenwirtschaftspolitik (offene Märkte), 3) Bildungspolitik (Humankapital), 4) Innovationspolitik (Forschung & Technologietransfer), 5) Finanzpolitik (Staatsfinanzen)."},

{id:"r06", topic:"ebene3", type:"open", diff:3, tax:"K5",
 q:"John Rawls' «Schleier des Nichtwissens»: Welche Gesellschaftsordnung würden Sie wählen, wenn Sie nicht wüssten, welche Stellung Sie in der Gesellschaft einnehmen würden? Begründen Sie Ihre Wahl.",
 sample:"Hinter dem Schleier des Nichtwissens würde ich eine soziale Marktwirtschaft wählen: Sie bietet einerseits Anreize für Leistung und Innovation (Marktwirtschaft), schützt aber andererseits die Schwächsten durch soziale Sicherungsnetze (Umverteilung). Da ich nicht wissen würde, ob ich arm oder reich, gesund oder krank, begabt oder benachteiligt bin, würde ich ein System bevorzugen, das allen ein Mindestmass an Wohlstand und Chancen garantiert.",
 explain:"Rawls argumentiert, dass rationale Menschen hinter dem Schleier des Nichtwissens Institutionen wählen würden, die die Situation der am schlechtesten Gestellten maximieren (Maximin-Prinzip). Dies führt typischerweise zu einer Form der sozialen Marktwirtschaft."},

{id:"r07", topic:"ebene3", type:"tf", diff:2, tax:"K2",
 q:"Wirtschaftlich offene Länder wachsen nachweisbar stärker als Länder, die sich von Auslandsmärkten abschotten.",
 correct:true,
 explain:"Richtig. Empirische Studien bestätigen dies. Offene Märkte fördern den Wettbewerb, ermöglichen Spezialisierung nach komparativen Vorteilen und erleichtern den Technologietransfer."},

{id:"r08", topic:"ebene3", type:"mc", diff:2, tax:"K2",
 q:"Welches sind gestaltbare Rahmenbedingungen für Wirtschaftswachstum?",
 options:[
   {v:"A", t:"Politische Stabilität, Rechtssicherheit, Bildungspolitik, Infrastruktur."},
   {v:"B", t:"Geografische Lage, Klima, Rohstoffvorkommen."},
   {v:"C", t:"Bevölkerungsgrösse und Landfläche."},
   {v:"D", t:"Nähe zu starken Volkswirtschaften und Meeresanbindung."}
 ],
 correct:"A",
 explain:"Gestaltbare Determinanten sind solche, die durch Politik beeinflusst werden können: Rechtssicherheit, politische Stabilität, Bildungs- und Forschungspolitik, Infrastruktur, Arbeitsmarktpolitik. Nicht gestaltbar sind z.B. Geografie, Klima, Rohstoffvorkommen."},

{id:"r09", topic:"ebene3", type:"tf", diff:1, tax:"K1",
 q:"Der Nachtwächterstaat beschränkt sich auf Rechtsordnung, Ausbildung, Verkehrsinfrastruktur und Landesverteidigung.",
 correct:true,
 explain:"Richtig. Im Konzept der Laissez-faire-Marktwirtschaft übernimmt der Staat nur minimale Aufgaben (Nachtwächterstaat): Rechtsordnung, Ausbildung, Verkehrsinfrastruktur und Landesverteidigung."},

{id:"r10", topic:"ebene3", type:"multi", diff:2, tax:"K2",
 q:"Welche der folgenden Elemente gehören zu den gestaltbaren Rahmenbedingungen für Wirtschaftswachstum? (Mehrere Antworten möglich.)",
 options:[
   {v:"A", t:"Bildungspolitik und Investitionen in Forschung."},
   {v:"B", t:"Geografische Lage des Landes."},
   {v:"C", t:"Rechtssicherheit und Schutz des Eigentums."},
   {v:"D", t:"Offene Aussenwirtschaftspolitik."}
 ],
 correct:["A","C","D"],
 explain:"Gestaltbar sind Faktoren, die durch politische Entscheide beeinflusst werden können: Bildung (A), Rechtssicherheit (C), Handelspolitik (D). Die geografische Lage (B) ist ein nicht gestaltbarer Faktor – ein Land kann seinen Standort nicht wählen."},

{id:"r11", topic:"ebene3", type:"mc", diff:3, tax:"K4",
 img:{src:"img/drei_ebenen_modell.svg", alt:"Drei-Ebenen-Modell des Wirtschaftswachstums"},
 q:"Im Drei-Ebenen-Modell beeinflusst die tief liegende Ebene (Institutionen) die beiden oberen Ebenen. Welches Beispiel illustriert diesen Zusammenhang am besten?",
 options:[
   {v:"A", t:"Ein Land mit schwacher Rechtsstaatlichkeit hat wenig ausländische Investitionen, was die Produktivität bremst und das BIP pro Kopf niedrig hält."},
   {v:"B", t:"Ein Land mit vielen natürlichen Ressourcen hat automatisch hohe Produktivität."},
   {v:"C", t:"Ein Land mit hohem BIP pro Kopf hat automatisch gute Institutionen."},
   {v:"D", t:"Institutionen haben keinen Einfluss auf die unmittelbare Ebene."}
 ],
 correct:"A",
 explain:"Das Drei-Ebenen-Modell zeigt: Schlechte Institutionen (tief liegende Ebene) → weniger Investitionen in Sach- und Humankapital (Zwischenebene) → geringere Produktivität und weniger Arbeitsstunden (unmittelbare Ebene) → tieferes BIP pro Kopf. Die Kausalität verläuft von unten nach oben."},

{id:"r12", topic:"ebene3", type:"tf", diff:3, tax:"K4",
 q:"Die soziale Marktwirtschaft unterscheidet sich von der neoliberalen Ordnung vor allem dadurch, dass der Staat zusätzlich Verteilungsaufgaben übernimmt (z. B. Bekämpfung von Arbeitslosigkeit und Armut).",
 correct:true,
 explain:"Richtig. In der neoliberalen Ordnung sichert der Staat primär den Wettbewerb (Kartellbekämpfung). Die soziale Marktwirtschaft geht weiter: Der Staat greift auch bei der Einkommensverteilung ein (Sozialversicherungen, Arbeitslosenversicherung, Sozialhilfe) – allerdings ohne den Leistungsanreiz zu zerstören."},

// ── WACHSTUM & VERTEILUNG (v01–v09) ──
{id:"v01", topic:"verteilung", type:"mc", diff:1, tax:"K1",
 q:"Was zeigt die Elefantengrafik von Branko Milanovic?",
 options:[
   {v:"A", t:"Die prozentuale Veränderung der Realeinkommen verschiedener Einkommensgruppen weltweit zwischen 1988 und 2008."},
   {v:"B", t:"Die absolute Höhe der Einkommen in verschiedenen Ländern."},
   {v:"C", t:"Die Entwicklung der Börsenkurse seit 1988."},
   {v:"D", t:"Den Anteil verschiedener Branchen am Welt-BIP."}
 ],
 correct:"A",
 explain:"Die Elefantengrafik zeigt auf der x-Achse die Perzentile der globalen Einkommensverteilung und auf der y-Achse die prozentuale Veränderung der Realeinkommen von 1988 bis 2008. Ihre Form ähnelt einem Elefanten."},

{id:"v02", topic:"verteilung", type:"mc", diff:2, tax:"K2",
 q:"Wer befindet sich gemäss der Elefantengrafik im «Knick des Rüssels» (ca. 75.–85. Perzentil)?",
 options:[
   {v:"A", t:"Die untere Mittelschicht der westlichen Industrieländer, deren Realeinkommen stagniert hat."},
   {v:"B", t:"Die ärmsten Menschen der Welt."},
   {v:"C", t:"Die aufstrebende Mittelschicht in Schwellenländern."},
   {v:"D", t:"Die reichsten 1 % der Weltbevölkerung."}
 ],
 correct:"A",
 explain:"Im Knick des Rüssels (ca. 75.–85. Perzentil) befinden sich Menschen der westlichen Mittelschicht, deren Realeinkommen in den 20 Jahren kaum gestiegen oder sogar leicht gesunken ist. Sie haben nicht von Globalisierung und technischem Fortschritt profitiert."},

{id:"v03", topic:"verteilung", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Gruppen den Bereichen der Elefantengrafik zu.",
 categories:["Rücken des Elefanten (starker Anstieg)", "Knick des Rüssels (Stagnation)", "Spitze des Rüssels (starker Anstieg)"],
 items:[
   {t:"Aufstrebende Mittelschicht in China und Indien", cat:0},
   {t:"Westliche untere Mittelschicht", cat:1},
   {t:"Globale Superverdiener (Top 1 %)", cat:2}
 ],
 explain:"Der Rücken des Elefanten zeigt den Einkommenszuwachs der globalen Mittelschicht (v.a. Asien). Der Knick zeigt die stagnierende westliche Mittelschicht. Die Rüsselspitze zeigt den starken Anstieg bei den Reichsten."},

{id:"v04", topic:"verteilung", type:"open", diff:3, tax:"K4",
 q:"Erklären Sie anhand der Elefantengrafik, weshalb die westliche untere Mittelschicht (ca. 80. Perzentil) nicht vom Wirtschaftswachstum profitiert hat. Gehen Sie auf die Rolle von Globalisierung und Automatisierung ein.",
 sample:"Die westliche untere Mittelschicht verrichtet oft relativ einfache, aber im globalen Vergleich teure Arbeit. Durch die Globalisierung wurden viele dieser Tätigkeiten in Schwellenländer mit niedrigeren Löhnen verlagert (Konkurrenz aus dem Ausland). Gleichzeitig konnten durch Automatisierung (Roboter, Software) viele dieser Arbeitsplätze durch Maschinen ersetzt werden, weil die Automatisierung sich bei den hohen westlichen Löhnen besonders gelohnt hat. Dadurch stagnierte die Nachfrage nach dieser Art von Arbeit und mit ihr die Einkommen.",
 explain:"Die Elefantengrafik zeigt die Konkurrenz der Produktionsfaktoren Arbeit und Kapital: Wenn ein Unternehmen durch Einsatz von mehr Kapital (Maschinen, Roboter, Software) produktiver werden kann, wird es dies tun – besonders wenn die Arbeit teuer ist."},

{id:"v05", topic:"verteilung", type:"tf", diff:2, tax:"K2",
 q:"Die Elefantengrafik zeigt, dass die allerreichsten 5 % der Weltbevölkerung absolut gesehen fast die Hälfte des Wohlstandsgewinns erhalten haben.",
 correct:true,
 explain:"Richtig. Die Grafik zeigt prozentuale Veränderungen. In absoluten Zahlen ist eine 60 %-Erhöhung eines Tageseinkommens von 2'000 US$ natürlich viel mehr als eine 60 %-Erhöhung bei 2 US$/Tag. Fast die Hälfte des absoluten Wohlstandsgewinns kam den reichsten 5 % zugute."},

{id:"v06", topic:"verteilung", type:"mc", diff:2, tax:"K3",
 q:"Die Grafik «Produktivität vs. Reallöhne» zeigt, dass sich seit ca. 1970 eine Kluft aufgetan hat. Was bedeutet das?",
 options:[
   {v:"A", t:"Die Produktivität ist weiter gestiegen, aber die Reallöhne der Güter produzierenden Arbeiter haben stagniert."},
   {v:"B", t:"Sowohl Produktivität als auch Löhne sind gesunken."},
   {v:"C", t:"Die Löhne sind stärker gestiegen als die Produktivität."},
   {v:"D", t:"Produktivität und Löhne haben sich parallel entwickelt."}
 ],
 correct:"A",
 explain:"Seit ca. 1970 hat sich die Produktivität in den USA mehr als verdoppelt, während die Reallöhne der Güter produzierenden Arbeiter praktisch stagnierten. Der Produktivitätsgewinn floss also nicht mehr proportional in die Löhne, sondern verstärkt in Kapitalerträge."},

{id:"v07", topic:"verteilung", type:"open", diff:3, tax:"K4",
 q:"Inwiefern hängt die Auseinanderentwicklung von Produktivität und Reallöhnen (seit ca. 1970) mit der Elefantengrafik zusammen?",
 sample:"Beide Phänomene zeigen dieselbe Grunddynamik: Der technische Fortschritt und die Globalisierung steigern die Gesamtproduktivität, aber die Gewinne verteilen sich ungleich. Die Produktivitätsgewinne fliessen zunehmend an Kapitalbesitzer und hochqualifizierte Arbeitskräfte (Rüsselspitze), während einfachere Arbeit durch Automatisierung und Verlagerung unter Druck gerät (Knick des Rüssels). Die Kluft zwischen Produktivität und Löhnen ist somit die inneramerikanische Variante des globalen Phänomens, das die Elefantengrafik zeigt.",
 explain:"Die Elefantengrafik zeigt das Phänomen global, die Produktivitäts-Lohn-Schere zeigt es für ein einzelnes Land: In beiden Fällen profitieren Kapitalbesitzer und Hochqualifizierte überproportional vom Wachstum."},

{id:"v08", topic:"verteilung", type:"tf", diff:2, tax:"K2",
 q:"Die allerärmsten Menschen der Welt (ca. 5. Perzentil) haben gemäss der Elefantengrafik stark vom Wirtschaftswachstum profitiert.",
 correct:false,
 explain:"Falsch. Die allerärmsten Menschen der Welt haben kaum vom weltweiten Wirtschaftswachstum profitiert. Ihr Einkommenszuwachs war nahe null – sie befinden sich ganz links in der Grafik auf einem sehr tiefen Niveau."},

{id:"v09", topic:"verteilung", type:"mc", diff:3, tax:"K5",
 q:"Die Elefantengrafik wird manchmal herangezogen, um politische Phänomene wie Brexit oder den Aufstieg populistischer Bewegungen zu erklären. Welche Argumentation steckt dahinter?",
 options:[
   {v:"A", t:"Die stagnierende westliche Mittelschicht fühlt sich von der Elite im Stich gelassen und drückt ihren Wunsch nach Wandel in Wahlen aus."},
   {v:"B", t:"Die ärmsten Länder der Welt haben sich gegen die Globalisierung gewehrt."},
   {v:"C", t:"Die reichsten 1 % haben die Wahlen direkt manipuliert."},
   {v:"D", t:"Es gibt keinen Zusammenhang zwischen Einkommensverteilung und politischen Bewegungen."}
 ],
 correct:"A",
 explain:"Die westliche Mittelschicht – im Knick des Rüssels – sieht, wie andere (Schwellenländer, Superreiche) reicher werden, während ihr eigenes Einkommen stagniert. Diese gefühlte Ungerechtigkeit schafft Nährboden für populistische Bewegungen, die Wandel versprechen."},

{id:"v10", topic:"verteilung", type:"fill", diff:1, tax:"K1",
 q:"Die Elefantengrafik zeigt auf der x-Achse die {0} der globalen Einkommensverteilung und auf der y-Achse die prozentuale Veränderung der {1} von 1988 bis 2008.",
 blanks:[
   {answer:"Perzentile", alts:["Einkommensperzentile","Einkommensgruppen"]},
   {answer:"Realeinkommen", alts:["realen Einkommen","Einkommen"]}
 ],
 explain:"Die Elefantengrafik ordnet alle Menschen der Welt nach ihrem Einkommen (x-Achse: Perzentile, 0 = ärmste, 100 = reichste) und zeigt, wie stark sich ihr Realeinkommen in 20 Jahren verändert hat (y-Achse)."},

{id:"v11", topic:"verteilung", type:"multi", diff:2, tax:"K2",
 q:"Welche Gruppen haben gemäss der Elefantengrafik besonders stark vom globalen Wirtschaftswachstum (1988–2008) profitiert? (Mehrere Antworten möglich.)",
 options:[
   {v:"A", t:"Die aufstrebende Mittelschicht in Schwellenländern wie China und Indien."},
   {v:"B", t:"Die untere Mittelschicht in westlichen Industrieländern."},
   {v:"C", t:"Die globalen Superreichen (Top 1 %)."},
   {v:"D", t:"Die allerärmsten Menschen der Welt (ca. 5. Perzentil)."}
 ],
 correct:["A","C"],
 explain:"Stark profitiert haben die globale Mittelschicht in Schwellenländern (Rücken des Elefanten, ca. 20.–60. Perzentil) und die reichsten 1 % (Rüsselspitze). Die westliche Mittelschicht (B, Knick) und die Allerärmsten (D) haben kaum profitiert."},

{id:"v12", topic:"verteilung", type:"calc", diff:2, tax:"K3",
 q:"Ein Arbeiter in den USA verdiente 1970 real ca. USD 25'000. Die Produktivität hat sich seither verdoppelt (× 2). Der Reallohn stagnierte aber bei ca. USD 27'000.",
 rows:[
   {label:"Wie hoch wäre der Lohn, wenn er proportional zur Produktivität gestiegen wäre? (in USD)", answer:50000, tolerance:500, unit:"USD"},
   {label:"Wie gross ist die «Lohnlücke» (Differenz Ist vs. Soll)? (in USD)", answer:23000, tolerance:500, unit:"USD"}
 ],
 explain:"Bei proportionalem Anstieg: 25'000 × 2 = USD 50'000. Tatsächlicher Lohn: USD 27'000. Lohnlücke: 50'000 − 27'000 = USD 23'000. Diese Differenz floss in Kapitalerträge, Managergehälter und Unternehmensgewinne – die Produktivitäts-Lohn-Schere."},

{id:"v13", topic:"verteilung", type:"mc", diff:2, tax:"K2",
 img:{src:"img/elefantengrafik.svg", alt:"Globale Einkommensentwicklung 1988–2008 (vereinfacht)"},
 q:"Betrachten Sie die Grafik. Der Bereich B zeigt einen deutlichen Knick nach unten. Welche Bevölkerungsgruppe ist hier betroffen und warum?",
 options:[
   {v:"A", t:"Die westliche untere Mittelschicht – ihre Einkommen stagnierten, weil einfache Arbeit durch Globalisierung und Automatisierung unter Druck geriet."},
   {v:"B", t:"Die ärmsten Menschen Afrikas – sie haben keinen Zugang zu Bildung."},
   {v:"C", t:"Die Mittelschicht in China – sie wurde durch die Kulturrevolution gebremst."},
   {v:"D", t:"Die Superreichen – ihre Vermögen sind durch die Finanzkrise geschrumpft."}
 ],
 correct:"A",
 explain:"Bereich B (ca. 75.–85. Perzentil) zeigt die westliche untere Mittelschicht, deren Realeinkommen kaum stiegen. Durch Globalisierung (Verlagerung ins Ausland) und Automatisierung (Maschinen ersetzen Routinearbeit) gerieten ihre Arbeitsplätze und Löhne unter Druck."},

// ── WACHSTUM & NACHHALTIGKEIT (n01–n09) ──
{id:"n01", topic:"nachhaltigkeit", type:"fill", diff:1, tax:"K1",
 q:"Nachhaltige Entwicklung ist die Entwicklung, die die Bedürfnisse der {0} befriedigt, ohne zu riskieren, dass {1} Generationen ihre eigenen Bedürfnisse nicht befriedigen können.",
 blanks:[
   {answer:"Gegenwart", alts:["heutigen Generation","jetzigen"]},
   {answer:"künftige", alts:["zukünftige","kommende","nachfolgende"]}
 ],
 explain:"Diese Definition stammt aus dem Brundtland-Bericht (1987) der UNO-Weltkommission für Umwelt und Entwicklung. Sie betont die intergenerationelle Gerechtigkeit."},

{id:"n02", topic:"nachhaltigkeit", type:"mc", diff:1, tax:"K1",
 q:"Was misst der ökologische Fussabdruck?",
 options:[
   {v:"A", t:"Wie viel produktives Gebiet nötig ist, um das zu produzieren, was eine Bevölkerung konsumiert und deren Abfall zu entsorgen."},
   {v:"B", t:"Die CO₂-Emissionen pro Kopf."},
   {v:"C", t:"Die Biodiversität eines Landes."},
   {v:"D", t:"Den Wasserverbrauch pro Einwohner."}
 ],
 correct:"A",
 explain:"Der ökologische Fussabdruck misst den Flächenbedarf für Produktion und Abfallentsorgung. Die Schweiz hat einen Fussabdruck von ca. 5 Hektaren pro Person – lebten alle so, bräuchte es ca. 2,8 Planeten."},

{id:"n03", topic:"nachhaltigkeit", type:"calc", diff:2, tax:"K3",
 img:{src:"img/oekologischer_fussabdruck.svg", alt:"Ökologischer Fussabdruck im Ländervergleich"},
 q:"Der ökologische Fussabdruck der Schweiz beträgt ca. 5 Hektaren pro Einwohner, das Ideal für einen Planeten wäre ca. 1,8 Hektaren. Wie viele Planeten bräuchte es, wenn alle so lebten wie die Schweizer?",
 rows:[
   {label:"Anzahl Planeten (gerundet auf 1 Dezimalstelle)", answer:2.8, tolerance:0.2, unit:"Planeten"}
 ],
 explain:"5 / 1,8 ≈ 2,8 Planeten. Der Schweizer Lebensstil ist also nicht global nachhaltig – es bräuchte fast 3 Erden, wenn alle Menschen so leben würden."},

{id:"n04", topic:"nachhaltigkeit", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Instrumente der Umweltpolitik der korrekten Kategorie zu.",
 categories:["Gebote und Verbote", "Marktbasierte Instrumente"],
 items:[
   {t:"Grenzwerte für Schadstoffausstoss", cat:0},
   {t:"CO₂-Lenkungsabgabe", cat:1},
   {t:"Verbot von FCKW", cat:0},
   {t:"Emissionszertifikate (Handel)", cat:1},
   {t:"Umweltverträglichkeitsprüfung", cat:0},
   {t:"Besteuerung umweltbelastender Aktivitäten", cat:1}
 ],
 explain:"Gebote/Verbote sind direkte staatliche Regulierungen (Grenzwerte, Verbote, Prüfungen). Marktbasierte Instrumente nutzen Preismechanismen, um Anreize für umweltgerechtes Verhalten zu schaffen (Lenkungsabgaben, Zertifikate, Steuern)."},

{id:"n05", topic:"nachhaltigkeit", type:"mc", diff:2, tax:"K2",
 q:"Was ist das Prinzip der Internalisierung externer Kosten?",
 options:[
   {v:"A", t:"Die Verursacher von Umweltschäden müssen für die von ihnen verursachten Kosten aufkommen."},
   {v:"B", t:"Umweltschäden werden aus dem BIP herausgerechnet."},
   {v:"C", t:"Unternehmen müssen ihre Produktion ins Inland verlagern."},
   {v:"D", t:"Der Staat übernimmt alle Umweltkosten."}
 ],
 correct:"A",
 explain:"Bei der Internalisierung externer Kosten werden die Umweltkosten, die bisher von der Allgemeinheit getragen wurden, dem Verursacher zugerechnet. So entsteht ein Anreiz, die Umweltbelastung zu reduzieren."},

{id:"n06", topic:"nachhaltigkeit", type:"open", diff:3, tax:"K4",
 q:"Erklären Sie den Zielkonflikt zwischen Wirtschaftswachstum und Umweltschutz. Gehen Sie dabei auch auf das Konzept des «Decoupling» ein.",
 sample:"Wirtschaftswachstum war historisch eng mit steigendem Energieverbrauch und Umweltbelastung verbunden (mehr Produktion = mehr Ressourcenverbrauch = mehr Emissionen). Allerdings zeigen neuere Daten, dass ein «Decoupling» (Entkopplung) möglich ist: Einige Länder (z.B. Schweiz, Schweden, Deutschland) konnten ihr Einkommen steigern und gleichzeitig die CO₂-Emissionen pro Kopf senken. Dies gelingt durch Effizienzsteigerungen, erneuerbare Energien und Strukturwandel hin zu weniger energieintensiven Wirtschaftszweigen.",
 explain:"Das Decoupling zeigt, dass Wirtschaftswachstum nicht zwangsläufig zu mehr Umweltbelastung führen muss – vorausgesetzt, der technische Fortschritt und die Politik schaffen die richtigen Rahmenbedingungen."},

{id:"n07", topic:"nachhaltigkeit", type:"mc", diff:2, tax:"K2",
 q:"Wie funktionieren Emissionszertifikate als Instrument der Umweltpolitik?",
 options:[
   {v:"A", t:"Der Staat legt eine Gesamtmenge an zulässigen Emissionen fest und verteilt handelbare Verschmutzungsrechte."},
   {v:"B", t:"Unternehmen erhalten Geld für jede Tonne CO₂, die sie ausstossen."},
   {v:"C", t:"Umweltverschmutzung wird komplett verboten."},
   {v:"D", t:"Unternehmen müssen eine Umweltversicherung abschliessen."}
 ],
 correct:"A",
 explain:"Bei Emissionszertifikaten schafft der Staat Nutzungsrechte an der Natur. Wer die Umwelt belasten will, muss Zertifikate kaufen. Wer Umweltschutzmassnahmen ergreift, kann überschüssige Zertifikate verkaufen. So wird die Gesamtemission begrenzt und die Reduktion dort vorgenommen, wo sie am günstigsten ist."},

{id:"n08", topic:"nachhaltigkeit", type:"tf", diff:2, tax:"K2",
 q:"Lenkungsabgaben sollen dem Staat höhere Einnahmen verschaffen.",
 correct:false,
 explain:"Falsch. Lenkungsabgaben sollen die Wirtschaft in eine umweltfreundlichere Richtung lenken, nicht dem Staat höhere Einnahmen bringen. Sie sollen daher vollumfänglich an die Wirtschaftssubjekte zurückbezahlt werden (z.B. via Krankenkassenprämien-Reduktion)."},

{id:"n09", topic:"nachhaltigkeit", type:"open", diff:3, tax:"K5",
 q:"Hans Rosling zeigt, dass Wirtschaftswachstum und steigender Energieverbrauch zusammenhängen: Bis 2050 könnten 22 Milliarden Einheiten Energie verbraucht werden (statt 12 im Jahr 2010). Beurteilen Sie, wie dieses Dilemma zwischen Entwicklung und Nachhaltigkeit gelöst werden könnte.",
 sample:"Das Dilemma ist real: Milliarden Menschen streben zu Recht nach mehr Wohlstand (z.B. einer Waschmaschine), was den Energieverbrauch steigert. Lösungsansätze: 1) Massive Investitionen in erneuerbare Energien (Solar, Wind), damit der zusätzliche Energiebedarf klimaneutral gedeckt werden kann. 2) Technologische Effizienzsteigerungen (weniger Energie pro Waschgang). 3) Internalisierung externer Kosten (CO₂-Preise), damit fossile Energie teurer und erneuerbare wettbewerbsfähiger wird. 4) Technologietransfer in Entwicklungsländer, damit diese nicht denselben emissionsintensiven Weg gehen müssen wie die Industrieländer.",
 explain:"Roslings Botschaft ist: Wir können den Menschen in Entwicklungsländern den Wohlstand nicht verwehren, müssen aber sicherstellen, dass der zusätzliche Energiebedarf aus nachhaltigen Quellen gedeckt wird. Technischer Fortschritt ist der Schlüssel."},

{id:"n10", topic:"nachhaltigkeit", type:"multi", diff:2, tax:"K2",
 q:"Welche der folgenden Instrumente gelten als marktbasierte Instrumente der Umweltpolitik? (Mehrere Antworten möglich.)",
 options:[
   {v:"A", t:"Handelbare Emissionszertifikate."},
   {v:"B", t:"Verbot von Einwegplastik."},
   {v:"C", t:"CO₂-Lenkungsabgabe mit Rückverteilung."},
   {v:"D", t:"Subventionen für erneuerbare Energien."}
 ],
 correct:["A","C","D"],
 explain:"Marktbasierte Instrumente nutzen Preissignale: Emissionszertifikate (A), Lenkungsabgaben (C) und Subventionen (D) verändern die relativen Preise und schaffen Anreize für umweltfreundliches Verhalten. Ein Verbot (B) ist ein ordnungsrechtliches Instrument (Gebot/Verbot)."},

{id:"n11", topic:"nachhaltigkeit", type:"mc", diff:3, tax:"K5",
 q:"Ein Kritiker argumentiert: «Emissionszertifikate sind ungerecht, weil reiche Unternehmen sich das Recht erkaufen können, die Umwelt zu verschmutzen.» Wie lässt sich diese Kritik am besten einordnen?",
 options:[
   {v:"A", t:"Der Einwand verkennt, dass die Gesamtemissionen durch die fixe Obergrenze (Cap) begrenzt sind – wer mehr kauft, bedeutet, dass ein anderer weniger emittiert."},
   {v:"B", t:"Die Kritik ist vollständig berechtigt – Emissionszertifikate sollten abgeschafft werden."},
   {v:"C", t:"Emissionszertifikate funktionieren nur, wenn alle Unternehmen gleich reich sind."},
   {v:"D", t:"Die Kritik betrifft nur Lenkungsabgaben, nicht Zertifikate."}
 ],
 correct:"A",
 explain:"Das Cap-and-Trade-System setzt eine Obergrenze (Cap) für die Gesamtemissionen. Innerhalb dieser Grenze werden die Reduktionen dort vorgenommen, wo sie am günstigsten sind (Effizienz). Ein reiches Unternehmen, das Zertifikate kauft, finanziert damit indirekt die Emissionsreduktion bei einem anderen Unternehmen. Die Gesamtmenge bleibt gleich."},

{id:"n12", topic:"nachhaltigkeit", type:"tf", diff:3, tax:"K4",
 q:"Die Entkopplung (Decoupling) von Wirtschaftswachstum und CO₂-Emissionen ist in einigen Industrieländern bereits gelungen: Das reale BIP stieg, während die territorialen CO₂-Emissionen sanken.",
 correct:true,
 explain:"Richtig. Länder wie die Schweiz, Schweden und Grossbritannien haben in den letzten Jahrzehnten ihr reales BIP gesteigert und gleichzeitig ihre CO₂-Emissionen pro Kopf gesenkt. Allerdings muss man beachten, dass ein Teil der Emissionen ins Ausland «exportiert» wurde (importierte Güter), weshalb die Bilanz bei konsumbasierten Emissionen weniger eindeutig ist."},

{id:"n13", topic:"nachhaltigkeit", type:"mc", diff:1, tax:"K2",
 img:{src:"img/oekologischer_fussabdruck.svg", alt:"Ökologischer Fussabdruck im Ländervergleich"},
 q:"Die Grafik zeigt den ökologischen Fussabdruck verschiedener Länder. Was bedeutet es, wenn der Fussabdruck eines Landes über der gestrichelten Linie (1,8 Hektaren) liegt?",
 options:[
   {v:"A", t:"Das Land verbraucht mehr Ressourcen, als die Erde pro Person dauerhaft bereitstellen kann."},
   {v:"B", t:"Das Land hat ein höheres BIP pro Kopf als der Durchschnitt."},
   {v:"C", t:"Das Land importiert mehr als es exportiert."},
   {v:"D", t:"Das Land hat mehr Einwohner als Hektaren Fläche."}
 ],
 correct:"A",
 explain:"Die 1,8-Hektaren-Linie zeigt die global verfügbare Biokapazität pro Person. Liegt ein Land darüber, verbraucht es mehr, als die Erde langfristig regenerieren kann. Würden alle so leben, bräuchte es mehrere Planeten."}
];
