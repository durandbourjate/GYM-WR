import { useState, useRef } from 'react';
import { usePlannerStore } from '../store/plannerStore';
import { COURSES } from '../data/courses';
import { WEEKS } from '../data/weeks';
import * as XLSX from 'xlsx';

// Legacy type labels for Excel import preview (indices match lessonType values)
const TYPE_LABELS = ['Andere', 'BWL', 'Recht/VWL', 'IN', 'Prüfung', 'Event', 'Ferien'];
import type { LessonType, LessonEntry } from '../types';

const WEEK_ORDER = WEEKS.map(w => w.w);

// LessonType detection from cell content
function detectLessonType(text: string): LessonType {
  const t = text.toLowerCase();
  if (!t || t === '-' || t === '—') return 0;
  if (/(ferien|auffahrt|pfingst)/.test(t)) return 6;
  if (/(prüfung|test|pw |prüf\.)/.test(t)) return 4;
  if (/(studienreise|sporttag|iw\d|besuchstag|tag d\.|fachschaftstag|schneesport|aufnahme|intensiv|orientierungslauf|konferenz|ma präs)/.test(t)) return 5;
  if (/(progr|krypto|rtpp|byod|vsc |excel|projekt|vortrag|darknet|metadaten|rastergr|vektorgr|gesichtser)/.test(t)) return 3;
  if (/(bwl|market|fibu|swot|porter|csr|standort|untern|st\. galler|selbstbeurteil|nwa)/.test(t)) return 1;
  if (/(recht|vwl|or at|grundr|miete|person|gesellsch|genossensch|sozial|sozv|bip|preis|lorenzkurve|staats|marktversagen|wohnungsm|elastiz|gefangenen|ökon|dollar|gerechtigkeit|iconomix|ungleich|kosten-gewinn)/.test(t)) return 2;
  return 0;
}

interface ColMapping {
  excelCol: number;      // 0-based index in sheet
  excelHeader: string;   // header text from Excel
  courseCol: number | null; // mapped to course.col, null = skip
}

interface RowMapping {
  excelRow: number;
  weekW: string | null;  // mapped to week, null = skip
  firstCell: string;     // content of first cell for display
}

interface ImportPreview {
  weekW: string;
  col: number;
  title: string;
  type: LessonType;
  isNew: boolean;        // true if cell is currently empty
}

export function ExcelImport({ onClose }: { onClose: () => void }) {
  const { weekData, setWeekData, pushUndo, updateLessonDetail } = usePlannerStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'done'>('upload');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [rawData, setRawData] = useState<string[][]>([]);
  const [colMappings, setColMappings] = useState<ColMapping[]>([]);
  const [rowMappings, setRowMappings] = useState<RowMapping[]>([]);
  const [preview, setPreview] = useState<ImportPreview[]>([]);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [importResult, setImportResult] = useState<{ added: number; updated: number } | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);

  // Step 1: File upload & sheet selection
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      setWorkbook(wb);
      setSheetNames(wb.SheetNames);
      setSelectedSheet(wb.SheetNames[0]);
      loadSheet(wb, wb.SheetNames[0]);
    };
    reader.readAsArrayBuffer(file);
  };

  const loadSheet = (wb: XLSX.WorkBook, name: string) => {
    const ws = wb.Sheets[name];
    const json: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    setRawData(json);
    autoMapColumns(json);
    autoMapRows(json);
    setStep('map');
  };

  // Auto-map columns by matching header text to course identifiers
  const autoMapColumns = (data: string[][]) => {
    if (data.length === 0) return;
    const headerRow = data[0];
    const mappings: ColMapping[] = headerRow.map((header, idx) => {
      const h = String(header).toLowerCase().trim();
      // Try to match against course class names, days, etc.
      let matched: number | null = null;
      for (const c of COURSES) {
        const cls = c.cls.toLowerCase();
        const dayMatch = c.day.toLowerCase();
        if (h.includes(cls) || h === `${cls} ${dayMatch}` || h === `${dayMatch} ${cls}`) {
          matched = c.col;
          break;
        }
      }
      return { excelCol: idx, excelHeader: String(header), courseCol: matched };
    });
    setColMappings(mappings);
  };

  // Auto-map rows by detecting week numbers (KW xx patterns or just numbers 1-52)
  const autoMapRows = (data: string[][]) => {
    const mappings: RowMapping[] = [];
    for (let i = 1; i < data.length; i++) { // skip header
      const firstCell = String(data[i][0] || '').trim();
      let weekW: string | null = null;
      // Try KW patterns
      const kwMatch = firstCell.match(/(?:kw|woche)\s*(\d{1,2})/i);
      if (kwMatch) {
        weekW = kwMatch[1].padStart(2, '0');
      } else {
        // Try pure number
        const num = parseInt(firstCell);
        if (num >= 1 && num <= 52) {
          weekW = String(num).padStart(2, '0');
        }
      }
      // Validate against WEEK_ORDER
      if (weekW && !WEEK_ORDER.includes(weekW)) weekW = null;
      mappings.push({ excelRow: i, weekW, firstCell });
    }
    setRowMappings(mappings);
  };

  // Generate preview from mappings
  const generatePreview = () => {
    const items: ImportPreview[] = [];
    for (const rm of rowMappings) {
      if (!rm.weekW) continue;
      const row = rawData[rm.excelRow];
      if (!row) continue;
      for (const cm of colMappings) {
        if (cm.courseCol === null) continue;
        const cellText = String(row[cm.excelCol] || '').trim();
        if (!cellText) continue;
        const existing = weekData.find(w => w.w === rm.weekW);
        const existingLesson = existing?.lessons[cm.courseCol];
        items.push({
          weekW: rm.weekW,
          col: cm.courseCol,
          title: cellText,
          type: detectLessonType(cellText),
          isNew: !existingLesson || !existingLesson.title,
        });
      }
    }
    setPreview(items);
    setStep('preview');
  };

  // Execute import
  const executeImport = () => {
    pushUndo();
    let added = 0, updated = 0;
    const newWeekData = weekData.map(w => ({ ...w, lessons: { ...w.lessons } }));
    const weekMap = new Map(newWeekData.map(w => [w.w, w]));

    for (const item of preview) {
      const week = weekMap.get(item.weekW);
      if (!week) continue;
      const existing = week.lessons[item.col];
      if (existing?.title && importMode === 'merge') continue; // skip existing in merge mode
      if (existing?.title) updated++; else added++;
      week.lessons[item.col] = { title: item.title, type: item.type } as LessonEntry;
      // Auto-set blockType based on detected lesson type
      const blockTypeMap: Record<number, string> = { 4: 'EXAM', 5: 'EVENT', 6: 'HOLIDAY' };
      const autoBlockType = blockTypeMap[item.type] || 'LESSON';
      updateLessonDetail(item.weekW, item.col, { blockType: autoBlockType as any });
    }

    setWeekData(newWeekData);
    setImportResult({ added, updated });
    setStep('done');
  };

  const mappedCols = colMappings.filter(c => c.courseCol !== null).length;
  const mappedRows = rowMappings.filter(r => r.weekW !== null).length;

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-[560px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-200">📊 Excel-Import</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 cursor-pointer text-lg">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-3">
              <p className="text-[12px] text-gray-400">
                Excel-Datei mit Unterrichtsplanung importieren. Die erste Zeile wird als Header interpretiert,
                die erste Spalte als Wochennummer (KW).
              </p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls"
                onChange={handleFile}
                className="block w-full text-[12px] text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[12px] file:font-medium file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-500"
              />
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === 'map' && (
            <div className="space-y-4">
              {/* Sheet selector */}
              {sheetNames.length > 1 && (
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-400">Sheet:</label>
                  <select value={selectedSheet}
                    onChange={(e) => { setSelectedSheet(e.target.value); if (workbook) loadSheet(workbook, e.target.value); }}
                    className="text-[11px] bg-slate-700 border border-slate-600 rounded px-2 py-1 text-gray-200">
                    {sheetNames.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {/* Column mapping */}
              <div>
                <h3 className="text-[12px] font-semibold text-gray-300 mb-1">
                  Spalten-Mapping ({mappedCols} von {colMappings.length} zugeordnet)
                </h3>
                <div className="max-h-[150px] overflow-y-auto space-y-1">
                  {colMappings.map((cm, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <span className="text-gray-500 w-20 truncate" title={cm.excelHeader}>
                        {cm.excelHeader || `Spalte ${i + 1}`}
                      </span>
                      <span className="text-gray-600">→</span>
                      <select
                        value={cm.courseCol ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : parseInt(e.target.value);
                          setColMappings(prev => prev.map((c, j) => j === i ? { ...c, courseCol: val } : c));
                        }}
                        className="text-[11px] bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-gray-200 flex-1">
                        <option value="">— überspringen —</option>
                        {COURSES.map(c => (
                          <option key={c.col} value={c.col}>{c.cls} {c.day} {c.typ} ({c.les}L)</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row mapping */}
              <div>
                <h3 className="text-[12px] font-semibold text-gray-300 mb-1">
                  Zeilen-Mapping ({mappedRows} von {rowMappings.length} zugeordnet)
                </h3>
                <div className="max-h-[150px] overflow-y-auto space-y-1">
                  {rowMappings.map((rm, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <span className="text-gray-500 w-20 truncate">{rm.firstCell || `Zeile ${rm.excelRow + 1}`}</span>
                      <span className="text-gray-600">→</span>
                      <select
                        value={rm.weekW ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : e.target.value;
                          setRowMappings(prev => prev.map((r, j) => j === i ? { ...r, weekW: val } : r));
                        }}
                        className="text-[11px] bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-gray-200 flex-1">
                        <option value="">— überspringen —</option>
                        {WEEK_ORDER.map(w => <option key={w} value={w}>KW {w}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Import mode */}
              <div className="flex items-center gap-3">
                <label className="text-[11px] text-gray-400">Modus:</label>
                <label className="text-[11px] text-gray-300 flex items-center gap-1">
                  <input type="radio" checked={importMode === 'merge'} onChange={() => setImportMode('merge')} />
                  Nur leere Zellen füllen
                </label>
                <label className="text-[11px] text-gray-300 flex items-center gap-1">
                  <input type="radio" checked={importMode === 'overwrite'} onChange={() => setImportMode('overwrite')} />
                  Alles überschreiben
                </label>
              </div>

              <div className="flex gap-2">
                <button onClick={generatePreview}
                  disabled={mappedCols === 0 || mappedRows === 0}
                  className="text-[11px] bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:text-gray-500 text-white px-3 py-1 rounded cursor-pointer disabled:cursor-not-allowed">
                  Vorschau →
                </button>
                <button onClick={() => setStep('upload')}
                  className="text-[11px] text-gray-400 hover:text-gray-300 cursor-pointer px-2 py-1">
                  ← Zurück
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-3">
              <h3 className="text-[12px] font-semibold text-gray-300">
                Vorschau: {preview.length} Einträge
                ({preview.filter(p => p.isNew).length} neu, {preview.filter(p => !p.isNew).length} bestehend)
              </h3>
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 bg-slate-800">
                    <tr className="text-gray-500">
                      <th className="text-left px-1 py-0.5">KW</th>
                      <th className="text-left px-1 py-0.5">Kurs</th>
                      <th className="text-left px-1 py-0.5">Titel</th>
                      <th className="text-left px-1 py-0.5">Typ</th>
                      <th className="text-left px-1 py-0.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 100).map((p, i) => {
                      const course = COURSES.find(c => c.col === p.col);
                      return (
                        <tr key={i} className={`border-b border-slate-700/30 ${p.isNew ? '' : 'text-amber-400'}`}>
                          <td className="px-1 py-0.5 text-gray-400">{p.weekW}</td>
                          <td className="px-1 py-0.5 text-gray-400">{course?.cls || `col${p.col}`}</td>
                          <td className="px-1 py-0.5 text-gray-200 truncate max-w-[200px]">{p.title}</td>
                          <td className="px-1 py-0.5 text-gray-500">{TYPE_LABELS[p.type] || `Typ ${p.type}`}</td>
                          <td className="px-1 py-0.5">{p.isNew ? '🆕' : '♻️'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {preview.length > 100 && (
                  <div className="text-[9px] text-gray-500 text-center py-1">
                    … und {preview.length - 100} weitere
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={executeImport}
                  className="text-[11px] bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded cursor-pointer">
                  ✓ Importieren ({importMode === 'merge' ? 'nur neue' : 'alles'})
                </button>
                <button onClick={() => setStep('map')}
                  className="text-[11px] text-gray-400 hover:text-gray-300 cursor-pointer px-2 py-1">
                  ← Mapping anpassen
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 'done' && importResult && (
            <div className="space-y-3 text-center py-4">
              <div className="text-2xl">✅</div>
              <div className="text-[13px] font-semibold text-green-400">
                Import abgeschlossen
              </div>
              <div className="text-[12px] text-gray-400">
                {importResult.added} Einträge hinzugefügt
                {importResult.updated > 0 && `, ${importResult.updated} aktualisiert`}
              </div>
              <div className="text-[11px] text-gray-500">
                Rückgängig mit Ctrl+Z
              </div>
              <button onClick={onClose}
                className="text-[11px] bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded cursor-pointer">
                Schliessen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
