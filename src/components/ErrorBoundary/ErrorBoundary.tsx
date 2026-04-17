import { Component, ErrorInfo, ReactNode } from "react";
import { t } from "../../locales/i18n";

import "./ErrorBoundary.css";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);

    try {
      localStorage.setItem(
        "harem-clicker-error",
        JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: Date.now(),
        }),
      );
    } catch {}
  }

  handleReset = () => {
    localStorage.removeItem("harem-clicker-save-v2");
    localStorage.removeItem("harem-clicker-error");
    window.location.reload();
  };

  handleReport = () => {
    if (this.state.error) {
      const errorData = {
        message: this.state.error.message,
        stack: this.state.error.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      };

      console.error("[ErrorBoundary] Error report:", errorData);
      alert(t("errorBoundary.reportMessage"));
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="error-boundary-container">
          <div className="error-card">
            <h1 className="error-title">⚠️ {t("errorBoundary.title")}</h1>
            <p className="error-description">{t("errorBoundary.description")}</p>

            {this.state.error && (
              <details className="error-details">
                <summary className="error-summary">{t("errorBoundary.details")}</summary>
                <pre className="error-stack">
                  {this.state.error.message}\n{this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="error-actions">
              <button className="btn btn-danger" onClick={this.handleReset}>
                {t("errorBoundary.resetButton")}
              </button>
              <button className="btn btn-secondary" onClick={this.handleReport}>
                {t("errorBoundary.reportButton")}
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
