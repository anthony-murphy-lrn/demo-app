import { NextRequest, NextResponse } from 'next/server';
import SessionPersistenceService from '../../../../lib/session-persistence';
import SessionService from '../../../../lib/session-service';

export async function GET(request: NextRequest) {
  try {
    // Test session persistence service
    const activeSessions = await SessionService.getActiveSessions();
    
    if (activeSessions.length === 0) {
      return NextResponse.json({
        status: 'info',
        message: 'No active sessions to test persistence',
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
      status: 'success',
      message: 'Session persistence service is working correctly',
      timestamp: new Date().toISOString(),
      testSession: {
        id: testSession.id,
        studentId: testSession.studentId,
        currentQuestion: testSession.currentQuestion,
        progress: testSession.progress,
      },
      sessionState,
      recoveryOptions,
      testResults: {
        sessionPersistence: '✅ Working',
        loadSessionState: '✅ Working',
        getRecoveryOptions: '✅ Working',
      }
    });
    
  } catch (error) {
    console.error('Session persistence test failed:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Session persistence test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
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
      case 'saveAnswer':
        // Save an answer for a question
        await SessionPersistenceService.saveAnswer(
          data.sessionId,
          data.questionNumber,
          data.answer,
          data.timeSpent || 30
        );
        
        return NextResponse.json({
          status: 'success',
          message: 'Answer saved successfully',
          questionNumber: data.questionNumber,
        });
        
      case 'createCheckpoint':
        // Create a checkpoint for the session
        await SessionPersistenceService.createCheckpoint(data.sessionId);
        
        return NextResponse.json({
          status: 'success',
          message: 'Checkpoint created successfully',
        });
        
      case 'getResumePoint':
        // Get resume point for the session
        const resumePoint = await SessionPersistenceService.getResumePoint(data.sessionId);
        
        return NextResponse.json({
          status: 'success',
          message: 'Resume point retrieved successfully',
          resumePoint,
        });
        
      case 'restoreFromCheckpoint':
        // Restore session from checkpoint
        const restoredState = await SessionPersistenceService.restoreFromCheckpoint(data.sessionId);
        
        return NextResponse.json({
          status: 'success',
          message: 'Session restored from checkpoint successfully',
          restoredState,
        });
        
      case 'autoSave':
        // Trigger auto-save for the session
        await SessionPersistenceService.autoSaveSession(data.sessionId);
        
        return NextResponse.json({
          status: 'success',
          message: 'Auto-save completed successfully',
        });
        
      case 'testFullFlow':
        // Test the complete persistence flow
        const sessionId = data.sessionId;
        
        // 1. Save some answers
        await SessionPersistenceService.saveAnswer(sessionId, 1, { answer: 'A' }, 45);
        await SessionPersistenceService.saveAnswer(sessionId, 2, { answer: 'B' }, 30);
        await SessionPersistenceService.saveAnswer(sessionId, 3, { answer: 'C' }, 60);
        
        // 2. Create a checkpoint
        await SessionPersistenceService.createCheckpoint(sessionId);
        
        // 3. Get recovery options
        const recoveryOptions = await SessionPersistenceService.getRecoveryOptions(sessionId);
        
        // 4. Get resume point
        const finalResumePoint = await SessionPersistenceService.getResumePoint(sessionId);
        
        return NextResponse.json({
          status: 'success',
          message: 'Full persistence flow test completed successfully',
          testResults: {
            answersSaved: 3,
            checkpointCreated: true,
            recoveryOptions,
            resumePoint: finalResumePoint,
          }
        });
        
      default:
        return NextResponse.json(
          { status: 'error', message: 'Invalid action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Session persistence test operation failed:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Session persistence test operation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
