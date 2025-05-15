"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useGoogleLogin } from "@react-oauth/google";
import {
  Calendar,
  Clock,
  Users,
  BrainCircuit,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";

// Define the form schema with validation rules
const appointmentFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  date: z.string().min(1, {
    message: "Please select a date.",
  }),
  time: z.string().min(1, {
    message: "Please select a time.",
  }),
  duration: z.string().min(1, {
    message: "Please select a duration.",
  }),
  participants: z.string().min(3, {
    message: "Please add at least one participant email.",
  }),
  location: z.string().optional(),
  description: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

// Define the type for Google auth token response for better type safety
interface GoogleAuthResponse {
  access_token: string;
  expires_in?: number;
}

export default function NewAppointmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useSuggestions, setUseSuggestions] = useState(false);
  const [suggestedTimes, setSuggestedTimes] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [googleAuth, setGoogleAuth] = useState<GoogleAuthResponse | null>(null);
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);

  // Initialize form with default values
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      title: "",
      date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
      time: "",
      duration: "30",
      participants: "",
      location: "",
      description: "",
    },
  });

  // Get form field values
  const date = form.watch("date");
  const participants = form.watch("participants");
  const duration = form.watch("duration");

  // Function to suggest available times based on participants' calendars
  const suggestAvailableTimes = async () => {
    if (!date || !participants || !duration) {
      alert(
        "Please enter a date, participants, and duration to get suggested times."
      );
      return;
    }

    setSuggestionsLoading(true);

    try {
      // TODO: Replace this with actual calendar API integration
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Placeholder times - to be replaced with actual available times from API
      const times = ["09:00", "11:30", "14:00", "16:30"];
      setSuggestedTimes(times);
      setUseSuggestions(true);
    } catch (error) {
      console.error("Error fetching suggested times:", error);
      alert("Could not fetch suggested times. Please try again.");
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Select a suggested time
  const selectSuggestedTime = (time: string) => {
    form.setValue("time", time);
  };

  // Define the appointment payload type outside the function for reusability
  interface AppointmentPayload {
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    participants: string[];
    status: string;
    user_id?: string | number;
    google_meet_link?: string;
  }

  const onSubmit = async (data: AppointmentFormValues) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("You're not authenticated. Please login again.");
      }

      // Calculate end time based on duration
      const startDateTime = new Date(`${data.date}T${data.time}`);
      const durationMinutes = parseInt(data.duration);
      const endDateTime = new Date(
        startDateTime.getTime() + durationMinutes * 60000
      );

      // Parse participants into an array of emails
      const participants = data.participants
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      const payload: AppointmentPayload = {
        title: data.title,
        description: data.description || "",
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: data.location || "",
        participants: participants,
        status: "upcoming",
        ...(user?.id && { user_id: user.id }),
        ...(data.location?.includes("meet.google.com") && {
          google_meet_link: data.location,
        }),
      };

      // Use the correct backend API endpoint from environment variables
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const apiUrl = `${API_URL}/appointments`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-auth-token": token, // Include both formats for compatibility
        },
        body: JSON.stringify(payload),
      });

      // Check for non-ok response before parsing JSON to avoid parsing errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Server error: ${response.status} ${response.statusText}`,
        }));
        throw new Error(
          errorData.message || errorData.error || "Failed to create appointment"
        );
      }

      const postData = await response.json();
      router.push("/appointments");
    } catch (error) {
      console.error("Error creating appointment:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to create appointment: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get client ID from environment variables
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Google login handler with Google's OAuth SDK
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      // Store the token response in state
      setGoogleAuth(tokenResponse);

      // Also store in localStorage for persistence
      if (tokenResponse.access_token) {
        localStorage.setItem("googleAccessToken", tokenResponse.access_token);

        // Calculate and store expiry time if available
        if (tokenResponse.expires_in) {
          const expiryTime = Date.now() + tokenResponse.expires_in * 1000;
          localStorage.setItem("googleTokenExpiry", expiryTime.toString());
        }
      }

      // If we were in the middle of creating a meet, continue the process
      if (isCreatingMeet) {
        createGoogleMeet(tokenResponse);
      }
    },
    // Essential scopes for Calendar API
    scope:
      "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
    flow: "implicit", // Using implicit flow with direct token return which uses a popup by default
    onError: (error) => {
      const errorMsg =
        error.error_description || error.error || "Unknown error";
      alert(`Google login failed: ${errorMsg}. Please try again.`);
      setIsCreatingMeet(false);
    },
  });

  // Function to create a Google Meet using our API route
  const createGoogleMeet = async (authToken: GoogleAuthResponse) => {
    try {
      // Show loading state
      form.setValue("location", "Creating Google Meet...");
      setIsCreatingMeet(true);

      // Get form values
      const title = form.getValues("title") || "New Meeting";
      const date = form.getValues("date");
      const time = form.getValues("time") || "12:00";
      const durationMinutes = parseInt(form.getValues("duration") || "30");
      const participantsString = form.getValues("participants") || "";

      if (!date || !time) {
        throw new Error("Please enter a date and time for the meeting");
      }

      // Parse participants into an array of emails
      const attendeeEmails = participantsString
        ? participantsString
            .split(",")
            .map((email) => email.trim())
            .filter((email) => email.length > 0)
        : [];

      // Calculate start and end times
      const startDateTime = new Date(`${date}T${time}`);
      const endDateTime = new Date(
        startDateTime.getTime() + durationMinutes * 60000
      );

      // Get app's JWT authentication token
      const token = localStorage.getItem("token");

      const response = await fetch("/api/nylas/google-meet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          title,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          access_token: authToken.access_token,
          participants: attendeeEmails,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;

        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Response wasn't JSON
          errorData = {
            error: `Server error: ${response.status} ${response.statusText}`,
          };
        }

        throw new Error(
          errorData.error ||
            errorData.message ||
            `Server error: ${response.status}`
        );
      }

      const data = await response.json();

      // Get the meet link from response - check both possible response formats
      const meetLink = data.meetUrl || data.meetLink;

      // Set the Google Meet link in the form
      if (meetLink) {
        form.setValue("location", meetLink);
        return meetLink;
      } else {
        throw new Error("Response did not include a Google Meet link");
      }
    } catch (error) {
      console.error("Error creating Google Meet:", error);
      form.setValue("location", "");

      // Provide a more helpful error message
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Could not create Google Meet: ${errorMessage}. Please try again.`);
      return null;
    } finally {
      setIsCreatingMeet(false);
    }
  };

  // Check token validity helper function to avoid code duplication
  const isTokenValid = (tokenExpiry: string | null): boolean => {
    return tokenExpiry ? parseInt(tokenExpiry) > Date.now() : false;
  };

  // Load stored token on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem("googleAccessToken");
    const tokenExpiry = localStorage.getItem("googleTokenExpiry");
    const validToken = storedToken && isTokenValid(tokenExpiry);

    if (validToken && !googleAuth) {
      setGoogleAuth({ access_token: storedToken });
    }
  }, []);

  // Generate a Google Meet link
  const generateMeetLink = () => {
    // Check for stored Google token and if it's still valid
    const storedToken = localStorage.getItem("googleAccessToken");
    const tokenExpiry = localStorage.getItem("googleTokenExpiry");
    const validToken = storedToken && isTokenValid(tokenExpiry);

    if (validToken && !googleAuth) {
      // We have a valid token in localStorage but not in state
      setGoogleAuth({ access_token: storedToken });
    }

    if (!googleAuth && !validToken) {
      // No valid token available, start the Google login flow
      setIsCreatingMeet(true);

      // Make sure to check if CLIENT_ID is available
      if (!clientId) {
        alert(
          "Google Client ID is not configured. Please contact the administrator."
        );
        setIsCreatingMeet(false);
        return;
      }

      login();
      return;
    }

    // We have authentication, create the Google Meet
    if (googleAuth) {
      createGoogleMeet(googleAuth);
    } else if (validToken && storedToken) {
      createGoogleMeet({ access_token: storedToken });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Appointment</h1>
        <p className="mt-1 text-sm text-gray-600">
          Schedule a new appointment or meeting.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Meeting title" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter a descriptive title for the appointment.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input type="date" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input type="time" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                        <option value="120">2 hours</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participants</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Email addresses, comma separated"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter email addresses separated by commas.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2 mb-4"
                onClick={suggestAvailableTimes}
                disabled={suggestionsLoading}
              >
                <BrainCircuit className="h-4 w-4" />
                {suggestionsLoading
                  ? "Finding available times..."
                  : "Find available times"}
              </Button>

              {useSuggestions && suggestedTimes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Suggested times:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        className={`px-3 py-1 text-sm rounded-full ${
                          form.getValues("time") === time
                            ? "bg-blue-500 text-white"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                        onClick={() => selectSuggestedTime(time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Meeting location or link"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateMeetLink}
                      disabled={isCreatingMeet}
                    >
                      {isCreatingMeet
                        ? "Creating Meet..."
                        : googleAuth
                        ? "Generate Google Meet Link"
                        : "Sign in with Google"}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Add any additional details about the appointment"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/appointments")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Appointment"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div className="bg-blue-50 rounded-lg shadow p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <BrainCircuit className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-blue-800">
              Smart Scheduling
            </h3>
            <p className="mt-2 text-sm text-blue-700">
              MeetNing can analyze participants' calendars to suggest the best
              meeting times based on availability. Simply enter the
              participants' email addresses and click "Find available times".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
