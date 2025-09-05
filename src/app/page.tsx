"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LandingPage from "@/components/LandingPage";
import TestSessionResumption from "@/components/TestSessionResumption";
import LearnosityConfigForm from "@/components/LearnosityConfigForm";
import ErrorBoundary from "@/components/ErrorBoundary";
import { TestSession, LearnosityConfig } from "@/types";

export default function Home() {
  const [, setCurrentTestSession] = useState<TestSession | null>(null);
  const [studentId, setStudentId] = useState<string>("");
  const [, setLearnosityConfig] = useState<LearnosityConfig | null>(null);
  const router = useRouter();

  const handleStartAssessment = async (newStudentId: string): Promise<void> => {
    setStudentId(newStudentId);
    try {
      // Create a new test session
      const response = await fetch("/api/test-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: newStudentId, // Use the parameter, not the state
          assessmentId: "demo-assessment-1",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create assessment session");
      }

      const data = await response.json();
      setCurrentTestSession(data.data.testSession); // API returns data.data.testSession

      // Navigate to assessment page with test session details
      router.push(
        `/assessment?studentId=${newStudentId}&testSessionId=${data.data.testSession.id}`
      );
    } catch (error) {
      console.error("Error starting assessment:", error);
      throw error;
    }
  };

  const handleTestSessionResume = (testSession: TestSession) => {
    setCurrentTestSession(testSession);
  };

  const handleConfigChange = (config: LearnosityConfig) => {
    setLearnosityConfig(config);
  };

  const handleConfigError = (error: string) => {
    console.error("Configuration error:", error);
  };

  return (
    <ErrorBoundary>
      <main>
        {/* Learnosity Configuration Form */}
        <div className="container-fluid py-4">
          <LearnosityConfigForm
            onConfigChange={handleConfigChange}
            onError={handleConfigError}
          />
        </div>

        {studentId && (
          <TestSessionResumption
            studentId={studentId}
            onTestSessionResume={handleTestSessionResume}
          />
        )}
        <LandingPage onStartAssessment={handleStartAssessment} />
      </main>
    </ErrorBoundary>
  );
}
