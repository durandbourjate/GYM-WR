import { useToastStore, type ToastAddOptions } from './toastStore'

interface UseToastResult {
  error: (message: string, opts?: ToastAddOptions) => string
  success: (message: string, opts?: ToastAddOptions) => string
  info: (message: string, opts?: ToastAddOptions) => string
  warning: (message: string, opts?: ToastAddOptions) => string
  dismiss: (id: string) => void
}

const toastApi: UseToastResult = {
  error: (message, opts) => useToastStore.getState().add('error', message, opts),
  success: (message, opts) => useToastStore.getState().add('success', message, opts),
  info: (message, opts) => useToastStore.getState().add('info', message, opts),
  warning: (message, opts) => useToastStore.getState().add('warning', message, opts),
  dismiss: (id) => useToastStore.getState().dismiss(id),
}

export function useToast(): UseToastResult {
  return toastApi
}
