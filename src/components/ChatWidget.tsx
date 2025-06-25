"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  Send,
  BotMessageSquare,
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
  transcription?: string;
  isAudio?: boolean;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! How can I help you with your appointments today? You can type or use voice messages 🎤",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasAudioSupport, setHasAudioSupport] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Check audio support on mount
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasAudioSupport(false);
    }
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    if (!hasAudioSupport) {
      alert("Audio recording is not supported in your browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm;codecs=opus",
        });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioUrl && audioElementRef.current) {
      if (isPlayingAudio) {
        audioElementRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioElementRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    setAudioUrl("");
    setRecordingTime(0);
    setIsPlayingAudio(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  const sendAudio = async () => {
    if (!audioBlob) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/audio`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );
      console.log(response);
      if (!response.ok) {
        throw new Error("Failed to process audio message");
      }

      const data = await response.json();

      // Add user message with transcription
      const userMessage: Message = {
        role: "user",
        content: data.transcription || "Audio message",
        transcription: data.transcription,
        isAudio: true,
      };

      setMessages((prev) => [...prev, userMessage]);

      // Add assistant response
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.response || "Sorry, I couldn't process your audio message.",
        },
      ]);

      // Clear audio after successful send
      clearAudio();
    } catch (error) {
      console.error("Audio chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, there was an error processing your audio message. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message
    const userMessage = { role: "user" as const, content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Send message to API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from chatbot");
      }

      const data = await response.json();

      // Add assistant response
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response || "Sorry, I couldn't process your request.",
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, there was an error processing your request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
    if (isMinimized) setIsMinimized(false);
    // Clear any ongoing recording when closing
    if (isRecording) {
      stopRecording();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Hidden audio element for playback */}
      <audio
        ref={audioElementRef}
        src={audioUrl}
        onEnded={() => setIsPlayingAudio(false)}
        className="hidden"
      />

      {/* Chat button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200"
        >
          <BotMessageSquare size={24} />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-xl flex flex-col w-[350px] h-[500px] overflow-hidden border border-gray-200">
          {/* Chat header */}
          <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
            <h3 className="font-medium">MeetNing Assistant</h3>
            <div className="flex space-x-2">
              <button
                onClick={toggleMinimize}
                className="text-white hover:text-gray-200"
              >
                {isMinimized ? (
                  <Maximize2 size={18} />
                ) : (
                  <Minimize2 size={18} />
                )}
              </button>
              <button
                onClick={toggleChat}
                className="text-white hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Chat body - conditional rendering based on minimized state */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 text-sm ${
                        message.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {message.isAudio && (
                        <div className="flex items-center gap-2 mb-1 text-xs opacity-75">
                          <Mic size={12} />
                          <span>Voice message</span>
                        </div>
                      )}
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none prose-p:my-0 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ node, ...props }) => (
                                <a
                                  {...props}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                />
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="p-3 rounded-lg text-black bg-gray-100 animate-pulse">
                    <p className="text-sm">Thinking...</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Audio recording section */}
              {(isRecording || audioBlob) && (
                <div className="border-t bg-gray-50 p-3">
                  {isRecording ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-600">
                          Recording: {formatTime(recordingTime)}
                        </span>
                      </div>
                      <button
                        onClick={stopRecording}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                      >
                        <Square size={16} />
                      </button>
                    </div>
                  ) : (
                    audioBlob && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={playAudio}
                              className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full"
                            >
                              {isPlayingAudio ? (
                                <Pause size={14} />
                              ) : (
                                <Play size={14} />
                              )}
                            </button>
                            <span className="text-sm text-gray-600">
                              Audio recorded ({formatTime(recordingTime)})
                            </span>
                          </div>
                          <button
                            onClick={clearAudio}
                            className="text-gray-500 hover:text-gray-700 p-1"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={sendAudio}
                            disabled={isLoading}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded text-sm disabled:opacity-50"
                          >
                            Send Audio
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Input section */}
              <div className="border-t p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question..."
                    className="flex-1 p-2 border rounded text-sm"
                    disabled={isLoading || isRecording}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  {hasAudioSupport && !audioBlob && (
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`p-2 rounded transition-colors ${
                        isRecording
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-gray-500 hover:bg-gray-600 text-white"
                      }`}
                      disabled={isLoading}
                    >
                      {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                  )}
                  <button
                    onClick={handleSubmit}
                    className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    disabled={isLoading || isRecording}
                  >
                    <Send size={18} />
                  </button>
                </div>
                {!hasAudioSupport && (
                  <p className="text-xs text-gray-500 mt-1">
                    Voice messages not supported in this browser
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
