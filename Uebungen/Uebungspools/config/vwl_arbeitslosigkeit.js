// Übungspool: Arbeitslosigkeit & Armut
// Fachbereich: VWL
// Klasse: 27abcd8f SF GYM3
// Quellen: Eisenhut Kap. 10, LearningView-Export
// Anzahl Fragen: 74

window.POOL_META = {
  id: "vwl_arbeitslosigkeit",
  fach: "VWL",
  title: "Übungspool: Arbeitslosigkeit & Armut",
  meta: "SF GYM3 · Gymnasium Hofwil · Individuell üben",
  color: "vwl"
};

window.TOPICS = {
  arbeitsmarkt: {label:"Der Arbeitsmarkt", short:"Arbeitsmarkt"},
  loehne: {label:"Löhne & Lohnrigiditäten", short:"Löhne"},
  typen: {label:"Typen von Arbeitslosigkeit", short:"AL-Typen"},
  beveridge: {label:"Beveridge-Kurve & Sockelarbeitslosigkeit", short:"Beveridge"},
  bekaempfung: {label:"Bekämpfung der Arbeitslosigkeit", short:"Bekämpfung"},
  statistik: {label:"Messung & Statistik", short:"Statistik"},
  armut: {label:"Armut & Armutsbekämpfung", short:"Armut"}
};

window.QUESTIONS = [

// ── ARBEITSMARKT (a01–a10) ──

{id:"a01", topic:"arbeitsmarkt", type:"mc", diff:1, tax:"K1",
 q:"Wer bildet auf dem Arbeitsmarkt die Arbeitsnachfrage?",
 options:[
   {v:"A", t:"Die Arbeitnehmerinnen und Arbeitnehmer"},
   {v:"B", t:"Unternehmen und der Staat"},
   {v:"C", t:"Die Gewerkschaften"},
   {v:"D", t:"Die Arbeitslosenversicherung"}
 ],
 correct:"B",
 explain:"Unternehmen und der Staat fragen Arbeitskräfte nach (Arbeitsnachfrage). Arbeitnehmerinnen und Arbeitnehmer bieten ihre Arbeitskraft an (Arbeitsangebot)."},

{id:"a02", topic:"arbeitsmarkt", type:"tf", diff:1, tax:"K1",
 q:"Die Nachfrage nach Arbeitskräften ist eine abgeleitete Nachfrage, weil sie von der Nachfrage nach Gütern und Dienstleistungen abhängt.",
 correct:true,
 explain:"Korrekt. Unternehmen stellen Arbeitskräfte ein, um Güter und Dienstleistungen zu produzieren. Sinkt die Güternachfrage, sinkt auch die Arbeitsnachfrage."},

{id:"a03", topic:"arbeitsmarkt", type:"mc", diff:2, tax:"K2",
 q:"Weshalb ist der Arbeitsmarkt kein Markt wie jeder andere?",
 options:[
   {v:"A", t:"Weil es auf dem Arbeitsmarkt keine Preise gibt"},
   {v:"B", t:"Weil das Angebot homogen ist – alle Arbeitskräfte sind austauschbar"},
   {v:"C", t:"Weil die Teilnahme für die meisten Arbeitnehmer überlebenswichtig ist und das Angebot extrem heterogen ist"},
   {v:"D", t:"Weil der Staat den Arbeitsmarkt vollständig kontrolliert"}
 ],
 correct:"C",
 explain:"Der Arbeitsmarkt zeichnet sich durch mehrere Besonderheiten aus: Das Angebot ist extrem heterogen (jede Arbeitskraft ist ein Individuum), die Teilnahme ist für die meisten überlebenswichtig, und der Markt ist stark reguliert."},

{id:"a04", topic:"arbeitsmarkt", type:"sort", diff:1, tax:"K2",
 q:"Ordnen Sie die Begriffe der richtigen Marktseite zu.",
 categories:["Arbeitsangebot", "Arbeitsnachfrage"],
 items:[
   {t:"Arbeitnehmerinnen und Arbeitnehmer", cat:0},
   {t:"Unternehmen", cat:1},
   {t:"Der Staat als Arbeitgeber", cat:1},
   {t:"Stellensuchende Personen", cat:0},
   {t:"Firmen, die Personal rekrutieren", cat:1},
   {t:"Erwerbspersonen", cat:0}
 ],
 explain:"Arbeitsangebot = Menschen, die ihre Arbeitskraft anbieten. Arbeitsnachfrage = Unternehmen und Staat, die Arbeitskräfte suchen."},

{id:"a05", topic:"arbeitsmarkt", type:"mc", diff:2, tax:"K2",
 q:"Im klassischen Arbeitsmarktmodell: Was passiert, wenn die Löhne bei einem Nachfragerückgang unflexibel bleiben?",
 options:[
   {v:"A", t:"Es entsteht freiwillige Arbeitslosigkeit"},
   {v:"B", t:"Es entsteht unfreiwillige Arbeitslosigkeit"},
   {v:"C", t:"Die Arbeitslosigkeit sinkt"},
   {v:"D", t:"Die Löhne steigen automatisch"}
 ],
 correct:"B",
 explain:"Wenn die Löhne trotz sinkender Nachfrage nicht sinken, fragen Unternehmen weniger Arbeitskräfte nach als angeboten werden. Es entsteht unfreiwillige Arbeitslosigkeit – Menschen wollen zum herrschenden Lohn arbeiten, finden aber keine Stelle."},

{id:"a06", topic:"arbeitsmarkt", type:"tf", diff:2, tax:"K2",
 q:"Im klassischen Modell des Arbeitsmarktes gibt es bei flexiblen Löhnen keine unfreiwillige Arbeitslosigkeit.",
 correct:true,
 explain:"Korrekt. Bei flexiblen Löhnen passen sich diese so an, dass Angebot und Nachfrage übereinstimmen. Wer zum Marktlohn nicht arbeiten will, ist gemäss dem Modell «freiwillig» arbeitslos."},

{id:"a07", topic:"arbeitsmarkt", type:"open", diff:3, tax:"K4",
 q:"Erklären Sie den Unterschied zwischen dem klassischen und dem keynesianischen Modell des Arbeitsmarktes hinsichtlich der Ursachen von Arbeitslosigkeit.",
 sample:"Das klassische Modell sieht Arbeitslosigkeit als Folge unflexibler Löhne: Würden die Löhne sinken, entstünde ein neues Gleichgewicht. Das keynesianische Modell interpretiert Arbeitslosigkeit als Folge mangelnder Güternachfrage. Lohnkürzungen verschlimmern das Problem sogar, weil sie die Kaufkraft und damit die Konsumnachfrage senken.",
 explain:"Zentraler Unterschied: Klassik → Löhne müssen flexibler werden. Keynesianismus → Die gesamtwirtschaftliche Nachfrage muss gestärkt werden, denn Lohnkürzungen verschärfen die Krise."},

{id:"a08", topic:"arbeitsmarkt", type:"mc", diff:2, tax:"K2",
 q:"Gemäss der keynesianischen Theorie: Warum können Lohnkürzungen Arbeitslosigkeit sogar verschärfen?",
 options:[
   {v:"A", t:"Weil tiefere Löhne die Produktivität senken"},
   {v:"B", t:"Weil tiefere Löhne die Kaufkraft und damit die Konsumnachfrage reduzieren"},
   {v:"C", t:"Weil Unternehmen dann noch mehr Arbeitskräfte einstellen"},
   {v:"D", t:"Weil die Gewerkschaften dagegen streiken"}
 ],
 correct:"B",
 explain:"Löhne sind nicht nur Kosten, sondern auch Einkommen. Sinken die Löhne aller Arbeitnehmer, sinkt die Konsumnachfrage. Wird dieser Rückgang nicht kompensiert (z.B. durch Exporte oder Staatsnachfrage), kann eine Rezession folgen."},

{id:"a09", topic:"arbeitsmarkt", type:"multi", diff:2, tax:"K2",
 q:"Welche Aussagen über den Arbeitsmarkt sind korrekt?",
 options:[
   {v:"A", t:"Die Arbeitsnachfrage ist eine abgeleitete Nachfrage"},
   {v:"B", t:"Das Arbeitsangebot ist homogen – alle Arbeitskräfte sind austauschbar"},
   {v:"C", t:"Die Teilnahme am Arbeitsmarkt ist für die meisten Menschen existenziell"},
   {v:"D", t:"Der Arbeitsmarkt ist weitgehend frei von staatlichen Regulierungen"}
 ],
 correct:["A","C"],
 explain:"Die Arbeitsnachfrage hängt von der Güternachfrage ab (abgeleitet). Die Teilnahme ist existenziell, da der Lohn die Haupteinkommensquelle darstellt. Das Arbeitsangebot ist hingegen extrem heterogen (nicht homogen), und der Arbeitsmarkt ist stark reguliert (GAV, Kündigungsschutz, Sozialversicherungen)."},

{id:"a10", topic:"arbeitsmarkt", type:"mc", diff:3, tax:"K3",
 q:"Das Diagramm zeigt den Arbeitsmarkt mit einem starren Lohn w̄ oberhalb des Gleichgewichtslohns w*. Die Punkte Q und P markieren die nachgefragte bzw. angebotene Arbeitsmenge bei w̄. Welche Aussage ist korrekt?",
 img:{src:"img/vwl/arbeitslosigkeit/arbeitsmarkt_lohnrigid.svg", alt:"Arbeitsmarktdiagramm mit Angebots- und Nachfragekurve"},
 options:[
   {v:"A", t:"Im Punkt Q wird mehr Arbeit nachgefragt als in P angeboten"},
   {v:"B", t:"Die Strecke von Q nach P zeigt ein Überangebot an Arbeit – es gibt unfreiwillige Arbeitslosigkeit"},
   {v:"C", t:"Im Gleichgewichtspunkt würden weniger Menschen arbeiten als bei w̄"},
   {v:"D", t:"Der starre Lohn w̄ führt dazu, dass alle Arbeitswilligen eine Stelle finden"}
 ],
 correct:"B",
 explain:"Bei w̄ > w* liegt die angebotene Arbeitsmenge (P auf Lₛ) über der nachgefragten (Q auf Lᴅ). Die Differenz ist das Überangebot an Arbeit = unfreiwillige Arbeitslosigkeit. Im Gleichgewicht (w*) wären Angebot und Nachfrage ausgeglichen."},

// ── LÖHNE & LOHNRIGIDITÄTEN (l01–l10) ──

{id:"l01", topic:"loehne", type:"mc", diff:1, tax:"K1",
 q:"Was besagt die Effizienzlohntheorie?",
 options:[
   {v:"A", t:"Löhne sollten staatlich festgelegt werden"},
   {v:"B", t:"Hohe Löhne steigern die Produktivität und Motivation der Beschäftigten"},
   {v:"C", t:"Nur der niedrigste Lohn ist effizient"},
   {v:"D", t:"Löhne spielen für die Arbeitsproduktivität keine Rolle"}
 ],
 correct:"B",
 explain:"Die Effizienzlohntheorie besagt, dass die Produktivität positiv vom Lohn abhängt. Höhere Löhne steigern Zufriedenheit, Identifikation mit der Firma und Leistungsbereitschaft. Zudem erhält das Unternehmen mehr Bewerbungen und kann die Besten auswählen."},

{id:"l02", topic:"loehne", type:"fill", diff:1, tax:"K1",
 q:"Gemäss dem {0}-Modell setzen die «Arbeitsplatzbesitzer» (vertreten durch die {1}) Lohnerhöhungen für sich selbst durch, anstatt den {2} eine Chance auf einen Arbeitsplatz zu eröffnen.",
 blanks:[
   {answer:"Insider-Outsider", alts:["Insider Outsider"]},
   {answer:"Gewerkschaft", alts:["Gewerkschaften"]},
   {answer:"Outsidern", alts:["Outsider","Arbeitslosen"]}
 ],
 explain:"Im Insider-Outsider-Modell nutzen die Insider (Beschäftigte) ihre Verhandlungsmacht für höhere Löhne, statt durch Lohnverzicht den Outsidern (Arbeitslosen) eine Chance zu geben."},

{id:"l03", topic:"loehne", type:"tf", diff:1, tax:"K1",
 q:"Der Schweizer Nominallohnindex ist in den über 78 Jahren, seit er besteht, noch nie gesunken.",
 correct:true,
 explain:"Korrekt. Die Nominallöhne in der Schweiz sind nach unten starr – ein empirischer Befund, der die Theorie der Lohnrigidität stützt."},

{id:"l04", topic:"loehne", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Erklärungen für Lohnrigiditäten dem richtigen Konzept zu.",
 categories:["Institutionelle Faktoren", "Insider-Outsider-Modell", "Effizienzlohntheorie"],
 items:[
   {t:"Mindestlöhne und Kündigungsschutz", cat:0},
   {t:"Beschäftigte handeln via Gewerkschaft höhere Löhne aus", cat:1},
   {t:"Hohe Löhne senken Fluktuation und steigern Motivation", cat:2},
   {t:"Gesamtarbeitsverträge schreiben Mindestlöhne vor", cat:0},
   {t:"Neueinstellungen verursachen Transaktionskosten", cat:1},
   {t:"Unternehmen zahlen bewusst über Marktlohn", cat:2}
 ],
 explain:"Es gibt drei zentrale Erklärungen für Lohnrigiditäten: 1) Institutionelle Faktoren (Gesetze, GAV), 2) Insider-Outsider-Modell (Machtasymmetrie), 3) Effizienzlohntheorie (Produktivitätseffekte höherer Löhne)."},

{id:"l05", topic:"loehne", type:"mc", diff:2, tax:"K2",
 q:"Was ist ein Gesamtarbeitsvertrag (GAV)?",
 options:[
   {v:"A", t:"Ein individueller Arbeitsvertrag zwischen Arbeitgeber und Arbeitnehmer"},
   {v:"B", t:"Ein kollektiver Vertrag zwischen Sozialpartnern mit Bestimmungen zu Löhnen, Arbeitszeit und Kündigungsfristen"},
   {v:"C", t:"Ein staatliches Gesetz zur Regulierung aller Löhne"},
   {v:"D", t:"Ein Vertrag zwischen verschiedenen Gewerkschaften"}
 ],
 correct:"B",
 explain:"Ein GAV wird kollektiv zwischen den Sozialpartnern (Gewerkschaften und Arbeitgeberverbände) ausgehandelt. Er enthält Bestimmungen zu Mindestlöhnen, Arbeitszeit, Ferien, Kündigungsfristen u.a. Während der Laufzeit gilt eine Friedenspflicht."},

{id:"l06", topic:"loehne", type:"tf", diff:2, tax:"K2",
 q:"Lohnunterschiede zwischen Branchen lassen sich vor allem durch Unterschiede in der Arbeitsproduktivität erklären.",
 correct:true,
 explain:"Korrekt. Branchen mit höherer Arbeitsproduktivität (z.B. Pharma, Versicherungen) zahlen deutlich höhere Löhne als Branchen mit tieferer Produktivität (z.B. Gastgewerbe). Die Produktivitätsunterschiede sind ein zentraler Erklärungsfaktor."},

{id:"l07", topic:"loehne", type:"open", diff:3, tax:"K4",
 q:"Erklären Sie, warum es aus Sicht der Effizienzlohntheorie für ein Unternehmen rational sein kann, höhere Löhne als den Marktlohn zu bezahlen.",
 sample:"Höhere Löhne haben einen doppelten Effekt: Einerseits steigen die Kosten, andererseits steigt die Produktivität. Hohe Löhne sorgen für Zufriedenheit und Identifikation mit der Firma, was die Leistungsbereitschaft erhöht. Zudem erhält das Unternehmen mehr Bewerbungen, kann die Qualifiziertesten auswählen und muss weniger Kündigungen hinnehmen, was Such- und Ausbildungskosten spart.",
 explain:"Kerngedanke: Löhne sind nicht nur Kostenfaktor, sondern auch Investition in Produktivität. Der «Effizienzlohn» liegt dort, wo der Produktivitätsgewinn die Mehrkosten gerade noch übersteigt."},

{id:"l08", topic:"loehne", type:"mc", diff:2, tax:"K2",
 q:"Was passiert, wenn ein GAV allgemeinverbindlich erklärt wird?",
 options:[
   {v:"A", t:"Er gilt nur für die Mitglieder der beteiligten Gewerkschaft"},
   {v:"B", t:"Er wird auf die ganze Branche ausgeweitet, auch auf Nichtmitglieder"},
   {v:"C", t:"Er wird ungültig und durch ein Gesetz ersetzt"},
   {v:"D", t:"Er gilt nur noch für die grössten Unternehmen"}
 ],
 correct:"B",
 explain:"Bei einer Allgemeinverbindlichkeitserklärung wird der GAV auf die ganze Branche ausgeweitet. Dies schützt die sozialvertraglichen Vereinbarungen vor Niedriglohnkonkurrenz und verhindert, dass Aussenseiter benachteiligt werden."},

{id:"l09", topic:"loehne", type:"multi", diff:2, tax:"K2",
 q:"Welche Mechanismen erklären, warum die Löhne nach unten starr sind (Lohnrigidität)?",
 options:[
   {v:"A", t:"Gesamtarbeitsverträge legen Mindestlöhne fest"},
   {v:"B", t:"Unternehmen zahlen bewusst über Marktlohn, um die Produktivität zu steigern"},
   {v:"C", t:"Die Inflation verhindert generell jede Lohnanpassung"},
   {v:"D", t:"Insider (Beschäftigte) setzen über Gewerkschaften höhere Löhne durch"}
 ],
 correct:["A","B","D"],
 explain:"Drei Erklärungen für Lohnrigidität: Institutionelle Faktoren (GAV, Mindestlöhne), Effizienzlohntheorie (bewusst hohe Löhne für Produktivität) und Insider-Outsider-Modell (Machtasymmetrie der Beschäftigten). Die Inflation verhindert keine Lohnanpassungen – im Gegenteil, sie kann reale Lohnsenkungen bei konstanten Nominallöhnen ermöglichen."},

{id:"l10", topic:"loehne", type:"mc", diff:1, tax:"K1",
 q:"Was ist der Unterschied zwischen Nominal- und Reallohn?",
 options:[
   {v:"A", t:"Der Nominallohn ist der tatsächlich ausbezahlte Geldbetrag, der Reallohn berücksichtigt die Kaufkraft (inflationsbereinigt)"},
   {v:"B", t:"Der Reallohn ist immer höher als der Nominallohn"},
   {v:"C", t:"Der Nominallohn berücksichtigt die Teuerung, der Reallohn nicht"},
   {v:"D", t:"Es gibt keinen inhaltlichen Unterschied"}
 ],
 correct:"A",
 explain:"Der Nominallohn ist der Betrag auf dem Lohnausweis. Der Reallohn gibt an, was man sich davon kaufen kann – er ist um die Teuerung bereinigt. Bei Inflation steigt der Nominallohn oft, während der Reallohn stagnieren oder sogar sinken kann."},

// ── TYPEN VON ARBEITSLOSIGKEIT (t01–t10) ──

{id:"t01", topic:"typen", type:"mc", diff:1, tax:"K1",
 q:"Welcher Typ von Arbeitslosigkeit entsteht durch jahreszeitliche Schwankungen oder Stellenwechsel?",
 options:[
   {v:"A", t:"Konjunkturelle Arbeitslosigkeit"},
   {v:"B", t:"Strukturelle Arbeitslosigkeit"},
   {v:"C", t:"Friktionelle Arbeitslosigkeit"},
   {v:"D", t:"Sockelarbeitslosigkeit"}
 ],
 correct:"C",
 explain:"Die friktionelle Arbeitslosigkeit hat ihre Ursache in jahreszeitlichen Nachfrageschwankungen (z.B. Tourismus, Landwirtschaft) oder in Stellenwechseln und damit verbundenen Suchprozessen. Sie ist für die Wirtschaftspolitik unproblematisch."},

{id:"t02", topic:"typen", type:"sort", diff:1, tax:"K2",
 q:"Ordnen Sie die Beispiele dem richtigen Typ von Arbeitslosigkeit zu.",
 categories:["Friktionelle AL", "Konjunkturelle AL", "Strukturelle AL"],
 items:[
   {t:"Skilehrer im Sommer ohne Anstellung", cat:0},
   {t:"Massenentlassungen in einer Rezession", cat:1},
   {t:"Fabrikarbeiter wird durch Roboter ersetzt", cat:2},
   {t:"Bankangestellter sucht nach Kündigung neue Stelle", cat:0},
   {t:"Unternehmen baut wegen schlechter Konjunktur Stellen ab", cat:1},
   {t:"Druckerei schliesst wegen Digitalisierung", cat:2}
 ],
 explain:"Friktionell = kurzfristig, Suchprozesse/saisonal. Konjunkturell = Nachfragerückgang in einer Rezession. Strukturell = langfristige Veränderungen der Wirtschaftsstruktur (Technologie, Branchenwandel)."},

{id:"t03", topic:"typen", type:"fill", diff:1, tax:"K1",
 q:"Die {0} setzt sich aus der {1} und der {2} Arbeitslosigkeit zusammen. Sie ist das Niveau der Arbeitslosigkeit, das in konjunkturneutralen Phasen bestehen bleibt.",
 blanks:[
   {answer:"Sockelarbeitslosigkeit", alts:["natürliche Arbeitslosigkeit","gleichgewichtige Arbeitslosigkeit"]},
   {answer:"friktionellen", alts:["friktionelle"]},
   {answer:"strukturellen", alts:["strukturelle"]}
 ],
 explain:"Die Sockelarbeitslosigkeit (auch natürliche oder gleichgewichtige Arbeitslosigkeit) ist das Niveau, das auch in Boomphasen nicht verschwindet. Sie besteht aus friktioneller und struktureller Arbeitslosigkeit."},

{id:"t04", topic:"typen", type:"tf", diff:2, tax:"K2",
 q:"Die strukturelle Arbeitslosigkeit kann losgelöst vom Konjunkturzyklus betrachtet werden.",
 correct:false,
 explain:"Falsch. Strukturelle Arbeitslosigkeit tritt oft erst bei einem Konjunktureinbruch offen zutage, und eine gute Konjunktur lindert auch die strukturelle Arbeitslosigkeit."},

{id:"t05", topic:"typen", type:"mc", diff:2, tax:"K2",
 q:"Warum ist die konjunkturelle Arbeitslosigkeit problematischer als die friktionelle?",
 options:[
   {v:"A", t:"Weil sie ein grösseres zeitliches Ausmass annimmt"},
   {v:"B", t:"Weil sie nur Geringqualifizierte betrifft"},
   {v:"C", t:"Weil sie nicht messbar ist"},
   {v:"D", t:"Weil sie durch den Staat verursacht wird"}
 ],
 correct:"A",
 explain:"Die friktionelle Arbeitslosigkeit ist kurzfristiger Natur (Suchprozesse, saisonale Schwankungen). Die konjunkturelle Arbeitslosigkeit dauert länger an und betrifft oft viele Arbeitnehmer gleichzeitig, weshalb man ihr «nicht tatenlos zusehen will»."},

{id:"t06", topic:"typen", type:"open", diff:3, tax:"K4",
 q:"Erklären Sie, warum Arbeitslosigkeit und gleichzeitiger Fachkräftemangel gemeinsam auftreten können.",
 sample:"Dies ist ein Hinweis auf strukturelle Arbeitslosigkeit: Die Qualifikationen der Arbeitslosen passen nicht zu den Anforderungen der offenen Stellen (Mismatch). Durch den raschen Strukturwandel (z.B. Digitalisierung) werden einfache Arbeitsplätze abgebaut, während gleichzeitig hochqualifizierte Fachkräfte fehlen. Die Arbeitslosen können die offenen Stellen nicht besetzen, weil ihnen die nötigen Kompetenzen fehlen.",
 explain:"Schlüsselbegriff: Mismatch-Arbeitslosigkeit. Das Anforderungsprofil der Arbeitgeber wird von den Bewerbern nicht erfüllt. Dies zeigt sich in der Verschiebung der Beveridge-Kurve nach aussen."},

{id:"t07", topic:"typen", type:"mc", diff:2, tax:"K2",
 q:"Welche Aussage zur strukturellen Arbeitslosigkeit ist korrekt?",
 options:[
   {v:"A", t:"Sie ist kurzfristiger Natur und verschwindet schnell"},
   {v:"B", t:"Sie zeigt sich in regional-, branchen- und qualifikationsspezifischen Unterschieden"},
   {v:"C", t:"Sie betrifft ausschliesslich den Industriesektor"},
   {v:"D", t:"Sie wird durch saisonale Schwankungen verursacht"}
 ],
 correct:"B",
 explain:"Die strukturelle Arbeitslosigkeit hat einen längerfristigen Charakter und zeigt sich in regionalen, branchenmässigen, qualifikationsspezifischen, geschlechts- oder altersspezifischen Unterschieden."},

{id:"t08", topic:"typen", type:"tf", diff:1, tax:"K1",
 q:"Die friktionelle Arbeitslosigkeit ist kurzfristiger Natur und für die Wirtschaftspolitik unproblematisch.",
 correct:true,
 explain:"Korrekt. Friktionelle Arbeitslosigkeit entsteht z.B. durch Stellenwechsel oder saisonale Schwankungen und löst sich in der Regel von selbst."},

{id:"t09", topic:"typen", type:"multi", diff:2, tax:"K2",
 q:"Welche der folgenden Phänomene sind typische Ursachen für strukturelle Arbeitslosigkeit?",
 options:[
   {v:"A", t:"Technologischer Wandel (z.B. Automatisierung, Digitalisierung)"},
   {v:"B", t:"Vorübergehender Auftragsrückgang in einer Rezession"},
   {v:"C", t:"Verlagerung von Produktionsstandorten ins Ausland"},
   {v:"D", t:"Veränderung der Nachfrage (z.B. Rückgang einer Branche)"}
 ],
 correct:["A","C","D"],
 explain:"Strukturelle Arbeitslosigkeit entsteht durch langfristige Veränderungen: Technologie (Automatisierung), Standortverlagerung (Globalisierung), Branchenwandel. Ein vorübergehender Auftragsrückgang führt hingegen zu konjunktureller Arbeitslosigkeit."},

{id:"t10", topic:"typen", type:"mc", diff:3, tax:"K4",
 q:"In der Schweiz steigt nach der COVID-19-Pandemie die Arbeitslosigkeit im Gastgewerbe stark an, erholt sich aber nach 18 Monaten weitgehend. Gleichzeitig bleiben in der IT-Branche dauerhaft viele Stellen unbesetzt. Welche Aussage trifft am besten zu?",
 options:[
   {v:"A", t:"Beide Phänomene sind Beispiele für strukturelle Arbeitslosigkeit"},
   {v:"B", t:"Die Arbeitslosigkeit im Gastgewerbe ist konjunktureller, der Fachkräftemangel in der IT struktureller Natur"},
   {v:"C", t:"Es handelt sich in beiden Fällen um friktionelle Arbeitslosigkeit"},
   {v:"D", t:"Beide Phänomene sind ausschliesslich konjunktureller Natur"}
 ],
 correct:"B",
 explain:"Der vorübergehende Anstieg im Gastgewerbe ist konjunkturell (exogener Schock, der nach der Erholung verschwindet). Der dauerhafte Fachkräftemangel in der IT hingegen ist strukturell: Es fehlen Personen mit den passenden Qualifikationen (Mismatch)."},

// ── BEVERIDGE-KURVE & SOCKELARBEITSLOSIGKEIT (b01–b10) ──

{id:"b01", topic:"beveridge", type:"mc", diff:1, tax:"K1",
 q:"Was stellt die Beveridge-Kurve dar?",
 options:[
   {v:"A", t:"Den Zusammenhang zwischen Inflation und Arbeitslosigkeit"},
   {v:"B", t:"Den Zusammenhang zwischen offenen Stellen und Arbeitslosen"},
   {v:"C", t:"Den Zusammenhang zwischen BIP und Arbeitslosigkeit"},
   {v:"D", t:"Den Zusammenhang zwischen Löhnen und Beschäftigung"}
 ],
 correct:"B",
 explain:"Die Beveridge-Kurve zeigt den Zusammenhang zwischen der Anzahl offener Stellen (Ordinate) und der Anzahl Arbeitslosen (Abszisse) im Konjunkturverlauf."},

{id:"b02", topic:"beveridge", type:"mc", diff:2, tax:"K2",
 q:"Was bedeutet eine Verschiebung der Beveridge-Kurve nach aussen (vom Ursprung weg)?",
 options:[
   {v:"A", t:"Die konjunkturelle Arbeitslosigkeit sinkt"},
   {v:"B", t:"Die Sockelarbeitslosigkeit hat zugenommen"},
   {v:"C", t:"Es herrscht Vollbeschäftigung"},
   {v:"D", t:"Die Arbeitslosen finden schneller eine Stelle"}
 ],
 correct:"B",
 explain:"Eine Verschiebung nach aussen bedeutet, dass bei gleicher Konjunkturlage mehr Arbeitslose und gleichzeitig mehr offene Stellen existieren. Das ist ein Zeichen dafür, dass die strukturelle bzw. die Sockelarbeitslosigkeit zugenommen hat (Mismatch)."},

{id:"b03", topic:"beveridge", type:"tf", diff:2, tax:"K2",
 q:"In einer Hochkonjunktur liegt der Punkt auf der Beveridge-Kurve typischerweise links oben (mehr offene Stellen als Arbeitslose).",
 correct:true,
 explain:"Korrekt. In Boomphasen ist die Zahl der Arbeitslosen klein und die Zahl der offenen Stellen hoch. Der Punkt liegt links der Winkelhalbierenden (Stellenüberhang)."},

{id:"b04", topic:"beveridge", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die Beschreibungen der richtigen konjunkturellen Situation auf der Beveridge-Kurve zu.",
 categories:["Hochkonjunktur (links oben)", "Rezession (rechts unten)"],
 items:[
   {t:"Mehr offene Stellen als Arbeitslose", cat:0},
   {t:"Mehr Arbeitslose als offene Stellen", cat:1},
   {t:"Unternehmen haben Schwierigkeiten, Personal zu finden", cat:0},
   {t:"Unternehmen reagieren mit Entlassungen", cat:1},
   {t:"Stellenüberhang", cat:0},
   {t:"Stellenmangel", cat:1}
 ],
 explain:"Hochkonjunktur = links oben auf der Beveridge-Kurve (Stellenüberhang). Rezession = rechts unten (Stellenmangel, viele Arbeitslose)."},

{id:"b05", topic:"beveridge", type:"mc", diff:2, tax:"K2",
 q:"Welcher Faktor kann zu einer Zunahme der Sockelarbeitslosigkeit führen?",
 options:[
   {v:"A", t:"Eine kurzfristige Konjunkturschwankung"},
   {v:"B", t:"Ein rasanter Strukturwandel, der Arbeitsplätze für Unqualifizierte vernichtet"},
   {v:"C", t:"Eine Senkung der Arbeitslosenunterstützung"},
   {v:"D", t:"Eine Lockerung des Kündigungsschutzes"}
 ],
 correct:"B",
 explain:"Ein rascher Strukturwandel (z.B. Digitalisierung) führt dazu, dass Arbeitsplätze für Unqualifizierte wegfallen und diese keine neue Beschäftigung finden. Das erhöht die Sockelarbeitslosigkeit."},

{id:"b06", topic:"beveridge", type:"open", diff:3, tax:"K4",
 q:"Erklären Sie, warum Regulierungen des Arbeitsmarktes (z.B. Kündigungsschutz, Mindestlöhne, Arbeitslosenunterstützung) trotz guter Absichten die Sockelarbeitslosigkeit erhöhen können.",
 sample:"Regulierungen haben oft unbeabsichtigte Nebeneffekte: Erhöhte Mindestlöhne können dazu führen, dass Arbeitgeber weniger Personen einstellen. Ein starker Kündigungsschutz hemmt Neuanstellungen, weil Unternehmen bei schlechter Auftragslage kaum entlassen können. Grosszügige Arbeitslosenunterstützung reduziert den Anreiz für Arbeitslose, sich intensiv um eine neue Stelle zu bemühen, und erleichtert Arbeitgebern Entlassungen. Es entsteht ein Zielkonflikt: Schutz der Arbeitnehmer vs. Funktionsfähigkeit des Arbeitsmarktes.",
 explain:"Kernprinzip: «Gut gemeint ist nicht gleich gut gemacht.» Eingriffe in Märkte können das Gegenteil von dem bewirken, was man erreichen wollte (unbeabsichtigte Folgen, Fehlanreize)."},

{id:"b07", topic:"beveridge", type:"tf", diff:2, tax:"K2",
 q:"Auf der Winkelhalbierenden der Beveridge-Kurve entspricht die Zahl der offenen Stellen der Zahl der Arbeitslosen – dies bildet die Sockelarbeitslosigkeit ab.",
 correct:true,
 explain:"Korrekt. Alle Punkte auf der 45°-Linie (Winkelhalbierenden) bilden die gleichgewichtige bzw. die Sockelarbeitslosigkeit ab. Hier gibt es für jeden Arbeitslosen theoretisch eine offene Stelle – die Arbeitslosigkeit ist «nur» friktionell und strukturell."},

{id:"b08", topic:"beveridge", type:"mc", diff:2, tax:"K3",
 q:"Die Abbildung zeigt eine Beveridge-Kurve mit drei Punkten A, B und C. In welchem Punkt befindet sich die Wirtschaft in einer Rezession?",
 img:{src:"img/vwl/arbeitslosigkeit/beveridge_kurve.svg", alt:"Beveridge-Kurve mit drei markierten Konjunkturpunkten"},
 options:[
   {v:"A", t:"Punkt A (links oben)"},
   {v:"B", t:"Punkt B (rechts unten)"},
   {v:"C", t:"Punkt C (auf der Winkelhalbierenden)"},
   {v:"D", t:"Die Konjunkturlage lässt sich aus der Beveridge-Kurve nicht ablesen"}
 ],
 correct:"B",
 explain:"In einer Rezession gibt es viele Arbeitslose und wenige offene Stellen → der Punkt liegt rechts unten auf der Beveridge-Kurve (Punkt B). Punkt A (links oben) zeigt eine Hochkonjunktur, Punkt C liegt auf der Winkelhalbierenden (Sockelarbeitslosigkeit)."},

{id:"b09", topic:"beveridge", type:"multi", diff:2, tax:"K2",
 q:"Die Abbildung zeigt eine Verschiebung der Beveridge-Kurve von BC₁ nach BC₂. Die Punkte SA₁ und SA₂ markieren die jeweilige Sockelarbeitslosigkeit. Welche Ursachen können diese Verschiebung erklären?",
 img:{src:"img/vwl/arbeitslosigkeit/beveridge_verschiebung.svg", alt:"Verschiebung der Beveridge-Kurve nach aussen"},
 options:[
   {v:"A", t:"Zunahme des Mismatch zwischen Qualifikationen der Arbeitslosen und Anforderungen der offenen Stellen"},
   {v:"B", t:"Ein konjunktureller Aufschwung"},
   {v:"C", t:"Verschärfung von Arbeitsmarktregulierungen (z.B. höherer Kündigungsschutz)"},
   {v:"D", t:"Grosszügigere Arbeitslosenunterstützung, die die Suchintensität senkt"}
 ],
 correct:["A","C","D"],
 explain:"Die Beveridge-Kurve verschiebt sich nach aussen, wenn bei gleicher Konjunktur mehr Arbeitslose UND mehr offene Stellen bestehen. Ursachen: Mismatch (A), hemmende Regulierungen (C) und Fehlanreize durch grosszügige Unterstützung (D). Ein konjunktureller Aufschwung verschiebt den Punkt auf der bestehenden Kurve, nicht die Kurve selbst."},

{id:"b10", topic:"beveridge", type:"fill", diff:1, tax:"K1",
 q:"Die Beveridge-Kurve zeigt den Zusammenhang zwischen {0} (auf der Y-Achse) und {1} (auf der X-Achse). Die {2} verbindet alle Punkte, an denen die Zahl der offenen Stellen der Zahl der Arbeitslosen entspricht.",
 blanks:[
   {answer:"offenen Stellen", alts:["Vakanzen","offene Stellen"]},
   {answer:"Arbeitslosen", alts:["Arbeitslose","Arbeitslosenzahl"]},
   {answer:"Winkelhalbierenden", alts:["Winkelhalbierende","45-Grad-Linie","45°-Linie"]}
 ],
 explain:"Die Y-Achse zeigt die offenen Stellen, die X-Achse die Arbeitslosen. Die 45°-Linie (Winkelhalbierend) markiert die Sockelarbeitslosigkeit, wo offene Stellen und Arbeitslose gleich gross sind."},

// ── BEKÄMPFUNG DER ARBEITSLOSIGKEIT (k01–k10) ──

{id:"k01", topic:"bekaempfung", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die Massnahmen zur Bekämpfung der Arbeitslosigkeit dem Ansatzpunkt zu.",
 categories:["Ansatz am Gütermarkt", "Ansatz am Arbeitsmarkt"],
 items:[
   {t:"Stärkung der Wettbewerbskraft", cat:0},
   {t:"Kurzarbeit einführen", cat:1},
   {t:"Bildungspolitik und Weiterbildung", cat:1},
   {t:"Beschäftigungsprogramme des Staates", cat:0},
   {t:"Erhöhung der Standortattraktivität", cat:0},
   {t:"Flexibilisierung des Arbeitsmarktes", cat:1}
 ],
 explain:"Gütermarkt-Ansatz: Indirekt über mehr Nachfrage nach Gütern (Wettbewerb, Standort, Innovation, Beschäftigungsprogramme). Arbeitsmarkt-Ansatz: Direkt am Arbeitsmarkt (Kurzarbeit, Bildung, Flexibilität, Ausländerpolitik)."},

{id:"k02", topic:"bekaempfung", type:"mc", diff:1, tax:"K1",
 q:"Was ist Kurzarbeit?",
 options:[
   {v:"A", t:"Eine Verlängerung der Arbeitszeit bei gleicher Bezahlung"},
   {v:"B", t:"Die vorübergehende Reduzierung oder Einstellung der Arbeit, wobei die ALV den Verdienstausfall teilweise deckt"},
   {v:"C", t:"Ein dauerhafter Abbau von Arbeitsplätzen"},
   {v:"D", t:"Eine Form der Selbständigkeit"}
 ],
 correct:"B",
 explain:"Bei Kurzarbeit wird die Arbeitszeit vorübergehend reduziert oder eingestellt. Die ALV deckt 80% des Verdienstausfalls während max. 12 Monaten. Ziel: Kündigungen vermeiden bei kurzfristigen Arbeitsausfällen."},

{id:"k03", topic:"bekaempfung", type:"tf", diff:2, tax:"K2",
 q:"Arbeitszeitverkürzungen sind ein einfaches und risikoloses Mittel gegen Arbeitslosigkeit.",
 correct:false,
 explain:"Falsch. Wenn die Arbeitszeitverkürzung nicht kostenneutral erfolgt, steigen die Lohnstückkosten, die Wettbewerbsfähigkeit sinkt und Arbeitsplätze gehen verloren. Das Arbeitsvolumen ist kein Kuchen, der einfach umverteilt werden kann. Statistiken zeigen sogar, dass Länder mit hoher Arbeitszeit tiefere Arbeitslosenquoten haben."},

{id:"k04", topic:"bekaempfung", type:"mc", diff:2, tax:"K2",
 q:"Warum wird «lebenslanges Lernen» als immer wichtiger für die Bekämpfung von Arbeitslosigkeit angesehen?",
 options:[
   {v:"A", t:"Weil im Zuge der Globalisierung und des technologischen Wandels Arbeitsplätze für Unqualifizierte wegfallen"},
   {v:"B", t:"Weil es gesetzlich vorgeschrieben ist"},
   {v:"C", t:"Weil Arbeitnehmer sonst keine Sozialleistungen erhalten"},
   {v:"D", t:"Weil Arbeitgeber nur noch Akademiker einstellen"}
 ],
 correct:"A",
 explain:"Durch Globalisierung und Digitalisierung fallen Arbeitsplätze für Unqualifizierte kontinuierlich weg. Um den zukünftigen Anforderungen gewachsen zu sein, braucht es permanente Weiterbildung."},

{id:"k05", topic:"bekaempfung", type:"open", diff:3, tax:"K5",
 q:"Beurteilen Sie die Forderung «Mehr Markt für den Arbeitsmarkt» (Lohnflexibilität, liberale Entlassungsbedingungen, leistungsbasierte Löhne): Welche Vor- und Nachteile sehen Sie?",
 sample:"Vorteile: Flexiblere Löhne ermöglichen schnellere Anpassung an Marktveränderungen, Unternehmen stellen eher ein, wenn sie bei schlechter Auftragslage auch entlassen können, leistungsbasierte Löhne belohnen Produktivität. Nachteile: Arbeitnehmer verlieren soziale Absicherung, tiefere Löhne können Kaufkraft und damit die Gesamtnachfrage senken (keynesianisches Argument), prekäre Arbeitsverhältnisse und Unsicherheit nehmen zu. Es braucht eine Balance zwischen Flexibilität und Schutz.",
 explain:"Es gibt kein allgemein gültiges Rezept. Je nach ökonomischer Denkschule (klassisch vs. keynesianisch) und Wertvorstellungen fällt die Beurteilung unterschiedlich aus."},

{id:"k06", topic:"bekaempfung", type:"mc", diff:2, tax:"K2",
 q:"Welche Kritik wird an staatlichen Beschäftigungsprogrammen (keynesianischer Ansatz) geübt?",
 options:[
   {v:"A", t:"Sie kosten nichts und sind daher wirkungslos"},
   {v:"B", t:"Sie können prozyklisch wirken und bestehende Strukturen konservieren statt anpassen"},
   {v:"C", t:"Sie führen immer zu Vollbeschäftigung"},
   {v:"D", t:"Sie senken automatisch die Staatsschulden"}
 ],
 correct:"B",
 explain:"Kritiker bemängeln, dass Beschäftigungsprogramme prozyklisch wirken können (zu spät, zu viel) und Strukturen konservieren statt den nötigen Strukturwandel zu ermöglichen."},

{id:"k07", topic:"bekaempfung", type:"tf", diff:2, tax:"K2",
 q:"Ausländische Arbeitskräfte sind grundsätzlich nur als Konkurrenz für einheimische Arbeitnehmer zu sehen.",
 correct:false,
 explain:"Falsch. Arbeitskräftewanderungen sind Bestandteil einer marktwirtschaftlichen Ordnung. Sind die Zuwanderer Komplemente (ergänzende Qualifikationen), steigern sie die Produktivität und Entlohnung der Einheimischen. Nur wenn sie Substitute sind, entsteht Konkurrenz."},

{id:"k08", topic:"bekaempfung", type:"fill", diff:2, tax:"K2",
 q:"Die Bekämpfung der Arbeitslosigkeit kann direkt auf dem {0} oder indirekt auf dem {1} ansetzen. Weil der Arbeitsmarkt ein {2} Markt ist, beeinflusst eine stärkere Güternachfrage auch die Nachfrage nach Arbeitskräften.",
 blanks:[
   {answer:"Arbeitsmarkt", alts:[]},
   {answer:"Gütermarkt", alts:[]},
   {answer:"abgeleiteter", alts:["abgeleiteten"]}
 ],
 explain:"Der Arbeitsmarkt ist ein abgeleiteter Markt: Die Nachfrage nach Arbeitskräften hängt von der Güternachfrage ab. Darum kann man Arbeitslosigkeit auch über den Gütermarkt bekämpfen (Wettbewerbskraft, Standortattraktivität, Innovation)."},

{id:"k09", topic:"bekaempfung", type:"multi", diff:2, tax:"K3",
 q:"Welche Massnahmen sind geeignet, um strukturelle Arbeitslosigkeit zu bekämpfen?",
 options:[
   {v:"A", t:"Investitionen in Aus- und Weiterbildung"},
   {v:"B", t:"Konjunkturprogramme zur kurzfristigen Nachfragesteigerung"},
   {v:"C", t:"Förderung der beruflichen Mobilität (Umschulungen, Arbeitsvermittlung)"},
   {v:"D", t:"Stärkung des Innovationsstandorts und der Forschung"}
 ],
 correct:["A","C","D"],
 explain:"Strukturelle Arbeitslosigkeit erfordert langfristige Massnahmen: Bildung (A), Mobilität (C), Innovation (D). Konjunkturprogramme (B) wirken primär gegen konjunkturelle Arbeitslosigkeit und können bei strukturellen Problemen sogar kontraproduktiv sein (Strukturen konservieren)."},

{id:"k10", topic:"bekaempfung", type:"tf", diff:1, tax:"K1",
 q:"Die Kurzarbeit ist ein Instrument, das Entlassungen bei vorübergehenden Arbeitsausfällen vermeiden soll.",
 correct:true,
 explain:"Korrekt. Kurzarbeit überbrückt vorübergehende Nachfragerückgänge. Die ALV übernimmt 80% des Verdienstausfalls. So bleiben die Arbeitsverhältnisse bestehen und die Unternehmen müssen bei der Erholung kein neues Personal suchen."},

// ── MESSUNG & STATISTIK (s01–s10) ──

{id:"s01", topic:"statistik", type:"mc", diff:1, tax:"K1",
 q:"Was misst die Arbeitslosenquote?",
 options:[
   {v:"A", t:"Die Arbeitslosen in % der Gesamtbevölkerung"},
   {v:"B", t:"Die beim Arbeitsamt registrierten Arbeitslosen in % der Erwerbspersonen"},
   {v:"C", t:"Die Erwerbslosen in % der Erwerbstätigen"},
   {v:"D", t:"Die Stellensuchenden in % der Bevölkerung"}
 ],
 correct:"B",
 explain:"Arbeitslosenquote = Registrierte Arbeitslose in % der Erwerbspersonen. Sie wird vom SECO monatlich anhand der gemeldeten Arbeitslosen erfasst."},

{id:"s02", topic:"statistik", type:"mc", diff:2, tax:"K2",
 q:"Warum ist die Arbeitslosenquote für internationale Vergleiche ungeeignet?",
 options:[
   {v:"A", t:"Weil sie zu kompliziert zu berechnen ist"},
   {v:"B", t:"Weil die Kriterien für die Bezugsberechtigung von Arbeitslosengeld in verschiedenen Ländern unterschiedlich sind"},
   {v:"C", t:"Weil nur die Schweiz eine Arbeitslosenquote berechnet"},
   {v:"D", t:"Weil sie die Inflation nicht berücksichtigt"}
 ],
 correct:"B",
 explain:"Die Arbeitslosenquote basiert auf den beim Arbeitsamt registrierten Arbeitslosen. Da die Registrierungskriterien und Bezugsberechtigungen international variieren, ist sie für Vergleiche ungeeignet. Dafür nutzt man die Erwerbslosenquote (ILO-Standard)."},

{id:"s03", topic:"statistik", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die Merkmale der richtigen Kennzahl zu.",
 categories:["Arbeitslosenquote (SECO)", "Erwerbslosenquote (BFS/ILO)"],
 items:[
   {t:"Basiert auf Registrierungen bei den Arbeitsämtern", cat:0},
   {t:"Basiert auf Stichprobenbefragung (SAKE)", cat:1},
   {t:"Geeignet für internationale Vergleiche", cat:1},
   {t:"Wird monatlich vom SECO veröffentlicht", cat:0},
   {t:"Zählt auch Langzeitarbeitslose und Ausgesteuerte mit", cat:1},
   {t:"Ist in der Regel tiefer als die andere Kennzahl", cat:0}
 ],
 explain:"Die Arbeitslosenquote (SECO) erfasst nur registrierte Arbeitslose. Die Erwerbslosenquote (BFS/ILO) umfasst auch Ausgesteuerte und Langzeitarbeitslose und ist daher in der Regel höher – aber international vergleichbar."},

{id:"s04", topic:"statistik", type:"tf", diff:2, tax:"K2",
 q:"Stellensuchende und Arbeitslose bezeichnen dieselbe Personengruppe.",
 correct:false,
 explain:"Falsch. Stellensuchende umfassen neben den registrierten Arbeitslosen auch Personen, die nicht sofort vermittelbar sind oder die in Beschäftigungsprogrammen, Umschulungen oder Zwischenverdiensten engagiert sind."},

{id:"s05", topic:"statistik", type:"fill", diff:1, tax:"K1",
 q:"Die {0} gibt an, wie gross der Anteil der Bevölkerung ist, der entweder erwerbstätig ist oder eine Arbeitsstelle sucht. Sie wird üblicherweise in Prozent der Bevölkerung im Alter von {1} bis {2} Jahren berechnet.",
 blanks:[
   {answer:"Erwerbsquote", alts:[]},
   {answer:"15", alts:[]},
   {answer:"64", alts:[]}
 ],
 explain:"Erwerbsquote = Erwerbspersonen in % der Bevölkerung (15–64 Jahre). Eine hohe Erwerbsquote zeigt, dass ein grosser Teil der Bevölkerung am Arbeitsmarkt teilnimmt."},

{id:"s06", topic:"statistik", type:"mc", diff:2, tax:"K2",
 q:"Was ist der Hauptunterschied zwischen der Erwerbstätigenstatistik und der Beschäftigungsstatistik?",
 options:[
   {v:"A", t:"Die Erwerbstätigenstatistik zählt Personen, die Beschäftigungsstatistik zählt Stellen"},
   {v:"B", t:"Sie erfassen unterschiedliche Altersgruppen"},
   {v:"C", t:"Die Beschäftigungsstatistik erfasst nur den Industriesektor"},
   {v:"D", t:"Es gibt keinen Unterschied"}
 ],
 correct:"A",
 explain:"Die Erwerbstätigenstatistik ist personenorientiert (jede Person wird einmal gezählt). Die Beschäftigungsstatistik ist stellenorientiert (Personen mit mehreren Stellen werden mehrfach gezählt). Der Unterschied liegt in der Mehrfachbeschäftigung."},

{id:"s07", topic:"statistik", type:"open", diff:3, tax:"K4",
 q:"In der Schweiz werden täglich über 1'000 Stellen abgebaut und gleichzeitig noch mehr neu geschaffen. Erklären Sie, was diese hohe Dynamik des Arbeitsmarktes für die strukturelle Arbeitslosigkeit bedeutet.",
 sample:"Die hohe Dynamik (ca. 10% aller Stellen werden jährlich ab- oder aufgebaut) zeigt, dass der Schweizer Arbeitsmarkt die Strukturanpassungen relativ gut bewältigt. Der ständige Auf- und Abbau ermöglicht es, Ressourcen von schrumpfenden in wachsende Branchen umzulenken, ohne allzu massive Verwerfungen. Die strukturelle Arbeitslosigkeit bleibt dadurch relativ tief. Entscheidende Faktoren sind: gutes Aus- und Weiterbildungssystem und relativ flexible Arbeitsmarktregulierungen.",
 explain:"Die Schweiz hat einen «Hochleistungsarbeitsmarkt»: hohe Dynamik, kurze Arbeitslosigkeitsdauern (Anteil Langzeitarbeitslose ca. 16%), aber auch hohe Anforderungen an alle Beteiligten."},

{id:"s08", topic:"statistik", type:"multi", diff:2, tax:"K2",
 q:"Welche Aussagen zur Erwerbslosenquote (BFS/ILO) sind korrekt?",
 options:[
   {v:"A", t:"Sie basiert auf einer Stichprobenbefragung (SAKE)"},
   {v:"B", t:"Sie ist international vergleichbar, weil sie auf einheitlichen Kriterien beruht"},
   {v:"C", t:"Sie ist in der Schweiz in der Regel tiefer als die Arbeitslosenquote (SECO)"},
   {v:"D", t:"Sie erfasst auch Personen, die nicht beim Arbeitsamt registriert sind, aber aktiv eine Stelle suchen"}
 ],
 correct:["A","B","D"],
 explain:"Die Erwerbslosenquote basiert auf der SAKE-Befragung (A), ist international standardisiert (B) und erfasst auch nicht registrierte Stellensuchende (D). Sie ist in der Regel HÖHER als die Arbeitslosenquote (SECO), nicht tiefer (C ist falsch)."},

{id:"s09", topic:"statistik", type:"mc", diff:1, tax:"K1",
 q:"Was sind Erwerbspersonen?",
 options:[
   {v:"A", t:"Alle Einwohnerinnen und Einwohner eines Landes"},
   {v:"B", t:"Alle Personen, die entweder erwerbstätig sind oder eine Stelle suchen"},
   {v:"C", t:"Nur die vollzeitbeschäftigten Personen"},
   {v:"D", t:"Alle Personen im Rentenalter"}
 ],
 correct:"B",
 explain:"Erwerbspersonen = Erwerbstätige + Erwerbslose. Es sind alle Personen, die dem Arbeitsmarkt zur Verfügung stehen – egal ob sie gerade arbeiten oder eine Stelle suchen."},

{id:"s10", topic:"statistik", type:"tf", diff:3, tax:"K4",
 q:"Eine Arbeitslosenquote von 0% wäre in einer dynamischen Marktwirtschaft ein erstrebenswertes Ziel.",
 correct:false,
 explain:"Falsch. Eine Arbeitslosenquote von 0% ist in einer dynamischen Wirtschaft weder realistisch noch erstrebenswert. Eine gewisse friktionelle Arbeitslosigkeit ist unvermeidlich und sogar nützlich: Sie zeigt, dass Arbeitnehmer die Freiheit haben, bessere Stellen zu suchen, und dass ein Strukturwandel stattfindet. Das Ziel ist «Vollbeschäftigung», was eine tiefe, aber nicht null-prozentige Arbeitslosigkeit meint."},

// ── ARMUT & ARMUTSBEKÄMPFUNG (r01–r12) ──

{id:"r01", topic:"armut", type:"mc", diff:1, tax:"K1",
 q:"Welches ist der grösste Ausgabenposten des schweizerischen Staates?",
 options:[
   {v:"A", t:"Verteidigung"},
   {v:"B", t:"Bildung"},
   {v:"C", t:"Soziale Wohlfahrt"},
   {v:"D", t:"Verkehr und Infrastruktur"}
 ],
 correct:"C",
 explain:"Die soziale Wohlfahrt macht mit ca. einem Drittel der Staatsausgaben den grössten Ausgabenposten des schweizerischen Staates aus."},

{id:"r02", topic:"armut", type:"tf", diff:2, tax:"K2",
 q:"Die Existenz von Sozialversicherungen lässt sich unter anderem mit Marktversagen begründen: Ohne staatliche Eingriffe würden sich viele Menschen nicht ausreichend gegen Risiken wie Alter, Krankheit oder Arbeitslosigkeit absichern.",
 correct:true,
 explain:"Korrekt. Ohne obligatorische Sozialversicherungen würden viele Menschen die Risiken unterschätzen oder sich die Absicherung nicht leisten können (Informationsasymmetrien, adverse Selektion). Der Staat greift ein, um dieses Marktversagen zu korrigieren."},

{id:"r03", topic:"armut", type:"mc", diff:2, tax:"K2",
 q:"Was ist der Unterschied zwischen vertikaler und horizontaler Gerechtigkeit?",
 options:[
   {v:"A", t:"Vertikale Gerechtigkeit: Umverteilung von Reich zu Arm. Horizontale Gerechtigkeit: Gleiche Behandlung bei gleichen Verhältnissen."},
   {v:"B", t:"Vertikale Gerechtigkeit betrifft nur Steuern, horizontale nur Sozialversicherungen"},
   {v:"C", t:"Es gibt keinen inhaltlichen Unterschied"},
   {v:"D", t:"Vertikale Gerechtigkeit: Gleichbehandlung aller. Horizontale Gerechtigkeit: Umverteilung."}
 ],
 correct:"A",
 explain:"Vertikale Gerechtigkeit fordert eine Umverteilung zwischen verschiedenen Einkommensgruppen (von oben nach unten). Horizontale Gerechtigkeit fordert, dass Menschen in gleicher Lage gleich behandelt werden."},

{id:"r04", topic:"armut", type:"open", diff:3, tax:"K5",
 q:"Diskutieren Sie: Welche Probleme oder unbeabsichtigten Nebeneffekte können sich aus Staatseingriffen in die soziale Wohlfahrt ergeben?",
 sample:"Mögliche Probleme: 1) Fehlanreize – grosszügige Sozialleistungen können den Anreiz zur Arbeit mindern (Armutsfalle). 2) Moral Hazard – Versicherte gehen grössere Risiken ein, weil sie abgesichert sind. 3) Hohe Kosten – steigende Sozialausgaben belasten den Staatshaushalt und können zu höheren Steuern führen. 4) Demographischer Druck – alternde Gesellschaft belastet Umlagefinanzierung. 5) Bürokratie – komplexe Systeme verursachen Verwaltungskosten.",
 explain:"Grundprinzip: Staatseingriffe lösen ein Problem, können aber neue schaffen. Die Sozialpolitik muss ständig zwischen Schutz und Fehlanreizen abwägen – ein Kernproblem der ökonomischen Analyse."},

{id:"r05", topic:"armut", type:"mc", diff:1, tax:"K1",
 q:"Was ist der Unterschied zwischen absoluter und relativer Armut?",
 options:[
   {v:"A", t:"Absolute Armut: Physisches Existenzminimum nicht gesichert. Relative Armut: Einkommen deutlich unter dem gesellschaftlichen Durchschnitt."},
   {v:"B", t:"Absolute Armut betrifft nur Entwicklungsländer, relative Armut nur Industrieländer"},
   {v:"C", t:"Absolute Armut wird in Prozent gemessen, relative Armut in Franken"},
   {v:"D", t:"Es gibt keinen Unterschied – beide Begriffe meinen dasselbe"}
 ],
 correct:"A",
 explain:"Absolute Armut bedeutet, dass das physische Existenzminimum (Nahrung, Kleidung, Obdach) nicht gesichert ist. Relative Armut wird im Verhältnis zum Wohlstand der Gesellschaft gemessen – z.B. weniger als 60% des Medianeinkommens. In der Schweiz ist primär die relative Armut relevant."},

{id:"r06", topic:"armut", type:"tf", diff:1, tax:"K1",
 q:"In der Schweiz gibt es keine Armut, weil das Land eines der höchsten Pro-Kopf-Einkommen der Welt hat.",
 correct:false,
 explain:"Falsch. Trotz des hohen Wohlstands leben gemäss BFS rund 8% der Bevölkerung in relativer Einkommensarmut. Die hohen Lebenshaltungskosten (Mieten, Krankenkasse) führen dazu, dass auch in der Schweiz Menschen am Existenzminimum leben. Absolute Armut ist selten, relative Armut jedoch real."},

{id:"r07", topic:"armut", type:"mc", diff:2, tax:"K2",
 q:"Was versteht man unter «Working Poor»?",
 options:[
   {v:"A", t:"Personen, die trotz Erwerbstätigkeit unter der Armutsgrenze leben"},
   {v:"B", t:"Personen, die freiwillig auf einen hohen Lohn verzichten"},
   {v:"C", t:"Arbeitslose, die einen Zwischenverdienst haben"},
   {v:"D", t:"Personen, die ausschliesslich Teilzeit arbeiten"}
 ],
 correct:"A",
 explain:"Working Poor sind Erwerbstätige, deren Einkommen trotz Arbeit nicht ausreicht, um über der Armutsgrenze zu leben. Besonders betroffen sind Alleinerziehende, Personen ohne Berufsabschluss und Erwerbstätige in Tieflohnbranchen."},

{id:"r08", topic:"armut", type:"fill", diff:2, tax:"K2",
 q:"Die {0} beschreibt eine Situation, in der sich die Aufnahme einer Erwerbstätigkeit finanziell kaum lohnt, weil der Wegfall von {1} den zusätzlichen Verdienst weitgehend aufhebt. Dadurch wird der Anreiz zur Arbeit {2}.",
 blanks:[
   {answer:"Armutsfalle", alts:["Sozialhilfefalle"]},
   {answer:"Sozialleistungen", alts:["Transferleistungen","Sozialhilfe"]},
   {answer:"geschwächt", alts:["reduziert","vermindert","gesenkt"]}
 ],
 explain:"Die Armutsfalle (auch Sozialhilfefalle) entsteht, wenn der marginale Steuersatz bei der Aufnahme von Erwerbsarbeit nahe 100% liegt: Jeder verdiente Franken wird durch den Wegfall von Sozialleistungen und höhere Abgaben kompensiert."},

{id:"r09", topic:"armut", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Merkmale der richtigen Armutsform zu.",
 categories:["Absolute Armut", "Relative Armut"],
 items:[
   {t:"Physisches Existenzminimum nicht gesichert", cat:0},
   {t:"Einkommen unter 60% des Medianeinkommens", cat:1},
   {t:"Betrifft weltweit ca. 700 Mio. Menschen", cat:0},
   {t:"Wird im Verhältnis zum Wohlstand der Gesellschaft gemessen", cat:1},
   {t:"In der Schweiz die relevantere Armutsdefinition", cat:1},
   {t:"Hunger, mangelnde Gesundheitsversorgung, kein sauberes Wasser", cat:0}
 ],
 explain:"Absolute Armut: physisches Überleben bedroht (v.a. Entwicklungsländer). Relative Armut: deutlich unter dem gesellschaftlichen Durchschnitt (v.a. in Industrieländern wie der Schweiz relevant)."},

{id:"r10", topic:"armut", type:"multi", diff:2, tax:"K3",
 q:"Welche Personengruppen sind in der Schweiz überdurchschnittlich von Armut betroffen?",
 options:[
   {v:"A", t:"Alleinerziehende"},
   {v:"B", t:"Personen ohne Berufsabschluss"},
   {v:"C", t:"Hochschulabsolventen mit Berufserfahrung"},
   {v:"D", t:"Personen mit gesundheitlichen Einschränkungen"}
 ],
 correct:["A","B","D"],
 explain:"Überdurchschnittlich armutsgefährdet sind: Alleinerziehende (fehlende zweite Einkommensquelle, Betreuungskosten), Personen ohne Berufsabschluss (tiefe Löhne, unsichere Stellen), Personen mit gesundheitlichen Einschränkungen (eingeschränkte Erwerbsfähigkeit). Hochschulabsolventen mit Berufserfahrung gehören zur am wenigsten betroffenen Gruppe."},

{id:"r11", topic:"armut", type:"tf", diff:2, tax:"K2",
 q:"Die Sozialhilfe in der Schweiz ist eine Sozialversicherung, die durch Beiträge der Versicherten finanziert wird.",
 correct:false,
 explain:"Falsch. Die Sozialhilfe ist keine Sozialversicherung, sondern eine bedarfsabhängige Leistung, die aus allgemeinen Steuermitteln finanziert wird. Sie bildet das «letzte Netz» der sozialen Sicherung und greift, wenn alle anderen Einkommensquellen (Erwerbseinkommen, Versicherungsleistungen, Vermögen) ausgeschöpft sind."},

{id:"r12", topic:"armut", type:"open", diff:3, tax:"K5",
 q:"Die Sozialhilfe in der Schweiz wird manchmal als «zu grosszügig» und manchmal als «unzureichend» kritisiert. Erläutern Sie beide Standpunkte und nehmen Sie begründet Stellung.",
 sample:"Standpunkt «zu grosszügig»: Die Sozialhilfe schaffe Fehlanreize (Armutsfalle), da sich die Aufnahme einer Erwerbstätigkeit finanziell kaum lohne. Zudem belaste sie die Gemeindefinanzen und fördere eine Abhängigkeitskultur. Standpunkt «unzureichend»: Der Grundbedarf sei zu knapp bemessen, um am gesellschaftlichen Leben teilhaben zu können (relative Armut). Die Sozialhilfe sei mit Stigma verbunden, sodass viele Berechtigte sie nicht beanspruchen. Eigene Stellungnahme (z.B.): Beide Argumente haben einen Kern. Eine gute Sozialhilfe muss die Existenz sichern und gleichzeitig die Anreize zur Arbeitsaufnahme erhalten – z.B. durch Einkommensfreibeträge oder begleitete Wiedereingliederung.",
 explain:"Zentraler Zielkonflikt der Sozialpolitik: Schutz vs. Fehlanreize. Die Herausforderung besteht darin, ein Sicherungsnetz zu bieten, das zugleich die Eigeninitiative fördert."},

{id:"r13", topic:"armut", type:"mc", diff:2, tax:"K2",
 q:"Was versteht man unter dem sozialen Existenzminimum?",
 options:[
   {v:"A", t:"Das Einkommen, das nötig ist, um gerade nicht zu verhungern"},
   {v:"B", t:"Das Einkommen, das neben dem physischen Überleben auch die Teilhabe am gesellschaftlichen Leben ermöglicht"},
   {v:"C", t:"Den durchschnittlichen Lohn in der Schweiz"},
   {v:"D", t:"Die Mindesthöhe der AHV-Rente"}
 ],
 correct:"B",
 explain:"Das soziale Existenzminimum geht über das physische Überleben hinaus: Es soll eine minimale Teilhabe am gesellschaftlichen Leben ermöglichen (z.B. Mobilität, Kommunikation, Bildung). In der Schweiz wird es von der SKOS (Schweizerische Konferenz für Sozialhilfe) definiert."},

{id:"r14", topic:"armut", type:"multi", diff:3, tax:"K4",
 q:"Welche der folgenden Aussagen zum Zusammenhang zwischen Arbeitslosigkeit und Armut sind korrekt?",
 options:[
   {v:"A", t:"Langzeitarbeitslosigkeit erhöht das Armutsrisiko massiv, da die Versicherungsleistungen zeitlich begrenzt sind"},
   {v:"B", t:"Arbeitslosigkeit betrifft nicht nur das Einkommen, sondern auch die soziale Integration und das Selbstwertgefühl"},
   {v:"C", t:"In der Schweiz schützt die ALV vollständig und zeitlich unbegrenzt vor Armut"},
   {v:"D", t:"Der Übergang von Arbeitslosigkeit in Armut erfolgt oft schleichend über Aussteuerung und Sozialhilfe"}
 ],
 correct:["A","B","D"],
 explain:"Langzeitarbeitslosigkeit ist ein zentraler Risikofaktor für Armut: Nach der Aussteuerung (Ende der ALV-Leistungen) sinkt das Einkommen drastisch. Arbeitslosigkeit belastet zudem psychisch und sozial. Die ALV schützt nicht unbegrenzt – die Taggelder sind zeitlich befristet (max. 520 Taggelder für über 55-Jährige)."}

];
