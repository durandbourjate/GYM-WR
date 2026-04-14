import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResizableSidebar } from '@shared/ui/ResizableSidebar';

describe('ResizableSidebar', () => {
  it('rendert Titel und Inhalt', () => {
    render(
      <ResizableSidebar title="Einstellungen" onClose={() => {}}>
        <p>Inhalt</p>
      </ResizableSidebar>
    );
    expect(screen.getByText('Einstellungen')).toBeDefined();
    expect(screen.getByText('Inhalt')).toBeDefined();
  });

  it('rendert Schliessen- und Maximize-Buttons', () => {
    render(
      <ResizableSidebar title="Test" onClose={() => {}}>
        <p>X</p>
      </ResizableSidebar>
    );
    expect(screen.getByLabelText('Schliessen')).toBeDefined();
    expect(screen.getByLabelText('Maximieren')).toBeDefined();
  });

  it('ruft onClose bei Klick auf Schliessen', () => {
    const onClose = vi.fn();
    render(
      <ResizableSidebar title="Test" onClose={onClose}>
        <p>X</p>
      </ResizableSidebar>
    );
    screen.getByLabelText('Schliessen').click();
    expect(onClose).toHaveBeenCalled();
  });

  it('hat einen Resize-Handle', () => {
    render(
      <ResizableSidebar title="Test" onClose={() => {}}>
        <p>X</p>
      </ResizableSidebar>
    );
    expect(screen.getByTestId('resize-handle')).toBeDefined();
  });

  it('ruft onClose bei Escape (layout mode)', () => {
    const onClose = vi.fn();
    render(
      <ResizableSidebar title="Test" onClose={onClose}>
        <p>X</p>
      </ResizableSidebar>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('ruft onClose NICHT bei Escape wenn closeOnEsc=false', () => {
    const onClose = vi.fn();
    render(
      <ResizableSidebar title="Test" onClose={onClose} closeOnEsc={false}>
        <p>X</p>
      </ResizableSidebar>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('overlay mode rendert ohne eingebauten Header wenn kein title', () => {
    render(
      <ResizableSidebar mode="overlay" onClose={() => {}}>
        <p>Content</p>
      </ResizableSidebar>
    );
    expect(screen.queryByLabelText('Schliessen')).toBeNull();
    expect(screen.getByText('Content')).toBeDefined();
  });
});
