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

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Holding = typeof holdings.$inferSelect;
export type InsertHolding = z.infer<typeof insertHoldingSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
