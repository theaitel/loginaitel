import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Phone,
  Clock,
  Calendar,
  Play,
  Download,
  User,
  Bot,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

interface CallData {
  id: string;
  status: string;
  duration_seconds: number | null;
  connected: boolean | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  summary: string | null;
  sentiment: string | null;
  transcript: string | null;
  recording_url: string | null;
  real_estate_calls?: {
    disposition: string | null;
    interest_score: number | null;
    ai_summary: string | null;
    objections_detected: string[] | null;
  }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  call: CallData | null;
}

interface TranscriptMessage {
  role: "agent" | "user";
  content: string;
}

export function RECallTranscriptDialog({ open, onOpenChange, call }: Props) {
  if (!call) return null;

  const reCall = call.real_estate_calls?.[0];

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Parse transcript - handle different formats
  const parseTranscript = (transcript: string | null): TranscriptMessage[] => {
    if (!transcript) return [];

    const messages: TranscriptMessage[] = [];

    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(transcript);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          role: item.role === "agent" || item.role === "assistant" ? "agent" : "user",
          content: item.content || item.text || item.message || "",
        }));
      }
    } catch {
      // Not JSON, try line-based parsing
    }

    // Try line-based format: "Agent: message" or "User: message"
    const lines = transcript.split("\n").filter((line) => line.trim());
    
    for (const line of lines) {
      const agentMatch = line.match(/^(Agent|Assistant|AI|Bot):\s*(.+)$/i);
      const userMatch = line.match(/^(User|Customer|Lead|Human):\s*(.+)$/i);

      if (agentMatch) {
        messages.push({ role: "agent", content: agentMatch[2] });
      } else if (userMatch) {
        messages.push({ role: "user", content: userMatch[2] });
      } else if (line.trim()) {
        // If no prefix, alternate or treat as continuation
        const lastRole = messages.length > 0 ? messages[messages.length - 1].role : "agent";
        messages.push({ role: lastRole === "agent" ? "user" : "agent", content: line.trim() });
      }
    }

    return messages;
  };

  const transcriptMessages = parseTranscript(call.transcript);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Transcript
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Call Info Header */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {call.started_at
                  ? format(new Date(call.started_at), "PPP 'at' p")
                  : format(new Date(call.created_at), "PPP 'at' p")}
              </span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{formatDuration(call.duration_seconds)}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <Badge variant={call.connected ? "default" : "secondary"}>
              {call.connected ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Connected</>
              ) : (
                <><XCircle className="h-3 w-3 mr-1" /> Not Connected</>
              )}
            </Badge>
            {call.sentiment && call.sentiment !== "neutral" && (
              <Badge variant={call.sentiment === "positive" ? "default" : "destructive"}>
                {call.sentiment}
              </Badge>
            )}
            {reCall?.interest_score !== null && reCall?.interest_score !== undefined && (
              <Badge variant="outline">Interest: {reCall.interest_score}%</Badge>
            )}
            {call.recording_url && (
              <Button variant="outline" size="sm" asChild className="ml-auto">
                <a href={call.recording_url} target="_blank" rel="noopener noreferrer">
                  <Play className="h-3 w-3 mr-1" />
                  Play Recording
                </a>
              </Button>
            )}
          </div>

          {/* AI Summary */}
          {(reCall?.ai_summary || call.summary) && (
            <div className="p-3 border rounded-lg bg-primary/5">
              <p className="text-xs font-medium text-muted-foreground mb-1">AI Summary</p>
              <p className="text-sm">{reCall?.ai_summary || call.summary}</p>
            </div>
          )}

          {/* Objections Detected */}
          {reCall?.objections_detected && reCall.objections_detected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Objections:</span>
              {reCall.objections_detected.map((objection, idx) => (
                <Badge key={idx} variant="destructive" className="text-xs">
                  {objection}
                </Badge>
              ))}
            </div>
          )}

          <Separator />

          {/* Transcript */}
          <div>
            <h4 className="font-medium mb-3">Conversation</h4>
            <ScrollArea className="h-[400px] pr-4">
              {transcriptMessages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No transcript available</p>
                  {call.transcript && (
                    <div className="mt-4 text-left p-4 bg-muted rounded-lg">
                      <p className="text-xs font-medium mb-2">Raw transcript:</p>
                      <p className="text-sm whitespace-pre-wrap">{call.transcript}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {transcriptMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        message.role === "agent" ? "justify-start" : "justify-end"
                      }`}
                    >
                      {message.role === "agent" && (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-lg p-3 ${
                          message.role === "agent"
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      {message.role === "user" && (
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Disposition */}
          {reCall?.disposition && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-sm text-muted-foreground">Call Disposition:</span>
              <Badge variant="outline" className="capitalize">
                {reCall.disposition.replace("_", " ")}
              </Badge>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
