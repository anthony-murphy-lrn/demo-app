# Resume Functionality Testing Guide

## Overview
This guide outlines how to test the resume functionality with Learnosity Items API in the assessment delivery demo.

## Prerequisites
1. Learnosity configuration must be properly set up
2. Database must be seeded with test data
3. Application must be running in development mode

## Test Scenarios

### 1. Basic Resume Flow
**Steps:**
1. Start a new assessment session
2. Answer a few questions (don't complete)
3. Navigate away or close the browser
4. Return to the homepage
5. Enter the same student ID
6. Click "Resume" on the active session

**Expected Result:**
- Assessment loads with previous answers intact
- User can continue from where they left off
- Session shows "Resuming Session" indicator

### 2. Expired Session Handling
**Steps:**
1. Create a test session with a short expiry time
2. Wait for the session to expire
3. Try to resume the expired session

**Expected Result:**
- Error message: "The test session you're trying to resume has expired. Please start a new assessment."
- User is redirected to start a new test

### 3. Non-existent Session Handling
**Steps:**
1. Try to access a non-existent session ID
2. Use an invalid session ID format

**Expected Result:**
- Error message: "The test session you're trying to resume no longer exists. It may have been completed or removed."
- User is redirected to start a new test

### 4. Unauthorized Access
**Steps:**
1. Create a session with one student ID
2. Try to resume with a different student ID

**Expected Result:**
- Error message: "You don't have permission to access this test session. Please check your student ID."
- Access is denied

### 5. Missing Learnosity Session ID
**Steps:**
1. Create a test session without a Learnosity session ID
2. Try to resume the session

**Expected Result:**
- Error message: "The test session is missing Learnosity session data. Please start a new assessment."
- User is redirected to start a new test

## API Testing

### Test Resume API Endpoint
```bash
# Test with valid session
curl -X POST http://localhost:3000/api/learnosity \
  -H "Content-Type: application/json" \
  -d '{"testSessionId": "valid-session-id", "studentId": "student123"}'

# Test with expired session
curl -X POST http://localhost:3000/api/learnosity \
  -H "Content-Type: application/json" \
  -d '{"testSessionId": "expired-session-id", "studentId": "student123"}'

# Test with non-existent session
curl -X POST http://localhost:3000/api/learnosity \
  -H "Content-Type: application/json" \
  -d '{"testSessionId": "non-existent-id", "studentId": "student123"}'
```

## Database Verification

### Check Session Data
```sql
-- View all test sessions
SELECT id, studentId, learnositySessionId, expiresAt, createdAt 
FROM TestSession 
ORDER BY createdAt DESC;

-- Check for sessions with missing Learnosity session ID
SELECT id, studentId, learnositySessionId 
FROM TestSession 
WHERE learnositySessionId IS NULL;
```

## Learnosity Items API Verification

### Session State Persistence
When resuming a session, verify that:
1. The same `session_id` is used in the Learnosity Items API request
2. Previous answers are restored
3. The assessment timer continues from where it left off
4. Navigation state is preserved

### Event Handling
Monitor these Learnosity events:
- `test:pause` - When assessment is paused
- `test:resume` - When assessment is resumed
- `test:ready` - When assessment is ready

## Troubleshooting

### Common Issues
1. **Session not resuming**: Check if `learnositySessionId` is properly stored
2. **Answers not restored**: Verify the same `session_id` is being used
3. **Timer issues**: Check if Learnosity events are properly handled
4. **Permission errors**: Verify student ID matches the session

### Debug Steps
1. Check browser console for Learnosity errors
2. Verify API responses in Network tab
3. Check database for session data integrity
4. Review server logs for error details

## Success Criteria
- [ ] User can resume an active session
- [ ] Previous answers are restored
- [ ] Expired sessions are properly handled
- [ ] Error messages are user-friendly
- [ ] Security validations work correctly
- [ ] Learnosity Items API integration works seamlessly
