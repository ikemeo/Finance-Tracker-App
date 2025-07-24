import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Building2, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface ETradeProductionAuthProps {
  accountId: number;
  onSuccess: () => void;
}

export function ETradeProductionAuth({ accountId, onSuccess }: ETradeProductionAuthProps) {
  const [step, setStep] = useState<'initial' | 'connecting' | 'authorizing' | 'connected'>('initial');
  const [requestToken, setRequestToken] = useState<string>('');
  const [requestTokenSecret, setRequestTokenSecret] = useState<string>('');
  const [authUrl, setAuthUrl] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Step 1: Get request token and authorization URL
  const requestTokenMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/etrade/production/request-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    },
    onSuccess: (data) => {
      setRequestToken(data.token);
      setRequestTokenSecret(data.tokenSecret);
      setAuthUrl(data.authUrl);
      setStep('authorizing');
      
      toast({
        title: "Authorization Required",
        description: "Please authorize the application on E*TRADE's website",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to E*TRADE",
        variant: "destructive",
      });
    },
  });

  // Step 3: Exchange verifier for access token
  const accessTokenMutation = useMutation({
    mutationFn: async (verifier: string) => {
      return apiRequest('/api/etrade/production/access-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestToken,
          requestTokenSecret,
          verifier,
        }),
      });
    },
    onSuccess: async (data) => {
      // Update account with access tokens
      await apiRequest(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isConnected: true,
          accessToken: data.token,
          accessTokenSecret: data.tokenSecret,
          lastSync: new Date().toISOString(),
        }),
      });

      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      setStep('connected');
      
      toast({
        title: "Connected Successfully",
        description: "Your E*TRADE account is now connected",
      });

      setTimeout(() => {
        onSuccess();
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Authorization Failed",
        description: error.message || "Failed to complete authorization",
        variant: "destructive",
      });
    },
  });

  const handleVerifierSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const verifier = formData.get('verifier') as string;
    
    if (!verifier) {
      toast({
        title: "Verification Code Required",
        description: "Please enter the verification code from E*TRADE",
        variant: "destructive",
      });
      return;
    }

    accessTokenMutation.mutate(verifier);
  }, [accessTokenMutation, toast]);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <div>
              <CardTitle>E*TRADE Production Connection</CardTitle>
              <CardDescription>
                Connect to your real E*TRADE account using production API
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step Indicator */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'initial' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
              }`}>
                1
              </div>
              <span className="text-sm">Request Authorization</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'authorizing' ? 'bg-blue-500 text-white' : 
                ['connected'].includes(step) ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="text-sm">Authorize on E*TRADE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'connected' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
              <span className="text-sm">Complete Setup</span>
            </div>
          </div>

          {/* Initial Step */}
          {step === 'initial' && (
            <div className="text-center py-8 space-y-4">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Connect to E*TRADE Production</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  This will connect to your real E*TRADE account with live data and balances.
                  Make sure your production API keys are approved by E*TRADE.
                </p>
              </div>
              <Button
                onClick={() => requestTokenMutation.mutate()}
                disabled={requestTokenMutation.isPending}
                size="lg"
              >
                {requestTokenMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Building2 className="h-4 w-4 mr-2" />
                )}
                Start Connection
              </Button>
            </div>
          )}

          {/* Authorization Step */}
          {step === 'authorizing' && authUrl && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Step 2: Authorize on E*TRADE</h3>
                <p className="text-blue-800 text-sm mb-4">
                  Click the button below to open E*TRADE's authorization page. After logging in and approving access, 
                  you'll receive a verification code.
                </p>
                <Button asChild>
                  <a href={authUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Authorize on E*TRADE
                  </a>
                </Button>
              </div>

              <form onSubmit={handleVerifierSubmit} className="space-y-4">
                <div>
                  <label htmlFor="verifier" className="block text-sm font-medium mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="verifier"
                    name="verifier"
                    placeholder="Enter the verification code from E*TRADE"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={accessTokenMutation.isPending}
                  className="w-full"
                >
                  {accessTokenMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Complete Connection
                </Button>
              </form>
            </div>
          )}

          {/* Connected Step */}
          {step === 'connected' && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">Successfully Connected!</h3>
                <p className="text-green-700">
                  Your E*TRADE production account is now connected and ready to sync data.
                </p>
              </div>
              <Badge variant="default" className="bg-green-500">
                Production Account Connected
              </Badge>
            </div>
          )}

          {/* Error States */}
          {(requestTokenMutation.isError || accessTokenMutation.isError) && (
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Connection Error</span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                {requestTokenMutation.error?.message || accessTokenMutation.error?.message}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setStep('initial');
                  setRequestToken('');
                  setRequestTokenSecret('');
                  setAuthUrl('');
                }} 
                className="mt-3"
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}