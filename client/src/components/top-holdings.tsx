import { Button } from "@/components/ui/button";
import { type Holding } from "@shared/schema";
import { Bitcoin } from "lucide-react";

interface TopHoldingsProps {
  holdings: Holding[];
}

const getHoldingIcon = (symbol: string, category: string) => {
  if (category === "crypto") {
    return <Bitcoin className="text-yellow-500" />;
  }
  
  return (
    <span className="text-white text-sm font-bold">
      {symbol.slice(0, 4)}
    </span>
  );
};

const getHoldingBg = (category: string) => {
  switch (category) {
    case "stocks":
      return "bg-gray-900";
    case "crypto":
      return "bg-orange-500";
    case "etfs":
      return "bg-blue-600";
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

export default function TopHoldings({ holdings }: TopHoldingsProps) {
  const topHoldings = holdings
    .sort((a, b) => parseFloat(b.totalValue) - parseFloat(a.totalValue))
    .slice(0, 4);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Holdings</h3>
      <div className="space-y-4">
        {topHoldings.map((holding) => (
          <div key={holding.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-10 h-10 ${getHoldingBg(holding.category)} rounded-lg flex items-center justify-center`}>
                {getHoldingIcon(holding.symbol, holding.category)}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{holding.name}</p>
                <p className="text-xs text-gray-500">{holding.shares} shares</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(holding.totalValue)}
              </p>
              <p className={`text-xs ${parseFloat(holding.changePercent) >= 0 ? 'text-success' : 'text-error'}`}>
                {parseFloat(holding.changePercent) >= 0 ? '+' : ''}{holding.changePercent}%
              </p>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full mt-4 text-primary border-primary hover:bg-blue-50">
        View All Holdings
      </Button>
    </div>
  );
}
