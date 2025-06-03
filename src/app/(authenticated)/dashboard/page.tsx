import { cookies } from "next/headers";
import DashboardClient from "./DashboardClient";

// Define types
type Participant = string | { email: string } | { email?: string };

type UpcomingAppointment = {
  id: string;
  title: string;
  startTime: string; // ISO string for timezone support
  endTime: string;   // ISO string for timezone support
  date: string;
  time: string;
  duration: number;
  participants: string[];
};

type Appointment = {
  id: string;
  title?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  participants?: any[];
  raw_metadata?: {
    title?: string;
    start_time?: string;
    end_time?: string;
    status?: string;
    participants?: any[];
    duration_minutes?: number;
  };
};

async function getAppointments() {
  try {
    // Get token from cookies - in this Next.js version, cookies() returns a Promise
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      console.error("No authentication token found");
      return { appointments: [], error: "No authentication token" };
    }

    // Fetch appointments from API
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
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    const appointments = data?.data || [];

    return { appointments, error: null };
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return {
      appointments: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Process appointments to filter upcoming ones and format them for the dashboard
function processAppointments(
  appointments: Appointment[]
): UpcomingAppointment[] {
  if (!appointments || appointments.length === 0) {
    return [];
  }

  const processedAppointments = appointments
    .filter((apt) => {
      // Check if appointment has raw_metadata and extract status from it
      const status = apt.raw_metadata?.status || apt.status;
      return !status || status === "upcoming";
    })
    .map((apt) => {
      try {
        // Handle API's snake_case properties
        const startTime = apt.raw_metadata?.start_time || apt.start_time || "";
        const endTime = apt.raw_metadata?.end_time || apt.end_time || "";
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);

        // Skip invalid dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return null;
        }

        // Extract participants from raw_metadata if available
        let participants: string[] = [];
        if (apt.raw_metadata?.participants) {
          participants = Array.isArray(apt.raw_metadata.participants)
            ? (apt.raw_metadata.participants as Participant[])
                .map((p) => (typeof p === "string" ? p : p?.email || ""))
                .filter(Boolean)
            : [];
        } else if (apt.participants) {
          participants = Array.isArray(apt.participants)
            ? apt.participants
            : [];
        }

        let duration = 30;

        if (apt.raw_metadata && "duration_minutes" in apt.raw_metadata) {
          duration = apt.raw_metadata.duration_minutes as number;
        } else {
          try {
            const startMs = startDate.getTime();
            const endMs = endDate.getTime();
            const durationMs = endMs - startMs;

            if (!isNaN(durationMs) && durationMs > 0) {
              duration = Math.round(durationMs / 60000);

              if (duration < 1) {
                duration = 30;
              }
            }
          } catch (e) {
            console.error("Error calculating duration:", e);
          }
        }

        return {
          id: apt.id,
          title: apt.raw_metadata?.title || apt.title,
          // Pass ISO strings for proper timezone handling in client component
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          // Keep the old format for backwards compatibility
          date: startDate.toISOString().split("T")[0],
          time: startDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          duration, // Use the properly calculated duration
          participants: participants,
        };
      } catch (e) {
        console.error("Error processing appointment:", e);
        return null;
      }
    });

  // Filter out nulls
  return processedAppointments.filter(
    (apt): apt is UpcomingAppointment => apt !== null
  );
}

export default async function DashboardPage() {
  const { appointments, error } = await getAppointments();
  const upcomingAppointments = processAppointments(appointments);
  console.log("upcomingAppointments", upcomingAppointments);
  return (
    <DashboardClient
      upcomingAppointments={upcomingAppointments}
      appointmentsCount={appointments.length}
    />
  );
}
