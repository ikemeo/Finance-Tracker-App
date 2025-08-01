import { useCallback, useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequestJson } from '@/lib/queryClient';
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
  const [connectionStep, setConnectionStep] = useState<'initial' | 'connecting' | 'connected' | 'selecting' | 'invalid-credentials'>('initial');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Don't create token automatically - wait for user click

  // Create Plaid Link token
  const linkTokenMutation = useMutation({
    mutationFn: async () => {
      return await apiRequestJson('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: `user_${accountId}` }),
      });
    },
    onSuccess: (data) => {
      setLinkToken(data.linkToken);
      setConnectionStep('connecting');
      // The useEffect will handle opening when ready
    },
    onError: (error: any) => {
      const isCredentialError = error.message.includes('PLAID_CREDENTIALS_INVALID');
      if (isCredentialError) {
        setConnectionStep('invalid-credentials');
        toast({
          title: "Plaid Credentials Invalid",
          description: "Please update your Plaid credentials to connect to financial institutions.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to initialize Plaid Link",
          variant: "destructive",
        });
      }
    },
  });

  // Exchange public token for access token
  const exchangeTokenMutation = useMutation({
    mutationFn: async (publicToken: string) => {
      return await apiRequestJson('/api/plaid/exchange-token', {
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
    queryFn: () => apiRequestJson(`/api/plaid/accounts?access_token=${accessToken}`),
    enabled: !!accessToken && connectionStep === 'connected',
  });

  // Get holdings for selected account
  const { data: plaidHoldings = [], isLoading: loadingHoldings } = useQuery({
    queryKey: ['/api/plaid/holdings', accessToken, selectedPlaidAccount],
    queryFn: () => apiRequestJson(`/api/plaid/holdings?access_token=${accessToken}&account_id=${selectedPlaidAccount}`),
    enabled: !!accessToken && !!selectedPlaidAccount,
  });

  // Import data from Plaid
  const importDataMutation = useMutation({
    mutationFn: async () => {
      const selectedAccount = plaidAccounts.find((acc: PlaidAccount) => acc.accountId === selectedPlaidAccount);
      if (!selectedAccount) throw new Error('No account selected');

      // Update account balance and store access token
      await apiRequestJson(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          balance: selectedAccount.balances.current?.toString() || '0',
          name: `${selectedAccount.institutionName} - ${selectedAccount.name}`,
          lastSync: new Date().toISOString(),
          accessToken: accessToken, // Store the Plaid access token
          externalAccountId: selectedAccount.accountId, // Store the Plaid account ID
          isConnected: true,
        }),
      });

      // Clear existing holdings
      const existingHoldings = await apiRequestJson(`/api/accounts/${accountId}/holdings`);
      for (const holding of (existingHoldings as any[])) {
        if (holding.id) {
          await apiRequestJson(`/api/holdings/${holding.id}`, { method: 'DELETE' });
        }
      }

      // Add new holdings from Plaid
      console.log('Processing Plaid holdings:', plaidHoldings);
      for (const holding of plaidHoldings) {
        const holdingData = {
          accountId,
          symbol: holding.symbol || holding.name?.substring(0, 6).toUpperCase() || 'UNKNOWN',
          name: holding.name || 'Unknown Holding',
          shares: (holding.quantity || 0).toString(),
          currentPrice: (holding.currentPrice || 0).toString(),
          totalValue: (holding.totalValue || 0).toString(),
          category: holding.category || 'stocks',
          changePercent: '0.00', // Default change percent
        };
        
        console.log('Creating holding with data:', holdingData);
        await apiRequestJson('/api/holdings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(holdingData),
        });
      }

      // Log sync activity
      await apiRequestJson('/api/activities', {
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

  // Auto-open Plaid interface when ready after token creation
  useEffect(() => {
    if (ready && linkToken && connectionStep === 'connecting') {
      console.log('Auto-opening Plaid interface');
      open();
    }
  }, [ready, linkToken, connectionStep, open]);

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
                    Initializing secure connection... This should take just a moment
                  </p>
                </div>
              )}
              <Button
                onClick={async () => {
                  if (!linkToken && !linkTokenMutation.isPending) {
                    // Create token first, then open
                    try {
                      await linkTokenMutation.mutateAsync();
                      // The token creation will trigger setConnectionStep('connecting') 
                      // and then usePlaidLink will call open() automatically
                    } catch (error) {
                      console.error('Failed to create link token:', error);
                    }
                  } else if (ready) {
                    // Token exists and ready, open immediately
                    open();
                  }
                }}
                disabled={linkTokenMutation.isPending}
                size="lg"
              >
                {linkTokenMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Building2 className="h-4 w-4 mr-2" />
                )}
                {linkTokenMutation.isPending ? 'Opening Plaid...' : 'Connect Account'}
              </Button>
              {linkTokenMutation.isPending && (
                <p className="text-xs text-gray-500 mt-2">
                  Connecting to 12,000+ financial institutions
                </p>
              )}
            </div>
          </div>
        )}

        {/* Invalid Credentials State */}
        {connectionStep === 'invalid-credentials' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-red-700">Plaid Credentials Invalid</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Your Plaid API credentials are invalid or expired. Please update them in your Plaid Dashboard.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                <h4 className="font-medium text-yellow-800 mb-2">To fix this:</h4>
                <ol className="text-sm text-yellow-700 space-y-1">
                  <li>1. Go to https://plaid.com/</li>
                  <li>2. Log into your dashboard</li>
                  <li>3. Navigate to "Keys" section</li>
                  <li>4. Copy fresh Client ID and Secret</li>
                  <li>5. Update your Replit Secrets</li>
                </ol>
              </div>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
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