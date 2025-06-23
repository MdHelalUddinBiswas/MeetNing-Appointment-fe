"use client";

import React, { useEffect, useReducer } from "react";
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

// --- Types --- //
type Appointment = {
  id: string | number;
  title: string;
  start_time: string;
  end_time: string;
  participants: { email: string; name?: string }[];
  location: string;
  role: string;
  description: string;
  status: "upcoming" | "completed" | "canceled" | "pending";
  created_at?: string;
  user_id?: number;
};

interface State {
  appointment: Appointment | null;
  loading: boolean;
  error: string | null;
  dialogOpen: boolean;
  newParticipantEmail: string;
  newParticipantName: string;
  deleteConfirmOpen: boolean;
  availabilityChecked: boolean;
  hasConflicts: boolean;
}

type Action =
  | { type: "FETCH_INIT" }
  | { type: "FETCH_SUCCESS"; payload: Appointment }
  | { type: "FETCH_FAILURE"; payload: string }
  | { type: "SET_APPOINTMENT"; payload: Appointment }
  | { type: "SET_STATUS"; payload: Appointment["status"] }
  | { type: "TOGGLE_PARTICIPANT_DIALOG"; payload: boolean }
  | {
      type: "SET_PARTICIPANT_FIELD";
      payload: { field: "email" | "name"; value: string };
    }
  | { type: "TOGGLE_DELETE_CONFIRM"; payload: boolean }
  | { type: "SET_AVAILABILITY_CHECKED"; payload: { hasConflicts: boolean } }
  | { type: "RESET_PARTICIPANT_FORM" }
  | { type: "SET_ERROR"; payload: string | null };

// --- Initial State --- //
const initialState: State = {
  appointment: null,
  loading: true,
  error: null,
  dialogOpen: false,
  newParticipantEmail: "",
  newParticipantName: "",
  deleteConfirmOpen: false,
  availabilityChecked: false,
  hasConflicts: false,
};

// --- Reducer --- //
function appointmentReducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_INIT":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        appointment: action.payload,
        error: null,
      };
    case "FETCH_FAILURE":
      return { ...state, loading: false, error: action.payload };
    case "SET_APPOINTMENT":
      return { ...state, appointment: action.payload };
    case "SET_STATUS":
      if (!state.appointment) return state;
      return {
        ...state,
        appointment: { ...state.appointment, status: action.payload },
      };
    case "TOGGLE_PARTICIPANT_DIALOG":
      return { ...state, dialogOpen: action.payload };
    case "SET_PARTICIPANT_FIELD":
      return {
        ...state,
        newParticipantEmail:
          action.payload.field === "email"
            ? action.payload.value
            : state.newParticipantEmail,
        newParticipantName:
          action.payload.field === "name"
            ? action.payload.value
            : state.newParticipantName,
        availabilityChecked:
          action.payload.field === "email" ? false : state.availabilityChecked,
      };
    case "TOGGLE_DELETE_CONFIRM":
      return { ...state, deleteConfirmOpen: action.payload };
    case "SET_AVAILABILITY_CHECKED":
      return {
        ...state,
        availabilityChecked: true,
        hasConflicts: action.payload.hasConflicts,
      };
    case "RESET_PARTICIPANT_FORM":
      return {
        ...state,
        newParticipantEmail: "",
        newParticipantName: "",
        availabilityChecked: false,
        hasConflicts: false,
        dialogOpen: false,
      };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// --- Component --- //
export default function AppointmentDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const appointmentId = params.appointmentId as string;
  const [state, dispatch] = useReducer(appointmentReducer, initialState);
  const {
    appointment,
    loading,
    error,
    dialogOpen,
    newParticipantEmail,
    newParticipantName,
    deleteConfirmOpen,
    availabilityChecked,
    hasConflicts,
  } = state;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const userTimezone = user?.timezone || undefined;

  useEffect(() => {
    const fetchAppointment = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        if (!token) {
          throw new Error("Authentication required. Please login again.");
        }

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

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error("Authentication error. Please login again.");
          } else if (response.status === 404) {
            throw new Error("Appointment not found.");
          } else {
            throw new Error(`Server error: ${response.status}`);
          }
        }

        const responseJson = await response.json();
        if (!responseJson.data) {
          throw new Error("Invalid response format. Missing appointment data.");
        }

        dispatch({ type: "FETCH_SUCCESS", payload: responseJson.data });
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load appointment details. Please try again.";
        dispatch({ type: "FETCH_FAILURE", payload: errorMessage });
      }
    };

    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId, token]);

  const handleAvailabilityChecked = (conflicts: boolean) => {
    dispatch({
      type: "SET_AVAILABILITY_CHECKED",
      payload: { hasConflicts: conflicts },
    });
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.appointment) {
      dispatch({
        type: "SET_ERROR",
        payload: "Appointment data is not available.",
      });
      return;
    }
    if (!newParticipantEmail) {
      dispatch({ type: "SET_ERROR", payload: "Email is required" });
      return;
    }

    try {
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

      if (!response.ok) {
        throw new Error(data.message || "Failed to add participant");
      }

      // Optimistically update UI
      const newParticipant = {
        email: newParticipantEmail,
        name: newParticipantName,
      };
      const updatedParticipants = [
        ...(appointment?.participants || []),
        newParticipant,
      ];
      dispatch({
        type: "SET_APPOINTMENT",
        payload: { ...appointment!, participants: updatedParticipants },
      });
      dispatch({ type: "RESET_PARTICIPANT_FORM" });

      // Send email notification in the background
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: newParticipantEmail,
          fromName: user?.name || "A colleague",
          subject: `Invitation: ${state.appointment.title}`,
          appointmentTitle: appointment?.title,
          startTime: appointment?.start_time || "",
          endTime: appointment?.end_time || "",
          location: appointment?.location || "Not specified",
          description: appointment?.description || "",
          addedAt: new Date().toISOString(),
          useNodemailer: true,
          timezone: userTimezone,
        }),
      }).catch((emailError) =>
        console.error("Error sending email notification:", emailError)
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to add participant. Please try again.";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
    }
  };

  const handleStatusChange = async (
    newStatus: "upcoming" | "completed" | "canceled"
  ) => {
    if (!token || !appointment) {
      dispatch({
        type: "SET_ERROR",
        payload: "Cannot update status: missing token or appointment data.",
      });
      return;
    }

    const originalStatus = appointment.status;
    dispatch({ type: "SET_STATUS", payload: newStatus });
    if (newStatus === "canceled") {
      dispatch({ type: "TOGGLE_DELETE_CONFIRM", payload: false });
    }

    try {
      const endpoint = {
        completed: `${process.env.NEXT_PUBLIC_API_URL}/embeddings/appointments/${appointmentId}/complete`,
        canceled: `${process.env.NEXT_PUBLIC_API_URL}/embeddings/appointments/${appointmentId}/cancel`,
        upcoming: `${process.env.NEXT_PUBLIC_API_URL}/embeddings/appointments/${appointmentId}`,
      }[newStatus];

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      await response.json();
    } catch (error) {
      // Revert optimistic update on failure
      dispatch({ type: "SET_STATUS", payload: originalStatus });
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update appointment status. Please try again.";
      dispatch({
        type: "SET_ERROR",
        payload: `Failed to update status. ${errorMessage}`,
      });
    }
  };

  // --- Render Logic --- //
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

  const startDateTime = new Date(appointment.start_time);
  const formattedDate = startDateTime.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: userTimezone,
  });
  const formattedTime = startDateTime.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: userTimezone,
  });

  const getDuration = () => {
    const startTime = new Date(appointment.start_time).getTime();
    const endTime = new Date(appointment.end_time).getTime();
    const durationMs = endTime - startTime;
    if (Math.abs(durationMs) > 5 * 60 * 60 * 1000 || durationMs < 0) {
      return 30; // Fallback duration
    }
    return Math.round(durationMs / 60000);
  };

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
            {appointment.description}
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
                  onClick={() =>
                    dispatch({ type: "TOGGLE_DELETE_CONFIRM", payload: true })
                  }
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
              onClick={() =>
                dispatch({ type: "TOGGLE_DELETE_CONFIRM", payload: false })
              }
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
                {formattedTime} ({getDuration()} minutes)
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Users className="h-4 w-4 mr-2 text-gray-400" />
                Participants
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {appointment.participants?.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {appointment.participants.map((p, index) => (
                      <div className="flex items-center gap-2" key={index}>
                        <span>Name: {p?.name}</span>
                        <span>Email: {p?.email}</span>
                      </div>
                    ))}
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
                {appointment.location?.startsWith("http") ? (
                  <a
                    href={appointment.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {appointment.location}
                  </a>
                ) : (
                  appointment.location || "Not specified"
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
        {appointment.role === "owner" && appointment.status === "upcoming" && (
          <div className="flex gap-2">
            <Dialog
              open={dialogOpen}
              onOpenChange={(isOpen) =>
                dispatch({ type: "TOGGLE_PARTICIPANT_DIALOG", payload: isOpen })
              }
            >
              <DialogTrigger asChild>
                <Button>Add Participant</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleAddParticipant}>
                <DialogHeader>
                  <DialogTitle>Add New Participant</DialogTitle>
                  <DialogDescription>
                    Add a new participant to this appointment. They will receive
                    a notification.
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
                      onChange={(e) =>
                        dispatch({
                          type: "SET_PARTICIPANT_FIELD",
                          payload: { field: "email", value: e.target.value },
                        })
                      }
                      placeholder="participant@example.com"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name 
                    </Label>
                    <Input
                      id="name"
                      value={newParticipantName}
                      required
                      onChange={(e) =>
                        dispatch({
                          type: "SET_PARTICIPANT_FIELD",
                          payload: { field: "name", value: e.target.value },
                        })
                      }
                      placeholder="Participant Name"
                      className="col-span-3"
                    />
                  </div>

                  {newParticipantEmail && (
                    <div className="col-span-4 border rounded-md p-4 bg-gray-50 mt-2">
                      <h3 className="text-sm font-medium mb-3">
                        Check Participant Availability
                      </h3>
                      <AvailabilityChecker
                        participantEmails={[
                          {
                            name: newParticipantName,
                            email: newParticipantEmail,
                          },
                        ]}
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
                                Conflicts detected. You can still add the
                                participant.
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center text-green-600">
                              <CheckCircle size={16} className="mr-2" />
                              <span>This participant is available!</span>
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
                    onClick={() =>
                      dispatch({
                        type: "TOGGLE_PARTICIPANT_DIALOG",
                        payload: false,
                      })
                    }
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add Participant
                  </Button>
                </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
