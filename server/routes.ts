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

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);
  return httpServer;
}
