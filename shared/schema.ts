import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(), // e.g., "etrade", "robinhood", "fidelity"
  accountType: text("account_type").notNull(), // e.g., "individual", "401k", "ira"
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull(),
  isConnected: boolean("is_connected").notNull().default(true),
  lastSync: timestamp("last_sync").defaultNow(),
  // Authentication fields
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  // Provider-specific fields
  accountIdKey: text("account_id_key"), // E*TRADE account key
  externalAccountId: text("external_account_id"), // Provider's account ID
});

export const holdings = pgTable("holdings", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  shares: decimal("shares", { precision: 12, scale: 4 }).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  totalValue: decimal("total_value", { precision: 12, scale: 2 }).notNull(),
  category: text("category").notNull(), // "stocks", "etfs", "crypto", "bonds", "cash"
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }).notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  type: text("type").notNull(), // "buy", "sell", "sync", "error"
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  symbol: text("symbol"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const realEstateInvestments = pgTable("real_estate_investments", {
  id: serial("id").primaryKey(),
  propertyName: text("property_name").notNull(),
  propertyType: text("property_type").notNull(), // "residential", "commercial", "industrial", "land"
  address: text("address").notNull(),
  investmentDate: timestamp("investment_date").notNull(),
  initialInvestment: decimal("initial_investment", { precision: 12, scale: 2 }).notNull(),
  currentValue: decimal("current_value", { precision: 12, scale: 2 }).notNull(),
  loanAmount: decimal("loan_amount", { precision: 12, scale: 2 }).default("0"),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }),
  loanTerm: integer("loan_term"), // in months
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }),
  monthlyPayment: decimal("monthly_payment", { precision: 10, scale: 2 }),
  totalReturns: decimal("total_returns", { precision: 12, scale: 2 }).default("0"),
  notes: text("notes"),
});

export const ventureInvestments = pgTable("venture_investments", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  sector: text("sector").notNull(), // "tech", "healthcare", "fintech", "biotech", etc.
  stage: text("stage").notNull(), // "pre-seed", "seed", "series-a", "series-b", etc.
  investmentDate: timestamp("investment_date").notNull(),
  investmentAmount: decimal("investment_amount", { precision: 12, scale: 2 }).notNull(),
  currentValuation: decimal("current_valuation", { precision: 12, scale: 2 }),
  ownershipPercentage: decimal("ownership_percentage", { precision: 5, scale: 2 }).default("0"),
  leadInvestor: text("lead_investor"),
  exitDate: timestamp("exit_date"),
  exitAmount: decimal("exit_amount", { precision: 12, scale: 2 }),
  status: text("status").notNull().default("active"), // "active", "exited", "written-off"
  notes: text("notes"),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  lastSync: true,
});

export const insertHoldingSchema = createInsertSchema(holdings).omit({
  id: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export const insertRealEstateSchema = createInsertSchema(realEstateInvestments).omit({
  id: true,
});

export const insertVentureSchema = createInsertSchema(ventureInvestments).omit({
  id: true,
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Holding = typeof holdings.$inferSelect;
export type InsertHolding = z.infer<typeof insertHoldingSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type RealEstateInvestment = typeof realEstateInvestments.$inferSelect;
export type InsertRealEstate = z.infer<typeof insertRealEstateSchema>;
export type VentureInvestment = typeof ventureInvestments.$inferSelect;
export type InsertVenture = z.infer<typeof insertVentureSchema>;
