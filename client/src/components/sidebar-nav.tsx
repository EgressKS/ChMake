import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Home,
  MessageSquare,
  Bell,
  Menu,
  Calendar,
  Users,
  Search,
  Plus,
  Sparkles
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { RoomDialog } from "./room-dialog";
import { type RoomWithHost } from "@shared/schema";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  gradient?: string;
}

const navItems: NavItem[] = [
  {
    label: "Home",
    href: "/home",
    icon: Home,
    gradient: "from-purple-600 to-purple-500"
  },
  {
    label: "Messages",
    href: "/messages",
    icon: MessageSquare,
    gradient: "from-blue-600 to-blue-500"
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    gradient: "from-pink-600 to-pink-500",
  },
  {
    label: "Discover",
    href: "/discover",
    icon: Search,
    gradient: "from-emerald-600 to-emerald-500"
  },
  {
    label: "Schedule",
    href: "/schedule",
    icon: Calendar,
    gradient: "from-amber-600 to-amber-500"
  },

];

export function SidebarNav() {
  const user = useAuthStore((state) => state.user);
  const [location] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateRoom = () => {
    if (!user) {
      // This should redirect to login, but for now just show an error
      return;
    }
    setIsCreateDialogOpen(true);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-20 flex flex-col items-center py-6 bg-card-glass backdrop-blur-xl border-r border-border/50 shadow-2xl">
      {/* Logo/Brand */}
      <div className="mb-8 animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-110">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
      </div>
      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col  w-full px-3 animate-slide-up gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              onClick={handleCreateRoom}
              className=" mb-2 h-12 w-12 rounded-2xl border-white bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Create Room</p>
          </TooltipContent>
        </Tooltip>
        {navItems.map((item, index) => {
          const isActive = location === item.href ||
            (item.href === "/home" && location === "/");

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-12 w-12 rounded-2xl border-white relative transition-all duration-300 group",
                      isActive
                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg hover:shadow-xl transform scale-105`
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:scale-105"
                    )}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg animate-pulse"></span>
                    )}

                    {/* Hover effect ring */}
                    {!isActive && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm" />
                    )}
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="mt-auto animate-slide-up">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/profile">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-2xl relative transition-all duration-300 group",
                  location === "/profile"
                    ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg hover:shadow-xl transform scale-105"
                    : "hover:bg-accent/50 hover:scale-105"
                )}
              >
                <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                {/* Online indicator */}
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-r from-emerald-400 to-green-400 border-2 border-background shadow-sm" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            <p>Profile</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Create Room Dialog */}
      <RoomDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        room={undefined}
        userId={user?.id}
      />
    </aside>
  );
}
