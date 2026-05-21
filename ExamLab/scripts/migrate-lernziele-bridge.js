/**
 * MIGRATION: Lernziele-Backend-Bridge.
 *
 * Führt die Lehrplanziele-Altdaten (LEHRPLAN_SHEET_ID) in den Lernziele-Tab
 * (FRAGENSAMMLUNG_ID) zusammen, dedupliziert über (fach, text)-Exaktmatch und
 * schreibt die lernzielIds-Referenzen der Fragen auf die Survivor-IDs um.
 *
 * In ein Apps-Script-Projekt kopieren, das Zugriff auf BEIDE Tabellen hat,
 * und migriereLernzieleBridge() ausführen.
 *
 * SICHERHEIT: DRY_RUN ist DEFAULT (true). Vorher: Backup beider Tabellen.
 * Spec: ExamLab/docs/superpowers/specs/2026-05-21-lernziele-backend-bridge-design.md
 */

var DRY_RUN = true;  // <-- Auf false setzen für echtes Schreiben!

var MIG_FRAGENSAMMLUNG_ID = '1ASSRv7mSpmyD22PAMUJ8iekHwuamYkHpy9E6yxWNIVs';
var MIG_LEHRPLAN_ID = '1x3p_-_GjP25JvmCASh2TQSg0EhE0BD3MtHIy2xpo3Xo';
var MIG_TABS = ['BWL', 'VWL', 'Recht', 'Informatik'];
var MIG_HEADERS = ['id', 'fach', 'thema', 'unterthema', 'text', 'bloom', 'poolId', 'aktiv'];

function migriereLernzieleBridge() {
  var kombiniert = [];

  // 1. Bestehende Lernziele-Zeilen lesen (Quelle 'lernziele')
  var fragenSs = SpreadsheetApp.openById(MIG_FRAGENSAMMLUNG_ID);
  var lzSheet = fragenSs.getSheetByName('Lernziele');
  var ausLernziele = 0;
  if (lzSheet) {
    var lzRows = leseAlsObjekte_(lzSheet);
    for (var a = 0; a < lzRows.length; a++) {
      kombiniert.push(zuKanonisch_(lzRows[a], 'lernziele'));
      ausLernziele++;
    }
  }

  // 2. Lehrplanziele lesen (Quelle 'lehrplan')
  var ausLehrplan = 0;
  try {
    var lehrplanSheet = SpreadsheetApp.openById(MIG_LEHRPLAN_ID).getSheetByName('Lehrplanziele');
    if (lehrplanSheet) {
      var lpRows = leseAlsObjekte_(lehrplanSheet);
      for (var b = 0; b < lpRows.length; b++) {
        kombiniert.push(zuKanonisch_(lpRows[b], 'lehrplan'));
        ausLehrplan++;
      }
    }
  } catch (e) {
    Logger.log('Lehrplanziele nicht lesbar (übersprungen): ' + e.message);
  }

  // 3. Dedup über (fach, text)
  var gruppen = {};
  for (var c = 0; c < kombiniert.length; c++) {
    var lz = kombiniert[c];
    var key = (lz.fach || '') + '\u0000' + (lz.text || '');
    if (!gruppen[key]) gruppen[key] = [];
    gruppen[key].push(lz);
  }

  var survivors = [];
  var idRemap = {};   // verworfeneId → SurvivorId
  var merges = 0;
  for (var g in gruppen) {
    var liste = gruppen[g];
    var survivor = liste[0];
    for (var s = 1; s < liste.length; s++) {
      if (besser_(liste[s], survivor)) survivor = liste[s];
    }
    survivors.push(survivor);
    for (var d = 0; d < liste.length; d++) {
      if (liste[d].id !== survivor.id) {
        idRemap[liste[d].id] = survivor.id;
        merges++;
      }
    }
  }

  // 4. Frage-Referenzen umschreiben
  var refUmschreibungen = 0;
  for (var t = 0; t < MIG_TABS.length; t++) {
    var sheet = fragenSs.getSheetByName(MIG_TABS[t]);
    if (!sheet) continue;
    var daten = sheet.getDataRange().getValues();
    if (daten.length < 2) continue;
    var headers = daten[0].map(function (h) { return String(h).trim(); });
    var lzIdx = headers.indexOf('lernzielIds');
    if (lzIdx < 0) continue;
    for (var i = 1; i < daten.length; i++) {
      var raw = String(daten[i][lzIdx] || '');
      if (!raw) continue;
      var ids = raw.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      var neu = [];
      var gesehen = {};
      var geaendert = false;
      for (var j = 0; j < ids.length; j++) {
        var ziel = idRemap[ids[j]] || ids[j];
        if (ziel !== ids[j]) geaendert = true;
        if (!gesehen[ziel]) { gesehen[ziel] = true; neu.push(ziel); }
        else geaendert = true;
      }
      if (geaendert) {
        refUmschreibungen++;
        if (!DRY_RUN) sheet.getRange(i + 1, lzIdx + 1).setValue(neu.join(','));
      }
    }
  }

  // 5. Lernziele-Tab neu schreiben
  if (!DRY_RUN) {
    if (!lzSheet) {
      lzSheet = fragenSs.insertSheet('Lernziele');
    } else {
      lzSheet.clearContents();
    }
    var ausgabe = [MIG_HEADERS];
    for (var r = 0; r < survivors.length; r++) {
      var sv = survivors[r];
      ausgabe.push([sv.id, sv.fach, sv.thema, sv.unterthema, sv.text, sv.bloom, sv.poolId, sv.aktiv]);
    }
    lzSheet.getRange(1, 1, ausgabe.length, MIG_HEADERS.length).setValues(ausgabe);
    lzSheet.setFrozenRows(1);
  }

  // 6. Report
  Logger.log('=== MIGRATION Lernziele-Bridge — ' + (DRY_RUN ? 'DRY-RUN' : 'ECHT') + ' ===');
  Logger.log('Aus Lernziele-Tab gelesen: ' + ausLernziele);
  Logger.log('Aus Lehrplanziele gelesen: ' + ausLehrplan);
  Logger.log('Dedup-Merges (verworfene IDs): ' + merges);
  Logger.log('Survivor-Lernziele (finale Zeilen): ' + survivors.length);
  Logger.log('Fragen mit umgeschriebenen lernzielIds: ' + refUmschreibungen);
  if (DRY_RUN) Logger.log('DRY_RUN=true — nichts geschrieben. Auf false setzen für echt.');
}

/** Liest ein Sheet als Array von Objekten, gekeyt nach (getrimmtem) Header. */
function leseAlsObjekte_(sheet) {
  var daten = sheet.getDataRange().getValues();
  if (daten.length < 2) return [];
  var headers = daten[0].map(function (h) { return String(h).trim(); });
  var rows = [];
  for (var i = 1; i < daten.length; i++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) obj[headers[c]] = daten[i][c];
    rows.push(obj);
  }
  return rows;
}

/** Mappt eine Roh-Zeile (Lernziele oder Lehrplanziele) auf das kanonische Schema. */
function zuKanonisch_(row, quelle) {
  var aktivRaw = row.aktiv;
  var aktiv = (aktivRaw === undefined || aktivRaw === '' || String(aktivRaw) !== 'false')
    ? 'true' : 'false';
  return {
    id: String(row.id || ''),
    fach: String(row.fach || ''),
    thema: String(row.thema || ''),
    unterthema: String(row.unterthema || ''),
    text: String(row.text || ''),
    bloom: String(row.bloom || ''),
    poolId: String(row.poolId || ''),
    aktiv: aktiv,
    _quelle: quelle,
  };
}

/** Survivor-Präferenz: native Lernziele-Zeile vor Lehrplan; sonst mehr gefüllte Felder. */
function besser_(kandidat, aktuell) {
  if (kandidat._quelle === 'lernziele' && aktuell._quelle !== 'lernziele') return true;
  if (kandidat._quelle !== 'lernziele' && aktuell._quelle === 'lernziele') return false;
  return gefuellt_(kandidat) > gefuellt_(aktuell);
}

function gefuellt_(lz) {
  var n = 0;
  if (lz.unterthema) n++;
  if (lz.bloom) n++;
  if (lz.poolId) n++;
  return n;
}
