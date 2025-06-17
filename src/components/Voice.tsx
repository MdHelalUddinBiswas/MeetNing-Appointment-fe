import { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, Bell } from 'lucide-react';

export function VoiceCommands() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Voice command examples
  const commandExamples = [
    "Schedule meeting with john@email.com tomorrow at 2 PM, remind me 30 minutes before",
    "Set my default reminder to 60 minutes",
    "What's my next appointment?",
    "Cancel my 3 PM meeting today",
    "Change reminder for tomorrow's meeting to 15 minutes"
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await processVoiceCommand(audioBlob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          stopRecording();
        }
      }, 30000);
    } catch (error) {
      console.error('Microphone access error:', error);
      alert('Please allow microphone access to use voice commands');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const processVoiceCommand = async (audioBlob: Blob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    // To inspect FormData, you need to iterate over its entries
    for (const [key, value] of formData.entries()) {
      console.log(`FormData entry - ${key}:`, value);
    }
    try {
        console.log("Processing voice command...");
        // To inspect FormData, you need to iterate over its entries
        for (const [key, value] of formData.entries()) {
          console.log(`FormData entry - ${key}:`, value);
        }
    //   const response = await fetch('/api/voice/process', {
    //     method: 'POST',
    //     body: formData,
    //   });

    //   const result = await response.json();
    //   setLastCommand(result.transcript);

    //   // Speak the response
    //   if (result.response && 'speechSynthesis' in window) {
    //     const utterance = new SpeechSynthesisUtterance(result.response);
    //     utterance.rate = 0.9;
    //     utterance.pitch = 1;
    //     window.speechSynthesis.speak(utterance);
    //   }

    //   // Show visual notification
    //   if (result.success) {
    //     showNotification(result.response);
    //   }
    } catch (error) {
      console.error('Processing error:', error);
      alert('Failed to process voice command');
    } finally {
      setIsProcessing(false);
    }
  };

  const showNotification = (message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Calendar Assistant', {
        body: message,
        icon: '/calendar-icon.png',
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Voice Control</h2>
        <Bell className="w-5 h-5 text-gray-500" />
      </div>

      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`relative p-8 rounded-full transition-all transform ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600 hover:scale-105'
          } text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
        >
          {isProcessing ? (
            <Loader2 className="w-12 h-12 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-12 h-12" />
          ) : (
            <Mic className="w-12 h-12" />
          )}
        </button>

        <p className="text-center text-gray-600">
          {isRecording ? 'Listening... Click to stop' : 
           isProcessing ? 'Processing your command...' : 
           'Click to speak your command'}
        </p>

        {lastCommand && (
          <div className="w-full p-3 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Last command:</span> "{lastCommand}"
            </p>
          </div>
        )}

        <div className="w-full mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Example commands:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            {commandExamples.map((example, i) => (
              <li key={i} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{example}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}