import { render, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Week } from '../types';
import { usePlannerStore } from '../store/plannerStore';
import { NoteCell } from './NoteCell';

/**
 * Regression: rules-of-hooks (R8-R13 WeekRows-Split).
 *
 * NoteCell wird in WeekRows bedingungslos pro Zelle gerendert (WeekRows.tsx:736).
 * Die beiden useEffect lagen NACH dem `if (!entry) return …`. Sobald in einer
 * vorher leeren Zelle eine Lektion auftaucht (entry wird truthy), springt der
 * Hook-Count am selben Fiber von 4 auf 6 → React #310
 * "Rendered more hooks than during the previous render".
 *
 * jsdom fängt das hier zuverlässig, weil der entry-Flip synchron über den Store
 * getrieben wird (kein async-Mock-Problem wie bei S130).
 */

function renderInTable(ui: React.ReactElement) {
  return render(
    <table>
      <tbody>
        <tr>{ui}</tr>
      </tbody>
    </table>,
  );
}

beforeEach(() => {
  // Zelle 33/11 startet OHNE Lektion → NoteCell early-returned (leere <td>)
  act(() => {
    usePlannerStore.setState({ weekData: [], lessonDetails: {}, noteColWidth: 120 });
  });
});

afterEach(() => {
  cleanup();
  act(() => {
    usePlannerStore.setState({ weekData: [], lessonDetails: {} });
  });
});

describe('NoteCell — rules-of-hooks', () => {
  it('crasht nicht, wenn in einer montierten leeren Zelle eine Lektion auftaucht', () => {
    renderInTable(<NoteCell weekW="33" col={11} cellHeight={40} />);

    const withEntry: Week[] = [{ w: '33', lessons: { 11: { title: 'Lektion', type: 1 } } }];

    // Vor dem Fix wirft dieser entry-Flip einen Hook-Order-Error.
    expect(() => {
      act(() => {
        usePlannerStore.setState({ weekData: withEntry });
      });
    }).not.toThrow();

    // Und die Zelle rendert jetzt ihren Notiz-Platzhalter (kein leeres <td> mehr).
    expect(document.querySelector('td.cursor-text')).not.toBeNull();
  });
});
