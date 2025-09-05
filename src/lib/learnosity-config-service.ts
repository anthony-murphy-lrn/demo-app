import { prisma } from "./database";
import { learnosityConfig, testSessionConfig } from "./config";

export interface LearnosityConfigData {
  id: string;
  endpoint: string;
  expiresMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLearnosityConfigData {
  endpoint: string;
  expiresMinutes: number;
}

export interface DefaultLearnosityConfig {
  endpoint: string;
  expiresMinutes: number;
}

export class LearnosityConfigService {
  /**
   * Get the current Learnosity configuration from the database
   * Returns the most recent configuration or null if none exists
   */
  async getConfig(): Promise<LearnosityConfigData | null> {
    try {
      const config = await prisma.learnosityConfig.findFirst({
        orderBy: {
          createdAt: "desc",
        },
      });

      return config;
    } catch (error) {
      console.error("LearnosityConfigService - getConfig error:", error);
      throw new Error("Failed to retrieve Learnosity configuration");
    }
  }

  /**
   * Save a new Learnosity configuration to the database
   * This will create a new configuration record
   */
  async saveConfig(
    data: CreateLearnosityConfigData
  ): Promise<LearnosityConfigData> {
    try {
      const config = await prisma.learnosityConfig.create({
        data: {
          endpoint: data.endpoint,
          expiresMinutes: data.expiresMinutes,
        },
      });

      return config;
    } catch (error) {
      console.error("LearnosityConfigService - saveConfig error:", error);
      throw new Error("Failed to save Learnosity configuration");
    }
  }

  /**
   * Get the default Learnosity configuration from environment variables
   * This is used as fallback when no configuration is saved in the database
   */
  getDefaultConfig(): DefaultLearnosityConfig {
    return {
      endpoint: learnosityConfig.domain,
      expiresMinutes: testSessionConfig.learnosityExpiresMinutes,
    };
  }

  /**
   * Get the effective configuration (database config or default)
   * This is the main method to use when you need the current configuration
   */
  async getEffectiveConfig(): Promise<DefaultLearnosityConfig> {
    try {
      const dbConfig = await this.getConfig();

      if (dbConfig) {
        return {
          endpoint: dbConfig.endpoint,
          expiresMinutes: dbConfig.expiresMinutes,
        };
      }

      // Fallback to default configuration
      return this.getDefaultConfig();
    } catch (error) {
      console.error(
        "LearnosityConfigService - getEffectiveConfig error:",
        error
      );
      // Return default configuration as fallback
      return this.getDefaultConfig();
    }
  }

  /**
   * Check if there is any configuration saved in the database
   */
  async hasConfig(): Promise<boolean> {
    try {
      const count = await prisma.learnosityConfig.count();
      return count > 0;
    } catch (error) {
      console.error("LearnosityConfigService - hasConfig error:", error);
      return false;
    }
  }

  /**
   * Clear all configuration records from the database
   * This will reset to using default environment variables
   */
  async clearConfig(): Promise<void> {
    try {
      await prisma.learnosityConfig.deleteMany();
    } catch (error) {
      console.error("LearnosityConfigService - clearConfig error:", error);
      throw new Error("Failed to clear Learnosity configuration");
    }
  }
}

// Export a singleton instance
export const learnosityConfigService = new LearnosityConfigService();
