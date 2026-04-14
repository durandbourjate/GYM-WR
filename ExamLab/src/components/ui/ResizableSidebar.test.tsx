import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResizableSidebar } from './ResizableSidebar';

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
});
