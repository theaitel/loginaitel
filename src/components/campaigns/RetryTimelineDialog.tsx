import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  PhoneMissed,
  PhoneOff,
  Loader2,
  History,
} from "lucide-react";

interface RetryTimelineDialogProps {
  leadId: string;
  leadName: string;
  campaignId: string;
  maxDailyRetries: number;
}

interface CallAttempt {
  id: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  connected: boolean | null;
  created_at: string;
}

interface QueueEntry {
  id: string;
  status: string;
  retry_count: number;
  next_retry_at: string | null;
  last_attempt_at: string | null;
  error_message: string | null;
  queued_at: string;
}

export function RetryTimelineDialog({
  leadId,
  leadName,
  campaignId,
  maxDailyRetries,
}: RetryTimelineDialogProps) {
  const [open, setOpen] = useState(false);

  // Fetch all calls for this lead
  const { data: calls, isLoading: callsLoading } = useQuery({
    queryKey: ["lead-call-history", leadId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calls")
        .select("id, status, started_at, ended_at, duration_seconds, connected, created_at")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as CallAttempt[];
    },
  });

  // Fetch queue entry for current retry status
  const { data: queueEntry } = useQuery({
    queryKey: ["lead-queue-entry", leadId, campaignId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_call_queue")
        .select("id, status, retry_count, next_retry_at, last_attempt_at, error_message, queued_at")
        .eq("lead_id", leadId)
        .eq("campaign_id", campaignId)
        .maybeSingle();
      if (error) throw error;
      return data as QueueEntry | null;
    },
  });

  const getStatusIcon = (status: string, connected: boolean | null) => {
    if (connected) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    switch (status) {
      case "completed":
        return <PhoneMissed className="h-4 w-4 text-yellow-500" />;
      case "in_progress":
        return <Phone className="h-4 w-4 text-blue-500 animate-pulse" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <PhoneOff className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string, connected: boolean | null) => {
    if (connected) {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500">
          Connected
        </Badge>
      );
    }
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500">
            No Answer
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500 animate-pulse">
            In Progress
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">Failed</Badge>
        );
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        );
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds || seconds === 0) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="View retry timeline">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Call History: {leadName}
          </DialogTitle>
        </DialogHeader>

        {callsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Queue Status */}
            {queueEntry && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Current Status</span>
                  <Badge variant="outline">
                    {queueEntry.retry_count}/{maxDailyRetries} attempts
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {queueEntry.status === "retry_pending" && queueEntry.next_retry_at ? (
                    <span>Next retry at {format(new Date(queueEntry.next_retry_at), "h:mm a")}</span>
                  ) : queueEntry.status === "max_retries_reached" ? (
                    <span className="text-yellow-600">Max retries reached for today</span>
                  ) : queueEntry.status === "completed" ? (
                    <span className="text-green-600">Completed</span>
                  ) : (
                    <span>{queueEntry.status}</span>
                  )}
                </div>
                {queueEntry.error_message && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {queueEntry.error_message}
                  </p>
                )}
              </div>
            )}

            {/* Timeline */}
            <div className="relative">
              {calls && calls.length > 0 ? (
                <div className="space-y-0">
                  {calls.map((call, index) => (
                    <div key={call.id} className="relative flex gap-3">
                      {/* Timeline line */}
                      {index < calls.length - 1 && (
                        <div className="absolute left-[11px] top-8 w-0.5 h-[calc(100%-8px)] bg-border" />
                      )}
                      
                      {/* Timeline dot */}
                      <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-background border-2 border-border mt-1">
                        {getStatusIcon(call.status, call.connected)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Attempt {index + 1}
                          </span>
                          {getStatusBadge(call.status, call.connected)}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                          <p>
                            {call.started_at
                              ? format(new Date(call.started_at), "MMM d, yyyy 'at' h:mm a")
                              : format(new Date(call.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                          {call.duration_seconds !== null && call.duration_seconds > 0 && (
                            <p>Duration: {formatDuration(call.duration_seconds)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No call attempts yet</p>
                </div>
              )}
            </div>

            {/* Queued timestamp */}
            {queueEntry && (
              <div className="text-xs text-muted-foreground border-t pt-3">
                Queued on {format(new Date(queueEntry.queued_at), "MMM d, yyyy 'at' h:mm a")}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
