// SSOT: die latexRenderer-Render-Logik lebt in packages/shared (rein-JS, ohne
// CSS-Import — ein top-level `import 'katex.css'` dort würde Vite die KaTeX-Font-
// Assets in JEDE App leaken, die den shared-Barrel importiert, auch den Planer).
//
// Das KaTeX-CSS wird hier APP-LOKAL geladen (static → S140-korrekte Font-Metrik,
// kein async-CDN-Layout-Bruch). Dieser Shim deckt die ExamLab-Konsumenten
// FrageText / FormelFrageComponent / autoKorrektur ab. Der LP-FormelEditor-Pfad
// lädt das CSS analog in seinem eigenen Shim (components/lp/frageneditor/FormelEditor.tsx).
// Siehe docs/superpowers/specs/2026-05-29-latexrenderer-ssot-konsolidierung-design.md
import 'katex/dist/katex.min.css'
export * from '@shared/editor/utils/latexRenderer'
