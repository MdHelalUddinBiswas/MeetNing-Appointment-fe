"use client";

import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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

export default function NewAppointmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useSuggestions, setUseSuggestions] = useState(false);
  const [suggestedTimes, setSuggestedTimes] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

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
      // In a real implementation, this would call the Nylas API to check availability
      // Simulate API call with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Sample suggested times
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

  const onSubmit = async (data: AppointmentFormValues) => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token || "",
          },
          body: JSON.stringify({
            id: user?.id || 1,
            title: data.title,
            description: data.description,
            start_time: data.date + " " + data.time,
            end_time: data.date + " " + data.time,
            location: data.location,
            participants: data.participants,
            status: "pending",
          }),
        }
      );
      const postData = await response.json();

      if (!response.ok) {
        throw new Error(postData.message || "Signup failed");
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate to appointments page on success
      router.push("/appointments");
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Failed to create appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate a Google Meet link
  const generateMeetLink = () => {
    // In a real implementation, this would call the Google Meet API
    alert("This would generate a Google Meet link in a real implementation.");
    form.setValue("location", "Google Meet (link will be generated)");
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
                    >
                      Generate Google Meet Link
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
