import {
  mysqlTable,
  serial,
  varchar,
  text,
  int,
  boolean,
  json,
  timestamp,
} from "drizzle-orm/mysql-core";

// Daily AI-generated market briefs (Pipeline A)
export const briefs = mysqlTable("briefs", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 20 }).notNull(),
  marketSummary: text("market_summary").notNull(),
  sentiment: varchar("sentiment", { length: 20 }).notNull().default("mixed"),
  sentimentReason: text("sentiment_reason"),
  contentAngles: json("content_angles").$type<string[]>(),
  postX: text("post_x"),
  postLinkedin: text("post_linkedin"),
  postDiscord: text("post_discord"),
  blogIdea: varchar("blog_idea", { length: 512 }),
  seoKeywords: json("seo_keywords").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// AI-scored leads from the webhook intake (Pipeline B)
export const leads = mysqlTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  country: varchar("country", { length: 100 }),
  experience: varchar("experience", { length: 255 }),
  capital: varchar("capital", { length: 100 }),
  score: int("score").notNull().default(0),
  persona: varchar("persona", { length: 100 }),
  recommendedChallenge: varchar("recommended_challenge", { length: 100 }),
  reasoning: text("reasoning"),
  // Mini-CRM pipeline: new | contacted | qualified | won | lost
  status: varchar("status", { length: 20 }).notNull().default("new"),
  crmId: varchar("crm_id", { length: 100 }),
  crmSyncedAt: timestamp("crm_synced_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Social posts waiting for human approval (approval-before-publish)
export const posts = mysqlTable("posts", {
  id: serial("id").primaryKey(),
  briefId: int("brief_id"),
  platform: varchar("platform", { length: 20 }).notNull(),
  content: text("content").notNull(),
  // pending | approved | rejected
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  decidedBy: varchar("decided_by", { length: 100 }),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Competitor watch snapshots (one row per competitor per run)
export const competitors = mysqlTable("competitors", {
  id: serial("id").primaryKey(),
  domain: varchar("domain", { length: 255 }).notNull(),
  siteUp: boolean("site_up").notNull().default(true),
  trustpilotRating: varchar("trustpilot_rating", { length: 10 }),
  prevRating: varchar("prev_rating", { length: 10 }),
  offerSummary: text("offer_summary"),
  promoDetected: boolean("promo_detected").notNull().default(false),
  notes: text("notes"),
  changed: boolean("changed").notNull().default(false),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
});

// Hourly uptime / reputation checks (Pipeline C)
export const healthChecks = mysqlTable("health_checks", {
  id: serial("id").primaryKey(),
  siteUp: boolean("site_up").notNull(),
  statusCode: int("status_code").notNull().default(0),
  trustpilotRating: varchar("trustpilot_rating", { length: 10 }),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
});
