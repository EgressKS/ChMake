import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "@/components/message-bubble";
import { Send, Paperclip, Image, FileText, Book } from "lucide-react";
import { type MessageWithSender } from "@shared/schema";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useWebSocket } from "@/lib/websocket-provider";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ChatPanelProps {
  roomId: string;
  messages: MessageWithSender[];
  canTalk?: boolean;
}

export function ChatPanel({ roomId, messages, canTalk = false }: ChatPanelProps) {
  const user = useAuthStore((state) => state.user);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { send, isConnected } = useWebSocket();
  const { toast } = useToast();

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest('POST', `/api/rooms/${roomId}/messages`, {
        roomId,
        senderId: user!.id,
        content,
        type: 'text',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms', roomId, 'messages'] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      if (isConnected) {
        send({
          type: 'chat:message',
          roomId,
          content: message,
          senderId: user!.id,
          senderName: user!.name,
        });
      } else {
        sendMessageMutation.mutate(message);
      }
      setMessage("");
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);

    try {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select a file smaller than 10MB",
        });
        return;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'text/plain', 'text/csv',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Unsupported file type",
          description: "Please upload images, PDFs, or text documents",
        });
        return;
      }

      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', roomId);
      formData.append('senderId', user.id);

      // Upload file
      const response = await fetch(`/api/rooms/${roomId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const result = await response.json();

      // Send file message via WebSocket
      if (isConnected) {
        send({
          type: 'chat:file',
          roomId,
          fileName: file.name,
          fileUrl: result.fileUrl,
          fileType: file.type,
          fileSize: file.size,
          senderId: user.id,
          senderName: user.name,
        });
      }

      toast({
        title: "File uploaded",
        description: `${file.name} has been shared with the room`,
      });

    } catch (error) {
      console.error('File upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (e.target.value.trim() && !isTyping) {
      setIsTyping(true);
    } else if (!e.target.value.trim() && isTyping) {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-full flex-col from-background via-background to-secondary/20">
      {/* Chat Header */}
      <div className="border-b border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm">Chat</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <div className={cn(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-red-500"
              )} />
              {isConnected ? "Connected" : "Disconnected"}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center mx-auto mb-2">
                  <Send className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-sm text-gray-300">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.userId === user?.id;
              const isSystem = msg.type === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center text-xs italic text-gray-400 py-2">
                    <div className="inline-block px-2 py-1 rounded-full bg-gray-600/30 text-xs">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              return (
                <MessageBubble
                  key={msg.id}
                  message={{
                    id: msg.id,
                    content: msg.content,
                    senderId: msg.userId,
                    sender: msg.sender ? {
                      id: msg.sender.id,
                      name: msg.sender.name,
                      avatar: msg.sender.avatarUrl
                    } : {
                      id: msg.userId,
                      name: 'Unknown User',
                      avatar: undefined
                    },
                    timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : new Date().toISOString(),
                    isRead: true
                  }}
                  isOwn={isOwnMessage}
                  showAvatar={true}
                  showTimestamp={true}
                />
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-gray-700 p-3">
        <form onSubmit={handleSend} className="space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={triggerFileUpload}
              disabled={!canTalk || isUploading}
              className="shrink-0 text-gray-400 hover:text-white hover:bg-gray-700/50 h-8 w-8"
              title="Upload file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={message}
              onChange={handleInputChange}
              placeholder={canTalk ? "Message..." : "You can only listen in this room"}
              disabled={!canTalk}
              className="flex-1 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 text-sm h-8"
              data-testid="input-chat-message"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!canTalk || !message.trim() || sendMessageMutation.isPending}
              className="shrink-0 bg-blue-600 hover:bg-blue-700 h-8 w-8"
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="flex gap-1">
                <div className="h-1 w-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-1 w-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-1 w-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>Typing...</span>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <div className="h-1 w-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span>Uploading file...</span>
            </div>
          )}
        </form>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          accept="image/*,.pdf,.txt,.csv,.doc,.docx"
          className="hidden"
        />
      </div>
    </div>
  );
}
