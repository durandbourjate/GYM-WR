import { render, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CourseConfig } from '../../store/settingsStore';
import { usePlannerStore } from '../../store/plannerStore';
import { CourseEditor } from './CourseEditor';

/**
 * Regression: effect-needs-cleanup (Cleanup-Trio 29.05.2026).
 *
 * Der Auto-Scroll-Effect cleart seinen eigenen Trigger (`settingsEditKursId`). Würde
 * man den Timer per `return () => clearTimeout(id)` säubern UND den Trigger synchron
 * im Effect löschen, bräche der dadurch ausgelöste Re-Run (~16ms) den 100ms-Scroll-Timer
 * ab → Scroll verpufft. Fix: Trigger erst IM Timer löschen → kein vorzeitiger Re-Run,
 * Same-Effect-Cleanup nur bei Unmount/echtem Dep-Wechsel wirksam.
 *
 * Die Harness verdrahtet (wie der echte Parent) settingsEditKursId → focusKursId, damit
 * der Self-Trigger real reproduziert wird.
 */

const scrollSpy = vi.fn();

const COURSE: CourseConfig = {
  id: 'c1', cls: '29c', typ: 'SF', day: 'Mo',
  from: '08:05', to: '08:50', les: 1, hk: false, semesters: [1, 2],
};

function Harness({ courses }: { courses: CourseConfig[] }) {
  const focusKursId = usePlannerStore(s => s.settingsEditKursId);
  return <CourseEditor courses={courses} onChange={() => {}} focusKursId={focusKursId} />;
}

beforeEach(() => {
  vi.useFakeTimers();
  scrollSpy.mockClear();
  // jsdom implementiert scrollIntoView nicht — als Spy bereitstellen
  Element.prototype.scrollIntoView = scrollSpy as unknown as Element['scrollIntoView'];
  act(() => { usePlannerStore.setState({ settingsEditKursId: null }); });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  act(() => { usePlannerStore.setState({ settingsEditKursId: null }); });
});

describe('CourseEditor — effect-needs-cleanup (Auto-Scroll Self-Trigger)', () => {
  it('scrollt zum fokussierten Kurs, obwohl der Effect seinen eigenen Trigger löscht', () => {
    render(<Harness courses={[COURSE]} />);

    act(() => { usePlannerStore.getState().setSettingsEditKursId('c1'); });
    // Effect lief: editingId gesetzt, 100ms-Timer geplant, Trigger NOCH nicht gelöscht
    expect(scrollSpy).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(100); });
    // Timer feuerte: Scroll passiert + Trigger konsumiert (kein vorzeitiger Abbruch)
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(usePlannerStore.getState().settingsEditKursId).toBeNull();
  });

  it('bricht den Scroll-Timer bei Unmount ab (kein Leak)', () => {
    const { unmount } = render(<Harness courses={[COURSE]} />);
    act(() => { usePlannerStore.getState().setSettingsEditKursId('c1'); });

    unmount();
    act(() => { vi.advanceTimersByTime(200); });
    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
