import { useAuthStore } from '../store/authStore.ts'
import ThemeToggle from './ThemeToggle.tsx'

export default function AbgabeBestaetigung() {
  const user = useAuthStore((s) => s.user)
  const abmelden = useAuthStore((s) => s.abmelden)
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        {user && (
          <button
            onClick={abmelden}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            Abmelden
          </button>
        )}
      </div>
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-700 dark:bg-slate-300 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white dark:text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Prüfung abgegeben
        </h1>
        {user && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            {user.name} {user.email && user.email !== 'demo@example.com' ? `(${user.email})` : ''}
          </p>
        )}
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Ihre Antworten wurden gespeichert. Sie können das Fenster schliessen.
        </p>
        <a
          href={window.location.pathname.replace(/\/[^/]*$/, '/')}
          className="inline-block px-6 py-2.5 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-xl font-medium text-sm hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors mb-4 min-h-[44px] leading-[44px]"
        >
          Zurück zu ExamLab
        </a>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Bei Fragen wenden Sie sich an Ihre Lehrperson.
        </p>
      </div>
    </div>
  )
}
