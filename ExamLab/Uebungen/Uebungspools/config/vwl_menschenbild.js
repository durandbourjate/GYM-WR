// Übungspool: Ökonomisches Menschenbild
// Fachbereich: VWL
// Anzahl Fragen: 69

window.POOL_META = {
  id: "vwl_menschenbild",
  fach: "VWL",
  title: "Übungspool: Ökonomisches Menschenbild",
  meta: "SF GYM1 · Gymnasium Hofwil · Individuell üben",
  color: "vwl",
  lernziele: [
    "Ich kann das Modell des Homo Oeconomicus erklären und kritisch hinterfragen. (K5)",
    "Ich kann Opportunitätskosten berechnen und bei Entscheidungssituationen anwenden. (K3)",
    "Ich kann grundlegende Konzepte der Spieltheorie (z.B. Gefangenendilemma) auf ökonomische Situationen anwenden. (K3)",
    "Ich kann die Ziele der schweizerischen Wirtschaftspolitik (magisches Sechseck) nennen und Zielkonflikte erkennen. (K4)"
  ]
};

window.TOPICS = {
  homo:{label:"Homo Oeconomicus",short:"Homo Oec.",lernziele:["Ich kann die Annahmen des Homo Oeconomicus-Modells aufzählen (Rationalität, Eigennutz, vollständige Information). (K1)","Ich kann erklären, warum der Homo Oeconomicus ein vereinfachtes Modell und kein Abbild der Realität ist. (K2)"]},
  kritik:{label:"Kritik & Verhaltensökonomie",short:"Kritik",lernziele:["Ich kann Erkenntnisse der Verhaltensökonomie (Nudging, Verlustaversion, Heuristiken) nennen, die das Homo-Oeconomicus-Modell in Frage stellen. (K2)","Ich kann beurteilen, wann das Modell des Homo Oeconomicus nützlich ist und wo seine Grenzen liegen. (K5)"]},
  opportunitaet:{label:"Opportunitätskosten & Trade-offs",short:"Opp.kosten",lernziele:["Ich kann den Begriff Opportunitätskosten definieren. (K1)","Ich kann in konkreten Entscheidungssituationen die Opportunitätskosten identifizieren und berechnen. (K3)"]},
  anreize:{label:"Anreize und ihre Wirkung",short:"Anreize",lernziele:["Ich kann erklären, wie Anreize (positive und negative) das Verhalten von Menschen beeinflussen. (K2)","Ich kann unbeabsichtigte Nebenwirkungen von Anreizsystemen an Beispielen aufzeigen. (K4)"]},
  spieltheorie:{label:"Gefangenendilemma & Spieltheorie",short:"Spieltheorie",lernziele:["Ich kann das Gefangenendilemma erklären und die Auszahlungsmatrix interpretieren. (K2)","Ich kann das Konzept des Nash-Gleichgewichts in einfachen Spielen anwenden. (K3)","Ich kann ökonomische Alltagssituationen (z.B. Preiskampf, Wettrüsten) als spieltheoretische Probleme erkennen. (K4)"]},
  aufgaben:{label:"Aufgaben der VWL",short:"Aufgaben VWL",lernziele:["Ich kann die Aufgaben der Volkswirtschaftslehre (Beschreiben, Erklären, Vorhersagen, Gestalten) nennen. (K1)","Ich kann zwischen positiver und normativer Ökonomie unterscheiden. (K2)"]},
  ziele:{label:"Ziele der Wirtschaftspolitik",short:"Ziele WiPol",lernziele:["Ich kann die Ziele der schweizerischen Wirtschaftspolitik (magisches Sechseck) aufzählen. (K1)","Ich kann Zielkonflikte und Zielharmonien zwischen wirtschaftspolitischen Zielen erkennen und an Beispielen erläutern. (K4)"]}
};

window.QUESTIONS = [
// ──── HOMO OECONOMICUS (h01–h10) ────
{id:"h01",topic:"homo",type:"mc",diff:1,tax:"K1",reviewed:false,
 q:"Was versteht man unter dem «Homo oeconomicus»?",
 options:[{v: "A",t:"Ein Modell des rational handelnden Menschen, der unter Abwägung von Kosten und Nutzen seinen persönlichen Nutzen maximiert."},{v: "B",t:"Einen perfekten Konsumenten ohne Emotionen."},{v: "C",t:"Ein historisches Menschenbild aus der Antike."},{v: "D",t:"Einen Menschen, der nur an Geld interessiert ist."}],
 correct:"A",explain:"Der Homo oeconomicus ist ein vereinfachtes Modell: Er bewertet vernünftig alle Fakten und trifft Entscheidungen, die seinen persönlichen Nutzen maximieren. Es ist ein Durchschnittsmodell, keine Beschreibung einzelner Menschen."},

{id:"h02",topic:"homo",type:"tf",diff:1,tax:"K2",reviewed:false,
 q:"Der Homo oeconomicus beschreibt, wie sich ein einzelner Mensch tatsächlich verhält.",
 correct:false,explain:"Falsch. Der Homo oeconomicus erklärt kein Individualverhalten, sondern soll ein Durchschnittsverhalten widerspiegeln. Eisenhut: «Wie alle anderen Wissenschaften ist auch die VWL auf Abstraktionen und Verallgemeinerungen angewiesen, um die Komplexität in den Griff zu bekommen.» Das Modell ist gezielt vereinfacht."},

{id:"h03",topic:"homo",type:"fill",diff:1,tax:"K1",reviewed:false,
 q:"Der Homo oeconomicus handelt {0} – er wählt unter den verschiedenen Möglichkeiten diejenige, die seinen {1} maximiert. Dabei wägt er {2} und Nutzen sorgfältig ab.",
 blanks:[
   {answer:"rational",alts:["ökonomisch rational","vernünftig"]},
   {answer:"Nutzen",alts:["persönlichen Nutzen"]},
   {answer:"Kosten",alts:[]}
 ],
 explain:"Die drei Kernmerkmale: (1) Rationales Handeln, (2) Nutzenmaximierung, (3) Kosten-Nutzen-Abwägung. Adam Smith formulierte 1776 die Grundidee: Nicht das Wohlwollen des Metzgers und Bäckers verschafft uns das Essen, sondern deren Eigeninteresse."},

{id:"h04",topic:"homo",type:"sort",diff:2,tax:"K2",reviewed:false,
 q:"Ordnen Sie zu: Welche Eigenschaften gehören zum Homo oeconomicus und welche nicht?",
 categories:["Eigenschaft des Homo oeconomicus","Gehört NICHT zum Modell"],
 items:[
   {t:"Handelt rational",cat:0},{t:"Handelt immer aus dem Bauch heraus",cat:1},
   {t:"Maximiert seinen Nutzen",cat:0},{t:"Ist vollkommen altruistisch",cat:1},
   {t:"Wägt Kosten und Nutzen ab",cat:0},{t:"Kennt alle Informationen perfekt",cat:1},
   {t:"Reagiert auf Anreize",cat:0},{t:"Ignoriert sein Eigeninteresse",cat:1}
 ],
 explain:"Der Homo oeconomicus: rational, nutzenmaximierend, eigennützig, auf Anreize reagierend. NICHT: allwissend (das ist eine Karikatur), rein altruistisch, rein emotional. Eigennützig ≠ egoistisch: Er kann auch soziale Ziele verfolgen, wenn es seinem Nutzen dient."},

{id:"h05",topic:"homo",type:"mc",diff:2,tax:"K2",reviewed:false,
 q:"«Nicht vom Wohlwollen des Metzgers, Brauers und Bäckers erwarten wir das, was wir zum Essen brauchen, sondern davon, dass sie ihre eigenen Interessen wahrnehmen.» Von wem stammt dieses Zitat?",
 options:[{v:"A",t:"Adam Smith (1776)"},{v:"B",t:"Karl Marx (1867)"},{v:"C",t:"John M. Keynes (1936)"},{v:"D",t:"Milton Friedman (1962)"}],
 correct:"A",explain:"Dieses berühmte Zitat stammt aus Adam Smiths Werk «Der Wohlstand der Nationen» (1776). Es beschreibt das Eigeninteresse als Triebkraft wirtschaftlichen Handelns – der Bäcker bäckt gutes Brot nicht aus Nächstenliebe, sondern um Geld zu verdienen. Davon profitieren beide Seiten."},

{id:"h06",topic:"homo",type:"open",diff:2,tax:"K3",reviewed:false,
 q:"Erklären Sie anhand eines Alltagsbeispiels, wie ein Homo oeconomicus bei einer Entscheidung vorgeht.",
 sample:"Beispiel Handykauf: Der Homo oeconomicus vergleicht verschiedene Modelle (Kosten, Funktionen, Bewertungen), wägt Preis gegen Nutzen ab, berücksichtigt sein Budget und wählt das Modell mit dem besten Preis-Leistungs-Verhältnis für seine Bedürfnisse. Er lässt sich nicht von Werbung oder Emotionen leiten, sondern entscheidet aufgrund objektiver Kriterien rational.",
 explain:"In der Realität entscheiden wir selten so rational: Markenpräferenzen, Gruppendruck, Impulskäufe spielen eine Rolle. Das Modell vereinfacht, aber es erfasst das Durchschnittsverhalten oft erstaunlich gut."},

{id:"h07",topic:"homo",type:"tf",diff:2,tax:"K2",reviewed:false,
 q:"Eigennütziges Handeln bedeutet gemäss dem Modell des Homo oeconomicus, dass der Mensch immer nur an sich selbst denkt und anderen bewusst schadet.",
 correct:false,explain:"Falsch. Eigennutz ≠ Egoismus. Eisenhut: «Die Menschen sind – von Ausnahmen abgesehen – weder Heilige noch Verbrecher. Eigennütziges Handeln bedeutet, dass der Mensch sich in der Regel nach seinen eigenen Interessen orientiert.» Er kann auch Vertrauen, Solidarität und Gerechtigkeit in seinen Nutzen einbeziehen."},

{id:"h08",topic:"homo",type:"mc",diff:1,tax:"K1",reviewed:false,
 q:"Wer hat die Idee des eigennützigen, rationalen Wirtschaftsmenschen als Erster formuliert?",
 options:[{v: "A",t:"John Stuart Mill im 19. Jahrhundert."},{v: "B",t:"Adam Smith in «Der Wohlstand der Nationen» (1776)."},{v: "C",t:"Gary Becker in seiner Nobelpreisrede (1992)."},{v: "D",t:"Herbert Simon mit der «begrenzten Rationalität» (1957)."}],
 correct:"B",explain:"Adam Smith gilt als Begründer. John Stuart Mill entwickelte die Idee im 19. Jh. weiter. Herbert Simon (1957) kritisierte die Annahme vollständiger Rationalität. Gary Becker (Nobelpreis 1992) wandte das Modell auf Bereiche wie Kriminalität und Familie an."},

{id:"h09",topic:"homo",type:"multi",diff:2,tax:"K2",reviewed:false,
 q:"Welche der folgenden Aussagen beschreiben den Homo oeconomicus korrekt? (Mehrere Antworten möglich.)",
 options:[{v:"A",t:"Er reagiert auf veränderte Rahmenbedingungen und Anreize."},{v:"B",t:"Er verfügt über vollständige Information über alle Alternativen."},{v:"C",t:"Er stellt seinen Entscheid bei veränderten Bedingungen jederzeit zur Disposition."},{v:"D",t:"Er wägt Kosten und Nutzen ab und maximiert seinen persönlichen Nutzen."}],
 correct:["A","C","D"],explain:"A, C und D sind korrekt: Der Homo oeconomicus reagiert auf Anreize (A), überdenkt Entscheide bei Veränderungen (C) und maximiert seinen Nutzen (D). B ist falsch – vollständige Information ist eine Karikatur des Modells. Bereits Herbert Simon zeigte 1957, dass Rationalität immer begrenzt ist."},

{id:"h10",topic:"homo",type:"open",diff:3,tax:"K5",reviewed:false,
 q:"Eisenhut vergleicht das Modell des Homo oeconomicus mit einer Karikatur: «Ein Karikaturist zeichnet nur die wesentlichen Merkmale, übertreibt diese aber bewusst.» Beurteilen Sie, inwiefern dieser Vergleich treffend ist und wo er an seine Grenzen stösst.",
 sample:"Treffend: Wie eine Karikatur erfasst das Modell die Kernmerkmale menschlichen Wirtschaftsverhaltens (Eigeninteresse, Reaktion auf Anreize) in überspitzter Form. Es will nicht realistisch sein, sondern erkennbar. Grenzen: Eine Karikatur zeigt immer noch eine bestimmte Person, der Homo oeconomicus ist ein Durchschnitt. Zudem kann die Vereinfachung systematische Verzerrungen erzeugen, die in der Karikatur nicht auftreten – etwa wenn ganze Politikbereiche auf Basis falscher Verhaltensannahmen gestaltet werden (z.B. Annahme vollständiger Rationalität bei Finanzmärkten vor 2008).",
 explain:"Der Karikaturvergleich betont: Vereinfachung ist kein Fehler, sondern eine bewusste Methode. Problematisch wird es, wenn das Modell nicht als Vereinfachung, sondern als Realität behandelt wird – dann werden seine blinden Flecken gefährlich."},

// ──── KRITIK AM HOMO OECONOMICUS (r01–r10) ────
{id:"r01",topic:"kritik",type:"mc",diff:2,tax:"K2",reviewed:false,
 q:"Was ist der Hauptkritikpunkt am Modell des Homo oeconomicus?",
 options:[{v: "A",t:"Menschen handeln oft nicht rational, sondern emotional, impulsiv, kurzsichtig oder nach sozialen Normen."},{v: "B",t:"Das Modell ist zu alt und daher veraltet."},{v: "C",t:"Das Modell berücksichtigt nur Geld als Nutzen."},{v: "D",t:"Menschen wollen nie ihren Nutzen maximieren."}],
 correct:"A",explain:"Die Verhaltensökonomie zeigt: Menschen handeln oft voreilig, unlogisch, impulsiv, emotional oder kurzsichtig. Die Finanzkrise 2008 verstärkte die Kritik – kaum ein Ökonom hatte sie vorhergesagt, was die Grenzen des rationalen Modells aufzeigte."},

{id:"r02",topic:"kritik",type:"tf",diff:2,tax:"K2",reviewed:false,
 q:"Herbert Simon stellte 1957 fest, dass die Rationalität der Menschen begrenzt ist, weil sie nicht alle Informationen verarbeiten können.",
 correct:true,explain:"Richtig. Herbert Simon prägte den Begriff der «bounded rationality» (begrenzte Rationalität): Menschen können nicht alle relevanten Informationen sammeln und verarbeiten. Die Welt ist zu komplex. Stattdessen nutzen sie Faustregeln und Erfahrungswerte."},

{id:"r03",topic:"kritik",type:"sort",diff:2,tax:"K2",reviewed:false,
 q:"Ordnen Sie zu: Spricht das Beispiel für oder gegen das Modell des Homo oeconomicus?",
 categories:["Spricht FÜR das Modell","Spricht GEGEN das Modell"],
 items:[
   {t:"Kunde vergleicht Preise vor dem Kauf",cat:0},{t:"Impulskauf an der Kasse",cat:1},
   {t:"Firma wählt günstigsten Lieferanten",cat:0},{t:"Sportler dopt wider besseres Wissen",cat:1},
   {t:"Student wählt Studiengang nach Jobchancen",cat:0},{t:"Jemand spendet anonym für Hilfswerk",cat:1}
 ],
 explain:"Für das Modell: Preisvergleich, Lieferantenwahl, Studiengangwahl = rationale Kosten-Nutzen-Abwägung. Gegen das Modell: Impulskäufe (irrational), Doping (kurzfristig rational, langfristig irrational), anonyme Spenden (altruistisch, kein Eigennutz)."},

{id:"r04",topic:"kritik",type:"mc",diff:2,tax:"K2",reviewed:false,
 q:"Was versteht man unter einem «Nudge» in der Verhaltensökonomie?",
 img:{src:"img/vwl/menschenbild/menschenbild_nudging_01.svg",alt:"Vergleich zweier Ansätze zur Verhaltenssteuerung"},
 options:[{v: "A",t:"Eine finanzielle Belohnung für richtiges Verhalten."},{v: "B",t:"Einen sanften Stoss – man versucht, das Verhalten von Menschen über psychologisch subtile Methoden zu steuern, ohne Verbote oder Gebote."},{v: "C",t:"Ein striktes Verbot unerwünschten Verhaltens."},{v: "D",t:"Eine wissenschaftliche Theorie von Adam Smith."}],
 correct:"B",explain:"Nudging = «Stupsen»: Subtile Beeinflussung ohne Zwang. Beispiele: Grüne Fussabdrücke auf dem Boden, die zum Mülleimer führen (Abfall –40%), Widerspruchslösung bei der Organspende (Opt-out statt Opt-in). Weltweit setzen Regierungen «Nudge Units» ein."},

{id:"r05",topic:"kritik",type:"open",diff:3,tax:"K5",reviewed:false,
 q:"«Der Homo oeconomicus ist unrealistisch und daher nutzlos.» Nehmen Sie kritisch Stellung zu dieser Aussage.",
 sample:"Zu vereinfacht. Pro Modell: Es erklärt Durchschnittsverhalten gut, besonders bei Firmen (Gewinnmaximierung). Es ermöglicht Vorhersagen über Reaktionen auf Anreize (z.B. Preisänderungen). Karikaturvergleich: So wie ein Karikaturist wesentliche Merkmale übertreibt, vereinfacht das Modell gezielt. Contra: Individuelle Entscheidungen oft irrational, emotional, sozial beeinflusst. Grenzen bei Finanzblasen, Panik, Sucht. Fazit: Nützliches Werkzeug, aber kein vollständiges Abbild der Realität. Die VWL ergänzt es laufend durch Erkenntnisse der Verhaltensökonomie.",
 explain:"Eisenhut: «Es wäre zu einfach, den Homo oeconomicus als vollständig rationalen Egoisten zu begreifen.» Das Modell wird ständig erweitert. Es ist keine Aussage darüber, wie Menschen sein sollen, sondern eine Arbeitshypothese."},

{id:"r06",topic:"kritik",type:"fill",diff:2,tax:"K1",reviewed:false,
 q:"Die {0} erweitert die Standardtheorie um psychologische Aspekte. Sie zeigt, dass Menschen nicht immer {1} handeln. Eine praktische Anwendung ist das sogenannte {2}, bei dem Verhalten subtil beeinflusst wird.",
 blanks:[
   {answer:"Verhaltensökonomie",alts:["Verhaltensökonomik","Behavioral Economics"]},
   {answer:"rational",alts:["vernünftig"]},
   {answer:"Nudging",alts:["Nudge"]}
 ],
 explain:"Die Verhaltensökonomie (Behavioral Economics) untersucht, wie und warum Menschen von rationalem Verhalten abweichen. Nudging nutzt diese Erkenntnisse, um Verhalten zu steuern, ohne Freiheiten einzuschränken."},

{id:"r07",topic:"kritik",type:"tf",diff:2,tax:"K2",reviewed:false,
 q:"Trotz der Kritik verwenden viele Ökonomen das Modell des Homo oeconomicus weiterhin, besonders zur Erklärung des Verhaltens von Unternehmen.",
 correct:true,explain:"Richtig. Auch wenn das Modell individuelles Verhalten nicht perfekt erklärt, ist es für die Analyse von Unternehmensverhalten (Gewinnmaximierung) weiterhin sehr nützlich. Die VWL bemüht sich aber laufend, das Menschenbild zu erweitern und realitätsnaher zu gestalten."},

{id:"r08",topic:"kritik",type:"mc",diff:2,tax:"K2",reviewed:false,
 q:"Gary Becker (Nobelpreis 1992) wandte das ökonomische Kosten-Nutzen-Prinzip auf ungewöhnliche Bereiche an. Welchen?",
 options:[{v: "A",t:"Nur auf den Aktienmarkt und die Banken."},{v: "B",t:"Ausschliesslich auf internationale Handelsabkommen."},{v: "C",t:"Auf Naturwissenschaften und Physik."},{v: "D",t:"Diskriminierung, Kriminalität, Humankapital und Familienökonomie."}],
 correct:"D",explain:"Becker zeigte, dass ökonomische Prinzipien auch ausserhalb der traditionellen Wirtschaft gelten: Ein Räuber wägt Nutzen (Beute) gegen Kosten (Gefahr, Strafe) ab. Eltern investieren in Kinder als «Humankapital». Heirat ist ein «Markt» mit Kosten-Nutzen-Überlegungen."},

{id:"r09",topic:"kritik",type:"tf",diff:1,tax:"K1",reviewed:false,
 q:"Die Verhaltensökonomie (Behavioral Economics) ist ein Teilgebiet der VWL, das psychologische Erkenntnisse in die ökonomische Analyse einbezieht.",
 correct:true,explain:"Richtig. Die Verhaltensökonomie untersucht, wie Menschen tatsächlich Entscheidungen treffen – im Gegensatz zum idealisierten Homo oeconomicus. Wichtige Vertreter sind Daniel Kahneman (Nobelpreis 2002) und Richard Thaler (Nobelpreis 2017). Beide zeigten systematische Abweichungen vom rationalen Verhalten."},

{id:"r10",topic:"kritik",type:"mc",diff:1,tax:"K1",reviewed:false,
 q:"Was versteht man unter «begrenzter Rationalität» (bounded rationality)?",
 options:[{v: "A",t:"Rationalität funktioniert nur in begrenzten Situationen wie beim Einkaufen."},{v: "B",t:"Menschen handeln immer irrational."},{v: "C",t:"Menschen können nicht alle Informationen verarbeiten und nutzen deshalb vereinfachte Faustregeln für ihre Entscheidungen."},{v: "D",t:"Nur intelligente Menschen sind rational."}],
 correct:"C",explain:"Herbert Simon (1957) prägte diesen Begriff: Die Welt ist zu komplex, als dass wir alle Informationen sammeln und verarbeiten könnten. Deshalb nutzen wir Heuristiken (Faustregeln), die meistens gut funktionieren, aber manchmal zu systematischen Fehlern führen."},

// ──── OPPORTUNITÄTSKOSTEN (o01–o09) ────
{id:"o01",topic:"opportunitaet",type:"mc",diff:1,tax:"K1",reviewed:false,
 q:"Was sind Opportunitätskosten?",
 options:[{v: "A",t:"Der entgangene Nutzen der besten nicht gewählten Alternative."},{v: "B",t:"Die Kosten, die beim Einkaufen anfallen."},{v: "C",t:"Die Kosten für eine zweite Meinung."},{v: "D",t:"Die Gebühren für eine verpasste Gelegenheit."}],
 correct:"A",explain:"Jede Entscheidung ist gleichzeitig ein Verzicht auf andere Möglichkeiten. Die Opportunitätskosten sind der Nutzen der besten nicht gewählten Alternative. Eisenhut: «Die wichtigste Erkenntnis aus dem Opportunitätskostenprinzip ist, dass nichts gratis ist.»"},

{id:"o02",topic:"opportunitaet",type:"open",diff:2,tax:"K3",reviewed:false,
 q:"Sie werden zum Nachtessen eingeladen. Warum ist dieses Essen nicht gratis, obwohl Sie nichts bezahlen? Verwenden Sie den Begriff «Opportunitätskosten».",
 sample:"Obwohl das Essen kostenlos ist, gibt es Opportunitätskosten: Ich verwende meine Zeit für das Nachtessen und verzichte damit auf andere Aktivitäten (z.B. Lernen, Freunde treffen, Sport). Der Nutzen der besten nicht gewählten Alternative ist der Preis, den ich «bezahle». Auch ein geschenktes Essen ist nie gratis, weil mindestens Zeit aufgewendet wird.",
 explain:"Eisenhut: «Auch ein geschenktes Nachtessen ist eben nicht gratis, weil dafür mindestens Zeit aufgewendet und damit auf eine andere Aktivität verzichtet werden muss.» Opportunitätskosten sind allgegenwärtig."},

{id:"o03",topic:"opportunitaet",type:"tf",diff:1,tax:"K2",reviewed:false,
 q:"Wenn jemand sagt «Ich habe keine Zeit», meint er eigentlich «Die Opportunitätskosten sind mir zu hoch».",
 correct:true,explain:"Richtig. Eisenhut formuliert es genau so: «Tut mir leid, die Opportunitätskosten sind mir zu hoch!» – das wäre die ehrliche ökonomische Antwort. Man hat immer 24 Stunden, aber andere Aktivitäten bringen mehr Nutzen."},

{id:"o04",topic:"opportunitaet",type:"mc",diff:2,tax:"K3",reviewed:false,
 q:"Sie überlegen sich, am Samstagabend ins Kino zu gehen (Freude: Note 8/10). Alternativ könnten Sie lernen (Freude: 3/10), Freunde treffen (Freude: 9/10) oder ein Buch lesen (Freude: 6/10). Wie hoch sind die Opportunitätskosten des Kinobesuchs?",
 options:[{v: "A",t:"3/10 – die schlechteste Alternative."},{v: "B",t:"9/10 – das ist der Nutzen der besten nicht gewählten Alternative (Freunde treffen)."},{v: "C",t:"8/10 – der Nutzen des Kinobesuchs selbst."},{v: "D",t:"18/10 – die Summe aller nicht gewählten Alternativen."}],
 correct:"B",explain:"Opportunitätskosten = Nutzen der BESTEN nicht gewählten Alternative. Nicht die Summe aller Alternativen! Hier: Freunde treffen (9/10) > Buch (6/10) > Lernen (3/10). Also Opportunitätskosten = 9/10. Ökonomisch betrachtet lohnt sich das Kino nicht, weil 8 < 9."},

{id:"o05",topic:"opportunitaet",type:"fill",diff:1,tax:"K1",reviewed:false,
 q:"Jede Entscheidung beinhaltet einen Verzicht. Diesen Verzicht nennt man {0}. Austauschbeziehungen zwischen verschiedenen Zielen nennt man in der Fachsprache {1}.",
 blanks:[
   {answer:"Opportunitätskosten",alts:["Opportunitätskosten","Verzichtskosten"]},
   {answer:"Trade-offs",alts:["Trade-off","Tradeoffs","Tradeoff"]}
 ],
 explain:"Jeder Entscheid hat Opportunitätskosten. Trade-offs sind Austauschbeziehungen: z.B. mehr Freizeit = weniger Einkommen, mehr Butter = weniger Kanonen, mehr Wachstum = möglicherweise weniger Umweltqualität."},

{id:"o06",topic:"opportunitaet",type:"tf",diff:2,tax:"K2",reviewed:false,
 q:"Warum sind Opportunitätskosten von gut bezahlten Managern besonders hoch? Weil ihr Zeitwert hoch ist – jede Stunde Freizeit bedeutet hohen entgangenen Verdienst.",
 correct:true,explain:"Eisenhut: «Warum sind gut bezahlte Manager gehetzt und chronisch übermüdet? Bei ihnen sind die Opportunitätskosten einer alternativen Zeitverwendung besonders hoch.» Wer CHF 500/Stunde verdient, verzichtet bei einer Stunde Freizeit auf CHF 500."},

{id:"o07",topic:"opportunitaet",type:"open",diff:2,tax:"K3",reviewed:false,
 q:"Nennen Sie ein konkretes Beispiel aus Ihrem Schulalltag, bei dem Trade-offs und Opportunitätskosten eine Rolle spielen.",
 sample:"Beispiel: Ich kann am Abend entweder für die Matheprüfung lernen oder für die VWL-Prüfung. Wenn ich Mathe wähle, sind die Opportunitätskosten die möglicherweise bessere VWL-Note. Es gibt einen Trade-off: mehr Zeit für Mathe = weniger Zeit für VWL. Ähnlich beim Entscheid zwischen Sporttraining und Lernen.",
 explain:"Trade-offs und Opportunitätskosten sind allgegenwärtig: Schule vs. Freizeit, ein Fach vs. ein anderes, Geld ausgeben vs. sparen. Der Homo oeconomicus wägt diese Kosten systematisch ab."},

{id:"o08",topic:"opportunitaet",type:"multi",diff:2,tax:"K2",reviewed:false,
 q:"Welche der folgenden Aussagen über Opportunitätskosten sind korrekt? (Mehrere Antworten möglich.)",
 options:[{v:"A",t:"Opportunitätskosten entstehen, weil Ressourcen knapp sind."},{v:"B",t:"Opportunitätskosten entsprechen der Summe aller entgangenen Alternativen."},{v:"C",t:"Auch ein «kostenloses» Angebot hat Opportunitätskosten, weil man mindestens Zeit aufwendet."},{v:"D",t:"Opportunitätskosten können je nach Person unterschiedlich hoch sein."}],
 correct:["A","C","D"],explain:"A ist korrekt: Knappheit erzwingt Entscheidungen, die Verzicht bedeuten. C ist korrekt: Eisenhut betont, dass nichts gratis ist – mindestens Zeit hat Opportunitätskosten. D ist korrekt: Ein Manager hat höhere Zeitopportunitätskosten als eine Studentin. B ist falsch: Nur die BESTE nicht gewählte Alternative zählt, nicht die Summe."},

{id:"o09",topic:"opportunitaet",type:"mc",diff:3,tax:"K4",reviewed:false,
 q:"Die Schweiz hat einen hohen Lebensstandard und gleichzeitig eine hohe Teilzeitquote – besonders bei gut qualifizierten Frauen. Wie lässt sich dieses Phänomen mit dem Konzept der Opportunitätskosten erklären?",
 options:[{v: "A",t:"Schweizerinnen sind weniger motiviert als Frauen in anderen Ländern."},{v: "B",t:"Opportunitätskosten spielen bei der Arbeitszeitwahl keine Rolle."},{v: "C",t:"Ein hoher Stundenlohn erhöht die Opportunitätskosten der Freizeit – gleichzeitig ermöglicht er aber, mit weniger Arbeitsstunden den gewünschten Lebensstandard zu finanzieren."},{v: "D",t:"Der Staat zwingt die Menschen zur Teilzeitarbeit."}],
 correct:"C",explain:"Zwei gegenläufige Effekte: (1) Substitutionseffekt: Hohe Löhne machen Freizeit «teuer» → Anreiz, mehr zu arbeiten. (2) Einkommenseffekt: Wer gut verdient, kann sich Freizeit leisten → Anreiz, weniger zu arbeiten. In der Schweiz überwiegt offenbar der Einkommenseffekt – besonders bei Familien, die Kinderbetreuung und Einkommen abwägen müssen."},

// ──── ANREIZE UND IHRE WIRKUNG (a01–a10) ────
{id:"a01",topic:"anreize",type:"mc",diff:1,tax:"K1",reviewed:false,
 q:"Warum sind Anreize in der Ökonomie so wichtig?",
 options:[{v: "A",t:"Weil Anreize nur in der Wirtschaft eine Rolle spielen."},{v: "B",t:"Weil der Homo oeconomicus auf Anreize reagiert – Verhaltensänderungen werden durch Veränderungen der Rahmenbedingungen ausgelöst."},{v: "C",t:"Weil Anreize immer zum gewünschten Ergebnis führen."},{v: "D",t:"Weil alle Menschen genau gleich auf Anreize reagieren."}],
 correct:"B",explain:"Anreize sind zentral: Der Homo oeconomicus stellt seinen Entscheid jederzeit zur Disposition. Veränderungen (höhere Gebühren, mehr Steuern, bessere Löhne) können eine Revision des Entscheids bewirken, wenn die Veränderung genügend gross ist."},

{id:"a02",topic:"anreize",type:"mc",diff:2,tax:"K2",reviewed:false,
 q:"Was beschreibt der «Kobra-Effekt»?",
 options:[{v: "A",t:"Wenn Anreize besonders effektiv sind."},{v: "B",t:"Wenn der Staat zu viele Anreize setzt."},{v: "C",t:"Wenn ein Anreizsystem so wirkt, dass genau das Gegenteil des gewünschten Ergebnisses eintritt."},{v: "D",t:"Wenn Menschen irrational auf Anreize reagieren."}],
 correct:"C",explain:"Der Kobra-Effekt: In Indien setzte die Kolonialregierung eine Prämie pro Kobra-Kopf aus, um die Plage zu bekämpfen. Ergebnis: Die Inder züchteten Kobras, um die Prämie zu kassieren. Die Plage wurde schlimmer. Das zeigt: Menschen reagieren auf Anreize, aber nicht immer wie erwartet."},

{id:"a03",topic:"anreize",type:"sort",diff:2,tax:"K3",reviewed:false,
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

{id:"a04",topic:"anreize",type:"tf",diff:2,tax:"K2",reviewed:false,
 q:"Wenn Kehrichtsackgebühren eingeführt werden, reduziert sich die Abfallmenge ohne Nebenwirkungen.",
 correct:false,explain:"Falsch. Eisenhut berichtet: Die Anzahl Säcke nahm zwar ab, dafür stieg das Gewicht pro Sack, es entstanden wilde Deponien und Abfalltransporte in Nachbargemeinden. Anreize haben fast immer Nebenwirkungen, weil Menschen kreativ reagieren."},

{id:"a05",topic:"anreize",type:"open",diff:3,tax:"K4",reviewed:false,
 q:"Im Schweizer Notensystem besteht man das Gymnasium mit einem Schnitt von 4.0. Analysieren Sie, welche Anreize dieses System für Schülerinnen und Schüler setzt. Gibt es auch unerwünschte Nebeneffekte?",
 sample:"Erwünschte Anreize: SuS lernen regelmässig, um die Bestehensnormen zu erfüllen. Leistung wird belohnt. Unerwünschte Nebeneffekte: Einige SuS lernen strategisch nur so viel, dass sie knapp bestehen (Minimumprinzip). Es gibt Anreize, einfache Fächer zu wählen statt anspruchsvoller. Manche SuS optimieren für Prüfungen statt für nachhaltiges Lernen (Bulimie-Lernen). Das System belohnt Anpassung, nicht immer Kreativität.",
 explain:"Das Notensystem ist ein Anreizsystem. Der Homo oeconomicus reagiert darauf rational – aber nicht immer im Sinne des Bildungsziels. Dies ist ein gutes Beispiel für den Unterschied zwischen individueller Rationalität und gesellschaftlicher Optimalität."},

{id:"a06",topic:"anreize",type:"fill",diff:1,tax:"K1",reviewed:false,
 q:"Der sogenannte {0} beschreibt das Phänomen, dass eine gut gemeinte Massnahme genau das Gegenteil des gewünschten Ergebnisses bewirkt. Dieses Beispiel zeigt, dass {1} fast immer von ungewissen Nebenfolgen begleitet sind.",
 blanks:[
   {answer:"Kobra-Effekt",alts:["Kobraeffekt"]},
   {answer:"Anreize",alts:["Anreizsysteme","regulatorische Eingriffe"]}
 ],
 explain:"Benannt nach dem Kobra-Beispiel aus Indien. Weitere Beispiele: Alkoholprohibition → Schwarzmarkt. Kehrichtsackgebühren → wilde Deponien. Der Mensch ist keine «Reiz-Reaktions-Maschine»."},

{id:"a07",topic:"anreize",type:"mc",diff:2,tax:"K2",reviewed:false,
 q:"Was unterscheidet Nudging von traditioneller Regulierung?",
 img:{src:"img/vwl/menschenbild/menschenbild_nudging_01.svg",alt:"Vergleich zweier Ansätze zur Verhaltenssteuerung"},
 options:[{v: "A",t:"Nudging beeinflusst Verhalten über psychologisch subtile Methoden, ohne Verbote oder Gebote zu erlassen."},{v: "B",t:"Nudging ist teurer als Regulierung."},{v: "C",t:"Es gibt keinen Unterschied."},{v: "D",t:"Nudging funktioniert nur bei irrationalen Menschen."}],
 correct:"A",explain:"Traditionelle Regulierung: Verbote, Gebote, Strafen (z.B. Rauchverbot). Nudging: Sanfte Stupser, die das Verhalten lenken, ohne die Wahlfreiheit einzuschränken (z.B. Fussabdrücke zum Mülleimer, gesundes Essen in Augenhöhe in der Kantine)."},

{id:"a08",topic:"anreize",type:"multi",diff:1,tax:"K2",reviewed:false,
 q:"Welche der folgenden Aussagen über Anreize sind korrekt? (Mehrere Antworten möglich.)",
 options:[{v:"A",t:"Anreize können sowohl positiv (Belohnungen) als auch negativ (Strafen) wirken."},{v:"B",t:"Menschen reagieren immer exakt so auf Anreize, wie der Gesetzgeber es plant."},{v:"C",t:"Anreize können unerwünschte Nebeneffekte haben (Kobra-Effekt)."},{v:"D",t:"Der Homo oeconomicus stellt seinen Entscheid bei veränderten Anreizen jederzeit zur Disposition."}],
 correct:["A","C","D"],explain:"A, C und D sind korrekt. Anreize wirken in beide Richtungen (A). Der Kobra-Effekt zeigt unerwünschte Nebenwirkungen (C). Der Homo oeconomicus passt sein Verhalten an veränderte Rahmenbedingungen an (D). B ist falsch – Menschen reagieren kreativ und oft unerwartet auf Anreize."},

{id:"a09",topic:"anreize",type:"mc",diff:3,tax:"K4",reviewed:false,
 q:"In der Schweiz wird die Invalidenversicherung (IV) immer wieder reformiert, um Fehlanreize zu reduzieren. Welcher der folgenden Mechanismen beschreibt einen typischen Fehlanreiz bei Sozialversicherungen?",
 options:[{v: "A",t:"Die IV-Rente ist zu tief, deshalb arbeiten alle IV-Bezüger sofort wieder."},{v: "B",t:"Arbeitgeber stellen bevorzugt IV-Bezüger ein, weil sie billiger sind."},{v: "C",t:"Wenn die IV-Rente nahe am bisherigen Lohn liegt, sinkt der Anreiz, eine neue Arbeitsstelle zu suchen – individuelle Rationalität führt zu gesellschaftlich unerwünschtem Verhalten."},{v: "D",t:"Die IV verursacht keine Fehlanreize, weil sie streng kontrolliert wird."}],
 correct:"C",explain:"Klassisches Anreizproblem: Wenn Sozialleistungen den Lohn annähernd ersetzen, reduziert sich der finanzielle Anreiz zur Arbeitsaufnahme (sog. «Armutsfalle»). Das ist aus Sicht des Homo oeconomicus rational, aber gesellschaftlich unerwünscht. Deshalb arbeiten viele Reformvorschläge mit gestuften Anreizen (z.B. Eingliederung vor Rente)."},

{id:"a10",topic:"anreize",type:"tf",diff:3,tax:"K4",reviewed:false,
 q:"Nudging ist ethisch unproblematisch, weil die Wahlfreiheit erhalten bleibt.",
 correct:false,explain:"Falsch. Auch wenn Nudging die Wahlfreiheit formal nicht einschränkt, gibt es ethische Bedenken: Wer bestimmt, was das «richtige» Verhalten ist? Ist subtile Manipulation durch den Staat legitim? Kritiker sprechen von «libertärem Paternalismus» – der Staat weiss angeblich besser, was gut für die Bürger ist. Die Debatte zeigt: Auch «sanfte» Steuerung ist nicht wertfrei."},

// ──── SPIELTHEORIE / GEFANGENENDILEMMA (g01–g11) ────
{id:"g01",topic:"spieltheorie",type:"mc",diff:1,tax:"K1",reviewed:false,
 q:"Womit beschäftigt sich die Spieltheorie?",
 options:[{v: "A",t:"Mit der Entwicklung optimaler Brettspielstrategien."},{v: "B",t:"Mit der Psychologie von Spielsüchtigen."},{v: "C",t:"Mit der Analyse menschlichen Verhaltens in strategischen Situationen – also wenn das eigene Ergebnis auch vom Verhalten anderer abhängt."},{v: "D",t:"Mit der Analyse von Computerspielen."}],
 correct:"C",explain:"Eine Situation ist «strategisch», wenn jeder bei seiner Entscheidung berücksichtigen muss, wie andere darauf reagieren. Die Spieltheorie analysiert solche Situationen systematisch. Das berühmteste Beispiel ist das Gefangenendilemma."},

{id:"g02",topic:"spieltheorie",type:"fill",diff:1,tax:"K1",reviewed:false,
 q:"Beim Gefangenendilemma hat jeder Beteiligte einen individuellen Anreiz, nicht zu {0}. Dies führt zu einem schlechteren Ergebnis für alle, obwohl {1} für die Gruppe besser wäre. Die Strategie, die individuell immer besser abschneidet, nennt man {2} Strategie.",
 blanks:[
   {answer:"kooperieren",alts:["Kooperation"]},
   {answer:"Kooperation",alts:["kooperieren","Zusammenarbeit"]},
   {answer:"dominante",alts:["dominant"]}
 ],
 explain:"Das Dilemma: Kooperation wäre für alle besser, aber jeder einzelne hat den Anreiz, nicht zu kooperieren (dominante Strategie). Ergebnis: Alle stehen schlechter da, als wenn alle kooperiert hätten."},

{id:"g03",topic:"spieltheorie",type:"mc",diff:2,tax:"K3",reviewed:false,
 q:"Bonnie und Clyde werden getrennt verhört. Beide schweigen → je 1 Jahr Haft. Beide verraten → je 10 Jahre. Einer verrät, einer schweigt → Verräter frei, Schweiger lebenslänglich. Was ist die dominante Strategie?",
 img:{src:"img/vwl/menschenbild/menschenbild_payoff_matrix_01.svg",alt:"Auszahlungsmatrix des Gefangenendilemmas"},
 options:[{v: "A",t:"Schweigen – man riskiert weniger."},{v: "B",t:"Abwechselnd verraten und schweigen."},{v: "C",t:"Verraten – unabhängig davon, was der andere tut, ist man durch Verraten immer besser gestellt."},{v: "D",t:"Es gibt keine dominante Strategie."}],
 correct:"C",explain:"Wenn der andere schweigt: Verraten → frei (besser als 1 Jahr). Wenn der andere verrät: Verraten → 10 Jahre (besser als lebenslänglich). Verraten ist IMMER besser, egal was der andere tut = dominante Strategie. Aber: Wenn beide verraten, bekommen beide 10 Jahre statt nur 1 Jahr bei Kooperation."},

{id:"g04",topic:"spieltheorie",type:"sort",diff:2,tax:"K3",reviewed:false,
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

{id:"g05",topic:"spieltheorie",type:"open",diff:3,tax:"K4",reviewed:false,
 q:"Erklären Sie am Beispiel Doping im Radsport, warum die Situation ein Gefangenendilemma darstellt. Warum ist Doping gleichzeitig «absurd und rational»?",
 sample:"Absurd: Wenn niemand dopen würde, wäre niemand benachteiligt – die Rennen wären genauso spannend. Rational: Wenn ich annehme, dass andere dopen, MUSS ich auch dopen, um konkurrenzfähig zu bleiben. Wenn andere NICHT dopen, lohnt sich Doping erst recht, um zu gewinnen. Nicht-Dopen ist nie die beste individuelle Strategie → Doping ist dominant. Ergebnis: Alle dopen, keiner hat einen Vorteil, aber alle riskieren ihre Gesundheit. Das Dilemma: Individuelle Rationalität führt zu kollektiver Irrationalität.",
 explain:"Eisenhut: «Jeder Rennfahrer gewinnt lieber mit Doping, als ohne Doping zu verlieren. Denken alle so rational, dopen eben auch alle, und dies zum Schaden aller.»"},

{id:"g06",topic:"spieltheorie",type:"mc",diff:2,tax:"K2",reviewed:false,
 q:"Welche drei Wege können helfen, das Gefangenendilemma zu überwinden?",
 options:[{v: "A",t:"Das Dilemma kann grundsätzlich nicht überwunden werden."},{v: "B",t:"Nur strenge Gesetze können das Problem lösen."},{v: "C",t:"Mehr Geld, weniger Regeln und schnellere Entscheidungen."},{v: "D",t:"Kommunikation (Absprachen), Sanktionen (Strafen bei Abweichung) und wiederholte Interaktion (langfristige Beziehungen)."}],
 correct:"D",explain:"Drei Lösungsansätze: (1) Kommunikation – Absprachen ermöglichen. (2) Sanktionen – Vertragsbruch bestrafen (z.B. Omertà bei der Mafia). (3) Wiederholung – bei langfristigen Beziehungen ist Kooperation attraktiver, weil Vergeltung droht. Im Veritasium-Video werden 4 Eigenschaften erfolgreicher Strategien genannt: nett, vergeltend, verzeihend, klar."},

{id:"g07",topic:"spieltheorie",type:"tf",diff:2,tax:"K2",reviewed:false,
 q:"Im Gefangenendilemma kommt es zu einem schlechten Ergebnis, weil sich die Beteiligten irrational verhalten.",
 correct:false,explain:"Falsch. Das Dilemma entsteht gerade WEIL die Beteiligten rational (eigennützig) handeln. Nicht-Kooperation ist die individuell rationale (dominante) Strategie. Das Problem: Individuelle Rationalität führt zu kollektiver Irrationalität. Das Dilemma entsteht durch die Struktur der Situation, nicht durch Irrationalität."},

{id:"g08",topic:"spieltheorie",type:"tf",diff:2,tax:"K2",reviewed:false,
 q:"Im Gefangenendilemma hängt das Ergebnis nicht nur vom eigenen, sondern auch vom Verhalten der anderen Beteiligten ab.",
 correct:true,explain:"Richtig. Das macht die Situation «strategisch»: Mein Ergebnis hängt von meiner UND der Entscheidung des anderen ab. Genau diese gegenseitige Abhängigkeit macht das Gefangenendilemma so faszinierend und relevant für viele Lebensbereiche."},

{id:"g09",topic:"spieltheorie",type:"multi",diff:1,tax:"K2",reviewed:false,
 q:"Welche Merkmale kennzeichnen ein Gefangenendilemma? (Mehrere Antworten möglich.)",
 options:[{v:"A",t:"Kooperation wäre für alle Beteiligten das beste Ergebnis."},{v:"B",t:"Jeder Einzelne hat einen Anreiz, nicht zu kooperieren (dominante Strategie)."},{v:"C",t:"Die Beteiligten können sich frei absprechen und Abmachungen durchsetzen."},{v:"D",t:"Individuelle Rationalität führt zu einem kollektiv schlechteren Ergebnis."}],
 correct:["A","B","D"],explain:"A, B und D sind korrekt: Kooperation wäre optimal (A), aber jeder hat individuell einen Anreiz zur Nicht-Kooperation (B), was zu einem kollektiv schlechteren Ergebnis führt (D). C ist falsch – das Dilemma entsteht gerade, WEIL Absprachen nicht möglich oder nicht durchsetzbar sind."},

{id:"g10",topic:"spieltheorie",type:"mc",diff:2,tax:"K3",reviewed:false,
 q:"Betrachten Sie die Auszahlungsmatrix: Spieler A und B können je «kooperieren» oder «nicht kooperieren». Bei gegenseitiger Kooperation erhalten beide je 3 Punkte. Bei gegenseitiger Nicht-Kooperation je 1 Punkt. Kooperiert nur einer, erhält der Nicht-Kooperierende 5 Punkte, der Kooperierende 0. Welches Ergebnis stellt sich ein?",
 options:[{v: "A",t:"Beide kooperieren und erhalten je 3 Punkte."},{v: "B",t:"Beide kooperieren nicht und erhalten je 1 Punkt – obwohl bei gegenseitiger Kooperation je 3 Punkte möglich wären."},{v: "C",t:"Es gibt kein vorhersagbares Ergebnis."},{v: "D",t:"Einer kooperiert, der andere nicht."}],
 correct:"B",explain:"Nicht-Kooperation ist die dominante Strategie: Egal was der andere tut, Nicht-Kooperation bringt individuell immer mehr (5 > 3 oder 1 > 0). Ergebnis: Beide wählen rational Nicht-Kooperation → je 1 Punkt, obwohl gegenseitige Kooperation je 3 Punkte gebracht hätte. Das ist das Nash-Gleichgewicht."},

{id:"g11",topic:"spieltheorie",type:"open",diff:3,tax:"K5",reviewed:false,
 q:"Internationale Klimaverhandlungen werden oft als Gefangenendilemma beschrieben. Erklären Sie, warum, und beurteilen Sie, welche Lösungsmechanismen aus der Spieltheorie hier helfen könnten.",
 sample:"Gefangenendilemma: Klimaschutz wäre für alle Staaten besser (Kooperation). Aber jeder einzelne Staat profitiert, wenn er selbst wenig tut, während andere die Kosten tragen (Trittbrettfahren = dominante Strategie). Ergebnis: Zu wenig Klimaschutz. Lösungsmechanismen: (1) Wiederholte Interaktion – jährliche Klimagipfel schaffen langfristige Beziehungen. (2) Sanktionen – Handelssanktionen gegen Nicht-Teilnehmer (z.B. CO₂-Grenzausgleich der EU). (3) Kommunikation – Transparenz über Emissionen. Grenzen: Anders als im klassischen Dilemma sind die Akteure sehr ungleich (grosse vs. kleine Staaten), und die Auswirkungen sind zeitlich verzögert.",
 explain:"Das Klimaproblem ist ein Gefangenendilemma auf globaler Ebene. Es zeigt, warum freiwillige Kooperation so schwierig ist und warum internationale Abkommen (wie das Pariser Abkommen) institutionelle Rahmen schaffen müssen."},

// ──── AUFGABEN DER VWL (v01–v08) ────
{id:"v01",topic:"aufgaben",type:"mc",diff:1,tax:"K1",reviewed:false,
 q:"Was sind die Aufgaben der Volkswirtschaftslehre?",
 options:[{v: "A",t:"Nur Statistiken erstellen."},{v: "B",t:"Gesetze erlassen und Steuern festlegen."},{v: "C",t:"Unternehmen beraten und Gewinne maximieren."},{v: "D",t:"Wirtschaftliche Vorgänge beschreiben und erklären, Entwicklungen prognostizieren, wirtschaftspolitische Beeinflussung aufzeigen."}],
 correct:"D",explain:"Die VWL hat vier Aufgaben: (1) Beschreiben (Was passiert?), (2) Erklären (Warum passiert es?), (3) Prognostizieren (Was wird passieren?), (4) Beeinflussen (Was soll getan werden?). Beispiel: (1) Die Arbeitslosigkeit steigt. (2) Weil die Nachfrage sinkt. (3) Sie wird weiter steigen. (4) Der Staat sollte Beschäftigungsprogramme lancieren."},

{id:"v02",topic:"aufgaben",type:"sort",diff:2,tax:"K2",reviewed:false,
 q:"Ordnen Sie die Beispiele der korrekten Aufgabe der VWL zu.",
 categories:["Beschreiben","Erklären","Prognostizieren","Beeinflussen"],
 items:[
   {t:"Die Arbeitslosenquote beträgt 3.2%",cat:0},{t:"Die Arbeitslosigkeit steigt wegen sinkender Nachfrage",cat:1},
   {t:"Die Inflation wird voraussichtlich 2% betragen",cat:2},{t:"Der Staat sollte die Zinsen senken",cat:3},
   {t:"Das BIP ist im letzten Quartal um 0.5% gewachsen",cat:0},{t:"Subventionen für erneuerbare Energien einführen",cat:3}
 ],
 explain:"Beschreiben = Fakten darstellen (Quoten, Zahlen). Erklären = Ursachen analysieren (warum?). Prognostizieren = Zukunft vorhersagen. Beeinflussen = wirtschaftspolitische Massnahmen empfehlen."},

{id:"v03",topic:"aufgaben",type:"fill",diff:1,tax:"K1",reviewed:false,
 q:"Die VWL hat vier Aufgaben: wirtschaftliche Vorgänge zu {0}, zu {1}, Entwicklungen zu {2} und die Wirtschaft zielgerichtet zu {3}.",
 blanks:[
   {answer:"beschreiben",alts:[]},
   {answer:"erklären",alts:["erklaeren"]},
   {answer:"prognostizieren",alts:["vorhersagen","voraussagen"]},
   {answer:"beeinflussen",alts:["steuern"]}
 ],
 explain:"Eisenhut: «Die VWL hat die Aufgabe, wirtschaftliche Vorgänge zu beschreiben, zu erklären, zu prognostizieren und zielgerichtet zu beeinflussen.» Dabei sollen nicht nur kurzfristige, sondern auch langfristige Auswirkungen berücksichtigt werden."},

{id:"v04",topic:"aufgaben",type:"tf",diff:2,tax:"K2",reviewed:false,
 q:"Prognosen in der VWL sind einfach, weil die Zusammenhänge klar sind.",
 correct:false,explain:"Falsch. Prognosen sind schwierig, weil: (1) Die Ursachen selbst wieder erklärungsbedürftig sind (Kausalitätsketten). (2) Viele Einflussfaktoren geschätzt werden müssen (Nachfrage, Löhne, technischer Fortschritt). (3) Menschen unvorhersehbar auf Anreize reagieren. Deshalb sind ökonomische Prognosen oft ungenau."},

{id:"v05",topic:"aufgaben",type:"open",diff:2,tax:"K3",reviewed:false,
 q:"Wählen Sie eine aktuelle Wirtschaftsmeldung (z.B. steigende Mieten) und zeigen Sie, wie die VWL ihre vier Aufgaben darauf anwendet.",
 sample:"Meldung: «Die Mieten in Schweizer Städten steigen.» (1) Beschreiben: Die Mieten sind im letzten Jahr um 3% gestiegen. (2) Erklären: Zuwanderung erhöht Nachfrage, wenig Neubau begrenzt Angebot. (3) Prognostizieren: Mieten werden weiter steigen, wenn nicht mehr gebaut wird. (4) Beeinflussen: Lockerung der Bauvorschriften, Förderung des gemeinnützigen Wohnungsbaus, Mietpreisregulierung.",
 explain:"Dieses Vorgehen zeigt, wie die VWL systematisch an Probleme herangeht: Von der Beobachtung über die Ursachenanalyse zur Prognose und schliesslich zu Handlungsempfehlungen."},

{id:"v06",topic:"aufgaben",type:"mc",diff:3,tax:"K4",reviewed:false,
 q:"Ein Ökonom sagt: «Die Inflation wird nächstes Jahr bei 2.5% liegen, deshalb sollte die SNB die Leitzinsen erhöhen.» Welche Aufgaben der VWL vereint er in dieser Aussage – und warum ist das problematisch?",
 options:[{v: "A",t:"Er vermischt Prognostizieren (2.5% Inflation) und Beeinflussen (Leitzins erhöhen). Problematisch, weil die Prognose unsicher ist und die Handlungsempfehlung von Wertvorstellungen abhängt."},{v: "B",t:"Er verwechselt Mikro- und Makroökonomie."},{v: "C",t:"Er prognostiziert korrekt und seine Empfehlung folgt logisch daraus."},{v: "D",t:"Er beschreibt und erklärt gleichzeitig, was unzulässig ist."}],
 correct:"A",explain:"Die Trennung von positiver Analyse (beschreiben, erklären, prognostizieren – Was ist?) und normativer Analyse (beeinflussen – Was soll sein?) ist zentral. Prognosen enthalten Unsicherheit. Handlungsempfehlungen enthalten zusätzlich Werturteile (z.B. «Preisstabilität ist wichtiger als Beschäftigung»). Beides zu vermischen suggeriert falsche Objektivität."},

{id:"v07",topic:"aufgaben",type:"multi",diff:1,tax:"K1",reviewed:false,
 q:"Welche der folgenden Aussagen zählen zu den Aufgaben der VWL? (Mehrere Antworten möglich.)",
 options:[{v:"A",t:"Wirtschaftliche Vorgänge beschreiben (z.B. Arbeitslosenquote erheben)."},{v:"B",t:"Gesetze für Unternehmen erlassen."},{v:"C",t:"Wirtschaftliche Zusammenhänge erklären (z.B. warum die Preise steigen)."},{v:"D",t:"Handlungsempfehlungen für die Wirtschaftspolitik formulieren."}],
 correct:["A","C","D"],explain:"A, C und D sind die drei der vier Aufgaben der VWL: Beschreiben (A), Erklären (C), Beeinflussen (D). Die vierte Aufgabe – Prognostizieren – ist hier nicht aufgeführt. B ist falsch: Gesetze erlassen ist Aufgabe des Parlaments, nicht der VWL. Die VWL kann aber Empfehlungen abgeben."},

{id:"v08",topic:"aufgaben",type:"open",diff:3,tax:"K5",reviewed:false,
 q:"Warum wird die VWL manchmal als «die dismal science» (düstere Wissenschaft) bezeichnet? Nehmen Sie Stellung dazu, ob diese Bezeichnung gerechtfertigt ist.",
 sample:"Die Bezeichnung stammt von Thomas Carlyle (19. Jh.) und bezieht sich darauf, dass die VWL oft unangenehme Wahrheiten aufzeigt: Ressourcen sind knapp, es gibt Trade-offs, kostenlose Mittagessen existieren nicht. Pro: Die VWL zeigt Grenzen auf und warnt vor zu optimistischen Versprechen. Contra: Die VWL kann auch aufzeigen, wie Wohlstand entsteht, wie Armut bekämpft wird und wie kluge Anreize das Zusammenleben verbessern. Sie ist nicht düster, sondern realistisch – und genau das macht sie nützlich.",
 explain:"Die Bezeichnung «dismal science» wird oft missverstanden. Die VWL ist nicht pessimistisch, sondern sie nimmt Knappheit und Trade-offs ernst. Gerade dadurch hilft sie, bessere Entscheidungen zu treffen – auf individueller und gesellschaftlicher Ebene."},

// ──── ZIELE DER WIRTSCHAFTSPOLITIK (z01–z08) ────
{id:"z01",topic:"ziele",type:"mc",diff:1,tax:"K1",reviewed:false,
 q:"Welche sechs Ziele umfasst das «magische Sechseck» der Wirtschaftspolitik?",
 img:{src:"img/vwl/menschenbild/menschenbild_sechseck_01.svg",alt:"Sechseck mit sechs wirtschaftspolitischen Zielen"},
 options:[{v: "A",t:"Hohe Exporte, tiefe Steuern, hohe Gewinne, viel Konsum, wenig Staat, tiefe Inflation."},{v: "B",t:"BIP, Gini-Koeffizient, Lorenzkurve, Handelsbilanz, Zinssatz, Wechselkurs."},{v: "C",t:"Vollbeschäftigung, Preisstabilität, Wirtschaftswachstum, aussenwirtschaftliches Gleichgewicht, sozialer Ausgleich, Umweltqualität."},{v: "D",t:"Freiheit, Gleichheit, Brüderlichkeit, Demokratie, Wohlstand, Sicherheit."}],
 correct:"C",explain:"Das magische Sechseck: (1) Vollbeschäftigung, (2) Preisstabilität, (3) Wirtschaftswachstum, (4) Aussenwirtschaftliches Gleichgewicht, (5) Sozialer Ausgleich (Verteilung), (6) Umweltqualität. Ursprünglich nur ein Dreieck (1-3), im Laufe der Zeit erweitert."},

{id:"z02",topic:"ziele",type:"tf",diff:1,tax:"K2",reviewed:false,
 q:"Das Sechseck heisst «magisch», weil es schwierig ist, alle sechs Ziele gleichzeitig zu erreichen.",
 correct:true,explain:"Richtig. Die Ziele stehen teilweise in Konkurrenz zueinander (Zielkonflikte). Beispiel: Wirtschaftswachstum kann die Umweltqualität beeinträchtigen. Preisstabilität und Vollbeschäftigung können kurzfristig in Konkurrenz stehen."},

{id:"z03",topic:"ziele",type:"sort",diff:2,tax:"K2",reviewed:false,
 q:"Ordnen Sie die Beispiele der korrekten Zielbeziehung zu.",
 categories:["Zielharmonie","Zielkonkurrenz"],
 items:[
   {t:"Wirtschaftswachstum fördert Vollbeschäftigung",cat:0},
   {t:"Mehr Wachstum kann Umwelt belasten",cat:1},
   {t:"Preisstabilität und Vollbeschäftigung können sich kurzfristig widersprechen",cat:1},
   {t:"Bildungsinvestitionen fördern Wachstum und sozialen Ausgleich gleichzeitig",cat:0}
 ],
 explain:"Zielharmonie: Das Erreichen eines Ziels fördert ein anderes. Zielkonkurrenz: Ein Ziel zu verfolgen behindert ein anderes. Zielneutralität (selten): Ziele beeinflussen sich nicht gegenseitig. Beispiel für den klassischen Trade-off: «Butter und Kanonen»."},

{id:"z04",topic:"ziele",type:"fill",diff:2,tax:"K1",reviewed:false,
 q:"Wenn das Anstreben eines Ziels ein anderes fördert, spricht man von {0}. Wenn ein Ziel ein anderes behindert, spricht man von {1}. In der Fachsprache heissen solche Austauschbeziehungen {2}.",
 blanks:[
   {answer:"Zielharmonie",alts:["Ziel-Harmonie"]},
   {answer:"Zielkonkurrenz",alts:["Ziel-Konkurrenz","Zielkonflikt"]},
   {answer:"Trade-offs",alts:["Trade-off","Tradeoffs"]}
 ],
 explain:"Drei Zielbeziehungen: Zielharmonie, Zielneutralität, Zielkonkurrenz. Trade-offs = Austauschbeziehungen, z.B. «ein bisschen weniger Arbeitslose gegen ein bisschen weniger Preisstabilität» (Eisenhut)."},

{id:"z05",topic:"ziele",type:"mc",diff:2,tax:"K2",reviewed:false,
 q:"Warum ist der klassische Trade-off «Butter und Kanonen» ein gutes Beispiel für wirtschaftspolitische Zielkonflikte?",
 options:[{v: "A",t:"Weil die Armee kein Geld benötigt."},{v: "B",t:"Weil es in der Wirtschaft immer nur um Waffen geht."},{v: "C",t:"Weil Butter und Kanonen aus denselben Rohstoffen hergestellt werden."},{v: "D",t:"Weil mehr Ausgaben für die Armee (Kanonen) weniger Mittel für zivile Güter (Butter) bedeuten – die Ressourcen sind knapp."}],
 correct:"D",explain:"Das «Butter-und-Kanonen»-Beispiel illustriert den grundlegenden Trade-off: Knappe Ressourcen (Geld, Arbeit, Material) können entweder für Rüstung oder für zivile Güter eingesetzt werden – nicht für beides gleichzeitig. Dies zeigt die Opportunitätskosten jeder Entscheidung auf gesamtwirtschaftlicher Ebene."},

{id:"z06",topic:"ziele",type:"open",diff:3,tax:"K5",reviewed:false,
 q:"Stehen die Ziele «Wirtschaftswachstum» und «Umweltqualität» in Harmonie oder in Konkurrenz? Begründen Sie Ihre Einschätzung.",
 sample:"Beides ist möglich. Zielkonkurrenz: Mehr Produktion bedeutet oft mehr Ressourcenverbrauch und Emissionen (quantitatives Wachstum). Zielharmonie: Qualitatives Wachstum (effizientere Technologien, erneuerbare Energien, Kreislaufwirtschaft) kann Wachstum und Umweltschutz verbinden. Zudem braucht es wirtschaftliche Mittel, um in Umwelttechnologien zu investieren. Fazit: Die Zielbeziehung ist nicht eindeutig – sie hängt von der Art des Wachstums ab.",
 explain:"Eisenhut fragt: «Brauchen wir Wachstum, um unsere Umwelt zu retten?» Die Antwort ist nicht eindeutig. Entscheidend ist die Unterscheidung zwischen quantitativem und qualitativem Wachstum."},

{id:"z07",topic:"ziele",type:"multi",diff:1,tax:"K2",reviewed:false,
 q:"Welche der folgenden Ziele gehören zum «magischen Sechseck» der Wirtschaftspolitik? (Mehrere Antworten möglich.)",
 img:{src:"img/vwl/menschenbild/menschenbild_sechseck_01.svg",alt:"Sechseck mit sechs wirtschaftspolitischen Zielen"},
 options:[{v:"A",t:"Preisstabilität"},{v:"B",t:"Maximierung der Unternehmensgewinne"},{v:"C",t:"Umweltqualität"},{v:"D",t:"Vollbeschäftigung"}],
 correct:["A","C","D"],explain:"A (Preisstabilität), C (Umweltqualität) und D (Vollbeschäftigung) gehören zum magischen Sechseck. B (Maximierung der Unternehmensgewinne) ist kein wirtschaftspolitisches Ziel des Sechsecks – Unternehmensgewinne sind ein betriebswirtschaftliches Ziel, nicht ein gesamtwirtschaftliches."},

{id:"z08",topic:"ziele",type:"mc",diff:3,tax:"K4",reviewed:false,
 q:"Die Schweiz hat eine tiefe Arbeitslosenquote (≈2%), aber hohe Mieten und Lebenshaltungskosten. Welche Zielbeziehung im magischen Sechseck wird hier sichtbar?",
 options:[{v: "A",t:"Zielharmonie: Tiefe Arbeitslosigkeit und hohe Mieten ergänzen sich optimal."},{v: "B",t:"Es handelt sich um kein wirtschaftspolitisches Thema."},{v: "C",t:"Zielneutralität: Die Arbeitslosenquote hat keinen Einfluss auf die Mietpreise."},{v: "D",t:"Zielkonkurrenz: Hohe Beschäftigung und Zuwanderung treiben die Nachfrage nach Wohnraum, was den sozialen Ausgleich (bezahlbares Wohnen) erschwert."}],
 correct:"D",explain:"Konkret: Vollbeschäftigung und wirtschaftliche Dynamik ziehen Arbeitskräfte an (Zuwanderung), was die Nachfrage nach Wohnraum erhöht und die Mieten steigen lässt. Das Ziel «sozialer Ausgleich» (bezahlbares Wohnen für alle) wird dadurch erschwert. Ein typisches Beispiel für die Zielkonflikte, die das Sechseck «magisch» machen."},

// --- Sortierungsfragen ---
{id: "neu_sort_01", topic: "homo", type: "sortierung", diff: 2, tax: "K3", reviewed: false,
 q: "Ordnen Sie die folgenden Annahmen des Homo Oeconomicus nach ihrer zunehmenden Realitätsferne – von der «noch einigermassen realistischen» zur «am stärksten vereinfachenden» Annahme.",
 items: [
   "Eigeninteresse: Menschen verfolgen ihre eigenen Ziele",
   "Nutzenmaximierung: Menschen treffen bewusste Kosten-Nutzen-Abwägungen",
   "Stabile Präferenzen: Vorlieben ändern sich nicht über die Zeit",
   "Vollständige Information: Alle Alternativen und Konsequenzen sind bekannt"
 ],
 correct: [0, 1, 2, 3],
 explain: "Eigeninteresse ist die realistischste Annahme – Menschen handeln tatsächlich oft eigennützig. Nutzenmaximierung ist schon vereinfacht (Verhaltensökonomie zeigt Heuristiken). Stabile Präferenzen sind empirisch widerlegt (Gewohnheiten, Moden). Vollständige Information ist die unrealistischste Annahme – sie ist in der Realität praktisch nie gegeben."
},
{id: "neu_sort_02", topic: "kritik", type: "sortierung", diff: 3, tax: "K3", reviewed: false,
 q: "Ordnen Sie die folgenden ökonomischen Denkschulen chronologisch – von der ältesten zur jüngsten.",
 items: [
   "Klassische Ökonomie (Adam Smith: «unsichtbare Hand», Eigennutz führt zum Gemeinwohl)",
   "Neoklassik (marginale Revolution: Grenznutzentheorie, Homo Oeconomicus als Modell)",
   "Keynesianismus (John M. Keynes: Staat muss in Krisen eingreifen, Nachfragesteuerung)",
   "Verhaltensökonomie (Kahneman/Thaler: Menschen handeln systematisch irrational, Nudging)"
 ],
 correct: [0, 1, 2, 3],
 explain: "Adam Smith (1776, Wealth of Nations) begründete die klassische Ökonomie. Die Neoklassik (ab ca. 1870) formalisierte das Modell des rationalen Akteurs. Keynes (1936) kritisierte die Selbstheilungskräfte des Marktes. Die Verhaltensökonomie (ab ca. 1980, Nobelpreis Kahneman 2002, Thaler 2017) zeigt systematische Abweichungen vom Homo Oeconomicus."
},
{id: "neu_sort_03", topic: "ziele", type: "sortierung", diff: 2, tax: "K3", reviewed: false,
 q: "Ordnen Sie die sechs Ziele des «magischen Sechsecks» der Schweizer Wirtschaftspolitik in der Reihenfolge, wie sie im Bundesverfassungsartikel 94–100 BV typischerweise priorisiert werden.",
 items: [
   "Preisstabilität (Inflationsbekämpfung – Hauptziel der SNB)",
   "Vollbeschäftigung (tiefe Arbeitslosigkeit)",
   "Wirtschaftswachstum (steigendes reales BIP)",
   "Aussenwirtschaftliches Gleichgewicht (ausgeglichene Leistungsbilanz)",
   "Gerechte Einkommensverteilung (sozialer Ausgleich)",
   "Ökologische Nachhaltigkeit (Umweltschutz)"
 ],
 correct: [0, 1, 2, 3, 4, 5],
 explain: "Traditionell stehen Preisstabilität und Vollbeschäftigung im Zentrum der Wirtschaftspolitik. Wachstum und Aussenhandelsgleichgewicht folgen. Verteilung und Nachhaltigkeit wurden historisch erst später als gleichwertige Ziele anerkannt. Alle sechs Ziele stehen in vielfältigen Wechselbeziehungen – daher «magisch»: Alle gleichzeitig zu erreichen ist kaum möglich."
},

// ===== INTERAKTIVE FRAGETYPEN (Hotspot, Bildbeschriftung, DragDrop) =====

// --- Bildbeschriftung: Gefangenendilemma-Matrix ---
{
  id: "beschriftung01", topic: "spieltheorie", type: "bildbeschriftung", diff: 2, tax: "K2", reviewed: false,
  q: "Beschrifte die Elemente des Gefangenendilemmas.",
  img: { src: "img/vwl/menschenbild/menschenbild_payoff_beschriftung.svg", alt: "Gefangenendilemma-Matrix mit sechs nummerierten Beschriftungspunkten" },
  labels: [
    {id: "l1", text: "Beide gestehen: 5/5 Jahre", x: 52, y: 44},
    {id: "l2", text: "A gesteht, B schweigt: 0/10 Jahre", x: 73, y: 44},
    {id: "l3", text: "A schweigt, B gesteht: 10/0 Jahre", x: 52, y: 72},
    {id: "l4", text: "Beide schweigen: 1/1 Jahr", x: 73, y: 72},
    {id: "l5", text: "Spieler A (Strategien)", x: 33, y: 58},
    {id: "l6", text: "Spieler B (Strategien)", x: 63, y: 24}
  ],
  explain: "Im Gefangenendilemma hat jeder Spieler die dominante Strategie zu gestehen, obwohl beidseitiges Schweigen (1/1) das kollektiv bessere Ergebnis wäre. Das Nash-Gleichgewicht liegt bei «beide gestehen» (5/5)."
},
// --- DragDrop: Homo oeconomicus vs. Behavioral Economics ---
{
  id: "dragdrop01", topic: "homo", type: "dragdrop_bild", diff: 2, tax: "K3", reviewed: false,
  q: "Ordne die folgenden Annahmen dem passenden Menschenbild zu.",
  img: { src: "img/vwl/menschenbild/menschenbild_modelle_dragdrop.svg", alt: "Zwei Spalten: Homo oeconomicus und Behavioral Economics" },
  zones: [
    {id: "homo", x: 2.5, y: 14, w: 46, h: 82},
    {id: "behavioral", x: 51.5, y: 14, w: 46, h: 82}
  ],
  labels: [
    {id: "m1", text: "Vollständige Information", zone: "homo"},
    {id: "m2", text: "Rationale Nutzenmaximierung", zone: "homo"},
    {id: "m3", text: "Stabile Präferenzen", zone: "homo"},
    {id: "m4", text: "Eigeninteresse als Antrieb", zone: "homo"},
    {id: "m5", text: "Begrenzte Rationalität", zone: "behavioral"},
    {id: "m6", text: "Verlustaversion", zone: "behavioral"},
    {id: "m7", text: "Heuristiken und Biases", zone: "behavioral"},
    {id: "m8", text: "Soziale Präferenzen (Fairness)", zone: "behavioral"}
  ],
  explain: "Der Homo oeconomicus geht von rationalem, eigeninteressiertem Verhalten bei vollständiger Information aus. Behavioral Economics zeigt, dass Menschen begrenzt rational sind, Verluste stärker gewichten, Heuristiken nutzen und soziale Präferenzen haben."
}

];
