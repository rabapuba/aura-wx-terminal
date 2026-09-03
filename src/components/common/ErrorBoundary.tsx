import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Aura WX Terminal:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    try {
      localStorage.removeItem('aura_wx_theme');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f141c] text-slate-100 flex items-center justify-center p-4 font-mono">
          <div className="max-w-md w-full p-6 rounded-xl bg-[#181f2c] border border-[#263147] shadow-xl text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-800/60">
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
                Terminal Initialization Alert
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                A runtime exception occurred while loading components.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left p-3 rounded bg-[#141a24] border border-[#263147] text-xs text-rose-300 max-h-36 overflow-y-auto font-mono">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Terminal</span>
              </button>
              <button
                onClick={this.handleResetStorage}
                className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors border border-[#263147]"
              >
                Reset Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
