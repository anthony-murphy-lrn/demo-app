import { NextResponse } from "next/server";
import { STATUS_CODES, ERROR_MESSAGES } from "@/constants";
import { ValidationError, ValidationResult } from "./validation";

// Error handling utilities for API responses

export interface ApiError {
  error: string;
  details?: ValidationError[];
  code?: string;
  timestamp?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: ValidationError[];
  code?: string;
  timestamp?: string;
}

// Create standardized error response
export function createErrorResponse(
  message: string,
  statusCode: number = STATUS_CODES.BAD_REQUEST,
  details?: ValidationError[],
  code?: string
): NextResponse<ApiError> {
  const errorResponse: ApiError = {
    error: message,
    timestamp: new Date().toISOString(),
  };

  if (details && details.length > 0) {
    errorResponse.details = details;
  }

  if (code) {
    errorResponse.code = code;
  }

  return NextResponse.json(errorResponse, { status: statusCode });
}

// Create standardized success response
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = STATUS_CODES.OK
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status: statusCode });
}

// Handle validation errors
export function handleValidationErrors(
  validationResult: ValidationResult
): NextResponse<ApiError> | null {
  if (!validationResult.isValid) {
    return createErrorResponse(
      ERROR_MESSAGES.VALIDATION_ERROR,
      STATUS_CODES.BAD_REQUEST,
      validationResult.errors,
      "VALIDATION_FAILED"
    );
  }
  return null;
}

// Handle database errors
export function handleDatabaseError(error: any): NextResponse<ApiError> {
  console.error("Database error:", error);

  // Handle specific database errors
  if (error.code === "P2002") {
    return createErrorResponse(
      "A record with this unique field already exists",
      STATUS_CODES.BAD_REQUEST,
      undefined,
      "DUPLICATE_RECORD"
    );
  }

  if (error.code === "P2025") {
    return createErrorResponse(
      "Record not found",
      STATUS_CODES.NOT_FOUND,
      undefined,
      "RECORD_NOT_FOUND"
    );
  }

  if (error.code === "P2003") {
    return createErrorResponse(
      "Foreign key constraint failed",
      STATUS_CODES.BAD_REQUEST,
      undefined,
      "FOREIGN_KEY_ERROR"
    );
  }

  // Generic database error
  return createErrorResponse(
    ERROR_MESSAGES.SERVER_ERROR,
    STATUS_CODES.INTERNAL_SERVER_ERROR,
    undefined,
    "DATABASE_ERROR"
  );
}

// Handle authentication errors
export function handleAuthError(message?: string): NextResponse<ApiError> {
  return createErrorResponse(
    message || ERROR_MESSAGES.UNAUTHORIZED,
    STATUS_CODES.UNAUTHORIZED,
    undefined,
    "AUTHENTICATION_ERROR"
  );
}

// Handle not found errors
export function handleNotFoundError(resource: string): NextResponse<ApiError> {
  return createErrorResponse(
    `${resource} not found`,
    STATUS_CODES.NOT_FOUND,
    undefined,
    "NOT_FOUND"
  );
}

// Handle rate limiting errors
export function handleRateLimitError(): NextResponse<ApiError> {
  return createErrorResponse(
    "Too many requests. Please try again later.",
    429, // TOO_MANY_REQUESTS not available in current STATUS_CODES
    undefined,
    "RATE_LIMIT_EXCEEDED"
  );
}

// Handle Learnosity API errors
export function handleLearnosityError(error: any): NextResponse<ApiError> {
  console.error("Learnosity API error:", error);

  if (error.code === "INVALID_SIGNATURE") {
    return createErrorResponse(
      "Invalid Learnosity signature",
      STATUS_CODES.UNAUTHORIZED,
      undefined,
      "LEARNOSITY_SIGNATURE_ERROR"
    );
  }

  if (error.code === "CONFIGURATION_ERROR") {
    return createErrorResponse(
      "Learnosity is not properly configured",
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      undefined,
      "LEARNOSITY_CONFIG_ERROR"
    );
  }

  return createErrorResponse(
    "Learnosity API error occurred",
    STATUS_CODES.INTERNAL_SERVER_ERROR,
    undefined,
    "LEARNOSITY_API_ERROR"
  );
}

// Generic error handler
export function handleGenericError(
  error: any,
  context: string = "API"
): NextResponse<ApiError> {
  console.error(`${context} error:`, error);

  // Handle known error types
  if (error.name === "ValidationError") {
    return createErrorResponse(
      ERROR_MESSAGES.VALIDATION_ERROR,
      STATUS_CODES.BAD_REQUEST,
      undefined,
      "VALIDATION_ERROR"
    );
  }

  if (error.name === "PrismaClientKnownRequestError") {
    return handleDatabaseError(error);
  }

  if (error.name === "PrismaClientValidationError") {
    return createErrorResponse(
      "Invalid data format",
      STATUS_CODES.BAD_REQUEST,
      undefined,
      "INVALID_DATA_FORMAT"
    );
  }

  // Default error response
  return createErrorResponse(
    ERROR_MESSAGES.SERVER_ERROR,
    STATUS_CODES.INTERNAL_SERVER_ERROR,
    undefined,
    "INTERNAL_ERROR"
  );
}

// Async error wrapper for API handlers
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context: string = "API"
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      throw handleGenericError(error, context);
    }
  };
}
