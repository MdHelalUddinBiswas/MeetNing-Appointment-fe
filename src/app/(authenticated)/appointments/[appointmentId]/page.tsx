"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  FileText,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AvailabilityChecker from "@/components/AvailabilityChecker";
import { useAuth } from "@/lib/auth-context";

type Appointment = {
  id: string | number;
  title: string;
  start_time: string;
  end_time: string;
  participants: any;
  email: string;
  participantsJson: string;
  location: string;
  role: string;
  description: string;
  status: "upcoming" | "completed" | "canceled" | "pending";
  created_at?: string;
  user_id?: number;
  raw_metadata?: {
    duration_minutes?: number;
    [key: string]: any;
  };
};

export default function AppointmentDetailsPage() {
  const params = useParams();
  const appointmentId = params.appointmentId as string;
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newParticipantEmail, setNewParticipantEmail] = useState("");
  const [newParticipantName, setNewParticipantName] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [hasConflicts, setHasConflicts] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const token = localStorage.getItem("token");

  const fetchAppointment = async () => {
    setLoading(true);
    try {
      // Check if token exists
      if (!token) {
        console.error("No authentication token found");
        setError("Authentication required. Please login again.");
        setLoading(false);
        return;
      }

      console.log("Fetching appointment with ID:", appointmentId);
      console.log("Using token:", token ? "[TOKEN EXISTS]" : "[NO TOKEN]");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments/${appointmentId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
        }
      );

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        // Handle different HTTP error codes
        if (response.status === 401 || response.status === 403) {
          throw new Error("Authentication error. Please login again.");
        } else if (response.status === 404) {
          throw new Error("Appointment not found.");
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      // Try to parse the JSON response
      let responseJson;
      try {
        responseJson = await response.json();
        console.log("Fetched appointment:", responseJson);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        throw new Error("Invalid server response. Please try again later.");
      }

      // Check if the response has the expected data structure
      if (!responseJson.data) {
        throw new Error("Invalid response format. Missing appointment data.");
      }

      setAppointment(responseJson.data);
    } catch (err) {
      console.error("Error fetching appointment:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load appointment details. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  const handleAvailabilityChecked = (hasConflicts: boolean, conflicts: any[]) => {
    setAvailabilityChecked(true);
    setHasConflicts(hasConflicts);
    setConflicts(conflicts);
  };

  const handleAddParticipant = async () => {
    if (!newParticipantEmail) {
      setError("Email is required");
      return;
    }

    try {
      const newParticipant = {
        email: newParticipantEmail,
        name: newParticipantName || undefined,
        added_at: new Date().toISOString(), // Add timestamp when participant is added
      };

      const currentParticipants = appointment?.participants || [];

      const updatedParticipants = [...currentParticipants, newParticipant];

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/embeddings/appointments/${appointmentId}/participants`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token || "",
          },
          body: JSON.stringify({
            email: newParticipantEmail,
            name: newParticipantName || undefined,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("Participant added successfully");

        try {
          console.log("Sending email notification to:", newParticipantEmail);

          const emailResponse = await fetch("/api/send-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: newParticipantEmail, // Send to the newly added participant
              subject: `You've been added to "${appointment?.title}" appointment`,
              appointmentTitle: appointment?.title,
              startTime: appointment?.start_time || "",
              endTime: appointment?.end_time || "",
              location: appointment?.location || "Not specified",
              description: appointment?.description || "",
              addedAt: newParticipant.added_at, // Include the timestamp when participant was added
              useNodemailer: true, // Flag to use Nodemailer instead of Resend
            }),
          });

          if (!emailResponse.ok) {
            throw new Error(
              `Email API returned status: ${emailResponse.status}`
            );
          }

          const emailResult = await emailResponse.json();
          console.log("Email API response:", emailResult);

          if (emailResult.success) {
            console.log("Email notification sent successfully");
          } else if (emailResult.skipped) {
            console.log("Email notification skipped:", emailResult.message);
          } else {
            console.error("Email sending failed:", emailResult.error);
          }
        } catch (emailError) {
          console.error("Error sending email notification:", emailError);
          // Don't throw here to avoid breaking the participant addition flow
        }
        setAppointment({
          ...appointment!,
          participants: updatedParticipants,
        });

        setDialogOpen(false);

        setNewParticipantEmail("");
        setNewParticipantName("");
      } else {
        throw new Error(data.message || "Failed to add participant");
      }
    } catch (error) {
      console.error("Error adding participant:", error);
      setError("Failed to add participant. Please try again.");
    }
  };

  const handleStatusChange = async (
    newStatus: "upcoming" | "completed" | "canceled"
  ) => {
    try {
      // Check if token exists
      if (!token) {
        setError("Authentication required. Please login again.");
        return;
      }

      // Check if appointment exists
      if (!appointment) {
        setError("Cannot update: appointment details not loaded.");
        return;
      }

      let endpoint = "";

      // Use the specific endpoints for each status change
      if (newStatus === "completed") {
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/embeddings/appointments/${appointmentId}/complete`;
      } else if (newStatus === "canceled") {
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/embeddings/appointments/${appointmentId}/cancel`;
      } else {
        // For other status changes, use the general update endpoint
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/embeddings/appointments/${appointmentId}`;
      }

      console.log(`Changing appointment status to ${newStatus}`);

      // Update the local state immediately for better UX
      setAppointment({ ...appointment, status: newStatus });

      // If cancelling, close dialog immediately for better UX
      if (newStatus === "canceled") {
        setDeleteConfirmOpen(false);
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        // Reset the appointment state if the server request failed
        fetchAppointment();

        // Handle different HTTP error codes
        if (response.status === 401 || response.status === 403) {
          throw new Error("Authentication error. Please login again.");
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      let data;
      try {
        data = await response.json();
        console.log("Status updated successfully:", data);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        throw new Error("Invalid server response. Please try again later.");
      }

      // Refresh the appointment data after successful status change
      fetchAppointment();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update appointment status. Please try again.";
      setError(`Failed to update appointment status. ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 animate-spin text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-700">
            Loading appointment details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm inline-block">
          {error}
        </div>
        <div className="mt-6">
          <Link href="/appointments">
            <Button variant="outline">Return to Appointments</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">
          Appointment Not Found
        </h2>
        <p className="mt-2 text-gray-600">
          The appointment you are looking for does not exist or has been
          deleted.
        </p>
        <div className="mt-6">
          <Link href="/appointments">
            <Button variant="outline">Return to Appointments</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Format appointment date and times using user's timezone
  const startDateTime = new Date(appointment?.start_time);
  const { user } = useAuth();
  const userTimezone = user?.timezone || undefined;

  // Format date with user's timezone preference
  const formattedDate = startDateTime.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: userTimezone
  });

  // Format time with user's timezone preference
  const formattedTime = startDateTime.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: userTimezone
  });

  return (
    <div className="space-y-6 mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {appointment.title}
            </h1>
            <span
              className={`ml-4 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                appointment.status === "upcoming"
                  ? "bg-green-100 text-green-800"
                  : appointment.status === "completed"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {appointment.status.charAt(0).toUpperCase() +
                appointment.status.slice(1)}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {appointment?.description}
          </p>
        </div>
        {appointment?.role === "owner" && (
          <div className="flex space-x-3">
            {appointment.status === "upcoming" && (
              <>
                <Link href={`/appointments/${appointmentId}/edit`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2"
                  onClick={() => setDeleteConfirmOpen(true)} 
                >
                  <Trash2 className="h-4 w-4" />
                  Cancel
                </Button>
              </>
            )}
            {appointment.status === "canceled" && (
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => handleStatusChange("upcoming")}
              >
                <Calendar className="h-4 w-4" />
                Reschedule
              </Button>
            )}
            {appointment.status === "upcoming" && (
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => handleStatusChange("completed")}
              >
                <Clock className="h-4 w-4" />
                Mark as Completed
              </Button>
            )}
          </div>
        )}
      </div>

      {deleteConfirmOpen && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800">
            Cancel this appointment?
          </h3>
          <p className="mt-2 text-sm text-red-700">
            Are you sure you want to cancel this appointment? This action cannot
            be undone and will notify all participants.
          </p>
          <div className="mt-4 flex space-x-3">
            <Button
              variant="destructive"
              className="flex items-center gap-2"
              onClick={() => handleStatusChange("canceled")}
            >
              <Trash2 className="h-4 w-4" />
              Yes, Cancel Appointment
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              No, Keep Appointment
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Appointment Information
          </h2>
        </div>
        <div className="px-6 py-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{formattedDate}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                Time
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formattedTime}
                <span>
                  {" "}
                  (
                  {(() => {
                    // Calculate duration from timestamps
                    const startTime = new Date(
                      appointment.start_time
                    ).getTime();
                    const endTime = new Date(appointment.end_time).getTime();
                    const durationMs = endTime - startTime;

                    // Check if duration seems unreasonable (>5 hours or negative)
                    if (
                      Math.abs(durationMs) > 5 * 60 * 60 * 1000 ||
                      durationMs < 0
                    ) {
                      // For unreasonable durations, fall back to a default value
                      return 30;
                    }

                    return Math.round(durationMs / 60000);
                  })()}{" "}
                  minutes)
                </span>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Users className="h-4 w-4 mr-2 text-gray-400" />
                Participants
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {appointment?.participants?.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {appointment?.participants?.map(
                      (participant: { email: string }, index: number) => (
                        <li key={index}>{participant?.email}</li>
                      )
                    )}
                  </ul>
                ) : (
                  <span className="text-gray-500">No participants</span>
                )}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                Location
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {appointment.location ? (
                  appointment.location.startsWith("http") ? (
                    <a
                      href={appointment.location}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {appointment.location}
                    </a>
                  ) : (
                    appointment.location
                  )
                ) : (
                  "Not specified"
                )}
              </dd>
            </div>
            {appointment.description && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-400" />
                  Description
                </dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                  {appointment.description}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="flex justify-between">
        <Link href="/appointments">
          <Button variant="outline">Back to Appointments</Button>
        </Link>
        {appointment?.role === "owner" && appointment.status === "upcoming" && (
          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add Participant</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Participant</DialogTitle>
                  <DialogDescription>
                    Add a new participant to this appointment. They will receive
                    notification about the meeting details.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={newParticipantEmail}
                      onChange={(e) => {
                        setNewParticipantEmail(e.target.value);
                        setAvailabilityChecked(false);
                      }}
                      placeholder="participant@example.com"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name (Optional)
                    </Label>
                    <Input
                      id="name"
                      value={newParticipantName}
                      onChange={(e) => setNewParticipantName(e.target.value)}
                      placeholder="Participant Name"
                      className="col-span-3"
                    />
                  </div>
                  
                  {/* Add Availability Checker */}
                  {newParticipantEmail && appointment && (
                    <div className="col-span-4 border rounded-md p-4 bg-gray-50 mt-2">
                      <h3 className="text-sm font-medium mb-3">
                        Check Participant Availability
                      </h3>
                      <AvailabilityChecker
                        participantEmails={newParticipantEmail}
                        startTime={new Date(appointment.start_time)}
                        endTime={new Date(appointment.end_time)}
                        onAvailabilityChecked={handleAvailabilityChecked}
                      />
                      
                      {availabilityChecked && (
                        <div className="mt-3 text-sm">
                          {hasConflicts ? (
                            <div className="flex items-center text-amber-600">
                              <AlertCircle size={16} className="mr-2" />
                              <span>
                                Conflicts detected. You can still add the participant if needed.
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center text-green-600">
                              <CheckCircle size={16} className="mr-2" />
                              <span>
                                This participant is available at this time!
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddParticipant}>
                    Add Participant
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
