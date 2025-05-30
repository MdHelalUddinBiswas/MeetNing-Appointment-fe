"use client";

import { useState, useRef, useEffect } from "react";
import { X, Maximize2, Minimize2, Send, BotMessageSquare } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! How can I help you with your appointments today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
  };

  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
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
        <div className="bg-white rounded-lg shadow-xl flex flex-col w-[350px] h-[450px] overflow-hidden border border-gray-200">
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
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </p>
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

              <div className="border-t p-3">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question..."
                    className="flex-1 p-2 border rounded text-sm"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    disabled={isLoading}
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
