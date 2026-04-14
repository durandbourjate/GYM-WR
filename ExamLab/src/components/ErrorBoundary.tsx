import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hatFehler: boolean
  fehler: Error | null
}

/**
 * React Error Boundary: Fängt Rendering-Fehler ab und zeigt
 * eine Recovery-UI statt einem Whitescreen.
 * Kritisch bei Prüfungen — SuS dürfen nie einen leeren Bildschirm sehen.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hatFehler: false, fehler: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hatFehler: true, fehler: error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log für Debugging (erscheint in Browser-Konsole)
    console.error('[ErrorBoundary] Rendering-Fehler:', error)
    console.error('[ErrorBoundary] Component Stack:', errorInfo.componentStack)
  }

  handleNeuLaden = (): void => {
    this.setState({ hatFehler: false, fehler: null })
  }

  handleSeitenReload = (): void => {
    window.location.reload()
  }

  handleDatenExport = (): void => {
    // Antworten aus localStorage exportieren als Notfall-Backup
    try {
      const raw = localStorage.getItem('pruefung-state')
      if (!raw) {
        alert('Keine gespeicherten Daten gefunden.')
        return
      }
      const data = JSON.parse(raw)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pruefung-backup-${new Date().toISOString().slice(0, 16)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Export fehlgeschlagen. Bitte Lehrperson kontaktieren.')
    }
  }

  render(): ReactNode {
    if (this.state.hatFehler) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
          <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <span className="text-amber-600 dark:text-amber-400 text-xl font-bold">!</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center mb-2">
              Ein Fehler ist aufgetreten
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              Ihre Antworten sind lokal gespeichert und gehen nicht verloren.
            </p>

            {/* Fehlerdetails (kollabiert) */}
            {this.state.fehler && (
              <details className="mb-6 text-xs">
                <summary className="text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">
                  Technische Details
                </summary>
                <pre className="mt-2 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-600 dark:text-slate-400 overflow-auto max-h-32">
                  {this.state.fehler.message}
                </pre>
              </details>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={this.handleNeuLaden}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-slate-700 dark:bg-slate-600 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors cursor-pointer"
              >
                Erneut versuchen
              </button>
              <button
                onClick={this.handleSeitenReload}
                className="w-full px-4 py-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Seite neu laden
              </button>
              <button
                onClick={() => { window.history.pushState({}, '', window.location.pathname); window.location.reload() }}
                className="w-full px-4 py-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                ← Zurück zur Startseite
              </button>
              <button
                onClick={this.handleDatenExport}
                className="w-full px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Antworten als Backup exportieren
              </button>
            </div>

            <p className="mt-6 text-xs text-slate-400 dark:text-slate-500 text-center">
              Falls das Problem bestehen bleibt: Lehrperson kontaktieren.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
