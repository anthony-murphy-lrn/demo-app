import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  try {
    // Test session service operations
    const [activeSessions, sessionStats] = await Promise.all([
      TestTestSessionService.getActiveSessions(),
      TestTestSessionService.getSessionStats(),
    ]);

    return NextResponse.json({
      status: "success",
      message: "Session service is working correctly",
      timestamp: new Date().toISOString(),
      sessionService: {
        activeSessions: activeSessions.length,
        totalSessions: sessionStats.total,
        stats: sessionStats,
      },
      testResults: {
        sessionService: "✅ Working",
        getActiveSessions: "✅ Working",
        getSessionStats: "✅ Working",
      },
    });
  } catch (error) {
    console.error("Session service test failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Session service test failed",
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
      case "createSession":
        // Create a test session using the service
        const testSession = await TestSessionService.createSession({
          studentId: `test-student-service-${Date.now()}`,
          learnositySessionId: `test-learnosity-service-${Date.now()}`,
          assessmentId: "test-assessment-service",
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        });

        return NextResponse.json({
          status: "success",
          message: "Test session created successfully via service",
          session: testSession,
        });

      case "getSessionProgress":
        // Get session progress
        const progress = await TestSessionService.getSessionProgress(
          data.sessionId
        );

        return NextResponse.json({
          status: "success",
          message: "Session progress retrieved successfully",
          progress,
        });

      case "updateProgress":
        // Update session progress
        const updatedSession = await TestSessionService.updateProgress(
          data.sessionId,
          data.currentQuestion,
          data.progress
        );

        return NextResponse.json({
          status: "success",
          message: "Session progress updated successfully",
          session: updatedSession,
        });

      case "resumeSession":
        // Resume a session
        const resumedSession = await TestSessionService.resumeSession(
          data.sessionId
        );

        return NextResponse.json({
          status: "success",
          message: "Session resumed successfully",
          session: resumedSession,
        });

      case "completeSession":
        // Complete a session
        const completedSession = await TestSessionService.completeSession(
          data.sessionId
        );

        return NextResponse.json({
          status: "success",
          message: "Session completed successfully",
          session: completedSession,
        });

      case "cleanupExpired":
        // Clean up expired sessions
        const cleanedCount = await TestSessionService.cleanupExpiredSessions();

        return NextResponse.json({
          status: "success",
          message: "Expired sessions cleaned up successfully",
          cleanedCount,
        });

      default:
        return NextResponse.json(
          { status: "error", message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Session service test operation failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Session service test operation failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
