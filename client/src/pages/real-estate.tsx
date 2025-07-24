import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import RealEstateCard from "@/components/real-estate-card";
import { type RealEstateInvestment } from "@shared/schema";

export default function RealEstatePage() {
  const { data: investments = [], isLoading } = useQuery<RealEstateInvestment[]>({
    queryKey: ["/api/real-estate"],
  });

  const handleAddProperty = () => {
    // TODO: Open add property dialog
    console.log("Add property clicked");
  };

  const handleEditProperty = (investment: RealEstateInvestment) => {
    // TODO: Open edit property dialog
    console.log("Edit property:", investment);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 ml-64">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 ml-64">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Real Estate Investments</h1>
            <p className="text-gray-600 mt-1">
              Manage your property portfolio and track performance
            </p>
          </div>
          <Button onClick={handleAddProperty} className="bg-primary text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </div>

        {investments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Yet</h3>
            <p className="text-gray-500 mb-6">
              Start tracking your real estate investments by adding your first property.
            </p>
            <Button onClick={handleAddProperty} className="bg-primary text-white">
              Add Your First Property
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {investments.map((investment) => (
              <RealEstateCard
                key={investment.id}
                investment={investment}
                onEdit={handleEditProperty}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}