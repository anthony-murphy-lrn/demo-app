// Application constants for the assessment delivery demo

export const APP_CONSTANTS = {
  // Session management
  DEFAULT_SESSION_TIMEOUT: 60, // minutes
  SESSION_CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes in milliseconds

  // Assessment configuration
  DEFAULT_QUESTIONS_PER_PAGE: 1,
  MAX_ATTEMPTS_PER_QUESTION: 3,

  // UI configuration
  LOADING_TIMEOUT: 10000, // 10 seconds
  ERROR_DISPLAY_DURATION: 5000, // 5 seconds

  // Security
  MEDIA_ACCESS_WINDOW: 30 * 60 * 1000, // 30 minutes in milliseconds
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB

  // API endpoints
  API_BASE_PATH: "/api",
  SESSIONS_ENDPOINT: "/api/sessions",
  LEARNOSITY_ENDPOINT: "/api/learnosity",
  RESULTS_ENDPOINT: "/api/results",
} as const;

export const ERROR_MESSAGES = {
  SESSION_NOT_FOUND: "Session not found or has expired",
  ASSESSMENT_LOAD_ERROR: "Failed to load assessment. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  VALIDATION_ERROR: "Please check your input and try again.",
  UNAUTHORIZED: "You are not authorized to access this resource.",
  SERVER_ERROR: "An unexpected error occurred. Please try again later.",
} as const;

export const SUCCESS_MESSAGES = {
  SESSION_CREATED: "Assessment session created successfully",
  PROGRESS_SAVED: "Your progress has been saved",
  ASSESSMENT_COMPLETED: "Assessment completed successfully",
} as const;

export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

