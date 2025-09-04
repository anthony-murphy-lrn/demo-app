"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Session } from "@/types";
import SessionStatus from "./SessionStatus";

interface SessionResumptionProps {
  studentId: string;
  onSessionResume?: (session: Session) => void;
}

export default function SessionResumption({
  studentId,
  onSessionResume,
}: SessionResumptionProps) {
  const [existingSession, setExistingSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check for existing session
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/sessions?studentId=${studentId}`);

        if (response.status === 404) {
          // No existing session found - this is normal, not an error
          console.log("No existing session found for student:", studentId);
          setExistingSession(null);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to check for existing session");
        }

        const data = await response.json();
        const session: Session = data.data; // GET method returns data.data directly

        if (session && session.status === "ACTIVE") {
          setExistingSession(session);
        } else {
          setExistingSession(null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to check session status"
        );
        console.error("Error checking existing session:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, [studentId]);

  const handleResumeSession = () => {
    if (existingSession) {
      onSessionResume?.(existingSession);
      router.push("/assessment");
    }
  };

  const handleStartNewSession = async () => {
    try {
      // Create a new session
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          assessmentId: "demo-assessment-1",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create new session");
      }

      const data = await response.json();
      const newSession: Session = data.data.session; // POST method returns data.data.session

      onSessionResume?.(newSession);
      router.push("/assessment");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start new session"
      );
      console.error("Error creating new session:", err);
    }
  };

  const handleCancelSession = async () => {
    if (!existingSession) return;

    try {
      const response = await fetch(`/api/sessions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: existingSession.id,
          status: "CANCELLED",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel session");
      }

      setExistingSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel session");
      console.error("Error cancelling session:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Checking for existing sessions...</h5>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>Error:</strong> {error}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!existingSession) {
    return null; // No existing session, show normal landing page
  }

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="row justify-content-center w-100">
        <div className="col-12 col-md-8 col-lg-6 col-xl-5">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="mb-3">
                  <i
                    className="bi bi-arrow-clockwise text-warning"
                    style={{ fontSize: "3rem" }}
                  ></i>
                </div>
                <h2 className="h3 fw-bold text-dark mb-2">Resume Assessment</h2>
                <p className="text-muted mb-0">
                  You have an active assessment session
                </p>
              </div>

              {/* Session Details */}
              <div className="alert alert-info border-0 mb-4">
                <div className="d-flex">
                  <i className="bi bi-info-circle-fill me-2 mt-1"></i>
                  <div>
                    <h6 className="alert-heading mb-2">Session Information</h6>
                    <div className="row g-2 small">
                      <div className="col-6">
                        <strong>Session ID:</strong>
                        <br />
                        <code className="small">{existingSession.id}</code>
                      </div>
                      <div className="col-6">
                        <strong>Started:</strong>
                        <br />
                        {new Date(existingSession.createdAt).toLocaleString()}
                      </div>
                      <div className="col-6">
                        <strong>Status:</strong>
                        <br />
                        <span
                          className={`badge bg-${existingSession.status === "ACTIVE" ? "success" : "secondary"}`}
                        >
                          {existingSession.status}
                        </span>
                      </div>
                      <div className="col-6">
                        <strong>Assessment ID:</strong>
                        <br />
                        <code className="small">
                          {existingSession.assessmentId}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Status */}
              <div className="mb-4">
                <h6 className="mb-2">Current Status</h6>
                <SessionStatus
                  sessionId={existingSession.id}
                  studentId={studentId}
                />
              </div>

              {/* Action Buttons */}
              <div className="d-grid gap-2">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleResumeSession}
                >
                  <i className="bi bi-play-fill me-2"></i>
                  Resume Assessment
                </button>

                <div className="row g-2">
                  <div className="col-6">
                    <button
                      className="btn btn-outline-secondary w-100"
                      onClick={handleStartNewSession}
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      Start New
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      className="btn btn-outline-danger w-100"
                      onClick={handleCancelSession}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Cancel Session
                    </button>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="alert alert-warning border-0 mt-4 mb-0">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <small>
                  <strong>Note:</strong> Starting a new session will cancel your
                  current one. Your progress will be saved but you&apos;ll need
                  to start over.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
