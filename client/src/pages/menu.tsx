import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  HelpCircle,
  MessageSquare,
  LogOut,
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  BookOpen,
  Star,
  Award
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useToast } from "@/hooks/use-toast";

export default function Menu() {
  const { user, logout } = useAuthStore();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
  };

  const menuSections = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Profile Settings",
          description: "Manage your profile information",
          href: "/profile"
        },
        {
          icon: Settings,
          label: "Account Settings",
          description: "Privacy, security, and preferences",
          href: "/settings"
        },
        {
          icon: Bell,
          label: "Notification Settings",
          description: "Choose what notifications you receive",
          href: "/notifications"
        }
      ]
    },
    {
      title: "Learning",
      items: [
        {
          icon: BookOpen,
          label: "Table Management",
          description: "Manage your tables and rooms",
          href: "/tables"
        },
        {
          icon: Award,
          label: "Achievements",
          description: "View your learning progress",
          href: "/achievements"
        },
        {
          icon: Star,
          label: "Practice History",
          description: "Review your past sessions",
          href: "/history"
        }
      ]
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help & Support",
          description: "Get help and contact support",
          href: "/help"
        },
        {
          icon: MessageSquare,
          label: "Feedback",
          description: "Send us your suggestions",
          href: "/feedback"
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Menu</h1>
        <p className="text-slate-400">Manage your account and access various features</p>
      </div>

      {/* User Info Card */}
      <Card className="bg-slate-900 border-slate-900 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white">{user?.name || 'User'}</h3>
              <p className="text-slate-400">{user?.email}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  Online
                </span>
                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                  Premium
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Sections */}
      <div className="space-y-6">
        {menuSections.map((section) => (
          <Card key={section.title} className="bg-slate-900 border-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {section.items.map((item, index) => (
                <div key={index}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-4 text-left hover:bg-slate-800"
                    onClick={() => {
                      // In a real app, this would navigate to the href
                      toast({
                        title: "Coming Soon",
                        description: `${item.label} feature is coming soon!`,
                      });
                    }}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-slate-800 rounded-lg">
                        <item.icon className="h-5 w-5 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{item.label}</div>
                        <div className="text-sm text-slate-400">{item.description}</div>
                      </div>
                    </div>
                  </Button>
                  {index < section.items.length - 1 && <Separator className="my-2 bg-slate-800" />}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Logout Section */}
        <Card className="bg-slate-900 border-slate-900">
          <CardContent className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-4 text-left hover:bg-red-500/20 hover:text-red-400"
              onClick={handleLogout}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <LogOut className="h-5 w-5 text-slate-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">Sign Out</div>
                  <div className="text-sm text-slate-400">Log out of your account</div>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
