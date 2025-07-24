import { Badge } from "@/components/ui/badge";
import { type Account } from "@shared/schema";
import { TrendingUp, Building2, Feather } from "lucide-react";

interface AccountPerformanceProps {
  accounts: Account[];
  performanceData: Array<Account & { changePercent: string }>;
}

const getProviderIcon = (provider: string) => {
  switch (provider) {
    case "etrade":
      return <TrendingUp className="w-4 h-4 text-white" />;
    case "robinhood":
      return <Feather className="w-4 h-4 text-white" />;
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

const formatCurrency = (value: string) => {
  const num = parseFloat(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(num);
};

export default function AccountPerformance({ accounts, performanceData }: AccountPerformanceProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Performance</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide py-3">
                Account
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide py-3">
                Balance
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide py-3">
                Change
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {performanceData.map((account) => (
              <tr key={account.id}>
                <td className="py-4">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 ${getProviderColor(account.provider)} rounded flex items-center justify-center mr-3`}>
                      {getProviderIcon(account.provider)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{account.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{account.accountType}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(account.balance)}
                  </p>
                </td>
                <td className="py-4 text-right">
                  <Badge
                    variant={parseFloat(account.changePercent) >= 0 ? "default" : "destructive"}
                    className={
                      parseFloat(account.changePercent) >= 0
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-red-100 text-red-800 hover:bg-red-100"
                    }
                  >
                    {parseFloat(account.changePercent) >= 0 ? '+' : ''}{account.changePercent}%
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
