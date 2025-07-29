import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type RealEstateInvestment } from "@shared/schema";
import { Building, MapPin, DollarSign, TrendingUp, Calendar, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface RealEstateCardProps {
  investment: RealEstateInvestment;
  onEdit?: (investment: RealEstateInvestment) => void;
  onDelete?: (investment: RealEstateInvestment) => void;
}

const formatCurrency = (value: string | null) => {
  if (!value) return "$0";
  const num = parseFloat(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(num);
};

const calculateROI = (currentValue: string, initialInvestment: string) => {
  const current = parseFloat(currentValue);
  const initial = parseFloat(initialInvestment);
  return ((current - initial) / initial * 100).toFixed(1);
};

const getPropertyTypeColor = (type: string) => {
  switch (type) {
    case "residential":
      return "bg-blue-100 text-blue-800";
    case "commercial":
      return "bg-green-100 text-green-800";
    case "industrial":
      return "bg-orange-100 text-orange-800";
    case "land":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function RealEstateCard({ investment, onEdit, onDelete }: RealEstateCardProps) {
  const roi = calculateROI(investment.currentValue, investment.initialInvestment);
  const isPositive = parseFloat(roi) >= 0;

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-brown-100 rounded-lg flex items-center justify-center">
            <Building className="w-6 h-6 text-brown-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{investment.propertyName}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {investment.address}
            </div>
          </div>
        </div>
        <Badge className={getPropertyTypeColor(investment.propertyType)}>
          {investment.propertyType}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Current Value</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(investment.currentValue)}
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
          <p className="text-gray-500">Initial Investment</p>
          <p className="font-medium">{formatCurrency(investment.initialInvestment)}</p>
        </div>
        <div>
          <p className="text-gray-500">Monthly Rent</p>
          <p className="font-medium">{formatCurrency(investment.monthlyRent)}</p>
        </div>
      </div>

      {investment.loanAmount && parseFloat(investment.loanAmount) > 0 && (
        <div className="border-t pt-3 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Loan Amount</p>
              <p className="font-medium">{formatCurrency(investment.loanAmount)}</p>
            </div>
            <div>
              <p className="text-gray-500">Interest Rate</p>
              <p className="font-medium">{investment.interestRate}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="w-4 h-4 mr-1" />
          Invested {format(new Date(investment.investmentDate), 'MMM yyyy')}
        </div>
        <div className="flex items-center space-x-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(investment)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDelete(investment)}
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <Trash2 className="h-4 w-4" />
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