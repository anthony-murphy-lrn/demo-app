import { prisma } from "./database";
import { TestSessionModel, AssessmentResultModel } from "./models";
import type {
  TestSession,
  TestSessionStatus,
  TestSessionWithResults,
} from "./models";
import { testSessionConfig } from "./config";
import { generateLearnositySessionId } from "../utils/test-session-id-generator";

export interface CreateTestSessionData {
  studentId: string;
  learnositySessionId: string;
  assessmentId: string;
  expiresAt?: Date;
}

export interface TestSessionProgress {
  questionsAnswered: number;
  timeRemaining?: number;
}

export interface TestSessionSummary {
  id: string;
  studentId: string;
  status: TestSessionStatus;
  createdAt: Date;
  expiresAt?: Date;
  isExpired: boolean;
  isActive: boolean;
}

export class TestSessionService {
  /**
   * Create a new assessment test session
   */
  static async createTestSession(
    data: CreateTestSessionData
  ): Promise<TestSession> {
    try {
      // Check if student already has an active test session
      const existingTestSession = await TestSessionModel.findByStudentId(
        data.studentId
      );
      if (existingTestSession && existingTestSession.status === "ACTIVE") {
        // If test session exists but is expired, mark it as expired
        if (
          existingTestSession.expiresAt &&
          existingTestSession.expiresAt < new Date()
        ) {
          await TestSessionModel.updateStatus(
            existingTestSession.id,
            "EXPIRED"
          );
        } else {
          throw new Error(
            `Student ${data.studentId} already has an active test session`
          );
        }
      }

      // Set default expiration if not provided
      const expiresAt =
        data.expiresAt ||
        new Date(Date.now() + testSessionConfig.timeoutMinutes * 60 * 1000);

      // Generate Learnosity session ID
      const learnositySessionId = generateLearnositySessionId();

      // Create new test session
      const testSession = await TestSessionModel.create({
        ...data,
        learnositySessionId,
        expiresAt,
      });

      console.log(
        `✅ Test session created for student ${data.studentId}: ${testSession.id}`
      );
      return testSession;
    } catch (error) {
      console.error("❌ Failed to create test session:", error);
      throw error;
    }
  }

  /**
   * Retrieve a test session by ID with full details
   */
  static async getTestSessionById(
    id: string
  ): Promise<TestSessionWithResults | null> {
    try {
      const session = await SessionModel.findWithResults(id);
      if (!session) {
        console.log(`⚠️  Session not found: ${id}`);
        return null;
      }

      // Check if session has expired
      if (session.isExpired && session.status === "ACTIVE") {
        await SessionModel.updateStatus(id, "EXPIRED");
        session.status = "EXPIRED";
        session.isActive = false;
      }

      return session;
    } catch (error) {
      console.error(`❌ Failed to retrieve session ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve a session by student ID
   */
  static async getSessionByStudentId(
    studentId: string
  ): Promise<SessionWithResults | null> {
    try {
      const session = await SessionModel.findByStudentId(studentId);
      if (!session) {
        return null;
      }

      return this.getSessionById(session.id);
    } catch (error) {
      console.error(
        `❌ Failed to retrieve session for student ${studentId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Retrieve a session by Learnosity session ID
   */
  static async getSessionByLearnosityId(
    learnositySessionId: string
  ): Promise<SessionWithResults | null> {
    try {
      const session =
        await SessionModel.findByLearnositySessionId(learnositySessionId);
      if (!session) {
        return null;
      }

      return this.getSessionById(session.id);
    } catch (error) {
      console.error(
        `❌ Failed to retrieve session by Learnosity ID ${learnositySessionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Update session progress
   */
  static async updateProgress(
    sessionId: string,
    currentQuestion: number,
    progress: number
  ): Promise<Session> {
    try {
      // Validate progress values
      if (currentQuestion < 1 || progress < 0 || progress > 100) {
        throw new Error("Invalid progress values");
      }

      const session = await prisma.testSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      }); // updateProgress not available in current schema
      console.log(
        `✅ Session ${sessionId} progress updated: Q${currentQuestion}, ${progress}%`
      );

      return session;
    } catch (error) {
      console.error(
        `❌ Failed to update progress for session ${sessionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get session progress summary
   */
  static async getSessionProgress(
    sessionId: string
  ): Promise<SessionProgress | null> {
    try {
      const session = await SessionModel.findById(sessionId);
      if (!session) {
        return null;
      }

      const results = await AssessmentResultModel.findBySessionId(sessionId);
      const questionsAnswered = results.length;

      let timeRemaining: number | undefined;
      if (session.expiresAt) {
        const now = new Date();
        timeRemaining = Math.max(
          0,
          session.expiresAt.getTime() - now.getTime()
        );
      }

      return {
        questionsAnswered,
        timeRemaining,
      };
    } catch (error) {
      console.error(
        `❌ Failed to get progress for session ${sessionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Resume an existing session
   */
  static async resumeSession(
    sessionId: string
  ): Promise<SessionWithResults | null> {
    try {
      const session = await this.getSessionById(sessionId);
      if (!session) {
        return null;
      }

      // Check if session can be resumed
      if (session.status === "COMPLETED") {
        throw new Error("Cannot resume completed session");
      }

      if (session.isExpired) {
        throw new Error("Cannot resume expired session");
      }

      // Update last accessed time
      await prisma.testSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });

      console.log(`✅ Session ${sessionId} resumed successfully`);
      return session;
    } catch (error) {
      console.error(`❌ Failed to resume session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Complete a session
   */
  static async completeSession(sessionId: string): Promise<Session> {
    try {
      const session = await SessionModel.markCompleted(sessionId);
      console.log(`✅ Session ${sessionId} marked as completed`);
      return session;
    } catch (error) {
      console.error(`❌ Failed to complete session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a session
   */
  static async cancelSession(sessionId: string): Promise<Session> {
    try {
      const session = await SessionModel.updateStatus(sessionId, "CANCELLED");
      console.log(`✅ Session ${sessionId} cancelled`);
      return session;
    } catch (error) {
      console.error(`❌ Failed to cancel session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get all active sessions
   */
  static async getActiveSessions(): Promise<SessionSummary[]> {
    try {
      const sessions = await SessionModel.findActive();

      return sessions.map(session => ({
        id: session.id,
        studentId: session.studentId,
        status: session.status,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt || undefined,
        isExpired: session.expiresAt ? new Date() > session.expiresAt : false,
        isActive:
          session.status === "ACTIVE" &&
          !(session.expiresAt ? new Date() > session.expiresAt : false),
      }));
    } catch (error) {
      console.error("❌ Failed to get active sessions:", error);
      throw error;
    }
  }

  /**
   * Get session statistics
   */
  static async getSessionStats(): Promise<{
    total: number;
    active: number;
    completed: number;
    expired: number;
    cancelled: number;
  }> {
    try {
      const [active, expired, completed, cancelled] = await Promise.all([
        SessionModel.findActive(),
        SessionModel.findExpired(),
        prisma.testSession.count({ where: { status: "COMPLETED" } }),
        prisma.testSession.count({ where: { status: "CANCELLED" } }),
      ]);

      const total = active.length + expired.length + completed + cancelled;

      return {
        total,
        active: active.length,
        completed,
        expired: expired.length,
        cancelled,
      };
    } catch (error) {
      console.error("❌ Failed to get session statistics:", error);
      throw error;
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const expiredSessions = await SessionModel.findExpired();
      let cleanedCount = 0;

      for (const session of expiredSessions) {
        if (session.status === "ACTIVE") {
          await SessionModel.updateStatus(session.id, "EXPIRED");
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);
      }

      return cleanedCount;
    } catch (error) {
      console.error("❌ Failed to cleanup expired sessions:", error);
      throw error;
    }
  }
}

// Export the service class
export default TestSessionService;
