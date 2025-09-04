import { prisma } from "./database";
import type { TestSession, AssessmentResult } from "../generated/prisma";

// Type definitions for database models
export type { TestSession, AssessmentResult };

// Extended types with additional computed properties
export interface TestSessionWithResults extends TestSession {
  results: AssessmentResult[];
  isExpired: boolean;
  isActive: boolean;
  progressPercentage: number;
}

export interface AssessmentResultWithTestSession extends AssessmentResult {
  testSession: TestSession;
}

// Test session model utilities
export class TestSessionModel {
  /**
   * Create a new test session
   */
  static async create(data: {
    studentId: string;
    learnositySessionId?: string;
    assessmentId: string;
    expiresAt?: Date;
  }): Promise<TestSession> {
    return prisma.testSession.create({
      data: {
        ...data,
        learnositySessionId:
          data.learnositySessionId || `session_${Date.now()}_${data.studentId}`,
      },
    });
  }

  /**
   * Find session by ID
   */
  static async findById(id: string): Promise<TestSession | null> {
    return prisma.testSession.findUnique({
      where: { id },
    });
  }

  /**
   * Find session by student ID
   */
  static async findByStudentId(studentId: string): Promise<TestSession | null> {
    return prisma.testSession.findFirst({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find session by Learnosity session ID
   */
  static async findByLearnositySessionId(
    learnositySessionId: string
  ): Promise<TestSession | null> {
    return prisma.testSession.findFirst({
      where: { learnositySessionId },
    });
  }

  /**
   * Get session with results
   */
  static async findWithResults(
    id: string
  ): Promise<TestSessionWithResults | null> {
    const session = await prisma.testSession.findUnique({
      where: { id },
      include: {
        results: true,
      },
    });

    if (!session) return null;

    return {
      ...session,
      isExpired: session.expiresAt ? new Date() > session.expiresAt : false,
      isActive: !(session.expiresAt ? new Date() > session.expiresAt : false),
      // Note: Progress is now managed by Learnosity, not stored locally
      progressPercentage: 0,
    };
  }

  /**
   * Get active sessions (not expired)
   */
  static async findActive(): Promise<TestSession[]> {
    return prisma.testSession.findMany({
      where: {
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
  }

  /**
   * Get expired sessions
   */
  static async findExpired(): Promise<TestSession[]> {
    return prisma.testSession.findMany({
      where: {
        expiresAt: { lt: new Date() },
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
    testSessionId: string;
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
   * Find results by test session ID
   */
  static async findByTestSessionId(
    testSessionId: string
  ): Promise<AssessmentResult[]> {
    return prisma.assessmentResult.findMany({
      where: { testSessionId },
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
   * Get result with test session data
   */
  static async findWithTestSession(
    id: string
  ): Promise<AssessmentResultWithTestSession | null> {
    return prisma.assessmentResult.findUnique({
      where: { id },
      include: {
        testSession: true,
      },
    });
  }

  /**
   * Calculate test session score
   */
  static async calculateTestSessionScore(testSessionId: string): Promise<{
    answeredQuestions: number;
    correctAnswers: number;
    totalScore: number;
    averageScore: number;
  }> {
    const results = await prisma.assessmentResult.findMany({
      where: { testSessionId },
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
