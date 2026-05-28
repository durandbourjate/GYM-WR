import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { PDFToolbar } from './PDFToolbar'

describe('PDFToolbar', () => {
  it('rendert Farben-Map ohne React-key-Warning', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <PDFToolbar
        aktivesWerkzeug="auswahl"
        onWerkzeugWechsel={() => {}}
        erlaubteWerkzeuge={['highlighter']}
        aktiveFarbe="#fff200"
        onFarbeWechsel={() => {}}
        zoom={1}
        onZoomWechsel={() => {}}
        kannUndo={false}
        kannRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
        annotationCount={0}
      />,
    )
    const keyWarning = spy.mock.calls.find(([msg]) =>
      typeof msg === 'string' && msg.includes('unique "key" prop'),
    )
    expect(keyWarning).toBeUndefined()
    spy.mockRestore()
  })
})
