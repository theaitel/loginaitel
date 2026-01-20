import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";
import {
  ArrowLeft,
  Phone,
  Clock,
  TrendingUp,
  Users,
  Target,
  XCircle,
  HelpCircle,
  Loader2,
  BarChart3,
  CheckCircle,
  Play,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

export default function CampaignAnalytics() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { user } = useAuth();

  // Fetch campaign details
  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ["campaign", campaignId],
    enabled: !!campaignId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch campaign leads for analytics
  const { data: leads } = useQuery({
    queryKey: ["campaign-leads-analytics", campaignId],
    enabled: !!campaignId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_leads")
        .select("*")
        .eq("campaign_id", campaignId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch call history for this campaign's leads
  const { data: callHistory } = useQuery({
    queryKey: ["campaign-call-history", campaignId],
    enabled: !!campaignId && !!leads,
    queryFn: async () => {
      if (!leads || leads.length === 0) return [];
      
      const leadIds = leads.map((l) => l.id);
      const { data, error } = await supabase
        .from("calls")
        .select("*")
        .in("lead_id", leadIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate analytics data
  const totalLeads = leads?.length || 0;
  const contactedLeads = leads?.filter((l) => l.call_status).length || 0;
  const interestedLeads = leads?.filter(
    (l) => l.interest_level === "interested" || l.stage === "interested"
  ).length || 0;
  const notInterestedLeads = leads?.filter(
    (l) => l.interest_level === "not_interested" || l.stage === "not_interested"
  ).length || 0;
  const partiallyInterestedLeads = leads?.filter(
    (l) => l.interest_level === "partially_interested" || l.stage === "partially_interested"
  ).length || 0;

  const contactRate = totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0;
  const conversionRate = contactedLeads > 0 ? Math.round((interestedLeads / contactedLeads) * 100) : 0;

  const avgCallDuration = callHistory?.length
    ? Math.round(callHistory.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / callHistory.length)
    : 0;

  // Pie chart data for interest distribution
  const pieData = [
    { name: "Interested", value: interestedLeads, color: "#22c55e" },
    { name: "Partially Interested", value: partiallyInterestedLeads, color: "#eab308" },
    { name: "Not Interested", value: notInterestedLeads, color: "#ef4444" },
    { name: "New/Pending", value: totalLeads - contactedLeads, color: "#94a3b8" },
  ].filter((d) => d.value > 0);

  // Daily call trend (last 7 days)
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const dailyCallData = last7Days.map((day) => {
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayCalls = callHistory?.filter((call) => {
      const callDate = new Date(call.created_at);
      return callDate >= dayStart && callDate < dayEnd;
    }) || [];

    return {
      date: format(day, "EEE"),
      calls: dayCalls.length,
      connected: dayCalls.filter((c) => c.connected).length,
    };
  });

  // Stage distribution
  const stageData = [
    { stage: "New", count: leads?.filter((l) => l.stage === "new").length || 0 },
    { stage: "Contacted", count: leads?.filter((l) => l.stage === "contacted").length || 0 },
    { stage: "Interested", count: leads?.filter((l) => l.stage === "interested").length || 0 },
    { stage: "Site Visit", count: leads?.filter((l) => l.stage === "site_visit_done").length || 0 },
    { stage: "Negotiation", count: leads?.filter((l) => l.stage === "negotiation").length || 0 },
    { stage: "Token Paid", count: leads?.filter((l) => l.stage === "token_paid").length || 0 },
    { stage: "Closed", count: leads?.filter((l) => l.stage === "closed").length || 0 },
    { stage: "Lost", count: leads?.filter((l) => l.stage === "lost").length || 0 },
  ].filter((d) => d.count > 0);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (campaignLoading) {
    return (
      <DashboardLayout role="client">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="client">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/client/campaigns/${campaignId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{campaign?.name} - Analytics</h1>
            <p className="text-muted-foreground">Call history and performance insights</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border-2 border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Leads</span>
            </div>
            <p className="text-3xl font-bold">{totalLeads}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {contactedLeads} contacted ({contactRate}%)
            </p>
          </div>

          <div className="border-2 border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Calls</span>
            </div>
            <p className="text-3xl font-bold">{callHistory?.length || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {callHistory?.filter((c) => c.connected).length || 0} connected (45s+)
            </p>
          </div>

          <div className="border-2 border-green-500/30 bg-green-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{conversionRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {interestedLeads} interested leads
            </p>
          </div>

          <div className="border-2 border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Avg Call Duration</span>
            </div>
            <p className="text-3xl font-bold">{formatDuration(avgCallDuration)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Per connected call
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Interest Distribution Pie */}
          <div className="border-2 border-border bg-card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Interest Distribution
            </h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No data yet
              </div>
            )}
          </div>

          {/* Daily Call Trend */}
          <div className="border-2 border-border bg-card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daily Call Trend (Last 7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyCallData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="calls" fill="hsl(var(--primary))" name="Total Calls" />
                <Bar dataKey="connected" fill="#22c55e" name="Connected" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stage Funnel */}
        <div className="border-2 border-border bg-card p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Lead Stage Funnel
          </h3>
          {stageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stageData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No stage data yet
            </div>
          )}
        </div>

        {/* Call History Table */}
        <div className="border-2 border-border bg-card">
          <div className="p-4 border-b-2 border-border">
            <h3 className="font-bold flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call History
            </h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Connected</TableHead>
                <TableHead>Sentiment</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!callHistory || callHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No calls made yet in this campaign
                  </TableCell>
                </TableRow>
              ) : (
                callHistory.slice(0, 20).map((call) => {
                  const lead = leads?.find((l) => l.id === call.lead_id);
                  return (
                    <TableRow key={call.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lead?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {lead?.phone_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{call.status}</Badge>
                      </TableCell>
                      <TableCell>{formatDuration(call.duration_seconds || 0)}</TableCell>
                      <TableCell>
                        {call.connected ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`border-2 ${
                            call.sentiment === "positive"
                              ? "bg-green-500/10 text-green-600 border-green-500"
                              : call.sentiment === "negative"
                              ? "bg-red-500/10 text-red-600 border-red-500"
                              : "bg-muted border-border"
                          }`}
                        >
                          {call.sentiment || "neutral"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(call.created_at), "PP p")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
