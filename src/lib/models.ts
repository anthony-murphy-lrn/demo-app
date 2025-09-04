import { prisma } from "./database";
import type {
  Session,
  AssessmentResult,
  SessionStatus,
} from "../generated/prisma";

// Type definitions for database models
export type { Session, AssessmentResult, SessionStatus };

// Extended types with additional computed properties
export interface SessionWithResults extends Session {
  results: AssessmentResult[];
  isExpired: boolean;
  isActive: boolean;
  progressPercentage: number;
}

export interface AssessmentResultWithSession extends AssessmentResult {
  session: Session;
}

// Session model utilities
export class SessionModel {
  /**
   * Create a new session
   */
  static async create(data: {
    studentId: string;
    learnositySessionId?: string;
    assessmentId: string;
    expiresAt?: Date;
  }): Promise<Session> {
    return prisma.session.create({
      data: {
        ...data,
        learnositySessionId:
          data.learnositySessionId || `session_${Date.now()}_${data.studentId}`,
        status: "ACTIVE",
      },
    });
  }

  /**
   * Find session by ID
   */
  static async findById(id: string): Promise<Session | null> {
    return prisma.session.findUnique({
      where: { id },
    });
  }

  /**
   * Find session by student ID
   */
  static async findByStudentId(studentId: string): Promise<Session | null> {
    return prisma.session.findFirst({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find session by Learnosity session ID
   */
  static async findByLearnositySessionId(
    learnositySessionId: string
  ): Promise<Session | null> {
    return prisma.session.findFirst({
      where: { learnositySessionId },
    });
  }

  /**
   * Update session status
   */
  static async updateStatus(
    id: string,
    status: SessionStatus
  ): Promise<Session> {
    return prisma.session.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Mark session as completed
   */
  static async markCompleted(id: string): Promise<Session> {
    return prisma.session.update({
      where: { id },
      data: {
        status: "COMPLETED",
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get session with results
   */
  static async findWithResults(id: string): Promise<SessionWithResults | null> {
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        results: true,
      },
    });

    if (!session) return null;

    return {
      ...session,
      isExpired: session.expiresAt ? new Date() > session.expiresAt : false,
      isActive:
        session.status === "ACTIVE" &&
        !(session.expiresAt ? new Date() > session.expiresAt : false),
      // Note: Progress is now managed by Learnosity, not stored locally
      progressPercentage: 0,
    };
  }

  /**
   * Get active sessions
   */
  static async findActive(): Promise<Session[]> {
    return prisma.session.findMany({
      where: {
        status: "ACTIVE",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
  }

  /**
   * Get expired sessions
   */
  static async findExpired(): Promise<Session[]> {
    return prisma.session.findMany({
      where: {
        OR: [
          { status: "EXPIRED" },
          {
            expiresAt: { lt: new Date() },
          },
          {
            status: "ACTIVE",
            expiresAt: { lt: new Date() },
          },
        ],
      },
    });
  }
}

// AssessmentResult model utilities
export class AssessmentResultModel {
  /**
   * Create a new assessment result
   */
  static async create(data: {
    sessionId: string;
    response: any;
    score?: number;
    timeSpent?: number;
  }): Promise<AssessmentResult> {
    return prisma.assessmentResult.create({
      data,
    });
  }

  /**
   * Find result by ID
   */
  static async findById(id: string): Promise<AssessmentResult | null> {
    return prisma.assessmentResult.findUnique({
      where: { id },
    });
  }

  /**
   * Find results by session ID
   */
  static async findBySessionId(sessionId: string): Promise<AssessmentResult[]> {
    return prisma.assessmentResult.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Update result
   */
  static async update(
    id: string,
    data: Partial<{
      response: any;
      score: number;
      timeSpent: number;
    }>
  ): Promise<AssessmentResult> {
    return prisma.assessmentResult.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get session results with session data
   */
  static async findWithSession(
    id: string
  ): Promise<AssessmentResultWithSession | null> {
    return prisma.assessmentResult.findUnique({
      where: { id },
      include: {
        session: true,
      },
    });
  }

  /**
   * Calculate session score
   */
  static async calculateSessionScore(sessionId: string): Promise<{
    answeredQuestions: number;
    correctAnswers: number;
    totalScore: number;
    averageScore: number;
  }> {
    const results = await prisma.assessmentResult.findMany({
      where: { sessionId },
    });

    const answeredQuestions = results.filter(r => r.response !== null).length;
    const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
    const averageScore =
      answeredQuestions > 0 ? totalScore / answeredQuestions : 0;

    return {
      answeredQuestions,
      correctAnswers: 0, // No longer tracking correct answers
      totalScore,
      averageScore,
    };
  }
}
