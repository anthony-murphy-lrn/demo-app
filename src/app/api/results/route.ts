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
    const queryValidation = validateQueryParams(request, ["testSessionId"]);
    const validationError = handleValidationErrors(queryValidation);
    if (validationError) return validationError;

    const { searchParams } = new URL(request.url);
    const testSessionId = searchParams.get("testSessionId")!;

    // Validate test session ID format
    const idValidation = validateIdFormat(testSessionId);
    const idValidationError = handleValidationErrors(idValidation);
    if (idValidationError) return idValidationError;

    // Check if test session exists
    const testSession = await prisma.testSession.findUnique({
      where: { id: testSessionId },
    });

    if (!testSession) {
      return handleNotFoundError("Test Session");
    }

    // Retrieve all results for the test session
    const results = await prisma.assessmentResult.findMany({
      where: { testSessionId },
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
    const bodyValidation = validateRequestBody(body, [
      "testSessionId",
      "response",
    ]);
    const validationError = handleValidationErrors(bodyValidation);
    if (validationError) return validationError;

    // Validate individual fields
    const validations = [
      validateIdFormat(body.testSessionId),
      validateJsonData(body.response, "response"),
    ];

    const combinedValidation = combineValidationResults(...validations);
    const combinedValidationError = handleValidationErrors(combinedValidation);
    if (combinedValidationError) return combinedValidationError;

    // Check if test session exists
    const testSession = await prisma.testSession.findUnique({
      where: { id: body.testSessionId },
    });

    if (!testSession) {
      return handleNotFoundError("Test Session");
    }

    // Check if test session has expired
    if (testSession.expiresAt && testSession.expiresAt < new Date()) {
      return createErrorResponse(
        "Test session has expired",
        STATUS_CODES.BAD_REQUEST,
        undefined,
        "EXPIRED_TEST_SESSION"
      );
    }

    // Create new result (no questionId needed)
    const result = await prisma.assessmentResult.create({
      data: {
        testSessionId: body.testSessionId,
        response: body.response,
        score: body.score,
        timeSpent: body.timeSpent,
      },
    });

    // Get total results count for this test session
    const totalResults = await prisma.assessmentResult.count({
      where: { testSessionId: body.testSessionId },
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
