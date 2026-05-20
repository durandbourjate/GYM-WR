import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useToastStore } from './toastStore'
import { ToastContainer } from './ToastContainer'

describe('ToastContainer', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  it('rendert keine Toasts wenn Store leer', () => {
    render(<ToastContainer />)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('rendert sichtbaren Toast nach add()', () => {
    useToastStore.getState().add('error', 'Boom')
    render(<ToastContainer />)
    expect(screen.getByText('Boom')).toBeInTheDocument()
  })

  it('rendert mehrere Toasts (Stack)', () => {
    useToastStore.getState().add('error', 'A')
    useToastStore.getState().add('info', 'B')
    render(<ToastContainer />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('X-Button dismisses den Toast', () => {
    useToastStore.getState().add('error', 'Boom')
    render(<ToastContainer />)
    const btn = screen.getByRole('button', { name: /schliessen|schließen|dismiss|×/i })
    fireEvent.click(btn)
    expect(screen.queryByText('Boom')).toBeNull()
  })

  it('error-Variant hat rote Styling-Klasse', () => {
    useToastStore.getState().add('error', 'X')
    render(<ToastContainer />)
    const toast = screen.getByText('X').closest('[role="alert"]')
    expect(toast?.className).toMatch(/red/)
  })

  it('success-Variant hat grüne Styling-Klasse mit Dark-Mode-Pairing', () => {
    useToastStore.getState().add('success', 'X')
    render(<ToastContainer />)
    const toast = screen.getByText('X').closest('[role="alert"]')
    expect(toast?.className).toMatch(/green/)
    expect(toast?.className).toMatch(/dark:/)
  })
})
