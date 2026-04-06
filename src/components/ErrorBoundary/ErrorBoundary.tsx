import { Component, ErrorInfo, ReactNode } from "react";

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
      alert("Ошибка сохранена в консоли. Пожалуйста, отправьте скриншот разработчику.");
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <h1 style={{ color: "#f44336" }}>⚠️ Произошла ошибка</h1>
          <p>Игра столкнулась с непредвиденной ошибкой.</p>
          {this.state.error && (
            <details
              style={{
                margin: "20px 0",
                padding: "10px",
                background: "#f5f5f5",
                borderRadius: "4px",
                textAlign: "left",
              }}
            >
              <summary style={{ cursor: "pointer" }}>Детали ошибки</summary>
              <pre
                style={{
                  fontSize: "12px",
                  overflow: "auto",
                  maxHeight: "200px",
                }}
              >
                {this.state.error.message}
                {"\n"}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: "10px 20px",
                background: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Сбросить прогресс
            </button>
            <button
              onClick={this.handleReport}
              style={{
                padding: "10px 20px",
                background: "#2196f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Сообщить об ошибке
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
