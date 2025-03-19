import { ReactNode } from "react";
import { useRoute } from "wouter";
import { SidebarNav } from "./sidebar-nav";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <SidebarNav />
      <main className={cn("min-h-screen ml-20", className)}>
        <div className="mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}
