import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAccountSchema, 
  insertHoldingSchema, 
  insertActivitySchema,
  insertRealEstateSchema,
  insertVentureSchema
} from "@shared/schema";
import { ApiService } from './auth/apiService';

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize API service with credentials
  const apiService = new ApiService({
    etrade: {
      consumerKey: process.env.ETRADE_CONSUMER_KEY || '',
      consumerSecret: process.env.ETRADE_CONSUMER_SECRET || '',
      sandbox: true // Use sandbox for testing
    }
  });
  // Account routes
  app.get("/api/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.get("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.getAccount(id);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account" });
    }
  });

  app.patch("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const existingAccount = await storage.getAccount(id);
      if (!existingAccount) {
        return res.status(404).json({ message: "Account not found" });
      }

      const updatedAccount = await storage.updateAccount(id, updateData);
      if (!updatedAccount) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json(updatedAccount);
    } catch (error) {
      res.status(500).json({ message: "Failed to update account" });
    }
  });

  app.delete("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const existingAccount = await storage.getAccount(id);
      if (!existingAccount) {
        return res.status(404).json({ message: "Account not found" });
      }

      // Delete associated data first (foreign key constraints)
      const holdings = await storage.getHoldingsByAccount(id);
      for (const holding of holdings) {
        if (holding.id) {
          await storage.deleteHolding(holding.id);
        }
      }

      const activities = await storage.getActivitiesByAccount(id);
      for (const activity of activities) {
        if (activity.id) {
          await storage.deleteActivity(activity.id);
        }
      }

      // Delete the account
      await storage.deleteAccount(id);
      res.json({ message: "Account deleted successfully" });
    } catch (error: any) {
      console.error('Delete account error:', error);
      res.status(500).json({ message: "Failed to delete account", error: error?.message || String(error) });
    }
  });

  app.post("/api/accounts", async (req, res) => {
    try {
      const accountData = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(accountData);
      res.status(201).json(account);
    } catch (error) {
      res.status(400).json({ message: "Invalid account data" });
    }
  });

  // Holdings routes
  app.get("/api/holdings", async (req, res) => {
    try {
      const holdings = await storage.getHoldings();
      res.json(holdings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch holdings" });
    }
  });

  app.get("/api/accounts/:id/holdings", async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const holdings = await storage.getHoldingsByAccount(accountId);
      res.json(holdings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account holdings" });
    }
  });

  app.post("/api/holdings", async (req, res) => {
    try {
      const holdingData = insertHoldingSchema.parse(req.body);
      const holding = await storage.createHolding(holdingData);
      res.status(201).json(holding);
    } catch (error) {
      res.status(400).json({ message: "Invalid holding data" });
    }
  });

  app.delete("/api/holdings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteHolding(id);
      res.json({ message: "Holding deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete holding" });
    }
  });

  // Activities routes
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/accounts/:id/activities", async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const activities = await storage.getActivitiesByAccount(accountId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account activities" });
    }
  });

  // Portfolio summary route
  app.get("/api/portfolio/summary", async (req, res) => {
    try {
      const holdings = await storage.getHoldings();
      const accounts = await storage.getAccounts();
      const realEstate = await storage.getRealEstateInvestments();
      const venture = await storage.getVentureInvestments();
      
      // Calculate total AUM from traditional accounts
      const traditionalAum = accounts.reduce((sum, account) => 
        sum + parseFloat(account.balance), 0
      );

      // Calculate real estate value
      const realEstateValue = realEstate.reduce((sum, property) => 
        sum + parseFloat(property.currentValue), 0
      );

      // Calculate venture value
      const ventureValue = venture.reduce((sum, investment) => {
        if (investment.status === 'exited' && investment.exitAmount) {
          return sum + parseFloat(investment.exitAmount);
        } else if (investment.currentValuation && investment.ownershipPercentage) {
          return sum + (parseFloat(investment.currentValuation) * parseFloat(investment.ownershipPercentage) / 100);
        }
        return sum + parseFloat(investment.investmentAmount);
      }, 0);

      const totalAum = traditionalAum + realEstateValue + ventureValue;

      // Calculate category breakdowns including alternative investments
      const categoryTotals = holdings.reduce((acc, holding) => {
        const category = holding.category;
        const value = parseFloat(holding.totalValue);
        acc[category] = (acc[category] || 0) + value;
        return acc;
      }, {} as Record<string, number>);

      // Add alternative investment categories
      if (realEstateValue > 0) {
        categoryTotals['real-estate'] = realEstateValue;
      }
      if (ventureValue > 0) {
        categoryTotals['venture'] = ventureValue;
      }

      // Calculate performance metrics
      const performanceData = accounts.map(account => {
        const accountHoldings = holdings.filter(h => h.accountId === account.id);
        const totalChange = accountHoldings.reduce((sum, holding) => 
          sum + parseFloat(holding.changePercent), 0
        );
        const avgChange = accountHoldings.length > 0 ? totalChange / accountHoldings.length : 0;
        
        return {
          ...account,
          changePercent: avgChange.toFixed(2)
        };
      });

      res.json({
        totalAum,
        traditionalAum,
        realEstateValue,
        ventureValue,
        categoryTotals,
        performanceData,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio summary" });
    }
  });

  // Real Estate Investment routes
  app.get("/api/real-estate", async (req, res) => {
    try {
      const investments = await storage.getRealEstateInvestments();
      res.json(investments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch real estate investments" });
    }
  });

  app.get("/api/real-estate/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const investment = await storage.getRealEstateInvestment(id);
      if (!investment) {
        return res.status(404).json({ message: "Real estate investment not found" });
      }
      res.json(investment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch real estate investment" });
    }
  });

  app.post("/api/real-estate", async (req, res) => {
    try {
      const investmentData = insertRealEstateSchema.parse(req.body);
      const investment = await storage.createRealEstateInvestment(investmentData);
      res.status(201).json(investment);
    } catch (error) {
      res.status(400).json({ message: "Invalid real estate investment data" });
    }
  });

  // Venture Investment routes
  app.get("/api/venture", async (req, res) => {
    try {
      const investments = await storage.getVentureInvestments();
      res.json(investments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch venture investments" });
    }
  });

  app.get("/api/venture/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const investment = await storage.getVentureInvestment(id);
      if (!investment) {
        return res.status(404).json({ message: "Venture investment not found" });
      }
      res.json(investment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch venture investment" });
    }
  });

  app.post("/api/venture", async (req, res) => {
    try {
      const investmentData = insertVentureSchema.parse(req.body);
      const investment = await storage.createVentureInvestment(investmentData);
      res.status(201).json(investment);
    } catch (error) {
      res.status(400).json({ message: "Invalid venture investment data" });
    }
  });

  app.patch("/api/venture/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("PATCH /api/venture/:id - Request body:", JSON.stringify(req.body, null, 2));
      const updateData = insertVentureSchema.partial().parse(req.body);
      console.log("PATCH /api/venture/:id - Parsed data:", JSON.stringify(updateData, null, 2));
      const investment = await storage.updateVentureInvestment(id, updateData);
      if (!investment) {
        return res.status(404).json({ message: "Venture investment not found" });
      }
      res.json(investment);
    } catch (error) {
      console.error("PATCH /api/venture/:id - Error:", error);
      res.status(400).json({ message: "Invalid venture investment data", error: error.message });
    }
  });

  app.delete("/api/venture/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteVentureInvestment(id);
      if (!success) {
        return res.status(404).json({ message: "Venture investment not found" });
      }
      res.json({ message: "Venture investment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete venture investment" });
    }
  });

  // Refresh data endpoint (simulate API calls)
  app.post("/api/portfolio/refresh", async (req, res) => {
    try {
      // Simulate API refresh delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update last sync time for connected accounts
      const accounts = await storage.getAccounts();
      for (const account of accounts) {
        if (account.isConnected) {
          await storage.updateAccount(account.id, {});
        }
      }
      
      res.json({ message: "Portfolio data refreshed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh portfolio data" });
    }
  });

  // E*TRADE Authentication Routes
  app.post("/api/auth/etrade/start", async (req, res) => {
    try {
      const { accountId } = req.body;
      
      if (!process.env.ETRADE_CONSUMER_KEY || !process.env.ETRADE_CONSUMER_SECRET) {
        return res.status(400).json({ 
          message: "E*TRADE API credentials not configured. Please set ETRADE_CONSUMER_KEY and ETRADE_CONSUMER_SECRET." 
        });
      }

      const authData = await apiService.initiateETradeAuth();
      
      // Store the request token temporarily (in production, use a database or session)
      // For now, we'll send it back to the client to handle
      res.json({
        authUrl: authData.authUrl,
        requestToken: authData.token,
        requestTokenSecret: authData.tokenSecret
      });
    } catch (error: any) {
      res.status(500).json({ message: `Failed to start E*TRADE authentication: ${error.message}` });
    }
  });

  app.post("/api/auth/etrade/complete", async (req, res) => {
    try {
      const { accountId, requestToken, requestTokenSecret, verifier } = req.body;

      if (!requestToken || !requestTokenSecret || !verifier) {
        return res.status(400).json({ message: "Missing required authentication parameters" });
      }

      const tokens = await apiService.completeETradeAuth(requestToken, requestTokenSecret, verifier);
      
      // Update the account with the access tokens
      await storage.updateAccount(parseInt(accountId), {
        accessToken: tokens.token,
        refreshToken: tokens.tokenSecret, // E*TRADE uses tokenSecret as refresh token
        isConnected: true,
        tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      res.json({ message: "E*TRADE account authenticated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: `Failed to complete E*TRADE authentication: ${error.message}` });
    }
  });

  // Hardcoded E*TRADE API endpoints
  app.post("/api/etrade/test-connection", async (req, res) => {
    try {
      const { hardcodedETradeService } = await import('./auth/etradeHardcoded');
      const result = await hardcodedETradeService.testConnection();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get("/api/etrade/accounts", async (req, res) => {
    try {
      const { hardcodedETradeService } = await import('./auth/etradeHardcoded');
      const accounts = await hardcodedETradeService.getAccounts();
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/etrade/balance/:accountIdKey", async (req, res) => {
    try {
      const { accountIdKey } = req.params;
      const { hardcodedETradeService } = await import('./auth/etradeHardcoded');
      const balance = await hardcodedETradeService.getAccountBalance(accountIdKey);
      res.json(balance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/etrade/positions/:accountIdKey", async (req, res) => {
    try {
      const { accountIdKey } = req.params;
      const { hardcodedETradeService } = await import('./auth/etradeHardcoded');
      const positions = await hardcodedETradeService.getPortfolioPositions(accountIdKey);
      res.json(positions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Plaid Integration Routes
  app.post("/api/plaid/create-link-token", async (req, res) => {
    try {
      const { userId } = req.body;
      const { plaidService } = await import('./auth/plaid');
      const linkToken = await plaidService.createLinkToken(userId || 'default_user');
      res.json({ linkToken });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/plaid/exchange-token", async (req, res) => {
    try {
      const { publicToken } = req.body;
      const { plaidService } = await import('./auth/plaid');
      const { accessToken, itemId } = await plaidService.exchangePublicToken(publicToken);
      res.json({ accessToken, itemId });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/plaid/accounts", async (req, res) => {
    try {
      const { access_token } = req.query;
      if (!access_token) {
        return res.status(400).json({ message: "Access token required" });
      }
      const { plaidService } = await import('./auth/plaid');
      const accounts = await plaidService.getAccounts(access_token as string);
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/plaid/holdings", async (req, res) => {
    try {
      const { access_token, account_id } = req.query;
      if (!access_token) {
        return res.status(400).json({ message: "Access token required" });
      }
      const { plaidService } = await import('./auth/plaid');
      const allHoldings = await plaidService.getHoldings(access_token as string);
      
      // Filter by account if specified
      const holdings = account_id 
        ? allHoldings.filter(h => h.accountId === account_id)
        : allHoldings;
      
      res.json(holdings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/plaid/item/:accessToken", async (req, res) => {
    try {
      const { accessToken } = req.params;
      const { plaidService } = await import('./auth/plaid');
      await plaidService.removeItem(accessToken);
      res.json({ message: "Plaid item removed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // E*TRADE Production OAuth routes
  app.post("/api/etrade/production/request-token", async (req, res) => {
    try {
      const { etradeProductionService } = await import('./auth/etradeProduction');
      
      if (!etradeProductionService.isConfigured()) {
        return res.status(400).json({ 
          message: "E*TRADE production credentials not configured" 
        });
      }

      const result = await etradeProductionService.getOAuthRequestToken();
      res.json(result);
    } catch (error: any) {
      console.error('E*TRADE production request token error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/etrade/production/access-token", async (req, res) => {
    try {
      const { requestToken, requestTokenSecret, verifier } = req.body;
      const { etradeProductionService } = await import('./auth/etradeProduction');
      
      const result = await etradeProductionService.getOAuthAccessToken(
        requestToken, 
        requestTokenSecret, 
        verifier
      );
      res.json(result);
    } catch (error: any) {
      console.error('E*TRADE production access token error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/etrade/production/accounts", async (req, res) => {
    try {
      const { accessToken, accessTokenSecret } = req.query;
      if (!accessToken || !accessTokenSecret) {
        return res.status(400).json({ message: "Access tokens required" });
      }
      
      const { etradeProductionService } = await import('./auth/etradeProduction');
      const accounts = await etradeProductionService.getAccountList(
        accessToken as string, 
        accessTokenSecret as string
      );
      res.json(accounts);
    } catch (error: any) {
      console.error('E*TRADE production accounts error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Account sync route
  app.post("/api/accounts/:id/sync", async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      console.log(`Syncing account ${accountId} (${account.provider})`);
      console.log(`Account connected: ${account.isConnected}`);
      console.log(`Has access token: ${!!account.accessToken}`);

      let result;
      switch (account.provider) {
        case 'etrade':
          result = await apiService.syncETradeAccount(accountId);
          break;
        default:
          return res.status(400).json({ message: `Sync not supported for provider: ${account.provider}` });
      }

      res.json(result);
    } catch (error: any) {
      console.error(`Sync error for account ${req.params.id}:`, error);
      res.status(500).json({ message: `Failed to sync account: ${error.message}` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
