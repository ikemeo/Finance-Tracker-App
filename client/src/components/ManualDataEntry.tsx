import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ManualDataEntryProps {
  accountId: number;
  onClose: () => void;
}

export function ManualDataEntry({ accountId, onClose }: ManualDataEntryProps) {
  const [accountBalance, setAccountBalance] = useState('');
  const [holdings, setHoldings] = useState([
    { symbol: '', name: '', shares: '', currentPrice: '', totalValue: '', category: 'stocks' }
  ]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateAccountMutation = useMutation({
    mutationFn: async (data: { balance: string; holdings: any[] }) => {
      // Update account balance
      await apiRequest(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: data.balance })
      });

      // Clear existing holdings for this account first
      const existingHoldings = await apiRequest(`/api/accounts/${accountId}/holdings`);
      for (const holding of existingHoldings) {
        if (holding.id) {
          await apiRequest(`/api/holdings/${holding.id}`, {
            method: 'DELETE'
          });
        }
      }

      // Add new holdings
      for (const holding of data.holdings) {
        if (holding.symbol && holding.totalValue) {
          await apiRequest('/api/holdings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accountId,
              symbol: holding.symbol,
              name: holding.name || holding.symbol,
              shares: holding.shares || '0',
              currentPrice: holding.currentPrice || '0',
              totalValue: holding.totalValue,
              category: holding.category || 'stocks'
            })
          });
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Account Updated",
        description: "Your account balance and holdings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/holdings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update account data. Please try again.",
        variant: "destructive",
      });
    }
  });

  const addHolding = () => {
    setHoldings([...holdings, { symbol: '', name: '', shares: '', currentPrice: '', totalValue: '', category: 'stocks' }]);
  };

  const updateHolding = (index: number, field: string, value: string) => {
    const updated = [...holdings];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate total value if shares and price are provided
    if (field === 'shares' || field === 'currentPrice') {
      const shares = parseFloat(updated[index].shares || '0');
      const price = parseFloat(updated[index].currentPrice || '0');
      if (shares > 0 && price > 0) {
        updated[index].totalValue = (shares * price).toFixed(2);
      }
    }
    
    setHoldings(updated);
  };

  const removeHolding = (index: number) => {
    setHoldings(holdings.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountBalance) {
      toast({
        title: "Missing Balance",
        description: "Please enter your account balance.",
        variant: "destructive",
      });
      return;
    }

    const validHoldings = holdings.filter(h => h.symbol && h.totalValue);
    updateAccountMutation.mutate({
      balance: accountBalance,
      holdings: validHoldings
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Manual Account Data Entry</CardTitle>
        <CardDescription>
          Enter your current E*TRADE account balance and holdings manually while we work on the automated sync.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="balance">Account Balance ($)</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              placeholder="e.g., 125000.00"
              value={accountBalance}
              onChange={(e) => setAccountBalance(e.target.value)}
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Holdings</Label>
              <Button type="button" onClick={addHolding} variant="outline" size="sm">
                Add Holding
              </Button>
            </div>
            
            {holdings.map((holding, index) => (
              <div key={index} className="grid grid-cols-6 gap-3 p-4 border rounded-lg">
                <div>
                  <Label htmlFor={`symbol-${index}`}>Symbol</Label>
                  <Input
                    id={`symbol-${index}`}
                    placeholder="AAPL"
                    value={holding.symbol}
                    onChange={(e) => updateHolding(index, 'symbol', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`name-${index}`}>Name</Label>
                  <Input
                    id={`name-${index}`}
                    placeholder="Apple Inc."
                    value={holding.name}
                    onChange={(e) => updateHolding(index, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`shares-${index}`}>Shares</Label>
                  <Input
                    id={`shares-${index}`}
                    type="number"
                    step="0.01"
                    placeholder="100"
                    value={holding.shares}
                    onChange={(e) => updateHolding(index, 'shares', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`price-${index}`}>Price ($)</Label>
                  <Input
                    id={`price-${index}`}
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={holding.currentPrice}
                    onChange={(e) => updateHolding(index, 'currentPrice', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`total-${index}`}>Total Value ($)</Label>
                  <Input
                    id={`total-${index}`}
                    type="number"
                    step="0.01"
                    placeholder="15000.00"
                    value={holding.totalValue}
                    onChange={(e) => updateHolding(index, 'totalValue', e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={() => removeHolding(index)}
                    variant="destructive"
                    size="sm"
                    disabled={holdings.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-3">
            <Button type="submit" disabled={updateAccountMutation.isPending}>
              {updateAccountMutation.isPending ? 'Updating...' : 'Update Account'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}