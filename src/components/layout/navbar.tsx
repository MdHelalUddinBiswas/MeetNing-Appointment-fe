"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Calendar, Clock, Settings, User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Clock },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Appointments", href: "/appointments", icon: Calendar },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      {/* Desktop navigation */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <span className="text-2xl font-bold text-blue-600">MeetNing</span>
            </div>
            <nav className="mt-5 flex-1 space-y-1 bg-white px-2">
              {navigation.map((item) => {
                const isCurrentPath = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isCurrentPath
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isCurrentPath ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-300 rounded-full p-1">
                <User className="h-8 w-8 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.name || "User"}</p>
                <div className="flex space-x-3">
                  <Link
                    href="/profile"
                    className="text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <LogOut className="h-3 w-3 mr-1" /> Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <div className="fixed top-0 left-0 right-0 flex items-center justify-between bg-white px-4 py-3 shadow-md">
          <span className="text-xl font-bold text-blue-600">MeetNing</span>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-500 focus:outline-none"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
        
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex bg-black bg-opacity-25" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4" onClick={(e) => e.stopPropagation()}>
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>

              <div className="flex-shrink-0 flex items-center px-4">
                <span className="text-2xl font-bold text-blue-600">MeetNing</span>
              </div>

              <div className="mt-5 flex-1 h-0 overflow-y-auto">
                <nav className="px-2 space-y-1">
                  {navigation.map((item) => {
                    const isCurrentPath = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                          isCurrentPath
                            ? "bg-blue-100 text-blue-600"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon
                          className={`mr-4 h-6 w-6 flex-shrink-0 ${
                            isCurrentPath ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                          }`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gray-300 rounded-full p-1">
                    <User className="h-8 w-8 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">{user?.name || "User"}</p>
                    <div className="flex space-x-3">
                      <Link
                        href="/profile"
                        className="text-xs font-medium text-gray-500 hover:text-gray-700"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          logout();
                        }}
                        className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center"
                      >
                        <LogOut className="h-3 w-3 mr-1" /> Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-14 flex-shrink-0" aria-hidden="true">
              {/* Force sidebar to shrink to fit close icon */}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
