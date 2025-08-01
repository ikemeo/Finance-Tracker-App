/**
 * Plaid Integration for Financial Account Connectivity
 * 
 * Supports connecting to thousands of banks and brokerages including:
 * - E*TRADE, Schwab, Fidelity, TD Ameritrade, Robinhood
 * - Bank of America, Chase, Wells Fargo, Capital One
 * - Credit unions and regional banks
 */

import { PlaidApi, Configuration, PlaidEnvironments, CountryCode, Products } from 'plaid';

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || 'production'; // sandbox, development, production

// Check if Plaid credentials are available
if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
  console.warn('Plaid credentials not found. Please set PLAID_CLIENT_ID and PLAID_SECRET environment variables.');
}

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID || '',
      'PLAID-SECRET': PLAID_SECRET || '',
    },
  },
});

const plaidClient = new PlaidApi(configuration);

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
  institutionName?: string;
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

export interface PlaidTransaction {
  accountId: string;
  transactionId: string;
  amount: number;
  date: string;
  description: string;
  category: string[];
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'dividend' | 'other';
}

export class PlaidService {
  
  /**
   * Create a Link token for Plaid Link initialization
   */
  async createLinkToken(userId: string): Promise<string> {
    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      throw new Error('Plaid credentials not configured. Please set PLAID_CLIENT_ID and PLAID_SECRET environment variables.');
    }

    // Use development environment since we know it works
    const targetEnvironment = 'development';
    console.log(`🔧 Using Plaid ${targetEnvironment} environment`);
    
    try {
      const config = new Configuration({
        basePath: PlaidEnvironments[targetEnvironment as keyof typeof PlaidEnvironments],
        baseOptions: {
          headers: {
            'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
            'PLAID-SECRET': PLAID_SECRET,
          },
        },
      });

      const client = new PlaidApi(config);
        // Configuration with proper redirect URI for Replit
        const domain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
        const redirectUri = `https://${domain}/api/plaid/oauth-redirect`;
        console.log(`🔗 Using redirect URI: ${redirectUri}`);
        
        const linkTokenConfig = {
          user: { client_user_id: userId },
          client_name: 'Portfolio Dashboard',
          products: [Products.Assets, Products.Investments, Products.Transactions],
          country_codes: [CountryCode.Us],
          language: 'en' as const,
          redirect_uri: redirectUri
        };

      const response = await Promise.race([
        client.linkTokenCreate(linkTokenConfig),
        // 5 second timeout for faster response
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout - Plaid is taking longer than expected')), 5000)
        )
      ]);

      console.log(`✅ Plaid Link token created successfully using ${targetEnvironment} environment`);
      return (response as any).data.link_token;
    } catch (error: any) {
      console.error(`❌ Plaid Link token creation failed:`, error.response?.data || error.message);
      
      // Provide helpful error message
      const errorCode = error.response?.data?.error_code;
      if (errorCode === 'INVALID_API_KEYS') {
        throw new Error(`PLAID_CREDENTIALS_INVALID: The provided Plaid credentials are invalid. Please check your Plaid Dashboard for fresh credentials.`);
      }
      
      if (errorCode === 'INVALID_FIELD') {
        throw new Error(`PLAID_CREDENTIALS_INVALID: Configuration error. Please verify redirect URI is configured in Plaid Dashboard.`);
      }
      
      throw new Error(`Failed to create Plaid Link token: ${error.response?.data?.error_message || error.message}`);
    }
  }

  /**
   * Exchange public token for access token
   */
  async exchangePublicToken(publicToken: string): Promise<{ accessToken: string; itemId: string }> {
    try {
      const response = await plaidClient.itemPublicTokenExchange({
        public_token: publicToken,
      });

      return {
        accessToken: response.data.access_token,
        itemId: response.data.item_id,
      };
    } catch (error) {
      console.error('Plaid Token Exchange Error:', error);
      throw new Error('Failed to exchange Plaid public token');
    }
  }

  /**
   * Get accounts for a connected item
   */
  async getAccounts(accessToken: string): Promise<PlaidAccount[]> {
    try {
      const response = await plaidClient.accountsGet({
        access_token: accessToken,
      });

      // Also get institution info
      const itemResponse = await plaidClient.itemGet({
        access_token: accessToken,
      });

      let institutionName = 'Unknown Institution';
      if (itemResponse.data.item.institution_id) {
        try {
          const institutionResponse = await plaidClient.institutionsGetById({
            institution_id: itemResponse.data.item.institution_id,
            country_codes: [CountryCode.Us],
          });
          institutionName = institutionResponse.data.institution.name;
        } catch (instError) {
          console.warn('Could not fetch institution name:', instError);
        }
      }

      return response.data.accounts.map(account => ({
        accountId: account.account_id,
        name: account.name,
        type: account.type,
        subtype: account.subtype || 'unknown',
        balances: {
          available: account.balances.available,
          current: account.balances.current,
          limit: account.balances.limit,
        },
        institutionName,
      }));
    } catch (error) {
      console.error('Plaid Accounts Error:', error);
      throw new Error('Failed to fetch Plaid accounts');
    }
  }

  /**
   * Get investment holdings for brokerage accounts
   */
  async getHoldings(accessToken: string): Promise<PlaidHolding[]> {
    try {
      console.log('Fetching holdings with access token:', accessToken?.substring(0, 20) + '...');
      const response = await plaidClient.investmentsHoldingsGet({
        access_token: accessToken,
      });
      console.log('Plaid holdings response:', JSON.stringify(response.data, null, 2));

      const holdings: PlaidHolding[] = [];

      for (const holding of response.data.holdings) {
        const security = response.data.securities.find(
          s => s.security_id === holding.security_id
        );

        if (security && holding.quantity > 0) {
          holdings.push({
            accountId: holding.account_id,
            symbol: security.ticker_symbol || undefined,
            name: security.name || 'Unknown Security',
            quantity: holding.quantity,
            currentPrice: security.close_price || 0,
            totalValue: holding.quantity * (security.close_price || 0),
            category: this.categorizeSecurity(security.type),
          });
        }
      }

      return holdings;
    } catch (error) {
      console.error('Plaid Holdings Error:', error);
      throw new Error('Failed to fetch investment holdings');
    }
  }

  /**
   * Get investment transactions
   */
  async getInvestmentTransactions(
    accessToken: string, 
    startDate: string, 
    endDate: string
  ): Promise<PlaidTransaction[]> {
    try {
      const response = await plaidClient.investmentsTransactionsGet({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      });

      return response.data.investment_transactions.map(transaction => ({
        accountId: transaction.account_id,
        transactionId: transaction.investment_transaction_id,
        amount: Math.abs(transaction.amount),
        date: transaction.date,
        description: transaction.name || 'Investment Transaction',
        category: [transaction.subtype || 'investment'],
        type: this.mapTransactionType(transaction.type),
      }));
    } catch (error) {
      console.error('Plaid Investment Transactions Error:', error);
      throw new Error('Failed to fetch investment transactions');
    }
  }

  /**
   * Get regular account transactions (for banking accounts)
   */
  async getTransactions(
    accessToken: string, 
    startDate: string, 
    endDate: string
  ): Promise<PlaidTransaction[]> {
    try {
      const response = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      });

      return response.data.transactions.map(transaction => ({
        accountId: transaction.account_id,
        transactionId: transaction.transaction_id,
        amount: Math.abs(transaction.amount),
        date: transaction.date,
        description: transaction.name,
        category: transaction.category || ['other'],
        type: transaction.amount > 0 ? 'withdrawal' : 'deposit',
      }));
    } catch (error) {
      console.error('Plaid Transactions Error:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  /**
   * Remove a connected item
   */
  async removeItem(accessToken: string): Promise<void> {
    try {
      await plaidClient.itemRemove({
        access_token: accessToken,
      });
    } catch (error) {
      console.error('Plaid Remove Item Error:', error);
      throw new Error('Failed to remove Plaid item');
    }
  }

  /**
   * Test connection and get item status
   */
  async getItemStatus(accessToken: string): Promise<{ isHealthy: boolean; lastUpdate: string }> {
    try {
      const response = await plaidClient.itemGet({
        access_token: accessToken,
      });

      const item = response.data.item;
      const isHealthy = !item.error;
      const lastUpdate = item.available_products.length > 0 ? new Date().toISOString() : 'Never';

      return { isHealthy, lastUpdate };
    } catch (error) {
      console.error('Plaid Item Status Error:', error);
      return { isHealthy: false, lastUpdate: 'Error' };
    }
  }

  /**
   * Helper method to categorize securities
   */
  private categorizeSecurity(securityType?: string): string {
    if (!securityType) return 'other';
    
    const type = securityType.toLowerCase();
    if (type.includes('stock') || type.includes('equity')) return 'stocks';
    if (type.includes('etf')) return 'etfs';
    if (type.includes('bond')) return 'bonds';
    if (type.includes('mutual')) return 'mutual_funds';
    if (type.includes('crypto')) return 'crypto';
    if (type.includes('cash')) return 'cash';
    
    return 'other';
  }

  /**
   * Helper method to map transaction types
   */
  private mapTransactionType(plaidType: string): PlaidTransaction['type'] {
    const type = plaidType.toLowerCase();
    if (type.includes('buy')) return 'buy';
    if (type.includes('sell')) return 'sell';
    if (type.includes('deposit') || type.includes('transfer_in')) return 'deposit';
    if (type.includes('withdrawal') || type.includes('transfer_out')) return 'withdrawal';
    if (type.includes('dividend') || type.includes('interest')) return 'dividend';
    return 'other';
  }
}

export const plaidService = new PlaidService();