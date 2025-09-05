/**
 * Utility functions for session management
 */

import {
  TestSession,
  SessionWithStatus,
  SessionStatus,
  SessionDisplayInfo,
  TimeRemaining,
  DateRange,
  SessionFilters,
  SessionSortOptions,
} from "@/types";

/**
 * Calculate session status based on expiration date
 */
export function calculateSessionStatus(session: TestSession): SessionStatus {
  if (!session.expiresAt) {
    return "active";
  }

  const now = new Date();
  return session.expiresAt < now ? "expired" : "active";
}

/**
 * Add status to a TestSession to create SessionWithStatus
 */
export function addSessionStatus(session: TestSession): SessionWithStatus {
  return {
    ...session,
    status: calculateSessionStatus(session),
  };
}

/**
 * Add status to multiple TestSessions
 */
export function addSessionStatusToMany(
  sessions: TestSession[]
): SessionWithStatus[] {
  return sessions.map(addSessionStatus);
}

/**
 * Check if a session can be resumed
 */
export function canResumeSession(session: SessionWithStatus): boolean {
  return session.status === "active" && !!session.learnositySessionId;
}

/**
 * Calculate time remaining until session expires
 */
export function calculateTimeRemaining(session: TestSession): TimeRemaining {
  if (!session.expiresAt) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: false,
      displayText: "No expiration",
    };
  }

  const now = new Date();
  const timeDiff = session.expiresAt.getTime() - now.getTime();

  if (timeDiff <= 0) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      displayText: "Expired",
    };
  }

  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

  let displayText = "";
  if (hours > 0) {
    displayText = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    displayText = `${minutes}m ${seconds}s`;
  } else {
    displayText = `${seconds}s`;
  }

  return {
    hours,
    minutes,
    seconds,
    isExpired: false,
    displayText,
  };
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Format date for display (date only)
 */
export function formatDateOnly(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format time for display (time only)
 */
export function formatTimeOnly(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Create session display info for UI components
 */
export function createSessionDisplayInfo(
  session: SessionWithStatus
): SessionDisplayInfo {
  const timeRemaining = calculateTimeRemaining(session);

  return {
    id: session.id,
    studentId: session.studentId,
    assessmentId: session.assessmentId,
    status: session.status,
    createdAt: formatDateForDisplay(session.createdAt),
    expiresAt: session.expiresAt
      ? formatDateForDisplay(session.expiresAt)
      : null,
    timeRemaining: timeRemaining.displayText,
    isExpired: timeRemaining.isExpired,
    canResume: canResumeSession(session),
  };
}

/**
 * Create display info for multiple sessions
 */
export function createSessionDisplayInfoForMany(
  sessions: SessionWithStatus[]
): SessionDisplayInfo[] {
  return sessions.map(createSessionDisplayInfo);
}

/**
 * Filter sessions based on criteria
 */
export function filterSessions(
  sessions: SessionWithStatus[],
  filters: SessionFilters
): SessionWithStatus[] {
  return sessions.filter(session => {
    if (filters.status && session.status !== filters.status) {
      return false;
    }

    if (filters.assessmentId && session.assessmentId !== filters.assessmentId) {
      return false;
    }

    if (filters.dateRange) {
      const sessionDate = new Date(session.createdAt);
      if (
        sessionDate < filters.dateRange.start ||
        sessionDate > filters.dateRange.end
      ) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort sessions based on criteria
 */
export function sortSessions(
  sessions: SessionWithStatus[],
  sortOptions: SessionSortOptions
): SessionWithStatus[] {
  return [...sessions].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortOptions.field) {
      case "createdAt":
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case "expiresAt":
        aValue = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
        bValue = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
        break;
      case "assessmentId":
        aValue = a.assessmentId;
        bValue = b.assessmentId;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortOptions.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOptions.direction === "asc" ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Get session statistics
 */
export function getSessionStatistics(sessions: SessionWithStatus[]): {
  total: number;
  active: number;
  expired: number;
  canResume: number;
} {
  return {
    total: sessions.length,
    active: sessions.filter(s => s.status === "active").length,
    expired: sessions.filter(s => s.status === "expired").length,
    canResume: sessions.filter(canResumeSession).length,
  };
}

/**
 * Check if session is expiring soon (within specified minutes)
 */
export function isSessionExpiringSoon(
  session: TestSession,
  minutesThreshold: number = 30
): boolean {
  if (!session.expiresAt) {
    return false;
  }

  const now = new Date();
  const timeDiff = session.expiresAt.getTime() - now.getTime();
  const minutesRemaining = timeDiff / (1000 * 60);

  return minutesRemaining > 0 && minutesRemaining <= minutesThreshold;
}

/**
 * Get sessions expiring soon
 */
export function getSessionsExpiringSoon(
  sessions: SessionWithStatus[],
  minutesThreshold: number = 30
): SessionWithStatus[] {
  return sessions.filter(
    session =>
      session.status === "active" &&
      isSessionExpiringSoon(session, minutesThreshold)
  );
}

/**
 * Create a date range for filtering
 */
export function createDateRange(start: Date, end: Date): DateRange {
  return { start, end };
}

/**
 * Create date range for last N days
 */
export function createLastNDaysRange(days: number): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  return { start, end };
}

/**
 * Validate session data
 */
export function validateSession(session: Partial<TestSession>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!session.id) {
    errors.push("Session ID is required");
  }

  if (!session.studentId) {
    errors.push("Student ID is required");
  }

  if (!session.assessmentId) {
    errors.push("Assessment ID is required");
  }

  if (!session.learnositySessionId) {
    errors.push("Learnosity Session ID is required");
  }

  if (!session.createdAt) {
    errors.push("Created date is required");
  }

  if (
    session.expiresAt &&
    session.createdAt &&
    new Date(session.expiresAt) <= new Date(session.createdAt)
  ) {
    errors.push("Expiration date must be after creation date");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get session status badge configuration
 */
export function getSessionStatusBadgeConfig(status: SessionStatus): {
  variant: "success" | "danger" | "warning" | "secondary";
  text: string;
  icon: string;
} {
  switch (status) {
    case "active":
      return {
        variant: "success",
        text: "Active",
        icon: "bi-check-circle-fill",
      };
    case "expired":
      return {
        variant: "danger",
        text: "Expired",
        icon: "bi-exclamation-triangle-fill",
      };
    default:
      return {
        variant: "secondary",
        text: "Unknown",
        icon: "bi-question-circle-fill",
      };
  }
}

/**
 * Format pagination info for display
 */
export function formatPaginationInfo(pagination: {
  currentPage: number;
  totalPages: number;
  totalSessions: number;
  startIndex: number;
  endIndex: number;
}): {
  pageText: string;
  rangeText: string;
  totalText: string;
} {
  return {
    pageText: `Page ${pagination.currentPage} of ${pagination.totalPages}`,
    rangeText: `Sessions ${pagination.startIndex + 1}-${Math.min(pagination.endIndex, pagination.totalSessions)}`,
    totalText: `${pagination.totalSessions} total sessions`,
  };
}
