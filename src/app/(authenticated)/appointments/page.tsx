import AppointmentsClient, { Appointment } from "./AppointmentsClient";
import { cookies } from "next/headers";

async function fetchAppointments(token: string | null): Promise<Appointment[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/embeddings/appointments`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token || "",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data || [];
  } catch {
    return [];
  }
}

export default async function AppointmentsPage() {
  const cookiesList = await cookies();
  const token = cookiesList.get("token")?.value || null;
  const appointments = await fetchAppointments(token);
  return <AppointmentsClient appointments={appointments} token={token} />;
}