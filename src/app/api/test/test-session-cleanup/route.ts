import { NextRequest, NextResponse } from "next/server";
import { TestSessionCleanupService } from "../../../../lib/test-session-cleanup";
import { TestSessionService } from "../../../../lib/test-session-service";

export async function GET(_request: NextRequest) {
  try {
    // Test session cleanup service
    const [cleanupStats, isCleanupNeeded] = await Promise.all([
      TestSessionCleanupService.getCleanupStats(),
      TestSessionCleanupService.isCleanupNeeded(),
    ]);

    return NextResponse.json({
      status: "success",
      message: "Session cleanup service is working correctly",
      timestamp: new Date().toISOString(),
      cleanupService: {
        stats: cleanupStats,
        isCleanupNeeded,
        serviceStatus: "✅ Running",
      },
      testResults: {
        sessionCleanup: "✅ Working",
        getCleanupStats: "✅ Working",
        isCleanupNeeded: "✅ Working",
      },
    });
  } catch (error) {
    console.error("Session cleanup test failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Session cleanup test failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "performCleanup":
        // Perform manual cleanup
        const cleanupResult = await TestSessionCleanupService.performCleanup();

        return NextResponse.json({
          status: "success",
          message: "Manual cleanup completed successfully",
          result: cleanupResult,
        });

      case "forceCleanupSession":
        // Force cleanup a specific session
        const success = await TestSessionCleanupService.forceCleanupSession(
          data.sessionId
        );

        return NextResponse.json({
          status: "success",
          message: success
            ? "Session force cleaned successfully"
            : "Session not found",
          success,
        });

      case "checkCleanupStatus":
        // Check if cleanup is needed
        const needsCleanup = await TestSessionCleanupService.isCleanupNeeded();
        const stats = await TestSessionCleanupService.getCleanupStats();

        return NextResponse.json({
          status: "success",
          message: "Cleanup status checked successfully",
          needsCleanup,
          stats,
        });

      case "createExpiredSession":
        // Create a test session that will be expired
        const expiredSession = await TestSessionService.createTestSession({
          studentId: `expired-test-${Date.now()}`,
          learnositySessionId: `expired-learnosity-${Date.now()}`,
          assessmentId: "expired-assessment",
          expiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 minute ago
        });

        return NextResponse.json({
          status: "success",
          message: "Expired test session created successfully",
          session: expiredSession,
        });

      case "createAbandonedSession":
        // Create a test session that will be considered abandoned
        const abandonedSession = await TestSessionService.createTestSession({
          studentId: `abandoned-test-${Date.now()}`,
          learnositySessionId: `abandoned-learnosity-${Date.now()}`,
          assessmentId: "abandoned-assessment",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
        });

        // Manually set the updatedAt to simulate abandonment
        await TestSessionService.updateProgress(abandonedSession.id, 1, 20);

        return NextResponse.json({
          status: "success",
          message: "Abandoned test session created successfully",
          session: abandonedSession,
        });

      case "testFullCleanupFlow":
        // Test the complete cleanup flow
        const beforeStats = await TestSessionCleanupService.getCleanupStats();
        const fullCleanupResult =
          await TestSessionCleanupService.performCleanup();
        const afterStats = await TestSessionCleanupService.getCleanupStats();

        return NextResponse.json({
          status: "success",
          message: "Full cleanup flow test completed successfully",
          beforeStats,
          cleanupResult: fullCleanupResult,
          afterStats,
          improvement: {
            totalSessions: beforeStats.totalSessions - afterStats.totalSessions,
            activeSessions:
              beforeStats.activeSessions - afterStats.activeSessions,
            expiredSessions:
              beforeStats.expiredSessions - afterStats.expiredSessions,
          },
        });

      default:
        return NextResponse.json(
          { status: "error", message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Session cleanup test operation failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Session cleanup test operation failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
