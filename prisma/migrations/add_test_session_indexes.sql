-- Migration: Add indexes for efficient test session pagination
-- This migration adds database indexes to optimize test session queries

-- Index for efficient pagination by student ID and creation date
-- This index supports the main query pattern: WHERE studentId = ? ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS "idx_test_session_student_created" 
ON "TestSession" ("studentId", "createdAt" DESC);

-- Index for efficient counting by student ID
-- This index supports the count query: WHERE studentId = ?
CREATE INDEX IF NOT EXISTS "idx_test_session_student_id" 
ON "TestSession" ("studentId");

-- Index for efficient session expiration queries
-- This index supports queries filtering by expiration date
CREATE INDEX IF NOT EXISTS "idx_test_session_expires_at" 
ON "TestSession" ("expiresAt");

-- Composite index for complex queries involving student ID and expiration
-- This index supports queries like: WHERE studentId = ? AND expiresAt > ?
CREATE INDEX IF NOT EXISTS "idx_test_session_student_expires" 
ON "TestSession" ("studentId", "expiresAt");

-- Index for Learnosity session ID lookups (for resume functionality)
-- This index supports queries: WHERE learnositySessionId = ?
CREATE INDEX IF NOT EXISTS "idx_test_session_learnosity_id" 
ON "TestSession" ("learnositySessionId");

-- Index for assessment ID queries (if needed for reporting)
-- This index supports queries: WHERE assessmentId = ?
CREATE INDEX IF NOT EXISTS "idx_test_session_assessment_id" 
ON "TestSession" ("assessmentId");

-- Note: These indexes will improve query performance for:
-- 1. Pagination queries (main use case)
-- 2. Session counting by student
-- 3. Expiration-based filtering
-- 4. Resume functionality lookups
-- 5. Assessment-based reporting

-- Performance impact:
-- - Slightly increased storage usage
-- - Slightly slower INSERT/UPDATE operations
-- - Significantly faster SELECT operations for pagination
-- - Better overall user experience for session management
