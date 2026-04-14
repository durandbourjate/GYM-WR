/**
 * MIGRATION: FiBu-Fragen auf aktuelles Format bringen (E1-Fix).
 *
 * Führt drei Reparaturen durch:
 * 1. Buchungssatz: altes Format (sollKonten[]/habenKonten[]) → vereinfachtes
 *    Format (sollKonto/habenKonto/betrag). Bei zusammengesetzten Buchungen
 *    wird eine Zeile pro Soll/Haben-Paar erstellt.
 * 2. Bilanzstruktur: gruppen[].positionen[] (Objekte mit konto/name/betrag)
 *    → gruppen[].konten (String-Array). Die Beträge werden nach
 *    kontenMitSaldi ausgelagert, falls dort fehlend.
 * 3. Alle FiBu-Typen: fehlende Konten in kontenauswahl.konten ergänzen,
 *    falls modus === 'eingeschraenkt'.
 *
 * SICHERHEIT:
 * - Dry-Run ist DEFAULT (DRY_RUN = true). Setze auf false für echtes Schreiben.
 * - Vor Ausführung: Sheet-Backup machen (Datei → Kopie erstellen).
 *
 * Ausführung: Im Apps Script Editor kopieren und migriereFibuFragen() starten.
 */

var MIGRATE_FRAGENBANK_ID = '1ASSRv7mSpmyD22PAMUJ8iekHwuamYkHpy9E6yxWNIVs';
var DRY_RUN = true;  // <-- Auf false setzen für echtes Schreiben!

function migriereFibuFragen() {
  var fragenbank = SpreadsheetApp.openById(MIGRATE_FRAGENBANK_ID);
  var tabs = ['BWL', 'VWL', 'Recht', 'Informatik'];
  var fibuTypen = ['buchungssatz', 'tkonto', 'bilanzstruktur', 'kontenbestimmung'];

  var stats = { gesamt: 0, geaendert: 0, fehler: 0, details: [] };

  for (var t = 0; t < tabs.length; t++) {
    var sheet = fragenbank.getSheetByName(tabs[t]);
    if (!sheet) continue;

    var daten = sheet.getDataRange().getValues();
    if (daten.length < 2) continue;

    var headers = daten[0].map(function(h) { return String(h).trim(); });
    var typCol = headers.indexOf('typ');
    var idCol = headers.indexOf('id');
    var typDatenCol = headers.indexOf('typDaten');
    if (typCol < 0 || typDatenCol < 0) continue;

    for (var i = 1; i < daten.length; i++) {
      var typ = String(daten[i][typCol]).trim();
      if (fibuTypen.indexOf(typ) < 0) continue;
      stats.gesamt++;

      var id = idCol >= 0 ? String(daten[i][idCol]) : '?';
      var typDaten = {};
      try { typDaten = JSON.parse(String(daten[i][typDatenCol])) || {}; } catch(e) {
        stats.fehler++;
        stats.details.push('[' + tabs[t] + ' Z' + (i+1) + '] ' + id + ': typDaten unparseable');
        continue;
      }

      var changed = false;
      var aenderungen = [];

      // 1. Buchungssatz: altes → vereinfachtes Format
      if (typ === 'buchungssatz' && Array.isArray(typDaten.buchungen)) {
        var neueBuchungen = [];
        typDaten.buchungen.forEach(function(b) {
          var hasOld = Array.isArray(b.sollKonten) || Array.isArray(b.habenKonten);
          var hasNew = typeof b.sollKonto === 'string' && typeof b.habenKonto === 'string';
          // 3. Format: {soll, haben, betrag} — nur Feldnamen kürzer
          var hasShort = !hasNew && typeof b.soll === 'string' && typeof b.haben === 'string';
          if (hasNew) {
            neueBuchungen.push({
              id: b.id || ('b_' + Utilities.getUuid().substring(0, 8)),
              sollKonto: b.sollKonto,
              habenKonto: b.habenKonto,
              betrag: Number(b.betrag) || 0,
            });
          } else if (hasShort) {
            neueBuchungen.push({
              id: b.id || ('b_' + Utilities.getUuid().substring(0, 8)),
              sollKonto: String(b.soll),
              habenKonto: String(b.haben),
              betrag: Number(b.betrag) || 0,
            });
            changed = true;
            aenderungen.push('Buchungssatz {soll,haben}→{sollKonto,habenKonto}');
          } else if (hasOld) {
            // Zusammengesetzte Buchung aufspalten: eine Zeile pro Soll×Haben-Paar
            var sollKs = b.sollKonten || [];
            var habenKs = b.habenKonten || [];
            if (sollKs.length === 1 && habenKs.length === 1) {
              neueBuchungen.push({
                id: b.id || ('b_' + Utilities.getUuid().substring(0, 8)),
                sollKonto: String(sollKs[0].kontonummer || ''),
                habenKonto: String(habenKs[0].kontonummer || ''),
                betrag: Number(sollKs[0].betrag || habenKs[0].betrag) || 0,
              });
            } else {
              // Zusammengesetzte Buchung: Kombinationen bilden mit minimalem Betrag je Paar
              sollKs.forEach(function(sk) {
                habenKs.forEach(function(hk) {
                  neueBuchungen.push({
                    id: 'b_' + Utilities.getUuid().substring(0, 8),
                    sollKonto: String(sk.kontonummer || ''),
                    habenKonto: String(hk.kontonummer || ''),
                    betrag: Number(Math.min(Number(sk.betrag) || 0, Number(hk.betrag) || 0)),
                  });
                });
              });
            }
            changed = true;
            aenderungen.push('Buchungssatz alt→neu');
          }
        });
        if (changed) typDaten.buchungen = neueBuchungen;
      }

      // 2. Bilanzstruktur: positionen[] → konten[]
      if (typ === 'bilanzstruktur' && typDaten.loesung && typDaten.loesung.bilanz) {
        if (!Array.isArray(typDaten.kontenMitSaldi)) typDaten.kontenMitSaldi = [];
        var kmsIndex = {};
        typDaten.kontenMitSaldi.forEach(function(k) { kmsIndex[String(k.kontonummer)] = k; });

        ['aktivSeite', 'passivSeite'].forEach(function(seite) {
          var s = typDaten.loesung.bilanz[seite];
          if (!s || !Array.isArray(s.gruppen)) return;
          s.gruppen.forEach(function(g) {
            if (Array.isArray(g.positionen) && !Array.isArray(g.konten)) {
              g.konten = g.positionen.map(function(p) {
                var nr = String(p.konto || p.kontonummer || '');
                // Betrag in kontenMitSaldi übernehmen, falls fehlend
                if (nr && !kmsIndex[nr] && typeof p.betrag === 'number') {
                  var neu = { kontonummer: nr, name: p.name || '', saldo: p.betrag };
                  typDaten.kontenMitSaldi.push(neu);
                  kmsIndex[nr] = neu;
                }
                return nr;
              }).filter(Boolean);
              delete g.positionen;
              changed = true;
              aenderungen.push('Bilanz ' + seite + ' positionen→konten');
            }
          });
        });
      }

      // 3. Alle FiBu: kontenauswahl.konten ergänzen
      if (typDaten.kontenauswahl && typDaten.kontenauswahl.modus === 'eingeschraenkt') {
        var benoetigt = [];
        if (typ === 'buchungssatz' && Array.isArray(typDaten.buchungen)) {
          typDaten.buchungen.forEach(function(b) {
            if (b.sollKonto) benoetigt.push(String(b.sollKonto));
            if (b.habenKonto) benoetigt.push(String(b.habenKonto));
          });
        } else if (typ === 'tkonto' && Array.isArray(typDaten.konten)) {
          typDaten.konten.forEach(function(k) {
            if (k.kontonummer) benoetigt.push(String(k.kontonummer));
            (k.eintraege || []).forEach(function(e) { if (e.gegenkonto) benoetigt.push(String(e.gegenkonto)); });
          });
        } else if (typ === 'kontenbestimmung' && Array.isArray(typDaten.aufgaben)) {
          typDaten.aufgaben.forEach(function(a) {
            (a.erwarteteAntworten || []).forEach(function(ea) { if (ea.kontonummer) benoetigt.push(String(ea.kontonummer)); });
          });
        }
        var bestehend = (typDaten.kontenauswahl.konten || []).map(function(k) {
          return typeof k === 'string' ? k : String((k && (k.nr || k.nummer || k.kontonummer)) || '');
        }).filter(Boolean);
        var set = {};
        bestehend.forEach(function(k) { set[k] = true; });
        var ergaenzt = [];
        benoetigt.forEach(function(k) {
          if (k && !set[k]) { ergaenzt.push(k); set[k] = true; }
        });
        if (ergaenzt.length > 0) {
          typDaten.kontenauswahl.konten = Object.keys(set);
          changed = true;
          aenderungen.push('kontenauswahl +' + ergaenzt.length + ' Konten (' + ergaenzt.join(',') + ')');
        }
      }

      if (changed) {
        stats.geaendert++;
        stats.details.push('[' + tabs[t] + ' Z' + (i+1) + '] ' + id + ' ' + typ + ': ' + aenderungen.join(' | '));
        if (!DRY_RUN) {
          sheet.getRange(i + 1, typDatenCol + 1).setValue(JSON.stringify(typDaten));
        }
      }
    }
  }

  Logger.log('=== FiBu-Migration ' + (DRY_RUN ? '(DRY RUN)' : '(LIVE)') + ' ===');
  Logger.log('FiBu-Fragen gesamt: ' + stats.gesamt);
  Logger.log('Geändert: ' + stats.geaendert);
  Logger.log('Fehler: ' + stats.fehler);
  Logger.log('');
  Logger.log('--- Details ---');
  stats.details.forEach(function(d) { Logger.log(d); });
  Logger.log('');
  if (DRY_RUN) {
    Logger.log('*** DRY RUN — KEINE Änderungen geschrieben. ***');
    Logger.log('*** Setze DRY_RUN = false für echtes Schreiben (vorher Backup!). ***');
  } else {
    Logger.log('*** LIVE-Migration abgeschlossen. ***');
  }

  return stats;
}
