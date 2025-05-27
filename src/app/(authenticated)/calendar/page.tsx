"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

type CalendarEvent = {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  start_time: string; // ISO date string
  end_time: string; // ISO date string
  location?: string;
  participants?: any; // Could be string or array or object
  status?: string;
  created_at?: string;
};

type CalendarViewType = "month" | "week" | "day";

export default function CalendarPage() {
  const { user } = useAuth();
  const [viewType, setViewType] = useState<CalendarViewType>("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCalendarConnected, setIsCalendarConnected] =
    useState<boolean>(false);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      // Placeholder data for demo purposes
      setIsCalendarConnected(false);

      // Generate some sample events
      const now = new Date();
      const token = localStorage.getItem("token");
      // Update the fetchEvents function to handle the new response structure
      const fetchEvents = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/embeddings/appointments`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "x-auth-token": token || "",
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message || "Failed to fetch appointments"
            );
          }

          const responseData = await response.json();
          console.log("Fetched appointments:", responseData);

          // Extract the data array from the response
          if (responseData.success && Array.isArray(responseData.data)) {
            setEvents(responseData.data);
          } else {
            // If the format is unexpected, set an empty array
            console.error("Unexpected response format:", responseData);
            setEvents([]);
          }
        } catch (error) {
          console.error("Error fetching events:", error);
          setEvents([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchEvents();

      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Function to navigate to previous/next period based on current view
  const navigatePeriod = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewType === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    } else if (viewType === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  // Format current date range based on view type
  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      year: "numeric",
    };
    if (viewType === "month") {
      return currentDate.toLocaleDateString(undefined, options);
    } else if (viewType === "week") {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
    } else {
      return currentDate.toLocaleDateString();
    }
  };

  // Generate days in month for the calendar view
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    // Calculate the previous month days that appear in the first week
    const prevMonthDays = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      prevMonthDays.push(prevMonthLastDay - i);
    }

    // Current month days
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Calculate next month days to fill the last week
    const totalCells = 42; // 6 rows x 7 days
    const nextMonthDays = Array.from(
      { length: totalCells - prevMonthDays.length - days.length },
      (_, i) => i + 1
    );

    return { prevMonthDays, days, nextMonthDays };
  };

  // Get events for a specific day
  const getEventsForDay = (
    day: number,
    isPrevMonth = false,
    isNextMonth = false
  ) => {
    const year = currentDate.getFullYear();
    const month =
      currentDate.getMonth() + (isPrevMonth ? -1 : isNextMonth ? 1 : 0);
    const targetDate = new Date(year, month, day);

    return events.filter((event) => {
      const eventDate = new Date(event.start_time);
      return (
        eventDate.getFullYear() === targetDate.getFullYear() &&
        eventDate.getMonth() === targetDate.getMonth() &&
        eventDate.getDate() === targetDate.getDate()
      );
    });
  };

  // Render month view calendar
  const renderMonthView = () => {
    const { prevMonthDays, days, nextMonthDays } = getDaysInMonth();
    const today = new Date();
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="mt-6">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="bg-white py-2 text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}

          {/* Previous month days */}
          {prevMonthDays.map((day) => {
            const dayEvents = getEventsForDay(day, true);
            return (
              <div
                key={`prev-${day}`}
                className="bg-white min-h-[100px] p-2 text-gray-400"
              >
                <div className="text-right">{day}</div>
                {dayEvents.map((event) => (
                  <Link
                    href={`/appointments/${event.id}`}
                    key={event.id}
                    className="block mt-1 truncate text-xs bg-gray-100 p-1 rounded text-gray-500"
                  >
                    {new Date(event.start_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    {event.title}
                  </Link>
                ))}
              </div>
            );
          })}

          {/* Current month days */}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isToday =
              today.getDate() === day &&
              today.getMonth() === currentDate.getMonth() &&
              today.getFullYear() === currentDate.getFullYear();

            return (
              <div
                key={`current-${day}`}
                className={`bg-white min-h-[100px] p-2 ${
                  isToday ? "bg-blue-50" : ""
                }`}
              >
                <div
                  className={`text-right ${
                    isToday
                      ? "bg-blue-500 text-white rounded-full w-6 h-6 ml-auto flex items-center justify-center"
                      : ""
                  }`}
                >
                  {day}
                </div>
                {dayEvents.map((event) => (
                  <Link
                    href={`/appointments/${event.id}`}
                    key={event.id}
                    className="block mt-1 truncate text-xs bg-blue-100 p-1 rounded text-blue-700"
                  >
                    {new Date(event.start_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    {event.title}
                  </Link>
                ))}
              </div>
            );
          })}

          {/* Next month days */}
          {nextMonthDays.map((day) => {
            const dayEvents = getEventsForDay(day, false, true);
            return (
              <div
                key={`next-${day}`}
                className="bg-white min-h-[100px] p-2 text-gray-400"
              >
                <div className="text-right">{day}</div>
                {dayEvents.map((event) => (
                  <Link
                    href={`/appointments/${event.id}`}
                    key={event.id}
                    className="block mt-1 truncate text-xs bg-gray-100 p-1 rounded text-gray-500"
                  >
                    {new Date(event.start_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    {event.title}
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });

    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

    return (
      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 gap-px bg-gray-200">
            {/* Empty corner */}
            <div className="bg-white"></div>

            {/* Days of the week */}
            {weekDays.map((day, index) => {
              const today = new Date();
              const isToday =
                day.getDate() === today.getDate() &&
                day.getMonth() === today.getMonth() &&
                day.getFullYear() === today.getFullYear();

              return (
                <div
                  key={index}
                  className={`bg-white py-2 text-center ${
                    isToday ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="text-sm font-medium text-gray-500">
                    {day.toLocaleDateString(undefined, { weekday: "short" })}
                  </div>
                  <div
                    className={`font-medium ${
                      isToday ? "text-blue-600" : "text-gray-900"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>
              );
            })}

            {/* Time slots */}
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                <div className="bg-white p-2 text-right text-xs text-gray-500 border-t border-gray-200">
                  {hour % 12 || 12}
                  {hour < 12 ? "AM" : "PM"}
                </div>

                {/* Day columns */}
                {weekDays.map((day, dayIndex) => {
                  // Get events that overlap with this hour
                  const dayEvents = events.filter((event) => {
                    const eventDay = new Date(event.start_time);
                    return (
                      eventDay.getFullYear() === day.getFullYear() &&
                      eventDay.getMonth() === day.getMonth() &&
                      eventDay.getDate() === day.getDate() &&
                      eventDay.getHours() === hour
                    );
                  });

                  return (
                    <div
                      key={dayIndex}
                      className="bg-white p-1 border-t border-gray-200 relative min-h-[50px]"
                    >
                      {dayEvents.map((event) => (
                        <Link
                          href={`/appointments/${event.id}`}
                          key={event.id}
                          className="block text-xs bg-blue-100 p-1 rounded text-blue-700 absolute inset-x-1"
                          style={{
                            top: "0.25rem",
                            height: `calc(${
                              (new Date(event.end_time).getTime() -
                                new Date(event.start_time).getTime()) /
                              (1000 * 60)
                            }px * 0.8)`,
                            minHeight: "20px",
                          }}
                        >
                          {event.title}
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

    const dayEvents = events.filter((event) => {
      const eventDay = new Date(event.start_time);
      const selectedDay = new Date(currentDate);

      return (
        eventDay.getFullYear() === selectedDay.getFullYear() &&
        eventDay.getMonth() === selectedDay.getMonth() &&
        eventDay.getDate() === selectedDay.getDate()
      );
    });

    return (
      <div className="mt-6">
        <div className="grid grid-cols-1 gap-px bg-gray-200">
          {hours.map((hour) => {
            // Get events that start in this hour
            const hourEvents = dayEvents.filter((event) => {
              return new Date(event.start_time).getHours() === hour;
            });

            return (
              <div
                key={hour}
                className="bg-white flex min-h-[60px] border-t border-gray-200"
              >
                <div className="w-20 p-2 text-right text-sm text-gray-500">
                  {hour % 12 || 12}
                  {hour < 12 ? "AM" : "PM"}
                </div>
                <div className="flex-1 p-1 relative">
                  {hourEvents.map((event) => (
                    <Link
                      href={`/appointments/${event.id}`}
                      key={event.id}
                      className="block bg-blue-100 p-2 rounded text-blue-700 mb-1"
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="text-xs text-blue-600">
                        {new Date(event.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -
                        {new Date(event.end_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {event.location && ` • ${event.location}`}
                      </div>
                      {event.participants && (
                        <div className="text-xs mt-1">With participants</div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
            Loading calendar...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your appointments and schedule.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 space-y-2 sm:space-y-0 sm:space-x-3 flex flex-col sm:flex-row">
          <Link href="/appointments/new">
            <Button className="flex w-full sm:w-auto items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              New Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigatePeriod("prev")}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigatePeriod("next")}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {formatDateRange()}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="ml-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Today
            </button>
          </div>

          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setViewType("month")}
              className={`p-2 ${
                viewType === "month"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-white text-gray-700"
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewType("week")}
              className={`p-2 ${
                viewType === "week"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-white text-gray-700"
              }`}
            >
              <CalendarIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewType("day")}
              className={`p-2 ${
                viewType === "day"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-white text-gray-700"
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Calendar View */}
        {viewType === "month" && renderMonthView()}
        {viewType === "week" && renderWeekView()}
        {viewType === "day" && renderDayView()}
      </div>
    </div>
  );
}
