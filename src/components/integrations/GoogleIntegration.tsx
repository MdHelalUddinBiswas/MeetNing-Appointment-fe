import React, { useState, useEffect } from "react";
import { Calendar, Video, ExternalLink, Check, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "@/lib/auth-context";

interface GoogleIntegrationProps {
  onSuccess?: () => void;
}

export function GoogleIntegration({ onSuccess }: GoogleIntegrationProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if Google integration is already connected
  useEffect(() => {
    const checkIntegration = async () => {
      if (!user?.id) return;
      
      setIsChecking(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/integration/check/GOOGLE_MEET_AND_CALENDAR`,
          {
            headers: {
              "x-auth-token": token || "",
            },
          }
        );
        
        const data = await response.json();
        setIsConnected(data.isConnected);
      } catch (error) {
        console.error("Failed to check Google integration:", error);
        setError("Unable to check Google integration status");
      } finally {
        setIsChecking(false);
      }
    };

    checkIntegration();
  }, [user?.id]);

  // Handle connect to Google
  const connectGoogle = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/integration/connect/GOOGLE_MEET_AND_CALENDAR`,
        {
          headers: {
            "x-auth-token": token || "",
          },
        }
      );
      
      const data = await response.json();
      
      if (data.url) {
        // Redirect to Google OAuth flow
        window.location.href = data.url;
      } else {
        throw new Error("No authorization URL returned");
      }
    } catch (error) {
      console.error("Failed to start Google OAuth flow:", error);
      setError("Failed to connect to Google. Please try again.");
      setIsConnecting(false);
    }
  };

  // Handle disconnecting Google integration
  const disconnectGoogle = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/integration/disconnect/GOOGLE_MEET_AND_CALENDAR`,
        {
          method: "DELETE",
          headers: {
            "x-auth-token": token || "",
          },
        }
      );
      
      setIsConnected(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to disconnect Google integration:", error);
      setError("Failed to disconnect from Google. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle refreshing integration status
  const refreshStatus = () => {
    setIsChecking(true);
    setError(null);
    
    // Re-run the checkIntegration effect
    const checkIntegration = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/integration/check/GOOGLE_MEET_AND_CALENDAR`,
          {
            headers: {
              "x-auth-token": token || "",
            },
          }
        );
        
        const data = await response.json();
        setIsConnected(data.isConnected);
        if (data.isConnected && onSuccess) onSuccess();
      } catch (error) {
        console.error("Failed to check Google integration:", error);
        setError("Unable to check Google integration status");
      } finally {
        setIsChecking(false);
      }
    };

    checkIntegration();
  };

  // Check if we've just returned from OAuth flow
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('app_type') === 'google') {
      // We've returned from Google OAuth flow
      const success = urlParams.get('success');
      const errorMsg = urlParams.get('error');
      
      if (success === 'true') {
        setIsConnected(true);
        if (onSuccess) onSuccess();
      } else if (errorMsg) {
        setError(`Google connection failed: ${errorMsg}`);
      }
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [onSuccess]);

  return (
    <div className="bg-gray-50 p-4 rounded-md">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-md font-medium text-gray-900">Google Meet & Calendar</h3>
          <p className="mt-1 text-sm text-gray-600">
            Connect your Google account to create Meet links and sync appointments with Google Calendar.
          </p>
        </div>
        
        {isConnected && (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            <Check className="mr-1 h-3 w-3" />
            Connected
          </span>
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      
      <div className="mt-4 flex gap-2">
        {isConnected ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectGoogle}
              disabled={isConnecting}
            >
              Disconnect
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStatus}
              disabled={isChecking}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              {isChecking ? "Checking..." : "Refresh"}
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={connectGoogle}
            disabled={isConnecting || isChecking}
          >
            {isConnecting ? (
              "Connecting..."
            ) : (
              <>
                <Calendar className="h-4 w-4" />
                <Video className="h-4 w-4" />
                <span>Connect Google Meet & Calendar</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </>
            )}
          </Button>
        )}
      </div>
      
      {isConnected && (
        <div className="mt-3 text-xs text-gray-500">
          Your Google account is connected. You can now create Google Meet links and sync with Google Calendar.
        </div>
      )}
    </div>
  );
}
