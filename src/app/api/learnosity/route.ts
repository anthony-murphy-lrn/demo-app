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

