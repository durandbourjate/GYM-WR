import { usePlannerStore } from '../store/plannerStore';
import type { CollectionItem } from '../types';

/** Renders a list of importable collection items. Caller provides container/positioning. */
export function CollectionPickerList({ onSelect, courseType }: {
  onSelect: (item: CollectionItem) => void;
  courseType?: string;
}) {
  const collection = usePlannerStore(s => s.collection);
  const importable = collection.filter(item =>
    item.units.length > 0 &&
    ['unit', 'sequence', 'schoolyear', 'curriculum'].includes(item.type) &&
    (!courseType || !item.courseType || item.courseType === courseType)
  );

  if (importable.length === 0) {
    return <div className="px-3 py-2 text-[11px] text-gray-500 italic text-center">Sammlung leer</div>;
  }

  return (<>{importable.map(item => (
    <button key={item.id} onClick={() => onSelect(item)}
      className="w-full px-3 py-1.5 text-left text-[12px] text-gray-300 hover:bg-slate-700 cursor-pointer">
      <div className="truncate font-medium">{item.title}</div>
      <div className="text-[9px] text-gray-500">
        {item.units.reduce((n, u) => n + u.lessonTitles.length, 0)} Lektionen · {item.units.length} Block{item.units.length !== 1 ? 's' : ''}
        {item.fachbereich ? ` · ${item.fachbereich}` : ''}
      </div>
    </button>
  ))}</>);
}

/** Hook: check if collection has importable items */
export function useHasImportableItems(courseType?: string): boolean {
  const collection = usePlannerStore(s => s.collection);
  return collection.some(item =>
    item.units.length > 0 &&
    ['unit', 'sequence', 'schoolyear', 'curriculum'].includes(item.type) &&
    (!courseType || !item.courseType || item.courseType === courseType)
  );
}
