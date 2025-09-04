"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LandingPage from "@/components/LandingPage";
import SessionResumption from "@/components/SessionResumption";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Session } from "@/types";

export default function Home() {
  const [, setCurrentSession] = useState<Session | null>(null);
  const [studentId, setStudentId] = useState<string>("");
  const router = useRouter();

  const handleStartAssessment = async (newStudentId: string): Promise<void> => {
    setStudentId(newStudentId);
    try {
      // Create a new session
      const response = await fetch("/api/sessions", {
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
      setCurrentSession(data.data.session); // API returns data.data.session

      // Navigate to assessment page with session details
      router.push(
        `/assessment?studentId=${newStudentId}&sessionId=${data.data.session.id}`
      );
    } catch (error) {
      console.error("Error starting assessment:", error);
      throw error;
    }
  };

  const handleSessionResume = (session: Session) => {
    setCurrentSession(session);
  };

  return (
    <ErrorBoundary>
      <main>
        {studentId && (
          <SessionResumption
            studentId={studentId}
            onSessionResume={handleSessionResume}
          />
        )}
        <LandingPage onStartAssessment={handleStartAssessment} />
      </main>
    </ErrorBoundary>
  );
}
