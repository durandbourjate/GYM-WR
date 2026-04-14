/**
 * REPAIR: FiBu-Fragen in der Fragenbank reparieren
 *
 * Behebt 14 kaputte FiBu-Fragen (Kontenbestimmung, T-Konto, Bilanzstruktur)
 * die im falschen Format gespeichert wurden.
 *
 * Kopiere diese Funktion in den Apps Script Editor und führe repairFibuFragen() aus.
 * Ausgabe: Logger → Ansicht > Logs
 *
 * DRY RUN: Standardmässig werden Änderungen NICHT geschrieben.
 *          Setze DRY_RUN = false um wirklich zu schreiben.
 */

function repairFibuFragen() {
  var DRY_RUN = true; // ← false setzen um wirklich zu reparieren

  var FRAGENBANK_ID = '1ASSRv7mSpmyD22PAMUJ8iekHwuamYkHpy9E6yxWNIVs';
  var fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
  var sheet = fragenbank.getSheetByName('BWL');
  if (!sheet) { Logger.log('ERROR: BWL-Tab nicht gefunden'); return; }

  var daten = sheet.getDataRange().getValues();
  var headers = daten[0].map(function(h) { return String(h).trim(); });
  var typCol = headers.indexOf('typ');
  var idCol = headers.indexOf('id');
  var typDatenCol = headers.indexOf('typDaten');

  if (typCol < 0 || typDatenCol < 0) { Logger.log('ERROR: Spalten fehlen'); return; }

  var repariert = 0;
  var fehler = 0;

  for (var i = 1; i < daten.length; i++) {
    var typ = String(daten[i][typCol]).trim();
    var id = String(daten[i][idCol]);
    var typDatenRaw = String(daten[i][typDatenCol]);
    var typDaten;
    try { typDaten = JSON.parse(typDatenRaw); } catch(e) { continue; }

    var neueTypDaten = null;

    switch(typ) {
      case 'kontenbestimmung':
        neueTypDaten = repairKontenbestimmung(typDaten, id);
        break;
      case 'tkonto':
        neueTypDaten = repairTKonto(typDaten, id);
        break;
      case 'bilanzstruktur':
        neueTypDaten = repairBilanzstruktur(typDaten, id);
        break;
    }

    if (neueTypDaten) {
      repariert++;
      Logger.log('');
      Logger.log('[Z' + (i+1) + '] ' + typ + ' | ' + id);
      Logger.log('  VORHER: ' + typDatenRaw.substring(0, 150));
      Logger.log('  NACHHER: ' + JSON.stringify(neueTypDaten).substring(0, 150));

      if (!DRY_RUN) {
        try {
          sheet.getRange(i + 1, typDatenCol + 1).setValue(JSON.stringify(neueTypDaten));
          Logger.log('  ✅ GESCHRIEBEN');
        } catch(e) {
          Logger.log('  ❌ FEHLER: ' + e.message);
          fehler++;
        }
      } else {
        Logger.log('  ⏸️ DRY RUN — nicht geschrieben');
      }
    }
  }

  Logger.log('');
  Logger.log('=== ERGEBNIS ===');
  Logger.log('Repariert: ' + repariert + (DRY_RUN ? ' (DRY RUN)' : ''));
  if (fehler > 0) Logger.log('Fehler: ' + fehler);
  if (DRY_RUN && repariert > 0) {
    Logger.log('');
    Logger.log('>>> Setze DRY_RUN = false und führe nochmals aus um zu schreiben.');
  }
}


// === KONTENBESTIMMUNG ===
// Problem: correct[] statt erwarteteAntworten[], konto statt kontonummer
function repairKontenbestimmung(typDaten, id) {
  if (!typDaten.aufgaben) return null;

  var brauchtFix = false;
  for (var a = 0; a < typDaten.aufgaben.length; a++) {
    var aufg = typDaten.aufgaben[a];
    if (aufg.correct && (!aufg.erwarteteAntworten || aufg.erwarteteAntworten.length === 0)) {
      brauchtFix = true;
      break;
    }
  }
  if (!brauchtFix) return null;

  var neueAufgaben = typDaten.aufgaben.map(function(aufg, idx) {
    if (aufg.erwarteteAntworten && aufg.erwarteteAntworten.length > 0) return aufg;

    var erwartete = (aufg.correct || []).map(function(c) {
      return {
        kontonummer: c.konto || c.kontonummer || '',
        seite: c.seite || '',
        kategorie: c.kategorie || ''
      };
    });

    return {
      id: aufg.id || (id + '-' + idx),
      text: aufg.text,
      erwarteteAntworten: erwartete
    };
  });

  return Object.assign({}, typDaten, { aufgaben: neueAufgaben });
}


// === T-KONTO ===
// Problem: correctSoll/correctHaben statt eintraege, nr statt kontonummer, ab statt anfangsbestand
function repairTKonto(typDaten, id) {
  if (!typDaten.konten) return null;

  var brauchtFix = false;
  for (var k = 0; k < typDaten.konten.length; k++) {
    var konto = typDaten.konten[k];
    if ((konto.correctSoll || konto.correctHaben) && (!konto.eintraege || konto.eintraege.length === 0)) {
      brauchtFix = true;
      break;
    }
  }
  if (!brauchtFix) return null;

  var neueKonten = typDaten.konten.map(function(konto, idx) {
    if (konto.eintraege && konto.eintraege.length > 0) return konto;

    var eintraege = [];
    var sollSumme = 0;
    var habenSumme = 0;

    // correctSoll → eintraege mit seite 'soll'
    (konto.correctSoll || []).forEach(function(e) {
      eintraege.push({
        seite: 'soll',
        gegenkonto: e.gegen || '',
        betrag: e.betrag || 0,
        buchungstext: e.text || ''
      });
      sollSumme += (e.betrag || 0);
    });

    // correctHaben → eintraege mit seite 'haben'
    (konto.correctHaben || []).forEach(function(e) {
      eintraege.push({
        seite: 'haben',
        gegenkonto: e.gegen || '',
        betrag: e.betrag || 0,
        buchungstext: e.text || ''
      });
      habenSumme += (e.betrag || 0);
    });

    // Anfangsbestand
    var ab = konto.ab || konto.anfangsbestand || 0;

    // Saldo berechnen: Aktiv-/Aufwandkonten: AB + Soll - Haben, sonst AB + Haben - Soll
    var nr = parseInt(konto.nr || konto.kontonummer || '0');
    var istAktivOderAufwand = (nr >= 1000 && nr < 2000) || (nr >= 4000 && nr < 7000);
    var saldoBetrag, saldoSeite;
    if (istAktivOderAufwand) {
      saldoBetrag = ab + sollSumme - habenSumme;
      saldoSeite = saldoBetrag >= 0 ? 'soll' : 'haben';
    } else {
      saldoBetrag = ab + habenSumme - sollSumme;
      saldoSeite = saldoBetrag >= 0 ? 'haben' : 'soll';
    }
    saldoBetrag = Math.abs(saldoBetrag);

    return {
      id: konto.id || ('tk-' + (konto.nr || konto.kontonummer || idx)),
      kontonummer: konto.nr || konto.kontonummer || '',
      anfangsbestand: ab,
      anfangsbestandVorgegeben: true,
      eintraege: eintraege,
      saldo: { betrag: saldoBetrag, seite: saldoSeite }
    };
  });

  // Bewertungsoptionen ergänzen falls fehlend
  var bewOpt = typDaten.bewertungsoptionen || {
    beschriftungSollHaben: false,
    kontenkategorie: false,
    zunahmeAbnahme: false,
    buchungenKorrekt: true,
    saldoKorrekt: true
  };

  return Object.assign({}, typDaten, { konten: neueKonten, bewertungsoptionen: bewOpt });
}


// === BILANZSTRUKTUR ===
// Problem: nr statt kontonummer, loesung fehlt
function repairBilanzstruktur(typDaten, id) {
  if (!typDaten.kontenMitSaldi || typDaten.kontenMitSaldi.length === 0) return null;

  // Prüfe ob loesung fehlt ODER kontonummer fehlt
  var brauchtLoesungFix = !typDaten.loesung || (!typDaten.loesung.bilanz && !typDaten.loesung.erfolgsrechnung);
  var brauchtNrFix = typDaten.kontenMitSaldi.some(function(k) { return k.nr && !k.kontonummer; });
  if (!brauchtLoesungFix && !brauchtNrFix) return null;

  // kontenMitSaldi: nr → kontonummer
  var neueKMS = typDaten.kontenMitSaldi.map(function(k) {
    return {
      kontonummer: k.kontonummer || k.nr || '',
      name: k.name || '',
      saldo: k.saldo || 0
    };
  });

  // loesung generieren basierend auf Kontenrahmen
  var aktivGruppen = {};
  var passivGruppen = {};
  var aktivSumme = 0;
  var passivSumme = 0;

  neueKMS.forEach(function(k) {
    var nr = parseInt(k.kontonummer);
    var name = k.name || '';
    var saldo = k.saldo;
    var isWB = name.indexOf('WB') >= 0 || name.indexOf('Wertberichtigung') >= 0;

    // Kontenklassifikation nach Schweizer KMU-Kontenrahmen
    var gruppe, seite;

    if (nr >= 1000 && nr < 1100) {
      gruppe = 'Flüssige Mittel'; seite = 'aktiv';
    } else if (nr >= 1100 && nr < 1200) {
      gruppe = 'Forderungen'; seite = 'aktiv';
    } else if (nr >= 1200 && nr < 1400) {
      gruppe = 'Vorräte'; seite = 'aktiv';
    } else if (nr >= 1400 && nr < 1500) {
      gruppe = 'Aktive Rechnungsabgrenzung'; seite = 'aktiv';
    } else if (nr >= 1500 && nr < 1700) {
      if (isWB) {
        // WB-Konten: Korrekturposten auf Aktivseite (negativer Betrag)
        gruppe = 'Sachanlagen'; seite = 'aktiv';
        saldo = -Math.abs(saldo); // WB wird subtrahiert
      } else {
        gruppe = 'Sachanlagen'; seite = 'aktiv';
      }
    } else if (nr >= 2000 && nr < 2400) {
      gruppe = 'Kurzfristiges Fremdkapital'; seite = 'passiv';
    } else if (nr >= 2400 && nr < 2800) {
      gruppe = 'Langfristiges Fremdkapital'; seite = 'passiv';
    } else if (nr >= 2800 && nr < 3000) {
      gruppe = 'Eigenkapital'; seite = 'passiv';
    } else {
      // Erfolgskonten in Bilanz? Ignorieren oder als Eigenkapital-Bestandteil
      Logger.log('  WARNUNG: Konto ' + k.kontonummer + ' (' + name + ') ist kein Bilanzkonto');
      return;
    }

    if (seite === 'aktiv') {
      if (!aktivGruppen[gruppe]) aktivGruppen[gruppe] = [];
      aktivGruppen[gruppe].push(k.kontonummer);
      aktivSumme += saldo;
    } else {
      if (!passivGruppen[gruppe]) passivGruppen[gruppe] = [];
      passivGruppen[gruppe].push(k.kontonummer);
      passivSumme += saldo;
    }
  });

  // Gruppen in definierter Reihenfolge
  var aktivReihenfolge = ['Flüssige Mittel', 'Forderungen', 'Vorräte', 'Aktive Rechnungsabgrenzung', 'Sachanlagen'];
  var passivReihenfolge = ['Kurzfristiges Fremdkapital', 'Langfristiges Fremdkapital', 'Eigenkapital'];

  var aktivGruppenArr = [];
  aktivReihenfolge.forEach(function(g) {
    if (aktivGruppen[g]) aktivGruppenArr.push({ label: g, konten: aktivGruppen[g] });
  });

  var passivGruppenArr = [];
  passivReihenfolge.forEach(function(g) {
    if (passivGruppen[g]) passivGruppenArr.push({ label: g, konten: passivGruppen[g] });
  });

  // Vereinfachung: Flüssige Mittel + Forderungen + Vorräte → Umlaufvermögen wenn gewünscht
  // Hier lassen wir die detaillierte Gruppierung — genauer für die Korrektur

  var bilanzsumme = Math.max(aktivSumme, passivSumme); // Sollte gleich sein

  var loesung = {
    bilanz: {
      aktivSeite: {
        label: 'Aktiven',
        gruppen: aktivGruppenArr
      },
      passivSeite: {
        label: 'Passiven',
        gruppen: passivGruppenArr
      },
      bilanzsumme: bilanzsumme
    }
  };

  // Bewertungsoptionen ergänzen falls fehlend
  var bewOpt = typDaten.bewertungsoptionen || {
    seitenbeschriftung: false,
    gruppenbildung: false,
    gruppenreihenfolge: false,
    kontenreihenfolge: false,
    betraegeKorrekt: true,
    zwischentotale: false,
    bilanzsummeOderGewinn: true,
    mehrstufigkeit: false
  };

  return Object.assign({}, typDaten, {
    kontenMitSaldi: neueKMS,
    loesung: loesung,
    bewertungsoptionen: bewOpt
  });
}
