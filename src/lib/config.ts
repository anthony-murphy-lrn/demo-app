import { z } from "zod";

// Environment variable schema
const envSchema = z.object({
  // Database Configuration
  DATABASE_URL: z.string().default("file:./dev.db"),

  // Learnosity Configuration
  LEARNOSITY_CONSUMER_KEY: z
    .string()
    .min(1, "Learnosity consumer key is required"),
  LEARNOSITY_CONSUMER_SECRET: z
    .string()
    .min(1, "Learnosity consumer secret is required"),
  LEARNOSITY_DOMAIN: z.string().min(1, "Learnosity domain is required"),
  LEARNOSITY_ACTIVITY_ID: z
    .string()
    .min(1, "Learnosity activity ID is required")
    .default("quickstart_examples_activity_template_001"),

  // Application Configuration
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform(Number).default(3000),

  // Session Configuration
  SESSION_TIMEOUT_MINUTES: z.string().transform(Number).default(60),
  CLEANUP_INTERVAL_MINUTES: z.string().transform(Number).default(30),

  // Learnosity Configuration
  LEARNOSITY_EXPIRES_MINUTES: z.string().transform(Number).default(30),
});

// Parse and validate environment variables
export const config = envSchema.parse(process.env);

// Database configuration
export const databaseConfig = {
  url: config.DATABASE_URL,
  provider: "sqlite" as const,
};

// Session configuration
export const sessionConfig = {
  timeoutMinutes: config.SESSION_TIMEOUT_MINUTES,
  cleanupIntervalMinutes: config.CLEANUP_INTERVAL_MINUTES,
  learnosityExpiresMinutes: config.LEARNOSITY_EXPIRES_MINUTES,
};

// Learnosity configuration
export const learnosityConfig = {
  consumerKey: config.LEARNOSITY_CONSUMER_KEY,
  consumerSecret: config.LEARNOSITY_CONSUMER_SECRET,
  domain: config.LEARNOSITY_DOMAIN,
  activityId: config.LEARNOSITY_ACTIVITY_ID,
};

// Application configuration
export const appConfig = {
  nodeEnv: config.NODE_ENV,
  port: config.PORT,
  isDevelopment: config.NODE_ENV === "development",
  isProduction: config.NODE_ENV === "production",
  isTest: config.NODE_ENV === "test",
};
