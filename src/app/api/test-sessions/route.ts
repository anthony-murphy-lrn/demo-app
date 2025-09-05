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

// GET /api/test-sessions - Retrieve test sessions by student ID with pagination
export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const queryValidation = validateQueryParams(request, ["studentId"]);
    const validationError = handleValidationErrors(queryValidation);
    if (validationError) return validationError;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId")!;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");

    // Validate student ID format
    const idValidation = validateIdFormat(studentId);
    const idValidationError = handleValidationErrors(idValidation);
    if (idValidationError) return idValidationError;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return handleValidationErrors({
        isValid: false,
        errors: [
          {
            field: "pagination",
            message:
              "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.",
            code: "INVALID_PAGINATION",
          },
        ],
      });
    }

    // Validate page number is not too large (prevent excessive skip values)
    if (page > 10000) {
      return handleValidationErrors({
        isValid: false,
        errors: [
          {
            field: "page",
            message: "Page number too large. Maximum page number is 10000.",
            code: "PAGE_TOO_LARGE",
          },
        ],
      });
    }

    // Calculate pagination offset
    const skip = (page - 1) * limit;

    // Early return for invalid pagination scenarios
    if (skip < 0) {
      return handleValidationErrors({
        isValid: false,
        errors: [
          {
            field: "pagination",
            message: "Invalid pagination offset calculated.",
            code: "INVALID_OFFSET",
          },
        ],
      });
    }

    // Use transaction for better performance and consistency
    // Note: For optimal performance, ensure database has index on (studentId, createdAt)
    let totalSessions: number;
    let testSessions: any[];

    try {
      [totalSessions, testSessions] = await prisma.$transaction([
        // Get total count of sessions for the student
        // Using count with where clause for efficiency
        prisma.testSession.count({
          where: {
            studentId,
          },
        }),
        // Find test sessions for the student with pagination
        // Using efficient ordering by createdAt DESC for most recent first
        // Only select necessary fields to reduce data transfer
        prisma.testSession.findMany({
          where: {
            studentId,
          },
          select: {
            id: true,
            studentId: true,
            assessmentId: true,
            learnositySessionId: true,
            createdAt: true,
            expiresAt: true,
            // Only include results if needed (can be optimized further)
            results: {
              select: {
                id: true,
                score: true,
                createdAt: true,
              },
            },
          },
          orderBy: [
            { createdAt: "desc" },
            { id: "desc" }, // Secondary sort for consistent ordering
          ],
          skip,
          take: limit,
        }),
      ]);
    } catch (dbError) {
      console.error("Database transaction failed:", dbError);
      return handleGenericError(dbError, "Database Query");
    }

    // Validate transaction results
    if (typeof totalSessions !== "number" || !Array.isArray(testSessions)) {
      return handleGenericError(
        new Error("Invalid database response format"),
        "Data Validation"
      );
    }

    // Calculate session status and add to response
    const now = new Date();
    const sessionsWithStatus = testSessions.map(session => ({
      ...session,
      status:
        session.expiresAt && session.expiresAt < now ? "expired" : "active",
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalSessions / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Handle edge case: requested page is beyond available data
    if (totalSessions > 0 && page > totalPages) {
      return handleValidationErrors({
        isValid: false,
        errors: [
          {
            field: "page",
            message: `Page ${page} does not exist. Maximum page is ${totalPages}.`,
            code: "PAGE_NOT_FOUND",
          },
        ],
      });
    }

    const paginationInfo = {
      currentPage: page,
      totalPages,
      totalSessions,
      hasNextPage,
      hasPreviousPage,
      limit,
      startIndex: skip + 1,
      endIndex: Math.min(skip + limit, totalSessions),
      isEmpty: totalSessions === 0,
    };

    const response = createSuccessResponse({
      sessions: sessionsWithStatus,
      pagination: paginationInfo,
    });

    // Add caching headers for better performance
    // Cache for 30 seconds for frequently accessed data
    response.headers.set(
      "Cache-Control",
      "private, max-age=30, stale-while-revalidate=60"
    );
    response.headers.set(
      "ETag",
      `"${studentId}-${page}-${limit}-${totalSessions}"`
    );

    return response;
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
