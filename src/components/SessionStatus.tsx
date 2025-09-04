"use client";

import { useEffect, useState } from "react";
import { Session } from "@/types";

interface SessionStatusProps {
  sessionId: string;
  studentId: string;
}


export default function SessionStatus({
  sessionId,
  studentId,
}: SessionStatusProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simple validation that session exists
  const validateSession = async () => {
    try {
      const response = await fetch(`/api/sessions?studentId=${studentId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch session status");
      }

      const data = await response.json();
      const session: Session = data.data;

      if (!session || session.id !== sessionId) {
        throw new Error("Session not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session status");
      console.error("Error validating session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate session on mount
  useEffect(() => {
    validateSession();
  }, [sessionId, studentId]);


  if (isLoading) {
    return (
      <div className="session-status-loading">
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
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
            <small className="text-muted">
              Session ID: {sessionId}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}

