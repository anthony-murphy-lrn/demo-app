import { NextRequest } from "next/server";
import { prisma } from "@/lib/database";
import { validateIdFormat } from "@/utils/validation";
import {
  createSuccessResponse,
  handleValidationErrors,
  handleNotFoundError,
  handleGenericError,
} from "@/utils/error-handler";

// GET /api/test-sessions/[id] - Retrieve test session by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: testSessionId } = await params;

    // Validate test session ID format
    const idValidation = validateIdFormat(testSessionId);
    const idValidationError = handleValidationErrors(idValidation);
    if (idValidationError) return idValidationError;

    // Find the test session by ID
    const testSession = await prisma.testSession.findUnique({
      where: {
        id: testSessionId,
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
