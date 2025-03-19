import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  UserPlus,
  UserMinus,
  MapPin,
  Calendar,
  Languages,
  Users,
  Flame,
  Crown
} from "lucide-react";
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
] as const;

interface InstagramUserCardProps {
  user: {
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string;
    status?: 'online' | 'away' | 'busy' | 'offline';
    languages?: Array<{ code: string; level: string }>;
    bio?: string;
    location?: string;
    lastSeen?: string;
    joinDate?: string;
    learningStreak?: number;
    totalRooms?: number;
    isFollowing?: boolean;
    isFollower?: boolean;
    followersCount?: number;
    followingCount?: number;
  };
  variant?: 'search' | 'trending' | 'profile';
  showStats?: boolean;
  onFollowToggle?: (userId: string, isFollowing: boolean) => void;
  onMessage?: (userId: string) => void;
  onProfileClick?: (userId: string) => void;
  className?: string;
}

export function InstagramUserCard({
  user,
  variant = 'search',
  showStats = true,
  onFollowToggle,
  onMessage,
  onProfileClick,
  className
}: InstagramUserCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400'
  };

  const getLanguageName = (code: string) => {
    const lang = LANGUAGES.find(l => l.code === code);
    return lang ? lang.name : code.toUpperCase();
  };

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Never';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFollowToggle?.(user.id, user.isFollowing || false);
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMessage?.(user.id);
  };

  const handleCardClick = () => {
    onProfileClick?.(user.id);
  };

  if (variant === 'trending') {
    return (
      <div
        className={cn(
          "group relative p-4 rounded-2xl bg-gradient-to-br from-card/90 to-card/50",
          "border border-border/50 hover:border-primary/30",
          "hover:shadow-xl hover:shadow-primary/5 transition-all duration-300",
          "cursor-pointer transform hover:scale-[1.02]",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* Trending indicator */}
        <div className="absolute -top-2 -right-2 z-10">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-medium">
            <Flame className="h-3 w-3" />
            Trending
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary font-bold">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {user.status && (
              <div className={cn(
                "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background",
                statusColors[user.status]
              )} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                {user.name}
              </h3>
              {user.isFollower && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  Follows you
                </Badge>
              )}
            </div>

            {user.bio && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                {user.bio}
              </p>
            )}

            {user.languages && user.languages.length > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <Languages className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {user.languages.slice(0, 2).map(lang => getLanguageName(lang.code)).join(', ')}
                  {user.languages.length > 2 && ` +${user.languages.length - 2} more`}
                </span>
              </div>
            )}

            {showStats && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{user.followersCount || 0} followers</span>
                </div>
                {user.learningStreak && user.learningStreak > 0 && (
                  <div className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    <span>{user.learningStreak} day streak</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant={user.isFollowing ? "outline" : "default"}
              onClick={handleFollow}
              className="text-xs px-3 py-1 h-7"
            >
              {user.isFollowing ? (
                <>
                  <UserMinus className="h-3 w-3 mr-1" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="h-3 w-3 mr-1" />
                  Follow
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default search variant - Instagram story style
  return (
    <div
      className={cn(
        "group relative p-5 rounded-3xl bg-gradient-to-br from-card/95 to-card/60",
        "border border-border/30 hover:border-primary/40",
        "hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500",
        "cursor-pointer transform hover:scale-[1.03] hover:-translate-y-1",
        "backdrop-blur-sm",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
        <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-primary/20 blur-xl" />
        <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-secondary/20 blur-xl" />
      </div>

      <div className="relative z-10">
        {/* Header with avatar and actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-16 w-16 ring-3 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/50 text-primary font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {user.status && (
                <div className={cn(
                  "absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-3 border-background shadow-sm",
                  statusColors[user.status]
                )} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                  {user.name}
                </h3>
                {user.isFollower && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-600 border-blue-200">
                    <Users className="h-3 w-3 mr-1" />
                    Follows you
                  </Badge>
                )}
              </div>

              {user.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{user.location}</span>
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Active {formatLastSeen(user.lastSeen)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLike}
              className={cn(
                "h-8 w-8 p-0 rounded-full hover:bg-red-500/10",
                isLiked && "text-red-500"
              )}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleMessage}
              className="h-8 w-8 p-0 rounded-full hover:bg-blue-500/10"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
            {user.bio}
          </p>
        )}

        {/* Languages */}
        {user.languages && user.languages.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {user.languages.slice(0, 4).map((lang, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs px-2 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
              >
                {getLanguageName(lang.code)} • {lang.level}
              </Badge>
            ))}
            {user.languages.length > 4 && (
              <Badge variant="outline" className="text-xs px-2 py-1">
                +{user.languages.length - 4} more
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        {showStats && (
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span className="font-medium">{user.followersCount || 0}</span>
                <span>followers</span>
              </div>
              <div className="flex items-center gap-1">
                <UserPlus className="h-3 w-3" />
                <span className="font-medium">{user.followingCount || 0}</span>
                <span>following</span>
              </div>
            </div>

            {user.learningStreak && user.learningStreak > 7 && (
              <div className="flex items-center gap-1 text-orange-600">
                <Crown className="h-3 w-3" />
                <span className="font-medium">{user.learningStreak} days</span>
              </div>
            )}
          </div>
        )}

        {/* Follow button */}
        <div className="flex justify-center">
          <Button
            variant={user.isFollowing ? "outline" : "default"}
            onClick={handleFollow}
            className={cn(
              "w-full max-w-xs transition-all duration-300",
              user.isFollowing
                ? "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                : "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl"
            )}
          >
            {user.isFollowing ? (
              <>
                <UserMinus className="h-4 w-4 mr-2" />
                Following
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Follow
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
