import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import createLogger from "@shared/logger";

const logger = createLogger("ErrorBoundary");

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error({
      event: "react_component_error_caught",
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      const error = this.state.error;

      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
          <div className="max-w-md w-full rounded-xl border border-red-500/30 bg-red-950/20 p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-white/70">{error.message}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={this.reset}
                className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                type="button"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="text-sm px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
                type="submit"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
