import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { InstagramUserCard } from "@/components/instagram-user-card";
import { Search, Loader2, Users, X, Clock } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUserSearch } from "@/hooks/use-debounced-search";
import { useSearchHistory } from "@/hooks/use-search-history";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  languages?: Array<{ code: string; level: string }>;
  bio?: string;
  location?: string;
  lastSeen?: string;
  isFollowing?: boolean;
  isFollower?: boolean;
  joinDate?: string;
  learningStreak?: number;
  totalRooms?: number;
  followersCount?: number;
  followingCount?: number;
}

type SelectedItem = {
  type: 'user';
  data: User;
} | null;

type ViewMode = 'all' | 'search';

export default function Discover() {
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Search history hook
  const { history, addToHistory, removeFromHistory, getRecentSearches } = useSearchHistory();

  // Debounced search hook
  const { data: searchResults = [], isSearching, hasSearched } = useUserSearch(searchQuery, {
    status: 'all',
    language: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'follow' | 'unfollow' }) => {
      return await apiRequest('POST', `/api/users/${userId}/${action}`, {});
    },
    onSuccess: (_, { action, userId }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['debounced-search'] });
      queryClient.invalidateQueries({ queryKey: ['/api/followers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/following'] });

      toast({
        title: action === 'follow' ? "Following user" : "Unfollowed user",
        description: `You have ${action === 'follow' ? 'started following' : 'unfollowed'} this user.`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: error.message,
      });
    },
  });

  // Add to search history when search is performed
  useEffect(() => {
    if (hasSearched && searchQuery.trim() && searchResults.length >= 0) {
      addToHistory(searchQuery.trim(), searchResults.length);
    }
  }, [hasSearched, searchQuery, searchResults.length, addToHistory]);

  const handleFollowToggle = (userId: string, isFollowing: boolean) => {
    followMutation.mutate({
      userId,
      action: isFollowing ? 'unfollow' : 'follow'
    });
  };

  const handleProfileClick = (userId: string) => {
    // Navigate to user profile - for now just show a toast
    toast({
      title: "Profile",
      description: `Navigate to user profile ${userId}`,
    });
  };

  const handleMessage = (userId: string) => {
    // Navigate to messaging - for now just show a toast
    toast({
      title: "Message",
      description: `Start conversation with user ${userId}`,
    });
  };

  const recentSearches = getRecentSearches(5);

  // Component to render user details in the right panel
  const renderItemDetails = () => {
    const { type, data } = selectedItem!;

    return (
      <ScrollArea className="h-full">
        <div className="p-6">
          {type === 'user' && (
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-xl">
              <CardContent className="p-6 space-y-6">
                {/* Header Section */}
                <div className="space-y-3">
                  <div className="text-center border-b border-slate-700 pb-4">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {data.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">{data.name}</h2>
                    <div className="flex flex-wrap items-center justify-center gap-3 text-slate-400">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          data.status === 'online' ? 'bg-green-400' :
                          data.status === 'away' ? 'bg-yellow-400' :
                          data.status === 'busy' ? 'bg-red-400' : 'bg-slate-400'
                        }`} />
                        <span className="text-sm font-medium capitalize">{data.status || 'offline'}</span>
                      </div>
                      {data.isFollower && (
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                          Follows you
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                {data.bio && (
                  <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                    <h3 className="font-semibold text-white mb-2 text-base">About</h3>
                    <p className="text-slate-300 leading-relaxed text-sm">{data.bio}</p>
                  </div>
                )}

                {/* Languages Section */}
                {data.languages && data.languages.length > 0 && (
                  <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                    <h3 className="font-semibold text-white mb-3 text-base">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {data.languages.map((lang, index) => (
                        <Badge key={index} variant="outline" className="border-slate-600 text-slate-300">
                          {lang.code.toUpperCase()} • {lang.level}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats Section */}
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                  <h3 className="font-semibold text-white mb-3 text-base">Stats</h3>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-white">{data.followersCount || 0}</div>
                      <div className="text-xs text-slate-400">Followers</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">{data.followingCount || 0}</div>
                      <div className="text-xs text-slate-400">Following</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <Button
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg"
                    onClick={() => handleMessage(data.id)}
                  >
                    Send Message
                  </Button>
                  <Button
                    variant={data.isFollowing ? "outline" : "secondary"}
                    className="w-full h-10 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors rounded-lg font-medium text-sm"
                    onClick={() => handleFollowToggle(data.id, data.isFollowing || false)}
                  >
                    {data.isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {/* Left Sidebar - Always shows room list */}
      <div className="w-[450px] border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-semibold text-xl text-slate-100">Discover Users</h1>
          </div>

          {/* Search */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search users by name, languages..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => setShowSuggestions(searchQuery.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pl-10 pr-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
              {searchQuery && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-slate-400 hover:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Search Suggestions */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="p-3 border-b border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span className="text-xs font-medium text-slate-400">Recent Searches</span>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchQuery(item.query);
                            setShowSuggestions(false);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded text-left hover:bg-slate-700 transition-colors"
                        >
                          <span className="text-sm text-slate-300">{item.query}</span>
                          <span className="text-xs text-slate-500">{item.resultCount} results</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-3 w-3 text-slate-400" />
                    <span className="text-xs font-medium text-slate-400">Popular Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {['Spanish', 'French', 'Japanese', 'German', 'Italian', 'English'].map((lang) => (
                      <Button
                        key={lang}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery(lang);
                          setShowSuggestions(false);
                        }}
                        className="h-6 px-2 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        {lang}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Search Results */}
            {!hasSearched ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Search Users</h3>
                <p className="text-sm text-slate-400">
                  Find language learning partners by name, native language, or interests.
                </p>
              </div>
            ) : isSearching ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-3 text-sm text-slate-400">Searching...</span>
                </div>
                {/* Skeleton Loading */}
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-20 w-full rounded-lg bg-slate-800" />
                    </div>
                  ))}
                </div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-slate-500" />
                <h3 className="text-lg font-semibold text-slate-100 mb-2">No users found</h3>
                <p className="text-sm text-slate-400">
                  Try different search terms or check your spelling.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-100">
                    Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
                  </h2>
                </div>
                <div className="space-y-3">
                  {searchResults.map((user: User) => (
                    <Card
                      key={user.id}
                      className="border-slate-700 bg-slate-800/50 hover:bg-slate-800/70 cursor-pointer transition-colors"
                      onClick={() => setSelectedItem({ type: 'user', data: user })}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-800 ${
                              user.status === 'online' ? 'bg-green-400' :
                              user.status === 'away' ? 'bg-yellow-400' :
                              user.status === 'busy' ? 'bg-red-400' : 'bg-slate-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white truncate">{user.name}</h3>
                              {user.isFollower && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-300">
                                  Follows you
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-400">
                              {user.languages && user.languages.length > 0 && (
                                <span>{user.languages[0].code.toUpperCase()}</span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {user.followersCount || 0}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={user.isFollowing ? "outline" : "default"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollowToggle(user.id, user.isFollowing || false);
                            }}
                            className="h-8 px-3 text-xs"
                          >
                            {user.isFollowing ? 'Following' : 'Follow'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Always shows details or default state */}
      <div className="flex-1 bg-slate-900/30 border-l border-slate-800 transition-all duration-300 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {selectedItem ? (
            /* Details View with Back Button */
            <div className="h-full flex flex-col">
              {/* Header with Back Button */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ← Back
                </Button>
                <h1 className="font-semibold text-xl text-slate-100">Details</h1>
                <div className="w-10" /> {/* Spacer for centering */}
              </div>

              {/* Details Content */}
              <div className="flex-1">
                {renderItemDetails()}
              </div>
            </div>
          ) : (
            /* Default State */
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md mx-auto px-8">
                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center shadow-2xl">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                    <Users className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-primary mb-2">Discover Users</h1>
                <p className="text-slate-400 text-lg">
                  Select a user from the search results to view their profile and connect
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
