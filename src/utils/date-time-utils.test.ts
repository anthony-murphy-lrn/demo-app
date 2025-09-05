import {
  formatDateTime,
  formatDateOnly,
  formatTimeOnly,
  formatRelativeTime,
  formatSmartDateTime,
} from './date-time-utils'

describe('date-time-utils', () => {
  const testDate = new Date('2024-01-15T14:30:00Z')

  describe('formatDateOnly', () => {
    it('should format date correctly', () => {
      const result = formatDateOnly(testDate)
      expect(result).toMatch(/Jan 15, 2024/)
    })

    it('should handle string dates', () => {
      const result = formatDateOnly('2024-01-15T14:30:00Z')
      expect(result).toMatch(/Jan 15, 2024/)
    })
  })

  describe('formatTimeOnly', () => {
    it('should format time correctly', () => {
      const result = formatTimeOnly(testDate)
      expect(result).toMatch(/2:30/)
    })

    it('should handle string dates', () => {
      const result = formatTimeOnly('2024-01-15T14:30:00Z')
      expect(result).toMatch(/2:30/)
    })
  })

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      const result = formatDateTime(testDate)
      expect(result).toMatch(/Jan 15, 2024.*2:30/)
    })

    it('should handle string dates', () => {
      const result = formatDateTime('2024-01-15T14:30:00Z')
      expect(result).toMatch(/Jan 15, 2024.*2:30/)
    })
  })

  describe('formatSmartDateTime', () => {
    it('should format recent times correctly', () => {
      const recentDate = new Date()
      recentDate.setMinutes(recentDate.getMinutes() - 5)

      const result = formatSmartDateTime(recentDate)
      expect(result).toMatch(/Today at/)
    })

    it('should format future times correctly', () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 2)

      const result = formatSmartDateTime(futureDate)
      expect(result).toMatch(/Today at/)
    })
  })

  describe('formatRelativeTime', () => {
    it('should format recent times correctly', () => {
      const recentDate = new Date()
      recentDate.setMinutes(recentDate.getMinutes() - 5)

      const result = formatRelativeTime(recentDate)
      expect(result).toMatch(/ago/)
    })

    it('should format future times correctly', () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 2)

      const result = formatRelativeTime(futureDate)
      expect(result).toMatch(/in/)
    })
  })
})
