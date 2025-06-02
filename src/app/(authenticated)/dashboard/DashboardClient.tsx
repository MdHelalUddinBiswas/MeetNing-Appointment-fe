"use client";

import Link from "next/link";
import { Calendar, Clock, PlusCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

type UpcomingAppointment = {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  participants: string[];
};

export default function DashboardClient({
  upcomingAppointments,
  appointmentsCount,
}: {
  upcomingAppointments: UpcomingAppointment[];
  appointmentsCount: number;
}) {
  const { user } = useAuth();

  return (
    <div className="space-y-6 mt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back, {user?.name || "User"}!
          </p>
        </div>
        <div className="mt-4 sm:mt-0 space-y-2 sm:space-y-0 sm:space-x-3 flex flex-col sm:flex-row">
          <Link href="/appointments/new">
            <Button className="flex w-full sm:w-auto items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Appointment
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-blue-100">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5">
              <h3 className="text-lg font-medium text-gray-900">
                Upcoming Appointments
              </h3>
              <p className="text-2xl font-bold text-gray-700">
                {upcomingAppointments.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-green-100">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5">
              <h3 className="text-lg font-medium text-gray-900">
                Total Participants
              </h3>
              <p className="text-2xl font-bold text-gray-700">
                {upcomingAppointments.reduce(
                  (total, apt) => total + apt.participants.length,
                  0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-purple-100">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-5">
              <h3 className="text-lg font-medium text-gray-900">
                Meeting Hours
              </h3>
              <p className="text-2xl font-bold text-gray-700">
                {upcomingAppointments.reduce(
                  (total, apt) => total + apt.duration,
                  0
                ) / 60}{" "}
                hrs
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Upcoming Appointments
          </h3>
        </div>
        {upcomingAppointments.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {upcomingAppointments.map((appointment) => (
              <li key={appointment.id} className="px-6 py-4">
                <Link
                  href={`/appointments/${appointment.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-blue-600">
                        {appointment.title}
                      </p>
                      <div className="flex mt-2">
                        <p className="flex items-center text-sm text-gray-500">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {new Date(appointment.date).toLocaleDateString()} |{" "}
                          {appointment.time}
                        </p>
                        <p className="ml-6 flex items-center text-sm text-gray-500">
                          <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {appointment.duration} mins
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        {appointment.participants.length} participant
                        {appointment.participants.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="text-gray-500">No upcoming appointments found.</p>
            <div className="mt-6">
              <Link href="/appointments/new">
                <Button variant="outline" className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Schedule new appointment
                </Button>
              </Link>
            </div>
          </div>
        )}
        {upcomingAppointments.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-3 flex justify-end">
            <Link
              href="/appointments"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View all appointments {appointmentsCount}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
