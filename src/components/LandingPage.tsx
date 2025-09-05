"use client";

import { useState } from "react";

interface LandingPageProps {
  onStartAssessment: (studentId: string) => void;
  onFindTestAttempts: (studentId: string) => void;
}

export default function LandingPage({
  onStartAssessment,
  onFindTestAttempts,
}: LandingPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");
  // const _router = useRouter();

  const handleStudentIdChange = (newStudentId: string) => {
    setStudentId(newStudentId);
    setError(null); // Clear any previous errors
  };

  const handleFindTestAttempts = () => {
    if (!studentId.trim()) {
      setError("Please enter your Student ID to find test attempts.");
      return;
    }

    if (studentId.trim().length < 3) {
      setError("Student ID must be at least 3 characters long.");
      return;
    }

    setError(null);
    onFindTestAttempts(studentId.trim());
  };

  const handleStartAssessment = async () => {
    if (!studentId.trim()) {
      setError("Please enter your Student ID to continue.");
      return;
    }

    if (studentId.trim().length < 3) {
      setError("Student ID must be at least 3 characters long.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call the parent handler with student ID - this will handle navigation
      await onStartAssessment(studentId);
    } catch (err) {
      setError("Failed to start assessment. Please try again.");
      console.error("Error starting assessment:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="row justify-content-center w-100">
        <div className="col-12 col-md-8 col-lg-6 col-xl-5">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5">
              {/* Student ID Input */}
              <div className="mb-4">
                <label htmlFor="studentId" className="form-label fw-semibold">
                  Student ID <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="studentId"
                  placeholder="Enter your Student ID (e.g., student123)"
                  value={studentId}
                  onChange={e => handleStudentIdChange(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <div className="form-text">
                  Enter any unique identifier for this demo session
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="alert alert-danger border-0 mb-4" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-grid gap-2">
                <button
                  className="btn btn-outline-primary btn-lg"
                  onClick={handleFindTestAttempts}
                  disabled={isLoading}
                >
                  <i className="bi bi-search me-2"></i>
                  Find Test Attempts
                </button>
                
                <button
                  className={`btn btn-primary btn-lg ${
                    isLoading ? "disabled" : ""
                  }`}
                  onClick={handleStartAssessment}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Starting Assessment...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-play-fill me-2"></i>
                      Start New Test
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
