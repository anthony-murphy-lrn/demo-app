import { NextRequest, NextResponse } from "next/server";
import { STATUS_CODES } from "@/constants";
import {
  createSuccessResponse,
  handleGenericError,
} from "@/utils/error-handler";
import TestSessionCleanupService from "@/lib/test-session-cleanup";

// POST /api/test-sessions/cleanup - Clean up expired test sessions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testSessionId } = body;

    let cleanupResult;

    if (testSessionId) {
      // Clean up specific test session
      cleanupResult =
        await TestSessionCleanupService.forceCleanupSession(testSessionId);
    } else {
      // Clean up all expired test sessions
      cleanupResult = await TestSessionCleanupService.performCleanup();
    }

    return createSuccessResponse({
      message: "Test session cleanup completed successfully",
      success: cleanupResult,
    });
  } catch (error) {
    return handleGenericError(error, "Test Session Cleanup");
  }
}

// GET /api/test-sessions/cleanup - Get cleanup statistics
export async function GET(_request: NextRequest) {
  try {
    const statistics = await TestSessionCleanupService.getCleanupStats();

    return createSuccessResponse({
      message: "Cleanup statistics retrieved successfully",
      statistics,
    });
  } catch (error) {
    return handleGenericError(error, "Cleanup Statistics");
  }
}

// PUT /api/test-sessions/cleanup - Update expired test session statuses
export async function PUT(_request: NextRequest) {
  try {
    const isNeeded = await TestSessionCleanupService.isCleanupNeeded();

    return createSuccessResponse({
      message: "Cleanup status checked successfully",
      isCleanupNeeded: isNeeded,
    });
  } catch (error) {
    return handleGenericError(error, "Status Update");
  }
}

// PATCH /api/test-sessions/cleanup - Control automated cleanup
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action || !["start", "stop", "status"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'start', 'stop', or 'status'" },
        { status: STATUS_CODES.BAD_REQUEST }
      );
    }

    let result;

    switch (action) {
      case "start":
        // Perform cleanup immediately
        const cleanupResult = await TestSessionCleanupService.performCleanup();
        result = { message: "Cleanup performed", ...cleanupResult };
        break;
      case "stop":
        // Check if cleanup is needed
        const isNeeded = await TestSessionCleanupService.isCleanupNeeded();
        result = { message: "Cleanup status checked", isNeeded };
        break;
      case "status":
        const stats = await TestSessionCleanupService.getCleanupStats();
        result = {
          message: "Cleanup service status retrieved",
          status: stats,
        };
        break;
    }

    return createSuccessResponse(result);
  } catch (error) {
    return handleGenericError(error, "Cleanup Control");
  }
}
