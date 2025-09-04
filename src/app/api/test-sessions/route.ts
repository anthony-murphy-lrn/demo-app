import { NextRequest } from "next/server";
import { prisma } from "@/lib/database";
import { STATUS_CODES, SUCCESS_MESSAGES } from "@/constants";
import { CreateTestSessionRequest, UpdateTestSessionRequest } from "@/types";
import {
  validateQueryParams,
  validateRequestBody,
  validateIdFormat,
  validateTestSessionStatus,
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

    // Find the most recent active test session for the student
    const testSession = await prisma.testSession.findFirst({
      where: {
        studentId,
        status: "ACTIVE",
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
      await prisma.testSession.update({
        where: { id: testSession.id },
        data: { status: "EXPIRED" },
      });

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

    // Check if student already has an active test session
    const existingActiveTestSession = await prisma.testSession.findFirst({
      where: {
        studentId: body.studentId,
        status: "ACTIVE",
      },
    });

    if (existingActiveTestSession) {
      // If student has an active test session, we have a few options:
      // 1. Return an error (current behavior)
      // 2. Automatically expire the old test session and create a new one
      // 3. Allow the student to choose what to do

      // For now, let's automatically expire the old test session and create a new one
      // This provides a better user experience
      await prisma.testSession.update({
        where: { id: existingActiveTestSession.id },
        data: {
          status: "EXPIRED",
          updatedAt: new Date(),
        },
      });

      console.log(
        `🔄 Expired previous active test session ${existingActiveTestSession.id} for student ${body.studentId}`
      );
    }

    // Generate Learnosity session ID
    const learnositySessionId = generateLearnositySessionId();

    // Create new test session
    const testSession = await prisma.testSession.create({
      data: {
        studentId: body.studentId,
        assessmentId: body.assessmentId,
        learnositySessionId: learnositySessionId,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
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

    const body: UpdateTestSessionRequest = await request.json();

    // Validate update fields if provided
    const validations = [];
    if (body.status !== undefined) {
      validations.push(validateTestSessionStatus(body.status));
    }

    if (validations.length > 0) {
      const combinedValidation = combineValidationResults(...validations);
      const combinedValidationError =
        handleValidationErrors(combinedValidation);
      if (combinedValidationError) return combinedValidationError;
    }

    // Check if test session exists
    const existingTestSession = await prisma.testSession.findUnique({
      where: { id: testSessionId },
    });

    if (!existingTestSession) {
      return handleNotFoundError("Test Session");
    }

    // Update test session
    const updatedTestSession = await prisma.testSession.update({
      where: { id: testSessionId },
      data: {
        status: body.status,
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
