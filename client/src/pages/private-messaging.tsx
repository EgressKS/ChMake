import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageBubble } from "@/components/message-bubble";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Send,
  Search,
  Plus,
  MessageSquare,
  ArrowLeft,
  MoreVertical,
  Phone,
  Video,
  Info,
  Smile,
  Bell
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "../lib/utils";

interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    status: 'online' | 'away' | 'busy' | 'offline';
  };
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
    isRead: boolean;
  };
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  isRead: boolean;
}

export default function PrivateMessaging() {
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatEmail, setNewChatEmail] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['/api/conversations', selectedConversation, 'messages'],
    enabled: !!selectedConversation,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest('POST', `/api/conversations/${selectedConversation}/messages`, {
        content,
        senderId: user!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedConversation, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });

  // Start new conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest('POST', '/api/conversations', { participantEmail: email });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setSelectedConversation(data.id);
      setIsNewChatOpen(false);
      setNewChatEmail("");
      toast({
        title: "Conversation started!",
        description: "You can now start messaging.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to start conversation",
        description: error.message,
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && selectedConversation) {
      sendMessageMutation.mutate(message);
      setMessage("");
    }
  };

  const handleStartConversation = () => {
    if (newChatEmail.trim()) {
      startConversationMutation.mutate(newChatEmail);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participant.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-screen from-background via-background to-secondary/20  text-slate-100">
      {/* Sidebar */}
      <div className="w-[450px] border-r border-slate-900 backdrop-blur-sm">
        {/* Header */}
        <div className="p-6 border-b border-slate-900">
          <div className="flex items-center justify-between mb-6">
            <Link href="/home">
              <Button variant="ghost" size="icon" className="hover:bg-slate-800 text-slate-400 hover:text-slate-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-semibold text-xl text-slate-100">Messages</h1>
            <div className="flex items-center gap-2">
              <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="hover:bg-slate-800 text-slate-400 hover:text-slate-100">
                    <Plus className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-900">
                  <DialogHeader>
                    <DialogTitle className="text-slate-100">Start New Conversation</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Enter the email address of the person you want to message
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="friend@example.com"
                      value={newChatEmail}
                      onChange={(e) => setNewChatEmail(e.target.value)}
                      type="email"
                      className="border-slate-700 text-slate-100 placeholder:text-slate-500"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsNewChatOpen(false)}
                        className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleStartConversation}
                        disabled={!newChatEmail.trim() || startConversationMutation.isPending}
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                      >
                        Start Chat
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search message title or name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No conversations found" : "No conversations yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start a new conversation to begin messaging
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-slate-800/50 mb-2",
                    selectedConversation === conversation.id && "bg-slate-800/70 border border-orange-500/30"
                  )}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.participant.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white font-semibold text-lg">
                          {conversation.participant.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-900",
                        conversation.participant.status === 'online' && "bg-green-500",
                        conversation.participant.status === 'away' && "bg-yellow-500",
                        conversation.participant.status === 'busy' && "bg-red-500",
                        conversation.participant.status === 'offline' && "bg-gray-400"
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-slate-100 text-base truncate">
                          {conversation.participant.name}
                        </p>
                        <div className="flex items-center gap-2">
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          <span className="text-xs text-slate-400">
                            {conversation.lastMessage?.timestamp ?
                              new Date(conversation.lastMessage.timestamp).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              }) : ''
                            }
                          </span>
                        </div>
                      </div>
                      {conversation.lastMessage && (
                        <p className="text-sm text-slate-400 truncate leading-relaxed">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-slate-900 bg-slate-900/50 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedConv.participant.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white font-semibold text-lg">
                        {selectedConv.participant.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-900",
                      selectedConv.participant.status === 'online' && "bg-green-500",
                      selectedConv.participant.status === 'away' && "bg-yellow-500",
                      selectedConv.participant.status === 'busy' && "bg-red-500",
                      selectedConv.participant.status === 'offline' && "bg-gray-400"
                    )} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-100 text-lg">{selectedConv.participant.name}</h2>
                    <p className="text-sm text-slate-400">
                      {selectedConv.participant.status === 'online' && "🟢 Online"}
                      {selectedConv.participant.status === 'away' && "🟡 Away"}
                      {selectedConv.participant.status === 'busy' && "🔴 Busy"}
                      {selectedConv.participant.status === 'offline' && "⚫ Offline"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="hover:bg-slate-800 text-slate-400 hover:text-slate-100">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-slate-800 text-slate-400 hover:text-slate-100">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-slate-800 text-slate-400 hover:text-slate-100">
                    <Info className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-slate-800 text-slate-400 hover:text-slate-100">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6 bg-slate-900/20">
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <MessageSquare className="h-16 w-16 text-slate-400 mb-6" />
                    <h3 className="font-semibold text-xl text-slate-100 mb-3">No messages yet</h3>
                    <p className="text-slate-400 text-base max-w-md">
                      Start the conversation by sending a message below
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.senderId === user?.id}
                      showAvatar={true}
                      showTimestamp={true}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-6 border-t border-slate-900 bg-slate-900/50 backdrop-blur-sm">
              <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="pr-12 py-3 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400 rounded-2xl min-h-[48px]"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-slate-700 text-slate-400 hover:text-slate-100"
                    >
                      <Smile className="h-5 w-5" />
                    </Button>
                  </div>
                  <Button
                    type="submit"
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl h-12"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Send
                  </Button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-8">
              {/* Hilokal Branding */}
              <div className="mb-8">
                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-2xl">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                    <MessageSquare className="h-12 w-12 text-orange-500" />
                  </div>
                </div>
                <h1 className="text-5xl font-bold text-orange-400 mb-2">Messages</h1>
                <p className="text-orange-200 text-lg">
                  Connect and chat with other language learners
                </p>
              </div>

              {/* Default messaging state */}
              <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
                <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h2 className="font-semibold text-xl text-slate-100 mb-2">Select a conversation</h2>
                <p className="text-slate-400">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
