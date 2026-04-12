import type { ReactNode } from 'react'

interface LoginLayoutProps {
  title?: string
  children: ReactNode
}

export default function LoginLayout({ title, children }: LoginLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
        {title && (
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">
            {title}
          </h1>
        )}
        {children}
      </div>
    </div>
  )
}
