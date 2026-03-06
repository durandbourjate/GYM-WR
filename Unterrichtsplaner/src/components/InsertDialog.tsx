import { usePlannerStore } from '../store/plannerStore';
import { WEEKS } from '../data/weeks';

export function InsertDialog() {
  const { insertDialog, setInsertDialog, pushLessons } = usePlannerStore();
  if (!insertDialog) return null;

  const { week, course, hasMismatch, pairedCourses } = insertDialog;
  const allWeekKeys = WEEKS.map((w) => w.w);

  const handleInsertSingle = () => {
    pushLessons(course.col, week, allWeekKeys);
    setInsertDialog(null);
  };

  const handleInsertSync = () => {
    // Push all slots of this course (including paired) simultaneously
    pushLessons(course.col, week, allWeekKeys);
    for (const paired of pairedCourses) {
      pushLessons(paired.col, week, allWeekKeys);
    }
    setInsertDialog(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center"
      onClick={() => setInsertDialog(null)}
    >
      <div
        className="bg-slate-800 rounded-lg p-5 max-w-md border border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold text-gray-100 mb-2">
          Einfügen & Verschieben
        </h3>
        <p className="text-[13px] text-slate-400 mb-3">
          Neuer leerer Eintrag vor <b className="text-gray-200">KW {week}</b> für{' '}
          <b className="text-gray-200">{course.cls} ({course.typ})</b>.
          Alle folgenden Einträge verschieben sich um 1 Slot.
        </p>

        {hasMismatch && (
          <div className="bg-red-950/40 border border-red-600 rounded p-3 mb-3">
            <div className="text-[12px] text-red-300 font-bold mb-1">
              ⚠ Achtung: 1L/2L Slot-Konflikt!
            </div>
            <p className="text-[12px] text-red-400/80 mb-2">
              Dieser Kurs hat alternierend{' '}
              <b>{course.les}L ({course.day})</b> und{' '}
              <b>
                {pairedCourses.map((p) => `${p.les}L (${p.day})`).join(', ')}
              </b>
              . Eine Verschiebung könnte dazu führen, dass ein 2L-Inhalt in einen
              1L-Slot rutscht.
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleInsertSingle}
                className="px-3 py-1 rounded bg-red-700 text-white text-[11px] font-semibold cursor-pointer hover:bg-red-600"
              >
                Nur {course.day} verschieben
              </button>
              <button
                onClick={handleInsertSync}
                className="px-3 py-1 rounded bg-amber-700 text-white text-[11px] font-semibold cursor-pointer hover:bg-amber-600"
              >
                Alle Slots synchron
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!hasMismatch && (
            <button
              onClick={handleInsertSingle}
              className="px-3 py-1.5 rounded bg-blue-600 text-white text-[12px] font-semibold cursor-pointer hover:bg-blue-500"
            >
              Einfügen
            </button>
          )}
          <button
            onClick={() => setInsertDialog(null)}
            className="px-3 py-1.5 rounded bg-gray-700 text-gray-400 text-[12px] cursor-pointer hover:text-gray-200"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
