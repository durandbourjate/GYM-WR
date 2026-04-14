/**
 * DIAGNOSE v2: FiBu-Fragen in der Fragenbank prüfen (erweitert um E1-Bugs).
 *
 * Prüft zusätzlich zu v1:
 * A) Dropdown-Konten-Abdeckung: Enthält kontenauswahl.konten alle in der Musterlösung
 *    verwendeten Konten? (Bug A: SuS kann korrektes Konto nicht wählen)
 * B) Format-Konflikt Buchungssatz: buchungen[].sollKonten[]/habenKonten[] (deprecated)
 *    vs. sollKonto/habenKonto (vereinfacht). (Bug B: korrekte Antwort als falsch)
 * C) Bilanzstruktur: gruppen[].positionen[] (deprecated) vs. gruppen[].konten (aktuell)
 *
 * Ausführung: Im Apps Script Editor kopieren und diagnoseFibuFragenV2() starten.
 * Ausgabe: Logger (Ansicht > Logs)
 */

function diagnoseFibuFragenV2() {
  var DIAG_FRAGENBANK_ID = '1ASSRv7mSpmyD22PAMUJ8iekHwuamYkHpy9E6yxWNIVs';
  var fragenbank = SpreadsheetApp.openById(DIAG_FRAGENBANK_ID);
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
    var themaCol = headers.indexOf('thema');
    var fragetextCol = headers.indexOf('fragetext');

    if (typCol < 0 || typDatenCol < 0) continue;

    for (var i = 1; i < daten.length; i++) {
      var typ = String(daten[i][typCol]).trim();
      if (fibuTypen.indexOf(typ) < 0) continue;

      var id = idCol >= 0 ? String(daten[i][idCol]) : '?';
      var thema = themaCol >= 0 ? String(daten[i][themaCol]) : '';
      var fragetext = fragetextCol >= 0 ? String(daten[i][fragetextCol]).substring(0, 80) : '';
      var typDaten = {};
      try { typDaten = JSON.parse(String(daten[i][typDatenCol])) || {}; } catch(e) {}

      var probleme = [];
      var verwendete = [];

      if (typ === 'buchungssatz') {
        var buchungen = typDaten.buchungen || [];
        buchungen.forEach(function(b, idx) {
          var istAlt = Array.isArray(b.sollKonten) || Array.isArray(b.habenKonten);
          var istNeu = typeof b.sollKonto === 'string' && typeof b.habenKonto === 'string';
          var istKurz = !istNeu && typeof b.soll === 'string' && typeof b.haben === 'string';
          if (istAlt && !istNeu) {
            probleme.push('B' + (idx + 1) + ': ALTES Format (sollKonten[]/habenKonten[])');
            (b.sollKonten || []).forEach(function(k) { if (k.kontonummer) verwendete.push(String(k.kontonummer)); });
            (b.habenKonten || []).forEach(function(k) { if (k.kontonummer) verwendete.push(String(k.kontonummer)); });
          } else if (istKurz) {
            probleme.push('B' + (idx + 1) + ': KURZES Format ({soll,haben} statt {sollKonto,habenKonto})');
            if (b.soll) verwendete.push(String(b.soll));
            if (b.haben) verwendete.push(String(b.haben));
          } else if (!istNeu) {
            probleme.push('B' + (idx + 1) + ': UNGÜLTIG — Felder: ' + Object.keys(b).join(',') + ' | JSON: ' + JSON.stringify(b).substring(0, 250));
          } else {
            if (b.sollKonto) verwendete.push(String(b.sollKonto));
            if (b.habenKonto) verwendete.push(String(b.habenKonto));
          }
        });
      } else if (typ === 'tkonto') {
        (typDaten.konten || []).forEach(function(k) {
          if (k.kontonummer) verwendete.push(String(k.kontonummer));
          (k.eintraege || []).forEach(function(e) { if (e.gegenkonto) verwendete.push(String(e.gegenkonto)); });
        });
      } else if (typ === 'kontenbestimmung') {
        (typDaten.aufgaben || []).forEach(function(a) {
          (a.erwarteteAntworten || []).forEach(function(ea) { if (ea.kontonummer) verwendete.push(String(ea.kontonummer)); });
        });
      } else if (typ === 'bilanzstruktur') {
        var loesung = typDaten.loesung || {};
        if (loesung.bilanz) {
          ['aktivSeite', 'passivSeite'].forEach(function(seite) {
            var s = loesung.bilanz[seite];
            if (!s) return;
            (s.gruppen || []).forEach(function(g, gi) {
              if (Array.isArray(g.positionen) && !Array.isArray(g.konten)) {
                probleme.push(seite + '.G' + (gi + 1) + ': ALTES Format (positionen[] statt konten[])');
              }
              (g.konten || []).forEach(function(n) { verwendete.push(String(n)); });
              (g.positionen || []).forEach(function(p) { if (p.konto) verwendete.push(String(p.konto)); });
            });
          });
        }
      }

      // Bug A: kontenauswahl-Abdeckung
      if (typDaten.kontenauswahl && typDaten.kontenauswahl.modus === 'eingeschraenkt') {
        var auswahl = (typDaten.kontenauswahl.konten || []).map(function(k) {
          return typeof k === 'string' ? k : String((k && (k.nr || k.nummer || k.kontonummer)) || '');
        }).filter(Boolean);
        var auswahlSet = {};
        auswahl.forEach(function(k) { auswahlSet[k] = true; });
        var fehlend = [];
        verwendete.forEach(function(k) { if (k && !auswahlSet[k]) fehlend.push(k); });
        if (fehlend.length > 0) {
          var uniq = {};
          fehlend.forEach(function(k) { uniq[k] = true; });
          probleme.push('Dropdown fehlen: ' + Object.keys(uniq).join(', '));
        }
      }

      ergebnis.push({
        tab: tabs[t],
        zeile: i + 1,
        id: id,
        typ: typ,
        thema: thema,
        fragetext: fragetext,
        probleme: probleme,
      });
    }
  }

  var kaputt = ergebnis.filter(function(e) { return e.probleme.length > 0; });

  Logger.log('=== FiBu-Diagnose v2 (E1) ===');
  Logger.log('Gesamt: ' + ergebnis.length + ' FiBu-Fragen, Probleme: ' + kaputt.length);
  Logger.log('');
  Logger.log('--- Fragen mit Problemen ---');
  kaputt.forEach(function(e) {
    Logger.log('[' + e.tab + ' Z' + e.zeile + '] ' + e.typ + ' | ' + e.id);
    Logger.log('  Thema: ' + e.thema);
    Logger.log('  Frage: ' + e.fragetext);
    Logger.log('  Probleme:');
    e.probleme.forEach(function(p) { Logger.log('    - ' + p); });
    Logger.log('');
  });

  return ergebnis;
}
