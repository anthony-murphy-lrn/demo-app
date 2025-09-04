import { NextRequest } from "next/server";
import { prisma } from "@/lib/database";
import { STATUS_CODES, SUCCESS_MESSAGES } from "@/constants";
import { CreateSessionRequest, UpdateSessionRequest } from "@/types";
import {
  validateQueryParams,
  validateRequestBody,
  validateIdFormat,
  validateSessionStatus,
  combineValidationResults,
} from "@/utils/validation";
import { generateLearnositySessionId } from "@/utils/session-id-generator";
import {
  createSuccessResponse,
  handleValidationErrors,
  handleNotFoundError,
  handleGenericError,
} from "@/utils/error-handler";

// GET /api/sessions - Retrieve session by student ID
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

    // Find the most recent active session for the student
    const session = await prisma.session.findFirst({
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

    if (!session) {
      return handleNotFoundError("Session");
    }

    // Check if session has expired
    if (session.expiresAt && session.expiresAt < new Date()) {
      await prisma.session.update({
        where: { id: session.id },
        data: { status: "EXPIRED" },
      });

      return handleNotFoundError("Session");
    }

    return createSuccessResponse(session);
  } catch (error) {
    return handleGenericError(error, "Session Retrieval");
  }
}

// POST /api/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const body: CreateSessionRequest = await request.json();

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

    // Check if student already has an active session
    const existingActiveSession = await prisma.session.findFirst({
      where: {
        studentId: body.studentId,
        status: "ACTIVE",
      },
    });

    if (existingActiveSession) {
      // If student has an active session, we have a few options:
      // 1. Return an error (current behavior)
      // 2. Automatically expire the old session and create a new one
      // 3. Allow the student to choose what to do

      // For now, let's automatically expire the old session and create a new one
      // This provides a better user experience
      await prisma.session.update({
        where: { id: existingActiveSession.id },
        data: {
          status: "EXPIRED",
          updatedAt: new Date(),
        },
      });

      console.log(
        `🔄 Expired previous active session ${existingActiveSession.id} for student ${body.studentId}`
      );
    }

    // Generate Learnosity session ID
    const learnositySessionId = generateLearnositySessionId();

    // Create new session
    const session = await prisma.session.create({
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
        message: SUCCESS_MESSAGES.SESSION_CREATED,
        session,
      },
      STATUS_CODES.CREATED
    );
  } catch (error) {
    return handleGenericError(error, "Session Creation");
  }
}

// PUT /api/sessions - Update session
export async function PUT(request: NextRequest) {
  try {
    // Validate query parameters
    const queryValidation = validateQueryParams(request, ["sessionId"]);
    const validationError = handleValidationErrors(queryValidation);
    if (validationError) return validationError;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId")!;

    // Validate session ID format
    const idValidation = validateIdFormat(sessionId);
    const idValidationError = handleValidationErrors(idValidation);
    if (idValidationError) return idValidationError;

    const body: UpdateSessionRequest = await request.json();

    // Validate update fields if provided
    const validations = [];
    if (body.status !== undefined) {
      validations.push(validateSessionStatus(body.status));
    }

    if (validations.length > 0) {
      const combinedValidation = combineValidationResults(...validations);
      const combinedValidationError =
        handleValidationErrors(combinedValidation);
      if (combinedValidationError) return combinedValidationError;
    }

    // Check if session exists
    const existingSession = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      return handleNotFoundError("Session");
    }

    // Update session
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
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
      session: updatedSession,
    });
  } catch (error) {
    return handleGenericError(error, "Session Update");
  }
}
