import { NextRequest } from "next/server";
import { prisma } from "@/lib/database";
import { STATUS_CODES, SUCCESS_MESSAGES } from "@/constants";
import { CreateResultRequest } from "@/types";
import {
  validateQueryParams,
  validateRequestBody,
  validateIdFormat,
  validateJsonData,
  combineValidationResults,
} from "@/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  handleValidationErrors,
  handleNotFoundError,
  handleGenericError,
} from "@/utils/error-handler";

// GET /api/results - Retrieve results by session ID
export async function GET(request: NextRequest) {
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

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return handleNotFoundError("Session");
    }

    // Retrieve all results for the session
    const results = await prisma.assessmentResult.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    return createSuccessResponse({
      results: results,
      totalResults: results.length,
    });
  } catch (error) {
    return handleGenericError(error, "Results Retrieval");
  }
}

// POST /api/results - Store assessment result
export async function POST(request: NextRequest) {
  try {
    const body: CreateResultRequest = await request.json();

    // Validate request body
    const bodyValidation = validateRequestBody(body, ["sessionId", "response"]);
    const validationError = handleValidationErrors(bodyValidation);
    if (validationError) return validationError;

    // Validate individual fields
    const validations = [
      validateIdFormat(body.sessionId),
      validateJsonData(body.response, "response"),
    ];

    const combinedValidation = combineValidationResults(...validations);
    const combinedValidationError = handleValidationErrors(combinedValidation);
    if (combinedValidationError) return combinedValidationError;

    // Check if session exists and is active
    const session = await prisma.session.findUnique({
      where: { id: body.sessionId },
    });

    if (!session) {
      return handleNotFoundError("Session");
    }

    if (session.status !== "ACTIVE") {
      return createErrorResponse(
        "Session is not active",
        STATUS_CODES.BAD_REQUEST,
        undefined,
        "INACTIVE_SESSION"
      );
    }

    // Create new result (no questionId needed)
    const result = await prisma.assessmentResult.create({
      data: {
        sessionId: body.sessionId,
        response: body.response,
        score: body.score,
        timeSpent: body.timeSpent,
      },
    });

    // Get total results count for this session
    const totalResults = await prisma.assessmentResult.count({
      where: { sessionId: body.sessionId },
    });

    return createSuccessResponse(
      {
        message: SUCCESS_MESSAGES.PROGRESS_SAVED,
        result: result,
        totalResults: totalResults,
      },
      STATUS_CODES.CREATED
    );
  } catch (error) {
    return handleGenericError(error, "Result Storage");
  }
}

// PUT /api/results - Update assessment result
export async function PUT(request: NextRequest) {
  try {
    // Validate query parameters
    const queryValidation = validateQueryParams(request, ["resultId"]);
    const validationError = handleValidationErrors(queryValidation);
    if (validationError) return validationError;

    const { searchParams } = new URL(request.url);
    const resultId = searchParams.get("resultId")!;

    // Validate result ID format
    const idValidation = validateIdFormat(resultId);
    const idValidationError = handleValidationErrors(idValidation);
    if (idValidationError) return idValidationError;

    const body = await request.json();

    // Validate response data if provided
    if (body.response !== undefined) {
      const responseValidation = validateJsonData(body.response, "response");
      const responseValidationError =
        handleValidationErrors(responseValidation);
      if (responseValidationError) return responseValidationError;
    }

    // Check if result exists
    const existingResult = await prisma.assessmentResult.findUnique({
      where: { id: resultId },
    });

    if (!existingResult) {
      return handleNotFoundError("Result");
    }

    // Update result
    const updatedResult = await prisma.assessmentResult.update({
      where: { id: resultId },
      data: {
        response: body.response,
        score: body.score,
        timeSpent: body.timeSpent,
        updatedAt: new Date(),
      },
    });

    return createSuccessResponse({
      message: SUCCESS_MESSAGES.PROGRESS_SAVED,
      result: updatedResult,
    });
  } catch (error) {
    return handleGenericError(error, "Result Update");
  }
}

// DELETE /api/results - Delete assessment result
export async function DELETE(request: NextRequest) {
  try {
    // Validate query parameters
    const queryValidation = validateQueryParams(request, ["resultId"]);
    const validationError = handleValidationErrors(queryValidation);
    if (validationError) return validationError;

    const { searchParams } = new URL(request.url);
    const resultId = searchParams.get("resultId")!;

    // Validate result ID format
    const idValidation = validateIdFormat(resultId);
    const idValidationError = handleValidationErrors(idValidation);
    if (idValidationError) return idValidationError;

    // Check if result exists
    const existingResult = await prisma.assessmentResult.findUnique({
      where: { id: resultId },
    });

    if (!existingResult) {
      return handleNotFoundError("Result");
    }

    // Delete result
    await prisma.assessmentResult.delete({
      where: { id: resultId },
    });

    return createSuccessResponse({
      message: "Result deleted successfully",
    });
  } catch (error) {
    return handleGenericError(error, "Result Deletion");
  }
}
