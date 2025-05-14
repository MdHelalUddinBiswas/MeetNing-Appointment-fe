import { AuthResponse, LoginCredentials, SignupCredentials, User, Appointment, CreateAppointmentPayload, ApiResponse, Calendar } from "../types";

// Base API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const data = await response.json();
  
  if (!response.ok) {
    return { error: data.message || 'An error occurred' };
  }
  
  return { data: data as T };
}

// Helper to attach auth token to requests
function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  return {
    'Content-Type': 'application/json',
    'x-auth-token': token || '',
  };
}

// Authentication API functions
export const authApi = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      return handleResponse<AuthResponse>(response);
    } catch (error) {
      return { error: 'Network error. Please check your connection.' };
    }
  },
  
  async signup(credentials: SignupCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      return handleResponse<AuthResponse>(response);
    } catch (error) {
      return { error: 'Network error. Please check your connection.' };
    }
  },
  
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: getAuthHeaders(),
      });
      
      return handleResponse<User>(response);
    } catch (error) {
      return { error: 'Network error. Please check your connection.' };
    }
  },
  
  async updateProfile(data: { name?: string; timezone?: string }): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      return handleResponse<User>(response);
    } catch (error) {
      return { error: 'Network error. Please check your connection.' };
    }
  },
};

// Appointments API functions
export const appointmentsApi = {
  async getAll(status?: 'upcoming' | 'completed' | 'canceled'): Promise<ApiResponse<Appointment[]>> {
    try {
      let url = `${API_URL}/appointments`;
      if (status) {
        url += `?status=${status}`;
      }
      
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      
      return handleResponse<Appointment[]>(response);
    } catch (error) {
      return { error: 'Network error. Please check your connection.' };
    }
  },
  
  async getById(id: string): Promise<ApiResponse<Appointment>> {
    try {
      const response = await fetch(`${API_URL}/appointments/${id}`, {
        headers: getAuthHeaders(),
      });
      
      return handleResponse<Appointment>(response);
    } catch (error) {
      return { error: 'Network error. Please check your connection.' };
    }
  },
  
  async create(appointment: CreateAppointmentPayload): Promise<ApiResponse<Appointment>> {
    try {
      const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(appointment),
      });
      
      return handleResponse<Appointment>(response);
    } catch (error) {
      return { error: 'Network error. Please check your connection.' };
    }
  },
  
  async update(id: string, appointment: Partial<CreateAppointmentPayload>): Promise<ApiResponse<Appointment>> {
    try {
      const response = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(appointment),
      });
      
      return handleResponse<Appointment>(response);
    } catch (error) {
      return { error: 'Network error. Please check your connection.' };
    }
  },
  
  async updateStatus(id: string, status: 'upcoming' | 'completed' | 'canceled'): Promise<ApiResponse<Appointment>> {
    try {
      const response = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      
      return handleResponse<Appointment>(response);
    } catch (error) {
      return { error: 'Network error. Please check your connection.' };
    }
  },
  
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      return handleResponse<void>(response);
    } catch (error) {
      return { error: 'Network error. Please check your connection.' };
    }
  },
  
  // Helper function to convert our frontend appointment format to backend format
  convertToApiFormat(appointment: {
    title: string;
    date: string;
    time: string;
    duration: number;
    description?: string;
    location?: string;
    participants?: string[];
    status?: 'upcoming' | 'completed' | 'canceled';
  }): CreateAppointmentPayload {
    // Convert date and time strings to ISO format for start_time
    const [year, month, day] = appointment.date.split('-').map(Number);
    const [hours, minutes] = appointment.time.split(':').map(Number);
    
    const start = new Date(year, month - 1, day, hours, minutes);
    const end = new Date(start.getTime() + appointment.duration * 60 * 1000);
    
    return {
      title: appointment.title,
      description: appointment.description,
      location: appointment.location,
      participants: appointment.participants,
      status: appointment.status,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    };
  },
};

// Calendar API functions
export const calendarApi = {
  async getCalendars(): Promise<ApiResponse<Calendar[]>> {
    try {
      const response = await fetch(`${API_URL}/calendars`, {
        headers: getAuthHeaders(),
      });
      
      return handleResponse<Calendar[]>(response);
    } catch (error) {
      return { error: 'Network error. Please check your connection.' };
    }
  },
  
  async connectCalendar(calendarData: { 
    name: string; 
    provider: 'google' | 'outlook' | 'exchange' | 'other';
    accessToken: string;
    refreshToken?: string;
    tokenExpiry?: string;
    description?: string;
  }): Promise<ApiResponse<Calendar>> {
    try {
      const response = await fetch(`${API_URL}/calendars/connect`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(calendarData),
      });
      
      return handleResponse<Calendar>(response);
    } catch (error) {
      return { error: 'Network error. Please check your connection.' };
    }
  },
};
