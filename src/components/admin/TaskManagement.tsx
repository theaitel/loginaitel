import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreVertical,
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  points: number;
  deadline: string | null;
  assigned_to: string | null;
  created_at: string;
  completed_at: string | null;
  rejection_reason: string | null;
  engineer?: {
    email: string;
    full_name: string | null;
  };
}

const statusConfig = {
  pending: {
    label: "Pending",
    icon: ClipboardList,
    className: "bg-muted border-border text-muted-foreground",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    className: "bg-chart-1/10 border-chart-1 text-chart-1",
  },
  pending_review: {
    label: "Pending Review",
    icon: AlertCircle,
    className: "bg-chart-4/10 border-chart-4 text-chart-4",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    className: "bg-chart-2/10 border-chart-2 text-chart-2",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-destructive/10 border-destructive text-destructive",
  },
};

export function TaskManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    points: "100",
    deadline: "",
    assigned_to: "",
  });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["admin-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get engineers' profiles
      const assignedIds = [...new Set(data?.filter((t) => t.assigned_to).map((t) => t.assigned_to) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", assignedIds);

      const tasksWithEngineers: Task[] = (data || []).map((task) => ({
        ...task,
        engineer: profiles?.find((p) => p.user_id === task.assigned_to),
      }));

      return tasksWithEngineers;
    },
  });

  // Fetch engineers for assignment
  const { data: engineers } = useQuery({
    queryKey: ["admin-engineers"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "engineer");

      const engineerIds = roles?.map((r) => r.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", engineerIds);

      return profiles || [];
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: typeof newTask) => {
      const { error } = await supabase.from("tasks").insert({
        title: taskData.title,
        description: taskData.description || null,
        points: parseInt(taskData.points),
        deadline: taskData.deadline || null,
        assigned_to: taskData.assigned_to || null,
        created_by: user?.id || "",
        status: taskData.assigned_to ? "pending" : "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task created successfully");
      setIsCreateDialogOpen(false);
      setNewTask({
        title: "",
        description: "",
        points: "100",
        deadline: "",
        assigned_to: "",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
    },
    onError: (error) => {
      toast.error("Failed to create task", { description: error.message });
    },
  });

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      taskId,
      status,
      rejectionReason,
    }: {
      taskId: string;
      status: string;
      rejectionReason?: string;
    }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === "rejected" && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task updated");
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
    },
  });

  // Filter tasks
  const filteredTasks = tasks?.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.engineer?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: tasks?.length || 0,
    pending: tasks?.filter((t) => t.status === "pending").length || 0,
    inProgress: tasks?.filter((t) => t.status === "in_progress").length || 0,
    pendingReview: tasks?.filter((t) => t.status === "pending_review").length || 0,
    completed: tasks?.filter((t) => t.status === "completed").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="border-2 border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="border-2 border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{stats.pending}</p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
        <div className="border-2 border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-chart-1">{stats.inProgress}</p>
          <p className="text-sm text-muted-foreground">In Progress</p>
        </div>
        <div className="border-2 border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-chart-4">{stats.pendingReview}</p>
          <p className="text-sm text-muted-foreground">Review</p>
        </div>
        <div className="border-2 border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-chart-2">{stats.completed}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-2"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] border-2">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Create a task and optionally assign it to an engineer
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTaskMutation.mutate(newTask);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  required
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  placeholder="e.g., Build Healthcare Support Agent"
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  placeholder="Detailed task description..."
                  className="border-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Points</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newTask.points}
                    onChange={(e) =>
                      setNewTask({ ...newTask, points: e.target.value })
                    }
                    className="border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input
                    type="datetime-local"
                    value={newTask.deadline}
                    onChange={(e) =>
                      setNewTask({ ...newTask, deadline: e.target.value })
                    }
                    className="border-2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assign To (Optional)</Label>
                <Select
                  value={newTask.assigned_to}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, assigned_to: value })
                  }
                >
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Select engineer" />
                  </SelectTrigger>
                  <SelectContent>
                    {engineers?.map((engineer) => (
                      <SelectItem key={engineer.user_id} value={engineer.user_id}>
                        {engineer.full_name || engineer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createTaskMutation.isPending}>
                  {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tasks Table */}
      <div className="border-2 border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-border hover:bg-transparent">
              <TableHead className="font-bold">Task</TableHead>
              <TableHead className="font-bold">Assigned To</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Deadline</TableHead>
              <TableHead className="font-bold text-right">Points</TableHead>
              <TableHead className="font-bold w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading tasks...
                </TableCell>
              </TableRow>
            ) : filteredTasks?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No tasks found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks?.map((task) => {
                const status =
                  statusConfig[task.status as keyof typeof statusConfig] ||
                  statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <TableRow key={task.id} className="border-b-2 border-border">
                    <TableCell>
                      <div>
                        <p className="font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.engineer?.full_name || task.engineer?.email || (
                        <span className="text-muted-foreground italic">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border-2 ${status.className}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {task.deadline
                        ? format(new Date(task.deadline), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {task.points}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Task</DropdownMenuItem>
                          {task.status === "pending_review" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    taskId: task.id,
                                    status: "completed",
                                  })
                                }
                              >
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    taskId: task.id,
                                    status: "rejected",
                                    rejectionReason: "Needs improvement",
                                  })
                                }
                              >
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem className="text-destructive">
                            Delete Task
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
