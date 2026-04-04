/**
 * KontenSelect — Wiederverwendbare Konto-Auswahl (KMU-Kontenrahmen).
 * Zwei Modi: eingeschränkt (einfaches <select>) und voll (Autocomplete).
 * Farbschema: schlicht grau/slate, Kategorie-Farben nur in Badges + Zeilenhintergrund.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { sucheKonten, kontoLabel, findKonto, type KontoEintrag } from '../kontenrahmen'
import type { KontenauswahlConfig } from '../../types/fragen'

interface KontenSelectProps {
  value: string
  onChange: (nummer: string) => void
  config: KontenauswahlConfig
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Optional: Nur diese Kontonummern im Autocomplete anbieten (filtert sucheKonten) */
  filterKonten?: string[]
  /** Kompakte Darstellung (kleinere Höhe, Text) für verschachtelte Editoren */
  compact?: boolean
  /** Kategorie-Farben überschreiben (wenn nicht gesetzt, wird config.zeigeKategoriefarben verwendet) */
  zeigeKategoriefarben?: boolean
}

const MAX_RESULTS = 80

/** Kategorie-Badge-Farben — Lehrmittel-Standard: aktiv=gelb, passiv=rot, aufwand=blau, ertrag=grün */
const kategorieBadge: Record<KontoEintrag['kategorie'], string> = {
  aktiv:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  passiv:  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  aufwand: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  ertrag:  'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
}

/** Dezente Kategorie-Hintergrundfarben für Dropdown-Zeilen */
const kategorieZeile: Record<KontoEintrag['kategorie'], string> = {
  aktiv:   'bg-yellow-50/60 dark:bg-yellow-900/10',
  passiv:  'bg-red-50/60 dark:bg-red-900/10',
  aufwand: 'bg-blue-50/60 dark:bg-blue-900/10',
  ertrag:  'bg-green-50/60 dark:bg-green-900/10',
}

export default function KontenSelect({
  value,
  onChange,
  config,
  placeholder = 'Konto wählen…',
  disabled = false,
  className = '',
  filterKonten,
  compact = false,
  zeigeKategoriefarben,
}: KontenSelectProps) {
  // Farben: explizites Prop > Config-Wert > default true
  const farbenAktiv = zeigeKategoriefarben ?? config.zeigeKategoriefarben ?? true

  if (config.modus === 'eingeschraenkt') {
    return (
      <EingeschraenktSelect
        value={value}
        onChange={onChange}
        konten={config.konten ?? []}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
    )
  }

  return (
    <VollAutocomplete
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      filterKonten={filterKonten}
      compact={compact}
      farbenAktiv={farbenAktiv}
    />
  )
}

/* ─── Eingeschränkt: einfaches <select> ─── */

function EingeschraenktSelect({
  value,
  onChange,
  konten,
  placeholder,
  disabled,
  className,
}: {
  value: string
  onChange: (n: string) => void
  konten: string[]
  placeholder: string
  disabled: boolean
  className: string
}) {
  const options = sucheKonten('', konten)

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className={`min-h-[44px] w-full rounded-md border px-3 py-2
        text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
        disabled:cursor-not-allowed disabled:opacity-50
        ${value
          ? 'border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
          : disabled
            ? 'border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
            : 'border-violet-400 bg-white text-slate-900 dark:border-violet-500 dark:bg-slate-800 dark:text-slate-100'
        } ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map(k => (
        <option key={k.nummer} value={k.nummer}>
          {k.nummer} {k.name}
        </option>
      ))}
    </select>
  )
}

/* ─── Voll: Autocomplete mit Dropdown ─── */

function VollAutocomplete({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  filterKonten,
  compact = false,
  farbenAktiv = true,
}: {
  value: string
  onChange: (n: string) => void
  placeholder: string
  disabled: boolean
  className: string
  filterKonten?: string[]
  compact?: boolean
  farbenAktiv?: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(0)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Angezeigte Ergebnisse (optional gefiltert auf bestimmte Kontonummern)
  const results = sucheKonten(query, filterKonten).slice(0, MAX_RESULTS)

  // Input-Text: wenn nicht offen, zeige gewähltes Konto
  const displayValue = open ? query : (value ? kontoLabel(value) : '')

  // Click-Outside schliesst Dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Highlight sichtbar halten (Scroll)
  useEffect(() => {
    if (!open || !listRef.current) return
    const item = listRef.current.children[highlightIdx] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [highlightIdx, open])

  const selectKonto = useCallback((nummer: string) => {
    onChange(nummer)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }, [onChange])

  function handleFocus() {
    if (disabled) return
    setQuery('')
    setHighlightIdx(0)
    setOpen(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setHighlightIdx(0)
    if (!open) setOpen(true)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightIdx(i => Math.min(i + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightIdx(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (results[highlightIdx]) {
          selectKonto(results[highlightIdx].nummer)
        }
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
    }
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={`${compact ? 'min-h-[28px] text-[11px] px-1.5 py-0.5' : 'min-h-[44px] text-sm px-3 py-2'}
          w-full rounded-md border
          focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
          disabled:cursor-not-allowed disabled:opacity-50
          ${value && !open
            ? 'border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
            : disabled
              ? 'border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
              : 'border-violet-400 bg-white text-slate-900 dark:border-violet-500 dark:bg-slate-800 dark:text-slate-100'
          }`}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-activedescendant={open && results[highlightIdx]
          ? `konto-opt-${results[highlightIdx].nummer}`
          : undefined}
      />

      {/* Löschen-Button wenn Wert gesetzt */}
      {value && !disabled && !open && (
        <button
          type="button"
          onClick={() => { onChange(''); setQuery('') }}
          className={`absolute right-1 top-1/2 -translate-y-1/2
            ${compact ? 'min-h-[20px] min-w-[20px] text-xs' : 'min-h-[28px] min-w-[28px]'}
            rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200`}
          aria-label="Auswahl löschen"
        >
          ×
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border
            border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
              Kein Konto gefunden
            </li>
          ) : (
            results.map((k, idx) => {
              const konto = findKonto(k.nummer)
              const isHighlighted = idx === highlightIdx
              // Kategorie-Hintergrund für nicht-highlightete Zeilen (nur wenn farbenAktiv)
              const zeileBg = farbenAktiv && konto && !isHighlighted ? kategorieZeile[konto.kategorie] : ''
              return (
                <li
                  key={k.nummer}
                  id={`konto-opt-${k.nummer}`}
                  role="option"
                  aria-selected={isHighlighted}
                  onMouseDown={e => { e.preventDefault(); selectKonto(k.nummer) }}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  className={`flex cursor-pointer items-center gap-2
                    ${compact ? 'min-h-[28px] px-1.5 py-1 text-[11px]' : 'min-h-[44px] px-3 py-2 text-sm'}
                    ${isHighlighted
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-700/50 dark:text-slate-100'
                      : `text-slate-700 dark:text-slate-200 ${zeileBg}`
                    }`}
                >
                  <span className="font-mono font-medium">{k.nummer}</span>
                  <span className="flex-1 truncate">{k.name}</span>
                  {farbenAktiv && konto && (
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium
                      ${kategorieBadge[konto.kategorie]}`}>
                      {konto.kategorie}
                    </span>
                  )}
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
