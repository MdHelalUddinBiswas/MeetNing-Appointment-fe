// types.ts
export type AppointmentStatus = "upcoming" | "completed" | "canceled" | "pending";

export interface Participant {
  email: string;
  name?: string;
}

export interface Appointment {
  id: string | number;
  title: string;
  start_time: string;
  end_time: string;
  participants: Participant[];
  location: string;
  role: string;
  description: string;
  status: AppointmentStatus;
  created_at?: string;
  user_id?: number;
}

export interface AppointmentDetailsProps {
  appointment: Appointment;
  userTimezone?: string;
  userId?: number;
}

export interface State {
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

export type Action =
  | { type: "FETCH_INIT" }
  | { type: "FETCH_SUCCESS"; payload: Appointment }
  | { type: "FETCH_FAILURE"; payload: string }
  | { type: "SET_APPOINTMENT"; payload: Appointment }
  | { type: "SET_STATUS"; payload: AppointmentStatus }
  | { type: "TOGGLE_PARTICIPANT_DIALOG"; payload: boolean }
  | {
      type: "SET_PARTICIPANT_FIELD";
      payload: { field: "email" | "name"; value: string };
    }
  | { type: "TOGGLE_DELETE_CONFIRM"; payload: boolean }
  | { type: "SET_AVAILABILITY_CHECKED"; payload: { hasConflicts: boolean } }
  | { type: "RESET_PARTICIPANT_FORM" }
  | { type: "SET_ERROR"; payload: string | null };

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}