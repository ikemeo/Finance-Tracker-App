import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChartPie, Building2, TrendingUp, Settings, Plus, Home, Target } from "lucide-react";
import { Link, useLocation } from "wouter";
import { type Account } from "@shared/schema";

interface SidebarProps {
  accounts: Account[];
  onAddAccount: () => void;
}

const getProviderIcon = (provider: string) => {
  switch (provider) {
    case "etrade":
      return <TrendingUp className="w-4 h-4 text-white" />;
    case "robinhood":
      return <Building2 className="w-4 h-4 text-white" />;
    case "fidelity":
      return <Building2 className="w-4 h-4 text-white" />;
    default:
      return <Building2 className="w-4 h-4 text-white" />;
  }
};

const getProviderColor = (provider: string) => {
  switch (provider) {
    case "etrade":
      return "bg-primary";
    case "robinhood":
      return "bg-secondary";
    case "fidelity":
      return "bg-accent";
    default:
      return "bg-gray-500";
  }
};

export default function Sidebar({ accounts, onAddAccount }: SidebarProps) {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
      <div className="flex flex-col h-full">
        {/* Logo and Brand */}
        <div className="flex items-center justify-center h-16 px-6 bg-primary">
          <h1 className="text-xl font-bold text-white">FinanceView</h1>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                isActive("/") 
                  ? "bg-blue-50 text-primary hover:bg-blue-100" 
                  : "hover:bg-gray-50"
              )}
            >
              <ChartPie className="mr-3 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          
          <Link href="/real-estate">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                isActive("/real-estate") 
                  ? "bg-blue-50 text-primary hover:bg-blue-100" 
                  : "hover:bg-gray-50"
              )}
            >
              <Home className="mr-3 h-4 w-4" />
              Real Estate
            </Button>
          </Link>
          
          <Link href="/venture">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                isActive("/venture") 
                  ? "bg-blue-50 text-primary hover:bg-blue-100" 
                  : "hover:bg-gray-50"
              )}
            >
              <Target className="mr-3 h-4 w-4" />
              Venture / Angel
            </Button>
          </Link>
          
          <Button variant="ghost" className="w-full justify-start hover:bg-gray-50">
            <Building2 className="mr-3 h-4 w-4" />
            Accounts
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-gray-50">
            <TrendingUp className="mr-3 h-4 w-4" />
            Performance
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-gray-50">
            <Settings className="mr-3 h-4 w-4" />
            Settings
          </Button>
        </nav>

        {/* Connected Accounts Section */}
        <div className="px-4 py-6 border-t">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Connected Accounts
          </h3>
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  account.isConnected ? "bg-green-50" : "bg-yellow-50"
                )}
              >
                <div className="flex items-center">
                  <div className={cn("w-8 h-8 rounded flex items-center justify-center", getProviderColor(account.provider))}>
                    {getProviderIcon(account.provider)}
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {account.name}
                  </span>
                </div>
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    account.isConnected ? "bg-success" : "bg-warning"
                  )}
                />
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full mt-4 text-primary border-primary hover:bg-blue-50"
            onClick={onAddAccount}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>
    </div>
  );
}
