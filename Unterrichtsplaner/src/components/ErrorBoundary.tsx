import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[ErrorBoundary: ${this.props.fallbackLabel || 'Komponente'}]`, error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
          <div className="text-3xl">⚠️</div>
          <p className="text-red-400 font-bold text-sm">
            Fehler in {this.props.fallbackLabel || 'Komponente'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            Erneut versuchen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
