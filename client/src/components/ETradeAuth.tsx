import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequestJson } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ETradeAuthProps {
  accountId: number;
  onSuccess: () => void;
}

export function ETradeAuth({ accountId, onSuccess }: ETradeAuthProps) {
  const [step, setStep] = useState<'start' | 'verify'>('start');
  const [authData, setAuthData] = useState<{
    authUrl: string;
    requestToken: string;
    requestTokenSecret: string;
  } | null>(null);
  const [verifier, setVerifier] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startAuthMutation = useMutation({
    mutationFn: async () => {
      return apiRequestJson('/api/auth/etrade/start', {
        method: 'POST',
        body: JSON.stringify({ accountId })
      });
    },
    onSuccess: (data) => {
      setAuthData(data);
      setStep('verify');
      window.open(data.authUrl, '_blank');
    },
    onError: (error: any) => {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const completeAuthMutation = useMutation({
    mutationFn: async () => {
      if (!authData || !verifier) throw new Error('Missing authentication data');
      
      return apiRequestJson('/api/auth/etrade/complete', {
        method: 'POST',
        body: JSON.stringify({
          accountId,
          requestToken: authData.requestToken,
          requestTokenSecret: authData.requestTokenSecret,
          verifier
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "E*TRADE account connected successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (step === 'start') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Connect E*TRADE Account
          </CardTitle>
          <CardDescription>
            Connect your E*TRADE account to sync your portfolio data automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You'll be redirected to E*TRADE to authorize access to your account data.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={() => startAuthMutation.mutate()} 
            disabled={startAuthMutation.isPending}
            className="w-full"
          >
            {startAuthMutation.isPending ? 'Connecting...' : 'Connect E*TRADE Account'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete E*TRADE Authorization</CardTitle>
        <CardDescription>
          Enter the verification code from E*TRADE to complete the connection.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <ExternalLink className="h-4 w-4" />
          <AlertDescription>
            After authorizing on E*TRADE, you'll receive a verification code. Enter it below.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="verifier">Verification Code</Label>
          <Input
            id="verifier"
            value={verifier}
            onChange={(e) => setVerifier(e.target.value)}
            placeholder="Enter verification code from E*TRADE"
          />
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setStep('start')}
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={() => completeAuthMutation.mutate()}
            disabled={completeAuthMutation.isPending || !verifier}
            className="flex-1"
          >
            {completeAuthMutation.isPending ? 'Connecting...' : 'Complete Connection'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}