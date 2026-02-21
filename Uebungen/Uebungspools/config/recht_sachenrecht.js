// ============================================================
// Pool: Sachenrecht – Eigentum, Besitz und dingliche Rechte
// Fach: Recht | Farbe: #73ab2c | Stufe: SF GYM2
// Lehrmittel: Zwick, Tatbestand Recht, Band 1, Kap. 5
// Erstellt: 2026-02-21
// ============================================================

window.POOL_META = {
  title: "Sachenrecht – Eigentum, Besitz und dingliche Rechte",
  fach: "Recht",
  color: "#73ab2c",
  level: "SF GYM2"
};

window.TOPICS = {
  "einfuehrung":       {label: "Einführung Sachenrecht",                       short: "Einführung"},
  "eigentum_besitz":   {label: "Eigentum und Besitz",                          short: "Eigentum/Besitz"},
  "formen":            {label: "Formen des Eigentums",                         short: "Eigentumsformen"},
  "erwerb_verlust":    {label: "Erwerb und Verlust des Eigentums",             short: "Erwerb/Verlust"},
  "gutglaeubig":       {label: "Schutz des gutgläubigen Besitzers",            short: "Gutgläubiger Erwerb"},
  "dienstbarkeiten":   {label: "Dienstbarkeiten",                              short: "Dienstbarkeiten"},
  "pfandrechte":       {label: "Pfandrechte, Grundlasten und Grundbuch",       short: "Pfandrechte"}
};

window.QUESTIONS = [

  // ============================================================
  // TOPIC: einfuehrung (Einführung Sachenrecht)
  // ============================================================

  {
    id: "e01", topic: "einfuehrung", type: "mc", diff: 1, tax: "K1",
    q: "Was regelt das Sachenrecht?",
    options: [
      {v: "A", t: "Die Rechte, welche Rechtssubjekte an Rechtsobjekten (Sachen) haben."},
      {v: "B", t: "Die vertraglichen Beziehungen zwischen Käufer und Verkäufer."},
      {v: "C", t: "Die Haftung bei Schäden an Sachen."},
      {v: "D", t: "Die Rechte an geistigem Eigentum wie Patente und Marken."}
    ],
    correct: "A",
    explain: "Das Sachenrecht bildet zusammen mit dem Obligationenrecht den Kernbereich des Vermögensrechts. Es regelt die Rechte, welche Rechtssubjekte (natürliche und juristische Personen) an Rechtsobjekten (Sachen) haben. Im Unterschied dazu regelt das Obligationenrecht, wer gegenüber wem welche Leistung fordern kann."
  },
  {
    id: "e02", topic: "einfuehrung", type: "tf", diff: 1, tax: "K1",
    q: "Obligatorische Rechte wirken gegenüber jedermann.",
    correct: false,
    explain: "Obligatorische Rechte wirken nur zwischen den Personen, die zueinander in einem Schuldverhältnis stehen. Deshalb spricht man von relativen Rechten. Die dinglichen Rechte (Sachenrechte) hingegen wirken gegenüber jedermann und sind deshalb absolute Rechte."
  },
  {
    id: "e03", topic: "einfuehrung", type: "mc", diff: 1, tax: "K2",
    q: "Welche Aussage beschreibt den Unterschied zwischen relativen und absoluten Rechten korrekt?",
    options: [
      {v: "A", t: "Relative Rechte gelten nur zwischen den Vertragsparteien; absolute Rechte gelten gegenüber jedermann."},
      {v: "B", t: "Relative Rechte sind zeitlich beschränkt; absolute Rechte gelten unbefristet."},
      {v: "C", t: "Relative Rechte betreffen nur bewegliche Sachen; absolute Rechte betreffen Grundstücke."},
      {v: "D", t: "Relative Rechte entstehen durch Gesetz; absolute Rechte entstehen durch Vertrag."}
    ],
    correct: "A",
    explain: "Obligatorische (relative) Rechte wirken nur zwischen den Parteien eines Schuldverhältnisses — z.B. einem Kaufvertrag. Der Käufer hat einen Anspruch auf die Sache gegenüber dem Verkäufer. Dingliche (absolute) Rechte hingegen gewähren ein unmittelbares Herrschaftsrecht an einer Sache, das gegenüber jedermann durchgesetzt werden kann."
  },
  {
    id: "e04", topic: "einfuehrung", type: "fill", diff: 1, tax: "K1",
    q: "Das Sachenrecht verleiht dem Berechtigten {0} Rechte, die auch {1} Rechte genannt werden, weil sie gegenüber jedermann gelten.",
    blanks: [
      {answer: "dingliche", alts: ["Dingliche"]},
      {answer: "absolute", alts: ["Absolute"]}
    ],
    explain: "Dingliche Rechte räumen dem Berechtigten ein unmittelbares Herrschaftsrecht an einer Sache ein. Sie werden auch absolute Rechte genannt, weil sie gegenüber jedermann durchgesetzt werden können — im Gegensatz zu den obligatorischen (relativen) Rechten."
  },
  {
    id: "e05", topic: "einfuehrung", type: "mc", diff: 2, tax: "K2",
    q: "In welche drei Kategorien werden die Sachenrechte üblicherweise unterteilt?",
    options: [
      {v: "A", t: "Eigentum, beschränkt dingliche Rechte und Besitz"},
      {v: "B", t: "Eigentum, Miete und Pacht"},
      {v: "C", t: "Grundeigentum, Fahrniseigentum und geistiges Eigentum"},
      {v: "D", t: "Besitz, Forderungen und Grundbuchrechte"}
    ],
    correct: "A",
    explain: "Die Sachenrechte werden üblicherweise unterteilt in das Eigentum (umfassendstes dingliches Recht), die beschränkt dinglichen Rechte (z.B. Dienstbarkeiten, Pfandrechte, Grundlasten) und den Besitz (tatsächliche Gewalt über eine Sache)."
  },
  {
    id: "e06", topic: "einfuehrung", type: "multi", diff: 2, tax: "K2",
    q: "Welche der folgenden Aussagen über das Sachenrecht treffen zu? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Das Sachenrecht regelt die Beziehung zwischen Personen und Sachen."},
      {v: "B", t: "Dingliche Rechte können nur an Grundstücken bestehen."},
      {v: "C", t: "Ein Kaufvertrag begründet ein obligatorisches (relatives) Recht auf die Sache."},
      {v: "D", t: "Das Eigentum ist das umfassendste dingliche Recht."}
    ],
    correct: ["A", "C", "D"],
    explain: "A ist korrekt: Das Sachenrecht regelt die Rechte von Rechtssubjekten an Rechtsobjekten. B ist falsch: Dingliche Rechte können auch an beweglichen Sachen bestehen (z.B. Fahrnispfand). C ist korrekt: Ein Kaufvertrag begründet einen Anspruch auf die Sache (obligatorisches Recht), aber noch kein Recht an der Sache. D ist korrekt: Das Eigentumsrecht verleiht die alleinige Herrschaft über die Sache (Art. 641 ZGB)."
  },
  {
    id: "e07", topic: "einfuehrung", type: "mc", diff: 2, tax: "K3",
    context: "Käufer K schliesst mit Verkäufer V einen Kaufvertrag über einen Gebrauchtwagen ab. V verkauft den Wagen jedoch einem Dritten C und übergibt ihm den Wagen.",
    q: "Kann K den Wagen von C herausverlangen?",
    options: [
      {v: "A", t: "Ja, K hat durch den Kaufvertrag das Eigentum am Wagen erworben."},
      {v: "B", t: "Nein, K hat nur einen obligatorischen Anspruch gegenüber V, aber kein dingliches Recht am Wagen."},
      {v: "C", t: "Ja, wenn K den Kaufpreis bereits bezahlt hat."},
      {v: "D", t: "Nein, weil Kaufverträge über Gebrauchtwagen nicht bindend sind."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob K ein dingliches Recht am Wagen hat, das er gegenüber C durchsetzen kann.\n\nVoraussetzungen: Der Kaufvertrag begründet ein obligatorisches Recht — K hat einen Anspruch auf Übergabe gegenüber V. Für den Eigentumserwerb an einer beweglichen Sache ist jedoch die Besitzübertragung erforderlich (Art. 714 ZGB).\n\nSubsumtion: K hat den Wagen nie erhalten. V hat den Wagen an C übergeben. C ist damit Eigentümer geworden. K hat nur ein relatives Recht gegenüber V, aber kein absolutes Recht am Wagen.\n\nSchlussfolgerung: K kann den Wagen nicht von C herausverlangen. K verbleiben Schadenersatzansprüche gegenüber V wegen Vertragsverletzung."
  },
  {
    id: "e08", topic: "einfuehrung", type: "tf", diff: 1, tax: "K1",
    q: "Tiere gelten im schweizerischen Recht als Sachen.",
    correct: false,
    explain: "Gemäss Art. 641a ZGB sind Tiere keine Sachen. Allerdings finden die auf Sachen anwendbaren Vorschriften auf Tiere entsprechende Anwendung, soweit keine abweichenden Regelungen bestehen."
  },
  {
    id: "e09", topic: "einfuehrung", type: "mc", diff: 3, tax: "K4",
    context: "Mieterin M mietet von Vermieter V ein Auto für ein Wochenende. Am Sonntag fährt ihr Freund F das Auto und verursacht einen Unfall, bei dem das Auto beschädigt wird.",
    q: "Wer hat welche Art von Recht am Auto?",
    options: [
      {v: "A", t: "V hat das Eigentumsrecht (dingliches Recht), M hat ein obligatorisches Recht aus dem Mietvertrag, F hat keinerlei Recht am Auto."},
      {v: "B", t: "V ist Eigentümer und Besitzer, M hat nur ein Nutzungsrecht, F hat das Besitzrecht übernommen."},
      {v: "C", t: "M ist durch den Mietvertrag zur Eigentümerin geworden, V hat nur noch einen Anspruch auf den Mietzins."},
      {v: "D", t: "V, M und F sind alle Miteigentümer, weil alle das Auto benutzt haben."}
    ],
    correct: "A",
    explain: "V bleibt Eigentümer des Autos (dingliches Recht gemäss Art. 641 ZGB). Der Mietvertrag begründet nur ein obligatorisches Recht — M hat einen vertraglichen Anspruch auf Gebrauch gegenüber V, aber kein dingliches Recht am Auto. M ist unselbständige Besitzerin während der Mietdauer. F, der das Auto nur fährt, hat kein eigenständiges Recht am Auto. Für den Unfallschaden haftet M gegenüber V aus dem Mietvertrag, allenfalls mit Rückgriff auf F."
  },

  // ============================================================
  // TOPIC: eigentum_besitz (Eigentum und Besitz)
  // ============================================================

  {
    id: "b01", topic: "eigentum_besitz", type: "fill", diff: 1, tax: "K1",
    q: "Gemäss Art. {0} ZGB kann der Eigentümer in den Schranken der Rechtsordnung über seine Sache nach Belieben verfügen. Gemäss Art. {1} ZGB ist Besitzer, wer die tatsächliche Gewalt über eine Sache hat.",
    blanks: [
      {answer: "641", alts: ["641 ZGB"]},
      {answer: "919", alts: ["919 ZGB"]}
    ],
    explain: "Art. 641 ZGB definiert das Eigentum als das umfassendste dingliche Recht: Der Eigentümer kann über die Sache nach Belieben verfügen. Art. 919 ZGB definiert den Besitz als die tatsächliche Gewalt über eine Sache — der Besitz ist kein Recht, sondern ein äusserlich wahrnehmbarer Sachverhalt."
  },
  {
    id: "b02", topic: "eigentum_besitz", type: "mc", diff: 1, tax: "K2",
    q: "Was ist der wesentliche Unterschied zwischen Eigentum und Besitz?",
    options: [
      {v: "A", t: "Eigentum ist ein Recht an der Sache; Besitz ist die tatsächliche Gewalt über die Sache."},
      {v: "B", t: "Eigentum bezieht sich auf Grundstücke; Besitz auf bewegliche Sachen."},
      {v: "C", t: "Eigentümer dürfen die Sache nutzen; Besitzer dürfen sie nur aufbewahren."},
      {v: "D", t: "Eigentum ist zeitlich unbeschränkt; Besitz ist immer befristet."}
    ],
    correct: "A",
    explain: "Eigentum ist das umfassendste dingliche Recht an einer Sache (Art. 641 ZGB) — es verleiht die alleinige Herrschaft. Besitz hingegen ist kein Recht, sondern ein äusserlich wahrnehmbarer Sachverhalt: die tatsächliche Gewalt über eine Sache (Art. 919 ZGB). Der Besitzer muss nicht zugleich Eigentümer sein."
  },
  {
    id: "b03", topic: "eigentum_besitz", type: "mc", diff: 2, tax: "K3",
    context: "Hans Eugster hat bei der Auto-Interleasing AG einen Peugeot geleast.",
    q: "Wer ist Eigentümer und wer ist Besitzer des Peugeot?",
    options: [
      {v: "A", t: "Hans Eugster ist Eigentümer und Besitzer."},
      {v: "B", t: "Die Auto-Interleasing AG ist Eigentümerin und Besitzerin."},
      {v: "C", t: "Hans Eugster ist Besitzer; die Auto-Interleasing AG ist Eigentümerin."},
      {v: "D", t: "Hans Eugster ist Eigentümer; die Auto-Interleasing AG ist Besitzerin."}
    ],
    correct: "C",
    explain: "Beim Leasing wird die Sache dem Leasingnehmer zum Gebrauch überlassen, das Eigentum verbleibt aber bei der Leasinggeberin. Hans Eugster hat die tatsächliche Gewalt über den Peugeot — er ist Besitzer (Art. 919 ZGB). Die Auto-Interleasing AG bleibt Eigentümerin (Art. 641 ZGB). Hans Eugster ist unselbständiger Besitzer."
  },
  {
    id: "b04", topic: "eigentum_besitz", type: "tf", diff: 1, tax: "K2",
    q: "Der Besitzer einer Sache ist immer auch deren Eigentümer.",
    correct: false,
    explain: "Der Besitzer braucht nicht zugleich Eigentümer zu sein. Er kann an der Sache z.B. ein blosses Benützungsrecht haben (als Mieter oder Leasingnehmer) oder die Sache zur Aufbewahrung entgegengenommen haben. Beispiel: Ein Mieter ist Besitzer der Wohnung, aber nicht deren Eigentümer."
  },
  {
    id: "b05", topic: "eigentum_besitz", type: "mc", diff: 2, tax: "K2",
    q: "Was unterscheidet den selbständigen vom unselbständigen Besitzer?",
    options: [
      {v: "A", t: "Der selbständige Besitzer ist zugleich Eigentümer; der unselbständige Besitzer hat die Sache von einem Eigentümer zu einem obligatorischen oder dinglichen Recht erhalten."},
      {v: "B", t: "Der selbständige Besitzer besitzt die Sache länger als ein Jahr; der unselbständige weniger."},
      {v: "C", t: "Der selbständige Besitzer hat die Sache gekauft; der unselbständige hat sie gestohlen."},
      {v: "D", t: "Es gibt keinen rechtlichen Unterschied; die Begriffe werden synonym verwendet."}
    ],
    correct: "A",
    explain: "Hat der Eigentümer die Sache selbst in seiner Gewalt, ist er selbständiger Besitzer. Derjenige, dem die Sache vom Eigentümer zu einem obligatorischen oder dinglichen Recht übertragen wurde (Mieter, Pächter, Nutzniesser, Pfandgläubiger etc.), ist dagegen unselbständiger Besitzer."
  },
  {
    id: "b06", topic: "eigentum_besitz", type: "multi", diff: 2, tax: "K3",
    q: "Welche Befugnisse hat der Eigentümer gemäss Art. 641 ZGB? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Die Sache nutzen, verkaufen, vermieten, verschenken oder zerstören."},
      {v: "B", t: "Die Sache von jedem, der sie ihm vorenthält, herausverlangen (Eigentumsklage)."},
      {v: "C", t: "Jede ungerechtfertigte Einwirkung auf die Sache abwehren (Abwehrklage)."},
      {v: "D", t: "Alle Beschränkungen des öffentlichen Rechts ignorieren."}
    ],
    correct: ["A", "B", "C"],
    explain: "A, B und C sind korrekt. Art. 641 ZGB gibt dem Eigentümer die alleinige Herrschaft über die Sache: Er darf sie nutzen, verkaufen, vermieten, verschenken, verpfänden, abändern oder gar zerstören. Er kann die Sache zudem von jedem herausverlangen (Vindikationsanspruch) und jede ungerechtfertigte Einwirkung abwehren. D ist falsch: Der Eigentümer darf nur innerhalb der Schranken der Rechtsordnung verfügen — öffentlich-rechtliche Vorschriften (z.B. Bau- und Zonenordnungen) schränken die Verfügungsfreiheit ein."
  },
  {
    id: "b07", topic: "eigentum_besitz", type: "mc", diff: 2, tax: "K3",
    context: "Nach Ablauf der Mietdauer gibt der Mieter dem Vermieter das gemietete Auto nicht zurück.",
    q: "Welchen Anspruch hat der Vermieter?",
    options: [
      {v: "A", t: "Einen Vindikationsanspruch (Eigentumsklage) gemäss Art. 641 Abs. 2 ZGB."},
      {v: "B", t: "Einen Schadenersatzanspruch gemäss Art. 41 OR."},
      {v: "C", t: "Keinen Anspruch, da das Mietverhältnis beendet ist."},
      {v: "D", t: "Einen Anspruch auf Ersatz des Fahrzeugwerts."}
    ],
    correct: "A",
    explain: "Obersatz: Es ist zu prüfen, ob der Vermieter die Herausgabe des Autos verlangen kann.\n\nVoraussetzungen: Gemäss Art. 641 Abs. 2 ZGB kann der Eigentümer die Sache von jedem, der sie ihm vorenthält, herausverlangen.\n\nSubsumtion: Der Vermieter ist Eigentümer des Autos. Nach Ablauf der Mietdauer hat der Mieter keinen Rechtstitel mehr, das Auto zu behalten. Der Vermieter kann die Herausgabe verlangen.\n\nSchlussfolgerung: Der Vermieter hat einen Vindikationsanspruch (Eigentumsklage) gemäss Art. 641 Abs. 2 ZGB."
  },
  {
    id: "b08", topic: "eigentum_besitz", type: "multi", diff: 3, tax: "K4",
    q: "Wodurch kann die Verfügungsfreiheit des Eigentümers eingeschränkt werden? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Durch öffentlich-rechtliche Vorschriften (z.B. Bau- und Zonenordnungen, Umweltschutz)."},
      {v: "B", t: "Durch privatrechtliche Vorschriften (z.B. Nachbarrecht, Art. 684 ZGB)."},
      {v: "C", t: "Durch Rechtsgeschäfte (z.B. Dienstbarkeiten, Pfandrechte, Vermietung)."},
      {v: "D", t: "Durch den blossen Wunsch des Nachbarn."}
    ],
    correct: ["A", "B", "C"],
    explain: "Der Eigentümer darf nur «innerhalb der Schranken der Rechtsordnung» verfügen (Art. 641 ZGB). A ist korrekt: Öffentlich-rechtliche Gesetze wie Bau- und Zonenordnungen schränken das Eigentumsrecht ein. B ist korrekt: Privatrechtliche Vorschriften wie das Nachbarrecht (Art. 684 ZGB) verlangen Rücksichtnahme. C ist korrekt: Der Eigentümer kann sein Eigentum auch freiwillig durch Rechtsgeschäfte einschränken, z.B. durch Einräumung von Dienstbarkeiten oder Pfandrechten. D ist falsch: Ein blosser Wunsch begründet keine Einschränkung."
  },
  {
    id: "b09", topic: "eigentum_besitz", type: "mc", diff: 3, tax: "K4",
    context: "Ein Mofafahrer entreisst beim Vorbeifahren der 72-jährigen Ottilie F. die Handtasche und flüchtet.",
    q: "Wie ist die sachenrechtliche Situation zu beurteilen?",
    options: [
      {v: "A", t: "Ottilie F. bleibt Eigentümerin der Handtasche. Der Mofafahrer ist unselbständiger Besitzer."},
      {v: "B", t: "Der Mofafahrer wird durch den Raub sowohl Eigentümer als auch Besitzer der Handtasche."},
      {v: "C", t: "Ottilie F. verliert sowohl Eigentum als auch Besitz an der Handtasche."},
      {v: "D", t: "Der Mofafahrer wird Besitzer der Handtasche, aber Ottilie F. bleibt Eigentümerin."}
    ],
    correct: "D",
    explain: "Ottilie F. bleibt Eigentümerin der Handtasche (einschliesslich des Inhalts). Das Eigentum geht nicht durch Raub über — dazu wäre ein gültiger Rechtsgrund erforderlich (Art. 714 ZGB). Seit dem Raub hat aber der Mofafahrer die tatsächliche Herrschaft über die Handtasche. Der Mofafahrer ist (unselbständiger) Besitzer. Ottilie F. kann die Handtasche gemäss Art. 641 Abs. 2 ZGB vom Mofafahrer herausverlangen."
  },
  {
    id: "b10", topic: "eigentum_besitz", type: "tf", diff: 2, tax: "K2",
    q: "Der Eigentümer eines Gartengrills darf jeden Abend auf dem Balkon grillieren, da er ja Eigentümer des Grills ist.",
    correct: false,
    explain: "Das Eigentumsrecht gilt nur innerhalb der Schranken der Rechtsordnung. Gemäss Art. 684 ZGB (Nachbarrecht) muss der Eigentümer auf die Interessen seiner Nachbarn Rücksicht nehmen. Übermässige Rauch- und Geruchsimmissionen durch tägliches Grillieren können gegen das Nachbarrecht verstossen."
  },

  // ============================================================
  // TOPIC: formen (Formen des Eigentums)
  // ============================================================

  {
    id: "f01", topic: "formen", type: "mc", diff: 1, tax: "K1",
    q: "Welche Formen des gemeinschaftlichen Eigentums kennt das ZGB?",
    options: [
      {v: "A", t: "Miteigentum und Gesamteigentum"},
      {v: "B", t: "Alleineigentum und Teileigentum"},
      {v: "C", t: "Privateigentum und öffentliches Eigentum"},
      {v: "D", t: "Fahrniseigentum und Grundeigentum"}
    ],
    correct: "A",
    explain: "Das ZGB unterscheidet beim gemeinschaftlichen Eigentum zwischen Miteigentum (Art. 646 ff. ZGB) und Gesamteigentum (Art. 652 ff. ZGB). Das Stockwerkeigentum ist eine besondere Form des Miteigentums (qualifiziertes Miteigentum, Art. 712a ff. ZGB)."
  },
  {
    id: "f02", topic: "formen", type: "fill", diff: 1, tax: "K1",
    q: "Beim Miteigentum steht jedem Miteigentümer ein ideeller {0} (Wertquote) zu. Die Auflösung des Miteigentums kann vertraglich auf höchstens {1} Jahre ausgeschlossen werden.",
    blanks: [
      {answer: "Bruchteil", alts: ["bruchteil", "Bruchteil (Wertquote)"]},
      {answer: "50", alts: ["fünfzig"]}
    ],
    explain: "Jedem Miteigentümer steht an der gemeinsamen Sache ein ideeller Bruchteil (Wertquote) zu. Wenn nichts anderes bestimmt ist, gilt die Vermutung gleicher Anteile (Art. 646 Abs. 2 ZGB). Die Auflösung kann gemäss Art. 650 Abs. 2 ZGB vertraglich auf höchstens 50 Jahre ausgeschlossen werden."
  },
  {
    id: "f03", topic: "formen", type: "mc", diff: 2, tax: "K2",
    q: "Was unterscheidet Miteigentum von Gesamteigentum?",
    options: [
      {v: "A", t: "Beim Miteigentum hat jeder einen ideellen Bruchteil und kann darüber frei verfügen; beim Gesamteigentum können die Eigentümer nur gemeinsam über die Sache verfügen."},
      {v: "B", t: "Beim Miteigentum gehört die Sache einer Person; beim Gesamteigentum mehreren."},
      {v: "C", t: "Miteigentum betrifft nur Grundstücke; Gesamteigentum nur bewegliche Sachen."},
      {v: "D", t: "Miteigentum entsteht durch Vertrag; Gesamteigentum nur durch Erbgang."}
    ],
    correct: "A",
    explain: "Beim Miteigentum (Art. 646 ff. ZGB) hat jeder Miteigentümer einen ideellen Bruchteil (Wertquote), über den er grundsätzlich frei verfügen kann. Beim Gesamteigentum (Art. 652 ff. ZGB) hat der einzelne Gesamteigentümer keinen Anteil, über den er allein verfügen kann. Alle Gesamteigentümer sind gemeinsam berechtigt und benötigen einen einstimmigen Beschluss, um über die Sache zu verfügen (Art. 653 Abs. 2 ZGB)."
  },
  {
    id: "f04", topic: "formen", type: "multi", diff: 2, tax: "K2",
    q: "Welche Aussagen zum Stockwerkeigentum treffen zu? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Das Stockwerkeigentum ist ein qualifiziertes Miteigentum (Art. 712a ff. ZGB)."},
      {v: "B", t: "Jeder Stockwerkeigentümer hat ein Sonderrecht, seine Einheit allein zu benutzen, zu verwalten und innen auszubauen."},
      {v: "C", t: "Ein Stockwerkeigentümer kann seinen Anteil ohne Zustimmung der anderen frei verkaufen."},
      {v: "D", t: "Die Stockwerkeigentümergemeinschaft ist eine juristische Person mit Handelsregistereintrag."}
    ],
    correct: ["A", "B", "C"],
    explain: "A ist korrekt: Stockwerkeigentum ist gemäss Art. 712a ff. ZGB qualifiziertes Miteigentum. B ist korrekt: Das Sonderrecht gibt dem Stockwerkeigentümer das Recht, seine Einheit allein zu benutzen, zu verwalten und innen auszubauen (Art. 712a Abs. 2 ZGB). C ist korrekt: Im Gegensatz zum gewöhnlichen Miteigentum besteht beim Stockwerkeigentum kein gesetzliches Vorkaufsrecht — jeder kann seinen Anteil frei verkaufen (Art. 712c ZGB: nur wenn vereinbart). D ist falsch: Die Gemeinschaft ist zwar beschränkt rechts- und handlungsfähig (Art. 712l ZGB), aber keine juristische Person und wird nicht ins Handelsregister eingetragen."
  },
  {
    id: "f05", topic: "formen", type: "mc", diff: 2, tax: "K3",
    context: "Zwei Schwestern erben je zur Hälfte den Nachlass ihres verstorbenen Vaters. Im Nachlass befindet sich ein Haus.",
    q: "Um welche Form des gemeinschaftlichen Eigentums handelt es sich?",
    options: [
      {v: "A", t: "Miteigentum, da die Schwestern je zur Hälfte erben."},
      {v: "B", t: "Gesamteigentum, da die Erbengemeinschaft kraft Gesetzes eine Gemeinschaft zur gesamten Hand bildet."},
      {v: "C", t: "Stockwerkeigentum, da das Haus in Stockwerke aufgeteilt werden kann."},
      {v: "D", t: "Alleineigentum der älteren Schwester, da sie zuerst erbt."}
    ],
    correct: "B",
    explain: "Bei der Erbengemeinschaft bilden die Erben von Gesetzes wegen eine Gemeinschaft zur gesamten Hand (Art. 602 ZGB). Das Haus steht somit im Gesamteigentum beider Schwestern. Über den Nachlass können sie nur gemeinsam verfügen. Auch wenn jede Schwester rechnerisch Anspruch auf die Hälfte hat, kann sie — solange die Erbengemeinschaft besteht — nicht über ihren Anteil selbständig verfügen."
  },
  {
    id: "f06", topic: "formen", type: "mc", diff: 3, tax: "K3",
    context: "An der Stockwerkeigentümerversammlung nehmen von den total 12 Stockwerkeigentümern 11 teil, welche 920 von 1000 Wertquoten vertreten. Sechs Miteigentümer, welche 450 Wertquoten vertreten, stimmen für den Bau einer Pergola. Die anderen fünf Miteigentümer sind dagegen.",
    q: "Ist der Bau der Pergola beschlossen worden?",
    options: [
      {v: "A", t: "Ja, weil die Mehrheit der anwesenden Eigentümer dafür gestimmt hat."},
      {v: "B", t: "Nein, weil eine luxuriöse bauliche Massnahme die Zustimmung aller Miteigentümer erfordert."},
      {v: "C", t: "Ja, weil mehr als die Hälfte der Wertquoten dafür gestimmt hat."},
      {v: "D", t: "Nein, weil weder die Mehrheit aller Stockwerkeigentümer noch die Mehrheit der Wertquoten erreicht wurde."}
    ],
    correct: "D",
    explain: "Obersatz: Es ist zu prüfen, ob der Bau einer Pergola gültig beschlossen wurde.\n\nVoraussetzungen: Eine Pergola ist als nützliche bauliche Massnahme einzustufen (Art. 647d ZGB), da sie eine Wertsteigerung oder Verbesserung der Gebrauchsfähigkeit darstellt. Dafür braucht es die Zustimmung der Mehrheit der Miteigentümer, die auch die Mehrheit der Wertquoten halten.\n\nSubsumtion: Beim Stockwerkeigentum wird die Mehrheit von der Gesamtzahl aller stimmberechtigten Miteigentümer berechnet (nicht nur der Anwesenden). 6 von 12 Eigentümern haben zugestimmt — das ist keine Mehrheit (mindestens 7 von 12 nötig). Zudem halten die Befürworter nur 450 von 1000 Wertquoten — das ist weniger als die Hälfte.\n\nSchlussfolgerung: Weder die Kopfmehrheit noch die Quotenmehrheit ist erreicht. Der Bau ist nicht beschlossen."
  },
  {
    id: "f07", topic: "formen", type: "tf", diff: 2, tax: "K2",
    q: "Beim Gesamteigentum kann jeder einzelne Gesamteigentümer über seinen rechnerischen Anteil frei verfügen.",
    correct: false,
    explain: "Beim Gesamteigentum hat der einzelne Gesamteigentümer keinen Anteil, über den er allein verfügen kann (Art. 652 ff. ZGB). Von einem «Anteil» kann rechtlich nur gesprochen werden als Anwartschaft auf das Liquidationsergebnis bei Auflösung der Gesamthandschaft. Alle Gesamteigentümer benötigen einen einstimmigen Beschluss, um über die Sache zu verfügen (Art. 653 Abs. 2 ZGB)."
  },
  {
    id: "f08", topic: "formen", type: "mc", diff: 3, tax: "K4",
    context: "Die Terrasse des Stockwerkeigentümers A muss saniert werden, weil sie undicht ist. Stockwerkeigentümer B ist der Meinung, A müsse allein für die Sanierungskosten aufkommen, weil er ja auch das alleinige Nutzungsrecht habe.",
    q: "Wer ist im Recht?",
    options: [
      {v: "A", t: "B ist im Recht: A hat das alleinige Nutzungsrecht und muss daher allein bezahlen."},
      {v: "B", t: "A ist im Recht: B muss sich an den Kosten beteiligen, da die Terrasse als zwingend gemeinschaftlicher Teil zur Gebäudestruktur gehört."},
      {v: "C", t: "Keiner ist im Recht: Die Versicherung muss die Kosten übernehmen."},
      {v: "D", t: "A ist im Recht, aber nur wenn die Sanierung weniger als CHF 10'000 kostet."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, wer die Kosten der Terrassensanierung tragen muss.\n\nVoraussetzungen: Gemäss Art. 712h Abs. 2 ZGB sind die Kosten für gemeinschaftliche Teile von allen Eigentümern im Verhältnis ihrer Wertquoten zu tragen. Terrassen gehören als äussere Gebäudebestandteile zu den zwingend gemeinschaftlichen Teilen, auch wenn nur ein Eigentümer das Nutzungsrecht hat.\n\nSubsumtion: Die Sanierung einer undichten Terrasse betrifft die Gebäudesubstanz (Abdichtung), die zu den gemeinschaftlichen Teilen gehört. A hat zwar das Sondernutzungsrecht an der Terrasse, doch die bauliche Substanz ist Gemeinschaftssache.\n\nSchlussfolgerung: A ist im Recht. B muss sich an den Sanierungskosten entsprechend seiner Wertquote beteiligen."
  },
  {
    id: "f09", topic: "formen", type: "fill", diff: 1, tax: "K1",
    q: "Das Stockwerkeigentum ist im {0} ab Art. {1} geregelt.",
    blanks: [
      {answer: "ZGB", alts: ["Zivilgesetzbuch"]},
      {answer: "712a", alts: ["712a ZGB"]}
    ],
    explain: "Das Stockwerkeigentum ist in den Art. 712a ff. ZGB geregelt. Es wurde in der Schweiz erst in den 1960er-Jahren eingeführt und ist die in der Praxis häufigste Form des gemeinschaftlichen Eigentums bei Mehrfamilienhäusern."
  },
  {
    id: "f10", topic: "formen", type: "tf", diff: 3, tax: "K4",
    q: "Beim Stockwerkeigentum wird die Mehrheit für Beschlüsse von der Anzahl der anwesenden Stimmberechtigten berechnet.",
    correct: false,
    explain: "Beim Stockwerkeigentum erfolgt die Berechnung der Mehrheiten grundsätzlich aufgrund der Gesamtzahl aller stimmberechtigten Miteigentümer — nicht nur der anwesenden (Fussnote 26 im Lehrbuch). Dies ist ein Unterschied zum allgemeinen Miteigentum. Die Versammlung ist beschlussfähig, wenn die Hälfte aller Stockwerkeigentümer, mindestens die Hälfte der Wertquoten haltend, anwesend oder vertreten sind (Art. 712p ZGB)."
  },

  // ============================================================
  // TOPIC: erwerb_verlust (Erwerb und Verlust des Eigentums)
  // ============================================================

  {
    id: "w01", topic: "erwerb_verlust", type: "mc", diff: 1, tax: "K1",
    q: "Wie unterscheidet sich der Eigentumserwerb bei beweglichen und unbeweglichen Sachen?",
    options: [
      {v: "A", t: "Bei beweglichen Sachen durch Besitzübertragung (Art. 714 ZGB); bei Grundstücken durch Grundbucheintrag (Art. 656 ZGB)."},
      {v: "B", t: "Bei beweglichen Sachen durch Grundbucheintrag; bei Grundstücken durch Besitzübertragung."},
      {v: "C", t: "In beiden Fällen durch schriftlichen Vertrag."},
      {v: "D", t: "In beiden Fällen durch Bezahlung des Kaufpreises."}
    ],
    correct: "A",
    explain: "Art. 714 ZGB regelt den Erwerb des Fahrniseigentums: Zur Übertragung bedarf es des Übergangs des Besitzes auf den Erwerber. Art. 656 ZGB regelt den Erwerb des Grundeigentums: Dazu bedarf es der Eintragung des Erwerbers im Grundbuch. Die Bezahlung des Kaufpreises spielt für den Eigentumsübergang keine Rolle."
  },
  {
    id: "w02", topic: "erwerb_verlust", type: "tf", diff: 1, tax: "K2",
    q: "Beim Kauf einer beweglichen Sache wird der Käufer erst Eigentümer, wenn er den Kaufpreis vollständig bezahlt hat.",
    correct: false,
    explain: "Beim Kauf einer beweglichen Sache spielt die Bezahlung des Kaufpreises für den Eigentumsübergang keine Rolle. Der Käufer wird Eigentümer, sobald er Besitzer geworden ist (Art. 714 ZGB). Gleichgültig, ob die Sache sofort bezahlt (Barkauf) oder gegen Rechnung gekauft wird (Kreditkauf). Falls der Käufer die Rechnung nicht bezahlen kann, bleibt dem Verkäufer nur die Betreibung."
  },
  {
    id: "w03", topic: "erwerb_verlust", type: "fill", diff: 1, tax: "K1",
    q: "Beim {0} Eigentumserwerb entsteht das Eigentum neu (z.B. Aneignung herrenloser Sachen). Beim {1} Eigentumserwerb wird das Eigentum vom bisherigen Eigentümer abgeleitet (z.B. Kauf).",
    blanks: [
      {answer: "originären", alts: ["originaeren", "Originären", "originär"]},
      {answer: "derivativen", alts: ["Derivativen", "derivativ"]}
    ],
    explain: "Man unterscheidet originären (ursprünglichen) und derivativen (abgeleiteten) Eigentumserwerb. Originärer Erwerb: z.B. Aneignung herrenloser Sachen (Art. 718 ZGB), Ersitzung (Art. 728 ZGB), Fund (Art. 722 ZGB). Derivativer Erwerb: z.B. Rechtsgeschäft (Kauf, Schenkung), Erbgang (Art. 560 ZGB), hoheitlicher Akt (Enteignung)."
  },
  {
    id: "w04", topic: "erwerb_verlust", type: "multi", diff: 2, tax: "K2",
    q: "Welche der folgenden Fälle sind Beispiele für originären Eigentumserwerb? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Aneignung herrenloser Sachen (Art. 718 ZGB)"},
      {v: "B", t: "Kauf eines Autos"},
      {v: "C", t: "Ersitzung nach fünf Jahren gutgläubigem Besitz (Art. 728 ZGB)"},
      {v: "D", t: "Fund, wenn der Eigentümer während fünf Jahren nicht festgestellt werden kann (Art. 722 ZGB)"}
    ],
    correct: ["A", "C", "D"],
    explain: "A, C und D sind Fälle des originären (ursprünglichen) Eigentumserwerbs, bei dem das Eigentum neu entsteht. B (Kauf) ist ein derivativer (abgeleiteter) Eigentumserwerb — das Eigentum wird vom bisherigen Eigentümer auf den Käufer übertragen."
  },
  {
    id: "w05", topic: "erwerb_verlust", type: "mc", diff: 2, tax: "K2",
    q: "Was bedeutet «Brevi manu traditio»?",
    options: [
      {v: "A", t: "Die Sache ist bereits beim neuen Eigentümer (z.B. vorher ausgeliehen); die Eigentumsübertragung erfolgt durch blosse Erklärung."},
      {v: "B", t: "Die Sache wird einem Dritten zur Aufbewahrung übergeben."},
      {v: "C", t: "Die Sache wird bei einer öffentlichen Versteigerung erworben."},
      {v: "D", t: "Die Sache wird aufgrund eines Rechtsgeschäfts beim Veräusserer zurückbehalten."}
    ],
    correct: "A",
    explain: "Bei der Brevi manu traditio ist die Sache bereits beim neuen Eigentümer. Beispiel: A hat B einen Kugelschreiber ausgeliehen. Nun will A ihn B schenken. Es genügt die Erklärung, dass B den Kugelschreiber behalten könne — eine physische Übergabe ist nicht nötig, da B die Sache bereits besitzt."
  },
  {
    id: "w06", topic: "erwerb_verlust", type: "mc", diff: 2, tax: "K2",
    q: "Was versteht man unter einem «Besitzkonstitut» (Art. 717 ZGB)?",
    options: [
      {v: "A", t: "Der Veräusserer überträgt das Eigentum, behält die Sache aber aufgrund eines besonderen Rechtsverhältnisses (z.B. Mietvertrag, Leihe) zurück."},
      {v: "B", t: "Die Sache wird einem Dritten zur Aufbewahrung übergeben."},
      {v: "C", t: "Die Sache wird durch Erklärung an den bereits besitzenden Erwerber übertragen."},
      {v: "D", t: "Die Sache wird durch Übergabe des Schlüssels zum Lager übertragen."}
    ],
    correct: "A",
    explain: "Beim Besitzkonstitut (Art. 717 ZGB) kann der Veräusserer den Besitz (und damit das Eigentum) an den Erwerber übertragen, dabei jedoch die Sache aufgrund eines besonderen Rechtsverhältnisses (z.B. Mietvertrag, Leihe, Hinterlegungsvertrag) zurückbehalten. Beispiel: Ein Sammler kauft einen Oldtimer, der noch in der Garage des Verkäufers bleibt, bis der Käufer seine eigene Garage gebaut hat."
  },
  {
    id: "w07", topic: "erwerb_verlust", type: "mc", diff: 2, tax: "K3",
    context: "Heinz hat seiner Schwester vor einigen Wochen ein Buch ausgeliehen. Nun möchte er es ihr schenken. Er teilt ihr mit, sie könne das Buch behalten.",
    img: {src: "img/recht/sachenrecht/sachenrecht_erwerb_01.svg", alt: "Übersicht: Originärer und derivativer Eigentumserwerb mit Publizitätsprinzip"},
    q: "In welchem Moment wird die Schwester Eigentümerin des Buches?",
    options: [
      {v: "A", t: "Sofort, mit der Mitteilung von Heinz — es handelt sich um eine Brevi manu traditio."},
      {v: "B", t: "Erst wenn sie das Buch nochmals physisch in die Hand nimmt."},
      {v: "C", t: "Erst wenn ein schriftlicher Schenkungsvertrag vorliegt."},
      {v: "D", t: "Gar nicht, weil ausgeliehene Bücher nicht verschenkt werden können."}
    ],
    correct: "A",
    explain: "Die Schwester ist bereits Besitzerin des Buches (sie hat es ausgeliehen). Für die Besitz- und Eigentumsübertragung genügt daher die Erklärung von Heinz, sie könne das Buch behalten (Schenkungsofferte). Sobald die Schwester die Offerte annimmt, wird sie vom unselbständigen zum selbständigen Besitzer — und damit zur Eigentümerin. Diese Art der Besitz- und Eigentumsübertragung heisst Brevi manu traditio."
  },
  {
    id: "w08", topic: "erwerb_verlust", type: "mc", diff: 1, tax: "K1",
    q: "Wie kann ein Eigentümer sein Eigentum verlieren?",
    options: [
      {v: "A", t: "Durch Rechtsübertragung, Dereliktion (Aufgabe) oder Untergang der Sache."},
      {v: "B", t: "Nur durch Verkauf."},
      {v: "C", t: "Nur durch gerichtliches Urteil."},
      {v: "D", t: "Eigentum kann nicht verloren gehen."}
    ],
    correct: "A",
    explain: "Der Eigentümer verliert sein Eigentum am häufigsten durch Rechtsübertragung auf einen neuen Eigentümer (Verkauf, Schenkung, Enteignung). Er kann sein Recht aber auch aufgeben, ohne es einem anderen zu übertragen — die sogenannte Dereliktion. Zudem geht das Eigentum durch Untergang der Sache verloren (Zerstörung, Verbrauch)."
  },
  {
    id: "w09", topic: "erwerb_verlust", type: "tf", diff: 2, tax: "K2",
    q: "Wer seinen alten Bürostuhl mit einem Zettel «zum Mitnehmen» an den Strassenrand stellt, gibt damit sein Eigentum auf (Dereliktion).",
    correct: true,
    explain: "Wer seine Sache irgendwo stehen oder liegen lässt und dabei den Herrschaftswillen aufgibt (Dereliktion), verliert sein Eigentumsrecht. Die Sache wird herrenlos und kann von jedermann originär zu Eigentum erworben werden. Der Zettel «zum Mitnehmen» signalisiert den Aufgabewillen."
  },
  {
    id: "w10", topic: "erwerb_verlust", type: "mc", diff: 3, tax: "K4",
    context: "K. Etter kauft bei einem Weinhändler drei Kisten Bordeaux-Wein für CHF 7'200 und bezahlt den Kaufpreis. Die Lieferung soll Ende Oktober erfolgen. Vor der Lieferung wird über den Weinhändler der Konkurs eröffnet.",
    q: "Kann K. Etter vom Konkursamt verlangen, dass die Weine als sein Eigentum ausgesondert und an ihn ausgehändigt werden?",
    options: [
      {v: "A", t: "Ja, denn K. Etter hat den Kaufpreis bezahlt und ist damit Eigentümer geworden."},
      {v: "B", t: "Nein, denn K. Etter hat die Weine nie erhalten — er ist nicht Eigentümer geworden. Der Besitz wurde nie übertragen."},
      {v: "C", t: "Ja, denn bei Barkauf wird der Käufer sofort Eigentümer."},
      {v: "D", t: "Ja, aber nur wenn die Weine bereits in separaten Kisten bereitstanden."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob K. Etter Eigentümer der Weine geworden ist.\n\nVoraussetzungen: Gemäss Art. 714 ZGB bedarf es zur Übertragung des Fahrniseigentums des Übergangs des Besitzes auf den Erwerber. Die Bezahlung des Kaufpreises spielt keine Rolle.\n\nSubsumtion: K. Etter hat zwar den Kaufpreis bezahlt, aber die Weine wurden ihm nie geliefert — der Besitz ist nie auf ihn übergegangen. Ohne Besitzübergang kein Eigentumsübergang.\n\nSchlussfolgerung: K. Etter ist nicht Eigentümer der Weine geworden. Er kann keine Aussonderung verlangen, sondern muss seine Forderung als Konkursforderung anmelden."
  },
  {
    id: "w11", topic: "erwerb_verlust", type: "mc", diff: 3, tax: "K4",
    context: "Peter Hotz betreibt eine Druckerei und gerät in finanzielle Schieflage. Sein Vater kauft ihm eine Druckmaschine für CHF 200'000 ab und stellt sie ihm sogleich, gestützt auf einen Leasingvertrag, wieder zur Verfügung. Wenige Monate später wird über Peter Hotz der Konkurs eröffnet.",
    q: "Fällt die Druckmaschine in die Konkursmasse oder kann sie der Vater als sein Eigentum aussondern lassen?",
    options: [
      {v: "A", t: "Der Vater kann die Maschine aussondern, da er Eigentümer ist — das Sale-and-Lease-back-Geschäft ist grundsätzlich gültig."},
      {v: "B", t: "Die Maschine fällt in die Konkursmasse, weil Peter nie den Besitz an den Vater übergeben hat."},
      {v: "C", t: "Der Vater kann die Maschine nur aussondern, wenn er den Kaufpreis bar bezahlt hat."},
      {v: "D", t: "Die Maschine fällt automatisch in die Konkursmasse, weil Geschäfte unter Verwandten nichtig sind."}
    ],
    correct: "A",
    explain: "Obersatz: Es ist zu prüfen, ob der Vater Eigentümer der Druckmaschine ist.\n\nVoraussetzungen: Beim Sale-and-Lease-back kauft der Vater die Maschine (Eigentumserwerb) und stellt sie Peter sofort via Leasingvertrag wieder zur Verfügung (Besitzkonstitut gemäss Art. 717 ZGB). Beim Besitzkonstitut bleibt die Sache beim Veräusserer aufgrund eines besonderen Rechtsverhältnisses.\n\nSubsumtion: Der Vater hat die Maschine gekauft und das Eigentum via Besitzkonstitut erworben — Peter behält die Maschine aufgrund des Leasingvertrags. Der Vater ist Eigentümer, Peter ist unselbständiger Besitzer.\n\nSchlussfolgerung: Der Vater kann die Druckmaschine als sein Eigentum aussondern lassen. Das Sale-and-Lease-back ist ein gültiges Rechtsgeschäft."
  },

  // ============================================================
  // TOPIC: gutglaeubig (Schutz des gutgläubigen Besitzers)
  // ============================================================

  {
    id: "g01", topic: "gutglaeubig", type: "tf", diff: 1, tax: "K1",
    q: "Gemäss Art. 930 ZGB wird vermutet, dass der Besitzer einer Sache auch deren Eigentümer ist.",
    correct: true,
    explain: "Art. 930 ZGB stellt die gesetzliche Vermutung auf, dass der Besitzer einer Sache auch ihr Eigentümer ist. Wer in gutem Glauben auf diesen Rechtsschein vertraut, darf nach schweizerischer Rechtsauffassung in seinem Vertrauen nicht enttäuscht werden."
  },
  {
    id: "g02", topic: "gutglaeubig", type: "mc", diff: 1, tax: "K2",
    q: "Wovon hängt die Rechtsfolge beim Erwerb einer Sache vom Nichteigentümer ab?",
    options: [
      {v: "A", t: "Ob die Sache dem Eigentümer anvertraut oder abhanden gekommen ist, und ob der Erwerber gutgläubig war."},
      {v: "B", t: "Nur davon, ob der Kaufpreis angemessen war."},
      {v: "C", t: "Nur davon, ob der Verkauf öffentlich stattfand."},
      {v: "D", t: "Davon, ob der Nichteigentümer vorbestraft ist."}
    ],
    correct: "A",
    explain: "Zwei Voraussetzungen sind entscheidend: 1) Hat der Eigentümer die Sache freiwillig aus der Hand gegeben (anvertraut, z.B. verliehen/vermietet) oder ist sie ihm gegen seinen Willen abhanden gekommen (gestohlen/verloren)? 2) War der Erwerber gutgläubig? Diese Unterscheidung führt zu verschiedenen Rechtsfolgen gemäss Art. 933 und Art. 934 ZGB."
  },
  {
    id: "g03", topic: "gutglaeubig", type: "mc", diff: 2, tax: "K2",
    q: "Was regelt Art. 933 ZGB (anvertraute Sachen)?",
    options: [
      {v: "A", t: "Wer eine bewegliche Sache in gutem Glauben zu Eigentum erhält, ist in seinem Erwerb geschützt, auch wenn der Veräusserer nicht zur Übertragung berechtigt war."},
      {v: "B", t: "Gestohlene Sachen müssen immer zurückgegeben werden."},
      {v: "C", t: "Der Erwerber hat keinen Schutz, wenn er von einem Nichteigentümer kauft."},
      {v: "D", t: "Anvertraute Sachen gehen automatisch in das Eigentum des Besitzers über."}
    ],
    correct: "A",
    explain: "Art. 933 ZGB schützt den gutgläubigen Erwerber bei anvertrauten Sachen. Wenn der Eigentümer die Sache freiwillig einem Dritten anvertraut hat (z.B. verliehen, vermietet, verpfändet) und dieser sie ohne Berechtigung weiterverkauft, wird der gutgläubige Erwerber Eigentümer. Der ursprüngliche Eigentümer kann die Sache nicht zurückverlangen — ihm bleiben nur Schadenersatzansprüche gegen den Veräusserer."
  },
  {
    id: "g04", topic: "gutglaeubig", type: "mc", diff: 2, tax: "K3",
    context: "Irina leiht ihrer Freundin Sylvia ein Buch. Als Ruth zu Besuch kommt, sieht sie das Buch und interessiert sich dafür. Sylvia schenkt es ihr. Ruth weiss nicht, dass das Buch Irina gehört.",
    q: "Ist Ruth Eigentümerin des Buches geworden?",
    options: [
      {v: "A", t: "Ja, Ruth ist gutgläubig und die Sache war der Veräusserin Sylvia anvertraut (Art. 933 ZGB)."},
      {v: "B", t: "Nein, weil Sylvia keine Berechtigung hatte, das Buch zu verschenken."},
      {v: "C", t: "Nein, weil man geschenkte Sachen nicht gutgläubig erwerben kann."},
      {v: "D", t: "Ja, aber nur wenn das Buch mehr als CHF 100 wert ist."}
    ],
    correct: "A",
    explain: "Obersatz: Es ist zu prüfen, ob Ruth gutgläubig Eigentum am Buch erworben hat.\n\nTatbestandsmerkmale Art. 933 ZGB: 1) Die Eigentümerin Irina hat das Buch der Veräusserin Sylvia anvertraut (ausgeliehen). ✓ 2) Sylvia hat das Buch ohne Berechtigung an Ruth verschenkt (veräussert). ✓ 3) Ruth war gutgläubig — sie wusste nicht, dass das Buch Irina gehört. ✓\n\nSchlussfolgerung: Alle Tatbestandsmerkmale von Art. 933 ZGB sind erfüllt. Ruth ist Eigentümerin des Buches geworden. Irina kann das Buch nicht von Ruth herausverlangen, sondern muss sich an Sylvia halten."
  },
  {
    id: "g05", topic: "gutglaeubig", type: "mc", diff: 2, tax: "K2",
    q: "Was geschieht, wenn dem Eigentümer eine Sache gestohlen wird und ein gutgläubiger Dritter sie kauft?",
    options: [
      {v: "A", t: "Der Eigentümer kann sie gemäss Art. 934 ZGB während fünf Jahren herausverlangen."},
      {v: "B", t: "Der gutgläubige Käufer wird sofort Eigentümer."},
      {v: "C", t: "Der Dieb wird nach einem Jahr automatisch Eigentümer."},
      {v: "D", t: "Der Eigentümer verliert seinen Anspruch sofort."}
    ],
    correct: "A",
    explain: "Gemäss Art. 934 ZGB kann der Besitzer, dem eine bewegliche Sache gestohlen wird, verloren geht oder sonst gegen seinen Willen abhanden kommt, sie während fünf Jahren jedem Empfänger abfordern. Die Sache ist dem Eigentümer «abhanden gekommen» — daher gelten strengere Regeln als bei anvertrauten Sachen. Der gutgläubige Erwerber wird hier nicht sofort Eigentümer."
  },
  {
    id: "g06", topic: "gutglaeubig", type: "mc", diff: 3, tax: "K4",
    context: "Frau Tobler kauft bei einem Teppichhändler für CHF 4'000 einen Seidenteppich. Zwei Jahre nach dem Kauf erscheint die Polizei: Der Teppich sei vor 3½ Jahren bei einem Wohnungseinbruch gestohlen worden. Der Teppichhändler handelt gewerbsmässig mit Teppichen.",
    img: {src: "img/recht/sachenrecht/sachenrecht_gutglaeubig_01.svg", alt: "Entscheidungsbaum: Gutgläubiger Erwerb bei abhanden gekommenen Sachen (Art. 933/934/936 ZGB)"},
    q: "Muss Frau Tobler den Teppich herausgeben?",
    options: [
      {v: "A", t: "Nein, weil sie gutgläubig war und mehr als fünf Jahre seit dem Diebstahl vergangen sind."},
      {v: "B", t: "Ja, aber nur gegen Erstattung der CHF 4'000, die sie dem Teppichhändler bezahlt hat."},
      {v: "C", t: "Ja, und zwar entschädigungslos, da die Sache gestohlen war."},
      {v: "D", t: "Nein, weil sie den Teppich bei einem Kaufmann erworben hat und gutgläubig war."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob Frau Tobler den Teppich herausgeben muss (Art. 934 ZGB).\n\nVoraussetzungen: Der Teppich ist dem Eigentümer gegen seinen Willen abhanden gekommen (Diebstahl). Seit dem Diebstahl sind 3½ + 2 = 5½ Jahre vergangen — ABER: Frau Tobler hat den Teppich innerhalb der 5-Jahres-Frist erworben (3½ Jahre nach Diebstahl). Die Frage ist daher, ob der Eigentümer innerhalb von 5 Jahren ab Diebstahl die Herausgabe verlangt.\n\nSubsumtion: Seit dem Diebstahl sind erst 5½ Jahre vergangen. Da Frau Tobler den Teppich bei einem Kaufmann erworben hat, der mit Waren der gleichen Art handelt (Art. 934 Abs. 2 ZGB), muss sie den Teppich nur gegen Vergütung des von ihr bezahlten Preises herausgeben.\n\nSchlussfolgerung: Frau Tobler muss den Teppich herausgeben, aber nur gegen Erstattung der CHF 4'000."
  },
  {
    id: "g07", topic: "gutglaeubig", type: "tf", diff: 2, tax: "K2",
    q: "Ein bösgläubiger Erwerber — d.h. jemand, der wusste oder hätte wissen müssen, dass es sich um Diebesgut handelt — ist gemäss Art. 936 ZGB in seinem Eigentumserwerb nicht geschützt.",
    correct: true,
    explain: "Gemäss Art. 936 ZGB kann der Eigentümer vom bösgläubigen Besitzer die Sache jederzeit herausverlangen — auch nach mehr als fünf Jahren. Bösgläubig ist, wer beim Erwerb wusste oder aufgrund der Umstände hätte wissen müssen, dass es sich um eine gestohlene oder verlorene Sache handelt."
  },
  {
    id: "g08", topic: "gutglaeubig", type: "multi", diff: 3, tax: "K4",
    q: "Welche Tatbestandsmerkmale müssen gemäss Art. 933 ZGB erfüllt sein, damit ein gutgläubiger Erwerber Eigentum erwirbt? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Der Eigentümer hat die Sache dem Veräusserer anvertraut (z.B. geliehen, vermietet, verpfändet)."},
      {v: "B", t: "Der Veräusserer war ohne Ermächtigung zur Veräusserung."},
      {v: "C", t: "Der Erwerber war gutgläubig (wusste nicht, dass der Veräusserer kein Recht zur Veräusserung hatte)."},
      {v: "D", t: "Der Erwerber hat die Sache bei einer öffentlichen Versteigerung erworben."}
    ],
    correct: ["A", "B", "C"],
    explain: "A, B und C sind die Tatbestandsmerkmale von Art. 933 ZGB: 1) Anvertraute Sache — der Eigentümer hat sie freiwillig dem Veräusserer überlassen. 2) Der Veräusserer handelt ohne Ermächtigung zur Veräusserung. 3) Der Erwerber ist gutgläubig. D ist kein Tatbestandsmerkmal von Art. 933 ZGB, sondern wird bei abhanden gekommenen Sachen relevant (Art. 934 Abs. 2 ZGB)."
  },
  {
    id: "g09", topic: "gutglaeubig", type: "fill", diff: 1, tax: "K1",
    q: "Bei abhanden gekommenen Sachen (Art. {0} ZGB) kann der Eigentümer sie während {1} Jahren vom gutgläubigen Empfänger zurückfordern.",
    blanks: [
      {answer: "934", alts: ["934 ZGB"]},
      {answer: "5", alts: ["fünf"]}
    ],
    explain: "Gemäss Art. 934 ZGB kann der Besitzer, dem eine bewegliche Sache gestohlen wird, verloren geht oder sonst wider seinen Willen abhanden kommt, sie während fünf Jahren jedem Empfänger abfordern. Diese Fünfjahresfrist beginnt ab dem Zeitpunkt des Abhandenkommens (Diebstahl, Verlust)."
  },

  // ============================================================
  // TOPIC: dienstbarkeiten (Dienstbarkeiten)
  // ============================================================

  {
    id: "d01", topic: "dienstbarkeiten", type: "mc", diff: 1, tax: "K1",
    q: "Welche drei Typen beschränkter dinglicher Rechte kennt das ZGB?",
    options: [
      {v: "A", t: "Dienstbarkeiten, Pfandrechte und Grundlasten"},
      {v: "B", t: "Eigentum, Besitz und Miete"},
      {v: "C", t: "Wegrecht, Baurecht und Wohnrecht"},
      {v: "D", t: "Hypothek, Grundpfandverschreibung und Schuldbrief"}
    ],
    correct: "A",
    explain: "Das ZGB kennt drei Typen beschränkter dinglicher Rechte: Dienstbarkeiten (Servitute), Pfandrechte und Grundlasten. Sie verschaffen dem Berechtigten kein Eigentum, sondern nur eine begrenzte Herrschaftsbefugnis über eine Sache, die im Eigentum eines anderen steht."
  },
  {
    id: "d02", topic: "dienstbarkeiten", type: "fill", diff: 1, tax: "K1",
    q: "Bei einer Grunddienstbarkeit spricht man vom «{0}» Grundstück (das belastet wird) und vom «{1}» Grundstück (das berechtigt wird).",
    blanks: [
      {answer: "dienenden", alts: ["Dienenden", "belasteten"]},
      {answer: "herrschenden", alts: ["Herrschenden", "berechtigten"]}
    ],
    explain: "Die Grunddienstbarkeit (Art. 730–743 ZGB) ist ein Rechtsverhältnis zwischen den Eigentümern zweier Grundstücke. Das «herrschende» (berechtigte) Grundstück profitiert von der Dienstbarkeit, das «dienende» (belastete) Grundstück muss eine Einschränkung dulden oder unterlassen."
  },
  {
    id: "d03", topic: "dienstbarkeiten", type: "mc", diff: 2, tax: "K2",
    q: "Was unterscheidet eine Grunddienstbarkeit von einer persönlichen Dienstbarkeit?",
    options: [
      {v: "A", t: "Eine Grunddienstbarkeit besteht zugunsten eines Grundstücks und ist an dieses gebunden; eine persönliche Dienstbarkeit besteht zugunsten einer bestimmten Person."},
      {v: "B", t: "Eine Grunddienstbarkeit ist immer kostenlos; eine persönliche Dienstbarkeit ist kostenpflichtig."},
      {v: "C", t: "Eine Grunddienstbarkeit betrifft nur Wege; eine persönliche Dienstbarkeit betrifft nur Wohnungen."},
      {v: "D", t: "Es gibt keinen Unterschied — die Begriffe werden synonym verwendet."}
    ],
    correct: "A",
    explain: "Der Unterschied zu den Grunddienstbarkeiten besteht darin, dass bei persönlichen Dienstbarkeiten nicht der jeweilige Eigentümer eines Grundstücks, sondern eine namentlich bezeichnete Person oder Personenmehrheit unmittelbar berechtigt ist. Die wichtigsten persönlichen Dienstbarkeiten sind das Baurecht (Art. 779 ff. ZGB) und das Wohnrecht (Art. 776 ff. ZGB)."
  },
  {
    id: "d04", topic: "dienstbarkeiten", type: "multi", diff: 2, tax: "K2",
    q: "Welche Aussagen zur Nutzniessung (Art. 745–775 ZGB) treffen zu? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Sie kann nicht nur an Grundstücken, sondern auch an beweglichen Sachen, Rechten und ganzen Vermögen bestehen."},
      {v: "B", t: "Der Nutzniesser hat Anspruch auf Besitz, Gebrauch und Nutzung der Sache."},
      {v: "C", t: "Der Nutzniesser darf das Nutzniessungsvermögen frei veräussern."},
      {v: "D", t: "Die Nutzniessung ist untrennbar mit der Person des Berechtigten verbunden und nicht vererblich."}
    ],
    correct: ["A", "B", "D"],
    explain: "A ist korrekt: Die Nutzniessung ist die einzige Dienstbarkeit, die nicht nur an Grundstücken, sondern auch an beweglichen Sachen, Rechten, Forderungen oder ganzen Vermögen bestehen kann (Art. 745 ZGB). B ist korrekt: Der Nutzniesser hat Anspruch auf Besitz, Gebrauch und Nutzung (Art. 755 Abs. 1 ZGB). C ist falsch: Das Nutzniessungsvermögen muss in seinem Bestand erhalten bleiben (Art. 764 Abs. 1 ZGB). D ist korrekt: Die Nutzniessung ist untrennbar mit der Person verbunden und nicht vererblich (Art. 748 ZGB)."
  },
  {
    id: "d05", topic: "dienstbarkeiten", type: "mc", diff: 2, tax: "K2",
    q: "Wie entsteht eine Dienstbarkeit und wie geht sie unter?",
    options: [
      {v: "A", t: "Sie entsteht mit dem Eintrag ins Grundbuch und geht mit der Löschung des Eintrags unter."},
      {v: "B", t: "Sie entsteht durch mündliche Vereinbarung und geht mit dem Tod einer Partei unter."},
      {v: "C", t: "Sie entsteht automatisch bei Grundstückskauf und geht nach 10 Jahren unter."},
      {v: "D", t: "Sie entsteht durch Gesetz und kann nicht gelöscht werden."}
    ],
    correct: "A",
    explain: "Dienstbarkeiten entstehen mit dem Eintrag ins Grundbuch (Art. 731 ZGB) und gehen mit der Löschung des Grundbucheintrags sowie mit dem vollständigen Untergang des belasteten oder berechtigten Grundstücks unter (Art. 734 ZGB). Das Rechtsgeschäft über die Errichtung bedarf der öffentlichen Beurkundung (Art. 732 ZGB)."
  },
  {
    id: "d06", topic: "dienstbarkeiten", type: "mc", diff: 2, tax: "K2",
    q: "Was zeichnet das Baurecht (Art. 779 ff. ZGB) aus?",
    options: [
      {v: "A", t: "Es gibt dem Berechtigten das Recht, auf oder unter einem fremden Grundstück ein Bauwerk zu errichten oder beizubehalten — der Eigentümer des Bauwerks und des Bodens sind verschiedene Personen."},
      {v: "B", t: "Es gibt dem Grundeigentümer das Recht, auf seinem eigenen Grundstück zu bauen."},
      {v: "C", t: "Es gibt dem Nachbarn das Recht, auf ein benachbartes Grundstück zu bauen."},
      {v: "D", t: "Es gibt dem Mieter das Recht, die gemietete Wohnung umzubauen."}
    ],
    correct: "A",
    explain: "Beim Baurecht wird ein Grundstück so belastet, dass jemand das Recht erhält, auf oder unter der Bodenfläche ein Bauwerk zu errichten oder beizubehalten (Art. 779 ZGB). Somit sind der Eigentümer des Bauwerks und der Eigentümer des Bodens verschiedene Personen. Das Baurecht kann auf höchstens 100 Jahre errichtet werden (Art. 779l ZGB)."
  },
  {
    id: "d07", topic: "dienstbarkeiten", type: "mc", diff: 3, tax: "K3",
    context: "In seinem Testament schreibt der Erblasser, dass seine Lebensgefährtin ein lebenslanges Wohnrecht in seiner Eigentumswohnung habe.",
    img: {src: "img/recht/sachenrecht/sachenrecht_systematik_01.svg", alt: "Systematik der Sachenrechte im ZGB: Eigentum, beschränkte dingliche Rechte und Besitz"},
    q: "Welche der folgenden Aussagen trifft zu?",
    options: [
      {v: "A", t: "Das Eigentum geht an die gesetzlichen Erben; die Lebensgefährtin kann aber bis zu ihrem Tod in der Wohnung leben."},
      {v: "B", t: "Die Lebensgefährtin wird Eigentümerin der Wohnung."},
      {v: "C", t: "Das Wohnrecht erlischt automatisch, wenn die Lebensgefährtin in ein Pflegeheim zieht."},
      {v: "D", t: "Die Erben können das Wohnrecht sofort nach dem Tod des Erblassers aufheben."}
    ],
    correct: "A",
    explain: "Das Wohnrecht (Art. 776 ff. ZGB) gibt der Berechtigten das Recht, in der Wohnung zu leben. Das Eigentum geht an die gesetzlichen Erben. Die Lebensgefährtin kann bis zu ihrem Tod in der Wohnung bleiben. Das Wohnrecht ist untrennbar mit der Person verbunden (Art. 776 Abs. 2 ZGB) — es ist weder übertragbar noch vererblich. C ist falsch: Der Einzug in ein Pflegeheim beendet das Wohnrecht nicht automatisch; die Berechtigte müsste darauf verzichten."
  },
  {
    id: "d08", topic: "dienstbarkeiten", type: "tf", diff: 1, tax: "K1",
    q: "Grunddienstbarkeiten sind an die Grundstücke gebunden und gelten auch für spätere Eigentümer.",
    correct: true,
    explain: "Grunddienstbarkeiten sind an die Grundstücke gebunden und gelten auch für spätere Eigentümer. Wer ein belastetes Grundstück kauft, muss die bestehende Dienstbarkeit dulden. In der Regel wird die Einwilligung zur Löschung nur gegen Bezahlung einer Entschädigung erteilt."
  },
  {
    id: "d09", topic: "dienstbarkeiten", type: "mc", diff: 3, tax: "K3",
    context: "Der Eigentümer eines Einfamilienhauses überlegt sich, ob er seiner Ehefrau ein lebenslanges Wohnrecht oder eine lebenslange Nutzniessung einräumen soll, falls sie ihn überlebt. Er will nicht, dass seine Ehefrau die Hypothekarzinsen zahlen muss.",
    q: "Wozu müsste er sich entscheiden?",
    options: [
      {v: "A", t: "Nutzniessung — bei der Nutzniessung trägt der Nutzniesser die Hypothekarzinsen als Kapitalschulden."},
      {v: "B", t: "Wohnrecht — beim Wohnrecht trägt der Eigentümer alle Kosten, auch die Hypothekarzinsen."},
      {v: "C", t: "Nutzniessung — bei der Nutzniessung muss der Eigentümer alle Kosten tragen."},
      {v: "D", t: "Es macht keinen Unterschied, da bei beiden die Kosten gleich verteilt werden."}
    ],
    correct: "B",
    explain: "Beim Wohnrecht (Art. 776 ff. ZGB) trägt der Wohnberechtigte nur die Kosten des gewöhnlichen Unterhalts (Art. 778 Abs. 1 ZGB) — also kleine Reinigungen und Reparaturen sowie die üblichen Nebenkosten. Der Eigentümer trägt die grösseren Kosten, einschliesslich Hypothekarzinsen, Versicherungen und Renovationen. Bei der Nutzniessung hingegen trägt der Nutzniesser die Auslagen für den gewöhnlichen Unterhalt und die Zinsen (Art. 765 Abs. 1 ZGB), also auch die Hypothekarzinsen. Wer also nicht will, dass die Ehefrau Hypothekarzinsen zahlen muss, sollte ein Wohnrecht einräumen."
  },

  // ============================================================
  // TOPIC: pfandrechte (Pfandrechte, Grundlasten und Grundbuch)
  // ============================================================

  {
    id: "p01", topic: "pfandrechte", type: "mc", diff: 1, tax: "K1",
    q: "Was ist die Hauptfunktion eines Pfandrechts?",
    options: [
      {v: "A", t: "Die Sicherung einer Forderung — bei Nichterfüllung kann der Pfandgegenstand verwertet werden."},
      {v: "B", t: "Die Übertragung des Eigentums an den Gläubiger."},
      {v: "C", t: "Die Vermietung einer Sache gegen Entgelt."},
      {v: "D", t: "Die Beschränkung des Eigentums zugunsten des Nachbarn."}
    ],
    correct: "A",
    explain: "Ein Pfandrecht ist ein beschränktes dingliches Recht, das seinem Inhaber (dem Pfandgläubiger) die Befugnis verleiht, einen Vermögenswert verwerten zu lassen, um aus dem Erlös die Bezahlung der sichergestellten Forderung zu erhalten. Pfandrechte dienen primär der Sicherung von Forderungen."
  },
  {
    id: "p02", topic: "pfandrechte", type: "fill", diff: 1, tax: "K1",
    q: "Beim {0} (oder Faustpfand) dient eine bewegliche Sache als Pfandsicherheit. Beim {1} dient eine unbewegliche Sache (Grundstück) als Sicherheit.",
    blanks: [
      {answer: "Fahrnispfand", alts: ["fahrnispfand", "Faustpfand"]},
      {answer: "Grundpfand", alts: ["grundpfand", "Grundpfandrecht"]}
    ],
    explain: "Das Fahrnispfand oder Faustpfand (Art. 884 ff. ZGB) liegt vor, wenn eine bewegliche Sache als Pfandsicherheit dient. Das Grundpfand liegt vor, wenn eine unbewegliche Sache (Grundstück) als Sicherheit dient. Das Grundpfand kann in der Form eines Schuldbriefs (Art. 842 ff. ZGB) oder einer Grundpfandverschreibung (Art. 824 ff. ZGB) errichtet werden."
  },
  {
    id: "p03", topic: "pfandrechte", type: "mc", diff: 2, tax: "K2",
    q: "Wann entsteht das Pfandrecht an einer beweglichen Sache (Faustpfand)?",
    options: [
      {v: "A", t: "Sobald der Pfandgegenstand dem Gläubiger übergeben wird (Art. 884 Abs. 3 ZGB)."},
      {v: "B", t: "Sobald der Pfandvertrag abgeschlossen wird."},
      {v: "C", t: "Sobald die Forderung fällig wird."},
      {v: "D", t: "Sobald der Pfandgegenstand im Grundbuch eingetragen wird."}
    ],
    correct: "A",
    explain: "Mit dem Abschluss des Pfandvertrages ist das Pfandrecht noch nicht begründet. Das Faustpfandrecht entsteht erst, wenn der Verpfänder dem Gläubiger den Pfandgegenstand übergibt (Art. 884 Abs. 3 ZGB). Der Pfandvertrag ist nur das Verpflichtungsgeschäft; die Übergabe ist das Verfügungsgeschäft."
  },
  {
    id: "p04", topic: "pfandrechte", type: "tf", diff: 2, tax: "K2",
    q: "Eine Verfallklausel — die Vereinbarung, dass die Pfandsache bei Nichterfüllung ins Eigentum des Gläubigers falle — ist gemäss Art. 894 ZGB nichtig.",
    correct: true,
    explain: "Die sogenannte Verfallklausel (auch «Lex commissoria» oder «Verfallsabrede» genannt) ist gesetzlich verboten und nichtig (Art. 894 ZGB). Der Gläubiger kann sich nicht einfach die Pfandsache aneignen, sondern muss den Weg über die Betreibung auf Pfandverwertung beschreiten."
  },
  {
    id: "p05", topic: "pfandrechte", type: "mc", diff: 2, tax: "K3",
    context: "In einer Faustpfandverschreibung steht: «Die gestellten Pfänder gehen bei Verfall nicht begleicht der Forderung ins Eigentum der Bank über.»",
    q: "Wie ist diese Vereinbarung rechtlich zu beurteilen?",
    options: [
      {v: "A", t: "Sie ist gültig, da die Bank als Pfandgläubigerin das Recht auf die Pfandsache hat."},
      {v: "B", t: "Sie ist nichtig, da es sich um eine verbotene Verfallklausel handelt (Art. 894 ZGB)."},
      {v: "C", t: "Sie ist gültig, aber nur wenn der Verpfänder zustimmt."},
      {v: "D", t: "Sie ist gültig bei Banken, aber nichtig bei Privatpersonen."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob die Vereinbarung gültig ist.\n\nVoraussetzungen: Art. 894 ZGB verbietet die sogenannte Verfallklausel. Darunter versteht man die Verabredung, dass die Pfandsache ins Eigentum des Gläubigers fallen soll, wenn der Schuldner nicht in der Lage ist, die pfandgesicherte Forderung zu erfüllen.\n\nSubsumtion: Die Vereinbarung besagt, dass die Pfänder bei Nichtbegleichung ins Eigentum der Bank übergehen. Das ist genau eine solche Verfallklausel.\n\nSchlussfolgerung: Die Vereinbarung ist gemäss Art. 894 ZGB nichtig."
  },
  {
    id: "p06", topic: "pfandrechte", type: "mc", diff: 1, tax: "K1",
    q: "Was ist das Grundbuch?",
    options: [
      {v: "A", t: "Ein staatliches Register, das über die dinglichen Rechte an Grundstücken Auskunft gibt (Art. 942 ZGB)."},
      {v: "B", t: "Ein privates Verzeichnis der Hauseigentümer einer Gemeinde."},
      {v: "C", t: "Ein Kataster, der nur die Grösse und Lage von Grundstücken erfasst."},
      {v: "D", t: "Ein Register beim Handelsregisteramt für juristische Personen."}
    ],
    correct: "A",
    explain: "Das Grundbuch ist ein staatliches Register (in Papierform oder elektronisch geführt), das über die dinglichen Rechte an den Grundstücken Auskunft gibt (Art. 942 Abs. 1 ZGB). Es ist öffentlich (Art. 970 ZGB). Im Grundbuch werden Eigentum, Dienstbarkeiten, Grundlasten und Pfandrechte eingetragen (Art. 958 ZGB)."
  },
  {
    id: "p07", topic: "pfandrechte", type: "multi", diff: 2, tax: "K2",
    q: "Welche Rechte können gemäss Art. 958 ZGB ins Grundbuch eingetragen werden? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Eigentum"},
      {v: "B", t: "Dienstbarkeiten und Grundlasten"},
      {v: "C", t: "Pfandrechte"},
      {v: "D", t: "Mietverträge und Arbeitsverträge"}
    ],
    correct: ["A", "B", "C"],
    explain: "Gemäss Art. 958 ZGB lassen sich Eigentum, Dienstbarkeiten, Grundlasten sowie Pfandrechte im Grundbuch eintragen. D ist falsch: Miet- und Arbeitsverträge sind obligatorische Rechte und werden nicht im Grundbuch eingetragen. Allerdings können bestimmte obligatorische Rechte (z.B. Vorkaufsrechte, Mietrechte) als Vormerkung ins Grundbuch eingetragen werden (Art. 959–961 ZGB), um sie gegenüber Dritten wirksam zu machen."
  },
  {
    id: "p08", topic: "pfandrechte", type: "mc", diff: 2, tax: "K2",
    q: "Was unterscheidet den Schuldbrief von der Grundpfandverschreibung?",
    options: [
      {v: "A", t: "Beim Schuldbrief ist die Forderung mit dem Pfandrecht zu einer Einheit verbunden und kann als Wertpapier übertragen werden; bei der Grundpfandverschreibung besteht das Pfandrecht nur als Sicherheit für eine bestehende Forderung."},
      {v: "B", t: "Der Schuldbrief sichert nur Darlehen; die Grundpfandverschreibung sichert jede Art von Forderung."},
      {v: "C", t: "Der Schuldbrief ist günstiger als die Grundpfandverschreibung."},
      {v: "D", t: "Es gibt keinen Unterschied — beide Begriffe bezeichnen dasselbe."}
    ],
    correct: "A",
    explain: "Beim Schuldbrief (Art. 842 ff. ZGB) ist die Forderung mit dem Grundpfandrecht zu einer Einheit verbunden. Der Schuldbrief kann als Register-Schuldbrief oder Papier-Schuldbrief bestellt werden und ist übertragbar. Bei der Grundpfandverschreibung (Art. 824 ff. ZGB) dient das Grundpfand nur als Sicherheit für eine bestehende Forderung — ohne selbständige Wertpapierqualität."
  },
  {
    id: "p09", topic: "pfandrechte", type: "mc", diff: 1, tax: "K1",
    q: "Was ist eine Grundlast (Art. 782 ZGB)?",
    options: [
      {v: "A", t: "Eine Verpflichtung des Grundstückeigentümers zu einer Leistung, für die er ausschliesslich mit dem Grundstück haftet."},
      {v: "B", t: "Eine Belastung des Grundstücks durch Umweltverschmutzung."},
      {v: "C", t: "Eine Dienstbarkeit zugunsten des Nachbarn."},
      {v: "D", t: "Die Grundsteuer, die der Eigentümer an die Gemeinde bezahlen muss."}
    ],
    correct: "A",
    explain: "Gemäss Art. 782 ZGB wird der jeweilige Eigentümer eines Grundstücks durch die Grundlast zu einer Leistung an den Berechtigten verpflichtet, für die er ausschliesslich mit dem Grundstück haftet. Beispiele: Lieferung von Früchten, Wasserlieferungspflicht, Pflicht zum Unterhalt einer Mauer."
  },
  {
    id: "p10", topic: "pfandrechte", type: "tf", diff: 2, tax: "K2",
    q: "Das Grundbuch hat eine negative Rechtskraft: Fehlt ein Eintrag, besteht kein dingliches Recht an einem Grundstück.",
    correct: true,
    explain: "Man spricht von der negativen Rechtskraft des Grundbuchs (Art. 971 ZGB). Fehlt ein Eintrag im Grundbuch, besteht grundsätzlich kein dingliches Recht. Dies gilt insbesondere für Eigentum, Dienstbarkeiten, Grundlasten und Pfandrechte an Grundstücken. Eintragungen im engeren Sinne (Art. 958 ZGB) entstehen konstitutiv mit dem Grundbucheintrag."
  },
  {
    id: "p11", topic: "pfandrechte", type: "mc", diff: 3, tax: "K4",
    context: "Daniel nimmt bei Yvonne ein Darlehen über CHF 10'000 auf. Als Sicherheit übergibt er ihr ein Bild von Ferdinand Hodler. Vertragsgemäss soll das Darlehen nach 12 Monaten mit 6% Zins zurückgezahlt werden. Nach 5 Monaten verlangt Yvonne das Darlehen vorzeitig zurück. Daniel beharrt auf der Einhaltung des Darlehensvertrags. Drei Tage später verkauft Yvonne das Bild einer Galerie für CHF 60'000. Die Galerie verkauft es weiter an eine Käuferin für CHF 100'000.",
    q: "Wer ist heute Eigentümer des Bildes?",
    options: [
      {v: "A", t: "Daniel, weil Yvonne kein Recht hatte, das Bild zu verkaufen."},
      {v: "B", t: "Die Käuferin, weil sie das Bild gutgläubig von der Galerie erworben hat, der es von Yvonne anvertraut war."},
      {v: "C", t: "Die Galerie, weil sie das Bild von Yvonne gekauft hat."},
      {v: "D", t: "Yvonne, weil sie das Bild als Pfand besitzt."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, wer Eigentümer des Bildes ist.\n\nDaniel hat Yvonne das Bild als Pfandsicherheit (Faustpfand) anvertraut. Yvonne hatte kein Recht, das Bild zu verkaufen — als Pfandgläubigerin durfte sie es nur aufbewahren.\n\nYvonne hat das Bild trotzdem an die Galerie verkauft. Da Daniel ihr das Bild anvertraut hat (Art. 933 ZGB), ist die Galerie als gutgläubige Erwerberin geschützt — sie wurde Eigentümerin. Die Galerie hat das Bild an die Käuferin weiterverkauft, die ebenfalls gutgläubig ist.\n\nSchlussfolgerung: Die Käuferin ist Eigentümerin des Bildes. Daniel kann es nicht herausverlangen, sondern muss sich an Yvonne halten (Schadenersatz)."
  }
];
