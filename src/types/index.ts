// Database types
export interface TestSession {
  id: string;
  studentId: string;
  learnositySessionId: string;
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

export interface LearnosityConfig {
  id: string;
  endpoint: string;
  expiresMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

// API types
export interface CreateTestSessionRequest {
  studentId: string;
  assessmentId: string;
}

export interface UpdateTestSessionRequest {
  // No fields currently supported for updates
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
}

export interface CreateResultRequest {
  testSessionId: string;
  response: any;
  score?: number;
  timeSpent?: number;
}

export interface CreateLearnosityConfigRequest {
  endpoint: string;
  expiresMinutes: number;
}

export interface LearnosityConfigResponse {
  success: boolean;
  data: {
    config: LearnosityConfig;
  };
  timestamp: string;
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
    };
  };
  timestamp: string;
}
