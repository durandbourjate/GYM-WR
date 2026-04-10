/**
 * Normalisiert Konten-Daten aus kontenauswahl.konten.
 * Pool-Daten können sowohl Strings ("1000") als auch Objekte ({nr: "1000", name: "Kasse"}) enthalten.
 * Gibt immer {nr, name}[] zurück.
 */
export function normalizeKonten(konten: unknown[]): { nr: string; name: string }[] {
  return (konten || []).map(k => {
    if (typeof k === 'string') return { nr: k, name: k }
    if (k && typeof k === 'object' && 'nr' in k) {
      const obj = k as { nr: string; name?: string }
      return { nr: String(obj.nr), name: String(obj.name ?? obj.nr) }
    }
    return { nr: String(k), name: String(k) }
  })
}

/**
 * Normalisiert Labels aus DragDrop-Daten.
 * Pool-Daten können Strings oder Objekte ({id, text, zone}) enthalten.
 * Gibt immer string[] zurück.
 */
export function normalizeLabels(labels: unknown[]): string[] {
  return (labels || []).map(l => {
    if (typeof l === 'string') return l
    if (l && typeof l === 'object') {
      const obj = l as Record<string, unknown>
      // Pool-Daten können {text, id, zone} oder {name} enthalten
      if ('text' in obj) return String(obj.text)
      if ('name' in obj) return String(obj.name)
    }
    return String(l)
  })
}
