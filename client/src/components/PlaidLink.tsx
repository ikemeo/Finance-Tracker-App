import { useCallback, useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Banknote, Building2, CreditCard, TrendingUp, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface PlaidLinkProps {
  accountId: number;
  onClose: () => void;
}

interface PlaidAccount {
  accountId: string;
  name: string;
  type: string;
  subtype: string;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
  };
  institutionName?: string;
}

interface PlaidHolding {
  accountId: string;
  symbol?: string;
  name: string;
  quantity: number;
  currentPrice: number;
  totalValue: number;
  category: string;
}

export function PlaidLink({ accountId, onClose }: PlaidLinkProps) {
  const [selectedPlaidAccount, setSelectedPlaidAccount] = useState<string>('');
  const [linkToken, setLinkToken] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [connectionStep, setConnectionStep] = useState<'initial' | 'connecting' | 'connected' | 'selecting'>('initial');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create link token on component mount with retry logic
  useEffect(() => {
    const createToken = async () => {
      try {
        await linkTokenMutation.mutateAsync();
      } catch (error) {
        // Retry once after 2 seconds if token creation fails
        setTimeout(() => {
          linkTokenMutation.mutate();
        }, 2000);
      }
    };
    createToken();
  }, []);

  // Create Plaid Link token
  const linkTokenMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: `user_${accountId}` }),
      });
    },
    onSuccess: (data) => {
      setLinkToken(data.linkToken);
      setConnectionStep('connecting');
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to initialize Plaid Link",
        variant: "destructive",
      });
    },
  });

  // Exchange public token for access token
  const exchangeTokenMutation = useMutation({
    mutationFn: async (publicToken: string) => {
      return await apiRequest('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicToken }),
      });
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      setConnectionStep('connected');
    },
    onError: (error: any) => {
      toast({
        title: "Token Exchange Failed",
        description: error.message || "Failed to connect to your bank",
        variant: "destructive",
      });
    },
  });

  // Get Plaid accounts
  const { data: plaidAccounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['/api/plaid/accounts', accessToken],
    queryFn: () => apiRequest(`/api/plaid/accounts?access_token=${accessToken}`),
    enabled: !!accessToken && connectionStep === 'connected',
  });

  // Get holdings for selected account
  const { data: plaidHoldings = [], isLoading: loadingHoldings } = useQuery({
    queryKey: ['/api/plaid/holdings', accessToken, selectedPlaidAccount],
    queryFn: () => apiRequest(`/api/plaid/holdings?access_token=${accessToken}&account_id=${selectedPlaidAccount}`),
    enabled: !!accessToken && !!selectedPlaidAccount,
  });

  // Import data from Plaid
  const importDataMutation = useMutation({
    mutationFn: async () => {
      const selectedAccount = plaidAccounts.find((acc: PlaidAccount) => acc.accountId === selectedPlaidAccount);
      if (!selectedAccount) throw new Error('No account selected');

      // Update account balance
      await apiRequest(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          balance: selectedAccount.balances.current?.toString() || '0',
          name: `${selectedAccount.institutionName} - ${selectedAccount.name}`,
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

      // Add new holdings from Plaid
      for (const holding of plaidHoldings) {
        await apiRequest('/api/holdings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId,
            symbol: holding.symbol || holding.name.substring(0, 6).toUpperCase(),
            name: holding.name,
            shares: holding.quantity.toString(),
            currentPrice: holding.currentPrice.toString(),
            totalValue: holding.totalValue.toString(),
            category: holding.category,
          }),
        });
      }

      // Log sync activity
      await apiRequest('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          type: 'sync',
          description: `Plaid sync completed - ${plaidHoldings.length} holdings imported from ${selectedAccount.institutionName}`,
          amount: null,
          symbol: null,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Import Complete",
        description: "Your account data has been successfully imported from Plaid.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/holdings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import account data.",
        variant: "destructive",
      });
    },
  });

  const handlePlaidSuccess = useCallback((publicToken: string, metadata: any) => {
    console.log('Plaid success:', { publicToken, metadata });
    exchangeTokenMutation.mutate(publicToken);
  }, [exchangeTokenMutation]);

  const handlePlaidExit = useCallback((err: any, metadata: any) => {
    console.log('Plaid exit:', { err, metadata });
    if (err) {
      toast({
        title: "Connection Failed",
        description: err.message || "Failed to connect to your financial institution",
        variant: "destructive",
      });
    }
  }, [toast]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: handlePlaidSuccess,
    onExit: handlePlaidExit,
  });

  const getAccountIcon = (type: string, subtype: string) => {
    if (type === 'investment' || subtype.includes('brokerage')) return <TrendingUp className="h-5 w-5" />;
    if (type === 'depository') return <Banknote className="h-5 w-5" />;
    if (type === 'credit') return <CreditCard className="h-5 w-5" />;
    return <Building2 className="h-5 w-5" />;
  };

  const getAccountTypeBadge = (type: string, subtype: string) => {
    if (type === 'investment') return <Badge variant="secondary">Investment</Badge>;
    if (subtype === 'checking') return <Badge variant="outline">Checking</Badge>;
    if (subtype === 'savings') return <Badge variant="outline">Savings</Badge>;
    if (subtype === 'credit card') return <Badge variant="destructive">Credit</Badge>;
    return <Badge>{subtype}</Badge>;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Connect with Plaid
        </CardTitle>
        <CardDescription>
          Connect to thousands of banks and brokerages including E*TRADE, Schwab, Fidelity, Chase, and more.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Connection Steps */}
        <div className="flex items-center gap-4 p-3 border rounded-lg">
          {connectionStep === 'initial' && (
            <>
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Ready to Connect</p>
                <p className="text-sm text-muted-foreground">Click below to connect your financial institution</p>
              </div>
            </>
          )}
          {connectionStep === 'connecting' && (
            <>
              <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
              <div>
                <p className="font-medium">Connecting...</p>
                <p className="text-sm text-muted-foreground">Opening secure connection to your bank</p>
              </div>
            </>
          )}
          {connectionStep === 'connected' && (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Connected Successfully</p>
                <p className="text-sm text-muted-foreground">Select an account to import data</p>
              </div>
            </>
          )}
        </div>

        {/* Initial Connection */}
        {connectionStep === 'initial' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Connect Your Financial Institution</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Plaid connects to over 12,000 financial institutions. Your credentials are encrypted and never stored.
              </p>
              {linkTokenMutation.isPending && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Initializing secure connection... This may take 10-15 seconds in production
                  </p>
                </div>
              )}
              <Button
                onClick={() => open()}
                disabled={!ready || linkTokenMutation.isPending}
                size="lg"
              >
                {linkTokenMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Building2 className="h-4 w-4 mr-2" />
                )}
                {linkTokenMutation.isPending ? 'Connecting to Plaid...' : (!ready ? 'Loading...' : 'Connect Account')}
              </Button>
              {linkTokenMutation.isPending && (
                <p className="text-xs text-gray-500 mt-2">
                  Using production environment for real bank connections
                </p>
              )}
            </div>
          </div>
        )}

        {/* Connecting State */}
        {connectionStep === 'connecting' && !ready && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <RefreshCw className="h-16 w-16 mx-auto text-blue-500 animate-spin mb-4" />
              <h3 className="text-lg font-semibold mb-2">Initializing Connection</h3>
              <p className="text-muted-foreground">
                Setting up secure connection to Plaid...
              </p>
            </div>
          </div>
        )}

        {/* Account Selection */}
        {connectionStep === 'connected' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-3">Select Account to Import</h3>
              {loadingAccounts ? (
                <p className="text-sm text-muted-foreground">Loading your accounts...</p>
              ) : (
                <div className="grid gap-2">
                  {plaidAccounts.map((account: PlaidAccount) => (
                    <div
                      key={account.accountId}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPlaidAccount === account.accountId
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedPlaidAccount(account.accountId)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          {getAccountIcon(account.type, account.subtype)}
                          <div>
                            <p className="font-medium">{account.name}</p>
                            <p className="text-sm text-muted-foreground">{account.institutionName}</p>
                            <div className="flex gap-2 mt-1">
                              {getAccountTypeBadge(account.type, account.subtype)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${(account.balances.current || 0).toLocaleString()}
                          </p>
                          {account.balances.available && account.balances.available !== account.balances.current && (
                            <p className="text-sm text-muted-foreground">
                              Available: ${account.balances.available.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Holdings Preview */}
            {selectedPlaidAccount && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Holdings Preview</h4>
                {loadingHoldings ? (
                  <p className="text-sm text-muted-foreground">Loading holdings...</p>
                ) : plaidHoldings.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {plaidHoldings.slice(0, 10).map((holding: PlaidHolding, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2">
                        <div>
                          <p className="font-medium">{holding.symbol || holding.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {holding.quantity} shares @ ${holding.currentPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${holding.totalValue.toLocaleString()}</p>
                          <Badge variant="outline">{holding.category}</Badge>
                        </div>
                      </div>
                    ))}
                    {plaidHoldings.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center pt-2">
                        +{plaidHoldings.length - 10} more holdings
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No holdings found for this account</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {connectionStep === 'initial' && ready && (
            <Button
              onClick={() => open()}
              disabled={!ready}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Open Plaid Link
            </Button>
          )}
          {connectionStep === 'connected' && selectedPlaidAccount && (
            <Button
              onClick={() => importDataMutation.mutate()}
              disabled={importDataMutation.isPending || loadingHoldings}
            >
              {importDataMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Building2 className="h-4 w-4 mr-2" />
              )}
              Import Account Data
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