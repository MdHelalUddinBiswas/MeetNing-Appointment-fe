"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Calendar, Clock, Users, Link as LinkIcon, Info } from "lucide-react";
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
  participants: z
    .array(
      z.object({
        name: z.string().min(1, "Name cannot be empty."),
        email: z.string().email("Invalid email address."),
      })
    )
    .min(1, "At least one participant is required."),
  location: z.string().optional(),
  description: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

// Define the type for appointment
interface Appointment {
  data: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    description: string;
    location: string;
    participants: any[];
    status: string;
    user_id?: string | number;
  };
}

export default function EditAppointmentPage() {
  const { user } = useAuth();
  const params = useParams();
  const appointmentId = params.appointmentId as string;
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  // Initialize form
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      title: "",
      date: "",
      time: "",
      duration: "30",
      participants: [{ name: "", email: "" }],
      location: "",
      description: "",
    },
    shouldUnregister: false,
  });

  // Show dialog helper function
  const showDialog = (title: string, message: string) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogOpen(true);
  };

  // Fetch appointment data when the component mounts
  useEffect(() => {
    const fetchAppointment = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/appointments/${appointmentId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-auth-token": token || "",
            },
          }
        );
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Appointment not found"
              : `Failed to fetch appointment details: ${response.status}`
          );
        }
        const responseData = await response.json();
        console.log("API Response:", responseData);

        setAppointment(responseData);
        const data = responseData.data || responseData;

        if (data) {
          const startTime = new Date(data.start_time);
          const formattedDate = startTime.toISOString().split("T")[0];
          const formattedTime = startTime
            .toTimeString()
            .split(" ")[0]
            .slice(0, 5);
          const endTime = new Date(data.end_time);
          const durationInMinutes = Math.round(
            (endTime.getTime() - startTime.getTime()) / (1000 * 60)
          );

          const formattedParticipants = data.participants?.map((p: any) => ({
            name: p.name || "",
            email: p.email || "",
          })) || [{ name: "", email: "" }];

          form.reset({
            title: data.title || "",
            date: formattedDate,
            time: formattedTime,
            duration: durationInMinutes.toString(),
            participants: formattedParticipants,
            location: data.location || "",
            description: data.description || "",
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching appointment:", error);
        showDialog("Error", "Failed to load appointment details.");
        setIsLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId, form]);

  // Handle form submission
  const onSubmit = async (data: AppointmentFormValues) => {
    setIsSubmitting(true);

    try {
      const [hours, minutes] = data.time.split(":").map(Number);
      const startDate = new Date(data.date);
      startDate.setHours(hours, minutes, 0, 0);
      const durationInMinutes = parseInt(data.duration, 10);
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + durationInMinutes);

      const participantsList =  data?.participants.filter(
        (p) => p.email && p.name
      );

      // Prepare update payload
      const updatePayload = {
        title: data.title,
        description: data.description || "",
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        location: data.location || "",
        participants: participantsList,
        status: appointment?.data?.status || "upcoming",
        user_id: appointment?.data?.user_id,
      };
      console.log("Update payload:", updatePayload);

      const token = localStorage.getItem("token");


      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/embeddings/appointments/${appointmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token || "",
          },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update appointment");
      }

      // Success - navigate back to appointment details
      router.push(`/appointments/${appointmentId}`);
    } catch (error) {
      console.error("Error updating appointment:", error);
      showDialog("Error", "Failed to update appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
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
            Loading appointment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Edit Appointment</h1>
          <p className="text-gray-600">
            Update the details of your appointment.
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
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
                        <div className="space-y-2">
                          {field.value.map((participant, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <Input
                                placeholder="Name"
                                value={participant.name}
                                onChange={(e) => {
                                  const updated = [...field.value];
                                  updated[idx].name = e.target.value;
                                  field.onChange(updated);
                                }}
                                className="w-1/3"
                              />
                              <Input
                                placeholder="Email"
                                value={participant.email}
                                onChange={(e) => {
                                  const updated = [...field.value];
                                  updated[idx].email = e.target.value;
                                  field.onChange(updated);
                                }}
                                className="w-2/3"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const updated = field.value.filter(
                                    (_, i) => i !== idx
                                  );
                                  field.onChange(updated);
                                }}
                                disabled={field.value.length === 1}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              field.onChange([
                                ...field.value,
                                { name: "", email: "" },
                              ])
                            }
                          >
                            Add Participant
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Add participant names and emails.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  onClick={() => router.push(`/appointments/${appointmentId}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
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
