import { NextRequest } from "next/server";
import { prisma } from "@/lib/database";
import { LearnosityService } from "@/lib/learnosity";
import { learnosityConfig } from "@/lib/config";
import { STATUS_CODES } from "@/constants";
import {
  validateRequestBody,
  validateIdFormat,
  combineValidationResults,
} from "@/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  handleValidationErrors,
  handleGenericError,
} from "@/utils/error-handler";

// POST /api/learnosity - Initialize Learnosity session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const bodyValidation = validateRequestBody(body, [
      "testSessionId",
      "studentId",
    ]);
    const validationError = handleValidationErrors(bodyValidation);
    if (validationError) {
      return validationError;
    }

    // Validate individual fields
    const validations = [
      validateIdFormat(body.testSessionId),
      validateIdFormat(body.studentId),
    ];

    const combinedValidation = combineValidationResults(...validations);
    const combinedValidationError = handleValidationErrors(combinedValidation);
    if (combinedValidationError) return combinedValidationError;

    // Create LearnosityService with current configuration
    const learnosityService = await LearnosityService.createWithCurrentConfig();

    // Check if Learnosity is configured
    if (!learnosityService.isConfigured()) {
      return createErrorResponse(
        "Learnosity is not properly configured. Please check your environment variables.",
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        undefined,
        "LEARNOSITY_CONFIG_ERROR"
      );
    }

    // Retrieve test session from database
    const testSession = await prisma.testSession.findUnique({
      where: { id: body.testSessionId },
    });

    if (!testSession) {
      return createErrorResponse(
        "The test session you're trying to resume no longer exists. It may have been completed or removed.",
        STATUS_CODES.NOT_FOUND,
        undefined,
        "TEST_SESSION_NOT_FOUND"
      );
    }

    // Check if test session has expired
    if (testSession.expiresAt && testSession.expiresAt < new Date()) {
      return createErrorResponse(
        "The test session you're trying to resume has expired. Please start a new assessment.",
        STATUS_CODES.GONE,
        undefined,
        "TEST_SESSION_EXPIRED"
      );
    }

    // Check if the session belongs to the correct student
    if (testSession.studentId !== body.studentId) {
      return createErrorResponse(
        "You don't have permission to access this test session. Please check your student ID.",
        STATUS_CODES.FORBIDDEN,
        undefined,
        "TEST_SESSION_ACCESS_DENIED"
      );
    }

    // Check if the session has a valid Learnosity session ID
    if (!testSession.learnositySessionId) {
      return createErrorResponse(
        "The test session is missing Learnosity session data. Please start a new assessment.",
        STATUS_CODES.UNPROCESSABLE_ENTITY,
        undefined,
        "MISSING_LEARNOSITY_SESSION_ID"
      );
    }

    try {
      // Generate Items API request using SDK
      const itemsRequest = learnosityService.generateItemsRequest(
        body.studentId,
        testSession.learnositySessionId,
        learnosityConfig.activityId
      );

      // Generate security configuration for media assets
      const securityConfig = learnosityService.generateSecurityConfig(
        testSession.learnositySessionId
      );

      return createSuccessResponse({
        learnosity: {
          domain: learnosityService.getDomain(), // localhost for security signatures
          apiEndpoint: learnosityService.getApiEndpoint(), // items-ie.learnosity.com for API calls
          itemsRequest: itemsRequest,
          securityConfig: securityConfig,
        },
        testSession: {
          id: testSession.id,
          studentId: testSession.studentId,
          assessmentId: testSession.assessmentId,
        },
      });
    } catch (learnosityError: unknown) {
      console.error("Learnosity route - error details:", learnosityError);
      if (learnosityError instanceof Error) {
        console.error("Learnosity route - error stack:", learnosityError.stack);
        return createErrorResponse(
          `Learnosity error: ${learnosityError.message}`,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          undefined,
          "LEARNOSITY_API_ERROR"
        );
      }
      return createErrorResponse(
        `Learnosity error: Unknown error`,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        undefined,
        "LEARNOSITY_API_ERROR"
      );
    }
  } catch (error) {
    return handleGenericError(error, "Learnosity Session Initialization");
  }
}
