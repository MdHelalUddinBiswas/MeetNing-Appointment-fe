"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  FileText,
  Edit,
  Trash2,
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
};

export default function AppointmentDetailsPage() {
  const params = useParams();
  const appointmentId = params.appointmentId as string;

  const router = useRouter();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newParticipantEmail, setNewParticipantEmail] = useState("");
  const [newParticipantName, setNewParticipantName] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    // In a real application, this would fetch the appointment details from an API
    const fetchAppointment = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/appointments/${appointmentId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token || "",
            },
          }
        );
        const data = await response.json();
        setAppointment(data);
        console.log(data);
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch appointment");
        }
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        console.error("Error fetching appointment:", err);
        setError("Failed to load appointment details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId]);

  const handleDelete = async () => {
    try {
      // In a real app, this would make an API call to delete the appointment
      await new Promise((resolve) => setTimeout(resolve, 500));

      router.push("/appointments");
    } catch (err) {
      console.error("Error deleting appointment:", err);
      setError("Failed to delete appointment. Please try again.");
    }
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
        `${process.env.NEXT_PUBLIC_API_URL}/appointments/${appointmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            participants: updatedParticipants,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("Participant added successfully");

        // Send email notification via server-side API route
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

        // Update local state
        setAppointment({
          ...appointment!,
          participants: updatedParticipants,
        });

        // Close the dialog
        setDialogOpen(false);

        // Reset form
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
      if (newStatus === "completed") {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/appointments/${appointmentId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token || "",
            },
            body: JSON.stringify({
              status: newStatus,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to complete appointment");
        }
      }

      if (newStatus === "canceled") {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/appointments/${appointmentId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token || "",
            },
            body: JSON.stringify({
              status: newStatus,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to cancel appointment");
        }
      }

      if (newStatus === "upcoming") {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/appointments/${appointmentId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token || "",
            },
            body: JSON.stringify({
              status: newStatus,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to reschedule appointment");
        }
      }
      // In a real app, this would make an API call to update the appointment status
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (appointment) {
        setAppointment({ ...appointment, status: newStatus });
      }
    } catch (err) {
      console.error("Error updating appointment status:", err);
      setError("Failed to update appointment status. Please try again.");
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

  // Format appointment date and times
  const startDateTime = new Date(appointment?.start_time);

  const formattedDate = startDateTime.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = startDateTime.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Calculate duration in minutes if start_time and end_time are available
  const startTime = new Date(appointment.start_time).getTime();
  const endTime = new Date(appointment.end_time).getTime();
  const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

  return (
    <div className="space-y-6">
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
        {appointment.role === "owner" && (
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
                {formattedTime} ({durationMinutes} minutes)
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

      {appointment.status === "upcoming" && (
        <div className="bg-blue-50 rounded-lg shadow p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-800">
                Calendar Integration
              </h3>
              <p className="mt-2 text-sm text-blue-700">
                This appointment has been added to your calendar. Any changes or
                cancellations will be automatically updated in your calendar.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Link href="/appointments">
          <Button variant="outline">Back to Appointments</Button>
        </Link>
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
                    onChange={(e) => setNewParticipantEmail(e.target.value)}
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddParticipant}>Add Participant</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
