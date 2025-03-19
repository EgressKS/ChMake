import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { WebSocketProvider } from "@/lib/websocket-provider";
import { AppLayout } from "@/components/app-layout";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Home from "@/pages/home";
import Room from "@/pages/room";
import PrivateMessaging from "@/pages/private-messaging";
import RoomScheduling from "@/pages/room-scheduling";
import Profile from "@/pages/profile";
import Discover from "@/pages/discover";
import Notifications from "@/pages/notifications";



// Pages that should NOT have the sidebar navigation
const PUBLIC_PAGES = ["/", "/auth/login", "/auth/register"];

function Router() {
  const [location] = useLocation();
  const isPublicPage = PUBLIC_PAGES.includes(location);

  return (
    <>
      {isPublicPage ? (
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/auth/login" component={Login} />
          <Route path="/auth/register" component={Register} />
          <Route component={NotFound} />
        </Switch>
      ) : (
        <AppLayout>
          <Switch>
            <Route path="/home" component={Home} />
            <Route path="/room/:id" component={Room} />
            <Route path="/profile" component={Profile} />
            <Route path="/messages" component={PrivateMessaging} />
            {/* <Route path="/connections" component={OnlineFollowersFollowing} /> */}
            <Route path="/schedule" component={RoomScheduling} />
            <Route path="/discover" component={Discover} />
            <Route path="/notifications" component={Notifications} />


            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <WebSocketProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </WebSocketProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
