// Nylas API service integration

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: Date | string;
  end: Date | string;
  participants: Participant[];
  status: 'confirmed' | 'tentative' | 'cancelled';
  videoConferenceUrl?: string;
  calendarId: string;
}

export interface Participant {
  email: string;
  name?: string;
  status?: 'yes' | 'no' | 'maybe' | 'awaiting';
}

export interface Calendar {
  id: string;
  name: string;
  description?: string;
  isPrimary: boolean;
  readOnly: boolean;
}

export interface AvailabilitySlot {
  start: Date;
  end: Date;
}

export interface NylasApiError extends Error {
  status?: number;
  details?: any;
}

// Token management functions
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// API error handling
const handleApiError = (error: any): NylasApiError => {
  console.error('Nylas API error:', error);
  const apiError: NylasApiError = new Error(error.message || 'An error occurred with the Nylas API');
  apiError.status = error.status;
  apiError.details = error.details;
  return apiError;
};

// Base API call function
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const url = `/api/nylas${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw handleApiError(error);
  }

  return response.json();
};

// Connect to Nylas (OAuth flow initiation)
export const connectNylas = async (provider: 'google' | 'outlook' | 'exchange') => {
  try {
    const result = await apiCall('/connect', {
      method: 'POST',
      body: JSON.stringify({ provider }),
    });
    
    // Redirect to Nylas authorization URL
    if (result.authUrl) {
      window.location.href = result.authUrl;
    }
    
    return result;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Check if user is connected to Nylas
export const isNylasConnected = async (): Promise<boolean> => {
  try {
    const result = await apiCall('/status');
    return result.connected;
  } catch (error) {
    return false;
  }
};

// Get all calendars
export const getCalendars = async (): Promise<Calendar[]> => {
  try {
    return await apiCall('/calendars');
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get events for a specific calendar
export const getCalendarEvents = async (
  calendarId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> => {
  try {
    return await apiCall(`/calendars/${calendarId}/events`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      }),
    });
  } catch (error) {
    throw handleApiError(error);
  }
};

// Create a new calendar event
export const createCalendarEvent = async (
  calendarId: string,
  event: Omit<CalendarEvent, 'id' | 'calendarId'>
): Promise<CalendarEvent> => {
  try {
    return await apiCall(`/calendars/${calendarId}/events`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  } catch (error) {
    throw handleApiError(error);
  }
};

// Update an existing calendar event
export const updateCalendarEvent = async (
  calendarId: string,
  eventId: string,
  updates: Partial<CalendarEvent>
): Promise<CalendarEvent> => {
  try {
    return await apiCall(`/calendars/${calendarId}/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  } catch (error) {
    throw handleApiError(error);
  }
};

// Delete a calendar event
export const deleteCalendarEvent = async (
  calendarId: string,
  eventId: string
): Promise<void> => {
  try {
    await apiCall(`/calendars/${calendarId}/events/${eventId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    throw handleApiError(error);
  }
};

// Check free/busy status
export const checkFreeBusy = async (
  emails: string[],
  startTime: Date,
  endTime: Date
): Promise<Record<string, { busy: { start: string; end: string }[] }>> => {
  try {
    return await apiCall('/free-busy', {
      method: 'POST',
      body: JSON.stringify({
        emails,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      }),
    });
  } catch (error) {
    throw handleApiError(error);
  }
};

// Find available meeting times
export const findAvailableTimes = async (
  participants: string[],
  duration: number,
  startDate: Date,
  endDate: Date,
  timezones?: string[]
): Promise<AvailabilitySlot[]> => {
  try {
    return await apiCall('/availability', {
      method: 'POST',
      body: JSON.stringify({
        participants,
        duration_minutes: duration,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        timezones: timezones || undefined,
      }),
    });
  } catch (error) {
    throw handleApiError(error);
  }
};

// Create a meeting with Google Meet
export const createGoogleMeetLink = async (
  title: string,
  startTime: Date,
  endTime: Date
): Promise<string> => {
  try {
    const result = await apiCall('/google-meet', {
      method: 'POST',
      body: JSON.stringify({
        title,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      }),
    });
    return result.meetUrl;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Send email notification for an appointment
export const sendAppointmentNotification = async (
  eventId: string,
  participants: Participant[],
  message?: string
): Promise<void> => {
  try {
    await apiCall('/send-notification', {
      method: 'POST',
      body: JSON.stringify({
        event_id: eventId,
        participants,
        message,
      }),
    });
  } catch (error) {
    throw handleApiError(error);
  }
};

// Export the service as a single object
const nylasService = {
  connectNylas,
  isNylasConnected,
  getCalendars,
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  checkFreeBusy,
  findAvailableTimes,
  createGoogleMeetLink,
  sendAppointmentNotification,
};

export default nylasService;
