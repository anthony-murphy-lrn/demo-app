import { prisma } from "./database";
import { SessionModel } from "./models";
import type { Session } from "./models";

export interface SessionState {
  sessionId: string;
  lastActivity: Date;
  isResumable: boolean;
}

export interface ResumePoint {
  canResume: boolean;
}

export class SessionPersistenceService {
  /**
   * Save session state automatically
   */
  static async saveSessionState(
    sessionId: string,
    state: Partial<SessionState>
  ): Promise<void> {
    try {
      const session = await SessionModel.findById(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Update session with current state - only metadata since Learnosity handles assessment data
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (state.lastActivity !== undefined) {
        updateData.lastActivity = state.lastActivity;
      }

      if (state.isResumable !== undefined) {
        updateData.isResumable = state.isResumable;
      }

      // Save to session table
      await prisma.session.update({
        where: { id: sessionId },
        data: updateData,
      });

      console.log(`💾 Session state saved for ${sessionId}`);
    } catch (error) {
      console.error(`❌ Failed to save session state for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Load complete session state
   */
  static async loadSessionState(
    sessionId: string
  ): Promise<SessionState | null> {
    try {
      const session = await SessionModel.findWithResults(sessionId);
      if (!session) {
        return null;
      }

      // Calculate if session is resumable
      const isResumable = this.isSessionResumable(session);

      return {
        sessionId: session.id,
        lastActivity: session.updatedAt,
        isResumable,
      };
    } catch (error) {
      console.error(`❌ Failed to load session state for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a session can be resumed
   */
  static isSessionResumable(session: Session): boolean {
    // Session must be active
    if (session.status !== "ACTIVE") {
      return false;
    }

    // Session must not be expired
    if (session.expiresAt && session.expiresAt < new Date()) {
      return false;
    }

    // Learnosity handles progress and completion status
    return true;
  }





  /**
   * Get session recovery options
   */
  static async getRecoveryOptions(sessionId: string): Promise<{
    canResume: boolean;
    canRestore: boolean;
    lastCheckpoint: string | null;
    resumePoint: ResumePoint | null;
  }> {
    try {
      const session = await SessionModel.findById(sessionId);
      if (!session) {
        return {
          canResume: false,
          canRestore: false,
          lastCheckpoint: null,
          resumePoint: null,
        };
      }

      const canResume = this.isSessionResumable(session);
      // Learnosity handles checkpoints and resume points
      const hasCheckpoint = false; // Learnosity manages this
      const resumePoint = { canResume }; // Simplified since Learnosity handles resumption

      return {
        canResume,
        canRestore: hasCheckpoint,
        lastCheckpoint: null, // Learnosity manages this
        resumePoint,
      };
    } catch (error) {
      console.error(
        `❌ Failed to get recovery options for session ${sessionId}:`,
        error
      );
      throw error;
    }
  }
}

// Export the service class
export default SessionPersistenceService;

