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
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import AvailabilityChecker from "@/components/AvailabilityChecker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [hasConflicts, setHasConflicts] = useState(false);
  const [conflictData, setConflictData] = useState<any[]>([]);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

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

  // Show dialog helper function
  const showDialog = (title: string, message: string) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogOpen(true);
  };

  // Function to suggest available times based on participants' calendars
  const suggestAvailableTimes = async () => {
    if (!date || !participants || !duration) {
      showDialog(
        "Missing Information",
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
      showDialog("Error", "Could not fetch suggested times. Please try again.");
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
    timezone?: string;
    user_id?: string | number;
    google_meet_link?: string;
  }

  // Handle availability check results
  const handleAvailabilityChecked = (
    hasScheduleConflicts: boolean,
    conflicts: any[]
  ) => {
    setHasConflicts(hasScheduleConflicts);
    setConflictData(conflicts);
    setAvailabilityChecked(true);

    if (hasScheduleConflicts) {
      console.log("Conflicts detected:", conflicts);
    } else {
      console.log("All participants are available!");
    }
  };

  const onSubmit = async (data: AppointmentFormValues) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");

      if (!token) {
        alert("You must be logged in to create an appointment");
        router.push("/login");
        return;
      }

      // If conflicts were detected, show a confirmation dialog
      if (hasConflicts && availabilityChecked) {
        const proceed = window.confirm(
          "There are scheduling conflicts with some participants. Do you still want to proceed with creating this appointment?"
        );

        if (!proceed) {
          setIsSubmitting(false);
          return;
        }
      }

      // Calculate end time based on duration
      const startDateTime = new Date(`${data.date}T${data.time}`);
      const endDateTime = new Date(
        startDateTime.getTime() + parseInt(data.duration) * 60 * 1000
      );

      // Process participants into an array
      const participantsArray = data.participants
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      // Check if Google Meet link was generated
      let meetingUrl = data.location || "";
      if (
        googleAuth &&
        data.location &&
        data.location.includes("meet.google.com")
      ) {
        meetingUrl = data.location;
      }

      // Prepare the appointment payload
      // Get user's local timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Prepare appointment data
      const appointmentPayload: AppointmentPayload = {
        title: data.title,
        description: data.description || "",
        start_time: `${data.date}T${data.time}:00`,
        end_time: endDateTime.toISOString(),
        location: meetingUrl || "",
        participants: participantsArray,
        status: "upcoming",
        timezone: userTimezone, // Include user's timezone
      };
      console.log("Appointment payload:", appointmentPayload);

      // Make API call to create appointment
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify(appointmentPayload),
        }
      );

      const responseData = await response.json();
      console.log("Appointment creation response:", responseData);

      if (!response.ok) {
        const errorData = responseData;
        throw new Error(errorData.message || "Failed to create appointment");
      }

      console.log("Appointment created successfully");

      // Send email notification to participants via server-side API route
      try {
        console.log("Sending email notification to:", participantsArray);

        // Create proper date and time objects for the email
        const appointmentDate = new Date(data.date);
        const [hours, minutes] = data.time.split(':').map(Number);
        appointmentDate.setHours(hours, minutes, 0, 0);
        
        // Calculate end time based on duration
        const endDate = new Date(appointmentDate);
        const durationInMinutes = parseInt(data.duration, 10);
        endDate.setMinutes(endDate.getMinutes() + durationInMinutes);
        
        // Format the date and time for display in email
        const formattedDate = appointmentDate.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      
        
        const emailResponse = await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: participantsArray,
            subject: `You've been added to "${data.title}" appointment`,
            appointmentTitle: data.title,
            startTime: appointmentDate.toISOString(),
            endTime: endDate.toISOString(),
            location: meetingUrl || "Not specified", // Use the meeting URL which might contain Google Meet link
            description: data.description || "",
            addedAt: new Date().toISOString(), // Include the timestamp when participant was added
            useNodemailer: true, // Flag to use Nodemailer instead of Resend
          }),
        });

        if (!emailResponse.ok) {
          throw new Error(`Email API returned status: ${emailResponse.status}`);
        }

        const emailResult = await emailResponse.json();
        console.log("Email API response:", emailResult);

        if (emailResult.success) {
          console.log("Email notification sent successfully");
        } else if (emailResult.skipped) {
          console.log("Email notification skipped:", emailResult.message);
        } else {
          console.error("Email sending failed:", emailResult.error);
        }
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
        // Don't throw here to avoid breaking the appointment creation flow
      }

      router.push("/appointments");
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Failed to create appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Using Direct OAuth Flow
  const login = useGoogleLogin({
    onSuccess: onSuccess,
    onError: onError,
    scope: "https://www.googleapis.com/auth/calendar",
  });

  function onSuccess(tokenResponse: any) {
    console.log("Google login success", tokenResponse);

    // Store the token in state
    setGoogleAuth({
      access_token: tokenResponse.access_token,
      expires_in: tokenResponse.expires_in,
    });

    // If we already have a specific action in mind (creating Google Meet)
    if (isCreatingMeet) {
      createGoogleMeet({
        access_token: tokenResponse.access_token,
        expires_in: tokenResponse.expires_in,
      });
    }
  }

  // Using implicit flow with direct token return which uses a popup by default
  function onError(error: any) {
    console.log("Google login failed", error);
    setIsCreatingMeet(false);
    alert(
      "Failed to connect with Google. Please check your permissions and try again."
    );
  }

  // Function to create a Google Meet using our API route
  const createGoogleMeet = async (authToken: GoogleAuthResponse) => {
    try {
      setIsCreatingMeet(true);

      // Get the appointment details from the form
      const title = form.getValues("title");
      const description = form.getValues("description") || "";
      const date = form.getValues("date");
      const time = form.getValues("time");
      const duration = parseInt(form.getValues("duration") || "30");

      if (!date || !time) {
        alert("Please select a date and time for the meeting.");
        setIsCreatingMeet(false);
        return;
      }

      // Calculate start and end times
      const startDateTime = new Date(`${date}T${time}`);
      const endDateTime = new Date(
        startDateTime.getTime() + duration * 60 * 1000
      );

      // Format for Google Calendar API
      const startTime = startDateTime.toISOString();
      const endTime = endDateTime.toISOString();

      // Get participants emails (optional for Meet creation)
      let attendees: { email: string }[] = [];
      const participantsValue = form.getValues("participants");
      if (participantsValue) {
        attendees = participantsValue
          .split(",")
          .map((email) => email.trim())
          .filter((email) => email.length > 0)
          .map((email) => ({ email }));
      }

      // Create the meeting
      // We'll use our backend API to create the meeting
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/meetings/create-google-meet`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken.access_token}`,
          },
          body: JSON.stringify({
            title,
            description,
            startTime,
            endTime,
            attendees,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create Google Meet");
      }

      const data = await response.json();

      // Set the Google Meet link in the location field
      if (data.meetLink) {
        form.setValue("location", data.meetLink);
        alert("Google Meet link created successfully!");
      } else {
        throw new Error("No meeting link returned from the API");
      }
    } catch (error) {
      console.error("Error creating Google Meet:", error);
      alert("Failed to create Google Meet. Please try again.");
    } finally {
      setIsCreatingMeet(false);
    }
  };

  // Check token validity helper function to avoid code duplication
  const isTokenValid = (tokenExpiry: string | null): boolean => {
    if (!tokenExpiry) return false;
    return new Date(tokenExpiry) > new Date();
  };

  // Check if we have a valid Google token when component loads
  useEffect(() => {
    const checkGoogleAuth = async () => {
      const storedToken = localStorage.getItem("google_auth_token");
      const tokenExpiry = localStorage.getItem("google_auth_expiry");

      if (storedToken && isTokenValid(tokenExpiry)) {
        setGoogleAuth({ access_token: storedToken });
      }
    };

    checkGoogleAuth();
  }, []);

  // Generate a Google Meet link
  const generateMeetLink = async () => {
    // If we already have a valid Google auth token, use it
    if (googleAuth) {
      await createGoogleMeet(googleAuth);
    } else {
      // Otherwise, start the Google auth flow
      setIsCreatingMeet(true);
      login(); // This will trigger the Google OAuth popup
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-6">Create New Appointment</h1>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Appointment title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <select
                          className="w-full p-2 border rounded"
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
                            placeholder="Email addresses (comma separated)"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Add email addresses separated by commas.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Availability Checker */}
              {form.watch("participants") &&
                form.watch("date") &&
                form.watch("time") &&
                form.watch("duration") && (
                  <div className="border rounded-md p-4 bg-gray-50">
                    <h3 className="text-sm font-medium mb-3">
                      Check Participant Availability
                    </h3>
                    <AvailabilityChecker
                      participantEmails={form.watch("participants")}
                      startTime={
                        new Date(`${form.watch("date")}T${form.watch("time")}`)
                      }
                      endTime={
                        new Date(
                          new Date(
                            `${form.watch("date")}T${form.watch("time")}`
                          ).getTime() +
                            parseInt(form.watch("duration")) * 60 * 1000
                        )
                      }
                      onAvailabilityChecked={handleAvailabilityChecked}
                    />

                    {availabilityChecked && (
                      <div className="mt-3 text-sm">
                        {hasConflicts ? (
                          <div className="flex items-center text-amber-600">
                            <AlertCircle size={16} className="mr-2" />
                            <span>
                              Conflicts detected. You can still create the
                              appointment if needed.
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center text-green-600">
                            <CheckCircle size={16} className="mr-2" />
                            <span>
                              All participants are available at this time!
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

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
                        className="hidden"
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
      </div>
      {/* Dialog for notifications and alerts */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              {dialogTitle}
            </DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
