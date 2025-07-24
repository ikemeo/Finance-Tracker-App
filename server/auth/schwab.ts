import axios from 'axios';
import crypto from 'crypto';

interface SchwabConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface SchwabTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export class SchwabAuth {
  private config: SchwabConfig;
  private baseUrl = 'https://api.schwabapi.com';

  constructor(config: SchwabConfig) {
    this.config = config;
  }

  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'read write'
    });

    return `${this.baseUrl}/v1/oauth/authorize?${params.toString()}`;
  }

  async getAccessToken(authorizationCode: string): Promise<SchwabTokens> {
    const credentials = `${this.config.clientId}:${this.config.clientSecret}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');

    const response = await axios.post(
      `${this.baseUrl}/v1/oauth/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: this.config.redirectUri
      }),
      {
        headers: {
          'Authorization': `Basic ${base64Credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      tokenType: response.data.token_type
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<SchwabTokens> {
    const credentials = `${this.config.clientId}:${this.config.clientSecret}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');

    const response = await axios.post(
      `${this.baseUrl}/v1/oauth/token`,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      {
        headers: {
          'Authorization': `Basic ${base64Credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      tokenType: response.data.token_type
    };
  }

  async makeAuthenticatedRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    accessToken: string,
    data?: any
  ): Promise<any> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const config = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      data: data || undefined
    };

    const response = await axios(config);
    return response.data;
  }

  // Schwab specific API methods
  async getAccounts(accessToken: string) {
    return this.makeAuthenticatedRequest('/trader/v1/accounts', 'GET', accessToken);
  }

  async getAccountNumbers(accessToken: string) {
    return this.makeAuthenticatedRequest('/trader/v1/accounts/accountNumbers', 'GET', accessToken);
  }

  async getAccount(accountNumber: string, accessToken: string, fields?: string) {
    let url = `/trader/v1/accounts/${accountNumber}`;
    if (fields) {
      url += `?fields=${fields}`;
    }
    return this.makeAuthenticatedRequest(url, 'GET', accessToken);
  }

  async getPositions(accountNumber: string, accessToken: string) {
    return this.makeAuthenticatedRequest(`/trader/v1/accounts/${accountNumber}?fields=positions`, 'GET', accessToken);
  }

  async getTransactions(
    accountNumber: string, 
    accessToken: string, 
    startDate: string, 
    endDate: string,
    types?: string
  ) {
    let url = `/trader/v1/accounts/${accountNumber}/transactions?startDate=${startDate}&endDate=${endDate}`;
    if (types) {
      url += `&types=${types}`;
    }
    return this.makeAuthenticatedRequest(url, 'GET', accessToken);
  }

  async getQuotes(symbols: string[], accessToken: string) {
    const symbolsParam = symbols.join(',');
    return this.makeAuthenticatedRequest(`/marketdata/v1/quotes?symbols=${symbolsParam}`, 'GET', accessToken);
  }
}