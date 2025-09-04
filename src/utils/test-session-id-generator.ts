import { v4 as uuidv4 } from "uuid";

/**
 * Generate a unique test session ID using UUIDv4
 * This follows Learnosity's best practices for session identification
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (36 characters)
 */
export function generateTestSessionId(): string {
  return uuidv4();
}

/**
 * Generate a unique test session ID using UUIDv4
 * This is the recommended approach for Learnosity integrations
 */
export function generateUniqueTestSessionId(): string {
  return uuidv4();
}

/**
 * Generate a Learnosity-compatible session ID using UUIDv4
 * Learnosity strongly recommends using UUIDv4 for session_id
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (36 characters)
 */
export function generateLearnositySessionId(): string {
  return uuidv4();
}

/**
 * Validate if a test session ID follows the expected format
 */
export function validateTestSessionIdFormat(testSessionId: string): boolean {
  // Check if it's a valid UUIDv4 format
  const uuidv4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (uuidv4Regex.test(testSessionId)) {
    return true;
  }

  // For backward compatibility, also accept the old timestamp format
  if (/^\d{14}$/.test(testSessionId)) {
    return true;
  }

  if (/^\d{18}$/.test(testSessionId)) {
    return true;
  }

  return false;
}
