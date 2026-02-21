// ============================================================
// Pool: Einführung Recht – Grundsätze der Rechtsordnung
// Fach: Recht | Stufe: SF GYM1 / EWR GYM2
// Lehrplan 17: Einführung (P) – Moral/Sitte/Recht, Gewaltenteilung,
//   Gliederung des Rechts, Technik der Rechtsfindung
// Quellen: LV-Texte, Präsentationen SF/EWR, Zwick Bd.1 Kap.1,
//   Übungen Moral/Sitte/Recht, öR/PR, Rechtsanwendung TBM/RF
// ============================================================

window.POOL_META = {
  title: "Einführung Recht – Grundsätze der Rechtsordnung",
  fach: "Recht",
  color: "#73ab2c",
  level: "SF GYM1 / EWR GYM2"
};

window.TOPICS = {
  "moral_sitte_recht":  {label: "Moral, Sitte und Recht",                    short: "Moral/Sitte/Recht"},
  "rechtsordnung":      {label: "Rechtsordnung, Gewaltmonopol & Rechtskraft", short: "Rechtsordnung"},
  "rechtsstaat":        {label: "Rechtsstaat – Legalität, Gewaltenteilung, Grundrechte", short: "Rechtsstaat"},
  "oeffentlich_privat": {label: "Öffentliches Recht vs. Privatrecht",         short: "ÖR / PR"},
  "rechtsanwendung":    {label: "Rechtsanwendung – Tatbestand, Subsumtion, Rechtsfolge", short: "Rechtsanwendung"}
};

window.QUESTIONS = [

// ============================================================
// TOPIC: moral_sitte_recht (Präfix m)
// ============================================================

// --- diff 1 ---
{
  id: "m01", topic: "moral_sitte_recht", type: "mc", diff: 1, tax: "K1",
  img: {src: "img/recht/einfuehrung/einfuehrung_moral_sitte_recht_01.svg", alt: "Diagramm: Drei Normsysteme – Moral, Sitte, Recht – und ihr Einfluss auf menschliches Verhalten"},
  q: "Was ist Moral?",
  options: [
    {v: "A", t: "Die innere, nicht erzwingbare Einstellung und Werthaltung eines Menschen."},
    {v: "B", t: "Ein äusseres, nicht erzwingbares, aber im Allgemeinen erwartetes Verhalten."},
    {v: "C", t: "Ordnungsregeln, die das äussere Verhalten bestimmen und staatlich erzwingbar sind."},
    {v: "D", t: "Ein Gerichtsentscheid, der Rechtskraft erlangt hat."}
  ],
  correct: "A",
  explain: "Moral (angewandte Ethik) ist die innere, nicht erzwingbare Einstellung und Werthaltung eines Menschen. Man handelt auch danach, wenn man nicht beobachtet wird. Im Gegensatz dazu betrifft Sitte das äussere Verhalten (B) und Recht ist staatlich erzwingbar (C)."
},
{
  id: "m02", topic: "moral_sitte_recht", type: "tf", diff: 1, tax: "K1",
  q: "Sitte ist ein äusseres, nicht erzwingbares, aber im Allgemeinen erwartetes Verhalten von Menschen.",
  correct: true,
  explain: "Richtig. Sitte bezieht sich auf das äussere Verhalten (z.B. sich beim neuen Nachbarn vorstellen) und ist gesellschaftlich erwartet, aber nicht staatlich erzwingbar. Die Missachtung kann allenfalls gesellschaftliche Konsequenzen haben (z.B. Ächtung)."
},
{
  id: "m03", topic: "moral_sitte_recht", type: "fill", diff: 1, tax: "K1",
  q: "Recht besteht aus Ordnungsregeln, die das äussere Verhalten von Menschen mitbestimmen und staatlich {0} sind.",
  blanks: [
    {answer: "erzwingbar", alts: ["durchsetzbar"]}
  ],
  explain: "Das entscheidende Merkmal, das Recht von Moral und Sitte unterscheidet, ist die staatliche Erzwingbarkeit. Der Staat kann die Einhaltung von Rechtsnormen mit Zwangsmassnahmen durchsetzen."
},
{
  id: "m04", topic: "moral_sitte_recht", type: "mc", diff: 1, tax: "K2",
  q: "Was ist der Hauptunterschied zwischen Moral und Sitte?",
  options: [
    {v: "A", t: "Moral betrifft die innere Haltung, Sitte die äussere Haltung."},
    {v: "B", t: "Moral ist erzwingbar, Sitte nicht."},
    {v: "C", t: "Sitte betrifft die innere Haltung, Moral die äussere Haltung."},
    {v: "D", t: "Moral wird vom Staat durchgesetzt, Sitte von der Gesellschaft."}
  ],
  correct: "A",
  explain: "Moral bezieht sich auf die innere Haltung (Werte und Überzeugungen), Sitte auf die äussere Haltung (erwartetes Verhalten). Beide sind nicht erzwingbar – im Gegensatz zum Recht."
},

// --- diff 2 ---
{
  id: "m05", topic: "moral_sitte_recht", type: "mc", diff: 2, tax: "K3",
  context: "In einem Gymnasium weist eine Gruppe von Schülerinnen und Schülern einen störenden Mitschüler während der Unterrichtsstunde zurecht.",
  q: "Welche Regel beeinflusst das Verhalten der Schülergruppe am stärksten?",
  options: [
    {v: "A", t: "Recht – es gibt eine gesetzliche Pflicht, störende Mitschüler zurechtzuweisen."},
    {v: "B", t: "Moral – die Schüler handeln aus innerer Überzeugung."},
    {v: "C", t: "Sitte – es ist ein gesellschaftlich erwartetes Verhalten, dass man störendes Verhalten nicht toleriert."},
    {v: "D", t: "Recht – der Lehrer hat die Klasse dazu verpflichtet."}
  ],
  correct: "C",
  explain: "Es gibt keine gesetzliche Pflicht, störende Mitschüler zurechtzuweisen. Das Verhalten entspricht einer gesellschaftlichen Erwartung (Sitte): Man erwartet, dass sich Mitschüler an gewisse Anstandsregeln halten und gegenseitig darauf hinweisen."
},
{
  id: "m06", topic: "moral_sitte_recht", type: "mc", diff: 2, tax: "K3",
  context: "Ein Lehrer lehnt den Bestechungsversuch einer Schülerin ab, die ihm Geld anbietet, damit er ihre Note ändert.",
  q: "Welche Regel beeinflusst das Verhalten des Lehrers am stärksten?",
  options: [
    {v: "A", t: "Sitte – Bestechung gilt als unanständig."},
    {v: "B", t: "Moral – der Lehrer handelt aus innerer Überzeugung gegen Korruption."},
    {v: "C", t: "Recht – Bestechung ist gesetzlich verboten und strafbar."},
    {v: "D", t: "Moral und Recht gleichermassen."}
  ],
  correct: "B",
  explain: "Der Lehrer handelt hier primär aus innerer Überzeugung (Moral). Zwar ist Bestechung auch rechtlich verboten (Art. 322ter ff. StGB), aber die Frage zielt auf die Regel, die das Verhalten zuerst und am stärksten beeinflusst. Die innere Haltung gegen Korruption ist der stärkste Antrieb."
},
{
  id: "m07", topic: "moral_sitte_recht", type: "multi", diff: 2, tax: "K2",
  q: "Welche Aussagen treffen auf das Recht zu? (Mehrere Antworten möglich.)",
  options: [
    {v: "A", t: "Recht betrifft das äussere Verhalten von Menschen."},
    {v: "B", t: "Recht ist staatlich erzwingbar."},
    {v: "C", t: "Recht setzt eine innere Überzeugung voraus."},
    {v: "D", t: "Bei Einhaltung der Rechtsregeln ist die innere Einstellung aus rechtlicher Sicht gleichgültig."}
  ],
  correct: ["A", "B", "D"],
  explain: "Recht regelt das äussere Verhalten (A) und ist staatlich erzwingbar (B). Bei der Einhaltung von Recht spielt die innere Einstellung keine Rolle (D) – ob jemand nicht stiehlt, weil er es für falsch hält oder weil er Angst vor Strafe hat, ist aus rechtlicher Sicht gleichgültig. C ist falsch: Recht setzt gerade keine innere Überzeugung voraus."
},
{
  id: "m08", topic: "moral_sitte_recht", type: "tf", diff: 2, tax: "K2",
  q: "Die Abgrenzung zwischen Recht und Nichtrecht (Sitte) ist immer klar und eindeutig.",
  correct: false,
  explain: "Falsch. Die Abgrenzung zwischen Recht und Nichtrecht kann fliessend sein. Beispiel: Eine Verabredung mit einem Nachbarn zu einem Sonntagsspaziergang schafft keine Rechtspflicht. Eine Verabredung, gemeinsam in die Ferien zu fahren und die Kosten zu teilen, kann aber eine rechtlich relevante Vereinbarung begründen (Zwick, Kap. 1)."
},

// --- diff 3 ---
{
  id: "m09", topic: "moral_sitte_recht", type: "mc", diff: 3, tax: "K4",
  context: "Ein Fussballer begeht im Spiel ein hartes Foul, das der Schiedsrichter mit einer gelben Karte bestraft. Der gefoulte Spieler erleidet eine Bänderverletzung.",
  q: "Wie ist die Situation rechtlich einzuordnen?",
  options: [
    {v: "A", t: "Da der Schiedsrichter die Situation bereits mit einer gelben Karte geahndet hat, ist sie rechtlich erledigt."},
    {v: "B", t: "Der Spielregelverstoss kann ausschliesslich sportlich sanktioniert werden – eine strafrechtliche Überprüfung ist ausgeschlossen."},
    {v: "C", t: "Sportliche Sanktionen und rechtliche Konsequenzen sind unabhängig voneinander – bei groben Fouls mit Verletzungsfolge kann auch eine strafrechtliche Überprüfung erfolgen."},
    {v: "D", t: "Nur wenn der Spieler absichtlich gefoult hat, kann er strafrechtlich belangt werden."}
  ],
  correct: "C",
  explain: "Spielleiter und Strafrichter haben unterschiedliche Aufgaben: Der Schiedsrichter sorgt für den geordneten Spielablauf, der Strafrichter schützt die öffentliche Ordnung. Wer Spielregeln massiv missachtet und gefährlich handelt, kann strafrechtlich zur Rechenschaft gezogen werden – unabhängig von sportlichen Sanktionen (vgl. Zwick, Kap. 1: Abgrenzung Recht und Spielregeln, BGE 109 IV 102ff.)."
},
{
  id: "m10", topic: "moral_sitte_recht", type: "mc", diff: 3, tax: "K5",
  q: "Warum reichen Moral und Sitte allein nicht aus, um das Zusammenleben in einer Gesellschaft zu regeln?",
  options: [
    {v: "A", t: "Weil Moral und Sitte von Person zu Person unterschiedlich sein können und nicht durchsetzbar sind – ohne verbindliche, erzwingbare Regeln gäbe es keine Rechtssicherheit."},
    {v: "B", t: "Weil Moral und Sitte veraltet sind und in modernen Gesellschaften keine Rolle mehr spielen."},
    {v: "C", t: "Weil der Staat kein Interesse an moralischem Verhalten hat."},
    {v: "D", t: "Weil Moral und Sitte nur für religiöse Menschen gelten."}
  ],
  correct: "A",
  explain: "Moral ist subjektiv (jeder hat eigene Werte) und Sitte ist gesellschaftlich variabel. Ohne verbindliche, staatlich erzwingbare Regeln (Recht) könnten Konflikte nicht verlässlich gelöst werden. Das Recht schafft Berechenbarkeit und Rechtssicherheit für alle Mitglieder der Gesellschaft."
},
{
  id: "m11", topic: "moral_sitte_recht", type: "tf", diff: 3, tax: "K4",
  q: "In der Frühzeit der Menschheit war das Recht eng mit Magie und Religion verbunden – die Zehn Gebote sind ein Beispiel für ein göttliches Recht.",
  correct: true,
  explain: "Richtig. In der Frühzeit waren Recht und Religion eng verknüpft. Die Zehn Gebote sind ein Beispiel für ein Recht in Form von Geboten, das als heilig und von Gott oder den Göttern gewollt galt. Erst mit fortschreitender Zivilisation wurden Recht, Sitte und Religion (Moral) voneinander getrennt (Zwick, Kap. 1)."
},

// ============================================================
// TOPIC: rechtsordnung (Präfix o)
// ============================================================

// --- diff 1 ---
{
  id: "o01", topic: "rechtsordnung", type: "fill", diff: 1, tax: "K1",
  q: "Die {0} umfasst alle Vorschriften (Gebote, Verbote, Rechte und Pflichten), die der Staat erlässt und deren Befolgung er erzwingen kann.",
  blanks: [
    {answer: "Rechtsordnung", alts: ["rechtsordnung"]}
  ],
  explain: "Die Rechtsordnung ist die Gesamtheit aller staatlichen Vorschriften (Gebote, Verbote, Rechte und Pflichten), deren Einhaltung der Staat erzwingen kann."
},
{
  id: "o02", topic: "rechtsordnung", type: "mc", diff: 1, tax: "K1",
  q: "Was bedeutet «Gewaltmonopol» des Staates?",
  options: [
    {v: "A", t: "Nur der Staat darf Gewalt anwenden – Bürgerinnen und Bürger verzichten auf Selbstjustiz."},
    {v: "B", t: "Der Staat hat ein Monopol auf den Verkauf von Waffen."},
    {v: "C", t: "Nur die Polizei darf Verbrecher verhaften."},
    {v: "D", t: "Der Staat allein entscheidet, wer ins Gefängnis kommt."}
  ],
  correct: "A",
  explain: "Das Gewaltmonopol bedeutet, dass die Durchsetzung des Rechts mit Zwangsmitteln dem Staat vorbehalten ist. Die Bürgerinnen und Bürger verzichten auf Selbstjustiz und wenden sich stattdessen an staatliche Organe (Polizei, Gerichte), um ihre Rechte durchzusetzen."
},
{
  id: "o03", topic: "rechtsordnung", type: "tf", diff: 1, tax: "K1",
  q: "Rechtskraft bedeutet, dass ein Gerichtsentscheid definitiv gilt und nicht mehr abgeändert werden kann.",
  correct: true,
  explain: "Richtig. Ein Gerichtsentscheid erlangt Rechtskraft, wenn er nicht mehr mit ordentlichen Rechtsmitteln angefochten werden kann. Dies ist der Fall, wenn die Rechtsmittelfrist ungenutzt abgelaufen ist oder die letzte Instanz entschieden hat."
},
{
  id: "o04", topic: "rechtsordnung", type: "mc", diff: 1, tax: "K2",
  q: "Welche Gerichtsinstanzen gibt es in der Schweiz (in aufsteigender Reihenfolge)?",
  options: [
    {v: "A", t: "Bundesgericht → Obergericht → Bezirksgericht"},
    {v: "B", t: "Bezirksgericht → Obergericht → Bundesgericht"},
    {v: "C", t: "Friedensrichter → Bundesgericht → Obergericht"},
    {v: "D", t: "Obergericht → Bezirksgericht → Bundesgericht"}
  ],
  correct: "B",
  explain: "Die Instanzen in aufsteigender Reihenfolge sind: Bezirksgericht (erste Instanz) → Obergericht (kantonale Berufungsinstanz) → Bundesgericht (höchste Instanz). Je nach Kanton und Streitwert gibt es zudem noch ein Schlichtungsverfahren (z.B. Friedensrichter) vor dem Bezirksgericht."
},

// --- diff 2 ---
{
  id: "o05", topic: "rechtsordnung", type: "mc", diff: 2, tax: "K2",
  q: "Auf welche zwei Arten kann Rechtskraft eintreten?",
  options: [
    {v: "A", t: "Wenn die Rechtsmittelfrist ungenutzt abläuft oder wenn die letzte Instanz entschieden hat."},
    {v: "B", t: "Wenn beide Parteien dem Urteil zustimmen oder wenn der Richter es für rechtskräftig erklärt."},
    {v: "C", t: "Wenn das Urteil veröffentlicht wird oder wenn 30 Tage vergangen sind."},
    {v: "D", t: "Wenn das Bezirksgericht entschieden hat oder wenn das Bundesgericht den Fall ablehnt."}
  ],
  correct: "A",
  explain: "Rechtskraft tritt auf zwei Wegen ein: (1) Die Rechtsmittelfrist läuft ab, ohne dass ein Rechtsmittel eingelegt wird. (2) Die letzte Instanz hat entschieden – es gibt keine weitere Anfechtungsmöglichkeit mehr."
},
{
  id: "o06", topic: "rechtsordnung", type: "mc", diff: 2, tax: "K2",
  q: "Was passiert im Zivilrecht, wenn eine Partei ihre Verpflichtung nicht freiwillig erfüllt?",
  options: [
    {v: "A", t: "Der Staat erzwingt die Erfüllung in natura (Realerfüllung) oder in Form von Schadenersatz."},
    {v: "B", t: "Die Partei wird strafrechtlich verfolgt."},
    {v: "C", t: "Der Vertrag wird automatisch aufgelöst."},
    {v: "D", t: "Die andere Partei darf Selbstjustiz üben."}
  ],
  correct: "A",
  explain: "Im Zivilrecht wird die Erfüllung in natura (Realerfüllung) erzwungen, sofern dies möglich ist (z.B. ein Mieter, der die Wohnung nicht verlässt, wird nötigenfalls mit Hilfe der Polizei ausgewiesen). Ist Realerfüllung nicht möglich, tritt an ihre Stelle die Pflicht, Schadenersatz zu zahlen."
},
{
  id: "o07", topic: "rechtsordnung", type: "multi", diff: 2, tax: "K2",
  q: "Welche Aussagen zu den staatlichen Zwangsmitteln sind korrekt? (Mehrere Antworten möglich.)",
  options: [
    {v: "A", t: "Im Zivilrecht erfolgt die Erfüllung in natura oder als Schadenersatz."},
    {v: "B", t: "Im Strafrecht richtet sich die Zwangsmassnahme gegen die Person oder ihr Vermögen."},
    {v: "C", t: "Im Strafrecht kann nur eine Freiheitsstrafe verhängt werden."},
    {v: "D", t: "Die staatlichen Zwangsmittel sind vielfältig."}
  ],
  correct: ["A", "B", "D"],
  explain: "A ist korrekt (Realerfüllung oder Schadenersatz im Zivilrecht). B ist korrekt (Freiheitsstrafe gegen die Person, Geldstrafe/Busse gegen das Vermögen). C ist falsch – neben Freiheitsstrafen gibt es auch Geldstrafen und Bussen. D ist korrekt – die Zwangsmittel sind vielfältig."
},

// --- diff 3 ---
{
  id: "o08", topic: "rechtsordnung", type: "mc", diff: 3, tax: "K4",
  context: "Ein Steuerpflichtiger hat in der Steuererklärung Hard- und Software im Wert von Fr. 5'000.– als Berufsauslagen geltend gemacht. Der Steuerkommissär akzeptiert die Abzüge nicht und erhöht das steuerbare Einkommen um diesen Betrag.",
  q: "Was muss der Steuerpflichtige tun, wenn er mit dem Entscheid nicht einverstanden ist?",
  options: [
    {v: "A", t: "Er muss innerhalb der Frist schriftliche Einsprache beim kantonalen Steueramt erheben."},
    {v: "B", t: "Er kann direkt beim Bundesgericht klagen."},
    {v: "C", t: "Er muss nichts tun – der Entscheid wird automatisch von einer höheren Instanz überprüft."},
    {v: "D", t: "Er kann den Steuerkommissär persönlich um eine Änderung bitten."}
  ],
  correct: "A",
  explain: "Um den Entscheid anzufechten, muss der Steuerpflichtige fristgerecht ein ordentliches Rechtsmittel (Einsprache) einlegen. Unterlässt er dies, erwächst der Einschätzungsentscheid in Rechtskraft. Der Instanzenzug verlangt, dass zuerst die tieferen Instanzen durchlaufen werden – ein direkter Gang ans Bundesgericht ist nicht möglich."
},
{
  id: "o09", topic: "rechtsordnung", type: "tf", diff: 3, tax: "K4",
  q: "Der Grundsatz der Rechtskraft gilt ausnahmslos – ein rechtskräftiger Entscheid kann unter keinen Umständen aufgehoben werden.",
  correct: false,
  explain: "Falsch. Der Grundsatz der Rechtskraft gilt nicht ausnahmslos. Unter bestimmten Voraussetzungen kann ein rechtskräftiger Gerichts- oder Verwaltungsentscheid in Revision gezogen werden, zum Beispiel wenn erhebliche Tatsachen oder entscheidende Beweismittel entdeckt werden, die im ordentlichen Verfahren bei der zumutbaren Sorgfalt noch nicht bekannt sein konnten."
},
{
  id: "o10", topic: "rechtsordnung", type: "mc", diff: 3, tax: "K5",
  q: "Warum ist das Gewaltmonopol des Staates eine zentrale Voraussetzung für den Rechtsfrieden?",
  options: [
    {v: "A", t: "Weil der Staat dadurch willkürlich handeln kann."},
    {v: "B", t: "Weil es verhindert, dass Bürger selbst Recht sprechen, und sicherstellt, dass Konflikte nach einheitlichen Regeln durch unabhängige Gerichte gelöst werden."},
    {v: "C", t: "Weil ohne Gewaltmonopol keine Gesetze existieren würden."},
    {v: "D", t: "Weil es den Bürgern verbietet, sich gegen den Staat zu wehren."}
  ],
  correct: "B",
  explain: "Das Gewaltmonopol ist zentral für den Rechtsfrieden, weil es die Eliminierung der Selbsthilfe bedeutet. Rechtsstreitigkeiten werden durch einen Gerichts- oder Verwaltungsentscheid ein für allemal entschieden (Rechtskraft). Dies schafft Rechtssicherheit und verhindert Eskalation durch Selbstjustiz."
},

// ============================================================
// TOPIC: rechtsstaat (Präfix s)
// ============================================================

// --- diff 1 ---
{
  id: "s01", topic: "rechtsstaat", type: "mc", diff: 1, tax: "K1",
  img: {src: "img/recht/einfuehrung/einfuehrung_rechtsstaat_01.svg", alt: "Diagramm: Vom Gewaltmonopol zum Rechtsstaat – drei Säulen"},
  q: "Welchen drei Grundsätzen verpflichtet sich ein Rechtsstaat?",
  options: [
    {v: "A", t: "Legalitätsprinzip, Gewaltenteilung und Schutz der Grundrechte."},
    {v: "B", t: "Demokratie, Föderalismus und Neutralität."},
    {v: "C", t: "Gewaltmonopol, Rechtskraft und Subsidiarität."},
    {v: "D", t: "Verhältnismässigkeit, Rechtsgleichheit und Legalitätsprinzip."}
  ],
  correct: "A",
  explain: "Ein Rechtsstaat (z.B. die Schweiz) verpflichtet sich zur Achtung von drei zentralen Grundsätzen: (1) Legalitätsprinzip (Art. 5 Abs. 1 BV), (2) Gewaltenteilung (Legislative, Exekutive, Judikative) und (3) Schutz der Grundrechte (Art. 7–36 BV)."
},
{
  id: "s02", topic: "rechtsstaat", type: "fill", diff: 1, tax: "K1",
  q: "Das {0} verpflichtet den Staat, sich streng an die Ordnungsregeln zu halten und nicht willkürlich zu handeln.",
  blanks: [
    {answer: "Legalitätsprinzip", alts: ["Legalitaetsprinzip", "legalitätsprinzip"]}
  ],
  explain: "Das Legalitätsprinzip (Art. 5 Abs. 1 BV) bedeutet, dass der Staat nur handeln darf, wenn eine gesetzliche Grundlage besteht. Es schützt die Bürgerinnen und Bürger vor willkürlichem staatlichem Handeln."
},
{
  id: "s03", topic: "rechtsstaat", type: "mc", diff: 1, tax: "K1",
  q: "Welche drei Gewalten unterscheidet die Gewaltenteilung?",
  options: [
    {v: "A", t: "Legislative (gesetzgebend), Exekutive (ausführend), Judikative (richterlich)."},
    {v: "B", t: "Bundesrat, Parlament, Volk."},
    {v: "C", t: "Gemeinde, Kanton, Bund."},
    {v: "D", t: "Polizei, Gericht, Gefängnis."}
  ],
  correct: "A",
  explain: "Die Gewaltenteilung teilt die Macht des Staates in drei Gewalten: Legislative (gesetzgebend – auf Bundesebene das Parlament), Exekutive (ausführend – auf Bundesebene der Bundesrat) und Judikative (richterlich – höchstes Gericht ist das Bundesgericht)."
},
{
  id: "s04", topic: "rechtsstaat", type: "tf", diff: 1, tax: "K1",
  q: "Die Grundrechte sind in der Bundesverfassung in den Artikeln 7–36 verankert.",
  correct: true,
  explain: "Richtig. Die Grundrechte (z.B. Recht auf Leben, Meinungsfreiheit, Eigentumsgarantie) sind in Art. 7–36 BV festgeschrieben. Sie begrenzen die Macht des Staates und schützen die Freiheit des Einzelnen."
},

// --- diff 2 ---
{
  id: "s05", topic: "rechtsstaat", type: "multi", diff: 2, tax: "K2",
  q: "Welche Organe gehören auf Bundesebene zu welcher Gewalt? Wählen Sie alle korrekten Zuordnungen. (Mehrere Antworten möglich.)",
  options: [
    {v: "A", t: "Das Parlament (National- und Ständerat) ist die Legislative."},
    {v: "B", t: "Der Bundesrat ist die Exekutive."},
    {v: "C", t: "Das Bundesgericht ist die Legislative."},
    {v: "D", t: "Das Bundesgericht ist die Judikative."}
  ],
  correct: ["A", "B", "D"],
  explain: "A ist korrekt: Das Parlament (bestehend aus National- und Ständerat) ist die gesetzgebende Gewalt (Legislative). B ist korrekt: Der Bundesrat ist die ausführende Gewalt (Exekutive). C ist falsch: Das Bundesgericht ist nicht die Legislative. D ist korrekt: Das Bundesgericht ist die richterliche Gewalt (Judikative)."
},
{
  id: "s06", topic: "rechtsstaat", type: "mc", diff: 2, tax: "K2",
  q: "Warum ist die Gewaltenteilung ein zentrales Merkmal des Rechtsstaats?",
  options: [
    {v: "A", t: "Sie verhindert die Konzentration der Macht in einer Hand und ermöglicht gegenseitige Kontrolle."},
    {v: "B", t: "Sie macht den Staat effizienter, weil jede Behörde nur eine Aufgabe hat."},
    {v: "C", t: "Sie garantiert, dass alle Gesetze fair sind."},
    {v: "D", t: "Sie ermöglicht es den Bürgern, direkt Gesetze zu erlassen."}
  ],
  correct: "A",
  explain: "Die Gewaltenteilung verteilt die Staatsmacht auf drei voneinander unabhängige Gewalten. Dadurch wird verhindert, dass eine einzelne Behörde oder Person zu viel Macht hat. Die Gewalten kontrollieren sich gegenseitig (checks and balances)."
},
{
  id: "s07", topic: "rechtsstaat", type: "mc", diff: 2, tax: "K4",
  q: "Was unterscheidet einen Rechtsstaat von einem autoritären Staat?",
  options: [
    {v: "A", t: "Im Rechtsstaat gibt es Gesetze, im autoritären Staat nicht."},
    {v: "B", t: "Im Rechtsstaat bindet das Legalitätsprinzip den Staat an die Gesetze, die Gewaltenteilung verhindert Machtkonzentration und die Grundrechte schützen die Bürger – in autoritären Staaten fehlen diese Garantien."},
    {v: "C", t: "Im Rechtsstaat gibt es Wahlen, im autoritären Staat nicht."},
    {v: "D", t: "Autoritäre Staaten haben keine Gerichte."}
  ],
  correct: "B",
  explain: "Auch autoritäre Staaten (z.B. China, Russland) haben Gesetze, Wahlen und Gerichte. Der Unterschied liegt darin, dass in autoritären Staaten die Ordnungsregeln oft willkürlich gestaltet werden, die Macht zentralisiert ist und die Grundrechte nicht geschützt sind. Ein Rechtsstaat verpflichtet sich hingegen auf Legalitätsprinzip, Gewaltenteilung und Grundrechteschutz."
},
{
  id: "s08", topic: "rechtsstaat", type: "tf", diff: 2, tax: "K2",
  q: "Der Schutz der Grundrechte bedeutet, dass die Grundrechte unter keinen Umständen eingeschränkt werden dürfen.",
  correct: false,
  explain: "Falsch. Grundrechte können unter bestimmten Voraussetzungen eingeschränkt werden (Art. 36 BV). Dafür braucht es eine gesetzliche Grundlage, ein öffentliches Interesse und die Einschränkung muss verhältnismässig sein. Der Kerngehalt der Grundrechte ist jedoch unantastbar."
},

// --- diff 3 ---
{
  id: "s09", topic: "rechtsstaat", type: "mc", diff: 3, tax: "K5",
  context: "Während einer Pandemie erlässt der Bundesrat per Notverordnung Massnahmen, die die Versammlungsfreiheit (Art. 22 BV) einschränken.",
  q: "Wie beurteilen Sie diese Situation aus rechtsstaatlicher Perspektive?",
  options: [
    {v: "A", t: "Die Einschränkung ist grundsätzlich zulässig, wenn sie auf einer gesetzlichen Grundlage beruht, einem öffentlichen Interesse dient und verhältnismässig ist."},
    {v: "B", t: "Grundrechte dürfen unter keinen Umständen eingeschränkt werden – die Massnahme ist verfassungswidrig."},
    {v: "C", t: "In einer Notlage darf der Bundesrat ohne gesetzliche Grundlage handeln."},
    {v: "D", t: "Nur das Parlament darf Grundrechte einschränken."}
  ],
  correct: "A",
  explain: "Art. 36 BV erlaubt Grundrechtseinschränkungen unter drei kumulativen Voraussetzungen: (1) gesetzliche Grundlage, (2) öffentliches Interesse (hier: Schutz der öffentlichen Gesundheit), (3) Verhältnismässigkeit. Auch Notverordnungen des Bundesrates bedürfen einer gesetzlichen Grundlage (z.B. Epidemiengesetz). Die Massnahme ist rechtsstaatlich vertretbar, sofern alle Voraussetzungen erfüllt sind."
},
{
  id: "s10", topic: "rechtsstaat", type: "mc", diff: 3, tax: "K4",
  q: "In welchem Zusammenhang stehen das Legalitätsprinzip (Art. 5 Abs. 1 BV) und die Grundrechte?",
  options: [
    {v: "A", t: "Sie stehen in keinem Zusammenhang – das Legalitätsprinzip betrifft nur den Staat, Grundrechte nur die Bürger."},
    {v: "B", t: "Beide begrenzen die Staatsmacht: Das Legalitätsprinzip verlangt eine gesetzliche Grundlage für staatliches Handeln, die Grundrechte setzen dem staatlichen Handeln inhaltliche Grenzen."},
    {v: "C", t: "Das Legalitätsprinzip ist ein Grundrecht."},
    {v: "D", t: "Grundrechte gelten nur, wenn das Legalitätsprinzip nicht verletzt wird."}
  ],
  correct: "B",
  explain: "Das Legalitätsprinzip und die Grundrechte sind zwei sich ergänzende Begrenzungen der Staatsmacht. Das Legalitätsprinzip verlangt eine formelle Grundlage (Gesetze) für jedes staatliche Handeln. Die Grundrechte setzen darüber hinaus inhaltliche Grenzen – auch wenn ein Gesetz existiert, darf es die Grundrechte nur unter den Voraussetzungen von Art. 36 BV einschränken."
},
{
  id: "s11", topic: "rechtsstaat", type: "fill", diff: 1, tax: "K1",
  q: "Auf Bundesebene ist die gesetzgebende Gewalt das {0}, die ausführende Gewalt der {1} und die richterliche Gewalt das {2}.",
  blanks: [
    {answer: "Parlament", alts: ["parlament", "Bundesversammlung"]},
    {answer: "Bundesrat", alts: ["bundesrat"]},
    {answer: "Bundesgericht", alts: ["bundesgericht"]}
  ],
  explain: "Legislative = Parlament (Bundesversammlung, bestehend aus National- und Ständerat). Exekutive = Bundesrat (siebenköpfiges Gremium). Judikative = Bundesgericht (höchstes Gericht der Schweiz, Sitz in Lausanne)."
},

// ============================================================
// TOPIC: oeffentlich_privat (Präfix p)
// ============================================================

// --- diff 1 ---
{
  id: "p01", topic: "oeffentlich_privat", type: "mc", diff: 1, tax: "K1",
  q: "Was regelt das Privatrecht?",
  options: [
    {v: "A", t: "Koordinative Rechtsbeziehungen zwischen gleichberechtigten Rechtssubjekten."},
    {v: "B", t: "Subordinative Rechtsbeziehungen zwischen Staat und Bürger."},
    {v: "C", t: "Ausschliesslich Beziehungen zwischen natürlichen Personen."},
    {v: "D", t: "Nur Beziehungen zwischen juristischen Personen."}
  ],
  correct: "A",
  explain: "Das Privatrecht regelt koordinative Rechtsbeziehungen zwischen gleichberechtigten Rechtssubjekten (natürliche und juristische Personen). Die Parteien begegnen sich auf Augenhöhe. Im Gegensatz dazu regelt das öffentliche Recht subordinative Beziehungen (Über-/Unterordnung) zwischen Staat und Bürger."
},
{
  id: "p02", topic: "oeffentlich_privat", type: "fill", diff: 1, tax: "K1",
  q: "Das öffentliche Recht regelt {0} Rechtsbeziehungen zwischen nicht gleichgestellten Rechtssubjekten.",
  blanks: [
    {answer: "subordinative", alts: ["Subordinative"]}
  ],
  explain: "Das öffentliche Recht regelt subordinative (unterordnende) Rechtsbeziehungen: Der Staat steht dem Bürger in einer Über-/Unterordnung gegenüber. Die Rechtssubjekte begegnen sich nicht auf Augenhöhe."
},
{
  id: "p03", topic: "oeffentlich_privat", type: "mc", diff: 1, tax: "K2",
  q: "Welches der folgenden Rechtsgebiete gehört zum Privatrecht?",
  options: [
    {v: "A", t: "Strafrecht"},
    {v: "B", t: "Verwaltungsrecht"},
    {v: "C", t: "Obligationenrecht"},
    {v: "D", t: "Prozessrecht"}
  ],
  correct: "C",
  explain: "Das Obligationenrecht (OR) gehört zum Privatrecht. Es regelt Beziehungen zwischen gleichberechtigten Rechtssubjekten (z.B. Kauf-, Miet- oder Arbeitsverträge). Strafrecht, Verwaltungsrecht und Prozessrecht gehören zum öffentlichen Recht."
},
{
  id: "p04", topic: "oeffentlich_privat", type: "multi", diff: 1, tax: "K2",
  q: "Welche der folgenden Rechtsgebiete gehören zum Privatrecht (ZGB und OR)? (Mehrere Antworten möglich.)",
  options: [
    {v: "A", t: "Personenrecht"},
    {v: "B", t: "Strafrecht"},
    {v: "C", t: "Familienrecht"},
    {v: "D", t: "Sachenrecht"}
  ],
  correct: ["A", "C", "D"],
  explain: "Das ZGB besteht aus: 1. Personenrecht, 2. Familienrecht, 3. Erbrecht, 4. Sachenrecht, und das OR (als 5. Teil des ZGB) enthält das Obligationenrecht. Alle diese gehören zum Privatrecht. Das Strafrecht (B) gehört zum öffentlichen Recht."
},

// --- diff 2 ---
{
  id: "p05", topic: "oeffentlich_privat", type: "mc", diff: 2, tax: "K2",
  q: "Was bedeutet «dispositives Recht»?",
  options: [
    {v: "A", t: "Ergänzendes Recht, das nur gilt, wenn die Parteien keine andere Abmachung getroffen haben."},
    {v: "B", t: "Recht, das von den Parteien zwingend eingehalten werden muss."},
    {v: "C", t: "Recht, das nur für bestimmte Berufsgruppen gilt."},
    {v: "D", t: "Recht, das vom Staat jederzeit geändert werden kann."}
  ],
  correct: "A",
  explain: "Dispositives Recht (ergänzendes Recht) gilt nur dann, wenn die Parteien keine abweichende Vereinbarung getroffen haben. Viele Normen im Privatrecht sind dispositiver Natur – die Parteien können sie bei gegenseitigem Einverständnis vertraglich abändern."
},
{
  id: "p06", topic: "oeffentlich_privat", type: "mc", diff: 2, tax: "K2",
  q: "Was bedeutet «relativ zwingendes Recht»?",
  options: [
    {v: "A", t: "Bestimmungen, die nur zugunsten einer (meist schwächeren) Partei abgeändert werden dürfen."},
    {v: "B", t: "Bestimmungen, die relativ selten angewandt werden."},
    {v: "C", t: "Bestimmungen, die nur für Verwandte gelten."},
    {v: "D", t: "Bestimmungen, die teilweise zwingend und teilweise dispositiv sind."}
  ],
  correct: "A",
  explain: "Relativ zwingendes Recht sind Bestimmungen, die nur zugunsten einer (meist schwächeren) Partei abgeändert werden dürfen. Beispiel: Im Arbeitsrecht darf vertraglich ein höherer Mindestlohn, aber kein niedrigerer vereinbart werden."
},
{
  id: "p07", topic: "oeffentlich_privat", type: "mc", diff: 2, tax: "K3",
  context: "«Zum Abschluss eines Vertrages ist die übereinstimmende gegenseitige Willensäusserung der Parteien erforderlich.» (Art. 1 Abs. 1 OR)",
  q: "Handelt es sich bei diesem Artikel um öffentliches Recht oder Privatrecht?",
  options: [
    {v: "A", t: "Öffentliches Recht – weil es eine staatliche Vorschrift ist."},
    {v: "B", t: "Privatrecht – weil er die Beziehung zwischen gleichberechtigten Vertragsparteien regelt."},
    {v: "C", t: "Öffentliches Recht – weil Verträge beim Staat registriert werden müssen."},
    {v: "D", t: "Beides – weil der Artikel sowohl im öffentlichen als auch im privaten Recht gilt."}
  ],
  correct: "B",
  explain: "Art. 1 Abs. 1 OR regelt den Vertragsabschluss zwischen gleichberechtigten Parteien. Es handelt sich um Privatrecht (Obligationenrecht als Teil des ZGB). Das Kriterium ist nicht, ob eine staatliche Vorschrift vorliegt (das trifft auf alles Recht zu), sondern ob die Beziehung koordinativ (Privatrecht) oder subordinativ (öffentliches Recht) ist."
},
{
  id: "p08", topic: "oeffentlich_privat", type: "tf", diff: 2, tax: "K2",
  q: "Die Rechtsnormen des öffentlichen Rechts sind immer zwingender Natur.",
  correct: true,
  explain: "Richtig. Im öffentlichen Recht sind die Normen zwingend – sie können nicht von den Parteien abgeändert werden. Wenn z.B. ein Straftäter erwischt wird, muss er die Konsequenzen tragen, ob er damit einverstanden ist oder nicht."
},

// --- diff 3 ---
{
  id: "p09", topic: "oeffentlich_privat", type: "mc", diff: 3, tax: "K3",
  context: "«Wer fahrlässig den Tod eines Menschen verursacht, wird mit Freiheitsstrafe bis zu drei Jahren oder Geldstrafe bestraft.» (Art. 117 StGB)",
  q: "Warum gehört dieser Artikel zum öffentlichen Recht?",
  options: [
    {v: "A", t: "Weil er eine subordinative Rechtsbeziehung regelt: Der Staat (Staatsanwaltschaft) tritt dem Täter nicht auf Augenhöhe gegenüber, und die Norm ist zwingend."},
    {v: "B", t: "Weil er eine Strafe vorsieht."},
    {v: "C", t: "Weil er im Strafgesetzbuch steht."},
    {v: "D", t: "Weil er für alle Menschen gilt."}
  ],
  correct: "A",
  explain: "Der entscheidende Grund ist die subordinative Rechtsbeziehung: Der Staat tritt dem Beschuldigten in einer Über-/Unterordnung gegenüber. Der Beschuldigte kann die Rechtsfolge (Strafe) nicht vertraglich abändern – die Norm ist zwingend. Dass eine Strafe vorgesehen ist (B) oder der Artikel im StGB steht (C), sind Folgen dieser Einordnung, nicht der Grund."
},
{
  id: "p10", topic: "oeffentlich_privat", type: "multi", diff: 3, tax: "K3",
  q: "Ordnen Sie die folgenden Bereiche korrekt zu. Welche gehören zum öffentlichen Recht? (Mehrere Antworten möglich.)",
  options: [
    {v: "A", t: "Bilaterale Verträge zwischen Staaten (Völkerrecht)"},
    {v: "B", t: "Abschluss eines Kaufvertrages zwischen zwei Privatpersonen"},
    {v: "C", t: "Schuldbetreibungs- und Konkursrecht"},
    {v: "D", t: "Bestimmungen zu Eigentum und Besitz"}
  ],
  correct: ["A", "C"],
  explain: "A (Völkerrecht) gehört zum öffentlichen Recht – es regelt Beziehungen zwischen Staaten. C (SchKG) gehört zum öffentlichen Recht – die zwangsweise Eintreibung von Geldforderungen erfolgt durch staatliche Behörden (Betreibungsamt). B (Kaufvertrag) ist Privatrecht (OR). D (Eigentum/Besitz) ist Privatrecht (Sachenrecht, ZGB)."
},
{
  id: "p11", topic: "oeffentlich_privat", type: "mc", diff: 3, tax: "K4",
  context: "Ein Arbeitgeber bietet einer Arbeitnehmerin im Vertrag eine Kündigungsfrist von einem Monat an. Das Gesetz sieht im ersten Dienstjahr ebenfalls eine Kündigungsfrist von einem Monat vor (Art. 335c Abs. 1 OR).",
  q: "Dürfte der Arbeitgeber vertraglich eine kürzere Kündigungsfrist (z.B. 2 Wochen) vereinbaren?",
  options: [
    {v: "A", t: "Ja, weil das Arbeitsrecht dispositiv ist."},
    {v: "B", t: "Nein, weil die gesetzliche Kündigungsfrist relativ zwingend ist – sie darf nur zugunsten der Arbeitnehmerin (also durch eine längere Frist) abgeändert werden."},
    {v: "C", t: "Ja, wenn beide Parteien einverstanden sind."},
    {v: "D", t: "Nein, weil die Kündigungsfrist absolut zwingend ist."}
  ],
  correct: "B",
  explain: "Die gesetzlichen Kündigungsfristen im Arbeitsrecht sind relativ zwingend zugunsten des Arbeitnehmers. Das bedeutet: Eine längere Frist darf vereinbart werden (zum Vorteil des Arbeitnehmers), eine kürzere jedoch nicht. Dies ist ein typisches Beispiel für relativ zwingendes Recht – es schützt die schwächere Partei (Arbeitnehmer)."
},
{
  id: "p12", topic: "oeffentlich_privat", type: "tf", diff: 2, tax: "K2",
  q: "Man kann freiwillig auf ein Grundrecht verzichten.",
  correct: false,
  explain: "Falsch. Grundrechte gehören zum öffentlichen Recht und sind zwingender Natur. Man kann nicht freiwillig auf ein Grundrecht verzichten. Sie gelten für alle Schweizerinnen und Schweizer unabhängig davon, ob sie dies wünschen oder nicht."
},

// ============================================================
// TOPIC: rechtsanwendung (Präfix r)
// ============================================================

// --- diff 1 ---
{
  id: "r01", topic: "rechtsanwendung", type: "fill", diff: 1, tax: "K1",
  q: "{0} sind die Voraussetzungen (\"Wenn ...\") für eine bestimmte rechtliche Folge. {1} sind die rechtlichen Konsequenzen (\"... dann ...\"), wenn alle Tatbestandsmerkmale erfüllt sind.",
  blanks: [
    {answer: "Tatbestandsmerkmale", alts: ["TBM", "tatbestandsmerkmale"]},
    {answer: "Rechtsfolgen", alts: ["rechtsfolgen", "Rechtsfolge"]}
  ],
  explain: "Ein Gesetzesartikel besteht typischerweise aus Tatbestandsmerkmalen (Voraussetzungen, «Wenn ...») und Rechtsfolgen (Konsequenzen, «... dann ...»). Nur wenn alle Tatbestandsmerkmale erfüllt sind, tritt die Rechtsfolge ein."
},
{
  id: "r02", topic: "rechtsanwendung", type: "mc", diff: 1, tax: "K1",
  q: "Was versteht man unter Subsumtion?",
  options: [
    {v: "A", t: "Das Anwenden von abstrakten Gesetzesnormen auf konkrete Sachverhalte."},
    {v: "B", t: "Das Erstellen eines neuen Gesetzes durch das Parlament."},
    {v: "C", t: "Das Zusammenfassen eines Gerichtsentscheids."},
    {v: "D", t: "Das Anfechten eines Urteils bei einer höheren Instanz."}
  ],
  correct: "A",
  explain: "Subsumtion bedeutet, abstrakte Gesetzesnormen auf einen konkreten Sachverhalt anzuwenden. Dabei wird geprüft, ob die Tatbestandsmerkmale der Gesetzesnorm im konkreten Fall erfüllt sind. Falls ja, tritt die Rechtsfolge ein."
},
{
  id: "r03", topic: "rechtsanwendung", type: "mc", diff: 1, tax: "K2",
  img: {src: "img/recht/einfuehrung/einfuehrung_rechtsanwendung_01.svg", alt: "Flussdiagramm: Vier Schritte der Rechtsanwendung"},
  q: "In welcher Reihenfolge wird bei der Rechtsanwendung vorgegangen?",
  options: [
    {v: "A", t: "Sachverhalt feststellen → Rechtsregel finden → Subsumtion → Rechtsfolge."},
    {v: "B", t: "Rechtsfolge bestimmen → Gesetz suchen → Sachverhalt anpassen."},
    {v: "C", t: "Gesetz lesen → Urteil fällen → Sachverhalt prüfen."},
    {v: "D", t: "Subsumtion → Sachverhalt feststellen → Rechtsfolge → Gesetz suchen."}
  ],
  correct: "A",
  explain: "Die Rechtsanwendung folgt vier Schritten: (1) Sachverhalt feststellen: Was ist passiert? Wer ist beteiligt? (2) Rechtsregel finden: Welche gesetzliche Bestimmung ist einschlägig? (3) Subsumtion: Stimmt der Sachverhalt mit den Tatbestandsmerkmalen überein? (4) Falls ja: Rechtsfolge bestimmen."
},
{
  id: "r04", topic: "rechtsanwendung", type: "tf", diff: 1, tax: "K2",
  q: "Bei der Rechtsanwendung muss zuerst die Rechtsfolge bestimmt werden, bevor der Sachverhalt geprüft wird.",
  correct: false,
  explain: "Falsch. Der Sachverhalt wird zuerst festgestellt (Was ist passiert? Wer ist beteiligt?), dann wird die passende Rechtsnorm gesucht, dann folgt die Subsumtion (Prüfung der Tatbestandsmerkmale), und erst dann wird die Rechtsfolge bestimmt."
},

// --- diff 2 ---
{
  id: "r05", topic: "rechtsanwendung", type: "mc", diff: 2, tax: "K3",
  context: "Art. 12 ZGB: «Wer handlungsfähig ist, hat die Fähigkeit, durch seine Handlungen Rechte und Pflichten zu begründen.»",
  q: "Bestimmen Sie die Tatbestandsmerkmale und die Rechtsfolge dieses Artikels.",
  options: [
    {v: "A", t: "TBM: Handlungsfähigkeit. RF: Fähigkeit, durch Handlungen Rechte und Pflichten zu begründen."},
    {v: "B", t: "TBM: Rechte und Pflichten haben. RF: Handlungsfähig sein."},
    {v: "C", t: "TBM: Schweizer Bürger sein. RF: Handlungsfähigkeit erlangen."},
    {v: "D", t: "TBM: 18 Jahre alt sein. RF: Verträge abschliessen können."}
  ],
  correct: "A",
  explain: "Art. 12 ZGB: «Wenn» jemand handlungsfähig ist (= TBM), «dann» hat diese Person die Fähigkeit, durch ihre Handlungen Rechte und Pflichten zu begründen (= RF). D ist unvollständig – Handlungsfähigkeit setzt nicht nur Volljährigkeit, sondern auch Urteilsfähigkeit voraus (Art. 13 ZGB)."
},
{
  id: "r06", topic: "rechtsanwendung", type: "mc", diff: 2, tax: "K3",
  context: "Art. 13 ZGB: «Handlungsfähig ist, wer volljährig und urteilsfähig ist.»",
  q: "Welches sind die Tatbestandsmerkmale (TBM) dieses Artikels?",
  options: [
    {v: "A", t: "TBM 1: volljährig. TBM 2: urteilsfähig."},
    {v: "B", t: "TBM: handlungsfähig."},
    {v: "C", t: "TBM: Schweizer Bürger."},
    {v: "D", t: "TBM 1: 18 Jahre alt. TBM 2: psychisch gesund."}
  ],
  correct: "A",
  explain: "Art. 13 ZGB: «Wenn» eine Person volljährig (TBM 1) UND urteilsfähig (TBM 2) ist, «dann» ist sie handlungsfähig (RF). Beide Tatbestandsmerkmale müssen kumulativ erfüllt sein. B ist falsch – Handlungsfähigkeit ist die Rechtsfolge, nicht das TBM."
},
{
  id: "r07", topic: "rechtsanwendung", type: "mc", diff: 2, tax: "K3",
  context: "Art. 2 Abs. 2 ZGB: «Der offenbare Missbrauch eines Rechtes findet keinen Rechtsschutz.»",
  q: "Bestimmen Sie die Tatbestandsmerkmale und die Rechtsfolge dieses Artikels.",
  options: [
    {v: "A", t: "TBM: offenbarer Missbrauch eines Rechtes. RF: kein Rechtsschutz."},
    {v: "B", t: "TBM: kein Rechtsschutz. RF: Missbrauch eines Rechtes."},
    {v: "C", t: "TBM: ein Recht haben. RF: es offenbar missbrauchen."},
    {v: "D", t: "TBM: ein Recht ausüben. RF: Rechtsschutz erhalten."}
  ],
  correct: "A",
  explain: "Art. 2 Abs. 2 ZGB: «Wenn» jemand ein Recht offenbar missbraucht (= TBM), «dann» findet dieses Verhalten keinen Rechtsschutz (= RF). Das bedeutet: Das Gericht schützt eine rechtsmissbräuchliche Berufung auf ein Recht nicht."
},
{
  id: "r08", topic: "rechtsanwendung", type: "multi", diff: 2, tax: "K3",
  q: "Welche Fragen gehören zum ersten Schritt der Rechtsanwendung (Sachverhalt feststellen)? (Mehrere Antworten möglich.)",
  options: [
    {v: "A", t: "Was ist passiert?"},
    {v: "B", t: "Wer sind die Parteien?"},
    {v: "C", t: "Welcher Gesetzesartikel ist anwendbar?"},
    {v: "D", t: "Welche Ansprüche machen die Parteien geltend?"}
  ],
  correct: ["A", "B", "D"],
  explain: "Beim Sachverhalt feststellen geht es um drei Fragen: Was ist passiert? Wer sind die Parteien? Welche Ansprüche machen sie geltend? Die Frage nach dem anwendbaren Gesetzesartikel (C) gehört zum zweiten Schritt (Rechtsregel finden)."
},

// --- diff 3 ---
{
  id: "r09", topic: "rechtsanwendung", type: "mc", diff: 3, tax: "K3",
  context: "Milosevic wird tot in seiner Gefängniszelle aufgefunden. Variante 1: Herzinfarkt ohne Fremdeinfluss. Variante 2: Vergiftung durch eine Drittperson.",
  q: "Welche Aussage zur rechtlichen Einordnung ist korrekt?",
  options: [
    {v: "A", t: "In Variante 1 liegt ein natürlicher Todesfall vor – dies ist rechtlich nicht relevant. In Variante 2 käme Art. 112 StGB (Mord) als qualifizierte Tötung in Betracht."},
    {v: "B", t: "Beide Varianten sind strafrechtlich relevant, da ein Mensch gestorben ist."},
    {v: "C", t: "In beiden Varianten ist Art. 111 StGB (vorsätzliche Tötung) anwendbar."},
    {v: "D", t: "Eine strafrechtliche Einordnung ist erst nach dem Gerichtsurteil möglich."}
  ],
  correct: "A",
  explain: "Obersatz: Es ist zu prüfen, ob ein strafbarer Tatbestand vorliegt. Variante 1 (Herzinfarkt): Es liegt ein natürlicher Tod ohne Fremdeinfluss vor – kein Tatbestand erfüllt. Variante 2 (Vergiftung): TBM von Art. 112 StGB (Mord): (1) ein Toter, (2) Tod wurde vorsätzlich herbeigeführt (Vergiftung), (3) besonders verwerflicher Zweck (Eliminationsmord). Subsumtion: Alle TBM sind erfüllt. RF: Lebenslängliche Freiheitsstrafe oder Freiheitsstrafe nicht unter zehn Jahren."
},
{
  id: "r10", topic: "rechtsanwendung", type: "mc", diff: 3, tax: "K3",
  context: "Art. 54 ZGB: «Die juristischen Personen sind handlungsfähig, sobald die nach Gesetz und Statuten hiefür unentbehrlichen Organe bestellt sind.»",
  q: "Bestimmen Sie die Tatbestandsmerkmale und die Rechtsfolge.",
  options: [
    {v: "A", t: "TBM 1: juristische Person. TBM 2: unentbehrliche Organe nach Gesetz und Statuten bestellt. RF: Handlungsfähigkeit."},
    {v: "B", t: "TBM: Handlungsfähigkeit. RF: Organe bestellen."},
    {v: "C", t: "TBM: juristische Person sein. RF: Organe bestellen müssen."},
    {v: "D", t: "TBM: Statuten haben. RF: juristische Person werden."}
  ],
  correct: "A",
  explain: "Art. 54 ZGB: «Wenn» es sich um eine juristische Person handelt (TBM 1) UND die nach Gesetz und Statuten unentbehrlichen Organe bestellt sind (TBM 2), «dann» ist die juristische Person handlungsfähig (RF). Beide TBM müssen kumulativ erfüllt sein."
},
{
  id: "r11", topic: "rechtsanwendung", type: "mc", diff: 3, tax: "K4",
  context: "Art. 8 ZGB: «Wo das Gesetz es nicht anders bestimmt, hat derjenige das Vorhandensein einer behaupteten Tatsache zu beweisen, der aus ihr Rechte ableitet.»",
  q: "Was regelt dieser Artikel und warum ist er für die Rechtsanwendung wichtig?",
  options: [
    {v: "A", t: "Er regelt die Beweislastverteilung: Wer Rechte geltend macht, muss die zugrunde liegenden Tatsachen beweisen. Dies ist zentral, weil bei unklarem Sachverhalt entschieden werden muss, wer die Folgen der Beweislosigkeit trägt."},
    {v: "B", t: "Er regelt, dass das Gericht immer alle Beweise selbst beschaffen muss."},
    {v: "C", t: "Er regelt, dass der Beklagte immer beweisen muss, dass er unschuldig ist."},
    {v: "D", t: "Er regelt, dass nur schriftliche Beweise vor Gericht zulässig sind."}
  ],
  correct: "A",
  explain: "Art. 8 ZGB enthält die grundlegende Beweislastregel des Privatrechts: TBM: Jemand leitet aus einer behaupteten Tatsache Rechte ab, und das Gesetz bestimmt nichts anderes. RF: Diese Person muss die Tatsache beweisen. Dies ist für die Rechtsanwendung zentral, weil der Sachverhalt oft strittig ist und klar sein muss, wer die Beweislast trägt."
},
{
  id: "r12", topic: "rechtsanwendung", type: "fill", diff: 2, tax: "K2",
  q: "Die vier Schritte der Rechtsanwendung sind: 1. {0} feststellen, 2. {1} finden, 3. {2}, 4. {3} bestimmen.",
  blanks: [
    {answer: "Sachverhalt", alts: ["sachverhalt"]},
    {answer: "Rechtsregel", alts: ["Rechtsnorm", "Gesetzesartikel", "rechtsregel"]},
    {answer: "Subsumtion", alts: ["subsumtion", "Subsumption"]},
    {answer: "Rechtsfolge", alts: ["rechtsfolge"]}
  ],
  explain: "Die Rechtsanwendung folgt einem festen Schema: (1) Sachverhalt feststellen (Was ist passiert?), (2) Rechtsregel/Rechtsnorm finden (Welcher Artikel ist einschlägig?), (3) Subsumtion (Stimmen die TBM mit dem Sachverhalt überein?), (4) Rechtsfolge bestimmen (Was ist die rechtliche Konsequenz?)."
}

];
