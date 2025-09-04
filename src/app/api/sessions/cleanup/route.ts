import { NextRequest, NextResponse } from "next/server";
import { STATUS_CODES } from "@/constants";
import {
  createSuccessResponse,
  handleGenericError,
} from "@/utils/error-handler";
import SessionCleanupService from "@/lib/session-cleanup";

// POST /api/sessions/cleanup - Clean up expired sessions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    let cleanupResult;

    if (sessionId) {
      // Clean up specific session
      cleanupResult =
        await SessionCleanupService.forceCleanupSession(sessionId);
    } else {
      // Clean up all expired sessions
      cleanupResult = await SessionCleanupService.performCleanup();
    }

    return createSuccessResponse({
      message: "Session cleanup completed successfully",
      success: cleanupResult,
    });
  } catch (error) {
    return handleGenericError(error, "Session Cleanup");
  }
}

// GET /api/sessions/cleanup - Get cleanup statistics
export async function GET(_request: NextRequest) {
  try {
    const statistics = await SessionCleanupService.getCleanupStats();

    return createSuccessResponse({
      message: "Cleanup statistics retrieved successfully",
      statistics,
    });
  } catch (error) {
    return handleGenericError(error, "Cleanup Statistics");
  }
}

// PUT /api/sessions/cleanup - Update expired session statuses
export async function PUT(_request: NextRequest) {
  try {
    const isNeeded = await SessionCleanupService.isCleanupNeeded();

    return createSuccessResponse({
      message: "Cleanup status checked successfully",
      isCleanupNeeded: isNeeded,
    });
  } catch (error) {
    return handleGenericError(error, "Status Update");
  }
}

// PATCH /api/sessions/cleanup - Control automated cleanup
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
        const cleanupResult = await SessionCleanupService.performCleanup();
        result = { message: "Cleanup performed", ...cleanupResult };
        break;
      case "stop":
        // Check if cleanup is needed
        const isNeeded = await SessionCleanupService.isCleanupNeeded();
        result = { message: "Cleanup status checked", isNeeded };
        break;
      case "status":
        const stats = await SessionCleanupService.getCleanupStats();
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
