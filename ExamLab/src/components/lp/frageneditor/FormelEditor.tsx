// KaTeX-CSS app-lokal laden (static, S140-korrekt) — deckt den LP-FormelEditor-
// Live-Vorschau-Pfad ab. Bewusst hier (und in utils/latexRenderer.ts) statt im
// shared-Renderer: ein CSS-Import im shared-Barrel würde KaTeX-Fonts in den
// Planer leaken. Vite dedupliziert das katex.css über beide Shims.
import 'katex/dist/katex.min.css'
export { default } from '@shared/editor/typen/FormelEditor'
