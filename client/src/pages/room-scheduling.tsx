import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Search, Users, Bell } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RoomAPI, type ScheduledRoom } from "@/lib/api/rooms";
import { RoomDialog } from "@/components/room-dialog";
import { LANGUAGES } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function RoomScheduling() {
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "tomorrow" | "thisWeek">("all");
  const [sortBy, setSortBy] = useState<"time" | "name" | "participants">("time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ScheduledRoom | null>(null);
  const [reminders, setReminders] = useState<Set<string>>(new Set());

  // ---------- Queries (defensive)
  const { data: scheduledRooms = [], isLoading, isError } = useQuery<ScheduledRoom[]>({
    queryKey: ["rooms/scheduled"],
    queryFn: async () => {
      try {
        const res = await RoomAPI.getScheduledRooms();
        return Array.isArray(res) ? res : [];
      } catch (err) {
        console.error("Failed to fetch scheduled rooms:", err);
        return [];
      }
    },
    staleTime: 0, // Force refetch to ensure API call
  });

  const { data: userReminders = [] } = useQuery<string[]>({
    queryKey: ["/api/user/reminders"],
    queryFn: async () => {
      try {
        const res = await apiRequest<string[]>("GET", "/api/user/reminders");
        // assume API returns an array of roomIds or wrap accordingly
        return Array.isArray(res) ? res : [];
      } catch (err) {
        console.warn("Failed to load user reminders:", err);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  // ---------- Mutations
  const setReminderMutation = useMutation({
    mutationFn: async (roomId: string) => {
      return await apiRequest("POST", `/api/user/reminders/${roomId}`);
    },
    onSuccess: (_data, variables) => {
      const roomId = variables as string;
      queryClient.invalidateQueries({ queryKey: ["/api/user/reminders"] });
      setReminders((prev) => {
        const next = new Set(prev);
        next.add(roomId);
        return next;
      });
      toast({ title: "Reminder set!", description: "You'll be notified before the room starts." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Failed to set reminder", description: error?.message ?? "" });
    },
  });

  const removeReminderMutation = useMutation({
    mutationFn: async (roomId: string) => {
      return await apiRequest("DELETE", `/api/user/reminders/${roomId}`);
    },
    onSuccess: (_data, variables) => {
      const roomId = variables as string;
      queryClient.invalidateQueries({ queryKey: ["/api/user/reminders"] });
      setReminders((prev) => {
        const next = new Set(prev);
        next.delete(roomId);
        return next;
      });
      toast({ title: "Reminder removed", description: "You won't receive a notification for this room." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Failed to remove reminder", description: error?.message ?? "" });
    },
  });

  useEffect(() => {
    if (Array.isArray(userReminders) && userReminders.length > 0) {
      setReminders(new Set(userReminders));
    }
  }, [userReminders]);

  const handleReminderToggle = (roomId: string) => {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication required", description: "Please log in to set reminders." });
      return;
    }
    if (reminders.has(roomId)) {
      removeReminderMutation.mutate(roomId);
    } else {
      setReminderMutation.mutate(roomId);
    }
  };

  // ---------- Mutations for create/update/delete (defensive)
  const createRoomMutation = useMutation({
    mutationFn: async (data: any) => {
      // Ensure user is authenticated
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return await RoomAPI.createRoom({ ...data, hostId: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms/scheduled"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Room scheduled!", description: "Your voice room has been scheduled successfully." });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Failed to schedule room", description: err?.message ?? "" });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ roomId, data }: { roomId: string; data: any }) => {
      return await apiRequest<ScheduledRoom>("PUT", `/api/rooms/scheduled/${roomId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms/scheduled"] });
      setEditingRoom(null);
      toast({ title: "Room updated!", description: "Your scheduled room has been updated successfully." });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Failed to update room", description: err?.message ?? "" });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      return await apiRequest("DELETE", `/api/rooms/scheduled/${roomId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms/scheduled"] });
      toast({ title: "Room deleted", description: "Your scheduled room has been deleted." });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Failed to delete room", description: err?.message ?? "" });
    },
  });

  // ---------- Handlers
  const handleEditRoom = (room: ScheduledRoom) => {
    setEditingRoom(room);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteRoom = (roomId: string) => {
    if (typeof window !== "undefined" && window.confirm("Are you sure you want to delete this scheduled room?")) {
      deleteRoomMutation.mutate(roomId);
    }
  };

  // ---------- Filtering & sorting (memoized)
  const filteredRooms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = new Date();

    return scheduledRooms.filter((room) => {
      const matchesSearch =
        !q ||
        room.name.toLowerCase().includes(q) ||
        (room.topic?.toLowerCase().includes(q) ?? false);

      const matchesLanguage = languageFilter === "all" || room.language === languageFilter;

      const roomTime = new Date(room.scheduledTime);
      let matchesTime = true;
      if (timeFilter === "today") {
        matchesTime = roomTime.toDateString() === now.toDateString();
      } else if (timeFilter === "tomorrow") {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        matchesTime = roomTime.toDateString() === tomorrow.toDateString();
      } else if (timeFilter === "thisWeek") {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        matchesTime = roomTime >= weekStart && roomTime < weekEnd;
      }

      return matchesSearch && matchesLanguage && matchesTime;
    });
  }, [scheduledRooms, searchQuery, languageFilter, timeFilter]);

  const sortedRooms = useMemo(() => {
    return [...filteredRooms].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "time") {
        comparison = new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
      } else if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "participants") {
        comparison = (a.participantCount || 0) - (b.participantCount || 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [filteredRooms, sortBy, sortOrder]);

  // ---------- Rendering
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <div className="w-[450px] border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm flex flex-col h-full">
        <div className="p-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center mb-6">
            <div className="font-semibold text-xl text-slate-100">All Scheduled Tables</div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 animate-pulse">
                    <div className="h-4 bg-slate-700 rounded w-24 mb-2"></div>
                    <div className="h-6 bg-slate-700 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-slate-700 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-12 text-slate-400">Failed to load scheduled rooms. Try again later.</div>
            ) : sortedRooms.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No scheduled rooms</h3>
                <p className="text-slate-500 text-sm">{searchQuery ? "Try adjusting your search or filters" : "Get started by scheduling your first voice room"}</p>
              </div>
            ) : (
              sortedRooms.map((room) => {
                const roomTime = new Date(room.scheduledTime);
                const participantCount = room.participantCount || 0;
                const availableSlots = (room.maxParticipants || 0) - participantCount;

                return (
                  <div key={room.id} className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-slate-400 text-sm font-mono">
                          {roomTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                        </div>
                        <div className="text-slate-400 text-xs">
                          {roomTime.toLocaleDateString([], { month: "short", day: "numeric" }).toUpperCase()}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-400">{participantCount}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold text-slate-100">{room.name}</h3>
                      {room.topic && <p className="text-xs text-slate-400 line-clamp-2">{room.topic}</p>}
                      {participantCount > 0 && (
                        <p className="text-xs text-slate-400">
                          {participantCount === 1 ? "1 participant joined" : `${participantCount} participants joined`}
                          {availableSlots > 0 && ` • ${availableSlots} slots available`}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {LANGUAGES.find((l) => l.code === room.language)?.name || room.language}
                        </Badge>

                        <Button
                          size="sm"
                          onClick={() => handleReminderToggle(room.id)}
                          className={cn(
                            "px-3 py-1 h-7 text-xs",
                            reminders.has(room.id) ? "bg-green-600 hover:bg-green-700 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                          )}
                        >
                          <Bell className={cn("h-3 w-3 mr-1", reminders.has(room.id) && "fill-current")} />
                          {reminders.has(room.id) ? "Reminded" : "Remind me"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center bg-slate-900/30">
        <div className="text-center max-w-md mx-auto px-8">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-2xl">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                <Calendar className="h-12 w-12 text-orange-500" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-orange-400 mb-2">Schedule</h1>
            <p className="text-orange-200 text-lg">Plan and organize your language practice sessions</p>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
            <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="font-semibold text-xl text-slate-100 mb-2">Schedule Your Room</h2>
            <p className="text-slate-400 mb-6">Plan and organize your language practice sessions</p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-orange-100"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule New Room
            </Button>
          </div>

          {/* Create Room Dialog */}
          <RoomDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            room={undefined}
            userId={user?.id}
          />
        </div>
      </div>
    </div>
  );
}
