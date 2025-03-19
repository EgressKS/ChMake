import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Volume2, Play, Clock, Star, MapPin, Trash2, Edit } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { RoomWithHost } from "@shared/schema";
import { LANGUAGES } from "@shared/schema";

interface HiLokalRoomCardProps {
  room: RoomWithHost & {
    speakers?: Array<{ id: string; name: string; avatarUrl?: string | null }>;
    listeners?: Array<{ id: string; name: string; avatarUrl?: string | null }>;
  };
  className?: string;
  showManagementButtons?: boolean;
  onEdit?: (roomId: string, roomName: string) => void;
  onDelete?: (roomId: string) => void;
}

export function HiLokalRoomCard({ room, className, showManagementButtons, onEdit, onDelete }: HiLokalRoomCardProps) {
  // Helper function to get language name from code
  const getLanguageName = (code: string | undefined) => {
    if (!code) return '';
    const language = LANGUAGES.find(lang => lang.code === code);
    return language ? language.name : '';
  };

  const participantCount = (room.participants?.length || 0);
  const displayParticipants = (room.participants?.slice(0, 6) || []);
  const remainingCount = participantCount > 6 ? participantCount - 6 : 0;

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      'en': 'from-blue-500 to-cyan-500',
      'es': 'from-green-500 to-emerald-500',
      'fr': 'from-purple-500 to-indigo-500',
      'de': 'from-gray-500 to-slate-500',
      'it': 'from-orange-500 to-amber-500',
      'pt': 'from-teal-500 to-green-500',
      'ja': 'from-pink-500 to-rose-500',
      'ko': 'from-red-500 to-orange-500',
      'zh': 'from-yellow-500 to-orange-500',
      'ru': 'from-blue-600 to-indigo-600',
    };
    return colors[language.toLowerCase()] || 'from-purple-500 to-pink-500';
  };

  const timeSinceCreation = Math.floor((Date.now() - new Date(room.createdAt).getTime()) / (1000 * 60));
  const isNew = timeSinceCreation < 60; // Less than 1 hour

  return (
    <Card className={cn(
      "card-modern group hover:scale-105 cursor-pointer overflow-hidden",
      className
    )}>
      <Link href={`/room/${room.id}`}>
        <CardContent className="p-6">
          {/* Header with participants and live indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {displayParticipants.map((participant, index) => (
                  <Avatar key={participant.id || index} className="h-12 w-12 border-2 border-background shadow-md">
                    <AvatarImage src={participant.avatarUrl || undefined} />
                    <AvatarFallback className="rounded-full border-2 border-background bg-gradient-to-br from-purple-500 to-pink-500" />
                  </Avatar>
                ))}
                {remainingCount > 0 && (
                  <div className="h-10 w-10 rounded-full border-2 border-background bg-card flex items-center justify-center shadow-md">
                    <span className="text-sm text-muted-foreground font-medium">+{remainingCount}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-green-400 animate-pulse" />
              <span className="text-sm text-muted-foreground font-medium">Live</span>
            </div>
          </div>

          {/* Main content with image area */}
          <div className="flex gap-4 mb-4">
            {/* Left content area */}
            <div className="flex-1">
              {/* Room info */}
              <div className="mb-6 flex flex-row justify-between">
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1 group-hover:text-purple-400 transition-colors">
                    {room.name}
                  </h3>
                </div>

                {/* Language and level badge */}
                <div className="flex items-center justify-between">
                  <Badge
                    className={cn(
                      "bg-gradient-to-r text-white border-0 font-medium px-3 py-1",
                      getLanguageColor(room.language)
                    )}
                  >
                    {getLanguageName(room.language).toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Room stats */}
              <div className="flex items-center justify-between mb-4 border-t border-border/50 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{participantCount}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{timeSinceCreation < 60 ? `${timeSinceCreation}m ago` : `${Math.floor(timeSinceCreation / 60)}h ago`}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>Public Room</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action button */}
          <Button className="w-full btn-primary gap-2 h-12 text-base font-medium shadow-lg group-hover:shadow-xl transition-all duration-300">
            <Play className="h-4 w-4" />
            Join Conversation
          </Button>
        </CardContent>
      </Link>

      {/* Management buttons for owned rooms - outside Link wrapper */}
      {showManagementButtons && (
        <div className="p-6 pt-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onEdit?.(room.id, room.name);
              }}
              className="flex-1 gap-2 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <Edit className="h-3 w-3" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-900 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-slate-100">Delete Room</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Are you sure you want to delete "{room.name}"? This action cannot be undone and all room data will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-800 text-slate-100 border-slate-700">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete?.(room.id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete Room
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </Card>
  );
}
