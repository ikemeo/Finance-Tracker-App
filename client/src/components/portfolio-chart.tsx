import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface PortfolioChartProps {
  data: Record<string, number>;
}

const COLORS = {
  stocks: "#1565C0",
  etfs: "#2E7D32",
  crypto: "#F57C00",
  bonds: "#9C27B0",
  cash: "#607D8B",
  "real-estate": "#8D6E63",
  venture: "#7B1FA2"
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

export default function PortfolioChart({ data }: PortfolioChartProps) {
  const chartData = Object.entries(data).map(([category, value]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value,
    color: COLORS[category as keyof typeof COLORS] || "#607D8B"
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">{formatCurrency(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Portfolio Allocation</h3>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 text-xs font-medium text-primary bg-blue-50 rounded-full">
            1M
          </button>
          <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-full">
            3M
          </button>
          <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-full">
            1Y
          </button>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={40}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              align="right"
              verticalAlign="middle"
              layout="vertical"
              wrapperStyle={{ paddingLeft: "20px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
