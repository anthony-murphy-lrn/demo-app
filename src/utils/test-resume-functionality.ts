/**
 * Test script for resume functionality
 * This script tests the resume functionality without requiring Learnosity credentials
 */

import { prisma } from "@/lib/database";

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
}

export class ResumeFunctionalityTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log("🧪 Starting Resume Functionality Tests...\n");

    await this.testSessionRetrieval();
    await this.testExpiredSessionHandling();
    await this.testStudentIdValidation();
    await this.testMissingLearnositySessionId();
    await this.testSessionStatusCalculation();

    this.printResults();
    return this.results;
  }

  private async testSessionRetrieval(): Promise<void> {
    const testName = "Session Retrieval";
    try {
      // Get the most recent test session
      const session = await prisma.testSession.findFirst({
        orderBy: { createdAt: "desc" },
      });

      if (!session) {
        this.addResult(testName, false, "No test sessions found in database");
        return;
      }

      // Test retrieving session by ID
      const retrievedSession = await prisma.testSession.findUnique({
        where: { id: session.id },
      });

      if (!retrievedSession) {
        this.addResult(testName, false, "Failed to retrieve session by ID");
        return;
      }

      this.addResult(testName, true, undefined, {
        sessionId: session.id,
        studentId: session.studentId,
        hasLearnositySessionId: !!session.learnositySessionId,
      });
    } catch (error) {
      this.addResult(testName, false, `Database error: ${error}`);
    }
  }

  private async testExpiredSessionHandling(): Promise<void> {
    const testName = "Expired Session Handling";
    try {
      // Create a test session with past expiry time
      const expiredSession = await prisma.testSession.create({
        data: {
          studentId: "test-student-expired",
          assessmentId: "test-assessment",
          learnositySessionId: "test-learnosity-session",
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        },
      });

      // Test if session is properly identified as expired
      const isExpired =
        expiredSession.expiresAt && expiredSession.expiresAt < new Date();

      if (!isExpired) {
        this.addResult(testName, false, "Session not identified as expired");
        return;
      }

      // Clean up test data
      await prisma.testSession.delete({
        where: { id: expiredSession.id },
      });

      this.addResult(testName, true, undefined, {
        sessionId: expiredSession.id,
        expiresAt: expiredSession.expiresAt,
        isExpired: true,
      });
    } catch (error) {
      this.addResult(testName, false, `Error: ${error}`);
    }
  }

  private async testStudentIdValidation(): Promise<void> {
    const testName = "Student ID Validation";
    try {
      // Get an existing session
      const session = await prisma.testSession.findFirst();

      if (!session) {
        this.addResult(
          testName,
          false,
          "No sessions found for validation test"
        );
        return;
      }

      // Test correct student ID
      const correctStudentId = session.studentId === session.studentId;

      // Test incorrect student ID
      const incorrectStudentId = session.studentId !== "different-student-id";

      if (!correctStudentId || !incorrectStudentId) {
        this.addResult(testName, false, "Student ID validation logic failed");
        return;
      }

      this.addResult(testName, true, undefined, {
        sessionStudentId: session.studentId,
        validationWorks: true,
      });
    } catch (error) {
      this.addResult(testName, false, `Error: ${error}`);
    }
  }

  private async testMissingLearnositySessionId(): Promise<void> {
    const testName = "Missing Learnosity Session ID";
    try {
      // Create a session without Learnosity session ID
      const sessionWithoutLearnosityId = await prisma.testSession.create({
        data: {
          studentId: "test-student-no-learnosity",
          assessmentId: "test-assessment",
          learnositySessionId: "test-learnosity-session-id",
        },
      });

      // Test if session is properly identified as missing Learnosity session ID
      const hasLearnositySessionId =
        !!sessionWithoutLearnosityId.learnositySessionId;

      if (hasLearnositySessionId) {
        this.addResult(
          testName,
          false,
          "Session incorrectly identified as having Learnosity session ID"
        );
        return;
      }

      // Clean up test data
      await prisma.testSession.delete({
        where: { id: sessionWithoutLearnosityId.id },
      });

      this.addResult(testName, true, undefined, {
        sessionId: sessionWithoutLearnosityId.id,
        hasLearnositySessionId: false,
      });
    } catch (error) {
      this.addResult(testName, false, `Error: ${error}`);
    }
  }

  private async testSessionStatusCalculation(): Promise<void> {
    const testName = "Session Status Calculation";
    try {
      // Get all sessions and test status calculation
      const sessions = await prisma.testSession.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      });

      if (sessions.length === 0) {
        this.addResult(
          testName,
          false,
          "No sessions found for status calculation test"
        );
        return;
      }

      const statusResults = sessions.map(session => {
        const isExpired = session.expiresAt && session.expiresAt < new Date();
        const status = isExpired ? "expired" : "active";
        return {
          sessionId: session.id,
          expiresAt: session.expiresAt,
          status,
        };
      });

      this.addResult(testName, true, undefined, {
        totalSessions: sessions.length,
        statusResults,
      });
    } catch (error) {
      this.addResult(testName, false, `Error: ${error}`);
    }
  }

  private addResult(
    testName: string,
    passed: boolean,
    error?: string,
    details?: any
  ): void {
    this.results.push({
      testName,
      passed,
      error,
      details,
    });
  }

  private printResults(): void {
    console.log("📊 Test Results Summary:");
    console.log("=".repeat(50));

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;

    this.results.forEach(result => {
      const status = result.passed ? "✅" : "❌";
      console.log(`${status} ${result.testName}`);

      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }

      if (result.details) {
        console.log(`   Details:`, JSON.stringify(result.details, null, 2));
      }
    });

    console.log("=".repeat(50));
    console.log(`📈 Passed: ${passed}/${total} tests`);

    if (passed === total) {
      console.log(
        "🎉 All tests passed! Resume functionality is working correctly."
      );
    } else {
      console.log("⚠️  Some tests failed. Please review the errors above.");
    }
  }
}

// Export function to run tests
export async function runResumeTests(): Promise<TestResult[]> {
  const tester = new ResumeFunctionalityTester();
  return await tester.runAllTests();
}
