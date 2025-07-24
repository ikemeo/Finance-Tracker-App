import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, ExternalLink, CheckCircle, Clock } from 'lucide-react';

export function CredentialsSetup() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">API Credentials Setup</h2>
        <p className="text-muted-foreground">Here's exactly what credentials you need and where to get them</p>
      </div>

      {/* E*TRADE Production Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>E*TRADE Production API</CardTitle>
            <Badge variant="secondary">Pending Approval</Badge>
          </div>
          <CardDescription>Your real E*TRADE account data when approved</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Environment Variable:</h4>
              <code className="text-sm bg-muted p-2 rounded block">ETRADE_PRODUCTION_CONSUMER_KEY</code>
              <p className="text-xs text-muted-foreground mt-2">
                Your production Consumer Key from E*TRADE developer portal
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Environment Variable:</h4>
              <code className="text-sm bg-muted p-2 rounded block">ETRADE_PRODUCTION_CONSUMER_SECRET</code>
              <p className="text-xs text-muted-foreground mt-2">
                Your production Consumer Secret from E*TRADE developer portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Waiting for E*TRADE approval - will connect to real accounts when ready</span>
          </div>
        </CardContent>
      </Card>

      {/* Plaid Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>Plaid API</CardTitle>
            <Badge variant="default">Ready to Use</Badge>
          </div>
          <CardDescription>Connect to 12,000+ financial institutions instantly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Environment Variable:</h4>
              <code className="text-sm bg-muted p-2 rounded block">PLAID_CLIENT_ID</code>
              <p className="text-xs text-muted-foreground mt-2">
                Looks like: 60c1b5c2a7f8b1002d4e8f9a
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Environment Variable:</h4>
              <code className="text-sm bg-muted p-2 rounded block">PLAID_SECRET</code>
              <p className="text-xs text-muted-foreground mt-2">
                Sandbox key for development/testing
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              How to Get Plaid Credentials (Free)
            </h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Visit <strong>plaid.com</strong> → "Get API Keys"</li>
              <li>Sign up for free developer account</li>
              <li>Verify email and complete basic info</li>
              <li>Go to "Keys" in your dashboard</li>
              <li>Copy "client_id" and "sandbox secret"</li>
            </ol>
          </div>

          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Works immediately - connects E*TRADE, Schwab, Fidelity, Chase, and 12,000+ others</span>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>E*TRADE Production API</span>
              <Badge variant="secondary">Pending Keys</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Plaid Universal Connection</span>
              <Badge variant="secondary">Awaiting Credentials</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Manual Data Entry</span>
              <Badge variant="default">Ready</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Demo Data</span>
              <Badge variant="default">Available</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}