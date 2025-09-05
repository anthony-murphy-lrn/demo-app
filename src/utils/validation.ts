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

// Learnosity Configuration Validation

// Valid Learnosity Items API endpoints
const VALID_LEARNOSITY_ENDPOINTS = [
  "items-va.learnosity.com",
  "items-ie.learnosity.com",
  "items-au.learnosity.com",
];

// Validate Learnosity endpoint URL
export function validateLearnosityEndpoint(endpoint: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!endpoint || typeof endpoint !== "string") {
    errors.push({
      field: "endpoint",
      message: "Learnosity endpoint is required",
      code: "MISSING_ENDPOINT",
    });
  } else if (endpoint.trim() === "") {
    errors.push({
      field: "endpoint",
      message: "Learnosity endpoint cannot be empty",
      code: "EMPTY_ENDPOINT",
    });
  } else if (!VALID_LEARNOSITY_ENDPOINTS.includes(endpoint.trim())) {
    errors.push({
      field: "endpoint",
      message: `Invalid Learnosity endpoint. Must be one of: ${VALID_LEARNOSITY_ENDPOINTS.join(", ")}`,
      code: "INVALID_ENDPOINT",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate Learnosity expiry time in minutes
export function validateLearnosityExpiryMinutes(
  expiresMinutes: number
): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof expiresMinutes !== "number" || isNaN(expiresMinutes)) {
    errors.push({
      field: "expiresMinutes",
      message: "Expiry time must be a valid number",
      code: "INVALID_EXPIRY_TYPE",
    });
  } else if (expiresMinutes <= 0) {
    errors.push({
      field: "expiresMinutes",
      message: "Expiry time must be greater than 0 minutes",
      code: "INVALID_EXPIRY_RANGE",
    });
  } else if (expiresMinutes > 1440) {
    // 24 hours max
    errors.push({
      field: "expiresMinutes",
      message: "Expiry time cannot exceed 1440 minutes (24 hours)",
      code: "EXPIRY_TOO_LONG",
    });
  } else if (!Number.isInteger(expiresMinutes)) {
    errors.push({
      field: "expiresMinutes",
      message: "Expiry time must be a whole number of minutes",
      code: "NON_INTEGER_EXPIRY",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validate complete Learnosity configuration
export function validateLearnosityConfig(config: {
  endpoint: string;
  expiresMinutes: number;
}): ValidationResult {
  const endpointValidation = validateLearnosityEndpoint(config.endpoint);
  const expiryValidation = validateLearnosityExpiryMinutes(
    config.expiresMinutes
  );

  return combineValidationResults(endpointValidation, expiryValidation);
}

// Validate Learnosity configuration request body
export function validateLearnosityConfigRequest(body: any): ValidationResult {
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

  // Check required fields
  const requiredFields = ["endpoint", "expiresMinutes"];
  const requiredFieldsValidation = validateRequiredFields(body, requiredFields);

  if (!requiredFieldsValidation.isValid) {
    return requiredFieldsValidation;
  }

  // Validate the configuration data
  return validateLearnosityConfig({
    endpoint: body.endpoint,
    expiresMinutes: body.expiresMinutes,
  });
}
