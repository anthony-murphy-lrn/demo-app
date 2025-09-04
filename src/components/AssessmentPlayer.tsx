"use client";

import { useEffect, useRef, useState } from "react";
import { LearnosityResponse } from "@/types";

interface AssessmentPlayerProps {
  sessionId: string;
  studentId: string;
  onComplete?: (results: any) => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    LearnosityItems: any;
  }
}

export default function AssessmentPlayer({
  sessionId,
  studentId,
  onComplete,
  onError,
}: AssessmentPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLearnosityConfig] = useState<any>(null);
  const itemsAppRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Learnosity Items API
  useEffect(() => {
    let isInitialized = false;

    const initializeAssessment = async () => {
      if (isInitialized) {
        console.log("Assessment already initialized, skipping...");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch Learnosity configuration from our API
        const requestBody = {
          testSessionId: sessionId,
          studentId,
        };

        console.log(
          "AssessmentPlayer - Sending request to /api/learnosity with body:",
          requestBody
        );

        const response = await fetch("/api/learnosity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("AssessmentPlayer - API error response:", {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          });
          throw new Error(
            `Failed to initialize assessment session: ${response.status} ${response.statusText}`
          );
        }

        const data: LearnosityResponse = await response.json();

        if (!data.success) {
          throw new Error("Failed to initialize assessment session");
        }

        const learnosityConfig = data.data.learnosity;
        console.log("Learnosity config received:", learnosityConfig);
        console.log(
          "Activity ID being used:",
          learnosityConfig.itemsRequest.activity_id
        );
        setLearnosityConfig(learnosityConfig);

        // Load Learnosity Items API script if not already loaded
        if (!window.LearnosityItems) {
          await loadLearnosityScript();
        }

        // Wait for the container to be available before initializing
        const waitForContainer = () => {
          if (containerRef.current && !isInitialized) {
            console.log(
              "Container is now available, initializing Items API..."
            );
            isInitialized = true;
            initializeItemsAPI(learnosityConfig.itemsRequest);
          } else if (!isInitialized) {
            console.log("Container not yet available, retrying in 100ms...");
            setTimeout(waitForContainer, 100);
          }
        };

        waitForContainer();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load assessment";
        setError(errorMessage);
        onError?.(errorMessage);
        console.error("Error initializing assessment:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAssessment();

    // Cleanup function
    return () => {
      isInitialized = true;
    };
  }, [sessionId, studentId, onError]);

  // Load Learnosity Items API script
  const loadLearnosityScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.LearnosityItems) {
        console.log("LearnosityItems already available");
        resolve();
        return;
      }

      console.log("Loading Learnosity script...");
      const script = document.createElement("script");
      script.src = "//items-ie.learnosity.com/?latest-lts";
      script.async = true;
      script.onload = () => {
        console.log("Learnosity script loaded successfully");
        console.log("window.LearnosityItems:", window.LearnosityItems);
        resolve();
      };
      script.onerror = () => {
        console.error("Failed to load Learnosity script");
        reject(new Error("Failed to load Learnosity script"));
      };
      document.head.appendChild(script);
    });
  };

  // Initialize Learnosity Items API
  const initializeItemsAPI = (config: any) => {
    // Prevent duplicate initialization
    if (itemsAppRef.current) {
      console.log("Items API already initialized, skipping...");
      return;
    }

    console.log("initializeItemsAPI called with config:", config);
    console.log("containerRef.current:", containerRef.current);
    console.log("window.LearnosityItems:", window.LearnosityItems);

    if (!containerRef.current || !window.LearnosityItems) {
      console.error("Missing container or LearnosityItems:", {
        container: !!containerRef.current,
        learnosity: !!window.LearnosityItems,
      });
      return;
    }

    try {
      console.log("About to initialize Learnosity Items API...");

      console.log("Learnosity config being passed:", config);

      // Initialize the Items API
      console.log(
        "Calling LearnosityItems.init with config:",
        JSON.stringify(config, null, 2)
      );
      console.log(
        "Available LearnosityItems methods:",
        Object.getOwnPropertyNames(window.LearnosityItems)
      );
      console.log(
        "LearnosityItems.init function:",
        typeof window.LearnosityItems.init
      );

      // Verify required configuration structure
      if (!config.security || !config.request) {
        console.error(
          "Missing required Learnosity configuration structure. Expected { security: {...}, request: {...} }"
        );
        return;
      }

      // Verify required security fields
      const requiredSecurityFields = ["consumer_key", "domain", "signature"];
      const missingSecurityFields = requiredSecurityFields.filter(
        field => !config.security[field]
      );
      if (missingSecurityFields.length > 0) {
        console.error(
          "Missing required security fields:",
          missingSecurityFields
        );
      } else {
        console.log("All required security fields are present");
      }

      // Verify required request fields
      const requiredRequestFields = ["user_id", "session_id"];
      const missingRequestFields = requiredRequestFields.filter(
        field => !config.request[field]
      );
      if (missingRequestFields.length > 0) {
        console.error("Missing required request fields:", missingRequestFields);
      } else {
        console.log("All required request fields are present");
      }

      // Try the standard initialization first
      try {
        itemsAppRef.current = window.LearnosityItems.init(config, {
          readyListener: () => {
            console.log("Learnosity Items API ready");
            console.log("Assessment should now be visible");
            setIsLoading(false);
          },
          errorListener: (error: any) => {
            console.error("Learnosity Items API error:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            setError("Assessment loading error. Please refresh the page.");
            onError?.("Assessment loading error");
          },
          submitSuccess: (response: any) => {
            console.log("Assessment submitted successfully:", response);
            onComplete?.(response);
          },
          submitError: (error: any) => {
            console.error("Assessment submission error:", error);
            setError("Failed to submit assessment. Please try again.");
            onError?.("Assessment submission failed");
          },
        });

        console.log("Standard init successful:", itemsAppRef.current);
      } catch (initError) {
        console.error("Standard init failed:", initError);

        // Try alternative initialization method
        try {
          console.log("Trying alternative initialization method...");
          itemsAppRef.current = window.LearnosityItems.init(config);
          console.log("Alternative init successful:", itemsAppRef.current);
        } catch (altInitError) {
          console.error("Alternative init also failed:", altInitError);
          throw altInitError;
        }
      }

      console.log("Learnosity Items API initialized:", itemsAppRef.current);

      // Check if there are any Learnosity errors
      if (
        window.LearnosityItems.errors &&
        window.LearnosityItems.errors.length > 0
      ) {
        console.error("Learnosity errors:", window.LearnosityItems.errors);
      }

      // Check for errors immediately after initialization
      setTimeout(() => {
        if (
          window.LearnosityItems.errors &&
          window.LearnosityItems.errors.length > 0
        ) {
          console.error(
            "Learnosity errors after 1 second:",
            window.LearnosityItems.errors
          );
        }
      }, 1000);

      // Add a timeout to check if the assessment loads
      setTimeout(() => {
        if (
          containerRef.current &&
          containerRef.current.children.length === 0
        ) {
          console.warn("Assessment container is still empty after 5 seconds");
          console.warn(
            "This might indicate the activity_id doesn't exist or there's a configuration issue"
          );
          console.warn("Container HTML:", containerRef.current.innerHTML);

          // Check if there are any network requests to Learnosity
          console.warn("Checking for Learnosity network requests...");
          const performanceEntries = performance.getEntriesByType("resource");
          const learnosityRequests = performanceEntries.filter(
            entry =>
              entry.name.includes("learnosity.com") ||
              entry.name.includes("items.learnosity.com")
          );
          console.warn("Learnosity network requests:", learnosityRequests);
        }
      }, 5000);
    } catch (err) {
      console.error("Error initializing Learnosity Items API:", err);
      setError("Failed to initialize assessment player");
      onError?.("Assessment initialization failed");
    }
  };

  // Force containment of Learnosity content
  // const _forceContainment = () => {
  //   if (!containerRef.current) return;

  //   console.log("Forcing containment of Learnosity content...");

  //   // Force the container to respect viewport boundaries
  //   const container = containerRef.current;
  //   container.style.maxWidth = "100vw";
  //   container.style.width = "100vw";
  //   container.style.overflowX = "auto";
  //   container.style.overflowY = "visible";
  //   container.style.position = "relative";
  //   container.style.left = "0";
  //   container.style.right = "0";
  //   container.style.transform = "translateX(0)";

  //   // Force all child elements to respect boundaries
  //   const allElements = container.querySelectorAll("*");
  //   allElements.forEach((element: any) => {
  //     if (element.style) {
  //       element.style.maxWidth = "100vw";
  //       element.style.overflowX = "hidden";
  //       element.style.boxSizing = "border-box";
  //     }
  //   });

  //   // Monitor for any elements that might overflow
  //   const observer = new MutationObserver(() => {
  //     // _forceContainment();
  //   });

  //   observer.observe(container, {
  //     childList: true,
  //     subtree: true,
  //     attributes: true,
  //     attributeFilter: ["style", "class"],
  //   });

  //   console.log("Containment enforced and monitoring active");
  // };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (
        itemsAppRef.current &&
        typeof itemsAppRef.current.destroy === "function"
      ) {
        itemsAppRef.current.destroy();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading Assessment...</h5>
          <p className="text-muted small">
            Please wait while we prepare your assessment
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>Error:</strong> {error}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Reload Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      {/* Assessment Content - Full Width */}
      <div
        ref={containerRef}
        id="learnosity_assess"
        className="assessment-container w-100"
      >
        {/* Learnosity Items API will render here */}
      </div>
    </div>
  );
}
