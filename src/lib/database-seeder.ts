import { prisma } from "./database";
import { AssessmentResultModel } from "./models";
import { TestSessionService } from "./test-session-service";
import {} from "../utils/test-session-id-generator";

export interface SeederConfig {
  testSessionsCount: number;
  includeExpiredTestSessions: boolean;
  includeCompletedTestSessions: boolean;
  includeAbandonedTestSessions: boolean;
  assessmentResultsPerTestSession: number;
  questionsPerAssessment: number;
}

export interface SeederResult {
  testSessionsCreated: number;
  resultsCreated: number;
  totalRecords: number;
  executionTime: number;
  errors: string[];
}

export class DatabaseSeeder {
  private static readonly DEFAULT_CONFIG: SeederConfig = {
    testSessionsCount: 10,
    includeExpiredTestSessions: true,
    includeCompletedTestSessions: true,
    includeAbandonedTestSessions: true,
    assessmentResultsPerTestSession: 5,
    questionsPerAssessment: 10,
  };

  /**
   * Seed the database with demo data
   */
  static async seedDatabase(
    config: Partial<SeederConfig> = {}
  ): Promise<SeederResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    const errors: string[] = [];

    console.log("🌱 Starting database seeding process...");
    console.log(`📊 Configuration: ${JSON.stringify(finalConfig, null, 2)}`);

    try {
      // Clear existing demo data first
      await this.clearDemoData();

      // Create demo test sessions
      const testSessions = await this.createDemoTestSessions(finalConfig);

      // Create demo assessment results
      const results = await this.createDemoResults(testSessions, finalConfig);

      // Create various test session states
      await this.createSessionVarieties(testSessions, finalConfig);

      const executionTime = Date.now() - startTime;
      const totalRecords = testSessions.length + results.length;

      console.log(`✅ Database seeding completed in ${executionTime}ms`);
      console.log(
        `📈 Created ${testSessions.length} test sessions and ${results.length} results`
      );

      return {
        testSessionsCreated: testSessions.length,
        resultsCreated: results.length,
        totalRecords,
        executionTime,
        errors,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(errorMessage);
      console.error("❌ Database seeding failed:", error);
      throw error;
    }
  }

  /**
   * Clear existing demo data
   */
  private static async clearDemoData(): Promise<void> {
    console.log("🧹 Clearing existing demo data...");

    try {
      // Delete all assessment results first
      await prisma.assessmentResult.deleteMany();

      // Delete all test sessions
      await prisma.testSession.deleteMany();

      console.log("✅ Demo data cleared successfully");
    } catch (error) {
      console.error("❌ Failed to clear demo data:", error);
      throw error;
    }
  }

  /**
   * Create demo test sessions
   */
  private static async createDemoTestSessions(
    config: SeederConfig
  ): Promise<any[]> {
    console.log("👥 Creating demo test sessions...");
    console.log(`Config testSessionsCount: ${config.testSessionsCount}`);

    const testSessions = [];
    const studentNames = [
      "Alice Johnson",
      "Bob Smith",
      "Carol Davis",
      "David Wilson",
      "Eva Brown",
      "Frank Miller",
      "Grace Lee",
      "Henry Taylor",
      "Ivy Chen",
      "Jack Anderson",
      "Kate Martinez",
      "Liam O'Connor",
      "Maya Patel",
      "Noah Rodriguez",
      "Olivia Kim",
    ];

    for (let i = 0; i < config.testSessionsCount; i++) {
      try {
        const studentName = studentNames[i % studentNames.length];
        const studentId = `demo-student-${i + 1}`;
        console.log(`Creating test session ${i + 1} for student ${studentId}`);

        const testSession = await TestSessionService.createTestSession({
          studentId,
          learnositySessionId: `demo-learnosity-${i + 1}`,
          assessmentId: `demo-assessment-${Math.floor(i / 3) + 1}`,
          expiresAt: new Date(Date.now() + (24 + i) * 60 * 60 * 1000), // Varying expiration times
        });

        testSessions.push(testSession);
        console.log(`✅ Created test session for ${studentName} (${studentId})`);
      } catch (error) {
        console.error(`❌ Failed to create test session ${i + 1}:`, error);
      }
    }

    return testSessions;
  }

  /**
   * Create demo assessment results
   */
  private static async createDemoResults(
    testSessions: any[],
    config: SeederConfig
  ): Promise<any[]> {
    console.log("📝 Creating demo assessment results...");

    const results = [];
    const questionTypes = ["multiple-choice", "true-false", "numeric", "text"];
    const difficultyLevels = ["easy", "medium", "hard"];

    for (const testSession of testSessions) {
      const resultsCount = Math.min(
        config.assessmentResultsPerTestSession,
        config.questionsPerAssessment
      );

      for (let q = 1; q <= resultsCount; q++) {
        try {
          const questionType = questionTypes[q % questionTypes.length];
          const difficulty = difficultyLevels[q % difficultyLevels.length];

          // Generate realistic answers based on question type
          const answer = this.generateDemoAnswer(questionType, difficulty);
          const score = Math.floor(Math.random() * 60) + 40; // 40-100 score
          const timeSpent = Math.floor(Math.random() * 120) + 30; // 30-150 seconds

          const result = await AssessmentResultModel.create({
            testSessionId: testSession.id,
            response: {
              answer,
              questionType,
              difficulty,
              timestamp: new Date().toISOString(),
            },
            score,
            timeSpent,
          });

          results.push(result);
        } catch (error) {
          console.error(
            `❌ Failed to create result for session ${session.id}, question ${q}:`,
            error
          );
        }
      }

      // Update session progress based on results
      const progress = Math.round(
        (resultsCount / config.questionsPerAssessment) * 100
      );
      await TestSessionService.updateProgress(
        testSession.id,
        resultsCount + 1,
        progress
      );

      console.log(
        `✅ Created ${resultsCount} results for test session ${testSession.id}`
      );
    }

    return results;
  }

  /**
   * Create various session states for demonstration
   */
  private static async createSessionVarieties(
    sessions: any[],
    config: SeederConfig
  ): Promise<void> {
    console.log("🎭 Creating session variety states...");

    if (config.includeExpiredSessions && sessions.length > 0) {
      // Create some expired sessions
      const expiredSession = await TestSessionService.createTestSession({
        studentId: "demo-expired-student",
        learnositySessionId: "demo-expired-learnosity",
        assessmentId: "demo-expired-assessment",

        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // Expired 1 hour ago
      });

      await SessionModel.updateStatus(expiredSession.id, "EXPIRED");
      console.log("⏰ Created expired session for demonstration");
    }

    if (config.includeCompletedSessions && sessions.length > 0) {
      // Create a completed session
      const completedSession = await TestSessionService.createTestSession({
        studentId: "demo-completed-student",
        learnositySessionId: "demo-completed-learnosity",
        assessmentId: "demo-completed-assessment",

        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // Create results for all questions
      for (let q = 1; q <= 6; q++) {
        await AssessmentResultModel.create({
          sessionId: completedSession.id,
          response: { answer: "Completed answer", questionType: "demo" },
          score: 95,
          timeSpent: 45,
        });
      }

      await TestSessionService.completeSession(completedSession.id);
      console.log("✅ Created completed session for demonstration");
    }

    if (config.includeAbandonedSessions && sessions.length > 0) {
      // Create an abandoned session (no activity for extended period)
      const abandonedSession = await TestSessionService.createTestSession({
        studentId: "demo-abandoned-student",
        learnositySessionId: "demo-abandoned-learnosity",
        assessmentId: "demo-abandoned-assessment",

        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // Create only a few results to simulate abandonment
      await AssessmentResultModel.create({
        sessionId: abandonedSession.id,
        response: { answer: "Partial answer", questionType: "demo" },
        score: 85,
        timeSpent: 60,
      });

      await TestSessionService.updateProgress(abandonedSession.id, 2, 14);
      console.log("🚫 Created abandoned session for demonstration");
    }
  }

  /**
   * Generate realistic demo answers
   */
  private static generateDemoAnswer(
    questionType: string,
    difficulty: string
  ): any {
    switch (questionType) {
      case "multiple-choice":
        const choices = ["A", "B", "C", "D"];
        return choices[Math.floor(Math.random() * choices.length)];

      case "true-false":
        return Math.random() > 0.5 ? "True" : "False";

      case "numeric":
        const baseValue =
          difficulty === "easy" ? 10 : difficulty === "medium" ? 100 : 1000;
        return Math.floor(Math.random() * baseValue) + 1;

      case "text":
        const textAnswers = [
          "The answer involves solving the quadratic equation.",
          "This requires understanding of basic principles.",
          "The solution is derived from the given formula.",
          "This can be solved using the standard method.",
        ];
        return textAnswers[Math.floor(Math.random() * textAnswers.length)];

      default:
        return "Demo answer";
    }
  }

  /**
   * Get seeding statistics
   */
  static async getSeedingStats(): Promise<{
    totalSessions: number;
    totalResults: number;
    sessionStatuses: Record<string, number>;
    averageResultsPerSession: number;
    databaseSize: number;
  }> {
    try {
      const [sessions, results, databaseSize] = await Promise.all([
        prisma.testSession.count(),
        prisma.assessmentResult.count(),
        this.getDatabaseSize(),
      ]);

      const statusCounts = await prisma.testSession.groupBy({
        by: ["status"],
        _count: { status: true },
      });

      const sessionStatuses: Record<string, number> = {};
      statusCounts.forEach(count => {
        sessionStatuses[count.status] = count._count.status;
      });

      return {
        totalSessions: sessions,
        totalResults: results,
        sessionStatuses,
        averageResultsPerSession:
          sessions > 0 ? Math.round(results / sessions) : 0,
        databaseSize,
      };
    } catch (error) {
      console.error("❌ Failed to get seeding stats:", error);
      throw error;
    }
  }

  /**
   * Get database size
   */
  private static async getDatabaseSize(): Promise<number> {
    try {
      const result =
        await prisma.$queryRaw`SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()`;
      if (Array.isArray(result) && result.length > 0) {
        const size = (result[0] as any).size;
        return typeof size === "bigint" ? Number(size) : size || 0;
      }
      return 0;
    } catch {
      console.log("⚠️  Could not determine database size");
      return 0;
    }
  }

  /**
   * Reset database to clean state
   */
  static async resetDatabase(): Promise<void> {
    console.log("🔄 Resetting database to clean state...");

    try {
      await this.clearDemoData();
      console.log("✅ Database reset completed");
    } catch (error) {
      console.error("❌ Database reset failed:", error);
      throw error;
    }
  }

  /**
   * Create minimal demo data for quick testing
   */
  static async createMinimalDemo(): Promise<SeederResult> {
    return this.seedDatabase({
      testSessionsCount: 3,
      includeExpiredTestSessions: false,
      includeCompletedTestSessions: false,
      includeAbandonedTestSessions: false,
      assessmentResultsPerTestSession: 2,
      questionsPerAssessment: 5,
    });
  }

  /**
   * Create comprehensive demo data for full testing
   */
  static async createComprehensiveDemo(): Promise<SeederResult> {
    return this.seedDatabase({
      testSessionsCount: 20,
      includeExpiredTestSessions: true,
      includeCompletedTestSessions: true,
      includeAbandonedTestSessions: true,
      assessmentResultsPerTestSession: 8,
      questionsPerAssessment: 15,
    });
  }
}

export default DatabaseSeeder;
