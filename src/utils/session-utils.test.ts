import {
  calculateSessionStatus,
  canResumeSession,
  calculateTimeRemaining,
  createSessionDisplayInfo,
} from './session-utils'

describe('session-utils', () => {
  describe('calculateSessionStatus', () => {
    it('should return "active" for sessions without expiration', () => {
      const session = {
        id: '1',
        studentId: 'student-1',
        assessmentId: 'assessment-1',
        learnositySessionId: 'learnosity-1',
        createdAt: new Date(),
        expiresAt: undefined,
        results: [],
      }

      expect(calculateSessionStatus(session)).toBe('active')
    })

    it('should return "active" for sessions with future expiration', () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 1)

      const session = {
        id: '1',
        studentId: 'student-1',
        assessmentId: 'assessment-1',
        learnositySessionId: 'learnosity-1',
        createdAt: new Date(),
        expiresAt: futureDate,
        results: [],
      }

      expect(calculateSessionStatus(session)).toBe('active')
    })

    it('should return "expired" for sessions with past expiration', () => {
      const pastDate = new Date()
      pastDate.setHours(pastDate.getHours() - 1)

      const session = {
        id: '1',
        studentId: 'student-1',
        assessmentId: 'assessment-1',
        learnositySessionId: 'learnosity-1',
        createdAt: new Date(),
        expiresAt: pastDate,
        results: [],
      }

      expect(calculateSessionStatus(session)).toBe('expired')
    })
  })

  describe('canResumeSession', () => {
    it('should return true for active sessions', () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 1)

      const session = {
        id: '1',
        studentId: 'student-1',
        assessmentId: 'assessment-1',
        learnositySessionId: 'learnosity-1',
        createdAt: new Date(),
        expiresAt: futureDate,
        results: [],
        status: 'active' as const,
      }

      expect(canResumeSession(session)).toBe(true)
    })

    it('should return false for expired sessions', () => {
      const session = {
        id: '1',
        studentId: 'student-1',
        assessmentId: 'assessment-1',
        learnositySessionId: 'learnosity-1',
        createdAt: new Date(),
        expiresAt: new Date(),
        results: [],
        status: 'expired' as const,
      }

      expect(canResumeSession(session)).toBe(false)
    })
  })

  describe('calculateTimeRemaining', () => {
    it('should calculate time remaining correctly', () => {
      const now = new Date()
      const futureDate = new Date(now.getTime() + (2 * 60 + 30) * 60 * 1000) // 2h 30m from now

      const session = {
        id: '1',
        studentId: 'student-1',
        assessmentId: 'assessment-1',
        learnositySessionId: 'learnosity-1',
        createdAt: now,
        expiresAt: futureDate,
        results: [],
      }

      const result = calculateTimeRemaining(session)
      expect(result.hours).toBe(2)
      expect(result.minutes).toBe(30)
      expect(result.isExpired).toBe(false)
      expect(result.displayText).toMatch(/2h 30m/)
    })

    it('should handle expired sessions', () => {
      const pastDate = new Date()
      pastDate.setHours(pastDate.getHours() - 1)

      const session = {
        id: '1',
        studentId: 'student-1',
        assessmentId: 'assessment-1',
        learnositySessionId: 'learnosity-1',
        createdAt: new Date(),
        expiresAt: pastDate,
        results: [],
      }

      const result = calculateTimeRemaining(session)
      expect(result.hours).toBe(0)
      expect(result.minutes).toBe(0)
      expect(result.isExpired).toBe(true)
      expect(result.displayText).toBe('Expired')
    })
  })

  describe('createSessionDisplayInfo', () => {
    it('should return correct display info for active session', () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 1)

      const session = {
        id: '1',
        studentId: 'student-1',
        assessmentId: 'assessment-1',
        learnositySessionId: 'learnosity-1',
        createdAt: new Date(),
        expiresAt: futureDate,
        results: [],
        status: 'active' as const,
      }

      const result = createSessionDisplayInfo(session)
      expect(result.status).toBe('active')
      expect(result.canResume).toBe(true)
      expect(result.timeRemaining).toBeDefined()
    })

    it('should return correct display info for expired session', () => {
      const pastDate = new Date()
      pastDate.setHours(pastDate.getHours() - 1)

      const session = {
        id: '1',
        studentId: 'student-1',
        assessmentId: 'assessment-1',
        learnositySessionId: 'learnosity-1',
        createdAt: new Date(),
        expiresAt: pastDate,
        results: [],
        status: 'expired' as const,
      }

      const result = createSessionDisplayInfo(session)
      expect(result.status).toBe('expired')
      expect(result.canResume).toBe(false)
      expect(result.timeRemaining).toBe('Expired')
    })
  })
})
