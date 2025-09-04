import { prisma } from "./database";
import { SessionModel } from "./models";
import { sessionConfig } from "./config";

export interface CleanupStats {
  expiredSessions: number;
  abandonedSessions: number;
  oldCompletedSessions: number;
  totalCleaned: number;
  databaseSizeBefore: number;
  databaseSizeAfter: number;
}

export interface TimeoutConfig {
  sessionTimeoutMinutes: number;
  cleanupIntervalMinutes: number;
  maxCompletedSessionAgeDays: number;
  maxAbandonedSessionAgeHours: number;
}

export class SessionCleanupService {
  private static cleanupInterval: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Initialize the cleanup service
   */
  static initialize(): void {
    if (this.cleanupInterval) {
      console.log("🔄 Cleanup service already initialized");
      return;
    }

    const intervalMs = sessionConfig.cleanupIntervalMinutes * 60 * 1000;

    this.cleanupInterval = setInterval(async () => {
      if (!this.isRunning) {
        await this.performCleanup();
      }
    }, intervalMs);

    console.log(
      `🚀 Session cleanup service initialized (interval: ${sessionConfig.cleanupIntervalMinutes} minutes)`
    );
  }

  /**
   * Stop the cleanup service
   */
  static stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log("🛑 Session cleanup service stopped");
    }
  }

  /**
   * Perform comprehensive session cleanup
   */
  static async performCleanup(): Promise<CleanupStats> {
    if (this.isRunning) {
      console.log("⚠️  Cleanup already in progress, skipping...");
      return {
        expiredSessions: 0,
        abandonedSessions: 0,
        oldCompletedSessions: 0,
        totalCleaned: 0,
        databaseSizeBefore: 0,
        databaseSizeAfter: 0,
      };
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log("🧹 Starting session cleanup process...");

      const stats: CleanupStats = {
        expiredSessions: 0,
        abandonedSessions: 0,
        oldCompletedSessions: 0,
        totalCleaned: 0,
        databaseSizeBefore: 0,
        databaseSizeAfter: 0,
      };

      // Get database size before cleanup
      stats.databaseSizeBefore = await this.getDatabaseSize();

      // 1. Clean up expired sessions
      stats.expiredSessions = await this.cleanupExpiredSessions();

      // 2. Clean up abandoned sessions (no activity for extended period)
      stats.abandonedSessions = await this.cleanupAbandonedSessions();

      // 3. Clean up old completed sessions
      stats.oldCompletedSessions = await this.cleanupOldCompletedSessions();

      // 4. Clean up orphaned assessment results
      await this.cleanupOrphanedResults();

      // 5. Optimize database
      await this.optimizeDatabase();

      // Calculate total cleaned
      stats.totalCleaned =
        stats.expiredSessions +
        stats.abandonedSessions +
        stats.oldCompletedSessions;

      // Get database size after cleanup
      stats.databaseSizeAfter = await this.getDatabaseSize();

      const duration = Date.now() - startTime;
      console.log(
        `✅ Cleanup completed in ${duration}ms. Total cleaned: ${stats.totalCleaned}`
      );

      return stats;
    } catch (error) {
      console.error("❌ Cleanup process failed:", error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Clean up expired sessions
   */
  private static async cleanupExpiredSessions(): Promise<number> {
    try {
      const expiredSessions = await SessionModel.findExpired();
      let cleanedCount = 0;

      for (const session of expiredSessions) {
        if (session.status === "ACTIVE") {
          await SessionModel.updateStatus(session.id, "EXPIRED");
          cleanedCount++;
          console.log(`⏰ Marked expired session: ${session.id}`);
        }
      }

      if (cleanedCount > 0) {
        console.log(`⏰ Cleaned up ${cleanedCount} expired sessions`);
      }

      return cleanedCount;
    } catch (error) {
      console.error("❌ Failed to cleanup expired sessions:", error);
      return 0;
    }
  }

  /**
   * Clean up abandoned sessions (no activity for extended period)
   */
  private static async cleanupAbandonedSessions(): Promise<number> {
    try {
      const abandonedThreshold = new Date(
        Date.now() - 24 // hours * 60 * 60 * 1000
      );

      const abandonedSessions = await prisma.session.findMany({
        where: {
          status: "ACTIVE",
          updatedAt: { lt: abandonedThreshold },
          expiresAt: { gt: new Date() }, // Not expired yet, but abandoned
        },
      });

      let cleanedCount = 0;
      for (const session of abandonedSessions) {
        await SessionModel.updateStatus(session.id, "EXPIRED");
        cleanedCount++;
        console.log(`🚫 Marked abandoned session: ${session.id}`);
      }

      if (cleanedCount > 0) {
        console.log(`🚫 Cleaned up ${cleanedCount} abandoned sessions`);
      }

      return cleanedCount;
    } catch (error) {
      console.error("❌ Failed to cleanup abandoned sessions:", error);
      return 0;
    }
  }

  /**
   * Clean up old completed sessions
   */
  private static async cleanupOldCompletedSessions(): Promise<number> {
    try {
      const oldThreshold = new Date(
        Date.now() - 7 // days * 24 * 60 * 60 * 1000
      );

      const oldCompletedSessions = await prisma.session.findMany({
        where: {
          status: "COMPLETED",
          updatedAt: { lt: oldThreshold },
        },
      });

      let cleanedCount = 0;
      for (const session of oldCompletedSessions) {
        // Delete the session and all related results
        await prisma.assessmentResult.deleteMany({
          where: { sessionId: session.id },
        });

        await prisma.session.delete({
          where: { id: session.id },
        });

        cleanedCount++;
        console.log(`🗑️  Deleted old completed session: ${session.id}`);
      }

      if (cleanedCount > 0) {
        console.log(`🗑️  Cleaned up ${cleanedCount} old completed sessions`);
      }

      return cleanedCount;
    } catch (error) {
      console.error("❌ Failed to cleanup old completed sessions:", error);
      return 0;
    }
  }

  /**
   * Clean up orphaned assessment results
   * Note: Disabled due to schema constraints - sessionId is not nullable
   */
  private static async cleanupOrphanedResults(): Promise<number> {
    // Orphaned results cleanup disabled due to schema constraints
    // sessionId field is not nullable in current schema
    return 0;
  }

  /**
   * Optimize database after cleanup
   */
  private static async optimizeDatabase(): Promise<void> {
    try {
      // For SQLite, run VACUUM to optimize the database
      await prisma.$executeRaw`VACUUM`;
      console.log("🔧 Database optimized with VACUUM");
    } catch {
      console.log(
        "⚠️  Database optimization skipped (VACUUM not supported in this environment)"
      );
    }
  }

  /**
   * Get database size in bytes
   */
  private static async getDatabaseSize(): Promise<number> {
    try {
      // For SQLite, get the file size
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
   * Force cleanup of a specific session
   */
  static async forceCleanupSession(sessionId: string): Promise<boolean> {
    try {
      const session = await SessionModel.findById(sessionId);
      if (!session) {
        return false;
      }

      // Delete all related results first
      await prisma.assessmentResult.deleteMany({
        where: { sessionId },
      });

      // Delete the session
      await prisma.session.delete({
        where: { id: sessionId },
      });

      console.log(`🗑️  Force cleaned session: ${sessionId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to force cleanup session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Get cleanup statistics
   */
  static async getCleanupStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    completedSessions: number;
    abandonedSessions: number;
    lastCleanup: Date | null;
    nextCleanup: Date | null;
  }> {
    try {
      const [total, active, expired, completed] = await Promise.all([
        prisma.session.count(),
        prisma.session.count({ where: { status: "ACTIVE" } }),
        prisma.session.count({ where: { status: "EXPIRED" } }),
        prisma.session.count({ where: { status: "COMPLETED" } }),
      ]);

      const abandonedThreshold = new Date(
        Date.now() - 24 // hours * 60 * 60 * 1000
      );
      const abandoned = await prisma.session.count({
        where: {
          status: "ACTIVE",
          updatedAt: { lt: abandonedThreshold },
          expiresAt: { gt: new Date() },
        },
      });

      const lastCleanup = this.isRunning ? new Date() : null;
      const nextCleanup = this.cleanupInterval
        ? new Date(
            Date.now() + sessionConfig.cleanupIntervalMinutes * 60 * 1000
          )
        : null;

      return {
        totalSessions: total,
        activeSessions: active,
        expiredSessions: expired,
        completedSessions: completed,
        abandonedSessions: abandoned,
        lastCleanup,
        nextCleanup,
      };
    } catch (error) {
      console.error("❌ Failed to get cleanup stats:", error);
      throw error;
    }
  }

  /**
   * Check if cleanup is needed
   */
  static async isCleanupNeeded(): Promise<boolean> {
    try {
      const stats = await this.getCleanupStats();

      // Cleanup is needed if there are expired, abandoned, or old completed sessions
      return (
        stats.expiredSessions > 0 ||
        stats.abandonedSessions > 0 ||
        stats.completedSessions > 10
      ); // Arbitrary threshold
    } catch (error) {
      console.error("❌ Failed to check if cleanup is needed:", error);
      return false;
    }
  }
}

// Initialize the cleanup service when the module is loaded
SessionCleanupService.initialize();

// Handle process termination to stop the cleanup service
process.on("beforeExit", () => {
  SessionCleanupService.stop();
});

process.on("SIGINT", () => {
  SessionCleanupService.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  SessionCleanupService.stop();
  process.exit(0);
});

export default SessionCleanupService;
