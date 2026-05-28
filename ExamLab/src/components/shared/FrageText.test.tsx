import { describe, test, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import FrageText from './FrageText'

vi.mock('./CodeBlock.tsx', () => ({
  default: ({ code }: { code: string }) => <pre>{code}</pre>,
}))

describe('FrageText — Hook-Order-Konsistenz', () => {
  test('konsistente Hook-Anzahl bei Wechsel zwischen Text-ohne-Code und Text-mit-Code', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Erstes Render: KEIN Code-Block → useMemo läuft NICHT (alter Bug)
    const { rerender } = render(<FrageText text="Einfacher Markdown-Text **fett**" />)

    // Zweites Render: MIT Code-Block → useMemo läuft jetzt zum 1. Mal → Hook-Order-Error
    rerender(<FrageText text={'Hier ist Code:\n\n```js\nconst x = 1\n```'} />)

    const hookError = spy.mock.calls.find(([msg]) =>
      typeof msg === 'string' && (
        msg.includes('Rendered fewer hooks than expected') ||
        msg.includes('Rendered more hooks than during the previous render') ||
        msg.includes('change in the order of Hooks')
      ),
    )
    expect(hookError).toBeUndefined()
    spy.mockRestore()
  })

  test('Render-Output bleibt korrekt für beide Pfade', () => {
    const { rerender, container } = render(<FrageText text="ohne code" />)
    expect(container.textContent).toContain('ohne code')
    rerender(<FrageText text={'mit code\n\n```js\nconst a = 1\n```'} />)
    expect(container.textContent).toContain('const a = 1')
  })
})
