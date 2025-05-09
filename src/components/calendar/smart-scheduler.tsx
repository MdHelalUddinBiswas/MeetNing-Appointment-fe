"use client";

import { useState } from "react";
import { format, addDays, setHours, setMinutes } from "date-fns";
import { Calendar, Clock, Users, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import nylasService from "@/lib/api/nylas-service";

interface SmartSchedulerProps {
  onTimeSelected?: (start: Date, end: Date) => void;
}

interface AvailabilitySlot {
  start: Date;
  end: Date;
  score?: number; // Higher score means better slot (e.g., more participants available)
}

interface Participant {
  email: string;
  name?: string;
}

export function SmartScheduler({ onTimeSelected }: SmartSchedulerProps) {
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [duration, setDuration] = useState(30); // minutes
  const [durationInput, setDurationInput] = useState("30");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedSlots, setSuggestedSlots] = useState<AvailabilitySlot[]>([]);
  const [error, setError] = useState("");
  const [processingText, setProcessingText] = useState("");
  const [success, setSuccess] = useState(false);

  // Process natural language input
  const processNaturalLanguage = async () => {
    if (!naturalLanguageInput.trim()) {
      setError("Please enter a meeting description");
      return;
    }

    setIsLoading(true);
    setError("");
    setProcessingText("Processing your request...");
    setSuggestedSlots([]);
    setSuccess(false);

    try {
      // In a real implementation, this would call a backend NLP service
      // to extract meeting details from natural language input
      // For demo purposes, we'll use some basic parsing logic

      // Mock NLP processing
      setTimeout(() => {
        setProcessingText("Identifying participants...");
      }, 500);

      setTimeout(() => {
        setProcessingText("Analyzing calendars...");
      }, 1000);

      setTimeout(() => {
        setProcessingText("Finding optimal meeting times...");
      }, 1500);

      // Extract participants (this is a very simplified implementation)
      const emailPattern = /[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/g;
      const extractedEmails = naturalLanguageInput.match(emailPattern) || [];
      
      // Extract duration
      const durationPattern = /(\d+)\s*(min|minute|minutes|hour|hours|hr|hrs)/i;
      const durationMatch = naturalLanguageInput.match(durationPattern);
      let extractedDuration = 30; // default 30 minutes
      
      if (durationMatch) {
        const value = parseInt(durationMatch[1]);
        const unit = durationMatch[2].toLowerCase();
        
        if (!isNaN(value)) {
          if (unit.startsWith('hour') || unit === 'hr' || unit === 'hrs') {
            extractedDuration = value * 60;
          } else {
            extractedDuration = value;
          }
        }
      }
      
      // Update state with extracted information
      if (extractedEmails.length > 0) {
        setParticipants(extractedEmails);
      }
      
      if (extractedDuration !== duration) {
        setDuration(extractedDuration);
        setDurationInput(extractedDuration.toString());
      }
      
      // Generate suggested time slots
      // For a real implementation, this would use the nylasService.findAvailableTimes API
      setTimeout(() => {
        // Mock suggested time slots
        const now = new Date();
        const startOfDay = setHours(setMinutes(now, 0), 9); // 9:00 AM
        
        const mockSlots: AvailabilitySlot[] = [
          {
            start: addDays(startOfDay, 1),
            end: addDays(setHours(setMinutes(now, 0), 9 + Math.floor(extractedDuration / 60)), 1),
            score: 100
          },
          {
            start: addDays(setHours(setMinutes(now, 0), 14), 1), // Tomorrow 2:00 PM
            end: addDays(setHours(setMinutes(now, 0), 14 + Math.floor(extractedDuration / 60)), 1),
            score: 90
          },
          {
            start: addDays(setHours(setMinutes(now, 0), 11), 2), // Day after tomorrow 11:00 AM
            end: addDays(setHours(setMinutes(now, 0), 11 + Math.floor(extractedDuration / 60)), 2),
            score: 85
          },
          {
            start: addDays(setHours(setMinutes(now, 0), 15), 2), // Day after tomorrow 3:00 PM
            end: addDays(setHours(setMinutes(now, 0), 15 + Math.floor(extractedDuration / 60)), 2),
            score: 80
          },
        ];
        
        setSuggestedSlots(mockSlots);
        setIsLoading(false);
        setProcessingText("");
      }, 2000);

    } catch (error: any) {
      console.error("Smart scheduling error:", error);
      setError(error.message || "Failed to process scheduling request");
      setIsLoading(false);
      setProcessingText("");
    }
  };

  // Handle duration input change
  const handleDurationChange = (value: string) => {
    setDurationInput(value);
    const parsedValue = parseInt(value);
    if (!isNaN(parsedValue) && parsedValue > 0) {
      setDuration(parsedValue);
    }
  };

  // Handle slot selection
  const selectTimeSlot = (slot: AvailabilitySlot) => {
    if (onTimeSelected) {
      onTimeSelected(slot.start, slot.end);
    }
    
    // Show success message
    setSuccess(true);
    setSuggestedSlots([]);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Smart Scheduling Assistant</h3>
        <p className="text-sm text-gray-500">
          Describe your meeting in natural language and our AI will find the best times.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-center">
          <Check className="h-4 w-4 mr-2" />
          Time slot selected! You can now create the appointment.
        </div>
      )}

      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-2">
          <label htmlFor="nlp-input" className="text-sm font-medium text-gray-700">
            Describe your meeting
          </label>
          <div className="flex">
            <Input
              id="nlp-input"
              value={naturalLanguageInput}
              onChange={(e) => setNaturalLanguageInput(e.target.value)}
              placeholder='Try "Schedule a 30-minute call with david@example.com on Friday"'
              className="flex-1 rounded-r-none"
            />
            <Button
              onClick={processNaturalLanguage}
              disabled={isLoading}
              className="rounded-l-none bg-blue-600 hover:bg-blue-700"
            >
              Find Times
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Tip: Include participants, duration, and preferred days or times.
          </p>
        </div>

        {/* Extracted Information */}
        {(participants.length > 0 || duration !== 30) && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-sm mb-2">We found the following details:</h4>
            
            {participants.length > 0 && (
              <div className="flex items-start mb-2">
                <Users className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <span className="text-sm font-medium">Participants:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {participants.map((email, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {email}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium">Duration:</span>
              <div className="ml-2 flex items-center">
                <Input
                  type="number"
                  value={durationInput}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  className="w-16 h-7 text-sm py-0 px-2"
                  min="5"
                />
                <span className="ml-1 text-sm">minutes</span>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isLoading && (
          <div className="bg-blue-50 p-4 rounded-md flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-sm text-blue-700">{processingText}</span>
          </div>
        )}

        {/* Suggested Time Slots */}
        {suggestedSlots.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Suggested Time Slots:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestedSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => selectTimeSlot(slot)}
                  className="border rounded-md p-3 text-left hover:bg-blue-50 transition-colors flex items-center space-x-3"
                >
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">
                      {format(slot.start, 'EEE, MMM d')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {format(slot.start, 'h:mm a')} - {format(slot.end, 'h:mm a')}
                    </div>
                    {slot.score && (
                      <div className="mt-1">
                        <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${slot.score}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {slot.score >= 90 ? 'Excellent' : slot.score >= 80 ? 'Good' : 'Fair'} availability
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
