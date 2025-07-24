import { ETradeAuth } from './etrade';
import { SchwabAuth } from './schwab';
import { RobinhoodAuth } from './robinhood';
import { storage } from '../storage';
import type { Account } from '@shared/schema';

interface ApiCredentials {
  etrade?: {
    consumerKey: string;
    consumerSecret: string;
    sandbox?: boolean;
  };
  schwab?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  robinhood?: {
    username: string;
    password: string;
  };
}

export class ApiService {
  private credentials: ApiCredentials;
  private etradeAuth?: ETradeAuth;
  private schwabAuth?: SchwabAuth;
  private robinhoodAuth?: RobinhoodAuth;

  constructor(credentials: ApiCredentials) {
    this.credentials = credentials;
    
    if (credentials.etrade) {
      this.etradeAuth = new ETradeAuth(credentials.etrade);
    }
    
    if (credentials.schwab) {
      this.schwabAuth = new SchwabAuth(credentials.schwab);
    }
    
    if (credentials.robinhood) {
      this.robinhoodAuth = new RobinhoodAuth();
    }
  }

  // E*TRADE Methods
  async initiateETradeAuth() {
    if (!this.etradeAuth) {
      throw new Error('E*TRADE credentials not configured');
    }
    
    return await this.etradeAuth.getRequestToken();
  }

  async completeETradeAuth(requestToken: string, requestTokenSecret: string, verifier: string) {
    if (!this.etradeAuth) {
      throw new Error('E*TRADE credentials not configured');
    }
    
    return await this.etradeAuth.getAccessToken(requestToken, requestTokenSecret, verifier);
  }

  async syncETradeAccount(accountId: number) {
    const account = await storage.getAccount(accountId);
    if (!account || !account.accessToken || !account.refreshToken) {
      throw new Error('Account not properly authenticated');
    }

    if (!this.etradeAuth) {
      throw new Error('E*TRADE credentials not configured');
    }

    try {
      // Get account list to find the correct account
      const accounts = await this.etradeAuth.getAccounts(account.accessToken, account.refreshToken);
      
      // Get account balances and portfolio
      const accountData = accounts.AccountListResponse?.Accounts?.[0];
      if (!accountData) {
        throw new Error('No account data found');
      }

      const accountKey = accountData.accountIdKey;
      const balances = await this.etradeAuth.getAccountBalances(accountKey, account.accessToken, account.refreshToken);
      const portfolio = await this.etradeAuth.getPortfolio(accountKey, account.accessToken, account.refreshToken);

      // Update account balance
      const totalValue = balances.BalanceResponse?.Computed?.RealTimeValues?.totalAccountValue || '0';
      await storage.updateAccount(accountId, {
        balance: totalValue.toString(),
        accountIdKey: accountKey,
        isConnected: true
      });

      // Update holdings
      const positions = portfolio.PortfolioResponse?.AccountPortfolio?.[0]?.Position || [];
      for (const position of positions) {
        const instrument = position.Product;
        const positionData = position.Quick || position.Complete;
        
        if (instrument && positionData) {
          // Check if holding exists
          const existingHoldings = await storage.getHoldingsByAccount(accountId);
          const existingHolding = existingHoldings.find(h => h.symbol === instrument.symbol);
          
          const holdingData = {
            accountId,
            symbol: instrument.symbol,
            name: instrument.companyName || instrument.symbol,
            shares: positionData.quantity?.toString() || '0',
            currentPrice: positionData.lastTrade?.toString() || '0',
            totalValue: positionData.totalValue?.toString() || '0',
            category: this.categorizeInstrument(instrument.securityType),
            changePercent: positionData.changePct?.toString() || '0'
          };

          if (existingHolding) {
            await storage.updateHolding(existingHolding.id, holdingData);
          } else {
            await storage.createHolding(holdingData);
          }
        }
      }

      // Log sync activity
      await storage.createActivity({
        accountId,
        type: 'sync',
        description: 'E*TRADE account successfully synchronized',
        amount: null,
        symbol: null
      });

      return { success: true, message: 'Account synchronized successfully' };
    } catch (error: any) {
      // Log error activity
      await storage.createActivity({
        accountId,
        type: 'error',
        description: `E*TRADE sync failed: ${error.message}`,
        amount: null,
        symbol: null
      });

      throw error;
    }
  }

  // Schwab Methods
  async initiateSchwabAuth() {
    if (!this.schwabAuth) {
      throw new Error('Schwab credentials not configured');
    }
    
    return { authUrl: this.schwabAuth.getAuthorizationUrl() };
  }

  async completeSchwabAuth(authorizationCode: string) {
    if (!this.schwabAuth) {
      throw new Error('Schwab credentials not configured');
    }
    
    return await this.schwabAuth.getAccessToken(authorizationCode);
  }

  async syncSchwabAccount(accountId: number) {
    const account = await storage.getAccount(accountId);
    if (!account || !account.accessToken) {
      throw new Error('Account not properly authenticated');
    }

    if (!this.schwabAuth) {
      throw new Error('Schwab credentials not configured');
    }

    try {
      // Check if token needs refresh
      if (account.tokenExpiry && new Date() >= account.tokenExpiry) {
        if (account.refreshToken) {
          const newTokens = await this.schwabAuth.refreshAccessToken(account.refreshToken);
          await storage.updateAccount(accountId, {
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            tokenExpiry: new Date(Date.now() + newTokens.expiresIn * 1000)
          });
          account.accessToken = newTokens.accessToken;
        } else {
          throw new Error('Token expired and no refresh token available');
        }
      }

      // Get account data
      const accounts = await this.schwabAuth.getAccounts(account.accessToken);
      const accountNumbers = await this.schwabAuth.getAccountNumbers(account.accessToken);
      
      if (!accountNumbers || accountNumbers.length === 0) {
        throw new Error('No account numbers found');
      }

      const accountNumber = accountNumbers[0].accountNumber;
      const accountDetails = await this.schwabAuth.getAccount(accountNumber, account.accessToken, 'positions');

      // Update account balance
      const totalValue = accountDetails.securitiesAccount?.currentBalances?.liquidationValue || 0;
      await storage.updateAccount(accountId, {
        balance: totalValue.toString(),
        externalAccountId: accountNumber,
        isConnected: true
      });

      // Update holdings from positions
      const positions = accountDetails.securitiesAccount?.positions || [];
      for (const position of positions) {
        const instrument = position.instrument;
        
        if (instrument && position.longQuantity > 0) {
          const existingHoldings = await storage.getHoldingsByAccount(accountId);
          const existingHolding = existingHoldings.find(h => h.symbol === instrument.symbol);
          
          const holdingData = {
            accountId,
            symbol: instrument.symbol,
            name: instrument.description || instrument.symbol,
            shares: position.longQuantity.toString(),
            currentPrice: position.marketValue ? (position.marketValue / position.longQuantity).toString() : '0',
            totalValue: position.marketValue?.toString() || '0',
            category: this.categorizeSchwabInstrument(instrument.assetType),
            changePercent: '0' // Schwab doesn't provide this directly
          };

          if (existingHolding) {
            await storage.updateHolding(existingHolding.id, holdingData);
          } else {
            await storage.createHolding(holdingData);
          }
        }
      }

      await storage.createActivity({
        accountId,
        type: 'sync',
        description: 'Schwab account successfully synchronized',
        amount: null,
        symbol: null
      });

      return { success: true, message: 'Account synchronized successfully' };
    } catch (error: any) {
      await storage.createActivity({
        accountId,
        type: 'error',
        description: `Schwab sync failed: ${error.message}`,
        amount: null,
        symbol: null
      });

      throw error;
    }
  }

  // Robinhood Methods
  async syncRobinhoodAccount(accountId: number) {
    if (!this.credentials.robinhood || !this.robinhoodAuth) {
      throw new Error('Robinhood credentials not configured');
    }

    try {
      // Login to Robinhood
      await this.robinhoodAuth.login(this.credentials.robinhood);

      // Get account data
      const accounts = await this.robinhoodAuth.getAccounts();
      const positions = await this.robinhoodAuth.getPositions();

      if (!accounts.results || accounts.results.length === 0) {
        throw new Error('No Robinhood accounts found');
      }

      const accountData = accounts.results[0];
      const portfolio = accountData.portfolio;

      // Update account balance
      await storage.updateAccount(accountId, {
        balance: portfolio.total_value || '0',
        externalAccountId: accountData.account_number,
        isConnected: true
      });

      // Update holdings from positions
      for (const position of positions.results || []) {
        if (parseFloat(position.quantity) > 0) {
          // Get instrument details
          const instrumentResponse = await fetch(position.instrument);
          const instrument = await instrumentResponse.json();
          
          const existingHoldings = await storage.getHoldingsByAccount(accountId);
          const existingHolding = existingHoldings.find(h => h.symbol === instrument.symbol);
          
          const holdingData = {
            accountId,
            symbol: instrument.symbol,
            name: instrument.name || instrument.symbol,
            shares: position.quantity,
            currentPrice: position.last_trade_price || '0',
            totalValue: (parseFloat(position.quantity) * parseFloat(position.last_trade_price || '0')).toString(),
            category: 'stocks', // Robinhood is primarily stocks
            changePercent: '0'
          };

          if (existingHolding) {
            await storage.updateHolding(existingHolding.id, holdingData);
          } else {
            await storage.createHolding(holdingData);
          }
        }
      }

      await storage.createActivity({
        accountId,
        type: 'sync',
        description: 'Robinhood account successfully synchronized',
        amount: null,
        symbol: null
      });

      return { success: true, message: 'Account synchronized successfully' };
    } catch (error: any) {
      await storage.createActivity({
        accountId,
        type: 'error',
        description: `Robinhood sync failed: ${error.message}`,
        amount: null,
        symbol: null
      });

      throw error;
    }
  }

  private categorizeInstrument(securityType: string): string {
    switch (securityType?.toLowerCase()) {
      case 'eq':
      case 'stock':
        return 'stocks';
      case 'etf':
        return 'etfs';
      case 'crypto':
        return 'crypto';
      case 'bond':
        return 'bonds';
      case 'mmf':
        return 'cash';
      default:
        return 'stocks';
    }
  }

  private categorizeSchwabInstrument(assetType: string): string {
    switch (assetType?.toLowerCase()) {
      case 'equity':
        return 'stocks';
      case 'etf':
        return 'etfs';
      case 'mutual_fund':
        return 'etfs';
      case 'fixed_income':
        return 'bonds';
      case 'cash_equivalent':
        return 'cash';
      default:
        return 'stocks';
    }
  }
}