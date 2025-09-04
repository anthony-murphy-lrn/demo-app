import { NextRequest } from "next/server";
import { prisma } from "@/lib/database";
import { learnosityService } from "@/lib/learnosity";
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
  handleNotFoundError,
  handleGenericError,
  handleLearnosityError,
} from "@/utils/error-handler";

// POST /api/learnosity - Initialize Learnosity session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Learnosity API - Received request body:", body);

    // Validate request body
    const bodyValidation = validateRequestBody(body, [
      "testSessionId",
      "studentId",
    ]);
    console.log("Learnosity API - Body validation result:", bodyValidation);
    console.log(
      "Learnosity API - Request body received:",
      JSON.stringify(body, null, 2)
    );
    const validationError = handleValidationErrors(bodyValidation);
    if (validationError) {
      console.log("Learnosity API - Validation error:", validationError);
      console.log(
        "Learnosity API - Validation error details:",
        JSON.stringify(validationError, null, 2)
      );
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
    console.log(
      "Learnosity API - Looking for test session with ID:",
      body.testSessionId
    );
    const testSession = await prisma.testSession.findUnique({
      where: { id: body.testSessionId },
    });
    console.log("Learnosity API - Found test session:", testSession);

    if (!testSession) {
      console.log("Learnosity API - Test session not found");
      return handleNotFoundError("Test Session");
    }

    // Check if test session has expired
    if (testSession.expiresAt && testSession.expiresAt < new Date()) {
      return handleNotFoundError("Test Session");
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
          domain: learnosityService.getDomain(),
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

// GET /api/learnosity/security - Get security configuration for media assets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return createErrorResponse(
        "Session ID is required",
        STATUS_CODES.BAD_REQUEST,
        undefined,
        "MISSING_SESSION_ID"
      );
    }

    // Validate session ID format
    const idValidation = validateIdFormat(sessionId);
    const idValidationError = handleValidationErrors(idValidation);
    if (idValidationError) return idValidationError;

    // Check if Learnosity is configured
    if (!learnosityService.isConfigured()) {
      return createErrorResponse(
        "Learnosity is not properly configured",
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        undefined,
        "LEARNOSITY_CONFIG_ERROR"
      );
    }

    // Retrieve session from database
    const session = await prisma.testSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return handleNotFoundError("Test Session");
    }

    try {
      // Generate security configuration
      const securityConfig = learnosityService.generateSecurityConfig(
        session.learnositySessionId
      );

      return createSuccessResponse({
        security: securityConfig,
      });
    } catch (learnosityError) {
      return handleLearnosityError(learnosityError);
    }
  } catch (error) {
    return handleGenericError(error, "Learnosity Security Configuration");
  }
}
