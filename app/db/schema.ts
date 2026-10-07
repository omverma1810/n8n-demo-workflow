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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Hourly uptime / reputation checks (Pipeline C)
export const healthChecks = mysqlTable("health_checks", {
  id: serial("id").primaryKey(),
  siteUp: boolean("site_up").notNull(),
  statusCode: int("status_code").notNull().default(0),
  trustpilotRating: varchar("trustpilot_rating", { length: 10 }),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
});
