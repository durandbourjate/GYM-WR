// ══════════════════════════════════════════════════════════════
// Pool: OR AT – Vertragslehre (Obligationenrecht Allgemeiner Teil)
// Fach: Recht | Stufe: SF GYM3–GYM4
// Erstellt: 2026-02-22
// ══════════════════════════════════════════════════════════════

window.POOL_META = {
  title: "OR AT – Vertragslehre",
  fach: "Recht",
  color: "#73ab2c",
  level: "SF GYM3–GYM4"
};

window.TOPICS = {
  "entstehung":              {label: "Entstehungsgründe der Obligationen",              short: "Entstehung"},
  "unerlaubte_handlung":     {label: "Obligationen aus unerlaubter Handlung",           short: "Unerlaubte Handlung"},
  "bereicherung":            {label: "Ungerechtfertigte Bereicherung",                  short: "Bereicherung"},
  "vertragsvoraussetzungen": {label: "Voraussetzungen gültiger Verträge",               short: "Voraussetzungen"},
  "willensmaengel":          {label: "Anfechtungsgründe und Willensmängel",             short: "Willensmängel"},
  "erfuellung":              {label: "Vertragserfüllung",                               short: "Erfüllung"},
  "sicherung":               {label: "Sicherung von Forderungen",                      short: "Sicherung"},
  "erloeschen":              {label: "Erlöschen der Obligation",                        short: "Erlöschen"},
  "stoerung":                {label: "Störung der Vertragserfüllung",                   short: "Störung"}
};

window.QUESTIONS = [
  {
    id: "e01", topic: "entstehung", type: "mc", diff: 1, tax: "K1",
    q: "Was ist eine Obligation im schweizerischen Recht?",
    options: [{v: "A", t: "Ein einklagbares Recht auf Eigentum"}, {v: "B", t: "Ein Rechtsverhältnis, in dem ein Schuldner verpflichtet ist, eine Leistung zu erbringen, und ein Gläubiger das Recht hat, diese zu fordern"}, {v: "C", t: "Ein Vertrag zwischen zwei Parteien über den Kauf eines Grundstücks"}, {v: "D", t: "Eine strafrechtliche Verpflichtung"}],
    correct: "B",
    explain: "Eine Obligation ist ein Schuldverhältnis: Der Schuldner ist zur Leistung verpflichtet, der Gläubiger hat das Forderungsrecht. Das OR regelt die verschiedenen Entstehungsgründe von Obligationen."
  },

  {
    id: "e02", topic: "entstehung", type: "tf", diff: 1, tax: "K1",
    q: "Eine Obligation kann nur aus einem Vertrag entstehen.",
    correct: false,
    explain: "Obligationen können aus drei Gründen entstehen: aus Vertrag (OR 1 ff.), aus unerlaubter Handlung (OR 41 ff.) und aus ungerechtfertigter Bereicherung (OR 62 ff.)."
  },

  {
    id: "e03", topic: "entstehung", type: "fill", diff: 1, tax: "K1",
    q: "Die drei Entstehungsgründe von Obligationen sind: Vertrag, {0} und {1}.",
    blanks: [{answer: "unerlaubte Handlung", alts: ["Delikt"]}, {answer: "ungerechtfertigte Bereicherung", alts: ["Bereicherung"]}],
    explain: "OR kennt drei Entstehungsgründe: Vertrag (OR 1 ff.), unerlaubte Handlung/Delikt (OR 41 ff.) und ungerechtfertigte Bereicherung (OR 62 ff.)."
  },

  {
    id: "e04", topic: "entstehung", type: "mc", diff: 1, tax: "K1",
    q: "Was ist der Unterschied zwischen einer Forderung und einer Schuld?",
    options: [{v: "A", t: "Forderung = Recht des Gläubigers auf Leistung; Schuld = Pflicht des Schuldners zur Leistung"}, {v: "B", t: "Forderung und Schuld sind Synonyme"}, {v: "C", t: "Forderung = Pflicht zur Zahlung; Schuld = Recht auf Zahlung"}, {v: "D", t: "Forderung betrifft nur Geldleistungen, Schuld nur Sachleistungen"}],
    correct: "A",
    explain: "Die Forderung ist das einklagbare Recht des Gläubigers auf Leistung. Die Schuld ist die einklagbare Pflicht des Schuldners zur Leistung. Beides sind zwei Seiten derselben Obligation."
  },

  {
    id: "e05", topic: "entstehung", type: "mc", diff: 1, tax: "K1",
    q: "Was ist eine Stückschuld (Speziesschuld)?",
    options: [{v: "A", t: "Eine Schuld, bei der die geschuldete Sache nur der Gattung nach bestimmt ist"}, {v: "B", t: "Eine Schuld, bei der die geschuldete Sache individuell bestimmt ist"}, {v: "C", t: "Eine Schuld, die in Geld zu begleichen ist"}, {v: "D", t: "Eine Schuld aus unerlaubter Handlung"}],
    correct: "B",
    explain: "Bei einer Stückschuld (Speziesschuld) ist die geschuldete Sache individuell bestimmt (z.B. dieses eine Gemälde). Bei einer Gattungsschuld ist die Sache nur der Gattung nach bestimmt (z.B. 10 kg Mehl)."
  },

  {
    id: "e06", topic: "entstehung", type: "multi", diff: 2, tax: "K2",
    q: "Welche Aussagen über Leistungen im Obligationenrecht sind korrekt? (Mehrere Antworten möglich.)",
    options: [{v: "A", t: "Eine Leistung kann in einem Tun bestehen (positive Leistungspflicht)"}, {v: "B", t: "Eine Leistung kann in einem Unterlassen bestehen (negative Leistungspflicht)"}, {v: "C", t: "Eine Leistung kann nur in einer einmaligen Zahlung bestehen"}, {v: "D", t: "Eine Leistung kann eine Dauerschuld sein (z.B. Miete)"}],
    correct: ["A", "B", "D"],
    explain: "Leistungen können bestehen in: Tun (positive Leistungspflicht), Unterlassen oder Dulden (negative Leistungspflicht). Sie können einmalig (z.B. Kaufpreis) oder fortgesetzt (Dauerschuld, z.B. Miete) sein. C ist falsch, da Leistungen nicht nur Geldzahlungen umfassen."
  },

  {
    id: "e07", topic: "entstehung", type: "mc", diff: 2, tax: "K2",
    q: "Was unterscheidet Schadenersatz von Genugtuung?",
    options: [{v: "A", t: "Schadenersatz deckt materielle Schäden, Genugtuung deckt immaterielle Schäden"}, {v: "B", t: "Schadenersatz und Genugtuung sind dasselbe"}, {v: "C", t: "Schadenersatz wird nur bei Verträgen geschuldet, Genugtuung nur bei Delikten"}, {v: "D", t: "Genugtuung ist immer höher als Schadenersatz"}],
    correct: "A",
    explain: "Schadenersatz ist die Wiedergutmachung eines materiellen Schadens (Vermögenseinbusse). Genugtuung ist die Wiedergutmachung eines immateriellen Schadens (z.B. Schmerzensgeld). Beide können sowohl bei vertraglicher als auch bei ausservertraglicher Haftung anfallen."
  },

  {
    id: "e08", topic: "entstehung", type: "tf", diff: 2, tax: "K2",
    q: "Vertragliche Schäden werden mittels OR 41 ff. (unerlaubte Handlung) abgegolten.",
    correct: false,
    explain: "Vertragliche Schäden werden mittels OR 97 abgegolten (vertragliche Haftung). OR 41 ff. regeln die ausservertragliche Haftung bei unerlaubten Handlungen. Diese Unterscheidung ist fundamental."
  },

  {
    id: "e09", topic: "entstehung", type: "fill", diff: 2, tax: "K2",
    q: "Bei einer {0} ist die geschuldete Sache nur der Gattung (Qualität und Quantität) nach bestimmt, während bei einer begrenzten Gattungsschuld die Sache aus einem begrenzten {1} stammt.",
    blanks: [{answer: "Gattungsschuld", alts: ["Genus-Schuld"]}, {answer: "Vorrat", alts: ["Bestand", "Lager"]}],
    explain: "Gattungsschuld: Sache nur nach Gattung bestimmt (z.B. 100 kg Weizen). Begrenzte Gattungsschuld: Sache aus begrenztem Vorrat oder bestimmter Gegend."
  },

  {
    id: "e10", topic: "entstehung", type: "mc", diff: 2, tax: "K3",
    context: "Marco bestellt bei einem Weinhändler 12 Flaschen Bordeaux Jahrgang 2020. Der Händler hat 500 solche Flaschen im Lager.",
    q: "Um welche Art von Schuld handelt es sich?",
    options: [{v: "A", t: "Stückschuld, weil es sich um Wein handelt"}, {v: "B", t: "Gattungsschuld, weil 12 beliebige Flaschen aus dem Bestand genügen"}, {v: "C", t: "Begrenzte Gattungsschuld, weil die Flaschen aus dem begrenzten Lagerbestand stammen"}, {v: "D", t: "Geldschuld, weil Marco zahlen muss"}],
    correct: "C",
    explain: "Es handelt sich um eine begrenzte Gattungsschuld: Die Flaschen sind der Gattung nach bestimmt (Bordeaux 2020), stammen aber aus einem begrenzten Vorrat (500 Flaschen im Lager). Es ist keine Stückschuld, da nicht bestimmte individuelle Flaschen geschuldet sind."
  },

  {
    id: "e11", topic: "entstehung", type: "mc", diff: 3, tax: "K4",
    context: "Sandra wird von einem herabfallenden Blumentopf auf dem Balkon ihrer Nachbarin getroffen und verletzt sich.",
    q: "Aus welchem Entstehungsgrund kann eine Obligation für die Nachbarin entstehen?",
    options: [{v: "A", t: "Aus Vertrag, weil die Nachbarin für die Sicherheit verantwortlich ist"}, {v: "B", t: "Aus unerlaubter Handlung (OR 41 ff.), weil ein ausservertraglicher Schaden entstanden ist"}, {v: "C", t: "Aus ungerechtfertigter Bereicherung, weil die Nachbarin auf Kosten von Sandra profitiert"}, {v: "D", t: "Es entsteht keine Obligation, weil es ein Unfall war"}],
    correct: "B",
    explain: "Es liegt kein Vertrag zwischen Sandra und der Nachbarin vor. Der Schaden entsteht ausservertraglich durch eine unerlaubte Handlung (OR 41 ff.). Die Nachbarin haftet möglicherweise als Werkeigentümerin (OR 58) für den mangelhaften Zustand ihres Balkons. Ungerechtfertigte Bereicherung liegt nicht vor, da die Nachbarin nicht bereichert wurde."
  },

  {
    id: "e12", topic: "entstehung", type: "multi", diff: 3, tax: "K4",
    q: "Welche Aussagen zum Verhältnis von vertraglicher und ausservertraglicher Haftung sind korrekt?",
    options: [{v: "A", t: "Vertragliche Haftung (OR 97) setzt einen gültigen Vertrag voraus"}, {v: "B", t: "Ausservertragliche Haftung (OR 41 ff.) greift auch ohne Vertrag zwischen den Parteien"}, {v: "C", t: "Beide Haftungsarten können nie gleichzeitig vorliegen"}, {v: "D", t: "Bei vertraglicher Haftung muss der Schuldner beweisen, dass ihn kein Verschulden trifft (Beweislastumkehr)"}],
    correct: ["A", "B", "D"],
    explain: "A: Vertragliche Haftung setzt Vertrag voraus. B: Ausservertragliche Haftung greift ohne Vertrag. C ist falsch: Beide können parallel vorliegen (Anspruchskonkurrenz). D: Bei OR 97 gilt Beweislastumkehr – der Schuldner muss beweisen, dass ihn kein Verschulden trifft."
  },

  {
    id: "e13", topic: "entstehung", type: "tf", diff: 3, tax: "K3",
    q: "Eine Dauerschuld (z.B. Miete) ist eine einmalige Leistungspflicht, die in Raten erfüllt wird.",
    correct: false,
    explain: "Eine Dauerschuld ist eine fortgesetzte Leistungspflicht, die sich über einen Zeitraum erstreckt (z.B. Miete, Arbeitsvertrag). Sie unterscheidet sich von einer einmaligen Leistungspflicht (z.B. Kaufpreiszahlung), auch wenn diese in Raten erfolgen kann."
  },

  {
    id: "u01", topic: "unerlaubte_handlung", type: "mc", diff: 1, tax: "K1",
    q: "Welche Tatbestandsmerkmale muss die Verschuldenshaftung nach OR 41 erfüllen?",
    options: [{v: "A", t: "Schaden, Kausalzusammenhang, Widerrechtlichkeit, Verschulden"}, {v: "B", t: "Schaden, Vertrag, Verschulden"}, {v: "C", t: "Widerrechtlichkeit, Bereicherung, Kausalzusammenhang"}, {v: "D", t: "Verschulden, Vertrag, Schaden, Verjährung"}],
    correct: "A",
    explain: "Die vier Tatbestandsmerkmale der Verschuldenshaftung nach OR 41 sind: (1) Schaden, (2) Kausalzusammenhang (adäquat), (3) Widerrechtlichkeit und (4) Verschulden. Alle vier müssen kumulativ vorliegen."
  },

  {
    id: "u02", topic: "unerlaubte_handlung", type: "tf", diff: 1, tax: "K1",
    q: "Bei der Kausalhaftung muss der Geschädigte ein Verschulden des Haftpflichtigen beweisen.",
    correct: false,
    explain: "Bei der Kausalhaftung haftet jemand für das Verschulden einer anderen Person oder Sache – ohne eigenes Verschulden. Die vierte Voraussetzung (Verschulden) wird durch die Verantwortlichkeit für eine Person/Sache ersetzt."
  },

  {
    id: "u03", topic: "unerlaubte_handlung", type: "fill", diff: 1, tax: "K1",
    q: "Der Haftung des Geschäftsherrn für seine Angestellten ist in {0} geregelt.",
    blanks: [{answer: "OR 55", alts: ["Art. 55 OR"]}],
    explain: "OR 55 regelt die Haftung des Geschäftsherrn: Er haftet für Schäden, die seine Arbeitnehmer in Ausübung ihrer dienstlichen Tätigkeit verursachen (einfache Kausalhaftung)."
  },

  {
    id: "u04", topic: "unerlaubte_handlung", type: "mc", diff: 1, tax: "K1",
    q: "Welche ist eine einfache Kausalhaftung?",
    options: [{v: "A", t: "Haftung des Tierhalters (OR 56)"}, {v: "B", t: "Motorfahrzeughaftung"}, {v: "C", t: "Haftung für vorsätzliche Körperverletzung"}, {v: "D", t: "Haftung aus Vertrag"}],
    correct: "A",
    explain: "Einfache Kausalhaftungen sind: Geschäftsherr (OR 55), Tierhalter (OR 56), Familienoberhaupt (ZGB 333), Werkeigentümer (OR 58). Die Motorfahrzeughaftung ist eine Gefährdungshaftung (scharfe Kausalhaftung)."
  },

  {
    id: "u05", topic: "unerlaubte_handlung", type: "mc", diff: 1, tax: "K1",
    q: "Was unterscheidet die Gefährdungshaftung von der einfachen Kausalhaftung?",
    options: [{v: "A", t: "Bei der Gefährdungshaftung geht es um besonders gefährliche Vorrichtungen oder Sachen"}, {v: "B", t: "Gefährdungshaftung erfordert immer Verschulden"}, {v: "C", t: "Einfache Kausalhaftung gilt nur für Fahrzeuge"}, {v: "D", t: "Es gibt keinen Unterschied"}],
    correct: "A",
    explain: "Die Gefährdungshaftung (scharfe Kausalhaftung) betrifft den Halter von Vorrichtungen oder Sachen mit besonderem Gefahrenpotenzial (z.B. Motorfahrzeuge, Atomanlage, Eisenbahn). Eine Entlastung ist nur bei grobem Drittverschulden, höherer Gewalt oder grobem Selbstverschulden möglich."
  },

  {
    id: "u06", topic: "unerlaubte_handlung", type: "multi", diff: 2, tax: "K2",
    q: "Welche Haftpflichtigen gehören zur einfachen Kausalhaftung? (Mehrere Antworten möglich.)",
    options: [{v: "A", t: "Geschäftsherr (OR 55)"}, {v: "B", t: "Tierhalter (OR 56)"}, {v: "C", t: "Motorfahrzeughalter (SVG)"}, {v: "D", t: "Werkeigentümer (OR 58)"}],
    correct: ["A", "B", "D"],
    explain: "Einfache Kausalhaftungen: Geschäftsherr OR 55, Tierhalter OR 56, Familienoberhaupt ZGB 333, Werkeigentümer OR 58. Der Motorfahrzeughalter fällt unter die Gefährdungshaftung (SVG), nicht unter die einfache Kausalhaftung."
  },

  {
    id: "u07", topic: "unerlaubte_handlung", type: "mc", diff: 2, tax: "K3",
    context: "Der Hund von Frau Meier beisst einen Jogger im Park. Frau Meier hatte den Hund an der Leine, aber der Hund riss sich los.",
    q: "Haftet Frau Meier für den Schaden?",
    options: [{v: "A", t: "Nein, weil sie den Hund angeleint hatte"}, {v: "B", t: "Ja, als Tierhalterin haftet sie grundsätzlich nach OR 56, es sei denn, sie weist nach, dass sie alle gebotene Sorgfalt angewendet hat"}, {v: "C", t: "Ja, aber nur wenn sie fahrlässig gehandelt hat"}, {v: "D", t: "Nein, weil der Hund sich selbständig losgerissen hat"}],
    correct: "B",
    explain: "OR 56: Die Tierhalterin haftet grundsätzlich für den Schaden, den ihr Tier anrichtet. Sie kann sich nur entlasten, wenn sie nachweist, dass sie alle nach den Umständen gebotene Sorgfalt in Verwahrung und Beaufsichtigung angewendet hat. Die Anforderungen an den Entlastungsbeweis sind in der Praxis hoch."
  },

  {
    id: "u08", topic: "unerlaubte_handlung", type: "tf", diff: 2, tax: "K2",
    q: "Bei der Verschuldenshaftung muss der Geschädigte alle vier Haftungsvoraussetzungen beweisen.",
    correct: true,
    explain: "Wer jemanden haftpflichtig machen will, muss grundsätzlich alle relevanten Haftungsvoraussetzungen beweisen: Schaden, Kausalzusammenhang, Widerrechtlichkeit und Verschulden."
  },

  {
    id: "u09", topic: "unerlaubte_handlung", type: "mc", diff: 2, tax: "K3",
    context: "Ein Hauseigentümer versäumt es, Schneefänger auf seinem Dach anzubringen. Eine Dachlawine beschädigt das parkierte Auto eines Nachbarn.",
    q: "Auf welcher Haftungsgrundlage kann der Nachbar den Hauseigentümer belangen?",
    options: [{v: "A", t: "Verschuldenshaftung (OR 41), weil der Hauseigentümer fahrlässig handelte"}, {v: "B", t: "Werkeigentümerhaftung (OR 58), weil das Dach mangelhaft unterhalten wurde"}, {v: "C", t: "Tierhalterhaftung (OR 56)"}, {v: "D", t: "Gefährdungshaftung, weil Schnee gefährlich ist"}],
    correct: "B",
    explain: "OR 58: Der Werkeigentümer haftet für Schäden, die durch fehlerhafte Anlage oder mangelhaften Unterhalt seines Werkes entstehen. Das Dach ohne Schneefänger ist ein mangelhaft unterhaltenes Werk. Die Werkeigentümerhaftung ist eine einfache Kausalhaftung."
  },

  {
    id: "u10", topic: "unerlaubte_handlung", type: "fill", diff: 2, tax: "K2",
    q: "Bei der Gefährdungshaftung kann sich der Halter nur entlasten durch: grobes {0}, höhere Gewalt oder grobes {1} des Geschädigten.",
    blanks: [{answer: "Drittverschulden", alts: ["Verschulden eines Dritten"]}, {answer: "Selbstverschulden", alts: ["Eigenverschulden"]}],
    explain: "Die drei Entlastungsgründe bei Gefährdungshaftung: grobes Drittverschulden, höhere Gewalt (Naturereignis) und grobes Selbstverschulden des Geschädigten. Diese unterbrechen den Kausalzusammenhang."
  },

  {
    id: "u11", topic: "unerlaubte_handlung", type: "mc", diff: 3, tax: "K4",
    context: "Ein Nachbar hilft beim Zügeln und beschädigt dabei versehentlich einen teuren Tisch. Er hat aus Gefälligkeit geholfen, ohne Entgelt.",
    q: "Wie ist die Haftung zu beurteilen?",
    options: [{v: "A", t: "Der Nachbar haftet voll für den Schaden"}, {v: "B", t: "Der Nachbar haftet nicht, weil es eine Gefälligkeit war"}, {v: "C", t: "Der Nachbar haftet grundsätzlich, aber die Haftung wird milder beurteilt, da das Geschäft für ihn keinen Vorteil bezweckt"}, {v: "D", t: "Es gibt keine Haftungsgrundlage"}],
    correct: "C",
    explain: "Grundsätzlich haftet, wer schuldhaft einen Schaden verursacht (OR 41). Bei Gefälligkeitshandlungen geht der Gesetzgeber von einer reduzierten Haftung aus: Die Haftung wird milder beurteilt, wenn das Geschäft für den Haftpflichtigen keinerlei Vorteil bezweckt (OR 99 Abs. 2), ausser bei grobfahrlässigem Handeln."
  },

  {
    id: "u12", topic: "unerlaubte_handlung", type: "tf", diff: 3, tax: "K4",
    q: "Wer in berechtigter Notwehr einen Angreifer verletzt, muss dem Angreifer Schadenersatz leisten.",
    correct: false,
    explain: "Wer in berechtigter Notwehr einen Angriff abwehrt, hat den Schaden, den er dabei dem Angreifer zufügt, nicht zu ersetzen. Notwehr ist ein Rechtfertigungsgrund, der die Widerrechtlichkeit ausschliesst."
  },

  {
    id: "u13", topic: "unerlaubte_handlung", type: "multi", diff: 3, tax: "K3",
    q: "Welche Funktionen hat das Deliktsrecht? (Mehrere Antworten möglich.)",
    options: [{v: "A", t: "Ausgleich unter Rechtssubjekten"}, {v: "B", t: "Schaffung von Kostenwahrheit durch sachgerechte Kostenallokation"}, {v: "C", t: "Verhaltenslenkung (Prävention)"}, {v: "D", t: "Bestrafung des Schädigers"}],
    correct: ["A", "B", "C"],
    explain: "Die drei Funktionen des Deliktsrechts sind: (1) Ausgleich unter Rechtssubjekten (Haftungsbegründung/-beschränkung), (2) Schaffung von Kostenwahrheit v.a. bei Kausalhaftungen, (3) Verhaltenslenkung. Bestrafung ist Sache des Strafrechts, nicht des Deliktsrechts."
  },

  {
    id: "u14", topic: "unerlaubte_handlung", type: "mc", diff: 3, tax: "K4",
    context: "Ein urteilsunfähiges Kind (5 Jahre) wirft im Supermarkt eine Flasche um und beschädigt die Ware. Die Eltern waren anwesend und haben das Kind beaufsichtigt.",
    q: "Wer haftet für den Schaden?",
    options: [{v: "A", t: "Das Kind haftet selbst"}, {v: "B", t: "Die Eltern haften als Familienoberhaupt (ZGB 333)"}, {v: "C", t: "Niemand haftet, weil das Kind urteilsunfähig ist und die Eltern genügend beaufsichtigt haben"}, {v: "D", t: "Der Supermarkt haftet selbst"}],
    correct: "C",
    explain: "Ein urteilsunfähiges Kind kann nicht selbst haften. Die Eltern haften als Familienoberhaupt (ZGB 333), können sich aber entlasten, wenn sie nachweisen, dass sie das Kind genügend beaufsichtigt haben. Gelingt dieser Nachweis, haftet niemand."
  },

  {
    id: "b01", topic: "bereicherung", type: "mc", diff: 1, tax: "K1",
    q: "Was ist der Grundsatz der ungerechtfertigten Bereicherung nach OR 62?",
    options: [{v: "A", t: "Wer einen Gewinn erzielt, muss diesen versteuern"}, {v: "B", t: "Vermögensverschiebungen ohne Rechtsgrund müssen zurückerstattet werden"}, {v: "C", t: "Jeder Vertrag muss schriftlich sein"}, {v: "D", t: "Bereicherung ist immer strafbar"}],
    correct: "B",
    explain: "OR 62: Wer ohne gültigen Rechtsgrund bereichert worden ist, muss die Bereicherung zurückerstatten. Der Grundsatz lautet: Keine Bereicherung ohne Rechtsgrund."
  },

  {
    id: "b02", topic: "bereicherung", type: "tf", diff: 1, tax: "K1",
    q: "Der Bereicherungsanspruch verjährt in 3 Jahren nach Kenntnisnahme, spätestens aber nach 10 Jahren.",
    correct: true,
    explain: "OR 67: Der Bereicherungsanspruch verjährt in 3 Jahren nach Kenntnisnahme (relative Verjährung) und spätestens nach 10 Jahren (absolute Verjährung, OR 127)."
  },

  {
    id: "b03", topic: "bereicherung", type: "fill", diff: 1, tax: "K1",
    q: "Kondiktion ist die {0} aufgrund einer ungerechtfertigten Bereicherung.",
    blanks: [{answer: "Rückerstattungsforderung", alts: ["Rückforderung", "Rueckforderung"]}],
    explain: "Kondiktion bezeichnet die Rückerstattungsforderung bei ungerechtfertigter Bereicherung. Voraussetzungen: Bereicherung, auf Kosten eines Anderen, Fehlen eines genügenden Grundes."
  },

  {
    id: "b04", topic: "bereicherung", type: "mc", diff: 1, tax: "K1",
    q: "Was bedeutet der subsidiäre Charakter des Bereicherungsanspruchs?",
    options: [{v: "A", t: "Der Bereicherungsanspruch gilt nur, wenn keine andere Klage möglich ist"}, {v: "B", t: "Der Bereicherungsanspruch hat immer Vorrang"}, {v: "C", t: "Der Bereicherungsanspruch ist unwichtig"}, {v: "D", t: "Der Bereicherungsanspruch gilt nur bei Verträgen"}],
    correct: "A",
    explain: "Der Bereicherungsanspruch ist subsidiär: Er gilt nur dann, wenn keine andere Klage möglich ist, z.B. kein Eigentumsanspruch oder vertraglicher Anspruch besteht."
  },

  {
    id: "b05", topic: "bereicherung", type: "mc", diff: 2, tax: "K2",
    q: "Was muss der gutgläubig Bereicherte zurückerstatten?",
    options: [{v: "A", t: "Den ganzen Betrag"}, {v: "B", t: "Nur den Teil, um den er im Zeitpunkt der Rückforderung noch bereichert ist"}, {v: "C", t: "Nichts, da er gutgläubig war"}, {v: "D", t: "Den doppelten Betrag als Strafe"}],
    correct: "B",
    explain: "OR 64: Der gutgläubig Bereicherte muss nur den Teil zurückerstatten, um den er im Zeitpunkt der Rückforderung noch bereichert ist. Der bösgläubig Bereicherte muss den ganzen Betrag rückerstatten."
  },

  {
    id: "b06", topic: "bereicherung", type: "tf", diff: 2, tax: "K2",
    q: "Der bösgläubig Bereicherte muss nur den Teil der Bereicherung zurückgeben, um den er noch bereichert ist.",
    correct: false,
    explain: "Der bösgläubig Bereicherte muss den ganzen Betrag rückerstatten, nicht nur den noch vorhandenen Teil. Der Schutz der OR 64 (Rückerstattung nur des Vorhandenen) gilt nur für den gutgläubig Bereicherten."
  },

  {
    id: "b07", topic: "bereicherung", type: "multi", diff: 2, tax: "K2",
    q: "Welche Entstehungsgründe können zu einer ungerechtfertigten Bereicherung führen? (Mehrere Antworten möglich.)",
    options: [{v: "A", t: "Ohne jeden gültigen Rechtsgrund"}, {v: "B", t: "Nicht verwirklichter Rechtsgrund"}, {v: "C", t: "Nachträglich weggefallener Rechtsgrund"}, {v: "D", t: "Eingriffsbereicherung"}],
    correct: ["A", "B", "C", "D"],
    explain: "Alle vier sind Entstehungsgründe für ungerechtfertigte Bereicherung nach OR 62: (1) ohne gültigen Rechtsgrund, (2) nicht verwirklichter Rechtsgrund, (3) nachträglich weggefallener Rechtsgrund, (4) Eingriffsbereicherung."
  },

  {
    id: "b08", topic: "bereicherung", type: "mc", diff: 2, tax: "K3",
    context: "Anna überweist irrtümlich CHF 5000 an Bruno, mit dem sie kein Vertragsverhältnis hat. Bruno weiss, dass das Geld nicht für ihn bestimmt ist, gibt aber CHF 3000 bereits aus.",
    q: "Wie viel muss Bruno zurückerstatten?",
    options: [{v: "A", t: "Nur CHF 2000, weil er nur noch um diesen Betrag bereichert ist"}, {v: "B", t: "Den ganzen Betrag von CHF 5000, weil er bösgläubig war"}, {v: "C", t: "Nichts, weil Anna den Fehler gemacht hat"}, {v: "D", t: "CHF 3000, die er ausgegeben hat"}],
    correct: "B",
    explain: "Bruno ist bösgläubig, da er wusste, dass das Geld nicht für ihn bestimmt war. Der bösgläubig Bereicherte muss den ganzen Betrag rückerstatten (OR 64 e contrario). Wäre Bruno gutgläubig, müsste er nur die noch vorhandenen CHF 2000 zurückgeben."
  },

  {
    id: "b09", topic: "bereicherung", type: "tf", diff: 2, tax: "K2",
    q: "Die Rückforderung einer freiwillig bezahlten Nichtschuld setzt voraus, dass ein Irrtum in der Schuldpflicht vorlag (OR 63).",
    correct: true,
    explain: "OR 63 Abs. 1: Wer eine Nichtschuld freiwillig bezahlt hat, kann das Geleistete nur zurückfordern, wenn er beweist, dass er sich über die Schuldpflicht im Irrtum befand."
  },

  {
    id: "b10", topic: "bereicherung", type: "mc", diff: 3, tax: "K3",
    context: "Carl zahlt Daniel CHF 10000 als Gegenleistung dafür, dass Daniel ein illegales Geschäft für ihn erledigt. Das Geschäft wird nicht durchgeführt.",
    q: "Kann Carl die CHF 10000 zurückfordern?",
    options: [{v: "A", t: "Ja, weil der Rechtsgrund weggefallen ist"}, {v: "B", t: "Ja, wegen ungerechtfertigter Bereicherung"}, {v: "C", t: "Nein, weil Rückforderungen bei rechtswidrigem oder unsittlichem Zweck ausgeschlossen sind (OR 66)"}, {v: "D", t: "Ja, aber nur die Hälfte"}],
    correct: "C",
    explain: "OR 66: Rückforderungen von Beträgen, die mit dem Ziel eines rechtswidrigen oder unsittlichen Erfolges bezahlt worden sind, sind ausgeschlossen. Carl kann die CHF 10000 nicht zurückfordern."
  },

  {
    id: "b11", topic: "bereicherung", type: "fill", diff: 3, tax: "K3",
    q: "Die drei Voraussetzungen einer Kondiktion sind: (1) {0}, (2) auf Kosten eines Anderen, (3) Fehlen eines genügenden {1}.",
    blanks: [{answer: "Bereicherung", alts: ["Vermögensvermehrung"]}, {answer: "Grundes", alts: ["Rechtsgrunds", "Rechtsgrundes"]}],
    explain: "Kondiktion erfordert: Bereicherung des einen, auf Kosten des anderen, ohne genügenden Rechtsgrund. Je nach Kondiktionsart gelten unterschiedliche Beweisvoraussetzungen."
  },

  {
    id: "b12", topic: "bereicherung", type: "mc", diff: 3, tax: "K4",
    context: "Eva bezahlt ihrem ehemaligen Vermieter CHF 800, weil sie glaubt, noch eine Monatsmiete zu schulden. Tatsächlich war die Miete bereits vollständig bezahlt.",
    q: "Kann Eva die CHF 800 zurückfordern?",
    options: [{v: "A", t: "Nein, weil sie freiwillig bezahlt hat"}, {v: "B", t: "Ja, wenn sie beweist, dass sie sich über die Schuldpflicht im Irrtum befand (OR 63)"}, {v: "C", t: "Nein, weil der Vermieter gutgläubig ist"}, {v: "D", t: "Ja, aber nur wenn sie innerhalb von 30 Tagen klagt"}],
    correct: "B",
    explain: "OR 63 Abs. 1: Eva hat eine Nichtschuld freiwillig bezahlt. Sie kann das Geleistete zurückfordern, wenn sie beweist, dass sie sich über die Schuldpflicht im Irrtum befand. Der Irrtum liegt hier vor, da die Miete bereits bezahlt war."
  },

  {
    id: "v01", topic: "vertragsvoraussetzungen", type: "mc", diff: 1, tax: "K1",
    q: "Welche drei kumulativen Voraussetzungen müssen für einen gültigen Vertrag erfüllt sein?",
    options: [{v: "A", t: "Schriftform, Zeugen, notarielle Beurkundung"}, {v: "B", t: "Gegenseitige übereinstimmende Willenserklärungen, gültiger Vertragsinhalt, korrekte Vertragsform"}, {v: "C", t: "Angebot, Nachfrage, Preis"}, {v: "D", t: "Handlungsfähigkeit, Vertragsdauer, Unterschrift"}],
    correct: "B",
    explain: "Die drei kumulativen Voraussetzungen sind: (1) Gegenseitige, übereinstimmende Willenserklärungen (OR 1), (2) Gültiger Vertragsinhalt (OR 19/20), (3) Korrekte Vertragsform (OR 11 ff.). Fehlt eine Voraussetzung, ist der Vertrag nichtig."
  },

  {
    id: "v02", topic: "vertragsvoraussetzungen", type: "tf", diff: 1, tax: "K1",
    q: "Formfreiheit ist der Grundsatz im schweizerischen Vertragsrecht (OR 11).",
    correct: true,
    explain: "OR 11: Verträge bedürfen zu ihrer Gültigkeit nur dann einer besonderen Form, wenn das Gesetz eine solche vorschreibt. Formfreiheit ist der Grundsatz – die meisten Verträge können mündlich geschlossen werden."
  },

  {
    id: "v03", topic: "vertragsvoraussetzungen", type: "fill", diff: 1, tax: "K1",
    q: "Ein Vertrag mit unmöglichem, {0} oder unsittlichem Inhalt ist nach OR 19/20 nichtig.",
    blanks: [{answer: "widerrechtlichem", alts: ["rechtswidrigem", "illegalem"]}],
    explain: "OR 19/20: Ein Vertrag mit unmöglichem, widerrechtlichem oder unsittlichem Inhalt ist nichtig. Die Vertragsfreiheit hat hier ihre Grenzen."
  },

  {
    id: "v04", topic: "vertragsvoraussetzungen", type: "mc", diff: 1, tax: "K1",
    q: "Was ist die Rechtsfolge, wenn eine der drei Vertragsvoraussetzungen nicht erfüllt ist?",
    options: [{v: "A", t: "Der Vertrag ist anfechtbar"}, {v: "B", t: "Der Vertrag ist nichtig"}, {v: "C", t: "Der Vertrag ist gültig, aber der Geschädigte kann Schadenersatz fordern"}, {v: "D", t: "Der Vertrag wird vom Gericht angepasst"}],
    correct: "B",
    explain: "Fehlt eine der drei Voraussetzungen (Willenserklärung, gültiger Inhalt, Form), ist der Vertrag nichtig – er entfaltet von Anfang an keine Wirkung. Dies unterscheidet sich von der Anfechtbarkeit bei Willensmängeln."
  },

  {
    id: "v05", topic: "vertragsvoraussetzungen", type: "mc", diff: 1, tax: "K1",
    q: "Was bedeutet ein Antrag im Vertragsrecht?",
    options: [{v: "A", t: "Ein verbindliches Angebot zum Abschluss eines Vertrags"}, {v: "B", t: "Eine unverbindliche Anfrage"}, {v: "C", t: "Eine Beschwerde beim Gericht"}, {v: "D", t: "Ein Kündigungsschreiben"}],
    correct: "A",
    explain: "Der Antrag (Offerte) nach OR 1 ist ein verbindliches Angebot zum Vertragsabschluss. Zusammen mit der Annahme bildet er die gegenseitige, übereinstimmende Willenserklärung."
  },

  {
    id: "v06", topic: "vertragsvoraussetzungen", type: "mc", diff: 2, tax: "K2",
    q: "Welche Formvorschriften kennt das Schweizer Recht?",
    options: [{v: "A", t: "Nur mündliche und schriftliche Form"}, {v: "B", t: "Einfache Schriftlichkeit, qualifizierte Schriftlichkeit und öffentliche Beurkundung"}, {v: "C", t: "Nur öffentliche Beurkundung"}, {v: "D", t: "Einfache Schriftlichkeit und digitale Signatur"}],
    correct: "B",
    explain: "OR 11 ff. kennt verschiedene Formstufen: (1) Formfreiheit (Grundsatz), (2) einfache Schriftlichkeit, (3) qualifizierte Schriftlichkeit (z.B. eigenhändige Unterschrift), (4) öffentliche Beurkundung (z.B. Grundstückkauf, ZGB 216)."
  },

  {
    id: "v07", topic: "vertragsvoraussetzungen", type: "mc", diff: 2, tax: "K3",
    context: "Fabio und Gina einigen sich mündlich auf den Kauf eines Grundstücks für CHF 500000.",
    q: "Ist der Kaufvertrag gültig?",
    options: [{v: "A", t: "Ja, Formfreiheit gilt auch für Grundstücke"}, {v: "B", t: "Nein, der Grundstückkauf erfordert öffentliche Beurkundung (ZGB 216)"}, {v: "C", t: "Ja, wenn beide einverstanden sind"}, {v: "D", t: "Nein, weil kein Notar anwesend war – er ist aber anfechtbar"}],
    correct: "B",
    explain: "ZGB 216: Der Grundstückkauf erfordert zwingend öffentliche Beurkundung. Ein mündlicher Kaufvertrag über ein Grundstück ist nichtig (nicht bloss anfechtbar). Die Form ist hier eine zwingende Gültigkeitsvoraussetzung."
  },

  {
    id: "v08", topic: "vertragsvoraussetzungen", type: "multi", diff: 2, tax: "K2",
    q: "Welche Vertragsinhalte führen nach OR 19/20 zur Nichtigkeit? (Mehrere Antworten möglich.)",
    options: [{v: "A", t: "Unmöglicher Inhalt"}, {v: "B", t: "Widerrechtlicher Inhalt"}, {v: "C", t: "Unsittlicher Inhalt"}, {v: "D", t: "Für eine Partei wirtschaftlich nachteiliger Inhalt"}],
    correct: ["A", "B", "C"],
    explain: "OR 19/20: Unmöglicher, widerrechtlicher und unsittlicher Inhalt führen zur Nichtigkeit. Ein wirtschaftlich nachteiliger Vertrag ist grundsätzlich gültig (Vertragsfreiheit), kann aber allenfalls wegen Übervorteilung (OR 21) anfechtbar sein."
  },

  {
    id: "v09", topic: "vertragsvoraussetzungen", type: "tf", diff: 2, tax: "K2",
    q: "Parteien können vertraglich eine strengere Form vereinbaren, als das Gesetz vorschreibt.",
    correct: true,
    explain: "OR 16: Die Parteien können frei eine strengere Form vereinbaren (gewillkürte Form). Wenn sie z.B. für einen mündlich gültigen Vertrag Schriftlichkeit vereinbaren, ist die Schriftlichkeit Gültigkeitsvoraussetzung."
  },

  {
    id: "v10", topic: "vertragsvoraussetzungen", type: "fill", diff: 2, tax: "K2",
    q: "Der Grundsatz der Vertragsfreiheit erlaubt es den Parteien, den Inhalt frei zu bestimmen, solange er nicht gegen OR {0} verstösst.",
    blanks: [{answer: "19/20", alts: ["19", "20"]}],
    explain: "OR 19 statuiert die Vertragsfreiheit (Inhaltsfreiheit), OR 20 die Grenzen: Unmöglichkeit, Widerrechtlichkeit, Unsittlichkeit führen zur Nichtigkeit."
  },

  {
    id: "v11", topic: "vertragsvoraussetzungen", type: "mc", diff: 3, tax: "K3",
    context: "Heinrich bestellt telefonisch bei Ilona ein handgefertigtes Möbelstück für CHF 8000. Am Telefon einigen sich beide auf alle Details. Ilona fertigt das Möbelstück an, aber Heinrich verweigert die Zahlung mit der Begründung, es gebe keinen schriftlichen Vertrag.",
    q: "Ist Heinrichs Einwand berechtigt?",
    options: [{v: "A", t: "Ja, ohne schriftlichen Vertrag ist der Vertrag ungültig"}, {v: "B", t: "Nein, für einen Werkvertrag gilt grundsätzlich Formfreiheit (OR 11)"}, {v: "C", t: "Ja, ab CHF 5000 ist Schriftlichkeit erforderlich"}, {v: "D", t: "Nein, aber nur wenn Zeugen anwesend waren"}],
    correct: "B",
    explain: "OR 11: Formfreiheit ist der Grundsatz. Für Werkverträge ist keine besondere Form vorgeschrieben. Der mündliche Vertrag ist gültig, da alle drei Voraussetzungen erfüllt sind: übereinstimmende Willenserklärung, gültiger Inhalt, Form eingehalten (Formfreiheit). Heinrich muss zahlen."
  },

  {
    id: "v12", topic: "vertragsvoraussetzungen", type: "mc", diff: 3, tax: "K4",
    context: "Jan bietet Klara an, ihr Auto für CHF 15000 zu kaufen. Klara antwortet: «Einverstanden, aber für CHF 17000.»",
    q: "Ist ein Vertrag zustande gekommen?",
    options: [{v: "A", t: "Ja, Klara hat angenommen"}, {v: "B", t: "Nein, Klaras Antwort ist ein neuer Antrag (Gegenofferte), nicht eine Annahme"}, {v: "C", t: "Ja, aber zum Durchschnittspreis von CHF 16000"}, {v: "D", t: "Nein, weil kein schriftlicher Vertrag vorliegt"}],
    correct: "B",
    explain: "OR 1: Für einen Vertrag braucht es übereinstimmende Willenserklärungen. Klara hat Jans Antrag nicht angenommen, sondern eine Gegenofferte (neuer Antrag) zu CHF 17000 gemacht. Es ist kein Vertrag zustande gekommen. Jan kann die Gegenofferte annehmen oder ablehnen."
  },

  {
    id: "v13", topic: "vertragsvoraussetzungen", type: "multi", diff: 3, tax: "K3",
    q: "Welche Aussagen zum Unterschied zwischen Nichtigkeit und Anfechtbarkeit sind korrekt?",
    options: [{v: "A", t: "Nichtigkeit: Vertrag entfaltet von Anfang an keine Wirkung"}, {v: "B", t: "Anfechtbarkeit: Vertrag ist gültig bis zur Anfechtung"}, {v: "C", t: "Ein nichtiger Vertrag kann durch Ratifizierung gültig werden"}, {v: "D", t: "Nichtigkeit tritt ein bei fehlenden Vertragsvoraussetzungen, Anfechtbarkeit bei Willensmängeln"}],
    correct: ["A", "B", "D"],
    explain: "A: Nichtigkeit = ab initio unwirksam. B: Anfechtbare Verträge bleiben gültig bis zur Anfechtung. C ist falsch: Nichtige Verträge können nicht geheilt werden. D: Richtig – fehlende Voraussetzungen (OR 1, 19/20, 11 ff.) → Nichtigkeit; Willensmängel (OR 23 ff.) → Anfechtbarkeit."
  },

  {
    id: "w01", topic: "willensmaengel", type: "mc", diff: 1, tax: "K1",
    q: "Welche Arten von Willensmängeln kennt das OR?",
    options: [{v: "A", t: "Übervorteilung, wesentliche Irrtümer, absichtliche Täuschung, Furchterregung"}, {v: "B", t: "Nur wesentliche Irrtümer und Täuschung"}, {v: "C", t: "Formfehler und Inhaltsfehler"}, {v: "D", t: "Nur Furchterregung"}],
    correct: "A",
    explain: "Das OR kennt vier Willensmängel: Übervorteilung (OR 21), wesentliche Irrtümer (OR 23 ff., darunter Erklärungsirrtum OR 24 Abs. 1 Ziff. 1-3 und Grundlagenirrtum OR 24 Abs. 1 Ziff. 4), absichtliche Täuschung (OR 28) und Furchterregung (OR 29)."
  },

  {
    id: "w02", topic: "willensmaengel", type: "tf", diff: 1, tax: "K1",
    q: "Ein Vertrag mit einem Willensmangel ist ab initio nichtig.",
    correct: false,
    explain: "Willensmängel führen zur Anfechtbarkeit, nicht zur Nichtigkeit. Der Vertrag bleibt grundsätzlich gültig, kann aber vom Geschädigten einseitig unverbindlich gemacht werden. Das unterscheidet sich von der Nichtigkeit bei fehlenden Vertragsvoraussetzungen."
  },

  {
    id: "w03", topic: "willensmaengel", type: "fill", diff: 1, tax: "K1",
    q: "Der {0} nach OR 24 Abs. 1 Ziff. 1-3 betrifft einen Irrtum über den Inhalt oder die Natur der Erklärung.",
    blanks: [{answer: "Erklärungsirrtum", alts: ["Erklaerungsirrtum"]}],
    explain: "Der Erklärungsirrtum (OR 24 Abs. 1 Ziff. 1-3) umfasst: Irrtum über die Natur des Vertrags (Ziff. 1), über die Person des Vertragspartners (Ziff. 2), über den Gegenstand (Ziff. 3)."
  },

  {
    id: "w04", topic: "willensmaengel", type: "mc", diff: 1, tax: "K1",
    q: "Was ist die Rechtsfolge bei einem anfechtbaren Vertrag wegen Willensmangels?",
    options: [{v: "A", t: "Der Vertrag wird automatisch aufgelöst"}, {v: "B", t: "Der Geschädigte kann den Vertrag durch einseitige Erklärung als unverbindlich erklären"}, {v: "C", t: "Der Vertrag muss vom Gericht aufgehoben werden"}, {v: "D", t: "Der Vertrag ist von Anfang an nichtig"}],
    correct: "B",
    explain: "Bei Willensmängeln ist der Vertrag anfechtbar: Er bleibt gültig, bis der Geschädigte ihn durch einseitige Erklärung als für sich unverbindlich erklärt. Es braucht kein Gericht dafür."
  },

  {
    id: "w05", topic: "willensmaengel", type: "mc", diff: 1, tax: "K1",
    q: "In welchem Artikel ist die Übervorteilung geregelt?",
    options: [{v: "A", t: "OR 21"}, {v: "B", t: "OR 28"}, {v: "C", t: "OR 29"}, {v: "D", t: "OR 24"}],
    correct: "A",
    explain: "OR 21 regelt die Übervorteilung. OR 23-24 regeln die Irrtümer, OR 28 die absichtliche Täuschung, OR 29 die Furchterregung."
  },

  {
    id: "w06", topic: "willensmaengel", type: "mc", diff: 2, tax: "K2",
    q: "Was ist ein Grundlagenirrtum nach OR 24 Abs. 1 Ziff. 4?",
    options: [{v: "A", t: "Ein Irrtum über eine Tatsache, die von beiden Parteien als Grundlage des Vertrags angenommen wurde"}, {v: "B", t: "Ein Rechenfehler bei der Preiskalkulation"}, {v: "C", t: "Ein Irrtum über das geltende Recht"}, {v: "D", t: "Ein Irrtum über die eigene finanzielle Situation"}],
    correct: "A",
    explain: "Der Grundlagenirrtum (OR 24 Abs. 1 Ziff. 4) liegt vor, wenn sich der Irrende über eine bestimmte Tatsache geirrt hat, die von beiden Parteien als notwendige Grundlage des Vertrags angenommen wurde."
  },

  {
    id: "w07", topic: "willensmaengel", type: "mc", diff: 2, tax: "K3",
    context: "Lisa kauft ein Gemälde für CHF 20000, das beide Parteien für ein Original halten. Später stellt sich heraus, dass es eine Fälschung ist.",
    q: "Welcher Willensmangel liegt vor?",
    options: [{v: "A", t: "Absichtliche Täuschung (OR 28)"}, {v: "B", t: "Erklärungsirrtum (OR 24 Abs. 1 Ziff. 1-3)"}, {v: "C", t: "Grundlagenirrtum (OR 24 Abs. 1 Ziff. 4), weil beide Parteien von der Echtheit ausgingen"}, {v: "D", t: "Übervorteilung (OR 21)"}],
    correct: "C",
    explain: "Beide Parteien gingen von der Echtheit des Gemäldes aus – das ist eine Tatsache, die als Grundlage des Vertrags angenommen wurde. Lisa kann den Vertrag wegen Grundlagenirrtum (OR 24 Abs. 1 Ziff. 4) anfechten. Es liegt keine Täuschung vor, da auch der Verkäufer getäuscht war."
  },

  {
    id: "w08", topic: "willensmaengel", type: "tf", diff: 2, tax: "K2",
    q: "Furchterregung (OR 29) liegt vor, wenn jemand durch Drohung mit einem Übel zum Vertragsabschluss bewegt wird.",
    correct: true,
    explain: "OR 29: Furchterregung liegt vor, wenn eine Partei durch Drohung (Inaussichtstellen eines Übels) zum Vertragsabschluss gebracht wird. Der Bedrohte kann den Vertrag anfechten."
  },

  {
    id: "w09", topic: "willensmaengel", type: "mc", diff: 2, tax: "K3",
    context: "Maria (in finanzieller Notlage) verkauft ihren Oldtimer im Wert von CHF 60000 an Niklaus für CHF 15000. Niklaus nutzt bewusst Marias Notlage aus.",
    q: "Welcher Anfechtungsgrund liegt vor?",
    options: [{v: "A", t: "Grundlagenirrtum"}, {v: "B", t: "Absichtliche Täuschung"}, {v: "C", t: "Übervorteilung (OR 21), weil ein offensichtliches Missverhältnis zwischen Leistung und Gegenleistung vorliegt und die Notlage ausgenutzt wird"}, {v: "D", t: "Furchterregung"}],
    correct: "C",
    explain: "OR 21: Übervorteilung setzt voraus: (1) offensichtliches Missverhältnis zwischen Leistung und Gegenleistung (60000 vs. 15000), (2) Ausnutzung der Notlage, des Leichtsinns oder der Unerfahrenheit. Beides ist hier gegeben. Keine Täuschung oder Drohung."
  },

  {
    id: "w10", topic: "willensmaengel", type: "multi", diff: 2, tax: "K2",
    q: "Welche Aussagen zu den Erklärungsirrtümern nach OR 24 Abs. 1 Ziff. 1-3 sind korrekt?",
    options: [{v: "A", t: "Ziff. 1: Irrtum über die Natur des Vertrags (z.B. Kauf statt Schenkung)"}, {v: "B", t: "Ziff. 2: Irrtum über die Person des Vertragspartners"}, {v: "C", t: "Ziff. 3: Irrtum über den Umfang der Leistung"}, {v: "D", t: "Ziff. 4: Irrtum über den Preis"}],
    correct: ["A", "B", "C"],
    explain: "OR 24 Abs. 1: Ziff. 1 = Irrtum über Natur des Vertrags, Ziff. 2 = Irrtum über Person, Ziff. 3 = Irrtum über Umfang der Leistung. Ziff. 4 regelt den Grundlagenirrtum (nicht Erklärungsirrtum). D ist falsch zugeordnet."
  },

  {
    id: "w11", topic: "willensmaengel", type: "mc", diff: 3, tax: "K3",
    context: "Oliver verkauft Petra ein Auto und behauptet, es sei unfallfrei. Petra kauft das Auto für CHF 25000. Später stellt sich heraus, dass das Auto einen schweren Unfall hatte, was Oliver wusste.",
    q: "Welcher Anfechtungsgrund liegt vor?",
    options: [{v: "A", t: "Grundlagenirrtum, weil Petra sich über den Zustand irrte"}, {v: "B", t: "Absichtliche Täuschung (OR 28), weil Oliver wissentlich falsche Angaben machte"}, {v: "C", t: "Übervorteilung, weil der Preis zu hoch war"}, {v: "D", t: "Erklärungsirrtum über den Gegenstand"}],
    correct: "B",
    explain: "OR 28: Oliver hat Petra absichtlich getäuscht, indem er das Auto als unfallfrei bezeichnete, obwohl er vom Unfall wusste. Absichtliche Täuschung hat Vorrang vor dem Grundlagenirrtum, da hier aktives Täuschungsverhalten vorliegt."
  },

  {
    id: "w12", topic: "willensmaengel", type: "tf", diff: 3, tax: "K3",
    q: "Ein blosser Motivirrtum (z.B. ich kaufe ein Geschenk, aber die Feier findet nicht statt) berechtigt zur Anfechtung des Vertrags.",
    correct: false,
    explain: "Ein blosser Motivirrtum (Irrtum über den Beweggrund) berechtigt nicht zur Anfechtung. Nur wesentliche Irrtümer nach OR 23/24 (Erklärungsirrtum, Grundlagenirrtum) sind anfechtbar. Der Motivirrtum gehört nicht dazu."
  },

  {
    id: "w13", topic: "willensmaengel", type: "fill", diff: 3, tax: "K3",
    q: "Beim Grundlagenirrtum muss die Tatsache von {0} Parteien als Vertragsgrundlage angenommen worden sein, im Gegensatz zum blossen {1}, der nicht zur Anfechtung berechtigt.",
    blanks: [{answer: "beiden", alts: ["beiderseitig", "beidseitig"]}, {answer: "Motivirrtum", alts: ["einseitigen Irrtum"]}],
    explain: "Der Grundlagenirrtum (OR 24 Abs. 1 Ziff. 4) erfordert, dass die irrige Tatsache von beiden Parteien als Vertragsgrundlage angenommen wurde. Ein blosser Motivirrtum (einseitiger Beweggrund) berechtigt nicht zur Anfechtung."
  },

  {
    id: "w14", topic: "willensmaengel", type: "mc", diff: 3, tax: "K4",
    context: "Reto droht Sabine, ihren Ruf öffentlich zu schädigen, wenn sie ihm nicht ihr Ferienhaus für CHF 50000 verkauft (Marktwert CHF 200000). Sabine unterzeichnet aus Angst den Vertrag.",
    q: "Welche Anfechtungsgründe kommen in Betracht?",
    options: [{v: "A", t: "Nur Furchterregung (OR 29)"}, {v: "B", t: "Furchterregung (OR 29) und Übervorteilung (OR 21)"}, {v: "C", t: "Nur Übervorteilung (OR 21)"}, {v: "D", t: "Grundlagenirrtum (OR 24 Abs. 1 Ziff. 4)"}],
    correct: "B",
    explain: "Es liegen zwei Anfechtungsgründe vor: (1) Furchterregung (OR 29): Reto droht mit einem Übel (Rufschädigung). (2) Übervorteilung (OR 21): offensichtliches Missverhältnis (50000 vs. 200000) und Ausnutzung der Zwangslage. Sabine kann den Vertrag auf beiden Grundlagen anfechten."
  },

  {
    id: "f01", topic: "erfuellung", type: "mc", diff: 1, tax: "K1",
    q: "Wer muss eine Obligation grundsätzlich erfüllen (OR 68)?",
    options: [{v: "A", t: "Immer der Schuldner persönlich"}, {v: "B", t: "Der Schuldner, aber nicht zwingend persönlich, wenn die Persönlichkeit keine Rolle spielt"}, {v: "C", t: "Jeder beliebige Dritte"}, {v: "D", t: "Der Gläubiger bestimmt, wer erfüllt"}],
    correct: "B",
    explain: "OR 68: Der Schuldner muss grundsätzlich nur dann persönlich erfüllen, wenn es auf seine Person ankommt. Bei vertretbaren Leistungen kann auch ein Dritter erfüllen."
  },

  {
    id: "f02", topic: "erfuellung", type: "tf", diff: 1, tax: "K1",
    q: "Geldschulden sind Bringschulden – sie sind am Wohnsitz des Gläubigers zu erfüllen.",
    correct: true,
    explain: "OR 74 Abs. 2 Ziff. 1: Geldschulden sind Bringschulden, d.h. der Schuldner muss die Zahlung am Wohnsitz des Gläubigers leisten."
  },

  {
    id: "f03", topic: "erfuellung", type: "fill", diff: 1, tax: "K1",
    q: "Eine Obligation ist grundsätzlich {0} nach ihrer Entstehung fällig und erfüllbar (OR 75).",
    blanks: [{answer: "sofort", alts: ["unmittelbar", "gleich"]}],
    explain: "OR 75: Ist kein abweichender Fälligkeitstermin vereinbart, ist die Obligation unmittelbar nach ihrer Entstehung fällig und erfüllbar."
  },

  {
    id: "f04", topic: "erfuellung", type: "mc", diff: 1, tax: "K1",
    q: "Wo ist eine Speziesschuld (bestimmte Sache) zu erfüllen?",
    options: [{v: "A", t: "Am Wohnsitz des Schuldners"}, {v: "B", t: "Am Wohnsitz des Gläubigers"}, {v: "C", t: "Dort, wo sich die Sache zur Zeit des Vertragsabschlusses befand (OR 74 Abs. 2 Ziff. 2)"}, {v: "D", t: "Am Ort des Vertragsabschlusses"}],
    correct: "C",
    explain: "OR 74 Abs. 2 Ziff. 2: Speziesschulden (individuell bestimmte Sachen) sind dort zu erfüllen, wo sich die Sache zur Zeit des Vertragsabschlusses befand. Der Gläubiger muss sie dort abholen (Holschuld)."
  },

  {
    id: "f05", topic: "erfuellung", type: "mc", diff: 1, tax: "K1",
    q: "Was ist der Erfüllungsort bei einer Gattungsschuld?",
    options: [{v: "A", t: "Am Wohnsitz des Gläubigers"}, {v: "B", t: "Am Wohnsitz des Schuldners bei Entstehung der Schuld (OR 74 Abs. 2 Ziff. 3)"}, {v: "C", t: "Am Ort, wo die Ware produziert wurde"}, {v: "D", t: "Am nächstgelegenen Marktplatz"}],
    correct: "B",
    explain: "OR 74 Abs. 2 Ziff. 3: Gattungsschulden sind am Wohnsitz des Schuldners zu erfüllen, den er beim Entstehen der Schuld hatte. Der Gläubiger muss die Ware dort abholen."
  },

  {
    id: "f06", topic: "erfuellung", type: "multi", diff: 2, tax: "K2",
    q: "Welche Zuordnungen Erfüllungsort–Schuldart sind nach OR 74 korrekt?",
    options: [{v: "A", t: "Geldschuld → Wohnsitz des Gläubigers (Bringschuld)"}, {v: "B", t: "Speziesschuld → Standort der Sache (Holschuld)"}, {v: "C", t: "Gattungsschuld → Wohnsitz des Schuldners"}, {v: "D", t: "Geldschuld → Wohnsitz des Schuldners"}],
    correct: ["A", "B", "C"],
    explain: "OR 74 Abs. 2: Geldschulden = Bringschuld zum Gläubiger (Ziff. 1). Speziesschuld = Holschuld am Standort der Sache (Ziff. 2). Gattungsschuld = am Wohnsitz des Schuldners (Ziff. 3). D ist falsch."
  },

  {
    id: "f07", topic: "erfuellung", type: "mc", diff: 2, tax: "K3",
    context: "Thomas schuldet Ursula ein bestimmtes antikes Klavier. Das Klavier steht in Bern. Thomas wohnt in Zürich, Ursula in Basel. Es wurde kein Erfüllungsort vereinbart.",
    q: "Wo muss Thomas das Klavier übergeben?",
    options: [{v: "A", t: "In Zürich (Wohnsitz des Schuldners)"}, {v: "B", t: "In Basel (Wohnsitz der Gläubigerin)"}, {v: "C", t: "In Bern (wo sich das Klavier befindet)"}, {v: "D", t: "An einem neutralen Ort"}],
    correct: "C",
    explain: "OR 74 Abs. 2 Ziff. 2: Bei einer Speziesschuld ist der Erfüllungsort dort, wo sich die Sache beim Vertragsschluss befindet – also in Bern. Ursula muss das Klavier dort abholen (Holschuld)."
  },

  {
    id: "f08", topic: "erfuellung", type: "tf", diff: 2, tax: "K2",
    q: "Bei einer Gattungsschuld hat der Schuldner grundsätzlich die Auswahl, welche Sache aus der Gattung er liefert (OR 71).",
    correct: true,
    explain: "OR 71: Bei einer Gattungsschuld hat der Schuldner die Wahl, welche Sache er aus der Gattung liefert, sofern nichts anderes vereinbart wurde. Er muss jedoch mindestens mittlere Qualität liefern."
  },

  {
    id: "f09", topic: "erfuellung", type: "fill", diff: 2, tax: "K2",
    q: "Der Unterschied zwischen vertretbaren und nicht vertretbaren Sachen ist: Vertretbare Sachen sind nach Art, Zahl, Mass oder {0} bestimmt, nicht vertretbare sind {1} bestimmt.",
    blanks: [{answer: "Gewicht", alts: ["Mass"]}, {answer: "individuell", alts: ["einzeln", "konkret"]}],
    explain: "Vertretbare Sachen sind nach Gattungsmerkmalen bestimmt (oft Gattungsschulden). Nicht vertretbare Sachen sind individuell bestimmt (Speziesschulden). Diese Unterscheidung beeinflusst Erfüllungsort und Ersetzbarkeit."
  },

  {
    id: "f10", topic: "erfuellung", type: "mc", diff: 2, tax: "K3",
    context: "Vera schuldet Werner CHF 5000 aus einem Darlehen. Sie vereinbaren keinen Fälligkeitstermin.",
    q: "Wann ist die Schuld fällig?",
    options: [{v: "A", t: "Nach 30 Tagen"}, {v: "B", t: "Sofort nach Entstehung der Obligation (OR 75)"}, {v: "C", t: "Erst wenn Werner mahnt"}, {v: "D", t: "Nach einem Jahr"}],
    correct: "B",
    explain: "OR 75: Ist kein Fälligkeitstermin vereinbart, ist die Schuld sofort nach Entstehung fällig und erfüllbar. Werner kann die Rückzahlung sofort verlangen."
  },

  {
    id: "f11", topic: "erfuellung", type: "mc", diff: 3, tax: "K3",
    context: "Ein Bäcker schuldet einem Restaurant 50 kg Mehl (Gattungsschuld). Der Bäcker wohnt in Luzern, das Restaurant ist in Bern. Kein Erfüllungsort vereinbart. Der Bäcker schickt das Mehl per Post nach Bern.",
    q: "Wer trägt das Transportrisiko?",
    options: [{v: "A", t: "Der Bäcker, weil er die Ware versenden muss"}, {v: "B", t: "Das Restaurant, weil es die Ware am Wohnsitz des Schuldners hätte abholen müssen (Holschuld nach OR 74 Abs. 2 Ziff. 3)"}, {v: "C", t: "Die Post als Transporteur"}, {v: "D", t: "Beide Parteien je zur Hälfte"}],
    correct: "B",
    explain: "OR 74 Abs. 2 Ziff. 3: Bei Gattungsschulden ist der Erfüllungsort am Wohnsitz des Schuldners (Luzern). Das Restaurant müsste das Mehl dort abholen. Sendet der Bäcker es freiwillig, geht das Transportrisiko grundsätzlich auf den Gläubiger (Restaurant) über, sobald der Schuldner die Ware dem Transporteur übergeben hat."
  },

  {
    id: "f12", topic: "erfuellung", type: "multi", diff: 3, tax: "K3",
    q: "Welche Aussagen zur Erfüllung von Obligationen sind korrekt?",
    options: [{v: "A", t: "Persönliche Erfüllung ist nur nötig, wenn es auf die Person des Schuldners ankommt (OR 68)"}, {v: "B", t: "Der Gläubiger kann die Leistung nur an sich selbst fordern"}, {v: "C", t: "Bei Geldschulden gilt: Bringschuld zum Gläubiger"}, {v: "D", t: "Fälligkeit kann durch Parteivereinbarung vom Grundsatz abweichen"}],
    correct: ["A", "C", "D"],
    explain: "A: OR 68, korrekt. B: Grundsätzlich richtig, aber Stellvertretung ist möglich. C: OR 74 Abs. 2 Ziff. 1, korrekt. D: OR 75, korrekt – Parteien können abweichende Fälligkeit vereinbaren."
  },

  {
    id: "f13", topic: "erfuellung", type: "tf", diff: 3, tax: "K4",
    q: "Bei einer Speziesschuld kann der Schuldner eine gleichwertige Ersatzsache liefern, wenn die geschuldete Sache beschädigt wird.",
    correct: false,
    explain: "Bei einer Speziesschuld ist genau die vereinbarte, individuell bestimmte Sache geschuldet. Der Schuldner kann nicht einfach eine gleichwertige Ersatzsache liefern. Wird die Sache unverschuldet zerstört, greift OR 119 (Unmöglichwerden)."
  },

  {
    id: "s01", topic: "sicherung", type: "mc", diff: 1, tax: "K1",
    q: "Was ist der Unterschied zwischen Personalsicherheiten und Realsicherheiten?",
    options: [{v: "A", t: "Personalsicherheiten: Eine Person steht ein. Realsicherheiten: Eine Sache oder ein Geldbetrag dient als Sicherheit."}, {v: "B", t: "Personalsicherheiten sind teurer als Realsicherheiten"}, {v: "C", t: "Realsicherheiten sind nur für Unternehmen"}, {v: "D", t: "Es gibt keinen Unterschied"}],
    correct: "A",
    explain: "Personalsicherheiten (Konventionalstrafe, Reuegeld, Bürgschaft): Eine Person übernimmt eine zusätzliche Verpflichtung. Realsicherheiten (Kaution, Retentionsrecht, Pfand, Eigentumsvorbehalt): Ein Gegenstand oder Geldbetrag dient als Sicherheit."
  },

  {
    id: "s02", topic: "sicherung", type: "tf", diff: 1, tax: "K1",
    q: "Die Konventionalstrafe ist eine Schadenersatzzahlung.",
    correct: false,
    explain: "OR 160 ff.: Die Konventionalstrafe ist keine Schadenersatzzahlung, sondern ein Versprechen einer Geldsumme bei Nichterfüllung, Schlechterfüllung oder verspäteter Erfüllung. Der Gläubiger kann entweder die Erfüllung oder die Konventionalstrafe verlangen (OR 160 Abs. 1)."
  },

  {
    id: "s03", topic: "sicherung", type: "fill", diff: 1, tax: "K1",
    q: "Das {0} nach OR 158 Abs. 3 erlaubt es einer Partei, gegen Bezahlung eines Entgelts vom Vertrag zurückzutreten.",
    blanks: [{answer: "Reuegeld", alts: ["Reugeld"]}],
    explain: "OR 158 Abs. 3: Das Reuegeld ist ein vereinbartes Entgelt, das eine Partei zahlen kann, um vom Vertrag zurückzutreten."
  },

  {
    id: "s04", topic: "sicherung", type: "mc", diff: 1, tax: "K1",
    q: "Was ist eine Bürgschaft nach OR 492?",
    options: [{v: "A", t: "Eine Sicherheit durch Hinterlegung von Geld"}, {v: "B", t: "Ein Vertrag, bei dem sich ein Bürge gegenüber dem Gläubiger verpflichtet, für die Schuld des Hauptschuldners einzustehen"}, {v: "C", t: "Ein Eigentumsrecht an einer Sache"}, {v: "D", t: "Eine Versicherungspolice"}],
    correct: "B",
    explain: "OR 492: Die Bürgschaft ist ein Vertrag, durch den sich der Bürge gegenüber dem Gläubiger des Hauptschuldners verpflichtet, für dessen Schuld einzustehen."
  },

  {
    id: "s05", topic: "sicherung", type: "mc", diff: 1, tax: "K1",
    q: "Welche Formvorschrift gilt für die Bürgschaft (OR 493)?",
    options: [{v: "A", t: "Mündliche Form genügt"}, {v: "B", t: "Schriftliche Form mit Angabe des Höchstbetrags"}, {v: "C", t: "Öffentliche Beurkundung"}, {v: "D", t: "Keine Formvorschrift"}],
    correct: "B",
    explain: "OR 493: Die Bürgschaft bedarf der schriftlichen Form, und der Höchstbetrag der Haftung muss festgehalten werden. Der Bürge haftet nur bis zu diesem Höchstbetrag (OR 499)."
  },

  {
    id: "s06", topic: "sicherung", type: "mc", diff: 2, tax: "K2",
    q: "Was unterscheidet die einfache Bürgschaft (OR 492) von der Solidarbürgschaft (OR 496)?",
    options: [{v: "A", t: "Bei der Solidarbürgschaft kann der Gläubiger den Bürgen schon nach Mahnung des Hauptschuldners belangen"}, {v: "B", t: "Die einfache Bürgschaft erfordert keine schriftliche Form"}, {v: "C", t: "Die Solidarbürgschaft hat keinen Höchstbetrag"}, {v: "D", t: "Es gibt keinen Unterschied"}],
    correct: "A",
    explain: "Einfache Bürgschaft (OR 492): Bürge kann erst bei Zahlungsunfähigkeit des Hauptschuldners belangt werden. Solidarbürgschaft (OR 496): Bürge kann schon nach Mahnung des Hauptschuldners belangt werden – stärkerer Schutz für den Gläubiger."
  },

  {
    id: "s07", topic: "sicherung", type: "mc", diff: 2, tax: "K2",
    q: "Was ist das Retentionsrecht nach OR 895?",
    options: [{v: "A", t: "Das Recht des Gläubigers, eine Sache des Schuldners zurückzubehalten, bis die fällige Forderung befriedigt ist"}, {v: "B", t: "Das Recht, eine Sache zu verkaufen"}, {v: "C", t: "Ein Vorkaufsrecht"}, {v: "D", t: "Das Recht auf Rücktritt vom Vertrag"}],
    correct: "A",
    explain: "OR 895: Das Retentionsrecht (Zurückbehaltungsrecht) erlaubt dem Gläubiger, eine dem Schuldner gehörende Sache, die sich in seiner Gewalt befindet, zurückzubehalten, bis die fällige Forderung befriedigt ist. Es entspricht einem gesetzlichen Pfandrecht."
  },

  {
    id: "s08", topic: "sicherung", type: "multi", diff: 2, tax: "K2",
    q: "Welche gehören zu den Realsicherheiten? (Mehrere Antworten möglich.)",
    options: [{v: "A", t: "Kaution"}, {v: "B", t: "Konventionalstrafe"}, {v: "C", t: "Pfandrechte (Fahrnispfand, Grundpfand)"}, {v: "D", t: "Eigentumsvorbehalt"}],
    correct: ["A", "C", "D"],
    explain: "Realsicherheiten: Kaution (hinterlegter Geldbetrag), Retentionsrecht (OR 895), Pfandrechte (Fahrnispfand ZGB 884, Grundpfand ZGB 836), Eigentumsvorbehalt (ZGB 715). Die Konventionalstrafe ist eine Personalsicherheit."
  },

  {
    id: "s09", topic: "sicherung", type: "tf", diff: 2, tax: "K2",
    q: "Der Eigentumsvorbehalt wirkt auch gegenüber gutgläubigen Dritten, ohne dass er im Register eingetragen sein muss.",
    correct: false,
    explain: "ZGB 715 ff.: Ohne Eintragung im Eigentumsvorbehaltsregister wirkt der Eigentumsvorbehalt nur zwischen den Parteien. Gegenüber Dritten ist er nur wirksam, wenn er eingetragen ist. Der gutgläubige Erwerber wird ohne Eintragung geschützt."
  },

  {
    id: "s10", topic: "sicherung", type: "fill", diff: 2, tax: "K2",
    q: "Die Kaution im Mietrecht ist in OR {0} geregelt, im Arbeitsrecht in OR {1}.",
    blanks: [{answer: "257e", alts: ["257 e"]}, {answer: "330", alts: []}],
    explain: "OR 257e regelt die Mietkaution (Sicherheitsleistung des Mieters), OR 330 die Kaution des Arbeitnehmers. In beiden Fällen wird eine Geldsumme als Sicherheit bei einer neutralen Stelle hinterlegt."
  },

  {
    id: "s11", topic: "sicherung", type: "mc", diff: 3, tax: "K3",
    context: "Ein Automechaniker repariert das Auto von Frau Weber für CHF 3000. Frau Weber kann nicht bezahlen. Das Auto steht noch in der Werkstatt.",
    q: "Welches Sicherungsmittel kann der Mechaniker anwenden?",
    options: [{v: "A", t: "Konventionalstrafe"}, {v: "B", t: "Retentionsrecht (OR 895) – er kann das Auto zurückbehalten, bis Frau Weber bezahlt"}, {v: "C", t: "Eigentumsvorbehalt"}, {v: "D", t: "Bürgschaft einfordern"}],
    correct: "B",
    explain: "OR 895: Der Mechaniker kann das Retentionsrecht ausüben und das Auto zurückbehalten, bis die fällige Forderung (CHF 3000) beglichen ist. Die Voraussetzungen sind erfüllt: fällige Forderung, Sache des Schuldners in der Gewalt des Gläubigers."
  },

  {
    id: "s12", topic: "sicherung", type: "mc", diff: 3, tax: "K3",
    context: "Ein Möbelhaus verkauft einen Schrank unter Eigentumsvorbehalt (nicht im Register eingetragen) an Herrn Keller. Dieser verkauft den Schrank weiter an Frau Lang, die nichts vom Eigentumsvorbehalt weiss.",
    q: "Wem gehört der Schrank?",
    options: [{v: "A", t: "Dem Möbelhaus, weil der Eigentumsvorbehalt gilt"}, {v: "B", t: "Herrn Keller, weil er den Schrank erworben hat"}, {v: "C", t: "Frau Lang, weil sie gutgläubig erworben hat und der Eigentumsvorbehalt nicht registriert war"}, {v: "D", t: "Niemandem, der Vertrag ist nichtig"}],
    correct: "C",
    explain: "ZGB 715 ff.: Ohne Eintragung im Register wirkt der Eigentumsvorbehalt nicht gegenüber gutgläubigen Dritten. Frau Lang hat gutgläubig erworben und wird Eigentümerin. Das Möbelhaus hat seinen Eigentumsschutz verloren."
  },

  {
    id: "s13", topic: "sicherung", type: "multi", diff: 3, tax: "K3",
    q: "Welche Aussagen zur Bürgschaft sind korrekt?",
    options: [{v: "A", t: "Die Bürgschaft erfordert schriftliche Form und Höchstbetrag (OR 493)"}, {v: "B", t: "Der Bürge haftet unbegrenzt"}, {v: "C", t: "Bei der Solidarbürgschaft kann der Bürge nach Mahnung des Hauptschuldners belangt werden"}, {v: "D", t: "Die Konventionalstrafe für die Bürgschaft bedarf derselben Form wie die Hauptobligation"}],
    correct: ["A", "C", "D"],
    explain: "A: OR 493, korrekt. B: Falsch – der Bürge haftet nur bis zum Höchstbetrag (OR 499). C: OR 496, korrekt. D: Korrekt – die Konventionalstrafe unterliegt denselben Formvorschriften wie die zugehörige Obligation."
  },

  {
    id: "s14", topic: "sicherung", type: "tf", diff: 3, tax: "K3",
    q: "Der Gläubiger kann bei der Konventionalstrafe sowohl die Erfüllung als auch die Konventionalstrafe verlangen.",
    correct: false,
    explain: "OR 160 Abs. 1: Der Gläubiger kann jeweils entweder die Erfüllung der Obligation oder die Konventionalstrafe fordern – nicht beides gleichzeitig. Er muss sich entscheiden."
  },

  {
    id: "l01", topic: "erloeschen", type: "mc", diff: 1, tax: "K1",
    q: "Auf wie viele Arten kann eine Obligation erlöschen?",
    options: [{v: "A", t: "3"}, {v: "B", t: "5"}, {v: "C", t: "7"}, {v: "D", t: "10"}],
    correct: "C",
    explain: "Eine Obligation kann auf 7 Arten erlöschen: Erfüllung (OR 68), Übereinkunft/Erlass (OR 115), Neuerung (OR 116), Vereinigung (OR 118), Unmöglichwerden (OR 119), Verrechnung (OR 120), Verjährung (OR 127 ff.)."
  },

  {
    id: "l02", topic: "erloeschen", type: "tf", diff: 1, tax: "K1",
    q: "Die Verjährung einer Forderung bedeutet, dass die Forderung nicht mehr existiert.",
    correct: false,
    explain: "OR 127 ff.: Eine verjährte Forderung besteht weiterhin, kann aber vom Schuldner verweigert werden (Einrede der Verjährung). Gerichte berücksichtigen die Verjährung nicht von Amtes wegen. Eine freiwillig bezahlte verjährte Forderung ist keine ungerechtfertigte Bereicherung."
  },

  {
    id: "l03", topic: "erloeschen", type: "fill", diff: 1, tax: "K1",
    q: "Beim {0} (OR 115) einigen sich Gläubiger und Schuldner, dass der Schuldner nicht mehr leisten muss.",
    blanks: [{answer: "Erlass", alts: ["Übereinkunft", "Uebereinkunft"]}],
    explain: "OR 115: Der Erlass (Übereinkunft) ist die einvernehmliche Aufhebung der Obligation. Gläubiger und Schuldner vereinbaren, dass die Schuld erlischt."
  },

  {
    id: "l04", topic: "erloeschen", type: "mc", diff: 1, tax: "K1",
    q: "Was ist eine Neuerung (Novation) nach OR 116?",
    options: [{v: "A", t: "Die Tilgung einer alten Schuld durch Begründung einer neuen Schuld"}, {v: "B", t: "Die Verlängerung einer Frist"}, {v: "C", t: "Die Teilzahlung einer Schuld"}, {v: "D", t: "Die Übertragung einer Forderung auf einen Dritten"}],
    correct: "A",
    explain: "OR 116: Die Neuerung (Novation) ist die Tilgung einer alten Schuld durch Begründung einer neuen. Die alte Obligation erlischt, eine neue tritt an ihre Stelle."
  },

  {
    id: "l05", topic: "erloeschen", type: "mc", diff: 1, tax: "K1",
    q: "Wie lange beträgt die allgemeine Verjährungsfrist nach OR 127?",
    options: [{v: "A", t: "3 Jahre"}, {v: "B", t: "5 Jahre"}, {v: "C", t: "10 Jahre"}, {v: "D", t: "20 Jahre"}],
    correct: "C",
    explain: "OR 127: Die allgemeine Verjährungsfrist beträgt 10 Jahre. Spezialgesetze können kürzere Fristen vorsehen."
  },

  {
    id: "l06", topic: "erloeschen", type: "mc", diff: 2, tax: "K2",
    q: "Was passiert bei der Vereinigung (OR 118)?",
    options: [{v: "A", t: "Zwei Parteien fusionieren ihre Unternehmen"}, {v: "B", t: "Gläubiger und Schuldner werden zu einer Person, wodurch die Obligation erlischt"}, {v: "C", t: "Zwei Forderungen werden zusammengelegt"}, {v: "D", t: "Ein neuer Vertrag wird geschlossen"}],
    correct: "B",
    explain: "OR 118: Die Vereinigung tritt ein, wenn Gläubiger und Schuldner in einer Person zusammenfallen (z.B. durch Erbfolge oder Fusion). Es macht keinen Sinn, sich selbst etwas zu schulden – die Obligation erlischt."
  },

  {
    id: "l07", topic: "erloeschen", type: "mc", diff: 2, tax: "K2",
    q: "Welche Voraussetzungen müssen für eine Verrechnung nach OR 120 vorliegen?",
    options: [{v: "A", t: "Gegenseitige, fällige, gleichartige Forderungen"}, {v: "B", t: "Nur Geldforderungen"}, {v: "C", t: "Die Zustimmung beider Parteien"}, {v: "D", t: "Ein richterliches Urteil"}],
    correct: "A",
    explain: "OR 120: Verrechnung setzt voraus: (1) Gegenseitigkeit (beide Parteien sind einander Gläubiger und Schuldner), (2) Fälligkeit beider Forderungen, (3) Gleichartigkeit (z.B. beide Geld). Die Verrechnung erfolgt durch einseitige Erklärung."
  },

  {
    id: "l08", topic: "erloeschen", type: "tf", diff: 2, tax: "K2",
    q: "Die Verjährungsfrist kann durch Anerkennung der Schuld durch den Schuldner unterbrochen werden (OR 135).",
    correct: true,
    explain: "OR 135: Die Verjährung wird unterbrochen durch Schuldanerkennung (z.B. Abschlagszahlung, schriftliche Bestätigung) oder durch Klageerhebung/Betreibung des Gläubigers. Nach Unterbrechung beginnt die Frist neu zu laufen (OR 137)."
  },

  {
    id: "l09", topic: "erloeschen", type: "fill", diff: 2, tax: "K2",
    q: "Die Verjährungsfrist beginnt mit der {0} der Forderung zu laufen (OR 130).",
    blanks: [{answer: "Fälligkeit", alts: ["Faelligkeit"]}],
    explain: "OR 130: Die Verjährungsfrist beginnt mit der Fälligkeit der Forderung. Ab diesem Zeitpunkt kann der Gläubiger die Leistung fordern und die Verjährung läuft."
  },

  {
    id: "l10", topic: "erloeschen", type: "multi", diff: 2, tax: "K2",
    q: "Welche Aussagen zum Erlöschen von Obligationen sind korrekt?",
    options: [{v: "A", t: "Erfüllung (OR 68) ist die häufigste Art des Erlöschens"}, {v: "B", t: "Unmöglichwerden (OR 119) setzt nachträgliche und unverschuldete Unmöglichkeit voraus"}, {v: "C", t: "Die Verjährung löscht die Forderung vollständig aus"}, {v: "D", t: "Die Verrechnung erfordert die Zustimmung beider Parteien"}],
    correct: ["A", "B"],
    explain: "A: Korrekt, Erfüllung ist der Regelfall. B: OR 119 greift nur bei nachträglicher und unverschuldeter Unmöglichkeit. C: Falsch – die Forderung besteht weiter, kann aber verweigert werden. D: Falsch – Verrechnung erfolgt durch einseitige Erklärung (OR 120)."
  },

  {
    id: "l11", topic: "erloeschen", type: "mc", diff: 3, tax: "K3",
    context: "Sohn erbt von seinem Vater ein Haus. Gleichzeitig hatte der Sohn dem Vater CHF 50000 geliehen.",
    q: "Was geschieht mit der Darlehensforderung des Sohnes gegen den Vater?",
    options: [{v: "A", t: "Der Sohn kann die CHF 50000 aus dem Erbe einfordern"}, {v: "B", t: "Die Forderung erlischt durch Vereinigung (OR 118), da Gläubiger und Schuldner in einer Person zusammenfallen"}, {v: "C", t: "Die Forderung bleibt bestehen, da Erbfolge nichts ändert"}, {v: "D", t: "Die Forderung verjährt automatisch"}],
    correct: "B",
    explain: "OR 118: Durch die Erbfolge wird der Sohn Rechtsnachfolger des Vaters. Er ist nun gleichzeitig Gläubiger (der Darlehensforderung) und Schuldner (als Erbe). Die Obligation erlischt durch Vereinigung – man kann sich nicht selbst etwas schulden."
  },

  {
    id: "l12", topic: "erloeschen", type: "mc", diff: 3, tax: "K3",
    q: "Welche drei Varianten der Unmöglichkeit sind zu unterscheiden?",
    options: [{v: "A", t: "Ursprünglich (OR 20 = kein Vertrag), nachträglich unverschuldet (OR 119 = Erlöschen), nachträglich verschuldet (OR 97 = Schadenersatz)"}, {v: "B", t: "Leichte, mittlere und schwere Unmöglichkeit"}, {v: "C", t: "Vorübergehende, dauernde und teilweise Unmöglichkeit"}, {v: "D", t: "Es gibt nur eine Art von Unmöglichkeit"}],
    correct: "A",
    explain: "Drei Varianten: (1) Ursprüngliche/objektive Unmöglichkeit (OR 20): Vertrag kommt gar nicht zustande (nichtig). (2) Nachträgliche unverschuldete Unmöglichkeit (OR 119): Obligation erlischt, Schuldner frei. (3) Nachträgliche verschuldete Unmöglichkeit (OR 97): Schuldner schuldet Schadenersatz."
  },

  {
    id: "l13", topic: "erloeschen", type: "tf", diff: 3, tax: "K3",
    q: "Wer eine verjährte Forderung freiwillig bezahlt, kann das Geleistete als ungerechtfertigte Bereicherung zurückfordern.",
    correct: false,
    explain: "OR 127 ff.: Eine verjährte Forderung besteht weiterhin (Naturalobligation). Wer sie freiwillig bezahlt, leistet auf eine bestehende Schuld – es liegt keine ungerechtfertigte Bereicherung vor. Das Geleistete kann nicht zurückgefordert werden."
  },

  {
    id: "l14", topic: "erloeschen", type: "mc", diff: 3, tax: "K3",
    context: "A schuldet B CHF 8000 aus einem Kaufvertrag. B schuldet A CHF 5000 aus einem Darlehen. Beide Forderungen sind fällig.",
    q: "Was geschieht bei einer Verrechnung?",
    options: [{v: "A", t: "Beide Forderungen erlöschen vollständig"}, {v: "B", t: "Beide Forderungen erlöschen in Höhe von CHF 5000; A schuldet B noch CHF 3000"}, {v: "C", t: "Nur die grössere Forderung erlischt"}, {v: "D", t: "Verrechnung ist nicht möglich, weil die Beträge unterschiedlich sind"}],
    correct: "B",
    explain: "OR 120: Bei der Verrechnung erlöschen beide Forderungen in der Höhe der kleineren Forderung (CHF 5000). Es bleibt ein Restbetrag: A schuldet B noch CHF 3000 (8000 - 5000)."
  },

  {
    id: "l15", topic: "erloeschen", type: "fill", diff: 3, tax: "K3",
    q: "Die Verjährung kann durch {0} des Gläubigers oder {1} der Schuld durch den Schuldner unterbrochen werden (OR 135).",
    blanks: [{answer: "Betreibung", alts: ["Klage", "Klageerhebung"]}, {answer: "Anerkennung", alts: ["Schuldanerkennung"]}],
    explain: "OR 135: Unterbrechungsgründe: (1) Gläubiger: Betreibung oder Einreichung der Zivilklage. (2) Schuldner: Anerkennung der Forderung (z.B. Abschlagszahlung, schriftliche Bestätigung). Nach Unterbrechung läuft die Frist neu (OR 137)."
  },

  {
    id: "t01", topic: "stoerung", type: "mc", diff: 1, tax: "K1",
    q: "Von welchen Seiten kann die Vertragserfüllung gestört werden?",
    options: [{v: "A", t: "Nur vom Schuldner"}, {v: "B", t: "Vom Gläubiger (Gläubigerverzug) und vom Schuldner (Schuldnerverzug, Schlechterfüllung, Nichterfüllung)"}, {v: "C", t: "Nur vom Gläubiger"}, {v: "D", t: "Von einem Dritten"}],
    correct: "B",
    explain: "Die Erfüllung kann von beiden Seiten gestört werden: Gläubiger (Gläubigerverzug, OR 91 ff.) und Schuldner (Schuldnerverzug OR 102 ff., Schlechterfüllung OR 97/197 ff., Nichterfüllung OR 97)."
  },

  {
    id: "t02", topic: "stoerung", type: "tf", diff: 1, tax: "K1",
    q: "Beim Schuldnerverzug ist grundsätzlich eine Mahnung erforderlich (OR 102 Abs. 1).",
    correct: true,
    explain: "OR 102 Abs. 1: Der Gläubiger muss den Schuldner grundsätzlich durch Mahnung in Verzug setzen. Ausnahmen: Verfalltag (OR 102 Abs. 2) und Fixgeschäft (OR 108) – dort ist keine Mahnung nötig."
  },

  {
    id: "t03", topic: "stoerung", type: "fill", diff: 1, tax: "K1",
    q: "Der gesetzliche Verzugszins bei Geldschulden beträgt {0} pro Jahr.",
    blanks: [{answer: "5%", alts: ["5 Prozent", "fünf Prozent", "5 %"]}],
    explain: "OR 104: Der Verzugszins beträgt 5% pro Jahr für Geldschulden, sofern vertraglich nichts anderes vereinbart ist."
  },

  {
    id: "t04", topic: "stoerung", type: "mc", diff: 1, tax: "K1",
    q: "Was ist ein Fixgeschäft nach OR 108?",
    options: [{v: "A", t: "Ein Geschäft mit festem Preis"}, {v: "B", t: "Ein Geschäft, bei dem die rechtzeitige Erfüllung wesentlich ist"}, {v: "C", t: "Ein Geschäft ohne Rücktrittsrecht"}, {v: "D", t: "Ein Geschäft mit fester Laufzeit"}],
    correct: "B",
    explain: "OR 108: Beim Fixgeschäft ist die rechtzeitige Erfüllung so wesentlich, dass verspätete Erfüllung für den Gläubiger wertlos ist. Beispiel: Hochzeitstorte, die am Tag nach der Hochzeit geliefert wird. Keine Nachfrist nötig."
  },

  {
    id: "t05", topic: "stoerung", type: "mc", diff: 1, tax: "K1",
    q: "Was versteht man unter Sachgewährleistung?",
    options: [{v: "A", t: "Die Pflicht des Verkäufers, für zugesicherte Eigenschaften und Mängelfreiheit der Kaufsache einzustehen"}, {v: "B", t: "Eine Garantie des Herstellers"}, {v: "C", t: "Eine Versicherung gegen Sachschäden"}, {v: "D", t: "Die Pflicht des Käufers, die Ware zu prüfen"}],
    correct: "A",
    explain: "OR 197 ff.: Die Sachgewährleistung ist die Pflicht des Verkäufers, dafür einzustehen, dass die Kaufsache die zugesicherten Eigenschaften hat (OR 197 Abs. 1) und keine Mängel aufweist, die ihren Wert oder Nutzen aufheben oder mindern."
  },

  {
    id: "t06", topic: "stoerung", type: "mc", diff: 2, tax: "K2",
    q: "Welche Wahlrechte hat der Gläubiger bei zweiseitigen Verträgen nach fruchtloser Nachfrist (OR 107 Abs. 2)?",
    options: [{v: "A", t: "Nur Rücktritt"}, {v: "B", t: "Beharren auf Erfüllung + SE, Verzicht auf Leistung + SE, oder Rücktritt + SE"}, {v: "C", t: "Nur Schadenersatz"}, {v: "D", t: "Verlängerung der Nachfrist"}],
    correct: "B",
    explain: "OR 107 Abs. 2: Nach fruchtloser Nachfrist hat der Gläubiger drei Wahlrechte: (1) Auf Erfüllung beharren und Verspätungsschaden verlangen, (2) Auf nachträgliche Leistung verzichten und SE wegen Nichterfüllung, (3) Vom Vertrag zurücktreten und SE (OR 109)."
  },

  {
    id: "t07", topic: "stoerung", type: "fill", diff: 2, tax: "K2",
    q: "Bei Schuldnerverzug bei zweiseitigen Verträgen muss der Gläubiger dem Schuldner zunächst eine {0} setzen (OR 107 Abs. 1).",
    blanks: [{answer: "Nachfrist", alts: ["angemessene Nachfrist", "Frist"]}],
    explain: "OR 107 Abs. 1: Vor Ausübung der Wahlrechte muss der Gläubiger dem Schuldner eine angemessene Nachfrist zur nachträglichen Erfüllung setzen. Ausnahme: Bei Fixgeschäften (OR 108) ist keine Nachfrist nötig."
  },

  {
    id: "t08", topic: "stoerung", type: "mc", diff: 2, tax: "K3",
    context: "Ein Kunde bestellt bei einem Online-Shop ein Smartphone. Bei Erhalt stellt er fest, dass das Display einen Kratzer hat. Er meldet dies sofort dem Verkäufer.",
    q: "Welche Rechte hat der Kunde bei diesem Sachmangel?",
    options: [{v: "A", t: "Wandelung, Minderung oder Ersatzlieferung (OR 205/206)"}, {v: "B", t: "Nur Rücktritt"}, {v: "C", t: "Nur Reparatur"}, {v: "D", t: "Keine Rechte, da er das Gerät angenommen hat"}],
    correct: "A",
    explain: "OR 205/206: Bei Sachmängeln hat der Käufer drei Rechte: (1) Wandelung = Rückgängigmachung des Vertrags (OR 205), (2) Minderung = Preisreduktion (OR 205), (3) Ersatzlieferung = Lieferung einer mangelfreien Sache (OR 206 Abs. 1). Voraussetzung ist die rechtzeitige Mängelrüge (OR 201)."
  },

  {
    id: "t09", topic: "stoerung", type: "multi", diff: 2, tax: "K2",
    q: "Welche Aussagen zur Mängelrüge sind korrekt? (Mehrere Antworten möglich.)",
    options: [{v: "A", t: "Offene Mängel müssen sofort nach Erhalt gerügt werden (OR 201)"}, {v: "B", t: "Versteckte Mängel müssen nach Entdeckung gerügt werden"}, {v: "C", t: "Ohne rechtzeitige Rüge gilt die Ware als genehmigt (OR 200/201)"}, {v: "D", t: "Eine Mängelrüge ist nur schriftlich gültig"}],
    correct: ["A", "B", "C"],
    explain: "OR 201: Offene Mängel sofort rügen, versteckte nach Entdeckung. OR 200/201: Ohne rechtzeitige Rüge gilt die Ware als genehmigt. D ist falsch: Eine mündliche Rüge genügt grundsätzlich, aber schriftlich ist beweissicherer."
  },

  {
    id: "t10", topic: "stoerung", type: "tf", diff: 2, tax: "K2",
    q: "Beim Gläubigerverzug kann der Schuldner die Sachleistung auf Gefahr und Kosten des Gläubigers hinterlegen (OR 92).",
    correct: true,
    explain: "OR 92: Wenn der Gläubiger die ordnungsgemäss angebotene Leistung zu Unrecht verweigert, kann der Schuldner die Sache auf Gefahr und Kosten des Gläubigers hinterlegen und sich so von seiner Schuld befreien."
  },

  {
    id: "t11", topic: "stoerung", type: "mc", diff: 2, tax: "K3",
    context: "Eine Reinigungskraft erscheint pünktlich zur Arbeit. Die Büros, die sie reinigen soll, sind jedoch verschlossen.",
    q: "Welche Art von Störung liegt vor?",
    options: [{v: "A", t: "Schuldnerverzug"}, {v: "B", t: "Gläubigerverzug – der Arbeitgeber verweigert die Annahme der Leistung"}, {v: "C", t: "Schlechterfüllung"}, {v: "D", t: "Unmöglichkeit"}],
    correct: "B",
    explain: "Die Reinigungskraft bietet ihre Leistung ordnungsgemäss an, kann sie aber nicht erbringen, weil der Gläubiger (Arbeitgeber) die Voraussetzungen nicht geschaffen hat (verschlossene Büros). Das ist Gläubigerverzug (OR 91 ff.)."
  },

  {
    id: "t12", topic: "stoerung", type: "mc", diff: 3, tax: "K3",
    context: "Ein Lieferant verspricht einem Restaurant Frischfisch für eine Gala am 20. März (Verfalltag). Am 20. März liefert der Lieferant nicht. Am 22. März bietet er die Lieferung an.",
    q: "Muss das Restaurant die verspätete Lieferung annehmen?",
    options: [{v: "A", t: "Ja, eine Nachfrist muss gewährt werden"}, {v: "B", t: "Nein, bei einem Verfalltag kommt der Schuldner ohne Mahnung in Verzug (OR 102 Abs. 2) und es wird vermutet, dass der Gläubiger auf die nachträgliche Leistung verzichtet"}, {v: "C", t: "Ja, weil die Verzögerung nur 2 Tage beträgt"}, {v: "D", t: "Nein, aber nur wenn die Gala bereits stattgefunden hat"}],
    correct: "B",
    explain: "OR 102 Abs. 2: Bei Verfalltag kommt der Schuldner ohne Mahnung in Verzug. OR 108 Ziff. 3: Bei Fixgeschäften ist die Nachfrist entbehrlich. Im kaufmännischen Verkehr (OR 190) wird vermutet, dass der Gläubiger auf die nachträgliche Leistung verzichtet und SE wegen Nichterfüllung verlangt."
  },

  {
    id: "t13", topic: "stoerung", type: "fill", diff: 3, tax: "K3",
    q: "Die Wegbedingung der Sachgewährleistung nach OR {0} ist möglich, aber der Verkäufer kann sich nicht auf die Wegbedingung berufen, wenn er den Mangel absichtlich verschwiegen hat.",
    blanks: [{answer: "199", alts: ["Art. 199 OR"]}],
    explain: "OR 199: Die Sachgewährleistung kann vertraglich wegbedungen werden. Aber: Wenn der Verkäufer den Mangel absichtlich verschwiegen hat, ist die Freizeichnungsklausel unwirksam."
  },

  {
    id: "t14", topic: "stoerung", type: "mc", diff: 3, tax: "K4",
    context: "Im kaufmännischen Verkehr bestellt Firma A bei Firma B Maschinen mit Liefertermin 15. Mai (Verfalltag). Die Lieferung erfolgt am 25. Mai.",
    q: "Welche Vermutungen gelten nach OR 190?",
    options: [{v: "A", t: "Es wird vermutet, dass der Verfalltag ein Fixgeschäft ist und der Käufer auf die Leistung verzichtet und SE verlangt"}, {v: "B", t: "Es wird vermutet, dass der Käufer die verspätete Lieferung akzeptiert"}, {v: "C", t: "Keine Vermutungen, allgemeine Regeln gelten"}, {v: "D", t: "Es wird vermutet, dass der Kaufvertrag nichtig ist"}],
    correct: "A",
    explain: "OR 190 Abs. 1: Im kaufmännischen Verkehr bei Verfalltag gelten zwei Vermutungen: (1) Der Verfalltag hat die Bedeutung eines Fixgeschäfts (OR 108 Ziff. 3). (2) Der Käufer verzichtet auf die nachträgliche Leistung und beansprucht SE wegen Nichterfüllung (OR 107 Abs. 2)."
  },

  {
    id: "t15", topic: "stoerung", type: "multi", diff: 3, tax: "K3",
    q: "Welche Aussagen zum Schuldnerverzug sind korrekt?",
    options: [{v: "A", t: "Voraussetzung: Fälligkeit und Mahnung (OR 102 Abs. 1)"}, {v: "B", t: "Ausnahme: Bei Verfalltag ist keine Mahnung nötig (OR 102 Abs. 2)"}, {v: "C", t: "Verschuldensunabhängig: Verzugszins von 5% bei Geldschulden (OR 104)"}, {v: "D", t: "Der Schuldner haftet für nachträglich gewordene Unmöglichkeit (OR 103 Abs. 1)"}],
    correct: ["A", "B", "C", "D"],
    explain: "Alle vier Aussagen sind korrekt: A = Grundregel Mahnung (OR 102,1). B = Ausnahme Verfalltag (OR 102,2). C = Verschuldensunabhängiger Verzugszins 5% (OR 104). D = Verschuldensabhängige Folge: Haftung für Unmöglichkeit (OR 103,1), Exkulpation möglich (OR 103,2)."
  },

  {
    id: "t16", topic: "stoerung", type: "mc", diff: 3, tax: "K4",
    context: "Ein Werbeatelier hat den Auftrag, Ende November die Schaufenster eines Optikers zu dekorieren. Am 6. Dezember ist der Auftrag noch nicht ausgeführt.",
    q: "Welche Art von Leistungsstörung liegt vor?",
    options: [{v: "A", t: "Gläubigerverzug"}, {v: "B", t: "Schuldnerverzug – das Werbeatelier hat die Leistung nicht rechtzeitig erbracht"}, {v: "C", t: "Schlechterfüllung"}, {v: "D", t: "Unmöglichkeit der Vertragserfüllung"}],
    correct: "B",
    explain: "Das Werbeatelier (Schuldner) hat die vereinbarte Leistung nicht rechtzeitig erbracht. Es liegt Schuldnerverzug vor (OR 102 ff.). Die Weihnachtsdekoration Ende November hat Fixgeschäft-Charakter – ob eine Nachfrist gesetzt werden muss, hängt davon ab, ob die rechtzeitige Erfüllung wesentlich war."
  }

];
