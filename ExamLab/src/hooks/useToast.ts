import { useToastStore, type ToastAddOptions } from '../store/toastStore'

interface UseToastResult {
  error: (message: string, opts?: ToastAddOptions) => string
  success: (message: string, opts?: ToastAddOptions) => string
  info: (message: string, opts?: ToastAddOptions) => string
  warning: (message: string, opts?: ToastAddOptions) => string
  dismiss: (id: string) => void
}

export function useToast(): UseToastResult {
  const store = useToastStore.getState()
  return {
    error: (message, opts) => store.add('error', message, opts),
    success: (message, opts) => store.add('success', message, opts),
    info: (message, opts) => store.add('info', message, opts),
    warning: (message, opts) => store.add('warning', message, opts),
    dismiss: (id) => store.dismiss(id),
  }
}
