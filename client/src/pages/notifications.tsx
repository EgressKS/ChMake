import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Bell, MessageSquare, UserPlus, CheckCheck, Settings, Smile, Loader2 } from "lucide-react";
import { NotificationAPI } from "@/lib/api/notifications";
import { FollowAPI } from "@/lib/api/follows";
import { useToast } from "@/hooks/use-toast";

type SelectedNotification = {
  type: 'notification';
  data: Notification;
} | null;

type ViewMode = 'all' | 'requests';

export interface Notification {
  id: string;
  userId: string;
  type: string; // Now allowing string for UI compatibility
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
  timestamp?: Date; // Computed field for backward compatibility
  read?: boolean; // Computed field for backward compatibility
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  roomId?: string;
  originalType?: 'system' | 'follow' | 'room_invite' | 'room_mention' | 'like'; // Original API type
}

export default function Notifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotification, setSelectedNotification] = useState<SelectedNotification>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [acceptingRequest, setAcceptingRequest] = useState<string | null>(null);
  const [decliningRequest, setDecliningRequest] = useState<string | null>(null);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const notificationsData = await NotificationAPI.getNotifications();

      // Transform API notifications to UI format
      const transformedNotifications: Notification[] = notificationsData.map(n => {
        let uiType: string;
        switch (n.type) {
          case 'system':
            uiType = 'welcome_message';
            break;
          case 'follow':
            uiType = 'follower_request';
            break;
          default:
            uiType = 'system_update';
        }

        return {
          ...n,
          type: uiType as any, // Keep the transformed type for UI compatibility
          timestamp: new Date(n.createdAt),
          read: n.isRead ?? false,
          sender: n.data?.followerName ? {
            id: n.data?.followerId || '',
            name: n.data?.followerName || '',
            avatar: n.data?.followerAvatar || ''
          } : undefined,
          originalType: n.type // Keep original type for API calls
        };
      });

      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string, read: boolean) => {
    const iconClass = read ? "text-slate-400" : "text-orange-400";
    const bgClass = read ? "bg-slate-800" : "bg-orange-500/20";

    switch (type) {
      case 'system_update':
        return { icon: <Settings className={`h-4 w-4 ${iconClass}`} />, bg: bgClass };
      case 'welcome_message':
        return { icon: <Smile className={`h-4 w-4 ${iconClass}`} />, bg: bgClass };
      case 'follower_request':
        return { icon: <UserPlus className={`h-4 w-4 ${iconClass}`} />, bg: bgClass };
      default:
        return { icon: <Bell className={`h-4 w-4 ${iconClass}`} />, bg: bgClass };
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    switch (viewMode) {
      case 'requests':
        return notification.type === 'follower_request';
      default:
        return true;
    }
  });

  const markAsRead = (id: string) => {
    // In real app, this would call API to mark notification as read
    console.log('Marking notification as read:', id);
  };

  // Component to render notification details in the right panel
  const renderNotificationDetails = () => {
    const { type, data } = selectedNotification!;

    return (
      <ScrollArea className="h-full">
        <div className="p-6">
          {type === 'notification' && (
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-xl">
              <CardContent className="p-6 space-y-6">
                {/* Header Section */}
                <div className="space-y-3">
                  <div className="text-center border-b border-slate-700 pb-4">
                    <div className="flex items-center justify-center mb-3">
                      <div className={`p-3 rounded-full ${getNotificationIcon(data.type, data.read ?? false).bg}`}>
                        {getNotificationIcon(data.type, data.read ?? false).icon}
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{data.title}</h2>
                    <div className="flex flex-wrap items-center justify-center gap-3 text-slate-400">
                      <Badge variant="secondary" className="bg-slate-700 text-slate-200 px-3 py-1 text-sm font-medium">
                        {data.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <div className="text-sm">
                        {data.timestamp ? formatTime(data.timestamp) : 'Unknown time'}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${(data.read ?? false) ? 'bg-slate-700 text-slate-300' : 'bg-orange-500 text-white'}`}>
                        {(data.read ?? false) ? 'Read' : 'Unread'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sender Info */}
                {data.sender && (
                  <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-blue-400" />
                      From
                    </h3>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={data.sender.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white">
                          {data.sender.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{data.sender.name}</p>
                        <p className="text-sm text-slate-400">User ID: {data.sender.id}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content Section */}
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    {data.type === 'system_update' && <Settings className="h-4 w-4 text-blue-400" />}
                    {data.type === 'welcome_message' && <Smile className="h-4 w-4 text-blue-400" />}
                    {data.type === 'follower_request' && <UserPlus className="h-4 w-4 text-blue-400" />}
                    {data.type === 'system_update' ? 'Update' : data.type === 'welcome_message' ? 'Welcome' : 'Request'}
                  </h3>
                  <p className="text-slate-300 leading-relaxed">{data.message}</p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  {data.type === 'follower_request' && (
                    <div className="flex gap-2">
                      <Button className="flex-1 h-10 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all duration-200 rounded-lg">
                        Accept Request
                      </Button>
                      <Button variant="outline" className="flex-1 h-10 border-red-400 text-red-400 hover:bg-red-900 hover:text-red-300 transition-colors rounded-lg font-medium text-sm">
                        Decline
                      </Button>
                    </div>
                  )}

                  {!data.read && (
                    <Button
                      variant="outline"
                      className="w-full h-10 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors rounded-lg font-medium text-sm"
                      onClick={() => markAsRead(data.id)}
                    >
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Mark as Read
                    </Button>
                  )}
                </div>

                {/* Additional Info */}
                <div className="pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <div>Notification ID: {data.id}</div>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${data.read ? 'bg-gray-400' : 'bg-orange-400'}`} />
                      {data.read ? 'Read' : 'Unread'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    );
  };

  const getTabCount = (tab: ViewMode) => {
    return notifications.filter(n => {
      switch (tab) {
        case 'requests': return n.type === 'follower_request';
        default: return true;
      }
    }).length;
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {/* Left Sidebar - Always shows notification list */}
      <div className="w-[450px] border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-semibold text-xl text-slate-100">Notifications</h1>
          </div>

          {/* Search */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search notifications"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-20 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 p-1 bg-slate-800 rounded-lg">
              {[
                { key: 'all' as ViewMode, label: 'All', icon: Bell },
                { key: 'requests' as ViewMode, label: 'Requests', icon: UserPlus }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setViewMode(tab.key)}
                  className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 ${
                    viewMode === tab.key
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {tab.icon && <tab.icon className="h-3 w-3" />}
                  <span>{tab.label}</span>
                  <span className="text-xs opacity-75">({getTabCount(tab.key)})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
                  <Bell className="h-8 w-8 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">
                  {searchQuery ? `No notifications match "${searchQuery}"` : `No ${viewMode === 'requests' ? 'follower requests' : 'notifications'}`}
                </h3>
                <p className="text-slate-500 text-sm">
                  When you receive system updates, welcome messages, or follower requests, they'll appear here.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`border-slate-700 bg-slate-800/50 hover:bg-slate-800/70 cursor-pointer transition-colors ${!notification.read ? 'ring-1 ring-orange-500/20' : ''}`}
                  onClick={() => setSelectedNotification({ type: 'notification', data: notification })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${getNotificationIcon(notification.type, notification.read ?? false).bg}`}>
                        {getNotificationIcon(notification.type, notification.read ?? false).icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold text-sm ${!(notification.read ?? false) ? 'text-white' : 'text-slate-300'}`}>
                            {notification.title}
                          </h3>
                          {!(notification.read ?? false) && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className={`text-sm mb-2 line-clamp-2 ${!(notification.read ?? false) ? 'text-slate-300' : 'text-slate-400'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500">
                          {notification.timestamp ? formatTime(notification.timestamp) : 'Unknown time'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Always shows details or default state */}
      <div className="flex-1 bg-slate-900/30 border-l border-slate-800 transition-all duration-300 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {selectedNotification ? (
            /* Details View with Back Button */
            <div className="h-full flex flex-col">
              {/* Header with Back Button */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedNotification(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ← Back
                </Button>
                <h1 className="font-semibold text-xl text-slate-100">Notification Details</h1>
                <div className="w-10" /> {/* Spacer for centering */}
              </div>

              {/* Details Content */}
              <div className="flex-1">
                {renderNotificationDetails()}
              </div>
            </div>
          ) : (
            /* Default State */
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md mx-auto px-8">
                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-2xl">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                    <Bell className="h-12 w-12 text-orange-500" />
                  </div>
                </div>
                <h1 className="text-5xl font-bold text-orange-400 mb-2">Notifications</h1>
                <p className="text-slate-300 text-lg">
                  Click on a system update, welcome message, or follower request to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
