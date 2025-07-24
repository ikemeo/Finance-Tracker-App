import { db } from "./db";
import { accounts, holdings, activities, realEstateInvestments, ventureInvestments } from "@shared/schema";

async function seed() {
  console.log("Seeding database with sample data...");

  // Create sample accounts
  const [etradeAccount] = await db.insert(accounts).values({
    name: "E*TRADE",
    provider: "etrade",
    accountType: "individual",
    balance: "524876.00",
    isConnected: true,
  }).returning();

  const [robinhoodAccount] = await db.insert(accounts).values({
    name: "Robinhood", 
    provider: "robinhood",
    accountType: "individual",
    balance: "186421.00",
    isConnected: true,
  }).returning();



  // Create sample holdings
  await db.insert(holdings).values([
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
  ]);

  // Create sample activities
  await db.insert(activities).values([
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

  ]);

  // Create sample real estate investments
  await db.insert(realEstateInvestments).values([
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
  ]);

  // Create sample venture investments
  await db.insert(ventureInvestments).values([
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
  ]);

  console.log("Database seeded successfully!");
}

seed().catch(console.error);