/**
 * KontenSelect — Wiederverwendbare Konto-Auswahl (KMU-Kontenrahmen).
 * Zwei Modi: eingeschränkt (einfaches <select>) und voll (Autocomplete).
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { sucheKonten, kontoLabel, findKonto, type KontoEintrag } from '../../utils/kontenrahmen'

// Lokale Definition — wird in Task 3 nach fragen.ts verschoben
export interface KontenauswahlConfig {
  modus: 'eingeschraenkt' | 'voll'
  konten?: string[]
}

interface KontenSelectProps {
  value: string
  onChange: (nummer: string) => void
  config: KontenauswahlConfig
  placeholder?: string
  disabled?: boolean
  className?: string
}

const MAX_RESULTS = 15

/** Kategorie-Badge-Farben (Tailwind-Klassen) */
const kategorieBadge: Record<KontoEintrag['kategorie'], string> = {
  aktiv:   'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  passiv:  'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300',
  aufwand: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  ertrag:  'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
}

export default function KontenSelect({
  value,
  onChange,
  config,
  placeholder = 'Konto wählen…',
  disabled = false,
  className = '',
}: KontenSelectProps) {
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
      className={`min-h-[44px] w-full rounded-md border border-gray-300 bg-white px-3 py-2
        text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100
        focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
        disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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
}: {
  value: string
  onChange: (n: string) => void
  placeholder: string
  disabled: boolean
  className: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(0)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Angezeigte Ergebnisse
  const results = sucheKonten(query).slice(0, MAX_RESULTS)

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
        className={`min-h-[44px] w-full rounded-md border border-gray-300 bg-white px-3 py-2
          text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100
          focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
          disabled:cursor-not-allowed disabled:opacity-50`}
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
          className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[28px] min-w-[28px]
            rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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
            border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              Kein Konto gefunden
            </li>
          ) : (
            results.map((k, idx) => {
              const konto = findKonto(k.nummer)
              return (
                <li
                  key={k.nummer}
                  id={`konto-opt-${k.nummer}`}
                  role="option"
                  aria-selected={idx === highlightIdx}
                  onMouseDown={e => { e.preventDefault(); selectKonto(k.nummer) }}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-2 px-3 py-2 text-sm
                    ${idx === highlightIdx
                      ? 'bg-blue-50 text-gray-900 dark:bg-blue-900/30 dark:text-gray-100'
                      : 'text-gray-700 dark:text-gray-200'
                    }`}
                >
                  <span className="font-mono font-medium">{k.nummer}</span>
                  <span className="flex-1 truncate">{k.name}</span>
                  {konto && (
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
