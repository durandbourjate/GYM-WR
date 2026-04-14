/**
 * DIAGNOSE: FiBu-Fragen in der Fragenbank prüfen
 *
 * Kopiere diese Funktion in den Apps Script Editor und führe sie aus.
 * Sie zeigt alle FiBu-Fragen (buchungssatz, bilanzstruktur, tkonto, kontenbestimmung)
 * und prüft ob die strukturierten Musterlösungen (typDaten) vorhanden sind.
 *
 * Ausgabe: Logger → Ansicht > Logs
 */

function diagnoseFibuFragen() {
  var FRAGENBANK_ID = '1ASSRv7mSpmyD22PAMUJ8iekHwuamYkHpy9E6yxWNIVs';
  var fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
  var tabs = ['BWL', 'VWL', 'Recht', 'Informatik'];
  var fibuTypen = ['buchungssatz', 'tkonto', 'bilanzstruktur', 'kontenbestimmung'];

  var ergebnis = [];

  for (var t = 0; t < tabs.length; t++) {
    var sheet = fragenbank.getSheetByName(tabs[t]);
    if (!sheet) continue;

    var daten = sheet.getDataRange().getValues();
    if (daten.length < 2) continue;

    var headers = daten[0].map(function(h) { return String(h).trim(); });
    var typCol = headers.indexOf('typ');
    var idCol = headers.indexOf('id');
    var typDatenCol = headers.indexOf('typDaten');
    var musterlosungCol = headers.indexOf('musterlosung');
    var fragetextCol = headers.indexOf('fragetext');
    var themaCol = headers.indexOf('thema');
    var unterthemaCol = headers.indexOf('unterthema');

    if (typCol < 0 || typDatenCol < 0) continue;

    for (var i = 1; i < daten.length; i++) {
      var typ = String(daten[i][typCol]).trim();
      if (fibuTypen.indexOf(typ) < 0) continue;

      var id = idCol >= 0 ? String(daten[i][idCol]) : '?';
      var thema = themaCol >= 0 ? String(daten[i][themaCol]) : '';
      var unterthema = unterthemaCol >= 0 ? String(daten[i][unterthemaCol]) : '';
      var musterlosung = musterlosungCol >= 0 ? String(daten[i][musterlosungCol]) : '';
      var fragetext = fragetextCol >= 0 ? String(daten[i][fragetextCol]).substring(0, 80) : '';
      var typDatenRaw = String(daten[i][typDatenCol]);

      var typDaten = {};
      try { typDaten = JSON.parse(typDatenRaw); } catch(e) { typDaten = {}; }

      var status = '';
      var fehlt = [];

      switch(typ) {
        case 'buchungssatz':
          var buchungen = typDaten.buchungen || [];
          if (buchungen.length === 0) fehlt.push('buchungen LEER');
          else status = buchungen.length + ' Buchung(en)';
          if (!typDaten.kontenauswahl) fehlt.push('kontenauswahl fehlt');
          break;

        case 'tkonto':
          var konten = typDaten.konten || [];
          if (konten.length === 0) fehlt.push('konten LEER');
          else {
            var ohneEintraege = konten.filter(function(k) { return !k.eintraege || k.eintraege.length === 0; });
            if (ohneEintraege.length > 0) fehlt.push(ohneEintraege.length + ' Konto(en) ohne Einträge');
            else status = konten.length + ' Konto(en) OK';
          }
          break;

        case 'bilanzstruktur':
          var kms = typDaten.kontenMitSaldi || [];
          var loesung = typDaten.loesung || {};
          if (kms.length === 0) fehlt.push('kontenMitSaldi LEER');
          else status = kms.length + ' Konten';
          if (!loesung.bilanz && !loesung.erfolgsrechnung) fehlt.push('loesung LEER');
          else {
            if (loesung.bilanz) {
              var aktGruppen = (loesung.bilanz.aktivSeite || {}).gruppen || [];
              var pasGruppen = (loesung.bilanz.passivSeite || {}).gruppen || [];
              var alleKonten = aktGruppen.concat(pasGruppen).reduce(function(acc, g) { return acc.concat(g.konten || []); }, []);
              if (alleKonten.length === 0) fehlt.push('loesung: Gruppen ohne Konten');
              else status += ', ' + alleKonten.length + ' Konten in Gruppen';
            }
          }
          break;

        case 'kontenbestimmung':
          var aufgaben = typDaten.aufgaben || [];
          if (aufgaben.length === 0) fehlt.push('aufgaben LEER');
          else {
            var ohneAntworten = aufgaben.filter(function(a) { return !a.erwarteteAntworten || a.erwarteteAntworten.length === 0; });
            if (ohneAntworten.length > 0) fehlt.push(ohneAntworten.length + ' Aufgabe(n) ohne erwarteteAntworten');
            else status = aufgaben.length + ' Aufgabe(n) OK';
          }
          break;
      }

      ergebnis.push({
        tab: tabs[t],
        zeile: i + 1,
        id: id,
        typ: typ,
        thema: thema,
        unterthema: unterthema,
        fragetext: fragetext,
        musterlosung: musterlosung.substring(0, 120),
        status: fehlt.length > 0 ? '❌ ' + fehlt.join(', ') : '✅ ' + status,
        typDatenRaw: typDatenRaw.substring(0, 200),
      });
    }
  }

  // Ausgabe
  Logger.log('=== FiBu-Fragen Diagnose ===');
  Logger.log('Gefunden: ' + ergebnis.length + ' FiBu-Fragen');
  Logger.log('');

  var kaputt = ergebnis.filter(function(e) { return e.status.indexOf('❌') >= 0; });
  var ok = ergebnis.filter(function(e) { return e.status.indexOf('✅') >= 0; });

  Logger.log('--- PROBLEME (' + kaputt.length + ') ---');
  for (var k = 0; k < kaputt.length; k++) {
    var e = kaputt[k];
    Logger.log('[' + e.tab + ' Z' + e.zeile + '] ' + e.typ + ' | ' + e.id);
    Logger.log('  Thema: ' + e.thema + ' > ' + e.unterthema);
    Logger.log('  Frage: ' + e.fragetext);
    Logger.log('  Musterlösung: ' + e.musterlosung);
    Logger.log('  Status: ' + e.status);
    Logger.log('  typDaten: ' + e.typDatenRaw);
    Logger.log('');
  }

  Logger.log('--- OK (' + ok.length + ') ---');
  for (var o = 0; o < ok.length; o++) {
    var e = ok[o];
    Logger.log('[' + e.tab + ' Z' + e.zeile + '] ' + e.typ + ' | ' + e.id + ' | ' + e.status);
  }

  return ergebnis;
}
