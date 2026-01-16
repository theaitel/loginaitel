import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  CreditCard,
  IndianRupee,
  TrendingUp,
  Calendar,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

const SEAT_PRICE = 300;

interface SeatSubscription {
  id: string;
  client_id: string;
  seats_count: number;
  status: string;
  razorpay_subscription_id: string | null;
  next_billing_date: string | null;
  last_payment_date: string | null;
  created_at: string;
  updated_at: string;
  client_email?: string;
  client_name?: string;
}

interface SeatPayment {
  id: string;
  client_id: string;
  seats_count: number;
  amount: number;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  status: string;
  billing_period_start: string | null;
  billing_period_end: string | null;
  created_at: string;
  client_email?: string;
  client_name?: string;
}

export default function AdminSeatSubscriptions() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all seat subscriptions
  const { data: subscriptions, isLoading: loadingSubscriptions, refetch: refetchSubscriptions } = useQuery({
    queryKey: ["admin-seat-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seat_subscriptions" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch client profiles
      const clientIds = [...new Set((data || []).map((s: any) => s.client_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", clientIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map((sub: any) => {
        const profile = profileMap.get(sub.client_id);
        return {
          ...sub,
          client_email: profile?.email || "Unknown",
          client_name: profile?.full_name || "Unknown",
        };
      }) as SeatSubscription[];
    },
  });

  // Fetch all seat payments
  const { data: payments, isLoading: loadingPayments, refetch: refetchPayments } = useQuery({
    queryKey: ["admin-seat-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seat_payments" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch client profiles
      const clientIds = [...new Set((data || []).map((p: any) => p.client_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", clientIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map((payment: any) => {
        const profile = profileMap.get(payment.client_id);
        return {
          ...payment,
          client_email: profile?.email || "Unknown",
          client_name: profile?.full_name || "Unknown",
        };
      }) as SeatPayment[];
    },
  });

  // Calculate stats
  const stats = {
    totalSeats: subscriptions?.reduce((sum, s) => sum + s.seats_count, 0) || 0,
    activeSubscriptions: subscriptions?.filter(s => s.status === "active").length || 0,
    totalRevenue: payments?.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount, 0) || 0,
    totalPayments: payments?.filter(p => p.status === "completed").length || 0,
    pendingPayments: payments?.filter(p => p.status === "pending").length || 0,
    monthlyRecurring: (subscriptions?.filter(s => s.status === "active").reduce((sum, s) => sum + s.seats_count, 0) || 0) * SEAT_PRICE,
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions?.filter(sub =>
    sub.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Filter payments
  const filteredPayments = payments?.filter(payment =>
    payment.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.razorpay_order_id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-amber-600 border-amber-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "cancelled":
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRefresh = () => {
    refetchSubscriptions();
    refetchPayments();
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Seat Subscriptions</h1>
            <p className="text-muted-foreground">Manage team seat subscriptions across all clients</p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total Seats</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalSeats}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Active Subs</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.activeSubscriptions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold mt-1">₹{stats.totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Monthly MRR</span>
              </div>
              <p className="text-2xl font-bold mt-1">₹{stats.monthlyRecurring.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Payments</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalPayments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.pendingPayments}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="subscriptions">
          <TabsList>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Subscriptions ({subscriptions?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payments ({payments?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All Seat Subscriptions</CardTitle>
                <CardDescription>View and manage client seat subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSubscriptions ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredSubscriptions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No seat subscriptions found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-center">Seats</TableHead>
                        <TableHead className="text-center">Monthly Cost</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Next Billing</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.client_name}</TableCell>
                          <TableCell className="text-muted-foreground">{sub.client_email}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{sub.seats_count} seats</Badge>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            ₹{(sub.seats_count * SEAT_PRICE).toLocaleString()}
                          </TableCell>
                          <TableCell>{getStatusBadge(sub.status)}</TableCell>
                          <TableCell>
                            {sub.next_billing_date ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(sub.next_billing_date), "MMM dd, yyyy")}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(sub.created_at), "MMM dd, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All Seat Payments</CardTitle>
                <CardDescription>Payment history for seat subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPayments ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No seat payments found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-center">Seats</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.client_name}</TableCell>
                          <TableCell className="text-muted-foreground">{payment.client_email}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{payment.seats_count}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{payment.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {payment.razorpay_order_id.slice(0, 20)}...
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(payment.created_at), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
