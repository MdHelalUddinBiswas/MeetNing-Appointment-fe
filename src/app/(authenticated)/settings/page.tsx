"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { User, Bell, Save, Trash2, Link as LinkIcon } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  timezone: z.string(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form for profile settings
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      timezone:
        user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  // Update form when user data is loaded
  useEffect(() => {
    if (user) {
      form.setValue("name", user.name);
      form.setValue("email", user.email);
      form.setValue(
        "timezone",
        user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      );
    }
  }, [user, form]);

  // Handle profile form submission
  const onSubmitProfile = async (data: ProfileFormValues) => {
    setIsLoading(true);
    setSaveSuccess(false);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/update-profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSaveSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/delete`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ userId: user?.id }),
        }
      );

      if (response.ok) {
        // Clear token from localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("googleAccessToken");

        // Redirect to login page
        window.location.href = "/auth/login";
      } else {
        console.error(
          "Failed to delete account, server responded with:",
          response.status
        );
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("profile")}
            className={`${
              activeTab === "profile"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } 
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`${
              activeTab === "notifications"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } 
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </button>
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900">
            Profile Information
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Update your personal information.
          </p>

          {saveSuccess && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              Profile updated successfully!
            </div>
          )}

          <div className="mt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmitProfile)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="johndoe@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This is the email you use to log in.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Zone</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormDescription>
                        We'll use this to display times in your local time zone.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? "Saving..." : "Save changes"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900">
            Notification Preferences
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage how you receive notifications about appointments.
          </p>

          <div className="mt-6 space-y-6">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="email-notifications"
                  name="email-notifications"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  defaultChecked
                />
              </div>
              <div className="ml-3 text-sm">
                <label
                  htmlFor="email-notifications"
                  className="font-medium text-gray-700"
                >
                  Email notifications
                </label>
                <p className="text-gray-500">
                  Receive email notifications when appointments are scheduled,
                  updated, or canceled.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="daily-summary"
                  name="daily-summary"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label
                  htmlFor="daily-summary"
                  className="font-medium text-gray-700"
                >
                  Daily summary
                </label>
                <p className="text-gray-500">
                  Receive a daily email summarizing your upcoming appointments.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="reminder-notifications"
                  name="reminder-notifications"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  defaultChecked
                />
              </div>
              <div className="ml-3 text-sm">
                <label
                  htmlFor="reminder-notifications"
                  className="font-medium text-gray-700"
                >
                  Reminder notifications
                </label>
                <p className="text-gray-500">
                  Receive reminder notifications before your scheduled
                  appointments.
                </p>
              </div>
            </div>

            <Button type="button" className="flex items-center gap-2 mt-6">
              <Save className="h-4 w-4" />
              Save preferences
            </Button>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-red-50 shadow rounded-lg p-6 mt-8">
        <h2 className="text-lg font-medium text-red-800">Danger Zone</h2>
        <p className="mt-1 text-sm text-red-600">
          Permanently delete your account and all associated data.
        </p>
        <div className="mt-4">
          <Dialog>
            <DialogTrigger>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </DialogDescription>
              <DialogFooter>
                <DialogTrigger asChild>
                  <Button className="hover:cursor-pointer">Cancel</Button>
                </DialogTrigger>

                <DialogTrigger asChild>
                  <Button
                    className="hover:cursor-pointer"
                    onClick={handleDeleteAccount}
                    variant="destructive"
                  >
                    Delete Account
                  </Button>
                </DialogTrigger>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
