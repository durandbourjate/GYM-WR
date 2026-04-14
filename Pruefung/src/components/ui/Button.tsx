import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'ki'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  /** KI-Variant: aktiv (blau) oder inaktiv (wie secondary). Default: true */
  kiAktiv?: boolean
}

const VARIANT_CLASSES = {
  primary: 'bg-violet-500 text-white hover:bg-violet-600 dark:bg-violet-500 dark:hover:bg-violet-600',
  secondary: 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700',
  danger: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
} as const

/** Variant-Klassen ermitteln — ki-Variant haengt von kiAktiv ab */
function getVariantClasses(variant: ButtonProps['variant'], kiAktiv: boolean): string {
  if (variant === 'ki') {
    return kiAktiv
      ? 'border border-blue-300 dark:border-blue-500 bg-blue-50 dark:bg-[#1e2a3f] text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-[#253650]'
      : VARIANT_CLASSES.secondary
  }
  return VARIANT_CLASSES[variant]
}

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs min-h-[36px]',
  md: 'px-4 py-2 text-sm min-h-[44px]',
  lg: 'px-6 py-3 text-base min-h-[48px]',
} as const

export default function Button({
  variant,
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  kiAktiv = true,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${getVariantClasses(variant, kiAktiv)} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}
