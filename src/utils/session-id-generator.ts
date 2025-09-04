import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique session ID using UUIDv4
 * This follows Learnosity's best practices for session identification
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (36 characters)
 */
export function generateSessionId(): string {
  return uuidv4();
}

/**
 * Generate a unique session ID using UUIDv4
 * This is the recommended approach for Learnosity integrations
 */
export function generateUniqueSessionId(): string {
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
 * Validate if a session ID follows the expected format
 */
export function validateSessionIdFormat(sessionId: string): boolean {
  // Check if it's a valid UUIDv4 format
  const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (uuidv4Regex.test(sessionId)) {
    return true;
  }
  
  // For backward compatibility, also accept the old timestamp format
  if (/^\d{14}$/.test(sessionId)) {
    return true;
  }
  
  if (/^\d{18}$/.test(sessionId)) {
    return true;
  }
  
  return false;
}

/**
 * Extract timestamp from a session ID
 * Note: UUIDv4 doesn't contain timestamp information
 * This function is kept for backward compatibility with old timestamp-based IDs
 */
export function extractTimestampFromSessionId(sessionId: string): Date | null {
  try {
    // Check if it's a UUIDv4 format
    const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (uuidv4Regex.test(sessionId)) {
      // UUIDv4 doesn't contain timestamp information
      // Return null to indicate no timestamp available
      return null;
    }
    
    // For backward compatibility, extract timestamp from old format
    const timestampStr = sessionId.replace(/\D/g, '').substring(0, 14);
    
    if (timestampStr.length !== 14) {
      return null;
    }
    
    const year = parseInt(timestampStr.substring(0, 4));
    const month = parseInt(timestampStr.substring(4, 6)) - 1; // Month is 0-indexed
    const day = parseInt(timestampStr.substring(6, 8));
    const hours = parseInt(timestampStr.substring(8, 10));
    const minutes = parseInt(timestampStr.substring(10, 12));
    const seconds = parseInt(timestampStr.substring(12, 14));
    
    return new Date(year, month, day, hours, minutes, seconds);
  } catch (error) {
    return null;
  }
}
