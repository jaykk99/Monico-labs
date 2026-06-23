import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

class ErrorBoundary extends Component<Props, State> {
  declare props: Props;
  public state: State = {
    hasError: false,
    errorMsg: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message + "\n" + error.stack };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', fontFamily: 'monospace', zIndex: 9999, position: 'absolute', background: 'black', width: '100%', height: '100%' }}>
          <h1>React Runtime Error Caught</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.errorMsg}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
