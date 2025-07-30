import { cn } from "@/lib/utils";

interface AccountCardProps {
  title: string;
  value: string;
  change: string;
  percentage?: string;
  icon: React.ReactNode;
  iconBg: string;
  positive?: boolean;
}

const formatCurrency = (value: string) => {
  // If value is already hidden (contains dots), return as-is
  if (value.includes('••')) {
    return value;
  }
  
  // If value is already formatted (contains dollar sign), return as-is
  if (value.includes('$')) {
    return value;
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    return value; // Return original if not a valid number
  }
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
};

export default function AccountCard({
  title,
  value,
  change,
  percentage,
  icon,
  iconBg,
  positive = true,
}: AccountCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {value.includes('••') ? value : formatCurrency(value)}
          </p>
          <div className="flex items-center mt-2">
            <span
              className={cn(
                "text-sm font-medium",
                positive ? "text-success" : "text-error"
              )}
            >
              {positive ? "+" : ""}{change}%
            </span>
            {percentage && (
              <span className="text-gray-500 text-sm ml-2">
                {percentage}
              </span>
            )}
          </div>
        </div>
        <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center shadow-sm", iconBg)}>
          <div className="text-white">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}
