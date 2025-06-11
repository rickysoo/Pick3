import { pgTable, text, serial, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const searchRequests = pgTable("search_requests", {
  id: serial("id").primaryKey(),
  searchQuery: text("search_query").notNull(),
  results: json("results").$type<ComparisonResult[]>(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const insertSearchRequestSchema = createInsertSchema(searchRequests).omit({
  id: true,
  results: true,
  createdAt: true,
});

export type InsertSearchRequest = z.infer<typeof insertSearchRequestSchema>;
export type SearchRequest = typeof searchRequests.$inferSelect;

// Types for comparison results
export interface ComparisonResult {
  name: string;
  description: string;
  pricing: string;
  rating: number;
  website: string;
  features: Record<string, boolean | string>;
  badge?: string;
  badgeColor?: string;
}

export interface ComparisonResponse {
  products: ComparisonResult[];
  features: string[];
}
