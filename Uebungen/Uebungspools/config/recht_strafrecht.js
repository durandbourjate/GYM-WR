// ============================================================
// Übungspool: Strafrecht
// Fach: Recht | Stufe: SF GYM3–GYM4 (Zyklus 2)
// Erstellt: 2026-02-21
// Basis: LearningView-Export Strafrecht, Theorie-Dokumente, Präsentationen
// ============================================================

window.POOL_META = {
  title: "Strafrecht – Grundlagen, Strafbarkeit und Strafzumessung",
  fach: "Recht",
  color: "#73ab2c",
  level: "SF GYM3–GYM4"
};

window.TOPICS = {
  "zweck":           {label: "Zweck & Grundsätze des Strafrechts", short: "Zweck & Grundsätze"},
  "strafarten":      {label: "Strafarten & Deliktsarten", short: "Strafarten"},
  "vollzug":         {label: "Strafvollzug & bedingter Vollzug", short: "Strafvollzug"},
  "massnahmen":      {label: "Massnahmen & Verwahrung", short: "Massnahmen"},
  "tatbestand":      {label: "Tatbestandsmässigkeit", short: "Tatbestand"},
  "verfahren":       {label: "Strafantrag, Offizialdelikt & Verjährung", short: "Antrag & Verjährung"},
  "rechtfertigung":  {label: "Rechtfertigungs- & Schuldausschliessungsgründe", short: "Rechtfertigung"},
  "taeter":          {label: "Mehrere Täter*innen", short: "Mehrere Täter"},
  "strafzumessung":  {label: "Strafzumessung & Strafregister", short: "Strafzumessung"},
  "jugend":          {label: "Jugendstrafrecht & SVG", short: "Jugend & SVG"}
};

window.QUESTIONS = [

  // ============================================================
  // TOPIC: zweck — Zweck & Grundsätze des Strafrechts
  // ============================================================

  // --- diff 1 ---
  {
    id: "z01", topic: "zweck", type: "mc", diff: 1, tax: "K1",
    q: "Welche drei Zwecke soll die Strafe gemäss schweizerischem Strafrecht erfüllen?",
    options: [
      {v: "A", t: "Vergeltung, Spezialprävention und Generalprävention"},
      {v: "B", t: "Rache, Abschreckung und Wiedergutmachung"},
      {v: "C", t: "Bestrafung, Erziehung und Entschädigung"},
      {v: "D", t: "Sühne, Resozialisierung und Opferschutz"}
    ],
    correct: "A",
    explain: "Das Strafrecht dient sowohl der Vergeltung als auch der Prävention. Die drei Zwecke sind: 1) Vergeltung (vergangenheitsorientiert, Art. 47 Abs. 1 StGB), 2) Spezialprävention (Wirkung auf Täter*in: individuelle Abschreckung, Resozialisierung, Sicherung) und 3) Generalprävention (Wirkung auf die Gesellschaft: Abschreckung durch Strafandrohung)."
  },
  {
    id: "z02", topic: "zweck", type: "tf", diff: 1, tax: "K1",
    q: "Der Grundsatz «Keine Strafe ohne ausdrückliches Gesetz» gehört zu den Grundsätzen der Strafprozessordnung.",
    correct: true,
    explain: "Das sogenannte Legalitätsprinzip (nulla poena sine lege) ist ein zentraler Grundsatz: Eine Person darf nur bestraft werden, wenn ihr Verhalten zum Zeitpunkt der Tat ausdrücklich unter Strafe stand."
  },
  {
    id: "z03", topic: "zweck", type: "fill", diff: 1, tax: "K1",
    q: "Die {0} ist vergangenheitsorientiert, während die {1} zukunftsorientiert ist.",
    blanks: [
      {answer: "Vergeltung", alts: ["Vergeltungsfunktion"]},
      {answer: "Prävention", alts: ["Präventionsfunktion", "Praevention"]}
    ],
    explain: "Die Vergeltung bezieht sich auf die begangene Tat (vergangenheitsorientiert) und entspricht dem Bedürfnis nach Gerechtigkeit. Die Prävention (Spezial- und Generalprävention) ist zukunftsorientiert: Weder der Täter noch andere sollen künftig Delikte begehen."
  },

  // --- diff 2 ---
  {
    id: "z04", topic: "zweck", type: "mc", diff: 2, tax: "K2",
    q: "Welchen Zweck verfolgt die Generalprävention?",
    options: [
      {v: "A", t: "Der konkrete Täter soll durch die Strafe davon abgehalten werden, erneut straffällig zu werden."},
      {v: "B", t: "Die ganze Gesellschaft soll durch Strafandrohungen von strafbaren Handlungen abgehalten werden."},
      {v: "C", t: "Das Opfer soll durch die Bestrafung des Täters Genugtuung erhalten."},
      {v: "D", t: "Der Täter soll durch die Strafe finanziell geschädigt werden, um ihn abzuschrecken."}
    ],
    correct: "B",
    explain: "Die Generalprävention wirkt auf die Gesellschaft als Ganzes. Durch die Strafandrohungen in den Gesetzen sollen alle Gesellschaftsmitglieder von strafbaren Handlungen abgehalten werden, und die gesellschaftlichen Normen sollen bekräftigt werden. Die Spezialprävention (Antwort A) dagegen wirkt nur auf den konkreten Täter."
  },
  {
    id: "z05", topic: "zweck", type: "multi", diff: 2, tax: "K2",
    q: "Welche Aussagen zu den Grundsätzen der Strafprozessordnung treffen zu? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Niemand darf für dieselbe Tat zweimal bestraft werden."},
      {v: "B", t: "Im Zweifelsfalle wird zugunsten des Opfers entschieden."},
      {v: "C", t: "Das Strafmass richtet sich nach der Schwere des Verschuldens."},
      {v: "D", t: "Unkenntnis des Gesetzes schützt vor Strafe."}
    ],
    correct: ["A", "C"],
    explain: "Korrekt sind A (Verbot der Doppelbestrafung, ne bis in idem) und C (Verschuldensprinzip). B ist falsch: Der Grundsatz lautet «Im Zweifelsfalle für den Angeklagten» (in dubio pro reo), nicht für das Opfer. D ist ebenfalls falsch: «Unkenntnis des Gesetzes schützt nicht vor Strafe» — das Gegenteil trifft zu."
  },
  {
    id: "z06", topic: "zweck", type: "mc", diff: 2, tax: "K2",
    context: "Im Kanton Bern kostet ein Tag Normalvollzug im Gefängnis CHF 301.–.",
    q: "Was kostet ein Jahr Normalvollzug (365 Tage) ungefähr?",
    options: [
      {v: "A", t: "Ca. CHF 55'000.–"},
      {v: "B", t: "Ca. CHF 80'000.–"},
      {v: "C", t: "Ca. CHF 110'000.–"},
      {v: "D", t: "Ca. CHF 150'000.–"}
    ],
    correct: "C",
    explain: "301 CHF × 365 Tage = CHF 109'865.–, also rund CHF 110'000.– pro Jahr. Dies zeigt, dass Freiheitsstrafen für die Gesellschaft mit erheblichen Kosten verbunden sind, weshalb das StGB auch Alternativen wie den bedingten Strafvollzug oder die elektronische Überwachung vorsieht."
  },

  // --- diff 3 ---
  {
    id: "z07", topic: "zweck", type: "mc", diff: 3, tax: "K5",
    context: "Strafrechtsprofessor Marcel Niggli bezweifelt den langfristigen Nutzen von harten Erziehungsmassnahmen, welche den Willen und die Subjektivität der Jugendlichen ignorieren. Er argumentiert, dass selbst harte Strafen die Menschen nicht vor Gesetzesbrüchen abhalten.",
    q: "Auf welches Argument stützt sich Professor Niggli hauptsächlich?",
    options: [
      {v: "A", t: "Die Generalprävention funktioniert nicht, weil Menschen sich rational verhalten."},
      {v: "B", t: "Harte Strafen haben nur begrenzte Wirkung als Spezialprävention; mehr Sicherheit erfordert mehr Kontrolle (Polizeipräsenz)."},
      {v: "C", t: "Die Vergeltungsfunktion der Strafe ist wichtiger als die Prävention."},
      {v: "D", t: "Das schweizerische System ist grundsätzlich falsch und sollte durch ein Drill-Lager-System ersetzt werden."}
    ],
    correct: "B",
    explain: "Niggli argumentiert, dass harte Strafen allein Menschen nicht vor Gesetzesverstössen abhalten. Mehr Sicherheit gäbe es nur durch erhöhte Kontrolle, also höhere Polizeipräsenz — was aber teuer sei. Sein Argument richtet sich gegen die Annahme, dass Abschreckung durch härtere Strafen automatisch zu weniger Kriminalität führt. Die Gesellschaft sei primär daran interessiert, Mittel zu ergreifen, die Straffällige vor weiteren Untaten abhalten — die Perspektive der Gesellschaft sei insofern wichtiger als jene der Opfer."
  },
  {
    id: "z08", topic: "zweck", type: "mc", diff: 3, tax: "K4",
    q: "Weshalb sieht das StGB verschiedene Formen des Strafvollzugs vor (z.B. Halbgefangenschaft, elektronische Überwachung), statt immer eine reguläre Freiheitsstrafe zu verhängen?",
    options: [
      {v: "A", t: "Weil das Strafrecht eine Kosten/Nutzen-Abwägung vornimmt: Freiheitsstrafen haben negative Effekte und hohe Kosten, und es soll nicht unnötig Leid verursacht werden."},
      {v: "B", t: "Weil alle Gefängnisse in der Schweiz überfüllt sind und es nicht genügend Plätze gibt."},
      {v: "C", t: "Weil die Schweiz keine Freiheitsstrafen über 5 Jahre kennt."},
      {v: "D", t: "Weil die Bundesverfassung Freiheitsstrafen grundsätzlich verbietet."}
    ],
    correct: "A",
    explain: "Das StGB berücksichtigt, dass Freiheitsstrafen immer auch negative Effekte für die Täter und ihr Umfeld haben. Durch die Bestrafung soll nicht unnötig Leid verursacht werden. Falls ein Beharren auf eine effektive Durchführung einer Freiheitsstrafe nicht sinnvoll erscheint, soll darauf verzichtet werden. Die hohen Kosten (z.B. CHF 301.–/Tag im Normalvollzug) spielen ebenfalls eine Rolle. Es ist nicht offensichtlich, dass niedrige direkte Kosten auch den niedrigsten ganzheitlich betrachteten Kosten entsprechen."
  },
  {
    id: "z09", topic: "zweck", type: "tf", diff: 2, tax: "K2",
    q: "Spezialprävention umfasst die individuelle Abschreckung, die Resozialisierung und die Sicherung der Allgemeinheit.",
    correct: true,
    explain: "Die Spezialprävention wirkt auf den konkreten Täter oder die konkrete Täterin und umfasst drei Aspekte: 1) Individuelle Abschreckung (Täter soll von erneuten Straftaten abgehalten werden), 2) Resozialisierung (Wiedereingliederung in die Gesellschaft) und 3) Sicherung der Allgemeinheit (Schutz vor dem Täter)."
  },
  {
    id: "z10", topic: "zweck", type: "tf", diff: 3, tax: "K5",
    q: "Niedrige direkte Kosten einer Strafe (z.B. Gefängniskosten) führen immer auch zu den niedrigsten Gesamtkosten für die Gesellschaft.",
    correct: false,
    explain: "Dies ist gemäss Unterrichtsmaterial ausdrücklich nicht der Fall. In die ganzheitliche Kosten/Nutzen-Rechnung fliessen viele Aspekte ein: Rückfallrisiko und dadurch entstehende Kosten und Leid, Ausgaben für die Strafverfolgung, sowie positive Beiträge an die Gesellschaft durch rechtsbürgerliches Verhalten. Eine günstigere, aber weniger wirksame Strafe kann langfristig teurer sein als eine teurere Massnahme mit besserer Resozialisierung."
  },

  // ============================================================
  // TOPIC: strafarten — Strafarten & Deliktsarten
  // ============================================================

  // --- diff 1 ---
  {
    id: "s01", topic: "strafarten", type: "mc", diff: 1, tax: "K1",
    q: "Welche Strafe wird gemäss Art. 10 BV in der Schweiz ausdrücklich verboten?",
    options: [
      {v: "A", t: "Die Geldstrafe"},
      {v: "B", t: "Die Todesstrafe"},
      {v: "C", t: "Die lebenslange Freiheitsstrafe"},
      {v: "D", t: "Die Busse"}
    ],
    correct: "B",
    explain: "Laut Bundesverfassung (Art. 10 BV) sind in der Schweiz die Todesstrafe sowie körperliche Strafen wie Folter und Prügelstrafe verboten."
  },
  {
    id: "s02", topic: "strafarten", type: "fill", diff: 1, tax: "K1",
    q: "Eine Freiheitsstrafe dauert mindestens {0} Tage und höchstens {1} Jahre (Art. 40 StGB).",
    blanks: [
      {answer: "3", alts: ["drei"]},
      {answer: "20", alts: ["zwanzig"]}
    ],
    explain: "Gemäss Art. 40 StGB beträgt die Mindestdauer einer Freiheitsstrafe 3 Tage und die Höchstdauer 20 Jahre, sofern das Gesetz nicht ausdrücklich eine lebenslange Freiheitsstrafe vorsieht."
  },
  {
    id: "s03", topic: "strafarten", type: "mc", diff: 1, tax: "K1",
    img: {src: "img/recht/strafrecht/strafrecht_deliktsarten_01.svg", alt: "Übersicht der drei Deliktsarten nach Schweregrad"},
    q: "Welche Strafe wird bei Übertretungen verhängt?",
    options: [
      {v: "A", t: "Geldstrafe (Tagessätze)"},
      {v: "B", t: "Busse (Art. 103 und Art. 106 ff. StGB)"},
      {v: "C", t: "Freiheitsstrafe von mindestens 6 Monaten"},
      {v: "D", t: "Gemeinnützige Arbeit von mindestens 720 Stunden"}
    ],
    correct: "B",
    explain: "Übertretungen werden gemäss Art. 103 StGB mit einer Busse bestraft. Die Busse beträgt CHF 1 bis CHF 10'000 (Art. 106 Abs. 1 StGB). Eine Ersatzfreiheitsstrafe von 1 Tag bis 3 Monaten ist möglich (Art. 106 Abs. 2 StGB)."
  },

  // --- diff 2 ---
  {
    id: "s04", topic: "strafarten", type: "mc", diff: 2, tax: "K2",
    q: "Was unterscheidet eine Geldstrafe von einer Busse?",
    options: [
      {v: "A", t: "Es gibt keinen Unterschied — beide Begriffe bezeichnen dasselbe."},
      {v: "B", t: "Die Geldstrafe wird in Tagessätzen bemessen und betrifft schwerere Delikte (Vergehen); die Busse ist ein fixer Betrag und betrifft Übertretungen."},
      {v: "C", t: "Die Busse wird in Tagessätzen bemessen; die Geldstrafe ist ein fixer Betrag."},
      {v: "D", t: "Die Geldstrafe wird nur bei Verbrechen verhängt; die Busse bei Vergehen und Übertretungen."}
    ],
    correct: "B",
    explain: "Die Geldstrafe (Art. 34 StGB) wird in Tagessätzen (1–180 Tagessätze, CHF 30 bis CHF 3'000 pro Tagessatz) bemessen und kommt bei Vergehen zum Einsatz. Die Höhe des Tagessatzes richtet sich nach den persönlichen und wirtschaftlichen Verhältnissen des Täters (Gleichheitsprinzip). Die Busse (Art. 103 / Art. 106 ff. StGB) ist ein fixer Betrag (max. CHF 10'000) und wird bei Übertretungen verhängt."
  },
  {
    id: "s05", topic: "strafarten", type: "multi", diff: 2, tax: "K2",
    q: "Welche Aussagen zu den Deliktsarten treffen zu? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Verbrechen sind mit Freiheitsstrafe von mehr als 3 Jahren bedroht (Art. 10 Abs. 2 StGB)."},
      {v: "B", t: "Vergehen sind mit Freiheitsstrafe bis zu 3 Jahren oder Geldstrafe bedroht (Art. 10 Abs. 3 StGB)."},
      {v: "C", t: "Übertretungen können mit einer Freiheitsstrafe bis zu 1 Jahr bestraft werden."},
      {v: "D", t: "Bei Vergehen ist eine gemeinnützige Arbeit von höchstens 720 Stunden möglich (Art. 37 StGB)."}
    ],
    correct: ["A", "B", "D"],
    explain: "A ist korrekt: Verbrechen sind Taten, die mit mehr als 3 Jahren Freiheitsstrafe bedroht sind (Art. 10 Abs. 2 StGB). B ist korrekt: Vergehen sind mit bis zu 3 Jahren Freiheitsstrafe oder Geldstrafe bedroht (Art. 10 Abs. 3 StGB). C ist falsch: Übertretungen werden mit einer Busse bestraft (Art. 103 StGB), nicht mit einer Freiheitsstrafe von bis zu 1 Jahr. D ist korrekt: Bei Vergehen kann gemeinnützige Arbeit bis 720 Stunden angeordnet werden, allerdings nur mit Zustimmung des Täters (Art. 37 StGB)."
  },
  {
    id: "s06", topic: "strafarten", type: "mc", diff: 2, tax: "K2",
    q: "Weshalb wird die Geldstrafe in Tagessätzen bemessen und nicht als fixer Betrag?",
    options: [
      {v: "A", t: "Weil das Gericht so mehr Spielraum hat."},
      {v: "B", t: "Weil das Tagessatzsystem die Gleichheit gewährleistet: Die gleiche Strafe soll für alle Täter gleich belastend sein, unabhängig von ihrer finanziellen Situation."},
      {v: "C", t: "Weil die Schweiz das System von der EU übernommen hat."},
      {v: "D", t: "Weil die Berechnung so einfacher ist als bei einem fixen Betrag."}
    ],
    correct: "B",
    explain: "Das Tagessatzsystem (Art. 34 StGB) trennt die Bemessung in zwei Schritte: 1) Die Anzahl Tagessätze (1–180) richtet sich nach dem Verschulden des Täters. 2) Die Höhe des einzelnen Tagessatzes (CHF 30 bis CHF 3'000) richtet sich nach den persönlichen und wirtschaftlichen Verhältnissen. So trifft die gleiche Strafe (z.B. 30 Tagessätze) eine wohlhabende Person genauso hart wie eine Person mit geringem Einkommen."
  },

  // --- diff 3 ---
  {
    id: "s07", topic: "strafarten", type: "mc", diff: 3, tax: "K3",
    context: "Max wird wegen eines Vergehens zu einer Geldstrafe von 60 Tagessätzen verurteilt. Max verdient als Informatiker CHF 7'500 netto pro Monat.",
    q: "Welche Geldstrafe muss Max ungefähr bezahlen, wenn ein Tagessatz seinem Tageseinkommen entspricht?",
    options: [
      {v: "A", t: "CHF 7'500.–"},
      {v: "B", t: "CHF 15'000.–"},
      {v: "C", t: "CHF 60'000.–"},
      {v: "D", t: "CHF 180'000.–"}
    ],
    correct: "B",
    explain: "Tagessatz = Monatseinkommen / 30 = CHF 7'500 / 30 = CHF 250.–. Geldstrafe = 60 Tagessätze × CHF 250 = CHF 15'000.–. Gemäss Art. 34 StGB beträgt ein Tagessatz zwischen CHF 30 und CHF 3'000 und orientiert sich an den wirtschaftlichen Verhältnissen des Täters."
  },
  {
    id: "s08", topic: "strafarten", type: "mc", diff: 3, tax: "K3",
    context: "Diebstahl (Art. 139 Abs. 1 StGB) wird mit Freiheitsstrafe bis zu fünf Jahren oder Geldstrafe bestraft.",
    q: "Handelt es sich beim Diebstahl um ein Verbrechen, ein Vergehen oder eine Übertretung?",
    options: [
      {v: "A", t: "Verbrechen, weil Freiheitsstrafe bis zu 5 Jahren möglich ist."},
      {v: "B", t: "Vergehen, weil auch eine Geldstrafe möglich ist (Art. 10 Abs. 3 StGB)."},
      {v: "C", t: "Übertretung, weil es sich um eine alltägliche Straftat handelt."},
      {v: "D", t: "Verbrechen, weil Diebstahl ein schweres Delikt ist."}
    ],
    correct: "A",
    explain: "Die Einteilung richtet sich nach der angedrohten Höchststrafe. Verbrechen sind Taten, die mit Freiheitsstrafe von mehr als 3 Jahren bedroht sind (Art. 10 Abs. 2 StGB). Da Diebstahl (Art. 139 Abs. 1 StGB) mit Freiheitsstrafe bis zu 5 Jahren bedroht ist, handelt es sich um ein Verbrechen. Dass alternativ auch eine Geldstrafe möglich ist, ändert daran nichts — massgebend ist die angedrohte Höchststrafe."
  },
  {
    id: "s09", topic: "strafarten", type: "tf", diff: 1, tax: "K1",
    q: "Gemeinnützige Arbeit kann nur mit Zustimmung des Täters angeordnet werden.",
    correct: true,
    explain: "Gemäss Art. 37 StGB kann gemeinnützige Arbeit nur mit Zustimmung des Täters angeordnet werden. Sie beträgt bei Vergehen höchstens 720 Stunden (Art. 37 StGB) und bei Übertretungen höchstens 360 Stunden (Art. 107 StGB)."
  },
  {
    id: "s10", topic: "strafarten", type: "fill", diff: 2, tax: "K1",
    q: "Das StGB besteht aus dem {0} Teil (Art. 1–110) und dem {1} Teil (Art. 111–332).",
    blanks: [
      {answer: "allgemeinen", alts: ["Allgemeinen", "allgemein", "AT"]},
      {answer: "besonderen", alts: ["Besonderen", "besonder", "BT"]}
    ],
    explain: "Der allgemeine Teil des StGB (Art. 1–110) enthält die für alle Straftatbestände geltenden Regeln (z.B. Schuldfähigkeit, Strafarten, Verjährung). Der besondere Teil (Art. 111–332) ist eine Auflistung aller unter Strafe stehenden Handlungen (z.B. Diebstahl, Körperverletzung, Mord)."
  },
  {
    id: "s11", topic: "strafarten", type: "tf", diff: 3, tax: "K4",
    context: "Sachbeschädigung (Art. 144 StGB) wird mit Freiheitsstrafe bis zu drei Jahren oder Geldstrafe bestraft.",
    q: "Sachbeschädigung ist ein Vergehen.",
    correct: true,
    explain: "Vergehen sind Taten, die mit Freiheitsstrafe bis zu 3 Jahren oder Geldstrafe bedroht sind (Art. 10 Abs. 3 StGB). Da Art. 144 StGB eine Freiheitsstrafe bis zu drei Jahren vorsieht (also nicht mehr als 3 Jahre), handelt es sich um ein Vergehen, nicht um ein Verbrechen."
  },

  // ============================================================
  // TOPIC: vollzug — Strafvollzug & bedingter Vollzug
  // ============================================================

  // --- diff 1 ---
  {
    id: "v01", topic: "vollzug", type: "mc", diff: 1, tax: "K1",
    q: "Welcher Grundsatz gilt beim Vollzug einer Freiheitsstrafe (Art. 74 StGB)?",
    options: [
      {v: "A", t: "Die inhaftierte Person soll möglichst hart bestraft werden."},
      {v: "B", t: "Die Menschenwürde ist zu achten; Rechte dürfen nur so weit beschränkt werden, als der Freiheitsentzug es erfordert."},
      {v: "C", t: "Die inhaftierte Person verliert sämtliche Grundrechte."},
      {v: "D", t: "Der Strafvollzug soll primär der Vergeltung dienen."}
    ],
    correct: "B",
    explain: "Gemäss Art. 74 StGB ist beim Vollzug einer Freiheitsstrafe die Menschenwürde zu achten. Die Rechte der inhaftierten Person dürfen nur so weit beschränkt werden, als der Freiheitsentzug und das Zusammenleben in der Vollzugseinrichtung es erfordern."
  },
  {
    id: "v02", topic: "vollzug", type: "multi", diff: 1, tax: "K1",
    q: "Welche Vollzugsformen sieht das StGB vor? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Normalvollzug (Art. 77 StGB)"},
      {v: "B", t: "Halbgefangenschaft (Art. 77b StGB)"},
      {v: "C", t: "Elektronische Überwachung (Art. 79 Abs. 1 StGB)"},
      {v: "D", t: "Hausarrest ohne Kontrolle"}
    ],
    correct: ["A", "B", "C"],
    explain: "Das StGB sieht vier Vollzugsformen vor: Normalvollzug (Art. 77 StGB), Arbeitsexternat (Art. 77a StGB), Halbgefangenschaft (Art. 77b StGB) und elektronische Überwachung (Art. 79 Abs. 1 StGB). «Hausarrest ohne Kontrolle» gibt es nicht als Vollzugsform."
  },
  {
    id: "v03", topic: "vollzug", type: "tf", diff: 1, tax: "K1",
    q: "Die inhaftierte Person ist während des Strafvollzugs zur Arbeit verpflichtet (Art. 81 Abs. 1 StGB).",
    correct: true,
    explain: "Gemäss Art. 81 Abs. 1 und Art. 83 Abs. 1 StGB ist die inhaftierte Person zur Arbeit verpflichtet und erhält dafür ein leistungsabhängiges Entgelt. Ein Teil des Entgelts kann frei verfügt werden; aus dem anderen wird eine Rücklage für die Zeit nach der Entlassung gebildet (Art. 83 Abs. 2 StGB)."
  },

  // --- diff 2 ---
  {
    id: "v04", topic: "vollzug", type: "mc", diff: 2, tax: "K2",
    q: "Was bedeutet «Halbgefangenschaft» (Art. 77b StGB)?",
    options: [
      {v: "A", t: "Die Person verbüsst die Hälfte der Strafe im Gefängnis und die andere Hälfte zu Hause."},
      {v: "B", t: "Die Person setzt ihre Arbeit oder Ausbildung tagsüber fort und verbringt nur die Ruhe- und Freizeit in der Anstalt."},
      {v: "C", t: "Die Person wird nur jede zweite Woche eingesperrt."},
      {v: "D", t: "Die Person erhält die halbe Strafe, die eigentlich vorgesehen wäre."}
    ],
    correct: "B",
    explain: "Bei der Halbgefangenschaft (Art. 77b StGB) setzt die verurteilte Person ihre bisherige Arbeit oder Ausbildung während des Vollzugs fort und verbringt nur die Ruhe- und Freizeit in der Anstalt. Sie ist vorgesehen für Freiheitsstrafen von 6 Monaten bis zu 1 Jahr, wenn keine Flucht- oder Wiederholungsgefahr besteht."
  },
  {
    id: "v05", topic: "vollzug", type: "fill", diff: 2, tax: "K1",
    q: "Hat eine inhaftierte Person {0} der Strafe verbüsst (mindestens aber 3 Monate), ist sie bedingt zu entlassen, sofern das Verhalten im Strafvollzug dies rechtfertigt (Art. 86 Abs. 1 StGB).",
    blanks: [
      {answer: "2/3", alts: ["zwei Drittel", "zwei drittel", "⅔"]}
    ],
    explain: "Gemäss Art. 86 Abs. 1 StGB ist eine inhaftierte Person bedingt zu entlassen, wenn sie 2/3 der Strafe (mindestens 3 Monate) verbüsst hat, sofern das Verhalten im Strafvollzug dies rechtfertigt und nicht anzunehmen ist, dass weitere Straftaten begangen werden."
  },
  {
    id: "v06", topic: "vollzug", type: "mc", diff: 2, tax: "K2",
    q: "Wann ist der bedingte Strafvollzug möglich (Art. 42 Abs. 1 StGB)?",
    options: [
      {v: "A", t: "Bei Freiheitsstrafen von weniger als 5 Jahren."},
      {v: "B", t: "Bei Freiheitsstrafen von weniger als 2 Jahren, sowie bei Geldstrafen und gemeinnütziger Arbeit."},
      {v: "C", t: "Nur bei Geldstrafen und Bussen."},
      {v: "D", t: "Bei allen Strafen, unabhängig von der Dauer."}
    ],
    correct: "B",
    explain: "Gemäss Art. 42 Abs. 1 StGB können Freiheitsstrafen von weniger als 2 Jahren (also bis 24 Monate) sowie Geldstrafen und gemeinnützige Arbeit bedingt ausgesprochen werden, wenn eine unbedingte Strafe nicht notwendig erscheint, um den Täter von weiteren Straftaten abzuhalten."
  },

  // --- diff 3 ---
  {
    id: "v07", topic: "vollzug", type: "mc", diff: 3, tax: "K3",
    context: "Peter wird zu einer Freiheitsstrafe von 30 Monaten verurteilt. Er hat sich bisher nichts zuschulden kommen lassen.",
    q: "Kommt für Peter ein bedingter oder ein teilbedingter Strafvollzug in Frage?",
    options: [
      {v: "A", t: "Bedingter Vollzug, weil Peter unbescholten ist."},
      {v: "B", t: "Teilbedingter Vollzug (Art. 43 StGB), weil die Strafe zwischen 12 und 36 Monaten liegt."},
      {v: "C", t: "Weder noch — bei 30 Monaten muss die Strafe vollständig verbüsst werden."},
      {v: "D", t: "Bedingter Vollzug, weil die Strafe unter 36 Monaten liegt."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob ein bedingter oder teilbedingter Strafvollzug möglich ist. Voraussetzungen: Der bedingte Vollzug (Art. 42 StGB) gilt nur für Freiheitsstrafen unter 24 Monaten — Peters Strafe von 30 Monaten übersteigt diese Grenze. Der teilbedingte Vollzug (Art. 43 StGB) ist bei Freiheitsstrafen von mehr als 12 und weniger als 36 Monaten möglich. Subsumtion: Peters Strafe von 30 Monaten liegt im Bereich von Art. 43 StGB. Schlussfolgerung: Ein teilbedingter Vollzug kommt in Frage, bei dem ein unbedingter Teil (mind. 6 Monate, max. Hälfte der Gesamtstrafe) verbüsst werden muss."
  },
  {
    id: "v08", topic: "vollzug", type: "mc", diff: 3, tax: "K3",
    context: "Claudia wurde zu einer Freiheitsstrafe von 6 Jahren verurteilt. Sie hat sich im Strafvollzug vorbildlich verhalten.",
    q: "Nach wie vielen Jahren kann Claudia frühestens bedingt entlassen werden?",
    options: [
      {v: "A", t: "Nach 3 Jahren (Hälfte der Strafe)."},
      {v: "B", t: "Nach 4 Jahren (2/3 der Strafe, Art. 86 Abs. 1 StGB)."},
      {v: "C", t: "Nach 5 Jahren."},
      {v: "D", t: "Gar nicht — bei Strafen über 5 Jahre ist keine bedingte Entlassung möglich."}
    ],
    correct: "B",
    explain: "Gemäss Art. 86 Abs. 1 StGB ist eine bedingte Entlassung möglich, wenn 2/3 der Strafe verbüsst wurden (mindestens 3 Monate). 2/3 von 6 Jahren = 4 Jahre. Voraussetzung ist, dass das Verhalten im Strafvollzug dies rechtfertigt und nicht anzunehmen ist, dass weitere Straftaten begangen werden. Da Claudia sich vorbildlich verhalten hat, kann sie nach 4 Jahren bedingt entlassen werden."
  },
  {
    id: "v09", topic: "vollzug", type: "tf", diff: 2, tax: "K2",
    q: "Bussen sind immer unbedingt — sie können nicht bedingt ausgesprochen werden.",
    correct: true,
    explain: "Gemäss Art. 42 StGB können Freiheitsstrafen (unter 24 Monaten), Geldstrafen und gemeinnützige Arbeit bedingt ausgesprochen werden. Bussen hingegen sind immer unbedingt. Eine bedingte Strafe kann aber mit einer unbedingten Geldstrafe oder Busse verbunden werden (Art. 42 Abs. 4 StGB)."
  },
  {
    id: "v10", topic: "vollzug", type: "mc", diff: 2, tax: "K2",
    q: "Für welche Freiheitsstrafen ist die elektronische Überwachung (z.B. Fussfessel) vorgesehen?",
    options: [
      {v: "A", t: "Freiheitsstrafen von 20 Tagen bis 12 Monaten (Art. 79 Abs. 1 StGB)."},
      {v: "B", t: "Alle Freiheitsstrafen bis 20 Jahre."},
      {v: "C", t: "Nur lebenslange Freiheitsstrafen."},
      {v: "D", t: "Freiheitsstrafen von 1 bis 5 Jahren."}
    ],
    correct: "A",
    explain: "Die elektronische Überwachung (Art. 79 Abs. 1 StGB) ist bei Freiheitsstrafen von 20 Tagen bis 12 Monaten möglich. Die Person wird ausserhalb des Gefängnisses elektronisch überwacht (z.B. mittels Fussfessel). Sie kann auch für 3 bis 12 Monate in der letzten Phase einer langen Gefängnisstrafe angeordnet werden."
  },
  {
    id: "v11", topic: "vollzug", type: "tf", diff: 3, tax: "K3",
    context: "Maria wird bedingt aus dem Strafvollzug entlassen. Während der Probezeit begeht sie erneut ein Vergehen.",
    q: "Maria muss in den Strafvollzug zurückkehren und die restliche Strafe absitzen.",
    correct: true,
    explain: "Gemäss Art. 89 Abs. 1 StGB wird die bedingt entlassene Person, die während der Probezeit ein Verbrechen oder Vergehen begeht, in den Strafvollzug zurückgebracht und muss die restliche Strafe verbüssen. Die bedingte Entlassung (Art. 86 StGB) steht also unter der Bedingung, dass sich die Person bewährt. Bewährt sie sich, ist sie endgültig entlassen (Art. 88 StGB)."
  },

  // ============================================================
  // TOPIC: massnahmen — Massnahmen & Verwahrung
  // ============================================================

  // --- diff 1 ---
  {
    id: "m01", topic: "massnahmen", type: "mc", diff: 1, tax: "K1",
    img: {src: "img/recht/strafrecht/strafrecht_sanktionen_01.svg", alt: "Strafrechtliche Sanktionen: Strafen und Massnahmen"},
    q: "Was ist die Grundvoraussetzung für eine Massnahme statt einer Freiheitsstrafe (Art. 61 StGB)?",
    options: [
      {v: "A", t: "Der Täter hat ein besonders schweres Verbrechen begangen."},
      {v: "B", t: "Die Strafe ist für den Täter ungeeignet und er ist behandlungsbedürftig und -fähig."},
      {v: "C", t: "Der Täter ist minderjährig."},
      {v: "D", t: "Das Opfer wünscht eine mildere Bestrafung."}
    ],
    correct: "B",
    explain: "Eine Massnahme (z.B. Art. 59, 60, 61 StGB) kommt in Frage, wenn die Strafe für den Täter ungeeignet ist und er behandlungsbedürftig und -fähig ist (z.B. psychische Störung, Suchtkrankheit). Anders als bei der Freiheitsstrafe orientiert sich die Dauer der Massnahme nicht am Verschulden, sondern am Gesundheitszustand des Täters und dem Sicherheitsbedürfnis der Allgemeinheit."
  },
  {
    id: "m02", topic: "massnahmen", type: "tf", diff: 1, tax: "K2",
    q: "Bei Massnahmen korreliert die Dauer mit dem Verschulden des Täters — je schwerer das Verschulden, desto länger die Massnahme.",
    correct: false,
    explain: "Im Gegensatz zu Freiheitsstrafen korreliert bei Massnahmen die Dauer nicht mit dem Verschulden (Art. 59 Abs. 4 und Art. 60 Abs. 4 StGB). Vielmehr orientiert sie sich am Gesundheitszustand des Täters und dem Sicherheitsbedürfnis der Allgemeinheit. Eine Massnahme kann daher auch länger dauern als eine Freiheitsstrafe für dasselbe Delikt."
  },
  {
    id: "m03", topic: "massnahmen", type: "fill", diff: 1, tax: "K1",
    q: "Bei einer Verwahrung muss eine allfällige Entlassung jeweils {0} überprüft werden (Art. 64b StGB).",
    blanks: [
      {answer: "jährlich", alts: ["jaehrlich", "jedes Jahr", "einmal pro Jahr"]}
    ],
    explain: "Gemäss Art. 64b StGB muss bei einer Verwahrung die Möglichkeit einer Entlassung jährlich psychiatrisch überprüft werden. Die Verwahrung kann bei bestimmten schweren Straftaten im Anschluss an die Freiheitsstrafe angeordnet werden."
  },

  // --- diff 2 ---
  {
    id: "m04", topic: "massnahmen", type: "mc", diff: 2, tax: "K2",
    q: "Was geschieht bei einer Verwahrung?",
    options: [
      {v: "A", t: "Der Täter wird nach Verbüssung der Freiheitsstrafe sofort entlassen."},
      {v: "B", t: "Der Täter bleibt nach Verbüssung der Freiheitsstrafe in einer geschlossenen Einrichtung eingesperrt, mit jährlicher psychiatrischer Überprüfung (Art. 64b StGB)."},
      {v: "C", t: "Der Täter wird in ein anderes Land ausgewiesen."},
      {v: "D", t: "Die Freiheitsstrafe wird halbiert und durch eine Geldstrafe ersetzt."}
    ],
    correct: "B",
    explain: "Bei einer Verwahrung bleibt der Täter nach Verbüssung der Freiheitsstrafe in einer geschlossenen (psychiatrischen) Einrichtung eingesperrt. Dies ist bei bestimmten schweren Straftaten möglich, wenn vom Täter weiterhin eine erhebliche Gefahr ausgeht. Die Möglichkeit einer Entlassung muss jährlich psychiatrisch überprüft werden (Art. 64b StGB)."
  },
  {
    id: "m05", topic: "massnahmen", type: "multi", diff: 2, tax: "K1",
    q: "Welche der folgenden sind «andere Massnahmen» im Sinne des StGB? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Berufsverbot (Art. 67 StGB)"},
      {v: "B", t: "Fahrverbot (Art. 67b StGB)"},
      {v: "C", t: "Gegenstände entziehen (z.B. Waffen, Drogen)"},
      {v: "D", t: "Erhöhung der Steuern des Täters"}
    ],
    correct: ["A", "B", "C"],
    explain: "Das StGB sieht neben dem Massnahmevollzug (Art. 59–61 StGB) und der Verwahrung (Art. 64 StGB) weitere Massnahmen vor: Berufsverbot (Art. 67 StGB), Fahrverbot (Art. 67b StGB) und das Entziehen von Gegenständen (z.B. Waffen, Drogen). Eine Steuererhöhung ist keine strafrechtliche Massnahme."
  },

  // --- diff 3 ---
  {
    id: "m06", topic: "massnahmen", type: "mc", diff: 3, tax: "K4",
    context: "Im Fall «Carlos» wurde die Freiheitsstrafe eines jungen Erwachsenen in eine Massnahme umgewandelt.",
    q: "Weshalb kann eine Massnahme für einen jungen Erwachsenen sinnvoller sein als eine Freiheitsstrafe?",
    options: [
      {v: "A", t: "Weil eine Massnahme immer kürzer dauert als eine Freiheitsstrafe."},
      {v: "B", t: "Weil die Massnahme sich am Behandlungsbedarf orientiert und auf Resozialisierung abzielt, was langfristig die Rückfallgefahr senken kann."},
      {v: "C", t: "Weil der Täter in einer Massnahme keinen Regeln unterworfen ist."},
      {v: "D", t: "Weil Massnahmen für den Staat günstiger sind als Freiheitsstrafen."}
    ],
    correct: "B",
    explain: "Bei jungen Erwachsenen (Art. 61 StGB) kann eine Massnahme sinnvoller sein, weil sie sich nicht am Verschulden, sondern am Behandlungsbedarf orientiert. Ziel ist die Vermittlung von Fähigkeiten für ein selbstverantwortliches und straffreies Leben. Eine reine Freiheitsstrafe adressiert die zugrunde liegenden Probleme (z.B. gestörte Persönlichkeitsentwicklung) möglicherweise nicht. A ist falsch: Eine Massnahme kann sogar länger dauern als eine Freiheitsstrafe. D ist falsch: Massnahmen sind oft teurer als Gefängnisstrafen."
  },
  {
    id: "m07", topic: "massnahmen", type: "tf", diff: 3, tax: "K4",
    q: "Eine Massnahme kann länger dauern als die Freiheitsstrafe, die für dasselbe Delikt verhängt worden wäre, weil sich ihre Dauer am Gesundheitszustand und am Sicherheitsbedürfnis orientiert.",
    correct: true,
    explain: "Da die Dauer einer Massnahme nicht am Verschulden, sondern am Gesundheitszustand des Täters und dem Sicherheitsbedürfnis der Allgemeinheit orientiert ist (Art. 59 Abs. 4 / Art. 60 Abs. 4 StGB), kann sie tatsächlich länger dauern als eine verschuldensbasierte Freiheitsstrafe. Die Massnahme dauert in der Regel weniger als 5 Jahre, kann aber verlängert werden."
  },
  {
    id: "m08", topic: "massnahmen", type: "mc", diff: 2, tax: "K2",
    q: "Woran orientiert sich die Dauer einer Massnahme im Unterschied zur Freiheitsstrafe?",
    options: [
      {v: "A", t: "Am Verschulden des Täters, genau wie bei der Freiheitsstrafe."},
      {v: "B", t: "Am Gesundheitszustand des Täters und dem Sicherheitsbedürfnis der Allgemeinheit."},
      {v: "C", t: "Am Wunsch des Opfers."},
      {v: "D", t: "An den finanziellen Mitteln des Staates."}
    ],
    correct: "B",
    explain: "Anders als bei Freiheitsstrafen, wo das Strafmass sich nach dem Verschulden des Täters richtet (Art. 47 StGB), orientiert sich die Dauer einer Massnahme am Gesundheitszustand des Täters und dem Sicherheitsbedürfnis der Allgemeinheit (Art. 59 Abs. 4 / Art. 60 Abs. 4 StGB). Die Massnahme endet, wenn der Behandlungszweck erreicht ist oder keine Gefahr mehr besteht."
  },

  // ============================================================
  // TOPIC: tatbestand — Tatbestandsmässigkeit
  // ============================================================

  // --- diff 1 ---
  {
    id: "t01", topic: "tatbestand", type: "mc", diff: 1, tax: "K1",
    img: {src: "img/recht/strafrecht/strafrecht_pruefschema_01.svg", alt: "Dreistufiges Prüfschema der Strafbarkeit"},
    q: "Was prüft die objektive Tatbestandsmässigkeit?",
    options: [
      {v: "A", t: "Ob dem Täter die Tat vorgeworfen werden kann (Schuldfähigkeit)."},
      {v: "B", t: "Ob der Sachverhalt die Tatbestandsmerkmale eines Artikels im besonderen Teil des StGB erfüllt."},
      {v: "C", t: "Ob der Täter vorsätzlich oder fahrlässig gehandelt hat."},
      {v: "D", t: "Ob ein Rechtfertigungsgrund vorliegt."}
    ],
    correct: "B",
    explain: "Bei der objektiven Tatbestandsmässigkeit wird geprüft, ob der Sachverhalt die Tatbestandsmerkmale (TBM) eines Straftatbestandes im besonderen Teil des StGB erfüllt. Es wird also festgestellt, ob ein Unrecht vorliegt — unabhängig von der inneren Einstellung des Täters."
  },
  {
    id: "t02", topic: "tatbestand", type: "fill", diff: 1, tax: "K1",
    q: "Die subjektive Tatbestandsmässigkeit unterscheidet drei Varianten: {0}, {1} und Zufall.",
    blanks: [
      {answer: "Vorsatz", alts: ["vorsatz"]},
      {answer: "Fahrlässigkeit", alts: ["fahrlässigkeit", "Fahrlaessigkeit"]}
    ],
    explain: "Die subjektive Tatbestandsmässigkeit befasst sich mit der inneren Einstellung des Täters. Es gibt drei Varianten: 1) Vorsatz (Art. 12 Abs. 2 StGB): Der Täter handelt mit Wissen und Willen. 2) Fahrlässigkeit (Art. 12 Abs. 3 StGB): Der Täter verletzt eine Sorgfaltspflicht. 3) Zufall: Dem Täter kann kein Vorwurf gemacht werden. Nur bei Vorsatz und Fahrlässigkeit ist eine Bestrafung möglich."
  },
  {
    id: "t03", topic: "tatbestand", type: "tf", diff: 1, tax: "K2",
    q: "Für eine Bestrafung ist mindestens Vorsatz oder Fahrlässigkeit nötig — bei Zufall bleibt der Täter straffrei.",
    correct: true,
    explain: "Gemäss Art. 12 Abs. 1 i.V.m. Abs. 3 StGB ist für eine Bestrafung mindestens Fahrlässigkeit erforderlich. Wenn dem Täter kein Vorwurf gemacht werden kann (Zufall), bleibt er straffrei. Weder Wissen und Willen (Vorsatz) noch eine Sorgfaltspflichtverletzung (Fahrlässigkeit) liegen vor."
  },

  // --- diff 2 ---
  {
    id: "t04", topic: "tatbestand", type: "mc", diff: 2, tax: "K2",
    q: "Was unterscheidet Vorsatz von Fahrlässigkeit?",
    options: [
      {v: "A", t: "Vorsatz bedeutet, dass die Tat geplant war; Fahrlässigkeit bedeutet, dass sie spontan geschah."},
      {v: "B", t: "Vorsatz: Der Täter handelt mit Wissen und Willen (Art. 12 Abs. 2 StGB). Fahrlässigkeit: Der Täter verletzt eine Sorgfaltspflicht (Art. 12 Abs. 3 StGB)."},
      {v: "C", t: "Vorsatz liegt nur bei Verbrechen vor; Fahrlässigkeit nur bei Vergehen."},
      {v: "D", t: "Fahrlässigkeit ist immer strafbar; Vorsatz nur bei schweren Delikten."}
    ],
    correct: "B",
    explain: "Vorsatz (Art. 12 Abs. 2 StGB): Der Täter führt die Handlung mit Wissen und Willen aus — er will, dass der Taterfolg eintritt. Wichtig: Für Vorsatz ist keine Planung erforderlich. Fahrlässigkeit (Art. 12 Abs. 3 StGB): Der Täter verletzt eine Sorgfaltspflicht — er hätte nach Treu und Glauben vorsichtiger sein müssen. A ist falsch, weil Vorsatz keine Planung voraussetzt."
  },
  {
    id: "t05", topic: "tatbestand", type: "mc", diff: 2, tax: "K3",
    context: "Tim wirft Steine in den Wald. Dabei trifft er eine Spaziergängerin und verletzt sie.",
    q: "Wie ist Tims Handlung aus subjektiver Sicht einzuordnen?",
    options: [
      {v: "A", t: "Vorsatz — Tim hat absichtlich auf die Spaziergängerin geworfen."},
      {v: "B", t: "Fahrlässigkeit — Tim hätte damit rechnen müssen, dass im Wald Personen spazieren (Art. 12 Abs. 3 StGB)."},
      {v: "C", t: "Zufall — Tim konnte nicht wissen, dass jemand im Wald ist."},
      {v: "D", t: "Notwehr — Tim wollte sich verteidigen."}
    ],
    correct: "B",
    explain: "Tim handelte fahrlässig (Art. 12 Abs. 3 StGB). Er wollte nie jemanden treffen (kein Vorsatz), hätte aber nach Treu und Glauben damit rechnen müssen, dass im Wald Menschen spazieren, die getroffen werden könnten. Es liegt eine Sorgfaltspflichtverletzung vor. Es handelt sich nicht um Zufall, da ein vernünftiger Mensch diese Gefahr hätte erkennen können."
  },
  {
    id: "t06", topic: "tatbestand", type: "multi", diff: 2, tax: "K2",
    q: "Welche Schritte gehören zum Falllösungsschema im Strafrecht (Voraussetzungen der Strafbarkeit)? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Tatbestandsmässigkeit (objektiv und subjektiv)"},
      {v: "B", t: "Prüfung von Rechtfertigungsgründen"},
      {v: "C", t: "Feststellung der Zivilhaftung des Täters"},
      {v: "D", t: "Prüfung von Schuldausschliessungsgründen"}
    ],
    correct: ["A", "B", "D"],
    explain: "Das Falllösungsschema im Strafrecht prüft: 1) Tatbestandsmässigkeit (objektiv: TBM erfüllt? / subjektiv: Vorsatz oder Fahrlässigkeit?), 2) Strafantrag (Art. 30 StGB) bei Antragsdelikten, 3) Verjährung (Art. 97 StGB), 4) Rechtfertigungsgründe (Notwehr, Notstand, Einwilligung, gesetzlich erlaubte Handlung), 5) Schuldausschliessungsgründe (Schuldunfähigkeit, Notwehrexzess, Zwang). Die Zivilhaftung (C) ist keine strafrechtliche Frage."
  },

  // --- diff 3 ---
  {
    id: "t07", topic: "tatbestand", type: "mc", diff: 3, tax: "K3",
    context: "Beim Steinewerfen auf einer übersichtlichen Wiese trifft ein Stein plötzlich eine vorbeifliegende Drohne und zerstört diese.",
    q: "Wie ist die Handlung aus subjektiver Sicht einzuordnen (Art. 12 StGB)?",
    options: [
      {v: "A", t: "Vorsatz — der Täter hat bewusst in die Luft geworfen."},
      {v: "B", t: "Fahrlässigkeit — der Täter hätte mit Drohnen rechnen müssen."},
      {v: "C", t: "Zufall — dem Täter kann kein Vorwurf gemacht werden, da auf einer übersichtlichen Wiese nicht mit plötzlich auftauchenden Drohnen zu rechnen ist."},
      {v: "D", t: "Fahrlässigkeit — wer Steine wirft, muss immer mit unerwarteten Schäden rechnen."}
    ],
    correct: "C",
    explain: "Es handelt sich um Zufall (Art. 12 Abs. 1 i.V.m. Abs. 3 StGB). Der Taterfolg tritt ein, ohne dass dem Täter ein Vorwurf gemacht werden könnte: Er handelte nicht absichtlich (kein Vorsatz), und es kann ihm nach Treu und Glauben auch keine Sorgfaltspflichtverletzung vorgeworfen werden, da auf einer übersichtlichen Wiese nicht damit zu rechnen ist, dass plötzlich eine Drohne vorbeifliegt. Die Folge: Straffreiheit."
  },
  {
    id: "t08", topic: "tatbestand", type: "mc", diff: 3, tax: "K3",
    context: "Lisa (16) entwendet aus einem Laden ein Paar Kopfhörer im Wert von CHF 80.–. Sie steckt die Kopfhörer absichtlich in ihre Tasche und verlässt den Laden, ohne zu bezahlen.",
    q: "Welchen objektiven und subjektiven Tatbestand erfüllt Lisas Handlung?",
    options: [
      {v: "A", t: "Objektiv: Diebstahl (Art. 139 Abs. 1 StGB), da sie eine bewegliche Sache weggenommen hat. Subjektiv: Vorsatz (Art. 12 Abs. 2 StGB), da sie absichtlich gehandelt hat."},
      {v: "B", t: "Objektiv: Sachbeschädigung (Art. 144 StGB). Subjektiv: Fahrlässigkeit."},
      {v: "C", t: "Objektiv: Betrug (Art. 146 StGB). Subjektiv: Vorsatz."},
      {v: "D", t: "Objektiv: Diebstahl. Subjektiv: Fahrlässigkeit, weil sie jung ist."}
    ],
    correct: "A",
    explain: "Objektiv erfüllt Lisa den Tatbestand des Diebstahls (Art. 139 Abs. 1 StGB): Sie hat eine fremde, bewegliche Sache (Kopfhörer) einem anderen weggenommen, um sich damit unrechtmässig zu bereichern. Subjektiv liegt Vorsatz vor (Art. 12 Abs. 2 StGB): Sie hat die Kopfhörer absichtlich eingesteckt und den Laden verlassen — sie handelte mit Wissen und Willen. Dass Lisa 16 Jahre alt ist, betrifft nicht die Tatbestandsmässigkeit, sondern ist relevant für das Jugendstrafrecht."
  },
  {
    id: "t09", topic: "tatbestand", type: "tf", diff: 2, tax: "K2",
    q: "Für Vorsatz ist es zwingend nötig, dass die Tat im Voraus geplant wurde.",
    correct: false,
    explain: "Nein. Gemäss Art. 12 Abs. 2 StGB handelt vorsätzlich, wer die Tat mit Wissen und Willen ausführt. Für den Vorsatz ist nicht nötig, dass die Handlung geplant wurde. Auch eine spontane, aber bewusste Tat kann vorsätzlich sein — entscheidend ist, dass der Täter den Taterfolg will."
  },

  // ============================================================
  // TOPIC: verfahren — Strafantrag, Offizialdelikt & Verjährung
  // ============================================================

  // --- diff 1 ---
  {
    id: "p01", topic: "verfahren", type: "mc", diff: 1, tax: "K1",
    q: "Was ist ein Antragsdelikt (Art. 30 StGB)?",
    options: [
      {v: "A", t: "Ein Delikt, das nur auf Antrag des Opfers verfolgt wird."},
      {v: "B", t: "Ein Delikt, das immer von Amtes wegen verfolgt wird."},
      {v: "C", t: "Ein Delikt, bei dem der Täter einen Antrag auf milde Bestrafung stellen kann."},
      {v: "D", t: "Ein Delikt, das nur bei Jugendlichen verfolgt wird."}
    ],
    correct: "A",
    explain: "Antragsdelikte (Art. 30 StGB) sind Delikte, die nur verfolgt werden können, wenn das Opfer einen Strafantrag stellt. Es handelt sich typischerweise um weniger schwere Delikte. Erkennbar sind sie daran, dass im Text des Straftatbestandes der Wortlaut «wird auf Antrag bestraft» vorkommt. Wünscht das Opfer keine Bestrafung, bleibt der Täter straffrei."
  },
  {
    id: "p02", topic: "verfahren", type: "tf", diff: 1, tax: "K2",
    q: "Offizialdelikte werden von Amtes wegen verfolgt, unabhängig davon, ob das Opfer eine Bestrafung wünscht.",
    correct: true,
    explain: "Offizialdelikte werden von Amtes wegen (durch die Strafverfolgungsbehörden) verfolgt, d.h. es spielt keine Rolle, ob das Opfer die Bestrafung des Täters wünscht. Die meisten Straftatbestände sind Offizialdelikte. Offizialdelikte sind per Ausschluss identifizierbar: Alle Tatbestände, bei denen nicht ausdrücklich erwähnt ist, dass es sich um Antragsdelikte handelt, sind Offizialdelikte."
  },
  {
    id: "p03", topic: "verfahren", type: "fill", diff: 1, tax: "K1",
    q: "Die Verjährungsfristen für Straftaten sind in Art. {0} StGB geregelt.",
    blanks: [
      {answer: "97", alts: ["97 StGB"]}
    ],
    explain: "Art. 97 StGB definiert die Verjährungsfristen in Abhängigkeit der maximalen Strafe, die für einen Straftatbestand möglich ist. Die Verjährung misst sich also am möglichen Strafrahmen, nicht am effektiven Urteil. Art. 101 StGB listet die Straftaten auf, die nie verjähren."
  },

  // --- diff 2 ---
  {
    id: "p04", topic: "verfahren", type: "mc", diff: 2, tax: "K2",
    q: "Woran erkennt man im Gesetzestext, ob es sich um ein Antragsdelikt handelt?",
    options: [
      {v: "A", t: "Am Wortlaut «wird von Amtes wegen bestraft» im Straftatbestand."},
      {v: "B", t: "Am Wortlaut «wird auf Antrag bestraft» im Straftatbestand (Art. 30 StGB)."},
      {v: "C", t: "An der Höhe der angedrohten Strafe — Antragsdelikte sind immer Übertretungen."},
      {v: "D", t: "An einem speziellen Hinweis im allgemeinen Teil des StGB."}
    ],
    correct: "B",
    explain: "Antragsdelikte sind daran erkennbar, dass im Text des Straftatbestandes im besonderen Teil des StGB der Wortlaut «wird auf Antrag bestraft» vorkommt. Fehlt dieser Hinweis, handelt es sich um ein Offizialdelikt. A ist falsch: «Von Amtes wegen» wird nicht ausdrücklich erwähnt, da dies der Normalfall ist."
  },
  {
    id: "p05", topic: "verfahren", type: "mc", diff: 2, tax: "K2",
    q: "Woran orientiert sich die Verjährungsfrist eines Delikts?",
    options: [
      {v: "A", t: "Am effektiven Urteil, das im konkreten Fall ausgesprochen wurde."},
      {v: "B", t: "An der maximalen Strafe, die der Straftatbestand im besonderen Teil des StGB vorsieht."},
      {v: "C", t: "Am Alter des Täters zum Zeitpunkt der Tat."},
      {v: "D", t: "Am Wunsch des Opfers."}
    ],
    correct: "B",
    explain: "Die Verjährungsfrist (Art. 97 StGB) richtet sich nach der maximalen Strafe, die im Straftatbestand des besonderen Teils des StGB angedroht wird — nicht nach dem effektiven Urteil. Je schwerer das mögliche Strafmass, desto länger die Verjährungsfrist."
  },

  // --- diff 3 ---
  {
    id: "p06", topic: "verfahren", type: "mc", diff: 3, tax: "K3",
    context: "Hansli (14) stiehlt seiner Mutter 20 Franken aus dem Portemonnaie. Diebstahl ist gemäss Art. 139 Abs. 1 StGB grundsätzlich ein Offizialdelikt. Der geringfügige Diebstahl unter Angehörigen (Art. 139 Abs. 4 i.V.m. Art. 172ter StGB) ist jedoch ein Antragsdelikt.",
    q: "Was passiert, wenn die Mutter keinen Strafantrag stellt?",
    options: [
      {v: "A", t: "Hansli wird trotzdem bestraft, weil Diebstahl immer von Amtes wegen verfolgt wird."},
      {v: "B", t: "Hansli bleibt straffrei, weil es sich bei geringfügigem Diebstahl unter Angehörigen um ein Antragsdelikt handelt und kein Strafantrag vorliegt."},
      {v: "C", t: "Hansli wird bestraft, aber mit einer milderen Strafe."},
      {v: "D", t: "Die Polizei entscheidet selbst, ob sie den Fall verfolgt."}
    ],
    correct: "B",
    explain: "Der geringfügige Diebstahl unter Angehörigen ist ein Antragsdelikt. Gemäss Art. 30 StGB werden Antragsdelikte nur verfolgt, wenn das Opfer einen Strafantrag stellt. Da die Mutter keinen Strafantrag stellt, bleibt Hansli straffrei. Dies entspricht dem Gedanken, dass bei leichteren Delikten im familiären Umfeld das Opfer selbst entscheiden soll, ob eine Strafverfolgung gewünscht ist."
  },
  {
    id: "p07", topic: "verfahren", type: "tf", diff: 2, tax: "K2",
    q: "Es gibt Straftaten, die gemäss Art. 101 StGB nie verjähren.",
    correct: true,
    explain: "Art. 101 StGB listet bestimmte besonders schwere Straftaten auf, die nicht verjähren (unverjährbar). Der Grundsatz der Verjährung (Art. 97 StGB) wird hier also durchbrochen."
  },
  {
    id: "p08", topic: "verfahren", type: "mc", diff: 3, tax: "K3",
    q: "Bei Delikten an Minderjährigen beginnt die Verjährung frühestens mit dem 25. Altersjahr des Opfers (Art. 97 Abs. 2 StGB). Weshalb gibt es diese Sonderregelung?",
    options: [
      {v: "A", t: "Weil Minderjährige weniger selbstständig sind und die Täter häufig nahestehende Personen sind — eine emotionale und materielle Emanzipation kann nötig sein, bevor eine Anzeige möglich ist."},
      {v: "B", t: "Weil Minderjährige noch nicht in der Lage sind, Straftaten zu erkennen."},
      {v: "C", t: "Weil das Gericht bei Minderjährigen mehr Zeit für die Untersuchung braucht."},
      {v: "D", t: "Weil Minderjährige automatisch von der Polizei überwacht werden."}
    ],
    correct: "A",
    explain: "Die Sonderregelung in Art. 97 Abs. 2 StGB trägt dem Umstand Rechnung, dass Minderjährige weniger selbstständig sind als Erwachsene und für Delikte an Minderjährigen regelmässig nahestehende Personen verantwortlich sind. Eine emotionale und materielle Emanzipation ist unter Umständen nötig, bevor ein Opfer in der Lage ist, Anzeige zu erstatten."
  },
  {
    id: "p09", topic: "verfahren", type: "tf", diff: 3, tax: "K4",
    context: "Ein Delikt, das mit maximal 3 Jahren Freiheitsstrafe bedroht ist, hat laut StGB 97 eine Verfolgungsverjährungsfrist von 10 Jahren.",
    q: "Wenn jemand für dieses Delikt tatsächlich nur zu 6 Monaten verurteilt wird, beträgt die Verjährungsfrist trotzdem 10 Jahre.",
    correct: true,
    explain: "Die Verjährungsfrist misst sich an der im Gesetz angedrohten Höchststrafe, nicht am effektiven Urteil. Da das Delikt mit maximal 3 Jahren Freiheitsstrafe bedroht ist, beträgt die Verjährungsfrist gemäss Art. 97 StGB 10 Jahre — unabhängig davon, wie hoch die tatsächliche Strafe ausfällt."
  },

  // ============================================================
  // TOPIC: rechtfertigung — Rechtfertigungs- & Schuldausschliessungsgründe
  // ============================================================

  // --- diff 1 ---
  {
    id: "r01", topic: "rechtfertigung", type: "mc", diff: 1, tax: "K1",
    q: "Welche Rechtfertigungsgründe kennt das schweizerische Strafrecht?",
    options: [
      {v: "A", t: "Nur Notwehr (Art. 15 StGB)."},
      {v: "B", t: "Einwilligung, gesetzlich erlaubte Handlung (Art. 14 StGB), Notwehr (Art. 15 StGB) und Notstand (Art. 17/18 StGB)."},
      {v: "C", t: "Nur Einwilligung und Notwehr."},
      {v: "D", t: "Selbsthilfe und Notwehr."}
    ],
    correct: "B",
    explain: "Das Strafrecht kennt vier Rechtfertigungsgründe: 1) Einwilligung (z.B. Zustimmung zu einer Operation), 2) Gesetzlich erlaubte Handlung (Art. 14 StGB, z.B. polizeiliches Handeln), 3) Notwehr (Art. 15 StGB) und 4) Notstand (Art. 17/18 StGB). Liegt ein Rechtfertigungsgrund vor, ist die an sich strafbare Handlung ausnahmsweise gerechtfertigt."
  },
  {
    id: "r02", topic: "rechtfertigung", type: "tf", diff: 1, tax: "K1",
    q: "Notwehr (Art. 15 StGB) bedeutet, dass man einen rechtswidrigen Angriff in angemessener Weise abwehren darf.",
    correct: true,
    explain: "Gemäss Art. 15 StGB ist derjenige, der ohne Recht angegriffen oder unmittelbar mit einem Angriff bedroht wird, berechtigt, den Angriff in einer den Umständen angemessenen Weise abzuwehren. Die Folge ist Straffreiheit. Wichtig: Die Abwehr muss verhältnismässig sein."
  },
  {
    id: "r03", topic: "rechtfertigung", type: "fill", diff: 1, tax: "K1",
    q: "Die Schuldunfähigkeit ist in Art. {0} StGB geregelt. Vollständige Schuldunfähigkeit führt zu {1}.",
    blanks: [
      {answer: "19", alts: ["19 StGB"]},
      {answer: "Straffreiheit", alts: ["straffreiheit", "Freispruch"]}
    ],
    explain: "Art. 19 StGB regelt die Schuldunfähigkeit. Vollständige Schuldunfähigkeit (Art. 19 Abs. 1 StGB) führt zu Straffreiheit — dem Täter kann das Unrecht nicht vorgeworfen werden. Verminderte Schuldfähigkeit (Art. 19 Abs. 2 StGB) führt zu einer milderen Bestrafung."
  },

  // --- diff 2 ---
  {
    id: "r04", topic: "rechtfertigung", type: "mc", diff: 2, tax: "K2",
    q: "Was ist der Unterschied zwischen rechtfertigender Notwehr (Art. 15 StGB) und entschuldbarer Notwehr (Art. 16 StGB)?",
    options: [
      {v: "A", t: "Rechtfertigende Notwehr: Angemessene Abwehr → Straffreiheit. Entschuldbare Notwehr: Überschreitung der Notwehrgrenzen → mildere Strafe oder Straffreiheit bei Aufregung."},
      {v: "B", t: "Es gibt keinen Unterschied — beide führen immer zu Straffreiheit."},
      {v: "C", t: "Rechtfertigende Notwehr gilt nur bei Angriffen auf die Person; entschuldbare Notwehr bei Angriffen auf Eigentum."},
      {v: "D", t: "Rechtfertigende Notwehr muss beantragt werden; entschuldbare Notwehr wird von Amtes wegen geprüft."}
    ],
    correct: "A",
    explain: "Rechtfertigende Notwehr (Art. 15 StGB): Die Abwehr ist den Umständen angemessen → Straffreiheit. Entschuldbare Notwehr (Art. 16 StGB): Die Grenzen der Notwehr werden überschritten. Nach Art. 16 Abs. 1 StGB wird die Strafe gemildert. Nach Art. 16 Abs. 2 StGB handelt der Abwehrende nicht schuldhaft, wenn er die Grenzen in entschuldbarer Aufregung oder Bestürzung über den Angriff überschreitet → dann ebenfalls Straffreiheit."
  },
  {
    id: "r05", topic: "rechtfertigung", type: "mc", diff: 2, tax: "K3",
    context: "Sie wollen Ihre Nachbarn aus dem brennenden Haus retten. Dafür müssen Sie ein Fenster einschlagen, um ins Haus zu gelangen.",
    q: "Liegt hier ein Notstand vor, der das Einschlagen des Fensters (Sachbeschädigung) rechtfertigt?",
    options: [
      {v: "A", t: "Nein, Sachbeschädigung ist nie gerechtfertigt."},
      {v: "B", t: "Ja, denn Leib und Leben der Nachbarn sind ein höherwertiges Rechtsgut als das Eigentum am Fenster (Art. 17 StGB)."},
      {v: "C", t: "Nein, denn es liegt keine Notwehr vor (kein Angriff einer Person)."},
      {v: "D", t: "Ja, aber nur wenn die Nachbarn Sie darum gebeten haben."}
    ],
    correct: "B",
    explain: "Es liegt ein rechtfertigender Notstand (Art. 17 StGB) vor. Die beiden betroffenen Rechtsgüter sind «Leib und Leben der Nachbarn» und «Eigentum der Nachbarn (Fenster)». Leib und Leben sind immer höherwertig als Eigentum. Zur Rettung eines höherwertigen Rechtsguts darf ein geringerwertiges Rechtsgut straffrei geschädigt werden. Die Sachbeschädigung ist somit gerechtfertigt."
  },
  {
    id: "r06", topic: "rechtfertigung", type: "multi", diff: 2, tax: "K2",
    q: "Welche Schuldausschliessungsgründe kennt das StGB? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Schuldunfähigkeit (Art. 19 Abs. 1 StGB)"},
      {v: "B", t: "Verminderte Schuldfähigkeit (Art. 19 Abs. 2 StGB)"},
      {v: "C", t: "Notwehrexzess in entschuldbarer Aufregung (Art. 16 Abs. 2 StGB)"},
      {v: "D", t: "Unkenntnis des Gesetzes"}
    ],
    correct: ["A", "B", "C"],
    explain: "Schuldausschliessungsgründe sind: Schuldunfähigkeit (Art. 19 Abs. 1 StGB → Straffreiheit), verminderte Schuldfähigkeit (Art. 19 Abs. 2 StGB → mildere Strafe) und Notwehrexzess in entschuldbarer Aufregung (Art. 16 Abs. 2 StGB → keine Schuld). Unkenntnis des Gesetzes (D) ist kein Schuldausschliessungsgrund: «Unkenntnis des Gesetzes schützt nicht vor Strafe.»"
  },

  // --- diff 3 ---
  {
    id: "r07", topic: "rechtfertigung", type: "mc", diff: 3, tax: "K3",
    context: "Lea wird auf offener Strasse mit einem Messer bedroht. In Panik greift sie zu einem herumliegenden Stock und schlägt dem Angreifer so heftig auf den Arm, dass dieser bricht.",
    q: "Wie ist Leas Handlung strafrechtlich zu beurteilen?",
    options: [
      {v: "A", t: "Strafbar wegen schwerer Körperverletzung — die Reaktion war übertrieben."},
      {v: "B", t: "Straffreiheit wegen rechtfertigender Notwehr (Art. 15 StGB), da der Angriff mit einem Messer eine angemessene Abwehr mit einem Stock rechtfertigt."},
      {v: "C", t: "Strafbar, aber mildere Strafe wegen Notwehrexzess (Art. 16 Abs. 1 StGB)."},
      {v: "D", t: "Straffreiheit wegen Notstand (Art. 17 StGB)."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob Leas Handlung durch Notwehr gerechtfertigt ist. Voraussetzungen (Art. 15 StGB): 1) Rechtswidriger Angriff oder unmittelbare Bedrohung, 2) Abwehr in angemessener Weise. Subsumtion: Lea wird mit einem Messer bedroht — ein rechtswidriger Angriff liegt vor. Die Abwehr mit einem Stock gegen einen Messerangriff ist den Umständen angemessen, da ein Messer eine potenziell tödliche Waffe ist. Schlussfolgerung: Rechtfertigende Notwehr (Art. 15 StGB) liegt vor → Straffreiheit."
  },
  {
    id: "r08", topic: "rechtfertigung", type: "mc", diff: 3, tax: "K4",
    context: "Ein Polizist verhaftet einen Verdächtigen, wobei er ihn kurz am Arm festhält und auf den Boden drückt.",
    q: "Der Verdächtige zeigt den Polizisten wegen Körperverletzung an. Wie ist die Situation rechtlich zu beurteilen?",
    options: [
      {v: "A", t: "Der Polizist macht sich strafbar, weil jede Gewaltanwendung verboten ist."},
      {v: "B", t: "Der Polizist handelt im Rahmen einer gesetzlich erlaubten Handlung (Art. 14 StGB) — die Polizei darf gemäss Polizeigesetz bestimmte Handlungen vornehmen."},
      {v: "C", t: "Der Polizist beruft sich auf Notwehr (Art. 15 StGB)."},
      {v: "D", t: "Der Polizist ist nur straffrei, wenn der Verdächtige einwilligt."}
    ],
    correct: "B",
    explain: "Die Handlung des Polizisten ist durch den Rechtfertigungsgrund der gesetzlich erlaubten Handlung (Art. 14 StGB) gedeckt. Die Polizei darf gemäss Polizeigesetz bestimmte Handlungen durchführen, die im StGB unter Strafe stehen würden (z.B. Freiheitsbeschränkung, angemessene Gewaltanwendung bei einer Verhaftung). Es handelt sich nicht um Notwehr, da kein rechtswidriger Angriff vorliegt."
  },
  {
    id: "r09", topic: "rechtfertigung", type: "mc", diff: 3, tax: "K4",
    context: "Marco betrinkt sich absichtlich stark und verursacht danach betrunken einen schweren Autounfall, bei dem ein Fussgänger verletzt wird. Vor Gericht beruft sich Marco auf Schuldunfähigkeit (Art. 19 StGB) aufgrund seiner Trunkenheit.",
    q: "Kann Marco sich erfolgreich auf Schuldunfähigkeit berufen?",
    options: [
      {v: "A", t: "Ja, denn er war zum Tatzeitpunkt tatsächlich nicht schuldfähig."},
      {v: "B", t: "Nein, denn gemäss Art. 19 Abs. 4 StGB ist Art. 19 nicht anwendbar, wenn der Täter die Schuldunfähigkeit selbst zu verantworten hat."},
      {v: "C", t: "Ja, denn Trunkenheit ist immer ein Schuldausschliessungsgrund."},
      {v: "D", t: "Nein, denn Art. 19 StGB gilt nur bei psychischen Störungen, nicht bei Alkohol."}
    ],
    correct: "B",
    explain: "Art. 19 Abs. 4 StGB regelt die Situation, in der der Täter die temporäre Schuldunfähigkeit selbst zu verantworten hat (actio libera in causa). Da Marco sich absichtlich stark betrunken hat und dann gefahren ist, hat er die Schuldunfähigkeit selbst herbeigeführt. In solchen Fällen ist Art. 19 StGB nicht anwendbar und der Täter ist zu bestrafen. D ist falsch: Art. 19 StGB umfasst auch Drogen und Alkohol, nicht nur psychische Störungen."
  },
  {
    id: "r10", topic: "rechtfertigung", type: "tf", diff: 2, tax: "K2",
    q: "Verminderte Schuldfähigkeit (Art. 19 Abs. 2 StGB) führt zu einer milderen Bestrafung, nicht zu vollständiger Straffreiheit.",
    correct: true,
    explain: "Gemäss Art. 19 Abs. 2 StGB wird bei verminderter Schuldfähigkeit die Strafe gemildert. Vollständige Straffreiheit tritt nur bei vollständiger Schuldunfähigkeit ein (Art. 19 Abs. 1 StGB). Bei verminderter Schuldfähigkeit kann dem Täter das Unrecht zwar teilweise, aber nicht vollständig vorgeworfen werden."
  },
  {
    id: "r11", topic: "rechtfertigung", type: "mc", diff: 1, tax: "K2",
    q: "Welches Beispiel illustriert den Rechtfertigungsgrund der Einwilligung?",
    options: [
      {v: "A", t: "Ein Polizist nimmt bei einer Verhaftung den Verdächtigen am Arm."},
      {v: "B", t: "Eine Patientin lässt sich im Spital den Blinddarm operieren — sie stimmt der Operation zu."},
      {v: "C", t: "Jemand schlägt ein Fenster ein, um Nachbarn aus einem brennenden Haus zu retten."},
      {v: "D", t: "Jemand wehrt sich mit einem Stock gegen einen Messerangriff."}
    ],
    correct: "B",
    explain: "Die Einwilligung als Rechtfertigungsgrund bedeutet, dass man einer eigentlich unter Strafe stehenden Handlung zustimmen kann. Bei einer Operation würde der objektive und subjektive Straftatbestand der Körperverletzung grundsätzlich erfüllt sein. Da die Patientin aber der Operation zugestimmt hat, liegt eine Einwilligung vor und die Chirurgin macht sich nicht strafbar. A = gesetzlich erlaubte Handlung, C = Notstand, D = Notwehr."
  },

  // ============================================================
  // TOPIC: taeter — Mehrere Täter*innen
  // ============================================================

  // --- diff 1 ---
  {
    id: "a01", topic: "taeter", type: "mc", diff: 1, tax: "K1",
    img: {src: "img/recht/strafrecht/strafrecht_beteiligungsformen_01.svg", alt: "Übersicht der Beteiligungsformen bei mehreren Tatbeteiligten"},
    q: "Welche vier Formen der Tatbegehung durch mehrere Personen unterscheidet das Strafrecht?",
    options: [
      {v: "A", t: "Mittäterschaft, mittelbare Täterschaft, Anstiftung und Gehilfenschaft"},
      {v: "B", t: "Haupttäter, Nebentäter, Helfer und Zuschauer"},
      {v: "C", t: "Planung, Durchführung, Unterstützung und Beobachtung"},
      {v: "D", t: "Anstiftung, Planung, Ausführung und Deckung"}
    ],
    correct: "A",
    explain: "Das Strafrecht unterscheidet vier Formen der Tatbegehung durch mehrere Personen: 1) Mittäterschaft (gemeinsame Begehung), 2) Mittelbare Täterschaft (eine Person als «Werkzeug» benutzt), 3) Anstiftung (Art. 24 StGB: zur Tat überreden) und 4) Gehilfenschaft (Art. 25 StGB: Hilfeleistung bei der Tat)."
  },
  {
    id: "a02", topic: "taeter", type: "tf", diff: 1, tax: "K2",
    q: "Gehilfen werden gleich bestraft wie der Haupttäter.",
    correct: false,
    explain: "Gehilfen (Art. 25 StGB) werden milder bestraft als der Haupttäter. Da die Strafzumessung individuell geschieht und das Helfen als weniger schlimm beurteilt wird als das effektive Durchführen von Straftaten, soll die Strafe für Gehilfen gemildert werden."
  },
  {
    id: "a03", topic: "taeter", type: "fill", diff: 1, tax: "K1",
    q: "Die Anstiftung ist in Art. {0} StGB geregelt, die Gehilfenschaft in Art. {1} StGB.",
    blanks: [
      {answer: "24", alts: ["24 StGB"]},
      {answer: "25", alts: ["25 StGB"]}
    ],
    explain: "Art. 24 StGB regelt die Anstiftung: Wer jemanden vorsätzlich zu einem Verbrechen oder Vergehen bestimmt hat, wird nach der Strafandrohung bestraft, die auf den Täter Anwendung findet. Art. 25 StGB regelt die Gehilfenschaft: Wer zu einem Verbrechen oder Vergehen vorsätzlich Hilfe leistet, wird milder bestraft."
  },

  // --- diff 2 ---
  {
    id: "a04", topic: "taeter", type: "mc", diff: 2, tax: "K2",
    q: "Was unterscheidet den Anstifter vom Gehilfen?",
    options: [
      {v: "A", t: "Der Anstifter bestimmt eine andere Person zur Tat (via Bitte, Belohnung, Überredung); der Gehilfe leistet bei einer Straftat Hilfe in untergeordneter Rolle."},
      {v: "B", t: "Der Anstifter ist immer der Haupttäter; der Gehilfe ist der Mittäter."},
      {v: "C", t: "Es gibt keinen Unterschied — beide werden gleich bestraft."},
      {v: "D", t: "Der Anstifter plant die Tat; der Gehilfe führt sie allein aus."}
    ],
    correct: "A",
    explain: "Der Anstifter (Art. 24 StGB) wirkt so stark auf eine Person ein (via Bitte, Belohnung, Überredung), dass diese beschliesst, eine strafbare Handlung zu begehen. Der Anstifter wird gleich bestraft wie der Haupttäter. Der Gehilfe (Art. 25 StGB) leistet bei einer Straftat vorsätzlich Hilfe in untergeordneter Rolle (z.B. Schmiere stehen, Fluchtfahrzeug fahren). Der Gehilfe wird milder bestraft als der Haupttäter."
  },
  {
    id: "a05", topic: "taeter", type: "mc", diff: 2, tax: "K3",
    context: "Der Geliebte einer Frau redet immer wieder auf diese ein, sie solle ihren Ehemann vergiften. Die Frau führt die Tat schliesslich aus.",
    q: "Welche Rolle hat der Geliebte im strafrechtlichen Sinne?",
    options: [
      {v: "A", t: "Mittäter — er hat bei der Planung mitgewirkt."},
      {v: "B", t: "Anstifter (Art. 24 StGB) — er hat durch Überredung den Tatentschluss bei der Frau geweckt."},
      {v: "C", t: "Gehilfe (Art. 25 StGB) — er hat bei der Durchführung geholfen."},
      {v: "D", t: "Er ist straffrei, da er die Tat nicht selbst ausgeführt hat."}
    ],
    correct: "B",
    explain: "Der Geliebte ist Anstifter gemäss Art. 24 StGB. Er hat durch wiederholtes Einreden (Überredung) so stark auf die Frau eingewirkt, dass diese beschlossen hat, eine strafbare Handlung zu begehen. Der Anstifter wird gleich bestraft wie der Haupttäter, wobei die Strafzumessung individuell erfolgt. D ist falsch: Dank Art. 24 StGB können auch Personen bestraft werden, die eine Straftat nicht selbst ausgeführt haben."
  },

  // --- diff 3 ---
  {
    id: "a06", topic: "taeter", type: "mc", diff: 3, tax: "K3",
    context: "Eine Frau befiehlt ihrem geisteskranken Bruder, er soll ihren Ehemann töten. Der Bruder führt die Tat aus, ohne die Tragweite seines Handelns zu verstehen.",
    q: "Wie ist die Rolle der Frau strafrechtlich einzuordnen?",
    options: [
      {v: "A", t: "Anstifterin (Art. 24 StGB), weil sie den Bruder zur Tat bestimmt hat."},
      {v: "B", t: "Mittelbare Täterin, weil sie ihren geisteskranken Bruder als «Werkzeug» benutzt hat."},
      {v: "C", t: "Gehilfin (Art. 25 StGB), weil sie nur geholfen hat."},
      {v: "D", t: "Sie ist straffrei, weil sie die Tat nicht selbst ausgeführt hat."}
    ],
    correct: "B",
    explain: "Die Frau ist mittelbare Täterin. Bei der mittelbaren Täterschaft hat die Person die Tat nicht direkt, sondern indirekt begangen, indem sie eine andere Person als «Werkzeug» benutzt hat. Der geisteskranke Bruder versteht die Tragweite seines Handelns nicht und kann daher als «Werkzeug» instrumentalisiert werden. Die mittelbare Täterin wird so bestraft, als hätte sie die Tat selbst ausgeführt. Der Unterschied zur Anstiftung: Bei der Anstiftung fasst die ausführende Person selbst den Tatentschluss; bei der mittelbaren Täterschaft fehlt dieser eigene Entschluss."
  },
  {
    id: "a07", topic: "taeter", type: "mc", diff: 3, tax: "K3",
    context: "Bei einem Bankraub steht Karl draussen vor der Bank «Schmiere» und beobachtet, ob die Polizei kommt, während Peter drinnen das Geld fordert.",
    q: "Welche Rolle hat Karl im strafrechtlichen Sinne?",
    options: [
      {v: "A", t: "Mittäter, weil er bei der Ausführung des Bankraubs aktiv mitwirkt."},
      {v: "B", t: "Gehilfe (Art. 25 StGB), weil er durch das Schmirestehen Hilfe in untergeordneter Rolle leistet."},
      {v: "C", t: "Anstifter (Art. 24 StGB), weil er den Bankraub geplant hat."},
      {v: "D", t: "Karl ist straffrei, weil er die Bank nicht betreten hat."}
    ],
    correct: "B",
    explain: "Karl ist Gehilfe gemäss Art. 25 StGB. Er leistet bei der Straftat vorsätzlich Hilfe, indem er «Schmiere steht». Seine Unterstützung spielt eine eher untergeordnete Rolle. Er erfüllt selbst keinen Straftatbestand des besonderen Teils des StGB (er hat weder geraubt noch gedroht), doch die Gehilfenschaft ermöglicht seine Bestrafung. Karl wird milder bestraft als Peter (der Haupttäter). Alternative Argumentation: Falls Karl bei Entschliessung und Planung aktiv mitgewirkt hat, könnte auch Mittäterschaft in Frage kommen — dies hängt vom konkreten Sachverhalt ab."
  },
  {
    id: "a08", topic: "taeter", type: "tf", diff: 2, tax: "K2",
    q: "Der Anstifter (Art. 24 StGB) wird gleich bestraft wie der Haupttäter.",
    correct: true,
    explain: "Gemäss Art. 24 StGB wird der Anstifter nach der gleichen Strafandrohung bestraft, die auf den Täter Anwendung findet. Die Strafzumessung erfolgt jedoch individuell — Täter und Anstifter können also durchaus unterschiedliche Urteile erhalten, auch wenn der Strafrahmen derselbe ist."
  },

  // ============================================================
  // TOPIC: strafzumessung — Strafzumessung & Strafregister
  // ============================================================

  // --- diff 1 ---
  {
    id: "u01", topic: "strafzumessung", type: "mc", diff: 1, tax: "K1",
    q: "Was gibt der Straftatbestand im besonderen Teil des StGB bezüglich der Strafe vor?",
    options: [
      {v: "A", t: "Das exakte Strafmass, das verhängt werden muss."},
      {v: "B", t: "Den Strafrahmen (die maximale Strafe), innerhalb dessen das Gericht die Strafe bemisst."},
      {v: "C", t: "Nur die Strafart, aber keine Angabe zur Höhe."},
      {v: "D", t: "Die Mindeststrafe, die in jedem Fall verhängt werden muss."}
    ],
    correct: "B",
    explain: "Der Straftatbestand im besonderen Teil des StGB definiert den Strafrahmen. Die im Gesetz angegebene Strafe ist die höchstmögliche Strafe für die schlimmstmögliche Variante dieses Delikts. Das Gericht muss bei der Strafzumessung begründen, wo innerhalb des Strafrahmens sich das Urteil befindet, basierend auf den individuellen Umständen."
  },
  {
    id: "u02", topic: "strafzumessung", type: "tf", diff: 1, tax: "K1",
    q: "Strafmindernde Faktoren bei der Strafzumessung sind in Art. 47 und Art. 48 StGB geregelt.",
    correct: true,
    explain: "Art. 47 StGB regelt die allgemeinen Strafzumessungsfaktoren (Verschulden des Täters, Beweggründe, Vorleben, persönliche Verhältnisse). Art. 48 StGB listet weitere strafmindernde Gründe auf (z.B. schwere Bedrängnis, Gehorsam, heftige Gemütsbewegung, aufrichtige Reue)."
  },
  {
    id: "u03", topic: "strafzumessung", type: "fill", diff: 1, tax: "K1",
    q: "Einträge im Strafregister sind in Art. {0} StGB geregelt.",
    blanks: [
      {answer: "366", alts: ["366 StGB"]}
    ],
    explain: "Art. 366 StGB regelt, welche Verurteilungen ins Strafregister eingetragen werden: alle Verurteilungen wegen Verbrechen und Vergehen (sofern eine Strafe oder Massnahme ausgesprochen wurde), bestimmte Übertretungen, ausländische Verurteilungen und Verurteilungen von Jugendlichen zu Freiheitsentzug."
  },

  // --- diff 2 ---
  {
    id: "u04", topic: "strafzumessung", type: "multi", diff: 2, tax: "K2",
    q: "Welche Faktoren beeinflussen die Strafzumessung gemäss Art. 47 StGB? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Ausmass der Rechtsgutsverletzung"},
      {v: "B", t: "Beweggründe des Täters"},
      {v: "C", t: "Vorleben und persönliche Verhältnisse des Täters"},
      {v: "D", t: "Vermögen des Opfers"}
    ],
    correct: ["A", "B", "C"],
    explain: "Art. 47 StGB nennt als Strafzumessungsfaktoren: das Ausmass der Rechtsgutsverletzung (A), die Beweggründe (B) und das Vorleben sowie die persönlichen Verhältnisse des Täters (C). Das Vermögen des Opfers (D) ist kein Faktor der Strafzumessung."
  },
  {
    id: "u05", topic: "strafzumessung", type: "mc", diff: 2, tax: "K2",
    q: "Wie regelt Art. 49 StGB die Strafschärfung bei mehreren gleichzeitig begangenen Straftaten?",
    options: [
      {v: "A", t: "Die Strafrahmen aller Einzeldelikte werden addiert."},
      {v: "B", t: "Das Gericht kann den Strafrahmen der schwersten Straftat um maximal 50% erhöhen, unter Einhaltung der gesetzlichen Höchststrafe (Art. 40 StGB)."},
      {v: "C", t: "Es wird nur das schwerste Delikt bestraft; alle anderen werden fallengelassen."},
      {v: "D", t: "Jedes Delikt wird einzeln verurteilt und die Strafen werden nacheinander vollzogen."}
    ],
    correct: "B",
    explain: "Gemäss Art. 49 StGB (Strafschärfung bei Konkurrenz) kann das Gericht den Strafrahmen der schwersten Straftat um maximal 50% erhöhen, wenn mehrere Straftaten gleichzeitig begangen werden (z.B. Einbruchdiebstahl = Diebstahl + Hausfriedensbruch + Sachbeschädigung). Die gesetzliche Höchststrafe von 20 Jahren (Art. 40 StGB) bleibt dabei bestehen."
  },
  {
    id: "u06", topic: "strafzumessung", type: "mc", diff: 2, tax: "K2",
    q: "Wann wird ein Eintrag im Strafregister entfernt, wenn jemand zu einer Freiheitsstrafe unter einem Jahr verurteilt wurde (Art. 369 Abs. 1 StGB)?",
    options: [
      {v: "A", t: "5 Jahre nach Verbüssung der Strafe."},
      {v: "B", t: "10 Jahre nach Ablauf der gerichtlich zugemessenen Strafdauer."},
      {v: "C", t: "15 Jahre nach Verbüssung der Strafe."},
      {v: "D", t: "Der Eintrag wird nie entfernt."}
    ],
    correct: "B",
    explain: "Gemäss Art. 369 Abs. 1 StGB werden Urteile mit Freiheitsstrafen unter einem Jahr nach 10 Jahren von Amtes wegen aus dem Strafregister entfernt. Die Frist beginnt nach Ablauf der gerichtlich zugemessenen Strafdauer. Bei Strafen von 1–5 Jahren sind es 15 Jahre, bei Strafen ab 5 Jahren 20 Jahre."
  },

  // --- diff 3 ---
  {
    id: "u07", topic: "strafzumessung", type: "mc", diff: 3, tax: "K5",
    context: "Anwalt Aeppli regt sich auf: Sein Mandant Moser (M), ein unbescholtener 19-jähriger Gymnasiast, wurde wegen Diebstahls einer Kiste Weinflaschen (Warenwert CHF 320) zu 9 Monaten bedingter Freiheitsstrafe verurteilt. Das Gericht begründete: Die Tatschuld rechtfertige zwar nur 7 Monate, aber wegen häufiger Straftaten in der Aarbergergasse müsse ein Zeichen gesetzt werden.",
    q: "Ist die Anhebung der Strafe von 7 auf 9 Monate mit dieser Begründung zulässig?",
    options: [
      {v: "A", t: "Ja, das Gericht kann zur Abschreckung potentieller Nachahmer die Strafe erhöhen."},
      {v: "B", t: "Nein, denn das Strafmass muss sich nach dem individuellen Verschulden des Täters richten (Art. 47 StGB) — eine Erhöhung aus Gründen der Generalprävention über das Verschulden hinaus ist unzulässig."},
      {v: "C", t: "Ja, weil die Sicherheit der Anwohner Vorrang hat."},
      {v: "D", t: "Nein, weil Diebstahl von CHF 320 gar nicht mit Freiheitsstrafe bestraft werden darf."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob die Straferhöhung über das individuelle Verschulden hinaus aus generalpräventiven Gründen zulässig ist. Voraussetzungen: Art. 47 Abs. 1 StGB bestimmt, dass das Gericht die Strafe nach dem Verschulden des Täters bemisst. Das Strafmass richtet sich nach der Schwere des individuellen Verschuldens. Subsumtion: Das Gericht hat selbst festgestellt, dass die Tatschuld von M nur eine Strafe von 7 Monaten rechtfertigt. Die Erhöhung auf 9 Monate erfolgte nicht aufgrund persönlicher Umstände von M, sondern zur Abschreckung anderer (Generalprävention). Dies überschreitet das individuelle Verschulden. Schlussfolgerung: Die Anhebung ist unzulässig. Die Strafe darf das Mass des individuellen Verschuldens nicht übersteigen."
  },
  {
    id: "u08", topic: "strafzumessung", type: "multi", diff: 3, tax: "K2",
    q: "Welche der folgenden sind strafmindernde Gründe gemäss Art. 48 StGB? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Handeln aus schwerer Bedrängnis oder unter Drohung"},
      {v: "B", t: "Aufrichtige Reue und Schadenersatz durch den Täter"},
      {v: "C", t: "Die Tat ist lange her und der Täter hat sich seither wohl verhalten"},
      {v: "D", t: "Der Täter hat viel Geld und kann hohe Anwaltskosten tragen"}
    ],
    correct: ["A", "B", "C"],
    explain: "Art. 48 StGB listet strafmindernde Gründe auf: schwere Bedrängnis oder Drohung (A), aufrichtige Reue und Schadenersatz (B) sowie lang zurückliegende Tat mit Wohlverhalten (C). Die finanzielle Situation des Täters (D) ist kein strafmindernder Grund nach Art. 48 StGB."
  },
  {
    id: "u09", topic: "strafzumessung", type: "tf", diff: 2, tax: "K2",
    q: "Übertretungen werden grundsätzlich ins Strafregister eingetragen.",
    correct: false,
    explain: "Gemäss Art. 366 StGB werden grundsätzlich alle Verurteilungen wegen Verbrechen und Vergehen eingetragen, nicht aber alle Übertretungen. Nur die durch Verordnung des Bundesrates bezeichneten Übertretungen werden eingetragen. Die meisten Übertretungen (z.B. Ordnungsbussen) erscheinen nicht im Strafregister."
  },

  // ============================================================
  // TOPIC: jugend — Jugendstrafrecht & SVG
  // ============================================================

  // --- diff 1 ---
  {
    id: "j01", topic: "jugend", type: "mc", diff: 1, tax: "K1",
    q: "Welche Bestrafungsmöglichkeiten sieht das Jugendstrafgesetz (JStG) vor?",
    options: [
      {v: "A", t: "Nur Freiheitsstrafe und Geldstrafe."},
      {v: "B", t: "Verweis (JStG 22), persönliche Leistung (JStG 23), Busse (JStG 24) und Freiheitsentzug (JStG 25)."},
      {v: "C", t: "Nur Verweis und Busse."},
      {v: "D", t: "Dieselben Strafen wie für Erwachsene."}
    ],
    correct: "B",
    explain: "Das JStG sieht vier Bestrafungsmöglichkeiten vor: 1) Verweis (JStG 22): förmliche Missbilligung der Tat, 2) Persönliche Leistung (JStG 23): gemeinnützige Arbeit oder Kurse, 3) Busse (JStG 24): bis CHF 2'000, 4) Freiheitsentzug (JStG 25): ab 15 Jahren, Einweisung in eine Anstalt. Die Strafrahmen für Erwachsene gelten nicht für Jugendliche."
  },
  {
    id: "j02", topic: "jugend", type: "tf", diff: 1, tax: "K1",
    q: "Der Freiheitsentzug im Jugendstrafrecht ist erst ab einem Alter von 15 Jahren möglich.",
    correct: true,
    explain: "Gemäss JStG 25 kann Freiheitsentzug für Jugendliche ab 15 Jahren angeordnet werden. Der Jugendliche wird in eine Anstalt eingewiesen, die eine Mischung aus Familie, Schule, Arbeitsort und Gefängnis darstellt."
  },
  {
    id: "j03", topic: "jugend", type: "fill", diff: 1, tax: "K1",
    q: "Ein Verweis (JStG 22) ist eine {0} der Tat und kann mit einer Probezeit von {1} bis {2} Jahren verbunden werden.",
    blanks: [
      {answer: "förmliche Missbilligung", alts: ["formelle Missbilligung", "Missbilligung"]},
      {answer: "6 Monaten", alts: ["6", "sechs Monaten"]},
      {answer: "2", alts: ["zwei"]}
    ],
    explain: "Ein Verweis (JStG 22) ist eine förmliche Missbilligung der Tat — ein Brief des Richters, der dem Jugendlichen erklärt, dass sein Verhalten verboten ist. Ein Verweis kann mit einer Probezeit von 6 Monaten bis 2 Jahren verbunden werden."
  },

  // --- diff 2 ---
  {
    id: "j04", topic: "jugend", type: "mc", diff: 2, tax: "K2",
    q: "Unter welchen Voraussetzungen kann ein junger Erwachsener (18–25 Jahre) in eine spezielle Einrichtung eingewiesen werden (Art. 61 StGB)?",
    options: [
      {v: "A", t: "Bei jedem Vergehen, unabhängig von der Persönlichkeitsentwicklung."},
      {v: "B", t: "Wenn er in seiner Persönlichkeitsentwicklung erheblich gestört ist, die Tat damit zusammenhängt und eine Chance besteht, dass er künftig straffrei lebt."},
      {v: "C", t: "Nur bei Verbrechen, die mit mehr als 10 Jahren Freiheitsstrafe bedroht sind."},
      {v: "D", t: "Wenn der junge Erwachsene dies selbst beantragt."}
    ],
    correct: "B",
    explain: "Gemäss Art. 61 StGB kann ein junger Erwachsener (18–25 Jahre) in eine spezielle Einrichtung eingewiesen werden, wenn: 1) Er in seiner Persönlichkeitsentwicklung erheblich gestört ist, 2) die Straftat mit dieser Störung in Zusammenhang steht, und 3) eine Chance besteht, dass er danach keine weiteren Straftaten mehr begeht. Ziel ist es, dem jungen Erwachsenen die Fähigkeiten für ein selbstverantwortliches und straffreies Leben zu vermitteln."
  },
  {
    id: "j05", topic: "jugend", type: "mc", diff: 2, tax: "K2",
    q: "Ab welcher Blutalkoholkonzentration gilt Fahrunfähigkeit wegen Alkoholeinwirkung (Angetrunkenheit) gemäss SVG als erwiesen?",
    options: [
      {v: "A", t: "Ab 0,0 Promille."},
      {v: "B", t: "Ab 0,5 Promille."},
      {v: "C", t: "Ab 0,8 Promille."},
      {v: "D", t: "Ab 1,0 Promille."}
    ],
    correct: "B",
    explain: "Gemäss der Verordnung über Blutalkoholgrenzwerte im Strassenverkehr gilt Fahrunfähigkeit wegen Angetrunkenheit in jedem Fall als erwiesen bei einer Blutalkoholkonzentration von 0,5 oder mehr Gewichtspromille. Ab 0,8 Promille gilt die Trunkenheit als qualifiziert und wird als Vergehen im Strafregister eingetragen."
  },
  {
    id: "j06", topic: "jugend", type: "tf", diff: 2, tax: "K2",
    q: "Ordnungsbussen (z.B. für geringfügige Verkehrsübertretungen) werden ins Strafregister eingetragen.",
    correct: false,
    explain: "Ordnungsbussen werden nicht ins Strafregister eingetragen. Im Ordnungsbussenverfahren kann die Polizei bei geringfügigen Übertretungen an Ort und Stelle eine Busse erheben (Höchstgrenze CHF 300). Der Täter kann die vereinfachte Erledigung ablehnen und die Beurteilung im ordentlichen Verfahren verlangen."
  },

  // --- diff 3 ---
  {
    id: "j07", topic: "jugend", type: "mc", diff: 3, tax: "K3",
    context: "Ein 70 kg schwerer Mann trinkt an einem Abend 4 Gläser Bier (je 3 dl) und fährt danach Auto.",
    q: "Wie hoch ist seine ungefähre Blutalkoholkonzentration (nach der Faustregel) und welche rechtlichen Konsequenzen hat dies?",
    options: [
      {v: "A", t: "Ca. 1,0 Promille — qualifizierte Trunkenheit (Vergehen), Eintrag im Strafregister."},
      {v: "B", t: "Ca. 0,5 Promille — Grenzwert gerade erreicht, Ordnungsbusse möglich."},
      {v: "C", t: "Ca. 0,25 Promille — unter dem Grenzwert, keine Konsequenzen."},
      {v: "D", t: "Ca. 2,0 Promille — strafrechtliche Verfolgung wegen Trunkenheit am Steuer."}
    ],
    correct: "A",
    explain: "Faustregel: 1 Glas (3 dl Bier) bewirkt bei einem 70 kg schweren Mann ca. 0,25 Promille. 4 Gläser × 0,25 = ca. 1,0 Promille. Dies übersteigt den Grenzwert von 0,5 Promille (Fahrunfähigkeit) und auch den Grenzwert von 0,8 Promille (qualifizierte Trunkenheit). Ab 0,8 Promille wird die Trunkenheit als Vergehen gewertet und im Strafregister eingetragen."
  },
  {
    id: "j08", topic: "jugend", type: "mc", diff: 3, tax: "K4",
    q: "Weshalb gelten für Jugendliche andere Strafrahmen als für Erwachsene?",
    options: [
      {v: "A", t: "Weil Jugendliche generell weniger intelligent sind und die Konsequenzen nicht verstehen."},
      {v: "B", t: "Weil das Jugendstrafrecht stärker auf Erziehung und Resozialisierung ausgerichtet ist und berücksichtigt, dass Jugendliche sich noch in der Entwicklung befinden."},
      {v: "C", t: "Weil Jugendliche kein Einkommen haben und keine Geldstrafen zahlen können."},
      {v: "D", t: "Weil das StGB auf Jugendliche generell nicht anwendbar ist."}
    ],
    correct: "B",
    explain: "Das Jugendstrafrecht berücksichtigt, dass Jugendliche sich noch in der Entwicklung befinden. Es ist stärker auf Erziehung und Resozialisierung ausgerichtet als auf Vergeltung. Die Strafrahmen für Erwachsene gelten nicht — stattdessen sieht das JStG eigene, jugendgerechte Sanktionen vor (Verweis, persönliche Leistung, Busse, Freiheitsentzug). D ist falsch: Das StGB gilt grundsätzlich auch für Jugendliche, wird aber durch das JStG ergänzt."
  },
  {
    id: "j09", topic: "jugend", type: "tf", diff: 1, tax: "K1",
    q: "Der Führerausweisentzug ist eine Strafe im strafrechtlichen Sinne.",
    correct: false,
    explain: "Der Führerausweisentzug ist eine verwaltungsrechtliche Massnahme und gilt nicht als Strafe, auch wenn er von den Betroffenen als solche empfunden wird. Er wird von der Verwaltungsbehörde (Strassenverkehrsamt) und nicht vom Strafgericht angeordnet."
  },
  {
    id: "j10", topic: "jugend", type: "mc", diff: 2, tax: "K2",
    q: "Was bedeutet «persönliche Leistung» im Jugendstrafrecht (JStG 23)?",
    options: [
      {v: "A", t: "Der Jugendliche muss eine finanzielle Entschädigung an das Opfer zahlen."},
      {v: "B", t: "Der Jugendliche muss gemeinnützige Arbeit verrichten oder einen Kurs besuchen, um sein Unrecht wiedergutzumachen."},
      {v: "C", t: "Der Jugendliche muss einen Aufsatz über sein Fehlverhalten schreiben."},
      {v: "D", t: "Der Jugendliche muss sich öffentlich beim Opfer entschuldigen."}
    ],
    correct: "B",
    explain: "Persönliche Leistung (JStG 23) bedeutet, dass der Jugendliche arbeiten muss, um sein Unrecht wiedergutzumachen — z.B. Strassen putzen. Es kann auch bedeuten, dass der Jugendliche verpflichtet wird, einen Kurs zu besuchen."
  }

];
