/**
 * LaTeX-Rendering-Utilities für Fragetexte.
 * Lazy-loaded KaTeX: wird erst beim ersten Aufruf geladen.
 * Unterstützt $$...$$ (Display-Modus) und $...$ (Inline-Modus).
 */

let katexModule: typeof import('katex') | null = null
let katexPromise: Promise<typeof import('katex')> | null = null
let cssInjected = false

/** Lazy-Load KaTeX und CSS (CSS wird sofort injiziert, nicht erst nach JS-Load) */
async function ladeKatex(): Promise<typeof import('katex')> {
  if (katexModule) return katexModule
  if (!katexPromise) {
    // CSS sofort laden, parallel zum JS — verhindert kurzes Doppel-Rendering
    injiziereKatexCSS()
    katexPromise = import('katex').then(mod => {
      katexModule = mod
      return mod
    })
  }
  return katexPromise
}

/** KaTeX-CSS dynamisch injizieren */
function injiziereKatexCSS(): void {
  if (cssInjected) return
  cssInjected = true
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css'
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
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
