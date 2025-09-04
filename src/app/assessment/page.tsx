"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AssessmentPlayer from "@/components/AssessmentPlayer";
import TestSessionStatus from "@/components/TestSessionStatus";
import ErrorBoundary from "@/components/ErrorBoundary";
import { TestSession } from "@/types";

export default function AssessmentPage() {
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get test session ID and student ID from URL params
  const testSessionId = searchParams.get("testSessionId");
  const studentId = searchParams.get("studentId");

  useEffect(() => {
    const loadTestSession = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Validate required parameters
        if (!studentId || !testSessionId) {
          console.log("Missing required parameters:", {
            studentId,
            testSessionId,
          });
          throw new Error("Student ID and Test Session ID are required");
        }

        // Fetch test session details using the testSessionId from URL params
        const response = await fetch(`/api/test-sessions/${testSessionId}`);

        if (!response.ok) {
          throw new Error("Failed to load test session");
        }

        const data = await response.json();
        const testSessionData: TestSession = data.data; // GET method returns data.data

        if (!testSessionData) {
          throw new Error("No active test session found");
        }

        if (testSessionData.status === "EXPIRED") {
          throw new Error(
            "Test session has expired. Please start a new assessment."
          );
        }

        setTestSession(testSessionData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load assessment";
        setError(errorMessage);
        console.error("Error loading test session:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTestSession();
  }, [studentId, testSessionId]);

  const handleAssessmentComplete = async (results: any) => {
    try {
      console.log("Assessment completed:", results);

      // Update test session status to completed
      if (testSession) {
        await fetch("/api/test-sessions", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            testSessionId: testSession.id,
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
          <p className="text-muted small">
            Please wait while we prepare your assessment
          </p>
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

  if (!testSession || !studentId) {
    return (
      <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="alert alert-warning" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>No Test Session Found</strong>
          </div>
          <button className="btn btn-primary" onClick={() => router.push("/")}>
            <i className="bi bi-house me-2"></i>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div
        className="assessment-page"
        style={{ maxWidth: "100vw", overflow: "hidden" }}
      >
        {/* Test Session Status Header */}
        <div className="bg-white border-bottom py-2">
          <div className="container">
            <TestSessionStatus testSessionId={testSession.id} studentId={studentId} />
          </div>
        </div>

        {/* Assessment Player */}
        <AssessmentPlayer
          sessionId={testSession.id}
          studentId={studentId}
          onComplete={handleAssessmentComplete}
          onError={handleAssessmentError}
        />
      </div>
    </ErrorBoundary>
  );
}
