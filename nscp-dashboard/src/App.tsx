import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerRoot } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import InspectionDetail from "@/pages/InspectionDetail";
import EadrFullView from "@/pages/EadrFullView";
import AccessibilityWidget from "@/components/AccessibilityWidget";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/inspection/:id/eadr" component={EadrFullView} />
      <Route path="/inspection/:id" component={InspectionDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <AccessibilityWidget />
        <SonnerRoot richColors position="top-center" />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
