import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
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
  RefreshCw,
  Home,
  Target,
  Eye,
  EyeOff
} from "lucide-react";
import { type Account, type Holding, type Activity } from "@shared/schema";

interface PortfolioSummary {
  totalAum: number;
  traditionalAum: number;
  realEstateValue: number;
  ventureValue: number;
  categoryTotals: Record<string, number>;
  performanceData: Array<Account & { changePercent: string }>;
  lastUpdated: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  
  // Privacy controls
  const [showValues, setShowValues] = useState(true);
  const [hiddenCategories, setHiddenCategories] = useState<Record<string, boolean>>({});
  
  const toggleGlobalVisibility = () => setShowValues(!showValues);
  
  const toggleCategoryVisibility = (category: string) => {
    setHiddenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  const formatValue = (value: number, category?: string) => {
    if (!showValues || (category && hiddenCategories[category])) {
      return "••••••";
    }
    return value.toString();
  };

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
                  size="sm"
                  onClick={toggleGlobalVisibility}
                  title={showValues ? "Hide all values" : "Show all values"}
                >
                  {showValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="relative">
                <AccountCard
                  title="Total AUM"
                  value={formatValue(summary.totalAum)}
                  change="12.4"
                  percentage="vs last month"
                  icon={<Wallet className="text-primary text-xl" />}
                  iconBg="bg-primary"
                  positive={true}
                />
              </div>
              <div className="relative">
                <AccountCard
                  title="Traditional"
                  value={formatValue(summary.traditionalAum, 'traditional')}
                  change="8.2"
                  percentage={showValues && !hiddenCategories['traditional'] ? `${((summary.traditionalAum / summary.totalAum) * 100).toFixed(1)}%` : "••%"}
                  icon={<TrendingUp className="text-secondary text-xl" />}
                  iconBg="bg-secondary"
                  positive={true}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-70 hover:opacity-100"
                  onClick={() => toggleCategoryVisibility('traditional')}
                  title={hiddenCategories['traditional'] ? "Show traditional values" : "Hide traditional values"}
                >
                  {!hiddenCategories['traditional'] ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
              </div>
              <div className="relative">
                <AccountCard
                  title="Real Estate"
                  value={formatValue(summary.realEstateValue, 'realestate')}
                  change="5.7"
                  percentage={showValues && !hiddenCategories['realestate'] ? `${((summary.realEstateValue / summary.totalAum) * 100).toFixed(1)}%` : "••%"}
                  icon={<Home className="text-amber-600 text-xl" />}
                  iconBg="bg-amber-100"
                  positive={true}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-70 hover:opacity-100"
                  onClick={() => toggleCategoryVisibility('realestate')}
                  title={hiddenCategories['realestate'] ? "Show real estate values" : "Hide real estate values"}
                >
                  {!hiddenCategories['realestate'] ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
              </div>
              <div className="relative">
                <AccountCard
                  title="Venture/Angel"
                  value={formatValue(summary.ventureValue, 'venture')}
                  change="15.3"
                  percentage={showValues && !hiddenCategories['venture'] ? `${((summary.ventureValue / summary.totalAum) * 100).toFixed(1)}%` : "••%"}
                  icon={<Target className="text-purple-600 text-xl" />}
                  iconBg="bg-purple-100"
                  positive={true}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-70 hover:opacity-100"
                  onClick={() => toggleCategoryVisibility('venture')}
                  title={hiddenCategories['venture'] ? "Show venture values" : "Hide venture values"}
                >
                  {!hiddenCategories['venture'] ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
              </div>
              <div className="relative">
                <AccountCard
                  title="Crypto"
                  value={formatValue(summary.categoryTotals.crypto || 0, 'crypto')}
                  change="-3.1"
                  percentage={showValues && !hiddenCategories['crypto'] ? `${(((summary.categoryTotals.crypto || 0) / summary.totalAum) * 100).toFixed(1)}%` : "••%"}
                  icon={<Bitcoin className="text-yellow-500 text-xl" />}
                  iconBg="bg-yellow-500"
                  positive={false}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-70 hover:opacity-100"
                  onClick={() => toggleCategoryVisibility('crypto')}
                  title={hiddenCategories['crypto'] ? "Show crypto values" : "Hide crypto values"}
                >
                  {!hiddenCategories['crypto'] ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          )}

          {/* Charts and Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {summary && (
              <PortfolioChart data={{
                traditional: summary.traditionalAum,
                'real-estate': summary.realEstateValue,
                venture: summary.ventureValue,
                crypto: summary.categoryTotals.crypto || 0
              }} />
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
