"use client";

import { useEffect, useState } from "react";
import { TestSession } from "@/types";

interface TestSessionStatusProps {
  testSessionId: string;
  studentId: string;
}

export default function TestSessionStatus({
  testSessionId,
  studentId,
}: TestSessionStatusProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simple validation that test session exists
  const validateTestSession = async () => {
    try {
      const response = await fetch(`/api/test-sessions?studentId=${studentId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch test session status");
      }

      const data = await response.json();
      const testSession: TestSession = data.data;

      if (!testSession || testSession.id !== testSessionId) {
        throw new Error("Test session not found");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load test session status"
      );
      console.error("Error validating test session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate session on mount
  useEffect(() => {
    validateTestSession();
  }, [testSessionId, studentId]);

  if (isLoading) {
    return (
      <div className="session-status-loading">
        <div
          className="spinner-border spinner-border-sm text-primary me-2"
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <small className="text-muted">Loading session status...</small>
      </div>
    );
  }

  if (error) {
    return (
      <div className="session-status-error">
        <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
        <small className="text-muted">Status unavailable</small>
      </div>
    );
  }

  return (
    <div className="session-status">
      <div className="row align-items-center g-2">
        {/* Session ID Only */}
        <div className="col">
          <div className="d-flex align-items-center">
            <small className="text-muted">Test Session ID: {testSessionId}</small>
          </div>
        </div>
      </div>
    </div>
  );
}
