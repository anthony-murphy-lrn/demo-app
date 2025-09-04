import { NextRequest, NextResponse } from "next/server";
import { STATUS_CODES } from "@/constants";
import { createSuccessResponse, handleGenericError } from "@/utils/error-handler";
import { sessionCleanupService } from "@/lib/session-cleanup";

// POST /api/sessions/cleanup - Clean up expired sessions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { force = false, sessionId } = body;

    let cleanupResult;

    if (sessionId) {
      // Clean up specific session
      cleanupResult = await sessionCleanupService.cleanupSession(sessionId, force);
    } else {
      // Clean up all expired sessions
      cleanupResult = await sessionCleanupService.performCleanup();
    }

    return createSuccessResponse({
      message: "Session cleanup completed successfully",
      ...cleanupResult,
    });
  } catch (error) {
    return handleGenericError(error, "Session Cleanup");
  }
}

// GET /api/sessions/cleanup - Get cleanup statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get("includeDetails") === "true";

    const statistics = await sessionCleanupService.getStatistics(includeDetails);

    return createSuccessResponse({
      message: "Cleanup statistics retrieved successfully",
      statistics,
    });
  } catch (error) {
    return handleGenericError(error, "Cleanup Statistics");
  }
}

// PUT /api/sessions/cleanup - Update expired session statuses
export async function PUT(request: NextRequest) {
  try {
    const updatedCount = await sessionCleanupService.updateExpiredStatuses();

    return createSuccessResponse({
      message: "Expired session statuses updated successfully",
      updatedSessions: updatedCount,
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
        sessionCleanupService.startAutomatedCleanup();
        result = { message: "Automated cleanup started" };
        break;
      case "stop":
        sessionCleanupService.stopAutomatedCleanup();
        result = { message: "Automated cleanup stopped" };
        break;
      case "status":
        result = {
          message: "Cleanup service status retrieved",
          status: sessionCleanupService.getStatus(),
        };
        break;
    }

    return createSuccessResponse(result);
  } catch (error) {
    return handleGenericError(error, "Cleanup Control");
  }
}
