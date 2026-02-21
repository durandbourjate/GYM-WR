window.POOL_META = {
  title: "Arbeitsrecht",
  fach: "Recht",
  color: "#73ab2c",
  level: "SF GYM3–GYM4"
};

window.TOPICS = {
  "grundlagen": {label: "Grundlagen & 3 Bereiche des Arbeitsrechts", short: "Grundlagen"},
  "vertragsarten": {label: "Verträge auf Arbeitsleistung & Arbeitsvertragsarten", short: "Vertragsarten"},
  "pflichten_an": {label: "Pflichten des Arbeitnehmers", short: "Pflichten AN"},
  "pflichten_ag": {label: "Pflichten des Arbeitgebers", short: "Pflichten AG"},
  "beendigung": {label: "Beendigung des Arbeitsverhältnisses & Kündigung", short: "Kündigung"},
  "kuendigungsschutz": {label: "Kündigungsschutz & Sperrfristen", short: "Schutz"},
  "oeffentliches_ar": {label: "Öffentlich-rechtliches Arbeitsrecht (ArG)", short: "ArG"},
  "kollektives_ar": {label: "Kollektives Arbeitsrecht (GAV, NAV, GlG)", short: "GAV/NAV"}
};

window.QUESTIONS = [
  // TOPIC: grundlagen (12 questions)
  {
    id: "g01",
    topic: "grundlagen",
    type: "tf",
    diff: 1,
    tax: "K1",
    q: "Das Arbeitsrecht enthält viele zwingende Vorschriften, die den schwächeren Vertragspartner (Arbeitnehmer) schützen.",
    correct: true,
    explain: "Korrekt. Das Arbeitsrecht ist geprägt durch zwingende Vorschriften zum Schutz des Arbeitnehmers als strukturell schwächerer Vertragspartei. Abweichungen sind nur zu Gunsten des Arbeitnehmers möglich (OR 319-362)."
  },
  {
    id: "g02",
    topic: "grundlagen",
    type: "mc",
    diff: 1,
    tax: "K1",
    img: {src: "img/recht/arbeitsrecht/arbeitsrecht_bereiche_01.svg", alt: "Diagramm: Drei Bereiche des Arbeitsrechts mit Fragezeichen"},
    q: "In wie viele Bereiche wird das Arbeitsrecht typischerweise eingeteilt?",
    options: [
      {v: "zwei", t: "Privaterecht und Öffentliches Recht"},
      {v: "drei", t: "Öffentliches, Kollektives und Individualarbeitsrecht"},
      {v: "vier", t: "Arbeitsvertrag, Lohn, Kündigung und Schutzvorschriften"},
      {v: "fünf", t: "Bundesebene, Kantonal- und Gemeindebene plus Privatrecht"}
    ],
    correct: "drei",
    explain: "Das Arbeitsrecht wird klassischerweise in drei Bereiche eingeteilt: (1) Öffentliches Arbeitsrecht (Staat schützt und kontrolliert), (2) Kollektives Arbeitsrecht (Gewerkschaften und Arbeitgeberverbände), (3) Individualarbeitsrecht (direktes Verhältnis zwischen AN und AG)."
  },
  {
    id: "g03",
    topic: "grundlagen",
    type: "fill",
    diff: 1,
    tax: "K1",
    q: "Das Arbeitsrecht ist grundsätzlich ________, d.h. es bedarf keiner bestimmten Form für den Abschluss eines Arbeitsvertrags.",
    blanks: [
      {answer: "formfrei", alts: ["Form frei", "formlos"]}
    ],
    explain: "Das Arbeitsrecht kennt grundsätzlich Formfreiheit (OR 320 Abs. 1). Ein Arbeitsvertrag kann mündlich oder schriftlich abgeschlossen werden. Ausnahmen: OR 330b (Informationspflicht) und OR 344 ff. (Lehrvertrag)."
  },
  {
    id: "g04",
    topic: "grundlagen",
    type: "mc",
    diff: 1,
    tax: "K2",
    q: "Welche Aussage zur Abänderung zwingender Arbeitsrechtsvorschriften ist korrekt?",
    options: [
      {v: "A", t: "Abänderungen sind unabhängig von der Richtung nicht erlaubt"},
      {v: "B", t: "Abänderungen sind zu Gunsten des Arbeitnehmers zulässig"},
      {v: "C", t: "Abänderungen sind nur mit Zustimmung der Arbeitgeberverbände erlaubt"},
      {v: "D", t: "Abänderungen sind nur schriftlich gültig"}
    ],
    correct: "B",
    explain: "Nach dem Prinzip der relativen Zwingendheit können zwingende Arbeitsrechtsvorschriften nur zu Gunsten des Arbeitnehmers abgeändert werden. Eine Verschlechterung der AN-Position durch Vertrag ist nicht zulässig."
  },
  {
    id: "g05",
    topic: "grundlagen",
    type: "mc",
    diff: 2,
    tax: "K2",
    q: "Ein Arbeitgeber und sein neuer Arbeitnehmer besprechen die Arbeitsbedingungen mündlich über Kaffee und einigen sich auf alle wesentlichen Punkte. Hat sich ein Arbeitsvertrag gebildet?",
    options: [
      {v: "A", t: "Nein, weil Arbeitsverträge immer schriftlich sein müssen"},
      {v: "B", t: "Ja, auch mündliche Vereinbarungen können Arbeitsverträge bilden"},
      {v: "C", t: "Nur wenn schriftliche Bestätigung innerhalb von 7 Tagen erfolgt"},
      {v: "D", t: "Nein, weil die Informationspflicht gemäss OR 330b nicht erfüllt ist"}
    ],
    correct: "B",
    explain: "Arbeitsverträge entstehen durch übereinstimmende Willenserklärung (OR 1 Abs. 1) und können auch konkludent gebildet werden (OR 320 Abs. 2). Formfreiheit ist die Regel. Allerdings muss der AG die Bedingungen nach OR 330b schriftlich mitteilen."
  },
  {
    id: "g06",
    topic: "grundlagen",
    type: "tf",
    diff: 2,
    tax: "K2",
    q: "Das öffentlich-rechtliche Arbeitsrecht wird durch Staat und Behörden geprägt und enthält Schutzvorschriften für Arbeitnehmer wie Höchstarbeitszeiten.",
    correct: true,
    explain: "Korrekt. Das öffentliche Arbeitsrecht (z.B. ArG) wird durch staatliche und behördliche Regelung geprägt und enthält Schutzbestimmungen wie Arbeitszeiten (ArG 9), Pausen (ArG 15) und Nachtarbeitszuschläge."
  },
  {
    id: "g07",
    topic: "grundlagen",
    type: "fill",
    diff: 2,
    tax: "K2",
    q: "Der Arbeitgeber muss die wesentlichen Bedingungen des Arbeitsverhältnisses gemäss OR 330b ________ und ________ mitteilen.",
    blanks: [
      {answer: "schriftlich", alts: ["schriftlich mitteilen"]},
      {answer: "rechtzeitig", alts: ["vor Arbeitsbeginn", "zeitgerecht"]}
    ],
    explain: "OR 330b verlangt, dass der Arbeitgeber dem Arbeitnehmer die wesentlichen Vertragsbedingungen schriftlich und rechtzeitig (vor oder bei Antritt der Stelle) mitteilt. Dies ist eine Ausnahme von der Formfreiheit."
  },
  {
    id: "g08",
    topic: "grundlagen",
    type: "mc",
    diff: 2,
    tax: "K3",
    q: "Welche Aussage zur Funktion des kollektiven Arbeitsrechts ist richtig?",
    options: [
      {v: "A", t: "Es regelt das Verhältnis zwischen einzelnem Arbeitnehmer und Arbeitgeber"},
      {v: "B", t: "Es koordiniert zwischen Arbeitnehmerverbaenden/Gewerkschaften und Arbeitgebern/Verband"},
      {v: "C", t: "Es wird ausschliesslich von Kantonen erlassen"},
      {v: "D", t: "Es ist bindend für alle Branchen in der Schweiz"}
    ],
    correct: "B",
    explain: "Das kollektive Arbeitsrecht regelt das Verhältnis zwischen Gruppen (Gewerkschaften/AN-Verbände und AG-Verbände) und schafft kollektive Vereinbarungen wie GAV und NAV. Es ist nicht individualrechtlich."
  },
  {
    id: "g09",
    topic: "grundlagen",
    type: "multi",
    diff: 2,
    tax: "K2",
    q: "Welche Merkmale gelten für das Arbeitsrecht? (Mehrfachauswahl)",
    options: [
      {v: "A", t: "Absolut zwingendes Recht mit keinen Ausnahmen"},
      {v: "B", t: "Relativ zwingendes Recht mit Abweichungen zu Gunsten des AN"},
      {v: "C", t: "Schutz der strukturell schwächeren Vertragspartei"},
      {v: "D", t: "Maximale Vertragsfreiheit für beide Parteien"}
    ],
    correct: ["B", "C"],
    explain: "Das Arbeitsrecht ist relativ zwingend (Abweichungen nur zu Gunsten des AN möglich) und dient dem Schutz der schwächeren Vertragspartei (des Arbeitnehmers). Volle Vertragsfreiheit wäre unzutreffend."
  },
  {
    id: "g10",
    topic: "grundlagen",
    type: "mc",
    diff: 3,
    tax: "K4",
    q: "Ein Arbeitnehmer möchte wissen, ob eine Vereinbarung, die seinen Urlaubsanspruch unter das gesetzliche Minimum senkt, gültig ist. Auf welches Prinzip des Arbeitsrechts ist hinzuweisen?",
    options: [
      {v: "A", t: "Absolute Zwingendheit – die Vereinbarung ist ungültig"},
      {v: "B", t: "Relative Zwingendheit – die Vereinbarung ist nur zu Gunsten des AN gültig"},
      {v: "C", t: "Vertragsfreiheit – die Vereinbarung ist gültig, wenn beide zustimmen"},
      {v: "D", t: "Öffentliche Ordnung – die Vereinbarung bedarf behördlicher Genehmigung"}
    ],
    correct: "B",
    explain: "Das Arbeitsrecht folgt dem Prinzip der relativen Zwingendheit: Abweichungen von gesetzlichen Minimalstandards sind ungültig, wenn sie zu Lasten des Arbeitnehmers gehen. Eine Reduktion des Urlaubs unter das Mindestmass ist daher nichtig und der gesetzliche Standard bleibt gültig."
  },
  {
    id: "g11",
    topic: "grundlagen",
    type: "tf",
    diff: 3,
    tax: "K4",
    q: "Das öffentlich-rechtliche Arbeitsrecht gilt für Leitende Angestellte und Betriebe mit weniger als 5 Arbeitnehmern in gleicher Weise wie für andere Betriebe.",
    correct: false,
    explain: "Falsch. Das ArG kennt Ausnahmen: Es gilt nicht für leitende Angestellte, für staatliche Verwaltungen, landwirtschaftliche Betriebe, wissenschaftliche und künstlerische Tätigkeiten. Zudem gelten für kleine Betriebe teilweise reduzierte Anforderungen."
  },
  {
    id: "g12",
    topic: "grundlagen",
    type: "mc",
    diff: 3,
    tax: "K5",
    q: "Beurteilen Sie diese Aussage: 'Das Arbeitsrecht bietet umfassenden Schutz für Arbeitnehmer, weshalb zusätzliche kollektive Vereinbarungen (GAV) überflüssig sind.' Ist dies zutreffend?",
    options: [
      {v: "A", t: "Ja, das Arbeitsrecht bietet vollständigen Schutz"},
      {v: "B", t: "Nein, GAV können höhere Standards setzen und sind wichtig für Branchen"},
      {v: "C", t: "Nein, aber GAV sind nur in Grossbetrieben nötig"},
      {v: "D", t: "Ja, GAV sind rechtlich überflüssig und nur symbolisch"}
    ],
    correct: "B",
    explain: "Das Arbeitsrecht setzt Mindeststandards, aber GAV und NAV können weitergehende Schutzbestimmungen vorsehen (z.B. höhere Mindestlöhne, bessere Kündigungsfristen). Sie sind für Branchen mit besonderem Schutzbedarf oder um Mindestlöhne zu sichern, wichtig."
  },

  // TOPIC: vertragsarten (11 questions)
  {
    id: "v01",
    topic: "vertragsarten",
    type: "tf",
    diff: 1,
    tax: "K1",
    q: "Ein Arbeitsvertrag wird charakterisiert durch eine untergeordnete Stellung des Arbeiters gegenüber dem Arbeitgeber.",
    correct: true,
    explain: "Korrekt. Nach OR 319 Abs. 1 ist das charakteristische Merkmal eines Arbeitsvertrags, dass der Arbeitnehmer der Weisung des Arbeitgebers untergeordnet ist (Unterordnungsverhältnis), die Arbeit unselbstständig verrichten muss und sie entgeltlich erfolgt."
  },
  {
    id: "v02",
    topic: "vertragsarten",
    type: "mc",
    diff: 1,
    tax: "K1",
    img: {src: "img/recht/arbeitsrecht/arbeitsrecht_vertragsarten_01.svg", alt: "Übersicht: Drei Vertragstypen auf Arbeitsleistung mit Fragezeichen"},
    q: "Was ist das Kernmerkmal eines Arbeitsvertrags nach OR 319?",
    options: [
      {v: "A", t: "Arbeitnehmer arbeitet völlig selbstständig"},
      {v: "B", t: "Arbeitnehmer unterordnet sich den Weisungen des Arbeitgebers"},
      {v: "C", t: "Arbeitnehmer trägt allein das Unternehmensrisiko"},
      {v: "D", t: "Arbeitnehmer bestimmt seine Arbeitszeiten selbst"}
    ],
    correct: "B",
    explain: "Das Kernmerkmal eines Arbeitsvertrags ist die Unterordnung unter die Weisung und Kontrolle des Arbeitgebers (OR 319 Abs. 1). Der Arbeitnehmer erbringt unselbstständige, entgeltliche Arbeit."
  },
  {
    id: "v03",
    topic: "vertragsarten",
    type: "fill",
    diff: 1,
    tax: "K1",
    q: "Die Probezeit bei Arbeitsverträgen beträgt maximal ________ Monate, wobei das Minimum ________ Tag(e) ist.",
    blanks: [
      {answer: "3", alts: ["drei"]},
      {answer: "7", alts: ["sieben"]}
    ],
    explain: "Nach OR 335b beträgt die Probezeit mindestens 7 Tage und maximal 3 Monate. Sie ist die einzige Zeit, in der Fristen sehr kurz sind und gegenseitig gekündigt werden kann."
  },
  {
    id: "v04",
    topic: "vertragsarten",
    type: "mc",
    diff: 1,
    tax: "K1",
    q: "Was ist der Unterschied zwischen einem Arbeitsvertrag und einem Werkvertrag?",
    options: [
      {v: "A", t: "Beide sind gleich, nur mit unterschiedlichen Namen"},
      {v: "B", t: "Beim Werkvertrag schuldet der Unternehmer das Arbeitsresultat, beim Arbeitsvertrag nur die sorgfältige Arbeit"},
      {v: "C", t: "Der Werkvertrag ist immer mündlich, der Arbeitsvertrag schriftlich"},
      {v: "D", t: "Der Werkvertrag gilt nur für Baugewerbe"}
    ],
    correct: "B",
    explain: "Beim Werkvertrag (OR 363-379) schuldet der Unternehmer ein bestimmtes Arbeitsresultat, während beim Arbeitsvertrag (OR 319-362) nur sorgfältige, untergeordnete Tätigkeit geschuldet ist. Der Arbeitnehmer ist untergeordnet, beim Werkvertrag ist der Unternehmer selbstständig."
  },
  {
    id: "v05",
    topic: "vertragsarten",
    type: "tf",
    diff: 2,
    tax: "K2",
    q: "Ein Arbeitsvertrag entsteht auch, wenn die Parteien nicht ausdrücklich zustimmen, sondern nur konkludent (durch das Verhalten) übereinstimmen, z.B. wenn ein Arbeitnehmer seine Stelle antritt.",
    correct: true,
    explain: "Korrekt. Nach OR 320 Abs. 2 kann sich ein Arbeitsvertrag auch konkludent bilden. Der Arbeitnehmer, der mit Zustimmung des AG die Arbeit aufnimmt, kann dadurch konkludent ein Arbeitsvertrag entstanden sein lassen."
  },
  {
    id: "v06",
    topic: "vertragsarten",
    type: "mc",
    diff: 2,
    tax: "K2",
    q: "Ein Lehrvertrag ist eine besondere Form des Arbeitsvertrags. Welche zusätzliche Besonderheit schreibt OR 344 ff. vor?",
    options: [
      {v: "A", t: "Schriftlichkeit ist nicht erforderlich"},
      {v: "B", t: "Die Schriftlichkeit ist zwingend vorgeschrieben"},
      {v: "C", t: "Nur der Arbeitgeber muss unterschreiben"},
      {v: "D", t: "Eine Genehmigung durch das Arbeitsamt ist erforderlich"}
    ],
    correct: "B",
    explain: "Lehrverträge (OR 344-355) müssen schriftlich abgeschlossen werden – eine Ausnahme von der Formfreiheit des Arbeitsrechts. Dies schützt den Lehrling und sichert Klarheit über Ausbildungsinhalte und -dauer."
  },
  {
    id: "v07",
    topic: "vertragsarten",
    type: "fill",
    diff: 2,
    tax: "K2",
    q: "Die Priorisierung von Vertragsarten unterscheidet zwischen Verträgen auf Arbeitsleistung und Verträgen auf ________. Der Arbeitsvertrag gehört zu den Verträgen auf Arbeitsleistung.",
    blanks: [
      {answer: "Arbeitsresultat", alts: ["ein Resultat", "ein Werk"]}
    ],
    explain: "Verträge auf Arbeitsleistung (Arbeitsvertrag nach OR 319) unterscheiden sich von Verträgen auf Arbeitsresultat (Werkvertrag nach OR 363). Bei letzteren wird ein bestimmtes Ergebnis geschuldet, nicht nur die Tätigkeit selbst."
  },
  {
    id: "v08",
    topic: "vertragsarten",
    type: "mc",
    diff: 2,
    tax: "K3",
    q: "Ein Einzelunternehmer wird beauftragt, eine komplexe Steuerberatung durchzuführen, ohne dass er dabei Weisungen des Auftraggebers unterliegt und völlig eigenverantwortlich arbeitet. Welcher Vertragstyp liegt vor?",
    options: [
      {v: "A", t: "Arbeitsvertrag gemäss OR 319"},
      {v: "B", t: "Werkvertrag gemäss OR 363"},
      {v: "C", t: "Auftrag gemäss OR 394-418v"},
      {v: "D", t: "Dienstverhältnis gemäss BV"}
    ],
    correct: "C",
    explain: "Beim Auftrag (OR 394-418v) schuldet der Beauftragte nur sorgfältige Ausführung einer Tätigkeit. Es gibt keine Unterordnung und Weisungsgebundenheit wie beim Arbeitsvertrag. Der Beauftragte ist selbstständig tätig."
  },
  {
    id: "v09",
    topic: "vertragsarten",
    type: "multi",
    diff: 2,
    tax: "K2",
    q: "Welche Aussagen über Besondere Arbeitsverträge sind richtig? (Mehrfachauswahl)",
    options: [
      {v: "A", t: "Lehrverträge müssen schriftlich abgeschlossen werden"},
      {v: "B", t: "Handelsreisendenverträge und Heimarbeitsverträge sind Formen des Arbeitsvertrags"},
      {v: "C", t: "GAV und NAV sind Formen von Arbeitsverträgen"},
      {v: "D", t: "Alle besonderen Arbeitsverträge haben längere Kündigungsfristen"}
    ],
    correct: ["A", "B"],
    explain: "Lehrverträge, Handelsreisendenverträge und Heimarbeitsverträge sind alle besondere Arbeitsverträge (untergeordnet, entgeltlich). GAV und NAV sind kollektive Vereinbarungen, keine Arbeitsverträge. Die Kündigungsfristen variieren."
  },
  {
    id: "v10",
    topic: "vertragsarten",
    type: "tf",
    diff: 3,
    tax: "K4",
    q: "Ein Unternehmer schliesst mit einem Designer einen Vertrag ab, der die Gestaltung eines neuen Logos vorsieht. Der Designer ist zeitlich flexibel und unterliegt keinen Weisungen. Dies ist zweifellos ein Arbeitsvertrag nach OR 319.",
    correct: false,
    explain: "Falsch. Dies ist eher ein Werkvertrag (OR 363) oder Auftrag (OR 394), da der Designer selbstständig tätig ist und kein Unterordnungsverhältnis besteht. Das Fehlen der Weisungsgebundenheit und die Selbstständigkeit schliessen einen Arbeitsvertrag aus."
  },
  {
    id: "v11",
    topic: "vertragsarten",
    type: "mc",
    diff: 3,
    tax: "K5",
    q: "Eine Arbeitgeberin und ein Arbeitnehmer vereinbaren zunächst mündlich einen Arbeitsvertrag. Welche Rechtsfolgen hat das Fehlen schriftlicher Dokumentation nach OR 330b?",
    options: [
      {v: "A", t: "Der Vertrag ist nichtig und existiert nicht"},
      {v: "B", t: "Der Vertrag existiert, aber der AG hat die Bedingungen nachträglich schriftlich mitzuteilen"},
      {v: "C", t: "Der Vertrag ist ungültig, bis schriftliche Genehmigung erfolgt"},
      {v: "D", t: "Der Arbeitnehmer kann beliebig kündigen, bis schriftlich dokumentiert ist"}
    ],
    correct: "B",
    explain: "OR 330b verpflichtet den AG, die wesentlichen Vertragsbedingungen schriftlich mitzuteilen. Das Fehlen dieser Mitteilung macht den Vertrag nicht ungültig, sondern die AG hat diese Pflicht zu erfüllen. Die Nichterfüllung kann zu Strafe oder Schaden führen, hebt aber den Vertrag nicht auf."
  },

  // TOPIC: pflichten_an (11 questions)
  {
    id: "a01",
    topic: "pflichten_an",
    type: "tf",
    diff: 1,
    tax: "K1",
    q: "Der Arbeitnehmer muss seine Arbeit selbst verrichten und kann sie nicht einfach auf eine andere Person übertragen (Persönliche Arbeitspflicht).",
    correct: true,
    explain: "Korrekt. Nach OR 321 muss der Arbeitnehmer die Arbeit persönlich ausführen. Dies ist wegen der persönlichen Vertrauensbeziehung nicht delegierbar."
  },
  {
    id: "a02",
    topic: "pflichten_an",
    type: "mc",
    diff: 1,
    tax: "K1",
    q: "Welche Pflicht ist nach OR 321a für einen Arbeitnehmer zentral?",
    options: [
      {v: "A", t: "Tägliche Arbeit ohne Pausen leisten"},
      {v: "B", t: "Sorgfalt und Treue bei der Arbeit"},
      {v: "C", t: "Maximale Produktivität erzielen"},
      {v: "D", t: "Kostenloses Überstundenarbeiten"}
    ],
    correct: "B",
    explain: "Nach OR 321a muss der Arbeitnehmer mit der Sorgfalt eines gewissenhaften Arbeiters arbeiten und sich treu verhalten. Diese Sorgfaltspflicht ist zentral und kann zu Haftung führen."
  },
  {
    id: "a03",
    topic: "pflichten_an",
    type: "fill",
    diff: 1,
    tax: "K1",
    q: "Der Arbeitnehmer muss nach OR 321a Abs. 4 auch nach Beendigung des Arbeitsverhältnisses ________ des Arbeitgebers schützen.",
    blanks: [
      {answer: "Geschäftsgeheimnisse", alts: ["die Geheimnisse", "Betriebsgeheimnisse"]}
    ],
    explain: "Nach OR 321a Abs. 4 ist der Arbeitnehmer verpflichtet, die Geschäftsgeheimnisse des Arbeitgebers auch nach Beendigung des Arbeitsverhältnisses zu bewahren. Dies schützt die wirtschaftlichen Interessen des AG."
  },
  {
    id: "a04",
    topic: "pflichten_an",
    type: "mc",
    diff: 1,
    tax: "K2",
    q: "Ein Arbeitnehmer wird aufgefordert, Überstundenarbeit zu leisten. Muss er dies akzeptieren?",
    options: [
      {v: "A", t: "Nein, Überstunden sind immer freiwillig"},
      {v: "B", t: "Ja, er muss immer Überstunden leisten"},
      {v: "C", t: "Ja, wenn es notwendig und zumutbar ist (OR 321c)"},
      {v: "D", t: "Nur, wenn er schriftlich zustimmt"}
    ],
    correct: "C",
    explain: "Nach OR 321c muss der Arbeitnehmer Überstundenarbeit leisten, wenn dies notwendig und zumutbar ist. Dies ist dispositive Recht, kann also im Vertrag anders geregelt werden. Die Vergütung erfolgt durch Freizeit oder Lohnzuschlag."
  },
  {
    id: "a05",
    topic: "pflichten_an",
    type: "tf",
    diff: 2,
    tax: "K2",
    q: "Wenn ein Arbeitnehmer fahrlässig arbeitet und dadurch Schaden am Betrieb verursacht, haftet er nicht, da der Arbeitgeber diese Risiken tragen muss.",
    correct: false,
    explain: "Falsch. Nach OR 321e haftet der Arbeitnehmer für Schäden, die er durch unsorgfältige oder untreue Ausführung seiner Arbeit verursacht. Allerdings ist die Haftung begrenzt und reduziert, wenn der AN nur leicht fahrlässig war."
  },
  {
    id: "a06",
    topic: "pflichten_an",
    type: "mc",
    diff: 2,
    tax: "K2",
    q: "Ein Arbeitnehmer wird von seinem Arbeitgeber angewiesen, bei einer Kundenbeschwerde unwahrheitsgemäss vorzugehen. Darf der Arbeitnehmer diese Weisung ablehnen?",
    options: [
      {v: "A", t: "Nein, er muss alle Weisungen des AG befolgen"},
      {v: "B", t: "Ja, wenn die Weisung sittenwidrig oder gesetzwidrig ist"},
      {v: "C", t: "Nein, Weisungen sind absolut bindend"},
      {v: "D", t: "Nur, wenn er schriftlich protestiert"}
    ],
    correct: "B",
    explain: "Nach OR 321d muss der Arbeitnehmer die Weisungen des Arbeitgebers befolgen. Dies gilt aber nicht für sittenwidrige oder gesetzwidrige Weisungen. Der Schutz der Persönlichkeit und der öffentlichen Ordnung geht vor."
  },
  {
    id: "a07",
    topic: "pflichten_an",
    type: "fill",
    diff: 2,
    tax: "K2",
    q: "Nach OR 321b muss der Arbeitnehmer den Arbeitgeber über alles informieren, was dieser braucht, und ist zur ________ und ________ verpflichtet.",
    blanks: [
      {answer: "Rechenschafts", alts: ["Rechenschaft", "Rechnungslegung"]},
      {answer: "Herausgabepflicht", alts: ["Herausgabe", "Rückgabe"]}
    ],
    explain: "Nach OR 321b ist der AN zur Rechenschafts- und Herausgabepflicht verpflichtet. Er muss den AG über alle Geschäftsvorgänge informieren und erhaltene Geldmittel oder Gegenstände zurückgeben."
  },
  {
    id: "a08",
    topic: "pflichten_an",
    type: "mc",
    diff: 2,
    tax: "K3",
    q: "Ein Arbeitnehmer erfährt von einer geplanten Geschäftsexpansion seines Arbeitgebers und teilt diese Information seinem Bruder mit, der in der Konkurrenzfirma arbeitet. Welche Pflicht verletzt der Arbeitnehmer damit primär?",
    options: [
      {v: "A", t: "Persönliche Arbeitspflicht (OR 321)"},
      {v: "B", t: "Sorgfaltspflicht (OR 321a)"},
      {v: "C", t: "Schutz von Geschäftsgeheimnissen (OR 321a Abs. 4)"},
      {v: "D", t: "Befolgung von Anordnungen (OR 321d)"}
    ],
    correct: "C",
    explain: "Der Arbeitnehmer verletzt hier die Pflicht nach OR 321a Abs. 4, Geschäftsgeheimnisse zu schützen. Die Weitergabe von vertraulichen Geschäftsinformationen an Konkurrenten ist eine schwerwiegende Verletzung und kann zur Kündigung oder Schadensersatzpflicht führen."
  },
  {
    id: "a09",
    topic: "pflichten_an",
    type: "multi",
    diff: 2,
    tax: "K2",
    q: "Welche Aussagen über Arbeitnehmerpflichten sind richtig? (Mehrfachauswahl)",
    options: [
      {v: "A", t: "Der AN muss die Arbeit persönlich verrichten"},
      {v: "B", t: "Der AN kann jede Weisung des AG ignorieren, wenn sie unbequem ist"},
      {v: "C", t: "Der AN muss mit Sorgfalt arbeiten und sich treu verhalten"},
      {v: "D", t: "Der AN haftet für Schäden durch fahrlässiges Arbeiten"}
    ],
    correct: ["A", "C", "D"],
    explain: "Richtig sind: persönliche Arbeitspflicht (A), Sorgfalts- und Treuepflicht (C), und Haftung für Schäden (D). Weisungen müssen befolgt werden, aber nicht, wenn sie sittenwidrig oder gesetzwidrig sind (B ist falsch)."
  },
  {
    id: "a10",
    topic: "pflichten_an",
    type: "mc",
    diff: 3,
    tax: "K4",
    context: "Ein Arbeitnehmer in einer Apotheke wird angewiesen, ein bestimmtes Medikament einem Kunden zu verkaufen, ohne die vorgeschriebene ärztliche Verordnung zu prüfen. Der Arbeitnehmer weigert sich.",
    q: "Kann sich der Arbeitnehmer rechtlich auf seine Verweigerung berufen?",
    options: [
      {v: "A", t: "Nein, er muss alle Weisungen des Arbeitgebers befolgen"},
      {v: "B", t: "Ja, weil die Weisung gesetzwidrig ist und gegen Heilmittelvorschriften verstösst"},
      {v: "C", t: "Ja, aber nur wenn er schriftlich widerspricht"},
      {v: "D", t: "Nein, der Arbeitgeber trägt die volle Verantwortung"}
    ],
    correct: "B",
    explain: "Obwohl OR 321d die Befolgung von Weisungen vorsieht, gilt dies nicht für sittenwidrige oder gesetzwidrige Weisungen. Der Verkauf ohne Verordnung verstösst gegen Heilmittelgesetze und Sicherheitsvorschriften. Der Arbeitnehmer kann und sollte diese Weisung ablehnen. Obersatz: Muss der AN die Weisung befolgen? → Voraussetzungen: Ist die Weisung legal und sittengerecht? → Subsumtion: Nein, sie ist gesetzwidrig. → Schluss: Der AN darf die Weisung ablehnen."
  },
  {
    id: "a11",
    topic: "pflichten_an",
    type: "tf",
    diff: 3,
    tax: "K5",
    q: "Ein Arbeitnehmerin wird schwanger und möchte nach der Geburt weiterarbeiten. Ein strenges Konkurrenzverbot im Arbeitsvertrag verbietet ihr, für Konkurrenten zu arbeiten. Nach Beendigung des Arbeitsverhältnisses kann die Konkurrenzklausel vollständig durchgesetzt werden, wenn dies im Vertrag stand.",
    correct: false,
    explain: "Falsch. Konkurrenzbeschränkungen nach Beendigung (sogenannte 'non-compete'-Klauseln) unterliegen höheren Anforderungen als solche während des Arbeitsverhältnisses. Sie müssen zeitlich und räumlich angemessen sein und dürfen nicht unangemessen restriktiv wirken. Zudem können Schutzgesetze für Mütter relevant sein."
  },

  // TOPIC: pflichten_ag (12 questions)
  {
    id: "b01",
    topic: "pflichten_ag",
    type: "tf",
    diff: 1,
    tax: "K1",
    q: "Die Lohnzahlung ist die Hauptpflicht des Arbeitgebers nach dem Arbeitsrecht.",
    correct: true,
    explain: "Korrekt. Nach OR 322 ff. ist die Lohnzahlung die zentrale Gegenleistung des Arbeitgebers für die erbrachte Arbeit. Dies ist die Hauptpflicht des AG."
  },
  {
    id: "b02",
    topic: "pflichten_ag",
    type: "mc",
    diff: 1,
    tax: "K1",
    q: "Aus welchen Bestandteilen setzt sich ein Bruttolohn typischerweise zusammen?",
    options: [
      {v: "A", t: "Nur der vereinbarte Grundlohn"},
      {v: "B", t: "Vereinbarter Lohn + Zuschläge + 13. Monatslohn + Gratifikation"},
      {v: "C", t: "Nettolohn minus Steuern"},
      {v: "D", t: "Nur die ausbezahlte Summe auf dem Bankkonto"}
    ],
    correct: "B",
    explain: "Der Bruttolohn setzt sich aus dem vereinbarten Lohn, Zuschlägen (z.B. Überstunden, Nacht), dem 13. Monatslohn und Gratifikationen zusammen. Von diesem werden dann Sozialabzüge, Steuern und Versicherungen abgezogen, um zum Nettolohn zu gelangen."
  },
  {
    id: "b03",
    topic: "pflichten_ag",
    type: "fill",
    diff: 1,
    tax: "K1",
    q: "Der Arbeitgeber muss dem Arbeitnehmer bei jedem Lohnzahlungstermin eine ________ mit allen wesentlichen Angaben aushändigen.",
    blanks: [
      {answer: "Lohnabrechnung", alts: ["schriftliche Abrechnung", "Lohnzettel", "Lohnbeleg"]}
    ],
    explain: "Nach OR 322 muss der AG dem AN eine schriftliche Lohnabrechnung ausstellen, auf der die Bruttolöhne, Abzüge und der Nettolohn ersichtlich sind. Dies dokumentiert die korrekte Lohnzahlung."
  },
  {
    id: "b04",
    topic: "pflichten_ag",
    type: "mc",
    diff: 1,
    tax: "K1",
    q: "Muss der Arbeitgeber dem Arbeitnehmer Arbeitsgeräte und Material zur Verfügung stellen?",
    options: [
      {v: "A", t: "Nein, der Arbeitnehmer muss sich selbst ausstatten"},
      {v: "B", t: "Ja, nach OR 327 muss der AG die notwendigen Werkzeuge bereitstellen"},
      {v: "C", t: "Nur für Büroarbeit"},
      {v: "D", t: "Nur wenn der Arbeitnehmer dies fordert"}
    ],
    correct: "B",
    explain: "Nach OR 327 ist der Arbeitgeber verpflichtet, dem Arbeitnehmer die notwendigen Werkzeuge und Materialien zur Verfügung zu stellen, damit dieser seine Arbeit ausführen kann."
  },
  {
    id: "b05",
    topic: "pflichten_ag",
    type: "tf",
    diff: 2,
    tax: "K2",
    q: "Der Arbeitgeber muss dem Arbeitnehmer bei unverschuldeter Verhinderung (z.B. Krankheit) den Lohn noch für eine bestimmte Dauer weiterzahlen.",
    correct: true,
    explain: "Korrekt. Nach OR 324a muss der AG bei unverschuldeter Verhinderung des AN (Krankheit, Unfall) den Lohn fortsetzen. Die Dauer ist gestaffelt nach Dienstjahren (Berner Skala: 1 DJ = 3 Wochen, bis 20+ DJ = 26 Wochen)."
  },
  {
    id: "b06",
    topic: "pflichten_ag",
    type: "mc",
    diff: 2,
    tax: "K2",
    q: "Ein Arbeitnehmer mit 3 Jahren Dienstzeit wird krank und kann nicht arbeiten. Wie lange muss der Arbeitgeber nach der Berner Skala (OR 324a) den Lohn weiterzahlen?",
    options: [
      {v: "A", t: "3 Wochen"},
      {v: "B", t: "4 Wochen"},
      {v: "C", t: "9 Wochen"},
      {v: "D", t: "13 Wochen"}
    ],
    correct: "C",
    explain: "Nach der Berner Skala (OR 324a) sind die Lohnfortzahlungsfristen gestaffelt: 1 Dienstjahr = 3 Wochen, 2 Dienstjahre = 4 Wochen, 3-4 Dienstjahre = 9 Wochen. Drei Jahre Dienstzeit = 9 Wochen Lohnfortzahlung."
  },
  {
    id: "b07",
    topic: "pflichten_ag",
    type: "fill",
    diff: 2,
    tax: "K2",
    q: "Der Arbeitgeber muss die Persönlichkeit des Arbeiters schützen, einschliesslich seiner ________ und ________ (OR 328 ff.).",
    blanks: [
      {answer: "Gesundheit", alts: ["körperliche Gesundheit", "physische Gesundheit"]},
      {answer: "Würde", alts: ["Ehre", "Ruf"]}
    ],
    explain: "Nach OR 328 ff. muss der AG die Persönlichkeit des AN schützen, insbesondere Gesundheit, Würde und Integrität. Dies umfasst Mobbing-Schutz, Diskriminierungsschutz und sichere Arbeitsbedingungen."
  },
  {
    id: "b08",
    topic: "pflichten_ag",
    type: "mc",
    diff: 2,
    tax: "K3",
    q: "Ein Arbeiter möchte von seinem Arbeitgeber ein Arbeitszeugnis erhalten. Was muss dieses nach OR 330a enthalten?",
    options: [
      {v: "A", t: "Nur die Tätigkeiten und Arbeitsdaten"},
      {v: "B", t: "Nur Positives über den Arbeitnehmer"},
      {v: "C", t: "Wahr, klar, vollständig und in wohlwollender Form"},
      {v: "D", t: "Alle Fehlverhalten und Konflikte"}
    ],
    correct: "C",
    explain: "Nach OR 330a muss ein Arbeitszeugnis wahr, klar und vollständig sein. Es muss in wohlwollender (schonender) Form formuliert sein, darf also nicht böswillig schlecht sein, aber auch nicht falsch positiv."
  },
  {
    id: "b09",
    topic: "pflichten_ag",
    type: "multi",
    diff: 2,
    tax: "K2",
    q: "Welche Aussagen über Arbeitgeberpflichten sind korrekt? (Mehrfachauswahl)",
    options: [
      {v: "A", t: "Der AG muss den Lohn zahlen und dokumentieren"},
      {v: "B", t: "Der AG muss Werkzeuge und Material bereitstellen"},
      {v: "C", t: "Der AG darf Überstunden immer unbegrenzt anordnen"},
      {v: "D", t: "Der AG muss bei Krankheit für eine bestimmte Dauer Lohn weiterzahlen"}
    ],
    correct: ["A", "B", "D"],
    explain: "Korrekt sind A, B und D. Unbegrenzte Überstunden darf der AG nicht anordnen – diese müssen notwendig und zumutbar sein (OR 321c) und sind entgeltlich zu vergüten."
  },
  {
    id: "b10",
    topic: "pflichten_ag",
    type: "mc",
    diff: 3,
    tax: "K4",
    context: "Ein Arbeitgeber verbietet einem Arbeitnehmer, während der Arbeit ein religiöses Symbol zu tragen. Der Arbeitnehmer sieht darin eine Verletzung seiner Persönlichkeit.",
    q: "Kann der Arbeitnehmer sich auf eine Verletzung seiner Persönlichkeitsrechte nach OR 328 berufen?",
    options: [
      {v: "A", t: "Nein, der Arbeitgeber darf jede Kleiderordnung festlegen"},
      {v: "B", t: "Ja, automatisch, jedes Symbol ist geschützt"},
      {v: "C", t: "Ja, wenn die Regelung unverhältnismässig eingreift, ohne legitimen Grund"},
      {v: "D", t: "Nein, Persönlichkeitsschutz gilt nur ausserhalb der Arbeit"}
    ],
    correct: "C",
    explain: "Nach OR 328 muss der AG die Persönlichkeit schützen. Ein generales Verbot von religiösen Symbolen könnte eine unverhältnismässige Einschränkung darstellen. Ein Verbot ist nur zulässig, wenn ein legitimer Grund besteht (z.B. Sicherheit, Kundenschutz). Dies erfordert eine Verhältnismässigkeitsprüfung."
  },
  {
    id: "b11",
    topic: "pflichten_ag",
    type: "tf",
    diff: 3,
    tax: "K4",
    q: "Ein Arbeitgeber muss für alle Arbeitsunfälle die vollständige Heilungskosten ersetzen, unabhängig davon, wie der Unfall geschah.",
    correct: false,
    explain: "Falsch. Der AG trägt Lohnfortzahlung bei Unfall (OR 324a), aber die Heilungskosten werden durch Unfallversicherung gedeckt (UVG). Der AG muss jedoch sichere Arbeitsbedingungen gewährleisten und Schutzvorschriften einhalten."
  },
  {
    id: "b12",
    topic: "pflichten_ag",
    type: "mc",
    diff: 3,
    tax: "K5",
    q: "Ein Arbeitgeber zahlt seinem Angestellten immer Bargeld ohne schriftliche Lohnabrechnung aus. Welche Konsequenzen hat dies rechtlich?",
    options: [
      {v: "A", t: "Das ist zulässig, wenn der Arbeitnehmer zustimmt"},
      {v: "B", t: "Verstoss gegen OR 322, die schriftliche Abrechnung ist Pflicht"},
      {v: "C", t: "Der Arbeitnehmer kann keinen Lohn fordern"},
      {v: "D", t: "Das ist nur bei Teilzeitarbeit zulässig"}
    ],
    correct: "B",
    explain: "Nach OR 322 ist die schriftliche Lohnabrechnung eine zwingende Pflicht des Arbeitgebers. Dies schützt den Arbeitnehmer, dokumentiert Sozialversicherungsbeiträge und Steuern. Der Verstoss kann zu Bussen und Schadensersatz führen. Ein Verzicht durch AN-Zustimmung ist nicht möglich (zwingende Vorschrift)."
  },

  // TOPIC: beendigung (11 questions)
  {
    id: "k01",
    topic: "beendigung",
    type: "tf",
    diff: 1,
    tax: "K1",
    q: "Ein Arbeitsvertrag mit Ablauf einer vereinbarten Frist endet automatisch nach Ablauf der Zeit, ohne dass eine Kündigung nötig ist.",
    correct: true,
    explain: "Korrekt. Nach OR 334 endet ein befristeter Arbeitsvertrag durch Zeitablauf. Dies ist eine Form der Beendigung, die keine Kündigung erfordert."
  },
  {
    id: "k02",
    topic: "beendigung",
    type: "mc",
    diff: 1,
    tax: "K1",
    img: {src: "img/recht/arbeitsrecht/arbeitsrecht_kuendigungsfristen_01.svg", alt: "Zeitleiste: Kündigungsfristen nach Dienstjahren mit Fragezeichen"},
    q: "Wie lange beträgt die Kündigungsfrist während der Probezeit nach OR 335b?",
    options: [
      {v: "A", t: "1 Tag"},
      {v: "B", t: "7 Tage"},
      {v: "C", t: "1 Monat"},
      {v: "D", t: "3 Monate"}
    ],
    correct: "B",
    explain: "Nach OR 335b beträgt die Kündigungsfrist während der Probezeit (maximal 3 Monate) 7 Tage für beide Parteien. Dies ermöglicht eine schnelle Beendigung, wenn sich die Zusammenarbeit nicht bewährt."
  },
  {
    id: "k03",
    topic: "beendigung",
    type: "fill",
    diff: 1,
    tax: "K1",
    q: "Die Kündigungsfrist nach dem ersten Dienstjahr beträgt nach OR 335c ________ Monat(e), und das Kündigungstermin ist das Ende des folgenden ________.",
    blanks: [
      {answer: "1", alts: ["einen", "ein"]},
      {answer: "Monats", alts: ["Kalendermonats", "Monates"]}
    ],
    explain: "Nach OR 335c beträgt die ordentliche Kündigungsfrist im 1. Dienstjahr 1 Monat, mit Termin auf Ende eines folgenden Kalendermonats. Z.B. Kündigung am 15.6. wirkt auf 31.7."
  },
  {
    id: "k04",
    topic: "beendigung",
    type: "mc",
    diff: 1,
    tax: "K1",
    q: "Was ist der wesentliche Unterschied zwischen ordentlicher und ausserordentlicher Kündigung?",
    options: [
      {v: "A", t: "Ordentlich ist schriftlich, ausserordentlich mündlich"},
      {v: "B", t: "Ordentlich hat Kündigungsfristen, ausserordentlich ist sofort"},
      {v: "C", t: "Ordentlich bedarf eines wichtigen Grundes, ausserordentlich nicht"},
      {v: "D", t: "Es gibt keinen Unterschied"}
    ],
    correct: "B",
    explain: "Ordentliche Kündigung (OR 335 ff.) erfordert Fristen (7 Tage in Probezeit, 1 Monat im 1. Jahr, 2 Monate ab 2. Jahr, 3 Monate ab 10. Jahr). Ausserordentliche/fristlose Kündigung (OR 337) ist sofort möglich, erfordert aber einen wichtigen Grund."
  },
  {
    id: "k05",
    topic: "beendigung",
    type: "tf",
    diff: 2,
    tax: "K2",
    q: "Eine Kündigung ist nur gültig, wenn sie schriftlich erfolgt und von beiden Parteien unterschrieben ist.",
    correct: false,
    explain: "Falsch. Nach OR 335 ist eine schriftliche Kündigung erforderlich, aber nur von der kündigenden Partei zu unterzeichnen. Eine Unterschrift der anderen Partei ist nicht nötig. Die Mitteilung muss nur der AG/AN erhalten."
  },
  {
    id: "k06",
    topic: "beendigung",
    type: "mc",
    diff: 2,
    tax: "K2",
    q: "Ein Arbeitnehmer mit 8 Jahren Dienstzeit kündigt am 10. März. Welches ist das früheste Kündigungsdatum?",
    options: [
      {v: "A", t: "10. April"},
      {v: "B", t: "30. April"},
      {v: "C", t: "31. Mai"},
      {v: "D", t: "30. Juni"}
    ],
    correct: "C",
    explain: "Nach 8 Dienstjahren (2.-9. Jahr) beträgt die Kündigungsfrist 2 Monate auf Ende eines Monats (OR 335c). Kündigung am 10. März läuft: Frist beginnt am 10. März, endet 2 Monate später am 10. Mai → nächster Monatswechsel = 31. Mai."
  },
  {
    id: "k07",
    topic: "beendigung",
    type: "fill",
    diff: 2,
    tax: "K2",
    q: "Eine ausserordentliche Kündigung nach OR 337 ist sofort wirksam, wenn ein ________ Grund besteht und die Fortführung dem Kündigenden ________ ist.",
    blanks: [
      {answer: "wichtiger", alts: ["schwerwiegender", "triftiger"]},
      {answer: "unzumutbar", alts: ["unmöglich", "unzumutbar geworden"]}
    ],
    explain: "Nach OR 337 ist eine fristlose Kündigung zulässig, wenn ein wichtiger Grund besteht und die Fortführung des Arbeitsverhältnisses dem Kündigenden unzumutbar ist. Beispiele: Zahlungsunfähigkeit, Diebstahl, schwere Mobbingsituationen."
  },
  {
    id: "k08",
    topic: "beendigung",
    type: "multi",
    diff: 2,
    tax: "K2",
    q: "Welche Aussagen zum Arbeitszeugnis nach Beendigung sind richtig? (Mehrfachauswahl)",
    options: [
      {v: "A", t: "Der Arbeitnehmer hat Anspruch auf ein Arbeitszeugnis"},
      {v: "B", t: "Das Zeugnis muss wahr, klar und vollständig sein"},
      {v: "C", t: "Negative Inhalte sind immer verboten"},
      {v: "D", t: "Der Arbeitgeber kann das Zeugnis verweigern"}
    ],
    correct: ["A", "B"],
    explain: "Der AN hat Anspruch auf ein Zeugnis (OR 330a), das wahr, klar und vollständig sein muss. Negative Inhalte sind zulässig, wenn sie wahr sind, müssen aber wohlwollend formuliert sein. Der AG kann das Zeugnis nicht verweigern."
  },
  {
    id: "k09",
    topic: "beendigung",
    type: "mc",
    diff: 3,
    tax: "K4",
    context: "Ein Arbeitgeber kündigt einem treuen Mitarbeiter ausserordentlich/fristlos. Als Grund gibt er an, dass der Mitarbeiter mit dem falschen Lohn-System nicht umgehen kann. Der Mitarbeiter behauptet, dass dies kein wichtiger Grund ist.",
    q: "Hat der Arbeitnehmer Recht?",
    options: [
      {v: "A", t: "Ja, mangelnde Kompetenz ist kein wichtiger Grund"},
      {v: "B", t: "Nein, der Arbeitgeber kann jederzeit kündigen"},
      {v: "C", t: "Es kommt auf die Schwere der Sachkunde an"},
      {v: "D", t: "Ja, wichtige Gründe sind nur persönliches Fehlverhalten"}
    ],
    correct: "A",
    explain: "Mangelnde Kompetenz oder sachliche Fehler sind normalerweise kein wichtiger Grund für ausserordentliche Kündigung (OR 337). Für Leistungsmängel ist eine ordentliche Kündigung mit Frist angemessen. Nur schwerwiegende Verstösse oder Treuebruch rechtfertigen fristlose Entlassung. Obersatz: Liegt ein wichtiger Grund vor? → Voraussetzungen: Muss erheblich und unzumutbar sein. → Subsumtion: Mangelnde Sachkunde ist nicht erheblich genug. → Schluss: Kein wichtiger Grund."
  },
  {
    id: "k10",
    topic: "beendigung",
    type: "tf",
    diff: 3,
    tax: "K4",
    q: "Wenn ein Arbeitnehmer wegen Leistungsmängeln ausserordentlich gekündigt wird und vor Gericht gewinnt, hat er Anspruch auf Schadensersatz, aber nicht auf Lohnfortzahlung.",
    correct: false,
    explain: "Falsch. Nach OR 337b und 337c hat ein Arbeitnehmer, dessen unrechtmässige Kündigung festgestellt wird, Anspruch sowohl auf Wiedereinstellung als auch auf Schadensersatz und Lohnfortzahlung für die Zeit ohne Arbeit. Die volle Reparation ist das Ziel."
  },
  {
    id: "k11",
    topic: "beendigung",
    type: "mc",
    diff: 3,
    tax: "K5",
    q: "Ein Arbeitgeber teilt einem langjährigen Arbeitnehmer am 01. März per Telefon mit, dass das Arbeitsverhältnis 'per sofort' endet. Welche rechtswidrigen Aspekte liegen vor?",
    options: [
      {v: "A", t: "Nur die Formlosigkeit (nicht schriftlich)"},
      {v: "B", t: "Nur der fehlende wichtige Grund"},
      {v: "C", t: "Formlosigkeit UND vermutlich fehlender wichtiger Grund"},
      {v: "D", t: "Keine Rechtsverletzung, die Kündigung ist gültig"}
    ],
    correct: "C",
    explain: "Es liegen zwei Mängel vor: (1) Formverletzung – Kündigung muss schriftlich erfolgen (OR 335), und (2) fehlender wichtiger Grund – eine Telefonkündigung per sofort ist nur zulässig mit erheblichem Grund (OR 337). Ohne Grund ist eine ordentliche Kündigung mit Frist erforderlich. Beiden Mängel zusammen machen die Kündigung rechtswidrig."
  },

  // TOPIC: kuendigungsschutz (11 questions)
  {
    id: "s01",
    topic: "kuendigungsschutz",
    type: "tf",
    diff: 1,
    tax: "K1",
    q: "Eine missbräuchliche Kündigung kann dem Arbeitnehmer eine Entschädigung durch das Arbeitsgericht bringen.",
    correct: true,
    explain: "Korrekt. Nach OR 336-336d kann eine missbräuchliche Kündigung stattgefunden haben. Der Arbeitnehmer kann Entschädigung erhalten (1-6 Monatslöhne nach OR 336a)."
  },
  {
    id: "s02",
    topic: "kuendigungsschutz",
    type: "mc",
    diff: 1,
    tax: "K1",
    q: "Was ist ein Beispiel für missbräuchliche Kündigung nach OR 336?",
    options: [
      {v: "A", t: "Kündigung wegen Mitgliedschaft in einer Gewerkschaft"},
      {v: "B", t: "Kündigung wegen mangelnder Leistung"},
      {v: "C", t: "Kündigung während der Probezeit"},
      {v: "D", t: "Kündigung aus Personalmangel"}
    ],
    correct: "A",
    explain: "Kündigung wegen Gewerkschaftsmitgliedschaft oder Beteiligung an Streik ist missbräuchlich (OR 336 Abs. 1, Buchstabe a). Dies schützt die Koalitionsfreiheit. Leistungsmängel, Probezeit und geschäftliche Gründe sind keine Missbräuche."
  },
  {
    id: "s03",
    topic: "kuendigungsschutz",
    type: "fill",
    diff: 1,
    tax: "K1",
    q: "Die Entschädigung für eine missbräuchliche Kündigung beträgt nach OR 336a mindestens ________ und höchstens ________ Monatslöhne.",
    blanks: [
      {answer: "1", alts: ["einen", "ein"]},
      {answer: "6", alts: ["sechs"]}
    ],
    explain: "Nach OR 336a wird bei missbräuchlicher Kündigung Entschädigung in Höhe von mindestens 1 bis maximal 6 Monatslöhnen gewährt. Das Gericht berücksichtigt die Schwere des Missbrauchs."
  },
  {
    id: "s04",
    topic: "kuendigungsschutz",
    type: "mc",
    diff: 1,
    tax: "K1",
    q: "In welchem Fall darf ein Arbeitgeber eine Arbeitnehmerin nicht kündigen?",
    options: [
      {v: "A", t: "Während ihrer Schwangerschaft und 16 Wochen nach der Geburt"},
      {v: "B", t: "Während ihrer Schwangerschaft, aber danach unbegrenzt"},
      {v: "C", t: "Nur in den ersten 3 Monaten der Schwangerschaft"},
      {v: "D", t: "Es gibt keinen Kündigungsschutz während Schwangerschaft"}
    ],
    correct: "A",
    explain: "Nach OR 336c ist eine Kündigung während der Schwangerschaft und 16 Wochen nach der Niederkunft nicht zulässig. Dies ist absoluter Schutz der Mutter und des Kindes."
  },
  {
    id: "s05",
    topic: "kuendigungsschutz",
    type: "tf",
    diff: 2,
    tax: "K2",
    q: "Wenn ein Arbeitnehmer während einer Sperrfrist (z.B. Krankheit) gekündigt wird, ist diese Kündigung nichtig und hat keine Wirkung.",
    correct: true,
    explain: "Korrekt. Nach OR 336c ist eine Kündigung während einer Sperrfrist nichtig. Dies schützt Arbeitnehmer in vulnerablen Situationen (Krankheit, Schwangerschaft, Wehrdienst). Die Kündigung ist unwirksam."
  },
  {
    id: "s06",
    topic: "kuendigungsschutz",
    type: "mc",
    diff: 2,
    tax: "K2",
    q: "Ein Arbeitnehmer wird krank. Die Sperrfrist beginnt mit dem ersten Tag der Krankheit. Der Arbeitgeber versucht, am Tag 1 der Krankheit zu kündigen. Welche Sperrfristdauer schützt den Arbeitnehmer?",
    options: [
      {v: "A", t: "Keine, die Kündigung ist sofort wirksam"},
      {v: "B", t: "Die Sperrfrist dauert die ganze Krankheitsdauer"},
      {v: "C", t: "30 Tage ab Krankheitsbeginn"},
      {v: "D", t: "So lange wie Lohnfortzahlung läuft (Berner Skala)"}
    ],
    correct: "B",
    explain: "Nach OR 336c ist eine Kündigung während Krankheit nicht zulässig. Die Sperrfrist dauert während der ganzen Arbeitsunfähigkeit, mindestens aber so lange, wie die Lohnfortzahlung andauert."
  },
  {
    id: "s07",
    topic: "kuendigungsschutz",
    type: "fill",
    diff: 2,
    tax: "K2",
    q: "Eine Kündigung vor einer Sperrfrist ist rechtlich wirksam, aber die ________ wird unterbrochen und läuft nach Ablauf der Sperrfrist ________, bis der Kündigungstermin erreicht ist.",
    blanks: [
      {answer: "Kündigungsfrist", alts: ["Frist"]},
      {answer: "weiter", alts: ["erneut", "wieder"]}
    ],
    explain: "Nach OR 336c Abs. 2: Wird eine Kündigung vor einer Sperrfrist ausgesprochen, wird die Kündigungsfrist unterbrochen und läuft nach Ablauf der Sperrfrist weiter. Dies schützt den AN durch Verlängerung der Betriebszugehörigkeit."
  },
  {
    id: "s08",
    topic: "kuendigungsschutz",
    type: "multi",
    diff: 2,
    tax: "K2",
    q: "Welche Situationen begründen nach OR 336c Kündigungssperrfristen? (Mehrfachauswahl)",
    options: [
      {v: "A", t: "Schwangerschaft und 16 Wochen nach Niederkunft"},
      {v: "B", t: "Militär- oder Zivildienst"},
      {v: "C", t: "Krankheit oder Unfall"},
      {v: "D", t: "Beteiligung an gewerkschaftlichen Aktionen"}
    ],
    correct: ["A", "B", "C"],
    explain: "Nach OR 336c und 336d bestehen Kündigungssperrfristen bei (A) Schwangerschaft, (B) Wehrdienst, (C) Krankheit/Unfall und (D) ist eher ein Grund für missbräuchliche Kündigung, nicht für Sperrfrist. Die Sperrfristen schützen Arbeitnehmer in vulnerablen Lebenssituationen."
  },
  {
    id: "s09",
    topic: "kuendigungsschutz",
    type: "mc",
    diff: 3,
    tax: "K4",
    context: "Ein Arbeitnehmer teilt seinem Arbeitgeber am 05. März mit, dass er schwanger ist. Am 20. März erhält er eine ordentliche Kündigung mit 2 Monaten Frist (Kündigungstermin 31. Mai). Der Arbeitnehmer behauptet, die Kündigung sei wegen der Schwangerschaft erfolgt und somit nichtig.",
    q: "Hat der Arbeitnehmer Recht, dass die Kündigung nichtig ist?",
    options: [
      {v: "A", t: "Ja, jede Kündigung während Schwangerschaft ist absolut nichtig"},
      {v: "B", t: "Nein, die Kündigung kann auch vor Mitteilung ausgesprochen sein"},
      {v: "C", t: "Ja, aber nur wenn der Grund der Schwangerschaft ist"},
      {v: "D", t: "Nein, eine schriftliche Kündigung mit Frist ist immer wirksam"}
    ],
    correct: "A",
    explain: "Nach OR 336c ist eine Kündigung während der Schwangerschaft und 16 Wochen nach der Niederkunft absolut nichtig, unabhängig vom Kündigungsgrund. Eine Kündigung, die während der Schwangerschaft erfolgt, ist formell nichtig und hat keine Wirkung. Die Sperrfrist ist absolut. Obersatz: Ist die Kündigung während einer Sperrfrist zulässig? → Voraussetzungen: Liegt eine Sperrfristsituation vor? → Subsumtion: Ja, Schwangerschaft ist eine Sperrfristsituation. → Schluss: Kündigung ist nichtig."
  },
  {
    id: "s10",
    topic: "kuendigungsschutz",
    type: "tf",
    diff: 3,
    tax: "K4",
    q: "Ein Arbeitgeber kann eine missbräuchliche Kündigung durch Zahlung von Entschädigung ersetzen und muss den Arbeitnehmer nicht wieder in sein Amt einsetzen.",
    correct: false,
    explain: "Falsch. Nach OR 336a kann der Arbeitnehmer zwischen Wiedereinstellung und Entschädigung wählen. Der Arbeitgeber hat grundsätzlich nur dann die Wahl auf Entschädigung, wenn die Wiedereinstellung unmöglich oder unzumutbar ist. Ansonsten muss der AN wieder angestellt werden."
  },
  {
    id: "s11",
    topic: "kuendigungsschutz",
    type: "mc",
    diff: 3,
    tax: "K5",
    q: "Beurteilen Sie diese Situation: Ein Arbeitnehmer wird am 15. Juni gekündigt, sein Arbeitgeber merkt dabei, dass der Arbeitnehmer schwanger ist. Der Arbeitgeber möchte die Kündigung zurückziehen, aber es ist nun zu spät. Was folgt aus dem Arbeitsrecht?",
    options: [
      {v: "A", t: "Die Kündigung ist gültig, da sie schriftlich erfolgte"},
      {v: "B", t: "Die Kündigung ist nichtig, weil während Schwangerschaft gekündigt wurde"},
      {v: "C", t: "Der Arbeitnehmer kann sich zwischen Wiedereinstellung und Entschädigung wählen"},
      {v: "D", t: "Der Arbeitnehmer hat keinen Schutz, weil der AG nicht von der Schwangerschaft wusste"}
    ],
    correct: "B",
    explain: "Nach OR 336c ist eine Kündigung während der Schwangerschaft absolut nichtig. Es spielt keine Rolle, ob der Arbeitgeber von der Schwangerschaft wusste oder nicht – die formale Sperrfrist ist absolut. Der Rückzugsversuch ändert nichts an der Nichtigkeit. Der Arbeitnehmer besteht auf Wiedereinstellung, es sei denn, die Verhältnisse sind unzumutbar geworden."
  },

  // TOPIC: oeffentliches_ar (12 questions)
  {
    id: "o01",
    topic: "oeffentliches_ar",
    type: "tf",
    diff: 1,
    tax: "K1",
    q: "Das Arbeitsgesetz (ArG) gilt grundsätzlich für alle Betriebe in der Schweiz.",
    correct: true,
    explain: "Korrekt. Das ArG hat generelle Geltung, allerdings mit Ausnahmen wie staatliche Verwaltungen, landwirtschaftliche Betriebe, leitende Angestellte, und wissenschaftliche/künstlerische Tätigkeiten."
  },
  {
    id: "o02",
    topic: "oeffentliches_ar",
    type: "mc",
    diff: 1,
    tax: "K1",
    q: "Welche maximale Höchstarbeitszeit schreibt das Arbeitsgesetz (ArG 9) für industrielle Betriebe vor?",
    options: [
      {v: "A", t: "40 Stunden pro Woche"},
      {v: "B", t: "44 Stunden pro Woche"},
      {v: "C", t: "45 Stunden pro Woche"},
      {v: "D", t: "50 Stunden pro Woche"}
    ],
    correct: "C",
    explain: "Nach ArG 9 beträgt die maximale Wochenarbeitszeit für industrielle, Büro- und Verkaufsbetriebe 45 Stunden pro Woche. Für andere Betriebe sind es 50 Stunden."
  },
  {
    id: "o03",
    topic: "oeffentliches_ar",
    type: "fill",
    diff: 1,
    tax: "K1",
    q: "Nach dem ArG 9 beträgt die Höchstarbeitszeit für übrige Betriebe (z.B. Landwirtschaft, Gaststättenbetriebe) ________ Stunden pro Woche.",
    blanks: [
      {answer: "50", alts: ["fünfzig"]}
    ],
    explain: "Nach ArG 9 Abs. 1 beträgt die maximale Wochenarbeitszeit für nicht spezifisch aufgeführte Betriebe 50 Stunden. Dies schützt die Gesundheit der Arbeitnehmer."
  },
  {
    id: "o04",
    topic: "oeffentliches_ar",
    type: "mc",
    diff: 1,
    tax: "K1",
    q: "Darf ein Arbeitgeber ein Nachtschicht-Arbeiter (23:00–06:00 Uhr) ohne zusätzliche Vergütung einsetzen?",
    options: [
      {v: "A", t: "Ja, die normale Arbeitszeit gilt auch nachts"},
      {v: "B", t: "Nein, Nachtarbeit erfordert einen Lohnzuschlag von 25% oder 50%"},
      {v: "C", t: "Nein, Nachtarbeit ist generell verboten"},
      {v: "D", t: "Ja, aber nur mit schriftlicher Zustimmung"}
    ],
    correct: "B",
    explain: "Nach ArG 16-20 erfordert Nachtarbeit (23:00-06:00 Uhr) einen Lohnzuschlag von mindestens 25%, bei Sonntagen 50%. Dies ist Schutz vor Überbelastung und Gesundheitsrisiken."
  },
  {
    id: "o05",
    topic: "oeffentliches_ar",
    type: "tf",
    diff: 2,
    tax: "K2",
    q: "Überzeit (Stunden über die Höchstarbeitszeit hinaus) darf pro Jahr maximal 170 Stunden betragen und muss durch Freizeit oder Lohnzuschlag kompensiert werden.",
    correct: true,
    explain: "Korrekt. Nach ArG 12-13 ist Überzeit auf max. 170 Stunden pro Jahr begrenzt (140 Std. in bestimmten Branchen). Die Vergütung erfolgt durch gleichwertige Freizeit oder Lohnzuschlag."
  },
  {
    id: "o06",
    topic: "oeffentliches_ar",
    type: "mc",
    diff: 2,
    tax: "K2",
    q: "Ein Arbeitgeber lässt einen Arbeitnehmer an einem Tag 10 Stunden arbeiten, obwohl seine normale Arbeitszeit 8 Stunden pro Tag beträgt. Ist dies zulässig?",
    options: [
      {v: "A", t: "Nein, nie mehr als 8 Stunden pro Tag"},
      {v: "B", t: "Ja, wenn die Wochenarbeitszeit nicht überschritten wird"},
      {v: "C", t: "Ja, unbegrenzt, wenn notwendig"},
      {v: "D", t: "Nein, höchstens 9 Stunden pro Tag erlaubt"}
    ],
    correct: "B",
    explain: "Das ArG limitiert nicht die tägliche Arbeitszeit auf 8 Stunden, sondern die Wochenarbeitszeit (45 oder 50 Stunden). Solange die Wochenarbeitszeit nicht überschritten wird und Pausen eingehalten werden, ist ein längerer Tag zulässig."
  },
  {
    id: "o07",
    topic: "oeffentliches_ar",
    type: "fill",
    diff: 2,
    tax: "K2",
    q: "Nach ArG 15 hat ein Arbeitnehmer bei einer Arbeitszeit über 7 Stunden Anspruch auf mindestens ________ Minuten Pause.",
    blanks: [
      {answer: "30", alts: ["dreissig"]}
    ],
    explain: "Nach ArG 15 variiert die Pausendauer: über 5,5 h = 15 Min., über 7 h = 30 Min., über 9 h = 60 Min. Dies schützt die Erholung und Gesundheit."
  },
  {
    id: "o08",
    topic: "oeffentliches_ar",
    type: "multi",
    diff: 2,
    tax: "K2",
    q: "Welche Aussagen zum öffentlich-rechtlichen Arbeitsrecht (ArG) sind korrekt? (Mehrfachauswahl)",
    options: [
      {v: "A", t: "Das ArG regelt Höchstarbeitszeiten und Pausenregelungen"},
      {v: "B", t: "Das ArG gilt absolut für leitende Angestellte"},
      {v: "C", t: "Das ArG schützt mit Schutzmassnahmen schwangere Frauen"},
      {v: "D", t: "Das ArG verbietet jede Form von Nachtarbeit"}
    ],
    correct: ["A", "C"],
    explain: "A und C sind richtig. Das ArG ist relativ zwingendes Recht mit Schutzvorschriften für Arbeitszeiten und schwangere/stillende Frauen. Leitende Angestellte sind ausgenommen (B falsch), und Nachtarbeit ist mit Zuschlag zulässig (D falsch)."
  },
  {
    id: "o09",
    topic: "oeffentliches_ar",
    type: "mc",
    diff: 3,
    tax: "K4",
    context: "Ein Arbeitgeber beschäftigt 6 ständig angestellte Arbeitnehmer in einem Elektrobetrieb. Er möchte sie regelmässig in Nachtschichten arbeiten lassen ohne Lohnzuschlag, um Kosten zu sparen. Ein Arbeitnehmer wehrt sich.",
    q: "Kann der Arbeitgeber diese Regelung durchsetzen?",
    options: [
      {v: "A", t: "Ja, kleine Betriebe sind vom ArG befreit"},
      {v: "B", t: "Nein, Nachtarbeit erfordert Zuschlag nach ArG 16-20"},
      {v: "C", t: "Ja, wenn alle Arbeitnehmer zustimmen"},
      {v: "D", t: "Nein, Nachtarbeit ist ganz verboten"}
    ],
    correct: "B",
    explain: "Das ArG gilt für Betriebe aller Grössen und auch kleine Betriebe unterliegen den Schutzbestimmungen. Nachtarbeit (23:00-06:00) erfordert nach ArG 16-20 einen Lohnzuschlag von mindestens 25%. Eine Zustimmung der Arbeitnehmer macht diese zwingende Vorschrift nicht hinfällig."
  },
  {
    id: "o10",
    topic: "oeffentliches_ar",
    type: "tf",
    diff: 3,
    tax: "K4",
    q: "Das Arbeitsgesetz (ArG) ist absolut zwingendes Recht und jede Abweichung, auch zu Gunsten der Arbeitnehmer, ist ungültig.",
    correct: false,
    explain: "Falsch. Das ArG ist relativ zwingendes Recht. Abweichungen sind zulässig, wenn sie zu Gunsten der Arbeitnehmer erfolgen (z.B. bessere Arbeitszeiten, höhere Zuschläge). Abweichungen zu Lasten des AN sind ungültig."
  },
  {
    id: "o11",
    topic: "oeffentliches_ar",
    type: "mc",
    diff: 3,
    tax: "K5",
    q: "Eine schwangere Arbeitnehmerin soll während der Nacht (23:00–06:00) arbeiten. Welche Schutzbestimmungen des ArG sind relevant?",
    options: [
      {v: "A", t: "Nur der Lohnzuschlag für Nachtarbeit (ArG 16)"},
      {v: "B", t: "Nur die allgemeinen Arbeitszeit-Limits (ArG 9)"},
      {v: "C", t: "ArG 35-36: Spezielle Schutzregelungen für schwangere und stillende Frauen"},
      {v: "D", t: "Keine besonderen Schutzbestimmungen"}
    ],
    correct: "C",
    explain: "Nach ArG 35-36 sind schwangere und stillende Frauen geschützt durch besondere Regelungen: Nachtarbeit ist verboten (ausser unter strengen Bedingungen), und Ruhezeiten sind geschützt. Dies geht über normale Nachtarbeitsbedingungen hinaus und schützt Mutter und Kind."
  },
  {
    id: "o12",
    topic: "oeffentliches_ar",
    type: "tf",
    diff: 3,
    tax: "K5",
    q: "Ein Arbeitgeber kann von einem Arbeitnehmer in einem Elektrobetrieb verlangen, 15 Stunden pro Woche Überzeit zu leisten, ohne diese durch Freizeit oder Zuschlag zu kompensieren, da dies notwendig ist.",
    correct: false,
    explain: "Falsch. Überzeit ist begrenzt auf max. 170 Stunden pro Jahr und muss durch gleichwertige Freizeit oder Lohnzuschlag kompensiert werden (ArG 12-13). ‹Notwendigkeit› ändert nicht die zwingende Kompensationspflicht."
  },

  // TOPIC: kollektives_ar (11 questions)
  {
    id: "c01",
    topic: "kollektives_ar",
    type: "tf",
    diff: 1,
    tax: "K1",
    q: "Ein Gesamtarbeitsvertrag (GAV) ist eine Vereinbarung zwischen einer Arbeitnehmerverbaenden/Gewerkschaft und einem Arbeitgeberverband.",
    correct: true,
    explain: "Korrekt. Ein GAV (OR 356-358) wird zwischen Arbeitnehmerverbaenden/Gewerkschaften und Arbeitgeberverbänden oder einzelnen AG abgeschlossen. Er regelt kollektive Bedingungen für ganze Branchen."
  },
  {
    id: "c02",
    topic: "kollektives_ar",
    type: "mc",
    diff: 1,
    tax: "K1",
    q: "Was regelt ein Gesamtarbeitsvertrag (GAV) typischerweise?",
    options: [
      {v: "A", t: "Nur die Pausenzeiten"},
      {v: "B", t: "Mindestlöhne, Ferien, Krankheit, Kündigungsfristen, weitere Bedingungen"},
      {v: "C", t: "Nur Arbeitgeberrechte"},
      {v: "D", t: "Nichts, GAVs sind unverbindlich"}
    ],
    correct: "B",
    explain: "Ein GAV (OR 356-358) regelt umfassend: Mindestlöhne, Urlaub, Krankheit, Kündigungsfristen, Zuschläge, Arbeitssicherheit und weitere Schutzbestimmungen. Dies schafft Branchenstandards."
  },
  {
    id: "c03",
    topic: "kollektives_ar",
    type: "fill",
    diff: 1,
    tax: "K1",
    q: "Die ________ nach OR 357a verpflichtet die Parteien eines GAV, während der Laufzeit keine ________ oder Streiks durchzuführen.",
    blanks: [
      {answer: "Friedenspflicht", alts: ["Friedensplicht"]},
      {answer: "Kampfmassnahmen", alts: ["Streiks", "Arbeitskampfmassnahmen"]}
    ],
    explain: "Nach OR 357a (Friedenspflicht) verpflichten sich die GAV-Parteien, während der Vertragslaufzeit keine Streiks, Boykotte oder Aussperrungen durchzuführen. Dies sichert Arbeitsfrieden."
  },
  {
    id: "c04",
    topic: "kollektives_ar",
    type: "mc",
    diff: 1,
    tax: "K1",
    q: "Wer kann die Allgemeinverbindlichkeit eines GAV erklären?",
    options: [
      {v: "A", t: "Der Kantonrat"},
      {v: "B", t: "Der Bundesrat"},
      {v: "C", t: "Die beteiligten Verbände einstimmig"},
      {v: "D", t: "Das Arbeitsgericht"}
    ],
    correct: "B",
    explain: "Der Bundesrat kann die Allgemeinverbindlichkeit eines GAV erklären. Dies macht die GAV-Bestimmungen auch auf nicht-organisierte Arbeitnehmer und Arbeitgeber derselben Branche bindend (OR 356 Abs. 3)."
  },
  {
    id: "c05",
    topic: "kollektives_ar",
    type: "tf",
    diff: 2,
    tax: "K2",
    q: "Ein Arbeitgeber, der nicht Mitglied eines Arbeitgeberverbands ist, ist nicht an einen GAV gebunden.",
    correct: false,
    explain: "Falsch. Ist ein GAV für allgemeinverbindlich erklärt worden, bindet es alle Arbeitgeber und Arbeitnehmer der betreffenden Branche/Region, unabhängig von Verbandsmitgliedschaft. Dies schützt Branchenstandards."
  },
  {
    id: "c06",
    topic: "kollektives_ar",
    type: "mc",
    diff: 2,
    tax: "K2",
    q: "Ein GAV sieht einen Mindestlohn von CHF 4'500.– vor, aber ein Arbeitgeber zahlt nur CHF 4'000.–. Was folgt?",
    options: [
      {v: "A", t: "Das ist zulässig, da Arbeitsrecht Formfreiheit kennt"},
      {v: "B", t: "Der Arbeitnehmer kann die Differenz einklagen"},
      {v: "C", t: "Das GAV wird ungültig"},
      {v: "D", t: "Der Arbeitnehmer hat keinen Anspruch"}
    ],
    correct: "B",
    explain: "Ein GAV ist bindend (oder allgemeinverbindlich erklärt). Unterschreitungen der GAV-Standards sind nicht zulässig. Der Arbeitnehmer kann die ausstehende Lohndifferenz klagen und ggf. Schadensersatz erhalten."
  },
  {
    id: "c07",
    topic: "kollektives_ar",
    type: "fill",
    diff: 2,
    tax: "K2",
    q: "Eine Normalarbeitsverordnung (NAV) wird von ________ erlassen und regelt Arbeitsbedingungen in Branchen, wo AN ________ gefährdet oder das Lohnniveau sehr tief ist.",
    blanks: [
      {answer: "Behörden", alts: ["der Behörde", "Kantons- oder Bundesbehörden"]},
      {answer: "besonders", alts: ["intensiv", "stark"]}
    ],
    explain: "Nach OR 359-360 wird eine NAV von Kantons- oder Bundesbehörden erlassen und gilt für Branchen mit besonderem Gefährdungspotenzial oder tiefem Lohnniveau (z.B. Gastgewerbe, Landwirtschaft). Sie hat in der Schweiz untergeordnete Rolle."
  },
  {
    id: "c08",
    topic: "kollektives_ar",
    type: "multi",
    diff: 2,
    tax: "K2",
    q: "Welche Aussagen zu kollektiven Arbeitsverträgen (GAV/NAV) sind richtig? (Mehrfachauswahl)",
    options: [
      {v: "A", t: "Sie regeln Bedingungen für ganze Branchen oder Regionen"},
      {v: "B", t: "Sie sind nur bindend für Verbandsmitglieder"},
      {v: "C", t: "Durch Allgemeinverbindlichkeit können sie für alle gelten"},
      {v: "D", t: "Sie sind absolut zwingendes Recht ohne Abweichungsmöglichkeit"}
    ],
    correct: ["A", "C"],
    explain: "A und C sind richtig. GAVs regeln kollektiv für Branchen; durch Allgemeinverbindlichkeit gelten sie auch für nicht-Mitglieder. B ist falsch (nicht nur Mitglieder), D ist falsch (Abweichungen zu Gunsten AN möglich)."
  },
  {
    id: "c09",
    topic: "kollektives_ar",
    type: "mc",
    diff: 3,
    tax: "K4",
    context: "Ein Verband von Bäckerei-Arbeitnehmern und ein Verband von Bäckerei-Arbeitgebern schliessen einen GAV. Sie vereinbaren u.a. Mindestlöhne und dass während 2 Jahren keine Streiks durchgeführt werden. Die Bäckerei-Arbeitnehmer erfahren von besseren Bedingungen bei konkurrierenden Bäckereien.",
    q: "Können die Arbeitnehmer trotz GAV streiken?",
    options: [
      {v: "A", t: "Ja, Streikrecht ist nicht aufgebbar"},
      {v: "B", t: "Nein, die Friedenspflicht (OR 357a) verbietet Streiks während GAV-Laufzeit"},
      {v: "C", t: "Nur mit Zustimmung der AG"},
      {v: "D", t: "Nur wenn die Bedingungen sich verschlechtern"}
    ],
    correct: "B",
    explain: "Nach OR 357a ist eine Friedenspflicht im GAV vereinbart: Während der Laufzeit sind Kampfmassnahmen (Streiks, Boykotte) nicht zulässig. Dies ist ein zentraler Bestandteil des Arbeitsfriedens. Die Arbeitnehmerverbände sind verpflichtet, Streiks zu unterbinden. Obersatz: Darf während GAV-Laufzeit gestreikt werden? → Voraussetzungen: Besteht eine Friedenspflicht? → Subsumtion: Ja, OR 357a verpflichtet die Parteien. → Schluss: Streiks sind verboten."
  },
  {
    id: "c10",
    topic: "kollektives_ar",
    type: "tf",
    diff: 3,
    tax: "K4",
    q: "Das Gleichstellungsgesetz (GlG) verlangt von Arbeitgebern automatisch, dass sie Männer und Frauen gleich bezahlen, auch wenn ein GAV tiefere Frauenlöhne zulässt.",
    correct: true,
    explain: "Korrekt. Nach BV 8 Abs. 3 und GlG 3 gilt das Diskriminierungsverbot für Geschlechter. Ein GAV, der Frauen systematisch geringer bezahlt, verstösst gegen GlG. Gleiche Arbeit = gleicher Lohn ist bindend."
  },
  {
    id: "c11",
    topic: "kollektives_ar",
    type: "mc",
    diff: 3,
    tax: "K5",
    q: "Ein GAV wird für allgemeinverbindlich erklärt. Danach wird eine kleine, nicht verbandseigene Bäckerei eröffnet, die GAV-Standard unterschreitet. Kann die Bäckerei berechtigt gegen das GAV argumentieren?",
    options: [
      {v: "A", t: "Ja, kleine Betriebe sind vom GAV befreit"},
      {v: "B", t: "Ja, die Allgemeinverbindlichkeit ist verfassungswidrig"},
      {v: "C", t: "Nein, die Allgemeinverbindlichkeit bindet alle Betriebe der Branche"},
      {v: "D", t: "Nur wenn die Betriebszahl gross ist"}
    ],
    correct: "C",
    explain: "Die Allgemeinverbindlichkeit eines GAV (erklär durch Bundesrat nach OR 356) bindet alle Betriebe und Arbeitnehmer der betreffenden Branche/Region, unabhängig von Verbandsmitgliedschaft oder Betriebsgrösse. Dies schützt faire Wettbewerbsbedingungen und verhindert ‹Lohndumping› durch Neu-/Kleinbetriebe. Die Bäckerei muss die GAV-Bestimmungen einhalten."
  }
];
