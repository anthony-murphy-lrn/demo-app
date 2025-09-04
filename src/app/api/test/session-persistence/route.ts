import { NextRequest, NextResponse } from "next/server";
import SessionPersistenceService from "../../../../lib/session-persistence";
import SessionService from "../../../../lib/session-service";

export async function GET(_request: NextRequest) {
  try {
    // Test session persistence service
    const activeSessions = await SessionService.getActiveSessions();

    if (activeSessions.length === 0) {
      return NextResponse.json({
        status: "info",
        message: "No active sessions to test persistence",
        timestamp: new Date().toISOString(),
      });
    }

    // Test persistence with first active session
    const testSession = activeSessions[0];
    const [sessionState, recoveryOptions] = await Promise.all([
      SessionPersistenceService.loadSessionState(testSession.id),
      SessionPersistenceService.getRecoveryOptions(testSession.id),
    ]);

    return NextResponse.json({
      status: "success",
      message: "Session persistence service is working correctly",
      timestamp: new Date().toISOString(),
      testSession: {
        id: testSession.id,
        studentId: testSession.studentId,
        status: testSession.status,
        createdAt: testSession.createdAt,
        expiresAt: testSession.expiresAt,
        isExpired: testSession.isExpired,
        isActive: testSession.isActive,
      },
      sessionState,
      recoveryOptions,
      testResults: {
        sessionPersistence: "✅ Working",
        loadSessionState: "✅ Working",
        getRecoveryOptions: "✅ Working",
      },
    });
  } catch (error) {
    console.error("Session persistence test failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Session persistence test failed",
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
      case "saveAnswer":
        // Answers are managed by Learnosity, not locally
        return NextResponse.json({
          status: "success",
          message: "Answers are managed by Learnosity - this test is disabled",
          questionNumber: data.questionNumber,
        });

      case "createCheckpoint":
        // Checkpoints are managed by Learnosity, not locally
        return NextResponse.json({
          status: "success",
          message:
            "Checkpoints are managed by Learnosity - this test is disabled",
        });

      case "getResumePoint":
        // Resume points are managed by Learnosity, not locally
        return NextResponse.json({
          status: "success",
          message:
            "Resume points are managed by Learnosity - this test is disabled",
          resumePoint: { canResume: true },
        });

      case "restoreFromCheckpoint":
        // Checkpoints are managed by Learnosity, not locally
        return NextResponse.json({
          status: "success",
          message:
            "Checkpoints are managed by Learnosity - this test is disabled",
          restoredState: null,
        });

      case "autoSave":
        // Auto-save is managed by Learnosity, not locally
        return NextResponse.json({
          status: "success",
          message: "Auto-save is managed by Learnosity - this test is disabled",
        });

      case "testFullFlow":
        // Test the complete persistence flow
        const sessionId = data.sessionId;

        // 1. Answers are managed by Learnosity, not locally
        console.log(
          "Answers are managed by Learnosity - skipping local answer saving"
        );

        // 2. Checkpoints are managed by Learnosity, not locally
        console.log(
          "Checkpoints are managed by Learnosity - skipping local checkpoint creation"
        );

        // 3. Get recovery options
        const recoveryOptions =
          await SessionPersistenceService.getRecoveryOptions(sessionId);

        // 4. Resume points are managed by Learnosity, not locally
        console.log(
          "Resume points are managed by Learnosity - skipping local resume point retrieval"
        );
        const finalResumePoint = { canResume: true };

        return NextResponse.json({
          status: "success",
          message:
            "Full persistence flow test completed successfully (Learnosity-managed features disabled)",
          testResults: {
            answersSaved: 0, // Managed by Learnosity
            checkpointCreated: false, // Managed by Learnosity
            recoveryOptions,
            resumePoint: finalResumePoint,
          },
        });

      default:
        return NextResponse.json(
          { status: "error", message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Session persistence test operation failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Session persistence test operation failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
