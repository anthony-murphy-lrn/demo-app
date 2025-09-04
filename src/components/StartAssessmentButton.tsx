"use client";

import { useState } from "react";

interface StartAssessmentButtonProps {
  onStart: () => Promise<void>;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "success" | "outline-primary";
}

export default function StartAssessmentButton({
  onStart,
  disabled = false,
  className = "",
  size = "lg",
  variant = "primary",
}: StartAssessmentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);
    setError(null);

    try {
      await onStart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start assessment");
      console.error("Error starting assessment:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonClasses = () => {
    const baseClasses = `btn btn-${variant}`;
    const sizeClasses = {
      sm: "btn-sm",
      md: "btn",
      lg: "btn-lg",
    };
    
    return `${baseClasses} ${sizeClasses[size]} ${className}`.trim();
  };

  return (
    <div className="d-grid">
      <button
        className={getButtonClasses()}
        onClick={handleClick}
        disabled={isLoading || disabled}
        aria-label="Start Assessment"
      >
        {isLoading ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            <span>Starting Assessment...</span>
          </>
        ) : (
          <>
            <i className="bi bi-play-fill me-2"></i>
            <span>Start Assessment</span>
          </>
        )}
      </button>

      {error && (
        <div className="alert alert-danger mt-3 mb-0" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close ms-auto"
            onClick={() => setError(null)}
            aria-label="Close"
          ></button>
        </div>
      )}
    </div>
  );
}

