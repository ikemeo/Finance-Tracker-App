import axios from 'axios';
import crypto from 'crypto';

interface RobinhoodConfig {
  username: string;
  password: string;
  mfaCode?: string;
}

interface RobinhoodTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export class RobinhoodAuth {
  private baseUrl = 'https://api.robinhood.com';
  private accessToken?: string;

  async login(config: RobinhoodConfig): Promise<RobinhoodTokens> {
    const loginData: any = {
      username: config.username,
      password: config.password,
      grant_type: 'password',
      scope: 'internal'
    };

    if (config.mfaCode) {
      loginData.mfa_code = config.mfaCode;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/api-token-auth/`, loginData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      this.accessToken = response.data.token;

      return {
        accessToken: response.data.token,
        refreshToken: response.data.refresh_token || '',
        expiresIn: 86400, // 24 hours typical
        tokenType: 'Token'
      };
    } catch (error: any) {
      if (error.response?.data?.mfa_required) {
        throw new Error('MFA_REQUIRED');
      }
      throw new Error(`Authentication failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  async makeAuthenticatedRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Please login first.');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const config = {
      method,
      url,
      headers: {
        'Authorization': `Token ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      data: data || undefined
    };

    const response = await axios(config);
    return response.data;
  }

  // Robinhood specific API methods
  async getUser() {
    return this.makeAuthenticatedRequest('/user/');
  }

  async getAccounts() {
    return this.makeAuthenticatedRequest('/accounts/');
  }

  async getPositions() {
    return this.makeAuthenticatedRequest('/positions/');
  }

  async getPortfolio() {
    return this.makeAuthenticatedRequest('/accounts/');
  }

  async getOrders() {
    return this.makeAuthenticatedRequest('/orders/');
  }

  async getInstruments(symbol: string) {
    return this.makeAuthenticatedRequest(`/instruments/?symbol=${symbol}`);
  }

  async getQuotes(symbols: string[]) {
    const instruments = [];
    for (const symbol of symbols) {
      try {
        const instrument = await this.getInstruments(symbol);
        if (instrument.results && instrument.results.length > 0) {
          instruments.push(instrument.results[0].url);
        }
      } catch (error) {
        console.warn(`Failed to get instrument for ${symbol}:`, error);
      }
    }

    if (instruments.length === 0) {
      return { results: [] };
    }

    const instrumentsParam = instruments.join(',');
    return this.makeAuthenticatedRequest(`/quotes/?instruments=${instrumentsParam}`);
  }

  async getHistoricals(symbol: string, interval: string = '5minute', span: string = 'day') {
    const instrument = await this.getInstruments(symbol);
    if (!instrument.results || instrument.results.length === 0) {
      throw new Error(`No instrument found for symbol: ${symbol}`);
    }

    const instrumentUrl = instrument.results[0].url;
    return this.makeAuthenticatedRequest(
      `/quotes/historicals/?instruments=${instrumentUrl}&interval=${interval}&span=${span}`
    );
  }

  async getCryptoPositions() {
    return this.makeAuthenticatedRequest('/nummus/positions/');
  }

  async getCryptoOrders() {
    return this.makeAuthenticatedRequest('/nummus/orders/');
  }

  logout() {
    this.accessToken = undefined;
  }
}