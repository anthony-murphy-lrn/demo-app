"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PaginationInfo, SessionWithStatus, SessionsResponse } from "@/types";

interface TestSessionManagementProps {
  studentId: string;
  onStartNewTest: (studentId: string) => void;
}

export default function TestSessionManagement({
  studentId,
  onStartNewTest,
}: TestSessionManagementProps) {
  const [sessions, setSessions] = useState<SessionWithStatus[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalSessions: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    limit: 5,
    startIndex: 0,
    endIndex: 0,
    isEmpty: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialLoadRef = useRef(true);

  // Enhanced fetch sessions with better state management
  const fetchSessions = useCallback(
    async (page: number = 1, limit: number = 5) => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/test-sessions?studentId=${studentId}&page=${page}&limit=${limit}`,
          { signal: abortControllerRef.current.signal }
        );

        if (!response.ok) {
          if (response.status === 404) {
            // No sessions found - this is not an error
            setSessions([]);
            setPagination({
              currentPage: 1,
              totalPages: 1,
              totalSessions: 0,
              hasNextPage: false,
              hasPreviousPage: false,
              limit: 5,
              startIndex: 0,
              endIndex: 0,
              isEmpty: true,
            });
            return;
          }
          throw new Error(
            `Failed to fetch sessions: ${response.status} ${response.statusText}`
          );
        }

        const responseData = await response.json();

        // Validate response structure
        if (!responseData.success || !responseData.data) {
          throw new Error("Invalid response format from server");
        }

        const data: SessionsResponse = responseData.data;

        // Validate response data
        if (!data.testSessions || !data.pagination) {
          throw new Error("Invalid response format from server");
        }

        setSessions(data.testSessions);
        setPagination(data.pagination);
        setRetryCount(0); // Reset retry count on success
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was cancelled, don't update state
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : "Failed to load sessions";
        setError(errorMessage);
        console.error("Error fetching sessions:", err);

        // Auto-retry logic for network errors
        if (retryCount < 3 && errorMessage.includes("fetch")) {
          setTimeout(
            () => {
              setRetryCount(prev => prev + 1);
              fetchSessions(page, limit);
            },
            1000 * Math.pow(2, retryCount)
          ); // Exponential backoff
        }
      } finally {
        setIsLoading(false);
      }
    },
    [studentId, retryCount]
  );

  // Initial load effect
  useEffect(() => {
    if (studentId) {
      isInitialLoadRef.current = true;
      fetchSessions(1, 5);
    }
  }, [studentId, fetchSessions]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleResumeSession = (session: SessionWithStatus) => {
    if (session.status === "active") {
      router.push(
        `/assessment?studentId=${studentId}&testSessionId=${session.id}`
      );
    }
  };

  const handlePageChange = useCallback(
    async (newPage: number) => {
      // Validate page number
      if (
        newPage < 1 ||
        newPage > pagination.totalPages ||
        newPage === pagination.currentPage
      ) {
        return;
      }

      // Update URL to reflect current page (optional - for bookmarking)
      const url = new URL(window.location.href);
      url.searchParams.set("page", newPage.toString());
      window.history.replaceState({}, "", url.toString());

      // Fetch new page data
      await fetchSessions(newPage, 5);
    },
    [pagination.currentPage, pagination.totalPages, fetchSessions]
  );

  // Handle keyboard navigation
  const handleKeyDown = (
    event: React.KeyboardEvent,
    action: "previous" | "next"
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (action === "previous" && pagination.hasPreviousPage) {
        handlePageChange(pagination.currentPage - 1);
      } else if (action === "next" && pagination.hasNextPage) {
        handlePageChange(pagination.currentPage + 1);
      }
    }
  };

  // Handle retry from error state
  const handleRetry = useCallback(() => {
    setRetryCount(0);
    setError(null);
    fetchSessions(1, 5); // Reset to first page
  }, [fetchSessions]);

  const formatDateTime = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="badge bg-success">Active</span>;
      case "expired":
        return <span className="badge bg-danger">Expired</span>;
      case "completed":
        return <span className="badge bg-primary">Completed</span>;
      case "cancelled":
        return <span className="badge bg-secondary">Cancelled</span>;
      default:
        return <span className="badge bg-light text-dark">Unknown</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10">
            <div className="text-center">
              <div
                className="spinner-border text-primary mb-3"
                role="status"
                style={{ width: "3rem", height: "3rem" }}
              >
                <span className="visually-hidden">Loading sessions...</span>
              </div>
              <h5 className="text-muted">
                {isInitialLoadRef.current
                  ? "Loading your test sessions..."
                  : "Loading page..."}
              </h5>
              <p className="text-muted small">
                {isInitialLoadRef.current
                  ? "Please wait while we fetch your assessment history"
                  : "Please wait while we load the next page"}
              </p>
              {retryCount > 0 && (
                <div className="mt-2">
                  <small className="text-warning">
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Retry attempt {retryCount} of 3
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10">
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>Error:</strong> {error}
            </div>
            <div className="text-center">
              <button className="btn btn-primary" onClick={handleRetry}>
                <i className="bi bi-arrow-clockwise me-2"></i>
                Try Again
              </button>
              {retryCount > 0 && (
                <div className="mt-2">
                  <small className="text-muted">
                    Retry attempt {retryCount} of 3
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10">
            <div className="text-center">
              <div className="mb-3">
                <i
                  className="bi bi-clipboard-data text-muted"
                  style={{ fontSize: "3rem" }}
                ></i>
              </div>
              <h5 className="text-muted">No test sessions found</h5>
              <p className="text-muted">
                You don&apos;t have any test sessions yet.
              </p>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => onStartNewTest(studentId)}
              >
                <i className="bi bi-play-fill me-2"></i>
                Start New Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3 py-md-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8">
          {/* Header */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mb-md-4">
            <h4 className="mb-2 mb-md-0">Your Test Sessions</h4>
            <button
              className="btn btn-primary w-100 w-md-auto"
              onClick={() => onStartNewTest(studentId)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Start New Test
            </button>
          </div>

          {/* Sessions Table */}
          <div className="card">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="d-none d-md-table-cell">Session ID</th>
                      <th className="d-none d-lg-table-cell">Start Time</th>
                      <th className="d-none d-md-table-cell">Expiry Time</th>
                      <th>Status</th>
                      <th className="d-none d-lg-table-cell">Test Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(session => (
                      <tr
                        key={session.id}
                        className={
                          session.status === "expired"
                            ? "table-secondary opacity-75"
                            : ""
                        }
                      >
                        <td className="d-none d-md-table-cell">
                          <code
                            className={`small ${session.status === "expired" ? "text-muted" : ""}`}
                          >
                            {session.id}
                          </code>
                        </td>
                        <td
                          className={`d-none d-lg-table-cell ${session.status === "expired" ? "text-muted" : ""}`}
                        >
                          {formatDateTime(session.createdAt)}
                        </td>
                        <td
                          className={`d-none d-md-table-cell ${session.status === "expired" ? "text-danger fw-semibold" : ""}`}
                        >
                          {session.expiresAt
                            ? formatDateTime(session.expiresAt)
                            : "No expiration"}
                        </td>
                        <td>{getStatusBadge(session.status)}</td>
                        <td className="d-none d-lg-table-cell">
                          <code
                            className={`small ${session.status === "expired" ? "text-muted" : ""}`}
                          >
                            {session.assessmentId}
                          </code>
                        </td>
                        <td>
                          {session.status === "active" ? (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleResumeSession(session)}
                            >
                              <i className="bi bi-play-fill me-1"></i>
                              <span className="d-none d-sm-inline">Resume</span>
                            </button>
                          ) : (
                            <span className="text-danger small fw-semibold">
                              <i className="bi bi-exclamation-triangle-fill me-1"></i>
                              <span className="d-none d-sm-inline">
                                Expired
                              </span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 mt-md-4 gap-3">
              <div className="text-muted small text-center text-md-start">
                <div className="d-flex flex-column flex-sm-row align-items-center align-items-sm-start gap-1">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-list-ul me-1"></i>
                    <span className="fw-semibold">
                      Page {pagination.currentPage}
                    </span>
                    <span className="mx-1">of</span>
                    <span className="fw-semibold">{pagination.totalPages}</span>
                  </div>
                  <div className="d-flex align-items-center text-muted">
                    <span className="d-none d-sm-inline">•</span>
                    <span className="ms-1">
                      {pagination.totalSessions} total sessions
                    </span>
                  </div>
                </div>
                {pagination.totalSessions > 0 && (
                  <div className="mt-1">
                    <span className="badge bg-light text-dark border">
                      <i className="bi bi-arrow-right-circle me-1"></i>
                      Sessions {(pagination.currentPage - 1) * 5 + 1}-
                      {Math.min(
                        pagination.currentPage * 5,
                        pagination.totalSessions
                      )}
                    </span>
                  </div>
                )}
              </div>
              <div className="d-flex flex-column flex-md-row align-items-center gap-2">
                {/* Page Indicators */}
                {pagination.totalPages <= 7 ? (
                  <div
                    className="btn-group btn-group-sm"
                    role="group"
                    aria-label="Page indicators"
                  >
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    ).map(pageNum => (
                      <button
                        key={pageNum}
                        className={`btn ${pageNum === pagination.currentPage ? "btn-primary" : "btn-outline-secondary"} ${isLoading ? "opacity-50" : ""}`}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isLoading}
                        aria-label={`Go to page ${pageNum}`}
                        title={`Page ${pageNum}`}
                      >
                        {isLoading && pageNum === pagination.currentPage ? (
                          <span
                            className="spinner-border spinner-border-sm me-1"
                            role="status"
                            aria-hidden="true"
                          ></span>
                        ) : null}
                        {pageNum}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="d-flex align-items-center gap-1">
                    <span className="text-muted small">Pages:</span>
                    <div className="d-flex gap-1">
                      {pagination.currentPage > 1 && (
                        <button
                          className={`btn btn-sm btn-outline-secondary ${isLoading ? "opacity-50" : ""}`}
                          onClick={() => handlePageChange(1)}
                          disabled={isLoading}
                          title="First page"
                        >
                          {isLoading ? (
                            <span
                              className="spinner-border spinner-border-sm me-1"
                              role="status"
                              aria-hidden="true"
                            ></span>
                          ) : null}
                          1
                        </button>
                      )}
                      {pagination.currentPage > 3 && (
                        <span className="text-muted">...</span>
                      )}
                      {pagination.currentPage > 2 && (
                        <button
                          className={`btn btn-sm btn-outline-secondary ${isLoading ? "opacity-50" : ""}`}
                          onClick={() =>
                            handlePageChange(pagination.currentPage - 1)
                          }
                          disabled={isLoading}
                          title={`Page ${pagination.currentPage - 1}`}
                        >
                          {isLoading ? (
                            <span
                              className="spinner-border spinner-border-sm me-1"
                              role="status"
                              aria-hidden="true"
                            ></span>
                          ) : null}
                          {pagination.currentPage - 1}
                        </button>
                      )}
                      <button
                        className={`btn btn-sm btn-primary ${isLoading ? "opacity-75" : ""}`}
                        disabled
                        title={`Current page ${pagination.currentPage}`}
                      >
                        {isLoading ? (
                          <span
                            className="spinner-border spinner-border-sm me-1"
                            role="status"
                            aria-hidden="true"
                          ></span>
                        ) : null}
                        {pagination.currentPage}
                      </button>
                      {pagination.currentPage < pagination.totalPages - 1 && (
                        <button
                          className={`btn btn-sm btn-outline-secondary ${isLoading ? "opacity-50" : ""}`}
                          onClick={() =>
                            handlePageChange(pagination.currentPage + 1)
                          }
                          disabled={isLoading}
                          title={`Page ${pagination.currentPage + 1}`}
                        >
                          {isLoading ? (
                            <span
                              className="spinner-border spinner-border-sm me-1"
                              role="status"
                              aria-hidden="true"
                            ></span>
                          ) : null}
                          {pagination.currentPage + 1}
                        </button>
                      )}
                      {pagination.currentPage < pagination.totalPages - 2 && (
                        <span className="text-muted">...</span>
                      )}
                      {pagination.currentPage < pagination.totalPages && (
                        <button
                          className={`btn btn-sm btn-outline-secondary ${isLoading ? "opacity-50" : ""}`}
                          onClick={() =>
                            handlePageChange(pagination.totalPages)
                          }
                          disabled={isLoading}
                          title="Last page"
                        >
                          {isLoading ? (
                            <span
                              className="spinner-border spinner-border-sm me-1"
                              role="status"
                              aria-hidden="true"
                            ></span>
                          ) : null}
                          {pagination.totalPages}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div
                  className="btn-group w-100 w-md-auto"
                  role="group"
                  aria-label="Pagination controls"
                >
                  <button
                    className={`btn btn-outline-secondary flex-fill flex-md-fill-0 ${isLoading ? "opacity-50" : ""}`}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    onKeyDown={e => handleKeyDown(e, "previous")}
                    disabled={!pagination.hasPreviousPage || isLoading}
                    aria-label="Go to previous page"
                    title="Previous page (or press Enter/Space)"
                  >
                    {isLoading ? (
                      <span
                        className="spinner-border spinner-border-sm me-1"
                        role="status"
                        aria-hidden="true"
                      ></span>
                    ) : (
                      <i className="bi bi-chevron-left"></i>
                    )}
                    <span className="d-none d-sm-inline ms-1">Previous</span>
                  </button>
                  <button
                    className={`btn btn-outline-secondary flex-fill flex-md-fill-0 ${isLoading ? "opacity-50" : ""}`}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    onKeyDown={e => handleKeyDown(e, "next")}
                    disabled={!pagination.hasNextPage || isLoading}
                    aria-label="Go to next page"
                    title="Next page (or press Enter/Space)"
                  >
                    <span className="d-none d-sm-inline me-1">Next</span>
                    {isLoading ? (
                      <span
                        className="spinner-border spinner-border-sm ms-1"
                        role="status"
                        aria-hidden="true"
                      ></span>
                    ) : (
                      <i className="bi bi-chevron-right"></i>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
