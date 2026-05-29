import { describe, it, expect } from 'vitest'
import { normalisiereLatex } from './latexRenderer'

describe('normalisiereLatex', () => {
  it('entfernt Whitespace', () => {
    expect(normalisiereLatex('  x + y  ')).toBe('x+y')
    expect(normalisiereLatex('a  ^  2')).toBe('a^2')
  })

  it('entfernt \\left und \\right', () => {
    expect(normalisiereLatex('\\left( x \\right)')).toBe('(x)')
    expect(normalisiereLatex('\\left[ a \\right]')).toBe('[a]')
    expect(normalisiereLatex('\\left| x \\right|')).toBe('|x|')
    expect(normalisiereLatex('\\left{ a \\right}')).toBe('a') // {a} → a (einzelnes Zeichen)
  })

  it('normalisiert \\cdot und \\times zu *', () => {
    expect(normalisiereLatex('a \\cdot b')).toBe('a*b')
    expect(normalisiereLatex('a \\times b')).toBe('a*b')
  })

  it('entfernt unnötige geschweifte Klammern um einzelne Zeichen', () => {
    expect(normalisiereLatex('{x}')).toBe('x')
    expect(normalisiereLatex('a^{2}')).toBe('a^2')
    expect(normalisiereLatex('{a}+{b}')).toBe('a+b')
  })

  it('behält mehrzeichen-Klammern bei', () => {
    expect(normalisiereLatex('{ab}')).toBe('{ab}')
    expect(normalisiereLatex('{10}')).toBe('{10}')
  })

  it('normalisiert komplexe Ausdrücke konsistent', () => {
    const a = normalisiereLatex('\\frac{a}{b} + c')
    const b = normalisiereLatex('\\frac {a} {b}+c')
    expect(a).toBe(b)
  })

  it('normalisiert identische Formeln gleich', () => {
    expect(normalisiereLatex('x^{2} + y^{2}')).toBe(normalisiereLatex('x^2 + y^2'))
  })
})
