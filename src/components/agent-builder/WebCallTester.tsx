import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Loader2,
  MessageSquare,
  User,
  Bot,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: Date;
}

interface WebCallTesterProps {
  agentId: string;
  agentName: string;
  systemPrompt: string;
  welcomeMessage?: string;
}

type CallStatus = "idle" | "connecting" | "connected" | "ended";

export function WebCallTester({
  agentId,
  agentName,
  systemPrompt,
  welcomeMessage,
}: WebCallTesterProps) {
  const { toast } = useToast();
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === "connected") {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const addMessage = useCallback((role: Message["role"], content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role,
        content,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const startCall = async () => {
    try {
      setCallStatus("connecting");
      setMessages([]);
      setCallDuration(0);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio analyzer for visual feedback
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start audio level monitoring
      const updateAudioLevel = () => {
        if (analyserRef.current && callStatus !== "ended") {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      updateAudioLevel();

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          await processUserAudio(audioBlob);
        }
        audioChunksRef.current = [];
      };

      setCallStatus("connected");
      addMessage("system", "Call connected");

      // Play welcome message if available
      if (welcomeMessage) {
        addMessage("agent", welcomeMessage);
        await speakText(welcomeMessage);
      }

      toast({
        title: "Call Connected",
        description: "You can now speak to the agent. Press and hold the mic button to talk.",
      });
    } catch (error) {
      console.error("Failed to start call:", error);
      setCallStatus("idle");
      toast({
        variant: "destructive",
        title: "Microphone Access Denied",
        description: "Please allow microphone access to test the agent.",
      });
    }
  };

  const endCall = useCallback(() => {
    // Stop recording if active
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    // Stop audio level monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setCallStatus("ended");
    setIsRecording(false);
    addMessage("system", `Call ended. Duration: ${formatDuration(callDuration)}`);

    toast({
      title: "Call Ended",
      description: `Total duration: ${formatDuration(callDuration)}`,
    });
  }, [callDuration, addMessage, toast]);

  const startRecording = () => {
    if (mediaRecorderRef.current && callStatus === "connected" && !isMuted) {
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processUserAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Convert audio to text using browser's speech recognition or simulate
      const userText = await transcribeAudio(audioBlob);
      
      if (userText.trim()) {
        addMessage("user", userText);
        
        // Get AI response
        const agentResponse = await getAgentResponse(userText);
        addMessage("agent", agentResponse);
        
        // Speak the response
        if (isSpeakerOn) {
          await speakText(agentResponse);
        }
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      addMessage("system", "Error processing audio. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const transcribeAudio = async (_audioBlob: Blob): Promise<string> => {
    // In a production app, you would send the audio blob to a transcription service
    // For this demo, we'll simulate transcription since Web Speech API
    // requires a live microphone stream, not a pre-recorded blob
    
    // Return a placeholder - in production, integrate with a real STT service
    return "[Voice input captured]";
  };

  const getAgentResponse = async (userMessage: string): Promise<string> => {
    try {
      // Call our edge function that uses Lovable AI
      const { data, error } = await supabase.functions.invoke("agent-chat", {
        body: {
          agentId,
          systemPrompt,
          userMessage,
          conversationHistory: messages
            .filter((m) => m.role !== "system")
            .map((m) => ({
              role: m.role === "agent" ? "assistant" : "user",
              content: m.content,
            })),
        },
      });

      if (error) throw error;
      return data.response || "I'm sorry, I couldn't process that. Please try again.";
    } catch (error) {
      console.error("Error getting agent response:", error);
      return "I apologize, but I'm experiencing technical difficulties. Please try again.";
    }
  };

  const speakText = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  return (
    <Card className="border-2 border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="border-b-2 border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent border-2 border-border">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold">Web Call Tester</h3>
              <p className="text-sm text-muted-foreground">{agentName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={callStatus === "connected" ? "default" : "secondary"}
              className={cn(
                callStatus === "connected" && "bg-chart-2 animate-pulse"
              )}
            >
              {callStatus === "idle" && "Ready"}
              {callStatus === "connecting" && "Connecting..."}
              {callStatus === "connected" && "Live"}
              {callStatus === "ended" && "Ended"}
            </Badge>
            {callStatus === "connected" && (
              <Badge variant="outline" className="font-mono">
                <Clock className="h-3 w-3 mr-1" />
                {formatDuration(callDuration)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Conversation Area */}
      <ScrollArea className="h-[300px] p-4">
        {messages.length === 0 && callStatus === "idle" && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Start a call to test your agent
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Press and hold the microphone button to speak
            </p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" && "justify-end",
                message.role === "system" && "justify-center"
              )}
            >
              {message.role === "agent" && (
                <div className="p-2 bg-primary text-primary-foreground border-2 border-border h-fit">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[80%] p-3 border-2",
                  message.role === "user" &&
                    "bg-accent border-border",
                  message.role === "agent" &&
                    "bg-card border-border",
                  message.role === "system" &&
                    "bg-muted border-dashed border-muted-foreground/30 text-muted-foreground text-sm"
                )}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>

              {message.role === "user" && (
                <div className="p-2 bg-accent border-2 border-border h-fit">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-3">
              <div className="p-2 bg-primary text-primary-foreground border-2 border-border h-fit">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-card border-2 border-border p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Agent is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Audio Level Indicator */}
      {callStatus === "connected" && (
        <div className="px-4 py-2 border-t-2 border-border bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Audio Level:</span>
            <div className="flex-1 h-2 bg-accent border border-border overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-100",
                  isRecording ? "bg-chart-2" : "bg-muted-foreground/30"
                )}
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="border-t-2 border-border p-4 bg-muted/30">
        {callStatus === "idle" || callStatus === "ended" ? (
          <Button
            onClick={startCall}
            className="w-full"
            size="lg"
          >
            <Phone className="h-5 w-5 mr-2" />
            Start Test Call
          </Button>
        ) : callStatus === "connecting" ? (
          <Button disabled className="w-full" size="lg">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Connecting...
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-4">
            {/* Mute Button */}
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-12 w-12",
                isMuted && "bg-destructive/10 border-destructive text-destructive"
              )}
              onClick={toggleMute}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            {/* Push-to-Talk Button */}
            <Button
              size="lg"
              className={cn(
                "h-16 w-16 rounded-full",
                isRecording && "bg-chart-2 animate-pulse"
              )}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={isMuted || isProcessing}
            >
              <Mic className="h-6 w-6" />
            </Button>

            {/* Speaker Button */}
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-12 w-12",
                !isSpeakerOn && "bg-destructive/10 border-destructive text-destructive"
              )}
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            >
              {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>

            {/* End Call Button */}
            <Button
              variant="destructive"
              size="icon"
              className="h-12 w-12"
              onClick={endCall}
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        )}

        {callStatus === "connected" && (
          <p className="text-xs text-center text-muted-foreground mt-3">
            <AlertCircle className="h-3 w-3 inline mr-1" />
            Press and hold the microphone button to speak
          </p>
        )}
      </div>
    </Card>
  );
}
