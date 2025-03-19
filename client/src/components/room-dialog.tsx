import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LANGUAGES } from "@shared/schema";
import type { InsertRoom, RoomWithHost } from "@shared/schema";
import { Clock, Calendar } from "lucide-react";

interface RoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: RoomWithHost; // If provided, it's edit mode
  userId?: string; // Current user ID for setting hostId
}

export function RoomDialog({ open, onOpenChange, room, userId }: RoomDialogProps) {
  const isEdit = !!room;
  const { toast } = useToast();

  const [formData, setFormData] = useState<InsertRoom>({
    name: "",
    language: "",
    topic: "",
    maxParticipants: 12,
    isOpen: true,
  });

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");

  // Get tomorrow time formatted for input
  const getTomorrowTimeString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Set to tomorrow
    return tomorrow.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:MM
  };

  // Get today + 24 hours formatted for input (minimum scheduling time)
  const getMinimumTimeString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Set to tomorrow (24 hours from now)
    return tomorrow.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:MM
  };

  // Pre-populate form when editing
  useEffect(() => {
    if (room && isEdit) {
      setFormData({
        name: room.name,
        language: room.language,
        topic: room.topic || "",
        maxParticipants: room.maxParticipants || 12,
        hostId: room.hostId,
        isOpen: room.isOpen,
      });
    } else {
      // Reset for create
      setFormData({
        name: "",
        language: "",
        topic: "",
        maxParticipants: 12,
        hostId: userId || "",
        isOpen: true,
      });
      setIsScheduled(false);
      setScheduledTime("");
    }
  }, [room, isEdit, userId]);

  // Set default scheduled time when scheduling is enabled
  useEffect(() => {
    if (isScheduled && !scheduledTime) {
      setScheduledTime(getTomorrowTimeString());
    }
  }, [isScheduled, scheduledTime]);

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (data: InsertRoom) => {
      return await apiRequest('POST', '/api/rooms', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      onOpenChange(false);
      setFormData({
        name: "",
        language: "",
        topic: "",
        maxParticipants: 12,
        hostId: "",
        isOpen: true,
      });
      toast({
        title: "Room created!",
        description: "Your room has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to create room",
        description: error.message,
      });
    },
  });

  // Update room mutation
  const updateRoomMutation = useMutation({
    mutationFn: async ({ roomId, data }: { roomId: string; data: Partial<InsertRoom> }) => {
      return await apiRequest('PUT', `/api/rooms/${roomId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      onOpenChange(false);
      toast({
        title: "Room updated!",
        description: "Your room has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to update room",
        description: error.message,
      });
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.language) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide a name and language for the room.",
      });
      return;
    }

    if (isScheduled && !scheduledTime) {
      toast({
        variant: "destructive",
        title: "Missing scheduled time",
        description: "Please select a time to schedule the room.",
      });
      return;
    }

    if (isEdit && room) {
      // Update mode
      const updateData: any = {
        name: formData.name,
        language: formData.language,
        topic: formData.topic,
        maxParticipants: formData.maxParticipants,
      };

      // Handle scheduling for updates (this would integrate with room scheduling system)
      if (scheduledTime) {
        // For now, just update the regular room - in a full implementation,
        // this might move the room to a scheduled state or use a separate endpoint
        updateData.scheduledTime = scheduledTime;
      }

      updateRoomMutation.mutate({
        roomId: room.id,
        data: updateData,
      });
    } else {
      // Create mode
      if (isScheduled && scheduledTime) {
        // Room is scheduled - in a full implementation, this would create a scheduled room
        // For now, create a regular room (this would be enhanced to use scheduled rooms endpoint)
        const scheduledRoomData = {
          ...formData,
          scheduledTime,
        };
        toast({
          title: "Room scheduled!",
          description: `Your room will start at ${new Date(scheduledTime).toLocaleString()}.`,
        });
        createRoomMutation.mutate(scheduledRoomData);
      } else {
        // Create immediate room
        createRoomMutation.mutate(formData);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEdit ? "Update Room" : "Create Room"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isEdit
              ? "Update your conversation room settings"
              : "Set up a new conversation room for language practice"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-white">Room Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Casual Spanish Conversation"
              className="bg-slate-800 border-slate-700 text-white mt-1"
            />
          </div>

          <div>
            <Label htmlFor="language" className="text-white">Language</Label>
            <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 ">
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="topic" className="text-white">Topic (Optional)</Label>
            <Input
              id="topic"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="Travel, Culture, Daily Life..."
              className="bg-slate-800 border-slate-700 text-white mt-1"
            />
          </div>

          <div>
            <Label htmlFor="maxParticipants" className="text-white">Max Participants</Label>
            <Select
              value={formData.maxParticipants.toString()}
              onValueChange={(value) => setFormData({ ...formData, maxParticipants: parseInt(value) })}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="4">4 people</SelectItem>
                <SelectItem value="6">6 people</SelectItem>
                <SelectItem value="8">8 people</SelectItem>
                <SelectItem value="12">12 people</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scheduling Options */}
          {!isEdit && (
            <div className="space-y-3">
              <Label className="text-white flex items-center gap-2">
                <Clock className="h-4 w-4" />
                When should the room start?
              </Label>
              <RadioGroup value={isScheduled ? "scheduled" : "now"} onValueChange={(value) => setIsScheduled(value === "scheduled")} className="space-y-2">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="now" id="now" className="border-orange-600 text-orange-600" />
                  <Label htmlFor="now" className="text-white cursor-pointer">
                    Start now
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="scheduled" id="scheduled" className="border-orange-600 text-orange-600" />
                  <Label htmlFor="scheduled" className="text-white cursor-pointer">
                    Schedule for later
                  </Label>
                </div>
              </RadioGroup>

              {isScheduled && (
                <div>
                  <Label htmlFor="scheduledTime" className="text-slate-300 text-sm">
                    Scheduled Time
                  </Label>
                  <Input
                    id="scheduledTime"
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={getMinimumTimeString()}
                    className="bg-slate-800 border-slate-700 text-white mt-1"
                  />
                </div>
              )}
            </div>
          )}

          {/* For editing, show scheduled time if it exists */}
          {isEdit && room && (
            <div className="space-y-3">
              <Label className="text-white flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </Label>
              <Input
                type="datetime-local"
                value={scheduledTime || getTomorrowTimeString()}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={getMinimumTimeString()}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createRoomMutation.isPending || updateRoomMutation.isPending}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {(createRoomMutation.isPending || updateRoomMutation.isPending)
                ? (isEdit ? "Updating..." : "Creating...")
                : (isEdit ? "Update Room" : "Create Room")
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
