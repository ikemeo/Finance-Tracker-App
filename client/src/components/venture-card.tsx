import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type VentureInvestment } from "@shared/schema";
import { TrendingUp, Building2, Calendar, Target, ExternalLink, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface VentureCardProps {
  investment: VentureInvestment;
  onEdit?: (investment: VentureInvestment) => void;
  onDelete?: (investment: VentureInvestment) => void;
}

const formatCurrency = (value: string | null) => {
  if (!value) return "$0";
  const num = parseFloat(value);
  
  // Use compact notation only for values >= 1 million to avoid rounding smaller amounts
  if (num >= 1000000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num);
  } else {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);
  }
};

const calculateCurrentValue = (investment: VentureInvestment) => {
  if (investment.status === 'exited' && investment.exitAmount) {
    return parseFloat(investment.exitAmount);
  } else if (investment.currentValuation && investment.ownershipPercentage) {
    // If we have both valuation and ownership, calculate proportional value
    return parseFloat(investment.currentValuation) * parseFloat(investment.ownershipPercentage) / 100;
  } else if (investment.currentValuation) {
    // If we only have current valuation (no ownership %), use the full valuation as current value
    return parseFloat(investment.currentValuation);
  }
  return parseFloat(investment.investmentAmount);
};

const calculateROI = (investment: VentureInvestment) => {
  const currentValue = calculateCurrentValue(investment);
  const initialValue = parseFloat(investment.investmentAmount);
  return ((currentValue - initialValue) / initialValue * 100).toFixed(1);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "exited":
      return "bg-blue-100 text-blue-800";
    case "written-off":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStageColor = (stage: string) => {
  switch (stage) {
    case "pre-seed":
      return "bg-purple-100 text-purple-800";
    case "seed":
      return "bg-indigo-100 text-indigo-800";
    case "series-a":
      return "bg-blue-100 text-blue-800";
    case "series-b":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function VentureCard({ investment, onEdit, onDelete }: VentureCardProps) {
  const currentValue = calculateCurrentValue(investment);
  const roi = calculateROI(investment);
  const isPositive = parseFloat(roi) >= 0;

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{investment.companyName}</h3>
            <p className="text-sm text-gray-500 capitalize">{investment.sector}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Badge className={getStageColor(investment.stage)}>
            {investment.stage}
          </Badge>
          <Badge className={getStatusColor(investment.status)}>
            {investment.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Current Value</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(currentValue.toString())}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">ROI</p>
          <div className="flex items-center">
            <TrendingUp className={`w-4 h-4 mr-1 ${isPositive ? 'text-success' : 'text-error'}`} />
            <span className={`text-xl font-bold ${isPositive ? 'text-success' : 'text-error'}`}>
              {isPositive ? '+' : ''}{roi}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-500">Investment Amount</p>
          <p className="font-medium">{formatCurrency(investment.investmentAmount)}</p>
        </div>
        <div>
          <p className="text-gray-500">Ownership</p>
          <p className="font-medium">{investment.ownershipPercentage}%</p>
        </div>
      </div>

      {investment.currentValuation && (
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-gray-500">Company Valuation</p>
            <p className="font-medium">{formatCurrency(investment.currentValuation)}</p>
          </div>
          <div>
            <p className="text-gray-500">Lead Investor</p>
            <p className="font-medium">{investment.leadInvestor || 'N/A'}</p>
          </div>
        </div>
      )}

      {investment.status === 'exited' && investment.exitDate && investment.exitAmount && (
        <div className="border-t pt-3 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Exit Date</p>
              <p className="font-medium">{format(new Date(investment.exitDate), 'MMM yyyy')}</p>
            </div>
            <div>
              <p className="text-gray-500">Exit Amount</p>
              <p className="font-medium text-success">{formatCurrency(investment.exitAmount)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="w-4 h-4 mr-1" />
          Invested {format(new Date(investment.investmentDate), 'MMM yyyy')}
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(investment)}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={() => onDelete(investment)}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {investment.notes && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm text-gray-600">{investment.notes}</p>
        </div>
      )}
    </Card>
  );
}