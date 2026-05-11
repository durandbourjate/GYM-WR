import type { SVGProps } from 'react'

/**
 * ExamLab-spezifische Custom-Icons im Lucide-Stil.
 *
 * Erweiterungs-Pattern (Spec G §6.5):
 * - viewBox="0 0 24 24"
 * - strokeWidth=2, fill="none", stroke="currentColor"
 * - strokeLinecap="round", strokeLinejoin="round"
 * - Text-Elemente: fontFamily="ui-sans-serif, system-ui", fontWeight=700
 * - Komponente nimmt SVGProps<SVGSVGElement> und reicht via {...props} durch.
 */

/** Freitext-Icon: "abc" über einer Unterstreichung. */
export const IconAbc = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...props}>
    <text x="2.5" y="17" fontFamily="ui-sans-serif, system-ui"
      fontSize="11" fontWeight="700" fill="currentColor" stroke="none">abc</text>
    <path d="M2 21h20"/>
  </svg>
)

/** Lückentext-Icon: "a ___ b" Pattern. */
export const IconAB = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...props}>
    <text x="3" y="14" fontFamily="ui-sans-serif, system-ui"
      fontSize="10" fontWeight="700" fill="currentColor" stroke="none">a</text>
    <text x="17" y="14" fontFamily="ui-sans-serif, system-ui"
      fontSize="10" fontWeight="700" fill="currentColor" stroke="none">b</text>
    <path d="M9 18h6"/>
  </svg>
)

/** Buchungssatz-Icon: "___ an ___" Pattern. */
export const IconAn = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...props}>
    <text x="12" y="14" fontFamily="ui-sans-serif, system-ui"
      fontSize="11" fontWeight="700" fill="currentColor" stroke="none"
      textAnchor="middle">an</text>
    <path d="M1 20h4"/>
    <path d="M19 20h4"/>
  </svg>
)

/** T-Konto-Icon: rect + vertical/horizontal divider. */
export const IconTKonto = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="12" y1="3" x2="12" y2="21"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
  </svg>
)
