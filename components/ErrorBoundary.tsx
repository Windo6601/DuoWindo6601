import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const msg = error instanceof Error ? error.message : String(error || 'Unknown error');
    return { hasError: true, errorMessage: msg };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[DuoWindo6601 ErrorBoundary]:', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#131f24] text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#182328] border-2 border-gray-700 rounded-3xl p-6 md:p-8 text-center shadow-2xl space-y-4">
            <div className="text-5xl">🦉</div>
            <h2 className="text-2xl font-black text-white">
              Произошёл временный сбой экрана
            </h2>
            <p className="text-sm text-gray-300 font-bold leading-relaxed">
              Не переживайте — ваш прогресс DuoWindo6601 сохранён. Нажмите кнопку ниже, чтобы вернуться к обучению.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.reload();
              }}
              className="w-full py-3.5 bg-[#58cc02] hover:brightness-110 text-white font-black uppercase tracking-wider rounded-2xl border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1 transition-all cursor-pointer"
            >
              Перезагрузить DuoWindo6601
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
