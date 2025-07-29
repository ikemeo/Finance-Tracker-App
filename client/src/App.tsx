import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";
import Dashboard from "@/pages/dashboard";
import RealEstatePage from "@/pages/real-estate";
import VenturePage from "@/pages/venture";
import ConnectAccounts from "@/pages/connect-accounts";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 md:ml-64">
        <div className="p-4 md:p-8">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/real-estate" component={RealEstatePage} />
            <Route path="/venture" component={VenturePage} />
            <Route path="/connect-accounts" component={ConnectAccounts} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
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
