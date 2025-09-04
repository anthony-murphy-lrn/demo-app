import { NextRequest } from "next/server";

// Validation utilities for API requests

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Validate required fields in request body
export function validateRequiredFields(
  body: Record<string, any>,
  requiredFields: string[]
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const field of requiredFields) {
    if (
      !body[field] ||
      (typeof body[field] === "string" && body[field].trim() === "")
    ) {
      errors.push({
        field,
        message: `${field} is required`,
        code: "MISSING_REQUIRED_FIELD",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate UUID/CUID format
export function validateIdFormat(id: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!id || typeof id !== "string") {
    errors.push({
      field: "id",
      message: "ID must be a valid string",
      code: "INVALID_ID_FORMAT",
    });
  } else if (id.length < 3) {
    errors.push({
      field: "id",
      message: "ID must be at least 3 characters long",
      code: "INVALID_ID_LENGTH",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate email format
export function validateEmail(email: string): ValidationResult {
  const errors: ValidationError[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || typeof email !== "string") {
    errors.push({
      field: "email",
      message: "Email is required",
      code: "MISSING_EMAIL",
    });
  } else if (!emailRegex.test(email)) {
    errors.push({
      field: "email",
      message: "Invalid email format",
      code: "INVALID_EMAIL_FORMAT",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate numeric range
export function validateNumericRange(
  value: number,
  field: string,
  min: number,
  max: number
): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof value !== "number" || isNaN(value)) {
    errors.push({
      field,
      message: `${field} must be a valid number`,
      code: "INVALID_NUMBER",
    });
  } else if (value < min || value > max) {
    errors.push({
      field,
      message: `${field} must be between ${min} and ${max}`,
      code: "OUT_OF_RANGE",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate session status
export function validateSessionStatus(status: string): ValidationResult {
  const errors: ValidationError[] = [];
  const validStatuses = ["ACTIVE", "COMPLETED", "EXPIRED", "CANCELLED"];

  if (!status || typeof status !== "string") {
    errors.push({
      field: "status",
      message: "Status is required",
      code: "MISSING_STATUS",
    });
  } else if (!validStatuses.includes(status)) {
    errors.push({
      field: "status",
      message: `Status must be one of: ${validStatuses.join(", ")}`,
      code: "INVALID_STATUS",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate JSON data
export function validateJsonData(data: any, field: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (data === null || data === undefined) {
    errors.push({
      field,
      message: `${field} cannot be null or undefined`,
      code: "NULL_JSON_DATA",
    });
  } else if (typeof data !== "object") {
    errors.push({
      field,
      message: `${field} must be a valid JSON object`,
      code: "INVALID_JSON_FORMAT",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate request query parameters
export function validateQueryParams(
  request: NextRequest,
  requiredParams: string[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const { searchParams } = new URL(request.url);

  for (const param of requiredParams) {
    const value = searchParams.get(param);
    if (!value || value.trim() === "") {
      errors.push({
        field: param,
        message: `Query parameter '${param}' is required`,
        code: "MISSING_QUERY_PARAM",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate request body
export function validateRequestBody(
  body: any,
  requiredFields: string[]
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!body || typeof body !== "object") {
    errors.push({
      field: "body",
      message: "Request body is required and must be a valid JSON object",
      code: "INVALID_REQUEST_BODY",
    });
    return {
      isValid: false,
      errors,
    };
  }

  return validateRequiredFields(body, requiredFields);
}

// Combine multiple validation results
export function combineValidationResults(
  ...results: ValidationResult[]
): ValidationResult {
  const allErrors: ValidationError[] = [];
  let isValid = true;

  for (const result of results) {
    if (!result.isValid) {
      isValid = false;
      allErrors.push(...result.errors);
    }
  }

  return {
    isValid,
    errors: allErrors,
  };
}
