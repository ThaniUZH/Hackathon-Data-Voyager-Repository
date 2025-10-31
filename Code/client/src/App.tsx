import { Switch, Route, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { BackgroundProvider, useBackground } from "@/contexts/BackgroundContext";
import { SidebarProvider, useSidebarContext } from "@/contexts/SidebarContext";
import { ChatAssistantProvider } from "@/contexts/ChatAssistantContext";
import { CaseProvider } from "@/contexts/CaseContext";
import AnimatedBackground from "@/components/AnimatedBackground";
import CommandPalette from "@/components/CommandPalette";
import ChatSidebar from "@/components/ChatSidebar";
import ChatAssistant from "@/components/ChatAssistant";
import IntakePage from "@/pages/intake";
import VerificationDashboard from "@/pages/verification";
import LegalReport from "@/pages/report";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Switch location={location} key={location}>
        <Route path="/" component={IntakePage} />
        <Route path="/verification" component={VerificationDashboard} />
        <Route path="/report" component={LegalReport} />
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function AppContent() {
  const [location] = useLocation();
  const { sidebarVisible, setSidebarVisible } = useSidebarContext();
  
  const showSidebar = sidebarVisible;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ChatSidebar onHide={() => setSidebarVisible(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex-1 flex flex-col overflow-hidden">
        {!sidebarVisible && (
          <div className="p-4 border-b border-border">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarVisible(true)}
              className="rounded-full"
              data-testid="button-show-sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        )}
        <Router />
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CaseProvider>
          <SidebarProvider>
            <ChatAssistantProvider>
              <BackgroundProvider>
                <AnimatedBackgroundWrapper />
                <CommandPalette />
                <ChatAssistant />
                <AppContent />
                <Toaster />
              </BackgroundProvider>
            </ChatAssistantProvider>
          </SidebarProvider>
        </CaseProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AnimatedBackgroundWrapper() {
  const { state } = useBackground();
  return <AnimatedBackground state={state} />;
}

export default App;
