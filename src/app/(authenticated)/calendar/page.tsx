import { cookies } from "next/headers";
import CalendarClient, { CalendarEvent } from "./CalendarClient";
import { Suspense } from "react";

async function getAppointments(
  token: string | undefined
): Promise<CalendarEvent[]> {
  if (!token) {
    console.log("No auth token found, cannot fetch appointments.");
    return [];
  }
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/embeddings/appointments`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to parse error response" }));
      console.error(
        "Failed to fetch appointments:",
        response.status,
        errorData.message
      );
      return [];
    }

    const responseData = await response.json();

    if (responseData.success && Array.isArray(responseData.data)) {
      return responseData.data;
    } else {
      console.error("Unexpected response format (server-side):", responseData);
      return [];
    }
  } catch (error) {
    console.error("Error fetching events (server-side):", error);
    return [];
  }
}

export default async function CalendarPage() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("token");
  const token = tokenCookie?.value;

  const initialEvents = await getAppointments(token);

  return (
    <Suspense fallback={<CalendarLoadingSkeleton />}>
      <CalendarClient initialEvents={initialEvents} />
    </Suspense>
  );
}

function CalendarLoadingSkeleton() {
  return (
    <div className="flex h-full items-center justify-center mt-10">
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
