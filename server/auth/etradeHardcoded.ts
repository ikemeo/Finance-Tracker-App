/**
 * Hardcoded E*TRADE API Integration
 * 
 * This approach uses predefined access tokens and provides a frontend interface
 * to trigger API calls without going through the full OAuth flow each time.
 */

import axios from 'axios';
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';

const ETRADE_BASE_URL = 'https://api.etgacb.com'; // E*TRADE Sandbox
const ETRADE_CONSUMER_KEY = process.env.ETRADE_CONSUMER_KEY!;
const ETRADE_CONSUMER_SECRET = process.env.ETRADE_CONSUMER_SECRET!;

// Hardcoded tokens - Replace these with your actual tokens from a successful OAuth flow
const HARDCODED_TOKENS = {
  // Account #5 tokens (replace with your actual tokens)
  access_token: process.env.ETRADE_ACCESS_TOKEN || 'VW8L39QVfNmO0yEnXdU4FhyRNIFo/jTacCqSfWh1zRY=',
  access_secret: process.env.ETRADE_ACCESS_SECRET || 'jfB6KhcIfCM+qhl4gFISt6Q7CCP9bYzUO2hAVRAMivA=',
};

const oauth = OAuth({
  consumer: {
    key: ETRADE_CONSUMER_KEY,
    secret: ETRADE_CONSUMER_SECRET,
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  },
});

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

export class HardcodedETradeService {
  
  /**
   * Get account list from E*TRADE API
   */
  async getAccounts(): Promise<ETradeAccount[]> {
    try {
      const url = `${ETRADE_BASE_URL}/v1/account/list`;
      const requestData = {
        url,
        method: 'GET',
      };

      const authHeader = oauth.toHeader(oauth.authorize(requestData, {
        key: HARDCODED_TOKENS.access_token,
        secret: HARDCODED_TOKENS.access_secret,
      }));

      const response = await axios.get(url, {
        headers: {
          'Authorization': authHeader.Authorization,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      // Transform E*TRADE response to our format
      const accounts = response.data?.AccountListResponse?.Accounts || [];
      return accounts.map((account: any) => ({
        accountId: account.accountIdKey,
        accountType: account.accountType,
        accountDescription: account.accountDesc,
        accountValue: parseFloat(account.accountValue || '0'),
      }));

    } catch (error: any) {
      console.error('E*TRADE Account List Error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch E*TRADE accounts: ${error.message}`);
    }
  }

  /**
   * Get account balance for a specific account
   */
  async getAccountBalance(accountIdKey: string): Promise<{ balance: number; availableCash: number }> {
    try {
      const url = `${ETRADE_BASE_URL}/v1/account/${accountIdKey}/balance`;
      const requestData = {
        url,
        method: 'GET',
      };

      const authHeader = oauth.toHeader(oauth.authorize(requestData, {
        key: HARDCODED_TOKENS.access_token,
        secret: HARDCODED_TOKENS.access_secret,
      }));

      const response = await axios.get(url, {
        headers: {
          'Authorization': authHeader.Authorization,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      const balanceResponse = response.data?.BalanceResponse;
      return {
        balance: parseFloat(balanceResponse?.accountValue || '0'),
        availableCash: parseFloat(balanceResponse?.availableCash || '0'),
      };

    } catch (error: any) {
      console.error('E*TRADE Balance Error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch account balance: ${error.message}`);
    }
  }

  /**
   * Get portfolio positions for a specific account
   */
  async getPortfolioPositions(accountIdKey: string): Promise<ETradePosition[]> {
    try {
      const url = `${ETRADE_BASE_URL}/v1/account/${accountIdKey}/portfolio`;
      const requestData = {
        url,
        method: 'GET',
      };

      const authHeader = oauth.toHeader(oauth.authorize(requestData, {
        key: HARDCODED_TOKENS.access_token,
        secret: HARDCODED_TOKENS.access_secret,
      }));

      const response = await axios.get(url, {
        headers: {
          'Authorization': authHeader.Authorization,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      const positions = response.data?.PortfolioResponse?.AccountPortfolio?.[0]?.Position || [];
      return positions.map((position: any) => ({
        symbol: position.symbolDescription,
        description: position.instrument?.Product?.companyName || position.symbolDescription,
        quantity: parseFloat(position.quantity || '0'),
        currentPrice: parseFloat(position.Quick?.lastTrade || '0'),
        totalValue: parseFloat(position.marketValue || '0'),
        changePercent: parseFloat(position.Quick?.changePercent || '0'),
      }));

    } catch (error: any) {
      console.error('E*TRADE Portfolio Error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch portfolio positions: ${error.message}`);
    }
  }

  /**
   * Test connection with current tokens
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const accounts = await this.getAccounts();
      return {
        success: true,
        message: `Successfully connected. Found ${accounts.length} accounts.`
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

export const hardcodedETradeService = new HardcodedETradeService();