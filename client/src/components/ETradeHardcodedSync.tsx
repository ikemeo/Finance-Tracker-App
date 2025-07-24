import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { RefreshCw, CheckCircle, XCircle, Zap } from 'lucide-react';

interface ETradeAccount {
  accountId: string;
  accountType: string;
  accountDescription: string;
  accountValue: number;
}

interface ETradePosition {
  symbol: string;
  description: string;
  quantity: number;
  currentPrice: number;
  totalValue: number;
  changePercent: number;
}

interface ETradeHardcodedSyncProps {
  accountId: number;
  onClose: () => void;
}

export function ETradeHardcodedSync({ accountId, onClose }: ETradeHardcodedSyncProps) {
  const [selectedETradeAccount, setSelectedETradeAccount] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Test connection to E*TRADE API
  const { data: connectionTest, isLoading: testingConnection } = useQuery({
    queryKey: ['/api/etrade/test-connection'],
    queryFn: () => apiRequest('/api/etrade/test-connection', { method: 'POST' }),
  });

  // Get E*TRADE accounts
  const { data: etradeAccounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['/api/etrade/accounts'],
    enabled: connectionTest?.success,
  });

  // Get balance for selected account
  const { data: accountBalance, isLoading: loadingBalance } = useQuery({
    queryKey: ['/api/etrade/balance', selectedETradeAccount],
    enabled: !!selectedETradeAccount,
  });

  // Get positions for selected account
  const { data: accountPositions = [], isLoading: loadingPositions } = useQuery({
    queryKey: ['/api/etrade/positions', selectedETradeAccount],
    enabled: !!selectedETradeAccount,
  });

  const syncAccountMutation = useMutation({
    mutationFn: async () => {
      if (!selectedETradeAccount || !accountBalance) {
        throw new Error('Please select an E*TRADE account first');
      }

      // Update account balance
      await apiRequest(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          balance: accountBalance.balance.toString(),
          lastSync: new Date().toISOString(),
        }),
      });

      // Clear existing holdings
      const existingHoldings = await apiRequest(`/api/accounts/${accountId}/holdings`);
      for (const holding of existingHoldings) {
        if (holding.id) {
          await apiRequest(`/api/holdings/${holding.id}`, { method: 'DELETE' });
        }
      }

      // Add new holdings from E*TRADE positions
      for (const position of accountPositions) {
        if (position.symbol && position.totalValue > 0) {
          await apiRequest('/api/holdings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accountId,
              symbol: position.symbol,
              name: position.description,
              shares: position.quantity.toString(),
              currentPrice: position.currentPrice.toString(),
              totalValue: position.totalValue.toString(),
              category: 'stocks',
              changePercent: position.changePercent.toString(),
            }),
          });
        }
      }

      // Log sync activity
      await apiRequest('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          type: 'sync',
          description: `E*TRADE API sync completed - ${accountPositions.length} positions imported`,
          amount: null,
          symbol: null,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Sync Complete",
        description: "Your E*TRADE account data has been successfully imported.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/holdings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync E*TRADE data.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          E*TRADE API Data Sync
        </CardTitle>
        <CardDescription>
          Import real account data directly from E*TRADE using hardcoded API access tokens.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Connection Status */}
        <div className="flex items-center gap-2 p-3 border rounded-lg">
          {testingConnection ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : connectionTest?.success ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <div>
            <p className="font-medium">
              {testingConnection ? 'Testing Connection...' : 'API Connection Status'}
            </p>
            <p className="text-sm text-muted-foreground">
              {connectionTest?.message || 'Checking E*TRADE API connectivity'}
            </p>
          </div>
        </div>

        {/* Account Selection */}
        {connectionTest?.success && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-3">Select E*TRADE Account</h3>
              {loadingAccounts ? (
                <p className="text-sm text-muted-foreground">Loading E*TRADE accounts...</p>
              ) : (
                <div className="grid gap-2">
                  {etradeAccounts.map((account: ETradeAccount) => (
                    <div
                      key={account.accountId}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedETradeAccount === account.accountId
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedETradeAccount(account.accountId)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{account.accountDescription}</p>
                          <p className="text-sm text-muted-foreground">
                            {account.accountType} • ID: {account.accountId}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${account.accountValue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account Details */}
            {selectedETradeAccount && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Account Balance</h4>
                  {loadingBalance ? (
                    <p className="text-sm text-muted-foreground">Loading balance...</p>
                  ) : accountBalance ? (
                    <div className="flex gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Value</p>
                        <p className="font-semibold">${accountBalance.balance.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Available Cash</p>
                        <p className="font-semibold">${accountBalance.availableCash.toLocaleString()}</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Portfolio Positions</h4>
                  {loadingPositions ? (
                    <p className="text-sm text-muted-foreground">Loading positions...</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {accountPositions.map((position: ETradePosition, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2">
                          <div>
                            <p className="font-medium">{position.symbol}</p>
                            <p className="text-sm text-muted-foreground">
                              {position.quantity} shares @ ${position.currentPrice}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${position.totalValue.toLocaleString()}</p>
                            <Badge variant={position.changePercent >= 0 ? "default" : "destructive"}>
                              {position.changePercent > 0 ? '+' : ''}{position.changePercent.toFixed(2)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {connectionTest?.success && selectedETradeAccount && (
            <Button
              onClick={() => syncAccountMutation.mutate()}
              disabled={syncAccountMutation.isPending || loadingBalance || loadingPositions}
            >
              {syncAccountMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Import E*TRADE Data
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}