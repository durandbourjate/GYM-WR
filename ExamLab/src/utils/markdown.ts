/**
 * Einfacher Markdown→HTML Renderer für Fragetexte.
 * Unterstützt: **fett**, *kursiv*, `code`, Zeilenumbrüche.
 * Kein dangerouslySetInnerHTML nötig — wird nur für Text-Rendering verwendet.
 */

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Wandelt einfaches Markdown in sichere HTML-Fragmente um */
export function renderMarkdown(text: string): string {
  let html = escapeHtml(text)
  // Fett
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Kursiv
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Inline-Code
  html = html.replace(/`(.+?)`/g, '<code class="bg-slate-100 dark:bg-slate-700 px-1 rounded text-sm">$1</code>')
  // Zeilenumbrüche
  html = html.replace(/\n/g, '<br/>')
  return html
}
