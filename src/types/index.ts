// Database types
export interface Session {
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
  sessionId: string;
  response: any;
  score?: number;
  timeSpent?: number;
  createdAt: Date;
  updatedAt: Date;
}

// API types
export interface CreateSessionRequest {
  studentId: string;
  assessmentId: string;
}

export interface UpdateSessionRequest {
  status?: Session["status"];
}

export interface CreateResultRequest {
  sessionId: string;
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
    session: {
      id: string;
      studentId: string;
      assessmentId: string;
      status: string;
    };
  };
  timestamp: string;
}

