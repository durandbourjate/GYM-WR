import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Star } from 'lucide-react';
import { TabBar } from './TabBar';

const tabs = [
  { id: 'a', label: 'Tab A' },
  { id: 'b', label: 'Tab B' },
  { id: 'c', label: 'Tab C' },
];

describe('TabBar', () => {
  it('rendert alle Tabs', () => {
    render(<TabBar tabs={tabs} activeTab="a" onTabChange={() => {}} />);
    expect(screen.getByText('Tab A')).toBeDefined();
    expect(screen.getByText('Tab B')).toBeDefined();
    expect(screen.getByText('Tab C')).toBeDefined();
  });

  it('markiert aktiven Tab mit aria-selected', () => {
    render(<TabBar tabs={tabs} activeTab="b" onTabChange={() => {}} />);
    const tabB = screen.getByRole('tab', { name: 'Tab B' });
    expect(tabB.getAttribute('aria-selected')).toBe('true');
  });

  it('ruft onTabChange bei Klick', () => {
    const onChange = vi.fn();
    render(<TabBar tabs={tabs} activeTab="a" onTabChange={onChange} />);
    fireEvent.click(screen.getByText('Tab C'));
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('ignoriert Klick auf disabled Tab', () => {
    const onChange = vi.fn();
    const disabledTabs = [...tabs, { id: 'd', label: 'Disabled', disabled: true }];
    render(<TabBar tabs={disabledTabs} activeTab="a" onTabChange={onChange} />);
    fireEvent.click(screen.getByText('Disabled'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('unterstützt Pfeiltasten-Navigation', () => {
    const onChange = vi.fn();
    render(<TabBar tabs={tabs} activeTab="a" onTabChange={onChange} />);
    const tabA = screen.getByRole('tab', { name: 'Tab A' });
    fireEvent.keyDown(tabA, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('rendert Icon wenn vorhanden', () => {
    const tabsWithIcon = [{ id: 'x', label: 'Mit Icon', icon: <span data-testid="icon">X</span> }];
    render(<TabBar tabs={tabsWithIcon} activeTab="x" onTabChange={() => {}} />);
    expect(screen.getByTestId('icon')).toBeDefined();
  });

  it('rendert Lucide-Icon vor Label wenn icon-Prop gesetzt', () => {
    const tabsWithLucide = [{ id: 'fav', label: 'Favoriten', icon: <Star className="w-4 h-4" /> }];
    render(<TabBar tabs={tabsWithLucide} activeTab="fav" onTabChange={vi.fn()} />);
    expect(screen.getByText('Favoriten')).toBeDefined();
    const button = screen.getByText('Favoriten').closest('button');
    expect(button?.querySelector('svg')).toBeTruthy();
  });
});
