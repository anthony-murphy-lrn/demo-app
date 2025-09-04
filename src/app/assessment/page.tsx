"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AssessmentPlayer from "@/components/AssessmentPlayer";
import SessionStatus from "@/components/SessionStatus";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Session } from "@/types";

export default function AssessmentPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get session ID and student ID from URL params
  const sessionId = searchParams.get("sessionId");
  const studentId = searchParams.get("studentId");

  useEffect(() => {
    const loadSession = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Validate required parameters
        if (!studentId) {
          console.log("Student ID not found in URL params:", { studentId, sessionId });
          throw new Error("Student ID is required");
        }

        // Fetch session details
        const response = await fetch(`/api/sessions?studentId=${studentId}`);
        
        if (!response.ok) {
          throw new Error("Failed to load session");
        }

        const data = await response.json();
        const sessionData: Session = data.data; // GET method returns data.data directly

        if (!sessionData) {
          throw new Error("No active session found");
        }

        if (sessionData.status === "EXPIRED") {
          throw new Error("Session has expired. Please start a new assessment.");
        }

        setSession(sessionData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load assessment";
        setError(errorMessage);
        console.error("Error loading session:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [studentId]);

  const handleAssessmentComplete = async (results: any) => {
    try {
      console.log("Assessment completed:", results);
      
      // Update session status to completed
      if (session) {
        await fetch("/api/sessions", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
                  body: JSON.stringify({
          sessionId: session.id,
          status: "COMPLETED",
        }),
        });
      }

      // Navigate to results page or back to home
      router.push("/?completed=true");
    } catch (err) {
      console.error("Error handling assessment completion:", err);
      setError("Failed to save assessment results");
    }
  };

  const handleAssessmentError = (error: string) => {
    setError(error);
    console.error("Assessment error:", error);
  };

  if (isLoading) {
    return (
      <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading Assessment...</h5>
          <p className="text-muted small">Please wait while we prepare your assessment</p>
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
          <div className="d-grid gap-2 d-md-flex justify-content-md-center">
            <button
              className="btn btn-primary"
              onClick={() => router.push("/")}
            >
              <i className="bi bi-house me-2"></i>
              Return to Home
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => window.location.reload()}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !studentId) {
    return (
      <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="alert alert-warning" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>No Session Found</strong>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => router.push("/")}
          >
            <i className="bi bi-house me-2"></i>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="assessment-page" style={{ maxWidth: '100vw', overflow: 'hidden' }}>
        {/* Session Status Header */}
        <div className="bg-white border-bottom py-2">
          <div className="container">
            <SessionStatus
              sessionId={session.id}
              studentId={studentId}
            />
          </div>
        </div>

        {/* Assessment Player */}
        <AssessmentPlayer
          sessionId={session.id}
          studentId={studentId}
          onComplete={handleAssessmentComplete}
          onError={handleAssessmentError}
        />
      </div>
    </ErrorBoundary>
  );
}
