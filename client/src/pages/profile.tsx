import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Mic,
  Trophy,
  Star,
  Edit,
  LogOut,
  Plus,
  X,
  Users,
  Calendar,
  ArrowLeft,
  Settings,
  HelpCircle,
  MessageSquare,
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  BookOpen,
  Award,
  Share2,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LANGUAGES } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FollowAPI } from "@/lib/api/follows";

export default function Profile() {
  const { user, logout } = useAuthStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [isEditing, setIsEditing] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [currentLanguage, setCurrentLanguage] = useState<string>("");
  const [redirecting, setRedirecting] = useState(false);

  // Ref to track if profile has been fetched for current user to prevent unnecessary fetches
  const profileFetchedRef = useRef(false);

  // Helper: safe birthday formatter (handles Date or ISO string or undefined)
  const formatBirthday = (b: any) => {
    if (!b) return "";
    try {
      if (typeof b === "string") {
        // If string looks like "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM:SS..."
        return b.split("T")[0];
      }
      if (b instanceof Date) {
        return b.toISOString().split("T")[0];
      }
      // fallback: try to construct Date
      const d = new Date(b);
      if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
      return "";
    } catch {
      return "";
    }
  };

  // initial editForm safely built using formatBirthday
  const [editForm, setEditForm] = useState(() => ({
    name: user?.name || "",
    email: user?.email || "",
    birthday: formatBirthday(user?.birthday),
    gender: user?.gender || "",
    nationality: user?.nationality || "",
    nativeLanguage: user?.nativeLanguage || "",
    learningLanguages: user?.learningLanguages || [],
    bio: user?.bio || "",
    practiceLanguage: user?.practiceLanguage || "",
  }));

  // update editForm when user changes
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || "",
        email: user.email || "",
        birthday: formatBirthday(user.birthday),
        gender: user.gender || "",
        nationality: user.nationality || "",
        nativeLanguage: user.nativeLanguage || "",
        learningLanguages: user.learningLanguages || [],
        bio: user.bio || "",
        practiceLanguage: user.practiceLanguage || "",
      });
    }
  }, [user]);

  // Only refresh profile once per user session, not on every render or user state change
  useEffect(() => {
    let mounted = true;
    const refreshProfileData = async () => {
      if (!profileFetchedRef.current) {
        try {
          const { AuthAPI } = await import("@/lib/api/auth");
          const freshUserData = await AuthAPI.getProfile();
          if (!mounted) return;
          const { setUser } = useAuthStore.getState();
          setUser(freshUserData);
          profileFetchedRef.current = true; // Mark as fetched
          console.log("Profile data refreshed:", freshUserData);
        } catch (error) {
          console.error("Failed to refresh profile data:", error);
        }
      }
    };

    if (user && !profileFetchedRef.current) {
      refreshProfileData();
    }

    return () => {
      mounted = false;
    };
  }, [user?.id]); // Only depend on user ID, not entire user object

  // UI state
  const [showInstagramInput, setShowInstagramInput] = useState(false);
  const [instagramId, setInstagramId] = useState("");

  const getLanguageName = (code?: string) => {
    if (!code) return "";
    const l = LANGUAGES.find((x) => x.code === code);
    return l ? l.name : code;
  };

  // Followers / Following counts & lists
  const { data: followersCount, isLoading: followersCountLoading } = useQuery({
    queryKey: ["followers-count", user?.id],
    queryFn: async (): Promise<{ followersCount: number }> => {
      if (!user?.id) return { followersCount: 0 };
      const result = await FollowAPI.getFollowersCount(user.id);
      return { followersCount: result?.count ?? 0 };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent refetching too often
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  const { data: followingCount, isLoading: followingCountLoading } = useQuery({
    queryKey: ["following-count", user?.id],
    queryFn: async (): Promise<{ followingCount: number }> => {
      if (!user?.id) return { followingCount: 0 };
      const result = await FollowAPI.getFollowingCount(user.id);
      return { followingCount: result?.count ?? 0 };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: followers, isLoading: followersLoading } = useQuery({
    queryKey: ["followers", user?.id],
    queryFn: () => (user?.id ? FollowAPI.getFollowers(user.id, { limit: 20 }) : Promise.resolve([])),
    enabled: activeView === "followers" && !!user?.id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: following, isLoading: followingLoading } = useQuery({
    queryKey: ["following", user?.id],
    queryFn: () => (user?.id ? FollowAPI.getFollowing(user.id, { limit: 20 }) : Promise.resolve([])),
    enabled: activeView === "following" && !!user?.id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const displayFollowersCount = followersCount?.followersCount ?? 0;
  const displayFollowingCount = followingCount?.followingCount ?? 0;

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const { AuthAPI } = await import("@/lib/api/auth");
      return await AuthAPI.updateProfile(data);
    },
    onSuccess: (updatedUser: any) => {
      const { setUser } = useAuthStore.getState();
      setUser(updatedUser);
      // Reset profile fetched flag when profile is updated
      profileFetchedRef.current = true;
      // update local edit form
      setEditForm({
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        birthday: formatBirthday(updatedUser.birthday),
        gender: updatedUser.gender || "",
        nationality: updatedUser.nationality || "",
        nativeLanguage: updatedUser.nativeLanguage || "",
        learningLanguages: updatedUser.learningLanguages || [],
        bio: updatedUser.bio || "",
        practiceLanguage: updatedUser.practiceLanguage || "",
      });
      // Invalidate relevant queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["followers-count", updatedUser.id] });
      queryClient.invalidateQueries({ queryKey: ["following-count", updatedUser.id] });
      // Invalidate profile-related queries if needed
      queryClient.invalidateQueries({ queryKey: ["profile", updatedUser.id] });
      setIsEditing(false);
      toast({ title: "Profile updated!", description: "Your profile has been updated successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Failed to update profile", description: error?.message || "An error occurred" });
    },
  });

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleShareProfile = async () => {
    try {
      const windowUrl = window.location.origin + "/profile/" + (user?.id ?? "");
      if (navigator.share) {
        await navigator.share({
          title: `${user?.name || "User"}'s Profile`,
          text: `Check out ${user?.name || "this user"}'s profile on Hilokal!`,
          url: windowUrl,
        });
      } else {
        await navigator.clipboard.writeText(windowUrl);
        toast({ title: "Profile link copied!", description: "The profile link has been copied to your clipboard." });
      }
    } catch (e) {
      console.warn("Share failed:", e);
      toast({ variant: "destructive", title: "Share failed", description: "Could not share the profile link." });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await apiRequest("DELETE", "/api/user");
      toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
      logout();
      setLocation("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to delete account", description: error?.message || "An error occurred" });
    }
  };

  const addLanguage = () => {
    if (currentLanguage && !editForm.learningLanguages?.some((l: string) => l === currentLanguage)) {
      setEditForm({ ...editForm, learningLanguages: [...(editForm.learningLanguages || []), currentLanguage] });
      setCurrentLanguage("");
    }
  };

  const removeLanguage = (code: string) => {
    setEditForm({ ...editForm, learningLanguages: editForm.learningLanguages.filter((l: string) => l !== code) });
  };

  // IMPORTANT: only redirect when user is explicitly null (unauthenticated).
  // If `user === undefined` -> auth still loading => show a brief loading state.
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-100">
        <p>Loading profile…</p>
      </div>
    );
  }

  if (user === null) {
    // user is unauthenticated -> redirect to login once
    if (!redirecting) {
      setRedirecting(true);
      setTimeout(() => setLocation("/auth/login"), 150);
    }
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-100">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  // ---------- Render (your original UI, unchanged except using safe values & isLoading)
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <div className="w-[450px] border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm flex flex-col">
        <div className="sticky top-0 z-10 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <h1 className="font-semibold text-xl text-slate-100">My page</h1>
            <Button variant="outline" size="sm" onClick={handleShareProfile} className="text-slate-400 border-slate-700 hover:text-slate-100">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-2xl font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-bold text-lg text-slate-100">{user?.name || "User"}</h2>
              <p className="text-sm text-slate-400">NATIVE IN {getLanguageName(user?.nativeLanguage)?.toUpperCase()}</p>
              <p className="text-sm text-slate-400">
                LEARNING{" "}
                {user?.learningLanguages && user.learningLanguages.length > 0
                  ? user.learningLanguages.map((code) => getLanguageName(code)).join(", ")
                  : getLanguageName(user?.practiceLanguage)}
                {(user?.practiceLanguage || (user?.learningLanguages && user.learningLanguages.length > 0)) ? " Elementary" : ""}
              </p>
            </div>
          </div>

          {activeView === "overview" && !isEditing ? (
            <>
              <div className="space-y-3 mb-6">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit profile
                </Button>

                <Button variant="outline" className="w-full text-slate-400 border-slate-700 hover:text-slate-100" onClick={() => setActiveView("followers")}>
                  <Users className="h-4 w-4 mr-2" />
                  Followers
                </Button>

                <Button variant="outline" className="w-full text-slate-400 border-slate-700 hover:text-slate-100" onClick={() => setActiveView("following")}>
                  <User className="h-4 w-4 mr-2" />
                  Following
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-100">{followersCountLoading ? "..." : displayFollowersCount}</p>
                  <p className="text-xs text-slate-400">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-100">{followingCountLoading ? "..." : displayFollowingCount}</p>
                  <p className="text-xs text-slate-400">Following</p>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-2xl p-4 mb-4">
                {user?.bio ? <p className="text-sm text-slate-100 mb-4">{user.bio}</p> : <p className="text-sm text-slate-400 mb-4">self introduction is empty.</p>}

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">@</span>
                    </div>
                    {showInstagramInput ? (
                      <div className="flex gap-2 flex-1">
                        <Input value={instagramId} onChange={(e) => setInstagramId(e.target.value)} placeholder="Enter Instagram ID" className="bg-slate-800 border-slate-700 text-slate-100 text-sm" />
                        <Button size="sm" onClick={() => { setShowInstagramInput(false); toast({ title: "Instagram ID saved!", description: `Instagram ID set to: @${instagramId}` }); }} className="bg-orange-500 hover:bg-orange-600 text-white">
                          Save
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 cursor-pointer hover:text-slate-300" onClick={() => setShowInstagramInput(true)}>Add Instagram ID</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">▶</span>
                    </div>
                    <span className="text-sm text-slate-400">Add your full URL</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                      <Users className="h-4 w-4 text-slate-400" />
                    </div>
                    <span className="text-sm text-slate-100">Invite someone to Hilokal</span>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-slate-400 rotate-180" />
                </div>
              </div>

              <div className="space-y-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full text-red-400 border-red-400/20 hover:bg-red-400/10 hover:text-red-300">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-900 border-slate-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-slate-100">Delete Account</AlertDialogTitle>
                      <p className="text-slate-400">Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.</p>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-slate-800 text-slate-100 border-slate-700">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 text-white">Delete Account</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button variant="outline" onClick={handleLogout} className="w-full text-slate-400 border-slate-700 hover:text-slate-100">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </>
          ) : activeView === "followers" ? (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-100">Followers</h2>
                <Button variant="ghost" size="sm" onClick={() => setActiveView("overview")} className="text-slate-400 hover:text-slate-100">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {followersLoading ? <div className="text-center text-slate-400 py-8">Loading...</div> : followers && followers.length > 0 ? followers.map((follower) => (
                  <Card key={follower.id} className="bg-slate-800 border-slate-700">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-bold">{follower.name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-slate-100">{follower.name || "User"}</p>
                          <p className="text-sm text-slate-400">Native in {getLanguageName(follower.nativeLanguage)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : <div className="text-center text-slate-400 py-8">No followers yet</div>}
              </div>
            </div>
          ) : activeView === "following" ? (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-100">Following</h2>
                <Button variant="ghost" size="sm" onClick={() => setActiveView("overview")} className="text-slate-400 hover:text-slate-100">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {followingLoading ? <div className="text-center text-slate-400 py-8">Loading...</div> : following && following.length > 0 ? following.map((followed) => (
                  <Card key={followed.id} className="bg-slate-800 border-slate-700">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white text-sm font-bold">{followed.name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-slate-100">{followed.name || "User"}</p>
                          <p className="text-sm text-slate-400">Native in {getLanguageName(followed.nativeLanguage)}</p>
                        </div>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">Following</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )) : <div className="text-center text-slate-400 py-8">Not following anyone yet</div>}
              </div>
            </div>
          ) : (
            // Edit profile view
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-100">Edit my profile</h2>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-100">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Your name</label>
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="bg-slate-800 border-slate-700 text-slate-100" placeholder="Enter your name" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">E-mail</label>
                  <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400">{editForm.email} (cannot be changed)</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Birthday</label>
                  <Input type="date" value={editForm.birthday} onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })} className="bg-slate-800 border-slate-700 text-slate-100" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Gender</label>
                  <Select value={editForm.gender} onValueChange={(value) => setEditForm({ ...editForm, gender: value })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="woman">Woman</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nationality</label>
                  <Select value={editForm.nationality} onValueChange={(value) => setEditForm({ ...editForm, nationality: value })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100"><SelectValue placeholder="Select nationality" /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="india">India</SelectItem>
                      <SelectItem value="usa">United States</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="canada">Canada</SelectItem>
                      <SelectItem value="australia">Australia</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Native Language</label>
                  <Select value={editForm.nativeLanguage} onValueChange={(value) => setEditForm({ ...editForm, nativeLanguage: value })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {LANGUAGES.map((language) => <SelectItem key={language.code} value={language.code}>{language.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Learning Languages</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100 flex-1"><SelectValue placeholder="Add a language" /></SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {LANGUAGES.filter(language => language.code !== editForm.nativeLanguage).map((language) => <SelectItem key={language.code} value={language.code}>{language.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={addLanguage} className="bg-orange-500 hover:bg-orange-600 text-white"><Plus className="h-4 w-4" /></Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {editForm.learningLanguages?.map((code) => {
                        const languageName = getLanguageName(code);
                        return (
                          <Badge key={code} variant="outline" className="border-slate-600 text-slate-300 px-3 py-1 cursor-pointer" onClick={() => setEditForm({ ...editForm, learningLanguages: editForm.learningLanguages.filter(l => l !== code) })}>
                            {languageName}
                            <X className="h-3 w-3 ml-2" />
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
                  <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 resize-none" rows={3} placeholder="Tell us about yourself..." maxLength={500} />
                  <p className="text-xs text-slate-400 mt-1">{editForm.bio?.length || 0}/500 characters</p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 border-slate-700 text-slate-300">Cancel</Button>
                  <Button
                    onClick={() => {
                      const filteredData: any = {};
                      Object.entries(editForm).forEach(([key, value]) => {
                        if (value !== "" && value !== undefined && key !== "email" && key !== "id" && key !== "password" && key !== "createdAt") {
                          filteredData[key] = value;
                        }
                      });
                      updateProfileMutation.mutate(filteredData);
                    }}
                    disabled={updateProfileMutation.isPending}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-2xl">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
              <div className="text-4xl">🦊</div>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-orange-400 mb-2">hilokal</h1>
          <p className="text-slate-300 text-lg">Let your language learning journey begin! Start by listening</p>
        </div>
      </div>
    </div>
  );
}
