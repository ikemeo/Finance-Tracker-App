import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Plus, Settings, CheckCircle, XCircle, AlertCircle, Plug } from 'lucide-react';
import { ETradeAuth } from '@/components/ETradeAuth';
import { apiRequestJson } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Account } from '@shared/schema';

export default function ConnectAccounts() {
  const [showETradeAuth, setShowETradeAuth] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ['/api/accounts']
  });

  const syncMutation = useMutation({
    mutationFn: async (accountId: number) => {
      return apiRequestJson(`/api/accounts/${accountId}/sync`, {
        method: 'POST'
      });
    },
    onSuccess: (data, accountId) => {
      toast({
        title: "Sync Complete",
        description: "Account data has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/holdings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] });
    },
    onError: (error: any, accountId) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const createAccountMutation = useMutation({
    mutationFn: async (provider: string) => {
      return apiRequestJson('/api/accounts', {
        method: 'POST',
        body: JSON.stringify({
          name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Account`,
          provider,
          accountType: 'individual',
          balance: '0.00',
          isConnected: false
        })
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      if (data.provider === 'etrade') {
        setSelectedAccountId(data.id);
        setShowETradeAuth(true);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Account",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getStatusIcon = (account: Account) => {
    if (!account.isConnected) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    const lastSync = account.lastSync ? new Date(account.lastSync) : null;
    const isRecent = lastSync && (Date.now() - lastSync.getTime()) < 24 * 60 * 60 * 1000; // 24 hours
    
    if (isRecent) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = (account: Account) => {
    if (!account.isConnected) {
      return 'Not Connected';
    }
    
    const lastSync = account.lastSync ? new Date(account.lastSync) : null;
    if (!lastSync) {
      return 'Connected';
    }
    
    const timeDiff = Date.now() - lastSync.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    
    if (hours < 1) {
      return 'Just synced';
    } else if (hours < 24) {
      return `Synced ${hours}h ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `Synced ${days}d ago`;
    }
  };

  if (showETradeAuth && selectedAccountId) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setShowETradeAuth(false)}
            className="mb-4"
          >
            ← Back to Accounts
          </Button>
        </div>
        <ETradeAuth 
          accountId={selectedAccountId}
          onSuccess={() => {
            setShowETradeAuth(false);
            setSelectedAccountId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Connect Accounts</h1>
        <p className="text-muted-foreground">
          Connect your brokerage accounts to automatically sync your portfolio data.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Connected Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plug className="h-5 w-5" />
              Connected Accounts
            </CardTitle>
            <CardDescription>
              Manage your connected brokerage accounts and sync data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading accounts...</div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No accounts connected yet. Add your first account below.
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(account)}
                      <div>
                        <h3 className="font-medium">{account.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {account.provider.toUpperCase()} • {account.accountType}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Balance: ${parseFloat(account.balance).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={account.isConnected ? "default" : "secondary"}>
                        {getStatusText(account)}
                      </Badge>
                      {account.isConnected ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => syncMutation.mutate(account.id)}
                          disabled={syncMutation.isPending}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                          Sync
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            if (account.provider === 'etrade') {
                              setSelectedAccountId(account.id);
                              setShowETradeAuth(true);
                            }
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add New Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Account
            </CardTitle>
            <CardDescription>
              Connect a new brokerage account to your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                    onClick={() => createAccountMutation.mutate('etrade')}>
                <CardContent className="p-6 text-center">
                  <div className="mb-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl font-bold text-blue-600">E</span>
                    </div>
                    <h3 className="font-semibold">E*TRADE</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Connect your E*TRADE brokerage account
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full"
                    disabled={createAccountMutation.isPending}
                  >
                    {createAccountMutation.isPending ? 'Adding...' : 'Add E*TRADE'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="opacity-50">
                <CardContent className="p-6 text-center">
                  <div className="mb-2">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl font-bold text-green-600">S</span>
                    </div>
                    <h3 className="font-semibold">Schwab</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Coming soon - Schwab integration
                    </p>
                  </div>
                  <Button size="sm" className="w-full" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}