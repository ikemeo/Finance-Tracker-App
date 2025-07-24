import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/ui/sidebar";
import PortfolioChart from "@/components/portfolio-chart";
import AccountCard from "@/components/account-card";
import TopHoldings from "@/components/top-holdings";
import AccountPerformance from "@/components/account-performance";
import RecentActivity from "@/components/recent-activity";
import { 
  Wallet, 
  TrendingUp, 
  Layers, 
  Bitcoin, 
  RefreshCw 
} from "lucide-react";
import { type Account, type Holding, type Activity } from "@shared/schema";

interface PortfolioSummary {
  totalAum: number;
  categoryTotals: Record<string, number>;
  performanceData: Array<Account & { changePercent: string }>;
  lastUpdated: string;
}

export default function Dashboard() {
  const { toast } = useToast();

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: holdings = [], isLoading: holdingsLoading } = useQuery<Holding[]>({
    queryKey: ["/api/holdings"],
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<PortfolioSummary>({
    queryKey: ["/api/portfolio/summary"],
  });

  const refreshMutation = useMutation({
    mutationFn: () => fetch("/api/portfolio/refresh", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio/summary"] });
      toast({
        title: "Portfolio Refreshed",
        description: "Your portfolio data has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh portfolio data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddAccount = () => {
    toast({
      title: "Add Account",
      description: "Account connection feature coming soon!",
    });
  };

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  if (accountsLoading || holdingsLoading || activitiesLoading || summaryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar accounts={accounts} onAddAccount={handleAddAccount} />

      <div className="ml-64 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Portfolio Overview</h1>
                {summary && (
                  <p className="text-sm text-gray-500 mt-1">
                    Last updated: {formatLastUpdated(summary.lastUpdated)}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={refreshMutation.isPending}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                  {refreshMutation.isPending ? 'Refreshing...' : 'Refresh'}
                </Button>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="w-2 h-2 bg-success rounded-full mr-2"></span>
                  All systems operational
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 p-6">
          {/* AUM Overview Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <AccountCard
                title="Total AUM"
                value={summary.totalAum.toString()}
                change="12.4"
                percentage="vs last month"
                icon={<Wallet className="text-primary text-xl" />}
                iconBg="bg-primary"
                positive={true}
              />
              <AccountCard
                title="Stocks"
                value={(summary.categoryTotals.stocks || 0).toString()}
                change="8.2"
                percentage="62.0%"
                icon={<TrendingUp className="text-secondary text-xl" />}
                iconBg="bg-secondary"
                positive={true}
              />
              <AccountCard
                title="ETFs"
                value={(summary.categoryTotals.etfs || 0).toString()}
                change="5.7"
                percentage="22.0%"
                icon={<Layers className="text-accent text-xl" />}
                iconBg="bg-accent"
                positive={true}
              />
              <AccountCard
                title="Crypto"
                value={(summary.categoryTotals.crypto || 0).toString()}
                change="-3.1"
                percentage="16.0%"
                icon={<Bitcoin className="text-yellow-500 text-xl" />}
                iconBg="bg-yellow-500"
                positive={false}
              />
            </div>
          )}

          {/* Charts and Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {summary && (
              <PortfolioChart data={summary.categoryTotals} />
            )}
            <TopHoldings holdings={holdings} />
          </div>

          {/* Account Performance and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {summary && (
              <AccountPerformance 
                accounts={accounts} 
                performanceData={summary.performanceData} 
              />
            )}
            <RecentActivity activities={activities} />
          </div>
        </main>
      </div>
    </div>
  );
}
