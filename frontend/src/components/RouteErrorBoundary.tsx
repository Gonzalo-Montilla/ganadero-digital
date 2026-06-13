import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
}

export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error en pantalla:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="gd-card max-w-md p-8 text-center">
            <p className="text-lg font-bold text-slate-900">{this.props.title ?? 'Algo salió mal'}</p>
            <p className="mt-2 text-sm text-slate-600">
              Recarga la página. Si acabas de actualizar la app, cierra la pestaña y vuelve a entrar.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="gd-btn-primary mt-5 !py-2.5"
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
