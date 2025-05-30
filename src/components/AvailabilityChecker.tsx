"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

interface AvailabilityCheckerProps {
  participantEmails: string;
  startTime: Date;
  endTime: Date;
  onAvailabilityChecked?: (hasConflicts: boolean, conflicts: any[]) => void;
}

interface Conflict {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  owner_email: string;
  conflicting_participants: string[];
}

interface AvailabilityResult {
  hasConflicts: boolean;
  conflicts: Conflict[];
  participantAvailability: Record<string, boolean>;
}

export default function AvailabilityChecker({
  participantEmails,
  startTime,
  endTime,
  onAvailabilityChecked,
}: AvailabilityCheckerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [availabilityResult, setAvailabilityResult] =
    useState<AvailabilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = async () => {
    try {
      // Reset states
      setError(null);

      // Validate inputs
      if (!participantEmails.trim()) {
        setError("Please add at least one participant email");
        return;
      }

      if (!startTime || !endTime) {
        setError("Please select valid start and end times");
        return;
      }

      setIsChecking(true);

      // Extract emails from the comma-separated string
      const emails = participantEmails
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email);

      // Format the API URL with proper parameters - making sure to use the correct backend URL
      // Ensure this matches the route registered in the backend (api/conflicts/check)
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/conflicts/check`;

      // Get token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        return;
      }

      console.log("Sending availability check with emails:", emails);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-auth-token": token,
        },
        mode: "cors",
        credentials: "include",
        body: JSON.stringify({
          participantEmails: emails,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });

      console.log("Availability check response status:", response.status);

      // Check for networking errors first (no JSON response)
      if (!response.ok) {
        if (
          response.headers.get("content-type")?.includes("application/json")
        ) {
          // If it's JSON, parse the error
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to check availability");
        } else {
          // If not JSON (like HTML error page), throw generic error
          throw new Error(
            `Server responded with ${response.status}: ${response.statusText}`
          );
        }
      }

      // Parse the JSON response
      const data = await response.json();
      console.log("Availability data:", data);
      setAvailabilityResult(data);

      // Call the callback if provided
      if (onAvailabilityChecked) {
        onAvailabilityChecked(data.hasConflicts, data.conflicts);
      }
    } catch (error: any) {
      console.error("Error checking availability:", error);
      setError(
        error.message || "An error occurred while checking availability"
      );
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <button
          type="button"
          onClick={checkAvailability}
          disabled={isChecking || !participantEmails.trim()}
          className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 disabled:opacity-50"
        >
          <Clock size={18} />
          {isChecking ? "Checking..." : "Check Availability"}
        </button>
      </div>

      {error && (
        <div className="text-red-600 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {availabilityResult && (
        <div className="space-y-4">
          {/* Availability Summary */}
          <div className="border rounded p-4 bg-gray-50">
            <h3 className="font-medium mb-2">Participant Availability:</h3>
            <ul className="space-y-2">
              {Object.entries(availabilityResult.participantAvailability).map(
                ([email, isAvailable]) => (
                  <li key={email} className="flex items-center">
                    {isAvailable ? (
                      <CheckCircle
                        className="text-green-500 mr-2 flex-shrink-0"
                        size={18}
                      />
                    ) : (
                      <AlertCircle
                        className="text-red-500 mr-2 flex-shrink-0"
                        size={18}
                      />
                    )}
                    <span>
                      {email}: {isAvailable ? "Available" : "Has conflicts"}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Conflict Details */}
          {availabilityResult.hasConflicts && (
            <div className="border border-red-200 rounded p-4 bg-red-50">
              <h3 className="font-medium text-red-700 mb-2">
                Scheduling Conflicts Detected:
              </h3>
              <ul className="space-y-3">
                {availabilityResult.conflicts.map((conflict, index) => (
                  <li key={index} className="text-sm">
                    <p className="font-medium">
                      <span>{conflict.title}</span>
                      <span className="text-gray-600 ml-2">
                        (
                        {new Date(conflict.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -
                        {new Date(conflict.end_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        )
                      </span>
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Affected: </span>
                      {conflict.conflicting_participants.join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
