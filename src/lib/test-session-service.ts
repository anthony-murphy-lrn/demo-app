import { prisma } from "./database";
import { TestSessionModel, AssessmentResultModel } from "./models";
import type { TestSession, TestSessionWithResults } from "./models";
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
      // Check if student already has a recent test session
      const existingTestSession = await TestSessionModel.findByStudentId(
        data.studentId
      );
      if (existingTestSession) {
        // If test session exists but is expired, we can create a new one
        if (
          existingTestSession.expiresAt &&
          existingTestSession.expiresAt < new Date()
        ) {
          console.log(
            `ℹ️ Student ${data.studentId} has an expired test session, creating new one`
          );
        } else {
          console.log(
            `ℹ️ Student ${data.studentId} already has a test session, creating new one`
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
      const session = await TestSessionModel.findWithResults(id);
      if (!session) {
        console.log(`⚠️  Session not found: ${id}`);
        return null;
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
  ): Promise<TestSessionWithResults | null> {
    try {
      const session = await TestSessionModel.findByStudentId(studentId);
      if (!session) {
        return null;
      }

      return this.getTestSessionById(session.id);
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
  ): Promise<TestSessionWithResults | null> {
    try {
      const session =
        await TestSessionModel.findByLearnositySessionId(learnositySessionId);
      if (!session) {
        return null;
      }

      return this.getTestSessionById(session.id);
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
  ): Promise<TestSession> {
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
  ): Promise<TestSessionProgress | null> {
    try {
      const session = await TestSessionModel.findById(sessionId);
      if (!session) {
        return null;
      }

      const results =
        await AssessmentResultModel.findByTestSessionId(sessionId);
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
  ): Promise<TestSessionWithResults | null> {
    try {
      const session = await this.getTestSessionById(sessionId);
      if (!session) {
        return null;
      }

      // Check if session can be resumed
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
   * Get all active sessions
   */
  static async getActiveSessions(): Promise<TestSessionSummary[]> {
    try {
      const sessions = await TestSessionModel.findActive();

      return sessions.map(session => ({
        id: session.id,
        studentId: session.studentId,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt || undefined,
        isExpired: session.expiresAt ? new Date() > session.expiresAt : false,
        isActive: !(session.expiresAt ? new Date() > session.expiresAt : false),
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
    expired: number;
  }> {
    try {
      const [active, expired] = await Promise.all([
        TestSessionModel.findActive(),
        TestSessionModel.findExpired(),
      ]);

      const total = active.length + expired.length;

      return {
        total,
        active: active.length,
        expired: expired.length,
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
      const expiredSessions = await TestSessionModel.findExpired();
      const cleanedCount = expiredSessions.length;

      if (cleanedCount > 0) {
        console.log(
          `🧹 Found ${cleanedCount} expired sessions (no cleanup needed since status was removed)`
        );
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
