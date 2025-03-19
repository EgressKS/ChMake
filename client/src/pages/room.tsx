import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Mic,
  MicOff,
  Phone,
  Users,
  MessageSquare,
  Loader2,
  X,
  Plus,
  Share2,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useWebRTCStore } from "@/lib/stores/webrtc-store";
import { useWebSocket } from "@/lib/websocket-provider";
import { useToast } from "@/hooks/use-toast";

// Lightweight helper for initials
const initials = (name?: string) => (name ? name.charAt(0).toUpperCase() : "?");

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const user = useAuthStore((s) => s.user);
  const { isMuted, setMuted } = useWebRTCStore();
  const { send, on } = useWebSocket();
  const { toast } = useToast();

  // Loading states for buttons
  const [isInviteLoading, setIsInviteLoading] = useState(false);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [isLeaveLoading, setIsLeaveLoading] = useState(false);
  const [kicked, setKicked] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Speaking permission states
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [hasRequestedToSpeak, setHasRequestedToSpeak] = useState(false);



  // ----------- Queries (kept simple, same endpoints as your original code)
  const fetchRoom = async () => {
    if (!id) throw new Error("Missing room id");
    const res = await apiRequest("GET", `/api/rooms/${id}`);
    return res;
  };

  const { data: room, isLoading, error: roomError } = useQuery({
    queryKey: ["/api/rooms", id],
    queryFn: fetchRoom,
    enabled: !!id,
    staleTime: 30_000,
  });

  const fetchMessages = async () => {
    if (!id) return [];
    const res = await apiRequest("GET", `/api/rooms/${id}/messages`);
    return res ?? [];
  };

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/rooms", id, "messages"],
    queryFn: fetchMessages,
    enabled: !!id,
    staleTime: 10_000,
  });

  // ---------- Mutations (join/leave kept)
  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: string) => apiRequest("POST", `/api/rooms/${roomId}/join`),
    onSuccess: () => {
      // Invalidate room query to refetch updated participants list
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", id] });
    },
  });

  const leaveRoomMutation = useMutation({
    mutationFn: async (roomId: string) => apiRequest("POST", `/api/rooms/${roomId}/leave`),
  });

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      setLocation("/auth/login");
      return;
    }

    if (user && id && !isLoading && !roomError && !joinRoomMutation.isSuccess) {
      joinRoomMutation.mutate(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id, isLoading, roomError]);

  // WebSocket subscription: update messages and room in cache
  useEffect(() => {
    if (!user) return;
    try {
      send?.({ type: "room:join", roomId: id });
    } catch (e) {
      console.warn("WS join failed", e);
    }

    const handler = (data: any) => {
      if (!data?.type) return;
      if (data.type === "chat:message") {
        queryClient.setQueryData(["/api/rooms", id, "messages"], (old: any[] = []) => [...old, data.message]);
      }
      if (data.type === "room:updated") {
        queryClient.setQueryData(["/api/rooms", id], data.room);
      }
      if (data.type === "user:joined" || data.type === "user:left" || data.type === "user:kicked") {
        // Invalidate room query to get updated participants list
        queryClient.invalidateQueries({ queryKey: ["/api/rooms", id] });
      }
      if (data.type === "user:kicked" && data.userId === user?.id) {
        // Current user was kicked, store info for home page and redirect immediately
        localStorage.setItem('kickedFromRoom', 'true');
        setLocation("/home");
      }

  // Handle speaking permission requests
      if (data.type === "speak:request" && hostId === user?.id) {
        // Host receives request from user
        setPendingRequests(prev => new Set([...prev, data.userId]));

        // Play notification sound if available
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {}); // Ignore if sound fails
        } catch (e) {
          // Sound not available, continue
        }

        toast({
          title: "Speaking request",
          description: `${data.userName} wants to speak.`,
        });
      }

      if (data.type === "speak:approved" && data.userId === user?.id) {
        // User receives approval
        setCanTalkUsers(prev => new Set([...prev, user.id]));
        setHasRequestedToSpeak(false);
        toast({
          title: "Speaking approved",
          description: "You can now speak in the room!",
        });
      }

      if (data.type === "speak:denied" && data.userId === user?.id) {
        // User receives denial
        setHasRequestedToSpeak(false);
        toast({
          title: "Request denied",
          description: "Your speaking request was denied by the host.",
          variant: "destructive",
        });
      }


    };

    const cleanup = on(handler);
    return () => {
      try {
        send?.({ type: "room:leave", roomId: id });
      } catch (e) {
        console.warn("WS leave failed", e);
      }
      if (typeof cleanup === "function") cleanup();
    };
  }, [user, id, send, on]);

  // Handle redirect when user is kicked
  useEffect(() => {
    if (kicked) {
      const timer = setTimeout(() => {
        setLocation("/home");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [kicked, setLocation]);

  // ---------- Simple derived participants
  const participants = (room?.participants ?? []) as any[];
  // For parity with your code, assume hostId present
  const hostId = room?.hostId;
  const host = room?.host;

  // Check if current user is host (needed early for WebSocket handling)
  const isHost = hostId === user?.id;

  // We'll keep a small local set for who can talk so the UI matches the screenshot
  // Host is always speaking (handled separately)
  const [canTalkUsers, setCanTalkUsers] = useState<Set<string>>(new Set());

  const talkingParticipants = participants.filter((p) => canTalkUsers.has(p.userId) && p.userId !== hostId);
  const listeningParticipants = participants.filter((p) => !canTalkUsers.has(p.userId) && p.userId !== hostId);

  const canTalk = isHost || canTalkUsers.has(user?.id ?? "");

  // ---------- Actions
  const handleLeaveRoom = async () => {
    setIsLeaveLoading(true);
    try {
      if (id) await leaveRoomMutation.mutateAsync(id);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLeaveLoading(false);
      setLocation("/home");
    }
  };

  const toggleMute = () => setMuted(!isMuted);

  const handleAskToJoin = () => {
    if (!user?.id || canTalkUsers.has(user.id) || hasRequestedToSpeak) return;

    // Send request to host via WebSocket
    send?.({
      type: "speak:request",
      roomId: id,
      userId: user.id,
      userName: user.name
    });

    setHasRequestedToSpeak(true);

    toast({
      title: "Request sent",
      description: "Waiting for host approval to speak.",
    });
  };

  const handleApproveRequest = (userId: string) => {
    // Grant speaking permission
    setCanTalkUsers(prev => new Set([...prev, userId]));
    setPendingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });

    // Notify the user via WebSocket
    send?.({
      type: "speak:approved",
      roomId: id,
      userId: userId
    });

    const approvedUser = participants.find((p: any) => p.userId === userId);
    toast({
      title: "Speaking approved",
      description: `${approvedUser?.user?.name || 'User'} can now speak.`,
    });
  };
  const handleKickUser = async (userId: string) => {
    if (!isHost) return;
    try {
      // Find the user being kicked to show their name in the toast
      const kickedUser = participants.find((p: any) => p.userId === userId);
      const userName = kickedUser?.user?.name || "User";

      // Call API to kick the user from the server
      await apiRequest("DELETE", `/api/rooms/${id}/kick/${userId}`);

      // Immediately invalidate the room query to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", id] });

      // Show success toast
      toast({
        title: "User kicked",
        description: `${userName} has been removed from the room.`,
      });
    } catch (e) {
      console.warn("Failed to kick user:", e);
      toast({
        variant: "destructive",
        title: "Failed to kick user",
        description: "Please try again.",
      });
    }
  };

  const handleInvite = async () => {
    setIsInviteLoading(true);
    try {
      const roomLink = `${window.location.origin}/room/${id}`;
      await navigator.clipboard.writeText(roomLink);
      toast({
        title: "Link copied!",
        description: "Room invite link has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy link",
        description: "Please try again or copy the URL manually.",
      });
    } finally {
      setIsInviteLoading(false);
    }
  };

  const handleShare = async () => {
    setIsShareLoading(true);
    try {
      const roomLink = `${window.location.origin}/room/${id}`;
      if (navigator.share) {
        await navigator.share({
          title: room?.name || 'Join my room',
          text: `Join my room: ${room?.name || 'Voice Chat Room'}`,
          url: roomLink,
        });
      } else {
        await navigator.clipboard.writeText(roomLink);
        toast({
          title: "Room link copied!",
          description: "Share this link with others to invite them to the room.",
        });
      }
    } catch (error) {
      // Share was cancelled or failed
      console.warn("Share failed:", error);
    } finally {
      setIsShareLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      await apiRequest("POST", `/api/rooms/${id}/messages`, {
        content: chatInput.trim(),
        type: "text",
      });

      // Clear the input after successful send
      setChatInput("");
    } catch (error) {
      console.warn("Failed to send message:", error);
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: "Please try again.",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };





  // UI loading and error
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Loader2 className="animate-spin w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground text-lg font-medium">Loading room...</p>
        </div>
      </div>
    );
  }

  if (roomError) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Failed to load room</h2>
          <p className="text-muted-foreground mb-6">Please try again or go back to the home page</p>
          <Button
            onClick={() => setLocation("/home")}
            className="btn-primary"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // ---------- Render UI that matches the screenshot layout
  return (
    <div className="h-screen w-full flex bg-background text-foreground">
      {/* Main content (left + center) */}
      <div className="flex-1 p-6">
        {/* Top Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold ">
              {room?.name ?? "The Future of AI in Design"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Hosted by {host?.name ?? "Host"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleLeaveRoom}
              disabled={isLeaveLoading}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLeaveLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Phone className="w-4 h-4 mr-2 rotate-45" />
              )}
              Leave
            </Button>
          </div>
        </div>

        <h3 className="text-sm text-muted-foreground font-medium mb-6">Speak ({talkingParticipants.length + 1})</h3>
        <div className="grid grid-cols-8 gap-8 mb-8">
          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="flex items-center justify-center">
              <Crown className="w-5 h-5  text-yellow-400 drop-shadow-lg" />
            </div>
            <Avatar className="w-20 h-20 shadow-xl border-4 border-background">
              <AvatarImage src={host?.avatarUrl} alt={host?.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-purple-400 text-white text-2xl font-bold">
                {initials(host?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="font-semibold text-foreground text-sm">{host?.name ?? "Sarah Chen"}</div>
          </div>

          {talkingParticipants.filter((p: any) => p.id !== hostId).slice(0, 5).map((p: any) => (
            <div key={p.id} className="flex flex-col items-center text-center animate-fade-in relative">
              {isHost && (
                <button
                  onClick={() => handleKickUser(p.userId)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Kick user"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <Avatar className="w-20 h-20 shadow-xl border-4 border-background mb-3">
                <AvatarImage src={p.user?.avatarUrl} alt={p.user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-secondary to-accent text-white text-2xl font-bold">
                  {initials(p.user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="font-semibold text-foreground text-sm truncate max-w-24">{p.user?.name}</div>
            </div>
          ))}
        </div>



        {/* Listeners */}
        <h3 className="text-sm text-muted-foreground font-medium mb-4">Listeners ({listeningParticipants.length})</h3>
        <div className="flex flex-wrap gap-4 mb-8">
          {listeningParticipants.map((p: any) => (
            <div key={p.id} className="w-24 text-center group relative">
              {isHost && (
                <button
                  onClick={() => handleKickUser(p.userId)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Kick user"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              {/* Show request indicators for users who have requested to speak */}
              {pendingRequests.has(p.userId) && (
                <>
                  <button
                    onClick={() => handleApproveRequest(p.userId)}
                    className="absolute -top-1 -left-1 w-5 h-5 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-xs shadow-lg transition-colors"
                    title="Accept speaking request"
                  >
                    <Users className="w-3 h-3" />
                  </button>
                </>
              )}
              <Avatar className="mx-auto w-14 h-14 shadow-md group-hover:shadow-lg transition-all duration-200 border border-border/50">
                <AvatarImage src={p.user?.avatarUrl} alt={p.user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-muted to-accent/20 text-muted-foreground text-lg font-semibold">
                  {initials(p.user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-xs text-muted-foreground mt-2 truncate font-medium">{p.user?.name}</div>
              {pendingRequests.has(p.userId) && (
                <div className="text-xs text-amber-600 mt-1">Requested to speak</div>
              )}
            </div>
          ))}
        </div>

        <div className="fixed bottom-6">
          <div className="flex gap-24 mx-12 mt-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 px-4 py-2 rounded-xl font-medium shadow-sm"
              onClick={handleInvite}
              disabled={isInviteLoading}
            >
              {isInviteLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Invite
            </Button>

            <Button
              size="sm"
              variant="outline"
              className={`px-4 py-2 rounded-xl font-medium shadow-sm ${
                canTalk
                  ? 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                  : hasRequestedToSpeak
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
              }`}
              onClick={handleAskToJoin}
              disabled={canTalk || hasRequestedToSpeak}
            >
              <Users className="w-4 h-4 mr-2" />
              {canTalk ? 'Speaking' : hasRequestedToSpeak ? 'Requested' : 'Ask to join'}
            </Button>

            <Button
              size="lg"
              variant="outline"
              className={`px-6 py-3 rounded-xl font-medium shadow-lg transition-all duration-200 ${isMuted
                ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:shadow-red-100'
                : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:shadow-green-100'
                }`}
              onClick={toggleMute}
            >
              {isMuted ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="bg-secondary/5 hover:bg-secondary/10 text-secondary-foreground border-secondary/20 px-4 py-2 rounded-xl font-medium shadow-sm"
              onClick={handleShare}
              disabled={isShareLoading}
            >
              {isShareLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4 mr-2" />
              )}
              Share
            </Button>

            <Button
              size="sm"
              variant="destructive"
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-xl font-medium shadow-sm"
              onClick={handleLeaveRoom}
            >
              <Phone className="w-4 h-4 mr-2 rotate-45" />
              Leave
            </Button>
          </div>

        </div>
      </div>

      {/* Right Chat sidebar */}
      <div className="w-96 border-l border-border/50 bg-card/50 backdrop-blur-sm flex flex-col">
        <div className="p-5 border-b border-border/50">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Live Chat
          </h4>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {messages.map((m: any, idx: number) => (
            <div key={idx} className="card-glass p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-foreground">{m.sender?.name ?? m.senderName}</div>
                <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                  {m.time || m.createdAt?.slice?.(11, 16)}
                </div>
              </div>
              <div className="text-sm text-foreground/90 leading-relaxed">{m.text}</div>
            </div>
          ))}

          {/* empty state */}
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No messages yet — say hi 👋</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <input
              className="input-modern flex-1 rounded-full px-4 py-3 text-sm"
              placeholder="Type a message..."
              aria-label="Chat message"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleChatKeyPress}
              disabled={isSendingMessage}
            />
            <button
              className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-purple-400 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isSendingMessage}
            >
              {isSendingMessage ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <MessageSquare className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
