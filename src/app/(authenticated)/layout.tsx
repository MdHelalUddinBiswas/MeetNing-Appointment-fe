"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { useAuth } from "@/lib/auth-context";
import dynamic from "next/dynamic";

// Dynamically import ChatWidget with no SSR to avoid hydration issues
const ChatWidget = dynamic(() => import('@/components/ChatWidget'), {
  ssr: false,
});

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if explicitly not authenticated AND not loading
    // This prevents redirect loops during page refreshes
    if (
      !isLoading &&
      !isAuthenticated &&
      typeof window !== "undefined" &&
      !localStorage.getItem("token") &&
      !localStorage.getItem("googleAccessToken")
    ) {
      // Double-check tokens as fallback before redirecting
      console.log("No auth tokens found, redirecting to login");
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
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
          <p className="mt-4 text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Check for tokens directly as a fallback
  const hasToken =
    typeof window !== "undefined" && localStorage.getItem("token");

  // Only hide content if definitely not authenticated (no user AND no tokens)
  if (!hasToken) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />

      {/* Content area - fixed sidebar width with scrollable content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar space */}
        <div className="hidden md:block md:w-64 flex-shrink-0"></div>
        
        {/* Main content - scrollable */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <div className="py-4">{children}</div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
