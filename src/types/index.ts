// Database types
export interface TestSession {
  id: string;
  studentId: string;
  learnositySessionId: string;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  assessmentId: string;
  results: AssessmentResult[];
}

export interface AssessmentResult {
  id: string;
  testSessionId: string;
  response: any;
  score?: number;
  timeSpent?: number;
  createdAt: Date;
  updatedAt: Date;
}

// API types
export interface CreateTestSessionRequest {
  studentId: string;
  assessmentId: string;
}

export interface UpdateTestSessionRequest {
  status?: TestSession["status"];
}

export interface CreateResultRequest {
  testSessionId: string;
  response: any;
  score?: number;
  timeSpent?: number;
}

// Learnosity types
export interface LearnositySessionConfig {
  user_id: string;
  session_id: string;
  activity_id: string;
  domain: string;
  consumer_key: string;
  timestamp: string;
  signature: string;
}

export interface LearnosityResponse {
  success: boolean;
  data: {
    learnosity: {
      domain: string;
      itemsRequest: any;
      securityConfig: any;
    };
    testSession: {
      id: string;
      studentId: string;
      assessmentId: string;
      status: string;
    };
  };
  timestamp: string;
}
