import { LearnosityService } from './learnosity'

// Mock the learnosity-sdk-nodejs
jest.mock('learnosity-sdk-nodejs', () => {
  return jest.fn().mockImplementation(() => ({
    init: jest.fn().mockReturnValue({
      security: {
        consumer_key: 'test-key',
        domain: 'localhost',
        signature: 'test-signature',
        timestamp: '20240101000000',
      },
      request: {
        user_id: 'test-user',
        session_id: 'test-session',
        activity_template_id: 'test-activity',
      },
    }),
  }))
})

// Mock the config
jest.mock('./config', () => ({
  learnosityConfig: {
    consumerKey: 'test-consumer-key',
    consumerSecret: 'test-consumer-secret',
    domain: 'items-va.learnosity.com',
    activityId: 'test-activity-id',
  },
  testSessionConfig: {
    learnosityExpiresMinutes: 30,
  },
}))

// Mock the learnosity-config-service
jest.mock('./learnosity-config-service', () => ({
  learnosityConfigService: {
    getEffectiveConfig: jest.fn().mockResolvedValue({
      endpoint: 'items-ie.learnosity.com',
      expiresMinutes: 60,
    }),
  },
}))

describe('LearnosityService', () => {
  describe('Domain Separation', () => {
    it('should use localhost for security domain', () => {
      const service = new LearnosityService({
        domain: 'items-ie.learnosity.com',
        expiresMinutes: 60,
      })

      expect(service.getDomain()).toBe('localhost')
    })

    it('should use configured endpoint for API endpoint', () => {
      const service = new LearnosityService({
        domain: 'items-ie.learnosity.com',
        expiresMinutes: 60,
      })

      expect(service.getApiEndpoint()).toBe('items-ie.learnosity.com')
    })

    it('should fallback to config domain when no custom domain provided', () => {
      const service = new LearnosityService()

      expect(service.getApiEndpoint()).toBe('items-va.learnosity.com')
    })
  })

  describe('createWithCurrentConfig', () => {
    it('should create service with effective config from database', async () => {
      const service = await LearnosityService.createWithCurrentConfig()

      expect(service.getDomain()).toBe('localhost')
      expect(service.getApiEndpoint()).toBe('items-ie.learnosity.com')
    })
  })

  describe('isConfigured', () => {
    it('should return true when properly configured', () => {
      const service = new LearnosityService({
        domain: 'items-ie.learnosity.com',
        expiresMinutes: 60,
      })

      expect(service.isConfigured()).toBe(true)
    })

    it('should return false when API endpoint is missing', () => {
      const service = new LearnosityService({
        domain: '',
        expiresMinutes: 60,
      })

      // The service will fallback to the config domain, so we need to test with invalid domain
      const serviceWithInvalidDomain = new LearnosityService({
        domain: 'your_domain_here',
        expiresMinutes: 60,
      })

      expect(serviceWithInvalidDomain.isConfigured()).toBe(false)
    })
  })

  describe('Security Configuration', () => {
    it('should use localhost in security signatures', () => {
      const service = new LearnosityService({
        domain: 'items-ie.learnosity.com',
        expiresMinutes: 60,
      })

      const securityConfig = service.generateSecurityConfig('test-session-id')
      
      // The security config should contain localhost as domain
      expect(securityConfig).toHaveProperty('domain', 'localhost')
    })
  })
})
