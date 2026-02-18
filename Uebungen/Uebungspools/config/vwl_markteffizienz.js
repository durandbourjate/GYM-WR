// Übungspool: Markteffizienz
// Fachbereich: VWL
// Anzahl Fragen: 162
// Stufe: SF GYM2/GYM3

window.POOL_META = {
  id: "vwl_markteffizienz",
  fach: "VWL",
  title: "Übungspool: Markteffizienz",
  meta: "SF GYM2/GYM3 · Gymnasium Hofwil · Individuell üben",
  color: "vwl"
};

window.TOPICS = {
  angebot_nachfrage: {label:"Angebot & Nachfrage", short:"A & N"},
  gleichgewicht: {label:"Marktgleichgewicht & Preisbildung", short:"Gleichgewicht"},
  verschiebungen: {label:"Kurvenverschiebungen & Elastizität", short:"Verschiebungen"},
  wohlfahrt: {label:"Wohlfahrt & Effizienz", short:"Wohlfahrt"},
  gueterarten: {label:"Güterarten & Klassifikation", short:"Güterarten"},
  wettbewerb: {label:"Wettbewerbsbeschränkungen", short:"Wettbewerb"},
  oeffentlich: {label:"Öffentliche Güter & Trittbrettfahrer", short:"Öff. Güter"},
  allmende: {label:"Allmendegüter & Tragödie der Allmende", short:"Allmende"},
  externeffekte: {label:"Externe Effekte & Internalisierung", short:"Ext. Effekte"},
  asyminfo: {label:"Asymmetrische Information", short:"Asym. Info"},
  steuern: {label:"Steuern & Wohlfahrtsverlust", short:"Steuern/WFV"},
  staatsversagen: {label:"Staatsversagen & Politikversagen", short:"Staatsversagen"},
  nachhaltigkeit: {label:"Wachstum & Nachhaltigkeit", short:"Nachhaltigkeit"}
};

window.QUESTIONS = [
// ── ANGEBOT & NACHFRAGE (a01–a15) ──
{id:"a01", topic:"angebot_nachfrage", type:"mc", diff:1, tax:"K1",
 img:{src:"img/vwl/markteffizienz/angebot_nachfrage_grunddiagramm.svg", alt:"Preis-Mengen-Diagramm mit Angebots- und Nachfragekurve"},
 q:"Was beschreibt die Nachfragekurve?",
 options:[
   {v:"A", t:"Die Menge eines Gutes, die Konsumenten bei verschiedenen Preisen zu kaufen bereit sind."},
   {v:"B", t:"Die Menge eines Gutes, die Produzenten bei verschiedenen Preisen herstellen."},
   {v:"C", t:"Den Gewinn eines Unternehmens bei verschiedenen Produktionsmengen."},
   {v:"D", t:"Die maximale Produktionskapazität einer Volkswirtschaft."}
 ],
 correct:"A",
 explain:"Die Nachfragekurve zeigt die nachgefragte Menge eines Gutes bei verschiedenen Preisen. Sie verläuft typischerweise fallend: Je höher der Preis, desto weniger wird nachgefragt (Gesetz der Nachfrage)."},

{id:"a02", topic:"angebot_nachfrage", type:"mc", diff:1, tax:"K1",
 q:"Warum verläuft die Nachfragekurve typischerweise fallend (von links oben nach rechts unten)?",
 options:[
   {v:"A", t:"Weil die Produktionskosten mit steigender Menge sinken."},
   {v:"B", t:"Weil der Grenznutzen eines Gutes mit zunehmendem Konsum abnimmt."},
   {v:"C", t:"Weil der Staat höhere Preise mit Steuern belegt."},
   {v:"D", t:"Weil Unternehmen bei höheren Preisen mehr produzieren."}
 ],
 correct:"B",
 explain:"Der abnehmende Grenznutzen erklärt den fallenden Verlauf: Jede zusätzlich konsumierte Einheit stiftet weniger Nutzen als die vorherige. Konsumenten sind daher nur bei sinkendem Preis bereit, mehr zu kaufen. Zusätzlich wirken der Substitutionseffekt (Umstieg auf günstigere Alternativen) und der Einkommenseffekt (bei höherem Preis sinkt die reale Kaufkraft)."},

{id:"a03", topic:"angebot_nachfrage", type:"tf", diff:1, tax:"K1",
 q:"Die Angebotskurve verläuft typischerweise steigend, weil bei höheren Preisen mehr Unternehmen bereit sind zu produzieren und bestehende Unternehmen ihre Menge ausweiten.",
 correct:true,
 explain:"Korrekt. Steigende Preise machen die Produktion rentabler. Bestehende Anbieter weiten ihre Menge aus, und neue Anbieter treten in den Markt ein, da sie nun ihre Grenzkosten decken können."},

{id:"a04", topic:"angebot_nachfrage", type:"tf", diff:1, tax:"K2",
 q:"Die Nachfragekurve entspricht gleichzeitig der Grenzkostenkurve der Konsumenten.",
 correct:false,
 explain:"Falsch. Die Nachfragekurve spiegelt die Zahlungsbereitschaft (= Grenznutzen) der Konsumenten wider, nicht deren Grenzkosten. Die Angebotskurve hingegen entspricht der Grenzkostenkurve der Produzenten."},

{id:"a05", topic:"angebot_nachfrage", type:"fill", diff:1, tax:"K1",
 q:"Die Nachfragekurve spiegelt die {0} der Konsumenten wider. Die Angebotskurve entspricht der {1} der Produzenten.",
 blanks:[
   {answer:"Zahlungsbereitschaft", alts:["Grenznutzen","Wertschätzung"]},
   {answer:"Grenzkostenkurve", alts:["Grenzkosten"]}
 ],
 explain:"Die Nachfragekurve zeigt die maximale Zahlungsbereitschaft (= Grenznutzen) für jede weitere Einheit. Die Angebotskurve zeigt die minimalen Grenzkosten, zu denen Produzenten eine weitere Einheit anbieten."},

{id:"a06", topic:"angebot_nachfrage", type:"mc", diff:1, tax:"K1",
 q:"Was versteht man unter «Ceteris Paribus»?",
 options:[
   {v:"A", t:"Alle anderen Einflussgrössen bleiben gleich."},
   {v:"B", t:"Angebot und Nachfrage sind im Gleichgewicht."},
   {v:"C", t:"Der Preis wird vom Staat festgelegt."},
   {v:"D", t:"Die Nachfrage ist vollkommen elastisch."}
 ],
 correct:"A",
 explain:"Ceteris Paribus bedeutet «unter sonst gleichen Bedingungen». In der Ökonomie isoliert man damit einzelne Einflussfaktoren: Man verändert z.B. den Preis und hält alle anderen Faktoren (Einkommen, Präferenzen, Preise anderer Güter) konstant."},

{id:"a07", topic:"angebot_nachfrage", type:"mc", diff:2, tax:"K2",
 q:"Warum verläuft die Angebotskurve steigend? Welche Erklärung ist am zutreffendsten?",
 options:[
   {v:"A", t:"Weil die Grenzkosten bei steigender Produktion zunehmen (Ertragsgesetz)."},
   {v:"B", t:"Weil die Fixkosten bei steigender Menge sinken."},
   {v:"C", t:"Weil Konsumenten bei höheren Preisen weniger kaufen."},
   {v:"D", t:"Weil der Staat die Produktion bei hohen Preisen subventioniert."}
 ],
 correct:"A",
 explain:"Gemäss dem Ertragsgesetz nimmt der Grenzertrag bei zunehmender Produktion ab (bei konstantem Einsatz der übrigen Faktoren). Das bedeutet steigende Grenzkosten für jede zusätzliche Einheit — Produzenten bieten daher nur bei höheren Preisen mehr an."},

{id:"a08", topic:"angebot_nachfrage", type:"sort", diff:1, tax:"K2",
 q:"Ordnen Sie die folgenden Begriffe korrekt zu: Beeinflussen sie die Nachfrage oder das Angebot?",
 categories:["Nachfrage (Einflussfaktoren)", "Angebot (Einflussfaktoren)"],
 items:[
   {t:"Einkommen der Konsumenten", cat:0},
   {t:"Produktionskosten", cat:1},
   {t:"Präferenzen und Modetrends", cat:0},
   {t:"Technologischer Fortschritt", cat:1},
   {t:"Preise von Substitutionsgütern", cat:0},
   {t:"Rohstoffpreise", cat:1}
 ],
 explain:"Nachfrage wird bestimmt durch Einkommen, Präferenzen und Preise verwandter Güter (Substitute/Komplemente). Angebot wird bestimmt durch Produktionskosten, Technologie und Inputpreise (Rohstoffe, Löhne)."},

{id:"a09", topic:"angebot_nachfrage", type:"fill", diff:1, tax:"K1",
 q:"Güter, die einander ersetzen können, heissen {0}. Güter, die zusammen konsumiert werden, heissen {1}.",
 blanks:[
   {answer:"Substitutionsgüter", alts:["Substitute","Substitutgüter"]},
   {answer:"Komplementärgüter", alts:["Komplemente","Komplementärprodukte"]}
 ],
 explain:"Beispiel für Substitutionsgüter: Butter und Margarine. Beispiel für Komplementärgüter: Drucker und Druckerpatronen. Bei Substituten steigt die Nachfrage nach dem einen, wenn der Preis des anderen steigt. Bei Komplementen sinkt sie."},

{id:"a10", topic:"angebot_nachfrage", type:"mc", diff:2, tax:"K2",
 q:"Wenn der Preis von Butter steigt, was passiert ceteris paribus mit der Nachfrage nach Margarine?",
 options:[
   {v:"A", t:"Sie steigt, weil Margarine ein Substitut für Butter ist."},
   {v:"B", t:"Sie sinkt, weil Margarine ein Komplement zu Butter ist."},
   {v:"C", t:"Sie bleibt gleich, weil die Güter unabhängig sind."},
   {v:"D", t:"Sie steigt, weil Margarine ein Komplement zu Butter ist."}
 ],
 correct:"A",
 explain:"Butter und Margarine sind Substitutionsgüter — sie erfüllen einen ähnlichen Zweck. Wird Butter teurer, weichen Konsumenten auf Margarine aus: Die Nachfrage nach Margarine steigt (Nachfragekurve verschiebt sich nach rechts)."},

{id:"a11", topic:"angebot_nachfrage", type:"tf", diff:2, tax:"K2",
 q:"Wenn der Preis eines Komplementärgutes (z.B. Benzin) steigt, verschiebt sich die Nachfragekurve nach dem Hauptgut (z.B. SUVs) nach rechts.",
 correct:false,
 explain:"Falsch. Bei Komplementärgütern gilt: Steigt der Preis des einen, sinkt die Nachfrage nach dem anderen. Die Nachfragekurve nach SUVs verschiebt sich nach links, weil der Betrieb (Benzin) teurer geworden ist."},

{id:"a12", topic:"angebot_nachfrage", type:"open", diff:2, tax:"K2",
 q:"Erklären Sie den Unterschied zwischen dem Substitutionseffekt und dem Einkommenseffekt bei einer Preiserhöhung.",
 sample:"Substitutionseffekt: Bei einer Preiserhöhung wird das Gut relativ teurer im Vergleich zu Alternativen. Konsumenten ersetzen es teilweise durch günstigere Substitute.\n\nEinkommenseffekt: Bei einer Preiserhöhung sinkt die reale Kaufkraft des Einkommens. Konsumenten können sich insgesamt weniger leisten und reduzieren daher die Nachfrage.\n\nBeide Effekte wirken in dieselbe Richtung und erklären zusammen, warum die Nachfragekurve fallend verläuft.",
 explain:"Der Substitutionseffekt betrifft die relative Preisänderung (Tauschverhältnis), der Einkommenseffekt die Kaufkraft. Bei normalen Gütern wirken beide nachfragemindernd bei einer Preiserhöhung."},

{id:"a13", topic:"angebot_nachfrage", type:"mc", diff:2, tax:"K2",
 q:"Was sind «Opportunitätskosten»?",
 options:[
   {v:"A", t:"Der entgangene Nutzen der besten nicht gewählten Alternative."},
   {v:"B", t:"Die tatsächlichen Produktionskosten eines Gutes."},
   {v:"C", t:"Die Kosten, die durch staatliche Regulierung entstehen."},
   {v:"D", t:"Die Differenz zwischen Einkaufs- und Verkaufspreis."}
 ],
 correct:"A",
 explain:"Opportunitätskosten messen den Wert der besten Alternative, auf die man verzichtet. Beispiel: Wenn Sie sich für ein Konzertticket zu CHF 80 entscheiden statt für ein Essen zu CHF 80, sind die Opportunitätskosten des Konzerts der entgangene Genuss des Essens."},

{id:"a14", topic:"angebot_nachfrage", type:"fill", diff:1, tax:"K1",
 q:"Der Preis, zu dem ein Gut auf dem Markt gehandelt wird, heisst {0} Preis. Der Preis eines Gutes im Vergleich zu anderen Gütern heisst {1} Preis.",
 blanks:[
   {answer:"absoluter", alts:["nominaler"]},
   {answer:"relativer", alts:["realer"]}
 ],
 explain:"Absolute (nominale) Preise werden in Geldeinheiten gemessen (z.B. CHF 5). Relative Preise drücken das Tauschverhältnis aus: Wie viele Einheiten eines anderen Gutes muss man aufgeben? Für Konsumenten sind relative Preise entscheidend."},

{id:"a15", topic:"angebot_nachfrage", type:"tf", diff:2, tax:"K2",
 q:"Ein Markt im ökonomischen Sinne erfordert immer einen physischen Ort, an dem sich Käufer und Verkäufer treffen.",
 correct:false,
 explain:"Falsch. Ein Markt ist der Ort des freiwilligen Tauschs zwischen mindestens zwei Teilnehmenden — er kann auch virtuell sein (z.B. Online-Handel, Börse). Entscheidend ist das Zusammentreffen von Angebot und Nachfrage, nicht der physische Ort."},

{id:"a16", topic:"angebot_nachfrage", type:"mc", diff:1, tax:"K2",
 img:{src:"img/vwl/markteffizienz/angebot_nachfrage_grunddiagramm.svg", alt:"Preis-Mengen-Diagramm mit Angebots- und Nachfragekurve"},
 q:"Betrachten Sie das Diagramm. Die rot eingezeichnete Kurve (N) und die blau eingezeichnete Kurve (A) schneiden sich im Punkt E. Was stellt der Punkt E dar?",
 options:[
   {v:"A", t:"Das Marktgleichgewicht — bei Preis P* wird genau die Menge Q* angeboten und nachgefragt."},
   {v:"B", t:"Den Höchstpreis — der Staat legt fest, dass der Preis nicht über P* steigen darf."},
   {v:"C", t:"Den Mindestlohn — der Preis darf nicht unter P* fallen."},
   {v:"D", t:"Den Break-Even-Punkt des Unternehmens."}
 ], correct:"A",
 explain:"Der Schnittpunkt von Angebots- und Nachfragekurve ist das Marktgleichgewicht. Beim Gleichgewichtspreis P* stimmen angebotene und nachgefragte Menge überein (Q*). Es gibt weder Überschuss noch Mangel. Bei vollkommener Konkurrenz pendelt sich der Marktpreis von selbst auf dieses Niveau ein."},
// ── MARKTGLEICHGEWICHT & PREISBILDUNG (g01–g14) ──
{id:"g01", topic:"gleichgewicht", type:"mc", diff:1, tax:"K1",
 q:"Wann herrscht Marktgleichgewicht?",
 options:[
   {v:"A", t:"Wenn die nachgefragte Menge der angebotenen Menge entspricht."},
   {v:"B", t:"Wenn der Staat den Preis festlegt."},
   {v:"C", t:"Wenn kein Unternehmen Gewinn macht."},
   {v:"D", t:"Wenn die Nachfragekurve steigend verläuft."}
 ],
 correct:"A",
 explain:"Im Marktgleichgewicht stimmen angebotene und nachgefragte Menge überein. Der zugehörige Preis ist der Gleichgewichtspreis (P*), die zugehörige Menge die Gleichgewichtsmenge (Q*). Es gibt weder einen Überschuss noch einen Mangel."},

{id:"g02", topic:"gleichgewicht", type:"tf", diff:1, tax:"K1",
 q:"Beim Gleichgewichtspreis gibt es weder einen Angebotsüberschuss noch einen Nachfrageüberschuss.",
 correct:true,
 explain:"Korrekt. Im Gleichgewicht schneiden sich Angebots- und Nachfragekurve. Die angebotene Menge entspricht exakt der nachgefragten Menge — der Markt ist geräumt."},

{id:"g03", topic:"gleichgewicht", type:"mc", diff:2, tax:"K2",
 img:{src:"img/vwl/markteffizienz/ueberschuss_preis_ueber_gleichgewicht.svg", alt:"Preis-Mengen-Diagramm bei P₁ über dem Gleichgewichtspreis"},
 q:"Was passiert, wenn der Marktpreis über dem Gleichgewichtspreis liegt?",
 options:[
   {v:"A", t:"Es entsteht ein Angebotsüberschuss — Produzenten bieten mehr an, als nachgefragt wird."},
   {v:"B", t:"Es entsteht ein Nachfrageüberschuss — Konsumenten wollen mehr kaufen, als angeboten wird."},
   {v:"C", t:"Der Markt ist im Gleichgewicht."},
   {v:"D", t:"Die Angebotskurve verschiebt sich nach links."}
 ],
 correct:"A",
 explain:"Bei einem Preis über dem Gleichgewicht ist die angebotene Menge grösser als die nachgefragte → Angebotsüberschuss. Die Folge: Lagerbestände wachsen, Produzenten senken den Preis, bis das Gleichgewicht erreicht wird."},

{id:"g04", topic:"gleichgewicht", type:"mc", diff:2, tax:"K2",
 img:{src:"img/vwl/markteffizienz/hoechstpreis_diagramm.svg", alt:"Preis-Mengen-Diagramm bei einem Höchstpreis P_H"},
 q:"Was passiert, wenn der Marktpreis unter dem Gleichgewichtspreis liegt?",
 options:[
   {v:"A", t:"Es entsteht ein Nachfrageüberschuss (Mangel)."},
   {v:"B", t:"Es entsteht ein Angebotsüberschuss (Überproduktion)."},
   {v:"C", t:"Die Nachfragekurve verschiebt sich nach links."},
   {v:"D", t:"Die Produzenten erhöhen die Produktionskosten."}
 ],
 correct:"A",
 explain:"Bei einem Preis unter dem Gleichgewicht übersteigt die nachgefragte Menge das Angebot → Nachfrageüberschuss (Knappheit). Die Folge: Konsumenten konkurrieren um das knappe Gut, der Preis steigt."},

{id:"g05", topic:"gleichgewicht", type:"mc", diff:1, tax:"K1",
 q:"Welche Voraussetzungen gelten im Modell der vollkommenen Konkurrenz?",
 options:[
   {v:"A", t:"Viele Anbieter und Nachfrager, homogene Güter, freier Marktzutritt, vollständige Information."},
   {v:"B", t:"Ein Anbieter kontrolliert den gesamten Markt."},
   {v:"C", t:"Der Staat legt alle Preise fest."},
   {v:"D", t:"Güter sind stark differenziert und Werbung ist entscheidend."}
 ],
 correct:"A",
 explain:"Vollkommene Konkurrenz ist ein Idealmodell mit vier Kernbedingungen: (1) Viele kleine Anbieter und Nachfrager (kein Einzelner kann den Preis beeinflussen), (2) homogene (identische) Güter, (3) freier Marktzutritt und -austritt, (4) vollständige Markttransparenz."},

{id:"g06", topic:"gleichgewicht", type:"fill", diff:1, tax:"K1",
 q:"Wenn die nachgefragte Menge das Angebot übersteigt, spricht man von einem {0}. Wenn das Angebot die Nachfrage übersteigt, spricht man von einem {1}.",
 blanks:[
   {answer:"Nachfrageüberschuss", alts:["Mangel","Nachfrageüberhang","Engpass"]},
   {answer:"Angebotsüberschuss", alts:["Überangebot","Überschuss"]}
 ],
 explain:"Nachfrageüberschuss (Mangel) entsteht bei zu niedrigen Preisen, Angebotsüberschuss bei zu hohen Preisen. In beiden Fällen tendiert der Markt zurück zum Gleichgewicht."},

{id:"g07", topic:"gleichgewicht", type:"open", diff:2, tax:"K3",
 q:"Ein Staat führt einen Höchstpreis für Mietwohnungen ein, der unter dem Gleichgewichtspreis liegt. Erklären Sie die Auswirkungen auf den Wohnungsmarkt.",
 sample:"Ein Höchstpreis unter dem Gleichgewichtspreis führt zu einem Nachfrageüberschuss auf dem Wohnungsmarkt:\n\n– Nachfrage: Durch den niedrigeren Preis steigt die nachgefragte Menge (mehr Menschen suchen günstige Wohnungen).\n– Angebot: Durch den niedrigeren Preis sinkt das Angebot (weniger Investitionen in Neubau, Vermieter ziehen Wohnungen vom Markt).\n– Folge: Wohnungsmangel, lange Wartelisten, Schwarzmarkt.\n– Die Wohlfahrt sinkt, weil weniger Transaktionen stattfinden als im Gleichgewicht.",
 explain:"Preisregulierungen unter dem Gleichgewicht verhindern die Räumung des Marktes. Kurzfristig profitieren Mieter, die eine Wohnung finden. Langfristig verschärft sich der Mangel."},

{id:"g08", topic:"gleichgewicht", type:"mc", diff:2, tax:"K3",
 q:"Ein Mindestpreis wird oberhalb des Gleichgewichtspreises auf dem Arbeitsmarkt eingeführt (Mindestlohn). Was ist die Folge?",
 options:[
   {v:"A", t:"Es entsteht ein Angebotsüberschuss an Arbeit (Arbeitslosigkeit)."},
   {v:"B", t:"Es entsteht ein Nachfrageüberschuss nach Arbeit (Fachkräftemangel)."},
   {v:"C", t:"Der Markt bleibt im Gleichgewicht."},
   {v:"D", t:"Die Löhne sinken unter den Mindestlohn."}
 ],
 correct:"A",
 explain:"Auf dem Arbeitsmarkt bieten Arbeitnehmende ihre Arbeit an (Angebot) und Unternehmen fragen Arbeit nach (Nachfrage). Ein Mindestlohn über dem Gleichgewicht bedeutet: Mehr Menschen wollen arbeiten (Angebot steigt), aber Unternehmen fragen weniger Arbeit nach → Arbeitslosigkeit."},

{id:"g09", topic:"gleichgewicht", type:"tf", diff:2, tax:"K2",
 q:"Im Modell der vollkommenen Konkurrenz ist jeder Marktteilnehmer ein Preisnehmer — kein einzelner Anbieter oder Nachfrager kann den Marktpreis beeinflussen.",
 correct:true,
 explain:"Korrekt. Weil es viele kleine Marktteilnehmer gibt und die Güter homogen sind, muss jeder den herrschenden Marktpreis akzeptieren. Wer über dem Marktpreis anbietet, verkauft nichts; wer darunter anbietet, macht unnötig weniger Gewinn."},

{id:"g10", topic:"gleichgewicht", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Marktformen nach der Anzahl Anbieter — von wenigen zu vielen.",
 categories:["Ein Anbieter", "Wenige Anbieter", "Viele Anbieter"],
 items:[
   {t:"Monopol (z.B. lokaler Wasserversorger)", cat:0},
   {t:"Oligopol (z.B. Mobilfunkanbieter in der Schweiz)", cat:1},
   {t:"Vollkommene Konkurrenz (z.B. Weizenmarkt)", cat:2},
   {t:"Monopolistische Konkurrenz (z.B. Restaurants)", cat:2}
 ],
 explain:"Monopol = ein Anbieter, Oligopol = wenige Anbieter, monopolistische Konkurrenz = viele Anbieter mit differenzierten Produkten, vollkommene Konkurrenz = viele Anbieter mit homogenen Produkten. Monopolistische Konkurrenz liegt näher bei «vielen Anbietern» als beim Oligopol."},

{id:"g11", topic:"gleichgewicht", type:"mc", diff:2, tax:"K2",
 q:"Was unterscheidet ein Monopol von vollkommener Konkurrenz hinsichtlich Preis und Menge?",
 options:[
   {v:"A", t:"Ein Monopolist setzt einen höheren Preis und bietet eine geringere Menge an."},
   {v:"B", t:"Ein Monopolist setzt einen niedrigeren Preis und bietet eine grössere Menge an."},
   {v:"C", t:"Preis und Menge sind in beiden Marktformen identisch."},
   {v:"D", t:"Ein Monopolist maximiert die Wohlfahrt statt den Gewinn."}
 ],
 correct:"A",
 explain:"Ein Monopolist beschränkt die Menge, um den Preis zu erhöhen und seinen Gewinn zu maximieren. Die Menge liegt unter der effizienten Gleichgewichtsmenge, der Preis darüber. Dadurch entsteht ein Wohlfahrtsverlust (Deadweight Loss)."},

{id:"g12", topic:"gleichgewicht", type:"open", diff:3, tax:"K4",
 q:"Erklären Sie, warum der Marktmechanismus in der Tendenz zum Gleichgewicht führt. Verwenden Sie das Konzept des Angebotsüberschusses und des Nachfrageüberschusses.",
 sample:"Beim Angebotsüberschuss (Preis über Gleichgewicht) können Produzenten nicht alles verkaufen. Um Lagerbestände abzubauen, senken sie den Preis. Der sinkende Preis erhöht die nachgefragte Menge und verringert das Angebot, bis Angebot = Nachfrage.\n\nBeim Nachfrageüberschuss (Preis unter Gleichgewicht) übersteigt die Nachfrage das Angebot. Konsumenten konkurrieren um knappe Güter und sind bereit, mehr zu zahlen. Der steigende Preis erhöht das Angebot und reduziert die Nachfrage, bis Gleichgewicht herrscht.\n\nDieser Preismechanismus wird als «unsichtbare Hand» (Adam Smith) bezeichnet.",
 explain:"Das Gleichgewichtskonzept beschreibt eine Tendenz, nicht einen Zustand, der sofort erreicht wird. In der Realität können Anpassungsprozesse Zeit brauchen und durch Marktunvollkommenheiten gestört werden."},

{id:"g13", topic:"gleichgewicht", type:"tf", diff:1, tax:"K1",
 q:"Homogenität bedeutet, dass die angebotenen Güter aus Sicht der Nachfrager identisch und austauschbar sind.",
 correct:true,
 explain:"Korrekt. Homogene Güter sind nicht unterscheidbar — z.B. Weizen einer bestimmten Sorte. Bei heterogenen (differenzierten) Gütern wie Smartphones unterscheiden sich die Produkte in Qualität, Design oder Marke."},

{id:"g14", topic:"gleichgewicht", type:"calc", diff:2, tax:"K3",
 q:"Gegeben sind folgende Funktionen: Nachfrage: P = 100 − 2Q; Angebot: P = 20 + Q. Berechnen Sie:",
 rows:[
   {label:"Gleichgewichtsmenge Q*", answer:26.67, tolerance:0.1, unit:"Einheiten"},
   {label:"Gleichgewichtspreis P*", answer:46.67, tolerance:0.1, unit:"CHF"}
 ],
 explain:"Im Gleichgewicht gilt: Nachfrage = Angebot → 100 − 2Q = 20 + Q → 80 = 3Q → Q* ≈ 26.67. Einsetzen: P* = 20 + 26.67 ≈ 46.67 CHF."},

{id:"g15", topic:"gleichgewicht", type:"mc", diff:2, tax:"K3",
 img:{src:"img/vwl/markteffizienz/ueberschuss_preis_ueber_gleichgewicht.svg", alt:"Preis-Mengen-Diagramm bei P₁ über dem Gleichgewichtspreis"},
 q:"Das Diagramm zeigt einen Preis P₁ oberhalb des Gleichgewichtspreises. Was passiert bei diesem Preis auf dem Markt?",
 options:[
   {v:"A", t:"Es entsteht ein Angebotsüberschuss, weil die angebotene Menge (Q_A) grösser ist als die nachgefragte Menge (Q_N)."},
   {v:"B", t:"Es entsteht ein Nachfrageüberschuss, weil die nachgefragte Menge grösser ist als die angebotene Menge."},
   {v:"C", t:"Der Markt bleibt im Gleichgewicht, weil P₁ nur leicht über P* liegt."},
   {v:"D", t:"Die Angebotskurve verschiebt sich nach rechts, bis der Überschuss abgebaut ist."}
 ],
 correct:"A",
 explain:"Bei einem Preis P₁ über dem Gleichgewichtspreis bieten die Produzenten mehr an (Q_A), als die Konsumenten nachfragen (Q_N). Die Differenz Q_A − Q_N ist der Angebotsüberschuss (gelbe Strecke im Diagramm). In einem freien Markt würde dieser Überschuss den Preis nach unten drücken, bis das Gleichgewicht erreicht ist."},

{id:"g16", topic:"gleichgewicht", type:"mc", diff:2, tax:"K4",
 img:{src:"img/vwl/markteffizienz/hoechstpreis_flaechen_abcd.svg", alt:"Höchstpreisdiagramm mit beschrifteten Flächen A–D"},
 q:"Der Staat führt einen Höchstpreis P_H unterhalb des Gleichgewichtspreises ein. Es wird nur Q_A gehandelt (Angebotsseite bestimmt die Menge). Welche Fläche wurde von den Produzenten zu den Konsumenten umverteilt?",
 options:[
   {v:"A", t:"Fläche A"},
   {v:"B", t:"Fläche B"},
   {v:"C", t:"Fläche C"},
   {v:"D", t:"Fläche D"}
 ],
 correct:"B",
 explain:"Fläche B war vor dem Höchstpreis Teil der Produzentenrente (sie lag zwischen P* und dem tieferen Bereich). Durch den Höchstpreis P_H sinkt der Preis, und Fläche B wird von den Produzenten zu den Konsumenten transferiert. Die Konsumentenrente besteht nun aus A + B. Allerdings geht gleichzeitig Fläche C als Wohlfahrtsverlust verloren, weil weniger gehandelt wird."},
{id:"g17", topic:"gleichgewicht", type:"mc", diff:3, tax:"K4",
 img:{src:"img/vwl/markteffizienz/hoechstpreis_flaechen_abcd.svg", alt:"Höchstpreisdiagramm mit beschrifteten Flächen A–D"},
 q:"Was passiert mit der Gesamtwohlfahrt durch den Höchstpreis P_H?",
 options:[
   {v:"A", t:"Sie bleibt gleich, weil B lediglich umverteilt wird."},
   {v:"B", t:"Sie sinkt um die Fläche C (Wohlfahrtsverlust)."},
   {v:"C", t:"Sie sinkt um die Flächen B + C."},
   {v:"D", t:"Sie steigt, weil die Konsumenten profitieren."}
 ],
 correct:"B",
 explain:"Vorher: Gesamtwohlfahrt = KR + PR = A + B + C + D. Nachher: KR = A + B, PR = D, Wohlfahrtsverlust = C. Die Fläche B wird lediglich umverteilt (von PR zu KR), aber C geht unwiederbringlich verloren, weil Einheiten zwischen Q_A und Q* nicht mehr gehandelt werden. Die Gesamtwohlfahrt sinkt also um C."},
{id:"g18", topic:"gleichgewicht", type:"multi", diff:2, tax:"K4",
 img:{src:"img/vwl/markteffizienz/hoechstpreis_flaechen_abcd.svg", alt:"Höchstpreisdiagramm mit beschrifteten Flächen A–D"},
 q:"Der Staat führt einen Höchstpreis P_H ein. Welche Flächen bilden die Konsumentenrente nach dem Eingriff?",
 options:[
   {v:"A", t:"Fläche A"},
   {v:"B", t:"Fläche B"},
   {v:"C", t:"Fläche C"},
   {v:"D", t:"Fläche D"}
 ],
 correct:["A","B"],
 explain:"Die Konsumentenrente nach dem Höchstpreis besteht aus A + B. Fläche A war schon vorher Teil der KR (Dreieck oberhalb P* bis zur Nachfragekurve, links von Q_A). Fläche B wurde von den Produzenten umverteilt — sie war vorher Teil der PR, geht aber durch den tieferen Preis P_H an die Konsumenten. Fläche C geht als Wohlfahrtsverlust verloren, D bleibt als (geschrumpfte) Produzentenrente."},

// ── KURVENVERSCHIEBUNGEN & ELASTIZITÄT (v01–v14) ──
{id:"v01", topic:"verschiebungen", type:"mc", diff:2, tax:"K2",
 q:"Was ist der Unterschied zwischen einer Bewegung auf der Nachfragekurve und einer Verschiebung der Nachfragekurve?",
 options:[
   {v:"A", t:"Eine Bewegung wird durch eine Preisänderung des Gutes selbst verursacht; eine Verschiebung durch Änderung anderer Einflussfaktoren."},
   {v:"B", t:"Eine Verschiebung wird durch eine Preisänderung des Gutes verursacht; eine Bewegung durch Einkommensänderungen."},
   {v:"C", t:"Es gibt keinen Unterschied, beide Begriffe bedeuten dasselbe."},
   {v:"D", t:"Eine Bewegung betrifft nur das Angebot, eine Verschiebung nur die Nachfrage."}
 ],
 correct:"A",
 explain:"Zentrale Unterscheidung: Ändert sich der Preis des Gutes selbst → Bewegung entlang der bestehenden Kurve. Ändert sich ein anderer Faktor (Einkommen, Präferenzen, Preise anderer Güter) → die gesamte Kurve verschiebt sich."},

{id:"v02", topic:"verschiebungen", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie zu: Führen die folgenden Ereignisse zu einer Verschiebung der Nachfragekurve nach rechts oder nach links?",
 categories:["Nachfrage verschiebt sich nach rechts (steigt)", "Nachfrage verschiebt sich nach links (sinkt)"],
 items:[
   {t:"Das Einkommen der Konsumenten steigt (normales Gut)", cat:0},
   {t:"Ein neuer Modetrend macht das Gut beliebt", cat:0},
   {t:"Der Preis eines Substitutes sinkt", cat:1},
   {t:"Negative Berichte über Gesundheitsrisiken", cat:1},
   {t:"Bevölkerungswachstum", cat:0},
   {t:"Der Preis eines Komplementärgutes steigt", cat:1}
 ],
 explain:"Die Nachfrage steigt (Rechtsverschiebung) bei: höherem Einkommen (normales Gut), steigenden Präferenzen, steigendem Preis von Substituten, sinkendem Preis von Komplementen, Bevölkerungswachstum. Die Nachfrage sinkt (Linksverschiebung) bei umgekehrten Veränderungen."},

{id:"v03", topic:"verschiebungen", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie zu: Führen die folgenden Ereignisse zu einer Verschiebung der Angebotskurve nach rechts oder nach links?",
 categories:["Angebot verschiebt sich nach rechts (steigt)", "Angebot verschiebt sich nach links (sinkt)"],
 items:[
   {t:"Neue Produktionstechnologie senkt die Kosten", cat:0},
   {t:"Rohstoffpreise steigen", cat:1},
   {t:"Der Staat führt eine Produktionssteuer ein", cat:1},
   {t:"Subventionen für Produzenten", cat:0},
   {t:"Lohnerhöhungen in der Branche", cat:1}
 ],
 explain:"Das Angebot steigt (Rechtsverschiebung), wenn die Produktionskosten sinken (Technologie, Subventionen). Das Angebot sinkt (Linksverschiebung), wenn die Kosten steigen (Rohstoffe, Steuern, Löhne)."},

{id:"v04", topic:"verschiebungen", type:"mc", diff:2, tax:"K3",
 img:{src:"img/vwl/markteffizienz/angebot_nachfrage_grunddiagramm.svg", alt:"Preis-Mengen-Diagramm mit Angebots- und Nachfragekurve"},
 q:"Mountainbikes werden immer beliebter (steigende Wertschätzung). Was passiert ceteris paribus im Markt für Mountainbikes?",
 options:[
   {v:"A", t:"Die Nachfragekurve verschiebt sich nach rechts → Gleichgewichtspreis und -menge steigen."},
   {v:"B", t:"Die Angebotskurve verschiebt sich nach rechts → Gleichgewichtspreis sinkt."},
   {v:"C", t:"Die Nachfragekurve verschiebt sich nach links → Gleichgewichtspreis sinkt."},
   {v:"D", t:"Es findet nur eine Bewegung auf der Nachfragekurve statt."}
 ],
 correct:"A",
 explain:"Steigende Wertschätzung ist eine Änderung der Präferenzen — ein nicht-preislicher Faktor. Die gesamte Nachfragekurve verschiebt sich nach rechts. Im neuen Gleichgewicht sind sowohl Preis als auch Menge höher als zuvor."},

{id:"v05", topic:"verschiebungen", type:"open", diff:3, tax:"K4",
 q:"Der Preis für E-Autos sinkt durch technologischen Fortschritt in der Batterieproduktion. Analysieren Sie die Auswirkungen auf den Markt für (a) E-Autos und (b) Benzin.",
 sample:"(a) E-Autos: Der technologische Fortschritt senkt die Produktionskosten → die Angebotskurve verschiebt sich nach rechts → im neuen Gleichgewicht sinkt der Preis und die Menge steigt.\n\n(b) Benzin: E-Autos und Benzinautos sind Substitute. Wenn E-Autos günstiger werden, steigen viele Konsumenten um → die Nachfrage nach Benzin sinkt → die Nachfragekurve für Benzin verschiebt sich nach links → Preis und Menge von Benzin sinken.",
 explain:"Diese Aufgabe zeigt, wie Veränderungen in einem Markt über Substitutionsbeziehungen auf andere Märkte überspringen (Spillover-Effekte)."},

{id:"v06", topic:"verschiebungen", type:"mc", diff:1, tax:"K1",
 q:"Was misst die Preiselastizität der Nachfrage?",
 options:[
   {v:"A", t:"Wie stark die nachgefragte Menge auf eine Preisänderung reagiert."},
   {v:"B", t:"Wie stark der Preis auf eine Einkommensänderung reagiert."},
   {v:"C", t:"Wie stark das Angebot auf eine Kostenänderung reagiert."},
   {v:"D", t:"Wie schnell der Markt das Gleichgewicht erreicht."}
 ],
 correct:"A",
 explain:"Die Preiselastizität der Nachfrage = prozentuale Mengenänderung / prozentuale Preisänderung. Sie misst die Sensitivität der Nachfrage auf Preisänderungen. Eine elastische Nachfrage (>1) reagiert stark, eine unelastische (<1) reagiert schwach."},

{id:"v07", topic:"verschiebungen", type:"fill", diff:1, tax:"K1",
 q:"Eine Preiselastizität der Nachfrage grösser als 1 nennt man {0}. Eine Preiselastizität kleiner als 1 nennt man {1}.",
 blanks:[
   {answer:"elastisch", alts:["preiselastisch"]},
   {answer:"unelastisch", alts:["preisunelastisch"]}
 ],
 explain:"Elastisch (>1): Die Menge reagiert prozentual stärker als der Preis — typisch für Luxusgüter und Güter mit vielen Substituten. Unelastisch (<1): Die Menge reagiert schwächer als der Preis — typisch für Grundbedürfnisse und Güter ohne Alternativen (z.B. Benzin)."},

{id:"v08", topic:"verschiebungen", type:"calc", diff:2, tax:"K3",
 q:"Der Benzinpreis steigt um 10%. Die nachgefragte Menge sinkt um 4%. Berechnen Sie:",
 rows:[
   {label:"Preiselastizität der Nachfrage", answer:0.4, tolerance:0.01, unit:""},
   {label:"Ist die Nachfrage elastisch oder unelastisch? (1=elastisch, 0=unelastisch)", answer:0, tolerance:0, unit:""}
 ],
 explain:"Preiselastizität = 4% / 10% = 0.4. Da 0.4 < 1, ist die Nachfrage unelastisch. Das bedeutet: Benzin hat wenig Substitute, die Konsumenten reduzieren ihren Verbrauch bei Preiserhöhungen nur geringfügig."},

{id:"v09", topic:"verschiebungen", type:"tf", diff:2, tax:"K2",
 q:"Je mehr Substitutionsmöglichkeiten für ein Gut bestehen, desto unelastischer ist die Nachfrage.",
 correct:false,
 explain:"Falsch — es ist genau umgekehrt. Viele Substitute machen die Nachfrage elastischer, weil Konsumenten leicht auf Alternativen ausweichen können. Wenige Substitute (z.B. bei lebensnotwendigen Medikamenten) machen die Nachfrage unelastisch."},

{id:"v10", topic:"verschiebungen", type:"mc", diff:2, tax:"K2",
 q:"Die Einkommenselastizität der Nachfrage nach Luxushandtaschen beträgt 2.5. Was bedeutet das?",
 options:[
   {v:"A", t:"Steigt das Einkommen um 1%, steigt die Nachfrage um 2.5% — es handelt sich um ein Luxusgut."},
   {v:"B", t:"Steigt das Einkommen um 1%, sinkt die Nachfrage um 2.5% — es handelt sich um ein inferiores Gut."},
   {v:"C", t:"Der Preis steigt um 2.5%, wenn das Einkommen um 1% steigt."},
   {v:"D", t:"Die Nachfrage ist unelastisch."}
 ],
 correct:"A",
 explain:"Eine Einkommenselastizität > 1 kennzeichnet ein Luxusgut: Die Nachfrage steigt überproportional zum Einkommen. Bei normalen Gütern liegt sie zwischen 0 und 1, bei inferioren Gütern unter 0 (steigende Einkommen → sinkende Nachfrage)."},

{id:"v11", topic:"verschiebungen", type:"mc", diff:2, tax:"K3",
 img:{src:"img/vwl/markteffizienz/angebot_nachfrage_grunddiagramm.svg", alt:"Preis-Mengen-Diagramm mit Angebots- und Nachfragekurve"},
 q:"Die Nachfragekurve für Insulin verläuft sehr steil (nahezu senkrecht). Welche ökonomische Aussage trifft zu?",
 options:[
   {v:"A", t:"Die Nachfrage ist sehr unelastisch — Diabetiker brauchen Insulin unabhängig vom Preis."},
   {v:"B", t:"Die Nachfrage ist sehr elastisch — kleine Preisänderungen führen zu grossen Mengenänderungen."},
   {v:"C", t:"Das Angebot ist sehr unelastisch."},
   {v:"D", t:"Es handelt sich um ein Luxusgut."}
 ],
 correct:"A",
 explain:"Insulin ist lebensnotwendig und hat keine echten Substitute. Eine steile Nachfragekurve bedeutet: Selbst bei starken Preiserhöhungen ändert sich die nachgefragte Menge kaum. Die Preiselastizität liegt nahe bei null."},

{id:"v12", topic:"verschiebungen", type:"tf", diff:2, tax:"K2",
 q:"Wenn die Angebotskurve nach rechts verschoben wird (z.B. durch Technologiefortschritt) und die Nachfrage gleich bleibt, sinkt der Gleichgewichtspreis und die Gleichgewichtsmenge steigt.",
 correct:true,
 explain:"Korrekt. Eine Rechtsverschiebung des Angebots bedeutet, dass bei jedem Preis mehr angeboten wird. Bei gleichbleibender Nachfrage entsteht ein Angebotsüberschuss, der den Preis drückt. Im neuen Gleichgewicht: tieferer Preis, höhere Menge."},

{id:"v13", topic:"verschiebungen", type:"open", diff:3, tax:"K4",
 q:"Im Rahmen der US-Strafzölle 2025 werden 10% Importzölle auf chinesische Güter erhoben. Analysieren Sie mithilfe des Preis-Mengen-Diagramms die Auswirkungen auf den US-Markt für importierte Elektronik.",
 sample:"Ein Importzoll wirkt wie eine Erhöhung der Produktionskosten für ausländische Anbieter:\n\n1. Die Angebotskurve verschiebt sich nach links/oben (um den Betrag des Zolls).\n2. Im neuen Gleichgewicht steigt der Preis für die US-Konsumenten.\n3. Die importierte Menge sinkt.\n4. Inländische Produzenten profitieren, weil ihre Konkurrenz teurer geworden ist.\n5. Wohlfahrtseffekte: Konsumenten verlieren (höhere Preise), inländische Produzenten gewinnen, der Staat erhält Zolleinnahmen. Insgesamt entsteht ein Wohlfahrtsverlust (Deadweight Loss), weil weniger gehandelt wird als im Freihandel.",
 explain:"Zölle sind ein klassisches Beispiel für Wettbewerbsbeschränkungen durch den Staat. Sie schützen inländische Produzenten, reduzieren aber die gesamtwirtschaftliche Effizienz."},

{id:"v14", topic:"verschiebungen", type:"calc", diff:2, tax:"K3",
 q:"Die Preiselastizität des Angebots von Weizen beträgt 0.3. Wenn der Weizenpreis um 20% steigt, um wie viel Prozent verändert sich die angebotene Menge?",
 rows:[
   {label:"Mengenänderung", answer:6, tolerance:0.1, unit:"%"}
 ],
 explain:"Preiselastizität des Angebots = Mengenänderung (%) / Preisänderung (%). Also: Mengenänderung = 0.3 × 20% = 6%. Das Angebot von Weizen ist unelastisch — kurzfristig können Bauern ihre Produktion kaum ausweiten."},

{id:"v15", topic:"verschiebungen", type:"open", diff:2, tax:"K3",
 img:{src:"img/vwl/markteffizienz/nachfrageverschiebung_rechts.svg", alt:"Nachfrageverschiebung von N₁ nach N₂ (nach rechts)"},
 q:"Das Diagramm zeigt eine Verschiebung der Nachfragekurve von N₁ nach N₂. Beschreiben Sie: (a) Was könnte diese Verschiebung ausgelöst haben? (b) Wie verändern sich Gleichgewichtspreis und -menge?",
 sample:"(a) Mögliche Ursachen für eine Rechtsverschiebung der Nachfrage: Einkommenssteigerung (bei normalen Gütern), Änderung der Präferenzen zugunsten des Gutes, Preisanstieg bei Substitutionsgütern, Bevölkerungswachstum oder positive Zukunftserwartungen.\n\n(b) Im neuen Gleichgewicht E₂ sind sowohl der Preis (P₂ > P₁) als auch die Menge höher als vorher. Die Angebotskurve bleibt unverändert — Produzenten bieten bei höherem Preis mehr an (Bewegung auf der Angebotskurve).",
 explain:"Eine Nachfrageverschiebung nach rechts bedeutet: Bei jedem Preis wird mehr nachgefragt als zuvor. Da das Angebot kurzfristig unverändert bleibt, entsteht zunächst ein Nachfrageüberschuss, der den Preis nach oben treibt. Es stellt sich ein neues Gleichgewicht mit höherem Preis UND höherer Menge ein."},
// ── WOHLFAHRT & EFFIZIENZ (w01–w12) ──
{id:"w01", topic:"wohlfahrt", type:"mc", diff:1, tax:"K1",
 img:{src:"img/vwl/markteffizienz/konsumenten_produzentenrente.svg", alt:"Konsumentenrente (KR) und Produzentenrente (PR) im Gleichgewicht"},
 q:"Was ist die Konsumentenrente?",
 options:[
   {v:"A", t:"Die Differenz zwischen der Zahlungsbereitschaft und dem tatsächlich bezahlten Marktpreis."},
   {v:"B", t:"Der Gewinn der Produzenten nach Abzug aller Kosten."},
   {v:"C", t:"Die Steuereinnahmen des Staates aus dem Gütermarkt."},
   {v:"D", t:"Die Differenz zwischen Angebots- und Nachfragekurve."}
 ],
 correct:"A",
 explain:"Die Konsumentenrente (KR) misst den Vorteil der Käufer: Sie hätten mehr bezahlt, als sie tatsächlich müssen. Grafisch: Fläche zwischen Nachfragekurve und Gleichgewichtspreis (Dreieck oberhalb der Preislinie)."},

{id:"w02", topic:"wohlfahrt", type:"mc", diff:1, tax:"K1",
 q:"Was ist die Produzentenrente?",
 options:[
   {v:"A", t:"Die Differenz zwischen dem erhaltenen Marktpreis und den minimalen Kosten, zu denen Produzenten gerade noch verkaufen würden."},
   {v:"B", t:"Der Umsatz der Produzenten."},
   {v:"C", t:"Die Differenz zwischen dem höchsten und niedrigsten Preis im Markt."},
   {v:"D", t:"Die Kosten der Produktion."}
 ],
 correct:"A",
 explain:"Die Produzentenrente (PR) misst den Vorteil der Verkäufer: Sie erhalten mehr, als sie mindestens benötigen. Grafisch: Fläche zwischen Gleichgewichtspreis und Angebotskurve (Dreieck unterhalb der Preislinie)."},

{id:"w03", topic:"wohlfahrt", type:"fill", diff:1, tax:"K1",
 q:"Die Gesamtwohlfahrt (Gesamtrente) ergibt sich aus der Summe von {0} und {1}.",
 blanks:[
   {answer:"Konsumentenrente", alts:["KR"]},
   {answer:"Produzentenrente", alts:["PR"]}
 ],
 explain:"Die Gesamtwohlfahrt = Konsumentenrente + Produzentenrente. Im Gleichgewicht bei vollkommener Konkurrenz wird diese Gesamtrente maximiert — das ist das Effizienzkriterium."},

{id:"w04", topic:"wohlfahrt", type:"tf", diff:2, tax:"K2",
 q:"Im Marktgleichgewicht bei vollkommener Konkurrenz ist die Gesamtwohlfahrt (Summe aus KR und PR) maximal.",
 correct:true,
 explain:"Korrekt. Im Gleichgewicht wird so lange produziert und konsumiert, bis die Zahlungsbereitschaft des letzten Käufers genau den Grenzkosten des letzten Verkäufers entspricht. Jede Abweichung (z.B. durch Steuern, Monopol oder Preisregulierung) verkleinert die Gesamtrente."},

{id:"w05", topic:"wohlfahrt", type:"mc", diff:2, tax:"K2",
 img:{src:"img/vwl/markteffizienz/steuerkeil_diagramm.svg", alt:"Preis-Mengen-Diagramm mit Steuerkeil"},
 q:"Was versteht man unter einem Wohlfahrtsverlust (Deadweight Loss)?",
 options:[
   {v:"A", t:"Der Teil der Gesamtrente, der durch Marktverzerrungen verloren geht — er kommt niemandem zugute."},
   {v:"B", t:"Die Steuereinnahmen des Staates."},
   {v:"C", t:"Die Umverteilung von Konsumenten- zu Produzentenrente."},
   {v:"D", t:"Der Gesamtverlust des BIP durch Rezession."}
 ],
 correct:"A",
 explain:"Ein Wohlfahrtsverlust entsteht, wenn die gehandelte Menge vom Gleichgewicht abweicht. Transaktionen, die für beide Seiten vorteilhaft wären, finden nicht statt. Dieser Verlust geht an niemanden — er ist schlicht verschwendete Wohlfahrt."},

{id:"w06", topic:"wohlfahrt", type:"mc", diff:2, tax:"K2",
 q:"Was versteht man unter Pareto-Effizienz?",
 options:[
   {v:"A", t:"Eine Situation, in der niemand bessergestellt werden kann, ohne jemand anderen schlechter zu stellen."},
   {v:"B", t:"Eine Situation, in der alle gleich viel haben."},
   {v:"C", t:"Eine Situation, in der der Staat die Wohlfahrt maximiert."},
   {v:"D", t:"Eine Situation, in der 80% des Reichtums 20% der Bevölkerung gehören."}
 ],
 correct:"A",
 explain:"Pareto-Effizienz (benannt nach Vilfredo Pareto) bedeutet: Keine Umverteilung kann jemanden besserstellen, ohne gleichzeitig jemand anderen schlechter zu stellen. Das Marktgleichgewicht bei vollkommener Konkurrenz ist pareto-effizient — aber nicht unbedingt «gerecht»."},

{id:"w07", topic:"wohlfahrt", type:"tf", diff:2, tax:"K2",
 q:"Pareto-Effizienz bedeutet, dass die Ressourcen gerecht verteilt sind.",
 correct:false,
 explain:"Falsch. Pareto-Effizienz sagt nichts über Gerechtigkeit aus. Eine Situation, in der eine Person alles besitzt und alle anderen nichts, kann pareto-effizient sein — weil eine Umverteilung die reiche Person schlechter stellen würde. Effizienz und Gerechtigkeit sind unterschiedliche Massstäbe."},

{id:"w08", topic:"wohlfahrt", type:"open", diff:3, tax:"K4",
 q:"Erklären Sie, warum ein Monopol zu einem Wohlfahrtsverlust führt. Vergleichen Sie die Situation mit dem Gleichgewicht bei vollkommener Konkurrenz.",
 sample:"Bei vollkommener Konkurrenz wird die Menge produziert, bei der Zahlungsbereitschaft = Grenzkosten. Die Gesamtrente (KR + PR) ist maximal.\n\nBeim Monopol: Der Monopolist maximiert seinen Gewinn, indem er die Menge reduziert und den Preis erhöht. Dadurch:\n- Die Konsumentenrente sinkt (höherer Preis, weniger Konsum).\n- Die Produzentenrente kann steigen (höhere Marge).\n- Es entsteht ein Wohlfahrtsverlust: Transaktionen, die bei Wettbewerb stattfänden (Zahlungsbereitschaft > Grenzkosten), werden verhindert.\n\nDer Wohlfahrtsverlust ist die Fläche des Dreiecks zwischen Nachfragekurve, Grenzkostenkurve und der Monopolmenge.",
 explain:"Kernargument: Der Monopolist produziert weniger als die effiziente Menge, weil er durch Mengenverknappung den Preis erhöhen kann. Das ist das zentrale Effizienzproblem von Marktmacht."},

{id:"w09", topic:"wohlfahrt", type:"tf", diff:2, tax:"K2",
 q:"Preisdifferenzierung (z.B. unterschiedliche Preise für Studierende, Seniorinnen und Erwerbstätige) ist immer wohlfahrtsschädigend.",
 correct:false,
 explain:"Falsch. Preisdifferenzierung kann die Wohlfahrt sogar erhöhen, wenn sie dazu führt, dass mehr Konsumenten bedient werden als bei einem Einheitspreis. Eine vollständige Preisdifferenzierung (jeder zahlt seine maximale Zahlungsbereitschaft) eliminiert sogar den Wohlfahrtsverlust des Monopols — allerdings geht die gesamte Rente an den Produzenten."},

{id:"w10", topic:"wohlfahrt", type:"mc", diff:3, tax:"K4",
 q:"Ein Höchstpreis unter dem Gleichgewicht führt zu einem Wohlfahrtsverlust. Welche Aussage ist korrekt?",
 options:[
   {v:"A", t:"Der Wohlfahrtsverlust entsteht, weil weniger Transaktionen stattfinden als im Gleichgewicht."},
   {v:"B", t:"Der Wohlfahrtsverlust entsteht, weil der Preis zu hoch ist."},
   {v:"C", t:"Es gibt keinen Wohlfahrtsverlust, weil die Konsumenten vom niedrigen Preis profitieren."},
   {v:"D", t:"Der Wohlfahrtsverlust entsteht nur, wenn der Staat Verluste macht."}
 ],
 correct:"A",
 explain:"Der Höchstpreis reduziert das Angebot unter die Gleichgewichtsmenge. Dadurch finden Transaktionen nicht statt, die für beide Seiten vorteilhaft wären (Zahlungsbereitschaft > Grenzkosten). Die Fläche des entgangenen Handels ist der Wohlfahrtsverlust."},

{id:"w11", topic:"wohlfahrt", type:"open", diff:3, tax:"K5",
 q:"Beurteilen Sie: «Der freie Markt führt immer zum besten Ergebnis für die Gesellschaft.» Nehmen Sie Stellung zu dieser Aussage.",
 sample:"Die Aussage ist zu vereinfachend. Der freie Markt bei vollkommener Konkurrenz maximiert zwar die Gesamtwohlfahrt (Pareto-Effizienz), aber:\n\n1. Effizienz ≠ Gerechtigkeit: Die Verteilung kann sehr ungleich sein.\n2. Marktversagen: Externe Effekte, öffentliche Güter, asymmetrische Information und Marktmacht verhindern effiziente Ergebnisse.\n3. Meritorische Güter: Manche Güter (Bildung, Gesundheit) sollten aus gesellschaftlichen Gründen stärker bereitgestellt werden, als es der Markt tun würde.\n\nDer Markt ist ein leistungsfähiger Koordinationsmechanismus, aber kein Allheilmittel. In vielen Bereichen sind staatliche Eingriffe notwendig — die Frage ist, ob diese zu besseren Ergebnissen führen als der Markt (→ Thema Staatsversagen).",
 explain:"Diese Frage erfordert eine differenzierte Beurteilung (K5). Weder «Markt regelt alles» noch «der Staat muss überall eingreifen» ist eine befriedigende Antwort."},

{id:"w12", topic:"wohlfahrt", type:"fill", diff:2, tax:"K2",
 q:"Die Konsumentenrente wird grafisch im Preis-Mengen-Diagramm als Fläche zwischen der {0} und dem {1} dargestellt.",
 blanks:[
   {answer:"Nachfragekurve", alts:["Nachfrage"]},
   {answer:"Gleichgewichtspreis", alts:["Marktpreis","Preis"]}
 ],
 explain:"Die Konsumentenrente ist das Dreieck oberhalb des Gleichgewichtspreises und unterhalb der Nachfragekurve. Je grösser dieses Dreieck, desto mehr profitieren die Konsumenten vom Tausch."},

{id:"w13", topic:"wohlfahrt", type:"mc", diff:2, tax:"K2",
 img:{src:"img/vwl/markteffizienz/konsumenten_produzentenrente.svg", alt:"Konsumentenrente (KR) und Produzentenrente (PR) im Preis-Mengen-Diagramm"},
 q:"Das Diagramm zeigt die Konsumentenrente (KR) und die Produzentenrente (PR) im Marktgleichgewicht. Welche Aussage zur Gesamtwohlfahrt ist korrekt?",
 options:[
   {v:"A", t:"Die Gesamtwohlfahrt entspricht der Summe aus Konsumentenrente und Produzentenrente (KR + PR)."},
   {v:"B", t:"Die Gesamtwohlfahrt entspricht nur der Konsumentenrente, da die Konsumenten den Nutzen haben."},
   {v:"C", t:"Die Gesamtwohlfahrt ist im Gleichgewicht immer null, weil sich KR und PR aufheben."},
   {v:"D", t:"Die Gesamtwohlfahrt kann nicht grafisch dargestellt werden."}
 ],
 correct:"A",
 explain:"Im Marktgleichgewicht ist die Gesamtwohlfahrt maximal und entspricht der Summe von Konsumentenrente (KR = Dreieck über dem Gleichgewichtspreis zwischen Nachfragekurve und P*) und Produzentenrente (PR = Dreieck unter P* zwischen P* und Angebotskurve). Ein Eingriff in den Markt (z.B. Höchstpreis, Steuer) reduziert die Gesamtwohlfahrt."},

{id:"w14", topic:"wohlfahrt", type:"multi", diff:2, tax:"K3",
 img:{src:"img/vwl/markteffizienz/steuer_flaechen_abcdef.svg", alt:"Steuerdiagramm mit beschrifteten Flächen A–F"},
 q:"Im Diagramm ist eine Mengensteuer (Stücksteuer) eingezeichnet. Welche Flächen entsprechen den Steuereinnahmen des Staates?",
 options:[
   {v:"A", t:"Fläche A"},
   {v:"B", t:"Fläche B"},
   {v:"C", t:"Fläche C"},
   {v:"D", t:"Fläche D"},
   {v:"E", t:"Fläche E"},
   {v:"F", t:"Fläche F"}
 ],
 correct:["B","D"],
 explain:"Die Steuereinnahmen entsprechen den Flächen B und D. Die Steuer treibt einen Keil (t) zwischen Konsumentenpreis (P_K) und Produzentenpreis (P_P). Das Steueraufkommen ergibt sich aus dem Steuersatz t multipliziert mit der gehandelten Menge Q_t, also das Rechteck B + D. Fläche B war vorher Teil der Konsumentenrente, Fläche D Teil der Produzentenrente — beide gehen nun an den Staat."},
{id:"w15", topic:"wohlfahrt", type:"multi", diff:2, tax:"K3",
 img:{src:"img/vwl/markteffizienz/steuer_flaechen_abcdef.svg", alt:"Steuerdiagramm mit beschrifteten Flächen A–F"},
 q:"Welche Flächen stellen den Wohlfahrtsverlust (Deadweight Loss) durch die Steuer dar?",
 options:[
   {v:"A", t:"Fläche A"},
   {v:"B", t:"Fläche B"},
   {v:"C", t:"Fläche C"},
   {v:"D", t:"Fläche D"},
   {v:"E", t:"Fläche E"},
   {v:"F", t:"Fläche F"}
 ],
 correct:["C","E"],
 explain:"Die Flächen C und E bilden den Wohlfahrtsverlust (Deadweight Loss). Durch die Steuer wird die gehandelte Menge von Q* auf Q_t reduziert. Die Dreiecke C (entgangene KR) und E (entgangene PR) gehen an niemanden — weder an Konsumenten, Produzenten noch an den Staat. Sie sind unwiederbringlich verloren."},
{id:"w16", topic:"wohlfahrt", type:"mc", diff:3, tax:"K4",
 img:{src:"img/vwl/markteffizienz/steuer_flaechen_abcdef.svg", alt:"Steuerdiagramm mit beschrifteten Flächen A–F"},
 q:"Vor der Steuer betrug die Konsumentenrente A + B + C und die Produzentenrente D + E + F. Wie verteilt sich die Wohlfahrt nach der Steuereinführung?",
 options:[
   {v:"A", t:"KR = A, PR = F, Steuer = B + D, WV = C + E"},
   {v:"B", t:"KR = A + B, PR = E + F, Steuer = C + D, WV = 0"},
   {v:"C", t:"KR = A + C, PR = E + F, Steuer = B + D, WV = 0"},
   {v:"D", t:"KR = A, PR = F, Steuer = B + C + D + E, WV = 0"}
 ],
 correct:"A",
 explain:"Nach der Steuer: Konsumentenrente = A (Dreieck oberhalb P_K, unterhalb Nachfragekurve). Produzentenrente = F (Dreieck unterhalb P_P, oberhalb Angebotskurve). Steuereinnahmen = B + D (Rechteck zwischen P_K und P_P bis Q_t). Wohlfahrtsverlust = C + E (die zwei Dreiecke rechts von Q_t, die weder Konsumenten, Produzenten noch dem Staat zufallen). Die Gesamtwohlfahrt ist also kleiner als vor der Steuer."},

{id:"w17", topic:"wohlfahrt", type:"multi", diff:2, tax:"K2",
 img:{src:"img/vwl/markteffizienz/steuer_flaechen_abcdef.svg", alt:"Steuerdiagramm mit beschrifteten Flächen A–F"},
 q:"Das Diagramm zeigt die Wohlfahrtsverteilung bei einer Mengensteuer. Welche Flächen bildeten vor der Steuereinführung die Konsumentenrente?",
 options:[
   {v:"A", t:"Fläche A"},
   {v:"B", t:"Fläche B"},
   {v:"C", t:"Fläche C"},
   {v:"D", t:"Fläche D"},
   {v:"E", t:"Fläche E"},
   {v:"F", t:"Fläche F"}
 ],
 correct:["A","B","C"],
 explain:"Vor der Steuer betrug die Konsumentenrente A + B + C. Das ist die gesamte Fläche zwischen der Nachfragekurve und dem Gleichgewichtspreis P*, links von Q*. Nach der Steuer schrumpft die KR auf A, weil B als Steuereinnahme an den Staat geht und C als Wohlfahrtsverlust verloren geht."},

// ── GÜTERARTEN & KLASSIFIKATION (t01–t10) ──
{id:"t01", topic:"gueterarten", type:"mc", diff:1, tax:"K1",
 q:"Anhand welcher zwei Kriterien werden Güter in der Ökonomie klassifiziert?",
 options:[
   {v:"A", t:"Rivalität im Konsum und Ausschliessbarkeit."},
   {v:"B", t:"Preis und Qualität."},
   {v:"C", t:"Angebot und Nachfrage."},
   {v:"D", t:"Knappheit und Nutzen."}
 ],
 correct:"A",
 explain:"Die Güterklassifikation basiert auf zwei Eigenschaften: (1) Rivalität: Verringert der Konsum durch eine Person die Verfügbarkeit für andere? (2) Ausschliessbarkeit: Können Nicht-Zahlende vom Konsum ausgeschlossen werden?"},

{id:"t02", topic:"gueterarten", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Güter der korrekten Güterkategorie zu.",
 categories:["Private Güter", "Öffentliche Güter", "Allmendegüter", "Klubgüter"],
 items:[
   {t:"Brötchen beim Bäcker", cat:0},
   {t:"Landesverteidigung", cat:1},
   {t:"Fischbestand im Meer", cat:2},
   {t:"Pay-TV / Streaming-Abo", cat:3},
   {t:"Strassenbeleuchtung", cat:1},
   {t:"Weideland", cat:2},
   {t:"Kinoeintritt", cat:3},
   {t:"Trinkwasser aus dem Grundwasser", cat:2}
 ],
 explain:"Private Güter: rival + ausschliessbar. Öffentliche Güter: nicht-rival + nicht-ausschliessbar. Allmendegüter: rival + nicht-ausschliessbar. Klubgüter: nicht-rival + ausschliessbar. Die Kombination bestimmt, ob der Markt das Gut effizient bereitstellen kann."},

{id:"t03", topic:"gueterarten", type:"tf", diff:1, tax:"K1",
 q:"Ein öffentliches Gut zeichnet sich dadurch aus, dass es nicht rivalisierend und nicht ausschliessbar ist.",
 correct:true,
 explain:"Korrekt. Nicht-Rivalität: Der Konsum durch eine Person beeinträchtigt den Konsum anderer nicht (z.B. Strassenbeleuchtung). Nicht-Ausschliessbarkeit: Niemand kann vom Konsum ausgeschlossen werden — auch nicht, wer nicht bezahlt."},

{id:"t04", topic:"gueterarten", type:"mc", diff:2, tax:"K2",
 q:"Warum stellt der Markt öffentliche Güter typischerweise nicht in ausreichender Menge bereit?",
 options:[
   {v:"A", t:"Weil das Trittbrettfahrerproblem dazu führt, dass niemand freiwillig bezahlt."},
   {v:"B", t:"Weil öffentliche Güter zu teuer in der Herstellung sind."},
   {v:"C", t:"Weil der Staat die Produktion verbietet."},
   {v:"D", t:"Weil die Nachfrage nach öffentlichen Gütern zu gering ist."}
 ],
 correct:"A",
 explain:"Da niemand vom Konsum ausgeschlossen werden kann, nutzen viele das Gut, ohne dafür zu bezahlen (Trittbrettfahrer/Free Rider). Kein privater Anbieter kann daher die Kosten decken → das Gut wird gar nicht oder zu wenig bereitgestellt → Marktversagen."},

{id:"t05", topic:"gueterarten", type:"fill", diff:1, tax:"K1",
 q:"Güter, die rivalisierend, aber nicht ausschliessbar sind, heissen {0}. Güter, die nicht rivalisierend, aber ausschliessbar sind, heissen {1}.",
 blanks:[
   {answer:"Allmendegüter", alts:["Gemeingüter","Common Pool Resources"]},
   {answer:"Klubgüter", alts:["Mautgüter","Club Goods"]}
 ],
 explain:"Allmendegüter (z.B. Fischbestand): Jeder kann fischen (nicht ausschliessbar), aber ein gefangener Fisch fehlt anderen (rival) → Gefahr der Übernutzung. Klubgüter (z.B. Fitnessstudio): Nicht-Mitglieder werden ausgeschlossen, aber die Nutzung ist (bis zur Kapazitätsgrenze) nicht rival."},

{id:"t06", topic:"gueterarten", type:"mc", diff:2, tax:"K2",
 q:"Welches Marktversagen tritt typischerweise bei Allmendegütern auf?",
 options:[
   {v:"A", t:"Übernutzung, weil jeder den vollen Nutzen der Ressource erhält, aber nur einen Teil der Kosten trägt."},
   {v:"B", t:"Unterproduktion, weil niemand bereit ist, das Gut herzustellen."},
   {v:"C", t:"Monopolbildung, weil nur ein Anbieter das Gut kontrolliert."},
   {v:"D", t:"Asymmetrische Information, weil Konsumenten die Qualität nicht kennen."}
 ],
 correct:"A",
 explain:"Bei Allmendegütern gilt: Individueller Nutzen der Nutzung > individueller Kostenanteil. Jeder hat einen Anreiz, möglichst viel zu nutzen, obwohl die Ressource begrenzt ist. Das Ergebnis: Die Ressource wird übernutzt (Tragödie der Allmende)."},

{id:"t07", topic:"gueterarten", type:"tf", diff:2, tax:"K2",
 q:"Ein Gut kann seine Klassifikation im Laufe der Zeit ändern — z.B. kann eine bisher frei zugängliche Ressource durch Regulierung zu einem Klubgut werden.",
 correct:true,
 explain:"Korrekt. Beispiel: Fischbestände (Allmendegut) können durch Fangquoten und Lizenzen zu Klubgütern werden (ausschliessbar). Oder: Eine bisher frei zugängliche Strasse wird zur Mautstrasse. Die Klassifikation hängt von den institutionellen Rahmenbedingungen ab."},

{id:"t08", topic:"gueterarten", type:"open", diff:3, tax:"K4",
 q:"Ist saubere Luft ein öffentliches Gut? Analysieren Sie anhand der beiden Kriterien Rivalität und Ausschliessbarkeit.",
 sample:"Saubere Luft erfüllt die Kriterien eines öffentlichen Gutes weitgehend:\n\n– Nicht-Rivalität: Wenn eine Person saubere Luft atmet, steht sie anderen weiterhin zur Verfügung (solange die Kapazität der Atmosphäre nicht überschritten wird).\n– Nicht-Ausschliessbarkeit: Niemand kann von sauberer Luft ausgeschlossen werden.\n\n→ Da es sich um ein öffentliches Gut handelt, stellt der Markt Umweltschutz nicht effizient bereit. Der Staat muss eingreifen (z.B. Emissionsgrenzwerte, CO₂-Abgabe), um die Bereitstellung zu sichern.\n\nEinschränkung: Bei starker Verschmutzung kann saubere Luft rivalisierende Züge annehmen (die Aufnahmefähigkeit der Atmosphäre ist begrenzt).",
 explain:"Diese Analyse zeigt, dass die Güterklassifikation nicht immer trennscharf ist und kontextabhängig sein kann."},

{id:"t09", topic:"gueterarten", type:"mc", diff:2, tax:"K3",
 q:"Welches der folgenden Beispiele illustriert das Trittbrettfahrerproblem am besten?",
 options:[
   {v:"A", t:"Ein Anwohner geniesst den Deichschutz, zahlt aber nichts für dessen Unterhalt."},
   {v:"B", t:"Ein Kunde kauft ein Produkt und ist unzufrieden."},
   {v:"C", t:"Ein Unternehmen investiert in Forschung und patentiert die Ergebnisse."},
   {v:"D", t:"Ein Bauer verkauft seine Ernte auf dem Wochenmarkt."}
 ],
 correct:"A",
 explain:"Der Deichschutz ist ein öffentliches Gut — niemand kann vom Schutz ausgeschlossen werden. Der Anwohner profitiert, ohne zu bezahlen (Trittbrettfahrer). Wenn alle so handeln, wird der Deich nicht finanziert. Deshalb organisiert der Staat solche Güter und finanziert sie über Steuern."},

{id:"t10", topic:"gueterarten", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die Güter nach ihren Eigenschaften: rival oder nicht-rival?",
 categories:["Rival (Konsum mindert Verfügbarkeit)", "Nicht-rival (Konsum mindert Verfügbarkeit nicht)"],
 items:[
   {t:"Ein Stück Pizza", cat:0},
   {t:"Ein Radiosignal", cat:1},
   {t:"Ein Parkplatz in der Innenstadt", cat:0},
   {t:"Die Nutzung einer Brücke (ohne Stau)", cat:1},
   {t:"Sauberes Trinkwasser aus einer Quelle", cat:0},
   {t:"Ein Feuerwerk", cat:1}
 ],
 explain:"Rivale Güter: Der Konsum durch eine Person reduziert die Verfügbarkeit für andere (Pizza, Parkplatz, Wasser). Nicht-rivale Güter: Können von vielen gleichzeitig genutzt werden, ohne dass die Qualität leidet (Radio, Brücke ohne Stau, Feuerwerk)."},

// ── WETTBEWERBSBESCHRÄNKUNGEN (b01–b10) ──
{id:"b01", topic:"wettbewerb", type:"mc", diff:1, tax:"K1",
 q:"Was versteht man unter Wettbewerbsbeschränkungen?",
 options:[
   {v:"A", t:"Massnahmen oder Strukturen, die den freien Wettbewerb auf einem Markt behindern."},
   {v:"B", t:"Massnahmen des Staates zur Förderung des Wettbewerbs."},
   {v:"C", t:"Der natürliche Rückgang der Nachfrage in einer Rezession."},
   {v:"D", t:"Die Begrenzung der Produktionskapazität durch Ressourcenknappheit."}
 ],
 correct:"A",
 explain:"Wettbewerbsbeschränkungen verhindern, dass der Preismechanismus effizient funktioniert. Sie entstehen durch Marktmacht (Monopole, Kartelle), staatliche Eingriffe (Zölle, Normen) oder andere Barrieren für den Marktzutritt."},

{id:"b02", topic:"wettbewerb", type:"tf", diff:2, tax:"K2",
 q:"Ein Monopolist hat einen Anreiz, die Produktionsmenge zu beschränken und den Preis über die Grenzkosten zu setzen.",
 correct:true,
 explain:"Korrekt. Im Gegensatz zur vollkommenen Konkurrenz, wo P = Grenzkosten gilt, setzt ein Monopolist P > Grenzkosten. Durch Mengenbeschränkung kann er den Preis erhöhen und seinen Gewinn steigern — auf Kosten der Konsumenten und der Gesamtwohlfahrt."},

{id:"b03", topic:"wettbewerb", type:"mc", diff:2, tax:"K2",
 q:"Welche Folge haben Wettbewerbsbeschränkungen für die Innovationsfähigkeit?",
 options:[
   {v:"A", t:"Weniger Innovationsanreize, weil geschützte Unternehmen keinen Wettbewerbsdruck haben."},
   {v:"B", t:"Mehr Innovation, weil Monopole ihre Gewinne in Forschung investieren."},
   {v:"C", t:"Keine Auswirkung, weil Innovation nur von der Technologie abhängt."},
   {v:"D", t:"Mehr Innovation, weil Zölle die inländische Forschung schützen."}
 ],
 correct:"A",
 explain:"Ohne Wettbewerbsdruck haben Marktführer weniger Anreize, ihre Produkte oder Prozesse zu verbessern. Langfristig leidet die gesamtwirtschaftliche Effizienz und Innovation. (Anmerkung: Es gibt auch das Gegenargument, dass gewisse Monopolgewinne Forschung ermöglichen — die empirische Evidenz spricht aber mehrheitlich für den Wettbewerb als Innovationstreiber.)"},

{id:"b04", topic:"wettbewerb", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Marktformen nach ihrem typischen Wohlfahrtsverlust — von keinem zu grossem Verlust.",
 categories:["Kein/geringer WFV", "Mittlerer WFV", "Grosser WFV"],
 items:[
   {t:"Vollkommene Konkurrenz", cat:0},
   {t:"Monopolistische Konkurrenz", cat:1},
   {t:"Monopol (ohne Preisdifferenzierung)", cat:2},
   {t:"Oligopol mit Kartellabsprache", cat:2}
 ],
 explain:"Vollkommene Konkurrenz: Kein Wohlfahrtsverlust (P = Grenzkosten). Monopolistische Konkurrenz: Geringer Verlust durch Produktdifferenzierung. Monopol und Kartell: Grosser Verlust durch Mengenbeschränkung und überhöhte Preise."},

{id:"b05", topic:"wettbewerb", type:"mc", diff:2, tax:"K2",
 q:"Welche Wirkung haben Zölle auf importierte Güter?",
 options:[
   {v:"A", t:"Sie verteuern Importe, schützen inländische Produzenten, erhöhen aber den Preis für Konsumenten und erzeugen einen Wohlfahrtsverlust."},
   {v:"B", t:"Sie senken die Preise für Konsumenten, weil inländische Produzenten günstiger werden."},
   {v:"C", t:"Sie haben keine Auswirkung auf den Markt, weil sie nur den Staat betreffen."},
   {v:"D", t:"Sie steigern die Gesamtwohlfahrt, weil sie Arbeitsplätze schaffen."}
 ],
 correct:"A",
 explain:"Zölle wirken wie eine Steuer auf Importe: Der Preis steigt, die importierte Menge sinkt. Inländische Produzenten profitieren (mehr Absatz, höhere Preise), Konsumenten verlieren (höhere Preise, weniger Auswahl). Insgesamt entsteht ein Wohlfahrtsverlust."},

{id:"b06", topic:"wettbewerb", type:"tf", diff:2, tax:"K2",
 q:"Normen und Standards können den Wettbewerb einschränken, auch wenn sie ursprünglich dem Konsumentenschutz dienen.",
 correct:true,
 explain:"Korrekt. Normen, die bestimmte Produktionsmethoden oder Qualitätsstandards vorschreiben, können als Marktzutrittsbarriere wirken: Nicht alle Anbieter (insbesondere kleinere oder ausländische) können die Anforderungen erfüllen. Dies kann den Wettbewerb einschränken und die Preise erhöhen."},

{id:"b07", topic:"wettbewerb", type:"open", diff:3, tax:"K5",
 q:"Beurteilen Sie: Sind Importzölle ein sinnvolles wirtschaftspolitisches Instrument? Diskutieren Sie Vor- und Nachteile.",
 sample:"Argumente für Zölle:\n- Schutz inländischer Arbeitsplätze und Industrien vor ausländischer Billigkonkurrenz.\n- Einnahmen für den Staat.\n- Schutz strategisch wichtiger Branchen (z.B. Landwirtschaft, Rüstung).\n- Gegendruckmittel in Handelsverhandlungen.\n\nArgumente gegen Zölle:\n- Wohlfahrtsverlust durch höhere Preise und geringere Mengen.\n- Vergeltungszölle anderer Länder können Eskalation auslösen (Handelskrieg).\n- Inländische Unternehmen verlieren Innovationsanreize.\n- Konsumenten tragen die Last durch höhere Preise.\n- Fehlallokation von Ressourcen (ineffiziente Branchen werden künstlich am Leben erhalten).\n\nFazit: Kurzfristig können Zölle bestimmte Branchen schützen, langfristig schaden sie meist der Gesamtwohlfahrt.",
 explain:"Diese Frage erfordert eine abwägende Beurteilung (K5). Es gibt keine eindeutig richtige Antwort — entscheidend ist die Qualität der Argumentation."},

{id:"b08", topic:"wettbewerb", type:"mc", diff:1, tax:"K1",
 q:"Welche Rolle spielt die Wettbewerbskommission (WEKO) in der Schweiz?",
 options:[
   {v:"A", t:"Sie überwacht den Wettbewerb und bekämpft Kartelle und missbräuchliche Marktmacht."},
   {v:"B", t:"Sie legt die Preise für alle Güter fest."},
   {v:"C", t:"Sie verteilt staatliche Subventionen an Unternehmen."},
   {v:"D", t:"Sie reguliert den Aussenhandel und legt Zölle fest."}
 ],
 correct:"A",
 explain:"Die WEKO (Wettbewerbskommission) ist die Schweizer Kartellbehörde. Sie prüft Zusammenschlüsse, verfolgt Kartellabsprachen und bekämpft den Missbrauch marktbeherrschender Stellungen — alles mit dem Ziel, den funktionierenden Wettbewerb zu sichern."},

{id:"b09", topic:"wettbewerb", type:"tf", diff:2, tax:"K2",
 q:"Ein natürliches Monopol entsteht, wenn die Fixkosten so hoch sind, dass ein einziger Anbieter den Markt günstiger bedienen kann als mehrere Anbieter.",
 correct:true,
 explain:"Korrekt. Beispiele: Eisenbahnnetz, Stromnetz, Wasserversorgung. Die hohen Fixkosten (Infrastruktur) und niedrigen Grenzkosten machen es ineffizient, parallele Netze aufzubauen. Hier reguliert der Staat oft die Preise, um Monopolmissbrauch zu verhindern."},

{id:"b10", topic:"wettbewerb", type:"fill", diff:1, tax:"K1",
 q:"Ein Zusammenschluss von Unternehmen, die geheime Preisabsprachen treffen, heisst {0}. Die Schweizer Behörde, die solche Absprachen verfolgt, heisst {1}.",
 blanks:[
   {answer:"Kartell", alts:["Preiskartell"]},
   {answer:"WEKO", alts:["Wettbewerbskommission"]}
 ],
 explain:"Kartelle sind illegale Absprachen zwischen Wettbewerbern (z.B. über Preise, Mengen oder Marktaufteilung). Sie schaden Konsumenten und werden von der WEKO verfolgt und mit Bussen bestraft."},

// ── ÖFFENTLICHE GÜTER & TRITTBRETTFAHRER (o01–o10) ──
{id:"o01", topic:"oeffentlich", type:"mc", diff:1, tax:"K1",
 q:"Welches der folgenden Güter ist ein öffentliches Gut?",
 options:[
   {v:"A", t:"Die Landesverteidigung."},
   {v:"B", t:"Ein Smartphone."},
   {v:"C", t:"Ein Kinobesuch."},
   {v:"D", t:"Ein Liter Milch."}
 ],
 correct:"A",
 explain:"Die Landesverteidigung erfüllt beide Kriterien: Nicht-Rivalität (der Schutz des einen schmälert nicht den Schutz des anderen) und Nicht-Ausschliessbarkeit (niemand kann vom Schutz ausgeschlossen werden, auch nicht Steuerhinterzieher)."},

{id:"o02", topic:"oeffentlich", type:"tf", diff:2, tax:"K2",
 q:"Strassenbeleuchtung ist ein gutes Beispiel für ein öffentliches Gut, weil sie privat kaum finanzierbar wäre.",
 correct:true,
 explain:"Korrekt. Strassenbeleuchtung ist nicht-rival (alle profitieren gleichzeitig) und nicht-ausschliessbar (man kann niemanden daran hindern, das Licht zu nutzen). Würde man sie privat organisieren, würde niemand freiwillig zahlen (Trittbrettfahrer). Deshalb wird sie vom Staat bereitgestellt."},

{id:"o03", topic:"oeffentlich", type:"mc", diff:2, tax:"K2",
 q:"Warum führt das Trittbrettfahrerproblem bei öffentlichen Gütern zu einem Marktversagen?",
 options:[
   {v:"A", t:"Weil rationale Individuen keinen Anreiz haben zu zahlen, da sie das Gut auch ohne Bezahlung nutzen können — das Gut wird deshalb nicht oder zu wenig bereitgestellt."},
   {v:"B", t:"Weil der Staat die Produktion öffentlicher Güter verbietet."},
   {v:"C", t:"Weil die Nachfrage nach öffentlichen Gütern immer zu hoch ist."},
   {v:"D", t:"Weil öffentliche Güter immer von schlechter Qualität sind."}
 ],
 correct:"A",
 explain:"Das Trittbrettfahrerproblem: Wenn niemand ausgeschlossen werden kann, hat jeder den Anreiz, andere bezahlen zu lassen. Da alle so denken, finanziert niemand das Gut freiwillig → Unterbereitstellung. Lösung: Der Staat finanziert öffentliche Güter über Steuern."},

{id:"o04", topic:"oeffentlich", type:"open", diff:2, tax:"K3",
 q:"Nennen Sie drei Beispiele für öffentliche Güter und erklären Sie jeweils, warum die beiden Kriterien (Nicht-Rivalität und Nicht-Ausschliessbarkeit) erfüllt sind.",
 sample:"1. Landesverteidigung: Der militärische Schutz gilt für alle Einwohner gleichzeitig (nicht-rival) und niemand kann davon ausgeschlossen werden (nicht-ausschliessbar).\n\n2. Grundlagenforschung: Wissenschaftliche Erkenntnisse können von allen genutzt werden (nicht-rival) und sind nach Veröffentlichung frei zugänglich (nicht-ausschliessbar).\n\n3. Strassenbeleuchtung: Das Licht steht allen Passanten gleichzeitig zur Verfügung (nicht-rival) und kann nicht auf einzelne Personen beschränkt werden (nicht-ausschliessbar).",
 explain:"Weitere Beispiele: Hochwasserschutz, Leuchtturm, öffentlich-rechtliches Fernsehen (teilweise — durch Verschlüsselung kann es zum Klubgut werden)."},

{id:"o05", topic:"oeffentlich", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie zu: Welche Güter sind echte öffentliche Güter und welche nur scheinbar?",
 categories:["Öffentliches Gut (nicht-rival + nicht-ausschliessbar)", "Kein öffentliches Gut"],
 items:[
   {t:"Landesverteidigung", cat:0},
   {t:"Öffentlicher Park (ohne Überfüllung)", cat:0},
   {t:"Öffentliche Schule (staatlich finanziert, aber kapazitätsbegrenzt)", cat:1},
   {t:"Leuchtturm", cat:0},
   {t:"Schwimmbad (öffentlich zugänglich, aber begrenzte Plätze)", cat:1}
 ],
 explain:"'Öffentlich' im politischen Sinne (= vom Staat bereitgestellt) ist nicht dasselbe wie 'öffentlich' im ökonomischen Sinne. Eine öffentliche Schule oder ein Schwimmbad sind kapazitätsbegrenzt (rival bei Überfüllung) und grundsätzlich ausschliessbar."},

{id:"o06", topic:"oeffentlich", type:"mc", diff:2, tax:"K3",
 q:"Im Fischteich-Spiel starten alle Fischer anonym. Warum führt die Anonymität typischerweise zu einem schlechteren Gesamtergebnis?",
 options:[
   {v:"A", t:"Weil ohne Kommunikation und Überwachung kein Vertrauen entsteht und jeder seinen eigenen Nutzen maximiert."},
   {v:"B", t:"Weil anonyme Fischer schlechter fischen können."},
   {v:"C", t:"Weil der Fischteich zu klein ist."},
   {v:"D", t:"Weil die Spielleitung die Regeln zu streng setzt."}
 ],
 correct:"A",
 explain:"Anonymität verhindert Kooperation: Man kann weder Absprachen treffen noch Trittbrettfahrer identifizieren. Jeder Fischer maximiert seinen eigenen Fang (rationales Verhalten), was kollektiv zur Übernutzung und möglicherweise zur Zerstörung der Ressource führt."},

{id:"o07", topic:"oeffentlich", type:"tf", diff:2, tax:"K2",
 q:"Im Fischteich-Spiel verdoppelt sich der Fischbestand nach jeder Runde (bis zum Anfangsbestand). Die optimale kollektive Strategie ist, pro Runde maximal die Hälfte des Bestandes zu fischen.",
 correct:true,
 explain:"Korrekt. Wenn nur die Hälfte gefischt wird, regeneriert sich der Bestand vollständig (Verdopplung des Restbestands). So kann über viele Runden ein konstant hoher Ertrag erzielt werden. Wird mehr als die Hälfte gefischt, schrumpft der Bestand — langfristig bricht er zusammen."},

{id:"o08", topic:"oeffentlich", type:"mc", diff:2, tax:"K3",
 q:"Im erweiterten Fischteich-Spiel gibt es eine Strafmöglichkeit: Fischer können andere bestrafen, allerdings zu eigenen Kosten. Welcher Effekt wird damit typischerweise erreicht?",
 options:[
   {v:"A", t:"Die Strafmöglichkeit erhöht die Kooperation, weil Übernutzer mit Konsequenzen rechnen müssen."},
   {v:"B", t:"Die Strafmöglichkeit hat keinen Effekt, weil das Strafen zu teuer ist."},
   {v:"C", t:"Alle Fischer strafen sich gegenseitig, und das Ergebnis wird schlechter."},
   {v:"D", t:"Nur der grösste Fischer wird bestraft."}
 ],
 correct:"A",
 explain:"Die Möglichkeit, Trittbrettfahrer zu bestrafen, wirkt als sozialer Kontrollmechanismus. Obwohl Strafen den Strafenden selbst kosten, reicht oft schon die Drohung, um kooperativeres Verhalten zu fördern. Analogie: Steuern und Bussen im echten Leben."},

{id:"o09", topic:"oeffentlich", type:"fill", diff:1, tax:"K1",
 q:"Das Problem, dass Personen ein öffentliches Gut nutzen, ohne dafür zu bezahlen, heisst {0}.",
 blanks:[
   {answer:"Trittbrettfahrerproblem", alts:["Free-Rider-Problem","Free Rider Problem","Freerider-Problem"]}
 ],
 explain:"Das Trittbrettfahrerproblem ist ein Kernproblem bei öffentlichen Gütern: Da niemand ausgeschlossen werden kann, hat jeder den Anreiz, sich als «Trittbrettfahrer» (Free Rider) zu verhalten und andere zahlen zu lassen."},

{id:"o10", topic:"oeffentlich", type:"open", diff:3, tax:"K5",
 q:"Ist Grundlagenforschung ein öffentliches Gut? Beurteilen Sie, ob der Staat Grundlagenforschung finanzieren soll, und begründen Sie Ihre Antwort ökonomisch.",
 sample:"Grundlagenforschung hat Eigenschaften eines öffentlichen Gutes:\n- Nicht-Rivalität: Wissen kann von allen gleichzeitig genutzt werden.\n- Nicht-Ausschliessbarkeit: Veröffentlichte Erkenntnisse sind frei zugänglich (ohne Patentschutz).\n\nOhne staatliche Finanzierung investieren private Unternehmen zu wenig in Grundlagenforschung (Trittbrettfahrerproblem: Konkurrenten profitieren von den Erkenntnissen, ohne die Kosten zu tragen).\n\nAllerdings: Patente und geistiges Eigentum können die Ausschliessbarkeit teilweise herstellen und private Investitionen anreizen.\n\nFazit: Der Staat sollte Grundlagenforschung finanzieren, um die gesellschaftlich optimale Menge an Wissen zu produzieren. Private Forschung (angewandte Forschung) kann durch Patente angereizt werden.",
 explain:"Diese Frage verbindet die Güterklassifikation mit wirtschaftspolitischer Beurteilung (K5)."},

// ── ALLMENDEGÜTER & TRAGÖDIE DER ALLMENDE (l01–l10) ──
{id:"l01", topic:"allmende", type:"mc", diff:1, tax:"K1",
 q:"Was versteht man unter der «Tragödie der Allmende»?",
 options:[
   {v:"A", t:"Die Übernutzung einer gemeinsamen Ressource, weil jeder Nutzer seinen individuellen Vorteil maximiert."},
   {v:"B", t:"Die Unternutzung einer Ressource durch staatliche Regulierung."},
   {v:"C", t:"Den Zusammenbruch eines Monopols."},
   {v:"D", t:"Die Verarmung einer Gesellschaft durch zu hohe Steuern."}
 ],
 correct:"A",
 explain:"Die Tragödie der Allmende (Garrett Hardin, 1968): Bei frei zugänglichen Ressourcen (z.B. Weideland, Fischbestände) hat jeder Nutzer den Anreiz, möglichst viel zu entnehmen. Der individuelle Gewinn ist hoch, die Kosten der Übernutzung werden von allen getragen → die Ressource wird zerstört."},

{id:"l02", topic:"allmende", type:"tf", diff:1, tax:"K2",
 q:"Die Tragödie der Allmende entsteht, weil die Kosten der Übernutzung auf alle Nutzer verteilt werden, der Nutzen aber beim Einzelnen bleibt.",
 correct:true,
 explain:"Korrekt. Das ist der Kern des Problems: Der individuelle Fischer erhält den vollen Nutzen seines Fangs, trägt aber nur einen Bruchteil der Kosten (Bestandsrückgang). Diese Diskrepanz zwischen individuellem Anreiz und kollektivem Optimum führt zur Übernutzung."},

{id:"l03", topic:"allmende", type:"multi", diff:2, tax:"K3",
 q:"Welche Massnahmen können die Tragödie der Allmende verhindern?",
 options:[
   {v:"A", t:"Eigentumsrechte definieren (Privatisierung der Ressource)."},
   {v:"B", t:"Staatliche Regulierung (z.B. Fangquoten, Nutzungsbeschränkungen)."},
   {v:"C", t:"Selbstorganisation der Nutzer (gemeinsame Regeln, Überwachung)."},
   {v:"D", t:"Preiserhöhungen durch Monopole."}
 ],
 correct:["A","B","C"],
 explain:"Es gibt verschiedene Lösungsansätze: (1) Privatisierung: Eigentumsrechte schaffen Anreize für nachhaltige Nutzung. (2) Staatliche Regulierung: Quoten, Lizenzen, Verbote begrenzen die Nutzung. (3) Selbstorganisation: Elinor Ostrom zeigte, dass lokale Gemeinschaften unter bestimmten Bedingungen ihre Ressourcen selbst erfolgreich verwalten können."},

{id:"l04", topic:"allmende", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die Beispiele den Lösungsansätzen für die Tragödie der Allmende zu.",
 categories:["Privatisierung", "Staatliche Regulierung", "Selbstorganisation"],
 items:[
   {t:"Zuteilung von Fischereilizenzen durch den Bund", cat:1},
   {t:"Alpengenossenschaft regelt Alpwirtschaft selbst", cat:2},
   {t:"Verkauf von Emissionsrechten an Unternehmen", cat:0},
   {t:"Fahrverbot in der Innenstadt", cat:1},
   {t:"Gemeinde vereinbart Bewässerungsplan gemeinsam", cat:2}
 ],
 explain:"In der Praxis werden oft Mischformen eingesetzt. Die beste Lösung hängt von der spezifischen Ressource, der Grösse der Nutzergruppe und den institutionellen Rahmenbedingungen ab."},

{id:"l05", topic:"allmende", type:"open", diff:2, tax:"K3",
 q:"Im Fischteich-Spiel betrug der Anfangsbestand 60 Fische (15 Spieler × 4). Berechnen und erklären Sie: Was ist die kollektiv optimale Fangmenge pro Runde?",
 sample:"Optimale Strategie: In jeder Runde sollten maximal die Hälfte des aktuellen Bestandes gefischt werden, also zu Beginn maximal 30 Fische.\n\nBegründung: Der Restbestand von 30 Fischen verdoppelt sich auf 60 → der Ausgangszustand wird wiederhergestellt. Bei 15 Spielern sind das 2 Fische pro Person pro Runde (30 ÷ 15 = 2).\n\nÜber 10 Runden ergibt das: 10 × 2 = 20 Fische pro Person = maximaler nachhaltiger Ertrag.\n\nFischt jeder aber 3 Fische (= 45 total), bleiben nur 15 übrig. Diese verdoppeln sich auf 30 — der Bestand schrumpft. Nach wenigen Runden ist der Teich leer.",
 explain:"Die Regenerationsfunktion (Verdopplung bis Maximum) bestimmt die nachhaltige Entnahmemenge. Jede Entnahme über der Hälfte mindert den zukünftigen Ertrag."},

{id:"l06", topic:"allmende", type:"tf", diff:2, tax:"K2",
 q:"Elinor Ostrom erhielt den Nobelpreis für Wirtschaftswissenschaften, weil sie zeigte, dass die Tragödie der Allmende nur durch Privatisierung oder Verstaatlichung gelöst werden kann.",
 correct:false,
 explain:"Falsch. Ostrom zeigte gerade das Gegenteil: Lokale Gemeinschaften können unter bestimmten Bedingungen ihre Ressourcen selbst erfolgreich verwalten — ohne Privatisierung oder Verstaatlichung. Entscheidend sind klare Regeln, Überwachung, Sanktionsmechanismen und Beteiligung der Nutzer."},

{id:"l07", topic:"allmende", type:"mc", diff:2, tax:"K3",
 q:"Welches der folgenden aktuellen Probleme ist ein typisches Beispiel für die Tragödie der Allmende?",
 options:[
   {v:"A", t:"Überfischung der Weltmeere."},
   {v:"B", t:"Steigende Immobilienpreise in Zürich."},
   {v:"C", t:"Die Einführung einer neuen Smartphone-Generation."},
   {v:"D", t:"Der Anstieg der Gesundheitskosten."}
 ],
 correct:"A",
 explain:"Fischbestände in internationalen Gewässern sind ein klassisches Allmendegut: rival (gefangene Fische fehlen anderen), nicht ausschliessbar (keine Eigentumsrechte auf hoher See). Jedes Land hat den Anreiz, möglichst viel zu fischen → Übernutzung."},

{id:"l08", topic:"allmende", type:"fill", diff:1, tax:"K1",
 q:"Die Nobelpreisträgerin {0} zeigte, dass Gemeinschaften ihre Ressourcen unter bestimmten Bedingungen selbst verwalten können, ohne dass der Staat eingreifen muss.",
 blanks:[
   {answer:"Elinor Ostrom", alts:["Ostrom"]}
 ],
 explain:"Elinor Ostrom (1933–2012) widerlegte die Annahme, dass gemeinsame Ressourcen zwangsläufig zur Tragödie führen. Sie identifizierte Gestaltungsprinzipien für erfolgreiche Selbstorganisation (z.B. Schweizer Alpgenossenschaften, Bewässerungssysteme in Asien)."},

{id:"l09", topic:"allmende", type:"mc", diff:2, tax:"K2",
 q:"Was unterscheidet ein Allmendegut von einem öffentlichen Gut?",
 options:[
   {v:"A", t:"Allmendegüter sind rival im Konsum (die Nutzung durch eine Person mindert die Verfügbarkeit), öffentliche Güter nicht."},
   {v:"B", t:"Öffentliche Güter sind rival, Allmendegüter nicht."},
   {v:"C", t:"Beide sind identisch — die Begriffe werden synonym verwendet."},
   {v:"D", t:"Allmendegüter sind ausschliessbar, öffentliche Güter nicht."}
 ],
 correct:"A",
 explain:"Der entscheidende Unterschied ist die Rivalität: Bei Allmendegütern (z.B. Fisch) verringert die Nutzung durch eine Person die Verfügbarkeit für andere. Bei öffentlichen Gütern (z.B. Landesverteidigung) ist der Konsum nicht-rival. Beide sind nicht-ausschliessbar."},

{id:"l10", topic:"allmende", type:"open", diff:3, tax:"K5",
 q:"Der Klimawandel wird oft als «Tragödie der Allmende im globalen Massstab» bezeichnet. Beurteilen Sie diese Analogie.",
 sample:"Die Analogie ist treffend:\n\n- Die Atmosphäre ist ein Allmendegut: rival (CO₂-Ausstoss verringert die Kapazität zur Aufnahme weiterer Emissionen) und nicht-ausschliessbar (kein Land kann von der Nutzung der Atmosphäre ausgeschlossen werden).\n- Jedes Land hat den Anreiz, günstig zu produzieren (viel CO₂ ausstossen), während die Kosten (Klimawandel) global getragen werden.\n- Trittbrettfahrerproblem: Selbst wenn ein Land seine Emissionen reduziert, profitieren alle anderen davon, ohne etwas beizutragen.\n\nBesonderheit: Die globale Dimension macht die Lösung schwieriger als bei lokalen Allmenden — es gibt keine «Weltregierung», die Regeln durchsetzen kann. Internationale Abkommen (Pariser Abkommen) versuchen, Kooperation herzustellen.",
 explain:"Die globale Dimension unterscheidet das Klimaproblem von lokalen Allmenden: Selbstorganisation à la Ostrom ist bei 195 Staaten mit unterschiedlichen Interessen extrem schwierig."},

// ── EXTERNE EFFEKTE & INTERNALISIERUNG (e01–e12) ──
{id:"e01", topic:"externeffekte", type:"mc", diff:1, tax:"K1",
 q:"Was versteht man unter einem externen Effekt?",
 options:[
   {v:"A", t:"Kosten oder Nutzen, die bei Dritten anfallen und nicht im Marktpreis berücksichtigt werden."},
   {v:"B", t:"Die Wirkung von Importen auf den inländischen Markt."},
   {v:"C", t:"Die Auswirkungen von Steuern auf die Wirtschaft."},
   {v:"D", t:"Die Reaktion des Marktes auf eine Preisänderung."}
 ],
 correct:"A",
 explain:"Externe Effekte (Externalitäten) sind Auswirkungen wirtschaftlicher Aktivitäten auf unbeteiligte Dritte, die weder im Preis noch in der Entscheidung der Marktteilnehmer berücksichtigt werden. Sie können negativ (Kosten für Dritte) oder positiv (Nutzen für Dritte) sein."},

{id:"e02", topic:"externeffekte", type:"sort", diff:1, tax:"K2",
 q:"Ordnen Sie die folgenden Beispiele: Handelt es sich um negative oder positive externe Effekte?",
 categories:["Negativer externer Effekt", "Positiver externer Effekt"],
 items:[
   {t:"Eine Fabrik verschmutzt den Fluss", cat:0},
   {t:"Impfung schützt auch nicht geimpfte Personen", cat:1},
   {t:"Fluglärm belastet Anwohner", cat:0},
   {t:"Ein schöner Garten erfreut die Nachbarn", cat:1},
   {t:"Bildung erhöht die Produktivität der ganzen Gesellschaft", cat:1},
   {t:"Autoverkehr erzeugt CO₂-Emissionen", cat:0}
 ],
 explain:"Negative externe Effekte: Die Verursacher tragen nicht die vollen Kosten → der Marktpreis ist zu niedrig → es wird zu viel produziert. Positive externe Effekte: Die Produzenten erhalten nicht den vollen Nutzen → der Marktpreis spiegelt nicht den gesamten gesellschaftlichen Nutzen → es wird zu wenig produziert/konsumiert."},

{id:"e03", topic:"externeffekte", type:"mc", diff:2, tax:"K2",
 img:{src:"img/vwl/markteffizienz/externe_effekte_negativ_pk_gk.svg", alt:"Negative externe Effekte: Private Kosten (PK) vs. Gesellschaftliche Kosten (GK)"},
 q:"Warum führen negative externe Effekte zu einer ineffizienten Überproduktion?",
 options:[
   {v:"A", t:"Weil die privaten Kosten niedriger sind als die sozialen Kosten — der Marktpreis ist zu niedrig."},
   {v:"B", t:"Weil die Nachfrage nach dem Gut zu gering ist."},
   {v:"C", t:"Weil der Staat die Produktion subventioniert."},
   {v:"D", t:"Weil die Angebotskurve senkrecht verläuft."}
 ],
 correct:"A",
 explain:"Bei negativen externen Effekten (z.B. Umweltverschmutzung) sind die sozialen Kosten (private Kosten + externe Kosten) höher als die privaten Kosten. Da Unternehmen nur ihre privaten Kosten berücksichtigen, ist die Produktion zu hoch und der Preis zu niedrig — aus gesellschaftlicher Sicht."},

{id:"e04", topic:"externeffekte", type:"fill", diff:2, tax:"K2",
 q:"Den Vorgang, externe Kosten in den Marktpreis einzubeziehen, nennt man {0}. Ein klassisches Instrument dafür ist die {1}.",
 blanks:[
   {answer:"Internalisierung", alts:["Internalisieren"]},
   {answer:"Pigou-Steuer", alts:["Lenkungssteuer","Lenkungsabgabe","Pigou Steuer"]}
 ],
 explain:"Internalisierung bedeutet, die externen Kosten «sichtbar» zu machen, indem sie in den Preis einfliessen. Eine Pigou-Steuer (nach Arthur Pigou) entspricht genau den externen Kosten — sie korrigiert den Marktpreis auf das gesellschaftlich optimale Niveau."},

{id:"e05", topic:"externeffekte", type:"mc", diff:2, tax:"K2",
 q:"Welches Instrument nutzt der Marktmechanismus, um CO₂-Emissionen zu reduzieren?",
 options:[
   {v:"A", t:"Emissionshandel (Cap-and-Trade): Es wird ein Gesamtlimit festgelegt und Emissionsrechte werden gehandelt."},
   {v:"B", t:"Subventionen für fossile Brennstoffe."},
   {v:"C", t:"Abschaffung aller Umweltregulierungen."},
   {v:"D", t:"Verstaatlichung aller Energieunternehmen."}
 ],
 correct:"A",
 explain:"Beim Emissionshandel (Cap-and-Trade) legt der Staat ein Gesamtlimit (Cap) für Emissionen fest und verteilt/verkauft Emissionsrechte. Unternehmen können Rechte kaufen oder verkaufen (Trade). Der Vorteil: Die Reduktion geschieht dort, wo sie am günstigsten ist — das ist effizient."},

{id:"e06", topic:"externeffekte", type:"tf", diff:2, tax:"K2",
 q:"Positive externe Effekte (z.B. Bildung) führen dazu, dass der Markt zu viel des Gutes bereitstellt.",
 correct:false,
 explain:"Falsch — das Gegenteil ist der Fall. Bei positiven externen Effekten ist der gesellschaftliche Nutzen höher als der private Nutzen. Da die Produzenten/Konsumenten nur ihren privaten Nutzen berücksichtigen, wird das Gut in zu geringer Menge bereitgestellt → Unterproduktion."},

{id:"e07", topic:"externeffekte", type:"mc", diff:2, tax:"K3",
 q:"Die Schweiz erhebt eine CO₂-Abgabe auf fossile Brennstoffe. Welcher ökonomische Zweck steht im Vordergrund?",
 options:[
   {v:"A", t:"Internalisierung negativer externer Effekte: Die Umweltkosten sollen im Preis abgebildet werden."},
   {v:"B", t:"Einnahmenmaximierung für den Bundeshaushalt."},
   {v:"C", t:"Subventionierung erneuerbarer Energien."},
   {v:"D", t:"Verbot fossiler Brennstoffe."}
 ],
 correct:"A",
 explain:"Die CO₂-Abgabe ist eine Lenkungsabgabe (Pigou-Steuer): Sie verteuert fossile Brennstoffe um die geschätzten externen Kosten der CO₂-Emissionen. Dadurch werden Anreize geschaffen, weniger CO₂ auszustossen und auf Alternativen umzusteigen. Ein Grossteil der Einnahmen wird an die Bevölkerung rückverteilt."},

{id:"e08", topic:"externeffekte", type:"open", diff:3, tax:"K4",
 q:"Vergleichen Sie die CO₂-Abgabe (Pigou-Steuer) mit dem Emissionshandel (Cap-and-Trade) als Instrumente zur Reduktion von CO₂-Emissionen. Welche Vor- und Nachteile hat jedes Instrument?",
 sample:"CO₂-Abgabe (Pigou-Steuer):\n+ Einfach umzusetzen, Preissicherheit für Unternehmen.\n+ Stabile Einnahmen für den Staat.\n– Die resultierende Emissionsmenge ist ungewiss (hängt von der Preisreaktion ab).\n– Schwer, den «richtigen» Steuersatz zu bestimmen.\n\nEmissionshandel (Cap-and-Trade):\n+ Emissionsmenge ist garantiert (Cap legt Limit fest).\n+ Reduktion geschieht dort, wo sie am günstigsten ist (kosteneffizient).\n– Der Zertifikatspreis schwankt (Planungsunsicherheit für Unternehmen).\n– Administrativ aufwendiger (Überwachung, Handel).\n\nBeide Instrumente internalisieren externe Kosten und nutzen den Preismechanismus. Die Wahl hängt davon ab, ob man den Preis (Steuer) oder die Menge (Cap) steuern will.",
 explain:"In der Praxis kombinieren viele Länder beide Instrumente (z.B. Schweiz: CO₂-Abgabe + Teilnahme am EU-Emissionshandel für Grossemittenten)."},

{id:"e09", topic:"externeffekte", type:"tf", diff:2, tax:"K2",
 q:"Beim Emissionshandel legt der Staat den Preis für Emissionsrechte fest.",
 correct:false,
 explain:"Falsch. Der Staat legt die Gesamtmenge (Cap) fest. Der Preis bildet sich durch Angebot und Nachfrage auf dem Markt für Emissionsrechte. Ist die Reduktion teuer, steigt der Preis; ist sie günstig, sinkt er."},

{id:"e10", topic:"externeffekte", type:"mc", diff:2, tax:"K3",
 q:"Welche Massnahme eignet sich, um positive externe Effekte von Bildung zu korrigieren?",
 options:[
   {v:"A", t:"Subventionen für Bildung oder Schulpflicht, damit mehr Bildung konsumiert wird."},
   {v:"B", t:"Steuern auf Bildung, um die Überproduktion zu reduzieren."},
   {v:"C", t:"Privatisierung aller Schulen."},
   {v:"D", t:"Verbot von privaten Bildungsangeboten."}
 ],
 correct:"A",
 explain:"Bei positiven externen Effekten (Bildung hat gesellschaftlichen Nutzen über den privaten Nutzen hinaus) wird zu wenig Bildung nachgefragt. Subventionen (z.B. kostenlose Schulen, Stipendien) oder Pflicht (Schulpflicht) korrigieren die Unterbereitstellung."},

{id:"e11", topic:"externeffekte", type:"calc", diff:2, tax:"K3",
 q:"Ein Unternehmen produziert 1'000 Tonnen CO₂ pro Jahr. Die CO₂-Abgabe beträgt CHF 120 pro Tonne. Berechnen Sie:",
 rows:[
   {label:"Jährliche Abgabelast", answer:120000, tolerance:0, unit:"CHF"},
   {label:"Wenn das Unternehmen Emissionen um 200 Tonnen reduziert (zu Vermeidungskosten von CHF 100/Tonne): Netto-Ersparnis durch die Reduktion", answer:4000, tolerance:0, unit:"CHF"}
 ],
 explain:"Abgabelast ohne Reduktion: 1'000 × 120 = 120'000 CHF. Mit Reduktion: 800 × 120 = 96'000 CHF Abgabe + 200 × 100 = 20'000 CHF Vermeidungskosten = 116'000 CHF. Ersparnis = 120'000 − 116'000 = 4'000 CHF. Die Reduktion lohnt sich, weil die Vermeidungskosten (100 CHF/t) tiefer sind als die Abgabe (120 CHF/t)."},

{id:"e12", topic:"externeffekte", type:"fill", diff:1, tax:"K1",
 q:"Externe Effekte, die Kosten für Dritte verursachen, heissen {0} externe Effekte. Externe Effekte, die Dritten einen Nutzen stiften, heissen {1} externe Effekte.",
 blanks:[
   {answer:"negative", alts:["negativer"]},
   {answer:"positive", alts:["positiver"]}
 ],
 explain:"Negative Externalitäten: Umweltverschmutzung, Lärm, Passivrauchen. Positive Externalitäten: Impfungen, Bildung, Forschung, schöne Gärten. Der Staat greift bei beiden Arten ein: Steuern/Verbote bei negativen, Subventionen/Gebote bei positiven."},

{id:"e13", topic:"externeffekte", type:"mc", diff:2, tax:"K3",
 img:{src:"img/vwl/markteffizienz/externe_effekte_negativ_pk_gk.svg", alt:"Negative externe Effekte: Gesellschaftliche Kosten (GK) über privaten Kosten (PK)"},
 q:"Das Diagramm zeigt negative externe Effekte. Die gesellschaftlichen Grenzkosten (GK) liegen über den privaten Grenzkosten (PK). Welche Aussage zur Marktmenge ist korrekt?",
 options:[
   {v:"A", t:"Im Marktgleichgewicht (Schnittpunkt N und PK) wird zu viel produziert, weil die externen Kosten nicht eingepreist sind."},
   {v:"B", t:"Im Marktgleichgewicht wird zu wenig produziert, weil die GK über den PK liegen."},
   {v:"C", t:"Das Marktgleichgewicht ist effizient, da die externen Kosten durch den Marktpreis abgedeckt werden."},
   {v:"D", t:"Die GK-Kurve hat keinen Einfluss auf die optimale Produktionsmenge."}
 ],
 correct:"A",
 explain:"Bei negativen externen Effekten liegen die gesellschaftlichen Grenzkosten (GK) über den privaten Grenzkosten (PK). Der Markt orientiert sich an PK und produziert die Menge Q_M (Schnittpunkt N und PK). Das soziale Optimum liegt aber bei Q* (Schnittpunkt N und GK), wo weniger produziert wird. Die Differenz Q_M − Q* ist die Überproduktion, die einen Wohlfahrtsverlust verursacht."},

{id:"e14", topic:"externeffekte", type:"mc", diff:2, tax:"K4",
 img:{src:"img/vwl/markteffizienz/externe_effekte_negativ_gk_ueber_pk.svg", alt:"Diagramm negative externe Effekte mit GK über PK"},
 q:"Das Diagramm zeigt negative externe Effekte. Die Gesellschaftlichen Kosten (GK) liegen über den Privaten Kosten (PK = A). Das Marktgleichgewicht liegt bei Q_M. Warum entsteht ein Wohlfahrtsverlust (WV)?",
 options:[
   {v:"A", t:"Weil die Produzenten zu wenig produzieren."},
   {v:"B", t:"Weil für jede Einheit zwischen Q* und Q_M die gesellschaftlichen Kosten den gesellschaftlichen Nutzen übersteigen."},
   {v:"C", t:"Weil der Staat eine Steuer erhebt, die den Preis verzerrt."},
   {v:"D", t:"Weil die Konsumenten die externen Kosten nicht kennen."}
 ],
 correct:"B",
 explain:"Zwischen Q* (soziales Optimum) und Q_M (Marktgleichgewicht) übersteigen die gesellschaftlichen Grenzkosten (GK) den gesellschaftlichen Grenznutzen (N = GN). Jede zusätzliche Einheit in diesem Bereich verursacht mehr Kosten als Nutzen — es wird zu viel produziert. Der Wohlfahrtsverlust (WV-Dreieck) entspricht dem Überschuss der Kosten über den Nutzen für diese Einheiten."},
{id:"e15", topic:"externeffekte", type:"mc", diff:3, tax:"K5",
 img:{src:"img/vwl/markteffizienz/externe_effekte_negativ_gk_ueber_pk.svg", alt:"Diagramm negative externe Effekte mit GK über PK"},
 q:"Wie kann der Staat das Marktgleichgewicht zum sozialen Optimum Q* korrigieren?",
 options:[
   {v:"A", t:"Durch eine Pigou-Steuer in Höhe der externen Kosten pro Einheit (bei Q*), die PK auf GK anhebt."},
   {v:"B", t:"Durch eine Subvention an die Produzenten, damit sie weniger produzieren."},
   {v:"C", t:"Durch einen Höchstpreis unterhalb des Marktpreises."},
   {v:"D", t:"Durch eine Erhöhung der Nachfrage."}
 ],
 correct:"A",
 explain:"Eine Pigou-Steuer internalisiert die externen Kosten: Sie entspricht genau der Differenz zwischen GK und PK bei Q*. Dadurch verschiebt sich die private Angebotskurve nach oben auf GK, und das neue Marktgleichgewicht fällt mit dem sozialen Optimum zusammen. Der Wohlfahrtsverlust wird eliminiert. Die schattierte Fläche ‹Ext. Kosten› im Diagramm zeigt die Gesamtheit der externen Kosten, die vor der Korrektur von Dritten (z.B. Anwohner, Umwelt) getragen werden."},

// ── ASYMMETRISCHE INFORMATION (i01–i10) ──
{id:"i01", topic:"asyminfo", type:"mc", diff:1, tax:"K1",
 q:"Was versteht man unter asymmetrischer Information?",
 options:[
   {v:"A", t:"Eine Situation, in der Marktteilnehmer unterschiedlich gut informiert sind."},
   {v:"B", t:"Eine Situation, in der alle Marktteilnehmer gleich gut informiert sind."},
   {v:"C", t:"Eine Situation, in der der Staat mehr Information hat als der Markt."},
   {v:"D", t:"Eine Situation, in der die Preise alle Informationen widerspiegeln."}
 ],
 correct:"A",
 explain:"Asymmetrische Information bedeutet: Eine Seite eines Geschäfts weiss mehr als die andere. Beispiel: Der Verkäufer eines Gebrauchtwagens kennt die Qualität besser als der Käufer. Dies kann zu Marktversagen führen."},

{id:"i02", topic:"asyminfo", type:"mc", diff:2, tax:"K2",
 q:"Was beschreibt das Konzept «Moral Hazard»?",
 options:[
   {v:"A", t:"Risikoreicheres Verhalten, weil die Kosten eines Schadens von einer anderen Partei getragen werden."},
   {v:"B", t:"Die Tendenz, nur qualitativ schlechte Produkte auf dem Markt anzubieten."},
   {v:"C", t:"Die absichtliche Täuschung von Geschäftspartnern."},
   {v:"D", t:"Die Überbewertung von Risiken durch Konsumenten."}
 ],
 correct:"A",
 explain:"Moral Hazard (moralisches Risiko): Eine versicherte Person verhält sich riskanter, weil sie die Konsequenzen nicht voll tragen muss. Beispiel: Wer eine Vollkaskoversicherung hat, fährt möglicherweise unvorsichtiger, weil die Versicherung den Schaden deckt."},

{id:"i03", topic:"asyminfo", type:"mc", diff:2, tax:"K2",
 q:"Was beschreibt «Adverse Selektion»?",
 options:[
   {v:"A", t:"Die Negativauslese: Auf einem Markt bleiben vor allem «schlechte» Angebote übrig, weil Käufer die Qualität nicht beurteilen können."},
   {v:"B", t:"Die gezielte Auswahl der besten Mitarbeiter durch Unternehmen."},
   {v:"C", t:"Die staatliche Regulierung von Märkten."},
   {v:"D", t:"Die bewusste Verknappung von Gütern durch Produzenten."}
 ],
 correct:"A",
 explain:"Adverse Selektion (George Akerlof, «Market for Lemons»): Wenn Käufer die Qualität nicht beurteilen können, bieten sie nur niedrige Preise. Verkäufer guter Qualität ziehen sich zurück → nur minderwertige Produkte bleiben übrig. Im Extremfall bricht der Markt zusammen."},

{id:"i04", topic:"asyminfo", type:"tf", diff:2, tax:"K2",
 q:"Im «Market for Lemons»-Modell von Akerlof bricht der Gebrauchtwagenmarkt zusammen, weil Käufer nicht zwischen guten und schlechten Autos unterscheiden können.",
 correct:true,
 explain:"Korrekt. Akerlof zeigte: Wenn Käufer die Qualität nicht einschätzen können, bieten sie einen Durchschnittspreis. Für Verkäufer guter Autos ist dieser Preis zu tief → sie verlassen den Markt. Es bleiben nur «Lemons» (schlechte Autos) → der Markt für gute Autos schrumpft oder verschwindet."},

{id:"i05", topic:"asyminfo", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Beispiele zu: Handelt es sich um Moral Hazard oder Adverse Selektion?",
 categories:["Moral Hazard", "Adverse Selektion"],
 items:[
   {t:"Vollkaskoversicherte fahren unvorsichtiger", cat:0},
   {t:"Nur kranke Menschen schliessen eine Krankenversicherung ab", cat:1},
   {t:"Banken gehen höhere Risiken ein, weil sie auf staatliche Rettung zählen (Too Big to Fail)", cat:0},
   {t:"Auf dem Gebrauchtwagenmarkt werden vor allem schlechte Autos angeboten", cat:1},
   {t:"Ein Arbeitnehmer arbeitet weniger hart, nachdem er festangestellt wurde", cat:0}
 ],
 explain:"Moral Hazard: Verhaltensänderung NACH Vertragsabschluss (man verhält sich riskanter). Adverse Selektion: Negativauslese VOR Vertragsabschluss (die 'falschen' Teilnehmer werden angezogen/die 'richtigen' abgeschreckt)."},

{id:"i06", topic:"asyminfo", type:"mc", diff:2, tax:"K3",
 q:"Welche Massnahme hilft gegen Moral Hazard in der Versicherungsbranche?",
 options:[
   {v:"A", t:"Selbstbehalt: Der Versicherte trägt einen Teil des Schadens selbst und hat daher einen Anreiz zur Vorsicht."},
   {v:"B", t:"Abschaffung aller Versicherungen."},
   {v:"C", t:"Erhöhung der Prämien für alle Versicherten."},
   {v:"D", t:"Verbot von Risikoprüfungen."}
 ],
 correct:"A",
 explain:"Der Selbstbehalt (z.B. CHF 500 pro Schadensfall) sorgt dafür, dass der Versicherte ein eigenes Interesse an Schadensvermeidung behält. Weitere Massnahmen: Bonus-Malus-Systeme (gute Fahrt = niedrigere Prämie), Überwachung, vertragliche Auflagen."},

{id:"i07", topic:"asyminfo", type:"fill", diff:1, tax:"K1",
 q:"Das Modell des «Market for Lemons» wurde von {0} entwickelt. Es zeigt, wie asymmetrische Information zu {1} führen kann.",
 blanks:[
   {answer:"George Akerlof", alts:["Akerlof"]},
   {answer:"Adverser Selektion", alts:["Negativauslese","adverse Selektion","Adverse Selection"]}
 ],
 explain:"George Akerlof erhielt 2001 den Nobelpreis für dieses Modell. «Lemons» ist amerikanischer Slang für fehlerhafte Gebrauchtwagen. Das Modell erklärt, warum Märkte mit Informationsasymmetrie versagen können."},

{id:"i08", topic:"asyminfo", type:"tf", diff:2, tax:"K2",
 q:"Garantien und Zertifikate sind private Lösungsansätze gegen asymmetrische Information.",
 correct:true,
 explain:"Korrekt. Garantien signalisieren dem Käufer Qualität (ein Verkäufer minderwertiger Ware würde keine Garantie geben). Zertifikate (z.B. Bio-Label, TÜV) reduzieren die Informationsasymmetrie durch unabhängige Prüfung. Auch Probezeiten im Arbeitsmarkt und Online-Bewertungen dienen diesem Zweck."},

{id:"i09", topic:"asyminfo", type:"open", diff:3, tax:"K4",
 q:"Analysieren Sie das «Too Big to Fail»-Problem bei Grossbanken als Beispiel für Moral Hazard.",
 sample:"«Too Big to Fail» beschreibt die Situation, in der eine Grossbank so wichtig für das Finanzsystem ist, dass der Staat sie im Krisenfall retten muss.\n\nMoral Hazard: Die Bank weiss, dass der Staat sie retten wird → sie geht höhere Risiken ein, als sie es ohne diese implizite Garantie tun würde. Die Gewinne bleiben privat, die Verluste werden sozialisiert (Steuerzahler tragen das Risiko).\n\nMassnahmen dagegen:\n- Höhere Eigenkapitalanforderungen (Basel III)\n- Notfallpläne (Resolution Plans)\n- Boni-Beschränkungen für Manager\n- In der Schweiz: «Too Big to Fail»-Regulierung (FINMA)\n\nDas Grundproblem bleibt: Solange die implizite Staatsgarantie besteht, haben Grossbanken einen Anreiz zu übermässiger Risikonahme.",
 explain:"Die Finanzkrise 2008 und die Credit-Suisse-Krise 2023 sind reale Beispiele für dieses Moral-Hazard-Problem."},

{id:"i10", topic:"asyminfo", type:"mc", diff:2, tax:"K2",
 q:"Welche Massnahme hilft gegen Adverse Selektion auf dem Arbeitsmarkt?",
 options:[
   {v:"A", t:"Zeugnisse, Zertifikate und Probezeiten, die den Arbeitgebern Informationen über die Fähigkeiten der Bewerber liefern."},
   {v:"B", t:"Abschaffung aller Qualifikationsanforderungen."},
   {v:"C", t:"Erhöhung des Mindestlohns."},
   {v:"D", t:"Verbot von Bewerbungsgesprächen."}
 ],
 correct:"A",
 explain:"Auf dem Arbeitsmarkt wissen Bewerber mehr über ihre Fähigkeiten als Arbeitgeber. Zeugnisse und Zertifikate «signalisieren» Qualifikation (Signalling nach Spence). Probezeiten ermöglichen dem Arbeitgeber, die tatsächliche Leistung zu beobachten (Screening)."},

// ── STEUERN & WOHLFAHRTSVERLUST (s01–s10) ──
{id:"s01", topic:"steuern", type:"mc", diff:2, tax:"K2",
 img:{src:"img/vwl/markteffizienz/steuerkeil_diagramm.svg", alt:"Steuerdiagramm: Konsumentenpreis P_K, Produzentenpreis P_P und Steuerkeil t"},
 q:"Eine Steuer auf ein Gut verschiebt im Preis-Mengen-Diagramm die Angebotskurve nach oben/links. Warum?",
 options:[
   {v:"A", t:"Weil die Steuer die Produktionskosten erhöht — Anbieter verlangen bei jeder Menge einen höheren Preis."},
   {v:"B", t:"Weil die Steuer die Nachfrage reduziert."},
   {v:"C", t:"Weil die Steuer die Gewinne der Produzenten erhöht."},
   {v:"D", t:"Weil die Steuer die Produktionsmenge vorschreibt."}
 ],
 correct:"A",
 explain:"Eine Steuer wirkt wie eine Erhöhung der Kosten. Die Angebotskurve verschiebt sich um den Steuerbetrag nach oben (= nach links). Im neuen Gleichgewicht: Der Preis für Konsumenten steigt, der Erlös für Produzenten (nach Steuer) sinkt, die Menge geht zurück."},

{id:"s02", topic:"steuern", type:"mc", diff:2, tax:"K2",
 q:"Was bestimmt, wer die Steuerlast hauptsächlich trägt — Konsumenten oder Produzenten?",
 options:[
   {v:"A", t:"Die Preiselastizität von Angebot und Nachfrage: Die unelastischere Seite trägt den grösseren Teil."},
   {v:"B", t:"Immer die Konsumenten, weil sie den höheren Preis zahlen."},
   {v:"C", t:"Immer die Produzenten, weil sie die Steuer abführen müssen."},
   {v:"D", t:"Der Staat entscheidet, wer die Steuer bezahlt."}
 ],
 correct:"A",
 explain:"Die Steuerinzidenz hängt von den Elastizitäten ab: Die Marktseite, die weniger ausweichen kann (unelastischere Seite), trägt den grösseren Teil der Steuerlast. Bei unelastischer Nachfrage (z.B. Benzin) wird die Steuer grösstenteils auf die Konsumenten überwälzt."},

{id:"s03", topic:"steuern", type:"tf", diff:2, tax:"K2",
 q:"Bei einer sehr steilen (unelastischen) Nachfragekurve wird eine Steuer grösstenteils auf die Konsumenten überwälzt.",
 correct:true,
 explain:"Korrekt. Eine steile Nachfragekurve zeigt, dass Konsumenten kaum auf Preiserhöhungen reagieren (wenige Substitute, z.B. Insulin, Benzin). Deshalb können Produzenten die Steuer fast vollständig über höhere Preise weitergeben."},

{id:"s04", topic:"steuern", type:"tf", diff:2, tax:"K2",
 q:"Bei einer flachen (elastischen) Nachfragekurve können Produzenten die Steuer grösstenteils auf die Konsumenten überwälzen.",
 correct:false,
 explain:"Falsch. Bei elastischer Nachfrage reagieren Konsumenten stark auf Preiserhöhungen (viele Substitute verfügbar). Versuchen Produzenten, die Steuer über den Preis weiterzugeben, bricht die Nachfrage ein. Daher tragen die Produzenten den grösseren Teil der Steuerlast."},

{id:"s05", topic:"steuern", type:"mc", diff:2, tax:"K2",
 q:"Was ist die Steuerinzidenz?",
 options:[
   {v:"A", t:"Die tatsächliche Verteilung der Steuerlast zwischen Konsumenten und Produzenten."},
   {v:"B", t:"Der Steuersatz in Prozent des Preises."},
   {v:"C", t:"Die Höhe der Steuereinnahmen des Staates."},
   {v:"D", t:"Die Anzahl der steuerpflichtigen Güter."}
 ],
 correct:"A",
 explain:"Die Steuerinzidenz beschreibt, wer die Steuerlast wirtschaftlich tatsächlich trägt — unabhängig davon, wer die Steuer formal abführen muss. Entscheidend sind die Elastizitäten: Die unelastischere Seite trägt mehr."},

{id:"s06", topic:"steuern", type:"open", diff:3, tax:"K4",
 q:"Eine Steuererhöhung von 20% auf Benzin wird diskutiert. Analysieren Sie: (a) Wer trägt die Steuerlast hauptsächlich? (b) Wie stark geht der Benzinverbrauch zurück? (Hinweis: Die Preiselastizität der Benzinnachfrage beträgt ca. 0.4.)",
 sample:"(a) Steuerlast: Die Nachfrage nach Benzin ist unelastisch (Elastizität 0.4 < 1). Benzin hat kurzfristig wenige Substitute — Autofahrer können nicht sofort auf Alternativen umsteigen. Daher wird der grösste Teil der Steuer auf die Konsumenten überwälzt (höhere Benzinpreise).\n\n(b) Verbrauchsrückgang: Bei einer Preiserhöhung von 20% und einer Elastizität von 0.4 sinkt der Verbrauch um ca. 0.4 × 20% = 8%. Der Benzinverbrauch geht also nur mässig zurück.\n\nFazit: Die Steuer ist ein wirksames Einnahmeninstrument, aber ein mässig wirksames Lenkungsinstrument (weil die Nachfrage unelastisch ist). Langfristig steigt die Elastizität, weil Konsumenten auf E-Autos oder ÖV umsteigen können.",
 explain:"Die Unterscheidung zwischen kurz- und langfristiger Elastizität ist wichtig: Kurzfristig ist Benzin schwer ersetzbar, langfristig passen sich Konsumenten an (Autokauf, Wohnortwahl, ÖV)."},

{id:"s07", topic:"steuern", type:"mc", diff:2, tax:"K2",
 q:"Warum entsteht durch eine Steuer ein Wohlfahrtsverlust (Deadweight Loss)?",
 options:[
   {v:"A", t:"Weil die Steuer Transaktionen verhindert, die ohne Steuer für beide Seiten vorteilhaft wären."},
   {v:"B", t:"Weil der Staat die Steuereinnahmen verschwendet."},
   {v:"C", t:"Weil die Produzenten ihre Gewinne vollständig verlieren."},
   {v:"D", t:"Weil die Konsumentenrente auf null sinkt."}
 ],
 correct:"A",
 explain:"Die Steuer erhöht den Preis für Konsumenten und senkt den Erlös für Produzenten → die Gleichgewichtsmenge sinkt. Transaktionen, bei denen Zahlungsbereitschaft > Grenzkosten (aber < Grenzkosten + Steuer), finden nicht mehr statt. Dieser verlorene Handelsgewinn ist der Wohlfahrtsverlust — er geht an niemanden."},

{id:"s08", topic:"steuern", type:"calc", diff:2, tax:"K3",
 q:"Vor einer Steuer: Gleichgewichtspreis = CHF 10, Menge = 100. Nach einer Steuer von CHF 2/Stück: Konsumentenpreis = CHF 11, Produzentenerlös = CHF 9, Menge = 90. Berechnen Sie:",
 rows:[
   {label:"Steuereinnahmen des Staates", answer:180, tolerance:0, unit:"CHF"},
   {label:"Anteil der Steuer, den die Konsumenten tragen (Preisanstieg)", answer:1, tolerance:0, unit:"CHF"},
   {label:"Anteil der Steuer, den die Produzenten tragen (Erlösrückgang)", answer:1, tolerance:0, unit:"CHF"}
 ],
 explain:"Steuereinnahmen = Steuer × Menge = 2 × 90 = 180 CHF. Konsumenten zahlen 11 statt 10 = +1 CHF (50%). Produzenten erhalten 9 statt 10 = −1 CHF (50%). In diesem Fall teilen sich beide Seiten die Last gleichmässig — das ist Zufall und hängt von den Elastizitäten ab."},

{id:"s09", topic:"steuern", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die Wohlfahrtseffekte einer Mengensteuer den Kategorien zu.",
 categories:["Verlust für Konsumenten", "Verlust für Produzenten", "Gewinn für den Staat", "Wohlfahrtsverlust (geht an niemanden)"],
 items:[
   {t:"Konsumentenrente sinkt durch höheren Preis", cat:0},
   {t:"Produzentenrente sinkt durch tieferen Erlös", cat:1},
   {t:"Steuereinnahmen (Rechteck zwischen neuem und altem Preis × neue Menge)", cat:2},
   {t:"Dreieck rechts der neuen Menge (verlorene Transaktionen)", cat:3}
 ],
 explain:"Die Steuer hat vier Effekte: KR sinkt, PR sinkt, Staat erhält Einnahmen, ein Teil der verlorenen Renten geht als Deadweight Loss verloren. Die Steuereinnahmen sind NICHT der Wohlfahrtsverlust — der WFV ist nur das Dreieck der verhinderten Transaktionen."},

{id:"s10", topic:"steuern", type:"tf", diff:2, tax:"K2",
 q:"Je elastischer Angebot und Nachfrage sind, desto grösser ist der Wohlfahrtsverlust einer Steuer.",
 correct:true,
 explain:"Korrekt. Bei elastischen Kurven reagieren beide Seiten stark auf die Steuer → die Mengenreduktion ist gross → viele Transaktionen fallen weg → grosser Wohlfahrtsverlust. Bei unelastischen Kurven ist die Mengenreduktion gering → kleiner Wohlfahrtsverlust."},

{id:"s11", topic:"steuern", type:"mc", diff:2, tax:"K3",
 img:{src:"img/vwl/markteffizienz/steuerkeil_diagramm.svg", alt:"Steuerinzidenz: Konsumentenpreis P_K, Produzentenpreis P_P und Steuerkeil t"},
 q:"Das Diagramm zeigt die Wirkung einer Mengensteuer. Der Steuerkeil t treibt Konsumentenpreis (P_K) und Produzentenpreis (P_P) auseinander. Was zeigt der Wohlfahrtsverlust (WV) im Diagramm?",
 options:[
   {v:"A", t:"Den entgangenen Nutzen, weil wegen der Steuer weniger gehandelt wird als im Optimum."},
   {v:"B", t:"Die Steuereinnahmen des Staates, da diese dem Markt entzogen werden."},
   {v:"C", t:"Den Gewinn der Produzenten, der durch die Steuer wegfällt."},
   {v:"D", t:"Die gesamte Konsumentenrente, die durch die Steuer verloren geht."}
 ],
 correct:"A",
 explain:"Der Wohlfahrtsverlust (Deadweight Loss) entsteht, weil die Steuer die gehandelte Menge von Q* auf Q_t reduziert. Für die Einheiten zwischen Q_t und Q* wäre die Zahlungsbereitschaft der Konsumenten höher als die Grenzkosten der Produzenten — der Handel wäre also für beide Seiten vorteilhaft. Die Steuer verhindert jedoch diesen Austausch. Der WV geht an niemanden: weder an Konsumenten, Produzenten noch an den Staat."},

{id:"s12", topic:"steuern", type:"mc", diff:2, tax:"K4",
 img:{src:"img/vwl/markteffizienz/steuerinzidenz_elastische_nachfrage.svg", alt:"Steuerdiagramm bei elastischer Nachfrage und unelastischem Angebot"},
 q:"Das Diagramm zeigt eine Steuer bei elastischer Nachfrage und unelastischem Angebot. Welche Aussage zur Steuerlastverteilung ist korrekt?",
 options:[
   {v:"A", t:"Die Konsumenten tragen den grösseren Teil der Steuerlast (B > D)."},
   {v:"B", t:"Die Produzenten tragen den grösseren Teil der Steuerlast (D > B)."},
   {v:"C", t:"Konsumenten und Produzenten tragen die Steuerlast zu gleichen Teilen."},
   {v:"D", t:"Die Steuerlast wird vollständig auf die Konsumenten überwälzt."}
 ],
 correct:"B",
 explain:"Bei elastischer Nachfrage und unelastischem Angebot tragen die Produzenten den grösseren Anteil. Im Diagramm ist Fläche D (Steuerlast Produzenten) deutlich grösser als Fläche B (Steuerlast Konsumenten). Die elastische Seite kann leichter ausweichen (Konsumenten substituieren), während die unelastische Seite (Produzenten) die Last tragen muss."},
{id:"s13", topic:"steuern", type:"mc", diff:2, tax:"K4",
 img:{src:"img/vwl/markteffizienz/steuerinzidenz_unelastische_nachfrage.svg", alt:"Steuerdiagramm bei unelastischer Nachfrage und elastischem Angebot"},
 q:"Das Diagramm zeigt eine Steuer bei unelastischer Nachfrage und elastischem Angebot. Welche Aussage ist korrekt?",
 options:[
   {v:"A", t:"Die Konsumenten tragen den grösseren Teil der Steuerlast (B > D)."},
   {v:"B", t:"Die Produzenten tragen den grösseren Teil der Steuerlast (D > B)."},
   {v:"C", t:"Die Steuerlast verteilt sich symmetrisch auf beide Seiten."},
   {v:"D", t:"Der Wohlfahrtsverlust ist grösser als die Steuereinnahmen."}
 ],
 correct:"A",
 explain:"Bei unelastischer Nachfrage und elastischem Angebot tragen die Konsumenten den grösseren Anteil. Im Diagramm ist Fläche B (Steuerlast Konsumenten) deutlich grösser als Fläche D (Steuerlast Produzenten). Unelastische Nachfrage bedeutet: Konsumenten können kaum ausweichen und akzeptieren höhere Preise. Die Steuer wird überwälzt auf die Marktseite, die weniger flexibel reagiert."},
{id:"s14", topic:"steuern", type:"tf", diff:2, tax:"K4",
 q:"Eine Steuer auf Benzin (unelastische Nachfrage) wird grösstenteils von den Produzenten getragen, weil diese die Steuer formell abführen müssen.",
 correct:false,
 explain:"Falsch. Es ist ökonomisch irrelevant, wer die Steuer formell bezahlt (gesetzliche Inzidenz). Entscheidend ist die ökonomische Inzidenz: Bei unelastischer Nachfrage tragen die Konsumenten den grösseren Teil, weil sie kaum auf Alternativen ausweichen können. Die Steuer wird über den Preis an die Konsumenten weitergegeben, unabhängig davon, wer sie ans Steueramt überweist."},
{id:"s15", topic:"steuern", type:"open", diff:3, tax:"K5",
 img:{src:"img/vwl/markteffizienz/steuerinzidenz_elastische_nachfrage.svg", alt:"Steuerdiagramm bei elastischer Nachfrage"},
 q:"Vergleichen Sie die beiden Diagramme (elastische vs. unelastische Nachfrage): Bei welcher Konstellation ist der Wohlfahrtsverlust grösser? Begründen Sie ökonomisch, warum die Elastizität der Nachfrage für die Effizienz einer Steuer relevant ist.",
 points:[
   "Bei elastischer Nachfrage ist der Wohlfahrtsverlust (C + E) grösser als bei unelastischer Nachfrage.",
   "Elastische Nachfrage bedeutet: Konsumenten reagieren stark auf Preisänderungen und weichen aus.",
   "Dies führt zu einem stärkeren Mengenrückgang (Q* → Q_t), was die entgangenen Tauschgewinne vergrössert.",
   "Bei unelastischer Nachfrage bleibt die gehandelte Menge näher am Optimum — der Effizienzverlust ist geringer.",
   "Fazit: Steuern auf Güter mit unelastischer Nachfrage verursachen weniger Wohlfahrtsverluste und sind daher effizienter."
 ],
 explain:"Je elastischer die Nachfrage (oder das Angebot), desto stärker reagiert die Menge auf die steuerbedingte Preisänderung. Ein grösserer Mengenrückgang bedeutet mehr entgangene Tauschgewinne und einen grösseren Wohlfahrtsverlust. Effiziente Steuern setzen daher an Gütern mit geringer Elastizität an (z.B. Tabak, Benzin). Dies ist der Kern der Ramsey-Regel der Optimalsteuertheorie."},

// ── STAATSVERSAGEN & POLITIKVERSAGEN (p01–p08) ──
{id:"p01", topic:"staatsversagen", type:"mc", diff:1, tax:"K1",
 q:"Was versteht man unter Staatsversagen?",
 options:[
   {v:"A", t:"Wenn staatliche Eingriffe zu schlechteren Ergebnissen führen als der Markt — z.B. durch Ineffizienz, Fehlplanung oder politisch motivierte Entscheidungen."},
   {v:"B", t:"Wenn der Staat bankrott geht."},
   {v:"C", t:"Wenn der Staat keine Steuern erhebt."},
   {v:"D", t:"Wenn der Staat den Markt nicht reguliert."}
 ],
 correct:"A",
 explain:"Staatsversagen (Government Failure) liegt vor, wenn der Staat versucht, ein Marktversagen zu korrigieren, aber dabei selbst ineffiziente oder kontraproduktive Ergebnisse erzeugt. Es ist das Pendant zum Marktversagen."},

{id:"p02", topic:"staatsversagen", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Probleme zu: Handelt es sich um Formen von Marktversagen oder Staatsversagen?",
 categories:["Marktversagen", "Staatsversagen"],
 items:[
   {t:"Monopolistische Preissetzung", cat:0},
   {t:"Übermässige Bürokratie und Regulierungskosten", cat:1},
   {t:"Externe Effekte durch Umweltverschmutzung", cat:0},
   {t:"Politisch motivierte Subventionen an ineffiziente Branchen", cat:1},
   {t:"Asymmetrische Information auf Versicherungsmärkten", cat:0},
   {t:"Korruption und Ressourcenverschwendung in der Verwaltung", cat:1}
 ],
 explain:"Marktversagen: Der Markt allein liefert kein effizientes Ergebnis (Monopol, Externalitäten, öff. Güter, asym. Info). Staatsversagen: Die staatliche Korrektur verschlimmert das Problem oder schafft neue (Bürokratie, Lobbying, Fehlplanung, Korruption)."},

{id:"p03", topic:"staatsversagen", type:"mc", diff:2, tax:"K2",
 q:"Welches Problem beschreibt «Regulatory Capture» (Regulierungsfalle)?",
 options:[
   {v:"A", t:"Regulierungsbehörden werden von der Industrie beeinflusst und dienen deren Interessen statt dem Gemeinwohl."},
   {v:"B", t:"Der Staat reguliert zu wenig."},
   {v:"C", t:"Regulierung führt automatisch zu mehr Wettbewerb."},
   {v:"D", t:"Regulierung wird von den Konsumenten abgelehnt."}
 ],
 correct:"A",
 explain:"Regulatory Capture: Unternehmen beeinflussen durch Lobbying die Regulierungsbehörden, die eigentlich den Wettbewerb schützen sollen. Das Ergebnis: Regulierung dient den Interessen der regulierten Branche statt der Allgemeinheit — eine Form von Staatsversagen."},

{id:"p04", topic:"staatsversagen", type:"tf", diff:2, tax:"K2",
 q:"Staatsversagen bedeutet, dass der Staat grundsätzlich nie in die Wirtschaft eingreifen sollte.",
 correct:false,
 explain:"Falsch. Staatsversagen zeigt, dass staatliche Eingriffe Kosten und Risiken haben — nicht, dass sie nie sinnvoll sind. Bei echtem Marktversagen kann ein (gut gestalteter) Staatseingriff die Wohlfahrt verbessern. Die Frage ist immer: Ist das Ergebnis mit Eingriff besser als ohne?"},

{id:"p05", topic:"staatsversagen", type:"open", diff:3, tax:"K5",
 q:"«Der Staat soll nur eingreifen, wenn das Staatsversagen kleiner ist als das Marktversagen.» Beurteilen Sie diese Aussage.",
 sample:"Die Aussage enthält einen wichtigen Kern: Staatliche Eingriffe sind nur dann sinnvoll, wenn sie das Problem lösen, ohne grössere neue Probleme zu schaffen.\n\nArgumente dafür:\n- Der Staat ist nicht perfekt (Bürokratie, politische Interessen, Informationsmängel).\n- Die Kosten des Eingriffs (Verwaltung, Verzerrungen) müssen den Nutzen (Korrektur des Marktversagens) übersteigen.\n\nArgumente dagegen:\n- In der Praxis ist es sehr schwer, Marktversagen und Staatsversagen zu quantifizieren und zu vergleichen.\n- Manche Werte (Gesundheit, Sicherheit, Umwelt) lassen sich nicht rein in Wohlfahrtseffizenz messen.\n- Verteilungsgerechtigkeit kann einen Eingriff auch dann rechtfertigen, wenn er nicht streng effizient ist.\n\nFazit: Der Vergleich ist theoretisch richtig, in der Praxis aber komplex. Es braucht eine sorgfältige Kosten-Nutzen-Analyse jedes einzelnen Eingriffs.",
 explain:"Diese Frage erfordert eine differenzierte Beurteilung (K5). Entscheidend ist die Argumentationsqualität."},

{id:"p06", topic:"staatsversagen", type:"mc", diff:2, tax:"K2",
 q:"Welches der folgenden Beispiele illustriert Staatsversagen am besten?",
 options:[
   {v:"A", t:"Subventionen für Kohlekraftwerke verlangsamen den Übergang zu erneuerbaren Energien."},
   {v:"B", t:"Ein Monopol erhöht die Preise."},
   {v:"C", t:"Umweltverschmutzung durch eine Chemiefabrik."},
   {v:"D", t:"Ein Konsument kauft ein defektes Produkt."}
 ],
 correct:"A",
 explain:"Subventionen für fossile Energien sind ein klassisches Beispiel für Staatsversagen: Der Staat subventioniert eine Industrie, die negative Externalitäten verursacht, statt sie zu internalisieren. Politische Interessen (Arbeitsplätze, Lobbying) verhindern die ökonomisch sinnvolle Politik."},

{id:"p07", topic:"staatsversagen", type:"fill", diff:1, tax:"K1",
 q:"Mögliche Ursachen für Staatsversagen sind: politisch motivierte Entscheidungen, {0}, Verzerrung der Allokationseffizienz und {1}.",
 blanks:[
   {answer:"Regulierungskosten", alts:["Bürokratie","Bürokratiekosten"]},
   {answer:"Ineffizienz", alts:["Korruption","Fehlplanung"]}
 ],
 explain:"Staatsversagen entsteht durch: (1) Politische statt ökonomische Motive, (2) hohe Regulierungs- und Verwaltungskosten (Bürokratie), (3) Verzerrungen der Ressourcenzuteilung, (4) Ineffizienz (Fehlplanung, Korruption, fehlende Anreize, Inflexibilität)."},

{id:"p08", topic:"staatsversagen", type:"tf", diff:2, tax:"K2",
 q:"Staatliche Unternehmen arbeiten tendenziell weniger effizient als private Unternehmen, weil der Konkurrenzdruck fehlt.",
 correct:true,
 explain:"Tendenziell ja: Ohne Wettbewerbsdruck und die Möglichkeit des Konkurses fehlen wichtige Anreize zur Effizienzsteigerung. Allerdings gibt es Ausnahmen (z.B. gut geführte öffentliche Unternehmen) und Bereiche, in denen der Staat natürliche Monopole effizienter verwalten kann als private Anbieter."},

// ── WACHSTUM & NACHHALTIGKEIT (n01–n08) ──
{id:"n01", topic:"nachhaltigkeit", type:"mc", diff:1, tax:"K1",
 q:"Was beschreibt das «Wachstumstrilemma»?",
 options:[
   {v:"A", t:"Den Zielkonflikt zwischen Wirtschaftswachstum, Umweltschutz und sozialer Gerechtigkeit."},
   {v:"B", t:"Die Unmöglichkeit, BIP, Inflation und Arbeitslosigkeit gleichzeitig zu steuern."},
   {v:"C", t:"Den Konflikt zwischen Importen, Exporten und Binnennachfrage."},
   {v:"D", t:"Die Schwierigkeit, Steuern, Ausgaben und Schulden gleichzeitig zu senken."}
 ],
 correct:"A",
 explain:"Das Wachstumstrilemma besagt, dass die drei Ziele — wirtschaftliches Wachstum, ökologische Nachhaltigkeit und soziale Gerechtigkeit — in Spannung zueinander stehen. Fortschritte bei einem Ziel können Rückschritte bei einem anderen bedeuten."},

{id:"n02", topic:"nachhaltigkeit", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Aussagen dem richtigen Wachstumsmodell zu.",
 categories:["Green Growth (Grünes Wachstum)", "Beyond Growth", "Degrowth (Postwachstum)"],
 items:[
   {t:"Wachstum und Umweltschutz gehen Hand in Hand dank technologischem Fortschritt", cat:0},
   {t:"BIP ist der falsche Massstab — neue Wohlfahrtsindikatoren nötig", cat:1},
   {t:"Wirtschaftswachstum muss aktiv reduziert werden, um die Umwelt zu schützen", cat:2},
   {t:"Kostenwahrheit durch Internalisierung externer Effekte löst das Problem", cat:0},
   {t:"Der Staat muss durch aktive Industriepolitik die Wirtschaft lenken", cat:1},
   {t:"Suffizienz (weniger Konsum) statt Effizienz (gleicher Konsum mit weniger Ressourcen)", cat:2}
 ],
 explain:"Green Growth: Wachstum und Umwelt sind vereinbar (Entkopplung, Internalisierung). Beyond Growth (OECD): Neue Ziele statt BIP-Wachstum (Wohlbefinden, Nachhaltigkeit, Gerechtigkeit). Degrowth: Wachstum an sich ist das Problem — die Wirtschaft muss schrumpfen."},

{id:"n03", topic:"nachhaltigkeit", type:"fill", diff:2, tax:"K2",
 q:"Die Trennung von Wirtschaftswachstum und Ressourcenverbrauch heisst {0}. Wenn der Ressourcenverbrauch sinkt, während das BIP steigt, spricht man von {1} Entkopplung.",
 blanks:[
   {answer:"Entkopplung", alts:["Decoupling"]},
   {answer:"absoluter", alts:["absolute"]}
 ],
 explain:"Relative Entkopplung: Der Ressourcenverbrauch wächst langsamer als das BIP (aber er wächst noch). Absolute Entkopplung: Der Ressourcenverbrauch sinkt bei steigendem BIP. Nur absolute Entkopplung ist langfristig nachhaltig — und sie ist empirisch bisher selten nachgewiesen."},

{id:"n04", topic:"nachhaltigkeit", type:"mc", diff:2, tax:"K2",
 q:"Was beschreibt das Jevons-Paradoxon (Rebound-Effekt)?",
 options:[
   {v:"A", t:"Effizienzsteigerungen führen nicht zu Ressourceneinsparungen, weil der günstigere Verbrauch zu mehr Nutzung führt."},
   {v:"B", t:"Technologischer Fortschritt führt immer zu weniger Ressourcenverbrauch."},
   {v:"C", t:"Steigende Preise führen zu sinkendem Konsum."},
   {v:"D", t:"Der Staat kann durch Regulierung den Ressourcenverbrauch steuern."}
 ],
 correct:"A",
 explain:"Jevons-Paradoxon (1865): Effizientere Dampfmaschinen führten zu MEHR Kohleverbrauch, weil die günstigere Energie mehr Nutzung anregte. Modernes Beispiel: LED-Lampen verbrauchen weniger Strom → Menschen lassen mehr Lichter brennen. Effizienz allein reicht nicht zur Ressourcenschonung."},

{id:"n05", topic:"nachhaltigkeit", type:"tf", diff:2, tax:"K2",
 q:"Das Modell «Green Growth» setzt auf den Markt- und Preismechanismus als Hauptinstrument für den ökologischen Wandel.",
 correct:true,
 explain:"Korrekt. Green Growth vertraut auf Kostenwahrheit (Internalisierung externer Effekte → richtiger Preis für Umweltverbrauch), technologische Innovation und den Strukturwandel durch Marktanreize. Der Staat schafft die Rahmenbedingungen (z.B. CO₂-Abgabe), überlässt die Umsetzung aber dem Markt."},

{id:"n06", topic:"nachhaltigkeit", type:"open", diff:3, tax:"K5",
 q:"Beurteilen Sie das Degrowth-Modell aus ökonomischer Sicht: Ist eine gezielte Schrumpfung der Wirtschaft realistisch und wünschenswert?",
 sample:"Argumente für Degrowth:\n- Absolute Entkopplung ist bisher empirisch nicht nachgewiesen → Wachstum bedeutet zwangsläufig mehr Ressourcenverbrauch.\n- Das BIP erfasst nicht, was wirklich zählt (Wohlbefinden, Gesundheit, soziale Beziehungen).\n- Weniger Konsum kann zu höherer Lebensqualität führen (Suffizienz).\n\nArgumente gegen Degrowth:\n- Wirtschaftliche Schrumpfung führt zu Arbeitslosigkeit und sozialen Spannungen.\n- Technologischer Fortschritt und Innovation erfordern Investitionen → Wachstum.\n- Entwicklungsländer brauchen Wachstum zur Armutsbekämpfung.\n- Politisch kaum durchsetzbar (keine Mehrheit für bewusste Wohlstandsreduktion).\n\nFazit: Degrowth bietet wichtige Denkanstösse (Suffizienz, Wachstumskritik), ist aber als politisches Programm schwer umsetzbar. Realistischer sind Mischformen (Green Growth + starke Regulierung).",
 explain:"Diese Frage erfordert eine eigenständige Beurteilung (K5). Es gibt keine eindeutig richtige Antwort — die Qualität der Argumentation zählt."},

{id:"n07", topic:"nachhaltigkeit", type:"tf", diff:2, tax:"K2",
 q:"Das «Beyond Growth»-Modell der OECD will das Wirtschaftswachstum nicht abschaffen, sondern durch neue Ziele ergänzen: Nachhaltigkeit, Wohlbefinden, Gerechtigkeit und Resilienz.",
 correct:true,
 explain:"Korrekt. Beyond Growth steht zwischen Green Growth und Degrowth: Es lehnt reines BIP-Wachstum als oberstes Ziel ab und fordert neue Indikatoren und wirtschaftspolitische Ziele. Es will aber nicht bewusst schrumpfen, sondern die Wirtschaft «neu ausrichten»."},

{id:"n08", topic:"nachhaltigkeit", type:"mc", diff:3, tax:"K4",
 q:"Welches der drei Wachstumsmodelle (Green Growth, Beyond Growth, Degrowth) setzt am stärksten auf staatliche Eingriffe?",
 options:[
   {v:"A", t:"Beyond Growth — der Staat soll durch aktive Industrie-, Arbeitsmarkt- und Finanzpolitik die Wirtschaft neu ausrichten."},
   {v:"B", t:"Green Growth — der Staat soll massiv in erneuerbare Energien investieren."},
   {v:"C", t:"Degrowth — der Staat soll die Wirtschaft aktiv schrumpfen lassen."},
   {v:"D", t:"Alle drei setzen gleich stark auf den Staat."}
 ],
 correct:"A",
 explain:"Beyond Growth fordert explizit eine stärkere Rolle des Staates: aktive Industriepolitik, stärkere Finanzregulierung, prädistributive Massnahmen (Chancengleichheit vor der Umverteilung). Green Growth setzt mehr auf Marktmechanismen (Preissignale). Degrowth setzt teilweise auf gesellschaftliche Veränderung von unten."}
];
