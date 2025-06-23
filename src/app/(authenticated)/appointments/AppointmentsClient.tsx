"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Filter,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";

export interface Appointment {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  description?: string;
  location?: string;
  role?: string;
  participants?: { email: string; name?: string }[];
  status?: "upcoming" | "completed" | "canceled";
  created_at?: string;
  user_id?: string;
}

interface AppointmentsClientProps {
  appointments: Appointment[];
  token?: string | null; // Make token optional since we get it from localStorage
}

const filterAppointments = (
  appointments: Appointment[],
  searchQuery: string,
  activeFilter: string
) => {
  let filtered = appointments;
  if (activeFilter !== "all") {
    filtered = filtered.filter((a) => a.status === activeFilter);
  }
  if (searchQuery.trim()) {
    filtered = filtered.filter((appointment) => {
      const searchableText = [
        appointment.title,
        (appointment?.participants ?? []).map((p) => p?.email).join(" "),
        (appointment?.participants ?? []).map((p) => p?.name).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchableText.includes(searchQuery.toLowerCase());
    });
  }
  return filtered;
};

export default function AppointmentsClient({
  appointments,
  token,
}: AppointmentsClientProps) {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(
    null
  );
  const [localAppointments, setLocalAppointments] =
    useState<Appointment[]>(appointments);
  const [loading, setLoading] = useState(false);

  const filteredAppointments = useMemo(
    () => filterAppointments(localAppointments, searchQuery, activeFilter),
    [localAppointments, searchQuery, activeFilter]
  );

  // Function to open delete confirmation dialog
  const openDeleteDialog = (id: string) => {
    setAppointmentToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Delete appointment
  const deleteAppointment = async () => {
    if (!appointmentToDelete) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/embeddings/appointments/${appointmentToDelete}`,
        {
          method: "DELETE",
          headers: {
            "x-auth-token": token || "",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete appointment");
      }
      setLocalAppointments((prev) =>
        prev.filter((a) => a.id !== appointmentToDelete)
      );
      setIsDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    } catch (error) {
      alert("Failed to delete appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your scheduled appointments.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/appointments/new">
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> New Appointment
            </Button>
          </Link>
        </div>
      </div>
      {/* Search and filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-2/6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search appointments..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 flex items-center">
              <Filter className="mr-1 h-4 w-4" /> Filter:
            </span>
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1 text-sm ${
                  activeFilter === "all"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-white text-gray-700"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter("upcoming")}
                className={`px-3 py-1 text-sm ${
                  activeFilter === "upcoming"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-white text-gray-700"
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setActiveFilter("completed")}
                className={`px-3 py-1 text-sm ${
                  activeFilter === "completed"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-white text-gray-700"
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setActiveFilter("cancelled")}
                className={`px-3 py-1 text-sm ${
                  activeFilter === "canceled"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-white text-gray-700"
                }`}
              >
                Canceled
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Appointments list */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredAppointments.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <li key={appointment.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/appointments/${appointment?.id}`}
                      className="block hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium text-blue-600">
                        {appointment?.title}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span>
                          {(() => {
                            // Format date using the user's timezone if available
                            const startDate = new Date(appointment.start_time);
                            const userTimezone = user?.timezone || undefined;

                            try {
                              const dateStr = startDate.toLocaleDateString(
                                undefined,
                                {
                                  timeZone: userTimezone,
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              );

                              const timeStr = startDate.toLocaleTimeString(
                                undefined,
                                {
                                  timeZone: userTimezone,
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              );

                              return `${dateStr} | ${timeStr}`;
                            } catch (e) {
                              // Fallback if timezone is not supported
                              return `${startDate.toLocaleDateString()} | ${startDate.toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}`;
                            }
                          })()}
                        </span>
                        <Clock className="flex-shrink-0 mx-1.5 h-4 w-4 text-gray-400" />
                        <span>
                          {(() => {
                            try {
                              const startTime = new Date(
                                appointment.start_time
                              );
                              const endTime = new Date(appointment.end_time);
                              const durationMs =
                                endTime.getTime() - startTime.getTime();

                              if (isNaN(durationMs) || durationMs < 0) {
                                return "30 mins"; // Default for invalid times
                              }

                              const durationMinutes = Math.round(
                                durationMs / 60000
                              );

                              // Format as hours and minutes for durations >= 60 minutes
                              if (durationMinutes >= 60) {
                                return `${Math.floor(durationMinutes / 60)}h ${
                                  durationMinutes % 60
                                }m`;
                              } else {
                                return `${durationMinutes} mins`;
                              }
                            } catch (e) {
                              return "30 mins"; // Default if parsing fails
                            }
                          })()}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span className="truncate">
                          {appointment?.participants?.length || 0} participant
                          {(appointment?.participants?.length || 0) !== 1
                            ? "s"
                            : ""}
                          {appointment.location && ` • ${appointment.location}`}
                        </span>
                      </div>
                    </Link>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        appointment.status === "upcoming"
                          ? "bg-green-100 text-green-800"
                          : appointment.status === "completed"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {(appointment.status || "upcoming")
                        .charAt(0)
                        .toUpperCase() +
                        (appointment.status || "upcoming").slice(1)}
                    </span>
                    {appointment?.role === "owner" && (
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() => openDeleteDialog(appointment.id)}
                        aria-label="Delete appointment"
                        disabled={loading}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No appointments found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery
                ? "No appointments match your search criteria."
                : activeFilter !== "all"
                ? `You don't have any ${activeFilter} appointments.`
                : "Get started by creating a new appointment."}
            </p>
          </div>
        )}
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this appointment? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteAppointment}
              disabled={loading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
