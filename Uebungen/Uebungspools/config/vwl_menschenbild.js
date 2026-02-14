// Übungspool: Ökonomisches Menschenbild
// Fachbereich: VWL
// Anzahl Fragen: 49

const POOL_META = {
  id: "vwl_menschenbild",
  fach: "VWL",
  title: "Übungspool: Ökonomisches Menschenbild",
  meta: "SF GYM1 · Gymnasium Hofwil · Individuell üben",
  color: "vwl"
};

const TOPICS = {
  homo:{label:"Homo Oeconomicus",short:"Homo Oec."},
  kritik:{label:"Kritik & Verhaltensökonomie",short:"Kritik"},
  opportunitaet:{label:"Opportunitätskosten & Trade-offs",short:"Opp.kosten"},
  anreize:{label:"Anreize und ihre Wirkung",short:"Anreize"},
  spieltheorie:{label:"Gefangenendilemma & Spieltheorie",short:"Spieltheorie"},
  aufgaben:{label:"Aufgaben der VWL",short:"Aufgaben VWL"},
  ziele:{label:"Ziele der Wirtschaftspolitik",short:"Ziele WiPol"}
};

const QUESTIONS = [
// ──── HOMO OECONOMICUS (h01–h08) ────
{id:"h01",topic:"homo",type:"mc",diff:1,tax:"K1",
 q:"Was versteht man unter dem «Homo oeconomicus»?",
 options:[{v:"A",t:"Ein Modell des rational handelnden Menschen, der unter Abwägung von Kosten und Nutzen seinen persönlichen Nutzen maximiert."},{v:"B",t:"Einen Menschen, der nur an Geld interessiert ist."},{v:"C",t:"Einen perfekten Konsumenten ohne Emotionen."},{v:"D",t:"Ein historisches Menschenbild aus der Antike."}],
 correct:"A",explain:"Der Homo oeconomicus ist ein vereinfachtes Modell: Er bewertet vernünftig alle Fakten und trifft Entscheidungen, die seinen persönlichen Nutzen maximieren. Es ist ein Durchschnittsmodell, keine Beschreibung einzelner Menschen."},

{id:"h02",topic:"homo",type:"tf",diff:1,tax:"K2",
 q:"Der Homo oeconomicus beschreibt, wie sich ein einzelner Mensch tatsächlich verhält.",
 correct:false,explain:"Falsch. Der Homo oeconomicus erklärt kein Individualverhalten, sondern soll ein Durchschnittsverhalten widerspiegeln. Eisenhut: «Wie alle anderen Wissenschaften ist auch die VWL auf Abstraktionen und Verallgemeinerungen angewiesen, um die Komplexität in den Griff zu bekommen.» Das Modell ist gezielt vereinfacht."},

{id:"h03",topic:"homo",type:"fill",diff:1,tax:"K1",
 q:"Der Homo oeconomicus handelt {0} – er wählt unter den verschiedenen Möglichkeiten diejenige, die seinen {1} maximiert. Dabei wägt er {2} und Nutzen sorgfältig ab.",
 blanks:[
   {answer:"rational",alts:["ökonomisch rational","vernünftig"]},
   {answer:"Nutzen",alts:["persönlichen Nutzen"]},
   {answer:"Kosten",alts:[]}
 ],
 explain:"Die drei Kernmerkmale: (1) Rationales Handeln, (2) Nutzenmaximierung, (3) Kosten-Nutzen-Abwägung. Adam Smith formulierte 1776 die Grundidee: Nicht das Wohlwollen des Metzgers und Bäckers verschafft uns das Essen, sondern deren Eigeninteresse."},

{id:"h04",topic:"homo",type:"sort",diff:2,tax:"K2",
 q:"Ordnen Sie zu: Welche Eigenschaften gehören zum Homo oeconomicus und welche nicht?",
 categories:["Eigenschaft des Homo oeconomicus","Gehört NICHT zum Modell"],
 items:[
   {t:"Handelt rational",cat:0},{t:"Handelt immer aus dem Bauch heraus",cat:1},
   {t:"Maximiert seinen Nutzen",cat:0},{t:"Ist vollkommen altruistisch",cat:1},
   {t:"Wägt Kosten und Nutzen ab",cat:0},{t:"Kennt alle Informationen perfekt",cat:1},
   {t:"Reagiert auf Anreize",cat:0},{t:"Ignoriert sein Eigeninteresse",cat:1}
 ],
 explain:"Der Homo oeconomicus: rational, nutzenmaximierend, eigennützig, auf Anreize reagierend. NICHT: allwissend (das ist eine Karikatur), rein altruistisch, rein emotional. Eigennützig ≠ egoistisch: Er kann auch soziale Ziele verfolgen, wenn es seinem Nutzen dient."},

{id:"h05",topic:"homo",type:"mc",diff:2,tax:"K2",
 q:"«Nicht vom Wohlwollen des Metzgers, Brauers und Bäckers erwarten wir das, was wir zum Essen brauchen, sondern davon, dass sie ihre eigenen Interessen wahrnehmen.» Von wem stammt dieses Zitat?",
 options:[{v:"A",t:"Adam Smith (1776)"},{v:"B",t:"Karl Marx (1867)"},{v:"C",t:"John M. Keynes (1936)"},{v:"D",t:"Milton Friedman (1962)"}],
 correct:"A",explain:"Dieses berühmte Zitat stammt aus Adam Smiths Werk «Der Wohlstand der Nationen» (1776). Es beschreibt das Eigeninteresse als Triebkraft wirtschaftlichen Handelns – der Bäcker bäckt gutes Brot nicht aus Nächstenliebe, sondern um Geld zu verdienen. Davon profitieren beide Seiten."},

{id:"h06",topic:"homo",type:"open",diff:2,tax:"K3",
 q:"Erklären Sie anhand eines Alltagsbeispiels, wie ein Homo oeconomicus bei einer Entscheidung vorgeht.",
 sample:"Beispiel Handykauf: Der Homo oeconomicus vergleicht verschiedene Modelle (Kosten, Funktionen, Bewertungen), wägt Preis gegen Nutzen ab, berücksichtigt sein Budget und wählt das Modell mit dem besten Preis-Leistungs-Verhältnis für seine Bedürfnisse. Er lässt sich nicht von Werbung oder Emotionen leiten, sondern entscheidet aufgrund objektiver Kriterien rational.",
 explain:"In der Realität entscheiden wir selten so rational: Markenpräferenzen, Gruppendruck, Impulskäufe spielen eine Rolle. Das Modell vereinfacht, aber es erfasst das Durchschnittsverhalten oft erstaunlich gut."},

{id:"h07",topic:"homo",type:"tf",diff:2,tax:"K2",
 q:"Eigennütziges Handeln bedeutet gemäss dem Modell des Homo oeconomicus, dass der Mensch immer nur an sich selbst denkt und anderen bewusst schadet.",
 correct:false,explain:"Falsch. Eigennutz ≠ Egoismus. Eisenhut: «Die Menschen sind – von Ausnahmen abgesehen – weder Heilige noch Verbrecher. Eigennütziges Handeln bedeutet, dass der Mensch sich in der Regel nach seinen eigenen Interessen orientiert.» Er kann auch Vertrauen, Solidarität und Gerechtigkeit in seinen Nutzen einbeziehen."},

{id:"h08",topic:"homo",type:"mc",diff:1,tax:"K1",
 q:"Wer hat die Idee des eigennützigen, rationalen Wirtschaftsmenschen als Erster formuliert?",
 options:[{v:"A",t:"Adam Smith in «Der Wohlstand der Nationen» (1776)."},{v:"B",t:"Gary Becker in seiner Nobelpreisrede (1992)."},{v:"C",t:"Herbert Simon mit der «begrenzten Rationalität» (1957)."},{v:"D",t:"John Stuart Mill im 19. Jahrhundert."}],
 correct:"A",explain:"Adam Smith gilt als Begründer. John Stuart Mill entwickelte die Idee im 19. Jh. weiter. Herbert Simon (1957) kritisierte die Annahme vollständiger Rationalität. Gary Becker (Nobelpreis 1992) wandte das Modell auf Bereiche wie Kriminalität und Familie an."},

// ──── KRITIK AM HOMO OECONOMICUS (r01–r08) ────
{id:"r01",topic:"kritik",type:"mc",diff:2,tax:"K2",
 q:"Was ist der Hauptkritikpunkt am Modell des Homo oeconomicus?",
 options:[{v:"A",t:"Menschen handeln oft nicht rational, sondern emotional, impulsiv, kurzsichtig oder nach sozialen Normen."},{v:"B",t:"Das Modell ist zu alt und daher veraltet."},{v:"C",t:"Menschen wollen nie ihren Nutzen maximieren."},{v:"D",t:"Das Modell berücksichtigt nur Geld als Nutzen."}],
 correct:"A",explain:"Die Verhaltensökonomie zeigt: Menschen handeln oft voreilig, unlogisch, impulsiv, emotional oder kurzsichtig. Die Finanzkrise 2008 verstärkte die Kritik – kaum ein Ökonom hatte sie vorhergesagt, was die Grenzen des rationalen Modells aufzeigte."},

{id:"r02",topic:"kritik",type:"tf",diff:2,tax:"K2",
 q:"Herbert Simon stellte 1957 fest, dass die Rationalität der Menschen begrenzt ist, weil sie nicht alle Informationen verarbeiten können.",
 correct:true,explain:"Richtig. Herbert Simon prägte den Begriff der «bounded rationality» (begrenzte Rationalität): Menschen können nicht alle relevanten Informationen sammeln und verarbeiten. Die Welt ist zu komplex. Stattdessen nutzen sie Faustregeln und Erfahrungswerte."},

{id:"r03",topic:"kritik",type:"sort",diff:2,tax:"K2",
 q:"Ordnen Sie zu: Spricht das Beispiel für oder gegen das Modell des Homo oeconomicus?",
 categories:["Spricht FÜR das Modell","Spricht GEGEN das Modell"],
 items:[
   {t:"Kunde vergleicht Preise vor dem Kauf",cat:0},{t:"Impulskauf an der Kasse",cat:1},
   {t:"Firma wählt günstigsten Lieferanten",cat:0},{t:"Sportler dopt wider besseres Wissen",cat:1},
   {t:"Student wählt Studiengang nach Jobchancen",cat:0},{t:"Jemand spendet anonym für Hilfswerk",cat:1}
 ],
 explain:"Für das Modell: Preisvergleich, Lieferantenwahl, Studiengangwahl = rationale Kosten-Nutzen-Abwägung. Gegen das Modell: Impulskäufe (irrational), Doping (kurzfristig rational, langfristig irrational), anonyme Spenden (altruistisch, kein Eigennutz)."},

{id:"r04",topic:"kritik",type:"mc",diff:2,tax:"K2",
 q:"Was versteht man unter einem «Nudge» in der Verhaltensökonomie?",
 options:[{v:"A",t:"Einen sanften Stoss – man versucht, das Verhalten von Menschen über psychologisch subtile Methoden zu steuern, ohne Verbote oder Gebote."},{v:"B",t:"Ein striktes Verbot unerwünschten Verhaltens."},{v:"C",t:"Eine finanzielle Belohnung für richtiges Verhalten."},{v:"D",t:"Eine wissenschaftliche Theorie von Adam Smith."}],
 correct:"A",explain:"Nudging = «Stupsen»: Subtile Beeinflussung ohne Zwang. Beispiele: Grüne Fussabdrücke auf dem Boden, die zum Mülleimer führen (Abfall –40%), Widerspruchslösung bei der Organspende (Opt-out statt Opt-in). Weltweit setzen Regierungen «Nudge Units» ein."},

{id:"r05",topic:"kritik",type:"open",diff:3,tax:"K5",
 q:"«Der Homo oeconomicus ist unrealistisch und daher nutzlos.» Nehmen Sie kritisch Stellung zu dieser Aussage.",
 sample:"Zu vereinfacht. Pro Modell: Es erklärt Durchschnittsverhalten gut, besonders bei Firmen (Gewinnmaximierung). Es ermöglicht Vorhersagen über Reaktionen auf Anreize (z.B. Preisänderungen). Karikaturvergleich: So wie ein Karikaturist wesentliche Merkmale übertreibt, vereinfacht das Modell gezielt. Contra: Individuelle Entscheidungen oft irrational, emotional, sozial beeinflusst. Grenzen bei Finanzblasen, Panik, Sucht. Fazit: Nützliches Werkzeug, aber kein vollständiges Abbild der Realität. Die VWL ergänzt es laufend durch Erkenntnisse der Verhaltensökonomie.",
 explain:"Eisenhut: «Es wäre zu einfach, den Homo oeconomicus als vollständig rationalen Egoisten zu begreifen.» Das Modell wird ständig erweitert. Es ist keine Aussage darüber, wie Menschen sein sollen, sondern eine Arbeitshypothese."},

{id:"r06",topic:"kritik",type:"fill",diff:2,tax:"K1",
 q:"Die {0} erweitert die Standardtheorie um psychologische Aspekte. Sie zeigt, dass Menschen nicht immer {1} handeln. Eine praktische Anwendung ist das sogenannte {2}, bei dem Verhalten subtil beeinflusst wird.",
 blanks:[
   {answer:"Verhaltensökonomie",alts:["Verhaltensökonomik","Behavioral Economics"]},
   {answer:"rational",alts:["vernünftig"]},
   {answer:"Nudging",alts:["Nudge"]}
 ],
 explain:"Die Verhaltensökonomie (Behavioral Economics) untersucht, wie und warum Menschen von rationalem Verhalten abweichen. Nudging nutzt diese Erkenntnisse, um Verhalten zu steuern, ohne Freiheiten einzuschränken."},

{id:"r07",topic:"kritik",type:"tf",diff:2,tax:"K2",
 q:"Trotz der Kritik verwenden viele Ökonomen das Modell des Homo oeconomicus weiterhin, besonders zur Erklärung des Verhaltens von Unternehmen.",
 correct:true,explain:"Richtig. Auch wenn das Modell individuelles Verhalten nicht perfekt erklärt, ist es für die Analyse von Unternehmensverhalten (Gewinnmaximierung) weiterhin sehr nützlich. Die VWL bemüht sich aber laufend, das Menschenbild zu erweitern und realitätsnaher zu gestalten."},

{id:"r08",topic:"kritik",type:"mc",diff:2,tax:"K2",
 q:"Gary Becker (Nobelpreis 1992) wandte das ökonomische Kosten-Nutzen-Prinzip auf ungewöhnliche Bereiche an. Welchen?",
 options:[{v:"A",t:"Diskriminierung, Kriminalität, Humankapital und Familienökonomie."},{v:"B",t:"Nur auf den Aktienmarkt und die Banken."},{v:"C",t:"Ausschliesslich auf internationale Handelsabkommen."},{v:"D",t:"Auf Naturwissenschaften und Physik."}],
 correct:"A",explain:"Becker zeigte, dass ökonomische Prinzipien auch ausserhalb der traditionellen Wirtschaft gelten: Ein Räuber wägt Nutzen (Beute) gegen Kosten (Gefahr, Strafe) ab. Eltern investieren in Kinder als «Humankapital». Heirat ist ein «Markt» mit Kosten-Nutzen-Überlegungen."},

// ──── OPPORTUNITÄTSKOSTEN (o01–o07) ────
{id:"o01",topic:"opportunitaet",type:"mc",diff:1,tax:"K1",
 q:"Was sind Opportunitätskosten?",
 options:[{v:"A",t:"Der entgangene Nutzen der besten nicht gewählten Alternative."},{v:"B",t:"Die Kosten, die beim Einkaufen anfallen."},{v:"C",t:"Die Gebühren für eine verpasste Gelegenheit."},{v:"D",t:"Die Kosten für eine zweite Meinung."}],
 correct:"A",explain:"Jede Entscheidung ist gleichzeitig ein Verzicht auf andere Möglichkeiten. Die Opportunitätskosten sind der Nutzen der besten nicht gewählten Alternative. Eisenhut: «Die wichtigste Erkenntnis aus dem Opportunitätskostenprinzip ist, dass nichts gratis ist.»"},

{id:"o02",topic:"opportunitaet",type:"open",diff:2,tax:"K3",
 q:"Sie werden zum Nachtessen eingeladen. Warum ist dieses Essen nicht gratis, obwohl Sie nichts bezahlen? Verwenden Sie den Begriff «Opportunitätskosten».",
 sample:"Obwohl das Essen kostenlos ist, gibt es Opportunitätskosten: Ich verwende meine Zeit für das Nachtessen und verzichte damit auf andere Aktivitäten (z.B. Lernen, Freunde treffen, Sport). Der Nutzen der besten nicht gewählten Alternative ist der Preis, den ich «bezahle». Auch ein geschenktes Essen ist nie gratis, weil mindestens Zeit aufgewendet wird.",
 explain:"Eisenhut: «Auch ein geschenktes Nachtessen ist eben nicht gratis, weil dafür mindestens Zeit aufgewendet und damit auf eine andere Aktivität verzichtet werden muss.» Opportunitätskosten sind allgegenwärtig."},

{id:"o03",topic:"opportunitaet",type:"tf",diff:1,tax:"K2",
 q:"Wenn jemand sagt «Ich habe keine Zeit», meint er eigentlich «Die Opportunitätskosten sind mir zu hoch».",
 correct:true,explain:"Richtig. Eisenhut formuliert es genau so: «Tut mir leid, die Opportunitätskosten sind mir zu hoch!» – das wäre die ehrliche ökonomische Antwort. Man hat immer 24 Stunden, aber andere Aktivitäten bringen mehr Nutzen."},

{id:"o04",topic:"opportunitaet",type:"mc",diff:2,tax:"K3",
 q:"Sie überlegen sich, am Samstagabend ins Kino zu gehen (Freude: Note 8/10). Alternativ könnten Sie lernen (Freude: 3/10), Freunde treffen (Freude: 9/10) oder ein Buch lesen (Freude: 6/10). Wie hoch sind die Opportunitätskosten des Kinobesuchs?",
 options:[{v:"A",t:"9/10 – das ist der Nutzen der besten nicht gewählten Alternative (Freunde treffen)."},{v:"B",t:"18/10 – die Summe aller nicht gewählten Alternativen."},{v:"C",t:"3/10 – die schlechteste Alternative."},{v:"D",t:"8/10 – der Nutzen des Kinobesuchs selbst."}],
 correct:"A",explain:"Opportunitätskosten = Nutzen der BESTEN nicht gewählten Alternative. Nicht die Summe aller Alternativen! Hier: Freunde treffen (9/10) > Buch (6/10) > Lernen (3/10). Also Opportunitätskosten = 9/10. Ökonomisch betrachtet lohnt sich das Kino nicht, weil 8 < 9."},

{id:"o05",topic:"opportunitaet",type:"fill",diff:1,tax:"K1",
 q:"Jede Entscheidung beinhaltet einen Verzicht. Diesen Verzicht nennt man {0}. Austauschbeziehungen zwischen verschiedenen Zielen nennt man in der Fachsprache {1}.",
 blanks:[
   {answer:"Opportunitätskosten",alts:["Opportunitätskosten","Verzichtskosten"]},
   {answer:"Trade-offs",alts:["Trade-off","Tradeoffs","Tradeoff"]}
 ],
 explain:"Jeder Entscheid hat Opportunitätskosten. Trade-offs sind Austauschbeziehungen: z.B. mehr Freizeit = weniger Einkommen, mehr Butter = weniger Kanonen, mehr Wachstum = möglicherweise weniger Umweltqualität."},

{id:"o06",topic:"opportunitaet",type:"tf",diff:2,tax:"K2",
 q:"Warum sind Opportunitätskosten von gut bezahlten Managern besonders hoch? Weil ihr Zeitwert hoch ist – jede Stunde Freizeit bedeutet hohen entgangenen Verdienst.",
 correct:true,explain:"Eisenhut: «Warum sind gut bezahlte Manager gehetzt und chronisch übermüdet? Bei ihnen sind die Opportunitätskosten einer alternativen Zeitverwendung besonders hoch.» Wer CHF 500/Stunde verdient, verzichtet bei einer Stunde Freizeit auf CHF 500."},

{id:"o07",topic:"opportunitaet",type:"open",diff:2,tax:"K3",
 q:"Nennen Sie ein konkretes Beispiel aus Ihrem Schulalltag, bei dem Trade-offs und Opportunitätskosten eine Rolle spielen.",
 sample:"Beispiel: Ich kann am Abend entweder für die Matheprüfung lernen oder für die VWL-Prüfung. Wenn ich Mathe wähle, sind die Opportunitätskosten die möglicherweise bessere VWL-Note. Es gibt einen Trade-off: mehr Zeit für Mathe = weniger Zeit für VWL. Ähnlich beim Entscheid zwischen Sporttraining und Lernen.",
 explain:"Trade-offs und Opportunitätskosten sind allgegenwärtig: Schule vs. Freizeit, ein Fach vs. ein anderes, Geld ausgeben vs. sparen. Der Homo oeconomicus wägt diese Kosten systematisch ab."},
// ──── ANREIZE UND IHRE WIRKUNG (a01–a07) ────
{id:"a01",topic:"anreize",type:"mc",diff:1,tax:"K1",
 q:"Warum sind Anreize in der Ökonomie so wichtig?",
 options:[{v:"A",t:"Weil der Homo oeconomicus auf Anreize reagiert – Verhaltensänderungen werden durch Veränderungen der Rahmenbedingungen ausgelöst."},{v:"B",t:"Weil alle Menschen genau gleich auf Anreize reagieren."},{v:"C",t:"Weil Anreize nur in der Wirtschaft eine Rolle spielen."},{v:"D",t:"Weil Anreize immer zum gewünschten Ergebnis führen."}],
 correct:"A",explain:"Anreize sind zentral: Der Homo oeconomicus stellt seinen Entscheid jederzeit zur Disposition. Veränderungen (höhere Gebühren, mehr Steuern, bessere Löhne) können eine Revision des Entscheids bewirken, wenn die Veränderung genügend gross ist."},

{id:"a02",topic:"anreize",type:"mc",diff:2,tax:"K2",
 q:"Was beschreibt der «Kobra-Effekt»?",
 options:[{v:"A",t:"Wenn ein Anreizsystem so wirkt, dass genau das Gegenteil des gewünschten Ergebnisses eintritt."},{v:"B",t:"Wenn Anreize besonders effektiv sind."},{v:"C",t:"Wenn Menschen irrational auf Anreize reagieren."},{v:"D",t:"Wenn der Staat zu viele Anreize setzt."}],
 correct:"A",explain:"Der Kobra-Effekt: In Indien setzte die Kolonialregierung eine Prämie pro Kobra-Kopf aus, um die Plage zu bekämpfen. Ergebnis: Die Inder züchteten Kobras, um die Prämie zu kassieren. Die Plage wurde schlimmer. Das zeigt: Menschen reagieren auf Anreize, aber nicht immer wie erwartet."},

{id:"a03",topic:"anreize",type:"sort",diff:2,tax:"K3",
 q:"Ordnen Sie zu: Welche Reaktion ist ein erwünschter und welche ein unerwünschter Nebeneffekt des Anreizsystems?",
 categories:["Erwünschte Wirkung","Unerwünschter Nebeneffekt"],
 items:[
   {t:"Kehrichtsackgebühren → weniger Abfall",cat:0},
   {t:"Kehrichtsackgebühren → wilde Deponien",cat:1},
   {t:"Kobra-Prämie → Inder züchten Kobras",cat:1},
   {t:"Nudge (Fussabdrücke) → weniger Abfall auf Strassen",cat:0},
   {t:"Alkoholrationierung → Schwarzbrennereien und Schmuggel",cat:1},
   {t:"Organspende-Widerspruchslösung → mehr Organspender",cat:0}
 ],
 explain:"Anreize wirken – aber oft mit unerwünschten Nebenwirkungen. Eisenhut: «Eine Politik, die den Menschen als simple Reiz-Reaktions-Maschine auffasst, ist zum Scheitern verurteilt.» Menschen suchen kreativ nach Wegen, Anreize zu ihrem Vorteil auszunutzen."},

{id:"a04",topic:"anreize",type:"tf",diff:2,tax:"K2",
 q:"Wenn Kehrichtsackgebühren eingeführt werden, reduziert sich die Abfallmenge ohne Nebenwirkungen.",
 correct:false,explain:"Falsch. Eisenhut berichtet: Die Anzahl Säcke nahm zwar ab, dafür stieg das Gewicht pro Sack, es entstanden wilde Deponien und Abfalltransporte in Nachbargemeinden. Anreize haben fast immer Nebenwirkungen, weil Menschen kreativ reagieren."},

{id:"a05",topic:"anreize",type:"open",diff:3,tax:"K4",
 q:"Im Schweizer Notensystem besteht man das Gymnasium mit einem Schnitt von 4.0. Analysieren Sie, welche Anreize dieses System für Schülerinnen und Schüler setzt. Gibt es auch unerwünschte Nebeneffekte?",
 sample:"Erwünschte Anreize: SuS lernen regelmässig, um die Bestehensnormen zu erfüllen. Leistung wird belohnt. Unerwünschte Nebeneffekte: Einige SuS lernen strategisch nur so viel, dass sie knapp bestehen (Minimumprinzip). Es gibt Anreize, einfache Fächer zu wählen statt anspruchsvoller. Manche SuS optimieren für Prüfungen statt für nachhaltiges Lernen (Bulimie-Lernen). Das System belohnt Anpassung, nicht immer Kreativität.",
 explain:"Das Notensystem ist ein Anreizsystem. Der Homo oeconomicus reagiert darauf rational – aber nicht immer im Sinne des Bildungsziels. Dies ist ein gutes Beispiel für den Unterschied zwischen individueller Rationalität und gesellschaftlicher Optimalität."},

{id:"a06",topic:"anreize",type:"fill",diff:1,tax:"K1",
 q:"Der sogenannte {0} beschreibt das Phänomen, dass eine gut gemeinte Massnahme genau das Gegenteil des gewünschten Ergebnisses bewirkt. Dieses Beispiel zeigt, dass {1} fast immer von ungewissen Nebenfolgen begleitet sind.",
 blanks:[
   {answer:"Kobra-Effekt",alts:["Kobraeffekt"]},
   {answer:"Anreize",alts:["Anreizsysteme","regulatorische Eingriffe"]}
 ],
 explain:"Benannt nach dem Kobra-Beispiel aus Indien. Weitere Beispiele: Alkoholprohibition → Schwarzmarkt. Kehrichtsackgebühren → wilde Deponien. Der Mensch ist keine «Reiz-Reaktions-Maschine»."},

{id:"a07",topic:"anreize",type:"mc",diff:2,tax:"K2",
 q:"Was unterscheidet Nudging von traditioneller Regulierung?",
 options:[{v:"A",t:"Nudging beeinflusst Verhalten über psychologisch subtile Methoden, ohne Verbote oder Gebote zu erlassen."},{v:"B",t:"Nudging ist teurer als Regulierung."},{v:"C",t:"Nudging funktioniert nur bei irrationalen Menschen."},{v:"D",t:"Es gibt keinen Unterschied."}],
 correct:"A",explain:"Traditionelle Regulierung: Verbote, Gebote, Strafen (z.B. Rauchverbot). Nudging: Sanfte Stupser, die das Verhalten lenken, ohne die Wahlfreiheit einzuschränken (z.B. Fussabdrücke zum Mülleimer, gesundes Essen in Augenhöhe in der Kantine)."},

// ──── SPIELTHEORIE / GEFANGENENDILEMMA (g01–g08) ────
{id:"g01",topic:"spieltheorie",type:"mc",diff:1,tax:"K1",
 q:"Womit beschäftigt sich die Spieltheorie?",
 options:[{v:"A",t:"Mit der Analyse menschlichen Verhaltens in strategischen Situationen – also wenn das eigene Ergebnis auch vom Verhalten anderer abhängt."},{v:"B",t:"Mit der Analyse von Computerspielen."},{v:"C",t:"Mit der Entwicklung optimaler Brettspielstrategien."},{v:"D",t:"Mit der Psychologie von Spielsüchtigen."}],
 correct:"A",explain:"Eine Situation ist «strategisch», wenn jeder bei seiner Entscheidung berücksichtigen muss, wie andere darauf reagieren. Die Spieltheorie analysiert solche Situationen systematisch. Das berühmteste Beispiel ist das Gefangenendilemma."},

{id:"g02",topic:"spieltheorie",type:"fill",diff:1,tax:"K1",
 q:"Beim Gefangenendilemma hat jeder Beteiligte einen individuellen Anreiz, nicht zu {0}. Dies führt zu einem schlechteren Ergebnis für alle, obwohl {1} für die Gruppe besser wäre. Die Strategie, die individuell immer besser abschneidet, nennt man {2} Strategie.",
 blanks:[
   {answer:"kooperieren",alts:["Kooperation"]},
   {answer:"Kooperation",alts:["kooperieren","Zusammenarbeit"]},
   {answer:"dominante",alts:["dominant"]}
 ],
 explain:"Das Dilemma: Kooperation wäre für alle besser, aber jeder einzelne hat den Anreiz, nicht zu kooperieren (dominante Strategie). Ergebnis: Alle stehen schlechter da, als wenn alle kooperiert hätten."},

{id:"g03",topic:"spieltheorie",type:"mc",diff:2,tax:"K3",
 q:"Bonnie und Clyde werden getrennt verhört. Beide schweigen → je 1 Jahr Haft. Beide verraten → je 10 Jahre. Einer verrät, einer schweigt → Verräter frei, Schweiger lebenslänglich. Was ist die dominante Strategie?",
 options:[{v:"A",t:"Verraten – unabhängig davon, was der andere tut, ist man durch Verraten immer besser gestellt."},{v:"B",t:"Schweigen – man riskiert weniger."},{v:"C",t:"Es gibt keine dominante Strategie."},{v:"D",t:"Abwechselnd verraten und schweigen."}],
 correct:"A",explain:"Wenn der andere schweigt: Verraten → frei (besser als 1 Jahr). Wenn der andere verrät: Verraten → 10 Jahre (besser als lebenslänglich). Verraten ist IMMER besser, egal was der andere tut = dominante Strategie. Aber: Wenn beide verraten, bekommen beide 10 Jahre statt nur 1 Jahr bei Kooperation."},

{id:"g04",topic:"spieltheorie",type:"sort",diff:2,tax:"K3",
 q:"Ordnen Sie zu: Welche Alltagssituationen sind Beispiele für ein Gefangenendilemma?",
 categories:["Gefangenendilemma-Situation","KEIN Gefangenendilemma"],
 items:[
   {t:"Doping im Radsport – alle dopen, niemand gewinnt einen Vorteil",cat:0},
   {t:"Zwei Firmen machen übermässig Werbung, obwohl Verzicht günstiger wäre",cat:0},
   {t:"Überfischung der Meere – jeder fischt zu viel",cat:0},
   {t:"Einkauf im Supermarkt",cat:1},
   {t:"Wettbewerb bei einem Sprintrennen",cat:1},
   {t:"Wettrüsten zwischen Staaten",cat:0}
 ],
 explain:"Gefangenendilemma-Situationen: Kooperation wäre besser, aber individuelle Anreize verhindern sie. Doping, exzessive Werbung, Überfischung, Wettrüsten – alle haben dieselbe Struktur. Einkauf/Sprint: Keine gegenseitige Abhängigkeit der Strategie."},

{id:"g05",topic:"spieltheorie",type:"open",diff:3,tax:"K4",
 q:"Erklären Sie am Beispiel Doping im Radsport, warum die Situation ein Gefangenendilemma darstellt. Warum ist Doping gleichzeitig «absurd und rational»?",
 sample:"Absurd: Wenn niemand dopen würde, wäre niemand benachteiligt – die Rennen wären genauso spannend. Rational: Wenn ich annehme, dass andere dopen, MUSS ich auch dopen, um konkurrenzfähig zu bleiben. Wenn andere NICHT dopen, lohnt sich Doping erst recht, um zu gewinnen. Nicht-Dopen ist nie die beste individuelle Strategie → Doping ist dominant. Ergebnis: Alle dopen, keiner hat einen Vorteil, aber alle riskieren ihre Gesundheit. Das Dilemma: Individuelle Rationalität führt zu kollektiver Irrationalität.",
 explain:"Eisenhut: «Jeder Rennfahrer gewinnt lieber mit Doping, als ohne Doping zu verlieren. Denken alle so rational, dopen eben auch alle, und dies zum Schaden aller.»"},

{id:"g06",topic:"spieltheorie",type:"mc",diff:2,tax:"K2",
 q:"Welche drei Wege können helfen, das Gefangenendilemma zu überwinden?",
 options:[{v:"A",t:"Kommunikation (Absprachen), Sanktionen (Strafen bei Abweichung) und wiederholte Interaktion (langfristige Beziehungen)."},{v:"B",t:"Mehr Geld, weniger Regeln und schnellere Entscheidungen."},{v:"C",t:"Nur strenge Gesetze können das Problem lösen."},{v:"D",t:"Das Dilemma kann grundsätzlich nicht überwunden werden."}],
 correct:"A",explain:"Drei Lösungsansätze: (1) Kommunikation – Absprachen ermöglichen. (2) Sanktionen – Vertragsbruch bestrafen (z.B. Omertà bei der Mafia). (3) Wiederholung – bei langfristigen Beziehungen ist Kooperation attraktiver, weil Vergeltung droht. Im Veritasium-Video werden 4 Eigenschaften erfolgreicher Strategien genannt: nett, vergeltend, verzeihend, klar."},

{id:"g07",topic:"spieltheorie",type:"tf",diff:2,tax:"K2",
 q:"Im Gefangenendilemma kommt es zu einem schlechten Ergebnis, weil sich die Beteiligten irrational verhalten.",
 correct:false,explain:"Falsch. Das Dilemma entsteht gerade WEIL die Beteiligten rational (eigennützig) handeln. Nicht-Kooperation ist die individuell rationale (dominante) Strategie. Das Problem: Individuelle Rationalität führt zu kollektiver Irrationalität. Das Dilemma entsteht durch die Struktur der Situation, nicht durch Irrationalität."},

{id:"g08",topic:"spieltheorie",type:"tf",diff:2,tax:"K2",
 q:"Im Gefangenendilemma hängt das Ergebnis nicht nur vom eigenen, sondern auch vom Verhalten der anderen Beteiligten ab.",
 correct:true,explain:"Richtig. Das macht die Situation «strategisch»: Mein Ergebnis hängt von meiner UND der Entscheidung des anderen ab. Genau diese gegenseitige Abhängigkeit macht das Gefangenendilemma so faszinierend und relevant für viele Lebensbereiche."},

// ──── AUFGABEN DER VWL (v01–v05) ────
{id:"v01",topic:"aufgaben",type:"mc",diff:1,tax:"K1",
 q:"Was sind die Aufgaben der Volkswirtschaftslehre?",
 options:[{v:"A",t:"Wirtschaftliche Vorgänge beschreiben und erklären, Entwicklungen prognostizieren, wirtschaftspolitische Beeinflussung aufzeigen."},{v:"B",t:"Gesetze erlassen und Steuern festlegen."},{v:"C",t:"Unternehmen beraten und Gewinne maximieren."},{v:"D",t:"Nur Statistiken erstellen."}],
 correct:"A",explain:"Die VWL hat vier Aufgaben: (1) Beschreiben (Was passiert?), (2) Erklären (Warum passiert es?), (3) Prognostizieren (Was wird passieren?), (4) Beeinflussen (Was soll getan werden?). Beispiel: (1) Die Arbeitslosigkeit steigt. (2) Weil die Nachfrage sinkt. (3) Sie wird weiter steigen. (4) Der Staat sollte Beschäftigungsprogramme lancieren."},

{id:"v02",topic:"aufgaben",type:"sort",diff:2,tax:"K2",
 q:"Ordnen Sie die Beispiele der korrekten Aufgabe der VWL zu.",
 categories:["Beschreiben","Erklären","Prognostizieren","Beeinflussen"],
 items:[
   {t:"Die Arbeitslosenquote beträgt 3.2%",cat:0},{t:"Die Arbeitslosigkeit steigt wegen sinkender Nachfrage",cat:1},
   {t:"Die Inflation wird voraussichtlich 2% betragen",cat:2},{t:"Der Staat sollte die Zinsen senken",cat:3},
   {t:"Das BIP ist im letzten Quartal um 0.5% gewachsen",cat:0},{t:"Subventionen für erneuerbare Energien einführen",cat:3}
 ],
 explain:"Beschreiben = Fakten darstellen (Quoten, Zahlen). Erklären = Ursachen analysieren (warum?). Prognostizieren = Zukunft vorhersagen. Beeinflussen = wirtschaftspolitische Massnahmen empfehlen."},

{id:"v03",topic:"aufgaben",type:"fill",diff:1,tax:"K1",
 q:"Die VWL hat vier Aufgaben: wirtschaftliche Vorgänge zu {0}, zu {1}, Entwicklungen zu {2} und die Wirtschaft zielgerichtet zu {3}.",
 blanks:[
   {answer:"beschreiben",alts:[]},
   {answer:"erklären",alts:["erklaeren"]},
   {answer:"prognostizieren",alts:["vorhersagen","voraussagen"]},
   {answer:"beeinflussen",alts:["steuern"]}
 ],
 explain:"Eisenhut: «Die VWL hat die Aufgabe, wirtschaftliche Vorgänge zu beschreiben, zu erklären, zu prognostizieren und zielgerichtet zu beeinflussen.» Dabei sollen nicht nur kurzfristige, sondern auch langfristige Auswirkungen berücksichtigt werden."},

{id:"v04",topic:"aufgaben",type:"tf",diff:2,tax:"K2",
 q:"Prognosen in der VWL sind einfach, weil die Zusammenhänge klar sind.",
 correct:false,explain:"Falsch. Prognosen sind schwierig, weil: (1) Die Ursachen selbst wieder erklärungsbedürftig sind (Kausalitätsketten). (2) Viele Einflussfaktoren geschätzt werden müssen (Nachfrage, Löhne, technischer Fortschritt). (3) Menschen unvorhersehbar auf Anreize reagieren. Deshalb sind ökonomische Prognosen oft ungenau."},

{id:"v05",topic:"aufgaben",type:"open",diff:2,tax:"K3",
 q:"Wählen Sie eine aktuelle Wirtschaftsmeldung (z.B. steigende Mieten) und zeigen Sie, wie die VWL ihre vier Aufgaben darauf anwendet.",
 sample:"Meldung: «Die Mieten in Schweizer Städten steigen.» (1) Beschreiben: Die Mieten sind im letzten Jahr um 3% gestiegen. (2) Erklären: Zuwanderung erhöht Nachfrage, wenig Neubau begrenzt Angebot. (3) Prognostizieren: Mieten werden weiter steigen, wenn nicht mehr gebaut wird. (4) Beeinflussen: Lockerung der Bauvorschriften, Förderung des gemeinnützigen Wohnungsbaus, Mietpreisregulierung.",
 explain:"Dieses Vorgehen zeigt, wie die VWL systematisch an Probleme herangeht: Von der Beobachtung über die Ursachenanalyse zur Prognose und schliesslich zu Handlungsempfehlungen."},

// ──── ZIELE DER WIRTSCHAFTSPOLITIK (z01–z06) ────
{id:"z01",topic:"ziele",type:"mc",diff:1,tax:"K1",
 q:"Welche sechs Ziele umfasst das «magische Sechseck» der Wirtschaftspolitik?",
 options:[{v:"A",t:"Vollbeschäftigung, Preisstabilität, Wirtschaftswachstum, aussenwirtschaftliches Gleichgewicht, sozialer Ausgleich, Umweltqualität."},{v:"B",t:"Hohe Exporte, tiefe Steuern, hohe Gewinne, viel Konsum, wenig Staat, tiefe Inflation."},{v:"C",t:"BIP, Gini-Koeffizient, Lorenzkurve, Handelsbilanz, Zinssatz, Wechselkurs."},{v:"D",t:"Freiheit, Gleichheit, Brüderlichkeit, Demokratie, Wohlstand, Sicherheit."}],
 correct:"A",explain:"Das magische Sechseck: (1) Vollbeschäftigung, (2) Preisstabilität, (3) Wirtschaftswachstum, (4) Aussenwirtschaftliches Gleichgewicht, (5) Sozialer Ausgleich (Verteilung), (6) Umweltqualität. Ursprünglich nur ein Dreieck (1-3), im Laufe der Zeit erweitert."},

{id:"z02",topic:"ziele",type:"tf",diff:1,tax:"K2",
 q:"Das Sechseck heisst «magisch», weil es schwierig ist, alle sechs Ziele gleichzeitig zu erreichen.",
 correct:true,explain:"Richtig. Die Ziele stehen teilweise in Konkurrenz zueinander (Zielkonflikte). Beispiel: Wirtschaftswachstum kann die Umweltqualität beeinträchtigen. Preisstabilität und Vollbeschäftigung können kurzfristig in Konkurrenz stehen."},

{id:"z03",topic:"ziele",type:"sort",diff:2,tax:"K2",
 q:"Ordnen Sie die Beispiele der korrekten Zielbeziehung zu.",
 categories:["Zielharmonie","Zielkonkurrenz"],
 items:[
   {t:"Wirtschaftswachstum fördert Vollbeschäftigung",cat:0},
   {t:"Mehr Wachstum kann Umwelt belasten",cat:1},
   {t:"Preisstabilität und Vollbeschäftigung können sich kurzfristig widersprechen",cat:1},
   {t:"Bildungsinvestitionen fördern Wachstum und sozialen Ausgleich gleichzeitig",cat:0}
 ],
 explain:"Zielharmonie: Das Erreichen eines Ziels fördert ein anderes. Zielkonkurrenz: Ein Ziel zu verfolgen behindert ein anderes. Zielneutralität (selten): Ziele beeinflussen sich nicht gegenseitig. Beispiel für den klassischen Trade-off: «Butter und Kanonen»."},

{id:"z04",topic:"ziele",type:"fill",diff:2,tax:"K1",
 q:"Wenn das Anstreben eines Ziels ein anderes fördert, spricht man von {0}. Wenn ein Ziel ein anderes behindert, spricht man von {1}. In der Fachsprache heissen solche Austauschbeziehungen {2}.",
 blanks:[
   {answer:"Zielharmonie",alts:["Ziel-Harmonie"]},
   {answer:"Zielkonkurrenz",alts:["Ziel-Konkurrenz","Zielkonflikt"]},
   {answer:"Trade-offs",alts:["Trade-off","Tradeoffs"]}
 ],
 explain:"Drei Zielbeziehungen: Zielharmonie, Zielneutralität, Zielkonkurrenz. Trade-offs = Austauschbeziehungen, z.B. «ein bisschen weniger Arbeitslose gegen ein bisschen weniger Preisstabilität» (Eisenhut)."},

{id:"z05",topic:"ziele",type:"mc",diff:2,tax:"K2",
 q:"Warum ist der klassische Trade-off «Butter und Kanonen» ein gutes Beispiel für wirtschaftspolitische Zielkonflikte?",
 options:[{v:"A",t:"Weil mehr Ausgaben für die Armee (Kanonen) weniger Mittel für zivile Güter (Butter) bedeuten – die Ressourcen sind knapp."},{v:"B",t:"Weil Butter und Kanonen aus denselben Rohstoffen hergestellt werden."},{v:"C",t:"Weil die Armee kein Geld benötigt."},{v:"D",t:"Weil es in der Wirtschaft immer nur um Waffen geht."}],
 correct:"A",explain:"Das «Butter-und-Kanonen»-Beispiel illustriert den grundlegenden Trade-off: Knappe Ressourcen (Geld, Arbeit, Material) können entweder für Rüstung oder für zivile Güter eingesetzt werden – nicht für beides gleichzeitig. Dies zeigt die Opportunitätskosten jeder Entscheidung auf gesamtwirtschaftlicher Ebene."},

{id:"z06",topic:"ziele",type:"open",diff:3,tax:"K5",
 q:"Stehen die Ziele «Wirtschaftswachstum» und «Umweltqualität» in Harmonie oder in Konkurrenz? Begründen Sie Ihre Einschätzung.",
 sample:"Beides ist möglich. Zielkonkurrenz: Mehr Produktion bedeutet oft mehr Ressourcenverbrauch und Emissionen (quantitatives Wachstum). Zielharmonie: Qualitatives Wachstum (effizientere Technologien, erneuerbare Energien, Kreislaufwirtschaft) kann Wachstum und Umweltschutz verbinden. Zudem braucht es wirtschaftliche Mittel, um in Umwelttechnologien zu investieren. Fazit: Die Zielbeziehung ist nicht eindeutig – sie hängt von der Art des Wachstums ab.",
 explain:"Eisenhut fragt: «Brauchen wir Wachstum, um unsere Umwelt zu retten?» Die Antwort ist nicht eindeutig. Entscheidend ist die Unterscheidung zwischen quantitativem und qualitativem Wachstum."}
];
