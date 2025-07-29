import { 
  accounts, 
  holdings, 
  activities, 
  realEstateInvestments,
  ventureInvestments,
  type Account, 
  type InsertAccount, 
  type Holding, 
  type InsertHolding, 
  type Activity, 
  type InsertActivity,
  type RealEstateInvestment,
  type InsertRealEstate,
  type VentureInvestment,
  type InsertVenture
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Account operations
  getAccounts(): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, updates: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<void>;
  
  // Holding operations
  getHoldings(): Promise<Holding[]>;
  getHoldingsByAccount(accountId: number): Promise<Holding[]>;
  createHolding(holding: InsertHolding): Promise<Holding>;
  updateHolding(id: number, updates: Partial<InsertHolding>): Promise<Holding | undefined>;
  deleteHolding(id: number): Promise<void>;
  
  // Activity operations
  getActivities(): Promise<Activity[]>;
  getActivitiesByAccount(accountId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  deleteActivity(id: number): Promise<void>;
  
  // Real Estate operations
  getRealEstateInvestments(): Promise<RealEstateInvestment[]>;
  getRealEstateInvestment(id: number): Promise<RealEstateInvestment | undefined>;
  createRealEstateInvestment(investment: InsertRealEstate): Promise<RealEstateInvestment>;
  updateRealEstateInvestment(id: number, updates: Partial<InsertRealEstate>): Promise<RealEstateInvestment | undefined>;
  deleteRealEstateInvestment(id: number): Promise<boolean>;
  
  // Venture operations
  getVentureInvestments(): Promise<VentureInvestment[]>;
  getVentureInvestment(id: number): Promise<VentureInvestment | undefined>;
  createVentureInvestment(investment: InsertVenture): Promise<VentureInvestment>;
  updateVentureInvestment(id: number, updates: Partial<InsertVenture>): Promise<VentureInvestment | undefined>;
  deleteVentureInvestment(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private accounts: Map<number, Account>;
  private holdings: Map<number, Holding>;
  private activities: Map<number, Activity>;
  private realEstateInvestments: Map<number, RealEstateInvestment>;
  private ventureInvestments: Map<number, VentureInvestment>;
  private currentAccountId: number;
  private currentHoldingId: number;
  private currentActivityId: number;
  private currentRealEstateId: number;
  private currentVentureId: number;

  constructor() {
    this.accounts = new Map();
    this.holdings = new Map();
    this.activities = new Map();
    this.realEstateInvestments = new Map();
    this.ventureInvestments = new Map();
    this.currentAccountId = 1;
    this.currentHoldingId = 1;
    this.currentActivityId = 1;
    this.currentRealEstateId = 1;
    this.currentVentureId = 1;

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample accounts
    const etradeAccount: Account = {
      id: this.currentAccountId++,
      name: "E*TRADE",
      provider: "etrade",
      accountType: "individual",
      balance: "524876.00",
      isConnected: true,
      lastSync: new Date(),
    };
    this.accounts.set(etradeAccount.id, etradeAccount);

    const robinhoodAccount: Account = {
      id: this.currentAccountId++,
      name: "Robinhood",
      provider: "robinhood",
      accountType: "individual",
      balance: "186421.00",
      isConnected: true,
      lastSync: new Date(),
    };
    this.accounts.set(robinhoodAccount.id, robinhoodAccount);

    const fidelityAccount: Account = {
      id: this.currentAccountId++,
      name: "Fidelity",
      provider: "fidelity",
      accountType: "401k",
      balance: "135996.00",
      isConnected: false,
      lastSync: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    };
    this.accounts.set(fidelityAccount.id, fidelityAccount);

    // Create sample holdings
    const sampleHoldings: Omit<Holding, 'id'>[] = [
      {
        accountId: etradeAccount.id,
        symbol: "AAPL",
        name: "Apple Inc.",
        shares: "154.0000",
        currentPrice: "185.20",
        totalValue: "28547.00",
        category: "stocks",
        changePercent: "2.40",
      },
      {
        accountId: etradeAccount.id,
        symbol: "TSLA",
        name: "Tesla Inc.",
        shares: "89.0000",
        currentPrice: "239.70",
        totalValue: "21334.00",
        category: "stocks",
        changePercent: "-1.20",
      },
      {
        accountId: robinhoodAccount.id,
        symbol: "SPY",
        name: "SPDR S&P 500",
        shares: "45.0000",
        currentPrice: "441.69",
        totalValue: "19876.00",
        category: "etfs",
        changePercent: "0.80",
      },
      {
        accountId: robinhoodAccount.id,
        symbol: "BTC",
        name: "Bitcoin",
        shares: "0.4500",
        currentPrice: "40520.00",
        totalValue: "18234.00",
        category: "crypto",
        changePercent: "-4.10",
      },
    ];

    sampleHoldings.forEach(holding => {
      const newHolding: Holding = { ...holding, id: this.currentHoldingId++ };
      this.holdings.set(newHolding.id, newHolding);
    });

    // Create sample activities
    const sampleActivities: Omit<Activity, 'id' | 'timestamp'>[] = [
      {
        accountId: etradeAccount.id,
        type: "buy",
        description: "Purchased 10 shares of AAPL at $185.20",
        amount: "1852.00",
        symbol: "AAPL",
      },
      {
        accountId: etradeAccount.id,
        type: "sync",
        description: "E*TRADE account successfully updated",
        amount: null,
        symbol: null,
      },
      {
        accountId: robinhoodAccount.id,
        type: "sell",
        description: "Sold 25 shares of MSFT at $378.45",
        amount: "9461.00",
        symbol: "MSFT",
      },
      {
        accountId: fidelityAccount.id,
        type: "error",
        description: "Fidelity API temporarily unavailable",
        amount: null,
        symbol: null,
      },
    ];

    sampleActivities.forEach((activity, index) => {
      const newActivity: Activity = { 
        ...activity, 
        id: this.currentActivityId++, 
        timestamp: new Date(Date.now() - index * 2 * 60 * 60 * 1000) // Spread activities over time
      };
      this.activities.set(newActivity.id, newActivity);
    });

    // Create sample real estate investments
    const sampleRealEstate: Omit<RealEstateInvestment, 'id'>[] = [
      {
        propertyName: "Downtown Condo",
        propertyType: "residential",
        address: "123 Main St, San Francisco, CA 94105",
        investmentDate: new Date('2022-03-15'),
        initialInvestment: "650000.00",
        currentValue: "720000.00",
        loanAmount: "520000.00",
        interestRate: "3.25",
        loanTerm: 360,
        monthlyRent: "4200.00",
        monthlyPayment: "2260.00",
        totalReturns: "23280.00",
        notes: "Prime location, high rental demand"
      },
      {
        propertyName: "Commercial Plaza",
        propertyType: "commercial",
        address: "456 Business Blvd, Austin, TX 78701",
        investmentDate: new Date('2021-08-10'),
        initialInvestment: "1200000.00",
        currentValue: "1380000.00",
        loanAmount: "900000.00",
        interestRate: "4.15",
        loanTerm: 300,
        monthlyRent: "8500.00",
        monthlyPayment: "4420.00",
        totalReturns: "49080.00",
        notes: "Multi-tenant retail space"
      }
    ];

    sampleRealEstate.forEach(realEstate => {
      const newRealEstate: RealEstateInvestment = { ...realEstate, id: this.currentRealEstateId++ };
      this.realEstateInvestments.set(newRealEstate.id, newRealEstate);
    });

    // Create sample venture investments
    const sampleVenture: Omit<VentureInvestment, 'id'>[] = [
      {
        companyName: "TechStart AI",
        sector: "artificial-intelligence",
        stage: "seed",
        investmentDate: new Date('2023-01-20'),
        investmentAmount: "50000.00",
        currentValuation: "5000000.00",
        ownershipPercentage: "1.25",
        leadInvestor: "Andreessen Horowitz",
        exitDate: null,
        exitAmount: null,
        status: "active",
        notes: "AI-powered customer service platform"
      },
      {
        companyName: "FinFlow",
        sector: "fintech",
        stage: "series-a",
        investmentDate: new Date('2022-06-15'),
        investmentAmount: "25000.00",
        currentValuation: "15000000.00",
        ownershipPercentage: "0.33",
        leadInvestor: "Sequoia Capital",
        exitDate: null,
        exitAmount: null,
        status: "active",
        notes: "B2B payment processing solutions"
      },
      {
        companyName: "HealthTrack",
        sector: "healthcare",
        stage: "pre-seed",
        investmentDate: new Date('2021-11-05'),
        investmentAmount: "15000.00",
        currentValuation: "2000000.00",
        ownershipPercentage: "1.50",
        leadInvestor: "Y Combinator",
        exitDate: new Date('2024-01-15'),
        exitAmount: "45000.00",
        status: "exited",
        notes: "Wearable health monitoring - acquired by Apple"
      }
    ];

    sampleVenture.forEach(venture => {
      const newVenture: VentureInvestment = { ...venture, id: this.currentVentureId++ };
      this.ventureInvestments.set(newVenture.id, newVenture);
    });
  }

  async getAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }

  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const id = this.currentAccountId++;
    const newAccount: Account = { 
      ...account, 
      id, 
      lastSync: new Date() 
    };
    this.accounts.set(id, newAccount);
    return newAccount;
  }

  async updateAccount(id: number, updates: Partial<InsertAccount>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;
    
    const updatedAccount: Account = { 
      ...account, 
      ...updates, 
      lastSync: new Date(),
      isConnected: updates.isConnected ?? account.isConnected
    };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<void> {
    this.accounts.delete(id);
  }

  async getHoldings(): Promise<Holding[]> {
    return Array.from(this.holdings.values());
  }

  async getHoldingsByAccount(accountId: number): Promise<Holding[]> {
    return Array.from(this.holdings.values()).filter(h => h.accountId === accountId);
  }

  async createHolding(holding: InsertHolding): Promise<Holding> {
    const id = this.currentHoldingId++;
    const newHolding: Holding = { ...holding, id };
    this.holdings.set(id, newHolding);
    return newHolding;
  }

  async updateHolding(id: number, updates: Partial<InsertHolding>): Promise<Holding | undefined> {
    const holding = this.holdings.get(id);
    if (!holding) return undefined;
    
    const updatedHolding: Holding = { ...holding, ...updates };
    this.holdings.set(id, updatedHolding);
    return updatedHolding;
  }

  async deleteHolding(id: number): Promise<void> {
    this.holdings.delete(id);
  }

  async deleteActivity(id: number): Promise<void> {
    this.activities.delete(id);
  }

  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values()).sort((a, b) => 
      new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
    );
  }

  async getActivitiesByAccount(accountId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(a => a.accountId === accountId)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const newActivity: Activity = { 
      ...activity, 
      id, 
      timestamp: new Date(),
      symbol: activity.symbol ?? null
    };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  // Real Estate Investment methods
  async getRealEstateInvestments(): Promise<RealEstateInvestment[]> {
    return Array.from(this.realEstateInvestments.values());
  }

  async getRealEstateInvestment(id: number): Promise<RealEstateInvestment | undefined> {
    return this.realEstateInvestments.get(id);
  }

  async createRealEstateInvestment(investment: InsertRealEstate): Promise<RealEstateInvestment> {
    const id = this.currentRealEstateId++;
    const newInvestment: RealEstateInvestment = { ...investment, id };
    this.realEstateInvestments.set(id, newInvestment);
    return newInvestment;
  }

  async updateRealEstateInvestment(id: number, updates: Partial<InsertRealEstate>): Promise<RealEstateInvestment | undefined> {
    const investment = this.realEstateInvestments.get(id);
    if (!investment) return undefined;
    
    const updatedInvestment: RealEstateInvestment = { ...investment, ...updates };
    this.realEstateInvestments.set(id, updatedInvestment);
    return updatedInvestment;
  }

  async deleteRealEstateInvestment(id: number): Promise<boolean> {
    return this.realEstateInvestments.delete(id);
  }

  // Venture Investment methods
  async getVentureInvestments(): Promise<VentureInvestment[]> {
    return Array.from(this.ventureInvestments.values());
  }

  async getVentureInvestment(id: number): Promise<VentureInvestment | undefined> {
    return this.ventureInvestments.get(id);
  }

  async createVentureInvestment(investment: InsertVenture): Promise<VentureInvestment> {
    const id = this.currentVentureId++;
    const newInvestment: VentureInvestment = { ...investment, id };
    this.ventureInvestments.set(id, newInvestment);
    return newInvestment;
  }

  async updateVentureInvestment(id: number, updates: Partial<InsertVenture>): Promise<VentureInvestment | undefined> {
    const investment = this.ventureInvestments.get(id);
    if (!investment) return undefined;
    
    const updatedInvestment: VentureInvestment = { ...investment, ...updates };
    this.ventureInvestments.set(id, updatedInvestment);
    return updatedInvestment;
  }

  async deleteVentureInvestment(id: number): Promise<boolean> {
    return this.ventureInvestments.delete(id);
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // Account operations
  async getAccounts(): Promise<Account[]> {
    return await db.select().from(accounts);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [newAccount] = await db
      .insert(accounts)
      .values(account)
      .returning();
    return newAccount;
  }

  async updateAccount(id: number, updates: Partial<InsertAccount>): Promise<Account | undefined> {
    const [updatedAccount] = await db
      .update(accounts)
      .set({ ...updates, lastSync: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return updatedAccount || undefined;
  }

  // Holdings operations
  async getHoldings(): Promise<Holding[]> {
    return await db.select().from(holdings);
  }

  async getHoldingsByAccount(accountId: number): Promise<Holding[]> {
    return await db.select().from(holdings).where(eq(holdings.accountId, accountId));
  }

  async createHolding(holding: InsertHolding): Promise<Holding> {
    const [newHolding] = await db
      .insert(holdings)
      .values(holding)
      .returning();
    return newHolding;
  }

  async updateHolding(id: number, updates: Partial<InsertHolding>): Promise<Holding | undefined> {
    const [updatedHolding] = await db
      .update(holdings)
      .set(updates)
      .where(eq(holdings.id, id))
      .returning();
    return updatedHolding || undefined;
  }

  async deleteAccount(id: number): Promise<void> {
    await db.delete(accounts).where(eq(accounts.id, id));
  }

  async deleteHolding(id: number): Promise<void> {
    await db.delete(holdings).where(eq(holdings.id, id));
  }

  async deleteActivity(id: number): Promise<void> {
    await db.delete(activities).where(eq(activities.id, id));
  }

  // Activities operations
  async getActivities(): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(activities.timestamp);
  }

  async getActivitiesByAccount(accountId: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.accountId, accountId))
      .orderBy(activities.timestamp);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values(activity)
      .returning();
    return newActivity;
  }

  // Real Estate Investment operations
  async getRealEstateInvestments(): Promise<RealEstateInvestment[]> {
    return await db.select().from(realEstateInvestments);
  }

  async getRealEstateInvestment(id: number): Promise<RealEstateInvestment | undefined> {
    const [investment] = await db
      .select()
      .from(realEstateInvestments)
      .where(eq(realEstateInvestments.id, id));
    return investment || undefined;
  }

  async createRealEstateInvestment(investment: InsertRealEstate): Promise<RealEstateInvestment> {
    const [newInvestment] = await db
      .insert(realEstateInvestments)
      .values(investment)
      .returning();
    return newInvestment;
  }

  async updateRealEstateInvestment(id: number, updates: Partial<InsertRealEstate>): Promise<RealEstateInvestment | undefined> {
    const [updatedInvestment] = await db
      .update(realEstateInvestments)
      .set(updates)
      .where(eq(realEstateInvestments.id, id))
      .returning();
    return updatedInvestment || undefined;
  }

  async deleteRealEstateInvestment(id: number): Promise<boolean> {
    const result = await db
      .delete(realEstateInvestments)
      .where(eq(realEstateInvestments.id, id));
    return result.rowCount > 0;
  }

  // Venture Investment operations
  async getVentureInvestments(): Promise<VentureInvestment[]> {
    return await db.select().from(ventureInvestments);
  }

  async getVentureInvestment(id: number): Promise<VentureInvestment | undefined> {
    const [investment] = await db
      .select()
      .from(ventureInvestments)
      .where(eq(ventureInvestments.id, id));
    return investment || undefined;
  }

  async createVentureInvestment(investment: InsertVenture): Promise<VentureInvestment> {
    const [newInvestment] = await db
      .insert(ventureInvestments)
      .values(investment)
      .returning();
    return newInvestment;
  }

  async updateVentureInvestment(id: number, updates: Partial<InsertVenture>): Promise<VentureInvestment | undefined> {
    const [updatedInvestment] = await db
      .update(ventureInvestments)
      .set(updates)
      .where(eq(ventureInvestments.id, id))
      .returning();
    return updatedInvestment || undefined;
  }

  async deleteVentureInvestment(id: number): Promise<boolean> {
    const result = await db
      .delete(ventureInvestments)
      .where(eq(ventureInvestments.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
