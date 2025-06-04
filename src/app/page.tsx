import Link from "next/link";
import { Calendar, Clock, Users, BrainCircuit, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("token");

  if (tokenCookie) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-600">MeetNing</span>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Log in
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl sm:tracking-tight md:text-6xl md:tracking-tight">
                <span className="block">Smart Appointment</span>
                <span className="block text-blue-600">Scheduling with AI</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600">
                MeetNing uses AI to understand your schedule and preferences,
                making appointment scheduling effortless. Connect your calendar,
                invite participants, and let our smart assistant find the
                perfect time slot.
              </p>
              <div className="mt-10 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link href="/auth/signup">
                    <Button size="lg">Get started for free</Button>
                  </Link>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <Link href="/auth/login">
                    <Button variant="outline" size="lg">
                      Sign in
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <div className="relative h-64 sm:h-72 md:h-96 bg-blue-100 rounded-lg shadow-lg overflow-hidden">
                {/* Placeholder for dashboard screenshot */}
                <div className="flex items-center justify-center h-full">
                  <Calendar className="w-24 h-24 text-blue-500 opacity-50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Scheduling made simple
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-gray-600 mx-auto">
              Our intuitive platform makes it easy to manage your time and
              coordinate with others.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-blue-50 p-6 rounded-lg shadow">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Calendar className="h-6 w-6" />
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-gray-900">
                    Calendar Integration
                  </h3>
                  <p className="mt-2 text-base text-gray-600">
                    Connect with Google Calendar, Outlook, and other providers
                    to automatically sync your existing schedules.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-blue-50 p-6 rounded-lg shadow">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-gray-900">
                    Smart Scheduling
                  </h3>
                  <p className="mt-2 text-base text-gray-600">
                    Our AI analyzes everyone's availability to suggest the best
                    meeting times based on preferences and past behavior.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-blue-50 p-6 rounded-lg shadow">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Video className="h-6 w-6" />
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-gray-900">
                    Video Conferencing
                  </h3>
                  <p className="mt-2 text-base text-gray-600">
                    Automatically generate Google Meet links for your
                    appointments, making virtual meetings seamless.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="bg-blue-50 p-6 rounded-lg shadow">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Users className="h-6 w-6" />
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-gray-900">
                    Team Coordination
                  </h3>
                  <p className="mt-2 text-base text-gray-600">
                    Schedule meetings with multiple participants, while
                    respecting everyone's availability and preferences.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="bg-blue-50 p-6 rounded-lg shadow">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Clock className="h-6 w-6" />
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-gray-900">
                    Automatic Reminders
                  </h3>
                  <p className="mt-2 text-base text-gray-600">
                    Send customized notifications to all participants before
                    meetings to ensure everyone is prepared.
                  </p>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="bg-blue-50 p-6 rounded-lg shadow">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium text-gray-900">
                    Time Zone Intelligence
                  </h3>
                  <p className="mt-2 text-base text-gray-600">
                    MeetNing automatically handles time zone differences,
                    displaying times in each participant's local zone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-blue-200">
              Sign up today and start scheduling smarter.
            </span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-200 pt-8 md:flex md:items-center md:justify-between">
            <div className="flex space-x-6 md:order-2">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Privacy Policy</span>
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Terms of Service</span>
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Contact</span>
                Contact
              </a>
            </div>
            <p className="mt-8 text-base text-gray-400 md:mt-0 md:order-1">
              &copy; 2025 MeetNing. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
