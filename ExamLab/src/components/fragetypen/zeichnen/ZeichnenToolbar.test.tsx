import { render } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { ZeichnenToolbar } from './ZeichnenToolbar'

describe('ZeichnenToolbar', () => {
  test('rendert Farben-Map ohne React-key-Warning', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ZeichnenToolbar
        aktivesTool="auswahl"
        onToolChange={() => {}}
        aktiveFarbe="#000"
        onFarbeChange={() => {}}
        verfuegbareWerkzeuge={['stift']}
        verfuegbareFarben={['#000', '#f00', '#0f0']}
        radiererAktiv={false}
        layout="vertikal"
        onLayoutToggle={() => {}}
        onUndo={() => {}}
        onRedo={() => {}}
        onAllesLoeschen={() => {}}
        kannUndo={false}
        kannRedo={false}
        disabled={false}
      />,
    )
    const keyWarning = spy.mock.calls.find(([msg]) =>
      typeof msg === 'string' && msg.includes('unique "key" prop'),
    )
    expect(keyWarning).toBeUndefined()
    spy.mockRestore()
  })
})
