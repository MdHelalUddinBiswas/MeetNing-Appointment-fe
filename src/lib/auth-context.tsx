"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  timezone: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
    timezone: string
  ) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => Promise<void>;
  initGoogleLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on initial load
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");

        if (token) {
          // Fetch user data from the API using the token
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
          } else {
            // Token is invalid or expired
            localStorage.removeItem("token");
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        // Clear token on error
        localStorage.removeItem("token");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();
      console.log("Login response:", response.status, data);

      if (!response.ok) {
        // Simple error handling without verification check
        throw new Error(data.message || "Login failed");
      }

      // Store only the token in localStorage
      localStorage.setItem("token", data.token);

      // Update user state
      setUser(data.user);

      // Navigate to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.log("Login error caught:", err);
      // Set error message for any login error
      setError(err.message || "Login failed");                                                                                                              
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    timezone: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password, timezone }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      // Instead of logging in directly, navigate to OTP verification page
      // We'll store the email temporarily for OTP verification
      localStorage.setItem("pendingVerificationEmail", email);

      // Navigate to OTP verification page
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || "Signup failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      // Clear the pending verification email
      localStorage.removeItem("pendingVerificationEmail");

      // Redirect to login page after successful verification
      router.push("/auth/login?verified=true");
    } catch (err: any) {
      setError(err.message || "OTP verification failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/resend-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();
      console.log("Resend OTP response:", response.status, data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      return data;
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear token from localStorage
    localStorage.removeItem("token");

    // Reset user state
    setUser(null);

    // Navigate to login
    router.push("/auth/login");
  };

  const updateUser = async (updatedUser: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/update-user`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedUser),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update user");
      }

      // Update user state - only if user exists
      if (user) {
        setUser({ ...user, ...updatedUser } as User);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update user");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const initGoogleLogin = () => {
    // Implement Google login initialization
  };

  const value = {
    user,
    setUser,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    signup,
    verifyOtp,
    resendOtp,
    logout,
    updateUser,
    initGoogleLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
