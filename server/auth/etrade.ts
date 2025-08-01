import OAuth from 'oauth-1.0a';
import axios from 'axios';
import crypto from 'crypto';

interface ETradeConfig {
  consumerKey: string;
  consumerSecret: string;
  sandbox?: boolean;
}

interface ETradeTokens {
  requestToken: string;
  requestTokenSecret: string;
  accessToken?: string;
  accessTokenSecret?: string;
  verifier?: string;
}

export class ETradeAuth {
  private config: ETradeConfig;
  private oauth: OAuth;
  private baseUrl: string;

  constructor(config: ETradeConfig) {
    this.config = config;
    this.baseUrl = config.sandbox ? 'https://apisb.etrade.com' : 'https://api.etrade.com';
    
    this.oauth = new OAuth({
      consumer: {
        key: config.consumerKey,
        secret: config.consumerSecret
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto.createHmac('sha1', key).update(base_string).digest('base64');
      },
      realm: '',
      version: '1.0'
    });
  }

  async getRequestToken(): Promise<{ token: string; tokenSecret: string; authUrl: string }> {
    const requestData = {
      url: `${this.baseUrl}/oauth/request_token`,
      method: 'GET' as const
    };

    const token = {
      key: '',
      secret: ''
    };

    try {
      // Create OAuth request with callback parameter included in signature
      const oauthRequest = {
        url: requestData.url,
        method: requestData.method,
        data: {
          oauth_callback: 'oob'
        }
      };
      
      const oauthData = this.oauth.authorize(oauthRequest, token);
      const oauthHeaders = this.oauth.toHeader(oauthData);
      
      const response = await axios({
        method: 'GET',
        url: requestData.url,
        headers: {
          'Authorization': oauthHeaders.Authorization
        },
        params: {
          oauth_callback: 'oob'
        }
      });

      const params = new URLSearchParams(response.data);
      const oauthToken = params.get('oauth_token') || '';
      const oauthTokenSecret = params.get('oauth_token_secret') || '';

      const authUrl = `https://us.etrade.com/e/t/etws/authorize?key=${this.config.consumerKey}&token=${oauthToken}`;
      
      return {
        token: oauthToken,
        tokenSecret: oauthTokenSecret,
        authUrl
      };
    } catch (error: any) {
      console.error('E*TRADE Request Token Error:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      throw new Error(`Failed to get request token: ${error.response?.data || error.message}`);
    }
  }

  async getAccessToken(requestToken: string, requestTokenSecret: string, verifier: string): Promise<{ token: string; tokenSecret: string }> {
    const requestData = {
      url: `${this.baseUrl}/oauth/access_token`,
      method: 'GET' as const,
      data: { oauth_verifier: verifier }
    };

    const token = {
      key: requestToken,
      secret: requestTokenSecret
    };

    try {
      const oauthData = this.oauth.authorize(requestData, token);
      const oauthHeaders = this.oauth.toHeader(oauthData);
      
      const response = await axios.get(requestData.url, {
        headers: {
          'Authorization': oauthHeaders.Authorization,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        params: { oauth_verifier: verifier }
      });

      const params = new URLSearchParams(response.data);
      const oauthAccessToken = params.get('oauth_token') || '';
      const oauthAccessTokenSecret = params.get('oauth_token_secret') || '';

      return {
        token: oauthAccessToken,
        tokenSecret: oauthAccessTokenSecret
      };
    } catch (error: any) {
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  async makeAuthenticatedRequest(
    url: string, 
    method: 'GET' | 'POST' = 'GET',
    accessToken: string, 
    accessTokenSecret: string,
    data?: any
  ): Promise<any> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    console.log(`Building request for URL: ${fullUrl}`);
    
    const requestData = {
      url: fullUrl,
      method,
      data
    };

    const token = {
      key: accessToken,
      secret: accessTokenSecret
    };

    try {
      const oauthData = this.oauth.authorize(requestData, token);
      const oauthHeaders = this.oauth.toHeader(oauthData);
      
      const config = {
        method,
        url: fullUrl,
        headers: {
          'Authorization': oauthHeaders.Authorization,
          'Content-Type': 'application/json'
        },
        data: data || undefined
      };

      console.log(`Making E*TRADE API request to: ${fullUrl}`);
      console.log(`OAuth headers:`, oauthHeaders.Authorization);
      
      const response = await axios({
        ...config,
        timeout: 10000,
        headers: {
          ...config.headers,
          'User-Agent': 'Portfolio Dashboard App/1.0',
          'Accept': 'application/json'
        }
      });
      console.log(`E*TRADE API response status: ${response.status}`);
      return response.data;

    } catch (error: any) {
      console.error(`E*TRADE API Error:`, error.response?.data || error.message);
      throw new Error(`API request failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // E*TRADE specific API methods
  async getAccounts(accessToken: string, accessTokenSecret: string) {
    console.log('Getting E*TRADE account list...');
    return this.makeAuthenticatedRequest('/v1/account/list.json', 'GET', accessToken, accessTokenSecret);
  }

  async getAccountBalances(accountIdKey: string, accessToken: string, accessTokenSecret: string) {
    console.log(`Getting E*TRADE account balances for ${accountIdKey}...`);
    return this.makeAuthenticatedRequest(`/v1/account/${accountIdKey}/balance.json`, 'GET', accessToken, accessTokenSecret);
  }

  async getPortfolio(accountIdKey: string, accessToken: string, accessTokenSecret: string) {
    console.log(`Getting E*TRADE portfolio for ${accountIdKey}...`);
    return this.makeAuthenticatedRequest(`/v1/account/${accountIdKey}/portfolio.json`, 'GET', accessToken, accessTokenSecret);
  }

  async getTransactions(accountIdKey: string, accessToken: string, accessTokenSecret: string, startDate?: string, endDate?: string) {
    let url = `/v1/account/${accountIdKey}/transactions`;
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return this.makeAuthenticatedRequest(url, 'GET', accessToken, accessTokenSecret);
  }
}