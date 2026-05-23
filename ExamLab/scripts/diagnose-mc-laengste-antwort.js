/**
 * DIAGNOSE: MC-Fragen mit dem Muster "längste Antwort = korrekt"
 *
 * Kopiere die Funktionen in den Apps Script Editor (Projekt der Fragensammlung
 * oder ein Standalone-Skript) und führe `diagnoseMcLaengsteAntwort` aus.
 *
 * Sie prüft alle Multiple-Choice-Fragen der Fragensammlung darauf, ob die
 * korrekte Antwort auffällig oft die längste Option ist — ein Muster, das
 * Schüler erkennen und zum Raten ausnutzen können.
 *
 * Ausgabe: Logger → Ansicht > Protokolle (Cmd/Ctrl + Enter).
 *
 * FRAGENSAMMLUNG_ID ggf. auf die eigene Fragensammlung-Tabelle anpassen.
 */

function diagnoseMcLaengsteAntwort() {
  var FRAGENSAMMLUNG_ID = '1ASSRv7mSpmyD22PAMUJ8iekHwuamYkHpy9E6yxWNIVs';
  var TABS = ['BWL', 'VWL', 'Recht', 'Informatik'];

  var fragensammlung = SpreadsheetApp.openById(FRAGENSAMMLUNG_ID);

  var gesamtMc = 0;            // alle MC-Fragen mit >= 2 Optionen
  var summeOptionen = 0;       // für den Durchschnitt der Optionsanzahl
  var einfachauswahl = 0;      // MC mit genau EINER korrekten Antwort
  var korrektLaengste = 0;     // davon: korrekte ist strikt die längste Option
  var korrektKuerzeste = 0;    // davon: korrekte ist strikt die kürzeste (Vergleich)
  var summeKorrektLen = 0;     // für Ø-Länge der korrekten Antwort
  var summeDistraktorLen = 0;  // für Ø-Länge der Distraktoren
  var anzahlDistraktoren = 0;
  var auffaellige = [];

  for (var t = 0; t < TABS.length; t++) {
    var sheet = fragensammlung.getSheetByName(TABS[t]);
    if (!sheet) continue;

    var daten = sheet.getDataRange().getValues();
    if (daten.length < 2) continue;

    var headers = daten[0].map(function (h) { return String(h).trim(); });
    var typCol = headers.indexOf('typ');
    var idCol = headers.indexOf('id');
    var fragetextCol = headers.indexOf('fragetext');
    var typDatenCol = headers.indexOf('typDaten');
    var optionenCol = headers.indexOf('optionen');
    var geloeschtCol = headers.indexOf('geloescht_am');
    if (typCol < 0) continue;

    for (var i = 1; i < daten.length; i++) {
      if (String(daten[i][typCol]).trim() !== 'mc') continue;
      if (geloeschtCol >= 0 && String(daten[i][geloeschtCol] || '').trim()) continue;

      var optionen = leseMcOptionen_(daten[i], typDatenCol, optionenCol);
      if (!optionen || optionen.length < 2) continue;

      gesamtMc++;
      summeOptionen += optionen.length;

      var korrekte = optionen.filter(function (o) { return o && o.korrekt; });
      if (korrekte.length !== 1) continue; // Mehrfachauswahl: Längen-Muster nicht aussagekräftig
      einfachauswahl++;

      var korrektLen = textLaenge_(korrekte[0].text);
      var distraktoren = optionen.filter(function (o) { return !(o && o.korrekt); });
      var distraktorLaengen = distraktoren.map(function (o) { return textLaenge_(o && o.text); });
      var distraktorMax = Math.max.apply(null, distraktorLaengen);
      var distraktorMin = Math.min.apply(null, distraktorLaengen);

      summeKorrektLen += korrektLen;
      for (var d = 0; d < distraktorLaengen.length; d++) {
        summeDistraktorLen += distraktorLaengen[d];
        anzahlDistraktoren++;
      }

      if (korrektLen > distraktorMax) {
        korrektLaengste++;
        auffaellige.push({
          tab: TABS[t],
          id: String(daten[i][idCol] || ''),
          fragetext: kurz_(daten[i][fragetextCol]),
          korrektLen: korrektLen,
          distraktorMax: distraktorMax,
          delta: korrektLen - distraktorMax,
        });
      } else if (korrektLen < distraktorMin) {
        korrektKuerzeste++;
      }
    }
  }

  // --- Report ---
  var oOptionen = gesamtMc > 0 ? (summeOptionen / gesamtMc) : 0;
  var zufallProzent = oOptionen > 0 ? (100 / oOptionen) : 0;
  var laengsteProzent = einfachauswahl > 0 ? (korrektLaengste / einfachauswahl * 100) : 0;
  var kuerzesteProzent = einfachauswahl > 0 ? (korrektKuerzeste / einfachauswahl * 100) : 0;
  var oKorrekt = einfachauswahl > 0 ? (summeKorrektLen / einfachauswahl) : 0;
  var oDistraktor = anzahlDistraktoren > 0 ? (summeDistraktorLen / anzahlDistraktoren) : 0;

  Logger.log('=== MC-Audit: "längste Antwort = korrekt" ===');
  Logger.log('MC-Fragen gesamt (>= 2 Optionen): ' + gesamtMc);
  Logger.log('davon Einfachauswahl (genau 1 korrekt): ' + einfachauswahl);
  Logger.log('Ø Optionen pro Frage: ' + oOptionen.toFixed(1));
  Logger.log('');
  Logger.log('Korrekte = strikt längste Option: ' + korrektLaengste
    + ' / ' + einfachauswahl + ' (' + laengsteProzent.toFixed(1) + '%)');
  Logger.log('Zufalls-Erwartung (kein Muster): ~' + zufallProzent.toFixed(1) + '%');
  Logger.log('Korrekte = strikt kürzeste Option: ' + korrektKuerzeste
    + ' (' + kuerzesteProzent.toFixed(1) + '%, zum Vergleich)');
  Logger.log('');
  Logger.log('Ø Zeichenlänge korrekte Antwort: ' + oKorrekt.toFixed(0));
  Logger.log('Ø Zeichenlänge Distraktoren:     ' + oDistraktor.toFixed(0));
  if (oDistraktor > 0) {
    Logger.log('Verhältnis korrekt/Distraktor:   ' + (oKorrekt / oDistraktor).toFixed(2) + 'x');
  }
  Logger.log('');

  var bewertung;
  var maxAbweichung = Math.max(laengsteProzent, kuerzesteProzent);
  if (maxAbweichung > zufallProzent * 1.5) {
    bewertung = 'AUFFÄLLIG — die Länge verrät die Korrektheit (längste oder kürzeste Option deutlich über Zufall).';
  } else if (maxAbweichung > zufallProzent * 1.2) {
    bewertung = 'LEICHT ERHÖHT — überprüfenswert.';
  } else {
    bewertung = 'UNAUFFÄLLIG — kein systematisches Längen-Muster (weder längste noch kürzeste).';
  }
  Logger.log('Befund: ' + bewertung);
  Logger.log('');

  auffaellige.sort(function (a, b) { return b.delta - a.delta; });
  Logger.log('--- Auffällige Fragen (korrekte strikt am längsten, nach Abstand sortiert) ---');
  if (auffaellige.length === 0) {
    Logger.log('(keine)');
  } else {
    for (var f = 0; f < auffaellige.length; f++) {
      var x = auffaellige[f];
      Logger.log(x.tab + ' | ' + x.id + ' | +' + x.delta + ' Z. (korrekt '
        + x.korrektLen + ' vs. Distraktor max ' + x.distraktorMax + ') | ' + x.fragetext);
    }
  }
}

/**
 * DIAGNOSE: Multi-Choice-MC — verrät die Länge einer Option ihre Korrektheit?
 *
 * Prüft alle MC-Fragen mit >= 2 korrekten Optionen (Mehrfachauswahl) darauf, ob
 * die korrekten Optionen im Schnitt länger sind als die Distraktoren — ein Tell
 * nach dem Muster "die langen Optionen anklicken".
 *
 * Ausgabe: Logger → Ansicht > Protokolle.
 */
function diagnoseMcMultiLaenge() {
  var FRAGENSAMMLUNG_ID = '1ASSRv7mSpmyD22PAMUJ8iekHwuamYkHpy9E6yxWNIVs';
  var TABS = ['BWL', 'VWL', 'Recht', 'Informatik'];

  var fragensammlung = SpreadsheetApp.openById(FRAGENSAMMLUNG_ID);

  var gesamtMulti = 0;
  var summeKorrektLen = 0;
  var anzahlKorrekt = 0;
  var summeDistraktorLen = 0;
  var anzahlDistraktor = 0;
  var frageKorrektLaenger = 0;  // Fragen, deren Ø-korrekt > Ø-Distraktor

  for (var t = 0; t < TABS.length; t++) {
    var sheet = fragensammlung.getSheetByName(TABS[t]);
    if (!sheet) continue;

    var daten = sheet.getDataRange().getValues();
    if (daten.length < 2) continue;

    var headers = daten[0].map(function (h) { return String(h).trim(); });
    var typCol = headers.indexOf('typ');
    var typDatenCol = headers.indexOf('typDaten');
    var optionenCol = headers.indexOf('optionen');
    var geloeschtCol = headers.indexOf('geloescht_am');
    if (typCol < 0) continue;

    for (var i = 1; i < daten.length; i++) {
      if (String(daten[i][typCol]).trim() !== 'mc') continue;
      if (geloeschtCol >= 0 && String(daten[i][geloeschtCol] || '').trim()) continue;

      var optionen = leseMcOptionen_(daten[i], typDatenCol, optionenCol);
      if (!optionen || optionen.length < 2) continue;

      var korrekte = optionen.filter(function (o) { return o && o.korrekt; });
      if (korrekte.length < 2) continue; // nur Mehrfachauswahl
      gesamtMulti++;

      var distraktoren = optionen.filter(function (o) { return !(o && o.korrekt); });
      if (distraktoren.length === 0) continue;

      var kSum = 0, dSum = 0;
      for (var k = 0; k < korrekte.length; k++) {
        var kl = textLaenge_(korrekte[k].text);
        kSum += kl; summeKorrektLen += kl; anzahlKorrekt++;
      }
      for (var d = 0; d < distraktoren.length; d++) {
        var dl = textLaenge_(distraktoren[d].text);
        dSum += dl; summeDistraktorLen += dl; anzahlDistraktor++;
      }
      if ((kSum / korrekte.length) > (dSum / distraktoren.length)) frageKorrektLaenger++;
    }
  }

  var oKorrekt = anzahlKorrekt > 0 ? (summeKorrektLen / anzahlKorrekt) : 0;
  var oDistraktor = anzahlDistraktor > 0 ? (summeDistraktorLen / anzahlDistraktor) : 0;
  var verhaeltnis = oDistraktor > 0 ? (oKorrekt / oDistraktor) : 0;
  var frageProzent = gesamtMulti > 0 ? (frageKorrektLaenger / gesamtMulti * 100) : 0;

  Logger.log('=== MC-Audit: Multi-Choice — Länge vs. Korrektheit ===');
  Logger.log('Multi-Choice-MC gesamt (>= 2 korrekt): ' + gesamtMulti);
  Logger.log('Ø Zeichenlänge korrekte Optionen:   ' + oKorrekt.toFixed(0));
  Logger.log('Ø Zeichenlänge Distraktoren:        ' + oDistraktor.toFixed(0));
  Logger.log('Verhältnis korrekt/Distraktor:      ' + verhaeltnis.toFixed(2) + 'x');
  Logger.log('Fragen mit Ø-korrekt > Ø-Distraktor: ' + frageKorrektLaenger
    + ' / ' + gesamtMulti + ' (' + frageProzent.toFixed(1) + '%)');
  Logger.log('');

  var bewertung;
  if (verhaeltnis > 1.3 || frageProzent > 70) {
    bewertung = 'AUFFÄLLIG — korrekte Optionen sind systematisch länger. '
      + 'Multi-MC-Sanierung als Folge-Projekt aufsetzen.';
  } else if (verhaeltnis > 1.15 || frageProzent > 60) {
    bewertung = 'LEICHT ERHÖHT — überprüfenswert.';
  } else {
    bewertung = 'UNAUFFÄLLIG — kein systematisches Längen-Muster bei Multi-MC.';
  }
  Logger.log('Befund: ' + bewertung);
}

/** Liest die MC-Optionen einer Zeile: zuerst typDaten.optionen, sonst optionen-Spalte. */
function leseMcOptionen_(row, typDatenCol, optionenCol) {
  if (typDatenCol >= 0) {
    var td = sicherJsonParse_(row[typDatenCol]);
    if (td && Array.isArray(td.optionen)) return td.optionen;
  }
  if (optionenCol >= 0) {
    var direkt = sicherJsonParse_(row[optionenCol]);
    if (Array.isArray(direkt)) return direkt;
  }
  return null;
}

/** JSON-Parse, das niemals wirft. Objekte/Arrays werden durchgereicht. */
function sicherJsonParse_(wert) {
  if (!wert) return null;
  if (typeof wert === 'object') return wert;
  try {
    return JSON.parse(String(wert));
  } catch (e) {
    return null;
  }
}

/** Getrimmte Zeichenlänge eines Optionstexts (0 bei fehlendem Text). */
function textLaenge_(text) {
  return String(text || '').trim().length;
}

/** Kürzt einen Fragetext für die Log-Ausgabe. */
function kurz_(text) {
  var s = String(text || '').replace(/\s+/g, ' ').trim();
  return s.length > 70 ? s.slice(0, 70) + '…' : s;
}
