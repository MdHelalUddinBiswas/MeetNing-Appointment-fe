"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfWeek,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  participants: string[];
  location?: string;
  description?: string;
  isAllDay?: boolean;
  color?: string;
}

interface CalendarViewProps {
  view: "day" | "week" | "month";
  currentDate: Date;
  events?: CalendarEvent[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({
  view,
  currentDate,
  events = [],
}: CalendarViewProps) {
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  useEffect(() => {
    if (view === "day") {
      setCalendarDays([currentDate]);
    } else if (view === "week") {
      const start = startOfWeek(currentDate);
      setCalendarDays(Array.from({ length: 7 }, (_, i) => addDays(start, i)));
    } else if (view === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const startDate = startOfWeek(monthStart);
      const endDate = startOfWeek(addDays(monthEnd, 7));

      setCalendarDays(eachDayOfInterval({ start: startDate, end: endDate }));
    }
  }, [view, currentDate]);

  const fetchEvents = async () => {
    return [
      {
        id: "1",
        title: "Team Meeting",
        start: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          10,
          0
        ),
        end: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          11,
          0
        ),
        participants: ["john@example.com", "emma@example.com"],
        location: "Conference Room A",
        color: "bg-blue-500",
      },
      {
        id: "2",
        title: "Product Demo",
        start: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          14,
          0
        ),
        end: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          15,
          30
        ),
        participants: ["client@example.com", "sales@example.com"],
        location: "Google Meet",
        color: "bg-green-500",
      },
    ];
  };

  // Render appropriate calendar view based on the selected view
  if (view === "day") {
    return (
      <div className="day-view h-[600px] overflow-y-auto">
        <div className="text-center mb-4">
          <h3 className="text-lg font-medium">
            {format(currentDate, "EEEE, MMMM d, yyyy")}
          </h3>
        </div>
        <div className="day-hours space-y-4 relative">
          {HOURS.map((hour) => (
            <div key={hour} className="hour-slot flex">
              <div className="time-label w-16 text-right pr-2 text-gray-500 text-sm">
                {hour === 0
                  ? "12 AM"
                  : hour < 12
                  ? `${hour} AM`
                  : hour === 12
                  ? "12 PM"
                  : `${hour - 12} PM`}
              </div>
              <div className="event-container flex-1 min-h-[60px] border-b border-gray-200 relative hover:bg-gray-50">
                {/* Events would be positioned here using absolute positioning */}
                {/* This is a placeholder for demo purposes */}
                {hour === 10 && (
                  <div className="absolute inset-x-0 top-0 h-[60px] bg-blue-100 border-l-4 border-blue-500 rounded-r-md p-1 overflow-hidden">
                    <div className="text-sm font-medium">Team Meeting</div>
                    <div className="text-xs text-gray-500">
                      10:00 - 11:00 AM
                    </div>
                  </div>
                )}
                {hour === 14 && (
                  <div className="absolute inset-x-0 top-0 h-[90px] bg-green-100 border-l-4 border-green-500 rounded-r-md p-1 overflow-hidden">
                    <div className="text-sm font-medium">Product Demo</div>
                    <div className="text-xs text-gray-500">2:00 - 3:30 PM</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === "week") {
    return (
      <div className="week-view h-[600px] overflow-y-auto">
        <div className="grid grid-cols-8 border-b">
          <div className="border-r border-gray-200 p-2"></div>
          {DAYS_OF_WEEK.map((day, index) => {
            const date = calendarDays[index];
            return (
              <div
                key={index}
                className="border-r border-gray-200 p-2 text-center"
              >
                <div className="text-sm font-medium">{day}</div>
                <div
                  className={`text-sm rounded-full w-7 h-7 flex items-center justify-center mx-auto mt-1 ${
                    isSameDay(date, new Date()) ? "bg-blue-500 text-white" : ""
                  }`}
                >
                  {format(date, "d")}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-8">
          <div className="hours-column">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="time-label h-16 text-right pr-2 text-gray-500 text-sm border-b border-gray-200"
              >
                {hour === 0
                  ? "12 AM"
                  : hour < 12
                  ? `${hour} AM`
                  : hour === 12
                  ? "12 PM"
                  : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {calendarDays.map((day, dayIndex) => (
            <div key={dayIndex} className="day-column flex-1">
              {HOURS.map((hour) => (
                <div
                  key={`${dayIndex}-${hour}`}
                  className="h-16 border-b border-r border-gray-200 relative hover:bg-gray-50"
                >
                  {/* Events specific to this day and hour would be rendered here */}
                  {dayIndex === 0 && hour === 10 && (
                    <div className="absolute inset-x-0 top-0 h-[64px] bg-blue-100 border-l-4 border-blue-500 rounded-r-md p-1 overflow-hidden">
                      <div className="text-xs font-medium">Team Meeting</div>
                      <div className="text-xs text-gray-500">
                        10:00 - 11:00 AM
                      </div>
                    </div>
                  )}
                  {dayIndex === 1 && hour === 14 && (
                    <div className="absolute inset-x-0 top-0 h-[96px] bg-green-100 border-l-4 border-green-500 rounded-r-md p-1 overflow-hidden">
                      <div className="text-xs font-medium">Product Demo</div>
                      <div className="text-xs text-gray-500">
                        2:00 - 3:30 PM
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Month view
  const totalDays = calendarDays.length;
  const numWeeks = Math.ceil(totalDays / 7);

  return (
    <div className="month-view">
      <div className="grid grid-cols-7 gap-px">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}

        {calendarDays.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={i}
              className={`min-h-[100px] p-2 border border-gray-200 ${
                isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"
              } ${isToday ? "bg-blue-50" : ""}`}
            >
              <div
                className={`text-right ${
                  isToday
                    ? "bg-blue-500 text-white rounded-full w-7 h-7 ml-auto flex items-center justify-center"
                    : ""
                }`}
              >
                {format(day, "d")}
              </div>

              {/* Sample events for demo purposes */}
              {isCurrentMonth && i % 5 === 0 && (
                <div className="mt-1 text-xs bg-blue-100 p-1 rounded border-l-2 border-blue-500 truncate">
                  9:00 AM - Team Meeting
                </div>
              )}
              {isCurrentMonth && i % 7 === 3 && (
                <div className="mt-1 text-xs bg-green-100 p-1 rounded border-l-2 border-green-500 truncate">
                  2:00 PM - Product Demo
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
