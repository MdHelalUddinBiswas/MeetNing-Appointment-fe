"use client";

import React, { useState, useEffect } from "react";
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
import { useAuth } from "@/lib/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useAppointments, { Appointment } from "../../hooks/Appointment";

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(
    null
  );

  // Use the custom hook to handle appointment data fetching
  const {
    appointments,
    filteredAppointments,
    isLoading,
    error,
    fetchAppointments,
    filterAppointments,
  } = useAppointments();

  useEffect(() => {
    filterAppointments(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    // First filter by status if needed
    let statusFiltered = appointments;
    if (activeFilter !== "all") {
      statusFiltered = appointments.filter(
        (appointment) => appointment.status === activeFilter
      );
    }

    // Then apply search filter on the status-filtered results
    filterAppointments(searchQuery, statusFiltered);
  }, [activeFilter, appointments, searchQuery]);

  // Function to open delete confirmation dialog
  const openDeleteDialog = (id: string) => {
    setAppointmentToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Delete appointment
  const deleteAppointment = async () => {
    if (!appointmentToDelete) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments/${appointmentToDelete}`,
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

      // Close dialog and refresh appointments after deletion
      setIsDeleteDialogOpen(false);
      fetchAppointments();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      alert("Failed to delete appointment");
    }
  };

  console.log(filteredAppointments);

  if (isLoading) {
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
            Loading appointments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              <PlusCircle className="h-4 w-4" />
              New Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-64">
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
              <Filter className="mr-1 h-4 w-4" />
              Filter:
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
                onClick={() => setActiveFilter("canceled")}
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
                      href={`/appointments/${appointment.id}`}
                      className="block hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium text-blue-600">
                        {appointment.title}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span>
                          {new Date(
                            appointment.start_time
                          ).toLocaleDateString()}{" "}
                          |{" "}
                          {new Date(appointment.start_time).toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                        <Clock className="flex-shrink-0 mx-1.5 h-4 w-4 text-gray-400" />
                        <span>
                          {Math.round(
                            (new Date(appointment.end_time).getTime() -
                              new Date(appointment.start_time).getTime()) /
                              60000
                          )}{" "}
                          minutes
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span className="truncate">
                          {appointment.participants?.length || 0} participant
                          {(appointment.participants?.length || 0) !== 1
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
            <div className="mt-6">
              <Link href="/appointments/new">
                <Button variant="outline" className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  New Appointment
                </Button>
              </Link>
            </div>
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
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteAppointment}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
