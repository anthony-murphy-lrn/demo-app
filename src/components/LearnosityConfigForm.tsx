"use client";

import { useState, useEffect } from "react";
import { LearnosityConfig, CreateLearnosityConfigRequest } from "@/types";

interface LearnosityConfigFormProps {
  onConfigChange?: (config: LearnosityConfig) => void;
  onError?: (error: string) => void;
}

const LEARNOSITY_ENDPOINTS = [
  {
    value: "items-va.learnosity.com",
    label: "US East (items-va.learnosity.com)",
  },
  {
    value: "items-ie.learnosity.com",
    label: "Europe (items-ie.learnosity.com)",
  },
  {
    value: "items-au.learnosity.com",
    label: "Australia (items-au.learnosity.com)",
  },
];

const EXPIRY_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 240, label: "4 hours" },
  { value: 480, label: "8 hours" },
];

export default function LearnosityConfigForm({
  onConfigChange,
  onError,
}: LearnosityConfigFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<CreateLearnosityConfigRequest>({
    endpoint: "",
    expiresMinutes: 30,
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Load current configuration on mount
  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/learnosity-config");

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.config) {
          setConfig({
            endpoint: data.data.config.endpoint,
            expiresMinutes: data.data.config.expiresMinutes,
          });
        }
      }
    } catch (err) {
      console.error("Error loading configuration:", err);
      if (onError) {
        onError("Failed to load current configuration");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndpointChange = (endpoint: string) => {
    setConfig(prev => ({ ...prev, endpoint }));
    setValidationErrors(prev => ({ ...prev, endpoint: "" }));
  };

  const handleExpiryChange = (expiresMinutes: number) => {
    setConfig(prev => ({ ...prev, expiresMinutes }));
    setValidationErrors(prev => ({ ...prev, expiresMinutes: "" }));
  };

  const handleCustomExpiryChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      handleExpiryChange(numValue);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!config.endpoint) {
      errors.endpoint = "Please select an endpoint";
    }

    if (!config.expiresMinutes || config.expiresMinutes <= 0) {
      errors.expiresMinutes = "Please enter a valid expiry time";
    } else if (config.expiresMinutes > 1440) {
      errors.expiresMinutes = "Expiry time cannot exceed 24 hours";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch("/api/learnosity-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.config) {
          if (onConfigChange) {
            onConfigChange(data.data.config);
          }
          // Show success message briefly
          setError(null);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to save configuration");
      }
    } catch (err) {
      console.error("Error saving configuration:", err);
      setError("Failed to save configuration. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatExpiryPreview = (minutes: number): string => {
    const now = new Date();
    const expiry = new Date(now.getTime() + minutes * 60 * 1000);
    // Use a consistent format that doesn't depend on locale
    return expiry.toISOString().replace("T", " ").slice(0, 19);
  };

  return (
    <div className="card mb-4">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-gear me-2"></i>
            Learnosity Configuration
          </h5>
          <button
            className="btn btn-outline-primary btn-sm"
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls="configCollapse"
          >
            <i className={`bi bi-chevron-${isExpanded ? "up" : "down"}`}></i>
            {isExpanded ? "Hide" : "Show"} Configuration
          </button>
        </div>
      </div>

      <div
        className={`collapse ${isExpanded ? "show" : ""}`}
        id="configCollapse"
      >
        <div className="card-body">
          {isLoading && (
            <div className="text-center py-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">
                  Loading configuration...
                </span>
              </div>
              <p className="mt-2 text-muted">
                Loading current configuration...
              </p>
            </div>
          )}

          {!isLoading && (
            <>
              {/* Endpoint Selection */}
              <div className="mb-3">
                <label htmlFor="endpoint" className="form-label fw-semibold">
                  Items API Endpoint <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${validationErrors.endpoint ? "is-invalid" : ""}`}
                  id="endpoint"
                  value={config.endpoint}
                  onChange={e => handleEndpointChange(e.target.value)}
                >
                  <option value="">Select an endpoint...</option>
                  {LEARNOSITY_ENDPOINTS.map(endpoint => (
                    <option key={endpoint.value} value={endpoint.value}>
                      {endpoint.label}
                    </option>
                  ))}
                </select>
                {validationErrors.endpoint && (
                  <div className="invalid-feedback">
                    {validationErrors.endpoint}
                  </div>
                )}
              </div>

              {/* Expiry Time Selection */}
              <div className="mb-3">
                <label
                  htmlFor="expiresMinutes"
                  className="form-label fw-semibold"
                >
                  Session Expiry Time <span className="text-danger">*</span>
                </label>
                <div className="row">
                  <div className="col-md-6">
                    <select
                      className={`form-select ${validationErrors.expiresMinutes ? "is-invalid" : ""}`}
                      id="expiresMinutes"
                      value={config.expiresMinutes}
                      onChange={e =>
                        handleExpiryChange(parseInt(e.target.value, 10))
                      }
                    >
                      {EXPIRY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                      <option value="custom">Custom...</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <input
                      type="number"
                      className={`form-control ${validationErrors.expiresMinutes ? "is-invalid" : ""}`}
                      placeholder="Custom minutes"
                      min="1"
                      max="1440"
                      value={config.expiresMinutes}
                      onChange={e => handleCustomExpiryChange(e.target.value)}
                    />
                  </div>
                </div>
                {validationErrors.expiresMinutes && (
                  <div className="invalid-feedback">
                    {validationErrors.expiresMinutes}
                  </div>
                )}
              </div>

              {/* Real-time Preview */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Configuration Preview
                </label>
                <div className="bg-light p-3 rounded">
                  <div className="row">
                    <div className="col-md-6">
                      <strong>Endpoint:</strong>
                      <br />
                      <code className="text-primary">
                        {config.endpoint || "Not selected"}
                      </code>
                    </div>
                    <div className="col-md-6">
                      <strong>Expires At:</strong>
                      <br />
                      <code className="text-success">
                        {config.expiresMinutes
                          ? formatExpiryPreview(config.expiresMinutes)
                          : "Not set"}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-2"></i>
                      Save Configuration
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={loadCurrentConfig}
                  disabled={isLoading}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Reset
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
