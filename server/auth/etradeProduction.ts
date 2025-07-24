/**
 * E*TRADE Production API Integration
 * 
 * This service handles E*TRADE production API connections using OAuth 1.0a
 * for secure authentication and real account data access.
 */

import crypto from 'crypto';
import OAuth from 'oauth-1.0a';

const ETRADE_PRODUCTION_CONSUMER_KEY = process.env.ETRADE_PRODUCTION_CONSUMER_KEY;
const ETRADE_PRODUCTION_CONSUMER_SECRET = process.env.ETRADE_PRODUCTION_CONSUMER_SECRET;

// Production E*TRADE endpoints
const ETRADE_BASE_URL = 'https://api.etrade.com';
const ETRADE_OAUTH_URL = 'https://us.etrade.com/e/t/etgacb/user/login';

// Check if production credentials are available
if (!ETRADE_PRODUCTION_CONSUMER_KEY || !ETRADE_PRODUCTION_CONSUMER_SECRET) {
  console.warn('E*TRADE production credentials not found. OAuth flow will not be available.');
}

const oauth = new OAuth({
  consumer: {
    key: ETRADE_PRODUCTION_CONSUMER_KEY || '',
    secret: ETRADE_PRODUCTION_CONSUMER_SECRET || '',
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string: string, key: string) {
    return crypto
      .createHmac('sha1', key)
      .update(base_string)
      .digest('base64');
  },
});

export interface ETradeAccountSummary {
  accountId: string;
  accountName: string;
  accountType: string;
  institutionType: string;
  accountStatus: string;
  accountDesc: string;
  accountMode: string;
  dayTrader: boolean;
  netAccountValue: number;
  totalLongValue: number;
  totalShortValue: number;
  buyingPower: number;
  cashAvailableForInvestment: number;
}

export interface ETradePosition {
  productId: number;
  symbolDescription: string;
  dateAcquired: number;
  pricePaid: number;
  price: number;
  quantity: number;
  value: number;
  daysGain: number;
  daysGainPct: number;
  marketValue: number;
  totalGain: number;
  totalGainPct: number;
  pctOfPortfolio: number;
  costPerShare: number;
  todayCommissions: number;
  todayFees: number;
  todayPricePaid: number;
  todayQuantity: number;
  adjPrevClose: number;
}

export class ETradeProductionService {
  
  /**
   * Check if production credentials are configured
   */
  isConfigured(): boolean {
    return !!(ETRADE_PRODUCTION_CONSUMER_KEY && ETRADE_PRODUCTION_CONSUMER_SECRET);
  }

  /**
   * Get OAuth request token (Step 1 of OAuth flow)
   */
  async getOAuthRequestToken(): Promise<{ token: string; tokenSecret: string; authUrl: string }> {
    if (!this.isConfigured()) {
      throw new Error('E*TRADE production credentials not configured');
    }

    const requestData = {
      url: `${ETRADE_BASE_URL}/oauth/request_token`,
      method: 'GET',
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData));

    try {
      const response = await fetch(requestData.url, {
        method: 'GET',
        headers: {
          'Authorization': authHeader.Authorization,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error(`E*TRADE OAuth request failed: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      const params = new URLSearchParams(responseText);
      
      const token = params.get('oauth_token');
      const tokenSecret = params.get('oauth_token_secret');
      
      if (!token || !tokenSecret) {
        throw new Error('Invalid OAuth response from E*TRADE');
      }

      const authUrl = `${ETRADE_OAUTH_URL}?key=${ETRADE_PRODUCTION_CONSUMER_KEY}&token=${token}`;

      return {
        token,
        tokenSecret,
        authUrl,
      };
    } catch (error) {
      console.error('E*TRADE OAuth request error:', error);
      throw new Error('Failed to get E*TRADE request token');
    }
  }

  /**
   * Exchange OAuth verifier for access token (Step 3 of OAuth flow)
   */
  async getOAuthAccessToken(
    requestToken: string,
    requestTokenSecret: string,
    verifier: string
  ): Promise<{ token: string; tokenSecret: string }> {
    if (!this.isConfigured()) {
      throw new Error('E*TRADE production credentials not configured');
    }

    const requestData = {
      url: `${ETRADE_BASE_URL}/oauth/access_token`,
      method: 'GET',
    };

    const token = {
      key: requestToken,
      secret: requestTokenSecret,
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    try {
      const response = await fetch(`${requestData.url}?oauth_verifier=${verifier}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader.Authorization,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error(`E*TRADE access token request failed: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      const params = new URLSearchParams(responseText);
      
      const accessToken = params.get('oauth_token');
      const accessTokenSecret = params.get('oauth_token_secret');
      
      if (!accessToken || !accessTokenSecret) {
        throw new Error('Invalid access token response from E*TRADE');
      }

      return {
        token: accessToken,
        tokenSecret: accessTokenSecret,
      };
    } catch (error) {
      console.error('E*TRADE access token error:', error);
      throw new Error('Failed to get E*TRADE access token');
    }
  }

  /**
   * Get account list from E*TRADE
   */
  async getAccountList(accessToken: string, accessTokenSecret: string): Promise<ETradeAccountSummary[]> {
    const requestData = {
      url: `${ETRADE_BASE_URL}/v1/accounts/list`,
      method: 'GET',
    };

    const token = {
      key: accessToken,
      secret: accessTokenSecret,
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    try {
      const response = await fetch(requestData.url, {
        method: 'GET',
        headers: {
          'Authorization': authHeader.Authorization,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`E*TRADE API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.AccountListResponse && data.AccountListResponse.Accounts) {
        return data.AccountListResponse.Accounts.Account || [];
      }
      
      return [];
    } catch (error) {
      console.error('E*TRADE account list error:', error);
      throw new Error('Failed to fetch E*TRADE account list');
    }
  }

  /**
   * Get account balance for a specific account
   */
  async getAccountBalance(
    accessToken: string,
    accessTokenSecret: string,
    accountIdKey: string
  ): Promise<ETradeAccountSummary> {
    const requestData = {
      url: `${ETRADE_BASE_URL}/v1/accounts/${accountIdKey}/balance?realTime=true`,
      method: 'GET',
    };

    const token = {
      key: accessToken,
      secret: accessTokenSecret,
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    try {
      const response = await fetch(requestData.url, {
        method: 'GET',
        headers: {
          'Authorization': authHeader.Authorization,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`E*TRADE balance request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.BalanceResponse && data.BalanceResponse.Account) {
        return data.BalanceResponse.Account;
      }
      
      throw new Error('Invalid balance response from E*TRADE');
    } catch (error) {
      console.error('E*TRADE balance error:', error);
      throw new Error('Failed to fetch E*TRADE account balance');
    }
  }

  /**
   * Get portfolio positions for a specific account
   */
  async getAccountPositions(
    accessToken: string,
    accessTokenSecret: string,
    accountIdKey: string
  ): Promise<ETradePosition[]> {
    const requestData = {
      url: `${ETRADE_BASE_URL}/v1/accounts/${accountIdKey}/portfolio?view=COMPLETE`,
      method: 'GET',
    };

    const token = {
      key: accessToken,
      secret: accessTokenSecret,
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    try {
      const response = await fetch(requestData.url, {
        method: 'GET',
        headers: {
          'Authorization': authHeader.Authorization,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`E*TRADE positions request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.PortfolioResponse && data.PortfolioResponse.AccountPortfolio) {
        const portfolio = data.PortfolioResponse.AccountPortfolio;
        return portfolio.Position || [];
      }
      
      return [];
    } catch (error) {
      console.error('E*TRADE positions error:', error);
      throw new Error('Failed to fetch E*TRADE account positions');
    }
  }
}

export const etradeProductionService = new ETradeProductionService();