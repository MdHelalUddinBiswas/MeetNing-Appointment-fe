// app/appointments/[appointmentId]/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Appointment, ApiResponse } from './types';
import AppointmentDetailsClient from './appointment-details-client';

interface PageProps {
  params: {
    appointmentId: string;
  };
}

async function getAppointment(appointmentId: string, token: string): Promise<Appointment> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
  
  if (!apiUrl) {
    throw new Error('API URL not configured');
  }

  const response = await fetch(`${apiUrl}/appointments/${appointmentId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
    cache: 'no-store', // Always fetch fresh data for appointments
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication error. Please login again.');
    } else if (response.status === 404) {
      throw new Error('Appointment not found.');
    } else {
      throw new Error(`Server error: ${response.status}`);
    }
  }

  const responseJson: ApiResponse<Appointment> = await response.json();
  
  if (!responseJson.data) {
    throw new Error('Invalid response format. Missing appointment data.');
  }

  return responseJson.data;
}

async function getUserData(token: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
    
    if (!apiUrl) {
      return null;
    }

    const response = await fetch(`${apiUrl}/auth/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const userData = await response.json();
    return userData.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export default async function AppointmentDetailsPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  // Redirect to login if no token
  if (!token) {
    redirect('/login');
  }

  try {
    // Fetch appointment and user data in parallel
    const [appointment, userData] = await Promise.all([
      getAppointment(params.appointmentId, token),
      getUserData(token),
    ]);

    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <AppointmentDetailsClient
          appointment={appointment}
          userTimezone={userData?.timezone}
          userId={userData?.id}
        />
      </div>
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm inline-block">
            {errorMessage}
          </div>
          <div className="mt-6">
            <a
              href="/appointments"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Return to Appointments
            </a>
          </div>
        </div>
      </div>
    );
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return {
      title: 'Appointment Details - Login Required',
      description: 'Please login to view appointment details',
    };
  }

  try {
    const appointment = await getAppointment(params.appointmentId, token);
    const startDate = new Date(appointment.start_time).toLocaleDateString();
    
    return {
      title: `${appointment.title}`,
      description: `Appointment details for ${appointment.title} scheduled for ${startDate}. ${appointment.description || ''}`.substring(0, 160),
    };
  } catch (error) {
    return {
      title: 'Appointment Details',
      description: 'View appointment details and manage participants',
    };
  }
}