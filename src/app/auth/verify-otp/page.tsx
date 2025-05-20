"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

// OTP Input component props interface
interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

// OTP Input component
const OtpInput: React.FC<OtpInputProps> = ({ value, onChange, maxLength = 6 }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/\D/g, "");
    if (inputValue.length <= maxLength) {
      onChange(inputValue);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      value={value}
      onChange={handleChange}
      className="w-full text-center py-3 text-xl border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tracking-widest"
      placeholder="Enter OTP"
      maxLength={maxLength}
    />
  );
};

// Inner component that uses searchParams
function VerifyOtpForm() {
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  
  const { verifyOtp, resendOtp, isLoading, error } = useAuth();

  useEffect(() => {
    // Redirect to signup if no email is provided
    if (!email) {
      router.push("/auth/signup");
      return;
    }
    
    // Start countdown for resending OTP
    const timer = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prevCountdown - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage("Email is missing. Please go back to the signup page.");
      setMessageType("error");
      return;
    }
    
    if (!otp || otp.length < 6) {
      setMessage("Please enter a valid 6-digit OTP code.");
      setMessageType("error");
      return;
    }

    try {
      await verifyOtp(email, otp);
      // The redirect to login happens in the verifyOtp function
    } catch (err) {
      // Error is handled in the auth context and displayed below
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;
    
    try {
      await resendOtp(email);
      setMessage("A new OTP has been sent to your email.");
      setMessageType("success");
      setCanResend(false);
      setCountdown(60);
      
      // Restart countdown
      const timer = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);
    } catch (err) {
      // Error is handled in the auth context and displayed below
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a verification code to{" "}
            <span className="font-medium text-blue-600">{email}</span>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="otp" className="sr-only">
                Verification Code
              </label>
              <OtpInput value={otp} onChange={setOtp} maxLength={6} />
            </div>
          </div>

          {(error || message) && (
            <div className={`p-3 rounded-md ${messageType === "error" || error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
              {error || message}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                Back to Sign In
              </Link>
            </div>
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend || isLoading}
              className={`text-sm font-medium ${
                canResend
                  ? "text-blue-600 hover:text-blue-500"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              {canResend ? "Resend OTP" : `Resend in ${countdown}s`}
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !otp}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading || !otp
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              }`}
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
