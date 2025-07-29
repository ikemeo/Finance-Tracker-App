/**
 * Plaid Fallback Service - Demo mode when credentials are invalid
 * This provides a working demo while user gets valid Plaid credentials
 */

export interface PlaidAccount {
  accountId: string;
  name: string;
  type: string;
  subtype: string;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
  };
  institutionName: string;
}

export interface PlaidHolding {
  accountId: string;
  symbol?: string;
  name: string;
  quantity: number;
  currentPrice: number;
  totalValue: number;
  category: string;
}

export class PlaidFallbackService {
  
  /**
   * Create a demo Link token (returns instruction message)
   */
  async createLinkToken(userId: string): Promise<string> {
    // Return a special token that indicates demo mode
    return 'demo-mode-invalid-credentials';
  }

  /**
   * Demo accounts for when Plaid credentials are invalid
   */
  async getAccounts(): Promise<PlaidAccount[]> {
    return [
      {
        accountId: 'demo_brokerage_001',
        name: 'Investment Account',
        type: 'investment',
        subtype: 'brokerage',
        balances: {
          available: null,
          current: 245680.50,
          limit: null
        },
        institutionName: 'Demo Brokerage'
      },
      {
        accountId: 'demo_checking_001',
        name: 'Checking Account',
        type: 'depository',
        subtype: 'checking',
        balances: {
          available: 12450.75,
          current: 12450.75,
          limit: null
        },
        institutionName: 'Demo Bank'
      }
    ];
  }

  /**
   * Demo holdings for when Plaid credentials are invalid
   */
  async getHoldings(accountId: string): Promise<PlaidHolding[]> {
    if (accountId === 'demo_brokerage_001') {
      return [
        {
          accountId,
          symbol: 'AAPL',
          name: 'Apple Inc.',
          quantity: 100,
          currentPrice: 185.50,
          totalValue: 18550.00,
          category: 'stocks'
        },
        {
          accountId,
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          quantity: 75,
          currentPrice: 342.80,
          totalValue: 25710.00,
          category: 'stocks'
        },
        {
          accountId,
          symbol: 'SPY',
          name: 'SPDR S&P 500 ETF Trust',
          quantity: 50,
          currentPrice: 485.25,
          totalValue: 24262.50,
          category: 'etf'
        }
      ];
    }
    return [];
  }
}

export const plaidFallbackService = new PlaidFallbackService();