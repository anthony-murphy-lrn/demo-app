"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console
    console.error("Error caught by boundary:", error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
          <div className="row justify-content-center w-100">
            <div className="col-12 col-md-8 col-lg-6 col-xl-5">
              <div className="card shadow-lg border-0">
                <div className="card-body p-5 text-center">
                  {/* Error Icon */}
                  <div className="mb-4">
                    <i
                      className="bi bi-exclamation-triangle-fill text-danger"
                      style={{ fontSize: "4rem" }}
                    ></i>
                  </div>

                  {/* Error Title */}
                  <h2 className="h3 fw-bold text-dark mb-3">
                    Something went wrong
                  </h2>

                  {/* Error Message */}
                  <p className="text-muted mb-4">
                    We encountered an unexpected error. Please try again or
                    contact support if the problem persists.
                  </p>

                  {/* Error Details (Development Only) */}
                  {process.env.NODE_ENV === "development" &&
                    this.state.error && (
                      <div className="alert alert-danger text-start mb-4">
                        <h6 className="alert-heading">
                          Error Details (Development)
                        </h6>
                        <p className="mb-2">
                          <strong>Message:</strong> {this.state.error.message}
                        </p>
                        {this.state.error.stack && (
                          <details>
                            <summary>Stack Trace</summary>
                            <pre
                              className="small mt-2 mb-0"
                              style={{ whiteSpace: "pre-wrap" }}
                            >
                              {this.state.error.stack}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}

                  {/* Action Buttons */}
                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={this.handleRetry}
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Try Again
                    </button>

                    <button
                      className="btn btn-outline-secondary"
                      onClick={this.handleReload}
                    >
                      <i className="bi bi-arrow-repeat me-2"></i>
                      Reload Page
                    </button>
                  </div>

                  {/* Support Information */}
                  <div className="mt-4">
                    <small className="text-muted">
                      If this problem continues, please contact support with the
                      error details above.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error("Error caught by hook:", error);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

// Error display component for functional components
interface ErrorDisplayProps {
  error: Error;
  onRetry?: () => void;
  onReload?: () => void;
  showDetails?: boolean;
}

export function ErrorDisplay({
  error,
  onRetry,
  onReload,
  showDetails = false,
}: ErrorDisplayProps) {
  return (
    <div className="alert alert-danger" role="alert">
      <div className="d-flex">
        <i className="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
        <div className="flex-grow-1">
          <h6 className="alert-heading mb-2">An error occurred</h6>
          <p className="mb-2">{error.message}</p>

          {showDetails && error.stack && (
            <details className="mb-3">
              <summary>Error Details</summary>
              <pre
                className="small mt-2 mb-0"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {error.stack}
              </pre>
            </details>
          )}

          <div className="d-flex gap-2">
            {onRetry && (
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={onRetry}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Try Again
              </button>
            )}
            {onReload && (
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={onReload}
              >
                <i className="bi bi-arrow-repeat me-1"></i>
                Reload
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
