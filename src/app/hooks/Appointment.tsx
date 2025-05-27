import { useState, useEffect } from 'react';

export interface Appointment {
  id: string;
  title: string;
  start_time: string;  // Changed to match API's snake_case
  end_time: string;    // Changed to match API's snake_case
  description?: string;
  location?: string;
  role?: string;
  participants: string[];
  status?: "upcoming" | "completed" | "canceled";
  created_at?: string;
  user_id?: string;
  raw_metadata?: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    description?: string;
    location?: string;
    role?: string;
    participants: string[];
    status?: "upcoming" | "completed" | "canceled";
    created_at?: string;
    user_id?: string;
  };
}

const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");

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

      const responseData  = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData .message || "Failed to fetch appointments");
      }

      setAppointments(responseData?.data);
      setFilteredAppointments(responseData?.data);
      return responseData ;
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      setError(error.message || 'Failed to fetch appointments');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Function to filter appointments based on search query and/or pre-filtered data
  const filterAppointments = (query: string, preFilteredData?: Appointment[]) => {
    // Use either the provided filtered data or all appointments
    const sourceData = preFilteredData || appointments;
    
    if (!query.trim()) {
      setFilteredAppointments(sourceData);
      return;
    }
    
    const filtered = sourceData.filter((appointment) => {
      const searchableText = [
        appointment.title,
        appointment.description,
        appointment.location,
        // Add other searchable fields
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchableText.includes(query.toLowerCase());
    });
    
    setFilteredAppointments(filtered);
  };

  // Load appointments on mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  return {
    appointments,
    filteredAppointments,
    isLoading,
    error,
    fetchAppointments,
    filterAppointments: filterAppointments as (query: string, preFilteredData?: Appointment[]) => void,
  };
};

export default useAppointments;