import { accounts, holdings, activities, type Account, type InsertAccount, type Holding, type InsertHolding, type Activity, type InsertActivity } from "@shared/schema";

export interface IStorage {
  // Account operations
  getAccounts(): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, updates: Partial<InsertAccount>): Promise<Account | undefined>;
  
  // Holding operations
  getHoldings(): Promise<Holding[]>;
  getHoldingsByAccount(accountId: number): Promise<Holding[]>;
  createHolding(holding: InsertHolding): Promise<Holding>;
  updateHolding(id: number, updates: Partial<InsertHolding>): Promise<Holding | undefined>;
  
  // Activity operations
  getActivities(): Promise<Activity[]>;
  getActivitiesByAccount(accountId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private accounts: Map<number, Account>;
  private holdings: Map<number, Holding>;
  private activities: Map<number, Activity>;
  private currentAccountId: number;
  private currentHoldingId: number;
  private currentActivityId: number;

  constructor() {
    this.accounts = new Map();
    this.holdings = new Map();
    this.activities = new Map();
    this.currentAccountId = 1;
    this.currentHoldingId = 1;
    this.currentActivityId = 1;

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
      lastSync: new Date() 
    };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
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
      timestamp: new Date() 
    };
    this.activities.set(id, newActivity);
    return newActivity;
  }
}

export const storage = new MemStorage();
