/**
 * LaTeX-Rendering-Utilities für Fragetexte.
 * Lazy-loaded KaTeX-JS; CSS via statischem Import (garantiert vor erstem Render —
 * vermeidet Font-Metrik-Layout-Bruch durch async-CDN-Load, S140 Ticket 2).
 * Unterstützt $$...$$ (Display-Modus) und $...$ (Inline-Modus).
 *
 * CSS: bewusst KEIN top-level `import 'katex.css'` hier — das würde Vite die
 * KaTeX-Font-Assets in JEDE App leaken, die den shared-Barrel importiert (auch
 * den Planer, der nur useToast braucht). Das KaTeX-CSS wird app-lokal geladen
 * (ExamLab-Entry), nicht über den shared-Graph.
 */

let katexModule: typeof import('katex') | null = null
let katexPromise: Promise<typeof import('katex')> | null = null

/** Lazy-Load KaTeX-JS. CSS ist bereits via statischem Import oben geladen. */
async function ladeKatex(): Promise<typeof import('katex')> {
  if (katexModule) return katexModule
  if (!katexPromise) {
    katexPromise = import('katex').then(mod => {
      katexModule = mod
      return mod
    })
  }
  return katexPromise
}

/** Prüft ob KaTeX bereits geladen ist */
export function istKatexGeladen(): boolean {
  return katexModule !== null
}

/** Gibt das geladene KaTeX-Modul zurück (oder null) */
export function getKatex(): typeof import('katex') | null {
  return katexModule
}

/** Lädt KaTeX asynchron und gibt das Modul zurück */
export async function ladeKatexAsync(): Promise<typeof import('katex')> {
  return ladeKatex()
}

/**
 * Rendert LaTeX-Ausdrücke in einem HTML-String.
 * $$...$$ → Display-Modus, $...$ → Inline-Modus.
 * Erfordert dass KaTeX bereits geladen ist (synchron).
 */
export function renderLatexSync(html: string): string {
  if (!katexModule) return html
  return verarbeiteLatex(html, katexModule.default || katexModule)
}

/** Interne Verarbeitung: LaTeX-Delimiters ersetzen */
function verarbeiteLatex(html: string, katex: { renderToString: (tex: string, opts?: object) => string }): string {
  // Zuerst $$...$$ (Display-Modus) — muss vor $...$ kommen
  let result = html.replace(/\$\$([\s\S]*?)\$\$/g, (_match, tex: string) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false })
    } catch {
      return `<span class="text-red-500" title="LaTeX-Fehler">${tex}</span>`
    }
  })

  // Dann $...$ (Inline-Modus) — aber nicht \$ (escaped)
  result = result.replace(/(?<![\\$])\$(?!\$)(.*?[^\\])\$/g, (_match, tex: string) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false })
    } catch {
      return `<span class="text-red-500" title="LaTeX-Fehler">${tex}</span>`
    }
  })

  return result
}

/**
 * Normalisiert einen LaTeX-String für Vergleiche (Formel-Autokorrektur).
 * Entfernt Whitespace, normalisiert häufige Muster.
 */
export function normalisiereLatex(latex: string): string {
  let s = latex.trim()
  // Alle Whitespace entfernen
  s = s.replace(/\s+/g, '')
  // \left( → (, \right) → )
  s = s.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')')
  s = s.replace(/\\left\[/g, '[').replace(/\\right\]/g, ']')
  s = s.replace(/\\left\{/g, '{').replace(/\\right\}/g, '}')
  s = s.replace(/\\left\|/g, '|').replace(/\\right\|/g, '|')
  // \cdot → * (für Vergleich)
  s = s.replace(/\\cdot/g, '*')
  // \times → *
  s = s.replace(/\\times/g, '*')
  // Unnötige geschweifte Klammern um einzelne Zeichen entfernen: {x} → x
  s = s.replace(/\{([a-zA-Z0-9])\}/g, '$1')
  return s
}
