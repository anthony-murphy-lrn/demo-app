import { runResumeTests } from "@/utils/test-resume-functionality";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/utils/error-handler";
import { STATUS_CODES } from "@/constants";

// GET /api/test/resume-functionality - Run resume functionality tests
export async function GET() {
  try {
    console.log("🧪 Running resume functionality tests...");

    const results = await runResumeTests();

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    return createSuccessResponse({
      summary: {
        total,
        passed,
        failed: total - passed,
        success: passed === total,
      },
      results,
    });
  } catch (error) {
    console.error("Error running resume tests:", error);
    return createErrorResponse(
      "Failed to run resume functionality tests",
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      undefined,
      "TEST_EXECUTION_ERROR"
    );
  }
}
