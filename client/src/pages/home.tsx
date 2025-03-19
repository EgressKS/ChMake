import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Filter, Users as UsersIcon, Trash2, Edit, Plus } from "lucide-react";
import { HiLokalRoomCard } from "@/components/hilokal-room-card";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LANGUAGES } from "@shared/schema";
import type { RoomWithHost } from "@shared/schema";
import { RoomDialog } from "@/components/room-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type ActiveTab = "all" | "following" | "new" | "your-tables";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomWithHost | undefined>(undefined);
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading, error } = useQuery<RoomWithHost[]>({
    queryKey: ["/api/rooms"],
  });

  const { data: myRooms = [] } = useQuery<RoomWithHost[]>({
    queryKey: ["/api/rooms/my"],
    enabled: !!user,
  });

  const { data: following = [] } = useQuery<{ followingId: number }[]>({
    queryKey: ["/api/following"],
    enabled: !!user,
  });

  const followingIds = new Set(following.map(f => f.followingId.toString()));

  const openRooms = rooms.filter((room) => room.isOpen);

  // Check for kick notification on component mount
  useEffect(() => {
    const wasKicked = localStorage.getItem('kickedFromRoom');
    if (wasKicked) {
      // Clear the flag
      localStorage.removeItem('kickedFromRoom');

      // Show the kick notification toast
      toast({
        variant: "destructive",
        title: "Kicked from room",
        description: "You have been removed from the room by the host.",
      });
    }
  }, [toast]);

  const tableCount = openRooms.length;
  const followingCount = openRooms.filter((room) => followingIds.has(room.hostId)).length;
  const newCount = openRooms.filter((room) => {
    const hoursSinceCreation = (Date.now() - new Date(room.createdAt).getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation < 24;
  }).length;
  const yourTablesCount = myRooms.length;

  const getFilteredRooms = (tab: ActiveTab) => {
    let roomsList = openRooms;

    switch (tab) {
      case "all":
        roomsList = openRooms;
        break;
      case "following":
        roomsList = openRooms.filter((room) => followingIds.has(room.hostId));
        break;
      case "new":
        roomsList = openRooms.filter((room) => {
          const hoursSinceCreation = (Date.now() - new Date(room.createdAt).getTime()) / (1000 * 60 * 60);
          return hoursSinceCreation < 24;
        });
        break;
      case "your-tables":
        roomsList = myRooms;
        break;
    }

    return roomsList.filter((room) => {
      const topic = room.topic?.toLowerCase() ?? "";
      const matchesSearch = searchQuery === "" ||
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  };

  const handleDeleteTable = async (tableId: string) => {
    try {
      // Delete room via API
      await apiRequest('DELETE', `/api/rooms/${tableId}`);

      toast({ title: "Room deleted successfully!", description: "Your room has been permanently removed." });
      // Refresh the rooms data
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to delete room", description: error.message });
    }
  };

  const handleRenameTable = (roomId: string, roomName: string) => {
    // Find the room by ID to edit it
    const roomToEdit = openRooms.find(room => room.id === roomId);
    if (roomToEdit) {
      setEditingRoom(roomToEdit);
      setIsRoomDialogOpen(true);
    }
  };

  const getLanguageName = (code: string) => {
    const lang = LANGUAGES.find(l => l.code === code);
    return lang?.name || code;
  };







  return (
    <div className="bg-gradient-to-br from-background via-background to-secondary/20 text-white min-h-screen flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-gradient-to-br from-background/95 via-background/95 to-secondary/20 backdrop-blur-md border-b border-border/50 shadow-lg">
        <div className="mx-auto sm:px-6 lg:px-8 py-6">
          {/* Header Section */}
          <div className="text-center lg:text-left flex items-center justify-between">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
                Discover <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Language Rooms</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl">
                Join live conversations and practice your target language with native speakers and fellow learners
              </p>
            </div>


          </div>

          {/* Search */}
          <div className="mt-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-modern pl-12 h-12 text-lg w-full"
              />
            </div>
          </div>

          {/* Sticky Tabs */}
          <div className="mt-6 pb-2">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Tables ({tableCount})</TabsTrigger>
                <TabsTrigger value="following">Following ({followingCount})</TabsTrigger>
                <TabsTrigger value="new">New ({newCount})</TabsTrigger>
                <TabsTrigger value="your-tables">Your Tables ({yourTablesCount})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)} className="w-full">
            <TabsContent value="all">
              {isLoading ? (
                <div className="flex items-center justify-center py-32">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto" />
                    <p className="text-gray-300">Loading language rooms...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-32">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                      <Search className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-red-400 text-lg">Failed to load rooms. Please try again.</p>
                  </div>
                </div>
              ) : getFilteredRooms("all").length === 0 ? (
                <div className="text-center py-32">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto">
                      <Filter className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-300 text-lg">No rooms match your current filters</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {getFilteredRooms("all").map((room: RoomWithHost, index: number) => (
                    <div
                      key={room.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <HiLokalRoomCard room={room} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="following">
              {getFilteredRooms("following").length === 0 ? (
                <div className="text-center py-32">
                  <p className="text-gray-300">No rooms from users you follow</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {getFilteredRooms("following").map((room: RoomWithHost, index: number) => (
                    <div
                      key={room.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <HiLokalRoomCard room={room} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="new">
              {getFilteredRooms("new").length === 0 ? (
                <div className="text-center py-32">
                  <p className="text-gray-300">No new rooms in the last 24 hours</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {getFilteredRooms("new").map((room: RoomWithHost, index: number) => (
                    <div
                      key={room.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <HiLokalRoomCard room={room} />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="your-tables">
              {getFilteredRooms("your-tables").length === 0 ? (
                <div className="text-center py-32">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto">
                      <UsersIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-300 text-lg">You haven't created any tables yet</p>
                    <p className="text-sm text-gray-400">Create your first table to get started</p>
                    <Button onClick={() => setIsRoomDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Table
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {getFilteredRooms("your-tables").map((room: RoomWithHost, index: number) => (
                    <div
                      key={room.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <HiLokalRoomCard
                        room={room}
                        showManagementButtons={true}
                        onEdit={handleRenameTable}
                        onDelete={handleDeleteTable}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* Room Dialog for create/edit */}
      <RoomDialog
        open={isRoomDialogOpen}
        onOpenChange={(open) => {
          setIsRoomDialogOpen(open);
          if (!open) setEditingRoom(undefined);
        }}
        room={editingRoom}
        userId={user?.id}
      />
    </div>
  );
}
