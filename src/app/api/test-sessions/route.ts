import { NextRequest } from "next/server";
import { prisma } from "@/lib/database";
import { learnosityConfigService } from "@/lib/learnosity-config-service";
import { STATUS_CODES, SUCCESS_MESSAGES } from "@/constants";
import { CreateTestSessionRequest } from "@/types";
import {
  validateQueryParams,
  validateRequestBody,
  validateIdFormat,
  combineValidationResults,
} from "@/utils/validation";
import { generateLearnositySessionId } from "@/utils/test-session-id-generator";
import {
  createSuccessResponse,
  handleValidationErrors,
  handleNotFoundError,
  handleGenericError,
} from "@/utils/error-handler";

// GET /api/test-sessions - Retrieve test session by student ID
export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const queryValidation = validateQueryParams(request, ["studentId"]);
    const validationError = handleValidationErrors(queryValidation);
    if (validationError) return validationError;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId")!;

    // Validate student ID format
    const idValidation = validateIdFormat(studentId);
    const idValidationError = handleValidationErrors(idValidation);
    if (idValidationError) return idValidationError;

    // Find the most recent test session for the student
    const testSession = await prisma.testSession.findFirst({
      where: {
        studentId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        results: true,
      },
    });

    if (!testSession) {
      return handleNotFoundError("Test Session");
    }

    // Check if test session has expired
    if (testSession.expiresAt && testSession.expiresAt < new Date()) {
      return handleNotFoundError("Test Session");
    }

    return createSuccessResponse(testSession);
  } catch (error) {
    return handleGenericError(error, "Test Session Retrieval");
  }
}

// POST /api/test-sessions - Create new test session
export async function POST(request: NextRequest) {
  try {
    const body: CreateTestSessionRequest = await request.json();

    // Validate request body
    const bodyValidation = validateRequestBody(body, [
      "studentId",
      "assessmentId",
    ]);
    const validationError = handleValidationErrors(bodyValidation);
    if (validationError) return validationError;

    // Validate individual fields
    const validations = [
      validateIdFormat(body.studentId),
      validateIdFormat(body.assessmentId),
    ];

    const combinedValidation = combineValidationResults(...validations);
    const combinedValidationError = handleValidationErrors(combinedValidation);
    if (combinedValidationError) return combinedValidationError;

    // Check if student already has a recent test session
    const existingTestSession = await prisma.testSession.findFirst({
      where: {
        studentId: body.studentId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existingTestSession) {
      // If student has a recent test session, we can either:
      // 1. Return an error
      // 2. Allow multiple sessions per student
      // 3. Check if the existing session is expired and handle accordingly

      // For now, we'll allow multiple sessions per student
      // The client can decide which session to use
      console.log(
        `ℹ️ Student ${body.studentId} already has test session ${existingTestSession.id}, creating new one`
      );
    }

    // Get Learnosity configuration for expiry time
    const effectiveConfig = await learnosityConfigService.getEffectiveConfig();

    // Generate Learnosity session ID
    const learnositySessionId = generateLearnositySessionId();

    // Create new test session with Learnosity configuration expiry time
    const testSession = await prisma.testSession.create({
      data: {
        studentId: body.studentId,
        assessmentId: body.assessmentId,
        learnositySessionId: learnositySessionId,
        expiresAt: new Date(
          Date.now() + effectiveConfig.expiresMinutes * 60 * 1000
        ),
      },
      include: {
        results: true,
      },
    });

    return createSuccessResponse(
      {
        message: SUCCESS_MESSAGES.TEST_SESSION_CREATED,
        testSession,
      },
      STATUS_CODES.CREATED
    );
  } catch (error) {
    return handleGenericError(error, "Test Session Creation");
  }
}

// PUT /api/test-sessions - Update test session
export async function PUT(request: NextRequest) {
  try {
    // Validate query parameters
    const queryValidation = validateQueryParams(request, ["testSessionId"]);
    const validationError = handleValidationErrors(queryValidation);
    if (validationError) return validationError;

    const { searchParams } = new URL(request.url);
    const testSessionId = searchParams.get("testSessionId")!;

    // Validate test session ID format
    const idValidation = validateIdFormat(testSessionId);
    const idValidationError = handleValidationErrors(idValidation);
    if (idValidationError) return idValidationError;

    await request.json(); // Consume body but don't use it

    // Check if test session exists
    const existingTestSession = await prisma.testSession.findUnique({
      where: { id: testSessionId },
    });

    if (!existingTestSession) {
      return handleNotFoundError("Test Session");
    }

    // Update test session (no fields to update currently)
    const updatedTestSession = await prisma.testSession.update({
      where: { id: testSessionId },
      data: {
        updatedAt: new Date(),
      },
      include: {
        results: true,
      },
    });

    return createSuccessResponse({
      message: SUCCESS_MESSAGES.PROGRESS_SAVED,
      testSession: updatedTestSession,
    });
  } catch (error) {
    return handleGenericError(error, "Test Session Update");
  }
}
