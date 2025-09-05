import Learnosity from "learnosity-sdk-nodejs";
import { learnosityConfig, testSessionConfig } from "./config";
import { learnosityConfigService } from "./learnosity-config-service";
import { LearnositySessionConfig, LearnosityResponse } from "@/types";

// Learnosity API integration utilities using official SDK
export class LearnosityService {
  private consumerKey: string;
  private consumerSecret: string;
  private domain: string;
  private expiresMinutes: number;
  private learnosity: any;

  constructor(customConfig?: { domain?: string; expiresMinutes?: number }) {
    this.consumerKey = learnosityConfig.consumerKey;
    this.consumerSecret = learnosityConfig.consumerSecret;
    this.domain = customConfig?.domain || learnosityConfig.domain;
    this.expiresMinutes =
      customConfig?.expiresMinutes ||
      testSessionConfig.learnosityExpiresMinutes;

    // Initialize Learnosity SDK
    this.learnosity = new Learnosity();
  }

  // Initialize Learnosity session for assessment delivery
  async initializeSession(
    userId: string,
    sessionId: string,
    activityId: string
  ): Promise<LearnositySessionConfig> {
    try {
      // Use the SDK to generate a session request
      const result = this.learnosity.init(
        "items", // API type
        {
          consumer_key: this.consumerKey,
          domain: this.domain,
        },
        this.consumerSecret, // Consumer secret
        {
          user_id: userId,
          session_id: sessionId,
          activity_id: activityId,
        }
      );

      // The SDK returns { security: {...}, request: {...} }
      // We need to combine them for the session config
      return {
        ...result.security,
        ...result.request,
      };
    } catch (error) {
      console.error("LearnosityService - initializeSession error:", error);
      throw error;
    }
  }

  // Generate security configuration for media assets
  generateSecurityConfig(sessionId: string): Record<string, any> {
    try {
      const expiresAt = new Date(
        Date.now() + this.expiresMinutes * 60 * 1000
      ).toISOString();

      // Use the SDK to generate a security request
      const result = this.learnosity.init(
        "security", // API type
        {
          consumer_key: this.consumerKey,
          domain: learnosityConfig.domain, // Use the original domain for security, not the endpoint
        },
        this.consumerSecret, // Consumer secret
        {
          session_id: sessionId,
          expires_at: expiresAt,
        }
      );

      // The SDK returns { security: {...}, request: {...} }
      // For security config, we want the security part
      return result.security || result;
    } catch (error) {
      console.error("LearnosityService - generateSecurityConfig error:", error);
      throw error;
    }
  }

  // Validate Learnosity response signature
  validateResponse(_response: LearnosityResponse): boolean {
    try {
      // For now, return true as we're not implementing signature validation
      // This can be implemented later when needed
      return true;
    } catch (error) {
      console.error("Error validating Learnosity response:", error);
      return false;
    }
  }

  // Generate Items API configuration
  generateItemsConfig(
    userId: string,
    sessionId: string,
    activityId: string
  ): Record<string, any> {
    try {
      // Get formatted expires time
      const expiresFormatted = this.formatExpiresTime();

      // Use the SDK to generate an items config request
      const result = this.learnosity.init(
        "items", // API type
        {
          consumer_key: this.consumerKey,
          domain: this.domain,
          expires: expiresFormatted, // Add expires parameter to security object
        },
        this.consumerSecret, // Consumer secret
        {
          user_id: userId,
          session_id: sessionId,
          activity_id: activityId, // This is for reporting/comparison
          rendering_type: "assess",
          type: "submit_practice",
          name: "Items API Quickstart",
          state: "initial",
          config: {
            regions: "main",
            navigation: {
              show_intro: true,
              show_outro: true,
              skip_submit_confirmation: false,
              warning_on_change: false,
              auto_save: {
                save_interval_duration: 500,
              },
            },
            annotations: true,
            time: {
              max_time: 1500,
              limit_type: "soft",
              warning_time: 120,
            },
            configuration: {
              shuffle_items: false,
              idle_timeout: {
                interval: 300,
                countdown_time: 60,
              },
            },
          },
        }
      );

      // The SDK returns { security: {...}, request: {...} }
      // Return the correct structure that Learnosity expects
      return {
        security: result.security,
        request: result.request,
      };
    } catch (error) {
      console.error("LearnosityService - generateItemsConfig error:", error);
      throw error;
    }
  }

  // Generate Items API request using SDK
  generateItemsRequest(
    userId: string,
    sessionId: string,
    activityId: string
  ): Record<string, any> {
    try {
      // Get formatted expires time
      const expiresFormatted = this.formatExpiresTime();

      // Use the correct SDK init() method with 4 parameters
      const result = this.learnosity.init(
        "items", // API type
        {
          consumer_key: this.consumerKey,
          domain: learnosityConfig.domain, // Use the original domain for security, not the endpoint
          expires: expiresFormatted, // Add expires parameter to security object
        },
        this.consumerSecret, // Consumer secret
        {
          user_id: userId,
          session_id: sessionId,
          activity_template_id: activityId, // This is what Learnosity needs to load the assessment
          activity_id: activityId, // This is for reporting/comparison
          rendering_type: "assess",
          type: "submit_practice",
          name: "Items API Quickstart",
          state: "initial",
          config: {
            regions: "main",
            navigation: {
              show_intro: true,
              show_outro: true,
              show_submit: true,
              show_next: true,
              show_previous: true,
              skip_submit_confirmation: false,
              warning_on_change: false,
              auto_save: {
                save_interval_duration: 500,
              },
            },
            annotations: true,
            time: {
              max_time: 1500,
              limit_type: "soft",
              warning_time: 120,
            },
            configuration: {
              shuffle_items: false,
              idle_timeout: {
                interval: 300,
                countdown_time: 60,
              },
            },
          },
        }
      );

      // The SDK returns { security: {...}, request: {...} }
      // Return the correct structure that Learnosity expects
      return {
        security: result.security,
        request: result.request,
      };
    } catch (error) {
      console.error("LearnosityService - generateItemsRequest error:", error);
      throw error;
    }
  }

  // Generate Data API request using SDK
  generateDataRequest(
    userId: string,
    sessionId: string,
    activityId: string
  ): Record<string, any> {
    try {
      // Get formatted expires time
      const expiresFormatted = this.formatExpiresTime();

      // Use the correct SDK init() method with 4 parameters
      const result = this.learnosity.init(
        "data", // API type
        {
          consumer_key: this.consumerKey,
          domain: this.domain,
          expires: expiresFormatted, // Add expires parameter to security object
        },
        this.consumerSecret, // Consumer secret
        {
          user_id: userId,
          session_id: sessionId,
          activity_id: activityId,
        }
      );

      // The SDK returns { security: {...}, request: {...} }
      // Return the correct structure that Learnosity expects
      return {
        security: result.security,
        request: result.request,
      };
    } catch (error) {
      console.error("LearnosityService - generateDataRequest error:", error);
      throw error;
    }
  }

  // Helper method to format expires time in Learnosity format (YYYYMMDD-HHMM)
  private formatExpiresTime(): string {
    const expiresDate = new Date(Date.now() + this.expiresMinutes * 60 * 1000);
    return expiresDate
      .toISOString()
      .slice(0, 16)
      .replace(/[-T:]/g, "")
      .replace(/(\d{8})(\d{4})/, "$1-$2");
  }

  // Check if Learnosity credentials are configured
  isConfigured(): boolean {
    return !!(
      this.consumerKey &&
      this.consumerSecret &&
      this.domain &&
      this.consumerKey !== "your_consumer_key_here" &&
      this.consumerSecret !== "your_consumer_secret_here" &&
      this.domain !== "your_domain_here"
    );
  }

  // Get Learnosity domain for client-side integration
  getDomain(): string {
    return this.domain;
  }

  // Get SDK instance for advanced usage
  getSDK(): any {
    return this.learnosity;
  }

  // Static method to create LearnosityService with current configuration
  static async createWithCurrentConfig(): Promise<LearnosityService> {
    try {
      const effectiveConfig =
        await learnosityConfigService.getEffectiveConfig();
      return new LearnosityService({
        domain: effectiveConfig.endpoint,
        expiresMinutes: effectiveConfig.expiresMinutes,
      });
    } catch (error) {
      console.error(
        "Error loading Learnosity configuration, using defaults:",
        error
      );
      // Fallback to default configuration
      return new LearnosityService();
    }
  }
}

// Export singleton instance
export const learnosityService = new LearnosityService();
