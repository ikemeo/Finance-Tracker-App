import { Button } from "@/components/ui/button";
import { type Activity } from "@shared/schema";
import { ArrowUp, ArrowDown, RefreshCw, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
  activities: Activity[];
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "buy":
      return <ArrowUp className="text-success text-xs" />;
    case "sell":
      return <ArrowDown className="text-error text-xs" />;
    case "sync":
      return <RefreshCw className="text-primary text-xs" />;
    case "error":
      return <AlertTriangle className="text-warning text-xs" />;
    default:
      return <RefreshCw className="text-gray-500 text-xs" />;
  }
};

const getActivityBg = (type: string) => {
  switch (type) {
    case "buy":
      return "bg-green-100";
    case "sell":
      return "bg-red-100";
    case "sync":
      return "bg-blue-100";
    case "error":
      return "bg-yellow-100";
    default:
      return "bg-gray-100";
  }
};

const getActivityTitle = (type: string) => {
  switch (type) {
    case "buy":
      return "Buy Order Executed";
    case "sell":
      return "Sell Order Executed";
    case "sync":
      return "Account Sync";
    case "error":
      return "Connection Issue";
    default:
      return "Activity";
  }
};

const formatCurrency = (value: string | null) => {
  if (!value) return null;
  const num = parseFloat(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(num);
};

export default function RecentActivity({ activities }: RecentActivityProps) {
  const recentActivities = activities.slice(0, 4);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
      <div className="space-y-4">
        {recentActivities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`w-8 h-8 ${getActivityBg(activity.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {getActivityTitle(activity.type)}
              </p>
              <p className="text-xs text-gray-500">{activity.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDistanceToNow(new Date(activity.timestamp!), { addSuffix: true })}
              </p>
            </div>
            {activity.amount && (
              <span className="text-sm font-medium text-gray-900">
                {activity.type === "buy" ? "+" : "+"}{formatCurrency(activity.amount)}
              </span>
            )}
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full mt-4 text-gray-600 border-gray-300 hover:bg-gray-50">
        View All Activity
      </Button>
    </div>
  );
}
