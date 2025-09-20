import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth";
import BluetoothTest from "@/pages/bluetooth-test";
import SocialMediaPage from "@/pages/social-media";
import ProfilePage from "@/pages/profile";
import SettingsPage from "@/pages/settings";
import EmergencyContactsPage from "@/pages/emergency-contacts";
import CommunityPage from "@/pages/community";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/bluetooth-test" component={BluetoothTest} />
      <Route path="/social-media" component={SocialMediaPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/emergency-contacts" component={EmergencyContactsPage} />
      <Route path="/community" component={CommunityPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
