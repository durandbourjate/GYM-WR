// Übungspool: Steuern und Staatseinnahmen
// Fachbereich: VWL
// Stufe: SF GYM3
// Anzahl Fragen: 55

window.POOL_META = {
  id: "vwl_steuern",
  fach: "VWL",
  title: "Übungspool: Steuern und Staatseinnahmen",
  meta: "SF GYM3 · Gymnasium Hofwil · Individuell üben",
  color: "vwl"
};

window.TOPICS = {
  zweck:          {label:"Steuerzweck",                          short:"Zweck"},
  formen:         {label:"Formen von Staatseinnahmen",           short:"Formen"},
  steuerarten:    {label:"Steuerarten in der Schweiz",           short:"Steuerarten"},
  quoten:         {label:"Fiskal-/Staatsquote & Laffer-Kurve",   short:"Quoten"},
  wettbewerb:     {label:"Steuerwettbewerb & Finanzausgleich",   short:"Wettbewerb"},
  elastizitaeten: {label:"Steuern und Elastizitäten",            short:"Elastizitäten"}
};

window.QUESTIONS = [

// ── STEUERZWECK (z01–z10) ──

{id:"z01", topic:"zweck", type:"mc", diff:1, tax:"K1",
 q:"Welcher Steuerzweck steht bei der Einkommenssteuer im Vordergrund?",
 options:[{v:"A",t:"Fiskalzweck"},{v:"B",t:"Lenkungszweck"},{v:"C",t:"Umverteilungszweck"},{v:"D",t:"Kontrollzweck"}],
 correct:"A",
 explain:"Der Hauptzweck der Einkommenssteuer ist der Fiskalzweck: Sie soll dem Staat genügend Mittel zur Finanzierung seiner Aufgaben verschaffen. Die Einkommenssteuer ist eine der wichtigsten Einnahmequellen des Staates."},

{id:"z02", topic:"zweck", type:"mc", diff:1, tax:"K1",
 q:"Welcher Steuerzweck wird mit der Tabaksteuer primär verfolgt?",
 options:[{v:"A",t:"Fiskalzweck"},{v:"B",t:"Lenkungszweck"},{v:"C",t:"Umverteilungszweck"},{v:"D",t:"Solidaritätszweck"}],
 correct:"B",
 explain:"Die Tabaksteuer verfolgt primär einen Lenkungszweck: Sie soll gesellschaftlich unerwünschtes Verhalten (Rauchen) verteuern und damit entmutigen. Daneben generiert sie natürlich auch Fiskaleinnahmen."},

{id:"z03", topic:"zweck", type:"mc", diff:2, tax:"K2",
 q:"Warum wird die Steuerprogression oft mit dem Umverteilungszweck begründet?",
 options:[{v:"A",t:"Weil alle den gleichen Betrag bezahlen"},{v:"B",t:"Weil höhere Einkommen einen höheren Prozentsatz entrichten"},{v:"C",t:"Weil sie nur auf indirekte Steuern angewendet wird"},{v:"D",t:"Weil sie den Konsum von Luxusgütern lenkt"}],
 correct:"B",
 explain:"Bei der Steuerprogression steigt der Steuersatz mit zunehmendem Einkommen. Dadurch werden Personen mit höherem Einkommen nicht nur absolut, sondern auch relativ (prozentual) stärker belastet. Dies bewirkt eine Umverteilung von wohlhabenden zu weniger wohlhabenden Personen."},

{id:"z04", topic:"zweck", type:"tf", diff:1, tax:"K1",
 q:"Die CO₂-Abgabe ist ein Beispiel für eine Steuer mit Lenkungszweck.",
 correct:true,
 explain:"Richtig. Die CO₂-Abgabe soll den Ausstoss von Treibhausgasen verteuern und damit klimaschädliches Verhalten reduzieren – ein klassischer Lenkungszweck."},

{id:"z05", topic:"zweck", type:"tf", diff:2, tax:"K2",
 q:"Eine Steuer kann gleichzeitig mehrere Zwecke verfolgen.",
 correct:true,
 explain:"Richtig. Die meisten Steuern verfolgen mehrere Zwecke gleichzeitig. Beispiel: Die Tabaksteuer hat einen Lenkungszweck (Rauchverhalten reduzieren), generiert aber auch Fiskaleinnahmen und die Progression bei der Einkommenssteuer dient dem Fiskal- und dem Umverteilungszweck."},

{id:"z06", topic:"zweck", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Steuern dem passenden Hauptzweck zu.",
 pairs:[
   {left:"Einkommenssteuer",     right:"Fiskalzweck"},
   {left:"Erbschaftssteuer",     right:"Umverteilungszweck"},
   {left:"Alkoholsteuer",        right:"Lenkungszweck"},
   {left:"Mehrwertsteuer",       right:"Fiskalzweck"},
   {left:"CO₂-Abgabe",           right:"Lenkungszweck"}
 ],
 explain:"Die Einkommens- und Mehrwertsteuer dienen primär dem Fiskalzweck (Finanzierung der Staatsaufgaben). Die Erbschaftssteuer betont den Umverteilungszweck. Alkoholsteuer und CO₂-Abgabe verfolgen einen Lenkungszweck (unerwünschtes Verhalten verteuern)."},

{id:"z07", topic:"zweck", type:"open", diff:2, tax:"K2",
 q:"Erklären Sie den Unterschied zwischen Fiskalzweck und Lenkungszweck anhand je eines konkreten Beispiels.",
 sample:"Der Fiskalzweck zielt darauf ab, dem Staat Einnahmen zu verschaffen, um seine Aufgaben zu finanzieren (z.B. Einkommenssteuer). Der Lenkungszweck will bestimmtes Verhalten beeinflussen – unerwünschtes entmutigen oder erwünschtes fördern (z.B. Tabaksteuer: Rauchen soll reduziert werden; Steuervergünstigungen für energetische Sanierungen: umweltfreundliches Verhalten soll gefördert werden).",
 explain:"Beim Fiskalzweck geht es primär um Einnahmen (Beispiele: Einkommens-, Vermögens-, Mehrwertsteuer). Beim Lenkungszweck geht es um Verhaltenssteuerung (Beispiele: Tabak-, Alkohol-, CO₂-Abgabe). In der Praxis überschneiden sich die Zwecke oft."},

{id:"z08", topic:"zweck", type:"mc", diff:2, tax:"K3",
 q:"Ein Kanton führt eine hohe Steuer auf Einweg-Plastiktüten ein, deren Ertrag in den Umweltschutz fliesst. Welche Kombination von Steuerzwecken liegt hier vor?",
 options:[{v:"A",t:"Nur Fiskalzweck"},{v:"B",t:"Fiskalzweck und Lenkungszweck"},{v:"C",t:"Nur Umverteilungszweck"},{v:"D",t:"Lenkungszweck und Umverteilungszweck"}],
 correct:"B",
 explain:"Die Steuer verteuert den Konsum von Einweg-Plastiktüten (Lenkungszweck: unerwünschtes Verhalten entmutigen) und generiert gleichzeitig Einnahmen, die zweckgebunden für den Umweltschutz verwendet werden (Fiskalzweck). Ein Umverteilungszweck (von Reich zu Arm) liegt nicht vor."},

{id:"z09", topic:"zweck", type:"tf", diff:1, tax:"K1",
 q:"Der Fiskalzweck ist der Hauptzweck der meisten Steuern in der Schweiz.",
 correct:true,
 explain:"Richtig. Der Grossteil der Steuereinnahmen (Einkommens-, Vermögens-, Mehrwertsteuer, Gewinnsteuer) dient primär dem Fiskalzweck – also der Finanzierung der Staatsaufgaben."},

{id:"z10", topic:"zweck", type:"mc", diff:3, tax:"K5",
 q:"Ein Ökonom argumentiert, dass Lenkungssteuern «sich selbst abschaffen», wenn sie wirksam sind. Was ist damit gemeint?",
 options:[{v:"A",t:"Die Steuer wird vom Parlament abgeschafft, sobald sie wirkt"},{v:"B",t:"Wenn das unerwünschte Verhalten abnimmt, sinken auch die Steuereinnahmen"},{v:"C",t:"Die Steuer wird automatisch gesenkt, wenn weniger konsumiert wird"},{v:"D",t:"Die Steuer wird durch Subventionen ersetzt"}],
 correct:"B",
 explain:"Wenn eine Lenkungssteuer ihren Zweck erfüllt (z.B. weniger Tabakkonsum), sinkt die besteuerte Menge und damit auch die Steuereinnahmen. Eine «perfekt» wirkende Lenkungssteuer würde keine Einnahmen mehr generieren. Dies steht in einem Spannungsverhältnis zum Fiskalzweck."},

// ── FORMEN VON STAATSEINNAHMEN (f01–f10) ──

{id:"f01", topic:"formen", type:"mc", diff:1, tax:"K1",
 q:"Welche drei Hauptquellen hat der Staat, um seine Ausgaben zu finanzieren?",
 options:[{v:"A",t:"Steuern, Gebühren und Verschuldung"},{v:"B",t:"Steuern, Zölle und Spenden"},{v:"C",t:"Gebühren, Bussen und Lotterieeinnahmen"},{v:"D",t:"Steuern, Gebühren und Geldschöpfung"}],
 correct:"A",
 explain:"Die drei Hauptquellen sind: Steuern (direkte und indirekte), Gebühren (für konkrete Staatsleistungen) und Verschuldung (Kreditaufnahme am Kapitalmarkt). Längerfristig ist die Finanzierung nur über Steuern möglich, da Schulden irgendwann zurückgezahlt werden müssen."},

{id:"f02", topic:"formen", type:"tf", diff:1, tax:"K1",
 q:"Direkte Steuern berücksichtigen persönliche Merkmale der steuerpflichtigen Person.",
 correct:true,
 explain:"Richtig. Direkte Steuern (z.B. Einkommens- und Vermögenssteuer) werden aufgrund persönlicher Merkmale wie Einkommen, Vermögen und Familienstand erhoben. Sie sind deshalb bei verschiedenen Personen unterschiedlich hoch."},

{id:"f03", topic:"formen", type:"tf", diff:1, tax:"K1",
 q:"Die Mehrwertsteuer ist eine direkte Steuer.",
 correct:false,
 explain:"Falsch. Die Mehrwertsteuer ist eine indirekte Steuer. Sie wird auf Markttransaktionen erhoben, unabhängig von persönlichen Merkmalen der Käuferin oder des Käufers. Alle bezahlen denselben MwSt-Satz auf einem bestimmten Produkt, unabhängig von ihrem Einkommen."},

{id:"f04", topic:"formen", type:"mc", diff:2, tax:"K2",
 q:"Warum können indirekte Steuern degressiv wirken?",
 options:[{v:"A",t:"Weil sie nur auf Luxusgüter erhoben werden"},{v:"B",t:"Weil Personen mit niedrigem Einkommen anteilig mehr für Konsum ausgeben"},{v:"C",t:"Weil der Steuersatz mit dem Einkommen sinkt"},{v:"D",t:"Weil sie nur von Unternehmen bezahlt werden"}],
 correct:"B",
 explain:"Indirekte Steuern wie die MwSt belasten alle mit demselben Satz. Da Personen mit niedrigem Einkommen einen grösseren Anteil ihres Einkommens für Konsum ausgeben (und weniger sparen), wird ihr Einkommen relativ stärker durch die MwSt belastet. Dies nennt man einen degressiven (regressiven) Effekt."},

{id:"f05", topic:"formen", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die folgenden Abgaben der richtigen Kategorie zu.",
 pairs:[
   {left:"Einkommenssteuer",     right:"Direkte Steuer"},
   {left:"Mehrwertsteuer",       right:"Indirekte Steuer"},
   {left:"Kehrichtgebühr",       right:"Gebühr"},
   {left:"Zoll auf Importwaren", right:"Indirekte Steuer"},
   {left:"Vermögenssteuer",      right:"Direkte Steuer"},
   {left:"Passgebühr",           right:"Gebühr"}
 ],
 explain:"Direkte Steuern berücksichtigen persönliche Merkmale (Einkommen, Vermögen). Indirekte Steuern werden auf Transaktionen erhoben (MwSt, Zölle). Gebühren sind Zahlungen für konkrete Staatsleistungen (Kehrichtentsorgung, Pass)."},

{id:"f06", topic:"formen", type:"fill", diff:1, tax:"K1",
 q:"Gebühren sind Zahlungen für konkrete _______ des Staates und werden nur geschuldet, wenn die Leistung auch tatsächlich _______ wird.",
 correct:["Leistungen","bezogen"],
 explain:"Im Gegensatz zu Steuern, die unabhängig vom Leistungsbezug erhoben werden, sind Gebühren an eine konkrete Gegenleistung gebunden (z.B. Passgebühr, Führerausweis, Kehrichtentsorgung). Wer die Leistung nicht bezieht, muss die Gebühr nicht bezahlen."},

{id:"f07", topic:"formen", type:"mc", diff:2, tax:"K2",
 q:"Warum kann sich ein Staat langfristig nicht nur über Verschuldung finanzieren?",
 options:[{v:"A",t:"Weil die Nationalbank keine Kredite an den Staat vergeben darf"},{v:"B",t:"Weil Schulden irgendwann zurückgezahlt werden müssen, was höhere Steuern erfordert"},{v:"C",t:"Weil die Inflation automatisch alle Schulden tilgt"},{v:"D",t:"Weil Obligationen nur an Inländer verkauft werden dürfen"}],
 correct:"B",
 explain:"Schulden verschieben die Finanzierungslast in die Zukunft. In einer späteren Periode müssen die Steuereinnahmen zwingend höher sein als die Staatsausgaben, um die Schulden zurückzuzahlen. Verschuldung ist daher nur eine vorübergehende Finanzierungslösung."},

{id:"f08", topic:"formen", type:"mc", diff:1, tax:"K1",
 q:"Wer ist bei der Mehrwertsteuer der Steuerschuldner und wer der Steuerträger?",
 options:[{v:"A",t:"Steuerschuldner: Konsument; Steuerträger: Unternehmen"},{v:"B",t:"Steuerschuldner: Konsument; Steuerträger: Konsument"},{v:"C",t:"Steuerschuldner: Unternehmen; Steuerträger: Konsument"},{v:"D",t:"Steuerschuldner: Staat; Steuerträger: Unternehmen"}],
 correct:"C",
 explain:"Bei indirekten Steuern fallen Steuerschuldner und Steuerträger auseinander. Der Konsument bezahlt die MwSt beim Kauf (Steuerträger), aber das Unternehmen ist verpflichtet, die Steuer an den Staat abzuliefern (Steuerschuldner)."},

{id:"f09", topic:"formen", type:"tf", diff:2, tax:"K2",
 q:"Quellensteuern werden direkt an der Einkunftsquelle abgeschöpft, bevor das Geld beim Empfänger ankommt.",
 correct:true,
 explain:"Richtig. Bei Quellensteuern wird die Steuer direkt beim Schuldner der steuerpflichtigen Leistung erhoben, bevor die Zahlung den Empfänger erreicht. Ein typisches Beispiel ist die Verrechnungssteuer auf Kapitalerträgen (35%), die von der Bank einbehalten wird."},

{id:"f10", topic:"formen", type:"open", diff:3, tax:"K4",
 q:"Im ‹Tagebuch eines Steuerzahlers› bezahlt ein Tramführer an einem einzigen Tag Fr. 59.90 an verschiedensten Steuern und Gebühren. Analysieren Sie: Welche Steuerarten (direkt/indirekt/Gebühren) sind dabei überproportional vertreten, und was sagt das über das Schweizer Steuersystem?",
 sample:"Der Tramführer bezahlt eine Vielzahl indirekter Steuern (MwSt auf Kaffee, Lebensmittel, Benzin, Zigaretten; Mineralölsteuer; Tabaksteuer; Biersteuer; Alkoholsteuer; Billettsteuern; Zölle) sowie Gebühren (Kehricht, Autobahnvignette). Die grössten Einzelbeträge entfallen aber auf die direkten Steuern (Gemeinde-, Kantons-, Bundessteuer = Fr. 34.80). Das zeigt, dass im Schweizer System die direkten Steuern den grössten Anteil ausmachen, man aber im Alltag ständig von einer Vielzahl kleinerer indirekter Steuern betroffen ist.",
 explain:"Das Tagebuch verdeutlicht die Vielfalt des Schweizer Steuersystems: Obwohl die direkten Steuern (Einkommens-, Vermögenssteuer) den höchsten Einzelbetrag ausmachen, gibt es eine grosse Anzahl verschiedener indirekter Steuern und Gebühren, die den Alltag durchziehen. Dies zeigt den föderalistischen Aufbau (Gemeinde-, Kantons-, Bundessteuern) und die verschiedenen Steuerzwecke (Fiskal-, Lenkungs-, Umverteilungszweck)."},

// ── STEUERARTEN IN DER SCHWEIZ (s01–s10) ──

{id:"s01", topic:"steuerarten", type:"mc", diff:1, tax:"K1",
 q:"Was bedeutet Steuerprogression?",
 options:[{v:"A",t:"Der Steuersatz bleibt bei allen Einkommen gleich"},{v:"B",t:"Der Steuersatz sinkt mit zunehmendem Einkommen"},{v:"C",t:"Der Steuersatz steigt mit zunehmendem Einkommen"},{v:"D",t:"Die Steuer wird nur ab einem bestimmten Einkommen erhoben"}],
 correct:"C",
 explain:"Bei der Steuerprogression steigt der Steuersatz (Prozentsatz) mit zunehmendem Einkommen. Das Einkommen wird somit überproportional besteuert. Dies dient dem Umverteilungszweck: Personen mit höherem Einkommen tragen relativ und absolut mehr bei."},

{id:"s02", topic:"steuerarten", type:"mc", diff:2, tax:"K2",
 q:"Was ist der Unterschied zwischen dem Grenzsteuersatz und dem Durchschnittssteuersatz?",
 options:[{v:"A",t:"Der Grenzsteuersatz bezieht sich auf den letzten verdienten Franken, der Durchschnittssteuersatz auf das gesamte Einkommen"},{v:"B",t:"Der Grenzsteuersatz gilt nur für Unternehmen, der Durchschnittssteuersatz für Privatpersonen"},{v:"C",t:"Es gibt keinen Unterschied, beide Begriffe sind synonym"},{v:"D",t:"Der Grenzsteuersatz wird vom Bund erhoben, der Durchschnittssteuersatz vom Kanton"}],
 correct:"A",
 explain:"Der Grenzsteuersatz gibt an, wie viel Steuer auf den zuletzt verdienten Franken entfällt (z.B. 30% auf den letzten verdienten Franken). Der Durchschnittssteuersatz gibt den Anteil der Steuern am gesamten Einkommen an (z.B. 15% des Gesamteinkommens). Bei einer progressiven Steuer liegt der Grenzsteuersatz immer über dem Durchschnittssteuersatz."},

{id:"s03", topic:"steuerarten", type:"calc", diff:2, tax:"K3",
 q:"Eine Person verdient CHF 80'000 steuerbares Einkommen und bezahlt CHF 12'000 Einkommenssteuer. Berechnen Sie den Durchschnittssteuersatz.",
 correct:"15%",
 explain:"Durchschnittssteuersatz = Steuerbetrag / steuerbares Einkommen × 100 = CHF 12'000 / CHF 80'000 × 100 = 15%. Das bedeutet, dass diese Person im Durchschnitt 15 Rappen pro verdienten Franken als Steuer abliefert."},

{id:"s04", topic:"steuerarten", type:"mc", diff:1, tax:"K1",
 q:"Wie hoch ist der Normalsatz der Mehrwertsteuer in der Schweiz (Stand 2024)?",
 options:[{v:"A",t:"7.7%"},{v:"B",t:"8.1%"},{v:"C",t:"10%"},{v:"D",t:"19%"}],
 correct:"B",
 explain:"Der Normalsatz der Schweizer Mehrwertsteuer beträgt seit 2024 8.1% (zuvor 7.7%). Daneben gibt es einen reduzierten Satz von 2.6% (für Güter des täglichen Bedarfs wie Lebensmittel, Bücher, Zeitungen) und einen Sondersatz von 3.8% (für Beherbergungsleistungen)."},

{id:"s05", topic:"steuerarten", type:"tf", diff:1, tax:"K1",
 q:"Die Verrechnungssteuer in der Schweiz beträgt 35% und wird auf Kapitalerträge erhoben.",
 correct:true,
 explain:"Richtig. Die Verrechnungssteuer von 35% wird direkt an der Quelle auf Kapitalerträge (z.B. Zinsen, Dividenden) erhoben. Sie wird bei korrekter Deklaration in der Steuererklärung zurückerstattet. Sie dient damit auch als Anreiz zur ehrlichen Deklaration."},

{id:"s06", topic:"steuerarten", type:"mc", diff:2, tax:"K2",
 q:"Warum wird die Verrechnungssteuer bei korrekter Deklaration zurückerstattet?",
 options:[{v:"A",t:"Weil sie verfassungswidrig ist"},{v:"B",t:"Weil sie als Sicherungssteuer gegen Steuerhinterziehung dient"},{v:"C",t:"Weil sie nur für ausländische Anleger gedacht ist"},{v:"D",t:"Weil der Bund das Geld nicht benötigt"}],
 correct:"B",
 explain:"Die Verrechnungssteuer ist eine Sicherungssteuer: Sie soll sicherstellen, dass Kapitalerträge in der Steuererklärung deklariert werden. Wer die Erträge korrekt deklariert, erhält die 35% zurück. Wer nicht deklariert, verliert den Betrag – ein starker Anreiz zur ehrlichen Angabe."},

{id:"s07", topic:"steuerarten", type:"calc", diff:2, tax:"K3",
 q:"Eine Anlegerin erhält CHF 2'000 Dividende. Wie viel wird als Verrechnungssteuer abgezogen, und wie viel erhält sie ausbezahlt?",
 correct:"Verrechnungssteuer: CHF 700; Auszahlung: CHF 1'300",
 explain:"Verrechnungssteuer = 35% von CHF 2'000 = CHF 700. Die Anlegerin erhält CHF 2'000 − CHF 700 = CHF 1'300 ausbezahlt. Die CHF 700 kann sie bei korrekter Deklaration in der Steuererklärung vollständig zurückfordern."},

{id:"s08", topic:"steuerarten", type:"tf", diff:2, tax:"K2",
 q:"Lebensmittel unterliegen in der Schweiz dem reduzierten Mehrwertsteuersatz, was ein Umverteilungselement darstellt.",
 correct:true,
 explain:"Richtig. Der reduzierte MwSt-Satz (2.6%) auf Güter des täglichen Bedarfs (Lebensmittel, Medikamente, Bücher) entlastet relativ gesehen Personen mit geringerem Einkommen stärker, da diese einen grösseren Anteil ihres Einkommens für Grundbedürfnisse ausgeben."},

{id:"s09", topic:"steuerarten", type:"mc", diff:1, tax:"K1",
 q:"Wovon hängt die Höhe der Einkommenssteuer in der Schweiz ab?",
 options:[{v:"A",t:"Nur vom Einkommen"},{v:"B",t:"Vom Wohnort, Zivilstand und der Einkommenshöhe"},{v:"C",t:"Nur vom Kanton"},{v:"D",t:"Vom Arbeitgeber und dem Beruf"}],
 correct:"B",
 explain:"Die Einkommenssteuer in der Schweiz hängt von drei Faktoren ab: dem Wohnort (jeder Kanton und jede Gemeinde hat einen eigenen Steuersatz), dem Zivilstand (Ehepaare haben tiefere Sätze) und der Einkommenshöhe (Progression: höheres Einkommen → höherer Steuersatz)."},

{id:"s10", topic:"steuerarten", type:"open", diff:3, tax:"K4",
 q:"Erklären Sie, warum die Mehrwertsteuer trotz einheitlichem Satz als regressive Steuer gilt. Beurteilen Sie, ob der reduzierte Satz auf Lebensmittel dieses Problem löst.",
 sample:"Die MwSt ist regressiv, weil alle denselben Prozentsatz bezahlen, unabhängig vom Einkommen. Da einkommensschwache Personen einen grösseren Anteil ihres Einkommens für Konsum ausgeben (und weniger sparen können), wird ihr Einkommen relativ stärker durch die MwSt belastet. Der reduzierte Satz auf Lebensmittel mildert den Effekt ab, löst das Problem aber nicht, da auch wohlhabende Personen vom reduzierten Satz profitieren und die Konsumquote insgesamt bei einkommensschwachen Haushalten höher bleibt.",
 explain:"Die Regressivität der MwSt ergibt sich aus der unterschiedlichen Sparquote: Wer wenig verdient, konsumiert einen grösseren Anteil seines Einkommens und wird daher relativ stärker belastet. Der reduzierte Satz auf Grundbedürfnisse ist ein Korrektiv, löst aber das Grundproblem nicht vollständig, da der Effekt nicht zielgenau ist (alle profitieren) und die Gesamtbelastung weiterhin regressiv wirkt."},

// ── FISKAL-/STAATSQUOTE & LAFFER-KURVE (q01–q09) ──

{id:"q01", topic:"quoten", type:"fill", diff:1, tax:"K1",
 q:"Die _______ gibt den Anteil der Steuern, Abgaben und Gebühren am BIP an. Die _______ gibt den Anteil der Staatsausgaben am BIP an.",
 correct:["Fiskalquote","Staatsquote"],
 explain:"Die Fiskalquote misst die Einnahmeseite (Steuern + Abgaben + Gebühren in % des BIP). Die Staatsquote misst die Ausgabeseite (Staatsausgaben in % des BIP). Beide Kennzahlen zeigen den Umfang der Staatstätigkeit."},

{id:"q02", topic:"quoten", type:"mc", diff:2, tax:"K2",
 q:"Die Schweiz hat im internationalen Vergleich eine tiefe Fiskalquote. Was deutet das an?",
 options:[{v:"A",t:"Der Staat gibt wenig Geld aus"},{v:"B",t:"Der Anteil der staatlichen Abgaben am BIP ist relativ gering"},{v:"C",t:"Die Schweiz erhebt keine indirekten Steuern"},{v:"D",t:"Die Schweiz hat eine hohe Staatsverschuldung"}],
 correct:"B",
 explain:"Eine tiefe Fiskalquote bedeutet, dass der Staat relativ wenig Steuern und Abgaben gemessen an der Wirtschaftsleistung erhebt. Die Schweiz liegt mit rund 28% deutlich unter dem OECD-Durchschnitt (ca. 34%). Dies widerspiegelt die traditionell liberale Wirtschaftspolitik mit vergleichsweise wenig staatlicher Umverteilung."},

{id:"q03", topic:"quoten", type:"mc", diff:2, tax:"K3",
 q:"Land A hat eine Fiskalquote von 45% und Land B eine von 25%. Welche Aussage lässt sich daraus NICHT ableiten?",
 options:[{v:"A",t:"Land A erhebt relativ mehr Steuern als Land B"},{v:"B",t:"Land A hat vermutlich ein umfassenderes Sozialsystem"},{v:"C",t:"Die Bevölkerung von Land A ist wohlhabender als die von Land B"},{v:"D",t:"In Land A spielt der Staat eine grössere Rolle in der Wirtschaft"}],
 correct:"C",
 explain:"Die Fiskalquote sagt nichts über das absolute Wohlstandsniveau aus. Ein Land kann eine hohe Fiskalquote haben und trotzdem ärmer sein (oder umgekehrt). Die Quote misst nur den relativen Anteil der Abgaben am BIP, nicht den absoluten Wohlstand."},

{id:"q04", topic:"quoten", type:"mc", diff:2, tax:"K2",
 q:"Was beschreibt die Laffer-Kurve?",
 options:[{v:"A",t:"Den Zusammenhang zwischen Inflation und Arbeitslosigkeit"},{v:"B",t:"Den Zusammenhang zwischen Steuersatz und Steuereinnahmen"},{v:"C",t:"Den Zusammenhang zwischen BIP-Wachstum und Staatsquote"},{v:"D",t:"Den Zusammenhang zwischen Verschuldung und Zinssatz"}],
 correct:"B",
 explain:"Die Laffer-Kurve zeigt, dass die Steuereinnahmen bei einem Steuersatz von 0% und 100% jeweils null betragen. Dazwischen gibt es ein Maximum. Bei einem Steuersatz von 100% entfällt jeder Arbeitsanreiz, sodass niemand mehr arbeitet und keine Einnahmen generiert werden."},

{id:"q05", topic:"quoten", type:"tf", diff:2, tax:"K2",
 q:"Gemäss der Laffer-Kurve führt eine Erhöhung des Steuersatzes immer zu höheren Steuereinnahmen.",
 correct:false,
 explain:"Falsch. Die Laffer-Kurve zeigt, dass ab einem bestimmten Punkt (dem Scheitelpunkt) eine weitere Erhöhung des Steuersatzes zu sinkenden Einnahmen führt. Jenseits des Optimums überwiegen die negativen Anreizeffekte (Arbeitsvermeidung, Steuerflucht, Schwarzarbeit), sodass die Bemessungsgrundlage schrumpft."},

{id:"q06", topic:"quoten", type:"open", diff:3, tax:"K5",
 q:"Beurteilen Sie die Aussagekraft der Laffer-Kurve für die Steuerpolitik. Wo liegen die Grenzen dieses Modells?",
 sample:"Die Laffer-Kurve ist theoretisch einleuchtend: Bei 0% und 100% Steuern sind die Einnahmen null. In der Praxis ist es jedoch extrem schwierig, den optimalen Steuersatz zu bestimmen, da er von vielen Faktoren abhängt (Wirtschaftsstruktur, Steuermoral, internationale Mobilität). Zudem suggeriert die Kurve, dass es nur einen optimalen Satz gibt, obwohl verschiedene Steuerarten unterschiedliche Kurven haben. Politisch wird die Laffer-Kurve oft instrumentalisiert: Befürworter von Steuersenkungen argumentieren, man befinde sich rechts des Maximums – was empirisch selten belegt ist.",
 explain:"Die Laffer-Kurve ist ein nützliches Denkmodell, hat aber erhebliche praktische Grenzen: Der optimale Steuersatz ist empirisch kaum bestimmbar, er variiert je nach Steuerart und Kontext, und das Modell berücksichtigt keine Verteilungseffekte oder Wohlfahrtswirkungen der Staatsausgaben."},

{id:"q07", topic:"quoten", type:"tf", diff:1, tax:"K1",
 q:"Bei einem Steuersatz von 100% beträgt die Steuereinnahme gemäss Laffer-Kurve null.",
 correct:true,
 explain:"Richtig. Bei einem Steuersatz von 100% müssten die Steuerpflichtigen ihr gesamtes Einkommen abgeben. Dies vernichtet jeglichen Arbeitsanreiz – niemand würde mehr arbeiten, und die Steuereinnahmen wären null."},

{id:"q08", topic:"quoten", type:"calc", diff:2, tax:"K3",
 q:"Ein Land hat ein BIP von CHF 800 Mrd. und Steuereinnahmen von CHF 224 Mrd. Berechnen Sie die Fiskalquote.",
 correct:"28%",
 explain:"Fiskalquote = Steuereinnahmen / BIP × 100 = CHF 224 Mrd. / CHF 800 Mrd. × 100 = 28%. Zum Vergleich: Die Schweiz hat eine Fiskalquote von rund 28%, was im internationalen Vergleich tief ist (z.B. Schweden ca. 43%, Deutschland ca. 38%)."},

{id:"q09", topic:"quoten", type:"mc", diff:3, tax:"K4",
 q:"Warum kann die Staatsquote eines Landes höher sein als seine Fiskalquote?",
 options:[{v:"A",t:"Weil der Staat mehr einnimmt als ausgibt"},{v:"B",t:"Weil der Staat die Differenz über Verschuldung finanziert"},{v:"C",t:"Weil Gebühren nicht zur Fiskalquote zählen"},{v:"D",t:"Weil die Staatsquote die Inflation berücksichtigt"}],
 correct:"B",
 explain:"Wenn die Staatsausgaben (Staatsquote) die Steuereinnahmen (Fiskalquote) übersteigen, finanziert der Staat die Differenz über Verschuldung. Dies führt zu einem Haushaltsdefizit. Umgekehrt weist ein Staat einen Überschuss auf, wenn die Fiskalquote höher ist als die Staatsquote."},

// ── STEUERWETTBEWERB & FINANZAUSGLEICH (w01–w10) ──

{id:"w01", topic:"wettbewerb", type:"mc", diff:1, tax:"K1",
 q:"Was versteht man unter Steuerwettbewerb?",
 options:[{v:"A",t:"Länder oder Kantone konkurrieren mit tiefen Steuern um attraktive Steuerzahlende"},{v:"B",t:"Steuerpflichtige konkurrieren um den günstigsten Steuersatz"},{v:"C",t:"Verschiedene Steuerarten konkurrieren um die höchsten Einnahmen"},{v:"D",t:"Der Bund und die Kantone streiten um die Verteilung der Steuereinnahmen"}],
 correct:"A",
 explain:"Steuerwettbewerb bedeutet, dass Länder, Kantone oder Gemeinden versuchen, durch tiefe Steuersätze attraktive Steuerzahlende (wohlhabende Privatpersonen und profitable Unternehmen) anzulocken. Das Schweizer föderalistische System mit unterschiedlichen Kantons- und Gemeindesteuern ist ein typisches Beispiel."},

{id:"w02", topic:"wettbewerb", type:"mc", diff:1, tax:"K1",
 q:"Was misst der Steuerausschöpfungsindex?",
 options:[{v:"A",t:"Den höchsten Steuersatz eines Kantons"},{v:"B",t:"Das Verhältnis der Steuereinnahmen zum steuerlich ausschöpfbaren Potenzial"},{v:"C",t:"Die Anzahl verschiedener Steuerarten in einem Kanton"},{v:"D",t:"Den Anteil der Steuern am BIP eines Kantons"}],
 correct:"B",
 explain:"Der Steuerausschöpfungsindex der Eidgenössischen Finanzverwaltung setzt die Steuereinnahmen eines Kantons ins Verhältnis zu seinem steuerlich ausschöpfbaren Potenzial (Wirtschaftskraft). Kantone wie Zug, Schwyz und Nidwalden schöpfen ihr Potenzial wenig aus (tiefe Steuern), während Genf, Bern oder Graubünden stark ausschöpfen."},

{id:"w03", topic:"wettbewerb", type:"tf", diff:2, tax:"K2",
 q:"Das Rezept der Steueroasen funktioniert immer: Steuern senken → reiche Neuzuzüger → Steuerausfälle werden kompensiert.",
 correct:false,
 explain:"Falsch. Am Beispiel Luzern zeigt sich, dass das Rezept nicht immer funktioniert. Grosse Kantone mit Zentrumsfunktion haben strukturelle Nachteile (Zentrumslasten, ländliche Gebiete), die auch durch tiefe Steuern kaum kompensiert werden können. Luzern musste trotz tiefster Unternehmenssteuern Sparpakete schnüren und die Steuern für die Bevölkerung wieder erhöhen."},

{id:"w04", topic:"wettbewerb", type:"mc", diff:2, tax:"K3",
 q:"Warum konnte Obwalden seine Steuerstrategie erfolgreicher umsetzen als Luzern?",
 options:[{v:"A",t:"Obwalden hat eine grössere Bevölkerung"},{v:"B",t:"Obwalden ist kleiner und hat weniger Zentrumslasten"},{v:"C",t:"Obwalden hat höhere Steuern als Luzern"},{v:"D",t:"Obwalden liegt näher bei Zürich"}],
 correct:"B",
 explain:"Obwalden ist ein kleiner Kanton ohne grosse Zentrumslasten. Schon wenige wohlhabende Neuzuzüger haben eine spürbare Wirkung auf die Steuerkraft. Luzern dagegen hat mit dem Entlebuch und dem Hinterland strukturschwache Gebiete und als Zentrum zusätzliche Kosten, die durch Steueranreize allein nicht kompensiert werden."},

{id:"w05", topic:"wettbewerb", type:"mc", diff:1, tax:"K1",
 q:"Was ist der nationale Finanzausgleich (NFA)?",
 options:[{v:"A",t:"Ein System, bei dem ressourcenstarke Kantone an ressourcenschwache Kantone zahlen"},{v:"B",t:"Ein Steuersenkungsprogramm des Bundes"},{v:"C",t:"Ein System zur Vereinheitlichung aller Kantonssteuern"},{v:"D",t:"Ein Kreditprogramm der Nationalbank für verschuldete Kantone"}],
 correct:"A",
 explain:"Der NFA (Nationaler Finanzausgleich) ist ein Ausgleichsmechanismus, bei dem finanzstarke Kantone (Geberkantone wie Zug, Schwyz, Zürich, Basel-Stadt) Beiträge an finanzschwache Kantone (Nehmerkantone wie Uri, Jura, Glarus, Wallis, Freiburg) leisten. Ziel ist es, allen Kantonen eine minimale finanzielle Ausstattung zu gewährleisten."},

{id:"w06", topic:"wettbewerb", type:"tf", diff:2, tax:"K2",
 q:"Wenn ein Kanton dank Steuersenkungen an Wirtschaftskraft gewinnt, erhält er automatisch mehr aus dem NFA.",
 correct:false,
 explain:"Falsch – das Gegenteil ist der Fall. Wenn ein Kanton an Wirtschaftskraft (Ressourcenstärke) gewinnt, erhält er weniger aus dem NFA, weil er weniger auf Ausgleichszahlungen angewiesen ist. Dies erlebte Luzern: Der Kanton gewann an Wirtschaftskraft, erhielt aber weniger NFA-Mittel – was die Finanzlage zusätzlich verschärfte."},

{id:"w07", topic:"wettbewerb", type:"open", diff:3, tax:"K5",
 q:"Beurteilen Sie den Steuerwettbewerb zwischen den Schweizer Kantonen: Überwiegen Ihrer Meinung nach die Vorteile oder die Nachteile?",
 sample:"Vorteile: Der Steuerwettbewerb sorgt für Haushaltsdisziplin, begrenzt die Staatstätigkeit, ermöglicht Vielfalt und Experimentierfreude. Bürgerinnen und Bürger können mit den Füssen abstimmen. Nachteile: Er kann zu einem Wettlauf nach unten führen (Race to the Bottom), benachteiligt strukturschwache Kantone, und es besteht die Gefahr, dass öffentliche Leistungen (Bildung, Infrastruktur) unterfinanziert werden. Der Finanzausgleich mildert die Nachteile, kann aber Fehlanreize setzen.",
 explain:"Der Steuerwettbewerb hat positive (Disziplinierung, Effizienz, Wahlfreiheit) und negative Seiten (Ungleichheit, Unterfinanzierung, Race to the Bottom). Der NFA korrigiert die grössten Ungleichheiten, schafft aber seinerseits Anreizkonflikte (z.B. kann ein Kanton von Steuererhöhungen profitieren, wenn er dadurch mehr NFA-Beiträge erhält)."},

{id:"w08", topic:"wettbewerb", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie die Kantone als typische Geber- oder Nehmerkantone im nationalen Finanzausgleich zu.",
 pairs:[
   {left:"Zug",           right:"Geberkanton"},
   {left:"Uri",           right:"Nehmerkanton"},
   {left:"Zürich",        right:"Geberkanton"},
   {left:"Jura",          right:"Nehmerkanton"},
   {left:"Schwyz",        right:"Geberkanton"},
   {left:"Freiburg",      right:"Nehmerkanton"}
 ],
 explain:"Geberkantone (ressourcenstark, tiefe Steuerausschöpfung): Zug, Schwyz, Nidwalden, Zürich, Basel-Stadt. Nehmerkantone (ressourcenschwach): Uri, Jura, Glarus, Wallis, Freiburg. Die Einteilung basiert auf der Ressourcenstärke (Wirtschaftskraft pro Kopf) der Kantone."},

{id:"w09", topic:"wettbewerb", type:"tf", diff:2, tax:"K2",
 q:"Die OECD-Mindeststeuer von 15% auf Unternehmensgewinne zielt darauf ab, den internationalen Steuerwettbewerb einzuschränken.",
 correct:true,
 explain:"Richtig. Die globale Mindeststeuer der OECD (Pillar 2) von 15% soll verhindern, dass multinationale Konzerne ihre Gewinne in Tiefsteuerländer verschieben. Sie setzt dem internationalen Steuerwettbewerb eine Untergrenze und betrifft auch die Schweiz, die in einigen Kantonen Unternehmenssteuern unter 15% erhoben hat."},

{id:"w10", topic:"wettbewerb", type:"mc", diff:3, tax:"K4",
 q:"Der Kanton Luzern senkte die Unternehmenssteuern drastisch, musste aber gleichzeitig Sparpakete schnüren und die Steuern für Privatpersonen erhöhen. Was erklärt dieses Paradox am besten?",
 options:[{v:"A",t:"Luzern hat zu viele Unternehmen angelockt"},{v:"B",t:"Die Steuerausfälle wurden nicht ausreichend durch Neuzuzüger kompensiert, und der NFA-Beitrag sank gleichzeitig"},{v:"C",t:"Die Bundessteuer wurde gleichzeitig erhöht"},{v:"D",t:"Die Finanzkrise hat alle Steuereinnahmen zunichtegemacht"}],
 correct:"B",
 explain:"Luzern erlebte einen doppelten Effekt: Die tiefen Unternehmenssteuern lockten nicht genug Neuzuzüger an, um die Ausfälle zu kompensieren (strukturelle Nachteile: Zentrumslast, ländliche Gebiete). Gleichzeitig stieg die Ressourcenstärke, sodass Luzern weniger NFA-Mittel erhielt. Die Bevölkerung musste die Lücke über höhere Privatsteuern und Sparmassnahmen finanzieren."},

// ── STEUERN UND ELASTIZITÄTEN (e01–e11) ──

{id:"e01", topic:"elastizitaeten", type:"mc", diff:1, tax:"K1",
 q:"Was versteht man unter Steuerinzidenz?",
 options:[{v:"A",t:"Die Frage, wie hoch eine Steuer ist"},{v:"B",t:"Die Frage, welche Bevölkerungsgruppe eine Steuer letztlich bezahlen muss"},{v:"C",t:"Die Frage, wie oft eine Steuer erhoben wird"},{v:"D",t:"Die Frage, ob eine Steuer direkt oder indirekt ist"}],
 correct:"B",
 explain:"Die Steuerinzidenz beschreibt, wer die Last einer Steuer tatsächlich trägt. Dies muss nicht die Seite sein, die die Steuer formal bezahlt. Entscheidend ist, welche Marktseite (Anbieter oder Nachfrager) der Preisveränderung weniger gut ausweichen kann."},

{id:"e02", topic:"elastizitaeten", type:"mc", diff:2, tax:"K2",
 q:"Wer trägt bei einer Steuer die grössere Last?",
 options:[{v:"A",t:"Immer der Konsument"},{v:"B",t:"Immer der Produzent"},{v:"C",t:"Die Marktseite mit der geringeren Preiselastizität"},{v:"D",t:"Die Marktseite, auf der die Steuer formal erhoben wird"}],
 correct:"C",
 explain:"Die Steuerlast wird stets von der weniger elastischen Marktseite getragen. Wer der Preisveränderung weniger gut ausweichen kann (unelastische Seite), muss den grösseren Teil der Steuer tragen – unabhängig davon, bei wem die Steuer formal erhoben wird."},

{id:"e03", topic:"elastizitaeten", type:"tf", diff:2, tax:"K2",
 q:"Steuern führen praktisch immer zu Wohlfahrtsverlusten, da sie die relativen Preise verzerren.",
 correct:true,
 explain:"Richtig. Jede Steuer verändert die relativen Preise und führt damit zu Verzerrungen. Die Preise spiegeln nicht mehr die tatsächlichen Knappheiten wider. Dieser Wohlfahrtsverlust ist grundsätzlich unvermeidlich. Die Staatstätigkeit kann die Wohlfahrt dennoch insgesamt steigern, wenn die positiven Wirkungen der Staatsausgaben die negativen Verzerrungseffekte überwiegen."},

{id:"e04", topic:"elastizitaeten", type:"mc", diff:2, tax:"K2",
 q:"Warum sind die Wohlfahrtsverluste einer Steuer besonders gross, wenn Angebot und Nachfrage elastisch sind?",
 options:[{v:"A",t:"Weil die Steuereinnahmen dann besonders hoch sind"},{v:"B",t:"Weil die Mengenreaktion stark ausfällt und viele Transaktionen nicht mehr stattfinden"},{v:"C",t:"Weil die Preise sinken"},{v:"D",t:"Weil die Steuer dann nicht erhoben werden kann"}],
 correct:"B",
 explain:"Bei hoher Elastizität reagieren Angebot und Nachfrage stark auf die steuerbedingte Preisveränderung. Viele Transaktionen finden nicht mehr statt (die Menge sinkt deutlich), was zu einem grossen Wohlfahrtsverlust führt. Bei unelastischer Nachfrage oder unelastischem Angebot hingegen bleibt die Menge relativ stabil und der Wohlfahrtsverlust ist geringer."},

{id:"e05", topic:"elastizitaeten", type:"mc", diff:3, tax:"K3",
 q:"Die Tabaksteuer wird formal beim Produzenten erhoben. Warum tragen trotzdem vor allem die Raucherinnen und Raucher die Steuerlast?",
 options:[{v:"A",t:"Weil die Produzenten die Steuer nicht bezahlen müssen"},{v:"B",t:"Weil die Nachfrage nach Zigaretten sehr unelastisch ist und die Produzenten die Steuer auf den Preis überwälzen können"},{v:"C",t:"Weil Raucher freiwillig mehr bezahlen"},{v:"D",t:"Weil die Tabaksteuer eine direkte Steuer ist"}],
 correct:"B",
 explain:"Die Nachfrage nach Zigaretten ist sehr unelastisch (Suchtcharakter). Die Produzenten können daher den grössten Teil der Steuer auf den Verkaufspreis überwälzen, ohne dass die Nachfrage wesentlich einbricht. Damit tragen die Konsumenten (Raucher) den Löwenanteil der Steuer, obwohl sie formal beim Produzenten erhoben wird."},

{id:"e06", topic:"elastizitaeten", type:"open", diff:3, tax:"K4",
 q:"Erklären Sie anhand des Beispiels der US-Luxussteuer auf Yachten (1990er-Jahre), warum eine Luxussteuer nicht unbedingt die Reichen belastet.",
 sample:"Die USA führten Anfang der 1990er-Jahre eine Luxussteuer auf Yachten ein, um Reiche stärker zu besteuern. Die Nachfrage nach Yachten erwies sich jedoch als sehr elastisch: Wohlhabende kauften ihre Yachten stattdessen im Ausland oder erwarben andere Luxusgüter. Der Yachtverkauf in Florida brach um 90% ein. Die Steuerlast traf stattdessen die Angestellten der Yachtwerften (unelastisches Angebot), die ihre Arbeit nicht leicht wechseln konnten. Die Steuer wurde deshalb bald wieder abgeschafft.",
 explain:"Das Beispiel illustriert die zentrale Rolle der Elastizität: Die Nachfrage war elastisch (Reiche konnten ausweichen), das Angebot unelastisch (Werftarbeiter konnten nicht einfach den Beruf wechseln). Daher traf die Steuer nicht die beabsichtigte Zielgruppe (Reiche), sondern die weniger wohlhabenden Arbeiter der Yachtindustrie."},

{id:"e07", topic:"elastizitaeten", type:"tf", diff:2, tax:"K2",
 q:"Es spielt keine Rolle, auf welcher Marktseite eine Steuer formal erhoben wird – die tatsächliche Lastverteilung hängt allein von den Elastizitäten ab.",
 correct:true,
 explain:"Richtig. Ob eine Steuer beim Anbieter oder Nachfrager erhoben wird, ändert nichts an der Verteilung der Steuerlast. Entscheidend ist einzig die relative Elastizität von Angebot und Nachfrage. Die weniger elastische Seite trägt den grösseren Anteil."},

{id:"e08", topic:"elastizitaeten", type:"mc", diff:2, tax:"K3",
 q:"Auf welche Güter sollte der Staat gemäss der Elastizitätsanalyse Steuern erheben, um möglichst geringe Wohlfahrtsverluste zu verursachen?",
 options:[{v:"A",t:"Auf Güter mit elastischer Nachfrage und elastischem Angebot"},{v:"B",t:"Auf Güter mit unelastischer Nachfrage oder unelastischem Angebot"},{v:"C",t:"Nur auf Luxusgüter"},{v:"D",t:"Nur auf importierte Güter"}],
 correct:"B",
 explain:"Bei unelastischer Nachfrage oder unelastischem Angebot führt eine Steuer zu geringen Mengenreaktionen und damit zu geringen Wohlfahrtsverlusten. Die Steuer verzerrt die Marktmengen kaum. Umgekehrt verursachen Steuern auf Güter mit hoher Elastizität grosse Verzerrungen und Wohlfahrtsverluste."},

{id:"e09", topic:"elastizitaeten", type:"mc", diff:3, tax:"K4",
 q:"Ein Arbeitgeber und ein Arbeitnehmer teilen sich formal je hälftig die AHV-Beiträge. Wer trägt ökonomisch gesehen die grössere Last?",
 options:[{v:"A",t:"Immer der Arbeitgeber"},{v:"B",t:"Immer der Arbeitnehmer"},{v:"C",t:"Es hängt von der Elastizität des Arbeitsangebots und der Arbeitsnachfrage ab"},{v:"D",t:"Beide genau gleich viel, weil es so im Gesetz steht"}],
 correct:"C",
 explain:"Wie bei jeder Steuer oder Abgabe bestimmen die Elastizitäten die tatsächliche Lastverteilung, nicht die gesetzliche Aufteilung. Da die Arbeitsnachfrage meist elastischer ist als das Arbeitsangebot, tragen Arbeitnehmer tendenziell den grösseren Teil. Die formale Aufteilung 50:50 sagt nichts über die tatsächliche ökonomische Belastung aus."},

{id:"e10", topic:"elastizitaeten", type:"tf", diff:3, tax:"K4",
 q:"Eine Steuer auf ein Gut mit völlig unelastischem Angebot verursacht keinen Wohlfahrtsverlust.",
 correct:true,
 explain:"Richtig. Bei völlig unelastischem Angebot (die angebotene Menge ändert sich nicht, egal wie der Preis ist) verursacht die Steuer keine Mengenveränderung und damit keine Verzerrung. Die gesamte Steuerlast wird vom Anbieter getragen, aber da die Menge konstant bleibt, gibt es keinen Wohlfahrtsverlust. Dies ist allerdings ein theoretischer Extremfall."},

{id:"e11", topic:"elastizitaeten", type:"fill", diff:1, tax:"K1",
 q:"Je _______ die Preiselastizität, desto stärker reagiert die Menge auf eine Steuer und desto _______ fällt der Wohlfahrtsverlust aus.",
 correct:["elastischer","grösser"],
 explain:"Bei hoher Preiselastizität weichen Konsumenten oder Produzenten der Steuer leicht aus, was zu starken Mengenreaktionen führt. Viele Transaktionen finden nicht mehr statt – der Wohlfahrtsverlust ist gross. Bei unelastischer Nachfrage oder Angebot bleibt die Menge nahezu stabil und der Wohlfahrtsverlust gering."}

];
