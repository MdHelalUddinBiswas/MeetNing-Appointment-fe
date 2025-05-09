// User related types
export interface User {
  id: number;
  name: string;
  email: string;
  timezone?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  timezone?: string;
}

// Appointment related types
export interface Participant {
  name: string;
  email: string;
}

export interface Appointment {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  start_time: string; // ISO string format
  end_time: string; // ISO string format
  created_at: string;
  status?: "upcoming" | "completed" | "canceled";
  participants?: Participant[];
  location?: string;
}

export interface CreateAppointmentPayload {
  title: string;
  description?: string;
  start_time: string; // ISO string format
  end_time: string; // ISO string format
  participants?: Participant[];
  location?: string;
  status?: "upcoming" | "completed" | "canceled";
}

// Calendar related types
export interface Calendar {
  id: string;
  name: string;
  description?: string;
  provider: "google" | "outlook" | "exchange" | "other";
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  start: string; // ISO string format
  end: string; // ISO string format
  location?: string;
  participants?: string[];
  isAllDay?: boolean;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Time slot for availability
export interface TimeSlot {
  start: string; // ISO string format
  end: string; // ISO string format
  available: boolean;
}

// Availability response from API
export interface AvailabilityResponse {
  date: string;
  timeSlots: TimeSlot[];
}
