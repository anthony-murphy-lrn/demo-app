import { prisma } from './database';
import { SessionModel, AssessmentResultModel } from './models';
import type { Session, SessionWithResults } from './models';
import { sessionConfig } from './config';

export interface SessionState {
  sessionId: string;
  currentQuestion: number;
  progress: number;
  answers: Record<string, any>;
  timeSpent: Record<string, number>;
  lastActivity: Date;
  isResumable: boolean;
  resumeData: any;
}

export interface ResumePoint {
  questionNumber: number;
  progress: number;
  lastAnswer: any;
  timeSpent: number;
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

      // Update session with current state
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (state.currentQuestion !== undefined) {
        updateData.currentQuestion = state.currentQuestion;
      }

      if (state.progress !== undefined) {
        updateData.progress = state.progress;
      }

      if (state.lastActivity !== undefined) {
        updateData.lastActivity = state.lastActivity;
      }

      // Save to session table
      await prisma.session.update({
        where: { id: sessionId },
        data: updateData,
      });

      // Save detailed state to assessment data
      if (state.answers || state.timeSpent || state.resumeData) {
        const currentData = session.assessmentData || {};
        const updatedData = {
          ...currentData,
          ...(state.answers && { answers: state.answers }),
          ...(state.timeSpent && { timeSpent: state.timeSpent }),
          ...(state.resumeData && { resumeData: state.resumeData }),
          lastSaved: new Date().toISOString(),
        };

        await prisma.session.update({
          where: { id: sessionId },
          data: { assessmentData: updatedData },
        });
      }

      console.log(`💾 Session state saved for ${sessionId}`);
    } catch (error) {
      console.error(`❌ Failed to save session state for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Load complete session state
   */
  static async loadSessionState(sessionId: string): Promise<SessionState | null> {
    try {
      const session = await SessionModel.findWithResults(sessionId);
      if (!session) {
        return null;
      }

      const assessmentData = session.assessmentData || {};
      const answers = assessmentData.answers || {};
      const timeSpent = assessmentData.timeSpent || {};
      const resumeData = assessmentData.resumeData || {};

      // Calculate if session is resumable
      const isResumable = this.isSessionResumable(session);

      return {
        sessionId: session.id,
        currentQuestion: session.currentQuestion,
        progress: session.progress,
        answers,
        timeSpent,
        lastActivity: session.updatedAt,
        isResumable,
        resumeData,
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
    if (session.status !== 'ACTIVE') {
      return false;
    }

    // Session must not be expired
    if (session.expiresAt && session.expiresAt < new Date()) {
      return false;
    }

    // Session must have some progress
    if (session.progress <= 0) {
      return false;
    }

    // Session must not be completed
    if (session.progress >= 100) {
      return false;
    }

    return true;
  }

  /**
   * Get resume point for a session
   */
  static async getResumePoint(sessionId: string): Promise<ResumePoint | null> {
    try {
      const session = await SessionModel.findById(sessionId);
      if (!session) {
        return null;
      }

      const canResume = this.isSessionResumable(session);
      if (!canResume) {
        return {
          questionNumber: 1,
          progress: 0,
          lastAnswer: null,
          timeSpent: 0,
          canResume: false,
        };
      }

      const assessmentData = session.assessmentData || {};
      const answers = assessmentData.answers || {};
      const timeSpent = assessmentData.timeSpent || {};

      // Find the last answered question
      let lastAnsweredQuestion = 1;
      let lastAnswer = null;
      let totalTimeSpent = 0;

      // Since we don't store totalQuestions, we'll iterate through existing answers
      const questionNumbers = Object.keys(answers).map(key => parseInt(key.replace('question_', ''))).filter(n => !isNaN(n));
      if (questionNumbers.length > 0) {
        lastAnsweredQuestion = Math.max(...questionNumbers);
        lastAnswer = answers[`question_${lastAnsweredQuestion}`];
      }

      // Calculate total time spent from existing data
      totalTimeSpent = Object.values(timeSpent).reduce((sum: number, time: any) => sum + (time || 0), 0);

      return {
        questionNumber: lastAnsweredQuestion + 1, // Resume at next unanswered question
        lastAnswer,
        timeSpent: totalTimeSpent,
        canResume: true,
      };
    } catch (error) {
      console.error(`❌ Failed to get resume point for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Save answer for a specific question
   */
  static async saveAnswer(
    sessionId: string,
    questionNumber: number,
    answer: any,
    timeSpent: number = 0
  ): Promise<void> {
    try {
      const session = await SessionModel.findById(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const currentData = session.assessmentData || {};
      const answers = currentData.answers || {};
      const timeSpentData = currentData.timeSpent || {};

      // Save answer and time spent
      answers[`question_${questionNumber}`] = answer;
      timeSpentData[`question_${questionNumber}`] = timeSpent;

      // Update session with answer data
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          assessmentData: {
            ...currentData,
            answers,
            timeSpent: timeSpentData,
            lastSaved: new Date().toISOString(),
          },
          updatedAt: new Date(),
        },
      });

      console.log(`💾 Answer saved for question ${questionNumber} in session ${sessionId}`);
    } catch (error) {
      console.error(`❌ Failed to save answer for question ${questionNumber} in session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Auto-save session state at regular intervals
   */
  static async autoSaveSession(sessionId: string): Promise<void> {
    try {
      const session = await SessionModel.findById(sessionId);
      if (!session || session.status !== 'ACTIVE') {
        return;
      }

      // Only auto-save if there are unsaved changes
      const lastSaved = session.assessmentData?.lastSaved;
      const lastUpdated = session.updatedAt;
      
      if (lastSaved && new Date(lastSaved) >= lastUpdated) {
        return; // No changes to save
      }

      await this.saveSessionState(sessionId, {
        lastActivity: new Date(),
      });

      console.log(`🔄 Auto-saved session ${sessionId}`);
    } catch (error) {
      console.error(`❌ Auto-save failed for session ${sessionId}:`, error);
      // Don't throw error for auto-save failures
    }
  }

  /**
   * Create session checkpoint for resumption
   */
  static async createCheckpoint(sessionId: string): Promise<void> {
    try {
      const session = await SessionModel.findById(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const currentData = session.assessmentData || {};
      const checkpointData = {
        ...currentData,
        checkpoint: {
          timestamp: new Date().toISOString(),
          currentQuestion: session.currentQuestion,
          progress: session.progress,
          answers: currentData.answers || {},
          timeSpent: currentData.timeSpent || {},
        },
      };

      await prisma.session.update({
        where: { id: sessionId },
        data: {
          assessmentData: checkpointData,
          updatedAt: new Date(),
        },
      });

      console.log(`📍 Checkpoint created for session ${sessionId}`);
    } catch (error) {
      console.error(`❌ Failed to create checkpoint for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Restore session from checkpoint
   */
  static async restoreFromCheckpoint(sessionId: string): Promise<SessionState | null> {
    try {
      const session = await SessionModel.findById(sessionId);
      if (!session) {
        return null;
      }

      const assessmentData = session.assessmentData || {};
      const checkpoint = assessmentData.checkpoint;

      if (!checkpoint) {
        return null; // No checkpoint available
      }

      // Restore session to checkpoint state
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          currentQuestion: checkpoint.currentQuestion,
          progress: checkpoint.progress,
          assessmentData: {
            ...assessmentData,
            answers: checkpoint.answers,
            timeSpent: checkpoint.timeSpent,
            restoredFromCheckpoint: new Date().toISOString(),
          },
          updatedAt: new Date(),
        },
      });

      console.log(`🔄 Session ${sessionId} restored from checkpoint`);

      // Return restored state
      return this.loadSessionState(sessionId);
    } catch (error) {
      console.error(`❌ Failed to restore session ${sessionId} from checkpoint:`, error);
      throw error;
    }
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
      const assessmentData = session.assessmentData || {};
      const hasCheckpoint = !!assessmentData.checkpoint;
      const resumePoint = await this.getResumePoint(sessionId);

      return {
        canResume,
        canRestore: hasCheckpoint,
        lastCheckpoint: assessmentData.checkpoint?.timestamp || null,
        resumePoint,
      };
    } catch (error) {
      console.error(`❌ Failed to get recovery options for session ${sessionId}:`, error);
      throw error;
    }
  }
}

// Export the service class
export default SessionPersistenceService;
