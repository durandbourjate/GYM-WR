import { create } from 'zustand'

export const DEFAULT_TOAST_AUTO_HIDE_MS = 4000

export type ToastVariant = 'error' | 'success' | 'info' | 'warning'

export interface Toast {
  id: string
  variant: ToastVariant
  message: string
  sticky: boolean
  createdAt: number
}

export interface ToastAddOptions {
  sticky?: boolean
  autoHideMs?: number
}

interface ToastStore {
  toasts: Toast[]
  add: (variant: ToastVariant, message: string, opts?: ToastAddOptions) => string
  dismiss: (id: string) => void
  clear: () => void
}

function defaultStickyForVariant(variant: ToastVariant): boolean {
  return variant === 'error'
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  add: (variant, message, opts) => {
    const id = crypto.randomUUID()
    const sticky = opts?.sticky ?? defaultStickyForVariant(variant)
    const toast: Toast = {
      id,
      variant,
      message,
      sticky,
      createdAt: Date.now(),
    }
    set((state) => ({ toasts: [...state.toasts, toast] }))
    if (!sticky) {
      const ms = opts?.autoHideMs ?? DEFAULT_TOAST_AUTO_HIDE_MS
      setTimeout(() => {
        if (get().toasts.some((t) => t.id === id)) {
          get().dismiss(id)
        }
      }, ms)
    }
    return id
  },
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
  clear: () => {
    set({ toasts: [] })
  },
}))
