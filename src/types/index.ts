// Database types
export interface TestSession {
  id: string;
  studentId: string;
  learnositySessionId: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  assessmentId: string;
  results: AssessmentResult[];
  // Optional fields for enhanced functionality
  status?: "active" | "expired" | "completed" | "cancelled";
  lastAccessedAt?: Date;
  progress?: number; // 0-100 percentage
  metadata?: Record<string, any>; // For storing additional session data
}

export interface AssessmentResult {
  id: string;
  testSessionId: string;
  response: any;
  score?: number;
  timeSpent?: number;
  createdAt: Date;
  updatedAt: Date;
  // Optional fields for enhanced functionality
  questionId?: string;
  attemptNumber?: number;
  isCorrect?: boolean;
  metadata?: Record<string, any>;
}

export interface LearnosityConfig {
  id: string;
  endpoint: string;
  expiresMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

// API types
export interface CreateTestSessionRequest {
  studentId: string;
  assessmentId: string;
}

export interface UpdateTestSessionRequest {
  // No fields currently supported for updates

  [key: string]: never;
}

export interface CreateResultRequest {
  testSessionId: string;
  response: any;
  score?: number;
  timeSpent?: number;
}

export interface CreateLearnosityConfigRequest {
  endpoint: string;
  expiresMinutes: number;
}

export interface LearnosityConfigResponse {
  success: boolean;
  data: {
    config: LearnosityConfig;
  };
  timestamp: string;
}

// Learnosity types
export interface LearnositySessionConfig {
  user_id: string;
  session_id: string;
  activity_id: string;
  domain: string;
  consumer_key: string;
  timestamp: string;
  signature: string;
}

export interface LearnosityResponse {
  success: boolean;
  data: {
    learnosity: {
      domain: string;
      itemsRequest: any;
      securityConfig: any;
    };
    testSession: {
      id: string;
      studentId: string;
      assessmentId: string;
    };
  };
  timestamp: string;
}

// Session Management types
export type SessionStatus = "active" | "expired" | "completed" | "cancelled";

export interface SessionWithStatus extends TestSession {
  status: SessionStatus;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalSessions: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
  startIndex: number;
  endIndex: number;
  isEmpty: boolean;
}

export interface SessionsResponse {
  sessions: SessionWithStatus[];
  pagination: PaginationInfo;
}

// Session filtering and sorting types
export interface SessionFilters {
  status?: SessionStatus;
  assessmentId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface SessionSortOptions {
  field: "createdAt" | "expiresAt" | "assessmentId";
  direction: "asc" | "desc";
}

// Session display and formatting types
export interface SessionDisplayInfo {
  id: string;
  studentId: string;
  assessmentId: string;
  status: SessionStatus;
  createdAt: string; // Formatted date string
  expiresAt: string | null; // Formatted date string or null
  timeRemaining?: string; // Human-readable time remaining
  isExpired: boolean;
  canResume: boolean;
}

// Pagination request types
export interface PaginationRequest {
  page: number;
  limit: number;
  sortBy?: SessionSortOptions;
  filters?: SessionFilters;
}

// Error types for session management
export interface SessionError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export interface SessionManagementError {
  success: false;
  error: SessionError;
  timestamp: string;
}

// Component prop types
export interface TestSessionManagementProps {
  studentId: string;
  onStartNewTest: (studentId: string) => void;
  onResumeSession?: (sessionId: string) => void;
  initialPage?: number;
  pageSize?: number;
}

export interface SessionTableProps {
  sessions: SessionWithStatus[];
  isLoading: boolean;
  onResumeSession: (session: SessionWithStatus) => void;
  onStartNewTest: () => void;
}

export interface PaginationControlsProps {
  pagination: PaginationInfo;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

// Utility types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  displayText: string;
}

// API response types
export interface SessionListResponse {
  success: boolean;
  data: SessionsResponse;
  timestamp: string;
}

export interface SessionDetailResponse {
  success: boolean;
  data: {
    session: SessionWithStatus;
  };
  timestamp: string;
}

// Enhanced session types
export interface SessionProgress {
  currentQuestion: number;
  totalQuestions: number;
  percentage: number;
  timeSpent: number;
  estimatedTimeRemaining?: number;
}

export interface SessionAnalytics {
  totalTimeSpent: number;
  averageTimePerQuestion: number;
  questionsAnswered: number;
  questionsCorrect: number;
  accuracy: number;
  lastActivity: Date;
}

export interface SessionMetadata {
  browserInfo?: {
    userAgent: string;
    language: string;
    timezone: string;
  };
  deviceInfo?: {
    type: "desktop" | "mobile" | "tablet";
    screenResolution: string;
  };
  assessmentInfo?: {
    version: string;
    difficulty: string;
    category: string;
  };
  customData?: Record<string, any>;
}
